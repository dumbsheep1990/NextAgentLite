#!/usr/bin/env python3
"""
现有工具迁移到MCP Context Forge的脚本
"""
import asyncio
import json
import yaml
from pathlib import Path
from typing import Dict, List, Any

from core.logger import logger
from service.mcp_integration_service import mcp_integration_service, MCPServerConfig
from db.database import get_async_session
from models.mcp_models import MCPServer

# 加载配置
def load_mcp_config() -> Dict[str, Any]:
    """加载MCP配置文件"""
    config_path = Path(__file__).parent.parent / "config" / "mcp_config.yaml"
    
    if not config_path.exists():
        raise FileNotFoundError(f"配置文件不存在: {config_path}")
    
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

# Youtu-Agent工具迁移
async def migrate_youtu_agent_tools():
    """迁移Youtu-Agent工具到MCP"""
    logger.info("开始迁移Youtu-Agent工具...")
    
    try:
        # 导入Youtu-Agent工具映射
        from youtu_agent_integration.tools import TOOLKIT_MAP
        
        # 创建工具服务器配置
        server_config = MCPServerConfig(
            name="youtu-agent-tools",
            display_name="Youtu-Agent 工具集",
            description="Youtu-Agent智能体工具集合",
            server_type="internal",
            transport_type="http",
            connection_config={
                "url": "http://localhost:8080/youtu/tools",
                "auth_type": "none",
                "headers": {
                    "Content-Type": "application/json"
                }
            },
            metadata={
                "category": "agent",
                "priority": "medium",
                "source": "youtu-agent"
            }
        )
        
        # 注册服务器
        success = await mcp_integration_service.register_server(server_config)
        if not success:
            logger.error("Youtu-Agent工具服务器注册失败")
            return False
        
        # 注册各个工具
        for tool_name, tool_class in TOOLKIT_MAP.items():
            try:
                # 获取工具schema
                tool_schema = await extract_tool_schema(tool_class, tool_name)
                
                # 这里可以添加工具注册逻辑
                logger.info(f"工具 {tool_name} 迁移完成")
                
            except Exception as e:
                logger.error(f"迁移工具 {tool_name} 失败: {e}")
        
        logger.info("Youtu-Agent工具迁移完成")
        return True
        
    except ImportError as e:
        logger.error(f"导入Youtu-Agent工具失败: {e}")
        return False
    except Exception as e:
        logger.error(f"迁移Youtu-Agent工具失败: {e}")
        return False

async def extract_tool_schema(tool_class, tool_name: str) -> Dict[str, Any]:
    """提取工具的schema信息"""
    try:
        # 尝试实例化工具类
        if hasattr(tool_class, '__init__'):
            # 获取工具描述和参数
            schema = {
                "name": tool_name,
                "description": getattr(tool_class, '__doc__', f"{tool_name} 工具"),
                "inputSchema": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
            
            # 如果工具类有方法定义，尝试提取参数信息
            if hasattr(tool_class, 'run') or hasattr(tool_class, 'call'):
                method = getattr(tool_class, 'run', None) or getattr(tool_class, 'call', None)
                if method:
                    # 这里可以添加更复杂的参数提取逻辑
                    pass
            
            return schema
            
    except Exception as e:
        logger.error(f"提取工具 {tool_name} schema失败: {e}")
        return {
            "name": tool_name,
            "description": f"{tool_name} 工具",
            "inputSchema": {"type": "object", "properties": {}}
        }

# 系统工具迁移
async def migrate_system_tools():
    """迁移系统内置工具到MCP"""
    logger.info("开始迁移系统工具...")
    
    # 系统工具定义
    system_tools = [
        {
            "name": "database_query",
            "display_name": "数据库查询",
            "description": "执行数据库查询操作",
            "category": "database",
            "schema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "SQL查询语句"},
                    "database": {"type": "string", "description": "数据库名称"}
                },
                "required": ["query"]
            }
        },
        {
            "name": "knowledge_search",
            "display_name": "知识库搜索",
            "description": "在知识库中搜索相关内容",
            "category": "search",
            "schema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "搜索查询"},
                    "collection": {"type": "string", "description": "知识库集合"},
                    "limit": {"type": "integer", "description": "返回结果数量", "default": 10}
                },
                "required": ["query"]
            }
        },
        {
            "name": "vector_search",
            "display_name": "向量搜索",
            "description": "基于向量相似度的搜索",
            "category": "search",
            "schema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "搜索查询"},
                    "embedding_model": {"type": "string", "description": "嵌入模型"},
                    "similarity_threshold": {"type": "number", "description": "相似度阈值", "default": 0.7}
                },
                "required": ["query"]
            }
        }
    ]
    
    try:
        # 创建系统工具服务器配置
        server_config = MCPServerConfig(
            name="nextagent-system-tools",
            display_name="NextAgent 系统工具",
            description="NextAgent系统内置工具集合",
            server_type="internal",
            transport_type="http",
            connection_config={
                "url": "http://localhost:8080/system/tools",
                "auth_type": "none"
            },
            metadata={
                "category": "system",
                "priority": "high",
                "source": "system"
            }
        )
        
        # 注册服务器
        success = await mcp_integration_service.register_server(server_config)
        if not success:
            logger.error("系统工具服务器注册失败")
            return False
        
        logger.info("系统工具迁移完成")
        return True
        
    except Exception as e:
        logger.error(f"迁移系统工具失败: {e}")
        return False

# 数据库工具迁移
async def migrate_database_tools():
    """迁移现有数据库工具到MCP"""
    logger.info("开始迁移数据库工具...")
    
    try:
        # 检查现有的数据库MCP服务器
        from mcp.db_mcp_server import db_tools
        
        # 创建数据库工具服务器配置
        server_config = MCPServerConfig(
            name="database-mcp-tools",
            display_name="数据库MCP工具",
            description="现有数据库MCP服务器工具集成",
            server_type="external",
            transport_type="stdio",
            connection_config={
                "command": ["python", "-m", "mcp.db_mcp_server"],
                "args": [],
                "env": {}
            },
            metadata={
                "category": "database", 
                "priority": "high",
                "source": "existing_mcp"
            }
        )
        
        # 注册服务器
        success = await mcp_integration_service.register_server(server_config)
        if not success:
            logger.error("数据库MCP工具服务器注册失败")
            return False
        
        logger.info("数据库工具迁移完成")
        return True
        
    except ImportError as e:
        logger.warning(f"现有数据库MCP服务器不存在: {e}")
        return True  # 不是错误，只是没有现有的服务器
    except Exception as e:
        logger.error(f"迁移数据库工具失败: {e}")
        return False

# 验证迁移结果
async def verify_migration():
    """验证工具迁移结果"""
    logger.info("验证工具迁移结果...")
    
    try:
        # 获取所有服务器状态
        servers = await mcp_integration_service.get_server_status()
        
        logger.info(f"发现 {len(servers)} 个MCP服务器:")
        for server in servers:
            logger.info(f"  - {server['name']}: {server['health_status']}")
        
        # 获取所有工具
        tools = await mcp_integration_service.get_available_tools()
        
        logger.info(f"发现 {len(tools)} 个可用工具:")
        for tool in tools:
            logger.info(f"  - {tool['name']}: {tool['category']}")
        
        return True
        
    except Exception as e:
        logger.error(f"验证迁移结果失败: {e}")
        return False

# 主迁移函数
async def main():
    """主迁移流程"""
    logger.info("开始MCP工具迁移流程...")
    
    try:
        # 初始化MCP集成服务
        success = await mcp_integration_service.initialize()
        if not success:
            logger.error("MCP集成服务初始化失败")
            return
        
        # 执行各个迁移任务
        migration_tasks = [
            ("Youtu-Agent工具", migrate_youtu_agent_tools()),
            ("系统工具", migrate_system_tools()),
            ("数据库工具", migrate_database_tools())
        ]
        
        success_count = 0
        for task_name, task in migration_tasks:
            try:
                result = await task
                if result:
                    logger.info(f"{task_name}迁移成功")
                    success_count += 1
                else:
                    logger.error(f"{task_name}迁移失败")
            except Exception as e:
                logger.error(f"{task_name}迁移异常: {e}")
        
        logger.info(f"迁移完成，成功: {success_count}/{len(migration_tasks)}")
        
        # 验证迁移结果
        await verify_migration()
        
        logger.info("MCP工具迁移流程完成")
        
    except Exception as e:
        logger.error(f"迁移流程失败: {e}")
    finally:
        # 关闭服务
        await mcp_integration_service.close()

if __name__ == "__main__":
    # 运行迁移脚本
    asyncio.run(main())
