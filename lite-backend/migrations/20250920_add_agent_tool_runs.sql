-- 持久化 Agent 工具测试与执行日志
CREATE TABLE IF NOT EXISTS agent_tool_runs (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  agent_name      TEXT,
  mode            TEXT,              -- auto | manual_react
  prompt          TEXT,
  selected_tools  JSONB,             -- ["mcp:playwright", ...]
  model_id        TEXT,
  model_provider  TEXT,
  status          TEXT,              -- success | failed
  output          TEXT,
  error           TEXT,
  debug_logs      TEXT,
  manual_run      JSONB              -- 回退执行器的完整轮次
);

CREATE INDEX IF NOT EXISTS idx_agent_tool_runs_created_at ON agent_tool_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tool_runs_agent_name ON agent_tool_runs (agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_tool_runs_mode ON agent_tool_runs (mode);
