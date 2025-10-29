"""
URL解析服务
用于智能解析URL并提取参数配置
"""

from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from typing import Dict, Any, List, Optional
import re
import logging

logger = logging.getLogger(__name__)


class URLParserService:
    """URL解析和参数提取服务"""

    @staticmethod
    def parse_url(url: str) -> Dict[str, Any]:
        """
        解析URL，提取基础信息和参数

        Args:
            url: 完整的URL字符串

        Returns:
            包含URL解析结果的字典
        """
        try:
            parsed = urlparse(url)
            query_params = parse_qs(parsed.query)

            # 转换查询参数为单值字典
            params_dict = {
                key: values[0] if len(values) == 1 else values
                for key, values in query_params.items()
            }

            # 构建基础URL（不含查询参数）
            base_url = f"{parsed.scheme}://{parsed.netloc}"

            # 构建路径URL（含路径但不含查询参数）
            path_url = urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                '',  # params
                '',  # query
                ''   # fragment
            ))

            return {
                "success": True,
                "base_url": base_url,
                "path_url": path_url,
                "full_url": url,
                "scheme": parsed.scheme,
                "netloc": parsed.netloc,
                "path": parsed.path,
                "params": params_dict,
                "fragment": parsed.fragment
            }
        except Exception as e:
            logger.error(f"URL解析失败: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    def generate_url_template(url: str, keyword_param: str = None) -> Dict[str, Any]:
        """
        生成URL模板，将关键词参数替换为占位符

        Args:
            url: 原始URL
            keyword_param: 关键词参数名（如searchWord），如果为None则自动检测

        Returns:
            包含URL模板和参数映射的字典
        """
        try:
            parsed_result = URLParserService.parse_url(url)
            if not parsed_result["success"]:
                return parsed_result

            params = parsed_result["params"]

            # 如果未指定关键词参数，尝试自动检测
            if keyword_param is None:
                keyword_param = URLParserService._detect_keyword_param(params)

            if not keyword_param or keyword_param not in params:
                return {
                    "success": False,
                    "error": f"未找到关键词参数: {keyword_param}"
                }

            # 生成参数映射配置
            params_mapping = URLParserService._generate_params_mapping(
                params, keyword_param
            )

            # 生成URL模板
            template_params = params.copy()
            template_params[keyword_param] = "{keyword}"

            query_string = urlencode(template_params, doseq=True)
            url_template = f"{parsed_result['path_url']}?{query_string}"

            return {
                "success": True,
                "url_template": url_template,
                "base_url": parsed_result["base_url"],
                "params_mapping": params_mapping,
                "keyword_param": keyword_param
            }
        except Exception as e:
            logger.error(f"URL模板生成失败: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    def _detect_keyword_param(params: Dict[str, Any]) -> Optional[str]:
        """
        自动检测可能的关键词参数名

        Args:
            params: URL参数字典

        Returns:
            检测到的关键词参数名
        """
        # 常见的搜索参数名模式
        common_patterns = [
            r'.*search.*',
            r'.*query.*',
            r'.*keyword.*',
            r'.*word.*',
            r'.*q$',
            r'.*key.*',
            r'.*term.*'
        ]

        for param_name in params.keys():
            for pattern in common_patterns:
                if re.match(pattern, param_name.lower()):
                    logger.info(f"自动检测到关键词参数: {param_name}")
                    return param_name

        # 如果没有匹配到，返回第一个有实际值的参数
        for param_name, value in params.items():
            if value and str(value).strip():
                logger.warning(f"未找到明确的搜索参数，使用第一个参数: {param_name}")
                return param_name

        return None

    @staticmethod
    def _generate_params_mapping(
        params: Dict[str, Any],
        keyword_param: str
    ) -> Dict[str, Dict[str, Any]]:
        """
        生成参数映射配置

        Args:
            params: URL参数字典
            keyword_param: 关键词参数名

        Returns:
            参数映射配置字典
        """
        params_mapping = {}

        for param_name, param_value in params.items():
            is_keyword = param_name == keyword_param

            params_mapping[param_name] = {
                "param_name": param_name,
                "param_type": "query",
                "required": is_keyword,
                "description": "搜索关键词" if is_keyword else f"固定参数: {param_name}",
            }

            # 非关键词参数设置默认值
            if not is_keyword:
                params_mapping[param_name]["default_value"] = str(param_value)

        return params_mapping

    @staticmethod
    def build_url_from_template(
        template: str,
        keyword: str,
        params_mapping: Dict[str, Dict[str, Any]] = None
    ) -> str:
        """
        从模板构建实际URL

        Args:
            template: URL模板
            keyword: 搜索关键词
            params_mapping: 参数映射配置（可选）

        Returns:
            构建好的URL
        """
        try:
            # 简单替换占位符
            url = template.replace("{keyword}", keyword)

            # 如果有参数映射，应用默认值
            if params_mapping:
                parsed = urlparse(url)
                query_params = parse_qs(parsed.query)

                for param_name, config in params_mapping.items():
                    if "default_value" in config and param_name not in query_params:
                        query_params[param_name] = [config["default_value"]]

                # 重新构建URL
                query_string = urlencode(query_params, doseq=True)
                url = urlunparse((
                    parsed.scheme,
                    parsed.netloc,
                    parsed.path,
                    '',
                    query_string,
                    ''
                ))

            return url
        except Exception as e:
            logger.error(f"URL构建失败: {str(e)}")
            return template.replace("{keyword}", keyword)

    @staticmethod
    def extract_domain_info(url: str) -> Dict[str, str]:
        """
        提取域名信息，用于工具命名

        Args:
            url: URL字符串

        Returns:
            包含域名信息的字典
        """
        try:
            parsed = urlparse(url)
            netloc_parts = parsed.netloc.split('.')

            # 提取主域名（去掉www和子域名）
            if len(netloc_parts) >= 2:
                main_domain = '.'.join(netloc_parts[-2:])
                domain_name = netloc_parts[-2]
            else:
                main_domain = parsed.netloc
                domain_name = parsed.netloc

            return {
                "full_domain": parsed.netloc,
                "main_domain": main_domain,
                "domain_name": domain_name,
                "scheme": parsed.scheme
            }
        except Exception as e:
            logger.error(f"域名信息提取失败: {str(e)}")
            return {
                "full_domain": "",
                "main_domain": "",
                "domain_name": "未知网站",
                "scheme": "https"
            }

    @staticmethod
    def suggest_tool_config(url: str, keyword_param: str = None) -> Dict[str, Any]:
        """
        基于URL智能推荐工具配置

        Args:
            url: 原始URL
            keyword_param: 关键词参数名（可选）

        Returns:
            推荐的工具配置
        """
        try:
            # 生成URL模板
            template_result = URLParserService.generate_url_template(url, keyword_param)
            if not template_result["success"]:
                return template_result

            # 提取域名信息
            domain_info = URLParserService.extract_domain_info(url)

            # 推荐工具名称
            suggested_name = f"{domain_info['domain_name']}搜索工具"

            # 推荐选择器配置（通用配置）
            selector_config = {
                "result_container": ".search-results, .result-list, #results",
                "item_selector": ".result-item, .search-item, .item",
                "title_selector": ".title, .result-title, h3, h2",
                "link_selector": "a, .link, .result-link",
                "content_selector": ".content, .description, .summary, p",
                "date_selector": ".date, .time, .publish-date"
            }

            # 推荐解析配置
            parse_config = {
                "extract_full_content": True,
                "follow_links": False,
                "max_results": 20,
                "encoding": "utf-8",
                "timeout": 30
            }

            return {
                "success": True,
                "suggested_name": suggested_name,
                "description": f"从{domain_info['full_domain']}搜索内容",
                "base_url": template_result["base_url"],
                "url_template": template_result["url_template"],
                "method": "GET",
                "params_mapping": template_result["params_mapping"],
                "selector_config": selector_config,
                "parse_config": parse_config,
                "domain_info": domain_info
            }
        except Exception as e:
            logger.error(f"工具配置推荐失败: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


# 创建服务单例
url_parser_service = URLParserService()
