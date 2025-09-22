"""
DeepScrape服务集成
支持AI驱动的网页爬取和智能内容抽取
"""

from typing import Dict, Any, List, Optional, Union
import httpx
import asyncio
import json
from datetime import datetime
from core.logger import logger
from core.config_optimized import optimized_config_manager


class DeepScrapeService:
    """DeepScrape服务客户端"""
    
    def __init__(self):
        self.base_url = None
        self.api_key = None
        self.timeout = 30
        self._client = None
        
    async def __aenter__(self):
        """异步上下文管理器入口"""
        await self.initialize()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        if self._client:
            await self._client.aclose()
    
    async def initialize(self):
        """初始化DeepScrape服务配置"""
        try:
            # 从统一配置中获取DeepScrape配置
            config = optimized_config_manager.settings
            deepscrape_config = config.deepscrape
            
            # DeepScrape服务配置
            self.base_url = deepscrape_config.base_url
            self.api_key = deepscrape_config.api_key
            self.timeout = deepscrape_config.timeout
            
            # 创建HTTP客户端
            headers = {
                'X-API-Key': self.api_key,
                'Content-Type': 'application/json',
                'User-Agent': 'NextAgentLite-Backend/1.0'
            }
            
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=self.timeout
            )
            
            logger.info(f"DeepScrape服务初始化成功: {self.base_url}")
            
        except Exception as e:
            logger.error(f"DeepScrape服务初始化失败: {e}")
            raise
    
    def _get_llm_config_for_deepscrape(self) -> Dict[str, Any]:
        """从统一模型配置中获取LLM配置用于DeepScrape"""
        config = optimized_config_manager.settings
        
        # 获取默认LLM配置
        llm_type = getattr(config, 'default_llm_type', 'alibaba')
        llm_model = getattr(config, 'default_llm_model', 'qwen-turbo')
        
        # 转换为DeepScrape格式的配置
        if llm_type == 'alibaba':
            # 阿里云模型转换为OpenAI兼容格式
            api_key = getattr(config, 'alibaba_llm_api_key', '')
            base_url = getattr(config, 'alibaba_llm_base_url', '')
            
            return {
                'provider': 'openai',  # 使用OpenAI兼容接口
                'api_key': api_key,
                'base_url': base_url,
                'model': llm_model,
                'temperature': 0.2
            }
            
        elif llm_type == 'openai':
            return {
                'provider': 'openai',
                'api_key': getattr(config, 'openai_api_key', ''),
                'model': llm_model,
                'temperature': 0.2
            }
            
        elif llm_type == 'ollama':
            return {
                'provider': 'ollama',
                'base_url': getattr(config, 'ollama_base_url', 'http://localhost:11434'),
                'model': llm_model,
                'temperature': 0.2
            }
            
        else:
            # 默认配置
            logger.warning(f"未知的LLM类型: {llm_type}, 使用默认配置")
            return {
                'provider': 'openai',
                'model': 'gpt-3.5-turbo',
                'temperature': 0.2
            }
    
    async def check_health(self) -> Dict[str, Any]:
        """检查DeepScrape服务健康状态"""
        try:
            # 检查客户端是否可用，如果不可用则重新初始化
            if not self._client or self._client.is_closed:
                if self._client:
                    await self._client.aclose()
                await self.initialize()
                
            response = await self._client.get('/health')
            response.raise_for_status()
            
            return {
                'status': 'healthy',
                'service': 'deepscrape',
                'response_time': response.elapsed.total_seconds(),
                'data': response.json() if response.content else {}
            }
            
        except Exception as e:
            logger.error(f"DeepScrape健康检查失败: {e}")
            return {
                'status': 'unhealthy',
                'service': 'deepscrape',
                'error': str(e)
            }
    
    async def scrape_single_url(
        self,
        url: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        抓取单个URL
        
        Args:
            url: 目标URL
            options: 抓取选项
        
        Returns:
            抓取结果
        """
        try:
            # 检查客户端是否可用，如果不可用则重新初始化
            if not self._client or self._client.is_closed:
                if self._client:
                    await self._client.aclose()
                await self.initialize()
                
            # 默认选项
            default_options = {
                'extractorFormat': 'markdown',
                'waitForTimeout': 5000,
                'stealthMode': True
            }
            
            if options:
                default_options.update(options)
            
            payload = {
                'url': url,
                'options': default_options
            }
            
            logger.info(f"开始抓取URL: {url}")
            response = await self._client.post('/api/scrape', json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            return {
                'success': True,
                'url': url,
                'content': result.get('content', ''),
                'title': result.get('title', ''),
                'metadata': result.get('metadata', {}),
                'crawl_time': datetime.utcnow().isoformat(),
                'source': 'deepscrape'
            }
            
        except Exception as e:
            logger.error(f"DeepScrape单URL抓取失败 {url}: {e}")
            return {
                'success': False,
                'url': url,
                'error': str(e),
                'crawl_time': datetime.utcnow().isoformat(),
                'source': 'deepscrape'
            }
    
    async def extract_with_schema(
        self,
        url: str,
        schema: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        使用Schema抽取结构化数据
        
        Args:
            url: 目标URL
            schema: JSON Schema定义
            options: 抓取选项
        
        Returns:
            结构化抽取结果
        """
        try:
            # 检查客户端是否可用，如果不可用则重新初始化
            if not self._client or self._client.is_closed:
                if self._client:
                    await self._client.aclose()
                await self.initialize()
                
            # 默认选项
            default_options = {
                'extractorFormat': 'markdown',
                'waitForTimeout': 5000,
                'stealthMode': True
            }
            
            if options:
                default_options.update(options)
            
            payload = {
                'url': url,
                'schema': schema,
                'options': default_options
            }
            
            logger.info(f"开始Schema抽取: {url}")
            response = await self._client.post('/api/extract-schema', json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            return {
                'success': True,
                'url': url,
                'extracted_data': result.get('extractedData', {}),
                'raw_content': result.get('content', ''),
                'metadata': result.get('metadata', {}),
                'crawl_time': datetime.utcnow().isoformat(),
                'source': 'deepscrape'
            }
            
        except Exception as e:
            logger.error(f"DeepScrape Schema抽取失败 {url}: {e}")
            return {
                'success': False,
                'url': url,
                'error': str(e),
                'crawl_time': datetime.utcnow().isoformat(),
                'source': 'deepscrape'
            }
    
    async def summarize_content(
        self,
        url: str,
        max_length: int = 300,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        生成内容摘要
        
        Args:
            url: 目标URL
            max_length: 最大摘要长度
            options: 抓取选项
        
        Returns:
            摘要结果
        """
        try:
            # 检查客户端是否可用，如果不可用则重新初始化
            if not self._client or self._client.is_closed:
                if self._client:
                    await self._client.aclose()
                await self.initialize()
                
            # 默认选项
            default_options = {
                'extractorFormat': 'markdown',
                'waitForTimeout': 5000,
                'temperature': 0.3
            }
            
            if options:
                default_options.update(options)
            
            payload = {
                'url': url,
                'maxLength': max_length,
                'options': default_options
            }
            
            logger.info(f"开始生成摘要: {url}")
            response = await self._client.post('/api/summarize', json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            return {
                'success': True,
                'url': url,
                'summary': result.get('summary', ''),
                'content': result.get('content', ''),
                'metadata': result.get('metadata', {}),
                'crawl_time': datetime.utcnow().isoformat(),
                'source': 'deepscrape'
            }
            
        except Exception as e:
            logger.error(f"DeepScrape摘要生成失败 {url}: {e}")
            return {
                'success': False,
                'url': url,
                'error': str(e),
                'crawl_time': datetime.utcnow().isoformat(),
                'source': 'deepscrape'
            }
    
    async def batch_scrape(
        self,
        urls: List[str],
        concurrency: int = 3,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        批量抓取URL
        
        Args:
            urls: URL列表
            concurrency: 并发数
            options: 抓取选项
        
        Returns:
            批量抓取结果
        """
        try:
            # 检查客户端是否可用，如果不可用则重新初始化
            if not self._client or self._client.is_closed:
                if self._client:
                    await self._client.aclose()
                await self.initialize()
                
            # 默认选项
            default_options = {
                'extractorFormat': 'markdown',
                'waitForTimeout': 5000,
                'stealthMode': True
            }
            
            if options:
                default_options.update(options)
            
            payload = {
                'urls': urls,
                'concurrency': concurrency,
                'options': default_options
            }
            
            logger.info(f"开始批量抓取: {len(urls)} 个URL")
            response = await self._client.post('/api/batch/scrape', json=payload)
            response.raise_for_status()
            
            result = response.json()
            batch_id = result.get('batchId')
            
            # 轮询检查批量任务状态
            return await self._wait_for_batch_completion(batch_id)
            
        except Exception as e:
            logger.error(f"DeepScrape批量抓取失败: {e}")
            return {
                'success': False,
                'error': str(e),
                'crawl_time': datetime.utcnow().isoformat(),
                'source': 'deepscrape'
            }
    
    async def _wait_for_batch_completion(
        self,
        batch_id: str,
        max_wait_time: int = 300,
        check_interval: int = 5
    ) -> Dict[str, Any]:
        """等待批量任务完成"""
        try:
            start_time = datetime.utcnow()
            
            while True:
                # 检查任务状态
                response = await self._client.get(f'/api/batch/scrape/{batch_id}/status')
                response.raise_for_status()
                
                status_data = response.json()
                status = status_data.get('status')
                
                if status == 'completed':
                    logger.info(f"批量任务 {batch_id} 完成")
                    return {
                        'success': True,
                        'batch_id': batch_id,
                        'status': status,
                        'results': status_data.get('results', []),
                        'statistics': {
                            'total_urls': status_data.get('totalUrls', 0),
                            'completed_urls': status_data.get('completedUrls', 0),
                            'failed_urls': status_data.get('failedUrls', 0),
                            'processing_time': status_data.get('processingTime', 0)
                        },
                        'source': 'deepscrape'
                    }
                    
                elif status == 'failed':
                    logger.error(f"批量任务 {batch_id} 失败")
                    return {
                        'success': False,
                        'batch_id': batch_id,
                        'status': status,
                        'error': status_data.get('error', 'Unknown error'),
                        'source': 'deepscrape'
                    }
                
                # 检查超时
                elapsed = (datetime.utcnow() - start_time).seconds
                if elapsed > max_wait_time:
                    logger.warning(f"批量任务 {batch_id} 等待超时")
                    return {
                        'success': False,
                        'batch_id': batch_id,
                        'status': 'timeout',
                        'error': f'Task timeout after {max_wait_time} seconds',
                        'source': 'deepscrape'
                    }
                
                # 等待下次检查
                await asyncio.sleep(check_interval)
                
        except Exception as e:
            logger.error(f"等待批量任务失败: {e}")
            return {
                'success': False,
                'batch_id': batch_id,
                'error': str(e),
                'source': 'deepscrape'
            }
    
    async def crawl_website(
        self,
        start_url: str,
        limit: int = 50,
        max_depth: int = 3,
        include_paths: Optional[List[str]] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        网站爬取
        
        Args:
            start_url: 起始URL
            limit: 页面限制
            max_depth: 最大深度
            include_paths: 包含路径模式
            options: 抓取选项
        
        Returns:
            爬取结果
        """
        try:
            # 检查客户端是否可用，如果不可用则重新初始化
            if not self._client or self._client.is_closed:
                if self._client:
                    await self._client.aclose()
                await self.initialize()
                
            # 默认选项
            default_scrape_options = {
                'extractorFormat': 'markdown'
            }
            
            if options:
                default_scrape_options.update(options)
            
            payload = {
                'url': start_url,
                'limit': limit,
                'maxDepth': max_depth,
                'strategy': 'bfs',
                'scrapeOptions': default_scrape_options
            }
            
            if include_paths:
                payload['includePaths'] = include_paths
            
            logger.info(f"开始网站爬取: {start_url}")
            response = await self._client.post('/api/crawl', json=payload)
            response.raise_for_status()
            
            result = response.json()
            crawl_id = result.get('id')
            
            # 等待爬取完成并返回结果
            return await self._wait_for_crawl_completion(crawl_id)
            
        except Exception as e:
            logger.error(f"DeepScrape网站爬取失败: {e}")
            return {
                'success': False,
                'error': str(e),
                'crawl_time': datetime.utcnow().isoformat(),
                'source': 'deepscrape'
            }
    
    async def _wait_for_crawl_completion(
        self,
        crawl_id: str,
        max_wait_time: int = 600,
        check_interval: int = 10
    ) -> Dict[str, Any]:
        """等待爬取任务完成"""
        try:
            start_time = datetime.utcnow()
            
            while True:
                # 检查爬取状态
                response = await self._client.get(f'/api/crawl/{crawl_id}')
                response.raise_for_status()
                
                crawl_data = response.json()
                status = crawl_data.get('status')
                
                if status == 'completed':
                    logger.info(f"爬取任务 {crawl_id} 完成")
                    return {
                        'success': True,
                        'crawl_id': crawl_id,
                        'status': status,
                        'pages': crawl_data.get('jobs', []),
                        'count': crawl_data.get('count', 0),
                        'exported_files': crawl_data.get('exportedFiles', {}),
                        'source': 'deepscrape'
                    }
                    
                elif status == 'failed':
                    logger.error(f"爬取任务 {crawl_id} 失败")
                    return {
                        'success': False,
                        'crawl_id': crawl_id,
                        'status': status,
                        'error': crawl_data.get('error', 'Unknown error'),
                        'source': 'deepscrape'
                    }
                
                # 检查超时
                elapsed = (datetime.utcnow() - start_time).seconds
                if elapsed > max_wait_time:
                    logger.warning(f"爬取任务 {crawl_id} 等待超时")
                    return {
                        'success': False,
                        'crawl_id': crawl_id,
                        'status': 'timeout',
                        'error': f'Crawl timeout after {max_wait_time} seconds',
                        'source': 'deepscrape'
                    }
                
                # 等待下次检查
                await asyncio.sleep(check_interval)
                
        except Exception as e:
            logger.error(f"等待爬取任务失败: {e}")
            return {
                'success': False,
                'crawl_id': crawl_id,
                'error': str(e),
                'source': 'deepscrape'
            }


# 全局服务实例
deepscrape_service = DeepScrapeService()