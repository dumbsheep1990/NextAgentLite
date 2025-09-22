"""
QA路由系统数据模型
实现知识库的自定义问答路由功能
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum


class SourceType(str, Enum):
    """数据源类型"""
    MANUAL = "manual"
    IMPORTED = "imported"


class PathSourceType(str, Enum):
    """检索路径数据源类型"""
    QA_ROUTES = "qa_routes"
    QA_DATASETS = "qa_datasets"
    DOCUMENTS = "documents"


class FallbackAction(str, Enum):
    """失败后的动作"""
    CONTINUE = "continue"
    STOP = "stop"


class MatchMethod(str, Enum):
    """匹配方法"""
    EXACT = "exact"
    KEYWORD = "keyword"
    SEMANTIC = "semantic"


class ImportStatus(str, Enum):
    """导入状态"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ===================== QA路由模型 =====================

class QARouteBase(BaseModel):
    """QA路由基础模型"""
    knowledge_base_id: str  # 改为字符串类型，因为knowledge_collections表使用VARCHAR
    category: str = Field(..., max_length=100, description="分类")
    question: str = Field(..., description="问题")
    answer: str = Field(..., description="答案")
    keywords: Optional[List[str]] = Field(default=[], description="关键词列表")
    priority: int = Field(default=0, description="优先级")
    is_active: bool = Field(default=True, description="是否启用")
    source_type: SourceType = Field(default=SourceType.MANUAL, description="来源类型")
    source_ref: Optional[str] = Field(None, max_length=255, description="来源引用")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="扩展元数据")


class QARouteCreate(QARouteBase):
    """创建QA路由"""
    pass


class QARouteUpdate(BaseModel):
    """更新QA路由"""
    category: Optional[str] = Field(None, max_length=100)
    question: Optional[str] = None
    answer: Optional[str] = None
    keywords: Optional[List[str]] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class QARoute(QARouteBase):
    """QA路由完整模型"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

    class Config:
        from_attributes = True


# ===================== 检索路径配置模型 =====================

class RetrievalPathConfigBase(BaseModel):
    """检索路径配置基础模型"""
    knowledge_base_id: str
    path_name: str = Field(..., max_length=100, description="路径名称")
    path_order: int = Field(..., description="执行顺序")
    source_type: PathSourceType = Field(..., description="数据源类型")
    is_enabled: bool = Field(default=True, description="是否启用")
    config: Dict[str, Any] = Field(default_factory=dict, description="路径配置")
    fallback_action: FallbackAction = Field(default=FallbackAction.CONTINUE, description="失败动作")
    min_confidence: float = Field(default=0.7, ge=0, le=1, description="最小置信度")
    max_results: int = Field(default=5, ge=1, le=100, description="最大结果数")


class RetrievalPathConfigCreate(RetrievalPathConfigBase):
    """创建检索路径配置"""
    pass


class RetrievalPathConfigUpdate(BaseModel):
    """更新检索路径配置"""
    path_name: Optional[str] = Field(None, max_length=100)
    path_order: Optional[int] = None
    source_type: Optional[PathSourceType] = None
    is_enabled: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None
    fallback_action: Optional[FallbackAction] = None
    min_confidence: Optional[float] = Field(None, ge=0, le=1)
    max_results: Optional[int] = Field(None, ge=1, le=100)


class RetrievalPathConfig(RetrievalPathConfigBase):
    """检索路径配置完整模型"""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===================== QA路由分类模型 =====================

class QARouteCategoryBase(BaseModel):
    """QA路由分类基础模型"""
    knowledge_base_id: str
    name: str = Field(..., max_length=100, description="分类名称")
    description: Optional[str] = Field(None, description="分类描述")
    icon: Optional[str] = Field(None, max_length=50, description="图标标识")
    display_order: int = Field(default=0, description="显示顺序")
    parent_id: Optional[UUID] = Field(None, description="父分类ID")
    is_active: bool = Field(default=True, description="是否启用")


class QARouteCategoryCreate(QARouteCategoryBase):
    """创建QA路由分类"""
    pass


class QARouteCategoryUpdate(BaseModel):
    """更新QA路由分类"""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)
    display_order: Optional[int] = None
    parent_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class QARouteCategory(QARouteCategoryBase):
    """QA路由分类完整模型"""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===================== 匹配日志模型 =====================

class QARouteMatchLogCreate(BaseModel):
    """创建匹配日志"""
    qa_route_id: Optional[UUID] = None
    knowledge_base_id: str
    user_query: str
    match_score: Optional[float] = None
    match_method: Optional[MatchMethod] = None
    response_time_ms: Optional[int] = None
    is_helpful: Optional[bool] = None
    session_id: Optional[str] = Field(None, max_length=100)
    user_id: Optional[UUID] = None


class QARouteMatchLog(QARouteMatchLogCreate):
    """匹配日志完整模型"""
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ===================== 导入历史模型 =====================

class QARouteImportHistoryCreate(BaseModel):
    """创建导入历史"""
    knowledge_base_id: str
    qa_dataset_id: Optional[UUID] = None
    import_type: str = Field(..., max_length=50, description="导入类型")
    total_items: int = Field(..., ge=0, description="总条目数")
    import_config: Dict[str, Any] = Field(default_factory=dict, description="导入配置")
    created_by: Optional[UUID] = None


class QARouteImportHistory(BaseModel):
    """导入历史完整模型"""
    id: UUID
    knowledge_base_id: str
    qa_dataset_id: Optional[UUID] = None
    import_type: str
    total_items: int
    imported_items: int = 0
    failed_items: int = 0
    import_config: Dict[str, Any] = {}
    error_details: List[Dict[str, Any]] = []
    status: ImportStatus = ImportStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===================== 查询和响应模型 =====================

class QARouteQuery(BaseModel):
    """QA路由查询请求"""
    knowledge_base_id: str
    query: str
    category: Optional[str] = None
    use_semantic: bool = Field(default=True, description="是否使用语义匹配")
    max_results: int = Field(default=5, ge=1, le=20)


class QARouteSearchResult(BaseModel):
    """QA路由搜索结果"""
    route: QARoute
    match_score: float
    match_method: MatchMethod
    highlights: Optional[List[str]] = None


class RetrievalPathResult(BaseModel):
    """检索路径执行结果"""
    path_name: str
    source_type: PathSourceType
    results: List[Dict[str, Any]]
    execution_time_ms: int
    confidence_score: float
    error: Optional[str] = None


class QARoutingResponse(BaseModel):
    """QA路由完整响应"""
    query: str
    knowledge_base_id: str
    matched_routes: List[QARouteSearchResult]
    retrieval_paths: List[RetrievalPathResult]
    total_time_ms: int
    session_id: str


# ===================== 批量操作模型 =====================

class QARouteBatchImport(BaseModel):
    """批量导入QA路由"""
    knowledge_base_id: str
    qa_dataset_id: Optional[UUID] = None
    routes: List[QARouteCreate]
    category: Optional[str] = Field(None, description="统一分类")
    auto_categorize: bool = Field(default=False, description="是否自动分类")
    merge_strategy: str = Field(default="skip", description="重复处理策略: skip/replace/merge")


class QARouteBatchUpdate(BaseModel):
    """批量更新QA路由"""
    route_ids: List[UUID]
    update_data: QARouteUpdate


class QARouteBatchDelete(BaseModel):
    """批量删除QA路由"""
    route_ids: List[UUID]
    soft_delete: bool = Field(default=True, description="是否软删除")


# ===================== 统计模型 =====================

class QARouteStatistics(BaseModel):
    """QA路由统计信息"""
    knowledge_base_id: str
    total_routes: int
    active_routes: int
    categories_count: int
    avg_match_score: float
    total_matches: int
    helpful_rate: float
    last_updated: datetime


class CategoryStatistics(BaseModel):
    """分类统计信息"""
    category: str
    route_count: int
    match_count: int
    avg_score: float
    helpful_rate: float