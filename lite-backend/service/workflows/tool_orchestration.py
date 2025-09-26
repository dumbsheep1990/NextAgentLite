import asyncio
import os
from typing import Any, AsyncGenerator, Dict, List, Optional
import httpx

from .workflow_engine import Workflow, WorkflowContext
from service.agent_service_v2 import get_agent_service_v2
from service.tools_registry import get_tool_registry
from service.hybrid_search_service import hybrid_search_service


async def step_prepare(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """Prepare agent and tools from inputs.
    ctx.inputs expects: {
      "agent_name": str,
      "selected_tools": List[str],
      "model_id": Optional[str],
      "model_provider": Optional[str]
    }
    """
    agent_name = ctx.inputs.get("agent_name") or "workflow_agent"
    selected_tools = ctx.inputs.get("selected_tools") or []
    # 兼容别名：支持前端传递 model/provider 字段
    model_id = ctx.inputs.get("model_id") or ctx.inputs.get("model")
    model_provider = ctx.inputs.get("model_provider") or ctx.inputs.get("provider")

    yield {"stage": "prepare", "agent_name": agent_name, "selected_tools": selected_tools}

    service = await get_agent_service_v2()
    agent = await service.create_agent_v2(
        agent_name=agent_name,
        selected_tools=selected_tools,
        model_name=model_id,
        model_provider=model_provider,
    )
    if agent is None:
        raise RuntimeError("failed to create agent for workflow")
    # 注入模型参数（若支持）
    try:
        temperature = ctx.inputs.get("temperature")
        top_p = ctx.inputs.get("top_p")
        max_tokens = ctx.inputs.get("max_tokens")
        mdl = getattr(agent, 'model', None)
        if mdl is not None:
            if temperature is not None and hasattr(mdl, 'temperature'):
                setattr(mdl, 'temperature', float(temperature))
            if top_p is not None and hasattr(mdl, 'top_p'):
                setattr(mdl, 'top_p', float(top_p))
            if max_tokens is not None and hasattr(mdl, 'max_output_tokens'):
                setattr(mdl, 'max_output_tokens', int(max_tokens))
    except Exception:
        pass
    # 暂存工具配置（供后续步骤使用或日志）
    ctx.vars["tool_configs"] = ctx.inputs.get("tool_configs") or {}
    ctx.vars["agent"] = agent
    yield {"stage": "prepare", "status": "ok"}


async def step_plan(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """Let model create a brief plan (optional)."""
    agent = ctx.vars.get("agent")
    prompt = ctx.inputs.get("prompt") or "请为接下来的任务生成一个简要的执行计划，列出要调用的工具和步骤。"
    try:
        if hasattr(agent, "arun"):
            res = await agent.arun(prompt)
        else:
            res = agent.run(prompt)
        text = getattr(res, "content", None) or (res if isinstance(res, str) else str(res))
        ctx.vars["plan"] = text
        yield {"stage": "plan", "content": text}
    except Exception as e:
        yield {"stage": "plan", "warning": str(e)}


async def step_retrieve(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """Optional retrieval step supporting cross-collection search.
    ctx.inputs may contain:
      resources: { knowledge_collection?: {collection_id}, cross_collections?: [id, ...] }
      top_n: int (optional)
    """
    try:
        res = ctx.inputs.get("resources") or {}
        current = (res.get("knowledge_collection") or {}).get("collection_id")
        cross = res.get("cross_collections") or []
        all_cols = []
        if current:
            all_cols.append(current)
        if isinstance(cross, list):
            all_cols.extend([str(x) for x in cross if x])
        # 兼容：若未通过 resources 传递，尝试从 inputs.collection_id / filters.collection_id 读取
        if not all_cols:
            direct_cid = ctx.inputs.get("collection_id")
            if direct_cid:
                all_cols.append(str(direct_cid))
        if not all_cols:
            fin = ctx.inputs.get("filters") or {}
            fin_cid = fin.get("collection_id")
            if isinstance(fin_cid, list):
                all_cols.extend([str(x) for x in fin_cid if x])
            elif fin_cid:
                all_cols.append(str(fin_cid))
        # 去重
        all_cols = list(dict.fromkeys(all_cols))
        if not all_cols:
            # 无集合信息则直接跳过检索，但抛出可观测事件
            yield {"stage": "retrieve", "warning": "no collection specified; skip retrieval"}
            return
        query = ctx.inputs.get("prompt") or ""
        top_n = int(ctx.inputs.get("top_n") or 8)
        retrieval_mode = (ctx.inputs.get("retrieval_mode") or (res.get("retrieval_mode") if isinstance(res, dict) else None) or "hybrid").lower()
        yield {"stage": "retrieve", "collections": all_cols, "top_n": top_n, "mode": retrieval_mode, "query": (ctx.inputs.get("prompt") or "")}
        # 优先使用用户选择的向量模型生成查询向量（走 9050 OpenAI 兼容接口）
        query_vector = None
        try:
            emb_cfg = (res.get("embedding_model") or {})
            emb_model_id = emb_cfg.get("model_id")
            if emb_model_id:
                base = os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050').rstrip('/')
                async with httpx.AsyncClient(timeout=10.0) as hc:
                    r = await hc.post(f"{base}/v1/embeddings", json={"model": emb_model_id, "input": query})
                    if r.status_code == 200:
                        j = r.json()
                        data = (j.get('data') or [{}])[0]
                        query_vector = data.get('embedding')
        except Exception:
            query_vector = None

        # 组装过滤器：集合 + 元数据过滤（如工作室里配置的 metadata_filters）
        filters_in = ctx.inputs.get("filters") or {}
        filt: Dict[str, Any] = {}
        if all_cols:
            filt["collection_id"] = all_cols
        if isinstance(filters_in, dict) and isinstance(filters_in.get("metadata_filters"), list):
            filt["metadata_filters"] = [
                { 'key': f.get('key'), 'op': f.get('op', '='), 'value': f.get('value') }
                for f in filters_in.get('metadata_filters') if isinstance(f, dict) and f.get('key')
            ]

        results = []
        if retrieval_mode.startswith("hirag"):
            # 调用路由检索（支持 hirag/hybrid 自动切换）
            try:
                from service.retrieval_router_service import routed_retrieval as _routed
                rr = await _routed(
                    query=query,
                    collection_id=all_cols[0],  # hirag 当前按单集合工作，取第一个
                    mode="hirag" if retrieval_mode == "hirag" else "auto",
                    top_k=top_n,
                    filters=filt,
                    fallback_to_hybrid=True,
                )
                if rr.get("success"):
                    items = rr.get("items") or rr.get("results") or []
                    # 兼容为 HybridSearch SearchResult 结构的最小集
                    for it in items:
                        results.append(type("_R", (), {
                            "id": it.get("id") or it.get("document_id") or "",
                            "title": it.get("title") or "",
                            "content": it.get("content") or "",
                            "score": float(it.get("score") or it.get("combined_score") or 0.0),
                            "combined_score": float(it.get("combined_score") or it.get("score") or 0.0),
                            "source": it.get("source") or {"document_id": it.get("document_id")}
                        }))
            except Exception as _e:
                yield {"stage": "retrieve", "warning": f"hirag route failed: {_e}"}
        if not results:
            # 回退到混合检索
            results = await hybrid_search_service.hybrid_search(
                query=query,
                top_k=top_n,
                filters=filt,
                collection_id=None,  # 通过 filters 传入集合
                query_vector=query_vector,
            )
            # 如果 hybrid_search_service 需要 filters.collection_id，则再次调用带过滤（兼容）
            if not results and all_cols:
                results = await hybrid_search_service.hybrid_search(
                    query=query,
                    top_k=top_n,
                    filters={"collection_id": all_cols, **({"metadata_filters": filt.get("metadata_filters")} if filt.get("metadata_filters") else {})},
                    collection_id=None,
                )
        # 阈值过滤（前端 sim_threshold 传入 0-1）
        sim_threshold = None
        try:
            sim_threshold = float(ctx.inputs.get("sim_threshold"))
        except Exception:
            sim_threshold = None

        if sim_threshold is not None and results:
            results = [r for r in results if getattr(r, 'combined_score', 0.0) >= sim_threshold]

        snippets = []
        for r in (results or [])[:top_n]:
            title = (getattr(r, 'title', None) or r.source.get('title') if hasattr(r, 'source') else '') or ''
            content = getattr(r, 'content', None) or r.source.get('content') if hasattr(r, 'source') else ''
            if title:
                snippets.append(f"【{title}】\n{content[:500]}")
            else:
                snippets.append(str(content)[:500])
        context_text = "\n\n".join(snippets)
        ctx.vars["retrieval_context"] = context_text
        # 推送更丰富的事件，便于前端执行面板展示
        sample_ids = []
        try:
            sample_ids = [getattr(r, 'id', None) for r in (results or [])[:5]]
        except Exception:
            sample_ids = []
        yield {
            "stage": "retrieve",
            "mode": retrieval_mode,
            "hits": len(results or []),
            "context_preview": context_text[:400],
            "sample_ids": [sid for sid in sample_ids if sid],
            "filters": filt,
        }
    except Exception as e:
        yield {"stage": "retrieve", "warning": str(e)}

def _build_placeholders(ctx: WorkflowContext) -> Dict[str, str]:
    """构建可注入到提示词中的占位内容。
    - knowledge: 来自 step_retrieve 聚合的上下文
    - tools_exec: 依据已选择工具生成的执行位（此处先放启用清单，后续可接入实际执行结果摘要）
    - meta: 运行元数据（可按需扩展）
    """
    retrieval_ctx = ctx.vars.get("retrieval_context") or ""
    # 工具执行占位（当前使用已选择工具名称清单占位；后续可替换为调用摘要）
    sel = ctx.inputs.get("selected_tools") or []
    if sel:
        tools_block = "\n".join([f"- {t}" for t in sel])
        tools_exec = f"已启用工具（可能按需调用）：\n{tools_block}"
    else:
        tools_exec = ""
    meta = ""
    return {
        "knowledge": retrieval_ctx,
        "tools_exec": tools_exec,
        "meta": meta,
    }


def _render_prompt(user_text: str, placeholders: Dict[str, str], *, require_knowledge: bool, auto_tools: bool, question: str) -> str:
    """根据占位与用户文本渲染最终提示词。
    规则：
    - 如果用户文本中包含 {{knowledge}}/{{tools_exec}}，进行替换。
    - 若 require_knowledge 为 True 且用户未包含 {{knowledge}}，则自动在文本前部加入知识块。
    - 若 auto_tools 为 True 且用户未包含 {{tools_exec}} 且存在工具占位内容，自动加入工具块。
    - 统一在末尾附加用户问题。
    """
    text = user_text or ""
    know = placeholders.get("knowledge") or ""
    tools = placeholders.get("tools_exec") or ""

    # 显式占位替换
    if "{{knowledge}}" in text:
        text = text.replace("{{knowledge}}", know)
    if "{{tools_exec}}" in text:
        text = text.replace("{{tools_exec}}", tools)

    # 自动注入（强制/启用）
    if require_knowledge and "{{knowledge}}" not in user_text and know:
        # 将知识块放在文本前部
        prefix = "请结合以下资料进行回答：\n\n" + know + "\n\n"
        text = prefix + text

    if auto_tools and "{{tools_exec}}" not in user_text and tools:
        # 将工具块放在文本前部但落在知识之后
        tools_prefix = "可用工具清单：\n" + tools + "\n\n"
        text = tools_prefix + text

    # 附加问题
    text = text + ("\n\n问题：" + question if question else "")
    return text


async def step_execute(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """Execute main user prompt with tools enabled."""
    agent = ctx.vars.get("agent")
    question = ctx.inputs.get("prompt") or "请执行任务。"
    user_text = ctx.inputs.get("custom_prompt") or ""

    # 构建占位
    placeholders = _build_placeholders(ctx)
    # 是否必须包含 knowledge 占位：绑定了知识库资源即为 True
    res = ctx.inputs.get("resources") or {}
    require_knowledge = bool((res.get("knowledge_collection") or {}).get("collection_id"))
    # 若存在启用的工具选择，则自动注入 tools_exec（仅当有内容）
    auto_tools = bool(ctx.inputs.get("selected_tools"))

    final_prompt = _render_prompt(
        user_text=user_text,
        placeholders=placeholders,
        require_knowledge=require_knowledge,
        auto_tools=auto_tools,
        question=question,
    )
    yield {"stage": "execute", "prompt": final_prompt}
    try:
        # 若存在模型且传入了历史消息，则按聊天消息格式组装
        mdl = getattr(agent, 'model', None)
        chat_messages = ctx.inputs.get('chat_messages') if isinstance(ctx.inputs.get('chat_messages'), list) else None
        chat_cfg = ctx.inputs.get('chat_config') if isinstance(ctx.inputs.get('chat_config'), dict) else {}
        max_rounds = 0
        try:
            max_rounds = int(chat_cfg.get('max_rounds') or 0)
        except Exception:
            max_rounds = 0

        # 统一组装 chat messages
        msgs = []
        if chat_messages:
            # 截断历史（保留最近 max_rounds*2 条，简单按消息条数）
            if max_rounds and len(chat_messages) > max_rounds * 2:
                msgs = chat_messages[-max_rounds*2:]
            else:
                msgs = list(chat_messages)
        # 追加当前用户消息（融合知识/工具的最终提示）
        msgs.append({ 'role': 'user', 'content': final_prompt })

        # 优先尝试通过 9050 网关进行流式调用（OpenAI 兼容 /v1/chat/completions）
        model_id = ctx.inputs.get('model_id') or getattr(mdl, 'id', None) or getattr(getattr(mdl, 'model', None), 'id', None)
        gateway_base = os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050').rstrip('/')
        stream_supported = bool(model_id)

        if stream_supported:
            yield {"stage": "execute", "status": "thinking"}
            async with httpx.AsyncClient(timeout=None) as hc:
                try:
                    req_body = {"model": model_id, "stream": True, "messages": msgs}
                    async with hc.stream("POST", f"{gateway_base}/v1/chat/completions", json=req_body) as resp:
                        if resp.status_code == 200:
                            yield {"stage": "execute", "status": "answering"}
                            full_text = ""
                            seen_content = False
                            async for line in resp.aiter_lines():
                                if not line:
                                    continue
                                # OpenAI 流式规范：以 "data: " 开头
                                if line.startswith("data: "):
                                    data = line[6:].strip()
                                    if data == "[DONE]":
                                        break
                                    try:
                                        obj = json.loads(data)
                                    except Exception:
                                        continue
                                    choices = obj.get('choices') or []
                                    if choices:
                                        delta = choices[0].get('delta') or {}
                                        token = delta.get('content') or ''
                                        if token:
                                            seen_content = True
                                            full_text += token
                                            # 增量推送 token
                                            yield {"stage": "execute", "status": "answering", "delta": token}
                            # 结束：推送完整结果
                            if not seen_content or not (full_text.strip()):
                                # 流式未返回可见文本，回退一次同步生成
                                try:
                                    if hasattr(agent, 'arun'):
                                        res2 = await agent.arun(final_prompt)
                                    else:
                                        res2 = agent.run(final_prompt)
                                    text2 = getattr(res2, 'content', None) or (res2 if isinstance(res2, str) else str(res2))
                                    full_text = text2 or ""
                                except Exception:
                                    pass
                            ctx.outputs["result"] = full_text
                            yield {"stage": "execute", "result": full_text[:2000]}
                            return
                        else:
                            # 非200：回退
                            err = await resp.aread()
                            yield {"stage": "execute", "warning": f"gateway non-200: {resp.status_code}"}
                except Exception as _se:
                    # 流式失败，回退
                    yield {"stage": "execute", "warning": f"stream_failed: {_se}"}

        # 回退路径：优先使用模型的同步invoke；否则走 Agent.run
        import asyncio as _asyncio
        if hasattr(mdl, 'invoke'):
            res = await _asyncio.to_thread(mdl.invoke, msgs)
            text = getattr(res, 'content', None) or (res if isinstance(res, str) else str(res))
        else:
            if hasattr(agent, 'arun'):
                res = await agent.arun(final_prompt)
            else:
                res = agent.run(final_prompt)
            text = getattr(res, 'content', None) or (res if isinstance(res, str) else str(res))
        ctx.outputs["result"] = text
        yield {"stage": "execute", "result": text[:2000]}
    except Exception as e:
        yield {"stage": "execute", "error": str(e)}
        raise


def build_tool_workflow(name: str = "tool_orchestration") -> Workflow:
    steps = [step_prepare, step_plan, step_retrieve, step_execute]
    return Workflow(name=name, steps=steps)
