"""
网页爬取和内容解析服务
支持通用网站内容抓取和结构化解析
"""

import httpx
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional
import logging
import asyncio
from datetime import datetime
import re
from urllib.parse import urljoin

logger = logging.getLogger(__name__)


class WebCrawlerService:
    """网页爬取服务"""

    def __init__(self):
        self.default_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        }

    async def fetch_page(
        self,
        url: str,
        method: str = 'GET',
        headers: Dict[str, str] = None,
        timeout: int = 30,
        encoding: str = 'utf-8'
    ) -> Dict[str, Any]:
        """
        抓取网页内容

        Args:
            url: 目标URL
            method: HTTP方法
            headers: 自定义请求头
            timeout: 超时时间（秒）
            encoding: 页面编码

        Returns:
            包含页面内容的字典
        """
        try:
            # 合并请求头
            request_headers = self.default_headers.copy()
            if headers:
                request_headers.update(headers)

            async with httpx.AsyncClient(
                timeout=timeout,
                follow_redirects=True,
                verify=False  # 忽略SSL证书验证（某些政府网站可能有证书问题）
            ) as client:
                if method.upper() == 'GET':
                    response = await client.get(url, headers=request_headers)
                elif method.upper() == 'POST':
                    response = await client.post(url, headers=request_headers)
                else:
                    return {
                        "success": False,
                        "error": f"不支持的HTTP方法: {method}"
                    }

                response.raise_for_status()

                # 尝试检测正确的编码
                if encoding == 'auto':
                    encoding = response.encoding or 'utf-8'

                content = response.text

                logger.info(f"成功抓取页面: {url}, 状态码: {response.status_code}, 大小: {len(content)}")

                return {
                    "success": True,
                    "url": str(response.url),
                    "status_code": response.status_code,
                    "content": content,
                    "encoding": encoding,
                    "headers": dict(response.headers)
                }

        except httpx.TimeoutException:
            logger.error(f"页面抓取超时: {url}")
            return {
                "success": False,
                "error": f"请求超时（{timeout}秒）"
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP错误: {url}, 状态码: {e.response.status_code}")
            return {
                "success": False,
                "error": f"HTTP错误: {e.response.status_code}"
            }
        except Exception as e:
            logger.error(f"页面抓取失败: {url}, 错误: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def parse_page(
        self,
        html_content: str,
        selector_config: Dict[str, str],
        base_url: str = None
    ) -> List[Dict[str, Any]]:
        """
        解析网页内容，提取结构化数据

        Args:
            html_content: HTML内容
            selector_config: 选择器配置
            base_url: 基础URL，用于转换相对链接

        Returns:
            解析出的结果列表
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            results = []

            # 查找结果容器
            container_selector = selector_config.get('result_container', 'body')
            containers = soup.select(container_selector)

            if not containers:
                logger.warning(f"未找到结果容器: {container_selector}")
                # 如果找不到容器，尝试直接查找结果项
                containers = [soup]

            for container in containers:
                # 查找所有结果项
                item_selector = selector_config.get('item_selector', 'div')
                items = container.select(item_selector)

                logger.info(f"找到 {len(items)} 个结果项")

                for item in items:
                    result = self._parse_item(
                        item,
                        selector_config,
                        base_url
                    )
                    if result:
                        results.append(result)

            # 如果没有找到任何项，尝试备用解析策略
            if not results:
                logger.warning("使用选择器未找到结果，尝试备用解析策略")
                results = self._fallback_parse(soup, base_url)

            logger.info(f"成功解析 {len(results)} 条结果")
            return results

        except Exception as e:
            logger.error(f"页面解析失败: {str(e)}")
            return []

    def _parse_item(
        self,
        item: BeautifulSoup,
        selector_config: Dict[str, str],
        base_url: str = None
    ) -> Optional[Dict[str, Any]]:
        """
        解析单个结果项

        Args:
            item: BeautifulSoup元素
            selector_config: 选择器配置
            base_url: 基础URL

        Returns:
            解析结果字典
        """
        try:
            result = {}

            # 提取标题
            title_selector = selector_config.get('title_selector')
            if title_selector:
                title_elem = item.select_one(title_selector)
                if title_elem:
                    result['title'] = title_elem.get_text(strip=True)

            # 提取链接
            link_selector = selector_config.get('link_selector', 'a')
            link_elem = item.select_one(link_selector)
            if link_elem and link_elem.get('href'):
                href = link_elem.get('href')
                # 转换相对链接为绝对链接
                if base_url and not href.startswith(('http://', 'https://')):
                    href = urljoin(base_url, href)
                result['link'] = href

            # 提取内容/摘要
            content_selector = selector_config.get('content_selector')
            if content_selector:
                content_elem = item.select_one(content_selector)
                if content_elem:
                    result['content'] = content_elem.get_text(strip=True)
            else:
                # 如果没有指定内容选择器，使用整个项的文本
                result['content'] = item.get_text(strip=True)

            # 提取日期
            date_selector = selector_config.get('date_selector')
            if date_selector:
                date_elem = item.select_one(date_selector)
                if date_elem:
                    result['date'] = date_elem.get_text(strip=True)

            # 如果至少有标题或内容，认为是有效结果
            if result.get('title') or result.get('content'):
                return result

            return None

        except Exception as e:
            logger.error(f"结果项解析失败: {str(e)}")
            return None

    def _fallback_parse(
        self,
        soup: BeautifulSoup,
        base_url: str = None
    ) -> List[Dict[str, Any]]:
        """
        备用解析策略：尝试智能识别页面结构

        Args:
            soup: BeautifulSoup对象
            base_url: 基础URL

        Returns:
            解析结果列表
        """
        results = []

        try:
            # 尝试查找常见的搜索结果容器
            common_containers = [
                '.search-result', '.result', '.list-item',
                '[class*="result"]', '[class*="item"]',
                'article', '.content-item'
            ]

            for selector in common_containers:
                items = soup.select(selector)
                if items and len(items) >= 3:  # 至少找到3个元素才认为可能是结果列表
                    logger.info(f"备用解析找到 {len(items)} 个项: {selector}")

                    for item in items[:20]:  # 限制最多20个结果
                        # 查找标题（通常是h1-h6或链接）
                        title_elem = item.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'])
                        if not title_elem:
                            continue

                        result = {
                            'title': title_elem.get_text(strip=True),
                            'content': item.get_text(strip=True)[:500]  # 限制内容长度
                        }

                        # 查找链接
                        link_elem = item.find('a')
                        if link_elem and link_elem.get('href'):
                            href = link_elem.get('href')
                            if base_url and not href.startswith(('http://', 'https://')):
                                href = urljoin(base_url, href)
                            result['link'] = href

                        results.append(result)

                    if results:
                        break

            logger.info(f"备用解析找到 {len(results)} 条结果")

        except Exception as e:
            logger.error(f"备用解析失败: {str(e)}")

        return results

    async def crawl_and_parse(
        self,
        url: str,
        selector_config: Dict[str, str],
        parse_config: Dict[str, Any] = None,
        method: str = 'GET',
        headers: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """
        爬取并解析网页（一站式方法）

        Args:
            url: 目标URL
            selector_config: 选择器配置
            parse_config: 解析配置
            method: HTTP方法
            headers: 自定义请求头

        Returns:
            包含解析结果的字典
        """
        start_time = datetime.now()

        # 默认解析配置
        if parse_config is None:
            parse_config = {}

        timeout = parse_config.get('timeout', 30)
        encoding = parse_config.get('encoding', 'utf-8')
        max_results = parse_config.get('max_results', 20)

        # 抓取页面
        fetch_result = await self.fetch_page(
            url=url,
            method=method,
            headers=headers,
            timeout=timeout,
            encoding=encoding
        )

        if not fetch_result['success']:
            return {
                "success": False,
                "error": fetch_result['error'],
                "execution_time": (datetime.now() - start_time).total_seconds()
            }

        # 解析页面
        results = self.parse_page(
            html_content=fetch_result['content'],
            selector_config=selector_config,
            base_url=url
        )

        # 限制结果数量
        if max_results and len(results) > max_results:
            results = results[:max_results]

        execution_time = (datetime.now() - start_time).total_seconds()

        return {
            "success": True,
            "url": fetch_result['url'],
            "results_count": len(results),
            "results": results,
            "execution_time": execution_time,
            "status_code": fetch_result['status_code']
        }

    def clean_text(self, text: str) -> str:
        """
        清理提取的文本内容

        Args:
            text: 原始文本

        Returns:
            清理后的文本
        """
        if not text:
            return ""

        # 移除多余的空白字符
        text = re.sub(r'\s+', ' ', text)

        # 移除HTML实体
        text = text.replace('&nbsp;', ' ')
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        text = text.replace('&amp;', '&')

        return text.strip()


# 创建服务单例
web_crawler_service = WebCrawlerService()
