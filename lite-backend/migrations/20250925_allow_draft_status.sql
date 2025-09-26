-- Allow 'draft' as a valid status for user_agents
ALTER TABLE user_agents DROP CONSTRAINT IF EXISTS user_agents_status_check;
ALTER TABLE user_agents ADD CONSTRAINT user_agents_status_check CHECK (status IN ('active','inactive','deleted','draft'));

