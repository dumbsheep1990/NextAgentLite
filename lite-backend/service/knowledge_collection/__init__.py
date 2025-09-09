"""
知识库集合管理服务模块
"""
from .collection_service import KnowledgeCollectionService
from .template_service import MetadataTemplateService
from .collection_stats_service import CollectionStatsService
from .collection_chunking_service import CollectionChunkingService

__all__ = [
    'KnowledgeCollectionService',
    'MetadataTemplateService', 
    'CollectionStatsService',
    'CollectionChunkingService'
]