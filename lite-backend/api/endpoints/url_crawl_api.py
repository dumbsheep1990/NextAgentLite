"""
URL爬取API端点
支持单个和批量URL爬取，集成Crawl4AI和markitdown
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, HttpUrl, validator
import asyncio
import json
from datetime import datetime

from core.logger import logger
from service.url_crawl_service import url_crawl_service, URLCrawlResult
from service.knowledge_service import knowledge_service
from service.deepscrape_service import deepscrape_service
import re
from service.crawl_task_database import crawl_task_db

router = APIRouter(prefix="/url-crawl", tags=["URL爬取"])


def _sanitize_content_for_embeddings(text: str) -> str:
    """清理爬取结果中的base64图片与超长base64块，避免进入后续向量化流程。"""
    if not text:
        return text
    # Markdown内联base64图片
    text = re.sub(r"!\[[^\]]*\]\(data:image/[^;]+;base64,[^)]+\)", "", text, flags=re.IGNORECASE)
    # HTML内联图片
    text = re.sub(r"<img[^>]+src=\s*\"data:image/[^\"]+\"[^>]*>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<img[^>]+src=\s*'data:image/[^']+'[^>]*>", "", text, flags=re.IGNORECASE)
    # 移除内联 data: 多媒体
    text = re.sub(r"data:(image|video|audio|application)/[^;]+;base64,[A-Za-z0-9+/=\s]+", "", text, flags=re.IGNORECASE)
    # 移除CSS url(data:...)
    text = re.sub(r"url\(\s*data:[^)]+\)", "", text, flags=re.IGNORECASE)
    # 典型图片base64头（PNG、JPG、GIF）长串
    for p in (r"iVBORw0KGgo[A-Za-z0-9+/=]{200,}", r"/9j/[A-Za-z0-9+/=]{200,}", r"R0lGODlh[A-Za-z0-9+/=]{200,}"):
        text = re.sub(p, "", text)
    # 移除包含 base64 的代码块
    text = re.sub(r"```[\s\S]*?(?:base64|data:image|iVBORw0KGgo|/9j/|R0lGODlh)[\s\S]*?```", "", text, flags=re.IGNORECASE)
    text = re.sub(r"~~~[\s\S]*?(?:base64|data:image|iVBORw0KGgo|/9j/|R0lGODlh)[\s\S]*?~~~", "", text, flags=re.IGNORECASE)
    # 移除其他多媒体块
    text = re.sub(r"<\s*(video|audio|source|iframe|embed|object)[^>]*>.*?<\s*/\s*\1\s*>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<\s*(video|audio|source|iframe|embed|object)[^>]*>", "", text, flags=re.IGNORECASE)
    # 规范换行
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


class URLCrawlRequest(BaseModel):
    """URL爬取请求"""
    urls: List[str]
    options: Optional[Dict[str, Any]] = {}
    engine: Optional[str] = "crawl4ai"  # 爬取引擎: crawl4ai, deepscrape
    
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
    engine: Optional[str] = "crawl4ai"  # 爬取引擎: crawl4ai, deepscrape


class DeepScrapeRequest(BaseModel):
    """DeepScrape智能抓取请求"""
    urls: List[str]
    extraction_schema: Optional[Dict[str, Any]] = None
    summary_enabled: bool = False
    max_summary_length: int = 300
    batch_mode: bool = True
    concurrency: int = 3
    options: Optional[Dict[str, Any]] = {}
    
    @validator('urls', pre=True)
    def validate_urls(cls, v):
        if not v:
            raise ValueError("URLs列表不能为空")
        if len(v) > 100:  # DeepScrape支持更多并发
            raise ValueError("单次最多支持100个URL")
        return v


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
        logger.info(f"开始爬取 {len(request.urls)} 个URL，使用引擎: {request.engine}")
        
        # 根据引擎选择服务
        if request.engine == "deepscrape":
            # 使用DeepScrape服务
            async with deepscrape_service as service:
                # 批量抓取URL
                if len(request.urls) == 1:
                    # 单URL处理
                    result = await service.scrape_single_url(
                        url=request.urls[0],
                        options=request.options
                    )
                    results = [result]
                else:
                    # 批量处理
                    batch_result = await service.batch_scrape(
                        urls=request.urls,
                        concurrency=request.options.get('concurrency', 3),
                        options=request.options
                    )
                    if batch_result['success']:
                        results = batch_result['results']
                    else:
                        raise Exception(f"DeepScrape批量处理失败: {batch_result.get('error')}")
        else:
            # 使用默认crawl4ai服务
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

        # 如果没有指定切分配置且有collection_id，从知识库获取切分配置
        if not chunking_config_id and collection_id:
            try:
                from service.chunking_config_service import chunking_config_service
                from models.knowledge_collection import KnowledgeCollection
                from sqlalchemy.future import select
                from db.database import get_async_session

                # 获取知识库的切分配置
                async with get_async_session() as session:
                    stmt = select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id)
                    result = await session.execute(stmt)
                    collection = result.scalar_one_or_none()
                    if collection and collection.default_chunking_config_id:
                        chunking_config_id = collection.default_chunking_config_id
                        logger.info(f"后台任务 {task_id}: 使用知识库指定的切分配置: {chunking_config_id}")

                # 如果知识库没有指定配置，使用激活的默认配置
                if not chunking_config_id:
                    default_config = await chunking_config_service.get_default_config()
                    if default_config:
                        chunking_config_id = default_config.id
                        logger.info(f"后台任务 {task_id}: 使用系统默认切分配置: {default_config.name} ({chunking_config_id})")
            except Exception as e:
                logger.warning(f"后台任务 {task_id}: 获取切分配置失败: {e}，将使用系统默认")

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


@router.post("/deepscrape", response_model=URLCrawlResponse)
async def deepscrape_urls(request: DeepScrapeRequest):
    """
    使用DeepScrape进行智能URL抓取和内容提取
    
    Args:
        request: DeepScrape抓取请求
        
    Returns:
        抓取和提取结果
    """
    try:
        logger.info(f"开始DeepScrape智能抓取 {len(request.urls)} 个URL")
        
        async with deepscrape_service as service:
            results = []
            
            # 根据请求类型处理
            if request.extraction_schema:
                # Schema结构化抽取
                for url in request.urls:
                    result = await service.extract_with_schema(
                        url=url,
                        schema=request.extraction_schema,
                        options=request.options
                    )
                    results.append(result)
                    
            elif request.summary_enabled:
                # 内容摘要生成
                for url in request.urls:
                    result = await service.summarize_content(
                        url=url,
                        max_length=request.max_summary_length,
                        options=request.options
                    )
                    results.append(result)
                    
            elif request.batch_mode and len(request.urls) > 1:
                # 批量处理
                batch_result = await service.batch_scrape(
                    urls=request.urls,
                    concurrency=request.concurrency,
                    options=request.options
                )
                if batch_result['success']:
                    results = batch_result['results']
                else:
                    raise Exception(f"DeepScrape批量处理失败: {batch_result.get('error')}")
            else:
                # 标准抓取
                for url in request.urls:
                    result = await service.scrape_single_url(url, request.options)
                    results.append(result)
            
            # 统计结果
            successful_count = sum(1 for r in results if r.get('success', False))
            failed_count = len(results) - successful_count
            
            statistics = {
                "total_urls": len(request.urls),
                "successful": successful_count,
                "failed": failed_count,
                "success_rate": successful_count / len(request.urls) * 100 if request.urls else 0,
                "engine": "deepscrape",
                "extraction_type": "schema" if request.extraction_schema else "summary" if request.summary_enabled else "standard"
            }
            
            # 转换结果格式
            response_results = []
            for result in results:
                response_results.append({
                    "url": result.get('url', ''),
                    "success": result.get('success', False),
                    "title": result.get('title', ''),
                    "content": result.get('content', ''),
                    "extracted_data": result.get('extracted_data'),
                    "summary": result.get('summary'),
                    "metadata": result.get('metadata', {}),
                    "error": result.get('error'),
                    "crawl_time": result.get('crawl_time', datetime.utcnow()).isoformat()
                })
            
            return URLCrawlResponse(
                success=successful_count > 0,
                message=f"DeepScrape处理完成：成功 {successful_count}/{len(request.urls)} 个URL",
                results=response_results,
                statistics=statistics
            )
            
    except Exception as e:
        logger.error(f"DeepScrape抓取失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"DeepScrape抓取服务异常: {str(e)}"
        )


@router.post("/deepscrape/crawl")
async def deepscrape_crawl_website(
    request: Dict[str, Any]
):
    """
    使用DeepScrape进行网站爬取
    
    Args:
        request: 网站爬取请求
    """
    try:
        start_url = request.get('start_url')
        if not start_url:
            raise HTTPException(status_code=400, detail="请提供起始URL")
            
        limit = request.get('limit', 50)
        max_depth = request.get('max_depth', 3)
        include_paths = request.get('include_paths')
        options = request.get('options', {})
        
        logger.info(f"开始DeepScrape网站爬取: {start_url}")
        
        async with deepscrape_service as service:
            result = await service.crawl_website(
                start_url=start_url,
                limit=limit,
                max_depth=max_depth,
                include_paths=include_paths,
                options=options
            )
            
            if result['success']:
                return {
                    "success": True,
                    "message": f"网站爬取完成，共抓取 {result.get('count', 0)} 个页面",
                    "crawl_id": result.get('crawl_id'),
                    "pages": result.get('pages', []),
                    "exported_files": result.get('exported_files', {}),
                    "statistics": {
                        "total_pages": result.get('count', 0),
                        "engine": "deepscrape"
                    }
                }
            else:
                raise Exception(result.get('error', 'Unknown error'))
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DeepScrape网站爬取失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"网站爬取失败: {str(e)}"
        )


@router.get("/config")
async def get_crawl_config():
    """
    获取URL爬取配置信息
    """
    try:
        config = url_crawl_service.get_config()
        
        # 检查DeepScrape服务状态
        deepscrape_health = await deepscrape_service.check_health()
        
        return {
            "success": True,
            "config": config,
            "engines": {
                "crawl4ai": {
                    "available": True,
                    "description": "基础爬取引擎，支持crawl4ai和markitdown"
                },
                "deepscrape": {
                    "available": deepscrape_health['status'] == 'healthy',
                    "description": "AI驱动的智能爬取引擎，支持结构化抽取和内容摘要",
                    "health": deepscrape_health
                }
            }
        }
    except Exception as e:
        logger.error(f"获取爬取配置失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"获取配置失败: {str(e)}"
        )


@router.post("/deepscrape-to-knowledge", response_model=Dict[str, Any])
async def deepscrape_to_knowledge(
    request: DeepScrapeRequest,
    collection_id: Optional[str] = None,
    folder_id: Optional[str] = None
):
    """
    使用DeepScrape抓取URL并直接保存到知识库
    
    完整流程：
    1. DeepScrape智能抓取
    2. 内容向量化处理
    3. 保存到知识库管理
    4. 返回文档ID和状态
    """
    try:
        from service.url_document_processor import url_document_processor
        
        results = []
        successful_documents = []
        failed_urls = []
        
        for url in request.urls:
            try:
                logger.info(f"开始处理URL到知识库: {url}")
                
                # 处理URL到知识库文档
                document = await url_document_processor.process_url_to_document(
                    url=url,
                    collection_id=collection_id,
                    folder_id=folder_id,
                    options=request.options
                )
                
                successful_documents.append({
                    'url': url,
                    'document_id': document.id,
                    'title': document.title,
                    'status': document.status,
                    'content_hash': document.content_hash,
                    'created_at': document.created_at.isoformat()
                })
                
                logger.info(f"URL处理成功: {url} -> {document.id}")
                
            except Exception as e:
                logger.error(f"URL处理失败: {url}, 错误: {str(e)}")
                failed_urls.append({
                    'url': url,
                    'error': str(e)
                })
        
        return {
            'success': len(successful_documents) > 0,
            'total_urls': len(request.urls),
            'successful_count': len(successful_documents),
            'failed_count': len(failed_urls),
            'successful_documents': successful_documents,
            'failed_urls': failed_urls,
            'engine': 'deepscrape',
            'pipeline': 'url_to_knowledge',
            'message': f"URL处理完成: {len(successful_documents)}/{len(request.urls)} 成功保存到知识库"
        }
        
    except Exception as e:
        logger.error(f"URL到知识库处理失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"URL到知识库处理失败: {str(e)}")


# ============ WebSocket 实时监控 ============

# 存储活跃的WebSocket连接
active_connections: List[WebSocket] = []

# 任务存储已迁移到数据库，使用 crawl_task_db 服务

class ConnectionManager:
    """WebSocket连接管理器"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """接受WebSocket连接"""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket连接已建立，当前连接数: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """断开WebSocket连接"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket连接已断开，当前连接数: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """发送个人消息"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"发送WebSocket消息失败: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: str):
        """广播消息到所有连接"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"广播WebSocket消息失败: {e}")
                disconnected.append(connection)
        
        # 清理断开的连接
        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()

async def notify_task_update(task_id: str, task_data: Dict[str, Any], update_type: str = "task_update"):
    """通知任务更新"""
    message = {
        "type": update_type,
        "task": task_data,
        "timestamp": datetime.now().isoformat()
    }
    await manager.broadcast(json.dumps(message))

@router.websocket("/ws/tasks")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket端点 - 实时任务监控
    """
    await manager.connect(websocket)
    try:
        while True:
            # 等待客户端消息
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                
                if message.get("type") == "ping":
                    # 心跳响应
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "heartbeat",
                            "timestamp": datetime.now().isoformat()
                        }), 
                        websocket
                    )
                elif message.get("type") == "get_tasks":
                    # 从数据库获取任务列表
                    task_data = await crawl_task_db.list_tasks(page=1, size=50)
                    tasks = []
                    for task in task_data['tasks']:
                        _opts = json.loads(task['options']) if isinstance(task['options'], str) else (task['options'] or {})
                        tasks.append({
                            "id": task['task_id'],
                            "type": "deepscrape_batch",
                            "status": task['status'],
                            "urls": task['urls'],
                            "progress": task['progress'],
                            "created_at": task['created_at'].isoformat() if task['created_at'] else None,
                            "updated_at": datetime.now().isoformat(),
                            "collection_id": _opts.get('collection_id'),
                            "metadata": {
                                "total_urls": task['total_urls'],
                                "completed_urls": task['successful_count'],
                                "failed_urls": task['failed_count'],
                                "options": _opts
                            }
                        })
                    
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "task_list",
                            "tasks": tasks,
                            "total": len(tasks),
                            "timestamp": datetime.now().isoformat()
                        }),
                        websocket
                    )
                
            except json.JSONDecodeError:
                logger.warning(f"WebSocket收到无效JSON: {data}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket错误: {e}")
        manager.disconnect(websocket)


# ============ 任务管理API ============

@router.get("/tasks")
async def get_task_list(
    page: int = 1,
    size: int = 10,
    status: Optional[str] = None
):
    """
    获取任务列表
    """
    try:
        # 从数据库获取任务列表
        result = await crawl_task_db.list_tasks(page=page, size=size, status=status)
        
        # 转换为前端格式
        tasks = []
        for task in result['tasks']:
            # 从 options 提取 collection 标记
            _opts = json.loads(task['options']) if isinstance(task['options'], str) else (task['options'] or {})
            tasks.append({
                "id": task['task_id'],
                "type": "deepscrape_batch",
                "status": task['status'],
                "urls": task['urls'],
                "progress": task['progress'],
                "created_at": task['created_at'].isoformat() if task['created_at'] else None,
                "updated_at": datetime.now().isoformat(),
                "collection_id": _opts.get('collection_id'),
                "metadata": {
                    "total_urls": task['total_urls'],
                    "completed_urls": task['successful_count'],
                    "failed_urls": task['failed_count'],
                    "options": _opts
                }
            })
        
        return {
            "success": True,
            "tasks": tasks,
            "total": result['total'],
            "page": result['page'],
            "size": result['size']
        }
        
    except Exception as e:
        logger.error(f"获取任务列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取任务列表失败: {str(e)}")


@router.get("/tasks/{task_id}")
async def get_task_detail(task_id: str):
    """
    获取任务详情
    """
    try:
        # 从数据库获取任务及其结果
        task = await crawl_task_db.get_task_with_results(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        # 转换为前端格式
        _opts = json.loads(task['options']) if isinstance(task['options'], str) else (task['options'] or {})
        task_data = {
            "id": task['task_id'],
            "type": "deepscrape_batch",
            "status": task['status'],
            "urls": task['urls'],
            "progress": task['progress'],
            "created_at": task['created_at'].isoformat() if task['created_at'] else None,
            "updated_at": datetime.now().isoformat(),
            "collection_id": _opts.get('collection_id'),
            "results": task.get('results', []),
            "metadata": {
                "total_urls": task['total_urls'],
                "completed_urls": task['successful_count'],
                "failed_urls": task['failed_count'],
                "options": _opts
            }
        }
        
        return {
            "success": True,
            "task": task_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取任务详情失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取任务详情失败: {str(e)}")


@router.post("/tasks/{task_id}/cancel")
async def cancel_task(task_id: str):
    """
    取消任务
    """
    try:
        task = await crawl_task_db.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        if task['status'] not in ['pending', 'running']:
            raise HTTPException(status_code=400, detail="只能取消等待中或运行中的任务")
        
        # 更新任务状态为取消
        await crawl_task_db.update_task_status(task_id, 'cancelled', error_message='用户取消')
        
        # 获取更新后的任务用于通知
        updated_task = await crawl_task_db.get_task(task_id)
        if updated_task:
            _opts3 = json.loads(updated_task['options']) if isinstance(updated_task.get('options'), str) else (updated_task.get('options') or {})
            task_data = {
                "id": task_id,
                "type": "deepscrape_batch",
                "status": updated_task['status'],
                "urls": updated_task['urls'],
                "progress": updated_task['progress'],
                "created_at": updated_task['created_at'].isoformat() if updated_task['created_at'] else None,
                "updated_at": datetime.now().isoformat(),
                "error": "用户取消",
                "collection_id": _opts3.get('collection_id'),
                "metadata": {
                    "total_urls": updated_task['total_urls'],
                    "completed_urls": updated_task['successful_count'],
                    "failed_urls": updated_task['failed_count']
                }
            }
            # 通知任务更新
            await notify_task_update(task_id, task_data, "task_cancelled")
        
        return {
            "success": True,
            "message": "任务已取消"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"取消任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"取消任务失败: {str(e)}")


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """
    删除任务
    """
    try:
        task = await crawl_task_db.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        if task['status'] == 'running':
            raise HTTPException(status_code=400, detail="无法删除运行中的任务")
        
        # 删除任务及其结果
        success = await crawl_task_db.delete_task(task_id)
        if not success:
            raise HTTPException(status_code=500, detail="删除任务失败")
        
        # 转换任务数据用于通知
        task_data = {
            "id": task_id,
            "type": "deepscrape_batch",
            "status": task['status'],
            "urls": task['urls'],
            "progress": task['progress'],
            "created_at": task['created_at'].isoformat() if task['created_at'] else None,
            "updated_at": datetime.now().isoformat(),
            "metadata": {
                "total_urls": task['total_urls'],
                "completed_urls": task['successful_count'],
                "failed_urls": task['failed_count']
            }
        }
        
        # 通知任务删除
        await notify_task_update(task_id, task_data, "task_deleted")
        
        return {
            "success": True,
            "message": "任务已删除"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除任务失败: {str(e)}")


async def create_real_deepscrape_task(urls: List[str], options: Dict[str, Any] = {}) -> str:
    """
    创建真正的DeepScrape抓取任务
    """
    import uuid
    
    task_id = str(uuid.uuid4())
    
    # 创建数据库记录
    success = await crawl_task_db.create_task(
        task_id=task_id,
        urls=urls,
        engine="deepscrape",
        options=options
    )
    
    if not success:
        raise Exception("创建爬虫任务失败")
    
    # 获取任务数据用于通知
    task = await crawl_task_db.get_task(task_id)
    if task:
        # 转换为前端格式
        _opts0 = json.loads(task['options']) if isinstance(task['options'], str) else (task['options'] or {})
        task_data = {
            "id": task_id,
            "type": "deepscrape_batch", 
            "status": task['status'],
            "urls": task['urls'],
            "progress": task['progress'],
            "created_at": task['created_at'].isoformat() if task['created_at'] else None,
            "updated_at": datetime.now().isoformat(),
            "collection_id": _opts0.get('collection_id'),
            "metadata": {
                "total_urls": task['total_urls'],
                "completed_urls": task['successful_count'],
                "failed_urls": task['failed_count'],
                "options": _opts0
            }
        }
        
        # 通知任务创建
        await notify_task_update(task_id, task_data, "task_created")
    
    # 启动真正的抓取任务
    asyncio.create_task(execute_real_deepscrape_task(task_id))
    
    return task_id


async def execute_real_deepscrape_task(task_id: str):
    """
    执行真正的DeepScrape抓取任务
    """
    try:
        # 从数据库获取任务
        task = await crawl_task_db.get_task(task_id)
        if not task:
            logger.error(f"任务不存在: {task_id}")
            return
        
        total_urls = len(task['urls'])
        options = json.loads(task['options']) if isinstance(task['options'], str) else task['options']
        
        # 开始执行
        await crawl_task_db.update_task_status(task_id, 'running')
        
        # 获取更新后的任务用于通知
        task = await crawl_task_db.get_task(task_id)
        task_data = {
            "id": task_id,
            "type": "deepscrape_batch",
            "status": task['status'],
            "urls": task['urls'],
            "progress": task['progress'],
            "created_at": task['created_at'].isoformat() if task['created_at'] else None,
            "updated_at": datetime.now().isoformat(),
            "metadata": {
                "total_urls": task['total_urls'],
                "completed_urls": task['successful_count'],
                "failed_urls": task['failed_count'],
                "options": options,
                "start_time": datetime.now().isoformat()
            }
        }
        await notify_task_update(task_id, task_data, "task_update")
        
        # 使用DeepScrape服务进行真正的抓取
        successful_count = 0
        failed_count = 0
        
        async with deepscrape_service as service:
            for i, url in enumerate(task['urls']):
                try:
                    logger.info(f"开始抓取URL: {url}")
                    
                    # 调用真正的DeepScrape API
                    scrape_result = await service.scrape_single_url(url, options)
                    
                    if scrape_result.get('success', False):
                        successful_count += 1
                        logger.info(f"URL抓取成功: {url}")
                        
                        # 保存成功结果到数据库
                        await crawl_task_db.add_result(
                            task_id=task_id,
                            url=url,
                            success=True,
                            title=scrape_result.get('title'),
                            content=_sanitize_content_for_embeddings(
                                scrape_result.get('content') or scrape_result.get('markdown') or scrape_result.get('text') or ''
                            ),
                            summary=scrape_result.get('summary'),
                            metadata=scrape_result.get('metadata', {})
                        )

                        # 将内容落地到知识库（仅当传入了 collection_id，区分知识库与智能爬虫独立任务）
                        collection_id = (options or {}).get('collection_id')
                        if collection_id:
                            try:
                                from service.knowledge_service import knowledge_service
                                from service.chunking_config_service import chunking_config_service
                                from models.knowledge_collection import KnowledgeCollection
                                from sqlalchemy.future import select
                                from db.database import get_async_session

                                # 获取知识库的切分配置
                                chunking_config_id = None
                                async with get_async_session() as session:
                                    stmt = select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id)
                                    result = await session.execute(stmt)
                                    collection = result.scalar_one_or_none()
                                    if collection and collection.default_chunking_config_id:
                                        chunking_config_id = collection.default_chunking_config_id
                                        logger.info(f"使用知识库指定的切分配置: {chunking_config_id}")

                                # 如果知识库没有指定配置，使用激活的默认配置
                                if not chunking_config_id:
                                    default_config = await chunking_config_service.get_default_config()
                                    if default_config:
                                        chunking_config_id = default_config.id
                                        logger.info(f"使用系统默认切分配置: {default_config.name} ({chunking_config_id})")

                                # 兼容不同字段：优先markdown，其次content/text
                                content_md = _sanitize_content_for_embeddings(
                                    scrape_result.get('markdown') or scrape_result.get('content') or scrape_result.get('text')
                                )
                                if not content_md or not str(content_md).strip():
                                    raise Exception('抓取内容为空')
                                # 文档素材
                                doc_payload = {
                                    'filename': f"{(scrape_result.get('title') or 'web_content').strip() or 'web_content'}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.md",
                                    'content': content_md,
                                    'source_url': url,
                                    'original_title': scrape_result.get('title') or '',
                                    'crawl_metadata': scrape_result.get('metadata', {}),
                                    'file_size': len(content_md.encode('utf-8')),
                                    'content_type': 'text/markdown'
                                }
                                await knowledge_service.process_url_content(
                                    document_data=doc_payload,
                                    collection_id=collection_id,
                                    tags=[],
                                    description=f"来源URL: {url}",
                                    chunking_config_id=chunking_config_id,
                                    custom_chunk_size=None,
                                    custom_chunk_overlap=None
                                )
                            except Exception as persist_err:
                                logger.warning(f"保存抓取内容到知识库失败: {url}, {persist_err}")
                    else:
                        failed_count += 1
                        logger.error(f"URL抓取失败: {url}, 错误: {scrape_result.get('error')}")
                        
                        # 保存失败结果到数据库
                        await crawl_task_db.add_result(
                            task_id=task_id,
                            url=url,
                            success=False,
                            error_message=scrape_result.get('error', 'Unknown error')
                        )
                    
                except Exception as e:
                    logger.error(f"抓取URL时发生异常: {url}, {e}")
                    failed_count += 1
                    
                    # 保存异常结果到数据库
                    await crawl_task_db.add_result(
                        task_id=task_id,
                        url=url,
                        success=False,
                        error_message=str(e)
                    )
                
                # 更新进度和计数
                progress = int((i + 1) / total_urls * 100)
                await crawl_task_db.update_task_status(
                    task_id, 
                    'running',
                    progress=progress,
                    successful_count=successful_count,
                    failed_count=failed_count
                )
                
                # 获取更新后的任务用于通知
                updated_task = await crawl_task_db.get_task(task_id)
                _opts1 = options or {}
                task_data = {
                    "id": task_id,
                    "type": "deepscrape_batch",
                    "status": updated_task['status'],
                    "urls": updated_task['urls'],
                    "progress": updated_task['progress'],
                    "created_at": updated_task['created_at'].isoformat() if updated_task['created_at'] else None,
                    "updated_at": datetime.now().isoformat(),
                    "collection_id": _opts1.get('collection_id'),
                    "metadata": {
                        "total_urls": updated_task['total_urls'],
                        "completed_urls": updated_task['successful_count'],
                        "failed_urls": updated_task['failed_count'],
                        "options": _opts1
                    }
                }
                
                # 通知进度更新
                await notify_task_update(task_id, task_data, "task_update")
                
                # 检查是否被取消
                current_task = await crawl_task_db.get_task(task_id)
                if current_task and current_task['status'] == 'cancelled':
                    return
        
        # 任务完成
        await crawl_task_db.update_task_status(task_id, 'completed', progress=100)
        
        # 获取最终任务状态用于通知
        final_task = await crawl_task_db.get_task(task_id)
        _opts2 = options or {}
        task_data = {
            "id": task_id,
            "type": "deepscrape_batch",
            "status": final_task['status'],
            "urls": final_task['urls'],
            "progress": final_task['progress'],
            "created_at": final_task['created_at'].isoformat() if final_task['created_at'] else None,
            "updated_at": datetime.now().isoformat(),
            "collection_id": _opts2.get('collection_id'),
            "metadata": {
                "total_urls": final_task['total_urls'],
                "completed_urls": final_task['successful_count'],
                "failed_urls": final_task['failed_count'],
                "options": _opts2,
                "end_time": datetime.now().isoformat()
            }
        }
        
        logger.info(f"DeepScrape任务完成: {task_id}, 成功: {successful_count}, 失败: {failed_count}")
        
        # 通知任务完成
        await notify_task_update(task_id, task_data, "task_completed")
        
    except Exception as e:
        logger.error(f"DeepScrape任务执行失败: {task_id}, 错误: {e}")
        # 更新数据库中的任务状态为失败
        await crawl_task_db.update_task_status(task_id, 'failed', error_message=str(e))
        
        # 获取失败任务状态用于通知
        failed_task = await crawl_task_db.get_task(task_id)
        if failed_task:
            task_data = {
                "id": task_id,
                "type": "deepscrape_batch",
                "status": failed_task['status'],
                "urls": failed_task['urls'],
                "progress": failed_task['progress'],
                "created_at": failed_task['created_at'].isoformat() if failed_task['created_at'] else None,
                "updated_at": datetime.now().isoformat(),
                "error": str(e),
                "metadata": {
                    "total_urls": failed_task['total_urls'],
                    "completed_urls": failed_task['successful_count'],
                    "failed_urls": failed_task['failed_count']
                }
            }
            await notify_task_update(task_id, task_data, "task_failed")


# 模拟任务创建函数已删除，现在使用真实的DeepScrape服务


# 模拟任务执行函数已删除，现在使用数据库持久化存储


# 修改原有的deepscrape端点以支持任务管理
@router.post("/deepscrape-with-task", response_model=Dict[str, Any])
async def deepscrape_with_task_management(request: DeepScrapeRequest):
    """
    使用DeepScrape抓取并创建任务管理
    """
    try:
        # 创建真正的抓取任务
        task_id = await create_real_deepscrape_task(request.urls, request.options or {})
        
        return {
            "success": True,
            "task_id": task_id,
            "message": "任务已创建并开始执行",
            "urls_count": len(request.urls)
        }
        
    except Exception as e:
        logger.error(f"DeepScrape任务创建失败: {e}")
        raise HTTPException(status_code=500, detail=f"任务创建失败: {str(e)}")
