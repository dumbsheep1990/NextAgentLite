"""
自定义工具管理API
支持各类自定义工具的创建、管理、执行和历史查询
当前支持基于URL的网页内容抓取工具
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime
import asyncpg
import json
from core.database import get_db_pool
from service.url_parser_service import url_parser_service
from service.web_crawler_service import web_crawler_service
from service.browser_crawler_service import browser_crawler_service
from service.api_crawler_service import api_crawler_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/custom-tools", tags=["自定义工具"])


# ==================== Helper Functions ====================

def parse_tool_row(row: asyncpg.Record) -> Dict[str, Any]:
    """
    解析数据库行，将JSONB字段从字符串转换为字典
    """
    data = dict(row)

    # 解析JSONB字段
    jsonb_fields = ['params_mapping', 'selector_config', 'parse_config', 'headers', 'api_config']
    for field in jsonb_fields:
        if field in data and isinstance(data[field], str):
            try:
                data[field] = json.loads(data[field])
            except (json.JSONDecodeError, TypeError):
                # 如果解析失败，保持原值或设置默认值
                if field == 'headers':
                    data[field] = {}
                elif field == 'parse_config':
                    data[field] = {}

    return data


# ==================== Pydantic Models ====================

class URLAnalyzeRequest(BaseModel):
    """URL分析请求"""
    url: str = Field(..., description="要分析的URL")
    keyword_param: Optional[str] = Field(None, description="关键词参数名（可选，自动检测）")


class SelectorConfig(BaseModel):
    """选择器配置"""
    result_container: str = Field(".search-results", description="结果容器选择器")
    item_selector: str = Field(".result-item", description="结果项选择器")
    title_selector: str = Field(".title", description="标题选择器")
    link_selector: str = Field("a", description="链接选择器")
    content_selector: Optional[str] = Field(".content", description="内容选择器")
    date_selector: Optional[str] = Field(".date", description="日期选择器")


class ParseConfig(BaseModel):
    """解析配置"""
    extract_full_content: bool = Field(True, description="是否提取完整内容")
    follow_links: bool = Field(False, description="是否跟踪链接")
    max_results: int = Field(20, description="最大结果数", ge=1, le=100)
    encoding: str = Field("utf-8", description="页面编码")
    timeout: int = Field(30, description="超时时间（秒）", ge=5, le=120)
    use_js_render: bool = Field(False, description="是否使用JavaScript渲染（Playwright）")
    wait_time: int = Field(3000, description="JS渲染等待时间（毫秒）", ge=1000, le=10000)


class CreateToolRequest(BaseModel):
    """创建工具请求"""
    name: str = Field(..., description="工具名称", min_length=1, max_length=255)
    description: Optional[str] = Field(None, description="工具描述")
    base_url: str = Field(..., description="基础URL")
    url_template: str = Field(..., description="URL模板")
    method: str = Field("GET", description="HTTP方法")
    headers: Optional[Dict[str, str]] = Field(default_factory=dict, description="自定义请求头")
    params_mapping: Dict[str, Any] = Field(..., description="参数映射配置")
    selector_config: SelectorConfig = Field(..., description="选择器配置")
    parse_config: Optional[ParseConfig] = Field(default_factory=ParseConfig, description="解析配置")
    enabled: bool = Field(True, description="是否启用")

    @validator('method')
    def validate_method(cls, v):
        if v.upper() not in ['GET', 'POST']:
            raise ValueError('method必须是GET或POST')
        return v.upper()


class UpdateToolRequest(BaseModel):
    """更新工具请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    url_template: Optional[str] = None
    method: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    params_mapping: Optional[Dict[str, Any]] = None
    selector_config: Optional[SelectorConfig] = None
    parse_config: Optional[ParseConfig] = None
    enabled: Optional[bool] = None


class ExecuteToolRequest(BaseModel):
    """执行工具请求"""
    keyword: str = Field(..., description="搜索关键词", min_length=1)
    user_id: Optional[int] = Field(None, description="用户ID")


class ToolResponse(BaseModel):
    """工具响应"""
    id: int
    name: str
    description: Optional[str]
    base_url: str
    url_template: str
    method: str
    enabled: bool
    created_at: datetime
    updated_at: datetime
    params_mapping: Dict[str, Any]
    selector_config: Dict[str, Any]
    parse_config: Dict[str, Any]


class ExecutionResponse(BaseModel):
    """执行响应"""
    id: int
    tool_id: int
    tool_name: str
    query_keyword: str
    execution_status: str
    results_count: int
    results: Optional[List[Dict[str, Any]]]
    execution_time: Optional[float]
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]


# ==================== API Endpoints ====================

@router.post("/analyze-url", summary="分析URL并生成工具配置建议")
async def analyze_url(request: URLAnalyzeRequest):
    """
    智能分析URL，提取参数并生成工具配置建议
    """
    try:
        result = url_parser_service.suggest_tool_config(
            url=request.url,
            keyword_param=request.keyword_param
        )

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "URL分析失败"))

        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"URL分析失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tools", summary="创建自定义工具", response_model=ToolResponse)
async def create_tool(
    request: CreateToolRequest,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    创建新的自定义工具
    """
    try:
        async with pool.acquire() as conn:
            # 检查名称是否已存在
            existing = await conn.fetchval(
                "SELECT id FROM custom_crawler_tools WHERE name = $1",
                request.name
            )
            if existing:
                raise HTTPException(status_code=400, detail=f"工具名称已存在: {request.name}")

            # 插入新工具
            row = await conn.fetchrow("""
                INSERT INTO custom_crawler_tools (
                    name, description, base_url, url_template, method,
                    headers, params_mapping, selector_config, parse_config, enabled
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            """,
                request.name,
                request.description,
                request.base_url,
                request.url_template,
                request.method,
                json.dumps(request.headers),
                json.dumps(request.params_mapping),
                json.dumps(request.selector_config.dict()),
                json.dumps(request.parse_config.dict() if request.parse_config else {}),
                request.enabled
            )

            logger.info(f"成功创建自定义工具: {request.name}, ID: {row['id']}")

            return ToolResponse(**parse_tool_row(row))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建工具失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tools", summary="获取工具列表")
async def get_tools(
    enabled_only: bool = Query(False, description="仅返回启用的工具"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    获取自定义工具列表
    """
    try:
        async with pool.acquire() as conn:
            # 构建查询
            where_clause = "WHERE enabled = true" if enabled_only else ""

            # 获取总数
            total = await conn.fetchval(
                f"SELECT COUNT(*) FROM custom_crawler_tools {where_clause}"
            )

            # 获取工具列表
            rows = await conn.fetch(f"""
                SELECT * FROM custom_crawler_tools
                {where_clause}
                ORDER BY created_at DESC
                LIMIT $1 OFFSET $2
            """, limit, skip)

            tools = [ToolResponse(**parse_tool_row(row)) for row in rows]

            return {
                "success": True,
                "total": total,
                "data": tools
            }

    except Exception as e:
        logger.error(f"获取工具列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tools/{tool_id}", summary="获取工具详情", response_model=ToolResponse)
async def get_tool(
    tool_id: int,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    获取指定工具的详细信息
    """
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM custom_crawler_tools WHERE id = $1",
                tool_id
            )

            if not row:
                raise HTTPException(status_code=404, detail=f"工具不存在: {tool_id}")

            return ToolResponse(**parse_tool_row(row))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取工具详情失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/tools/{tool_id}", summary="更新工具配置", response_model=ToolResponse)
async def update_tool(
    tool_id: int,
    request: UpdateToolRequest,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    更新工具配置
    """
    try:
        async with pool.acquire() as conn:
            # 检查工具是否存在
            existing = await conn.fetchrow(
                "SELECT * FROM custom_crawler_tools WHERE id = $1",
                tool_id
            )
            if not existing:
                raise HTTPException(status_code=404, detail=f"工具不存在: {tool_id}")

            # 构建更新字段
            update_fields = []
            update_values = []
            param_index = 1

            jsonb_fields = ['headers', 'params_mapping', 'selector_config', 'parse_config']

            for field, value in request.dict(exclude_unset=True).items():
                if value is not None:
                    if isinstance(value, BaseModel):
                        value = value.dict()
                    # 对JSONB字段进行JSON序列化
                    if field in jsonb_fields and isinstance(value, dict):
                        value = json.dumps(value)
                    update_fields.append(f"{field} = ${param_index}")
                    update_values.append(value)
                    param_index += 1

            if not update_fields:
                raise HTTPException(status_code=400, detail="没有要更新的字段")

            # 执行更新
            update_values.append(tool_id)
            row = await conn.fetchrow(f"""
                UPDATE custom_crawler_tools
                SET {', '.join(update_fields)}
                WHERE id = ${param_index}
                RETURNING *
            """, *update_values)

            logger.info(f"成功更新工具: ID={tool_id}")

            return ToolResponse(**parse_tool_row(row))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新工具失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tools/{tool_id}", summary="删除工具")
async def delete_tool(
    tool_id: int,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    删除指定工具
    """
    try:
        async with pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM custom_crawler_tools WHERE id = $1",
                tool_id
            )

            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail=f"工具不存在: {tool_id}")

            logger.info(f"成功删除工具: ID={tool_id}")

            return {
                "success": True,
                "message": f"工具已删除: {tool_id}"
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除工具失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tools/{tool_id}/execute", summary="执行工具")
async def execute_tool(
    tool_id: int,
    request: ExecuteToolRequest,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    执行指定工具进行网页爬取
    """
    try:
        async with pool.acquire() as conn:
            # 获取工具配置
            tool_row = await conn.fetchrow(
                "SELECT * FROM custom_crawler_tools WHERE id = $1 AND enabled = true",
                tool_id
            )

            if not tool_row:
                raise HTTPException(status_code=404, detail=f"工具不存在或未启用: {tool_id}")

            # 解析JSONB字段
            tool = parse_tool_row(tool_row)

            # 创建执行记录
            execution_id = await conn.fetchval("""
                INSERT INTO custom_tool_executions (
                    tool_id, user_id, query_keyword, execution_status
                ) VALUES ($1, $2, $3, 'running')
                RETURNING id
            """, tool_id, request.user_id, request.keyword)

            logger.info(f"开始执行工具: tool_id={tool_id}, execution_id={execution_id}, keyword={request.keyword}")

            try:
                # 初始化url变量
                url = ""

                # 检查是否使用API调用方式
                use_api = tool.get('use_api', False)

                if use_api and tool.get('api_config'):
                    # 使用API调用方式
                    logger.info(f"使用API调用方式")
                    api_config = tool['api_config']

                    # 构建API参数
                    params_template = api_config.get('params_template', {})
                    api_params = {}

                    # 替换参数模板中的占位符
                    for key, value in params_template.items():
                        if isinstance(value, str) and '{' in value:
                            # 替换关键词占位符
                            if '{keyword}' in value:
                                api_params[key] = value.replace('{keyword}', request.keyword)
                            # 替换其他参数占位符
                            else:
                                # 从params_mapping中获取默认值
                                param_key = value.strip('{}')
                                if param_key in tool['params_mapping']:
                                    default_val = tool['params_mapping'][param_key].get('default_value', '')
                                    api_params[key] = default_val
                                else:
                                    api_params[key] = value
                        else:
                            api_params[key] = value

                    logger.info(f"API参数: {api_params}")

                    # 调用API
                    api_result = await api_crawler_service.call_search_api(
                        api_url=api_config['api_url'],
                        search_params=api_params,
                        headers=tool.get('headers', {})
                    )

                    if api_result['success']:
                        # 解析API响应
                        api_data = api_result['data']
                        response_path = api_config.get('response_path', {})

                        # 提取结果列表
                        data_field = response_path.get('data_field', 'data.middle.list')
                        data_obj = api_data
                        for key in data_field.split('.'):
                            data_obj = data_obj.get(key, {})

                        results = []
                        if isinstance(data_obj, list):
                            # 字段映射
                            mapping = response_path.get('mapping', {})
                            for item in data_obj:
                                result = {}
                                for target_field, source_field in mapping.items():
                                    result[target_field] = item.get(source_field, '')
                                results.append(result)

                        result = {
                            'success': True,
                            'url': api_config['api_url'],
                            'results_count': len(results),
                            'results': results,
                            'execution_time': api_result['execution_time'],
                            'render_method': 'api'
                        }
                    else:
                        result = api_result

                else:
                    # 使用传统HTML爬取方式
                    # 构建URL
                    url = url_parser_service.build_url_from_template(
                        template=tool['url_template'],
                        keyword=request.keyword,
                        params_mapping=tool['params_mapping']
                    )

                    logger.info(f"构建的URL: {url}")

                    # 根据配置选择爬取方式
                    use_js_render = tool['parse_config'].get('use_js_render', False)

                    if use_js_render:
                        # 使用浏览器渲染（支持JavaScript）
                        logger.info(f"使用Playwright浏览器渲染")
                        wait_time = tool['parse_config'].get('wait_time', 3000)

                        result = await browser_crawler_service.crawl_and_parse_with_js(
                            url=url,
                            selector_config=tool['selector_config'],
                            parse_config=tool['parse_config'],
                            wait_time=wait_time
                        )
                    else:
                        # 使用传统HTTP请求
                        logger.info(f"使用HTTP客户端抓取")
                        result = await web_crawler_service.crawl_and_parse(
                            url=url,
                            selector_config=tool['selector_config'],
                            parse_config=tool['parse_config'],
                            method=tool['method'],
                            headers=tool['headers']
                        )

                if result['success']:
                    # 更新执行记录为成功
                    await conn.execute("""
                        UPDATE custom_tool_executions
                        SET execution_status = 'completed',
                            results_count = $1,
                            results = $2,
                            execution_time = $3,
                            completed_at = CURRENT_TIMESTAMP
                        WHERE id = $4
                    """,
                        result['results_count'],
                        json.dumps(result['results']),
                        result['execution_time'],
                        execution_id
                    )

                    logger.info(f"工具执行成功: execution_id={execution_id}, 结果数={result['results_count']}")

                    return {
                        "success": True,
                        "execution_id": execution_id,
                        "url": result.get('url', url),
                        "results_count": result['results_count'],
                        "results": result['results'],
                        "execution_time": result['execution_time'],
                        "render_method": result.get('render_method', 'http')
                    }
                else:
                    # 更新执行记录为失败
                    await conn.execute("""
                        UPDATE custom_tool_executions
                        SET execution_status = 'failed',
                            error_message = $1,
                            execution_time = $2,
                            completed_at = CURRENT_TIMESTAMP
                        WHERE id = $3
                    """,
                        result.get('error', '未知错误'),
                        result.get('execution_time', 0),
                        execution_id
                    )

                    raise HTTPException(status_code=500, detail=result.get('error', '爬取失败'))

            except Exception as e:
                # 更新执行记录为失败
                await conn.execute("""
                    UPDATE custom_tool_executions
                    SET execution_status = 'failed',
                        error_message = $1,
                        completed_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                """, str(e), execution_id)
                raise

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"执行工具失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/executions", summary="获取执行历史")
async def get_executions(
    tool_id: Optional[int] = Query(None, description="工具ID"),
    user_id: Optional[int] = Query(None, description="用户ID"),
    status: Optional[str] = Query(None, description="执行状态"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    获取工具执行历史记录
    """
    try:
        async with pool.acquire() as conn:
            # 构建WHERE子句
            where_clauses = []
            params = []
            param_index = 1

            if tool_id is not None:
                where_clauses.append(f"e.tool_id = ${param_index}")
                params.append(tool_id)
                param_index += 1

            if user_id is not None:
                where_clauses.append(f"e.user_id = ${param_index}")
                params.append(user_id)
                param_index += 1

            if status:
                where_clauses.append(f"e.execution_status = ${param_index}")
                params.append(status)
                param_index += 1

            where_clause = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

            # 获取总数
            total = await conn.fetchval(
                f"SELECT COUNT(*) FROM custom_tool_executions e {where_clause}",
                *params
            )

            # 获取执行记录
            params.extend([limit, skip])
            rows = await conn.fetch(f"""
                SELECT
                    e.*,
                    t.name as tool_name
                FROM custom_tool_executions e
                JOIN custom_crawler_tools t ON e.tool_id = t.id
                {where_clause}
                ORDER BY e.created_at DESC
                LIMIT ${param_index} OFFSET ${param_index + 1}
            """, *params)

            executions = [dict(row) for row in rows]

            return {
                "success": True,
                "total": total,
                "data": executions
            }

    except Exception as e:
        logger.error(f"获取执行历史失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/executions/{execution_id}", summary="获取执行详情")
async def get_execution(
    execution_id: int,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    获取指定执行记录的详细信息
    """
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT
                    e.*,
                    t.name as tool_name,
                    t.url_template
                FROM custom_tool_executions e
                JOIN custom_crawler_tools t ON e.tool_id = t.id
                WHERE e.id = $1
            """, execution_id)

            if not row:
                raise HTTPException(status_code=404, detail=f"执行记录不存在: {execution_id}")

            return {
                "success": True,
                "data": dict(row)
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取执行详情失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-selector", summary="测试选择器配置")
async def test_selector(
    url: str,
    selector_config: SelectorConfig,
    parse_config: Optional[ParseConfig] = None
):
    """
    测试选择器配置是否能正确提取内容
    """
    try:
        if parse_config is None:
            parse_config = ParseConfig()

        result = await web_crawler_service.crawl_and_parse(
            url=url,
            selector_config=selector_config.dict(),
            parse_config=parse_config.dict(),
            method='GET'
        )

        return {
            "success": result['success'],
            "results_count": result.get('results_count', 0),
            "results": result.get('results', [])[:5],  # 只返回前5条用于测试
            "execution_time": result.get('execution_time', 0),
            "error": result.get('error')
        }

    except Exception as e:
        logger.error(f"选择器测试失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/debug-fetch", summary="调试页面抓取（查看原始HTML）")
async def debug_fetch(url: str, use_js_render: bool = False, wait_time: int = 5000):
    """
    调试功能：抓取页面并返回原始HTML内容的前5000个字符

    Args:
        url: 要抓取的URL
        use_js_render: 是否使用JavaScript渲染
        wait_time: JS渲染等待时间（毫秒）
    """
    try:
        if use_js_render:
            # 使用Playwright浏览器渲染
            result = await browser_crawler_service.fetch_page_with_js(
                url=url,
                wait_time=wait_time
            )
        else:
            # 使用HTTP客户端
            result = await web_crawler_service.fetch_page(url=url)

        if not result['success']:
            raise HTTPException(status_code=500, detail=result['error'])

        html_preview = result['content'][:5000] if result['content'] else ""

        return {
            "success": True,
            "url": result['url'],
            "status_code": result.get('status_code', 200),
            "html_length": len(result['content']),
            "html_preview": html_preview,
            "render_method": "playwright" if use_js_render else "http",
            "message": "已截取前5000字符预览"
        }

    except Exception as e:
        logger.error(f"调试抓取失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
