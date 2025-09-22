"""
统一QA提取服务
直接使用qa_datasets和qa_pairs表，统一手动上传和自动提取的QA数据管理
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from enum import Enum

import psycopg2
from psycopg2.extras import RealDictCursor

from core.config_optimized import optimized_config_manager
from service.qa_generation_service_simplified import QAGenerationServiceSimplified

logger = logging.getLogger(__name__)


class QAExtractionStatus(Enum):
    """QA提取任务状态"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class UnifiedQAExtractionTask:
    """统一QA提取任务"""
    id: str
    document_id: str
    document_title: str
    collection_id: Optional[str] = None
    priority: int = 5
    status: QAExtractionStatus = QAExtractionStatus.PENDING
    extraction_config: Dict[str, Any] = None
    auto_create_dataset: bool = True
    dataset_naming_pattern: Optional[str] = None
    extraction_method: str = "GC-QA-RAG"
    extraction_model: Optional[str] = None
    target_dataset_id: Optional[str] = None
    qa_pairs_extracted: int = 0
    created_at: datetime = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class UnifiedQAExtractionService:
    """统一QA提取服务"""
    
    def __init__(self):
        self.qa_generation_service = QAGenerationServiceSimplified()
        
    def _get_connection(self):
        """获取数据库连接"""
        db_config = optimized_config_manager.settings.database_postgresql
        return psycopg2.connect(
            host=db_config.host,
            port=db_config.port,
            database=db_config.database,
            user=db_config.username,
            password=db_config.password,
            cursor_factory=RealDictCursor
        )
    
    async def submit_extraction_task(
        self,
        document_id: str,
        document_title: str,
        collection_id: Optional[str] = None,
        priority: int = 5,
        extraction_config: Optional[Dict[str, Any]] = None,
        auto_create_dataset: bool = True,
        dataset_naming_pattern: Optional[str] = None,
        extraction_method: str = "GC-QA-RAG",
        extraction_model: Optional[str] = None
    ) -> str:
        """提交QA提取任务"""
        
        task_id = str(uuid.uuid4())
        
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO qa_extraction_queue (
                        id, document_id, status, priority, config,
                        auto_create_dataset, dataset_naming_pattern,
                        extraction_method, extraction_model,
                        created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    task_id,
                    document_id,
                    QAExtractionStatus.PENDING.value,
                    priority,
                    json.dumps(extraction_config) if extraction_config else None,
                    auto_create_dataset,
                    dataset_naming_pattern,
                    extraction_method,
                    extraction_model,
                    datetime.now(),
                    datetime.now()
                ))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ QA提取任务已提交: {task_id} for document: {document_id}")
            
            # 立即开始处理任务
            asyncio.create_task(self._process_extraction_task(task_id))
            
            return task_id
            
        except Exception as e:
            logger.error(f"❌ 提交QA提取任务失败: {e}")
            raise
    
    async def _process_extraction_task(self, task_id: str):
        """处理QA提取任务"""
        start_time = datetime.now()
        
        try:
            # 更新任务状态为处理中
            await self._update_task_status(task_id, QAExtractionStatus.PROCESSING, started_at=start_time)
            
            logger.info(f"🔄 开始处理QA提取任务: {task_id}")
            
            # 获取任务信息
            task_info = await self._get_task_info(task_id)
            if not task_info:
                raise Exception(f"任务不存在: {task_id}")
            
            # 获取文档信息
            document_info = await self._get_document_info(task_info['document_id'])
            if not document_info:
                raise Exception(f"文档不存在: {task_info['document_id']}")
            
            # 创建QA数据集
            dataset_id = await self._create_unified_qa_dataset(task_info, document_info)
            
            # 更新任务的目标数据集ID
            await self._update_task_dataset_id(task_id, dataset_id)
            
            # 执行QA提取 (使用现有的QA生成服务)
            qa_task_id = await self.qa_generation_service.create_qa_task(task_info['document_id'])
            extraction_result = await self.qa_generation_service.process_qa_task(qa_task_id)
            
            if extraction_result.get('success'):
                # 获取生成的QA对并保存到unified表结构
                qa_pairs = await self._get_generated_qa_pairs(qa_task_id)
                saved_count = await self._save_qa_pairs_to_unified_structure(
                    dataset_id, 
                    qa_pairs, 
                    task_info, 
                    document_info
                )
                
                # 更新数据集统计信息
                await self._update_dataset_statistics(dataset_id, saved_count)
                
                # 完成任务
                duration_seconds = int((datetime.now() - start_time).total_seconds())
                await self._complete_task(task_id, saved_count, duration_seconds)
                
                logger.info(f"✅ QA提取任务完成: {task_id}, 提取QA对: {saved_count}")
                
            else:
                error_msg = extraction_result.get('error', '提取失败')
                await self._fail_task(task_id, error_msg)
                
        except Exception as e:
            logger.error(f"❌ QA提取任务处理失败: {task_id}, 错误: {e}")
            await self._fail_task(task_id, str(e))
    
    async def _create_unified_qa_dataset(self, task_info: Dict, document_info: Dict) -> str:
        """创建统一的QA数据集记录"""
        
        dataset_id = str(uuid.uuid4())
        timestamp = datetime.now()
        
        # 生成数据集标题和文件名
        dataset_title = self._generate_dataset_title(document_info['title'], timestamp)
        dataset_filename = self._generate_dataset_filename(document_info['filename'], timestamp)
        
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO qa_datasets (
                        id, title, description, category, file_name, file_path,
                        status, vectorization_status, total_qa_pairs, processed_qa_pairs,
                        data_source_type, source_document_id, extraction_task_id,
                        extraction_method, extraction_model, extraction_config,
                        extraction_started_at, collection_id,
                        created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    dataset_id,
                    dataset_title,
                    f"从文档'{document_info['title']}'自动提取的QA数据集",
                    'auto_extraction',
                    dataset_filename,
                    f"auto_extraction/{dataset_id}/{dataset_filename}",  # 虚拟路径
                    'processing',
                    'pending',
                    0,  # 初始为0，后续更新
                    0,
                    'auto_extraction',
                    task_info['document_id'],
                    task_info['id'],
                    task_info.get('extraction_method', 'GC-QA-RAG'),
                    task_info.get('extraction_model'),
                    task_info.get('config'),
                    timestamp,
                    document_info.get('collection_id'),
                    timestamp,
                    timestamp
                ))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ 创建QA数据集: {dataset_id} for task: {task_info['id']}")
            return dataset_id
            
        except Exception as e:
            logger.error(f"❌ 创建QA数据集失败: {e}")
            raise
    
    async def _save_qa_pairs_to_unified_structure(
        self, 
        dataset_id: str, 
        qa_pairs: List[Dict], 
        task_info: Dict, 
        document_info: Dict
    ) -> int:
        """将QA对保存到统一的qa_pairs表结构"""
        
        saved_count = 0
        
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                for i, qa_pair in enumerate(qa_pairs):
                    qa_pair_id = str(uuid.uuid4())
                    
                    cursor.execute("""
                        INSERT INTO qa_pairs (
                            id, dataset_id, question, answer, summary, source_chunk,
                            metadata, qa_type, language, confidence_score,
                            data_source_type, source_document_id, extraction_task_id,
                            chunk_index, extraction_confidence, extraction_method,
                            quality_score, created_at, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        qa_pair_id,
                        dataset_id,
                        qa_pair.get('question', ''),
                        qa_pair.get('answer', ''),
                        qa_pair.get('summary'),
                        qa_pair.get('source_chunk'),
                        json.dumps(qa_pair.get('metadata', {})),
                        'general',
                        'zh',
                        qa_pair.get('confidence_score', 0.8),
                        'auto_extraction',
                        task_info['document_id'],
                        task_info['id'],
                        i,  # chunk_index
                        qa_pair.get('confidence_score', 0.8),
                        task_info.get('extraction_method', 'GC-QA-RAG'),
                        qa_pair.get('quality_score', 80),
                        datetime.now(),
                        datetime.now()
                    ))
                    
                    saved_count += 1
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ 保存QA对到统一结构: {saved_count}个QA对")
            return saved_count
            
        except Exception as e:
            logger.error(f"❌ 保存QA对失败: {e}")
            raise
    
    async def _get_generated_qa_pairs(self, qa_task_id: int) -> List[Dict]:
        """获取生成的QA对"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT question, answer, summary, source_chunk, metadata
                    FROM generated_qa_pairs
                    WHERE task_id = %s
                    ORDER BY created_at
                """, (qa_task_id,))
                
                qa_pairs = [dict(row) for row in cursor.fetchall()]
            
            conn.close()
            return qa_pairs
            
        except Exception as e:
            logger.error(f"❌ 获取生成的QA对失败: {e}")
            return []
    
    async def _get_task_info(self, task_id: str) -> Optional[Dict]:
        """获取任务信息"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM qa_extraction_queue WHERE id = %s
                """, (task_id,))
                
                result = cursor.fetchone()
            
            conn.close()
            return dict(result) if result else None
            
        except Exception as e:
            logger.error(f"❌ 获取任务信息失败: {e}")
            return None
    
    async def _get_document_info(self, document_id: str) -> Optional[Dict]:
        """获取文档信息"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id, title, filename, file_type, collection_id
                    FROM knowledge_documents WHERE id = %s
                """, (document_id,))
                
                result = cursor.fetchone()
            
            conn.close()
            return dict(result) if result else None
            
        except Exception as e:
            logger.error(f"❌ 获取文档信息失败: {e}")
            return None
    
    def _generate_dataset_title(self, document_title: str, timestamp: datetime) -> str:
        """生成数据集标题"""
        time_str = timestamp.strftime("%Y%m%d_%H%M%S")
        return f"{document_title}_{time_str}_qa"
    
    def _generate_dataset_filename(self, document_filename: str, timestamp: datetime) -> str:
        """生成数据集文件名"""
        base_name = document_filename.rsplit('.', 1)[0] if '.' in document_filename else document_filename
        time_str = timestamp.strftime("%Y%m%d_%H%M%S")
        return f"{base_name}_{time_str}_qa.json"
    
    async def _update_task_status(self, task_id: str, status: QAExtractionStatus, **kwargs):
        """更新任务状态"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                set_clauses = ["status = %s", "updated_at = %s"]
                values = [status.value, datetime.now()]
                
                if 'started_at' in kwargs:
                    set_clauses.append("started_at = %s")
                    values.append(kwargs['started_at'])
                
                if 'completed_at' in kwargs:
                    set_clauses.append("completed_at = %s")
                    values.append(kwargs['completed_at'])
                
                if 'error_message' in kwargs:
                    set_clauses.append("error_message = %s")
                    values.append(kwargs['error_message'])
                
                values.append(task_id)
                
                cursor.execute(f"""
                    UPDATE qa_extraction_queue 
                    SET {', '.join(set_clauses)}
                    WHERE id = %s
                """, values)
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ 更新任务状态失败: {e}")
    
    async def _update_task_dataset_id(self, task_id: str, dataset_id: str):
        """更新任务的目标数据集ID"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE qa_extraction_queue 
                    SET target_dataset_id = %s
                    WHERE id = %s
                """, (dataset_id, task_id))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ 更新任务数据集ID失败: {e}")
    
    async def _update_dataset_statistics(self, dataset_id: str, qa_pairs_count: int):
        """更新数据集统计信息"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE qa_datasets 
                    SET total_qa_pairs = %s, 
                        processed_qa_pairs = %s,
                        status = 'completed',
                        processed_at = %s
                    WHERE id = %s
                """, (qa_pairs_count, qa_pairs_count, datetime.now(), dataset_id))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ 更新数据集统计失败: {e}")
    
    async def _complete_task(self, task_id: str, qa_pairs_count: int, duration_seconds: int):
        """完成任务"""
        await self._update_task_status(
            task_id, 
            QAExtractionStatus.COMPLETED,
            completed_at=datetime.now()
        )
        
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE qa_extraction_queue 
                    SET qa_pairs_extracted = %s,
                        extraction_duration_seconds = %s
                    WHERE id = %s
                """, (qa_pairs_count, duration_seconds, task_id))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ 更新任务完成信息失败: {e}")
    
    async def _fail_task(self, task_id: str, error_message: str):
        """任务失败"""
        await self._update_task_status(
            task_id,
            QAExtractionStatus.FAILED,
            completed_at=datetime.now(),
            error_message=error_message
        )
    
    async def get_task_status(self, task_id: str) -> Optional[Dict]:
        """获取任务状态"""
        return await self._get_task_info(task_id)
    
    async def get_datasets_by_document(self, document_id: str) -> List[Dict]:
        """获取文档相关的QA数据集"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM enhanced_qa_datasets_view 
                    WHERE source_document_id = %s
                    ORDER BY created_at DESC
                """, (document_id,))
                
                results = [dict(row) for row in cursor.fetchall()]
            
            conn.close()
            return results
            
        except Exception as e:
            logger.error(f"❌ 获取文档QA数据集失败: {e}")
            return []


# 创建全局实例
unified_qa_extraction_service = UnifiedQAExtractionService()