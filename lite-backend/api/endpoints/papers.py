"""
论文管理端点
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import json

try:
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select, func
except ImportError:
    AsyncSession = None

try:
    from db.database import get_db
except ImportError:
    def get_db():
        return None

from core.logger import logger

try:
    from models.paper import Paper
except ImportError:
    Paper = None

router = APIRouter()


class PaperResponse(BaseModel):
    """论文数据响应模型"""
    id: int
    title: str
    authors: str
    journal: Optional[str]
    year: Optional[int]
    pages: Optional[str]
    doi: Optional[str]
    url: Optional[str]
    abstract: Optional[str]
    keywords: Optional[List[str]]
    processed: str
    confidence_score: float


class PaperSearchResponse(BaseModel):
    """论文搜索响应模型"""
    papers: List[PaperResponse]
    total: int
    page: int
    size: int


@router.get("/", response_model=PaperSearchResponse)
async def get_papers(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页大小"),
    search: Optional[str] = Query(None, description="搜索查询"),
    year: Optional[int] = Query(None, description="按年份筛选"),
    processed: Optional[str] = Query(None, description="按处理状态筛选"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取论文列表，支持分页和筛选
    """
    try:
        # 构建查询
        query = select(Paper)
        count_query = select(func.count(Paper.id))
        
        # 应用筛选条件
        if search:
            search_filter = Paper.title.ilike(f"%{search}%") | Paper.abstract.ilike(f"%{search}%")
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        
        if year:
            query = query.where(Paper.year == year)
            count_query = count_query.where(Paper.year == year)
        
        if processed:
            query = query.where(Paper.processed == processed)
            count_query = count_query.where(Paper.processed == processed)
        
        # 获取总数
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # 应用分页
        offset = (page - 1) * size
        query = query.offset(offset).limit(size).order_by(Paper.created_at.desc())
        
        # 执行查询
        result = await db.execute(query)
        papers = result.scalars().all()
        
        # 转换为响应格式
        paper_responses = []
        for paper in papers:
            keywords = paper.keywords if isinstance(paper.keywords, list) else []
            paper_responses.append(PaperResponse(
                id=paper.id,
                title=paper.title,
                authors=paper.authors,
                journal=paper.journal,
                year=paper.year,
                pages=paper.pages,
                doi=paper.doi,
                url=paper.url,
                abstract=paper.abstract,
                keywords=keywords,
                processed=paper.processed,
                confidence_score=paper.confidence_score
            ))
        
        return PaperSearchResponse(
            papers=paper_responses,
            total=total,
            page=page,
            size=size
        )
        
    except Exception as e:
        logger.error(f"Error getting papers: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting papers: {str(e)}")


@router.get("/{paper_id}", response_model=PaperResponse)
async def get_paper(
    paper_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    根据ID获取指定论文
    """
    try:
        result = await db.execute(select(Paper).where(Paper.id == paper_id))
        paper = result.scalar_one_or_none()
        
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
        
        keywords = paper.keywords if isinstance(paper.keywords, list) else []
        
        return PaperResponse(
            id=paper.id,
            title=paper.title,
            authors=paper.authors,
            journal=paper.journal,
            year=paper.year,
            pages=paper.pages,
            doi=paper.doi,
            url=paper.url,
            abstract=paper.abstract,
            keywords=keywords,
            processed=paper.processed,
            confidence_score=paper.confidence_score
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting paper {paper_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting paper: {str(e)}")


@router.get("/search/similar")
async def search_similar_papers(
    query: str = Query(..., description="搜索查询"),
    limit: int = Query(10, ge=1, le=50, description="结果数量"),
    db: AsyncSession = Depends(get_db)
):
    """
    使用智能体搜索相似论文
    """
    try:
        from service.agent_service import AgentService
        from core.config_optimized import optimized_config_manager as settings
        
        agent_service = AgentService(settings)
        # 使用文献检索专家智能体搜索相关论文
        similar_papers = await agent_service.search_literature(query, limit=limit)
        
        return {
            "query": query,
            "results": similar_papers,
            "total": len(similar_papers)
        }
        
    except Exception as e:
        logger.error(f"Error searching similar papers: {e}")
        raise HTTPException(status_code=500, detail=f"Error searching papers: {str(e)}")


@router.get("/stats/overview")
async def get_papers_stats(db: AsyncSession = Depends(get_db)):
    """
    获取论文概览统计信息
    """
    try:
        # 论文总数
        total_result = await db.execute(select(func.count(Paper.id)))
        total_papers = total_result.scalar()
        
        # 按处理状态分组统计
        status_result = await db.execute(
            select(Paper.processed, func.count(Paper.id)).group_by(Paper.processed)
        )
        status_stats = {row[0]: row[1] for row in status_result.fetchall()}
        
        # 按年份分组统计
        year_result = await db.execute(
            select(Paper.year, func.count(Paper.id))
            .where(Paper.year.isnot(None))
            .group_by(Paper.year)
            .order_by(Paper.year.desc())
            .limit(10)
        )
        year_stats = {row[0]: row[1] for row in year_result.fetchall()}
        
        # Average confidence score
        confidence_result = await db.execute(select(func.avg(Paper.confidence_score)))
        avg_confidence = confidence_result.scalar() or 0.0
        
        return {
            "total_papers": total_papers,
            "status_distribution": status_stats,
            "year_distribution": year_stats,
            "average_confidence": round(avg_confidence, 2)
        }
        
    except Exception as e:
        logger.error(f"Error getting papers stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}") 