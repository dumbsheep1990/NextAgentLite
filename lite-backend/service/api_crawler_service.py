"""
API爬取服务 - 直接调用网站的搜索API
用于那些提供搜索API的网站，比六盘水政府网站
"""

import httpx
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class APICrawlerService:
    """基于API的爬取服务（直接调用网站API）"""

    def __init__(self):
        self.timeout = 30

    async def call_search_api(
        self,
        api_url: str,
        search_params: Dict[str, Any],
        headers: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """
        调用搜索API

        Args:
            api_url: API地址
            search_params: 搜索参数
            headers: 请求头

        Returns:
            包含搜索结果的字典
        """
        start_time = datetime.now()

        try:
            # 默认请求头
            if headers is None:
                headers = {}

            # 添加必要的请求头
            default_headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
            default_headers.update(headers)

            logger.info(f"调用API: {api_url}")
            logger.info(f"参数: {search_params}")

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    api_url,
                    json=search_params,
                    headers=default_headers
                )

                response.raise_for_status()

                # 解析JSON响应
                data = response.json()

                execution_time = (datetime.now() - start_time).total_seconds()

                logger.info(f"API调用成功，耗时: {execution_time:.2f}秒")

                return {
                    "success": True,
                    "data": data,
                    "execution_time": execution_time,
                    "status_code": response.status_code
                }

        except httpx.HTTPStatusError as e:
            error_msg = f"API返回错误状态码: {e.response.status_code}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
                "execution_time": (datetime.now() - start_time).total_seconds()
            }
        except Exception as e:
            error_msg = f"API调用失败: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
                "execution_time": (datetime.now() - start_time).total_seconds()
            }

    async def search_liupanshui(
        self,
        keyword: str,
        tenant_id: str = "30",
        data_type_id: str = "124",
        order_by: str = "related",
        search_by: str = "all",
        page_no: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        六盘水政府网站专用搜索方法

        Args:
            keyword: 搜索关键词
            tenant_id: 租户ID
            data_type_id: 数据类型ID
            order_by: 排序方式 (related/time)
            search_by: 搜索方式 (all/title)
            page_no: 页码
            page_size: 每页数量

        Returns:
            包含搜索结果的字典
        """
        api_url = "https://www.gzlps.gov.cn/irs/front/search"

        search_params = {
            "tenantId": tenant_id,
            "configTenantId": "",
            "tenantIds": "",
            "searchWord": keyword,
            "dataTypeId": data_type_id,
            "orderBy": order_by,
            "searchBy": search_by,
            "appendixType": "",
            "granularity": "ALL",
            "beginDateTime": "",
            "endDateTime": "",
            "isSearchForced": 0,
            "filters": [],
            "pageNo": page_no,
            "pageSize": page_size
        }

        result = await self.call_search_api(api_url, search_params)

        if result['success']:
            # 解析六盘水API的响应格式
            api_data = result['data']

            if api_data.get('success') and 'data' in api_data:
                data_obj = api_data['data']

                # 提取结果列表
                results = []
                if 'middle' in data_obj and 'list' in data_obj['middle']:
                    raw_results = data_obj['middle']['list']

                    for item in raw_results:
                        results.append({
                            'title': item.get('title_no_tag', ''),
                            'link': item.get('url', ''),
                            'content': item.get('content', ''),
                            'date': item.get('time', ''),
                            'source': item.get('source', '')
                        })

                # 提取分页信息
                pager = data_obj.get('pager', {})

                return {
                    "success": True,
                    "url": api_url,
                    "results_count": len(results),
                    "results": results,
                    "execution_time": result['execution_time'],
                    "render_method": "api",
                    "pager": {
                        "pageNo": pager.get('pageNo', page_no),
                        "pageSize": pager.get('pageSize', page_size),
                        "total": pager.get('total', len(results))
                    }
                }
            else:
                error_msg = api_data.get('msg', '未知错误')
                return {
                    "success": False,
                    "error": f"API返回错误: {error_msg}",
                    "execution_time": result['execution_time']
                }
        else:
            return result


# 创建服务单例
api_crawler_service = APICrawlerService()
