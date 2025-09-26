"""
爬虫任务数据库操作服务
Crawl Task Database Service
"""

import asyncio
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from core.config_optimized import optimized_config_manager

logger = logging.getLogger(__name__)


class CrawlTaskDatabase:
    """爬虫任务数据库操作类"""
    
    def __init__(self):
        self.db_config = optimized_config_manager.settings.database_postgresql
        try:
            self._ensure_tables()
        except Exception as e:
            logger.warning(f"初始化爬虫任务表失败（将在首次写入时重试）: {e}")
    
    def get_connection(self):
        """获取数据库连接"""
        return psycopg2.connect(
            host=self.db_config.host,
            port=self.db_config.port,
            database=self.db_config.database,
            user=self.db_config.username,
            password=self.db_config.password,
            cursor_factory=RealDictCursor
        )

    def _ensure_tables(self):
        """确保任务与结果表存在（幂等）"""
        conn = None
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS crawl_tasks (
                    task_id VARCHAR(64) PRIMARY KEY,
                    urls JSONB NOT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'pending',
                    engine VARCHAR(32) NOT NULL DEFAULT 'deepscrape',
                    options JSONB,
                    total_urls INTEGER NOT NULL DEFAULT 0,
                    successful_count INTEGER NOT NULL DEFAULT 0,
                    failed_count INTEGER NOT NULL DEFAULT 0,
                    progress INTEGER NOT NULL DEFAULT 0,
                    error_message TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    started_at TIMESTAMPTZ,
                    completed_at TIMESTAMPTZ
                );
                """)
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS crawl_results (
                    id SERIAL PRIMARY KEY,
                    task_id VARCHAR(64) REFERENCES crawl_tasks(task_id) ON DELETE CASCADE,
                    url TEXT,
                    status VARCHAR(32),
                    title TEXT,
                    content TEXT,
                    summary TEXT,
                    extracted_metadata JSONB,
                    document_id VARCHAR(64),
                    file_path TEXT,
                    success BOOLEAN DEFAULT TRUE,
                    error_message TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """)
            conn.commit()
        finally:
            if conn:
                conn.close()

    def _get_column_type(self, table: str, column: str) -> Optional[str]:
        """读取列的数据类型（例如 jsonb, ARRAY, text 等）。"""
        conn = None
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT data_type, udt_name
                    FROM information_schema.columns
                    WHERE table_name=%s AND column_name=%s
                    LIMIT 1
                    """,
                    (table, column)
                )
                row = cursor.fetchone()
                if not row:
                    return None
                data_type, udt_name = row
                # ARRAY 类型 data_type='ARRAY'，udt_name 可能为 '_text'
                if str(data_type).lower() == 'array':
                    return 'array'
                return str(data_type).lower()
        except Exception:
            return None
        finally:
            if conn:
                conn.close()
    
    async def create_task(self, task_id: str, urls: List[str], engine: str = "deepscrape", 
                         options: Dict = None) -> bool:
        """创建新任务"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                col_type = self._get_column_type('crawl_tasks', 'urls')
                urls_value = None
                if col_type == 'jsonb':
                    urls_value = json.dumps(urls or [])
                else:
                    # 退化为数组（例如 text[]），直接传 list 由 psycopg2 适配
                    urls_value = urls or []

                cursor.execute("""
                    INSERT INTO crawl_tasks (task_id, urls, status, engine, options, total_urls)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    task_id, 
                    urls_value,
                    'pending',
                    engine,
                    json.dumps(options or {}),
                    len(urls or [])
                ))
            conn.commit()
            conn.close()
            logger.info(f"创建爬虫任务成功: {task_id}")
            return True
        except Exception as e:
            logger.error(f"创建爬虫任务失败: {task_id}, 错误: {e}")
            if conn:
                conn.close()
            return False
    
    async def update_task_status(self, task_id: str, status: str, **kwargs) -> bool:
        """更新任务状态"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                # 构建更新字段
                update_fields = ["status = %s"]
                params = [status]
                
                if 'progress' in kwargs:
                    update_fields.append("progress = %s")
                    params.append(kwargs['progress'])
                
                if 'successful_count' in kwargs:
                    update_fields.append("successful_count = %s")
                    params.append(kwargs['successful_count'])
                
                if 'failed_count' in kwargs:
                    update_fields.append("failed_count = %s")
                    params.append(kwargs['failed_count'])
                
                if 'error_message' in kwargs:
                    update_fields.append("error_message = %s")
                    params.append(kwargs['error_message'])
                
                if status == 'running' and 'started_at' not in kwargs:
                    update_fields.append("started_at = CURRENT_TIMESTAMP")
                elif status in ['completed', 'failed', 'cancelled']:
                    update_fields.append("completed_at = CURRENT_TIMESTAMP")
                
                params.append(task_id)
                
                query = f"""
                    UPDATE crawl_tasks 
                    SET {', '.join(update_fields)}
                    WHERE task_id = %s
                """
                
                cursor.execute(query, params)
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"更新任务状态失败: {task_id}, 错误: {e}")
            if conn:
                conn.close()
            return False
    
    async def add_result(self, task_id: str, url: str, success: bool = True, 
                        title: str = None, content: str = None, summary: str = None,
                        metadata: Dict = None, error_message: str = None,
                        document_id: str = None, file_path: str = None) -> bool:
        """添加爬取结果"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO crawl_results (
                        task_id, url, status, title, content, summary, 
                        extracted_metadata, document_id, file_path, 
                        success, error_message
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    task_id,
                    url,
                    'success' if success else 'failed',
                    title,
                    content,
                    summary,
                    json.dumps(metadata or {}),
                    document_id,
                    file_path,
                    success,
                    error_message
                ))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"添加爬取结果失败: {task_id}, URL: {url}, 错误: {e}")
            if conn:
                conn.close()
            return False
    
    async def get_task(self, task_id: str) -> Optional[Dict]:
        """获取任务详情"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM crawl_tasks WHERE task_id = %s
                """, (task_id,))
                task = cursor.fetchone()
            conn.close()
            
            if task:
                return dict(task)
            return None
        except Exception as e:
            logger.error(f"获取任务详情失败: {task_id}, 错误: {e}")
            return None
    
    async def get_task_results(self, task_id: str) -> List[Dict]:
        """获取任务的所有爬取结果"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM crawl_results 
                    WHERE task_id = %s 
                    ORDER BY created_at DESC
                """, (task_id,))
                results = cursor.fetchall()
            conn.close()
            
            return [dict(result) for result in results]
        except Exception as e:
            logger.error(f"获取任务结果失败: {task_id}, 错误: {e}")
            return []
    
    async def list_tasks(self, page: int = 1, size: int = 10, status: str = None) -> Dict:
        """获取任务列表"""
        try:
            offset = (page - 1) * size
            
            # 构建查询条件
            where_clause = ""
            count_params = []
            list_params = []
            
            if status:
                where_clause = "WHERE status = %s"
                count_params.append(status)
                list_params.append(status)
            
            conn = self.get_connection()
            with conn.cursor() as cursor:
                # 获取总数（为兼容 RealDictCursor，使用别名）
                count_query = f"SELECT COUNT(*) AS total FROM crawl_tasks {where_clause}"
                cursor.execute(count_query, count_params)
                row = cursor.fetchone()
                total = (row['total'] if isinstance(row, dict) and 'total' in row else (row[0] if row else 0))
                
                # 获取任务列表
                list_query = f"""
                    SELECT * FROM crawl_tasks {where_clause}
                    ORDER BY created_at DESC 
                    LIMIT %s OFFSET %s
                """
                list_params.extend([size, offset])
                cursor.execute(list_query, list_params)
                tasks = cursor.fetchall()
            
            conn.close()
            
            return {
                'tasks': [dict(task) for task in tasks],
                'total': total,
                'page': page,
                'size': size
            }
        except Exception as e:
            logger.error(f"获取任务列表失败, 错误: {e}")
            return {'tasks': [], 'total': 0, 'page': page, 'size': size}
    
    async def delete_task(self, task_id: str) -> bool:
        """删除任务及其结果"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                # 删除任务（CASCADE会自动删除相关结果）
                cursor.execute("DELETE FROM crawl_tasks WHERE task_id = %s", (task_id,))
            conn.commit()
            conn.close()
            logger.info(f"删除爬虫任务成功: {task_id}")
            return True
        except Exception as e:
            logger.error(f"删除爬虫任务失败: {task_id}, 错误: {e}")
            if conn:
                conn.close()
            return False
    
    async def get_task_with_results(self, task_id: str) -> Optional[Dict]:
        """获取任务及其所有结果"""
        task = await self.get_task(task_id)
        if task:
            results = await self.get_task_results(task_id)
            task['results'] = results
            return task
        return None


# 全局实例
crawl_task_db = CrawlTaskDatabase()
