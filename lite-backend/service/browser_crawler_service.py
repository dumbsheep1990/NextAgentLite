"""
浏览器爬取服务 - 支持JavaScript渲染
使用Playwright处理需要JavaScript的动态网页
"""

from playwright.async_api import async_playwright, Browser, Page
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional
import logging
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)


class BrowserCrawlerService:
    """基于浏览器的爬取服务（支持JavaScript）"""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.playwright = None

    async def initialize(self):
        """初始化Playwright浏览器"""
        if self.browser is None:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-dev-shm-usage'
                ]
            )
            logger.info("Playwright浏览器初始化成功")

    async def close(self):
        """关闭浏览器"""
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
            logger.info("Playwright浏览器已关闭")

    async def fetch_page_with_js(
        self,
        url: str,
        wait_time: int = 3000,
        wait_selector: str = None,
        timeout: int = 30000
    ) -> Dict[str, Any]:
        """
        使用浏览器抓取页面（支持JavaScript渲染）

        Args:
            url: 目标URL
            wait_time: 等待时间（毫秒），用于等待JS加载完成
            wait_selector: 等待特定选择器出现
            timeout: 超时时间（毫秒）

        Returns:
            包含页面内容的字典
        """
        try:
            await self.initialize()

            # 创建新页面
            page = await self.browser.new_page(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )

            # 注入脚本隐藏自动化特征
            await page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['zh-CN', 'zh', 'en']
                });
                window.chrome = { runtime: {} };
            """)

            # 设置默认超时
            page.set_default_timeout(timeout)

            # 访问页面 (使用domcontentloaded避免networkidle超时)
            response = await page.goto(url, wait_until='domcontentloaded', timeout=timeout)

            # 等待特定选择器（如果指定）
            if wait_selector:
                try:
                    await page.wait_for_selector(wait_selector, timeout=wait_time)
                    logger.info(f"选择器已出现: {wait_selector}")
                except Exception as e:
                    logger.warning(f"等待选择器超时: {wait_selector}, 错误: {str(e)}")
            else:
                # 否则等待固定时间
                await asyncio.sleep(wait_time / 1000)

            # 获取页面内容
            content = await page.content()

            # 获取最终URL（可能发生重定向）
            final_url = page.url

            # 关闭页面
            await page.close()

            logger.info(f"成功抓取JS渲染页面: {url}, 最终URL: {final_url}, 大小: {len(content)}")

            return {
                "success": True,
                "url": final_url,
                "status_code": response.status if response else 200,
                "content": content,
                "encoding": "utf-8"
            }

        except Exception as e:
            logger.error(f"浏览器抓取失败: {url}, 错误: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def crawl_and_parse_with_js(
        self,
        url: str,
        selector_config: Dict[str, str],
        parse_config: Dict[str, Any] = None,
        wait_time: int = 3000,
        wait_selector: str = None
    ) -> Dict[str, Any]:
        """
        使用浏览器爬取并解析网页（支持JavaScript）

        Args:
            url: 目标URL
            selector_config: 选择器配置
            parse_config: 解析配置
            wait_time: 等待时间（毫秒）
            wait_selector: 等待特定选择器

        Returns:
            包含解析结果的字典
        """
        start_time = datetime.now()

        # 默认解析配置
        if parse_config is None:
            parse_config = {}

        timeout = parse_config.get('timeout', 30) * 1000  # 转换为毫秒
        max_results = parse_config.get('max_results', 20)

        # 如果指定了结果容器选择器，使用它作为等待选择器
        if wait_selector is None and selector_config.get('result_container'):
            wait_selector = selector_config['result_container'].split(',')[0].strip()

        # 抓取页面
        fetch_result = await self.fetch_page_with_js(
            url=url,
            wait_time=wait_time,
            wait_selector=wait_selector,
            timeout=timeout
        )

        if not fetch_result['success']:
            return {
                "success": False,
                "error": fetch_result['error'],
                "execution_time": (datetime.now() - start_time).total_seconds()
            }

        # 解析页面
        results = self._parse_html(
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
            "render_method": "playwright"
        }

    def _parse_html(
        self,
        html_content: str,
        selector_config: Dict[str, str],
        base_url: str = None
    ) -> List[Dict[str, Any]]:
        """
        解析HTML内容（与web_crawler_service保持一致）

        Args:
            html_content: HTML内容
            selector_config: 选择器配置
            base_url: 基础URL

        Returns:
            解析结果列表
        """
        try:
            from urllib.parse import urljoin

            soup = BeautifulSoup(html_content, 'html.parser')
            results = []

            # 查找结果容器
            container_selector = selector_config.get('result_container', 'body')
            # 支持多选择器（逗号分隔）
            container_selectors = [s.strip() for s in container_selector.split(',')]

            containers = []
            for selector in container_selectors:
                found = soup.select(selector)
                if found:
                    containers.extend(found)
                    logger.info(f"使用选择器找到容器: {selector}, 数量: {len(found)}")
                    break

            if not containers:
                logger.warning(f"未找到结果容器: {container_selector}")
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

            # 备用解析
            if not results:
                logger.warning("使用选择器未找到结果，尝试备用解析")
                results = self._fallback_parse(soup, base_url)

            logger.info(f"成功解析 {len(results)} 条结果")
            return results

        except Exception as e:
            logger.error(f"HTML解析失败: {str(e)}")
            return []

    def _parse_item(
        self,
        item: BeautifulSoup,
        selector_config: Dict[str, str],
        base_url: str = None
    ) -> Optional[Dict[str, Any]]:
        """解析单个结果项"""
        try:
            from urllib.parse import urljoin

            result = {}

            # 提取标题
            title_selector = selector_config.get('title_selector')
            if title_selector:
                # 支持多选择器
                title_selectors = [s.strip() for s in title_selector.split(',')]
                for selector in title_selectors:
                    title_elem = item.select_one(selector)
                    if title_elem:
                        result['title'] = title_elem.get_text(strip=True)
                        break

            # 提取链接
            link_selector = selector_config.get('link_selector', 'a')
            link_selectors = [s.strip() for s in link_selector.split(',')]
            for selector in link_selectors:
                link_elem = item.select_one(selector)
                if link_elem and link_elem.get('href'):
                    href = link_elem.get('href')
                    if base_url and not href.startswith(('http://', 'https://')):
                        href = urljoin(base_url, href)
                    result['link'] = href
                    break

            # 提取内容
            content_selector = selector_config.get('content_selector')
            if content_selector:
                content_selectors = [s.strip() for s in content_selector.split(',')]
                for selector in content_selectors:
                    content_elem = item.select_one(selector)
                    if content_elem:
                        result['content'] = content_elem.get_text(strip=True)
                        break
            else:
                result['content'] = item.get_text(strip=True)

            # 提取日期
            date_selector = selector_config.get('date_selector')
            if date_selector:
                date_selectors = [s.strip() for s in date_selector.split(',')]
                for selector in date_selectors:
                    date_elem = item.select_one(selector)
                    if date_elem:
                        result['date'] = date_elem.get_text(strip=True)
                        break

            # 验证结果有效性
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
        """备用解析策略"""
        from urllib.parse import urljoin

        results = []

        try:
            common_containers = [
                '.search-result', '.result', '.list-item',
                '[class*="result"]', '[class*="item"]',
                'article', '.content-item', 'li'
            ]

            for selector in common_containers:
                items = soup.select(selector)
                if items and len(items) >= 3:
                    logger.info(f"备用解析找到 {len(items)} 个项: {selector}")

                    for item in items[:20]:
                        title_elem = item.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'])
                        if not title_elem:
                            continue

                        result = {
                            'title': title_elem.get_text(strip=True),
                            'content': item.get_text(strip=True)[:500]
                        }

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


# 创建服务单例
browser_crawler_service = BrowserCrawlerService()
