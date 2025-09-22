from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from service.workflows.workflow_engine import WorkflowContext
from service.workflows.tool_orchestration import build_tool_workflow

router = APIRouter(prefix="/workflows", tags=["Agent Workflows"])


class RunWorkflowRequest(BaseModel):
    agent_name: Optional[str] = Field(default="workflow_agent")
    prompt: str
    selected_tools: list[str] = Field(default_factory=list)
    model: Optional[str] = None
    provider: Optional[str] = None
    session_state: Optional[str] = None  # serialized WorkflowContext json, optional


def _sse_event(data: Dict[str, Any]) -> bytes:
    # text/event-stream format
    import json as _json
    return f"data: {_json.dumps(data, ensure_ascii=False)}\n\n".encode("utf-8")


@router.post("/run", response_class=StreamingResponse)
async def run_workflow(req: RunWorkflowRequest):
    """Run the default tool orchestration workflow as an async event stream (SSE)."""
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

    wf = build_tool_workflow()

    async def event_stream():
        # yield initial state
        yield _sse_event({"type": "session_state", "state": ctx.to_json()})
        async for event in wf.run(ctx):
            # send event
            yield _sse_event(event)
            # also checkpoint latest session state
            if event.get("type") in ("step_end", "workflow_end", "step_error", "workflow_error"):
                yield _sse_event({"type": "session_state", "state": ctx.to_json()})

    return StreamingResponse(event_stream(), media_type="text/event-stream")

