"""
自定义爬虫工具集 - Agno工具包装器
从数据库动态加载配置的爬虫工具,支持API和HTML两种爬取模式
"""

import asyncio
import json
import asyncpg
from typing import Dict, List, Any, Optional
from datetime import datetime

from agno.tools import tool
from agno.tools.toolkit import Toolkit

from core.logger import logger
from core.config_optimized import optimized_config_manager
from service.api_crawler_service import api_crawler_service
from service.browser_crawler_service import browser_crawler_service
from service.web_crawler_service import web_crawler_service
from service.url_parser_service import url_parser_service


class CustomCrawlerTools(Toolkit):
    """自定义爬虫工具集 - 动态从数据库加载爬虫工具配置"""

    def __init__(self, selected_tool_ids: Optional[List[int]] = None):
        """
        初始化自定义爬虫工具集

        Args:
            selected_tool_ids: 用户选择的工具ID列表,例如 [1, 2]
        """
        super().__init__(name="custom_crawler_tools")
        self.selected_tool_ids = selected_tool_ids or []
        self._tool_configs_cache = {}  # 缓存工具配置
        logger.info(f"[CustomCrawlerTools] 初始化,选中工具: {self.selected_tool_ids}")

        # 如果只有一个工具，记住它的ID
        self._single_tool_id = selected_tool_ids[0] if selected_tool_ids and len(selected_tool_ids) == 1 else None

    async def _get_db_connection(self) -> asyncpg.Connection:
        """获取数据库连接"""
        db_config = optimized_config_manager.settings.database_postgresql
        return await asyncpg.connect(
            host=db_config.host,
            port=db_config.port,
            user=db_config.username,
            password=db_config.password,
            database=db_config.database
        )

    async def _load_tool_config(self, tool_id: int) -> Optional[Dict[str, Any]]:
        """从数据库加载工具配置"""
        # 检查缓存
        if tool_id in self._tool_configs_cache:
            return self._tool_configs_cache[tool_id]

        conn = await self._get_db_connection()
        try:
            row = await conn.fetchrow("""
                SELECT
                    id, name, description, base_url, url_template, method, headers,
                    params_mapping, selector_config, parse_config,
                    use_api, api_config, enabled
                FROM custom_crawler_tools
                WHERE id = $1 AND enabled = true
            """, tool_id)

            if not row:
                logger.error(f"[CustomCrawlerTools] 工具不存在或未启用: tool_id={tool_id}")
                return None

            # 解析JSONB字段
            config = dict(row)
            for field in ['headers', 'params_mapping', 'selector_config', 'parse_config', 'api_config']:
                if config.get(field):
                    if isinstance(config[field], str):
                        try:
                            config[field] = json.loads(config[field])
                        except:
                            config[field] = {}
                else:
                    config[field] = {}

            # 缓存配置
            self._tool_configs_cache[tool_id] = config
            logger.info(f"[CustomCrawlerTools] 已加载工具配置: {config['name']} (id={tool_id})")
            return config

        finally:
            await conn.close()

    async def _record_execution(self, tool_id: int, keyword: str,
                               status: str, results_count: int = 0,
                               results: Optional[List[Dict]] = None,
                               error_message: Optional[str] = None,
                               execution_time: float = 0.0):
        """记录工具执行历史"""
        conn = await self._get_db_connection()
        try:
            await conn.execute("""
                INSERT INTO custom_tool_executions
                (tool_id, query_keyword, execution_status, results_count,
                 results, error_message, execution_time, completed_at)
                VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
            """, tool_id, keyword, status, results_count,
                json.dumps(results or [], ensure_ascii=False),
                error_message, execution_time, datetime.now())
        except Exception as e:
            logger.warning(f"[CustomCrawlerTools] 记录执行历史失败: {e}")
        finally:
            await conn.close()

    @tool
    async def search_custom_crawler_tool(
        self,
        query: str,
        max_results: int = 10,
        tool_id: Optional[int] = None,
        keyword: Optional[str] = None
    ) -> str:
        """
        使用自定义爬虫工具搜索政策文档

        搜索政府网站的政策文档、新闻、公告等信息。支持关键词搜索，返回相关文档列表。

        Args:
            query: 搜索关键词，例如"一老一小政策"、"乡村振兴"、"招商引资"等
            max_results: 返回的最大结果数量，建议5-10条，默认10条。请始终传递此参数并设置为5-10之间的值以获取足够的搜索结果。
            tool_id: (可选)工具ID，如果只选择了一个工具则自动使用
            keyword: (可选)query的别名，保持向后兼容

        Returns:
            JSON格式的搜索结果，包含标题、链接、时间等信息

        Examples:
            搜索一老一小政策: {"query": "一老一小政策", "max_results": 5}
            搜索乡村振兴: {"query": "乡村振兴", "max_results": 10}
            搜索招商引资: {"query": "招商引资", "max_results": 8}
        """
        start_time = datetime.now()

        try:
            # 参数兼容处理
            search_keyword = query or keyword
            if not search_keyword:
                error_msg = "必须提供query或keyword参数"
                logger.error(f"[CustomCrawlerTools] {error_msg}")
                return json.dumps({"success": False, "error": error_msg}, ensure_ascii=False)

            # 自动确定tool_id
            if tool_id is None:
                if self._single_tool_id:
                    tool_id = self._single_tool_id
                    logger.info(f"[CustomCrawlerTools] 自动使用单一工具ID: {tool_id}")
                elif self.selected_tool_ids:
                    tool_id = self.selected_tool_ids[0]
                    logger.info(f"[CustomCrawlerTools] 使用第一个可用工具ID: {tool_id}")
                else:
                    error_msg = "未选择任何工具"
                    logger.error(f"[CustomCrawlerTools] {error_msg}")
                    return json.dumps({"success": False, "error": error_msg}, ensure_ascii=False)

            # 验证工具ID是否在选中列表中
            if self.selected_tool_ids and tool_id not in self.selected_tool_ids:
                error_msg = f"工具ID {tool_id} 未被选中,可用工具: {self.selected_tool_ids}"
                logger.error(f"[CustomCrawlerTools] {error_msg}")
                return json.dumps({"success": False, "error": error_msg}, ensure_ascii=False)

            # 加载工具配置
            tool_config = await self._load_tool_config(tool_id)
            if not tool_config:
                error_msg = f"工具ID {tool_id} 不存在或未启用"
                await self._record_execution(tool_id, search_keyword, 'failed', error_message=error_msg)
                return json.dumps({"success": False, "error": error_msg}, ensure_ascii=False)

            logger.info(f"[CustomCrawlerTools] 开始执行工具: {tool_config['name']}, keyword={search_keyword}, max_results={max_results}")

            # 根据use_api标志选择执行方式
            use_api = tool_config.get('use_api', False)

            if use_api and tool_config.get('api_config'):
                # 使用API调用方式
                result = await self._execute_api_mode(tool_config, search_keyword, max_results)
            else:
                # 使用HTML爬取方式
                result = await self._execute_html_mode(tool_config, search_keyword, max_results)

            # 计算执行时间
            execution_time = (datetime.now() - start_time).total_seconds()

            # 记录执行历史
            if result.get('success'):
                results = result.get('results', [])
                await self._record_execution(
                    tool_id, search_keyword, 'completed',
                    results_count=len(results),
                    results=results[:max_results],  # 只记录前max_results条
                    execution_time=execution_time
                )
                logger.info(f"[CustomCrawlerTools] 执行成功: {tool_config['name']}, 结果数={len(results)}, 耗时={execution_time:.2f}s")
            else:
                await self._record_execution(
                    tool_id, search_keyword, 'failed',
                    error_message=result.get('error', '未知错误'),
                    execution_time=execution_time
                )
                logger.error(f"[CustomCrawlerTools] 执行失败: {result.get('error')}")

            return json.dumps(result, ensure_ascii=False)

        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            error_msg = f"工具执行异常: {str(e)}"
            logger.error(f"[CustomCrawlerTools] {error_msg}")
            # 如果tool_id还是None，用first available
            if tool_id is None and self.selected_tool_ids:
                tool_id = self.selected_tool_ids[0]
            await self._record_execution(tool_id or 0, search_keyword, 'failed',
                                        error_message=error_msg,
                                        execution_time=execution_time)
            return json.dumps({"success": False, "error": error_msg}, ensure_ascii=False)

    async def _execute_api_mode(
        self,
        tool_config: Dict[str, Any],
        keyword: str,
        max_results: int
    ) -> Dict[str, Any]:
        """执行API调用模式"""
        api_config = tool_config['api_config']
        params_template = api_config.get('params_template', {})

        # 构建API参数
        api_params = {}
        for key, value in params_template.items():
            if isinstance(value, str) and '{' in value:
                # 替换占位符
                if '{keyword}' in value:
                    api_params[key] = value.replace('{keyword}', keyword)
                else:
                    # 从params_mapping获取默认值
                    param_key = value.strip('{}')
                    param_mapping = tool_config.get('params_mapping', {}).get(param_key, {})
                    api_params[key] = param_mapping.get('default_value', '')
            else:
                api_params[key] = value

        # 设置分页参数
        if 'pageSize' in api_params:
            api_params['pageSize'] = max_results
        if 'page_size' in api_params:
            api_params['page_size'] = max_results

        # 调用API
        logger.info(f"[CustomCrawlerTools] API模式调用: {api_config['api_url']}")
        api_result = await api_crawler_service.call_search_api(
            api_url=api_config['api_url'],
            search_params=api_params,
            headers=tool_config.get('headers', {})
        )

        if not api_result.get('success'):
            return api_result

        # 解析响应
        response_path = api_config.get('response_path', {})
        data = api_result['data']

        # 提取结果列表
        data_field = response_path.get('data_field', 'data')
        results_data = self._get_nested_value(data, data_field)
        if not isinstance(results_data, list):
            results_data = []

        # 字段映射
        mapping = response_path.get('mapping', {})
        results = []
        for item in results_data[:max_results]:
            mapped_item = {}
            for target_field, source_field in mapping.items():
                mapped_item[target_field] = item.get(source_field, '')
            results.append(mapped_item)

        return {
            "success": True,
            "tool_name": tool_config['name'],
            "mode": "api",
            "results_count": len(results),
            "results": results,
            "execution_time": api_result.get('execution_time', 0)
        }

    async def _execute_html_mode(
        self,
        tool_config: Dict[str, Any],
        keyword: str,
        max_results: int
    ) -> Dict[str, Any]:
        """执行HTML爬取模式"""
        # 构建URL
        url = url_parser_service.build_url_from_template(
            base_url=tool_config['base_url'],
            url_template=tool_config['url_template'],
            params_mapping=tool_config['params_mapping'],
            keyword=keyword
        )

        # 判断是否需要JS渲染
        parse_config = tool_config.get('parse_config', {})
        use_js_render = parse_config.get('use_js_render', False)

        logger.info(f"[CustomCrawlerTools] HTML模式爬取: {url}, js_render={use_js_render}")

        if use_js_render:
            # 使用浏览器渲染
            result = await browser_crawler_service.crawl_and_parse_with_js(
                url=url,
                selector_config=tool_config['selector_config'],
                parse_config=parse_config
            )
        else:
            # 使用HTTP请求
            result = await web_crawler_service.crawl_and_parse(
                url=url,
                selector_config=tool_config['selector_config'],
                parse_config=parse_config
            )

        if not result.get('success'):
            return result

        # 限制结果数量
        results = result.get('results', [])[:max_results]

        return {
            "success": True,
            "tool_name": tool_config['name'],
            "mode": "js_render" if use_js_render else "http",
            "results_count": len(results),
            "results": results,
            "execution_time": result.get('execution_time', 0)
        }

    def _get_nested_value(self, data: Any, path: str) -> Any:
        """获取嵌套字典/列表中的值

        Args:
            data: 数据对象
            path: 路径,如 'data.middle.list'

        Returns:
            提取的值
        """
        if not path:
            return data

        keys = path.split('.')
        current = data

        for key in keys:
            if isinstance(current, dict):
                current = current.get(key)
            elif isinstance(current, list) and key.isdigit():
                idx = int(key)
                current = current[idx] if idx < len(current) else None
            else:
                return None

            if current is None:
                return None

        return current


# 便捷函数:创建工具实例
async def create_custom_crawler_tools(selected_tool_ids: Optional[List[int]] = None) -> CustomCrawlerTools:
    """创建自定义爬虫工具实例"""
    return CustomCrawlerTools(selected_tool_ids=selected_tool_ids)
