# NextAgent知识库检索系统适应性升级开发计划

## 项目背景

基于现有NextAgent智能体开发平台，在保持原有功能完整性的前提下，进行适应性二次开发升级。核心目标是实现设计文档中提出的"时间轴上的结构化对象"检索模式，提升系统的检索精度、元数据管理能力和时序化结构支持。

## 系统现状分析

### 当前技术架构
- **数据存储**: PostgreSQL (with pgvector) + Elasticsearch + Redis
- **AI框架**: Agno多智能体协作框架
- **后端**: FastAPI + Python 3.11
- **前端**: React 18 + TypeScript + Ant Design

### 现有核心模块
1. **知识库模型**: `KnowledgeDocument` + `DocumentChunk`
2. **嵌入服务**: `EmbeddingService` + `VectorizationConfigService`
3. **检索服务**: `IntelligentRetrievalService` + `WeightedRetrievalService`
4. **多智能体**: `AdvancedAgentTeamService` + 工具化抽象层
5. **配置管理**: `OptimizedConfigManager` + 环境变量注入

## 核心升级需求

### 1. 元数据结构扩展 (无侵入式)
**目标**: 支持文档生命周期、时效性管理、层级标签等丰富元数据

### 2. 时序化检索逻辑
**目标**: 实现Filter-then-Rerank检索模式，支持时间轴过滤

### 3. 向量化过程增强
**目标**: 元数据继承机制，分块级别的完整信息保持

### 4. 智能体协作优化
**目标**: 基于现有Agno框架，增强专业化分工和动态调度

## 适应性开发策略

### 核心原则
1. **装饰器模式**: 通过装饰器扩展现有服务，而非重写
2. **独立业务逻辑**: 新功能以独立模块形式集成
3. **向后兼容**: 确保原有API和功能完全保持
4. **渐进式升级**: 分阶段实施，每个阶段都可独立验证

## 详细开发计划

### 第一阶段: 元数据模型扩展 (1周)

#### 1.1 数据库表结构增强
**方案**: 通过ALTER TABLE添加新字段，保持现有字段不变

```sql
-- 扩展knowledge_documents表
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS policy_title VARCHAR(500);
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS doc_number VARCHAR(100);
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(200);
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS publication_date DATE;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS expiration_date DATE;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS time_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS region_tags JSONB;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS industry_tags JSONB;

-- 为新字段创建索引
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_policy_title ON knowledge_documents(policy_title);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_doc_number ON knowledge_documents(doc_number);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_publication_date ON knowledge_documents(publication_date);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_time_status ON knowledge_documents(time_status);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_region_tags ON knowledge_documents USING GIN(region_tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_industry_tags ON knowledge_documents USING GIN(industry_tags);
```

#### 1.2 模型装饰器设计
**文件**: `models/enhanced_knowledge_model.py` (新增)

```python
from typing import Optional, List, Dict
from datetime import datetime
from functools import wraps
from models.knowledge import KnowledgeDocument

class EnhancedKnowledgeDocument:
    """知识文档增强装饰器"""
    
    def __init__(self, document: KnowledgeDocument):
        self._document = document
    
    @property
    def policy_metadata(self) -> Dict:
        """获取政策元数据"""
        return {
            'policy_title': getattr(self._document, 'policy_title', None),
            'doc_number': getattr(self._document, 'doc_number', None),
            'issuing_authority': getattr(self._document, 'issuing_authority', None),
            'publication_date': getattr(self._document, 'publication_date', None),
            'effective_date': getattr(self._document, 'effective_date', None),
            'expiration_date': getattr(self._document, 'expiration_date', None),
            'time_status': getattr(self._document, 'time_status', 'active')
        }
    
    @property
    def classification_tags(self) -> Dict:
        """获取分类标签"""
        return {
            'region_tags': getattr(self._document, 'region_tags', []),
            'industry_tags': getattr(self._document, 'industry_tags', [])
        }
    
    def calculate_time_status(self) -> str:
        """计算时效性状态"""
        now = datetime.now().date()
        effective_date = getattr(self._document, 'effective_date', None)
        expiration_date = getattr(self._document, 'expiration_date', None)
        
        if effective_date and now < effective_date:
            return 'pending'
        elif expiration_date and now > expiration_date:
            return 'expired'
        else:
            return 'active'

def enhanced_knowledge_document(func):
    """知识文档增强装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        if isinstance(result, KnowledgeDocument):
            return EnhancedKnowledgeDocument(result)
        elif isinstance(result, list) and result and isinstance(result[0], KnowledgeDocument):
            return [EnhancedKnowledgeDocument(doc) for doc in result]
        return result
    return wrapper
```

### 第二阶段: 向量化过程增强 (1周)

#### 2.1 元数据继承装饰器
**文件**: `service/enhanced_vectorization_service.py` (新增)

```python
from service.embedding_service import embedding_service
from functools import wraps
import asyncio

class MetadataInheritanceDecorator:
    """元数据继承装饰器"""
    
    def __init__(self, original_service):
        self.original_service = original_service
    
    @enhanced_vectorization
    async def vectorize_document_chunks(self, document_id: str, chunks: List[Dict]) -> List[Dict]:
        """增强型文档分块向量化 - 支持元数据继承"""
        
        # 获取文档元数据
        document_metadata = await self._get_document_metadata(document_id)
        
        # 为每个chunk注入完整元数据
        enhanced_chunks = []
        for chunk in chunks:
            enhanced_chunk = {
                **chunk,
                'inherited_metadata': {
                    'doc_id': document_id,
                    'policy_title': document_metadata.get('policy_title'),
                    'doc_number': document_metadata.get('doc_number'),
                    'issuing_authority': document_metadata.get('issuing_authority'),
                    'publication_date': document_metadata.get('publication_date'),
                    'time_status': document_metadata.get('time_status'),
                    'region_tags': document_metadata.get('region_tags', []),
                    'industry_tags': document_metadata.get('industry_tags', [])
                }
            }
            enhanced_chunks.append(enhanced_chunk)
        
        # 调用原始向量化服务
        return await self.original_service.vectorize_document_chunks(document_id, enhanced_chunks)

def enhanced_vectorization(func):
    """向量化增强装饰器"""
    @wraps(func)
    async def wrapper(self, *args, **kwargs):
        # 在向量化前后添加元数据处理逻辑
        return await func(self, *args, **kwargs)
    return wrapper

# 应用装饰器到现有服务
enhanced_embedding_service = MetadataInheritanceDecorator(embedding_service)
```

#### 2.2 Elasticsearch索引增强
**文件**: `service/enhanced_elasticsearch_service.py` (新增)

```python
from service.intelligent_retrieval_service import intelligent_retrieval_service

class EnhancedElasticsearchService:
    """ES服务增强装饰器"""
    
    def __init__(self, original_service):
        self.original_service = original_service
    
    async def index_chunk_with_metadata(self, chunk_data: Dict) -> bool:
        """索引分块时包含完整元数据"""
        
        enhanced_doc = {
            'chunk_id': chunk_data['chunk_id'],
            'doc_id': chunk_data['doc_id'],
            'text': chunk_data['text'],
            
            # 继承的文档元数据
            'policy_title': chunk_data.get('inherited_metadata', {}).get('policy_title'),
            'doc_number': chunk_data.get('inherited_metadata', {}).get('doc_number'),
            'issuing_authority': chunk_data.get('inherited_metadata', {}).get('issuing_authority'),
            'publication_date': chunk_data.get('inherited_metadata', {}).get('publication_date'),
            'effective_date': chunk_data.get('inherited_metadata', {}).get('effective_date'),
            'time_status': chunk_data.get('inherited_metadata', {}).get('time_status'),
            'region_tags': chunk_data.get('inherited_metadata', {}).get('region_tags', []),
            'industry_tags': chunk_data.get('inherited_metadata', {}).get('industry_tags', []),
            
            # 分块特有属性
            'chunk_type': chunk_data.get('chunk_type', 'text'),
            'chunk_order': chunk_data.get('chunk_order', 0),
            
            # 时间戳
            'indexed_at': datetime.utcnow().isoformat()
        }
        
        return await self.original_service.index_document(
            index_name='enhanced_policy_chunks',
            doc_id=chunk_data['chunk_id'],
            doc_body=enhanced_doc
        )
```

### 第三阶段: Filter-then-Rerank 检索逻辑 (2周)

#### 3.1 检索策略增强装饰器
**文件**: `service/filter_rerank_retrieval_service.py` (新增)

```python
from service.intelligent_retrieval_service import intelligent_retrieval_service
from typing import List, Dict, Optional
from datetime import datetime, date

class FilterRerankRetrievalService:
    """Filter-then-Rerank检索服务"""
    
    def __init__(self, base_retrieval_service):
        self.base_service = base_retrieval_service
        self.es_client = self._get_es_client()
        self.pg_session = self._get_pg_session()
    
    async def enhanced_search(
        self, 
        query: str,
        filters: Optional[Dict] = None,
        time_range: Optional[Dict] = None,
        top_k: int = 10
    ) -> List[Dict]:
        """增强检索：实现Filter-then-Rerank模式"""
        
        # 阶段一：ES快速过滤
        candidate_chunk_ids = await self._stage_one_filter(
            query=query,
            filters=filters,
            time_range=time_range
        )
        
        if not candidate_chunk_ids:
            return []
        
        # 阶段二：在候选集内进行精准检索
        final_results = await self._stage_two_rerank(
            query=query,
            candidate_chunk_ids=candidate_chunk_ids,
            top_k=top_k
        )
        
        return final_results
    
    async def _stage_one_filter(
        self, 
        query: str, 
        filters: Dict, 
        time_range: Dict
    ) -> List[str]:
        """阶段一：ES元数据和关键词过滤"""
        
        must_clauses = []
        filter_clauses = []
        
        # 时间范围过滤
        if time_range:
            if time_range.get('start_date'):
                filter_clauses.append({
                    "range": {
                        "publication_date": {
                            "gte": time_range['start_date']
                        }
                    }
                })
            
            if time_range.get('end_date'):
                filter_clauses.append({
                    "range": {
                        "publication_date": {
                            "lte": time_range['end_date']
                        }
                    }
                })
        
        # 时效性过滤
        if filters and filters.get('time_status'):
            filter_clauses.append({
                "term": {
                    "time_status": filters['time_status']
                }
            })
        
        # 地域标签过滤
        if filters and filters.get('region_tags'):
            filter_clauses.append({
                "terms": {
                    "region_tags": filters['region_tags']
                }
            })
        
        # 行业标签过滤
        if filters and filters.get('industry_tags'):
            filter_clauses.append({
                "terms": {
                    "industry_tags": filters['industry_tags']
                }
            })
        
        # 关键词查询
        if query:
            must_clauses.append({
                "multi_match": {
                    "query": query,
                    "fields": ["text^2", "policy_title^3", "doc_number^1.5"],
                    "type": "best_fields",
                    "fuzziness": "AUTO"
                }
            })
        
        # 构建查询DSL
        search_body = {
            "query": {
                "bool": {
                    "must": must_clauses,
                    "filter": filter_clauses
                }
            },
            "_source": ["chunk_id"],
            "size": 1000  # 候选集大小
        }
        
        # 执行ES查询
        response = await self.es_client.search(
            index="enhanced_policy_chunks",
            body=search_body
        )
        
        return [hit["_source"]["chunk_id"] for hit in response["hits"]["hits"]]
    
    async def _stage_two_rerank(
        self, 
        query: str, 
        candidate_chunk_ids: List[str], 
        top_k: int
    ) -> List[Dict]:
        """阶段二：候选集内精准重排序"""
        
        # 并行执行向量检索和ES检索
        tasks = [
            self._vector_search_in_candidates(query, candidate_chunk_ids, top_k * 2),
            self._keyword_search_in_candidates(query, candidate_chunk_ids, top_k * 2)
        ]
        
        vector_results, keyword_results = await asyncio.gather(*tasks)
        
        # 结果融合和重排序
        merged_results = self._merge_and_rerank(vector_results, keyword_results, top_k)
        
        # 上下文重组
        final_results = await self._context_reconstruction(merged_results)
        
        return final_results
    
    def _merge_and_rerank(self, vector_results: List, keyword_results: List, top_k: int) -> List:
        """结果融合重排序"""
        score_dict = {}
        
        # 向量检索结果权重
        for i, result in enumerate(vector_results[:top_k * 2]):
            chunk_id = result['chunk_id']
            vector_score = result['score']
            score_dict[chunk_id] = score_dict.get(chunk_id, 0) + vector_score * 0.6
        
        # 关键词检索结果权重
        for i, result in enumerate(keyword_results[:top_k * 2]):
            chunk_id = result['chunk_id']
            keyword_score = result['score']
            score_dict[chunk_id] = score_dict.get(chunk_id, 0) + keyword_score * 0.4
        
        # 按综合分数排序
        sorted_chunks = sorted(score_dict.items(), key=lambda x: x[1], reverse=True)
        
        return [{'chunk_id': chunk_id, 'final_score': score} for chunk_id, score in sorted_chunks[:top_k]]

# 装饰现有检索服务
enhanced_retrieval_service = FilterRerankRetrievalService(intelligent_retrieval_service)
```

#### 3.2 时效性管理服务
**文件**: `service/temporal_management_service.py` (新增)

```python
from datetime import datetime, date
from typing import List, Dict
import asyncio

class TemporalManagementService:
    """时效性管理服务"""
    
    def __init__(self):
        self.pg_session = self._get_pg_session()
        self.es_client = self._get_es_client()
    
    async def daily_time_status_update(self):
        """每日时效性状态更新任务"""
        
        current_date = datetime.now().date()
        
        # 查询需要更新状态的文档
        pending_docs = await self._get_documents_with_status_change(current_date)
        
        update_tasks = []
        for doc in pending_docs:
            new_status = self._calculate_time_status(doc, current_date)
            update_tasks.append(
                self._update_document_time_status(doc['id'], new_status)
            )
        
        # 批量更新
        if update_tasks:
            await asyncio.gather(*update_tasks)
            logger.info(f"更新了 {len(update_tasks)} 个文档的时效性状态")
    
    def _calculate_time_status(self, document: Dict, current_date: date) -> str:
        """计算文档时效性状态"""
        effective_date = document.get('effective_date')
        expiration_date = document.get('expiration_date')
        
        if effective_date and current_date < effective_date:
            return 'pending'
        elif expiration_date and current_date > expiration_date:
            return 'expired'
        else:
            return 'active'
    
    async def _update_document_time_status(self, doc_id: str, new_status: str):
        """更新单个文档的时效性状态"""
        
        # 更新PostgreSQL
        await self.pg_session.execute(
            "UPDATE knowledge_documents SET time_status = :status WHERE id = :id",
            {"status": new_status, "id": doc_id}
        )
        
        # 同步更新Elasticsearch
        await self.es_client.update_by_query(
            index="enhanced_policy_chunks",
            body={
                "script": {
                    "source": "ctx._source.time_status = params.new_status",
                    "params": {"new_status": new_status}
                },
                "query": {
                    "term": {"doc_id": doc_id}
                }
            }
        )

# 创建全局实例
temporal_management_service = TemporalManagementService()
```

### 第四阶段: 智能体协作优化 (1-2周)

#### 4.1 专业化Agent增强
**文件**: `service/enhanced_agent_tools.py` (新增)

```python
from service.advanced_agent_team_service import AdvancedAgentTeamService
from service.filter_rerank_retrieval_service import enhanced_retrieval_service

class EnhancedRetrievalTools:
    """增强检索工具类"""
    
    async def temporal_policy_search(
        self, 
        query: str,
        time_range: Dict = None,
        region_filter: List[str] = None,
        industry_filter: List[str] = None
    ) -> List[Dict]:
        """时序化政策检索工具"""
        
        filters = {}
        if region_filter:
            filters['region_tags'] = region_filter
        if industry_filter:
            filters['industry_tags'] = industry_filter
        
        return await enhanced_retrieval_service.enhanced_search(
            query=query,
            filters=filters,
            time_range=time_range
        )
    
    async def policy_lifecycle_analysis(self, doc_number: str) -> Dict:
        """政策生命周期分析工具"""
        
        # 通过文号查询政策的完整生命周期信息
        policy_info = await self._get_policy_by_doc_number(doc_number)
        
        if not policy_info:
            return {"error": "未找到指定文号的政策"}
        
        lifecycle = {
            "policy_title": policy_info.get('policy_title'),
            "doc_number": policy_info.get('doc_number'),
            "issuing_authority": policy_info.get('issuing_authority'),
            "publication_date": policy_info.get('publication_date'),
            "effective_date": policy_info.get('effective_date'),
            "expiration_date": policy_info.get('expiration_date'),
            "current_status": policy_info.get('time_status'),
            "days_since_publication": self._calculate_days_since(policy_info.get('publication_date')),
            "days_until_expiration": self._calculate_days_until(policy_info.get('expiration_date'))
        }
        
        return lifecycle

class EnhancedAgentTeamService(AdvancedAgentTeamService):
    """增强版Agent团队服务"""
    
    def __init__(self):
        super().__init__()
        
        # 扩展工具集
        self.tools.update({
            'enhanced_retrieval': EnhancedRetrievalTools(),
            'temporal_management': temporal_management_service,
        })
    
    def create_policy_analysis_team(self, team_config: Dict) -> Dict:
        """创建政策分析专用团队"""
        
        enhanced_team_config = {
            **team_config,
            'specialized_tools': [
                'enhanced_retrieval',
                'temporal_management',
                'translation',
                'lightrag'
            ],
            'workflow_strategy': 'temporal_policy_analysis'
        }
        
        return self._create_specialized_team(enhanced_team_config)

# 装饰现有服务
enhanced_agent_team_service = EnhancedAgentTeamService()
```

### 第五阶段: API层适配 (1周)

#### 5.1 API装饰器扩展
**文件**: `api/endpoints/enhanced_qa.py` (新增)

```python
from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from datetime import date

from api.endpoints.qa import router as original_qa_router
from service.filter_rerank_retrieval_service import enhanced_retrieval_service
from service.enhanced_agent_tools import enhanced_agent_team_service

router = APIRouter()

@router.post("/qa/enhanced-search")
async def enhanced_policy_search(
    query: str,
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
    time_status: Optional[str] = Query("active", description="时效性状态"),
    region_tags: Optional[List[str]] = Query(None, description="地域标签"),
    industry_tags: Optional[List[str]] = Query(None, description="行业标签"),
    top_k: int = Query(10, description="返回结果数量")
):
    """增强型政策检索API"""
    
    # 构建时间范围过滤器
    time_range = {}
    if start_date:
        time_range['start_date'] = start_date.isoformat()
    if end_date:
        time_range['end_date'] = end_date.isoformat()
    
    # 构建过滤器
    filters = {'time_status': time_status}
    if region_tags:
        filters['region_tags'] = region_tags
    if industry_tags:
        filters['industry_tags'] = industry_tags
    
    # 执行增强检索
    results = await enhanced_retrieval_service.enhanced_search(
        query=query,
        filters=filters,
        time_range=time_range if time_range else None,
        top_k=top_k
    )
    
    return {
        "success": True,
        "results": results,
        "query_info": {
            "original_query": query,
            "applied_filters": filters,
            "time_range": time_range,
            "result_count": len(results)
        }
    }

@router.post("/qa/policy-lifecycle-query")
async def policy_lifecycle_query(
    doc_number: str,
    include_related: bool = Query(False, description="包含相关政策")
):
    """政策生命周期查询API"""
    
    lifecycle_info = await enhanced_agent_team_service.tools['enhanced_retrieval'].policy_lifecycle_analysis(doc_number)
    
    result = {
        "success": True,
        "lifecycle_info": lifecycle_info
    }
    
    if include_related:
        # 查询相关政策
        related_policies = await enhanced_retrieval_service.enhanced_search(
            query=lifecycle_info.get('policy_title', ''),
            filters={
                'issuing_authority': lifecycle_info.get('issuing_authority'),
                'time_status': 'active'
            },
            top_k=5
        )
        result['related_policies'] = related_policies
    
    return result

# 将新路由集成到现有系统
def integrate_enhanced_routes(app):
    """集成增强路由到现有应用"""
    app.include_router(router, prefix="/api/v1", tags=["增强问答"])
```

### 第六阶段: 定时任务集成 (0.5周)

#### 6.1 定时任务装饰器
**文件**: `core/enhanced_scheduler.py` (新增)

```python
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from service.temporal_management_service import temporal_management_service

class EnhancedScheduler:
    """增强定时任务调度器"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._setup_enhanced_jobs()
    
    def _setup_enhanced_jobs(self):
        """设置增强任务"""
        
        # 每日时效性状态更新
        self.scheduler.add_job(
            temporal_management_service.daily_time_status_update,
            'cron',
            hour=2,  # 凌晨2点执行
            minute=0,
            id='daily_time_status_update'
        )
        
        # 每周索引优化
        self.scheduler.add_job(
            self._weekly_index_optimization,
            'cron',
            day_of_week='sun',
            hour=3,
            id='weekly_index_optimization'
        )
    
    async def _weekly_index_optimization(self):
        """每周索引优化任务"""
        # ES索引优化
        # PostgreSQL统计信息更新
        pass
    
    def start(self):
        """启动调度器"""
        self.scheduler.start()
    
    def stop(self):
        """停止调度器"""
        self.scheduler.shutdown()

# 全局实例
enhanced_scheduler = EnhancedScheduler()

def integrate_enhanced_scheduler(app):
    """集成到FastAPI应用"""
    
    @app.on_event("startup")
    async def startup_enhanced_scheduler():
        enhanced_scheduler.start()
    
    @app.on_event("shutdown")
    async def shutdown_enhanced_scheduler():
        enhanced_scheduler.stop()
```

## 集成策略

### 主应用集成点
**文件**: `main.py` (修改最小)

```python
# 在现有main.py中添加导入和集成
from api.endpoints.enhanced_qa import integrate_enhanced_routes
from core.enhanced_scheduler import integrate_enhanced_scheduler

# 在create_app()函数中添加
def create_app() -> FastAPI:
    app = FastAPI(...)
    
    # ... 现有代码 ...
    
    # 集成增强功能
    integrate_enhanced_routes(app)
    integrate_enhanced_scheduler(app)
    
    return app
```

## 测试验证策略

### 单元测试
- 每个装饰器和增强服务独立测试
- 确保装饰前后原功能不受影响

### 集成测试  
- 端到端检索流程测试
- 时效性管理功能测试
- API兼容性测试

### 性能测试
- Filter-then-Rerank检索性能对比
- 大数据量下的索引性能测试

## 风险控制措施

1. **功能开关**: 所有新功能支持通过配置开关控制
2. **渐进式发布**: 分阶段部署，每个阶段独立验证
3. **回滚机制**: 保持原有服务入口，支持快速回滚
4. **监控告警**: 对新功能添加完整监控和告警机制

## 预期收益

1. **检索精度提升**: 30-50%的检索相关性提升
2. **响应速度优化**: Filter策略带来的检索速度提升
3. **用户体验增强**: 时序化检索和丰富元数据支持
4. **系统可维护性**: 装饰器模式带来的模块化优势

## 时间安排

总计: **6-7周**

- 第一阶段 (元数据扩展): 1周
- 第二阶段 (向量化增强): 1周  
- 第三阶段 (检索逻辑): 2周
- 第四阶段 (智能体优化): 1-2周
- 第五阶段 (API适配): 1周
- 第六阶段 (定时任务): 0.5周
- 测试和集成: 0.5周

每个阶段完成后进行独立测试和验证，确保系统稳定性。
