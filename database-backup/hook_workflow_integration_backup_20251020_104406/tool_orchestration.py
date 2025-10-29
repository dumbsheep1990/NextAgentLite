import asyncio
import os
import json
from typing import Any, AsyncGenerator, Dict, List, Optional
from uuid import uuid4
from core.logger import logger
import httpx

from .workflow_engine import Workflow, WorkflowContext
from service.agent_service_v2 import get_agent_service_v2
from service.tools_registry import get_tool_registry
from service.hybrid_search_service import hybrid_search_service
from service.hook_pipeline_service import load_pipeline, load_default_pipeline
from service.hooks import RunInput, RunOutput, AgentSession, HookCheckError


async def _execute_post_hooks(
    hook_pipeline,
    result_text: str,
    run_id: str,
    ctx: WorkflowContext
) -> str:
    """执行Post-hooks链并返回处理后的结果

    Args:
        hook_pipeline: Hook Pipeline实例
        result_text: 原始结果文本
        run_id: 运行ID
        ctx: Workflow上下文

    Returns:
        处理后的结果文本
    """
    if not hook_pipeline or not result_text:
        return result_text

    try:
        # 构建RunOutput
        run_output = RunOutput(
            content=result_text,
            metadata={
                'citations': ctx.vars.get('citations', []),
                'search_results': ctx.vars.get('search_results', [])
            }
        )

        # 执行Post-hooks
        logger.debug(f"[WF][{run_id}] 开始执行Post-hooks")
        await hook_pipeline.execute_post_hooks(run_output)

        # 记录脱敏等元数据
        if run_output.metadata.get('desensitization'):
            ctx.vars['desensitization_metadata'] = run_output.metadata['desensitization']
            logger.info(f"[WF][{run_id}] Post-hooks脱敏完成: {run_output.metadata['desensitization']}")

        logger.info(f"[WF][{run_id}] Post-hooks执行完成")
        return run_output.content

    except Exception as e:
        logger.error(f"[WF][{run_id}] Post-hooks执行异常: {e}")
        # Post-hooks失败不中断输出，返回原始结果
        ctx.vars['post_hook_error'] = str(e)
        return result_text


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

    # 生成运行ID以串联日志
    run_id = ctx.inputs.get("run_id") or f"wf-{uuid4().hex[:8]}"
    ctx.inputs["run_id"] = run_id
    logger.info(f"[WF][{run_id}] step_prepare: agent={agent_name} tools={selected_tools} model={model_id or ''}")
    yield {"stage": "prepare", "agent_name": agent_name, "selected_tools": selected_tools, "run_id": run_id}

    # 读取检索/图谱开关
    # 默认策略（更智能）：
    # - 若请求未显式传 search_knowledge，则当存在挂载的知识库时默认开启；否则默认关闭
    # - 若显式传入则严格遵循
    res_probe = ctx.inputs.get("resources") or {}
    mounted_cid = (res_probe.get("knowledge_collection") or {}).get("collection_id") or ctx.inputs.get("collection_id")
    if "search_knowledge" in ctx.inputs:
        search_knowledge = bool(ctx.inputs.get("search_knowledge"))
    else:
        search_knowledge = bool(mounted_cid)
    # 图谱检索默认仍为关闭，除非显式传入 graph_config.enabled
    search_graph = bool(ctx.inputs.get("search_graph", False))

    service = await get_agent_service_v2()
    agent = await service.create_agent_v2(
        agent_name=agent_name,
        selected_tools=selected_tools,
        model_name=model_id,
        model_provider=model_provider,
        search_knowledge=search_knowledge,
        search_graph=search_graph,
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
    ctx.vars["search_knowledge"] = search_knowledge
    ctx.vars["search_graph"] = search_graph
    # 在 prepare 阶段就把检索策略同步到工具链（避免工具在 plan 之前按 all 模式跑）
    try:
        from service.agent_service import CustomKnowledgeTools, set_runtime_search_flags
        # 解析 collection_id（resources 或 collection_id/filter 中）
        res = ctx.inputs.get("resources") or {}
        cid = (res.get("knowledge_collection") or {}).get("collection_id") or ctx.inputs.get("collection_id")
        if cid:
            CustomKnowledgeTools.set_collection_id(str(cid))
        # 解析检索 flags
        search_cfg = ((ctx.inputs.get('filters') or {}).get('search') or {}) if isinstance(ctx.inputs.get('filters'), dict) else {}
        inc_doc = search_cfg.get('include_documents')
        inc_qa = search_cfg.get('include_qa_datasets')
        derived_mode = 'all'
        if inc_doc is True and inc_qa is False:
            derived_mode = 'papers_only'
        elif inc_doc is False and inc_qa is True:
            derived_mode = 'qa_only'
        elif inc_doc is False and inc_qa is False:
            derived_mode = 'papers_only'
        # 若整体关闭知识检索，则设置为不检索，仅工具
        if not search_knowledge:
            derived_mode = 'none'
        CustomKnowledgeTools.set_retrieval_mode(derived_mode)
        try:
            set_runtime_search_flags({'include_documents': bool(inc_doc) if inc_doc is not None else True,
                                      'include_qa_datasets': bool(inc_qa) if inc_qa is not None else True})
        except Exception:
            pass
    except Exception:
        pass

    # ========== Hook Pipeline集成 ==========
    # 加载Pipeline配置
    pipeline_id = ctx.inputs.get('pipeline_id')
    try:
        if pipeline_id:
            hook_pipeline = await load_pipeline(pipeline_id)
            if not hook_pipeline:
                logger.warning(f"Pipeline加载失败: {pipeline_id}，使用默认Pipeline")
                hook_pipeline = await load_default_pipeline()
        else:
            hook_pipeline = await load_default_pipeline()

        if hook_pipeline:
            logger.info(f"[WF][{run_id}] 加载Hook Pipeline: {hook_pipeline.pipeline_name}")

            # 准备Pipeline输入
            run_input = RunInput(
                input_content=ctx.inputs.get('prompt', ''),
                session_id=ctx.inputs.get('session_id'),
                user_id=ctx.inputs.get('user_id'),
                context={}
            )
            session = AgentSession(
                id=ctx.inputs.get('session_id') or run_id,
                user_id=ctx.inputs.get('user_id'),
                agent_id=agent_name
            )

            # 执行Pre-hooks
            try:
                logger.debug(f"[WF][{run_id}] 执行Pre-hooks")
                await hook_pipeline.execute_pre_hooks(
                    run_input,
                    session,
                    user_id=ctx.inputs.get('user_id'),
                    debug_mode=ctx.inputs.get('debug_mode', False)
                )

                # 将Hook执行的上下文注入到ctx
                ctx.vars['hook_context'] = run_input.context
                ctx.vars['retrieval_strategy'] = run_input.context.get('retrieval_strategy')
                ctx.vars['retrieval_config'] = run_input.context.get('retrieval_config')
                ctx.vars['query_intent'] = run_input.context.get('intent')
                ctx.vars['hook_pipeline'] = hook_pipeline

                logger.info(f"[WF][{run_id}] Pre-hooks执行完成，策略={run_input.context.get('retrieval_strategy')}")

            except HookCheckError as e:
                logger.error(f"[WF][{run_id}] Hook检查失败: {e.message}")
                yield {
                    "stage": "prepare",
                    "status": "failed",
                    "error": str(e),
                    "check_trigger": e.check_trigger
                }
                raise

            except Exception as e:
                logger.error(f"[WF][{run_id}] Hook执行异常: {e}")
                # 记录错误但继续执行（graceful degradation）
                ctx.vars['hook_error'] = str(e)

        else:
            logger.warning(f"[WF][{run_id}] 未能加载任何Pipeline")

    except Exception as e:
        logger.error(f"[WF][{run_id}] Hook Pipeline处理异常: {e}")
        # 不中断流程，继续执行

    yield {"stage": "prepare", "status": "ok"}


async def step_plan(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """Optional internal planning step（非 LLM）。
    目的：根据当前开关/资源/选择的工具，给出本地可执行的流程建议，用于优化链路与日志可读性。
    启用方式：ctx.inputs.enable_plan = true
    """
    enable_plan = bool(ctx.inputs.get('enable_plan'))
    if not enable_plan:
        yield {"stage": "plan", "status": "skipped"}
        return

    # 收集上下文与开关
    run_id = ctx.inputs.get('run_id')
    search_knowledge = bool(ctx.inputs.get('search_knowledge', False) or ctx.vars.get('search_knowledge', False))
    search_graph = bool(ctx.inputs.get('search_graph', False) or ctx.vars.get('search_graph', False))
    resources = ctx.inputs.get('resources') or {}
    collection_id = (resources.get('knowledge_collection') or {}).get('collection_id') or ctx.inputs.get('collection_id')
    selected_tools = ctx.inputs.get('selected_tools') or []
    filters = (ctx.inputs.get('filters') or {}).get('search') or {}
    include_docs = filters.get('include_documents')
    include_qa = filters.get('include_qa_datasets')
    intent_enabled = bool(ctx.inputs.get('enable_intent', False))

    # 依据已完成的前置步骤产物估算
    ph = ctx.vars.get('placeholders') or {}
    know_len = len((ph.get('knowledge') or '').strip())

    steps_plan = []
    steps_plan.append({"name": "prepare", "enabled": True})
    # 检索
    if search_knowledge and collection_id:
        steps_plan.append({"name": "retrieve", "enabled": True, "mode": (
            'papers_only' if (include_docs is True and include_qa is False) else (
            'qa_only' if (include_docs is False and include_qa is True) else 'all')
        )})
    else:
        steps_plan.append({"name": "retrieve", "enabled": False, "reason": "search_knowledge=false or no collection"})
    # 意图分析（仅在有检索上下文时才启用）
    if intent_enabled and search_knowledge and collection_id and know_len > 0:
        steps_plan.append({"name": "intent", "enabled": True, "reason": "has_context"})
    else:
        steps_plan.append({"name": "intent", "enabled": False, "reason": "disabled or no_context"})
    # 图谱
    steps_plan.append({"name": "graph", "enabled": bool(search_graph)})
    # 工具
    steps_plan.append({"name": "tools", "enabled": bool(selected_tools), "count": len(selected_tools)})
    # 执行
    steps_plan.append({"name": "execute", "enabled": True, "stream": bool(ctx.inputs.get('stream', True))})

    # 以简洁的文本输出摘要，便于日志与前端查看
    summary_lines = [
        f"- 检索: {'开' if (search_knowledge and collection_id) else '关'}",
        f"- 图谱: {'开' if search_graph else '关'}",
        f"- 意图分析: {'开' if (intent_enabled and know_len>0 and search_knowledge and collection_id) else '关'}",
        f"- 工具: {len(selected_tools)} 个",
        f"- 执行: 流式={'是' if bool(ctx.inputs.get('stream', True)) else '否'}",
    ]
    summary = "\n".join(summary_lines)
    logger.info(f"[WF][{run_id}] plan (internal):\n{summary}")
    ctx.vars['plan'] = steps_plan
    yield {"stage": "plan", "status": "ok", "plan": steps_plan, "summary": summary}


async def step_intent(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """Infer user intent and set retrieval strategy flags (Agentic Search).

    Outputs:
      - ctx.vars['intent']
      - ctx.inputs['filters']['search'] include_documents/include_qa_datasets
      - ctx.inputs['top_n'] (optional override)
      - ctx.vars['keywords'] extracted by model (optional)
    """
    # 工具/通用问答：若未启用知识检索或未挂载知识库，直接跳过意图分析
    enable_intent = bool(ctx.inputs.get('enable_intent', False))
    search_knowledge = bool(ctx.inputs.get('search_knowledge', False) or ctx.vars.get('search_knowledge', False))
    resources = ctx.inputs.get('resources') or {}
    has_collection = bool((resources.get('knowledge_collection') or {}).get('collection_id') or ctx.inputs.get('collection_id'))
    # 需要：显式开启 + 允许检索 + 有知识库
    if not enable_intent or not search_knowledge or not has_collection:
        yield {"stage": "intent", "status": "skipped", "reason": "intent_disabled_or_no_kb"}
        return
    # 还需要：已有初次检索形成的上下文（例如 {{knowledge}}），否则先跳过
    ph = ctx.vars.get('placeholders') or {}
    know = (ph.get('knowledge') or '').strip()
    if not know:
        yield {"stage": "intent", "status": "skipped", "reason": "no_context_for_intent"}
        return

    run_id = ctx.inputs.get("run_id")
    query = (ctx.inputs.get("prompt") or "").strip()
    yield {"stage": "intent", "status": "thinking"}

    # quick heuristic first
    ql = query.lower()
    heuristic = None
    if any(k in ql for k in ["综述", "总结", "概述", "overview", "summary", "对比", "比较", "compare", "区别", "差异", "differences", "如何", "怎么", "步骤", "step", "guide", "教程", "清单", "list", "top", "有哪些"]):
        heuristic = "summary"
    elif len(query) <= 12 and any(k in ql for k in ["什么", "是谁", "定义", "是什么", "what is", "who is"]):
        heuristic = "fact"

    intent = heuristic or "other"
    keywords = []
    strategy = "hybrid"
    need_qa = False
    use_rerank = True
    top_k = ctx.inputs.get("top_n") or 8

    # LLM-based intent when heuristic is not decisive
    if heuristic is None:
        try:
            gateway_base = os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050').rstrip('/')
            model_id = (ctx.inputs.get('model_id') or ctx.inputs.get('model') or '').strip()
            provider = (ctx.inputs.get('model_provider') or ctx.inputs.get('provider') or '').strip()
            payload = {
                "model": (model_id or "Qwen/Qwen2.5-7B-Instruct"),
                "messages": [
                    {"role": "system", "content": "你是检索意图分析助手。请只输出JSON。"},
                    {"role": "user", "content": f"分析该查询的检索意图，返回JSON，字段：intent(fact|summary|howto|compare|list|entity|other), need_qa(bool), strategy(hybrid|keyword|semantic), top_k(int<=12), keywords(list<=5)。\n查询: {query}"}
                ],
                "stream": False,
                "temperature": 0.1
            }
            if provider:
                payload["provider"] = provider
            async with httpx.AsyncClient(timeout=20) as hc:
                r = await hc.post(f"{gateway_base}/v1/chat/completions", json=payload)
                if r.status_code == 200:
                    j = r.json()
                    txt = (j.get('choices') or [{}])[0].get('message', {}).get('content', '') or ''
                    try:
                        data = json.loads(txt)
                        intent = (data.get('intent') or intent).lower()
                        need_qa = bool(data.get('need_qa'))
                        strategy = (data.get('strategy') or strategy).lower()
                        tk = int(data.get('top_k') or top_k)
                        top_k = max(3, min(12, tk))
                        if isinstance(data.get('keywords'), list):
                            keywords = [str(x) for x in data.get('keywords')[:5]]
                    except Exception:
                        pass
        except Exception as _ie:
            logger.debug(f"[WF][{run_id}] intent llm fallback: {_ie}")

    # translate intent → flags
    include_docs = True
    include_qa = False
    if intent in ("summary", "howto", "compare", "list"):
        include_docs, include_qa = True, False
    elif intent == "fact":
        include_docs, include_qa = True, need_qa is True
    elif intent == "entity":
        include_docs, include_qa = True, False

    # 针对总结类：扩大召回规模，优先全量召回（非强制检索模式下）
    if intent in ("summary", "howto", "compare", "list"):
        try:
            # 若未设置强制检索（即未显式要求"force"），则启用“summary_full”模式
            force = bool(ctx.inputs.get('retrieval_force'))
            if not force:
                ctx.inputs['retrieval_mode'] = 'summary_full'
                # 提升 top_n（上限保护在服务端）
                if not ctx.inputs.get('top_n'):
                    ctx.inputs['top_n'] = 300
        except Exception:
            pass

    # write back flags
    ctx.inputs.setdefault('filters', {})
    f = ctx.inputs['filters']
    s = dict((f.get('search') or {}))
    s['include_documents'] = include_docs
    s['include_qa_datasets'] = include_qa
    f['search'] = s
    ctx.inputs['filters'] = f
    ctx.vars['intent'] = intent
    if keywords:
        ctx.vars['keywords'] = keywords
    # optional override topN
    ctx.inputs['top_n'] = top_k

    yield {"stage": "intent", "status": "ok", "intent": intent, "keywords": keywords, "flags": {"include_documents": include_docs, "include_qa_datasets": include_qa}, "top_n": top_k, "strategy": strategy}


async def step_retrieve(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """Optional retrieval step supporting cross-collection search.
    ctx.inputs may contain:
      resources: { knowledge_collection?: {collection_id}, cross_collections?: [id, ...] }
      top_n: int (optional)
    """
    try:
        # 若显式关闭知识检索，直接跳过
        if not bool(ctx.inputs.get("search_knowledge", False)) and not bool(ctx.vars.get("search_knowledge", False)):
            yield {"stage": "retrieve", "status": "skipped", "reason": "search_knowledge=false"}
            return
        run_id = ctx.inputs.get("run_id")
        res = ctx.inputs.get("resources") or {}
        # 读取图谱检索配置（支持两种位置：顶层 graph_config，或 custom_config.graph_config）
        graph_cfg: Dict[str, Any] = {}
        try:
            graph_cfg = (ctx.inputs.get("graph_config")
                         or (ctx.inputs.get("custom_config") or {}).get("graph_config")
                         or {})
        except Exception:
            graph_cfg = {}
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
        # 仅当显式开启时才启用图谱检索：
        # 前端需传 { graph_config: { enabled: true, ... } }
        graph_enabled = False
        try:
            if isinstance(graph_cfg, dict):
                if graph_cfg.get('enabled') is True:
                    graph_enabled = True
                # 兼容旧字段：trigger in ('on','enable','enabled', True)
                elif str(graph_cfg.get('trigger', '')).lower() in { 'on', 'enable', 'enabled', 'true' }:
                    graph_enabled = True
        except Exception:
            graph_enabled = False
        if not all_cols and not graph_enabled:
            # 无集合也未启用图谱，则直接跳过检索，但抛出可观测事件
            logger.info(f"[WF][{run_id}] step_retrieve skip: no collection/filter provided")
            yield {"stage": "retrieve", "warning": "no collection specified; skip retrieval"}
            return
        query = ctx.inputs.get("prompt") or ""
        top_n = int(ctx.inputs.get("top_n") or 8)
        retrieval_mode = (ctx.inputs.get("retrieval_mode") or (res.get("retrieval_mode") if isinstance(res, dict) else None) or "hybrid").lower()
        # 初始化检索事件：知识库
        if all_cols:
            logger.info(f"[WF][{run_id}] retrieve begin: cols={all_cols} topN={top_n} mode={retrieval_mode} query='{(ctx.inputs.get('prompt') or '')[:60]}'")
            yield {"stage": "retrieve", "collections": all_cols, "top_n": top_n, "mode": retrieval_mode, "query": (ctx.inputs.get("prompt") or "")}
        # 初始化检索事件：图谱
        if graph_enabled:
            gm = str(graph_cfg.get("query_mode") or "mix")
            gtop = int(graph_cfg.get("top_k") or 10)
            yield {"stage": "retrieve_graph", "mode": gm, "top_n": gtop, "query": (ctx.inputs.get("prompt") or "")}
        # 特殊模式：summary_full（按集合/单文档全量召回，不按相似度）
        # 规则：
        #  - 若集合内只有一个文档：直接对该文档全量召回；
        #  - 若多个文档：仅当query包含某个文档标题时，对该文档全量召回；否则回退到普通混合检索。
        if retrieval_mode == 'summary_full' and all_cols:
            try:
                # 读取集合下的文档清单（id, title）
                from db.database import get_sync_session
                from sqlalchemy import text as _text
                import concurrent.futures
                placeholders = ", ".join([f":c{i}" for i in range(len(all_cols))])
                _params = {f"c{i}": all_cols[i] for i in range(len(all_cols))}
                sql_docs = f"SELECT id, title FROM knowledge_documents WHERE collection_id IN ({placeholders})"
                def _load_docs():
                    with get_sync_session() as s:
                        r = s.execute(_text(sql_docs), _params)
                        return r.fetchall()
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
                    doc_rows = ex.submit(_load_docs).result(timeout=10)
                doc_rows = list(doc_rows or [])
                target_doc_id = None
                if len(doc_rows) == 1:
                    target_doc_id = str(doc_rows[0][0])
                else:
                    ql = (query or '').lower()
                    for did, title in doc_rows:
                        t = (title or '').lower().strip()
                        if t and (t in ql or ql in t):
                            target_doc_id = str(did)
                            break
                if target_doc_id:
                    # 全量召回该文档的片段：忽略 top_n，设置较大的保护上限（1000）
                    results = await hybrid_search_service.full_recall_by_document(target_doc_id, top_k=max(1000, int(top_n or 0)))
                    # 拼接上下文：为防提示过大，这里仅拼入前 50 段摘要
                    try:
                        ctx.vars['retrieval_context'] = "\n\n".join([f"【{i+1}】" + (getattr(r,'title','') or '') + "\n" + (getattr(r,'content','') or '') for i,r in enumerate((results or [])[:50])])
                    except Exception:
                        pass
                    # citations：展示全部召回片段（保护上限 1000），并标记为 unscored
                    citations = []
                    for i, r in enumerate((results or [])[:1000]):
                        src = getattr(r, 'source', {}) or {}
                        citations.append({
                            "index": i+1,
                            "title": getattr(r, 'title', '') or '',
                            "content": getattr(r, 'content', '') or '',
                            "score": float(getattr(r, 'score', 0.0) or 0.0),
                            "combined_score": float(getattr(r, 'combined_score', 0.0) or 0.0),
                            "keyword_score": float(getattr(r, 'keyword_score', 0.0) or 0.0),
                            "general_score": float(getattr(r, 'general_score', 0.0) or 0.0),
                            "domain_score": float(getattr(r, 'domain_score', 0.0) or 0.0),
                            "unscored": True,
                            "source": src,
                        })
                    ctx.vars['citations'] = citations
                yield {"stage": "retrieve", "mode": retrieval_mode, "hits": len(results or []), "context_preview": (ctx.vars.get('retrieval_context') or '')[:400], "sample_ids": [getattr(r,'id',None) for r in (results or [])[:3]], "citations": (ctx.vars.get('citations') or [])}
                # 命中单文档→完成检索，返回
                return
                # 未命中文档标题且集合文档>1 → 回退到普通检索（不return，继续后续流程）
            except Exception as _se:
                yield {"stage": "retrieve", "warning": f"summary_full failed: {_se}"}

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

        # Agentic 语义扩展：当问题包含“第X阶段/阶段X/步骤X/Phase X/Stage X”时，生成扩展短语以提升召回
        def _expand_ordinals(q: str) -> list[str]:
            try:
                import re
                cn_map = {
                    '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10
                }
                ex: list[str] = []
                s = q.strip()
                m = re.search(r"第([一二三四五六七八九十]+)阶段", s)
                n = None
                if m:
                    txt = m.group(1)
                    if txt in cn_map:
                        n = cn_map[txt]
                if n is None:
                    m2 = re.search(r"阶段\s*([一二三四五六七八九十]|\d+)", s)
                    if m2:
                        t = m2.group(1)
                        n = cn_map.get(t, None) if t in cn_map else int(t)
                if n is None:
                    m3 = re.search(r"第(\d+)阶段", s)
                    if m3:
                        n = int(m3.group(1))
                if n is None:
                    m4 = re.search(r"(Stage|Phase)\s*(\d+)", s, re.I)
                    if m4:
                        n = int(m4.group(2))
                if not n:
                    return []
                candidates = [
                    f"第{n}阶段", f"阶段{n}", f"阶段{['零','一','二','三','四','五','六','七','八','九','十'][n] if n<=10 else n}",
                    f"步骤{n}", f"步骤{['零','一','二','三','四','五','六','七','八','九','十'][n] if n<=10 else n}",
                    f"第{n}步", f"Stage {n}", f"Phase {n}", f"阶段{n}：", f"阶段{n}、"
                ]
                # 去重
                seen = set()
                out = []
                for c in candidates:
                    if c and c not in seen:
                        out.append(c)
                        seen.add(c)
                return out
            except Exception:
                return []

        expanded_queries = _expand_ordinals(ctx.inputs.get("prompt") or "")
        if expanded_queries:
            filt['expanded_queries'] = expanded_queries

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
                logger.warning(f"[WF][{run_id}] hirag route failed: {_e}")
                yield {"stage": "retrieve", "warning": f"hirag route failed: {_e}"}
        if not results:
            # 回退到混合检索
            results = await hybrid_search_service.hybrid_search(
                query=query,
                top_k=top_n,
                filters=filt,
                collection_id=None,  # 通过 filters 传入集合
                query_vector=query_vector,
                run_id=run_id,
            )
            # 如果 hybrid_search_service 需要 filters.collection_id，则再次调用带过滤（兼容）
            if not results and all_cols:
                results = await hybrid_search_service.hybrid_search(
                    query=query,
                    top_k=top_n,
                    filters={"collection_id": all_cols, **({"metadata_filters": filt.get("metadata_filters")} if filt.get("metadata_filters") else {})},
                    collection_id=None,
                    run_id=run_id,
                )
        # Progressive retrieval (agentic filters + relaxation)
        enable_agentic = bool(ctx.inputs.get('agentic_filters_enabled', True))
        base_filters = dict(filt)
        # 拿到现有 metadata_filters
        base_meta = []
        try:
            base_meta = list((filt or {}).get('metadata_filters') or [])
        except Exception:
            base_meta = []
        max_rounds = 3 if enable_agentic else 0
        min_hits = 3
        rounds = 0
        aggregated_results = []
        current_filters = dict(base_filters)
        while True:
            # 执行检索
            results = await hybrid_search_service.hybrid_search(
                query=query,
                top_k=min(20, top_n + rounds*4),
                filters=current_filters,
                collection_id=None,
                run_id=run_id,
            )
            if results:
                aggregated_results = results
            # emit event
            try:
                ctx.vars['retrieval_context'] = "\n\n".join([f"【{i+1}】" + (getattr(r,'title','') or '') + "\n" + (getattr(r,'content','') or '') for i,r in enumerate((results or [])[:min(6, top_n)])])
            except Exception:
                pass
            yield {"stage": "retrieve", "mode": retrieval_mode, "hits": len(results or []), "context_preview": (ctx.vars.get('retrieval_context') or '')[:400], "sample_ids": [getattr(r,'id',None) for r in (results or [])[:3]], "filters": current_filters}
            if (len(results or []) >= min_hits) or (rounds >= max_rounds):
                break
            # 放宽：移除一个 metadata 条目并扩大 topN
            rounds += 1
            if base_meta:
                base_meta = base_meta[:-1]
            current_filters = dict(base_filters)
            if base_meta:
                current_filters['metadata_filters'] = base_meta
            # 第一轮放宽时若有扩展短语失败，则保留 expanded_queries 继续尝试；第二/三轮可清空
            if rounds >= 2 and 'expanded_queries' in current_filters:
                current_filters.pop('expanded_queries', None)
            top_n = min(12, int(top_n) + 4)

        results = aggregated_results
        # rerank（普通检索场景）
        try:
            search_cfg = ((ctx.inputs.get('filters') or {}).get('search') or {}) if isinstance(ctx.inputs.get('filters'), dict) else {}
            enable_reranking = bool(search_cfg.get('enable_reranking', True))
        except Exception:
            enable_reranking = True
        if (retrieval_mode != 'summary_full') and enable_reranking and results:
            try:
                results = await hybrid_search_service.rerank_results(query, results)
            except Exception as _re:
                logger.warning(f"[WF][{run_id}] rerank skipped: {_re}")

        # 阈值过滤（前端 sim_threshold 传入 0-1）
        sim_threshold = None
        try:
            sim_threshold = float(ctx.inputs.get("sim_threshold"))
        except Exception:
            sim_threshold = None

        if sim_threshold is not None and results:
            def _th_score(r):
                s = getattr(r, 'general_score', None)
                if s is None:
                    s = getattr(r, 'score', None)
                if s is None:
                    s = getattr(r, 'combined_score', 0.0)
                try:
                    return float(s)
                except Exception:
                    return 0.0
            results = [r for r in results if _th_score(r) >= sim_threshold]

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
        if all_cols:
            logger.info(f"[WF][{run_id}] retrieve end: hits={len(results or [])} sample_ids={[sid for sid in (sample_ids or [])[:3]]}")
            yield {
                "stage": "retrieve",
                "mode": retrieval_mode,
                "hits": len(results or []),
                "context_preview": context_text[:400],
                "sample_ids": [sid for sid in sample_ids if sid],
                "filters": filt,
                "citations": (ctx.vars.get('citations') or []),
            }

        # 追加：图谱检索（若启用）
        if graph_enabled:
            try:
                from service.lightrag_client_service import matgraph_client
                g_mode = str(graph_cfg.get("query_mode") or "mix")
                g_top = int(graph_cfg.get("top_k") or 10)
                g_only_ctx = bool(graph_cfg.get("only_need_context") or False)
                g_res = await matgraph_client.query_knowledge_graph(
                    query=query,
                    mode=g_mode,
                    top_k=g_top,
                    only_need_context=g_only_ctx,
                )
                g_ok = bool(getattr(g_res, 'success', False))
                g_text = (getattr(g_res, 'response', None) or '')
                ctx.vars["graph_context"] = g_text or ''
                logger.info(f"[WF][{run_id}] retrieve_graph end: hits={(1 if (g_ok and (g_text or '').strip()) else 0)}")
                yield {
                    "stage": "retrieve_graph",
                    "mode": g_mode,
                    "hits": 1 if (g_ok and (g_text or '').strip()) else 0,
                    "context_preview": (g_text or '')[:400],
                }
            except Exception as _ge:
                logger.warning(f"[WF][{run_id}] graph failed: {_ge}")
                yield {"stage": "retrieve_graph", "warning": f"graph failed: {_ge}"}
        # 收集引用源用于回答阶段展示
        try:
            citations = []
            # 🔥 修改：citations使用实际检索到的所有结果
            # - retrieval_context可能因为prompt长度限制而截断(如全量召回取前50条)
            # - 但citations应该包含所有检索结果,用户点击时才查看详情
            # - 这样即使模型引用了[51][52]等,也能在前端找到对应的citation
            retrieval_context = ctx.vars.get('retrieval_context') or ''
            context_item_count = retrieval_context.count('【')

            # 使用所有检索结果生成citations
            for i, r in enumerate(results or []):
                src = getattr(r, 'source', {}) or {}
                md = (src.get('metadata') or {}) if isinstance(src, dict) else {}
                citations.append({
                    "index": i+1,
                    "title": getattr(r, 'title', '') or '',
                    "content": getattr(r, 'content', '') or '',
                    "score": float(getattr(r, 'score', 0.0) or 0.0),
                    "combined_score": float(getattr(r, 'combined_score', 0.0) or getattr(r, 'score', 0.0) or 0.0),
                    "keyword_score": float(getattr(r, 'keyword_score', 0.0) or 0.0),
                    "general_score": float(getattr(r, 'general_score', 0.0) or 0.0),
                    "domain_score": float(getattr(r, 'domain_score', 0.0) or 0.0),
                    "unscored": bool(md.get('unscored')),
                    "source": src,
                })
            ctx.vars['citations'] = citations
            logger.info(f"[WF][{ctx.inputs.get('run_id')}] 生成citations: {len(citations)}条 (context限制为前{context_item_count}条资料, results实际检索{len(results or [])}条)")
        except Exception as e:
            logger.warning(f"[WF][{ctx.inputs.get('run_id')}] citations生成失败: {e}")
            ctx.vars['citations'] = []

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


def _render_prompt(user_text: str,
                   placeholders: Dict[str, str],
                   *,
                   require_knowledge: bool,
                   auto_tools: bool,
                   question: str,
                   forbid_not_found: bool = False,
                   intent: str | None = None,
                   summary_prefs: Dict[str, Any] | None = None) -> str:
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
        # Guard 文案根据意图进行差异化：
        # - 总结/综述/对比/步骤等：强调“基于资料进行归纳整理”，避免逐字复制；允许少量引用并标注来源
        # - 其余：保持保守回答，但在资料充足时禁止“未找到相关资料”
        intent_l = (intent or '').lower()
        if intent_l in {"summary", "howto", "compare", "list"}:
            guard = (
                "请基于以下资料进行归纳与陈述，避免简单罗列或逐字复制原文。"
                "允许少量关键句的引用（每段不超过50字），并在引用后以括号标注来源标题。"
                "如资料涵盖多个要点，请按要点分段组织，语言连贯自然。"
                "不要凭空添加资料中没有的结论。\n\n"
            )
        else:
            if forbid_not_found:
                guard = (
                    "你必须严格依据以下资料回答问题，不得编造或添加资料中没有的信息。"
                    "根据资料直接作答，不要输出'未找到相关资料'之类的模板化回复。"
                    "每条资料前都有编号如【1】【2】【3】等，引用时请使用方括号标记如[1][2][3]等标注对应的资料编号。\n\n"
                )
            else:
                guard = (
                    "你必须严格依据以下资料回答问题，不得编造或添加资料中没有的信息。"
                    "如果资料不足以回答，请明确说明'未找到相关资料'。"
                    "每条资料前都有编号如【1】【2】【3】等，引用时请使用方括号标记如[1][2][3]等标注对应的资料编号。\n\n"
                )
        prefix = guard + "资料如下：\n\n" + know + "\n\n"
        text = prefix + text

    if auto_tools and "{{tools_exec}}" not in user_text and tools:
        # 将工具块放在文本前部但落在知识之后
        tools_prefix = "可用工具清单：\n" + tools + "\n\n"
        text = tools_prefix + text

    # 附加问题与输出风格建议（意图驱动）
    style = ""
    if (intent or '').lower() in {"summary", "compare", "howto", "list"}:
        prefs = summary_prefs or {}
        point_max = int(prefs.get('point_max_chars', 80))
        points_min = int(prefs.get('points_min', 3))
        points_max = int(prefs.get('points_max', 6))
        style = (
            "\n\n输出建议：\n"
            f"• 先用一段话自然概括主题与主要发现；\n"
            f"• 再分条给出{points_min}-{points_max}个关键要点（每条≤{point_max}字，逻辑清晰）；\n"
            f"• 正文中对引用内容使用数字编号如[1][2]等标注即可；\n"
            "• 避免逐字复制，如需引用短句（≤50字）请标注编号。"
        )
    text = text + ("\n\n问题：" + question if question else "") + style
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

    # 判断资料是否充足：长度阈值（例如 >= 200 字）
    knowledge_len = len((placeholders.get('knowledge') or '').strip())
    forbid_not_found = knowledge_len >= 200

    # 读取“总结输出风格”配置
    summary_prefs = {}
    try:
        sp = ctx.inputs.get('summary_prefs') or {}
        if isinstance(sp, dict):
            summary_prefs = sp
    except Exception:
        pass

    # 不再在提示中注入“来源清单”文本，避免模型在正文中重复输出纯数字清单

    final_prompt = _render_prompt(
        user_text=user_text,
        placeholders=placeholders,
        require_knowledge=require_knowledge,
        auto_tools=auto_tools,
        question=question,
        forbid_not_found=forbid_not_found,
        intent=(ctx.vars.get('intent') or None),
        summary_prefs=summary_prefs,
    )
    logger.info(f"[WF][{ctx.inputs.get('run_id')}] step_execute: require_knowledge={require_knowledge} know_len={knowledge_len}")
    yield {"stage": "execute", "prompt": final_prompt}
    # 立即发一帧 thinking 启动事件，确保前端创建“思考卡片”（即使后续网关暂时无思考流）
    try:
        yield {"stage": "execute", "status": "thinking", "content": ""}
    except Exception:
        pass

    # 不再额外请求一次“思考流”（避免与主流混淆）；仅使用主 /v1/chat/completions 的 reasoning_content
    pass

    # 在执行前，根据 inputs.filters.search 的开关同步到工具链（CustomKnowledgeTools），
    # 以确保模型调用工具时遵循“仅文档/仅QA/全部”的模式。
    try:
      from service.agent_service import CustomKnowledgeTools, set_runtime_search_flags
      search_cfg = ((ctx.inputs.get('filters') or {}).get('search') or {}) if isinstance(ctx.inputs.get('filters'), dict) else {}
      inc_doc = search_cfg.get('include_documents')
      inc_qa = search_cfg.get('include_qa_datasets')
      derived_mode = 'all'
      if inc_doc is True and inc_qa is False:
          derived_mode = 'papers_only'
      elif inc_doc is False and inc_qa is True:
          derived_mode = 'qa_only'
      elif inc_doc is False and inc_qa is False:
          # 两者都关，等同只文档但不会调用任何检索；保持 'papers_only'
          derived_mode = 'papers_only'
      CustomKnowledgeTools.set_retrieval_mode(derived_mode)
      # 同步运行期开关，工具链内部读取
      try:
          set_runtime_search_flags({'include_documents': bool(inc_doc) if inc_doc is not None else True,
                                    'include_qa_datasets': bool(inc_qa) if inc_qa is not None else True})
      except Exception:
          pass
      # 同步 collection_id，避免工具链使用默认库
      res = ctx.inputs.get('resources') or {}
      cid = (res.get('knowledge_collection') or {}).get('collection_id') or (ctx.inputs.get('collection_id'))
      if cid:
          CustomKnowledgeTools.set_collection_id(str(cid))
    except Exception:
      pass
    try:
        # 若强制需要资料且当前无任何检索上下文，直接返回“未找到相关资料”避免胡编
        if require_knowledge and not (placeholders.get("knowledge") or "").strip():
            ctx.outputs["result"] = "未找到相关资料。请先完善知识库或调整检索条件后再试。"
            yield {"stage": "execute", "result": ctx.outputs["result"], "citations": (ctx.vars.get('citations') or [])}
            return
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

        # 添加 system 消息（包含 agent 的 instructions）
        if hasattr(agent, 'instructions') and agent.instructions:
            system_instructions = agent.instructions
            if isinstance(system_instructions, list):
                system_instructions = '\n'.join(system_instructions)
            msgs.append({ 'role': 'system', 'content': system_instructions })
            logger.info(f"[WF] 已添加 system instructions (长度: {len(system_instructions)})")

        if chat_messages:
            # 截断历史（保留最近 max_rounds*2 条，简单按消息条数）
            if max_rounds and len(chat_messages) > max_rounds * 2:
                msgs += chat_messages[-max_rounds*2:]
            else:
                msgs += list(chat_messages)
        # 追加当前用户消息（融合知识/工具的最终提示）
        msgs.append({ 'role': 'user', 'content': final_prompt })

        # 检查是否有工具和工具模式
        agent_has_tools = hasattr(agent, 'tools') and agent.tools and len(agent.tools) > 0
        use_local_react = os.getenv('AGNO_ENABLE_NATIVE_TOOLS', '').strip().lower() in ('0', 'false', 'off', 'no')
        logger.info(f"[WF] agent对象检查: hasattr(tools)={hasattr(agent, 'tools')}, tools={getattr(agent, 'tools', None)}, len={len(agent.tools) if hasattr(agent, 'tools') and agent.tools else 0}")
        logger.info(f"[WF] 工具模式: use_local_react={use_local_react}")

        # 只有在使用原生工具模式时才用 agent.run()
        # 本地ReAct模式需要手动解析Action/Observation，不能用agent.run()
        if agent_has_tools and not use_local_react:
            logger.info(f"[WF] 检测到智能体有 {len(agent.tools)} 个工具，使用 agent.run() 模式")
            try:
                yield {"stage": "execute", "status": "thinking"}

                # 关键发现: Agno的print_response内部使用stream=True调用run()
                # stream=True模式下工具才能正确执行,这是官方推荐的方式
                logger.info(f"[WF] 使用 agent.run(stream=True) 执行工具调用")

                try:
                    full_text = ""
                    tool_calls_made = []

                    # 使用stream=True调用run() - 这是关键!
                    # 注意：Agno的agent.run()第一个参数名是input，不是message
                    response_stream = agent.run(
                        final_prompt,
                        stream=True,
                        stream_intermediate_steps=True
                    )

                    # 迭代处理流式响应
                    for chunk in response_stream:
                        # 调试：打印chunk的完整信息
                        logger.info(f"[WF] chunk类型: {type(chunk)}, 属性: {dir(chunk)[:10]}")

                        # RunResponseEvent可能包含不同类型的事件
                        if hasattr(chunk, 'event'):
                            event_type = chunk.event
                            logger.info(f"[WF] 收到事件类型: {event_type}")

                            # 调试：打印chunk的所有相关属性
                            if hasattr(chunk, 'content'):
                                logger.info(f"[WF] chunk.content: {chunk.content}")
                            if hasattr(chunk, 'model_response'):
                                logger.info(f"[WF] chunk.model_response: {chunk.model_response}")
                            if hasattr(chunk, 'messages'):
                                logger.info(f"[WF] chunk.messages数量: {len(chunk.messages) if chunk.messages else 0}")

                            # 工具调用事件 (可能是 'tool' 或 'ToolCall' 等)
                            if 'tool' in event_type.lower() or event_type == 'ToolCall':
                                if hasattr(chunk, 'content'):
                                    tool_info = str(chunk.content)
                                    tool_calls_made.append(tool_info)
                                    logger.info(f"[WF] 工具调用: {tool_info}")
                                    yield {"stage": "execute", "delta": f"\n[工具调用: {tool_info}]\n", "status": "tool_calling"}

                            # 内容生成事件 (RunContent, content, content_delta等)
                            elif 'content' in event_type.lower() or event_type in ('RunContent', 'content', 'content_delta'):
                                if hasattr(chunk, 'content') and chunk.content:
                                    delta = str(chunk.content)
                                    full_text += delta
                                    logger.info(f"[WF] 内容片段: {delta[:50]}...")
                                    yield {"stage": "execute", "delta": delta, "status": "answering"}

                        # 直接的内容属性（兼容不同版本）
                        elif hasattr(chunk, 'content') and chunk.content:
                            delta = str(chunk.content)
                            full_text += delta
                            logger.info(f"[WF] 内容片段(无event): {delta[:50]}...")
                            yield {"stage": "execute", "delta": delta, "status": "answering"}

                    if tool_calls_made:
                        logger.info(f"[WF] 共执行了 {len(tool_calls_made)} 次工具调用")

                    # 执行Post-hooks（如敏感信息脱敏）
                    hook_pipeline = ctx.vars.get('hook_pipeline')
                    run_id = ctx.inputs.get('run_id')
                    if full_text:
                        full_text = await _execute_post_hooks(hook_pipeline, full_text, run_id, ctx)

                    ctx.outputs["result"] = full_text
                    yield {"stage": "execute", "result": full_text[:2000], "citations": (ctx.vars.get('citations') or [])}
                    return

                except Exception as run_error:
                    logger.error(f"[WF] agent.run(stream=True) 执行失败: {run_error}", exc_info=True)
                    yield {"stage": "execute", "warning": f"agent_run_stream_failed: {run_error}"}
                    # 继续尝试网关调用作为回退
                    raise
            except Exception as e:
                logger.error(f"[WF] agent.run() 失败: {e}")
                yield {"stage": "execute", "warning": f"agent_run_failed: {e}"}
                # 继续尝试网关调用作为回退

        # 优先尝试通过 9050 网关进行流式调用（OpenAI 兼容 /v1/chat/completions）
        # 兼容 model 与 model_id 两种字段
        model_id = (
            ctx.inputs.get('model_id')
            or ctx.inputs.get('model')
            or getattr(mdl, 'id', None)
            or getattr(getattr(mdl, 'model', None), 'id', None)
        )
        gateway_base = os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050').rstrip('/')
        stream_flag = ctx.inputs.get('stream')
        # 默认为开启流式（除非显式传入 False）
        stream_supported = (stream_flag is not False) and bool(model_id)

        if stream_supported:
            # 先把检索到的引用提前回传，保证底部溯源“秒显”
            try:
                early_citations = (ctx.vars.get('citations') or [])
                if early_citations:
                    yield {"stage": "execute", "citations": early_citations, "status": "context"}
            except Exception:
                pass

            yield {"stage": "execute", "status": "thinking"}
            # 获取 reasoning 配置（在整个流式处理作用域内有效）
            reasoning_enabled = bool(ctx.inputs.get('reasoning_enabled', True))
            async with httpx.AsyncClient(timeout=None) as hc:
                try:
                    req_body = {"model": model_id, "stream": True, "messages": msgs}
                    # 添加模型参数
                    if ctx.inputs.get("temperature") is not None:
                        req_body["temperature"] = float(ctx.inputs.get("temperature"))
                    if ctx.inputs.get("top_p") is not None:
                        req_body["top_p"] = float(ctx.inputs.get("top_p"))
                    if ctx.inputs.get("max_tokens") is not None:
                        req_body["max_tokens"] = int(ctx.inputs.get("max_tokens"))
                    # 日志：记录实际发送到网关的参数
                    logger.info(f"[LLM-REQ] stream model={model_id} max_tokens={req_body.get('max_tokens')} temp={req_body.get('temperature')} top_p={req_body.get('top_p')}")
                    async with hc.stream("POST", f"{gateway_base}/v1/chat/completions", json=req_body) as resp:
                        if resp.status_code == 200:
                            # 根据响应头判断是否为真正的 SSE
                            ct = (resp.headers.get('Content-Type') or '').lower()
                            if 'text/event-stream' not in ct:
                                # 非SSE：直接按非流式处理，避免伪流式阻塞
                                raw_body = await resp.aread()
                                try:
                                    j = json.loads(raw_body.decode('utf-8') if isinstance(raw_body, (bytes, bytearray)) else str(raw_body))
                                except Exception:
                                    try:
                                        j = await resp.json()
                                    except Exception:
                                        j = {}
                                # 非流式也尝试提取 reasoning 与正文
                                try:
                                    msg0 = (j.get('choices') or [{}])[0].get('message') or {}
                                    reason_obj = msg0.get('reasoning') or msg0.get('reasoning_content')
                                    def _flat(x):
                                        if x is None:
                                            return ''
                                        if isinstance(x, str):
                                            return x
                                        if isinstance(x, dict):
                                            if 'content' in x and isinstance(x['content'], str):
                                                return x['content']
                                            if 'text' in x and isinstance(x['text'], str):
                                                return x['text']
                                            if 'content' in x and isinstance(x['content'], list):
                                                return '\n'.join(_flat(i) for i in x['content'])
                                            return ''
                                        if isinstance(x, list):
                                            return '\n'.join(_flat(i) for i in x)
                                        return str(x)
                                    rtxt = _flat(reason_obj).strip()
                                    if reasoning_enabled and rtxt:
                                        yield {"stage": "execute", "status": "thinking", "content": rtxt, "reasoning": True}
                                except Exception:
                                    pass
                                text = (j.get('choices') or [{}])[0].get('message', {}).get('content', '') or ''
                                # 执行Post-hooks（如敏感信息脱敏）
                                hook_pipeline = ctx.vars.get('hook_pipeline')
                                run_id = ctx.inputs.get('run_id')
                                if text:
                                    text = await _execute_post_hooks(hook_pipeline, text, run_id, ctx)
                                ctx.outputs["result"] = text
                                yield {"stage": "execute", "result": text[:2000], "citations": (ctx.vars.get('citations') or [])}
                                return
                            # 严格 Qwen 语义：reasoning_content → 思考；content → 回答
                            answer_started = False
                            saw_reasoning = False
                            logger.debug(f"[LLM-REQ] stream model={model_id} prompt_len={len(final_prompt)}")
                            yield {"stage": "execute", "status": "answering"}
                            full_text = ""
                            seen_content = False
                            async for line in resp.aiter_lines():
                                if not line:
                                    continue
                                raw = line.strip()
                                try:
                                    logger.debug(f"[LLM-RAW] {raw[:500]}")
                                except Exception:
                                    pass
                                # 兼容多种网关：data: {...} 或 直接 {...} 或 以冒号开头的注释帧
                                if raw.startswith(":"):
                                    # SSE 注释/心跳
                                    continue
                                if raw.startswith("data: "):
                                    raw = raw[6:].strip()
                                # [DONE] 结束帧
                                if raw == "[DONE]":
                                    break
                                # 解析 JSON 帧
                                try:
                                    obj = json.loads(raw)
                                except Exception:
                                    continue
                                choices = obj.get('choices') or []
                                if choices:
                                    delta = choices[0].get('delta') or {}
                                    try:
                                        logger.debug(f"[LLM-JSON] {json.dumps(obj, ensure_ascii=False)[:800]}")
                                    except Exception:
                                        pass
                                    # Qwen：reasoning_content 流 → 思考
                                    try:
                                        reason_piece = ''
                                        if isinstance(delta, dict):
                                            reason_piece = str(delta.get('reasoning_content') or '')
                                        if not reason_piece:
                                            reason_piece = str((choices[0].get('message') or {}).get('reasoning_content') or '')
                                        if reasoning_enabled and (not answer_started) and reason_piece:
                                            saw_reasoning = True
                                            try:
                                                logger.info(f"[LLM-REASON] {reason_piece[:200]}")
                                            except Exception:
                                                pass
                                            yield {"stage": "execute", "status": "thinking", "delta": reason_piece, "reasoning": True}
                                    except Exception:
                                        pass
                                    # Qwen：content 流 → 回答
                                    token = ''
                                    try:
                                        token = str((delta.get('content') or '')) if isinstance(delta, dict) else ''
                                        if not token:
                                            token = str((choices[0].get('message') or {}).get('content') or '')
                                    except Exception:
                                        token = ''
                                    if token:
                                        seen_content = True
                                        answer_started = True
                                        full_text += token
                                        try:
                                            logger.info(f"[LLM-ANSWER] {token[:200]}")
                                        except Exception:
                                            pass
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
                            if not saw_reasoning:
                                try:
                                    logger.warning("[LLM] stream ended with no reasoning_content detected")
                                except Exception:
                                    pass
                            # 检查是否需要解析 ReAct Action 并执行工具
                            if use_local_react and agent_has_tools:
                                action_match = None
                                import re
                                # 解析 Action 和 Action Input
                                action_pattern = r'Action:\s*(\w+)\s*Action Input:\s*(\{[^}]+\})'
                                match = re.search(action_pattern, full_text, re.DOTALL)
                                if match:
                                    tool_name = match.group(1).strip()
                                    try:
                                        tool_input = json.loads(match.group(2).strip())
                                    except:
                                        tool_input = {}

                                    logger.info(f"[ReAct] 检测到工具调用: {tool_name}, 参数: {tool_input}")
                                    yield {"stage": "execute", "delta": f"\n\n[执行工具: {tool_name}]\n", "status": "tool_calling"}

                                    # 查找并执行工具
                                    tool_executed = False
                                    for tool in agent.tools:
                                        # 获取工具名称 - 尝试多种方式
                                        t_name = None
                                        if hasattr(tool, 'name'):
                                            t_name = tool.name

                                        # 从@tool装饰的方法获取名称
                                        if not t_name:
                                            for attr_name in dir(tool):
                                                if not attr_name.startswith('_'):
                                                    try:
                                                        attr = getattr(tool, attr_name)
                                                        if hasattr(attr, 'name'):
                                                            t_name = attr.name
                                                            break
                                                    except:
                                                        continue

                                        if not t_name:
                                            t_name = str(tool)

                                        logger.info(f"[ReAct] 检查工具: {t_name}, 目标: {tool_name}")

                                        # 模糊匹配工具名称（去除下划线等）
                                        normalized_tool_name = tool_name.lower().replace('_', '').replace('-', '')
                                        normalized_t_name = t_name.lower().replace('_', '').replace('-', '')

                                        if normalized_tool_name in normalized_t_name or normalized_t_name in normalized_tool_name:
                                            try:
                                                result = None

                                                # 执行工具 - 尝试多种方式
                                                logger.info(f"[ReAct] 工具类型: {type(tool)}, hasattr(run)={hasattr(tool, 'run')}, callable={callable(tool)}")

                                                if hasattr(tool, 'run'):
                                                    logger.info(f"[ReAct] 使用 tool.run() 执行")
                                                    result = tool.run(**tool_input)
                                                elif callable(tool):
                                                    logger.info(f"[ReAct] 直接调用 tool()")
                                                    result = tool(**tool_input)
                                                else:
                                                    # 尝试调用 @tool 装饰的方法 (Agno的Function对象)
                                                    logger.info(f"[ReAct] 尝试查找@tool装饰的方法")
                                                    for attr_name in dir(tool):
                                                        if not attr_name.startswith('_'):
                                                            try:
                                                                attr = getattr(tool, attr_name)
                                                                # @tool装饰的方法是Function对象,有name和entrypoint属性
                                                                if hasattr(attr, 'name') and hasattr(attr, 'entrypoint'):
                                                                    logger.info(f"[ReAct] 找到Function对象: {attr_name} (name={attr.name})")
                                                                    # 调用entrypoint方法 - 需要绑定self
                                                                    if callable(attr.entrypoint):
                                                                        logger.info(f"[ReAct] 调用entrypoint: {attr_name} with args: {tool_input}")
                                                                        # entrypoint需要self参数,使用tool实例调用
                                                                        result = attr.entrypoint(tool, **tool_input)
                                                                        logger.info(f"[ReAct] 方法执行完成, result类型: {type(result)}, 长度: {len(str(result)) if result else 0}")
                                                                        break
                                                            except Exception as method_error:
                                                                logger.error(f"[ReAct] 方法调用失败 {attr_name}: {method_error}", exc_info=True)
                                                                continue

                                                if result is not None:
                                                    logger.info(f"[ReAct] 工具执行成功: {str(result)[:200]}")

                                                    # 🔥 输出 Observation 到前端
                                                    observation_text = f"\n\nObservation: {result}\n\n"
                                                    full_text += observation_text
                                                    yield {"stage": "execute", "delta": observation_text, "status": "tool_result"}
                                                    tool_executed = True

                                                    # 将包含Observation的消息重新发送给模型，让模型基于搜索结果生成答案
                                                    logger.info(f"[ReAct] 将Observation喂回模型生成最终答案")

                                                    # 构建新的消息列表：
                                                    # 1. 原始消息（system + user）
                                                    # 2. assistant消息（模型生成的Action部分）
                                                    # 3. user消息（Observation - 工具执行结果）
                                                    new_msgs = msgs.copy()
                                                    new_msgs.append({"role": "assistant", "content": full_text})
                                                    new_msgs.append({"role": "user", "content": f"Observation: {result}\n\n基于以上搜索结果，请用中文总结回答用户的问题。"})

                                                    # 重新发起请求生成最终答案
                                                    req_body_final = {"model": model_id, "stream": True, "messages": new_msgs}
                                                    if ctx.inputs.get("temperature") is not None:
                                                        req_body_final["temperature"] = float(ctx.inputs.get("temperature"))
                                                    if ctx.inputs.get("top_p") is not None:
                                                        req_body_final["top_p"] = float(ctx.inputs.get("top_p"))
                                                    if ctx.inputs.get("max_tokens") is not None:
                                                        req_body_final["max_tokens"] = int(ctx.inputs.get("max_tokens"))

                                                    logger.info(f"[ReAct] 重新调用模型，messages数量: {len(new_msgs)}")
                                                    logger.info(f"[ReAct] 倒数第2条消息(assistant): {new_msgs[-2]['content'][:200] if len(new_msgs) >= 2 else 'empty'}")
                                                    logger.info(f"[ReAct] 最后一条消息(user/observation): {new_msgs[-1]['content'][:300] if new_msgs else 'empty'}")

                                                    # 继续调用模型生成最终答案
                                                    # 先推送Final Answer:标记
                                                    final_answer_prefix = "\n\nFinal Answer: "
                                                    full_text += final_answer_prefix
                                                    yield {"stage": "execute", "delta": final_answer_prefix, "status": "answering"}

                                                    async with httpx.AsyncClient(timeout=None) as hc_final:
                                                        resp_final = await hc_final.post(
                                                            f"{gateway_base}/v1/chat/completions",
                                                            json=req_body_final,
                                                            timeout=None
                                                        )
                                                        logger.info(f"[ReAct] 模型响应状态码: {resp_final.status_code}")
                                                        if resp_final.status_code == 200:
                                                            line_count = 0
                                                            async for final_chunk in resp_final.aiter_lines():
                                                                line_count += 1
                                                                if final_chunk:
                                                                    # aiter_lines() 返回字符串，不需要decode
                                                                    final_line = final_chunk if isinstance(final_chunk, str) else final_chunk.decode('utf-8', errors='ignore')
                                                                    logger.debug(f"[ReAct] 收到第{line_count}行: {final_line[:100]}")
                                                                    if final_line.startswith("data: "):
                                                                        final_data_str = final_line[6:]
                                                                        if final_data_str.strip() == "[DONE]":
                                                                            logger.info(f"[ReAct] 收到[DONE]，结束流式响应")
                                                                            break
                                                                        try:
                                                                            final_data = json.loads(final_data_str)
                                                                            final_delta = final_data.get('choices', [{}])[0].get('delta', {}).get('content', '')
                                                                            if final_delta:
                                                                                logger.info(f"[ReAct] 收到delta: {final_delta[:50]}")
                                                                                full_text += final_delta
                                                                                yield {"stage": "execute", "delta": final_delta, "status": "answering"}
                                                                        except Exception as parse_err:
                                                                            logger.warning(f"[ReAct] JSON解析失败: {parse_err}, 数据: {final_data_str[:200]}")
                                                            logger.info(f"[ReAct] 流式响应完成，共处理{line_count}行")
                                                        else:
                                                            logger.error(f"[ReAct] 重新调用模型失败: {resp_final.status_code}")

                                                    break
                                                else:
                                                    logger.error(f"[ReAct] 工具返回None")

                                            except Exception as e:
                                                logger.error(f"[ReAct] 工具执行失败: {e}", exc_info=True)
                                                observation = f"\n\nObservation: 工具执行失败: {e}\n\n"
                                                full_text += observation

                                    if not tool_executed:
                                        logger.warning(f"[ReAct] 未找到匹配的工具: {tool_name}")
                                        # 没有找到工具，按原样返回
                                        # 执行Post-hooks（如敏感信息脱敏）
                                        hook_pipeline = ctx.vars.get('hook_pipeline')
                                        run_id = ctx.inputs.get('run_id')
                                        if full_text:
                                            full_text = await _execute_post_hooks(hook_pipeline, full_text, run_id, ctx)
                                        ctx.outputs["result"] = full_text
                                        yield {"stage": "execute", "result": full_text[:2000], "citations": (ctx.vars.get('citations') or [])}
                                        return

                            # 如果执行了工具，full_text已经包含了最终答案
                            if tool_executed:
                                # 执行Post-hooks（如敏感信息脱敏）
                                hook_pipeline = ctx.vars.get('hook_pipeline')
                                run_id = ctx.inputs.get('run_id')
                                if full_text:
                                    full_text = await _execute_post_hooks(hook_pipeline, full_text, run_id, ctx)
                                ctx.outputs["result"] = full_text
                                yield {"stage": "execute", "result": full_text[:2000], "citations": (ctx.vars.get('citations') or [])}
                                return

                            # 如果没有检测到工具调用，按原样返回
                            # 执行Post-hooks（如敏感信息脱敏）
                            hook_pipeline = ctx.vars.get('hook_pipeline')
                            run_id = ctx.inputs.get('run_id')
                            if full_text:
                                full_text = await _execute_post_hooks(hook_pipeline, full_text, run_id, ctx)
                            ctx.outputs["result"] = full_text
                            yield {"stage": "execute", "result": full_text[:2000], "citations": (ctx.vars.get('citations') or [])}
                            return
                        else:
                            # 非200：回退
                            err = await resp.aread()
                            yield {"stage": "execute", "warning": f"gateway non-200: {resp.status_code}"}
                except Exception as _se:
                    # 流式失败，回退
                    yield {"stage": "execute", "warning": f"stream_failed: {_se}"}

        # 非流式路径：若提供了 model_id，优先走网关的非流式接口；否则回退模型/Agent
        if model_id and (stream_flag is False or stream_flag is None):
            try:
                async with httpx.AsyncClient(timeout=None) as hc:
                    req_body = {"model": model_id, "stream": False, "messages": msgs}
                    # 添加模型参数
                    if ctx.inputs.get("temperature") is not None:
                        req_body["temperature"] = float(ctx.inputs.get("temperature"))
                    if ctx.inputs.get("top_p") is not None:
                        req_body["top_p"] = float(ctx.inputs.get("top_p"))
                    if ctx.inputs.get("max_tokens") is not None:
                        req_body["max_tokens"] = int(ctx.inputs.get("max_tokens"))
                    # 日志：记录实际发送到网关的参数
                    logger.info(f"[LLM-REQ] nonstream model={model_id} max_tokens={req_body.get('max_tokens')} temp={req_body.get('temperature')} top_p={req_body.get('top_p')}")
                    r = await hc.post(f"{gateway_base}/v1/chat/completions", json=req_body)
                    if r.status_code == 200:
                        j = r.json()
                        try:
                            logger.debug(f"[LLM-NONSTREAM] model={model_id} json={json.dumps(j, ensure_ascii=False)[:1000]}")
                        except Exception:
                            pass
                        # 追加：非流式场景也尝试提取 message.reasoning 并先推送一帧“thinking”
                        try:
                            reasoning_enabled = bool(ctx.inputs.get('reasoning_enabled', True))
                            msg0 = (j.get('choices') or [{}])[0].get('message') or {}
                            # 兼容 Qwen：message.reasoning_content
                            reason_obj = msg0.get('reasoning') or msg0.get('reasoning_content')
                            def _flat(x):
                                if x is None:
                                    return ''
                                if isinstance(x, str):
                                    return x
                                if isinstance(x, dict):
                                    if 'content' in x and isinstance(x['content'], str):
                                        return x['content']
                                    if 'text' in x and isinstance(x['text'], str):
                                        return x['text']
                                    if 'content' in x and isinstance(x['content'], list):
                                        return '\n'.join(_flat(i) for i in x['content'])
                                    return ''
                                if isinstance(x, list):
                                    return '\n'.join(_flat(i) for i in x)
                                return str(x)
                            rtxt = _flat(reason_obj).strip()
                            def _looks_like_answer2(txt: str) -> bool:
                                try:
                                    import re
                                    if not txt:
                                        return False
                                    if re.search(r'(^|\n)\s*#{2,}', txt):
                                        return True
                                    if re.search(r'(^|\n)\s*\d+\.', txt):
                                        return True
                                    if re.search(r'(关键要点|结论|总结|可以得出|建议|最终|回答|方案)', txt[:80]):
                                        return True
                                    return False
                                except Exception:
                                    return False
                            if reasoning_enabled and rtxt and not _looks_like_answer2(rtxt):
                                yield {"stage": "execute", "status": "thinking", "content": rtxt, "reasoning": True}
                        except Exception:
                            pass
                        text = j.get('choices', [{}])[0].get('message', {}).get('content', '') or ''
                        try:
                            logger.info(f"[LLM-ANSWER-FULL] {text[:400]}")
                        except Exception:
                            pass
                        # 执行Post-hooks（如敏感信息脱敏）
                        hook_pipeline = ctx.vars.get('hook_pipeline')
                        run_id = ctx.inputs.get('run_id')
                        if text:
                            text = await _execute_post_hooks(hook_pipeline, text, run_id, ctx)
                        ctx.outputs["result"] = text
                        yield {"stage": "execute", "result": text[:2000], "citations": (ctx.vars.get('citations') or [])}
                        return
                    else:
                        # 非200，尝试默认模型回退一次（仅当403 disabled）
                        if r.status_code == 403 and 'disabled' in (r.text or '').lower():
                            try:
                                d = await hc.get(f"{gateway_base}/v1/defaults/simple")
                                if d.status_code == 200:
                                    dj = d.json() or {}
                                    fb = (dj.get('chat') or {}).get('model') or dj.get('default_model')
                                    if fb and fb != model_id:
                                        r2 = await hc.post(f"{gateway_base}/v1/chat/completions", json={"model": fb, "messages": msgs, "stream": False})
                                        if r2.status_code == 200:
                                            j2 = r2.json()
                                            text = j2.get('choices', [{}])[0].get('message', {}).get('content', '') or ''
                                            # 执行Post-hooks（如敏感信息脱敏）
                                            hook_pipeline = ctx.vars.get('hook_pipeline')
                                            run_id = ctx.inputs.get('run_id')
                                            if text:
                                                text = await _execute_post_hooks(hook_pipeline, text, run_id, ctx)
                                            ctx.outputs['result'] = text
                                            yield {"stage": "execute", "result": text[:2000], "citations": (ctx.vars.get('citations') or [])}
                                            return
                            except Exception:
                                pass
                        yield {"stage": "execute", "warning": f"gateway non-stream non-200: {r.status_code}"}
            except Exception as _e:
                yield {"stage": "execute", "warning": f"gateway non-stream failed: {_e}"}

        # 回退路径：不再调用 Agent/Model.invoke，避免签名不兼容
        msg = "模型不可用（已尝试默认模型回退）。请在模型管理中检查该模型的启用状态或更换模型。"
        ctx.outputs['result'] = msg
        yield {"stage": "execute", "error": msg}
    except Exception as e:
        yield {"stage": "execute", "error": str(e)}
        raise


def build_tool_workflow(name: str = "tool_orchestration") -> Workflow:
    """保留的通用 workflow（向后兼容），包含所有步骤"""
    # 调整顺序：先做一次"初始检索"，再做"意图分析"，最后执行。
    # plan 默认跳过，如需可通过 enable_plan 打开
    steps = [step_prepare, step_retrieve, step_intent, step_execute]
    return Workflow(name=name, steps=steps)


async def step_prepare_general(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """通用问答场景的 prepare 步骤（不包含知识检索配置）"""
    agent_name = ctx.inputs.get("agent_name") or "workflow_agent"
    selected_tools = ctx.inputs.get("selected_tools") or []
    model_id = ctx.inputs.get("model_id") or ctx.inputs.get("model")
    model_provider = ctx.inputs.get("model_provider") or ctx.inputs.get("provider")

    run_id = ctx.inputs.get("run_id") or f"wf-{uuid4().hex[:8]}"
    ctx.inputs["run_id"] = run_id
    logger.info(f"[WF][{run_id}] step_prepare_general: agent={agent_name} tools={selected_tools} model={model_id or ''}")
    yield {"stage": "prepare", "agent_name": agent_name, "selected_tools": selected_tools, "run_id": run_id}

    # 通用问答：明确关闭知识检索和图谱
    service = await get_agent_service_v2()
    agent = await service.create_agent_v2(
        agent_name=agent_name,
        selected_tools=selected_tools,
        model_name=model_id,
        model_provider=model_provider,
        search_knowledge=False,  # 明确关闭
        search_graph=False,      # 明确关闭
    )
    if agent is None:
        raise RuntimeError("failed to create agent for workflow")

    # 强制添加本地ReAct工具调用规范到instructions（通用问答场景统一使用本地ReAct模式）
    if hasattr(agent, 'tools') and agent.tools and len(agent.tools) > 0:
        logger.info(f"[WF] 通用问答场景：为 {len(agent.tools)} 个工具添加本地ReAct调用规范")

        # 构建工具说明
        tool_descriptions = []
        for tool in agent.tools:
            tool_name = None
            tool_desc = None

            if hasattr(tool, 'name'):
                tool_name = tool.name
                tool_desc = getattr(tool, 'description', None)

            if not tool_name:
                for attr_name in dir(tool):
                    if attr_name.startswith('_'):
                        continue
                    try:
                        attr = getattr(tool, attr_name, None)
                        if hasattr(attr, 'name'):
                            tool_name = attr.name
                            tool_desc = getattr(attr, 'description', None)
                            break
                    except Exception:
                        continue

            if not tool_name:
                tool_name = getattr(tool, '__name__', tool.__class__.__name__)

            if tool_desc:
                tool_descriptions.append(f"  - {tool_name}: {tool_desc}")
            else:
                tool_descriptions.append(f"  - {tool_name}")

        # 添加工具调用规范到instructions
        react_instructions = "\n\n【可用工具】\n你可以调用以下工具来辅助回答："
        react_instructions += "\n" + "\n".join(tool_descriptions)
        react_instructions += (
            "\n\n【工具调用规范（本地执行）】"
            "\n- 当需要调用工具时，请严格使用以下格式输出调用意图："
            "\n  Action: <工具名>"
            "\n  Action Input: <JSON参数>"
            "\n- 系统将执行该工具，并以 Observation 的形式返回结果。你应根据 Observation 给出最终答案。"
            "\n- 调用示例："
            "\n  Action: baidu_search"
            "\n  Action Input: {\"query\": \"人工智能最新发展\", \"max_results\": 5}"
            "\n\n[搜索工具使用规则]"
            "\n- 当用户明确要求'搜索'、'检索'、'查询'、'查找最新'时，必须调用搜索工具"
            "\n- 当需要查询最新信息、新闻、实时数据时，应该使用搜索工具"
            "\n- 如果凭借已有知识可以回答，则无需搜索"
            "\n- 搜索后请基于搜索结果回答，并适当引用来源"
        )

        # 追加到现有instructions
        current_instructions = agent.instructions
        if isinstance(current_instructions, list):
            current_instructions = '\n'.join(current_instructions)

        new_instructions = current_instructions + react_instructions
        agent.instructions = new_instructions
        logger.info(f"[WF] 已为通用问答场景agent添加本地ReAct规范，instructions总长度: {len(new_instructions)}")

    # 注入模型参数
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

    ctx.vars["tool_configs"] = ctx.inputs.get("tool_configs") or {}
    ctx.vars["agent"] = agent
    ctx.vars["search_knowledge"] = False
    ctx.vars["search_graph"] = False

    # 加载Hook Pipeline（支持Post-hooks）
    pipeline_id = ctx.inputs.get('pipeline_id')
    try:
        if pipeline_id:
            hook_pipeline = await load_pipeline(pipeline_id)
            if not hook_pipeline:
                logger.warning(f"Pipeline加载失败: {pipeline_id}，使用默认Pipeline")
                hook_pipeline = await load_default_pipeline()
        else:
            hook_pipeline = await load_default_pipeline()

        if hook_pipeline:
            logger.info(f"[WF][{run_id}] 加载Hook Pipeline: {hook_pipeline.pipeline_name}")
            ctx.vars['hook_pipeline'] = hook_pipeline
        else:
            logger.warning(f"[WF][{run_id}] 未能加载任何Pipeline")

    except Exception as e:
        logger.error(f"[WF][{run_id}] Hook Pipeline处理异常: {e}")
        # 不中断流程，继续执行

    yield {"stage": "prepare", "status": "ok", "mode": "general"}


async def step_prepare_knowledge(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """知识库检索场景的 prepare 步骤（包含完整知识检索配置）"""
    # 复用原始 step_prepare 的逻辑
    async for event in step_prepare(ctx):
        yield event


async def step_prepare_graph(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """知识图谱检索场景的 prepare 步骤（只配置图谱）"""
    agent_name = ctx.inputs.get("agent_name") or "workflow_agent"
    selected_tools = ctx.inputs.get("selected_tools") or []
    model_id = ctx.inputs.get("model_id") or ctx.inputs.get("model")
    model_provider = ctx.inputs.get("model_provider") or ctx.inputs.get("provider")

    run_id = ctx.inputs.get("run_id") or f"wf-{uuid4().hex[:8]}"
    ctx.inputs["run_id"] = run_id
    logger.info(f"[WF][{run_id}] step_prepare_graph: agent={agent_name} tools={selected_tools} model={model_id or ''}")
    yield {"stage": "prepare", "agent_name": agent_name, "selected_tools": selected_tools, "run_id": run_id}

    # 图谱检索：关闭知识库，开启图谱
    service = await get_agent_service_v2()
    agent = await service.create_agent_v2(
        agent_name=agent_name,
        selected_tools=selected_tools,
        model_name=model_id,
        model_provider=model_provider,
        search_knowledge=False,  # 关闭知识库检索
        search_graph=True,       # 开启图谱检索
    )
    if agent is None:
        raise RuntimeError("failed to create agent for workflow")

    # 注入模型参数
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

    ctx.vars["tool_configs"] = ctx.inputs.get("tool_configs") or {}
    ctx.vars["agent"] = agent
    ctx.vars["search_knowledge"] = False
    ctx.vars["search_graph"] = True
    yield {"stage": "prepare", "status": "ok", "mode": "graph"}


async def step_execute_general(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """通用问答场景的execute步骤
    特点：专注于工具调用（百度搜索、DuckDuckGo等），使用本地ReAct模式
    """
    agent = ctx.vars.get("agent")
    question = ctx.inputs.get("prompt") or "请执行任务。"
    user_text = ctx.inputs.get("custom_prompt") or ""

    # 通用问答场景：不涉及知识库检索
    placeholders = {}
    require_knowledge = False
    auto_tools = bool(ctx.inputs.get("selected_tools"))

    final_prompt = _render_prompt(
        user_text=user_text,
        placeholders=placeholders,
        require_knowledge=require_knowledge,
        auto_tools=auto_tools,
        question=question,
        forbid_not_found=False,
        intent=None,
        summary_prefs={},
    )

    run_id = ctx.inputs.get('run_id')
    logger.info(f"[WF][{run_id}] step_execute_general: 通用问答场景")
    yield {"stage": "execute", "prompt": final_prompt}
    yield {"stage": "execute", "status": "thinking", "content": ""}

    try:
        # 检查agent是否有工具
        agent_has_tools = hasattr(agent, 'tools') and agent.tools and len(agent.tools) > 0

        if not agent_has_tools:
            # 无工具：直接调用模型
            logger.info(f"[WF] 通用问答场景：无工具，直接调用模型")
            yield {"stage": "execute", "status": "answering"}
        else:
            # 有工具：使用本地ReAct模式
            logger.info(f"[WF] 通用问答场景：检测到 {len(agent.tools)} 个工具，使用本地ReAct模式")

        # 组装消息
        msgs = []
        if hasattr(agent, 'instructions') and agent.instructions:
            system_instructions = agent.instructions
            if isinstance(system_instructions, list):
                system_instructions = '\n'.join(system_instructions)
            msgs.append({'role': 'system', 'content': system_instructions})

        # 添加历史消息
        chat_messages = ctx.inputs.get('chat_messages') if isinstance(ctx.inputs.get('chat_messages'), list) else None
        chat_cfg = ctx.inputs.get('chat_config') if isinstance(ctx.inputs.get('chat_config'), dict) else {}
        max_rounds = int(chat_cfg.get('max_rounds') or 0) if chat_cfg else 0

        if chat_messages:
            if max_rounds and len(chat_messages) > max_rounds * 2:
                msgs += chat_messages[-max_rounds*2:]
            else:
                msgs += list(chat_messages)

        # 添加当前用户消息
        msgs.append({'role': 'user', 'content': final_prompt})

        # 获取模型配置
        mdl = getattr(agent, 'model', None)
        model_id = (
            ctx.inputs.get('model_id')
            or ctx.inputs.get('model')
            or getattr(mdl, 'id', None)
        )
        gateway_base = os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050').rstrip('/')

        if not model_id:
            raise RuntimeError("未找到模型ID")

        # 使用流式调用
        async with httpx.AsyncClient(timeout=None) as hc:
            req_body = {"model": model_id, "stream": True, "messages": msgs}
            if ctx.inputs.get("temperature") is not None:
                req_body["temperature"] = float(ctx.inputs.get("temperature"))
            if ctx.inputs.get("top_p") is not None:
                req_body["top_p"] = float(ctx.inputs.get("top_p"))
            if ctx.inputs.get("max_tokens") is not None:
                req_body["max_tokens"] = int(ctx.inputs.get("max_tokens"))

            logger.info(f"[WF][General] 发起流式请求: model={model_id}")

            async with hc.stream("POST", f"{gateway_base}/v1/chat/completions", json=req_body) as resp:
                if resp.status_code != 200:
                    error_msg = f"模型调用失败: HTTP {resp.status_code}"
                    logger.error(f"[WF][General] {error_msg}")
                    ctx.outputs['result'] = error_msg
                    yield {"stage": "execute", "error": error_msg}
                    return

                full_text = ""
                yield {"stage": "execute", "status": "answering"}

                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    raw = line.strip()

                    if raw.startswith(":") or raw == "[DONE]":
                        continue

                    if raw.startswith("data: "):
                        raw = raw[6:].strip()

                    try:
                        obj = json.loads(raw)
                    except Exception:
                        continue

                    choices = obj.get('choices') or []
                    if choices:
                        delta = choices[0].get('delta') or {}
                        token = str((delta.get('content') or '')) if isinstance(delta, dict) else ''

                        if token:
                            full_text += token
                            yield {"stage": "execute", "status": "answering", "delta": token}

                # 检查是否需要解析ReAct Action并执行工具
                if agent_has_tools and full_text:
                    import re
                    action_pattern = r'Action:\s*(\w+)\s*Action Input:\s*(\{[^}]+\})'
                    match = re.search(action_pattern, full_text, re.DOTALL)

                    if match:
                        tool_name = match.group(1).strip()
                        try:
                            tool_input = json.loads(match.group(2).strip())
                        except:
                            tool_input = {}

                        logger.info(f"[WF][General][ReAct] 检测到工具调用: {tool_name}, 参数: {tool_input}")
                        yield {"stage": "execute", "delta": f"\n\n[执行工具: {tool_name}]\n", "status": "tool_calling"}

                        # 查找并执行工具
                        tool_executed = False
                        for tool in agent.tools:
                            t_name = None
                            if hasattr(tool, 'name'):
                                t_name = tool.name

                            if not t_name:
                                for attr_name in dir(tool):
                                    if not attr_name.startswith('_'):
                                        try:
                                            attr = getattr(tool, attr_name)
                                            if hasattr(attr, 'name'):
                                                t_name = attr.name
                                                break
                                        except:
                                            continue

                            if not t_name:
                                t_name = str(tool)

                            # 模糊匹配工具名称
                            normalized_tool_name = tool_name.lower().replace('_', '').replace('-', '')
                            normalized_t_name = t_name.lower().replace('_', '').replace('-', '')

                            if normalized_tool_name in normalized_t_name or normalized_t_name in normalized_tool_name:
                                try:
                                    result = None

                                    if hasattr(tool, 'run'):
                                        logger.info(f"[WF][General][ReAct] 使用 tool.run() 执行")
                                        result = tool.run(**tool_input)
                                    elif callable(tool):
                                        logger.info(f"[WF][General][ReAct] 直接调用 tool()")
                                        result = tool(**tool_input)
                                    else:
                                        # 尝试调用 @tool 装饰的方法
                                        for attr_name in dir(tool):
                                            if not attr_name.startswith('_'):
                                                try:
                                                    attr = getattr(tool, attr_name)
                                                    if hasattr(attr, 'name') and hasattr(attr, 'entrypoint'):
                                                        if callable(attr.entrypoint):
                                                            result = attr.entrypoint(tool, **tool_input)
                                                            break
                                                except Exception as method_error:
                                                    logger.error(f"[WF][General][ReAct] 方法调用失败 {attr_name}: {method_error}")
                                                    continue

                                    if result is not None:
                                        logger.info(f"[WF][General][ReAct] 工具执行成功: {str(result)[:200]}")

                                        # 输出 Observation
                                        observation_text = f"\n\nObservation: {result}\n\n"
                                        full_text += observation_text
                                        yield {"stage": "execute", "delta": observation_text, "status": "tool_result"}
                                        tool_executed = True

                                        # 重新调用模型生成最终答案
                                        logger.info(f"[WF][General][ReAct] 将Observation喂回模型生成最终答案")

                                        new_msgs = msgs.copy()
                                        new_msgs.append({"role": "assistant", "content": full_text})
                                        new_msgs.append({"role": "user", "content": f"Observation: {result}\n\n基于以上搜索结果，请用中文总结回答用户的问题。"})

                                        req_body_final = {"model": model_id, "stream": True, "messages": new_msgs}
                                        if ctx.inputs.get("temperature") is not None:
                                            req_body_final["temperature"] = float(ctx.inputs.get("temperature"))
                                        if ctx.inputs.get("top_p") is not None:
                                            req_body_final["top_p"] = float(ctx.inputs.get("top_p"))
                                        if ctx.inputs.get("max_tokens") is not None:
                                            req_body_final["max_tokens"] = int(ctx.inputs.get("max_tokens"))

                                        final_answer_prefix = "\n\nFinal Answer: "
                                        full_text += final_answer_prefix
                                        yield {"stage": "execute", "delta": final_answer_prefix, "status": "answering"}

                                        async with httpx.AsyncClient(timeout=None) as hc_final:
                                            resp_final = await hc_final.post(
                                                f"{gateway_base}/v1/chat/completions",
                                                json=req_body_final,
                                                timeout=None
                                            )
                                            if resp_final.status_code == 200:
                                                async for final_line in resp_final.aiter_lines():
                                                    if not final_line:
                                                        continue
                                                    final_raw = final_line.strip()
                                                    if final_raw.startswith(":") or final_raw == "[DONE]":
                                                        continue
                                                    if final_raw.startswith("data: "):
                                                        final_raw = final_raw[6:].strip()
                                                    try:
                                                        final_obj = json.loads(final_raw)
                                                        final_choices = final_obj.get('choices') or []
                                                        if final_choices:
                                                            final_delta = final_choices[0].get('delta') or {}
                                                            final_token = str((final_delta.get('content') or ''))
                                                            if final_token:
                                                                full_text += final_token
                                                                yield {"stage": "execute", "status": "answering", "delta": final_token}
                                                    except:
                                                        continue
                                        break
                                except Exception as tool_error:
                                    logger.error(f"[WF][General][ReAct] 工具执行失败: {tool_error}")
                                    yield {"stage": "execute", "warning": f"tool_error: {tool_error}"}
                                    break

                # 执行Post-hooks（如敏感信息脱敏）
                hook_pipeline = ctx.vars.get('hook_pipeline')
                run_id = ctx.inputs.get('run_id')
                if full_text:
                    full_text = await _execute_post_hooks(hook_pipeline, full_text, run_id, ctx)

                ctx.outputs["result"] = full_text
                yield {"stage": "execute", "result": full_text[:2000]}
                return

    except Exception as e:
        logger.error(f"[WF][General] 执行失败: {e}")
        ctx.outputs['result'] = str(e)
        yield {"stage": "execute", "error": str(e)}
        raise


def build_general_qa_workflow(name: str = "general_qa") -> Workflow:
    """通用问答场景 workflow
    适用于：普通对话，不需要知识检索和图谱查询
    步骤：prepare_general → execute_general
    """
    steps = [step_prepare_general, step_execute_general]
    return Workflow(name=name, steps=steps)


def build_knowledge_retrieval_workflow(name: str = "knowledge_retrieval") -> Workflow:
    """知识库检索场景 workflow
    适用于：需要从知识库检索信息的场景
    步骤：prepare_knowledge → retrieve → intent → execute
    """
    steps = [step_prepare_knowledge, step_retrieve, step_intent, step_execute]
    return Workflow(name=name, steps=steps)


def build_graph_retrieval_workflow(name: str = "graph_retrieval") -> Workflow:
    """知识图谱检索场景 workflow
    适用于：需要查询知识图谱的场景
    步骤：prepare_graph → execute（图谱查询集成在 tools 中）
    """
    steps = [step_prepare_graph, step_execute]
    return Workflow(name=name, steps=steps)
