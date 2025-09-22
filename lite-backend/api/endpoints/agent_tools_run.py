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


router = APIRouter(prefix="/agents", tags=["Agent工具"])


class ToolsRunRequest(BaseModel):
    agent_name: Optional[str] = "tools_tester"
    prompt: str
    selected_tools: List[str] = []
    model: Optional[str] = None
    provider: Optional[str] = None
    mode: Optional[str] = "auto"  # auto | manual_react


@router.post("/tools/execute")
async def tools_execute(req: ToolsRunRequest) -> Any:
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

    # 生成一次 run_id 数据（用于持久化）
    run_payload = {
        "agent_name": req.agent_name,
        "mode": (req.mode or "auto").lower(),
        "prompt": req.prompt,
        "selected_tools": req.selected_tools,
        "model_id": None,
        "model_provider": req.provider,
        "status": "failed",
        "output": None,
        "error": None,
        "debug_logs": None,
        "manual_run": None,
    }

    try:
        # 回退（手写 ReAct）直跑
        if (req.mode or "auto").lower() == "manual_react":
            manual = await _manual_local_tool_run(req.prompt, req.selected_tools or [])
            final_out = manual.get("final_answer") or (manual.get("rounds") or [{}])[-1].get("response") or ""
            run_payload.update({"status": "success", "output": final_out, "manual_run": manual})
            await _persist_agent_tool_run(run_payload)
            return {"ok": True, "mode": "manual_react", "output": final_out, "manual_run": manual}

        # 确保存在临时模板
        code = req.agent_name or "tools_tester"
        tpl = await agent_template_service.get_template_by_code(code)
        if not tpl:
            await agent_template_service.create_template({
                "template_code": code,
                "template_name": "工具执行",
                "template_type": "single",
                "category": "tools",
                "description": "用于执行 MCP/API 工具的临时模板",
                "icon": "ToolOutlined",
                "color": "#13c2c2",
                "base_config": {"role": "工具执行智能体", "instructions": ["你是一个工具执行智能体"]},
                "model_config": {"model_id": None, "model_provider": None},
                "tools_config": [],
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

        run_payload["model_id"] = getattr(getattr(agent, 'model', None), 'id', None)

        # 使用异步执行以支持 async 工具（符合 Agno 要求）
        try:
            if hasattr(agent, "arun"):
                result = await agent.arun(req.prompt)  # type: ignore
            elif hasattr(agent, "run"):
                # 兼容极旧版本（注意：包含 async 工具时会报错）
                result = agent.run(req.prompt)  # type: ignore
            else:
                raise RuntimeError("Agent 实例不支持 run/arun 接口")
        except Exception as e_auto:
            # 自动模式失败（常见于上游不支持原生 tools 或响应格式不兼容）→ 回退到手写 ReAct 流程
            logger.warning(f"自动模式失败，切换到本地ReAct回退: {e_auto}")
            manual = await _manual_local_tool_run(req.prompt, req.selected_tools or [])
            final_out = manual.get("final_answer") or (manual.get("rounds") or [{}])[-1].get("response") or ""
            debug_logs = "\n".join(handler.lines)
            run_payload.update({"status": "success", "output": final_out, "manual_run": manual, "debug_logs": debug_logs})
            await _persist_agent_tool_run(run_payload)
            return {"ok": True, "mode": "auto->manual_fallback", "output": final_out, "manual_run": manual, "debug_logs": debug_logs}

        out = result
        if hasattr(result, "content"):
            out = getattr(result, "content")
        elif isinstance(result, dict) and "content" in result:
            out = result["content"]

        debug_logs = "\n".join(handler.lines)
        run_payload.update({"status": "success", "output": out, "debug_logs": debug_logs})
        await _persist_agent_tool_run(run_payload)

        return {
            "ok": True,
            "agent": req.agent_name,
            "selected_tools": req.selected_tools,
            "output": out,
            "debug_logs": debug_logs,
            "agent_meta": {"model_id": run_payload["model_id"], "selected_tools": req.selected_tools},
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Agent tools execute failed")
        probe = await _probe_llm_gateway(req.model)
        tool_probe = await _probe_tool_call_support(probe.get('defaults_simple_body', {}))
        tools_dbg = await _collect_tools_debug(req.selected_tools or [])
        run_payload.update({
            "status": "failed",
            "error": str(e),
            "debug_logs": "\n".join(handler.lines),
        })
        await _persist_agent_tool_run(run_payload)
        detail = {
            "error": str(e),
            "gateway_probe": probe,
            "tool_call_probe": tool_probe,
            "tools_debug": tools_dbg,
            "debug_logs": run_payload["debug_logs"],
        }
        raise HTTPException(status_code=500, detail=json.dumps(detail, ensure_ascii=False))
    finally:
        try:
            root_logger.removeHandler(handler)
            agno_logger.setLevel(old_agno_level)
        except Exception:
            pass


async def _persist_agent_tool_run(payload: dict) -> None:
    """将一次工具执行结果持久化到 agent_tool_runs（若无法连接则静默忽略）。"""
    try:
        import asyncpg  # type: ignore
    except Exception:
        logger.warning("asyncpg 未安装，跳过 agent_tool_runs 持久化")
        return

    # 读取 DATABASE_URL 或 POSTGRESQL_* 环境变量
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        host = os.getenv('POSTGRESQL_HOST', 'localhost')
        port = os.getenv('POSTGRESQL_PORT', '5434')
        user = os.getenv('POSTGRESQL_USERNAME', 'postgres')
        password = os.getenv('POSTGRESQL_PASSWORD', '')
        database = os.getenv('POSTGRESQL_DATABASE', 'zzdsj_demo')
        db_url = f"postgresql://{user}:{password}@{host}:{port}/{database}"

    sql = (
        "INSERT INTO agent_tool_runs (agent_name, mode, prompt, selected_tools, model_id, model_provider, status, output, error, debug_logs, manual_run) "
        "VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11::jsonb)"
    )
    try:
        conn = await asyncpg.connect(db_url)
        try:
            await conn.execute(sql,
                payload.get('agent_name'),
                payload.get('mode'),
                payload.get('prompt'),
                json.dumps(payload.get('selected_tools') or []),
                payload.get('model_id'),
                payload.get('model_provider'),
                payload.get('status'),
                payload.get('output'),
                payload.get('error'),
                payload.get('debug_logs'),
                json.dumps(payload.get('manual_run') or {}),
            )
        finally:
            await conn.close()
    except Exception as ex:
        logger.warning(f"写入 agent_tool_runs 失败: {ex}")


async def _probe_llm_gateway(prefer_model: Optional[str]) -> dict:
    base = f"{os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050').rstrip('/')}/v1"
    base = base.rstrip("/")
    info = {"base": base}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
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

            # 避免在探针中发送无意义的对话消息（如 hello）
            info["chat_status"] = None
            info["chat_body"] = "skipped"
    except Exception as ex:
        info["probe_error"] = str(ex)
    return info


async def _collect_tools_debug(selected: list) -> dict:
    out: dict = {"selected": selected}
    try:
        reg = await get_tool_registry()
        all_tools = await reg.list_all_tools()
        out["available"] = all_tools
    except Exception as ex:
        out["error"] = str(ex)
    return out


# 查询执行记录列表
@router.get("/tools/runs")
async def list_tool_runs(
    agent_name: Optional[str] = None,
    mode: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> Any:
    try:
        import asyncpg  # type: ignore
    except Exception:
        raise HTTPException(status_code=500, detail="asyncpg 未安装，无法查询执行记录")

    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        host = os.getenv('POSTGRESQL_HOST', 'localhost')
        port = os.getenv('POSTGRESQL_PORT', '5434')
        user = os.getenv('POSTGRESQL_USERNAME', 'postgres')
        password = os.getenv('POSTGRESQL_PASSWORD', '')
        database = os.getenv('POSTGRESQL_DATABASE', 'zzdsj_demo')
        db_url = f"postgresql://{user}:{password}@{host}:{port}/{database}"

    where = []
    params = []
    if agent_name:
        where.append("agent_name = $%d" % (len(params)+1))
        params.append(agent_name)
    if mode:
        where.append("mode = $%d" % (len(params)+1))
        params.append(mode)
    if status:
        where.append("status = $%d" % (len(params)+1))
        params.append(status)
    where_sql = (" WHERE " + " AND ".join(where)) if where else ""

    sql = (
        "SELECT id, created_at, finished_at, agent_name, mode, model_id, model_provider, status,"
        " left(selected_tools::text, 256) as selected_tools_preview,"
        " left(prompt, 256) as prompt_preview"
        " FROM agent_tool_runs" + where_sql +
        " ORDER BY created_at DESC LIMIT $%d OFFSET $%d" % (len(params)+1, len(params)+2)
    )
    params.extend([limit, offset])
    try:
        conn = await asyncpg.connect(db_url)
        try:
            rows = await conn.fetch(sql, *params)
            data = [dict(r) for r in rows]
            return {"ok": True, "items": data, "limit": limit, "offset": offset}
        finally:
            await conn.close()
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


# 查询执行记录详情
@router.get("/tools/runs/{run_id}")
async def get_tool_run(run_id: int) -> Any:
    try:
        import asyncpg  # type: ignore
    except Exception:
        raise HTTPException(status_code=500, detail="asyncpg 未安装，无法查询执行记录详情")

    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        host = os.getenv('POSTGRESQL_HOST', 'localhost')
        port = os.getenv('POSTGRESQL_PORT', '5434')
        user = os.getenv('POSTGRESQL_USERNAME', 'postgres')
        password = os.getenv('POSTGRESQL_PASSWORD', '')
        database = os.getenv('POSTGRESQL_DATABASE', 'zzdsj_demo')
        db_url = f"postgresql://{user}:{password}@{host}:{port}/{database}"

    try:
        conn = await asyncpg.connect(db_url)
        try:
            row = await conn.fetchrow("SELECT * FROM agent_tool_runs WHERE id=$1", run_id)
            if not row:
                raise HTTPException(status_code=404, detail="not found")
            return {"ok": True, "data": dict(row)}
        finally:
            await conn.close()
    except HTTPException:
        raise
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


async def _probe_tool_call_support(defaults_simple: dict) -> dict:
    # 避免在探针中对上游发送带 tools 的对话调用，直接返回跳过
    return {"skipped": True}


def _infer_mcp_server(selected: list) -> str | None:
    servers = []
    for s in selected:
        if isinstance(s, str) and s.startswith('mcp:'):
            parts = s.split(':')
            if len(parts) >= 2 and parts[1]:
                servers.append(parts[1])
    return servers[0] if servers else None


async def _manual_local_tool_run(prompt: str, selected: list) -> dict:
    base = f"{os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050').rstrip('/')}/v1"
    server = _infer_mcp_server(selected)
    out: dict = {"base": base, "server": server, "rounds": []}
    if not server:
        out["skipped"] = True
        out["reason"] = "no mcp server selected"
        return out
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # 1) 若用户提示中已包含 Action / Action Input 对（直接执行，无需调用模型）
            direct_actions = []
            try:
                for m in re.finditer(r"Action\s*:\s*([\w_\-:]+)\s*[\r\n]+Action Input\s*:\s*(\{[\s\S]*?\})", prompt, re.IGNORECASE):
                    tname = m.group(1).strip()
                    args_json = m.group(2)
                    try:
                        args = json.loads(args_json)
                    except Exception:
                        continue
                    direct_actions.append((tname, args))
            except Exception:
                pass
            if direct_actions:
                for tname, args in direct_actions:
                    t_url = base.replace('/v1','') + f"/mcp/servers/{server}/tools/{tname}/call"
                    tr = await client.post(t_url, json=args)
                    try:
                        tobj = tr.json()
                    except Exception:
                        tobj = (await tr.aread()).decode('utf-8','ignore')
                    out["rounds"].append({
                        "request": {"role":"user","content": f"Action: {tname}\nAction Input: {json.dumps(args,ensure_ascii=False)}"},
                        "response": "",
                        "tool_call": {"name": tname, "args": args, "status": tr.status_code, "result": tobj}
                    })
                    if tr.status_code >= 400:
                        out["final_answer"] = f"工具 {tname} 执行失败({tr.status_code})，已停止。"
                        return out
                # 直执行模式：若包含截图结果，尽量输出前缀；否则给出完成提示
                out["final_answer"] = "已按指令完成工具调用。"
                return out
            tools_url = base.replace('/v1','') + f"/mcp/servers/{server}/tools"
            try:
                tr = await client.get(tools_url)
                tool_list = tr.json() if tr.status_code == 200 else []
            except Exception:
                tool_list = []
            tool_names = [str(t.get('name')) for t in tool_list if isinstance(t, dict) and t.get('name')]
            tools_line = "、".join(tool_names[:20]) or "browser_navigate、browser_wait_for、browser_type、browser_press_key、browser_take_screenshot"

            sys_prompt = (
                "你可以调用本地浏览器MCP工具完成任务。严格使用下列格式表达工具调用意图（只输出两行，禁止输出额外文字、解释或空行）：\n"
                "Action: <工具名>\nAction Input: <JSON参数>\n"
                f"可用工具：{tools_line}。\n"
                "语言要求：仅用中文回复。若需要最终答案，请以 'Final Answer:' 开头给出结论。"
            )
            messages = [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": prompt},
            ]
            for step in range(2):
                r = await client.post(base + "/chat/completions", json={
                    "messages": messages,
                    "max_tokens": 512,
                    "temperature": 0.2,
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
                    if step == 0:
                        out["rounds"].append({**round_rec, "note": "no action parsed; reinforce instruction"})
                        messages.append({"role": "assistant", "content": content or ""})
                        messages.append({"role": "user", "content": "请只输出两行：\nAction: <工具名>\nAction Input: <JSON参数>"})
                        continue
                    url_match = re.search(r"https?://[^\s\"']+", prompt)
                    if url_match:
                        url = url_match.group(0)
                        nav_url = base.replace('/v1','') + f"/mcp/servers/{server}/tools/browser_navigate/call"
                        nav_args = {"url": url}
                        navr = await client.post(nav_url, json=nav_args)
                        try:
                            navobj = navr.json()
                        except Exception:
                            navobj = (await navr.aread()).decode('utf-8','ignore')
                        round_rec["tool_call_fallback_navigate"] = {"args": nav_args, "status": navr.status_code, "result": navobj}

                        sc_url = base.replace('/v1','') + f"/mcp/servers/{server}/tools/browser_take_screenshot/call"
                        sc_args = {"fullPage": True}
                        scr = await client.post(sc_url, json=sc_args)
                        try:
                            scobj = scr.json()
                        except Exception:
                            scobj = (await scr.aread()).decode('utf-8','ignore')
                        round_rec["tool_call_fallback_screenshot"] = {"args": sc_args, "status": scr.status_code, "result": scobj}
                        out["rounds"].append(round_rec)
                        out["final_answer"] = "已自动完成打开页面与截图（回退执行）。"
                        break
                    else:
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

                # 若底层返回无法解析参数或语法错误，立即中止，避免循环调用
                if tr.status_code >= 400:
                    try:
                        text_repr = tobj if isinstance(tobj, str) else json.dumps(tobj, ensure_ascii=False)
                    except Exception:
                        text_repr = str(tobj)
                    if "Unable to decode function arguments" in text_repr or "invalid syntax" in text_repr:
                        out["final_answer"] = "工具参数解析失败，已停止重试。"
                        break

                obs_str = json.dumps(tobj, ensure_ascii=False) if isinstance(tobj, (dict, list)) else str(tobj)
                obs_trim = obs_str[:4000]
                messages.append({"role": "assistant", "content": content})
                messages.append({"role": "user", "content": f"Observation: {obs_trim}"})
    except Exception as ex:
        out["error"] = str(ex)
    return out
