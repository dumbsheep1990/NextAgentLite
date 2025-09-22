"""
知识库临时端点 - 从knowledge.py安全拆分出来的临时接口
这是第一次安全拆分尝试，只包含无依赖的临时端点
"""
from fastapi import APIRouter

# 创建独立的路由器
temp_router = APIRouter()

@temp_router.get("/collections")
async def list_collections_temp():
    """临时Collection列表API - 用于前端测试"""
    return {
        "collections": [],
        "total": 0,
        "page": 1,
        "size": 10
    }

@temp_router.get("/collections/statistics/global")
async def get_global_statistics_temp():
    """临时全局统计API"""
    return {
        "total_collections": 0,
        "total_documents": 0,
        "total_vectorized": 0,
        "active_collections": 0,
        "template_distribution": {
            "general": 0,
            "policy": 0,
            "academic": 0,
            "enterprise": 0
        },
        "recent_activity": []
    }

@temp_router.get("/metadata-templates/types")
async def get_template_types_temp():
    """临时模版类型API"""
    return {
        "types": [
            {
                "id": "general",
                "name": "通用模版",
                "description": "适用于一般文档的元数据模版",
                "fields": ["title", "description", "tags", "category"],
                "required_fields": ["title"]
            },
            {
                "id": "policy",
                "name": "政策文档模版", 
                "description": "适用于政策类文档的元数据模版",
                "fields": ["title", "policy_type", "effective_date", "department", "description"],
                "required_fields": ["title", "policy_type"]
            },
            {
                "id": "academic",
                "name": "学术论文模版",
                "description": "适用于学术论文的元数据模版", 
                "fields": ["title", "authors", "journal", "publication_date", "abstract", "keywords"],
                "required_fields": ["title", "authors"]
            },
            {
                "id": "enterprise",
                "name": "企业文档模版",
                "description": "适用于企业内部文档的元数据模版",
                "fields": ["title", "department", "document_type", "version", "approval_status"],
                "required_fields": ["title", "department"]
            }
        ]
    }

@temp_router.get("/metadata-templates")
async def list_templates_temp():
    """临时模版列表API"""
    return {
        "templates": [
            {
                "id": "general",
                "name": "通用模版",
                "description": "适用于一般文档",
                "type": "general",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00",
                "template_schema": {"type": "object", "properties": {}},
                "usage_count": 0
            },
            {
                "id": "policy",
                "name": "政策文档模版",
                "description": "适用于政策类文档",
                "type": "policy", 
                "is_active": True,
                "created_at": "2024-01-01T00:00:00",
                "template_schema": {"type": "object", "properties": {}},
                "usage_count": 0
            },
            {
                "id": "academic", 
                "name": "学术论文模版",
                "description": "适用于学术论文",
                "type": "academic",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00",
                "template_schema": {"type": "object", "properties": {}},
                "usage_count": 0
            },
            {
                "id": "enterprise",
                "name": "企业文档模版", 
                "description": "适用于企业内部文档",
                "type": "enterprise",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00",
                "template_schema": {"type": "object", "properties": {}},
                "usage_count": 0
            }
        ],
        "total": 4,
        "page": 1,
        "size": 10
    }