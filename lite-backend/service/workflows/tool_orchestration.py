import asyncio
from typing import Any, AsyncGenerator, Dict, List, Optional

from .workflow_engine import Workflow, WorkflowContext
from service.agent_service_v2 import get_agent_service_v2
from service.tools_registry import get_tool_registry


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
    model_id = ctx.inputs.get("model_id")
    model_provider = ctx.inputs.get("model_provider")

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


async def step_execute(ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
    """Execute main user prompt with tools enabled."""
    agent = ctx.vars.get("agent")
    user_prompt = ctx.inputs.get("prompt") or "请执行任务。"
    yield {"stage": "execute", "prompt": user_prompt}
    try:
        if hasattr(agent, "arun"):
            res = await agent.arun(user_prompt)
        else:
            res = agent.run(user_prompt)
        text = getattr(res, "content", None) or (res if isinstance(res, str) else str(res))
        ctx.outputs["result"] = text
        yield {"stage": "execute", "result": text[:2000]}
    except Exception as e:
        yield {"stage": "execute", "error": str(e)}
        raise


def build_tool_workflow(name: str = "tool_orchestration") -> Workflow:
    steps = [step_prepare, step_plan, step_execute]
    return Workflow(name=name, steps=steps)

