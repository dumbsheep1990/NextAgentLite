-- Add selected_tools JSONB column to user_agents and ensure tools_config exists
ALTER TABLE IF EXISTS user_agents
    ADD COLUMN IF NOT EXISTS selected_tools JSONB DEFAULT '[]'::jsonb;

-- Optional: backfill selected_tools from tools_config.selected if present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='user_agents' AND column_name='tools_config'
    ) THEN
        UPDATE user_agents
        SET selected_tools = COALESCE((tools_config->'selected'), '[]'::jsonb)
        WHERE (selected_tools IS NULL OR jsonb_typeof(selected_tools) IS DISTINCT FROM 'array');
    END IF;
END $$;

-- Create an index for selected_tools if needed (GIN for array membership queries)
CREATE INDEX IF NOT EXISTS idx_user_agents_selected_tools ON user_agents USING GIN (selected_tools);

