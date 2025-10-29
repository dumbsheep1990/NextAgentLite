from typing import List, Optional, Any, Tuple

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.logger import logger
from service.agent_service_v2 import get_agent_service_v2
from service.tools_registry import get_tool_registry
from service.agent_template_service import agent_template_service
import os
import json
import httpx
import logging
import re


router = APIRouter(prefix="/agents", tags=["Agent工具测试"])


class ToolsTestRequest(BaseModel):
    agent_name: Optional[str] = "tools_tester"
    prompt: str
    selected_tools: List[str] = []  # e.g. ["mcp:playwright:click", "api:apitest:api-test"]
    model: Optional[str] = None
    provider: Optional[str] = None
    # 执行模式：auto（默认，走 Agno Agent），manual_react（回退手写 ReAct 直接调用 MCP）
    mode: Optional[str] = "auto"


@router.post("/tools-test")
async def tools_test(req: ToolsTestRequest) -> Any:
    # 捕获执行期日志，便于前端展示
    class _ListHandler(logging.Handler):
        def __init__(self):
            super().__init__()
            self.lines = []
            self.setFormatter(logging.Formatter('%(message)s'))
        def emit(self, record: logging.LogRecord) -> None:
            try:
                msg = self.format(record)
                self.lines.append(f"[{record.levelname}] {record.name}: {msg}")
            except Exception:
                pass

    handler = _ListHandler()
    root_logger = logging.getLogger()
    agno_logger = logging.getLogger('agno')
    old_agno_level = agno_logger.level
    agno_logger.setLevel(logging.INFO)
    root_logger.addHandler(handler)

    try:
        # 如果指定回退模式，则绕过 Agno，直接执行手写 ReAct（本地工具调用）
        if (req.mode or "auto").lower() == "manual_react":
            manual = await _manual_local_tool_run(req.prompt, req.selected_tools or [])
            final_out = manual.get("final_answer") or (manual.get("rounds") or [{}])[-1].get("response") or ""
            return {
                "ok": True,
                "mode": "manual_react",
                "output": final_out,
                "manual_run": manual,
            }

        # 确保存在一个临时的智能体模板（基于模板系统）
        code = req.agent_name or "tools_tester"
        tpl = await agent_template_service.get_template_by_code(code)
        if not tpl:
            base_cfg = {
                "role": "工具测试智能体",
                "instructions": [
                    "你是一个用于验证工具接入与调用链路的临时智能体。",
                    "请根据用户指令合理选择可用的工具执行，输出结果。"
                ]
            }
            model_cfg = {
                # 具体模型将由统一模型网关覆盖，此处保底
                "model_id": None,
                "model_provider": None
            }
            tools_cfg = {}
            await agent_template_service.create_template({
                "template_code": code,
                "template_name": "工具导入测试",
                "template_type": "single",
                "category": "testing",
                "description": "用于校验 MCP/API 工具注册与调用的临时模板",
                "icon": "ToolOutlined",
                "color": "#13c2c2",
                "base_config": base_cfg,
                "model_config": model_cfg,
                "tools_config": tools_cfg,
                "is_system": False,
                "is_active": True,
            })

        service = await get_agent_service_v2()
        agent = await service.create_agent_v2(
            agent_name=req.agent_name,
            selected_tools=req.selected_tools,
            model_name=req.model,
            model_provider=req.provider,
        )
        if agent is None:
            raise HTTPException(status_code=500, detail="Failed to create agent")

        # 统一执行一次
        try:
            result = await agent.run(req.prompt)  # type: ignore
        except AttributeError:
            # 某些版本可能是 agent.chat / agent.call
            if hasattr(agent, "chat"):
                result = await agent.chat(req.prompt)  # type: ignore
            else:
                raise

        # 尝试规范化结果
        out = result
        if hasattr(result, "content"):
            out = getattr(result, "content")
        elif isinstance(result, dict) and "content" in result:
            out = result["content"]

        # 调试信息
        agent_model_id = getattr(getattr(agent, 'model', None), 'id', None)
        debug_logs = "\n".join(handler.lines)

        return {
            "ok": True,
            "agent": req.agent_name,
            "selected_tools": req.selected_tools,
            "output": out,
            "debug_logs": debug_logs,
            "agent_meta": {"model_id": agent_model_id, "selected_tools": req.selected_tools},
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Agent tools test failed")
        # 附加网关探针，帮助定位 Unknown model error 等问题
        probe = await _probe_llm_gateway(req.model)
        # 额外检测：上游是否支持 OpenAI 工具调用参数（tools/tool_choice）
        tool_probe = await _probe_tool_call_support(probe.get('defaults_simple_body', {}))
        tools_dbg = await _collect_tools_debug(req.selected_tools or [])
        manual = await _manual_local_tool_run(req.prompt, req.selected_tools or [])
        detail = {
            "error": str(e),
            "gateway_probe": probe,
            "tool_call_probe": tool_probe,
            "tools_debug": tools_dbg,
            "debug_logs": "\n".join(handler.lines),
            "manual_run": manual,
        }
        # 以字符串返回，避免前端 JSON 渲染问题
        raise HTTPException(status_code=500, detail=json.dumps(detail, ensure_ascii=False))
    finally:
        try:
            root_logger.removeHandler(handler)
            agno_logger.setLevel(old_agno_level)
        except Exception:
            pass


async def _probe_llm_gateway(prefer_model: Optional[str]) -> dict:
    """简单探针：
    - 获取默认模型
    - 尝试对 9050 /v1/chat/completions 发起一条最小请求
    仅用于错误时的诊断，不影响主流程。
    """
    # 强制走 9050（LLM_GATEWAY_URL），避免误连上游导致未带上游API Key
    base = f"{os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050').rstrip('/')}/v1"
    base = base.rstrip("/")
    info = {"base": base}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # 1) 默认模型
            r = await client.get(base.replace("/v1", "") + "/v1/defaults/simple")
            info["defaults_simple_status"] = r.status_code
            try:
                info["defaults_simple_body"] = r.json()
            except Exception:
                info["defaults_simple_body"] = r.text

            model_name = prefer_model
            if not model_name:
                if r.status_code == 200 and isinstance(info["defaults_simple_body"], dict):
                    chat = info["defaults_simple_body"].get("chat") or {}
                    model_name = chat.get("model")

            # 2) 最小 Chat 请求
            if model_name:
                payload = {
                    "model": model_name,
                    "messages": [{"role": "user", "content": "hello"}],
                    "max_tokens": 8,
                }
                r2 = await client.post(base + "/chat/completions", json=payload)
                info["chat_status"] = r2.status_code
                # 尽量返回上游的原始错误体，帮助判断 403/404/配置错误
                try:
                    info["chat_body"] = r2.json()
                except Exception:
                    info["chat_body"] = r2.text
            else:
                info["chat_status"] = None
                info["chat_body"] = "no model available"
    except Exception as ex:
        info["probe_error"] = str(ex)
    return info


async def _collect_tools_debug(selected: list) -> dict:
    """采集工具注册中心的快照信息，辅助排障。"""
    out: dict = {"selected": selected}
    try:
        reg = await get_tool_registry()
        all_tools = await reg.list_all_tools()
        out["available"] = all_tools
    except Exception as ex:
        out["error"] = str(ex)
    return out


async def _probe_tool_call_support(defaults_simple: dict) -> dict:
    """探测上游是否支持 OpenAI 工具调用参数。
    发送一个最小化 tools+tool_choice=auto 的请求，看是否 200。
    """
    base = f"{os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050').rstrip('/')}/v1"
    model_name = None
    try:
        chat = (defaults_simple or {}).get('chat') or {}
        model_name = chat.get('model')
    except Exception:
        pass
    if not model_name:
        return {"skipped": True, "reason": "no default model"}
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": "test tools"}],
        "tools": [
            {
                "type": "function",
                "function": {
                    "name": "test_tool",
                    "description": "noop",
                    "parameters": {"type": "object", "properties": {"foo": {"type": "string"}}, "required": []}
                }
            }
        ],
        "tool_choice": "auto",
        "max_tokens": 8
    }
    out = {"base": base, "model": model_name}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(base + "/chat/completions", json=payload)
            out["status"] = r.status_code
            try:
                out["body"] = r.json()
            except Exception:
                out["body"] = await r.aread()
    except Exception as ex:
        out["error"] = str(ex)
    return out


def _infer_mcp_server(selected: list) -> str | None:
    servers = []
    for s in selected:
        if isinstance(s, str) and s.startswith('mcp:'):
            parts = s.split(':')
            if len(parts) >= 2 and parts[1]:
                servers.append(parts[1])
    return servers[0] if servers else None


async def _manual_local_tool_run(prompt: str, selected: list) -> dict:
    base = f"{os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050').rstrip('/')}/v1"
    server = _infer_mcp_server(selected)
    out: dict = {"base": base, "server": server, "rounds": []}
    if not server:
        out["skipped"] = True
        out["reason"] = "no mcp server selected"
        return out
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # 获取该服务器下可用工具名，放入提示
            tools_url = base.replace('/v1','') + f"/mcp/servers/{server}/tools"
            try:
                tr = await client.get(tools_url)
                tool_list = tr.json() if tr.status_code == 200 else []
            except Exception:
                tool_list = []
            tool_names = [str(t.get('name')) for t in tool_list if isinstance(t, dict) and t.get('name')]
            tools_line = "、".join(tool_names[:20]) or "browser_navigate、browser_wait_for、browser_type、browser_press_key、browser_take_screenshot"

            sys_prompt = (
                "你可以调用本地浏览器MCP工具完成任务。严格使用下列格式表达工具调用意图（只输出两行，不要夹杂其他文字）：\n"
                "Action: <工具名>\nAction Input: <JSON参数>\n"
                f"可用工具：{tools_line}。\n"
                "语言要求：仅用中文回复。若需要最终答案，请以 'Final Answer:' 开头给出结论。"
            )
            messages = [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": prompt},
            ]
            for step in range(3):
                r = await client.post(base + "/chat/completions", json={
                    "messages": messages,
                    "max_tokens": 512,
                })
                try:
                    body = r.json()
                except Exception:
                    body = {"text": await r.aread()}
                content = ''
                try:
                    content = body.get('choices',[{}])[0].get('message',{}).get('content','')
                except Exception:
                    content = ''
                round_rec = {"request": messages[-1], "response": content}

                m_final = re.search(r"Final Answer\s*:\s*(.*)$", content, re.IGNORECASE|re.DOTALL)
                if m_final:
                    out["rounds"].append(round_rec)
                    out["final_answer"] = m_final.group(1).strip()
                    break

                m_action = re.search(r"Action\s*:\s*([\w_\-:]+)", content, re.IGNORECASE)
                m_input = re.search(r"Action Input\s*:\s*(\{[\s\S]*\})", content, re.IGNORECASE)
                if not m_action or not m_input:
                    # 首轮未解析到 Action，则再强提示一次仅输出两行
                    if step == 0:
                        out["rounds"].append({**round_rec, "note": "no action parsed; reinforce instruction"})
                        messages.append({"role": "assistant", "content": content or ""})
                        messages.append({"role": "user", "content": "请只输出两行：\nAction: <工具名>\nAction Input: <JSON参数>"})
                        continue
                    out["rounds"].append({**round_rec, "note": "no action parsed"})
                    break
                tool_name = m_action.group(1).strip()
                args_json = m_input.group(1)
                try:
                    args = json.loads(args_json)
                except Exception as ex:
                    out["rounds"].append({**round_rec, "note": f"parse args failed: {ex}"})
                    break

                # 调用 MCP 工具
                t_url = base.replace('/v1','') + f"/mcp/servers/{server}/tools/{tool_name}/call"
                tr = await client.post(t_url, json=args)
                try:
                    tobj = tr.json()
                except Exception:
                    tobj = (await tr.aread()).decode('utf-8','ignore')
                round_rec["tool_call"] = {"name": tool_name, "args": args, "status": tr.status_code, "result": tobj}
                out["rounds"].append(round_rec)

                obs_str = json.dumps(tobj, ensure_ascii=False) if isinstance(tobj, (dict, list)) else str(tobj)
                obs_trim = obs_str[:4000]
                messages.append({"role": "assistant", "content": content})
                messages.append({"role": "user", "content": f"Observation: {obs_trim}"})
    except Exception as ex:
        out["error"] = str(ex)
    return out
