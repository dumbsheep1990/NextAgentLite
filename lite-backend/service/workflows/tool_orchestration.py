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
from service.retrieval_adapter import retrieval_adapter  # 使用支持QA路由的检索适配器
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
        post_results = await hook_pipeline.execute_post_hooks(run_output)

        # 保存执行结果到上下文
        ctx.vars['post_hook_results'] = post_results

        # 记录脱敏等元数据
        if run_output.metadata.get('desensitization'):
            ctx.vars['desensitization_metadata'] = run_output.metadata['desensitization']
            logger.info(f"[WF][{run_id}] Post-hooks脱敏完成: {run_output.metadata['desensitization']}")

        logger.info(f"[WF][{run_id}] Post-hooks执行完成，共{len(post_results)}个")
        return run_output.content

    except Exception as e:
        logger.error(f"[WF][{run_id}] Post-hooks执行异常: {e}")
        # Post-hooks失败不中断输出，返回原始结果
        ctx.vars['post_hook_error'] = str(e)
        return result_text


def _add_react_tool_instructions(agent) -> None:
    """为agent添加本地ReAct工具调用规范到instructions

    此函数提取自step_prepare_general，用于在多个workflow中复用。
    当agent有工具时，会在instructions中添加工具调用规范，指导模型如何使用
    Action/Action Input格式来调用工具。

    Args:
        agent: Agent实例，需要有tools和instructions属性

    Returns:
        None (直接修改agent.instructions)
    """
    if not (hasattr(agent, 'tools') and agent.tools and len(agent.tools) > 0):
        logger.debug("[WF] Agent没有工具或工具为空，跳过添加ReAct规范")
        return

    logger.info(f"[WF] 为Agent添加本地ReAct工具调用规范，共{len(agent.tools)}个工具")

    # 构建工具说明列表
    tool_descriptions = []
    for tool in agent.tools:
        tool_name = _get_tool_name(tool)
        tool_desc = _get_tool_description(tool)

        # 添加到说明列表
        if tool_desc:
            tool_descriptions.append(f"  - {tool_name}: {tool_desc}")
        else:
            tool_descriptions.append(f"  - {tool_name}")

    # 构建完整的ReAct工具调用规范
    react_instructions = "\n\n【可用工具】\n你可以调用以下工具来辅助回答："
    react_instructions += "\n" + "\n".join(tool_descriptions)
    react_instructions += (
        "\n\n【工具调用规范（本地执行）】"
        "\n- 当需要调用工具时，请严格使用以下格式输出调用意图："
        "\n  Action: <工具名>"
        "\n  Action Input: <JSON参数>"
        "\n- 系统将执行该工具，并以 Observation 的形式返回结果。你应根据 Observation 继续思考与后续步骤，直至给出最终答案。"
        "\n- 调用示例："
        "\n  Action: baidu_search"
        "\n  Action Input: {\"query\": \"人工智能最新发展\", \"max_results\": 5}"
        "\n  （系统返回）Observation: <搜索结果>"
        "\n  Final Answer: <基于搜索结果的中文回答>"
    )

    # 针对搜索工具的特殊说明
    has_search_tool = any(
        'search' in str(t).lower() or
        'baidu' in str(t).lower() or
        'duckduckgo' in str(t).lower()
        for t in agent.tools
    )
    if has_search_tool:
        react_instructions += (
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
    logger.info(f"[WF] 已添加本地ReAct规范，instructions总长度: {len(new_instructions)}")


async def _execute_selected_hooks(
    ctx: WorkflowContext,
    run_id: str,
    pre_hook_ids: List[str],
    post_hook_ids: List[str]
) -> AsyncGenerator[Dict[str, Any], None]:
    """直接执行用户选择的Hook列表（不使用Pipeline）

    Args:
        ctx: Workflow上下文
        run_id: 运行ID
        pre_hook_ids: 用户选择的Pre-Hook ID列表
        post_hook_ids: 用户选择的Post-Hook ID列表

    Yields:
        Hook执行事件字典
    """
    from service.hooks.base import RunInput, AgentSession, HookCheckError
    from service.hooks.registry import hook_registry

    if not pre_hook_ids and not post_hook_ids:
        logger.info(f"[WF][{run_id}] 没有选择任何Hook，跳过Hook执行")
        return

    logger.info(f"[WF][{run_id}] 开始执行用户选择的Hooks - Pre: {len(pre_hook_ids)}个, Post: {len(post_hook_ids)}个")

    # 准备Hook输入
    run_input = RunInput(
        input_content=ctx.inputs.get('prompt', ''),
        session_id=ctx.inputs.get('session_id'),
        user_id=ctx.inputs.get('user_id'),
        context={}
    )
    session = AgentSession(
        id=ctx.inputs.get('session_id') or run_id,
        user_id=ctx.inputs.get('user_id'),
        agent_id=ctx.inputs.get('agent_name', 'workflow_agent')
    )

    # 获取Hook注册表
    registry = hook_registry
    hook_results = []

    # 执行Pre-Hooks
    if pre_hook_ids:
        logger.info(f"[WF][{run_id}] 开始执行 {len(pre_hook_ids)} 个Pre-hooks: {pre_hook_ids}")

        try:
            for hook_id in pre_hook_ids:
                try:
                    # 从注册表获取Hook类
                    hook_class = registry.get_pre_hook(hook_id)
                    if not hook_class:
                        logger.warning(f"[WF][{run_id}] Pre-Hook未注册: {hook_id}，跳过")
                        continue

                    # 实例化Hook（使用空配置）
                    hook_config = {"config": {}, "enabled": True, "hook_id": hook_id}
                    hook_instance = hook_class(hook_config)

                    # 准备Hook执行的上下文信息
                    # 🔥 收集智能体配置信息
                    agent = ctx.vars.get('agent')
                    res_probe = ctx.inputs.get("resources") or {}
                    mounted_cid = (res_probe.get("knowledge_collection") or {}).get("collection_id") or ctx.inputs.get("collection_id")

                    agent_config = {
                        'name': ctx.inputs.get('agent_name', 'unknown'),
                        'model': ctx.inputs.get('model_id') or ctx.inputs.get('model'),
                        'provider': ctx.inputs.get('model_provider') or ctx.inputs.get('provider'),
                        'selected_tools': ctx.inputs.get('selected_tools', []),
                        'instructions': agent.instructions if agent and hasattr(agent, 'instructions') else None,
                        'search_knowledge': ctx.vars.get('search_knowledge', False),
                        'search_graph': ctx.vars.get('search_graph', False)
                    }

                    knowledge_config = {
                        'collection_id': mounted_cid,
                        'search_enabled': bool(mounted_cid),
                        'retrieval_mode': ctx.inputs.get('retrieval_mode', 'hybrid')
                    }

                    # 执行Hook
                    import time
                    start_time = time.time()
                    await hook_instance.execute(
                        run_input,
                        session,
                        user_id=ctx.inputs.get('user_id'),
                        debug_mode=ctx.inputs.get('debug_mode', False),
                        agent_config=agent_config,
                        knowledge_config=knowledge_config
                    )
                    execution_time = (time.time() - start_time) * 1000

                    logger.info(f"[WF][{run_id}] Pre-Hook执行成功: {hook_id}, 耗时 {execution_time:.2f}ms")
                    hook_results.append({
                        "hook_id": hook_id,
                        "hook_type": "pre",
                        "status": "success",
                        "execution_time_ms": execution_time
                    })

                except HookCheckError as e:
                    # Hook检查失败，阻断执行，返回友好提示
                    logger.warning(f"[WF][{run_id}] Hook检查阻断: {hook_id}, message={e.message}")

                    # 设置阻断标志到context
                    ctx.vars['hook_blocked'] = True
                    ctx.vars['block_message'] = e.message
                    ctx.vars['block_hook_id'] = hook_id

                    # 🔥 Yield执行阶段的阻断消息（使用execute阶段格式让前端显示）
                    yield {
                        "stage": "execute",
                        "status": "answering",
                        "delta": e.message
                    }

                    # 🔥 Yield完成状态，让前端停止"回答中"显示
                    yield {
                        "stage": "execute",
                        "status": "complete",
                        "blocked": True,
                        "block_reason": str(e.check_trigger) if hasattr(e, 'check_trigger') else 'hook_check_failed',
                        "block_message": e.message
                    }

                    # 不再继续执行后续Hook
                    return

                except Exception as e:
                    logger.error(f"[WF][{run_id}] Pre-Hook执行失败: {hook_id}, error={e}")
                    hook_results.append({
                        "hook_id": hook_id,
                        "hook_type": "pre",
                        "status": "error",
                        "error_message": str(e)
                    })

            # 将Hook执行的上下文注入到ctx
            ctx.vars['hook_context'] = run_input.context
            ctx.vars['retrieval_strategy'] = run_input.context.get('retrieval_strategy')
            ctx.vars['retrieval_config'] = run_input.context.get('retrieval_config')
            ctx.vars['intent'] = run_input.context.get('intent')  # 🔥 统一使用'intent'字段名
            ctx.vars['query_intent'] = run_input.context.get('intent')  # 保留兼容性
            ctx.vars['query_features'] = run_input.context.get('query_features')
            ctx.vars['selected_pre_hooks'] = pre_hook_ids
            ctx.vars['selected_post_hooks'] = post_hook_ids

            logger.info(
                f"[WF][{run_id}] Pre-hooks执行完成，"
                f"intent={run_input.context.get('intent')}, "
                f"策略={run_input.context.get('retrieval_strategy')}"
            )

            # 输出Hook执行事件
            yield {
                "type": "hook_execution",
                "stage": "prepare",
                "phase": "pre",
                "hook_ids": pre_hook_ids,
                "results": hook_results,
                "context": {
                    "retrieval_strategy": run_input.context.get('retrieval_strategy'),
                    "intent": run_input.context.get('intent'),
                    "features": run_input.context.get('query_features')
                }
            }

        except HookCheckError:
            # 重新抛出，让外层处理
            raise
        except Exception as e:
            logger.error(f"[WF][{run_id}] Pre-Hooks执行异常: {e}")
            ctx.vars['hook_error'] = str(e)


async def _add_hook_integration(
    ctx: WorkflowContext,
    run_id: str
) -> AsyncGenerator[Dict[str, Any], None]:
    """为workflow添加Hook集成

    支持两种模式：
    1. 用户直接选择Hook列表（从 selected_pre_hooks/selected_post_hooks）
    2. Pipeline模式（从 pipeline_id，兼容旧方式）

    Args:
        ctx: Workflow上下文
        run_id: 运行ID

    Yields:
        Hook执行事件字典
    """
    # 优先使用用户选择的Hook列表
    selected_pre_hooks = ctx.inputs.get('selected_pre_hooks')
    selected_post_hooks = ctx.inputs.get('selected_post_hooks')

    # 如果用户直接选择了Hook，使用直接执行模式
    if selected_pre_hooks is not None or selected_post_hooks is not None:
        logger.info(f"[WF][{run_id}] 使用用户选择的Hook列表 - pre={selected_pre_hooks}, post={selected_post_hooks}")
        async for event in _execute_selected_hooks(ctx, run_id, selected_pre_hooks or [], selected_post_hooks or []):
            yield event
        return

    # 🔥 没有Hook配置，直接返回，不执行任何Hook
    logger.info(f"[WF][{run_id}] 未配置Hook，跳过Hook执行")
    return


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

    # ========== Hook集成（支持Hook列表和Pipeline两种模式）==========
    # 🔥 新方法：调用统一的Hook集成函数
    try:
        async for hook_event in _add_hook_integration(ctx, run_id):
            yield hook_event
    except Exception as e:
        logger.warning(f"[WF][{run_id}] Hook集成失败（非致命错误）: {e}")

    # 检查是否被Hook阻断
    if ctx.vars.get('hook_blocked'):
        block_message = ctx.vars.get('block_message', '请求已被阻断')
        logger.info(f"[WF][{run_id}] Hook已阻断执行，返回阻断消息给用户: {block_message}")

        # 返回阻断消息给用户（使用和LLM响应相同的格式）
        yield {"stage": "execute", "status": "answering"}
        yield {"stage": "execute", "status": "answering", "delta": block_message}
        yield {"stage": "execute", "status": "complete"}
        return

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
            gateway_base = os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050').rstrip('/')
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


# ========== 工具预执行相关辅助函数 ==========

def _get_tool_name(tool) -> str:
    """获取工具名称

    尝试多种方式获取工具名称：
    1. 直接的name属性
    2. 嵌套属性中的name
    3. 类名或函数名

    Args:
        tool: 工具对象

    Returns:
        工具名称字符串
    """
    tool_name = None

    # 方式1: 直接从工具对象获取name属性
    if hasattr(tool, 'name'):
        tool_name = tool.name

    # 方式2: 检查是否是工具类实例，查找@tool装饰的方法
    if not tool_name:
        for attr_name in dir(tool):
            if attr_name.startswith('_'):
                continue
            try:
                attr = getattr(tool, attr_name, None)
                # @tool装饰的方法是Function对象，有name属性
                if hasattr(attr, 'name'):
                    tool_name = attr.name
                    break
            except Exception:
                continue

    # 方式3: 使用类名或函数名作为fallback
    if not tool_name:
        tool_name = getattr(tool, '__name__', tool.__class__.__name__)

    return tool_name


def _get_tool_description(tool) -> str:
    """获取工具描述

    Args:
        tool: 工具对象

    Returns:
        工具描述字符串，如果没有则返回空字符串
    """
    tool_desc = None

    # 方式1: 直接从工具对象获取description属性
    if hasattr(tool, 'description'):
        tool_desc = tool.description

    # 方式2: 从嵌套属性中查找
    if not tool_desc:
        for attr_name in dir(tool):
            if attr_name.startswith('_'):
                continue
            try:
                attr = getattr(tool, attr_name, None)
                if hasattr(attr, 'description'):
                    tool_desc = attr.description
                    break
            except Exception:
                continue

    return tool_desc or ""


async def _execute_tool(tool_obj, tool_input: Dict[str, Any]):
    """执行单个工具并返回结果

    Args:
        tool_obj: 工具对象
        tool_input: 工具输入参数

    Returns:
        工具执行结果（字符串或字典）
    """
    import asyncio
    import inspect

    result = None

    try:
        # 方式1: 有run方法
        if hasattr(tool_obj, 'run'):
            logger.info(f"[Tool] 使用 tool.run() 执行")
            result = tool_obj.run(**tool_input)
        # 方式2: 直接可调用
        elif callable(tool_obj):
            logger.info(f"[Tool] 直接调用 tool()")
            result = tool_obj(**tool_input)
        # 方式3: Agno的@tool装饰器
        else:
            logger.info(f"[Tool] 尝试查找@tool装饰的方法")
            for attr_name in dir(tool_obj):
                if not attr_name.startswith('_'):
                    try:
                        attr = getattr(tool_obj, attr_name)
                        if hasattr(attr, 'name') and hasattr(attr, 'entrypoint'):
                            logger.info(f"[Tool] 找到Function对象: {attr_name}")
                            if callable(attr.entrypoint):
                                result = attr.entrypoint(tool_obj, **tool_input)
                                break
                    except Exception as e:
                        logger.debug(f"[Tool] 尝试方法 {attr_name} 失败: {e}")
                        continue

        # 处理异步结果
        if result is not None and inspect.iscoroutine(result):
            logger.info(f"[Tool] 等待异步执行...")
            result = await result

        return result

    except Exception as e:
        logger.error(f"[Tool] 工具执行异常: {e}", exc_info=True)
        raise


def _chunk_tool_result(result, tool_name: str, chunk_size: int = 500, tool_display_name: str = None, tool_type: str = None) -> List[Dict[str, Any]]:
    """将工具结果切块以便后续检索和重排序

    Args:
        result: 工具执行结果
        tool_name: 工具名称（内部标识）
        chunk_size: 切块大小（字符数）
        tool_display_name: 工具显示名称（可选）
        tool_type: 工具类型（可选，如：search, api, crawler, database等）

    Returns:
        切块列表，每个chunk包含: content, source, source_type, score, metadata
    """
    import time

    chunks = []

    # 推断工具类型和显示名称
    if not tool_type:
        # 根据工具名称推断类型
        tool_name_lower = tool_name.lower()
        if 'search' in tool_name_lower or 'baidu' in tool_name_lower or 'duckduckgo' in tool_name_lower:
            tool_type = 'search'
        elif 'api' in tool_name_lower or 'http' in tool_name_lower:
            tool_type = 'api'
        elif 'crawler' in tool_name_lower or 'scrape' in tool_name_lower:
            tool_type = 'crawler'
        elif 'database' in tool_name_lower or 'sql' in tool_name_lower:
            tool_type = 'database'
        else:
            tool_type = 'other'

    if not tool_display_name:
        # 生成友好的显示名称
        if 'baidu' in tool_name.lower():
            tool_display_name = '百度搜索'
        elif 'duckduckgo' in tool_name.lower():
            tool_display_name = 'DuckDuckGo搜索'
        elif 'google' in tool_name.lower():
            tool_display_name = 'Google搜索'
        else:
            tool_display_name = tool_name

    # 转换结果为文本
    if isinstance(result, str):
        text = result
    elif isinstance(result, dict):
        # 如果是字典，尝试提取主要内容
        text = result.get('content') or result.get('text') or str(result)
    elif isinstance(result, list):
        # 如果是列表，每个元素作为一个chunk
        for i, item in enumerate(result):
            if isinstance(item, dict):
                content = item.get('content') or item.get('text') or str(item)
                # 尝试提取URL或标题
                url = item.get('url') or item.get('link')
                title = item.get('title') or item.get('name')
            else:
                content = str(item)
                url = None
                title = None

            chunks.append({
                "content": content,
                "source": f"{tool_name}_item_{i+1}",
                "source_type": "tool",
                "score": 1.0,  # 工具结果默认高分
                "metadata": {
                    "tool": tool_name,
                    "tool_display_name": tool_display_name,
                    "tool_type": tool_type,
                    "index": i,
                    "total_results": len(result) if isinstance(result, list) else 1,
                    "url": url,
                    "title": title,
                    "timestamp": time.time()
                }
            })
        return chunks
    else:
        text = str(result)

    # 简单切块（按chunk_size）
    if len(text) <= chunk_size:
        chunks.append({
            "content": text,
            "source": tool_name,
            "source_type": "tool",
            "score": 1.0,
            "metadata": {
                "tool": tool_name,
                "timestamp": time.time()
            }
        })
    else:
        # 按段落或句子切分会更好，这里简化处理
        for i in range(0, len(text), chunk_size):
            chunk_text = text[i:i+chunk_size]
            chunks.append({
                "content": chunk_text,
                "source": f"{tool_name}_chunk_{i//chunk_size + 1}",
                "source_type": "tool",
                "score": 1.0,
                "metadata": {
                    "tool": tool_name,
                    "chunk_index": i//chunk_size,
                    "timestamp": time.time()
                }
            })

    return chunks


async def step_tool_execution(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """工具预执行步骤（在知识库检索之前）

    核心改进: 先调用外部工具获取最新信息，然后与知识库结果进行多路召回

    执行流程:
    1. 检查selected_tools列表
    2. 排除知识库检索工具（后续专门处理）
    3. 预执行外部工具（搜索、API、爬虫等）
    4. 将工具结果切块存储到ctx.vars['tool_chunks']
    """
    run_id = ctx.inputs.get("run_id")
    selected_tools = ctx.inputs.get("selected_tools") or []
    agent = ctx.vars.get("agent")
    user_question = ctx.inputs.get("prompt") or ""

    logger.info(f"[WF][{run_id}] step_tool_execution: selected_tools={selected_tools}")

    # 如果没有选择工具，跳过
    if not selected_tools or not agent:
        yield {"stage": "tool_execution", "status": "skipped", "reason": "no tools selected"}
        return

    # 排除知识库检索相关工具（这些在step_retrieve中处理）
    kb_tool_names = ["knowledge_search", "qa_search", "search_knowledge", "search_qa"]
    tools_to_execute = [t for t in selected_tools if t not in kb_tool_names]

    if not tools_to_execute:
        yield {"stage": "tool_execution", "status": "skipped", "reason": "only kb tools"}
        return

    yield {"stage": "tool_execution", "status": "starting", "tools": tools_to_execute}

    tool_results = {}
    tool_chunks = []

    # 获取agent的工具列表
    agent_tools = []
    if hasattr(agent, 'tools') and agent.tools:
        agent_tools = agent.tools

    # 遍历需要执行的工具
    for tool_name in tools_to_execute:
        try:
            # 🔥 处理工具名称前缀（builtin:, custom:等）
            clean_tool_name = tool_name
            if ':' in tool_name:
                # 去除前缀，如 builtin:baidusearch -> baidusearch
                clean_tool_name = tool_name.split(':', 1)[1]

            # 查找对应的工具对象
            tool_obj = None
            for tool in agent_tools:
                t_name = _get_tool_name(tool)
                # 模糊匹配（去除下划线、连字符，忽略大小写）
                normalized_clean = clean_tool_name.lower().replace('_', '').replace('-', '')
                normalized_t_name = t_name.lower().replace('_', '').replace('-', '')

                if normalized_clean == normalized_t_name or normalized_clean in normalized_t_name or normalized_t_name in normalized_clean:
                    tool_obj = tool
                    logger.info(f"[WF][{run_id}] 工具匹配成功: {tool_name} -> {t_name}")
                    break

            if not tool_obj:
                logger.warning(f"[WF][{run_id}] 未找到工具: {tool_name} (cleaned: {clean_tool_name})")
                yield {"stage": "tool_execution", "tool": tool_name, "status": "not_found"}
                continue

            logger.info(f"[WF][{run_id}] 预执行工具: {tool_name}")
            yield {"stage": "tool_execution", "tool": tool_name, "status": "executing"}

            # 准备工具输入参数（根据工具类型）
            tool_input = {"query": user_question}

            # 如果有工具配置，使用配置的参数
            tool_configs = ctx.vars.get("tool_configs") or {}
            if tool_name in tool_configs:
                tool_input.update(tool_configs[tool_name])

            # 执行工具
            result = await _execute_tool(tool_obj, tool_input)

            if result:
                # 存储原始结果
                tool_results[tool_name] = result

                # 将结果切块
                chunks = _chunk_tool_result(result, tool_name)
                tool_chunks.extend(chunks)

                logger.info(f"[WF][{run_id}] 工具 {tool_name} 执行成功，生成 {len(chunks)} 个chunks")
                yield {
                    "stage": "tool_execution",
                    "tool": tool_name,
                    "status": "completed",
                    "chunks_count": len(chunks),
                    "result_preview": str(result)[:200]
                }
            else:
                logger.warning(f"[WF][{run_id}] 工具 {tool_name} 返回空结果")
                yield {"stage": "tool_execution", "tool": tool_name, "status": "empty_result"}

        except Exception as e:
            logger.error(f"[WF][{run_id}] 工具 {tool_name} 执行失败: {e}", exc_info=True)
            yield {"stage": "tool_execution", "tool": tool_name, "status": "failed", "error": str(e)}

    # 存储到上下文
    ctx.vars['tool_results'] = tool_results
    ctx.vars['tool_chunks'] = tool_chunks

    logger.info(f"[WF][{run_id}] 工具预执行完成: {len(tool_results)} 个工具, {len(tool_chunks)} 个chunks")
    yield {
        "stage": "tool_execution",
        "status": "completed",
        "tools_executed": len(tool_results),
        "total_chunks": len(tool_chunks)
    }


async def step_retrieve(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """Optional retrieval step supporting cross-collection search.
    ctx.inputs may contain:
      resources: { knowledge_collection?: {collection_id}, cross_collections?: [id, ...] }
      top_n: int (optional)
    """
    try:
        run_id = ctx.inputs.get("run_id")

        # 🔥 读取Hook设置的控制标志
        hook_context = ctx.vars.get('hook_context', {})
        skip_retrieval = hook_context.get('skip_retrieval', False)

        # 如果Hook设置了跳过检索，则跳过
        if skip_retrieval:
            intent = ctx.vars.get('intent', 'unknown')
            logger.info(f"[WF][{run_id}] Hook设置跳过检索 (intent={intent})，跳过知识库检索")
            yield {"stage": "retrieve", "status": "skipped", "reason": "hook_skip_retrieval", "intent": intent}
            # 清空检索结果和引用
            ctx.vars['retrieval_results'] = []
            ctx.vars['citations'] = []
            return

        # 若显式关闭知识检索，直接跳过
        if not bool(ctx.inputs.get("search_knowledge", False)) and not bool(ctx.vars.get("search_knowledge", False)):
            yield {"stage": "retrieve", "status": "skipped", "reason": "search_knowledge=false"}
            return

        # ========== Hook路由检索策略集成 ==========
        # 如果Hook已路由检索策略，使用分发器执行检索
        retrieval_strategy = ctx.vars.get('retrieval_strategy')
        retrieval_config = ctx.vars.get('retrieval_config')

        if retrieval_strategy and retrieval_config:
            logger.info(f"[WF][{run_id}] 使用Hook路由的检索策略: {retrieval_strategy}")
            yield {
                "stage": "retrieve",
                "status": "routing",
                "strategy": retrieval_strategy,
                "config": retrieval_config
            }

            try:
                # 使用分发器执行检索
                from service.retrieval_dispatcher import get_retrieval_dispatcher
                dispatcher = get_retrieval_dispatcher()

                # 准备参数
                res = ctx.inputs.get("resources") or {}
                current = (res.get("knowledge_collection") or {}).get("collection_id")
                cross = res.get("cross_collections") or []
                all_cols = []
                if current:
                    all_cols.append(current)
                if isinstance(cross, list):
                    all_cols.extend([str(x) for x in cross if x])
                # 兼容：collection_id fallback
                if not all_cols:
                    direct_cid = ctx.inputs.get("collection_id")
                    if direct_cid:
                        all_cols.append(str(direct_cid))
                # 去重
                all_cols = list(dict.fromkeys(all_cols))

                # 准备过滤器
                filters_in = ctx.inputs.get("filters") or {}
                filters = {}
                if isinstance(filters_in, dict) and isinstance(filters_in.get("metadata_filters"), list):
                    filters["metadata_filters"] = [
                        {'key': f.get('key'), 'op': f.get('op', '='), 'value': f.get('value')}
                        for f in filters_in.get('metadata_filters') if isinstance(f, dict) and f.get('key')
                    ]

                # 分发检索
                query = ctx.inputs.get("prompt") or ""
                results = await dispatcher.dispatch(
                    strategy=retrieval_strategy,
                    query=query,
                    config=retrieval_config,
                    collection_ids=all_cols,
                    filters=filters,
                    run_id=run_id
                )

                logger.info(f"[WF][{run_id}] 检索完成: strategy={retrieval_strategy}, 结果数={len(results)}")

                # 构建检索上下文
                if results:
                    # 拼接检索上下文
                    context_parts = []
                    for i, r in enumerate(results[:50]):  # 限制前50条
                        context_parts.append(
                            f"【{i+1}】{r.title}\n{r.content}"
                        )
                    ctx.vars['retrieval_context'] = "\n\n".join(context_parts)

                    # 构建citations
                    citations = []
                    for i, r in enumerate(results):
                        citations.append({
                            "index": i+1,
                            "title": r.title,
                            "content": r.content,
                            "score": r.score,
                            "combined_score": r.combined_score,
                            "keyword_score": r.keyword_score,
                            "general_score": r.general_score,
                            "domain_score": r.domain_score,
                            "source": r.source,
                            "strategy": retrieval_strategy  # 标记策略来源
                        })
                    ctx.vars['citations'] = citations
                    ctx.vars['search_results'] = results  # 原始结果对象

                    yield {
                        "stage": "retrieve",
                        "status": "completed",
                        "strategy": retrieval_strategy,
                        "hits": len(results),
                        "context_preview": ctx.vars['retrieval_context'][:400],
                        "citations": citations
                    }
                else:
                    yield {
                        "stage": "retrieve",
                        "status": "completed",
                        "strategy": retrieval_strategy,
                        "hits": 0,
                        "warning": "No results found"
                    }

                # ========== 🔥 多路召回：合并工具结果和知识库结果（Hook路由分支） ==========
                try:
                    # 路径1: 获取工具预执行的结果
                    tool_chunks = ctx.vars.get('tool_chunks') or []

                    # 路径2: 将Hook路由检索结果转换为chunks格式
                    kb_chunks = []
                    for i, r in enumerate(results or []):
                        kb_chunks.append({
                            "content": r.content if hasattr(r, 'content') else str(r.get('content', '')),
                            "source": f"kb_doc_{i+1}",
                            "source_type": "knowledge_base",
                            "score": float(r.combined_score if hasattr(r, 'combined_score') else r.get('combined_score', 0.0) or 0.0),
                            "metadata": {
                                "title": r.title if hasattr(r, 'title') else r.get('title', ''),
                                "index": i,
                                "kb_source": r.source if hasattr(r, 'source') else r.get('source', {})
                            }
                        })

                    # 合并多路结果
                    multiway_chunks = tool_chunks + kb_chunks

                    # 存储到上下文
                    ctx.vars['multiway_chunks'] = multiway_chunks
                    ctx.vars['kb_chunks'] = kb_chunks

                    logger.info(f"[WF][{run_id}] Hook路由-多路召回完成: tool_chunks={len(tool_chunks)}, kb_chunks={len(kb_chunks)}, total={len(multiway_chunks)}")

                    if tool_chunks:
                        yield {
                            "stage": "retrieve",
                            "phase": "multiway_recall",
                            "tool_chunks": len(tool_chunks),
                            "kb_chunks": len(kb_chunks),
                            "total_chunks": len(multiway_chunks),
                            "source": "hook_routing"
                        }

                except Exception as e:
                    logger.warning(f"[WF][{run_id}] Hook路由-多路召回处理失败: {e}")

                # Hook路由检索完成，返回（多路召回已执行）
                return

            except Exception as e:
                logger.error(f"[WF][{run_id}] Hook路由检索失败: {e}", exc_info=True)
                yield {
                    "stage": "retrieve",
                    "status": "error",
                    "strategy": retrieval_strategy,
                    "error": str(e)
                }
                # 失败后回退到原有逻辑（继续执行）
                logger.warning(f"[WF][{run_id}] 回退到原有检索逻辑")

        # ========== 原有检索逻辑（向后兼容） ==========
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
                base = os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050').rstrip('/')
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
            # 🔥 使用retrieval_adapter以支持QA路由
            # 获取第一个collection作为knowledge_base_id
            knowledge_base_id = all_cols[0] if all_cols else None

            logger.info(f"[WF][{run_id}] 使用retrieval_adapter进行检索: knowledge_base_id={knowledge_base_id}")

            try:
                search_result = await retrieval_adapter.intelligent_search(
                    query=query,
                    top_k=top_n,
                    filters=filt,
                    collection_id=all_cols[0] if all_cols else None,
                    knowledge_base_id=knowledge_base_id,  # ✅ 传递knowledge_base_id以触发QA路由
                    include_highlights=True,
                    enable_reranking=False,
                    original_query=query
                )

                # 转换IntelligentSearchResult为SearchResult列表
                if search_result and hasattr(search_result, 'results'):
                    # 检查是否来自QA路由
                    if search_result.strategy_used in ('qa_routing', 'qa_routing_enhanced'):
                        logger.info(f"[WF][{run_id}] ✅ QA路由命中! strategy={search_result.strategy_used}")

                    results = search_result.results if isinstance(search_result.results, list) else []
                    # 转换为SearchResult对象
                    from service.hybrid_search_service import SearchResult
                    converted_results = []
                    for r in results:
                        if isinstance(r, dict):
                            # 🔥 保留source信息到metadata中
                            metadata = r.get('metadata', {})
                            if 'source' not in metadata:
                                metadata['source'] = r.get('source', '')

                            # 🔥 修复：正确获取分数字段，避免全部设为0导致阈值过滤清空结果
                            score = float(r.get('score') or r.get('combined_score') or 0.0)
                            general_score = float(r.get('general_score') or score)
                            combined_score = float(r.get('combined_score') or score)

                            converted_results.append(SearchResult(
                                id=r.get('id', ''),
                                title=r.get('question', r.get('title', '')),  # QA路由返回question字段
                                content=r.get('content', ''),
                                score=score,
                                combined_score=combined_score,
                                keyword_score=float(r.get('keyword_score', 0.0)),
                                general_score=general_score,
                                domain_score=float(r.get('domain_score', 0.0)),
                                highlights=r.get('highlights', []),
                                source=metadata
                            ))
                        else:
                            converted_results.append(r)
                    results = converted_results
                else:
                    results = []

            except Exception as e:
                logger.error(f"[WF][{run_id}] retrieval_adapter调用失败: {e}", exc_info=True)
                # 回退到原有hybrid_search
                results = await hybrid_search_service.hybrid_search(
                    query=query,
                    top_k=top_n,
                    filters=filt,
                    collection_id=None,
                    query_vector=query_vector,
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

        # 🔥 如果已经通过QA路由获得结果，跳过progressive retrieval
        skip_progressive = False
        logger.info(f"[WF][{run_id}] 🔍 检查QA路由结果: results数量={len(results) if results else 0}")
        if results:
            # 检查是否是QA路由结果 - 修复：检查source字典中的source字段或from_qa_routing标记
            try:
                logger.info(f"[WF][{run_id}] 🔍 第一个结果类型: {type(results[0])}, hasattr(source)={hasattr(results[0], 'source')}")
                if hasattr(results[0], 'source'):
                    logger.info(f"[WF][{run_id}] 🔍 source类型: {type(results[0].source)}, source内容: {results[0].source}")

                if hasattr(results[0], 'source') and isinstance(results[0].source, dict):
                    from_qa = results[0].source.get('from_qa_routing')
                    source_type = results[0].source.get('source')
                    logger.info(f"[WF][{run_id}] 🔍 from_qa_routing={from_qa}, source={source_type}")

                    # 检查metadata中的标记
                    if from_qa or source_type in ('qa_route', 'qa_dataset'):
                        skip_progressive = True
                        aggregated_results = list(results)  # 🔥 保存QA routing的结果
                        logger.info(f"[WF][{run_id}] ✅ QA路由已返回结果({len(results)}条)，跳过progressive retrieval")
                        logger.info(f"[WF][{run_id}] ✅ aggregated_results已设置，长度={len(aggregated_results)}")
                    else:
                        logger.info(f"[WF][{run_id}] ❌ 不是QA路由结果，继续progressive检索")
            except Exception as e:
                logger.warning(f"[WF][{run_id}] 检查QA路由结果失败: {e}", exc_info=True)

        while not skip_progressive:
            # 执行检索 - 使用retrieval_adapter
            try:
                knowledge_base_id = all_cols[0] if all_cols else None
                search_result = await retrieval_adapter.intelligent_search(
                    query=query,
                    top_k=min(20, top_n + rounds*4),
                    filters=current_filters,
                    collection_id=all_cols[0] if all_cols else None,
                    knowledge_base_id=knowledge_base_id,  # ✅ 传递knowledge_base_id
                    include_highlights=True,
                    enable_reranking=False,
                    original_query=query
                )

                # 转换结果
                if search_result and hasattr(search_result, 'results'):
                    from service.hybrid_search_service import SearchResult
                    converted = []
                    for r in (search_result.results if isinstance(search_result.results, list) else []):
                        if isinstance(r, dict):
                            # 🔥 保留source信息到metadata中
                            metadata = r.get('metadata', {})
                            if 'source' not in metadata:
                                metadata['source'] = r.get('source', '')

                            # 🔥 修复：正确获取分数字段
                            score = float(r.get('score') or r.get('combined_score') or 0.0)
                            general_score = float(r.get('general_score') or score)
                            combined_score = float(r.get('combined_score') or score)

                            converted.append(SearchResult(
                                id=r.get('id', ''),
                                title=r.get('question', r.get('title', '')),
                                content=r.get('content', ''),
                                score=score,
                                combined_score=combined_score,
                                keyword_score=float(r.get('keyword_score', 0.0)),
                                general_score=general_score,
                                domain_score=float(r.get('domain_score', 0.0)),
                                highlights=r.get('highlights', []),
                                source=metadata
                            ))
                        else:
                            converted.append(r)
                    results = converted
                    if results:
                        aggregated_results = results
                else:
                    results = []
            except Exception as e:
                logger.warning(f"[WF][{run_id}] retrieval_adapter失败，回退hybrid_search: {e}")
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

        logger.info(f"[WF][{run_id}] 🔍 Progressive检索结束: skip_progressive={skip_progressive}, aggregated_results长度={len(aggregated_results) if aggregated_results else 0}")
        results = aggregated_results
        logger.info(f"[WF][{run_id}] 🔍 赋值后results长度={len(results) if results else 0}")

        # 🔥 检查是否是QA路由结果，如果是则跳过rerank和阈值过滤
        is_qa_routing_result = False
        if results and hasattr(results[0], 'source') and isinstance(results[0].source, dict):
            is_qa_routing_result = results[0].source.get('from_qa_routing', False)

        logger.info(f"[WF][{run_id}] 🔍 is_qa_routing_result={is_qa_routing_result}")

        # rerank（普通检索场景）- QA路由结果跳过
        if not is_qa_routing_result:
            try:
                search_cfg = ((ctx.inputs.get('filters') or {}).get('search') or {}) if isinstance(ctx.inputs.get('filters'), dict) else {}
                enable_reranking = bool(search_cfg.get('enable_reranking', True))
            except Exception:
                enable_reranking = True
            if (retrieval_mode != 'summary_full') and enable_reranking and results:
                try:
                    logger.info(f"[WF][{run_id}] 🔍 执行rerank前results长度={len(results)}")
                    results = await hybrid_search_service.rerank_results(query, results)
                    logger.info(f"[WF][{run_id}] 🔍 执行rerank后results长度={len(results)}")
                except Exception as _re:
                    logger.warning(f"[WF][{run_id}] rerank skipped: {_re}")
        else:
            logger.info(f"[WF][{run_id}] ✅ QA路由结果跳过rerank")

        # 阈值过滤（前端 sim_threshold 传入 0-1）- QA路由结果跳过
        sim_threshold = None
        try:
            sim_threshold = float(ctx.inputs.get("sim_threshold"))
        except Exception:
            sim_threshold = None

        if not is_qa_routing_result and sim_threshold is not None and results:
            logger.info(f"[WF][{run_id}] 🔍 执行阈值过滤: sim_threshold={sim_threshold}, results长度={len(results)}")
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
            before_filter = len(results)
            results = [r for r in results if _th_score(r) >= sim_threshold]
            logger.info(f"[WF][{run_id}] 🔍 阈值过滤后: {before_filter} -> {len(results)}")
        elif is_qa_routing_result:
            logger.info(f"[WF][{run_id}] ✅ QA路由结果跳过阈值过滤")

        snippets = []
        logger.info(f"[WF][{run_id}] 🔍 开始构建snippets: results长度={len(results or [])}, top_n={top_n}")
        for idx, r in enumerate((results or [])[:top_n]):
            title = (getattr(r, 'title', None) or r.source.get('title') if hasattr(r, 'source') else '') or ''
            content = getattr(r, 'content', None) or r.source.get('content') if hasattr(r, 'source') else ''
            logger.info(f"[WF][{run_id}] 🔍 Result[{idx}]: title={title[:50] if title else 'None'}, content={content[:50] if content else 'None'}")

            # 🔥 修复：处理content为None的情况
            if content is None:
                content = ''

            if title:
                snippets.append(f"【{title}】\n{str(content)[:500]}")
            else:
                snippets.append(str(content)[:500])
        logger.info(f"[WF][{run_id}] 🔍 snippets构建完成: {len(snippets)}个")
        context_text = "\n\n".join(snippets)
        logger.info(f"[WF][{run_id}] 🔍 context_text长度={len(context_text)}")
        ctx.vars["retrieval_context"] = context_text
        # 🔥 保存原始results列表，供step_execute检查是否是manual_custom QA
        ctx.vars["retrieval_results"] = results or []
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

        # ========== 🔥 多路召回：合并工具结果和知识库结果 ==========
        try:
            run_id = ctx.inputs.get("run_id")

            # 路径1: 获取工具预执行的结果
            tool_chunks = ctx.vars.get('tool_chunks') or []

            # 路径2: 将知识库检索结果转换为chunks格式
            kb_chunks = []
            for i, r in enumerate(results or []):
                kb_chunks.append({
                    "content": getattr(r, 'content', '') or '',
                    "source": f"kb_doc_{i+1}",
                    "source_type": "knowledge_base",
                    "score": float(getattr(r, 'combined_score', 0.0) or getattr(r, 'score', 0.0) or 0.0),
                    "metadata": {
                        "title": getattr(r, 'title', ''),
                        "index": i,
                        "kb_source": getattr(r, 'source', {})
                    }
                })

            # 合并多路结果
            multiway_chunks = tool_chunks + kb_chunks

            # 存储到上下文
            ctx.vars['multiway_chunks'] = multiway_chunks
            ctx.vars['kb_chunks'] = kb_chunks

            logger.info(f"[WF][{run_id}] 多路召回完成: tool_chunks={len(tool_chunks)}, kb_chunks={len(kb_chunks)}, total={len(multiway_chunks)}")

            if tool_chunks:
                yield {
                    "stage": "retrieve",
                    "phase": "multiway_recall",
                    "tool_chunks": len(tool_chunks),
                    "kb_chunks": len(kb_chunks),
                    "total_chunks": len(multiway_chunks)
                }

        except Exception as e:
            logger.warning(f"[WF][{run_id}] 多路召回处理失败: {e}")

    except Exception as e:
        yield {"stage": "retrieve", "warning": str(e)}


async def step_rerank(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """重排序步骤：对多路召回的结果进行统一打分排序

    核心改进: 使用Rerank模型对工具结果和知识库结果统一评分，选择Top-K

    执行流程:
    1. 获取multiway_chunks（工具结果 + 知识库结果）
    2. 调用Rerank模型打分
    3. 按分数排序，选择Top-K
    4. 重新构建retrieval_context和citations
    """
    run_id = ctx.inputs.get("run_id")
    query = ctx.inputs.get("prompt") or ""
    multiway_chunks = ctx.vars.get('multiway_chunks') or []

    # 如果没有多路结果，或者只有知识库结果（没有工具结果），跳过重排序
    tool_chunks = ctx.vars.get('tool_chunks') or []
    if not multiway_chunks or not tool_chunks:
        logger.info(f"[WF][{run_id}] step_rerank: 跳过（无多路结果或仅知识库结果）")
        yield {"stage": "rerank", "status": "skipped", "reason": "no multiway results or tool results"}
        return

    logger.info(f"[WF][{run_id}] step_rerank: 开始重排序, candidates={len(multiway_chunks)}")
    yield {"stage": "rerank", "status": "processing", "candidates": len(multiway_chunks)}

    try:
        # 调用重排序服务
        from service.rerank_service import rerank_service

        # 准备文本列表
        documents = [c["content"] for c in multiway_chunks]

        # 执行重排序
        try:
            rerank_result = await rerank_service.rerank(
                query=query,
                documents=documents,
                provider="alibaba_bailian",
                model="gte-rerank-v2",
                top_k=10
            )

            # 将分数映射回chunks
            reranked_chunks = []
            for doc in rerank_result.documents:
                chunk = multiway_chunks[doc.index].copy()
                chunk["rerank_score"] = doc.score
                reranked_chunks.append(chunk)

            logger.info(f"[WF][{run_id}] 重排序完成: top_k={len(reranked_chunks)}, model={rerank_result.model_used}")

        except Exception as e:
            logger.warning(f"[WF][{run_id}] Rerank调用失败: {e}，使用原始分数排序")
            # 降级：使用原始分数排序
            multiway_chunks.sort(key=lambda x: x.get("score", 0.0), reverse=True)
            reranked_chunks = multiway_chunks[:10]
            for i, chunk in enumerate(reranked_chunks):
                chunk["rerank_score"] = chunk.get("score", 0.0)

        # 构建最终检索上下文（重新生成retrieval_context）
        context_parts = []
        new_citations = []

        for i, chunk in enumerate(reranked_chunks):
            source_label = chunk.get("source", "unknown")
            source_type = chunk.get("source_type", "tool")
            content = chunk.get("content", "")
            metadata = chunk.get("metadata", {})

            # 格式化上下文
            if source_type == "tool":
                # 使用工具的友好显示名称
                tool_display_name = metadata.get('tool_display_name') or metadata.get('tool', source_label)
                context_parts.append(
                    f"【{i+1}】[工具结果: {tool_display_name}]\n{content}"
                )
            else:
                title = metadata.get("title", "")
                context_parts.append(
                    f"【{i+1}】{title}\n{content}"
                )

            # 构建新的citation（增强版）
            if source_type == "tool":
                # 工具来源的citation
                tool_display_name = metadata.get('tool_display_name') or metadata.get('tool', source_label)
                tool_type = metadata.get('tool_type', 'other')
                citation_title = f"[{tool_display_name}]"
                if metadata.get('title'):
                    citation_title += f" {metadata.get('title')}"

                new_citations.append({
                    "index": i+1,
                    "title": citation_title,
                    "content": content,
                    "score": chunk.get("score", 0.0),
                    "rerank_score": chunk.get("rerank_score", 0.0),
                    "source": source_label,
                    "source_type": source_type,
                    "tool_type": tool_type,
                    "tool_display_name": tool_display_name,
                    "url": metadata.get('url', ''),
                    "metadata": metadata
                })
            else:
                # 知识库来源的citation
                new_citations.append({
                    "index": i+1,
                    "title": metadata.get("title", source_label),
                    "content": content,
                    "score": chunk.get("score", 0.0),
                    "rerank_score": chunk.get("rerank_score", 0.0),
                    "source": source_label,
                    "source_type": source_type,
                    "metadata": metadata
                })

        # 更新检索上下文
        new_retrieval_context = "\n\n".join(context_parts)
        ctx.vars['retrieval_context'] = new_retrieval_context
        ctx.vars['citations'] = new_citations
        ctx.vars['reranked_chunks'] = reranked_chunks

        logger.info(f"[WF][{run_id}] 重排序后上下文已更新: {len(reranked_chunks)}个chunks, context长度={len(new_retrieval_context)}")

        # 统计来源分布（按工具类型分类）
        tool_count = sum(1 for c in reranked_chunks if c.get("source_type") == "tool")
        kb_count = sum(1 for c in reranked_chunks if c.get("source_type") == "knowledge_base")

        # 统计工具类型分布
        tool_type_stats = {}
        tool_name_stats = {}
        for c in reranked_chunks:
            if c.get("source_type") == "tool":
                metadata = c.get("metadata", {})
                tool_type = metadata.get('tool_type', 'other')
                tool_display_name = metadata.get('tool_display_name') or metadata.get('tool', 'unknown')

                # 按工具类型统计
                tool_type_stats[tool_type] = tool_type_stats.get(tool_type, 0) + 1

                # 按工具名称统计
                tool_name_stats[tool_display_name] = tool_name_stats.get(tool_display_name, 0) + 1

        # 生成工具集成摘要
        tool_summary_parts = []
        if tool_name_stats:
            for tool_name, count in tool_name_stats.items():
                tool_summary_parts.append(f"{tool_name}({count}条)")

        tool_integration_summary = " | ".join(tool_summary_parts) if tool_summary_parts else ""

        # 保存工具摘要到上下文（供后续输出使用）
        ctx.vars['tool_integration_summary'] = tool_integration_summary
        ctx.vars['tool_type_stats'] = tool_type_stats
        ctx.vars['tool_name_stats'] = tool_name_stats

        yield {
            "stage": "rerank",
            "status": "completed",
            "top_k": len(reranked_chunks),
            "sources": {
                "tool": tool_count,
                "knowledge_base": kb_count
            },
            "tool_type_stats": tool_type_stats,
            "tool_name_stats": tool_name_stats,
            "tool_integration_summary": tool_integration_summary,
            "context_preview": new_retrieval_context[:400]
        }

    except Exception as e:
        logger.error(f"[WF][{run_id}] 重排序步骤异常: {e}", exc_info=True)
        yield {"stage": "rerank", "status": "error", "error": str(e)}


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
    # 🔥 检查Hook是否阻断了执行
    run_id = ctx.inputs.get('run_id', '')
    if ctx.vars.get('hook_blocked'):
        logger.info(f"[WF][{run_id}] 检测到Hook阻断标志，跳过execute步骤")
        return

    # 🔥 读取Hook设置的控制标志
    hook_context = ctx.vars.get('hook_context', {})
    direct_answer = hook_context.get('direct_answer', False)
    answer_prompt = hook_context.get('answer_prompt')

    # 如果Hook设置了直接回答模式，使用LLM生成回复
    if direct_answer and answer_prompt:
        intent = ctx.vars.get('intent', 'unknown')
        logger.info(f"[WF][{run_id}] Hook设置直接回答模式 (intent={intent})，使用LLM生成回复")

        # 清空citations，避免显示参考来源
        ctx.vars['citations'] = []

        agent = ctx.vars.get("agent")
        question = ctx.inputs.get("prompt") or "你好"

        # 使用Hook提供的prompt
        direct_prompt = answer_prompt

        # 使用LLM生成回复
        msgs = []
        if hasattr(agent, 'instructions') and agent.instructions:
            system_instructions = agent.instructions
            if isinstance(system_instructions, list):
                system_instructions = '\n'.join(system_instructions)
            msgs.append({'role': 'system', 'content': system_instructions})

        msgs.append({'role': 'user', 'content': direct_prompt})

        # 获取智能体配置的模型
        mdl = getattr(agent, 'model', None)
        model_id = (
            ctx.inputs.get('model_id')
            or ctx.inputs.get('model')
            or getattr(mdl, 'id', None)
            or 'Qwen/Qwen2.5-7B-Instruct'
        )

        gateway_base = os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050').rstrip('/')

        logger.info(f"[WF][{run_id}] 直接回答模式：准备调用LLM，model={model_id}, gateway={gateway_base}")
        logger.info(f"[WF][{run_id}] 直接回答模式：messages数量={len(msgs)}")

        yield {"stage": "execute", "status": "answering"}

        try:
            logger.info(f"[WF][{run_id}] 直接回答模式：开始HTTP请求")
            async with httpx.AsyncClient(timeout=30) as hc:
                req_body = {
                    "model": model_id,
                    "stream": True,
                    "messages": msgs,
                    "temperature": 0.7,
                    "max_tokens": 200
                }

                async with hc.stream("POST", f"{gateway_base}/v1/chat/completions", json=req_body) as resp:
                    resp.raise_for_status()  # 失败就抛出异常

                    full_text = ""
                    async for line in resp.aiter_lines():
                        if not line or line.startswith(":") or line == "[DONE]":
                            continue

                        raw = line.strip()
                        if raw.startswith("data: "):
                            raw = raw[6:].strip()

                        try:
                            obj = json.loads(raw)
                            choices = obj.get('choices') or []
                            if choices:
                                delta = choices[0].get('delta') or {}
                                token = str(delta.get('content') or '')
                                if token:
                                    full_text += token
                                    yield {"stage": "execute", "status": "answering", "delta": token}
                        except:
                            continue

                    ctx.outputs['result'] = full_text
        except Exception as e:
            logger.error(f"[WF][{run_id}] 直接回答LLM调用失败: {e}")
            raise  # 直接抛出异常，不fallback

        yield {"stage": "execute", "status": "complete"}
        return

    agent = ctx.vars.get("agent")
    question = ctx.inputs.get("prompt") or "请执行任务。"
    user_text = ctx.inputs.get("custom_prompt") or ""

    # 🔥 检查是否是manual_custom的QA路由结果
    retrieval_results = ctx.vars.get('retrieval_results', [])

    # 🔍 调试日志：查看retrieval_results状态
    logger.info(f"[WF][{run_id}] step_execute开始 - retrieval_results数量={len(retrieval_results)}")
    if retrieval_results:
        logger.info(f"[WF][{run_id}] 第一个结果类型: {type(retrieval_results[0])}")
        logger.info(f"[WF][{run_id}] 第一个结果属性: {dir(retrieval_results[0]) if hasattr(retrieval_results[0], '__dict__') else 'N/A'}")
        if hasattr(retrieval_results[0], 'source'):
            logger.info(f"[WF][{run_id}] source内容: {retrieval_results[0].source}")

    if retrieval_results:
        # 检查第一个结果是否是manual_custom的QA
        first_result = retrieval_results[0]
        if hasattr(first_result, 'source') and isinstance(first_result.source, dict):
            from_qa_routing = first_result.source.get('from_qa_routing', False)
            dataset_tag = first_result.source.get('dataset_tag', '')

            logger.info(f"[WF][{run_id}] 检查QA路由: from_qa_routing={from_qa_routing}, dataset_tag={dataset_tag}")

            if from_qa_routing and dataset_tag == 'manual_custom':
                # 检查是否启用了增强功能（KB路由或工具调用）
                enable_kb_routing = first_result.source.get('enable_kb_routing', False)
                enable_tool_call = first_result.source.get('enable_tool_call', False)

                logger.info(f"[WF][{run_id}] manual_custom增强配置: enable_kb_routing={enable_kb_routing}, enable_tool_call={enable_tool_call}")

                # 只有纯粹的manual_custom（没有增强功能）才直接返回答案
                if not enable_kb_routing and not enable_tool_call:
                    # 直接返回自定义QA的答案，不调用LLM
                    answer = getattr(first_result, 'content', '') or ''
                    question_text = getattr(first_result, 'title', '') or ''

                    logger.info(f"[WF][{run_id}] ✅ 纯manual_custom QA，直接返回答案: {answer[:100]}")

                    ctx.outputs["result"] = answer
                    yield {
                        "stage": "execute",
                        "result": answer,
                        "citations": (ctx.vars.get('citations') or []),
                        "qa_direct_answer": True,
                        "matched_question": question_text
                    }
                    return
                else:
                    # 有增强功能，需要特殊处理
                    logger.info(f"[WF][{run_id}] ⚙️ manual_custom有增强功能")

                    # 🔥 如果启用了工具调用，主动调用工具并直接返回结果
                    if enable_tool_call:
                        tool_names = first_result.source.get('tool_names', [])
                        tool_params_dict = first_result.source.get('tool_params', {})
                        qa_answer = getattr(first_result, 'content', '') or ''
                        question_text = getattr(first_result, 'title', '') or ''

                        logger.info(f"[WF][{run_id}] 🔧 开始调用绑定的工具: {tool_names}")
                        logger.info(f"[WF][{run_id}] 🔧 工具参数: {tool_params_dict}")

                        # 调用工具并获取结果
                        tool_results = []
                        try:
                            for tool_name in tool_names:
                                # 获取该工具的参数
                                tool_params = tool_params_dict.get(tool_name, tool_params_dict) if isinstance(tool_params_dict, dict) else {}

                                logger.info(f"[WF][{run_id}] 🔧 调用工具 {tool_name}，参数: {tool_params}")

                                # 🔥 根据工具名称调用对应的工具
                                result = None
                                if tool_name in ('builtin:baidu', 'baidu_search'):
                                    # 调用百度搜索工具 - 直接调用底层搜索库
                                    query = tool_params.get('query', '')
                                    max_results = tool_params.get('max_results', 5)
                                    language = tool_params.get('language', 'zh')

                                    try:
                                        from baidusearch.baidusearch import search
                                        # 执行搜索
                                        search_count = max_results * 2  # 多搜索一些，用于过滤
                                        search_results = search(query, num_results=search_count, debug=0)

                                        if search_results:
                                            # 格式化结果
                                            formatted_results = []
                                            for idx, res in enumerate(search_results[:max_results], 1):
                                                title = res.get("title", "无标题")
                                                url = res.get("url", "")
                                                abstract = res.get("abstract", "")
                                                formatted_results.append(
                                                    f"[{idx}] {title}\n"
                                                    f"链接: {url}\n"
                                                    f"摘要: {abstract}\n"
                                                )
                                            result = f"百度搜索结果 (共{len(formatted_results)}条):\n\n" + "\n".join(formatted_results)
                                        else:
                                            result = f"未找到关于 '{query}' 的相关结果。"
                                    except ImportError:
                                        result = "百度搜索功能未安装，请运行: pip install -U baidusearch"
                                    except Exception as e:
                                        result = f"百度搜索出错: {str(e)}"
                                else:
                                    logger.warning(f"[WF][{run_id}] ⚠️ 未知工具: {tool_name}")
                                    continue

                                if result:
                                    tool_results.append({
                                        'tool_name': tool_name,
                                        'params': tool_params,
                                        'result': result
                                    })
                                    logger.info(f"[WF][{run_id}] ✅ 工具 {tool_name} 调用成功: {str(result)[:200]}")

                        except Exception as tool_error:
                            logger.error(f"[WF][{run_id}] ❌ 工具调用失败: {tool_error}", exc_info=True)

                        # 🔥 直接返回：QA答案 + 工具结果，不调用LLM
                        final_answer = qa_answer
                        if tool_results:
                            final_answer += "\n\n【相关信息】\n"
                            for tr in tool_results:
                                final_answer += f"\n{tr['result']}\n"

                        logger.info(f"[WF][{run_id}] ✅ 直接返回QA答案+工具结果，不调用LLM")

                        ctx.outputs["result"] = final_answer
                        yield {
                            "stage": "execute",
                            "result": final_answer,
                            "citations": (ctx.vars.get('citations') or []),
                            "qa_direct_answer": True,
                            "matched_question": question_text,
                            "tool_called": True,
                            "tool_results": tool_results
                        }
                        return

                    # 🔥 如果启用了KB路由，继续正常流程（会调用LLM整合）
                    # 这里不return，让代码继续往下执行
                    logger.info(f"[WF][{run_id}] ⚙️ manual_custom+KB路由，继续正常流程")

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

    # 不再在提示中注入"来源清单"文本，避免模型在正文中重复输出纯数字清单

    # 🔥 检查并执行政策元数据渲染Hook（在LLM回答前渲染元数据表格）
    selected_post_hooks = ctx.vars.get('selected_post_hooks', [])
    if 'policy_metadata_renderer' in selected_post_hooks:
        logger.info(f"[WF][{run_id}] 检测到政策元数据渲染Hook，准备执行")
        try:
            # 导入元数据渲染Hook
            from service.hooks.post_hooks.policy_metadata_renderer import PolicyMetadataRendererHook

            # 创建Hook实例
            renderer_hook = PolicyMetadataRendererHook(config={'config': {}})

            # 创建RunInput（用于Hook执行）
            from service.hooks.base import RunInput, AgentSession
            run_input = RunInput(input_content=question)
            run_input.context = ctx.vars.get('hook_context', {})

            # 执行渲染Hook，传递检索结果
            metadata_table = await renderer_hook.execute(
                run_input=run_input,
                session=AgentSession(
                    session_id=ctx.inputs.get('session_id', ''),
                    user_id=ctx.inputs.get('user_id', '')
                ),
                retrieval_results=retrieval_results  # 传递检索结果
            )

            # 如果渲染成功，将表格插入到knowledge的前面
            if metadata_table:
                logger.info(f"[WF][{run_id}] 成功渲染政策元数据表格，长度={len(metadata_table)}")
                current_knowledge = placeholders.get('knowledge', '')
                placeholders['knowledge'] = metadata_table + '\n\n' + current_knowledge
            else:
                logger.debug(f"[WF][{run_id}] 未渲染元数据表格（可能无元数据）")
        except Exception as e:
            logger.error(f"[WF][{run_id}] 执行政策元数据渲染Hook失败: {e}", exc_info=True)

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
        # 若强制需要资料且当前无任何检索上下文，直接返回"未找到相关资料"避免胡编
        if require_knowledge and not (placeholders.get("knowledge") or "").strip():
            ctx.outputs["result"] = "未找到相关资料。请先完善知识库或调整检索条件后再试。"
            yield {
                "stage": "execute",
                "result": ctx.outputs["result"],
                "citations": (ctx.vars.get('citations') or []),
                "tool_integration_summary": ctx.vars.get('tool_integration_summary', ''),
                "tool_type_stats": ctx.vars.get('tool_type_stats', {}),
                "tool_name_stats": ctx.vars.get('tool_name_stats', {})
            }
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

                        # 输出Post-hook执行事件
                        post_results = ctx.vars.get('post_hook_results', [])
                        if post_results and hook_pipeline:
                            yield {
                                "type": "hook_execution",
                                "stage": "execute",
                                "phase": "post",
                                "pipeline_id": hook_pipeline.pipeline_id,
                                "pipeline_name": hook_pipeline.pipeline_name,
                                "results": [
                                    {
                                        "hook_id": r.hook_id,
                                        "hook_type": r.hook_type.value,
                                        "status": r.status.value,
                                        "execution_time_ms": r.execution_time_ms,
                                        "error_message": r.error_message
                                    }
                                    for r in post_results
                                ]
                            }

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
        gateway_base = os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050').rstrip('/')
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
                                yield {
                                    "stage": "execute",
                                    "result": text[:2000],
                                    "citations": (ctx.vars.get('citations') or []),
                                    "tool_integration_summary": ctx.vars.get('tool_integration_summary', ''),
                                    "tool_type_stats": ctx.vars.get('tool_type_stats', {}),
                                    "tool_name_stats": ctx.vars.get('tool_name_stats', {})
                                }
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
                                                import asyncio
                                                import inspect

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

                                                # 处理异步协程
                                                if result is not None and inspect.iscoroutine(result):
                                                    logger.info(f"[ReAct] 检测到协程，等待执行...")
                                                    result = await result
                                                    logger.info(f"[ReAct] 协程执行完成, result类型: {type(result)}")

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

                                                    # 🔥 修复：使用stream模式发起请求，确保流式输出
                                                    async with httpx.AsyncClient(timeout=None) as hc_final:
                                                        async with hc_final.stream(
                                                            "POST",
                                                            f"{gateway_base}/v1/chat/completions",
                                                            json=req_body_final,
                                                            timeout=None
                                                        ) as resp_final:
                                                            logger.info(f"[ReAct] 模型响应状态码: {resp_final.status_code}")
                                                            if resp_final.status_code == 200:
                                                                line_count = 0
                                                                async for final_line in resp_final.aiter_lines():
                                                                    line_count += 1
                                                                    if not final_line:
                                                                        continue

                                                                    # 处理SSE数据行
                                                                    final_raw = final_line.strip()

                                                                    # 跳过注释行和空行
                                                                    if final_raw.startswith(":") or not final_raw:
                                                                        continue

                                                                    # 提取data:后的内容
                                                                    if final_raw.startswith("data: "):
                                                                        final_data_str = final_raw[6:].strip()

                                                                        # 检测结束标记
                                                                        if final_data_str == "[DONE]":
                                                                            logger.info(f"[ReAct] 收到[DONE]，结束流式响应")
                                                                            break

                                                                        # 解析JSON并提取delta
                                                                        try:
                                                                            final_data = json.loads(final_data_str)
                                                                            final_delta = final_data.get('choices', [{}])[0].get('delta', {}).get('content', '')
                                                                            if final_delta:
                                                                                logger.info(f"[ReAct] 收到delta: {final_delta[:50]}")
                                                                                full_text += final_delta
                                                                                yield {"stage": "execute", "delta": final_delta, "status": "answering"}
                                                                        except json.JSONDecodeError as parse_err:
                                                                            logger.warning(f"[ReAct] JSON解析失败: {parse_err}, 数据: {final_data_str[:200]}")
                                                                        except Exception as e:
                                                                            logger.warning(f"[ReAct] 处理响应失败: {e}")

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
                                        yield {
                                            "stage": "execute",
                                            "result": full_text[:2000],
                                            "citations": (ctx.vars.get('citations') or []),
                                            "tool_integration_summary": ctx.vars.get('tool_integration_summary', ''),
                                            "tool_type_stats": ctx.vars.get('tool_type_stats', {}),
                                            "tool_name_stats": ctx.vars.get('tool_name_stats', {})
                                        }
                                        return

                            # 如果执行了工具，full_text已经包含了最终答案
                            if tool_executed:
                                # 执行Post-hooks（如敏感信息脱敏）
                                hook_pipeline = ctx.vars.get('hook_pipeline')
                                run_id = ctx.inputs.get('run_id')
                                if full_text:
                                    full_text = await _execute_post_hooks(hook_pipeline, full_text, run_id, ctx)
                                ctx.outputs["result"] = full_text
                                yield {
                                    "stage": "execute",
                                    "result": full_text[:2000],
                                    "citations": (ctx.vars.get('citations') or []),
                                    "tool_integration_summary": ctx.vars.get('tool_integration_summary', ''),
                                    "tool_type_stats": ctx.vars.get('tool_type_stats', {}),
                                    "tool_name_stats": ctx.vars.get('tool_name_stats', {})
                                }
                                return

                            # 如果没有检测到工具调用，按原样返回
                            # 执行Post-hooks（如敏感信息脱敏）
                            hook_pipeline = ctx.vars.get('hook_pipeline')
                            run_id = ctx.inputs.get('run_id')
                            if full_text:
                                full_text = await _execute_post_hooks(hook_pipeline, full_text, run_id, ctx)
                            ctx.outputs["result"] = full_text
                            yield {
                                "stage": "execute",
                                "result": full_text[:2000],
                                "citations": (ctx.vars.get('citations') or []),
                                "tool_integration_summary": ctx.vars.get('tool_integration_summary', ''),
                                "tool_type_stats": ctx.vars.get('tool_type_stats', {}),
                                "tool_name_stats": ctx.vars.get('tool_name_stats', {})
                            }
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
                        yield {
                            "stage": "execute",
                            "result": text[:2000],
                            "citations": (ctx.vars.get('citations') or []),
                            "tool_integration_summary": ctx.vars.get('tool_integration_summary', ''),
                            "tool_type_stats": ctx.vars.get('tool_type_stats', {}),
                            "tool_name_stats": ctx.vars.get('tool_name_stats', {})
                        }
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
                                            yield {
                                                "stage": "execute",
                                                "result": text[:2000],
                                                "citations": (ctx.vars.get('citations') or []),
                                                "tool_integration_summary": ctx.vars.get('tool_integration_summary', ''),
                                                "tool_type_stats": ctx.vars.get('tool_type_stats', {}),
                                                "tool_name_stats": ctx.vars.get('tool_name_stats', {})
                                            }
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

    # 🔥 新增: Hook Pipeline集成 - 执行Pre-hooks
    try:
        async for hook_event in _add_hook_integration(ctx, run_id):
            yield hook_event
    except Exception as e:
        logger.warning(f"[WF][{run_id}] Hook集成失败（非致命错误）: {e}")

    # 检查是否被Hook阻断
    if ctx.vars.get('hook_blocked'):
        block_message = ctx.vars.get('block_message', '请求已被阻断')
        logger.info(f"[WF][{run_id}] Hook已阻断执行，返回阻断消息给用户: {block_message}")

        # 返回阻断消息给用户（使用和LLM响应相同的格式）
        yield {"stage": "execute", "status": "answering"}
        yield {"stage": "execute", "status": "answering", "delta": block_message}
        yield {"stage": "execute", "status": "complete"}
        return

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

    # 🔥 优化: 使用统一的工具调用规范添加函数
    _add_react_tool_instructions(agent)
    logger.info(f"[WF][{run_id}] 通用问答场景已添加工具调用规范")

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

    # Hook Pipeline已在_add_hook_integration中加载并存储到ctx.vars['hook_pipeline']
    logger.info(f"[WF][{run_id}] 通用问答场景已添加Hook集成和工具调用规范")

    yield {"stage": "prepare", "status": "ok", "mode": "general"}


async def step_prepare_knowledge(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """知识库检索场景的 prepare 步骤（包含完整知识检索配置）"""
    # 复用原始 step_prepare 的逻辑
    async for event in step_prepare(ctx):
        yield event

    # 🔥 新增: 如果有工具选择,添加本地ReAct调用规范
    agent = ctx.vars.get("agent")
    if agent:
        _add_react_tool_instructions(agent)
        logger.info(f"[WF] 知识库检索场景已添加工具调用规范")


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

    # 🔥 新增: Hook Pipeline集成 - 执行Pre-hooks
    try:
        async for hook_event in _add_hook_integration(ctx, run_id):
            yield hook_event
    except Exception as e:
        logger.warning(f"[WF][{run_id}] Hook集成失败（非致命错误）: {e}")

    # 检查是否被Hook阻断
    if ctx.vars.get('hook_blocked'):
        block_message = ctx.vars.get('block_message', '请求已被阻断')
        logger.info(f"[WF][{run_id}] Hook已阻断执行，返回阻断消息给用户: {block_message}")

        # 返回阻断消息给用户（使用和LLM响应相同的格式）
        yield {"stage": "execute", "status": "answering"}
        yield {"stage": "execute", "status": "answering", "delta": block_message}
        yield {"stage": "execute", "status": "complete"}
        return

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

    # 🔥 新增: 如果有工具选择,添加本地ReAct调用规范
    _add_react_tool_instructions(agent)
    logger.info(f"[WF][{run_id}] 知识图谱检索场景已添加工具调用规范和Hook集成")

    yield {"stage": "prepare", "status": "ok", "mode": "graph"}


async def step_execute_general(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """通用问答场景的execute步骤
    特点：专注于工具调用（百度搜索、DuckDuckGo等），使用本地ReAct模式
    """
    # 🔥 检查Hook是否阻断了执行
    if ctx.vars.get('hook_blocked'):
        run_id = ctx.inputs.get('run_id')
        logger.info(f"[WF][{run_id}] 检测到Hook阻断标志，跳过execute步骤")
        return

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
        gateway_base = os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050').rstrip('/')

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
                                    import asyncio
                                    import inspect

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

                                    # 处理异步协程
                                    if result is not None and inspect.iscoroutine(result):
                                        logger.info(f"[WF][General][ReAct] 检测到协程，等待执行...")
                                        result = await result
                                        logger.info(f"[WF][General][ReAct] 协程执行完成")

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
    """知识库检索场景 workflow（优化版：工具预执行 + 多路召回 + 重排序）

    适用于：需要从知识库检索信息的场景

    🔥 核心改进：
    1. step_tool_execution: 先执行外部工具（搜索、API、爬虫等）
    2. step_retrieve: 知识库检索 + 多路召回（工具结果 + 知识库结果）
    3. step_rerank: 重排序（使用Rerank模型统一打分，选择Top-K）
    4. step_intent: 意图分析
    5. step_execute: 基于融合后的高质量上下文生成答案

    执行顺序：prepare → tool_execution → retrieve → rerank → intent → execute
    """
    steps = [step_prepare_knowledge, step_tool_execution, step_retrieve, step_rerank, step_intent, step_execute]
    return Workflow(name=name, steps=steps)


def build_graph_retrieval_workflow(name: str = "graph_retrieval") -> Workflow:
    """知识图谱检索场景 workflow
    适用于：需要查询知识图谱的场景
    步骤：prepare_graph → execute（图谱查询集成在 tools 中）
    """
    steps = [step_prepare_graph, step_execute]
    return Workflow(name=name, steps=steps)
