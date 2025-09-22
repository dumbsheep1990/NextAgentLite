"""
检索服务适配器
根据配置选择使用标准版或带QA路由的V2版检索服务
"""
import os
from typing import Optional
from uuid import UUID

from core.logger import logger
from core.config_optimized import optimized_config_manager


class RetrievalServiceAdapter:
    """检索服务适配器"""
    
    def __init__(self):
        self._service = None
        self._use_v2 = self._should_use_v2()
        self._initialize_service()
    
    def _should_use_v2(self) -> bool:
        """判断是否使用V2版本"""
        # 从环境变量读取配置
        use_qa_routing = os.getenv("USE_QA_ROUTING", "true").lower() == "true"
        
        # 或从配置文件读取
        try:
            config = optimized_config_manager.settings
            if hasattr(config, 'features') and hasattr(config.features, 'use_qa_routing'):
                use_qa_routing = config.features.use_qa_routing
        except Exception as e:
            logger.warning(f"无法读取配置，使用默认值: {e}")
        
        logger.info(f"检索服务配置: 使用QA路由 = {use_qa_routing}")
        return use_qa_routing
    
    def _initialize_service(self):
        """初始化服务"""
        if self._use_v2:
            from service.intelligent_retrieval_service_with_routing import intelligent_retrieval_service_with_routing
            self._service = intelligent_retrieval_service_with_routing
            logger.info("使用增强版检索服务 - 包含QA路由")
        else:
            from service.intelligent_retrieval_service import intelligent_retrieval_service
            self._service = intelligent_retrieval_service
            logger.info("使用标准版检索服务")
    
    async def intelligent_search(
        self,
        query: str,
        top_k: int = 20,
        filters: Optional[dict] = None,
        collection_id: Optional[str] = None,
        knowledge_base_id: Optional[UUID] = None,
        user_mode: Optional[str] = None,
        include_highlights: bool = True,
        enable_reranking: bool = True,
        original_query: Optional[str] = None,
        translated_query: Optional[str] = None,
        session_id: Optional[str] = None
    ):
        """
        执行智能搜索
        自动选择使用标准版或V2版服务
        """
        
        # 如果是V2版本且提供了知识库ID，使用增强搜索
        if self._use_v2 and hasattr(self._service, 'intelligent_search_with_routing'):
            try:
                # 尝试从collection_id或filters中提取knowledge_base_id
                if not knowledge_base_id:
                    if collection_id:
                        # 尝试从collection_id获取关联的knowledge_base_id
                        from db.repositories.knowledge_repository import knowledge_repository
                        try:
                            kb_info = await knowledge_repository.get_knowledge_source_by_collection(collection_id)
                            if kb_info:
                                knowledge_base_id = kb_info.get('id')
                        except Exception as e:
                            logger.debug(f"无法从collection_id获取knowledge_base_id: {e}")
                
                # 使用V2版本的增强搜索
                result = await self._service.intelligent_search_with_routing(
                    query=query,
                    knowledge_base_id=knowledge_base_id,
                    top_k=top_k,
                    filters=filters,
                    collection_id=collection_id,
                    user_mode=user_mode,
                    include_highlights=include_highlights,
                    enable_reranking=enable_reranking,
                    use_qa_routing=bool(knowledge_base_id),  # 只有有知识库ID时才使用QA路由
                    session_id=session_id
                )
                
                # 记录QA路由使用情况
                if hasattr(result, 'qa_route_matched') and result.qa_route_matched:
                    logger.info(f"QA路由匹配成功: {result.qa_route_info}")
                
                return result
                
            except Exception as e:
                logger.error(f"V2版检索失败，回退到标准版: {e}")
        
        # 使用标准版服务
        return await self._service.intelligent_search(
            query=query,
            top_k=top_k,
            filters=filters,
            collection_id=collection_id,
            user_mode=user_mode,
            include_highlights=include_highlights,
            enable_reranking=enable_reranking,
            original_query=original_query,
            translated_query=translated_query
        )
    
    def __getattr__(self, name):
        """代理其他方法调用到实际服务"""
        return getattr(self._service, name)


# 创建全局适配器实例
retrieval_adapter = RetrievalServiceAdapter()


# 导出统一接口
intelligent_retrieval_service = retrieval_adapter