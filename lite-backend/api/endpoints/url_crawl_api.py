"""
URL爬取API端点
支持单个和批量URL爬取，集成Crawl4AI和markitdown
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, HttpUrl, validator
import asyncio
from datetime import datetime

from core.logger import logger
from service.url_crawl_service import url_crawl_service, URLCrawlResult
from service.knowledge_service import knowledge_service

router = APIRouter(prefix="/api/v1/url-crawl", tags=["URL爬取"])


class URLCrawlRequest(BaseModel):
    """URL爬取请求"""
    urls: List[str]
    options: Optional[Dict[str, Any]] = {}
    
    @validator('urls', pre=True)
    def validate_urls(cls, v):
        if not v:
            raise ValueError("URLs列表不能为空")
        if len(v) > 50:  # 限制批量数量
            raise ValueError("单次最多支持50个URL")
        return v
    
    @validator('options', pre=True)
    def validate_options(cls, v):
        if v is None:
            return {}
        return v


class URLProcessRequest(BaseModel):
    """URL处理并入库请求"""
    urls: List[str]
    collection_id: Optional[str] = None
    tags: Optional[List[str]] = []
    description: Optional[str] = ""
    chunking_config_id: Optional[str] = None
    custom_chunk_size: Optional[int] = None
    custom_chunk_overlap: Optional[int] = None
    crawl_options: Optional[Dict[str, Any]] = {}


class URLCrawlResponse(BaseModel):
    """URL爬取响应"""
    success: bool
    message: str
    results: List[Dict[str, Any]]
    statistics: Dict[str, Any]


@router.post("/crawl", response_model=URLCrawlResponse)
async def crawl_urls(request: URLCrawlRequest):
    """
    批量爬取URL内容
    
    Args:
        request: URL爬取请求，包含URL列表和爬取选项
        
    Returns:
        URLCrawlResponse: 爬取结果，包含成功/失败的URL及其内容
        
    Raises:
        HTTPException: 当爬取服务初始化失败或所有URL爬取失败时
    """
    try:
        logger.info(f"开始爬取 {len(request.urls)} 个URL")
        
        # 初始化爬取服务
        async with url_crawl_service as service:
            # 批量爬取URL
            results = await service.crawl_multiple_urls(
                urls=request.urls,
                **request.options
            )
            
            # 统计结果
            successful_count = sum(1 for r in results if r.success)
            failed_count = len(results) - successful_count
            total_size = sum(r.file_size for r in results if r.success)
            
            statistics = {
                "total_urls": len(request.urls),
                "successful": successful_count,
                "failed": failed_count,
                "success_rate": successful_count / len(request.urls) * 100,
                "total_content_size": total_size,
                "average_size": total_size / successful_count if successful_count > 0 else 0
            }
            
            # 转换结果为响应格式
            response_results = []
            for result in results:
                response_results.append({
                    "url": result.url,
                    "success": result.success,
                    "title": result.title,
                    "content_size": result.file_size,
                    "markdown_preview": result.markdown[:500] + "..." if len(result.markdown) > 500 else result.markdown,
                    "metadata": result.metadata,
                    "error": result.error if not result.success else None,
                    "crawl_time": result.crawl_time.isoformat()
                })
            
            logger.info(f"URL爬取完成: 成功 {successful_count}, 失败 {failed_count}")
            
            return URLCrawlResponse(
                success=successful_count > 0,
                message=f"爬取完成：成功 {successful_count}/{len(request.urls)} 个URL",
                results=response_results,
                statistics=statistics
            )
            
    except Exception as e:
        logger.error(f"URL爬取失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"URL爬取服务异常: {str(e)}"
        )


@router.post("/process")
async def process_urls_to_knowledge(
    request: URLProcessRequest,
    background_tasks: BackgroundTasks
):
    """
    爬取URL并处理成知识文档入库
    
    Args:
        request: URL处理请求
        background_tasks: 后台任务管理器
        
    Returns:
        处理任务ID和状态
    """
    try:
        logger.info(f"开始处理 {len(request.urls)} 个URL到知识库")
        
        # 生成任务ID
        task_id = f"url_process_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{len(request.urls)}"
        
        # 添加后台任务
        background_tasks.add_task(
            _process_urls_background,
            task_id=task_id,
            urls=request.urls,
            collection_id=request.collection_id,
            tags=request.tags,
            description=request.description,
            chunking_config_id=request.chunking_config_id,
            custom_chunk_size=request.custom_chunk_size,
            custom_chunk_overlap=request.custom_chunk_overlap,
            crawl_options=request.crawl_options or {}
        )
        
        return {
            "success": True,
            "message": "URL处理任务已启动",
            "task_id": task_id,
            "status": "processing",
            "urls_count": len(request.urls)
        }
        
    except Exception as e:
        logger.error(f"URL处理任务启动失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"URL处理任务启动失败: {str(e)}"
        )


@router.get("/validate")
async def validate_url(url: str):
    """
    验证单个URL的可访问性
    
    Args:
        url: 要验证的URL
        
    Returns:
        验证结果
    """
    try:
        async with url_crawl_service as service:
            # 简单验证URL格式和可访问性
            if not service._validate_url(url):
                return {
                    "valid": False,
                    "message": "URL格式无效或被禁止访问"
                }
            
            # 尝试爬取一小部分内容验证可访问性
            result = await service.crawl_single_url(
                url, 
                use_crawl4ai=False,  # 使用基础HTTP验证更快
                word_count_threshold=10
            )
            
            return {
                "valid": result.success,
                "message": "URL验证成功" if result.success else f"URL无法访问: {result.error}",
                "title": result.title if result.success else None,
                "content_type": result.metadata.get("content_type") if result.success else None
            }
            
    except Exception as e:
        logger.error(f"URL验证失败 {url}: {e}")
        return {
            "valid": False,
            "message": f"URL验证异常: {str(e)}"
        }


async def _process_urls_background(
    task_id: str,
    urls: List[str],
    collection_id: Optional[str] = None,
    tags: Optional[List[str]] = None,
    description: Optional[str] = None,
    chunking_config_id: Optional[str] = None,
    custom_chunk_size: Optional[int] = None,
    custom_chunk_overlap: Optional[int] = None,
    crawl_options: Dict[str, Any] = {}
):
    """
    后台处理URL爬取和入库任务
    """
    try:
        logger.info(f"后台任务 {task_id} 开始处理 {len(urls)} 个URL")
        
        # 1. 爬取URL内容
        async with url_crawl_service as service:
            crawl_results = await service.crawl_multiple_urls(urls, **crawl_options)
        
        successful_results = [r for r in crawl_results if r.success]
        logger.info(f"URL爬取完成，成功 {len(successful_results)} 个")
        
        if not successful_results:
            logger.warning(f"任务 {task_id}: 没有成功爬取的URL")
            return
        
        # 2. 处理成功爬取的内容为文档
        processed_count = 0
        
        for result in successful_results:
            try:
                # 创建虚拟文档对象
                document_data = {
                    "filename": f"{result.title or 'web_content'}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.md",
                    "content": result.markdown,
                    "source_url": result.url,
                    "original_title": result.title,
                    "crawl_metadata": result.metadata,
                    "file_size": result.file_size,
                    "content_type": "text/markdown"
                }
                
                # 使用知识服务处理内容
                chunks = await knowledge_service.process_url_content(
                    document_data=document_data,
                    collection_id=collection_id,
                    tags=tags or [],
                    description=description or f"来源URL: {result.url}",
                    chunking_config_id=chunking_config_id,
                    custom_chunk_size=custom_chunk_size,
                    custom_chunk_overlap=custom_chunk_overlap
                )
                
                processed_count += 1
                logger.info(f"URL {result.url} 处理完成，生成 {len(chunks)} 个文档块")
                
            except Exception as e:
                logger.error(f"处理URL内容失败 {result.url}: {e}")
                continue
        
        logger.info(f"后台任务 {task_id} 完成，处理了 {processed_count}/{len(successful_results)} 个URL")
        
    except Exception as e:
        logger.error(f"后台任务 {task_id} 异常: {e}")
        raise


@router.get("/config")
async def get_crawl_config():
    """
    获取URL爬取配置信息
    """
    try:
        config = url_crawl_service.get_config()
        return {
            "success": True,
            "config": config
        }
    except Exception as e:
        logger.error(f"获取爬取配置失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"获取配置失败: {str(e)}"
        )