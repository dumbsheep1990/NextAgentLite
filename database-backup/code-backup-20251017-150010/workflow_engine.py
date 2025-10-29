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
        def _sanitize(value: Any) -> Any:
            """Make value JSON-serializable.
            - Drop known non-serializable handles (e.g. agent objects) from dicts
            - Recursively sanitize lists/dicts
            - Fallback to string type name for unknown objects
            """
            # fast path: native JSON types
            if value is None or isinstance(value, (str, int, float, bool)):
                return value
            if isinstance(value, list):
                return [_sanitize(v) for v in value]
            if isinstance(value, tuple):
                return [_sanitize(v) for v in value]
            if isinstance(value, dict):
                out: Dict[str, Any] = {}
                for k, v in value.items():
                    # 不持久化运行期句柄，避免序列化失败与无意义的恢复
                    if k in {"agent", "model", "tool_handle", "client"}:
                        continue
                    out[k] = _sanitize(v)
                return out
            # best-effort: try to JSON-dump; if fails, return a readable placeholder
            try:
                json.dumps(value)
                return value
            except Exception:
                # 尽量给出少量信息而非抛错
                cls = value.__class__.__name__
                return f"<{cls}>"

        payload = {
            "inputs": _sanitize(self.inputs),
            "vars": _sanitize(self.vars),
            "outputs": _sanitize(self.outputs),
            "step_index": self.step_index,
            "step_name": self.step_name,
        }
        return json.dumps(payload, ensure_ascii=False)

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
        # 支持从已保存的step_index恢复（如果>0，则从该索引开始）
        start_index = 0
        try:
            start_index = int(ctx.step_index or 0)
        except Exception:
            start_index = 0

        for idx, step in enumerate(self.steps[start_index:], start=start_index):
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
