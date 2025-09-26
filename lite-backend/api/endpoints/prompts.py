"""
提示词预览与占位注入接口
"""
from typing import Any, Dict, Optional
from fastapi import APIRouter, Body, HTTPException, WebSocket, WebSocketDisconnect
import os
import httpx

from service.workflows.tool_orchestration import _render_prompt

router = APIRouter(prefix="/prompts", tags=["提示词"])


def _compose_knowledge_preview(results: list, top_n: int = 6) -> str:
    snippets = []
    for r in (results or [])[:top_n]:
        try:
            title = (getattr(r, 'title', None) or r.source.get('title') if hasattr(r, 'source') else '') or ''
            content = getattr(r, 'content', None) or (r.source.get('content') if hasattr(r, 'source') else '')
        except Exception:
            title, content = '', ''
        if title:
            snippets.append(f"【{title}】\n{str(content)[:500]}")
        else:
            snippets.append(str(content)[:500])
    return "\n\n".join(snippets)


@router.post("/render-preview")
async def render_preview(payload: Dict[str, Any] = Body(...)):
    """
    预览提示词渲染结果（不调用大模型，仅拼装文本）。
    请求体：{
      prompt_text: str,           # 用户软性提示词（纯文本）
      question: str,             # 当前问题（可选）
      selected_tools: [str],
      resources: { knowledge_collection?: {collection_id}, cross_collections?: [id, ...] },
      top_n: int,                # 预览检索条数（默认6）
      sim_threshold: float       # 过滤阈值（0-1，可选）
    }
    返回：{
      final_prompt: str,
      injections: { knowledge_preview: str, tools_exec_preview: str }
    }
    """
    try:
        prompt_text: str = payload.get("prompt_text") or ""
        question: str = payload.get("question") or ""
        selected_tools = payload.get("selected_tools") or []
        resources = payload.get("resources") or {}
        # 预览接口禁用检索与翻译，避免触发向量/翻译模型调用
        # 仅做规则渲染与结构占位展示

        # 构建占位（knowledge/tools_exec）
        knowledge_text = ""
        tools_exec_text = ""

        # 工具清单（预览）
        if selected_tools:
            tools_exec_text = "已启用工具（可能按需调用）：\n" + "\n".join([f"- {t}" for t in selected_tools])

        # 知识预览（轻量检索）
        kb = (resources.get("knowledge_collection") or {}).get("collection_id")
        # 预览不做实际检索，给出占位说明以避免触发 Embedding/翻译
        if kb:
            knowledge_text = "（预览）将自动注入与问题相关的知识片段摘要。"

        placeholders = {
            "knowledge": knowledge_text,
            "tools_exec": tools_exec_text,
            "meta": "",
        }
        require_knowledge = bool(kb)
        auto_tools = bool(selected_tools)

        final_prompt = _render_prompt(
            user_text=prompt_text,
            placeholders=placeholders,
            require_knowledge=require_knowledge,
            auto_tools=auto_tools,
            question=question,
        )

        return {
            "final_prompt": final_prompt,
            "injections": {
                "knowledge_preview": knowledge_text,
                "tools_exec_preview": tools_exec_text,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"预览渲染失败: {str(e)}")


def _build_generator_prompt(scenario: str, keywords: str, has_kb: bool, tools: list[str]) -> str:
    kb_line = "已绑定知识库：是" if has_kb else "已绑定知识库：否"
    tools_line = "启用工具：" + (", ".join(tools) if tools else "无")
    return (
        "你是一名提示词工程专家，请为一个智能体生成系统提示词（仅纯文本）。\n"
        "要求：\n"
        "- 语气专业、明确，包含角色定位、能力边界与安全约束。\n"
        "- 如已绑定知识库，请要求优先引用知识上下文（由系统自动注入），避免杜撰。\n"
        "- 如启用了工具，请提示可能的工具使用范围（由系统自动注入工具摘要）。\n"
        "- 合理长度（300-800字），适合作为系统提示。\n\n"
        f"使用场景：{scenario or '（未提供）'}\n"
        f"基础功能关键词：{keywords or '（未提供）'}\n"
        f"{kb_line}\n"
        f"{tools_line}\n\n"
        "输出：直接给出系统提示词正文，不要附加解释。"
    )


async def _call_default_llm_chat(prompt: str) -> str:
    base = os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050').rstrip('/')
    # 获取默认聊天模型
    try:
        async with httpx.AsyncClient(timeout=10.0) as hc:
            r = await hc.get(f"{base}/v1/defaults/simple")
            if r.status_code == 200:
                j = r.json()
                model = ((j.get('chat') or {}).get('model')) or ''
            else:
                model = ''
    except Exception:
        model = ''
    if not model:
        # 兜底指定一个通用模型名（由 9050 侧解析），避免空值
        model = 'gpt-4o-mini'
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 800
    }
    async with httpx.AsyncClient(timeout=60.0) as hc:
        r = await hc.post(f"{base}/v1/chat/completions", json=payload)
        r.raise_for_status()
        j = r.json()
        return (j.get('choices') or [{}])[0].get('message', {}).get('content', '') or ''


@router.post("/auto-generate")
async def auto_generate(payload: Dict[str, Any] = Body(...)):
    """
    基于默认 LLM 自动生成系统提示词（非流式）。
    请求：{ scenario, keywords, selected_tools, resources }
    返回：{ text }
    """
    try:
        scenario = (payload.get('scenario') or '').strip()
        keywords = (payload.get('keywords') or '').strip()
        tools = payload.get('selected_tools') or []
        resources = payload.get('resources') or {}
        has_kb = bool((resources.get('knowledge_collection') or {}).get('collection_id'))
        prompt = _build_generator_prompt(scenario, keywords, has_kb, tools)
        text = await _call_default_llm_chat(prompt)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"自动生成失败: {str(e)}")


@router.websocket("/ws/auto-generate")
async def ws_auto_generate(ws: WebSocket):
    """基于默认 LLM 的自动生成（WebSocket 简化版：一次请求返回一条生成结果）。"""
    await ws.accept()
    try:
        data = await ws.receive_json()
        scenario = (data.get('scenario') or '').strip()
        keywords = (data.get('keywords') or '').strip()
        tools = data.get('selected_tools') or []
        resources = data.get('resources') or {}
        has_kb = bool((resources.get('knowledge_collection') or {}).get('collection_id'))
        prompt = _build_generator_prompt(scenario, keywords, has_kb, tools)
        text = await _call_default_llm_chat(prompt)
        await ws.send_text(text or '')
    except WebSocketDisconnect:
        return
    except Exception as e:
        await ws.send_text(f"[error] {str(e)}")
    finally:
        try:
            await ws.close()
        except Exception:
            pass
