import asyncio
import json
from dataclasses import dataclass, field
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional


@dataclass
class WorkflowContext:
    """Shared state passed between steps.
    It is serializable to persist as session state.
    """
    inputs: Dict[str, Any] = field(default_factory=dict)
    vars: Dict[str, Any] = field(default_factory=dict)
    outputs: Dict[str, Any] = field(default_factory=dict)
    step_index: int = 0
    step_name: str = ""

    def to_json(self) -> str:
        return json.dumps({
            "inputs": self.inputs,
            "vars": self.vars,
            "outputs": self.outputs,
            "step_index": self.step_index,
            "step_name": self.step_name,
        }, ensure_ascii=False)

    @staticmethod
    def from_json(data: str) -> "WorkflowContext":
        obj = json.loads(data or "{}")
        return WorkflowContext(
            inputs=obj.get("inputs", {}),
            vars=obj.get("vars", {}),
            outputs=obj.get("outputs", {}),
            step_index=obj.get("step_index", 0),
            step_name=obj.get("step_name", ""),
        )


StepFn = Callable[[WorkflowContext], AsyncGenerator[Dict[str, Any], None]]


class Workflow:
    """A minimal async-generator-based workflow engine.

    Each step is an async generator yielding events (dict),
    so callers can stream progress to clients (e.g. SSE).
    """

    def __init__(self, name: str, steps: List[StepFn]):
        self.name = name
        self.steps = steps

    async def run(self, ctx: WorkflowContext) -> AsyncGenerator[Dict[str, Any], None]:
        total = len(self.steps)
        yield {"type": "workflow_start", "name": self.name, "total_steps": total}
        for idx, step in enumerate(self.steps):
            ctx.step_index = idx
            ctx.step_name = getattr(step, "__name__", f"step_{idx}")
            yield {"type": "step_start", "index": idx, "name": ctx.step_name}
            try:
                async for event in step(ctx):
                    # allow steps to report fine-grained progress
                    yield {"type": "step_event", "index": idx, "name": ctx.step_name, "data": event}
            except Exception as e:  # noqa
                yield {"type": "step_error", "index": idx, "name": ctx.step_name, "error": str(e)}
                yield {"type": "workflow_error", "name": self.name, "at": ctx.step_name}
                return
            yield {"type": "step_end", "index": idx, "name": ctx.step_name}
        yield {"type": "workflow_end", "name": self.name, "outputs": ctx.outputs}


async def sleep_event(ctx: WorkflowContext, seconds: float = 0.1, note: str = "") -> AsyncGenerator[Dict[str, Any], None]:
    await asyncio.sleep(seconds)
    yield {"note": note or f"slept {seconds}s"}

