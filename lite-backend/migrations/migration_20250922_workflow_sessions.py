"""Create workflow_sessions table"""
from sqlalchemy import text
import db.database as database_module


async def upgrade():
    sql = """
    CREATE TABLE IF NOT EXISTS workflow_sessions (
        id uuid PRIMARY KEY,
        agent_name varchar(200) NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'running',
        inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
        vars jsonb NOT NULL DEFAULT '{}'::jsonb,
        outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
        step_index varchar(32) DEFAULT '0',
        step_name varchar(200) DEFAULT '',
        cancel_flag varchar(8) DEFAULT '0',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_workflow_sessions_agent ON workflow_sessions(agent_name);
    CREATE INDEX IF NOT EXISTS idx_workflow_sessions_status ON workflow_sessions(status);
    """
    async with database_module.async_engine.begin() as conn:
        await conn.execute(text(sql))

