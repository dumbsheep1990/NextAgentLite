from typing import Any, Dict, Optional, List
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from service.workflows.workflow_engine import WorkflowContext
from service.workflows.tool_orchestration import build_tool_workflow
from service.workflows import session_store
from service.team_execution_template_service import get_team_template_service
from db.database import get_db_session
from sqlalchemy import text
import os, time, uuid, asyncio, json

router = APIRouter(prefix="/workflows", tags=["Agent Workflows"])


class RunWorkflowRequest(BaseModel):
    agent_name: Optional[str] = Field(default="workflow_agent")
    prompt: str
    selected_tools: list[str] = Field(default_factory=list)
    model: Optional[str] = None
    provider: Optional[str] = None
    session_state: Optional[str] = None  # serialized WorkflowContext json, optional
    save_session: bool = Field(default=True, description="是否持久化工作流会话")
    session_id: Optional[str] = Field(default=None, description="要恢复的会话ID（可选）")
    # 可选检索/资源/过滤参数（来自工作室）
    resources: Optional[Dict[str, Any]] = None
    # 多轮对话：历史消息与配置（仅 user/assistant 角色）
    chat_messages: Optional[List[Dict[str, str]]] = None
    chat_config: Optional[Dict[str, Any]] = None
    top_n: Optional[int] = None
    sim_threshold: Optional[float] = None
    sim_weight: Optional[float] = None
    filters: Optional[Dict[str, Any]] = None
    # 是否开启LLM流式输出（透传到执行阶段）
    stream: Optional[bool] = Field(default=None)
    # 可选：知识图谱检索配置（显式传入时开启；未传表示关闭并清除上一轮会话里的设置）
    graph_config: Optional[Dict[str, Any]] = None
    # 模型参数配置（从工作室传递）
    custom_prompt: Optional[str] = Field(default=None, description="自定义系统提示词")
    temperature: Optional[float] = Field(default=None, description="模型温度参数 (0-1)")
    top_p: Optional[float] = Field(default=None, description="Top-p 采样参数 (0-1)")
    max_tokens: Optional[int] = Field(default=None, description="最大输出Token数")
    reasoning_enabled: Optional[bool] = Field(default=None, description="是否开启思考模式")


def _sse_event(data: Dict[str, Any]) -> bytes:
    # text/event-stream format
    import json as _json
    return f"data: {_json.dumps(data, ensure_ascii=False)}\n\n".encode("utf-8")


@router.post("/run", response_class=StreamingResponse)
async def run_workflow(req: RunWorkflowRequest):
    """Run the default tool orchestration workflow as an async event stream (SSE)."""
    # 日志：记录前端传递的selected_tools
    from core.logger import logger as api_logger
    api_logger.info(f"[API] 接收到workflow请求 - agent_name={req.agent_name}, selected_tools={req.selected_tools}")

    # Build or restore context
    if req.session_state:
        try:
            ctx = WorkflowContext.from_json(req.session_state)
        except Exception as e:  # noqa
            raise HTTPException(status_code=400, detail=f"invalid session_state: {e}")
    else:
        ctx = WorkflowContext()

    ctx.inputs.update({
        "agent_name": req.agent_name,
        "selected_tools": req.selected_tools or [],
        "model_id": req.model,
        "model_provider": req.provider,
        "prompt": req.prompt,
    })
    if req.stream is not None:
        ctx.inputs["stream"] = bool(req.stream)
    # 传递模型参数和自定义提示词
    if req.custom_prompt is not None:
        ctx.inputs["custom_prompt"] = req.custom_prompt
    if req.temperature is not None:
        ctx.inputs["temperature"] = req.temperature
    if req.top_p is not None:
        ctx.inputs["top_p"] = req.top_p
    if req.max_tokens is not None:
        ctx.inputs["max_tokens"] = req.max_tokens
    if req.reasoning_enabled is not None:
        ctx.inputs["reasoning_enabled"] = req.reasoning_enabled
    # 透传可选检索/过滤配置
    if req.resources:
        ctx.inputs["resources"] = req.resources
    if req.top_n is not None:
        ctx.inputs["top_n"] = req.top_n
    if req.sim_threshold is not None:
        ctx.inputs["sim_threshold"] = req.sim_threshold
    if req.sim_weight is not None:
        ctx.inputs["sim_weight"] = req.sim_weight
    if req.filters:
        ctx.inputs.setdefault("filters", {}).update(req.filters)
    # 显式同步 graph_config（如未提供则移除旧值，避免跨轮残留导致误触发图谱检索）
    if req.graph_config is not None:
        ctx.inputs["graph_config"] = req.graph_config
    else:
        if "graph_config" in ctx.inputs:
            ctx.inputs.pop("graph_config", None)
    # 透传多轮对话上下文
    if isinstance(req.chat_messages, list):
        try:
            # 仅保留 role/content 字段，避免注入多余内容
            ctx.inputs["chat_messages"] = [
                {"role": (m.get("role") or "user").lower(), "content": m.get("content") or ""}
                for m in req.chat_messages if isinstance(m, dict)
            ]
        except Exception:
            ctx.inputs["chat_messages"] = []
    if isinstance(req.chat_config, dict):
        ctx.inputs["chat_config"] = req.chat_config

    # 创建或恢复会话ID/上下文
    sess_id: Optional[UUID] = None
    if req.session_id:
        try:
            sess_id = UUID(req.session_id)
        except Exception:
            raise HTTPException(status_code=400, detail="invalid session_id")
        # 如果提供了session_id且未附带session_state，则尝试从DB装载上下文
        if not req.session_state:
            try:
                row = await session_store.get_session(sess_id)
                if row:
                    try:
                        ctx.inputs = row.inputs or {}
                        ctx.vars = row.vars or {}
                        ctx.outputs = row.outputs or {}
                        # 尝试从持久化的字符串还原为整数索引
                        try:
                            ctx.step_index = int(row.step_index or 0)
                        except Exception:
                            ctx.step_index = 0
                        ctx.step_name = row.step_name or ""
                    except Exception:
                        pass
            except Exception:
                pass
    elif req.save_session:
        try:
            # 首次创建会话
            from uuid import uuid4
            # 会在首次检查点时持久化，或直接调用store创建
            sess_id = await session_store.create_session(req.agent_name or "workflow_agent", ctx.inputs)
        except Exception:
            sess_id = None

    wf = build_tool_workflow()

    async def event_stream():
        # yield initial state
        initial: Dict[str, Any] = {"type": "session_state", "state": ctx.to_json()}
        if sess_id:
            initial["session_id"] = str(sess_id)
        yield _sse_event(initial)

        # 首次检查点
        if sess_id:
            try:
                await session_store.update_checkpoint(
                    sess_id,
                    inputs=ctx.inputs,
                    vars=ctx.vars,
                    outputs=ctx.outputs,
                    step_index=ctx.step_index,
                    step_name=ctx.step_name,
                    status="running",
                )
            except Exception:
                pass

        async for event in wf.run(ctx):
            # 取消检测
            if sess_id:
                try:
                    if await session_store.is_canceled(sess_id):
                        yield _sse_event({"type": "workflow_cancelled", "session_id": str(sess_id)})
                        return
                except Exception:
                    pass

            # send event
            yield _sse_event(event)

            # also checkpoint latest session state
            if event.get("type") in ("step_end", "workflow_end", "step_error", "workflow_error"):
                checkpoint: Dict[str, Any] = {"type": "session_state", "state": ctx.to_json()}
                if sess_id:
                    checkpoint["session_id"] = str(sess_id)
                    try:
                        new_status = None
                        if event.get("type") == "workflow_end":
                            new_status = "completed"
                        elif event.get("type") in ("step_error", "workflow_error"):
                            new_status = "error"
                        await session_store.update_checkpoint(
                            sess_id,
                            inputs=ctx.inputs,
                            vars=ctx.vars,
                            outputs=ctx.outputs,
                            step_index=ctx.step_index,
                            step_name=ctx.step_name,
                            status=new_status,
                        )
                    except Exception:
                        pass
                yield _sse_event(checkpoint)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


class RunTemplateRequest(BaseModel):
    template_name: str
    prompt: str = Field(default="")
    overrides: Dict[str, Any] = Field(default_factory=dict)  # 允许覆盖模型/工具/参数
    save_session: bool = True


@router.post("/run-template", response_class=StreamingResponse)
async def run_workflow_from_template(req: RunTemplateRequest):
    """按模板(DAG)运行一次工作流。支持并发执行有向无环依赖图中的同层节点。"""
    tpl_svc = await get_team_template_service()
    tpl = await tpl_svc.get_by_name(req.template_name)
    if not tpl:
        raise HTTPException(status_code=404, detail="template not found")

    team_config = tpl.get("team_config") or {}
    flow = tpl.get("execution_flow") or {}
    steps: list[dict] = flow.get("steps") or []
    dependencies: dict[str, list[str]] = flow.get("dependencies") or {}

    # 执行ID与日志初始化
    execution_id = uuid.uuid4().hex
    session_id = uuid.uuid4().hex
    start_ts = time.time()

    async with get_db_session() as db:
        await db.execute(text("""
            INSERT INTO team_executions (session_id, execution_id, team_name, query, status, start_time)
            VALUES (:sid, :eid, :team, :q, 'running', now())
        """), {
            "sid": session_id,
            "eid": execution_id,
            "team": req.template_name,
            "q": req.prompt or ""
        })
        await db.commit()

    # 运行上下文（与普通工作流保持一致）
    ctx = WorkflowContext()
    ctx.inputs.update({
        "agent_name": req.template_name,
        "prompt": req.prompt,
        "overrides": req.overrides,
    })

    async def sse_encode(data: Dict[str, Any]) -> bytes:
        import json as _json
        return f"data: {_json.dumps(data, ensure_ascii=False)}\n\n".encode("utf-8")

    async def _resolve_vars(obj: Any, outputs_map: Dict[str, Any]) -> Any:
        # 简单占位符解析：字符串中的 ${step.key1.key2}
        import re
        if isinstance(obj, str):
            def repl(m):
                path = m.group(1)
                parts = path.split('.')
                if not parts:
                    return m.group(0)
                root = outputs_map.get(parts[0])
                cur = root
                for p in parts[1:]:
                    if isinstance(cur, dict) and p in cur:
                        cur = cur[p]
                    else:
                        return m.group(0)
                return str(cur)
            return re.sub(r"\$\{([^}]+)\}", repl, obj)
        elif isinstance(obj, dict):
            return {k: await _resolve_vars(v, outputs_map) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [await _resolve_vars(v, outputs_map) for v in obj]
        else:
            return obj

    async def run_dag_and_stream():
        # 发送初始会话
        yield await sse_encode({"type": "session_state", "session_id": session_id, "state": ctx.to_json()})

        # 依赖解析：用名字（优先 step['name']，否则 agent/索引）
        nodes: Dict[str, dict] = {}
        ordered_keys: list[str] = []
        for i, s in enumerate(steps):
            sid = s.get("name") or s.get("agent") or f"step_{i}"
            nodes[sid] = s
            ordered_keys.append(sid)

        # 拓扑执行：每轮挑选依赖满足且未执行的节点，全部并发执行
        completed: set[str] = set()
        failed: set[str] = set()

        async def exec_one(sid: str, sdef: dict):
            """执行一个节点：支持 tool / agent 两类。"""
            node_start = time.time()
            action = sdef.get("action") or ("agent" if sdef.get("agent") else None)
            member_id = sdef.get("agent") or sdef.get("tool") or sid
            member_name = sdef.get("agent") or sdef.get("tool") or sid
            input_data = {"prompt": ctx.inputs.get("prompt"), "params": sdef.get("params"), "overrides": req.overrides}

            # 记录 step start
            async for db in get_db_session():
                await db.execute(text("""
                    INSERT INTO team_execution_steps (execution_id, step_id, member_id, member_name, action, input_data, status, start_time)
                    VALUES (:eid, :sid, :mid, :mname, :act, :inp::jsonb, 'running', now())
                """), {
                    "eid": execution_id, "sid": sid, "mid": member_id, "mname": member_name,
                    "act": action or "",
                    "inp": json.dumps(input_data, ensure_ascii=False)
                })
                await db.commit()

            try:
                result_obj: Any = None
                # 工具调用 or 子智能体
                retry = int(sdef.get("retry", 0) or 0)
                timeout_ms = int(sdef.get("timeout_ms", 0) or 0)

                async def _do_call():
                    # 工具参数解析（支持引用前序输出）
                    from service.tools_registry import get_tool_registry
                    tr = await get_tool_registry()
                    if sdef.get("tool"):
                        tool_ref = sdef["tool"]
                        raw_args = sdef.get("args") or {}
                        args = await _resolve_vars(raw_args, ctx.outputs.get("_nodes", {}))
                        return await tr._gc.call_unified_tool(tool_ref, args)
                    else:
                        # 子智能体：将 params 合并入 prompt 或作为上下文（简化实现）
                        from service.agent_service_v2 import get_agent_service_v2
                        svc = await get_agent_service_v2()
                        agent = await svc.create_agent_v2(
                            agent_name=sdef.get("agent") or sid,
                            selected_tools=[],
                            model_name=req.overrides.get("model_id") if isinstance(req.overrides, dict) else None,
                            model_provider=req.overrides.get("model_provider") if isinstance(req.overrides, dict) else None,
                        )
                        prompt = ctx.inputs.get("prompt") or ""
                        params = sdef.get("params") or {}
                        prompt = str(await _resolve_vars(prompt, ctx.outputs.get("_nodes", {})))
                        if hasattr(agent, "arun"):
                            return await agent.arun(prompt)
                        else:
                            return agent.run(prompt)

                attempt = 0
                while True:
                    try:
                        if timeout_ms > 0:
                            result_obj = await asyncio.wait_for(_do_call(), timeout=timeout_ms/1000.0)
                        else:
                            result_obj = await _do_call()
                        break
                    except Exception as e:
                        if attempt < retry:
                            attempt += 1
                            await asyncio.sleep(min(0.2 * attempt, 2.0))
                            continue
                        raise e

                # 记录 step end
                duration = int((time.time() - node_start) * 1000)
                out_data = None
                try:
                    out_data = result_obj if isinstance(result_obj, dict) else {"text": getattr(result_obj, "content", str(result_obj))}
                except Exception:
                    out_data = {"text": str(result_obj)}

                async with get_db_session() as db:
                    await db.execute(text("""
                        UPDATE team_execution_steps
                        SET status='completed', output_data=:out::jsonb, end_time=now(), duration_ms=:dur
                        WHERE execution_id=:eid AND step_id=:sid
                    """), {"out": json.dumps(out_data, ensure_ascii=False), "dur": duration, "eid": execution_id, "sid": sid})
                    await db.commit()

                # 将节点输出保存，供后续引用
                nodes_map = ctx.outputs.setdefault("_nodes", {})
                nodes_map[sid] = out_data
                await asyncio.sleep(0)
                return {"sid": sid, "ok": True, "output": out_data}
            except Exception as e:
                duration = int((time.time() - node_start) * 1000)
                async with get_db_session() as db:
                    await db.execute(text("""
                        UPDATE team_execution_steps
                        SET status='error', error_message=:err, end_time=now(), duration_ms=:dur
                        WHERE execution_id=:eid AND step_id=:sid
                    """), {"err": str(e), "dur": duration, "eid": execution_id, "sid": sid})
                    await db.commit()
                return {"sid": sid, "ok": False, "error": str(e)}

        # 循环直到所有节点处理完
        pending = set(ordered_keys)
        while pending:
            ready = [k for k in list(pending) if all((d in completed) for d in (dependencies.get(k) or []))]
            if not ready:
                # DAG 有环或故障
                yield await sse_encode({"type": "workflow_error", "error": "no ready nodes; cyclic or blocked"})
                break
            # 并发运行这一批
            batch = [asyncio.create_task(exec_one(k, nodes[k])) for k in ready]
            results = await asyncio.gather(*batch)
            for r in results:
                if r.get("ok"):
                    completed.add(r["sid"])  # type: ignore
                    yield await sse_encode({"type": "step_event", "name": r["sid"], "data": {"status": "completed"}})
                else:
                    failed.add(r["sid"])  # type: ignore
                    yield await sse_encode({"type": "step_error", "name": r["sid"], "error": r.get("error")})
            pending = pending.difference(completed.union(failed))

        end_ts = time.time()
        status = "completed" if not failed and not pending else "error"
        duration_ms = int((end_ts - start_ts) * 1000)
        async with get_db_session() as db:
            await db.execute(text("""
                UPDATE team_executions
                SET status=:st, end_time=now(), duration_ms=:dur
                WHERE execution_id=:eid
            """), {"st": status, "dur": duration_ms, "eid": execution_id})
            await db.commit()

        yield await sse_encode({"type": "workflow_end", "execution_id": execution_id, "status": status})

    return StreamingResponse(run_dag_and_stream(), media_type="text/event-stream")


class WorkflowSessionOut(BaseModel):
    id: str
    agent_name: str
    status: str
    step_index: str
    step_name: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@router.get("/sessions", response_model=List[WorkflowSessionOut])
async def list_sessions(limit: int = 50):
    rows = await session_store.list_sessions(limit=limit)
    out: List[WorkflowSessionOut] = []
    for r in rows:
        out.append(WorkflowSessionOut(
            id=str(r.id),
            agent_name=r.agent_name,
            status=r.status,
            step_index=r.step_index or "0",
            step_name=r.step_name or "",
            created_at=r.created_at.isoformat() if getattr(r, "created_at", None) else None,
            updated_at=r.updated_at.isoformat() if getattr(r, "updated_at", None) else None,
        ))
    return out


@router.post("/sessions/{session_id}/cancel")
async def cancel_session(session_id: str):
    try:
        sess_uuid = UUID(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid session_id")
    await session_store.request_cancel(sess_uuid)
    return {"ok": True}


@router.get("/sessions/{session_id}")
async def get_session_detail(session_id: str):
    try:
        sess_uuid = UUID(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid session_id")
    row = await session_store.get_session(sess_uuid)
    if not row:
        raise HTTPException(status_code=404, detail="session not found")
    return {
        "id": str(row.id),
        "agent_name": row.agent_name,
        "status": row.status,
        "inputs": row.inputs,
        "vars": row.vars,
        "outputs": row.outputs,
        "step_index": row.step_index,
        "step_name": row.step_name,
        "created_at": row.created_at.isoformat() if getattr(row, "created_at", None) else None,
        "updated_at": row.updated_at.isoformat() if getattr(row, "updated_at", None) else None,
    }
