"""
知识库搜索端点 - 从knowledge.py安全拆分出来的搜索功能
包含智能检索、权重搜索、搜索建议等搜索相关功能
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from pydantic import BaseModel

from db.database import get_db
from core.logger import logger

# 本地定义响应模型（避免循环导入）
class RetrievalResult(BaseModel):
    id: str
    content: str
    score: float
    source: str
    metadata: Dict[str, Any]

class DocumentChunksResponse(BaseModel):
    document_id: str
    total_chunks: int
    chunks: List[Dict[str, Any]]

# 创建独立的路由器
search_router = APIRouter()

@search_router.post("/search/intelligent")
async def intelligent_search(
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """智能检索（真实实现）：调用混合检索服务，支持可选重排。"""
    try:
        query = request.get("query", "").strip()
        if not query:
            raise HTTPException(status_code=400, detail="查询内容不能为空")

        top_k = int(request.get("top_k", 10))
        filters = request.get("filters", {}) or {}
        collection_id = request.get("collection_id")
        use_rerank = bool(request.get("use_rerank", False))

        try:
            from service.hybrid_search_service import hybrid_search_service
        except Exception as e:
            logger.error(f"导入混合检索服务失败: {e}")
            raise HTTPException(status_code=500, detail="检索服务不可用")

        try:
            results = await hybrid_search_service.hybrid_search(
                query=query,
                top_k=top_k,
                filters=filters,
                collection_id=collection_id,
                include_highlights=True
            )
            if use_rerank and results:
                results = await hybrid_search_service.rerank_results(query, results)

            # 统一输出为简单结构
            return {
                "query": query,
                "mode": "hybrid",
                "total_results": len(results),
                "results": [
                    {
                        "id": r.id,
                        "content": r.content,
                        "score": float(r.combined_score),
                        "source": r.source.get("filename") or r.source.get("document_id") or "chunk",
                        "metadata": {
                            "title": r.title,
                            "highlights": r.highlights or {},
                        },
                    }
                    for r in results
                ],
                "timestamp": datetime.utcnow().isoformat(),
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"智能检索执行失败: {e}")
            raise HTTPException(status_code=500, detail=f"检索失败: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"智能检索失败: {e}")
        raise HTTPException(status_code=500, detail=f"智能检索失败: {str(e)}")


@search_router.post("/search/weighted")
async def weighted_search(
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """权重搜索"""
    try:
        query = request.get("query", "")
        if not query.strip():
            raise HTTPException(status_code=400, detail="查询内容不能为空")
        
        vector_weight = request.get("vector_weight", 0.7)
        keyword_weight = request.get("keyword_weight", 0.3)
        top_k = request.get("top_k", 10)
        
        # 验证权重
        if abs(vector_weight + keyword_weight - 1.0) > 0.01:
            raise HTTPException(status_code=400, detail="权重总和必须为1.0")
        
        logger.info(f"权重搜索: query='{query}', vector_weight={vector_weight}, keyword_weight={keyword_weight}")
        
        # 模拟权重搜索结果
        mock_results = []
        for i in range(min(top_k, 3)):
            # 计算综合得分
            vector_score = 0.85 - i * 0.1
            keyword_score = 0.75 - i * 0.15
            final_score = vector_score * vector_weight + keyword_score * keyword_weight
            
            mock_results.append({
                "id": f"weighted_doc_{i+1}",
                "content": f"基于权重搜索找到的相关内容: {query}，综合得分较高的结果 {i+1}",
                "final_score": round(final_score, 3),
                "vector_score": round(vector_score, 3),
                "keyword_score": round(keyword_score, 3),
                "source": f"weighted_document_{i+1}.pdf",
                "metadata": {
                    "weight_config": {
                        "vector_weight": vector_weight,
                        "keyword_weight": keyword_weight
                    },
                    "match_type": "hybrid"
                }
            })
        
        return {
            "query": query,
            "weight_config": {
                "vector_weight": vector_weight,
                "keyword_weight": keyword_weight
            },
            "total_results": len(mock_results),
            "results": mock_results,
            "search_time": 0.18,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"权重搜索失败: {e}")
        raise HTTPException(status_code=500, detail=f"权重搜索失败: {str(e)}")


@search_router.get("/search/suggestions")
async def get_search_suggestions(
    q: str = "",
    limit: int = 10
):
    """获取搜索建议"""
    try:
        if not q.strip():
            return {
                "query": q,
                "suggestions": [],
                "total": 0
            }
        
        logger.info(f"获取搜索建议: '{q}'")
        
        # 模拟搜索建议
        suggestions = [
            f"{q}的定义和特性",
            f"{q}的应用场景",
            f"{q}的技术原理",
            f"{q}相关的最新研究",
            f"{q}的发展趋势"
        ]
        
        # 限制返回数量
        suggestions = suggestions[:limit]
        
        return {
            "query": q,
            "suggestions": suggestions,
            "total": len(suggestions),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"获取搜索建议失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取搜索建议失败: {str(e)}")


@search_router.get("/search/explain")
async def explain_search():
    """获取搜索算法说明"""
    try:
        explanation = {
            "search_modes": {
                "intelligent": {
                    "name": "智能检索",
                    "description": "基于语义理解的智能搜索，能够理解查询意图",
                    "features": ["语义匹配", "上下文理解", "智能排序"],
                    "best_for": "复杂查询和概念性问题"
                },
                "vector": {
                    "name": "向量搜索", 
                    "description": "基于向量相似度的搜索",
                    "features": ["语义相似度", "深度学习嵌入", "高精度匹配"],
                    "best_for": "语义相似的内容查找"
                },
                "keyword": {
                    "name": "关键词搜索",
                    "description": "基于关键词匹配的传统搜索",
                    "features": ["精确匹配", "布尔查询", "快速响应"],
                    "best_for": "精确的术语和短语查找"
                },
                "hybrid": {
                    "name": "混合搜索",
                    "description": "结合向量搜索和关键词搜索的优势",
                    "features": ["综合排序", "多维度匹配", "平衡精度和召回"],
                    "best_for": "大多数查询场景"
                }
            },
            "weight_system": {
                "description": "权重系统允许用户自定义向量搜索和关键词搜索的比重",
                "parameters": {
                    "vector_weight": "向量搜索权重 (0-1)",
                    "keyword_weight": "关键词搜索权重 (0-1)"
                },
                "constraint": "两个权重之和必须等于1.0"
            },
            "ranking_factors": [
                "内容相关度",
                "文档质量",
                "时间新鲜度",
                "用户反馈",
                "权威性评分"
            ]
        }
        
        return explanation
        
    except Exception as e:
        logger.error(f"获取搜索说明失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取搜索说明失败: {str(e)}")


@search_router.get("/search/weights/explanation")
async def get_search_weights_explanation():
    """获取搜索权重说明"""
    try:
        explanation = {
            "title": "搜索权重系统说明",
            "description": "权重系统允许您自定义不同搜索方式的重要性",
            "weight_types": {
                "vector_weight": {
                    "name": "向量搜索权重",
                    "description": "基于语义理解的搜索权重",
                    "range": "0.0 - 1.0",
                    "recommended": "0.6 - 0.8",
                    "advantages": ["语义理解", "上下文匹配", "处理同义词"],
                    "disadvantages": ["计算复杂", "对短查询效果一般"]
                },
                "keyword_weight": {
                    "name": "关键词搜索权重", 
                    "description": "基于精确匹配的搜索权重",
                    "range": "0.0 - 1.0",
                    "recommended": "0.2 - 0.4",
                    "advantages": ["精确匹配", "快速响应", "处理专业术语"],
                    "disadvantages": ["无法理解语义", "miss同义词"]
                }
            },
            "preset_configurations": [
                {
                    "name": "语义优先",
                    "vector_weight": 0.8,
                    "keyword_weight": 0.2,
                    "description": "适合概念性查询和复杂问题"
                },
                {
                    "name": "平衡模式",
                    "vector_weight": 0.6,
                    "keyword_weight": 0.4,
                    "description": "适合大多数查询场景"
                },
                {
                    "name": "精确优先",
                    "vector_weight": 0.3,
                    "keyword_weight": 0.7,
                    "description": "适合专业术语和精确匹配"
                }
            ],
            "tips": [
                "权重总和必须等于1.0",
                "向量搜索适合理解查询意图",
                "关键词搜索适合精确术语匹配",
                "根据查询类型调整权重可获得更好效果"
            ]
        }
        
        return explanation
        
    except Exception as e:
        logger.error(f"获取权重说明失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取权重说明失败: {str(e)}")


@search_router.post("/test/retrieval", response_model=List[RetrievalResult])
async def test_retrieval(
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """测试检索（真实实现）：复用混合检索并返回简化结构，便于前端联调。"""
    try:
        query = request.get("query", "").strip()
        if not query:
            raise HTTPException(status_code=400, detail="测试查询不能为空")

        top_k = int(request.get("top_k", 5))
        filters = request.get("filters", {}) or {}
        collection_id = request.get("collection_id")

        from service.hybrid_search_service import hybrid_search_service

        results = await hybrid_search_service.hybrid_search(
            query=query,
            top_k=top_k,
            filters=filters,
            collection_id=collection_id,
            include_highlights=False
        )

        # 映射到响应模型
        return [
            RetrievalResult(
                id=r.id,
                content=r.content,
                score=float(r.combined_score),
                source=r.source.get("filename") or r.source.get("document_id") or "chunk",
                metadata={"title": r.title}
            )
            for r in results
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"测试检索失败: {e}")
        raise HTTPException(status_code=500, detail=f"测试检索失败: {str(e)}")


@search_router.get("/documents/{document_id}/chunks", response_model=DocumentChunksResponse)
async def get_document_chunks(
    document_id: str,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """获取文档分块信息"""
    try:
        logger.info(f"[CLAUDE-DEBUG] 获取文档分块: {document_id}, page={page}, size={size} - 使用真实数据库查询")
        
        # 检查文档是否存在
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        document = await repo.get_by_id(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="文档不存在")
        
        # 从数据库获取真实分块数据
        from models.knowledge import DocumentChunk as DocumentChunkModel
        from sqlalchemy import select, func
        
        # 获取总数
        count_stmt = select(func.count(DocumentChunkModel.id)).where(DocumentChunkModel.document_id == document_id)
        count_result = await db.execute(count_stmt)
        total_chunks = count_result.scalar() or 0
        
        # 分页获取数据
        offset = (page - 1) * size
        stmt = (
            select(DocumentChunkModel)
            .where(DocumentChunkModel.document_id == document_id)
            .order_by(DocumentChunkModel.chunk_index)
            .offset(offset)
            .limit(size)
        )
        result = await db.execute(stmt)
        db_chunks = result.scalars().all()
        
        chunks = []
        for db_chunk in db_chunks:
            # 检查向量状态
            has_vector = (
                (db_chunk.general_embedding and len(db_chunk.general_embedding) > 0) or
                (db_chunk.domain_embedding and len(db_chunk.domain_embedding) > 0) or
                (db_chunk.embedding and len(db_chunk.embedding) > 0)
            )
            
            # 获取向量维度
            embedding_dimension = None
            if db_chunk.general_embedding and len(db_chunk.general_embedding) > 0:
                embedding_dimension = len(db_chunk.general_embedding)
            elif db_chunk.domain_embedding and len(db_chunk.domain_embedding) > 0:
                embedding_dimension = len(db_chunk.domain_embedding)
            elif db_chunk.embedding and len(db_chunk.embedding) > 0:
                embedding_dimension = len(db_chunk.embedding)
            
            chunks.append({
                "id": db_chunk.id,  # 前端使用id作为key
                "chunk_id": db_chunk.id,  # 保持兼容性
                "content": db_chunk.content or "",
                "chunk_index": db_chunk.chunk_index,
                "chunk_size": len(db_chunk.content) if db_chunk.content else 0,
                "start_char": 0,  # 实际的start_char需要从metadata中获取
                "end_char": len(db_chunk.content) if db_chunk.content else 0,
                "tokens": len(db_chunk.content.split()) if db_chunk.content else 0,
                "vector_status": "completed" if has_vector else "pending",  # 添加vector_status字段
                "vector_dimension": embedding_dimension,
                "embedding_dimension": embedding_dimension,
                "created_at": db_chunk.created_at.isoformat() if db_chunk.created_at else None,
                "metadata": {
                    **(db_chunk.chunk_metadata or {}),
                    "has_embedding": has_vector
                }
            })
        
        return DocumentChunksResponse(
            document_id=document_id,
            total_chunks=total_chunks,
            chunks=chunks
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取文档分块失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取文档分块失败: {str(e)}")
class ESInitRequest(BaseModel):
    force: bool = False
    dims: int = 1024
    indexing: str | None = None  # none|hnsw

@search_router.post("/search/init-index")
async def init_search_index(request: ESInitRequest):
    """初始化或重建 ES 检索索引（mat_qa_chunks）。"""
    try:
        from service.hybrid_search_service import hybrid_search_service
        result = await hybrid_search_service.ensure_index(
            force=request.force,
            dims=request.dims,
            indexing=(request.indexing or 'none')
        )
        return {"success": True, "result": result}
    except Exception as e:
        logger.error(f"初始化检索索引失败: {e}")
        raise HTTPException(status_code=500, detail=f"初始化检索索引失败: {str(e)}")


class ReindexCollectionRequest(BaseModel):
    collection_id: str
    recreate_index: bool = False
    dims: int = 1024
    limit: int | None = None

@search_router.post("/search/reindex-collection")
async def reindex_collection(request: ReindexCollectionRequest):
    """将指定知识库的分块向量重新写入ES，必要时可重建索引。"""
    try:
        from service.knowledge_service import knowledge_service
        result = await knowledge_service.reindex_collection_chunks_es(
            collection_id=request.collection_id,
            recreate_index=request.recreate_index,
            dims=request.dims,
            limit=request.limit
        )
        if result.get('error'):
            raise HTTPException(status_code=500, detail=result['error'])
        return {"success": True, **result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"重建集合索引失败: {e}")
        raise HTTPException(status_code=500, detail=f"重建集合索引失败: {str(e)}")
