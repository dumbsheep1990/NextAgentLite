"""
QA Generation Service integrated with GC-QA-RAG
集成GC-QA-RAG的问答对生成服务
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

# Add GC-QA-RAG ETL path to Python path
sys.path.append('/Users/wxn/Desktop/NextAgentLite/lite-backend/qa_gen/sources/gc-qa-rag-etl')

# 设置GC-QA-RAG的工作目录
import os
os.chdir('/Users/wxn/Desktop/NextAgentLite/lite-backend/qa_gen/sources/gc-qa-rag-etl')

from etlapp.etl.etl_generic.generate import QAGenerator, PromptConfig
from etlapp.common.chunk import split_text_into_sentence_groups

# 恢复原始工作目录
os.chdir('/Users/wxn/Desktop/NextAgentLite/lite-backend')
from service.pgvector_adapter import pgvector_adapter
from service.embedding_service import embedding_service
from db.database import get_connection
from core.config_optimized import optimized_config_manager

logger = logging.getLogger(__name__)


@dataclass
class QATask:
    """QA生成任务数据结构"""
    id: int
    document_id: int
    status: str
    qa_pairs_count: int = 0
    created_at: datetime = None
    completed_at: datetime = None
    error_message: str = None


@dataclass
class QAPair:
    """QA对数据结构"""
    id: int = None
    task_id: int = None
    question: str = ""
    answer: str = ""
    summary: str = ""
    source_chunk: str = ""
    question_embedding: List[float] = None
    answer_embedding: List[float] = None
    metadata: Dict[str, Any] = None


class QAGenerationService:
    """
    问答对生成服务
    
    集成GC-QA-RAG的核心算法，适配到NextAgentLite的PostgreSQL架构
    """
    
    def __init__(self):
        self.qa_generator = QAGenerator()
        self._ensure_tables_exist()
        
    def _ensure_tables_exist(self):
        """确保QA相关数据库表存在"""
        create_tables_sql = """
        -- QA生成任务表
        CREATE TABLE IF NOT EXISTS qa_generation_tasks (
            id SERIAL PRIMARY KEY,
            document_id INTEGER REFERENCES knowledge_documents(id),
            status VARCHAR(50) DEFAULT 'pending',
            qa_pairs_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP,
            error_message TEXT
        );
        
        -- QA对存储表
        CREATE TABLE IF NOT EXISTS generated_qa_pairs (
            id SERIAL PRIMARY KEY,
            task_id INTEGER REFERENCES qa_generation_tasks(id),
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            summary TEXT,
            source_chunk TEXT,
            question_embedding vector(2560),
            answer_embedding vector(2560),
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_qa_tasks_document_id ON qa_generation_tasks(document_id);
        CREATE INDEX IF NOT EXISTS idx_qa_tasks_status ON qa_generation_tasks(status);
        CREATE INDEX IF NOT EXISTS idx_qa_pairs_task_id ON generated_qa_pairs(task_id);
        CREATE INDEX IF NOT EXISTS idx_qa_question_embedding ON generated_qa_pairs 
        USING ivfflat (question_embedding vector_cosine_ops);
        CREATE INDEX IF NOT EXISTS idx_qa_answer_embedding ON generated_qa_pairs 
        USING ivfflat (answer_embedding vector_cosine_ops);
        """
        
        try:
            conn = get_connection()
            with conn.cursor() as cursor:
                cursor.execute(create_tables_sql)
            conn.commit()
            conn.close()
            logger.info("QA generation tables ensured")
        except Exception as e:
            logger.error(f"Failed to create QA tables: {e}")
            raise
            
    async def create_qa_task(self, document_id: int) -> int:
        """
        创建QA生成任务
        
        Args:
            document_id: 文档ID
            
        Returns:
            任务ID
        """
        create_task_sql = """
        INSERT INTO qa_generation_tasks (document_id, status, created_at)
        VALUES (%s, 'pending', NOW())
        RETURNING id
        """
        
        try:
            result = self.db_utils.execute_sql(create_task_sql, (document_id,))
            task_id = result[0][0] if result else None
            
            if task_id:
                logger.info(f"Created QA generation task {task_id} for document {document_id}")
                return task_id
            else:
                raise Exception("Failed to create QA task")
                
        except Exception as e:
            logger.error(f"Error creating QA task: {e}")
            raise
            
    async def process_qa_task(self, task_id: int) -> Dict[str, Any]:
        """
        处理QA生成任务
        
        Args:
            task_id: 任务ID
            
        Returns:
            处理结果
        """
        try:
            # 更新任务状态
            await self._update_task_status(task_id, 'processing')
            
            # 获取文档内容
            document_content = await self._get_document_content(task_id)
            if not document_content:
                await self._update_task_status(task_id, 'failed', 'Document content not found')
                return {"success": False, "error": "Document content not found"}
                
            # 使用GC-QA-RAG算法生成QA对
            qa_result = self.qa_generator.generate(document_content)
            
            # 处理生成的QA对
            qa_pairs = await self._process_qa_result(task_id, qa_result, document_content)
            
            # 更新任务状态
            await self._update_task_status(
                task_id, 
                'completed', 
                None, 
                len(qa_pairs),
                datetime.now()
            )
            
            logger.info(f"QA task {task_id} completed with {len(qa_pairs)} QA pairs")
            
            return {
                "success": True,
                "task_id": task_id,
                "qa_pairs_count": len(qa_pairs),
                "qa_pairs": qa_pairs
            }
            
        except Exception as e:
            logger.error(f"Error processing QA task {task_id}: {e}")
            await self._update_task_status(task_id, 'failed', str(e))
            return {"success": False, "error": str(e)}
            
    async def _get_document_content(self, task_id: int) -> Optional[str]:
        """获取文档内容"""
        query_sql = """
        SELECT kd.content, kd.extracted_text
        FROM qa_generation_tasks qgt
        JOIN knowledge_documents kd ON qgt.document_id = kd.id
        WHERE qgt.id = %s
        """
        
        try:
            result = self.db_utils.execute_sql(query_sql, (task_id,))
            if result:
                content = result[0][0] or result[0][1]  # 优先使用content，否则使用extracted_text
                return content
            return None
            
        except Exception as e:
            logger.error(f"Error getting document content for task {task_id}: {e}")
            return None
            
    async def _process_qa_result(
        self, 
        task_id: int, 
        qa_result: Dict[str, Any], 
        source_content: str
    ) -> List[Dict[str, Any]]:
        """
        处理QA生成结果
        
        Args:
            task_id: 任务ID
            qa_result: GC-QA-RAG生成的结果
            source_content: 源文档内容
            
        Returns:
            处理后的QA对列表
        """
        qa_pairs = []
        
        try:
            groups = qa_result.get('Groups', [])
            
            for group_idx, group in enumerate(groups):
                summary = group.get('Summary', '')
                possible_qa = group.get('PossibleQA', [])
                
                # 计算源片段
                source_chunks = split_text_into_sentence_groups(source_content)
                source_chunk = ""
                if group_idx < len(source_chunks):
                    source_chunk = "。".join(source_chunks[group_idx])
                    
                for qa in possible_qa:
                    question = qa.get('Question', '')
                    answer = qa.get('Answer', '')
                    
                    if question and answer:
                        # 生成向量嵌入
                        question_embedding = await self._generate_embedding(question)
                        answer_embedding = await self._generate_embedding(answer)
                        
                        # 存储QA对
                        qa_pair_id = await self._store_qa_pair(
                            task_id=task_id,
                            question=question,
                            answer=answer,
                            summary=summary,
                            source_chunk=source_chunk,
                            question_embedding=question_embedding,
                            answer_embedding=answer_embedding,
                            metadata={
                                "group_index": group_idx,
                                "source_length": len(source_chunk)
                            }
                        )
                        
                        qa_pairs.append({
                            "id": qa_pair_id,
                            "question": question,
                            "answer": answer,
                            "summary": summary,
                            "source_chunk": source_chunk[:200] + "..." if len(source_chunk) > 200 else source_chunk
                        })
                        
            return qa_pairs
            
        except Exception as e:
            logger.error(f"Error processing QA result: {e}")
            raise
            
    async def _generate_embedding(self, text: str) -> List[float]:
        """生成文本嵌入向量"""
        try:
            # 使用现有的embedding服务 (text-embedding-v4是2560维)
            embedding_response = await embedding_service.create_embeddings(
                model="text-embedding-v4",
                texts=[text]
            )
            
            if embedding_response and embedding_response.embeddings:
                return embedding_response.embeddings[0]
            else:
                logger.warning(f"Failed to generate embedding for text: {text[:50]}...")
                return [0.0] * 2560  # 返回零向量作为fallback (qwen-embedding-v4维度)
                
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * 2560
            
    async def _store_qa_pair(
        self,
        task_id: int,
        question: str,
        answer: str,
        summary: str,
        source_chunk: str,
        question_embedding: List[float],
        answer_embedding: List[float],
        metadata: Dict[str, Any]
    ) -> int:
        """存储QA对到数据库"""
        insert_sql = """
        INSERT INTO generated_qa_pairs 
        (task_id, question, answer, summary, source_chunk, 
         question_embedding, answer_embedding, metadata, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        RETURNING id
        """
        
        try:
            result = self.db_utils.execute_sql(
                insert_sql,
                (
                    task_id,
                    question,
                    answer,
                    summary,
                    source_chunk,
                    question_embedding,
                    answer_embedding,
                    json.dumps(metadata)
                )
            )
            
            qa_pair_id = result[0][0] if result else None
            return qa_pair_id
            
        except Exception as e:
            logger.error(f"Error storing QA pair: {e}")
            raise
            
    async def _update_task_status(
        self,
        task_id: int,
        status: str,
        error_message: str = None,
        qa_pairs_count: int = None,
        completed_at: datetime = None
    ):
        """更新任务状态"""
        update_sql = """
        UPDATE qa_generation_tasks 
        SET status = %s, error_message = %s, qa_pairs_count = COALESCE(%s, qa_pairs_count),
            completed_at = COALESCE(%s, completed_at)
        WHERE id = %s
        """
        
        try:
            self.db_utils.execute_sql(
                update_sql,
                (status, error_message, qa_pairs_count, completed_at, task_id)
            )
            
        except Exception as e:
            logger.error(f"Error updating task status: {e}")
            raise
            
    async def get_qa_task_status(self, task_id: int) -> Optional[Dict[str, Any]]:
        """获取任务状态"""
        query_sql = """
        SELECT id, document_id, status, qa_pairs_count, created_at, completed_at, error_message
        FROM qa_generation_tasks
        WHERE id = %s
        """
        
        try:
            result = self.db_utils.execute_sql(query_sql, (task_id,))
            if result:
                row = result[0]
                return {
                    "id": row[0],
                    "document_id": row[1],
                    "status": row[2],
                    "qa_pairs_count": row[3],
                    "created_at": row[4].isoformat() if row[4] else None,
                    "completed_at": row[5].isoformat() if row[5] else None,
                    "error_message": row[6]
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting task status: {e}")
            return None
            
    async def get_qa_pairs_by_task(self, task_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """获取任务的QA对"""
        query_sql = """
        SELECT id, question, answer, summary, source_chunk, metadata, created_at
        FROM generated_qa_pairs
        WHERE task_id = %s
        ORDER BY id
        LIMIT %s
        """
        
        try:
            result = self.db_utils.execute_sql(query_sql, (task_id, limit))
            qa_pairs = []
            
            for row in result:
                qa_pairs.append({
                    "id": row[0],
                    "question": row[1],
                    "answer": row[2],
                    "summary": row[3],
                    "source_chunk": row[4],
                    "metadata": json.loads(row[5]) if row[5] else {},
                    "created_at": row[6].isoformat() if row[6] else None
                })
                
            return qa_pairs
            
        except Exception as e:
            logger.error(f"Error getting QA pairs for task {task_id}: {e}")
            return []
            
    async def search_qa_pairs(
        self, 
        query: str, 
        vector_field: str = "question", 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """搜索QA对"""
        try:
            # 生成查询向量
            query_embedding = await self._generate_embedding(query)
            
            # 选择向量字段
            vector_column = f"{vector_field}_embedding"
            
            search_sql = f"""
            SELECT id, question, answer, summary, source_chunk, metadata,
                   1 - ({vector_column} <=> %s) as similarity_score
            FROM generated_qa_pairs
            WHERE {vector_column} IS NOT NULL
            ORDER BY {vector_column} <=> %s
            LIMIT %s
            """
            
            result = self.db_utils.execute_sql(search_sql, (query_embedding, query_embedding, limit))
            
            search_results = []
            for row in result:
                search_results.append({
                    "id": row[0],
                    "question": row[1],
                    "answer": row[2],
                    "summary": row[3],
                    "source_chunk": row[4],
                    "metadata": json.loads(row[5]) if row[5] else {},
                    "similarity_score": float(row[6])
                })
                
            return search_results
            
        except Exception as e:
            logger.error(f"Error searching QA pairs: {e}")
            return []


# 全局服务实例
qa_generation_service = QAGenerationService()