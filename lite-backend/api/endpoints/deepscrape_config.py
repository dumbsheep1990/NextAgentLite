"""
DeepScrape配置管理API
提供DeepScrape爬虫服务配置的CRUD操作
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/deepscrape-config", tags=["DeepScrape配置"])

# ==================== Pydantic Models ====================

class LLMConfig(BaseModel):
    """LLM配置"""
    enabled: bool = False
    provider: str = Field(default="openai")  # 允许任意provider名称
    model: str = "gpt-4o"
    temperature: float = Field(default=0.2, ge=0, le=2)
    maxTokens: int = Field(default=4000, alias="max_tokens")
    timeout: int = Field(default=120000)
    maxRetries: int = Field(default=3, alias="max_retries")
    extractionType: str = Field(default="summary", pattern="^(structured|summary|qa)$", alias="extraction_type")
    promptFormat: str = Field(default="zero-shot", pattern="^(zero-shot|few-shot)$", alias="prompt_format")

    class Config:
        populate_by_name = True


class CleaningConfig(BaseModel):
    """内容清洗配置"""
    removeAds: bool = Field(default=True, alias="remove_ads")
    removeTracking: bool = Field(default=True, alias="remove_tracking")
    removeScripts: bool = Field(default=True, alias="remove_scripts")
    removeHiddenElements: bool = Field(default=True, alias="remove_hidden_elements")
    removeSocialButtons: bool = Field(default=True, alias="remove_social_buttons")
    removeComments: bool = Field(default=True, alias="remove_comments")
    removePopups: bool = Field(default=True, alias="remove_popups")

    class Config:
        populate_by_name = True


class ScrapingConfig(BaseModel):
    """爬取配置"""
    timeout: int = Field(default=30000)
    blockAds: bool = Field(default=True, alias="block_ads")
    blockResources: bool = Field(default=True, alias="block_resources")
    userAgent: str = Field(default="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", alias="user_agent")
    javascript: bool = Field(default=True)
    fullPage: bool = Field(default=False, alias="full_page")
    extractorFormat: str = Field(default="markdown", pattern="^(html|markdown|text)$", alias="extractor_format")

    class Config:
        populate_by_name = True


class BatchConfig(BaseModel):
    """批处理配置"""
    enabled: bool = Field(default=True)
    concurrency: int = Field(default=3, ge=1, le=20)
    maxConcurrentJobs: int = Field(default=5, ge=1, le=50, alias="max_concurrent_jobs")

    class Config:
        populate_by_name = True


class DeepScrapeConfigRequest(BaseModel):
    """DeepScrape配置请求"""
    configName: Optional[str] = Field(default="default", max_length=200, alias="config_name")
    llm: LLMConfig
    cleaning: CleaningConfig
    scraping: ScrapingConfig
    batch: BatchConfig
    extendedConfig: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="extended_config")
    isDefault: bool = Field(default=True, alias="is_default")

    class Config:
        populate_by_name = True


class DeepScrapeConfigResponse(BaseModel):
    """DeepScrape配置响应"""
    id: str
    userId: int = Field(alias="user_id")
    configName: str = Field(alias="config_name")
    llm: LLMConfig
    cleaning: CleaningConfig
    scraping: ScrapingConfig
    batch: BatchConfig
    extendedConfig: Dict[str, Any] = Field(alias="extended_config")
    isDefault: bool = Field(alias="is_default")
    createdAt: datetime = Field(alias="created_at")
    updatedAt: datetime = Field(alias="updated_at")

    class Config:
        populate_by_name = True


# ==================== Dependency ====================

def get_current_user_id() -> int:
    """获取当前用户ID (简化版本,实际应从JWT token或session中获取)"""
    # TODO: 从认证系统获取真实用户ID
    return 6  # 临时返回固定用户ID (admin用户)


# ==================== API Endpoints ====================

@router.post("/save", response_model=DeepScrapeConfigResponse, response_model_by_alias=False)
async def save_deepscrape_config(
    config: DeepScrapeConfigRequest,
    user_id: int = Depends(get_current_user_id)
):
    """
    保存DeepScrape配置
    如果is_default=True，会将用户的其他配置设为非默认
    """
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg

        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(
            host=db.host,
            port=db.port,
            user=db.username,
            password=db.password,
            database=db.database
        )

        try:
            # 如果设置为默认配置，先将用户的其他配置设为非默认
            if config.isDefault:
                await conn.execute("""
                    UPDATE deepscrape_configs
                    SET is_default = FALSE
                    WHERE user_id = $1
                """, user_id)

            # 检查是否已存在同名配置
            existing = await conn.fetchrow("""
                SELECT id FROM deepscrape_configs
                WHERE user_id = $1 AND config_name = $2
            """, user_id, config.configName)

            if existing:
                # 更新现有配置
                await conn.execute("""
                    UPDATE deepscrape_configs SET
                        llm_enabled = $3,
                        llm_provider = $4,
                        llm_model = $5,
                        llm_temperature = $6,
                        llm_max_tokens = $7,
                        llm_timeout = $8,
                        llm_max_retries = $9,
                        llm_extraction_type = $10,
                        llm_prompt_format = $11,
                        cleaning_remove_ads = $12,
                        cleaning_remove_tracking = $13,
                        cleaning_remove_scripts = $14,
                        cleaning_remove_hidden_elements = $15,
                        cleaning_remove_social_buttons = $16,
                        cleaning_remove_comments = $17,
                        cleaning_remove_popups = $18,
                        scraping_timeout = $19,
                        scraping_block_ads = $20,
                        scraping_block_resources = $21,
                        scraping_user_agent = $22,
                        scraping_javascript = $23,
                        scraping_full_page = $24,
                        scraping_extractor_format = $25,
                        batch_enabled = $26,
                        batch_concurrency = $27,
                        batch_max_concurrent_jobs = $28,
                        extended_config = $29,
                        is_default = $30
                    WHERE user_id = $1 AND config_name = $2
                """,
                    user_id, config.configName,
                    config.llm.enabled, config.llm.provider, config.llm.model,
                    config.llm.temperature, config.llm.maxTokens, config.llm.timeout,
                    config.llm.maxRetries, config.llm.extractionType, config.llm.promptFormat,
                    config.cleaning.removeAds, config.cleaning.removeTracking,
                    config.cleaning.removeScripts, config.cleaning.removeHiddenElements,
                    config.cleaning.removeSocialButtons, config.cleaning.removeComments,
                    config.cleaning.removePopups,
                    config.scraping.timeout, config.scraping.blockAds,
                    config.scraping.blockResources, config.scraping.userAgent,
                    config.scraping.javascript, config.scraping.fullPage,
                    config.scraping.extractorFormat,
                    config.batch.enabled, config.batch.concurrency,
                    config.batch.maxConcurrentJobs,
                    json.dumps(config.extendedConfig or {}),
                    config.isDefault
                )
                config_id = existing['id']
            else:
                # 插入新配置
                config_id = await conn.fetchval("""
                    INSERT INTO deepscrape_configs (
                        user_id, config_name,
                        llm_enabled, llm_provider, llm_model, llm_temperature,
                        llm_max_tokens, llm_timeout, llm_max_retries,
                        llm_extraction_type, llm_prompt_format,
                        cleaning_remove_ads, cleaning_remove_tracking,
                        cleaning_remove_scripts, cleaning_remove_hidden_elements,
                        cleaning_remove_social_buttons, cleaning_remove_comments,
                        cleaning_remove_popups,
                        scraping_timeout, scraping_block_ads, scraping_block_resources,
                        scraping_user_agent, scraping_javascript, scraping_full_page,
                        scraping_extractor_format,
                        batch_enabled, batch_concurrency, batch_max_concurrent_jobs,
                        extended_config, is_default
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                        $12, $13, $14, $15, $16, $17, $18,
                        $19, $20, $21, $22, $23, $24, $25,
                        $26, $27, $28, $29, $30
                    ) RETURNING id
                """,
                    user_id, config.configName,
                    config.llm.enabled, config.llm.provider, config.llm.model,
                    config.llm.temperature, config.llm.maxTokens, config.llm.timeout,
                    config.llm.maxRetries, config.llm.extractionType, config.llm.promptFormat,
                    config.cleaning.removeAds, config.cleaning.removeTracking,
                    config.cleaning.removeScripts, config.cleaning.removeHiddenElements,
                    config.cleaning.removeSocialButtons, config.cleaning.removeComments,
                    config.cleaning.removePopups,
                    config.scraping.timeout, config.scraping.blockAds,
                    config.scraping.blockResources, config.scraping.userAgent,
                    config.scraping.javascript, config.scraping.fullPage,
                    config.scraping.extractorFormat,
                    config.batch.enabled, config.batch.concurrency,
                    config.batch.maxConcurrentJobs,
                    json.dumps(config.extendedConfig or {}),
                    config.isDefault
                )

            # 获取保存的配置
            row = await conn.fetchrow("""
                SELECT * FROM deepscrape_configs WHERE id = $1
            """, config_id)

            return _map_row_to_response(row)

        finally:
            await conn.close()

    except Exception as e:
        logger.error(f"保存DeepScrape配置失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"保存配置失败: {str(e)}")


@router.get("/get", response_model=DeepScrapeConfigResponse, response_model_by_alias=False)
async def get_deepscrape_config(
    config_name: Optional[str] = "default",
    user_id: int = Depends(get_current_user_id)
):
    """获取DeepScrape配置（默认返回用户的默认配置）"""
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg

        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(
            host=db.host,
            port=db.port,
            user=db.username,
            password=db.password,
            database=db.database
        )

        try:
            # 优先查找指定配置名称或默认配置
            if config_name:
                row = await conn.fetchrow("""
                    SELECT * FROM deepscrape_configs
                    WHERE user_id = $1 AND config_name = $2
                """, user_id, config_name)
            else:
                row = await conn.fetchrow("""
                    SELECT * FROM deepscrape_configs
                    WHERE user_id = $1 AND is_default = TRUE
                    ORDER BY updated_at DESC LIMIT 1
                """, user_id)

            if not row:
                # 如果没有配置,返回默认配置
                return _create_default_response(user_id)

            return _map_row_to_response(row)

        finally:
            await conn.close()

    except Exception as e:
        logger.error(f"获取DeepScrape配置失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取配置失败: {str(e)}")


@router.delete("/delete")
async def delete_deepscrape_config(
    config_name: str,
    user_id: int = Depends(get_current_user_id)
):
    """删除DeepScrape配置"""
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg

        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(
            host=db.host,
            port=db.port,
            user=db.username,
            password=db.password,
            database=db.database
        )

        try:
            result = await conn.execute("""
                DELETE FROM deepscrape_configs
                WHERE user_id = $1 AND config_name = $2
            """, user_id, config_name)

            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="配置不存在")

            return {"success": True, "message": "配置已删除"}

        finally:
            await conn.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除DeepScrape配置失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"删除配置失败: {str(e)}")


# ==================== Helper Functions ====================

def _map_row_to_response(row) -> DeepScrapeConfigResponse:
    """将数据库行映射为响应对象"""
    # 使用字段名（camelCase）构造对象，确保前端能正确读取
    return DeepScrapeConfigResponse(
        id=str(row['id']),
        user_id=row['user_id'],
        config_name=row['config_name'],
        llm=LLMConfig(
            enabled=row['llm_enabled'],
            provider=row['llm_provider'],
            model=row['llm_model'],
            temperature=float(row['llm_temperature']),
            maxTokens=row['llm_max_tokens'],  # 使用字段名
            timeout=row['llm_timeout'],
            maxRetries=row['llm_max_retries'],  # 使用字段名
            extractionType=row['llm_extraction_type'],  # 使用字段名
            promptFormat=row['llm_prompt_format']  # 使用字段名
        ),
        cleaning=CleaningConfig(
            removeAds=row['cleaning_remove_ads'],  # 使用字段名
            removeTracking=row['cleaning_remove_tracking'],  # 使用字段名
            removeScripts=row['cleaning_remove_scripts'],  # 使用字段名
            removeHiddenElements=row['cleaning_remove_hidden_elements'],  # 使用字段名
            removeSocialButtons=row['cleaning_remove_social_buttons'],  # 使用字段名
            removeComments=row['cleaning_remove_comments'],  # 使用字段名
            removePopups=row['cleaning_remove_popups']  # 使用字段名
        ),
        scraping=ScrapingConfig(
            timeout=row['scraping_timeout'],
            blockAds=row['scraping_block_ads'],  # 使用字段名
            blockResources=row['scraping_block_resources'],  # 使用字段名
            userAgent=row['scraping_user_agent'],  # 使用字段名
            javascript=row['scraping_javascript'],
            fullPage=row['scraping_full_page'],  # 使用字段名
            extractorFormat=row['scraping_extractor_format']  # 使用字段名
        ),
        batch=BatchConfig(
            enabled=row['batch_enabled'],
            concurrency=row['batch_concurrency'],
            maxConcurrentJobs=row['batch_max_concurrent_jobs']  # 使用字段名
        ),
        extended_config=json.loads(row['extended_config']) if row['extended_config'] else {},
        is_default=row['is_default'],
        created_at=row['created_at'],
        updated_at=row['updated_at']
    )


def _create_default_response(user_id: int) -> DeepScrapeConfigResponse:
    """创建默认配置响应"""
    from uuid import uuid4
    return DeepScrapeConfigResponse(
        id=str(uuid4()),
        user_id=user_id,
        config_name="default",
        llm=LLMConfig(),
        cleaning=CleaningConfig(),
        scraping=ScrapingConfig(),
        batch=BatchConfig(),
        extended_config={},
        is_default=True,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
