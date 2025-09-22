"""
智能体模板服务
提供智能体模板的CRUD操作和管理功能
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
import json
import asyncpg
from datetime import datetime

from core.logger import logger
from core.config_optimized import optimized_config_manager


class AgentTemplateService:
    """智能体模板服务"""
    
    def __init__(self):
        self.db_config = optimized_config_manager.settings.database_postgresql
        self.pool = None
    
    async def initialize(self):
        """初始化数据库连接池"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                host=self.db_config.host,
                port=self.db_config.port,
                user=self.db_config.username,
                password=self.db_config.password,
                database=self.db_config.database,
                min_size=2,
                max_size=10
            )
    
    async def close(self):
        """关闭连接池"""
        if self.pool:
            await self.pool.close()
    
    async def get_all_templates(self, template_type: Optional[str] = None, 
                                category: Optional[str] = None,
                                is_active: bool = True) -> List[Dict[str, Any]]:
        """
        获取所有智能体模板
        
        Args:
            template_type: 模板类型 (single/team)
            category: 分类
            is_active: 是否只获取激活的模板
        """
        await self.initialize()
        
        query = """
            SELECT 
                id,
                template_code,
                template_name,
                template_type,
                category,
                description,
                icon,
                color,
                base_config,
                model_config,
                tools_config,
                team_members,
                team_mode,
                is_system,
                is_active,
                created_at,
                updated_at
            FROM agent_templates
            WHERE 1=1
        """
        
        params = []
        param_count = 0
        
        if is_active is not None:
            param_count += 1
            query += f" AND is_active = ${param_count}"
            params.append(is_active)
        
        if template_type:
            param_count += 1
            query += f" AND template_type = ${param_count}"
            params.append(template_type)
        
        if category:
            param_count += 1
            query += f" AND category = ${param_count}"
            params.append(category)
        
        query += " ORDER BY template_type, category, template_name"
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            
            templates = []
            for row in rows:
                template = dict(row)
                # 解析JSON字段
                for field in ['base_config', 'model_config', 'tools_config', 'team_members']:
                    if template.get(field) and isinstance(template[field], str):
                        try:
                            template[field] = json.loads(template[field])
                        except:
                            pass
                templates.append(template)
            
            return templates
    
    async def get_template_by_code(self, template_code: str) -> Optional[Dict[str, Any]]:
        """根据模板代码获取模板详情"""
        await self.initialize()
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM agent_templates
                WHERE template_code = $1
            """, template_code)
            
            if not row:
                return None
            
            template = dict(row)
            # 解析JSON字段
            for field in ['base_config', 'model_config', 'tools_config', 'team_members']:
                if template.get(field) and isinstance(template[field], str):
                    try:
                        template[field] = json.loads(template[field])
                    except:
                        pass
            
            return template
    
    async def get_template_by_id(self, template_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取模板详情"""
        await self.initialize()
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM agent_templates
                WHERE id = $1
            """, template_id)
            
            if not row:
                return None
            
            template = dict(row)
            # 解析JSON字段
            for field in ['base_config', 'model_config', 'tools_config', 'team_members']:
                if template.get(field) and isinstance(template[field], str):
                    try:
                        template[field] = json.loads(template[field])
                    except:
                        pass
            
            return template
    
    async def create_template(self, template_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建新的智能体模板"""
        await self.initialize()
        
        # 准备数据
        template_code = template_data.get('template_code')
        template_name = template_data.get('template_name')
        template_type = template_data.get('template_type', 'single')
        category = template_data.get('category')
        description = template_data.get('description')
        icon = template_data.get('icon', 'RobotOutlined')
        color = template_data.get('color', '#1890ff')
        base_config = json.dumps(template_data.get('base_config', {}))
        model_config = json.dumps(template_data.get('model_config', {}))
        # 规范化 tools_config：优先对象结构，兼容历史数组写法
        _tc = template_data.get('tools_config')
        if _tc is None:
            _tc = {}
        elif isinstance(_tc, list):
            _tc = { 'selected': _tc }
        tools_config = json.dumps(_tc)
        team_members = json.dumps(template_data.get('team_members', []))
        team_mode = template_data.get('team_mode')
        is_system = template_data.get('is_system', False)
        is_active = template_data.get('is_active', True)
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO agent_templates (
                    template_code, template_name, template_type, category,
                    description, icon, color, base_config, model_config,
                    tools_config, team_members, team_mode, is_system, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *
            """, template_code, template_name, template_type, category,
                description, icon, color, base_config, model_config,
                tools_config, team_members, team_mode, is_system, is_active)
            
            template = dict(row)
            # 解析JSON字段
            for field in ['base_config', 'model_config', 'tools_config', 'team_members']:
                if template.get(field) and isinstance(template[field], str):
                    template[field] = json.loads(template[field])
            
            logger.info(f"创建智能体模板: {template_code}")
            return template
    
    async def update_template(self, template_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新智能体模板"""
        await self.initialize()
        
        # 准备更新字段
        update_fields = []
        params = []
        param_count = 0
        
        # 可更新的字段
        updatable_fields = [
            'template_name', 'description', 'category', 'icon', 'color',
            'base_config', 'model_config', 'tools_config', 'team_members',
            'team_mode', 'is_active'
        ]
        
        for field in updatable_fields:
            if field in update_data:
                param_count += 1
                update_fields.append(f"{field} = ${param_count}")
                value = update_data[field]
                # JSON字段需要序列化
                if field in ['base_config', 'model_config', 'tools_config', 'team_members']:
                    # 特殊：tools_config 兼容数组传入，统一转对象结构
                    if field == 'tools_config':
                        if value is None:
                            value = {}
                        elif isinstance(value, list):
                            value = { 'selected': value }
                    value = json.dumps(value) if not isinstance(value, str) else value
                params.append(value)
        
        if not update_fields:
            return None
        
        # 添加更新时间
        param_count += 1
        update_fields.append(f"updated_at = ${param_count}")
        params.append(datetime.utcnow())
        
        # 添加ID参数
        param_count += 1
        params.append(template_id)
        
        query = f"""
            UPDATE agent_templates
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
            RETURNING *
        """
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, *params)
            
            if not row:
                return None
            
            template = dict(row)
            # 解析JSON字段
            for field in ['base_config', 'model_config', 'tools_config', 'team_members']:
                if template.get(field) and isinstance(template[field], str):
                    template[field] = json.loads(template[field])
            
            logger.info(f"更新智能体模板: {template['template_code']}")
            return template
    
    async def delete_template(self, template_id: str) -> bool:
        """删除智能体模板（仅非系统模板）"""
        await self.initialize()
        
        async with self.pool.acquire() as conn:
            # 检查是否为系统模板
            is_system = await conn.fetchval("""
                SELECT is_system FROM agent_templates
                WHERE id = $1
            """, template_id)
            
            if is_system:
                logger.warning(f"无法删除系统模板: {template_id}")
                return False
            
            result = await conn.execute("""
                DELETE FROM agent_templates
                WHERE id = $1 AND is_system = false
            """, template_id)
            
            deleted = result.split()[-1] == "1"
            if deleted:
                logger.info(f"删除智能体模板: {template_id}")
            
            return deleted
    
    async def get_available_agents(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        获取可用的智能体列表，按类型分组
        返回格式适用于前端展示
        """
        await self.initialize()
        
        templates = await self.get_all_templates(is_active=True)
        
        # 按类型分组
        result = {
            'single': [],
            'team': []
        }
        
        for template in templates:
            simplified = {
                'id': template['id'],
                'code': template['template_code'],
                'name': template['template_name'],
                'description': template['description'],
                'category': template['category'],
                'icon': template['icon'],
                'color': template['color'],
                'is_system': template['is_system']
            }
            
            if template['template_type'] == 'team':
                simplified['team_members'] = template.get('team_members', [])
                simplified['team_mode'] = template.get('team_mode')
                result['team'].append(simplified)
            else:
                result['single'].append(simplified)
        
        return result
    
    async def get_agent_config(self, template_code: str) -> Optional[Dict[str, Any]]:
        """
        获取智能体的完整配置，用于实例化
        """
        template = await self.get_template_by_code(template_code)
        if not template:
            return None
        
        # 构建完整配置
        config = {
            'template_id': template['id'],
            'template_code': template['template_code'],
            'name': template['template_name'],
            'type': template['template_type'],
            'base_config': template.get('base_config', {}),
            'model_config': template.get('model_config', {}),
            'tools_config': template.get('tools_config', [])
        }
        
        # Team类型需要额外的配置
        if template['template_type'] == 'team':
            config['team_members'] = template.get('team_members', [])
            config['team_mode'] = template.get('team_mode')
        
        return config


# 创建全局服务实例
agent_template_service = AgentTemplateService()
