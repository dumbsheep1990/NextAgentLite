-- 检查测试服务器数据库中 agent_templates 的 team_members 字段结构
-- 执行方式：PGPASSWORD='数据库密码' psql -h 8.136.49.11 -p 5432 -U 数据库用户 -d 数据库名 -f check_remote_db.sql

-- 1. 查看某个team类型模板的完整数据
SELECT
    id,
    template_code,
    template_name,
    template_type,
    jsonb_pretty(team_members) as team_members_pretty
FROM agent_templates
WHERE template_type = 'team'
LIMIT 1;

-- 2. 检查 team_members 中第一个成员是否包含 prompt 字段
SELECT
    id,
    template_code,
    template_name,
    team_members->0->>'agent_id' as first_member_agent_id,
    team_members->0->>'name' as first_member_name,
    team_members->0->>'prompt' as first_member_prompt,
    length(team_members->0->>'prompt') as prompt_length
FROM agent_templates
WHERE template_type = 'team'
LIMIT 3;

-- 3. 统计有多少team模板的 team_members 包含完整的 prompt 信息
SELECT
    COUNT(*) as total_team_templates,
    COUNT(CASE WHEN team_members->0->>'prompt' IS NOT NULL AND team_members->0->>'prompt' != '' THEN 1 END) as has_prompt_count,
    COUNT(CASE WHEN team_members->0->>'prompt' IS NULL OR team_members->0->>'prompt' = '' THEN 1 END) as no_prompt_count
FROM agent_templates
WHERE template_type = 'team';
