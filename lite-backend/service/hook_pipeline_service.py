"""
Hook Pipeline服务

提供Pipeline的加载、管理和执行日志记录功能
"""

import os
import yaml
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime
from uuid import UUID

from service.hooks import HookPipeline, HookExecutionResult
from service.hooks.registry import hook_registry
from core.config_optimized import optimized_config_manager

logger = logging.getLogger(__name__)


class HookPipelineService:
    """Hook Pipeline服务"""

    def __init__(self):
        self.db_config = optimized_config_manager.settings.database_postgresql
        self.pool = None
        self._pipeline_cache: Dict[str, HookPipeline] = {}
        self._cache_enabled = True

    async def initialize(self):
        """初始化服务"""
        if not self.pool:
            import asyncpg
            self.pool = await asyncpg.create_pool(
                host=self.db_config.host,
                port=self.db_config.port,
                user=self.db_config.username,
                password=self.db_config.password,
                database=self.db_config.database,
                min_size=2,
                max_size=10
            )
            logger.info("HookPipelineService initialized")

    async def close(self):
        """关闭服务"""
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def load_pipeline_from_db(
        self,
        pipeline_id: str,
        use_cache: bool = True
    ) -> Optional[HookPipeline]:
        """从数据库加载Pipeline

        Args:
            pipeline_id: Pipeline ID或name
            use_cache: 是否使用缓存

        Returns:
            HookPipeline实例或None
        """
        # 检查缓存
        if use_cache and self._cache_enabled and pipeline_id in self._pipeline_cache:
            logger.debug(f"从缓存加载Pipeline: {pipeline_id}")
            return self._pipeline_cache[pipeline_id]

        await self.initialize()

        try:
            # 尝试按ID查询
            query = """
                SELECT id, pipeline_name, description, scenario,
                       pre_hooks_config, post_hooks_config, routing_rules,
                       is_active
                FROM hook_pipelines
                WHERE (id = $1::uuid OR pipeline_name = $1)
                  AND is_active = true
                LIMIT 1
            """

            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(query, pipeline_id)

                if not row:
                    logger.warning(f"Pipeline未找到: {pipeline_id}")
                    return None

                # 解析配置
                pipeline = self._create_pipeline_from_row(row)

                # 缓存
                if self._cache_enabled:
                    self._pipeline_cache[pipeline_id] = pipeline
                    self._pipeline_cache[row['pipeline_name']] = pipeline

                logger.info(f"从数据库加载Pipeline: {row['pipeline_name']}")
                return pipeline

        except Exception as e:
            logger.error(f"从数据库加载Pipeline失败: {e}")
            return None

    def load_pipeline_from_yaml(
        self,
        yaml_path: str,
        use_cache: bool = True
    ) -> Optional[HookPipeline]:
        """从YAML文件加载Pipeline

        Args:
            yaml_path: YAML文件路径
            use_cache: 是否使用缓存

        Returns:
            HookPipeline实例或None
        """
        # 检查缓存
        if use_cache and self._cache_enabled and yaml_path in self._pipeline_cache:
            logger.debug(f"从缓存加载Pipeline: {yaml_path}")
            return self._pipeline_cache[yaml_path]

        try:
            with open(yaml_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)

            pipeline = self._create_pipeline_from_config(config)

            # 缓存
            if self._cache_enabled:
                self._pipeline_cache[yaml_path] = pipeline
                pipeline_name = config.get('pipeline_name')
                if pipeline_name:
                    self._pipeline_cache[pipeline_name] = pipeline

            logger.info(f"从YAML加载Pipeline: {config.get('pipeline_name')}")
            return pipeline

        except Exception as e:
            logger.error(f"从YAML加载Pipeline失败: {e}")
            return None

    def load_pipeline_from_config(
        self,
        config: Dict[str, Any]
    ) -> Optional[HookPipeline]:
        """从配置字典加载Pipeline

        Args:
            config: Pipeline配置字典

        Returns:
            HookPipeline实例或None
        """
        try:
            return self._create_pipeline_from_config(config)
        except Exception as e:
            logger.error(f"从配置加载Pipeline失败: {e}")
            return None

    def _create_pipeline_from_row(self, row: Dict) -> HookPipeline:
        """从数据库行创建Pipeline

        Args:
            row: 数据库查询结果行

        Returns:
            HookPipeline实例
        """
        config = {
            'pipeline_id': str(row['id']),
            'pipeline_name': row['pipeline_name'],
            'description': row.get('description'),
            'scenario': row.get('scenario'),
            'pre_hooks_config': row.get('pre_hooks_config', []),
            'post_hooks_config': row.get('post_hooks_config', []),
            'routing_rules': row.get('routing_rules', [])
        }

        return self._create_pipeline_from_config(config)

    def _create_pipeline_from_config(self, config: Dict) -> HookPipeline:
        """从配置创建Pipeline

        Args:
            config: Pipeline配置字典

        Returns:
            HookPipeline实例
        """
        pipeline_id = config.get('pipeline_id', config.get('pipeline_name'))
        pipeline_name = config.get('pipeline_name', 'unnamed_pipeline')

        # 处理pre_hooks配置
        pre_hooks_config = self._resolve_hook_classes(
            config.get('pre_hooks', config.get('pre_hooks_config', [])),
            'pre'
        )

        # 处理post_hooks配置
        post_hooks_config = self._resolve_hook_classes(
            config.get('post_hooks', config.get('post_hooks_config', [])),
            'post'
        )

        return HookPipeline(
            pipeline_id=pipeline_id,
            pipeline_name=pipeline_name,
            pre_hook_configs=pre_hooks_config,
            post_hook_configs=post_hooks_config
        )

    def _resolve_hook_classes(
        self,
        hooks_config: List[Dict],
        hook_type: str
    ) -> List[Dict]:
        """解析Hook类引用

        Args:
            hooks_config: Hooks配置列表
            hook_type: Hook类型（'pre' 或 'post'）

        Returns:
            解析后的配置列表
        """
        resolved = []

        for hook_config in hooks_config:
            config_copy = dict(hook_config)

            # 优先使用hook_id查找Hook类
            hook_id = config_copy.get('hook_id') or config_copy.get('class')

            if not hook_id:
                logger.warning(f"Hook配置缺少hook_id或class字段: {hook_config}，跳过")
                continue

            # 从注册中心获取Hook类
            if hook_type == 'pre':
                hook_class = hook_registry.get_pre_hook(hook_id)
            else:
                hook_class = hook_registry.get_post_hook(hook_id)

            if hook_class is None:
                logger.warning(f"Hook未找到: {hook_id} (type: {hook_type})，跳过")
                continue

            # 更新class字段为实际的Hook类
            config_copy['class'] = hook_class

            # 确保有config字段
            if 'config' not in config_copy:
                config_copy['config'] = {}

            resolved.append(config_copy)

        return resolved

    async def log_execution(
        self,
        pipeline_id: str,
        agent_id: Optional[str],
        user_id: Optional[str],
        results: List[HookExecutionResult]
    ) -> None:
        """记录Pipeline执行日志

        Args:
            pipeline_id: Pipeline ID
            agent_id: Agent ID
            user_id: 用户ID
            results: 执行结果列表
        """
        await self.initialize()

        try:
            async with self.pool.acquire() as conn:
                for idx, result in enumerate(results):
                    await conn.execute(
                        """
                        INSERT INTO hook_execution_logs (
                            pipeline_id, agent_id, user_id,
                            hook_id, hook_type, execution_order,
                            input_snapshot, output_snapshot,
                            status, error_message, execution_time_ms,
                            routing_decision, executed_at
                        ) VALUES (
                            $1::uuid, $2, $3::uuid,
                            $4, $5, $6,
                            $7, $8,
                            $9, $10, $11,
                            $12, $13
                        )
                        """,
                        UUID(pipeline_id) if pipeline_id else None,
                        agent_id,
                        UUID(user_id) if user_id else None,
                        result.hook_id,
                        result.hook_type.value,
                        idx,
                        result.input_snapshot,
                        result.output_snapshot,
                        result.status.value,
                        result.error_message,
                        result.execution_time_ms,
                        result.routing_decision,
                        datetime.utcnow()
                    )

            logger.debug(f"记录了{len(results)}条Hook执行日志")

        except Exception as e:
            logger.error(f"记录执行日志失败: {e}")

    async def get_execution_logs(
        self,
        pipeline_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict]:
        """获取执行日志

        Args:
            pipeline_id: Pipeline ID（可选）
            agent_id: Agent ID（可选）
            user_id: 用户ID（可选）
            limit: 限制数量
            offset: 偏移量

        Returns:
            日志列表
        """
        await self.initialize()

        try:
            conditions = []
            params = []
            param_count = 0

            if pipeline_id:
                param_count += 1
                conditions.append(f"pipeline_id = ${param_count}::uuid")
                params.append(UUID(pipeline_id))

            if agent_id:
                param_count += 1
                conditions.append(f"agent_id = ${param_count}")
                params.append(agent_id)

            if user_id:
                param_count += 1
                conditions.append(f"user_id = ${param_count}::uuid")
                params.append(UUID(user_id))

            where_clause = " AND ".join(conditions) if conditions else "1=1"

            param_count += 1
            limit_param = param_count
            param_count += 1
            offset_param = param_count
            params.extend([limit, offset])

            query = f"""
                SELECT id, pipeline_id, agent_id, user_id,
                       hook_id, hook_type, execution_order,
                       input_snapshot, output_snapshot,
                       status, error_message, execution_time_ms,
                       routing_decision, executed_at
                FROM hook_execution_logs
                WHERE {where_clause}
                ORDER BY executed_at DESC
                LIMIT ${limit_param} OFFSET ${offset_param}
            """

            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query, *params)
                return [dict(row) for row in rows]

        except Exception as e:
            logger.error(f"获取执行日志失败: {e}")
            return []

    async def list_pipelines(
        self,
        scenario: Optional[str] = None,
        is_active: bool = True
    ) -> List[Dict]:
        """列出所有Pipeline

        Args:
            scenario: 场景过滤（可选）
            is_active: 是否只列出活动的Pipeline

        Returns:
            Pipeline列表
        """
        await self.initialize()

        try:
            conditions = ["is_active = $1"] if is_active else []
            params = [is_active] if is_active else []
            param_count = len(params)

            if scenario:
                param_count += 1
                conditions.append(f"scenario = ${param_count}")
                params.append(scenario)

            where_clause = " AND ".join(conditions) if conditions else "1=1"

            query = f"""
                SELECT id, pipeline_name, description, scenario, is_active,
                       created_at, updated_at
                FROM hook_pipelines
                WHERE {where_clause}
                ORDER BY created_at DESC
            """

            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query, *params)
                return [dict(row) for row in rows]

        except Exception as e:
            logger.error(f"列出Pipeline失败: {e}")
            return []

    def clear_cache(self):
        """清空Pipeline缓存"""
        self._pipeline_cache.clear()
        logger.info("Pipeline缓存已清空")

    def get_cache_info(self) -> Dict:
        """获取缓存信息

        Returns:
            缓存统计信息
        """
        return {
            'cache_enabled': self._cache_enabled,
            'cached_pipelines': len(self._pipeline_cache),
            'pipeline_ids': list(self._pipeline_cache.keys())
        }


# 全局单例
_hook_pipeline_service: Optional[HookPipelineService] = None


def get_hook_pipeline_service() -> HookPipelineService:
    """获取HookPipelineService单例

    Returns:
        HookPipelineService实例
    """
    global _hook_pipeline_service
    if _hook_pipeline_service is None:
        _hook_pipeline_service = HookPipelineService()
    return _hook_pipeline_service


async def load_pipeline(
    pipeline_id: str,
    source: str = 'auto'
) -> Optional[HookPipeline]:
    """加载Pipeline（便捷函数）

    Args:
        pipeline_id: Pipeline ID、名称或YAML路径
        source: 数据源（'auto', 'db', 'yaml', 'config'）

    Returns:
        HookPipeline实例或None
    """
    service = get_hook_pipeline_service()

    # 自动判断来源
    if source == 'auto':
        # 如果是文件路径
        if os.path.isfile(pipeline_id):
            source = 'yaml'
        # 如果是UUID格式
        elif len(pipeline_id) == 36 and pipeline_id.count('-') == 4:
            source = 'db'
        # 否则尝试数据库
        else:
            source = 'db'

    # 根据来源加载
    if source == 'db':
        return await service.load_pipeline_from_db(pipeline_id)
    elif source == 'yaml':
        return service.load_pipeline_from_yaml(pipeline_id)
    else:
        logger.warning(f"不支持的数据源: {source}")
        return None


async def load_default_pipeline() -> Optional[HookPipeline]:
    """加载默认Pipeline

    Returns:
        HookPipeline实例或None
    """
    # 优先尝试从数据库加载
    pipeline = await load_pipeline('default_retrieval_pipeline', source='db')

    if pipeline:
        return pipeline

    # 回退到YAML配置文件
    yaml_path = os.path.join(
        os.path.dirname(__file__),
        '../config/hook_pipelines/default_retrieval_pipeline.yaml'
    )

    if os.path.isfile(yaml_path):
        return await load_pipeline(yaml_path, source='yaml')

    logger.error("无法加载默认Pipeline")
    return None
