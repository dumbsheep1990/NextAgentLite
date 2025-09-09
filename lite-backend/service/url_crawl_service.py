"""
URL爬取服务 - 支持网页内容抓取、清理和Markdown转换
结合Crawl4AI和markitdown实现智能网页处理
"""

import asyncio
import aiohttp
import aiofiles
import hashlib
import uuid
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from urllib.parse import urlparse, urljoin
from pathlib import Path
import tempfile
import os

from core.logger import logger
from core.config_optimized import optimized_config_manager

# 尝试导入crawl4ai
try:
    from crawl4ai import AsyncWebCrawler, CacheMode
    from crawl4ai.extraction_strategy import LLMExtractionStrategy
    from crawl4ai.content_filter import PruningContentFilter
    _has_crawl4ai = True
except ImportError:
    _has_crawl4ai = False
    logger.warning("Crawl4AI未安装，将使用基础爬取功能")

# 尝试导入markitdown
try:
    from markitdown import MarkItDown
    _has_markitdown = True
except ImportError:
    _has_markitdown = False
    logger.warning("markitdown未安装，将使用基础Markdown转换")

# 尝试导入readability
try:
    from readability import Document
    _has_readability = True
except ImportError:
    _has_readability = False
    logger.warning("python-readability未安装，将使用基础内容提取")

# 尝试导入BeautifulSoup作为备选
try:
    from bs4 import BeautifulSoup
    import requests
    _has_bs4 = True
except ImportError:
    _has_bs4 = False


class URLCrawlResult:
    """URL爬取结果"""
    def __init__(self, url: str, title: str = "", content: str = "", 
                 markdown: str = "", metadata: Dict[str, Any] = None, 
                 success: bool = True, error: str = ""):
        self.url = url
        self.title = title
        self.content = content  # 原始HTML内容
        self.markdown = markdown  # Markdown格式内容
        self.metadata = metadata or {}
        self.success = success
        self.error = error
        self.crawl_time = datetime.utcnow()
        self.file_size = len(markdown.encode('utf-8')) if markdown else 0


class URLCrawlService:
    """URL爬取服务"""
    
    def __init__(self):
        self.session = None
        self.crawler = None
        self.markitdown = None
        self.temp_dir = None
        
        # 配置参数
        self.config = {
            "max_concurrent": 5,  # 最大并发数
            "timeout": 30,        # 超时时间（秒）
            "max_retries": 3,     # 最大重试次数
            "user_agent": "NextAgentLite-URLCrawler/1.0",
            "max_content_length": 50 * 1024 * 1024,  # 50MB最大内容长度
            "allowed_domains": [],  # 允许的域名列表，空表示允许所有
            "blocked_domains": [   # 默认阻止的域名
                "localhost", "127.0.0.1", "0.0.0.0"
            ]
        }
        
        # 支持的内容类型
        self.supported_content_types = [
            "text/html",
            "application/pdf", 
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        ]
        
    async def __aenter__(self):
        """异步上下文管理器入口"""
        await self._initialize()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        await self._cleanup()
    
    async def _initialize(self):
        """初始化服务"""
        try:
            # 创建HTTP会话
            timeout = aiohttp.ClientTimeout(total=self.config["timeout"])
            headers = {"User-Agent": self.config["user_agent"]}
            self.session = aiohttp.ClientSession(timeout=timeout, headers=headers)
            
            # 初始化Crawl4AI
            if _has_crawl4ai:
                self.crawler = AsyncWebCrawler(
                    headless=True,
                    verbose=False,
                    always_by_pass_cache=False,
                    cache_mode=CacheMode.ENABLED
                )
                await self.crawler.__aenter__()
                logger.info("Crawl4AI初始化成功")
            
            # 初始化markitdown
            if _has_markitdown:
                self.markitdown = MarkItDown()
                logger.info("markitdown初始化成功")
            
            # 创建临时目录
            self.temp_dir = Path(tempfile.mkdtemp(prefix="url_crawl_"))
            logger.info(f"URL爬取服务初始化成功，临时目录: {self.temp_dir}")
            
        except Exception as e:
            logger.error(f"URL爬取服务初始化失败: {e}")
            raise
    
    async def _cleanup(self):
        """清理资源"""
        try:
            if self.session:
                await self.session.close()
            
            if self.crawler and _has_crawl4ai:
                await self.crawler.__aexit__(None, None, None)
            
            # 清理临时目录
            if self.temp_dir and self.temp_dir.exists():
                import shutil
                shutil.rmtree(self.temp_dir, ignore_errors=True)
                
            logger.info("URL爬取服务清理完成")
        except Exception as e:
            logger.error(f"URL爬取服务清理失败: {e}")
    
    async def crawl_single_url(self, url: str, **options) -> URLCrawlResult:
        """爬取单个URL"""
        try:
            # URL验证
            if not self._validate_url(url):
                return URLCrawlResult(url, success=False, error="无效的URL")
            
            logger.info(f"开始爬取URL: {url}")
            
            # 选择爬取策略
            if _has_crawl4ai and options.get("use_crawl4ai", True):
                result = await self._crawl_with_crawl4ai(url, options)
            else:
                result = await self._crawl_with_basic(url, options)
            
            # Markdown转换
            if result.success and result.content:
                result.markdown = await self._convert_to_markdown(
                    result.content, url, result.title
                )
                result.file_size = len(result.markdown.encode('utf-8'))
            
            logger.info(f"URL爬取完成: {url}, 成功: {result.success}")
            return result
            
        except Exception as e:
            logger.error(f"URL爬取失败 {url}: {e}")
            return URLCrawlResult(url, success=False, error=str(e))
    
    async def crawl_multiple_urls(self, urls: List[str], **options) -> List[URLCrawlResult]:
        """批量爬取多个URL"""
        try:
            logger.info(f"开始批量爬取 {len(urls)} 个URL")
            
            # 创建信号量限制并发数
            semaphore = asyncio.Semaphore(self.config["max_concurrent"])
            
            async def crawl_with_semaphore(url):
                async with semaphore:
                    return await self.crawl_single_url(url, **options)
            
            # 并发执行爬取任务
            results = await asyncio.gather(*[
                crawl_with_semaphore(url) for url in urls
            ], return_exceptions=True)
            
            # 处理异常结果
            final_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    final_results.append(URLCrawlResult(
                        urls[i], success=False, error=str(result)
                    ))
                else:
                    final_results.append(result)
            
            successful = sum(1 for r in final_results if r.success)
            logger.info(f"批量爬取完成: {successful}/{len(urls)} 成功")
            
            return final_results
            
        except Exception as e:
            logger.error(f"批量URL爬取失败: {e}")
            return [URLCrawlResult(url, success=False, error=str(e)) for url in urls]
    
    async def _crawl_with_crawl4ai(self, url: str, options: Dict[str, Any]) -> URLCrawlResult:
        """使用Crawl4AI进行爬取"""
        try:
            # 配置爬取参数
            crawl_options = {
                "word_count_threshold": options.get("word_count_threshold", 50),
                "only_text": options.get("only_text", False),
                "remove_overlay_elements": True,
                "exclude_external_links": options.get("exclude_external_links", True),
                "exclude_social_media_links": True
            }
            
            # 配置内容过滤器
            if options.get("use_content_filter", True):
                content_filter = PruningContentFilter(
                    threshold=0.48,
                    threshold_type="fixed",
                    min_word_threshold=50
                )
                crawl_options["content_filter"] = content_filter
            
            # 执行爬取
            result = await self.crawler.arun(url=url, **crawl_options)
            
            if result.success:
                # 提取元数据
                metadata = {
                    "source_url": url,
                    "crawl_method": "crawl4ai",
                    "word_count": len(result.cleaned_html.split()) if result.cleaned_html else 0,
                    "links_count": len(result.links) if hasattr(result, 'links') else 0,
                    "images_count": len(result.media) if hasattr(result, 'media') else 0
                }
                
                return URLCrawlResult(
                    url=url,
                    title=result.metadata.get('title', '') if result.metadata else '',
                    content=result.cleaned_html,
                    metadata=metadata,
                    success=True
                )
            else:
                return URLCrawlResult(url, success=False, error="Crawl4AI爬取失败")
            
        except Exception as e:
            logger.error(f"Crawl4AI爬取失败 {url}: {e}")
            return URLCrawlResult(url, success=False, error=f"Crawl4AI错误: {str(e)}")
    
    async def _crawl_with_basic(self, url: str, options: Dict[str, Any]) -> URLCrawlResult:
        """使用基础HTTP请求进行爬取"""
        try:
            async with self.session.get(url) as response:
                if response.status != 200:
                    return URLCrawlResult(
                        url, success=False, error=f"HTTP错误: {response.status}"
                    )
                
                # 检查内容类型
                content_type = response.headers.get('content-type', '').lower()
                if not any(ct in content_type for ct in self.supported_content_types):
                    return URLCrawlResult(
                        url, success=False, error=f"不支持的内容类型: {content_type}"
                    )
                
                # 读取内容
                content = await response.text()
                
                # 使用Readability提取主要内容
                if _has_readability and 'html' in content_type:
                    doc = Document(content)
                    title = doc.title()
                    clean_content = doc.summary()
                else:
                    # 基础HTML解析
                    if _has_bs4:
                        soup = BeautifulSoup(content, 'html.parser')
                        title = soup.title.string if soup.title else ""
                        clean_content = content
                    else:
                        title = ""
                        clean_content = content
                
                metadata = {
                    "source_url": url,
                    "crawl_method": "basic_http",
                    "content_type": content_type,
                    "content_length": len(content)
                }
                
                return URLCrawlResult(
                    url=url,
                    title=title,
                    content=clean_content,
                    metadata=metadata,
                    success=True
                )
                
        except Exception as e:
            logger.error(f"基础HTTP爬取失败 {url}: {e}")
            return URLCrawlResult(url, success=False, error=f"HTTP错误: {str(e)}")
    
    async def _convert_to_markdown(self, content: str, url: str, title: str) -> str:
        """将内容转换为Markdown格式"""
        try:
            if not content:
                return ""
            
            # 使用markitdown进行转换
            if _has_markitdown and self.markitdown:
                # 保存临时HTML文件
                temp_file = self.temp_dir / f"{uuid.uuid4().hex}.html"
                async with aiofiles.open(temp_file, 'w', encoding='utf-8') as f:
                    await f.write(content)
                
                # 转换为Markdown
                result = self.markitdown.convert(str(temp_file))
                markdown_content = result.text_content
                
                # 清理临时文件
                temp_file.unlink(missing_ok=True)
            
            else:
                # 基础HTML到Markdown转换
                markdown_content = self._basic_html_to_markdown(content)
            
            # 添加元数据头部
            metadata_header = f"""# {title or "网页内容"}

**来源**: {url}  
**爬取时间**: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC

---

"""
            
            return metadata_header + markdown_content
            
        except Exception as e:
            logger.error(f"Markdown转换失败 {url}: {e}")
            # 返回基础转换结果
            return f"# {title or '网页内容'}\n\n**来源**: {url}\n\n{content[:5000]}..."
    
    def _basic_html_to_markdown(self, html_content: str) -> str:
        """基础HTML到Markdown转换"""
        if not _has_bs4:
            return html_content
        
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # 移除脚本和样式
            for script in soup(["script", "style"]):
                script.decompose()
            
            # 基础转换规则
            text = soup.get_text()
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            return text
            
        except Exception as e:
            logger.error(f"基础HTML转换失败: {e}")
            return html_content[:5000] + "..."
    
    def _validate_url(self, url: str) -> bool:
        """验证URL有效性"""
        try:
            parsed = urlparse(url)
            
            # 基础验证
            if not parsed.scheme or not parsed.netloc:
                return False
            
            # 协议验证
            if parsed.scheme not in ['http', 'https']:
                return False
            
            # 域名黑名单检查
            if parsed.netloc.lower() in self.config["blocked_domains"]:
                return False
            
            # 域名白名单检查
            if (self.config["allowed_domains"] and 
                parsed.netloc.lower() not in self.config["allowed_domains"]):
                return False
            
            return True
            
        except Exception:
            return False
    
    def get_config(self) -> Dict[str, Any]:
        """获取配置信息"""
        return {
            "max_concurrent": self.config["max_concurrent"],
            "timeout": self.config["timeout"],
            "max_retries": self.config["max_retries"],
            "supported_content_types": self.supported_content_types,
            "crawl4ai_available": _has_crawl4ai,
            "markitdown_available": _has_markitdown,
            "readability_available": _has_readability
        }


# 创建全局服务实例
url_crawl_service = URLCrawlService()