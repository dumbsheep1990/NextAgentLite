"""
百度搜索工具 - Agno集成
基于baidusearch库实现的百度搜索功能
"""
from typing import Optional, List, Dict, Any
from agno.tools import tool
from core.logger import logger
import re


class BaiduSearchTools:
    """百度搜索工具集"""

    def __init__(
        self,
        fixed_max_results: Optional[int] = None,
        fixed_language: Optional[str] = None,
        headers: Optional[Any] = None,
        proxy: Optional[str] = None,
        timeout: int = 10,
        enable_filter: bool = True,
        enable_rerank: bool = True,
    ):
        """
        初始化百度搜索工具

        Args:
            fixed_max_results: 固定的最大结果数
            fixed_language: 固定的搜索语言
            headers: 自定义HTTP头
            proxy: 代理服务器地址
            timeout: 超时时间(秒)
            enable_filter: 是否启用结果过滤（过滤低质量结果）
            enable_rerank: 是否启用结果重排（按相关性重新排序）
        """
        self.fixed_max_results = fixed_max_results
        self.fixed_language = fixed_language
        self.headers = headers
        self.proxy = proxy
        self.timeout = timeout
        self.enable_filter = enable_filter
        self.enable_rerank = enable_rerank
        self._search_client = None

    def _get_search_client(self):
        """延迟初始化搜索客户端"""
        if self._search_client is None:
            try:
                from baidusearch.baidusearch import search
                self._search_client = search
                logger.info("百度搜索客户端初始化成功")
            except ImportError as e:
                logger.error(f"导入baidusearch失败: {e}，请运行: pip install -U baidusearch")
                raise ImportError(
                    "baidusearch库未安装。请运行: pip install -U baidusearch"
                ) from e
        return self._search_client

    def _filter_results(self, results: List[Dict], query: str) -> List[Dict]:
        """
        过滤低质量搜索结果

        过滤规则：
        1. 过滤空标题或空URL的结果
        2. 过滤摘要过短的结果（<20字符）
        3. 过滤标题和摘要重复度过高的结果
        4. 过滤明显的广告和推广内容
        """
        if not self.enable_filter or not results:
            return results

        filtered = []
        seen_titles = set()

        for result in results:
            title = result.get('title', '').strip()
            url = result.get('url', '').strip()
            abstract = result.get('abstract', '').strip()

            # 规则1: 过滤空标题或空URL
            if not title or not url:
                logger.debug(f"[过滤] 空标题或URL: {title}")
                continue

            # 规则2: 过滤摘要过短
            if len(abstract) < 20:
                logger.debug(f"[过滤] 摘要过短: {title}")
                continue

            # 规则3: 过滤重复标题
            title_normalized = re.sub(r'\s+', '', title.lower())
            if title_normalized in seen_titles:
                logger.debug(f"[过滤] 重复标题: {title}")
                continue
            seen_titles.add(title_normalized)

            # 规则4: 过滤明显广告（包含特定关键词）
            ad_keywords = ['广告', '推广', '赞助', '购买', '官网', '加盟', '招商']
            if any(kw in title for kw in ad_keywords):
                logger.debug(f"[过滤] 广告内容: {title}")
                continue

            filtered.append(result)

        logger.info(f"[过滤] 原始结果: {len(results)}条, 过滤后: {len(filtered)}条")
        return filtered

    def _rerank_results(self, results: List[Dict], query: str) -> List[Dict]:
        """
        根据相关性重新排序搜索结果

        评分规则：
        1. 标题包含查询词 +5分
        2. 摘要包含查询词 +3分
        3. 标题查询词出现次数 * 2分
        4. 摘要查询词出现次数 * 1分
        5. 摘要长度适中 (50-200字符) +2分
        6. 原始排名靠前 +(10 - rank)分
        """
        if not self.enable_rerank or not results:
            return results

        query_terms = query.lower().split()

        def calculate_score(result: Dict) -> float:
            score = 0.0
            title = result.get('title', '').lower()
            abstract = result.get('abstract', '').lower()
            rank = result.get('rank', 10)

            # 规则1: 标题包含查询词
            for term in query_terms:
                if term in title:
                    score += 5

            # 规则2: 摘要包含查询词
            for term in query_terms:
                if term in abstract:
                    score += 3

            # 规则3: 标题查询词出现次数
            for term in query_terms:
                score += title.count(term) * 2

            # 规则4: 摘要查询词出现次数
            for term in query_terms:
                score += abstract.count(term) * 1

            # 规则5: 摘要长度适中
            abstract_len = len(abstract)
            if 50 <= abstract_len <= 200:
                score += 2

            # 规则6: 原始排名
            score += max(0, 10 - rank)

            return score

        # 计算分数并排序
        scored_results = []
        for result in results:
            score = calculate_score(result)
            scored_results.append((score, result))

        # 按分数降序排序
        scored_results.sort(key=lambda x: x[0], reverse=True)

        reranked = [result for score, result in scored_results]

        logger.info(f"[重排] 完成结果重排，前3条分数: {[scored_results[i][0] for i in range(min(3, len(scored_results)))]}")
        return reranked

    @tool(
        name="baidu_search",
        description=(
            "使用百度搜索引擎查找信息。"
            "支持中英文搜索，返回最相关的搜索结果，包括标题、链接和摘要。"
            "适合查找最新资讯、技术文档、新闻事件等信息。"
        )
    )
    def baidu_search(
        self,
        query: str,
        max_results: Optional[int] = None,
        language: Optional[str] = None
    ) -> str:
        """
        使用百度搜索查询信息

        Args:
            query: 搜索查询词
            max_results: 最大返回结果数 (默认: 5)
            language: 搜索语言，'zh'为中文，'en'为英文 (默认: 'zh')

        Returns:
            格式化的搜索结果字符串，包含标题、链接和摘要
        """
        try:
            search_func = self._get_search_client()

            # 使用固定参数或传入参数
            final_max_results = (
                self.fixed_max_results if self.fixed_max_results is not None
                else (max_results if max_results is not None else 5)
            )
            final_language = (
                self.fixed_language if self.fixed_language is not None
                else (language if language is not None else "zh")
            )

            # 确保max_results在合理范围内
            final_max_results = max(1, min(final_max_results, 10))

            logger.info(
                f"执行百度搜索: query='{query}', max_results={final_max_results}, "
                f"language={final_language}"
            )

            # 执行搜索 - 为了保证过滤后有足够结果，请求更多结果
            # baidusearch.search() 接受: keyword, num_results, debug
            search_count = final_max_results * 2 if self.enable_filter else final_max_results
            results = []
            try:
                results = search_func(query, num_results=search_count, debug=0)
                if not results:
                    results = []
            except Exception as e:
                logger.error(f"百度搜索执行失败: {e}")
                return f"搜索失败: {str(e)}"

            if not results:
                logger.warning(f"百度搜索未返回结果: query='{query}'")
                return f"未找到关于 '{query}' 的相关结果。"

            logger.info(f"原始搜索结果: {len(results)}条")

            # 应用过滤
            if self.enable_filter:
                results = self._filter_results(results, query)
                if not results:
                    return f"搜索到结果但全部被过滤，请尝试其他查询词。"

            # 应用重排
            if self.enable_rerank:
                results = self._rerank_results(results, query)

            # 限制最终结果数量
            results = results[:final_max_results]

            # 格式化结果
            # baidusearch返回: title, abstract, url, rank
            formatted_results = []
            for idx, result in enumerate(results, 1):
                title = result.get("title", "无标题")
                url = result.get("url", "")
                abstract = result.get("abstract", "")

                formatted_results.append(
                    f"[{idx}] {title}\n"
                    f"链接: {url}\n"
                    f"摘要: {abstract}\n"
                )

            filter_info = " (已过滤和重排)" if (self.enable_filter or self.enable_rerank) else ""
            output = (
                f"百度搜索结果{filter_info} (共{len(results)}条):\n\n"
                + "\n".join(formatted_results)
            )

            logger.info(f"百度搜索完成: 返回{len(results)}条结果 (过滤={self.enable_filter}, 重排={self.enable_rerank})")
            return output

        except ImportError as e:
            error_msg = "baidusearch库未安装，请运行: pip install -U baidusearch"
            logger.error(error_msg)
            return error_msg
        except Exception as e:
            error_msg = f"百度搜索出错: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return error_msg


# 便捷函数: 创建默认的百度搜索工具
def create_baidu_search_tools(**kwargs) -> BaiduSearchTools:
    """
    创建百度搜索工具实例

    Args:
        **kwargs: 传递给BaiduSearchTools的参数

    Returns:
        BaiduSearchTools实例
    """
    return BaiduSearchTools(**kwargs)