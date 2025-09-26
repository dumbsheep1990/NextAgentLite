-- DAG 执行模板表（用于团队/多Agent编排的静态定义）
CREATE TABLE IF NOT EXISTS team_execution_templates (
    id uuid PRIMARY KEY,
    template_name varchar(200) UNIQUE NOT NULL,
    description text,
    team_config jsonb NOT NULL DEFAULT '{}'::jsonb,
    execution_flow jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_execution_templates_name ON team_execution_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_team_execution_templates_default ON team_execution_templates(is_default);

