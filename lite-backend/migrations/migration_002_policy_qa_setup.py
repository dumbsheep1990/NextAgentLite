"""
迁移 002: 政策问答系统配置
应用政策问答团队配置到数据库
"""
import asyncio
import json
import yaml
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

from db.database import get_db_session
from sqlalchemy import text
from core.logger import logger

async def upgrade():
    """应用政策问答系统配置"""
    logger.info("开始应用政策问答系统配置迁移...")
    
    try:
        # 读取政策问答配置文件
        config_file = Path(__file__).parent.parent / "config" / "policy_qa_team_templates.yaml"
        
        if not config_file.exists():
            logger.error(f"配置文件不存在: {config_file}")
            return
        
        with open(config_file, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
        
        async with get_db_session() as session:
            # 1. 插入智能体配置
            await _insert_agent_configs(session, config.get("agents", {}))
            
            # 2. 插入团队执行模板
            await _insert_team_templates(session, config.get("dag_execution_templates", {}))
            
            # 3. 插入团队成员配置
            await _insert_team_members(session, config.get("agent_teams", {}))
            
            await session.commit()
            logger.info("政策问答系统配置迁移完成")
            
    except Exception as e:
        logger.error(f"政策问答系统配置迁移失败: {e}")
        raise

async def _insert_agent_configs(session, agents_config: Dict[str, Any]):
    """插入智能体配置"""
    logger.info("插入智能体配置...")
    
    for agent_id, config in agents_config.items():
        # 合并instructions为系统提示词
        instructions = config.get("instructions", [])
        extra_config = {
            "role": config.get("role", ""),
            "system_prompt": "\n".join([f"- {instruction}" for instruction in instructions]),
            "show_tool_calls": config.get("show_tool_calls", True),
            "markdown": config.get("markdown", True)
        }
        
        query = text("""
            INSERT INTO agent_configs (
                id, agent_name, team_name, model_provider, model_id,
                temperature, max_tokens, top_p, frequency_penalty, presence_penalty,
                extra_config, is_active, created_at
            ) VALUES (
                :id, :agent_name, :team_name, :model_provider, :model_id,
                :temperature, :max_tokens, :top_p, :frequency_penalty, :presence_penalty,
                :extra_config, true, :created_at
            )
            ON CONFLICT (id) DO UPDATE SET
                agent_name = EXCLUDED.agent_name,
                team_name = EXCLUDED.team_name,
                model_provider = EXCLUDED.model_provider,
                model_id = EXCLUDED.model_id,
                temperature = EXCLUDED.temperature,
                max_tokens = EXCLUDED.max_tokens,
                top_p = EXCLUDED.top_p,
                frequency_penalty = EXCLUDED.frequency_penalty,
                presence_penalty = EXCLUDED.presence_penalty,
                extra_config = EXCLUDED.extra_config,
                updated_at = :created_at
        """)
        
        await session.execute(query, {
            "id": agent_id,
            "agent_name": config.get("name", agent_id),
            "team_name": "nextAgent_policy_qa_team",
            "model_provider": config.get("model_provider", "one_api"),
            "model_id": config.get("model_id", ""),
            "temperature": config.get("temperature", 0.1),
            "max_tokens": config.get("max_tokens", 2048),
            "top_p": config.get("top_p", 1.0),
            "frequency_penalty": config.get("frequency_penalty", 0.0),
            "presence_penalty": config.get("presence_penalty", 0.0),
            "extra_config": json.dumps(extra_config),
            "created_at": datetime.now()
        })
    
    logger.info(f"插入了 {len(agents_config)} 个智能体配置")

async def _insert_team_templates(session, templates_config: Dict[str, Any]):
    """插入团队执行模板"""
    logger.info("插入团队执行模板...")
    
    for template_id, config in templates_config.items():
        # 构建代理序列和执行流程
        execution_sequence = config.get("execution_sequence", [])
        
        # 构建团队配置
        team_config = {
            "mode": config.get("execution_mode", "sequential"),
            "members": [step.get("agent") for step in execution_sequence if step.get("agent")],
            "timeout_seconds": config.get("timeout_seconds", 30),
            "parallel_execution": config.get("parallel_execution", False)
        }
        
        # 构建执行流程
        execution_flow = {
            "steps": execution_sequence,
            "dependencies": {},
            "parallel_agents": config.get("parallel_agents", [])
        }
        
        # 构建依赖关系
        for step in execution_sequence:
            agent_name = step.get("agent")
            if agent_name and step.get("depends_on"):
                execution_flow["dependencies"][agent_name] = step["depends_on"]
        
        query = text("""
            INSERT INTO team_execution_templates (
                template_name, description, team_config, execution_flow, 
                is_default, created_at
            ) VALUES (
                :template_name, :description, :team_config, :execution_flow,
                false, :created_at
            )
            ON CONFLICT (template_name) DO UPDATE SET
                description = EXCLUDED.description,
                team_config = EXCLUDED.team_config,
                execution_flow = EXCLUDED.execution_flow,
                updated_at = :created_at
        """)
        
        await session.execute(query, {
            "template_name": template_id,
            "description": config.get("description", config.get("name", template_id)),
            "team_config": json.dumps(team_config),
            "execution_flow": json.dumps(execution_flow),
            "created_at": datetime.now()
        })
    
    logger.info(f"插入了 {len(templates_config)} 个团队执行模板")

async def _insert_team_members(session, teams_config: Dict[str, Any]):
    """插入团队成员配置"""
    logger.info("插入团队成员配置...")
    
    for team_id, config in teams_config.items():
        # 获取团队成员和协调器
        members = config.get("members", [])
        coordinator = config.get("coordinator")
        
        # 构建完整的智能体序列（包含所有成员）
        all_agents = []
        if coordinator:
            all_agents.append(coordinator)
        all_agents.extend(members)
        
        # 插入团队成员记录
        for member in all_agents:
            # 获取智能体配置以获取名称
            agent_name = member  # 默认使用agent_id作为名称
            
            member_query = text("""
                INSERT INTO team_members (
                    team_name, member_id, member_name, role, model_provider, model_id, 
                    is_active, created_at
                ) VALUES (
                    :team_name, :member_id, :member_name, :role, :model_provider, :model_id,
                    true, :created_at
                )
                ON CONFLICT (team_name, member_id) DO UPDATE SET
                    member_name = EXCLUDED.member_name,
                    role = EXCLUDED.role,
                    model_provider = EXCLUDED.model_provider,
                    model_id = EXCLUDED.model_id,
                    updated_at = :created_at
            """)
            
            role = "coordinator" if member == coordinator else "agent"
            
            await session.execute(member_query, {
                "team_name": team_id,
                "member_id": member,
                "member_name": agent_name,
                "role": role,
                "model_provider": "one_api",
                "model_id": "Qwen/Qwen3-30B-A3B-Thinking-2507",
                "created_at": datetime.now()
            })
    
    logger.info(f"插入了 {len(teams_config)} 个团队配置")

# 回滚函数（可选）
async def downgrade():
    """回滚政策问答系统配置"""
    logger.info("开始回滚政策问答系统配置...")
    
    async with get_db_session() as session:
        # 删除政策相关的配置
        await session.execute(text("""
            DELETE FROM team_members 
            WHERE team_id LIKE '%policy%' OR team_id = 'nextAgent_policy_qa_team'
        """))
        
        await session.execute(text("""
            DELETE FROM team_execution_templates 
            WHERE template_id LIKE '%policy%' OR team_name LIKE '%政策%'
        """))
        
        await session.execute(text("""
            DELETE FROM agent_configs 
            WHERE agent_id IN (
                'intelligent_routing_agent',
                'knowledge_retrieval_agent', 
                'knowledge_graph_agent',
                'summary_answer_agent',
                'policy_qa_coordinator'
            )
        """))
        
        await session.commit()
        logger.info("政策问答系统配置回滚完成")

if __name__ == "__main__":
    # 可以单独运行这个迁移
    asyncio.run(upgrade())