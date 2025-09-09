"""
元数据模版管理服务
按照组件拆分原则，控制文件大小 < 400行
"""
import uuid
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, desc, asc

from models.knowledge_collection import MetadataTemplate, DEFAULT_TEMPLATE_CONFIG, TEMPLATE_TYPES
from core.logger import logger


class MetadataTemplateService:
    """元数据模版管理服务"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_template(
        self,
        name: str,
        template_type: str,
        schema_definition: Dict[str, Any],
        description: str = None,
        version: str = "1.0",
        extraction_config: Dict[str, Any] = None,
        validation_rules: Dict[str, Any] = None,
        display_config: Dict[str, Any] = None,
        search_config: Dict[str, Any] = None,
        is_system: bool = False
    ) -> MetadataTemplate:
        """
        创建新的元数据模版
        
        Args:
            name: 模版名称
            template_type: 模版类型
            schema_definition: Schema定义
            description: 描述
            version: 版本
            extraction_config: 提取配置
            validation_rules: 验证规则
            display_config: 显示配置
            search_config: 搜索配置
            is_system: 是否系统模版
            
        Returns:
            MetadataTemplate: 创建的模版对象
        """
        try:
            # 验证模版类型
            if template_type not in TEMPLATE_TYPES.values():
                raise ValueError(f"不支持的模版类型: {template_type}")
            
            # 生成唯一ID
            template_id = str(uuid.uuid4())
            
            # 创建模版对象
            template = MetadataTemplate(
                id=template_id,
                name=name,
                template_type=template_type,
                version=version,
                description=description,
                schema_definition=schema_definition,
                extraction_config=extraction_config or {},
                validation_rules=validation_rules or {},
                display_config=display_config or {},
                search_config=search_config or {},
                is_system=is_system
            )
            
            self.session.add(template)
            await self.session.commit()
            await self.session.refresh(template)
            
            logger.info(f"创建元数据模版成功: {name} (类型: {template_type})")
            return template
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"创建元数据模版失败: {str(e)}")
            raise
    
    async def get_template(self, template_id: str) -> Optional[MetadataTemplate]:
        """
        获取指定模版
        
        Args:
            template_id: 模版ID
            
        Returns:
            Optional[MetadataTemplate]: 模版对象或None
        """
        try:
            result = await self.session.execute(
                select(MetadataTemplate).where(MetadataTemplate.id == template_id)
            )
            template = result.scalar_one_or_none()
            
            if template:
                logger.debug(f"获取元数据模版: {template.name}")
            
            return template
            
        except Exception as e:
            logger.error(f"获取元数据模版失败: {str(e)}")
            raise
    
    async def get_template_by_type(self, template_type: str) -> Optional[MetadataTemplate]:
        """
        根据类型获取系统默认模版
        
        Args:
            template_type: 模版类型
            
        Returns:
            Optional[MetadataTemplate]: 模版对象或None
        """
        try:
            result = await self.session.execute(
                select(MetadataTemplate).where(
                    MetadataTemplate.template_type == template_type,
                    MetadataTemplate.is_system == True,
                    MetadataTemplate.is_active == True
                ).order_by(desc(MetadataTemplate.created_at))
            )
            template = result.scalar_one_or_none()
            
            return template
            
        except Exception as e:
            logger.error(f"根据类型获取模版失败: {str(e)}")
            raise
    
    async def list_templates(
        self,
        template_type: Optional[str] = None,
        is_active: bool = True,
        is_system: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[MetadataTemplate]:
        """
        获取模版列表
        
        Args:
            template_type: 模版类型过滤
            is_active: 是否激活
            is_system: 是否系统模版
            skip: 跳过数量
            limit: 限制数量
            
        Returns:
            List[MetadataTemplate]: 模版列表
        """
        try:
            query = select(MetadataTemplate).where(
                MetadataTemplate.is_active == is_active
            )
            
            # 添加过滤条件
            if template_type:
                query = query.where(MetadataTemplate.template_type == template_type)
            
            if is_system is not None:
                query = query.where(MetadataTemplate.is_system == is_system)
            
            # 排序和分页
            query = query.order_by(
                desc(MetadataTemplate.is_system),  # 系统模版优先
                desc(MetadataTemplate.usage_count),  # 按使用次数排序
                desc(MetadataTemplate.created_at)   # 按创建时间排序
            ).offset(skip).limit(limit)
            
            result = await self.session.execute(query)
            templates = result.scalars().all()
            
            logger.debug(f"获取元数据模版列表: {len(templates)} 个")
            return list(templates)
            
        except Exception as e:
            logger.error(f"获取元数据模版列表失败: {str(e)}")
            raise
    
    async def update_template(
        self,
        template_id: str,
        name: str = None,
        description: str = None,
        schema_definition: Dict[str, Any] = None,
        extraction_config: Dict[str, Any] = None,
        validation_rules: Dict[str, Any] = None,
        display_config: Dict[str, Any] = None,
        search_config: Dict[str, Any] = None,
        is_active: bool = None
    ) -> Optional[MetadataTemplate]:
        """
        更新元数据模版
        
        Args:
            template_id: 模版ID
            **kwargs: 更新字段
            
        Returns:
            Optional[MetadataTemplate]: 更新后的模版对象
        """
        try:
            # 检查是否为系统模版
            template = await self.get_template(template_id)
            if not template:
                logger.warning(f"元数据模版不存在: {template_id}")
                return None
            
            if template.is_system:
                logger.error(f"无法更新系统模版: {template_id}")
                raise ValueError("无法更新系统内置模版")
            
            # 构建更新字段
            update_fields = {}
            if name is not None:
                update_fields['name'] = name
            if description is not None:
                update_fields['description'] = description
            if schema_definition is not None:
                update_fields['schema_definition'] = schema_definition
            if extraction_config is not None:
                update_fields['extraction_config'] = extraction_config
            if validation_rules is not None:
                update_fields['validation_rules'] = validation_rules
            if display_config is not None:
                update_fields['display_config'] = display_config
            if search_config is not None:
                update_fields['search_config'] = search_config
            if is_active is not None:
                update_fields['is_active'] = is_active
            
            if not update_fields:
                return template
            
            # 添加更新时间
            update_fields['updated_at'] = func.now()
            
            # 执行更新
            stmt = update(MetadataTemplate).where(
                MetadataTemplate.id == template_id
            ).values(**update_fields)
            
            result = await self.session.execute(stmt)
            
            if result.rowcount == 0:
                return None
            
            await self.session.commit()
            
            # 获取更新后的对象
            updated_template = await self.get_template(template_id)
            logger.info(f"更新元数据模版成功: {template_id}")
            
            return updated_template
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"更新元数据模版失败: {str(e)}")
            raise
    
    async def delete_template(self, template_id: str) -> bool:
        """
        删除元数据模版
        
        Args:
            template_id: 模版ID
            
        Returns:
            bool: 是否删除成功
        """
        try:
            # 检查是否为系统模版
            template = await self.get_template(template_id)
            if not template:
                logger.warning(f"元数据模版不存在: {template_id}")
                return False
            
            if template.is_system:
                logger.error(f"无法删除系统模版: {template_id}")
                raise ValueError("无法删除系统内置模版")
            
            # 执行删除
            stmt = delete(MetadataTemplate).where(
                MetadataTemplate.id == template_id
            )
            
            result = await self.session.execute(stmt)
            await self.session.commit()
            
            if result.rowcount > 0:
                logger.info(f"删除元数据模版成功: {template_id}")
                return True
            else:
                return False
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"删除元数据模版失败: {str(e)}")
            raise
    
    async def increment_usage(self, template_id: str) -> bool:
        """
        增加模版使用次数
        
        Args:
            template_id: 模版ID
            
        Returns:
            bool: 是否更新成功
        """
        try:
            stmt = update(MetadataTemplate).where(
                MetadataTemplate.id == template_id
            ).values(
                usage_count=MetadataTemplate.usage_count + 1,
                updated_at=func.now()
            )
            
            result = await self.session.execute(stmt)
            await self.session.commit()
            
            if result.rowcount > 0:
                logger.debug(f"更新模版使用次数: {template_id}")
                return True
            
            return False
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"更新模版使用次数失败: {str(e)}")
            raise
    
    async def get_template_schema(self, template_id: str) -> Optional[Dict[str, Any]]:
        """
        获取模版Schema定义
        
        Args:
            template_id: 模版ID
            
        Returns:
            Optional[Dict]: Schema定义或None
        """
        try:
            template = await self.get_template(template_id)
            if template:
                return template.schema_definition
            return None
            
        except Exception as e:
            logger.error(f"获取模版Schema失败: {str(e)}")
            raise
    
    async def validate_template_schema(
        self, 
        schema_definition: Dict[str, Any], 
        template_type: str
    ) -> Dict[str, Any]:
        """
        验证模版Schema的有效性
        
        Args:
            schema_definition: Schema定义
            template_type: 模版类型
            
        Returns:
            Dict: 验证结果
        """
        try:
            errors = []
            warnings = []
            
            # 基础验证
            if not isinstance(schema_definition, dict):
                errors.append("Schema定义必须是字典格式")
                return {"is_valid": False, "errors": errors, "warnings": warnings}
            
            if not schema_definition:
                errors.append("Schema定义不能为空")
                return {"is_valid": False, "errors": errors, "warnings": warnings}
            
            # 检查必需的结构
            required_sections = {
                'general': ['basic_info'],
                'policy': ['policy_basic', 'time_info'],
                'academic': ['publication_info'],
                'enterprise': ['business_info', 'access_control']
            }
            
            if template_type in required_sections:
                for section in required_sections[template_type]:
                    if section not in schema_definition:
                        warnings.append(f"建议包含 '{section}' 部分")
            
            # 验证每个字段的定义
            for section_name, section_data in schema_definition.items():
                if not isinstance(section_data, dict):
                    errors.append(f"部分 '{section_name}' 应该是字典格式")
                    continue
                
                for field_name, field_def in section_data.items():
                    if not isinstance(field_def, dict):
                        errors.append(f"字段 '{field_name}' 的定义应该是字典格式")
                        continue
                    
                    if 'type' not in field_def:
                        warnings.append(f"字段 '{field_name}' 缺少类型定义")
            
            is_valid = len(errors) == 0
            
            return {
                "is_valid": is_valid,
                "errors": errors,
                "warnings": warnings
            }
            
        except Exception as e:
            logger.error(f"验证模版Schema失败: {str(e)}")
            return {
                "is_valid": False,
                "errors": [f"验证过程异常: {str(e)}"],
                "warnings": []
            }
    
    async def get_templates_by_type(self, template_type: str) -> List[MetadataTemplate]:
        """
        根据类型获取所有模版
        
        Args:
            template_type: 模版类型
            
        Returns:
            List[MetadataTemplate]: 模版列表
        """
        return await self.list_templates(template_type=template_type)