"""
简化的QA生成服务 - 使用GC-QA-RAG核心算法
专注于QA生成功能，简化数据库操作
"""

import asyncio
import re
import json
import logging
import os
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

# Add GC-QA-RAG ETL path to Python path (使用相对路径)
_current_file_dir = os.path.dirname(os.path.abspath(__file__))
_qa_gen_etl_path = os.path.join(_current_file_dir, '..', 'qa_gen', 'sources', 'gc-qa-rag-etl')
_qa_gen_etl_path = os.path.abspath(_qa_gen_etl_path)
sys.path.append(_qa_gen_etl_path)

# 设置GC-QA-RAG的工作目录
original_cwd = os.getcwd()
os.chdir(_qa_gen_etl_path)

from etlapp.etl.etl_generic.generate import QAGenerator, PromptConfig
from etlapp.common.chunk import split_text_into_sentence_groups

# 恢复原始工作目录
os.chdir(original_cwd)

from service.embedding_service import embedding_service
from db.database import get_db
from core.config_optimized import optimized_config_manager
import psycopg2

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


class QAGenerationServiceSimplified:
    """
    简化的QA生成服务
    
    集成GC-QA-RAG的核心算法，使用简化的数据库操作
    """
    
    def __init__(self):
        # 使用后端统一的LLM配置
        self._setup_unified_llm_config()
        self.qa_generator = QAGenerator()
        self._ensure_tables_exist()
        # 分别缓存问/答向量列的维度，避免表历史不一致导致的插入报错
        self._cached_dims: Dict[str, int] = {}
        
    def _setup_unified_llm_config(self):
        """设置统一的LLM配置，覆盖GC-QA-RAG的默认配置"""
        config = optimized_config_manager.settings
        
        # 设置GC-QA-RAG期望的环境变量格式
        # LLM配置
        os.environ['GC_QA_RAG_LLM_API_KEY'] = config.one_api_key
        os.environ['GC_QA_RAG_LLM_API_BASE'] = config.one_api_base_url
        os.environ['GC_QA_RAG_LLM_MODEL_NAME'] = config.default_llm_model
        
        # 嵌入模型配置
        os.environ['GC_QA_RAG_EMBEDDING_API_KEY'] = config.one_api_key
        
        # 设置环境类型
        os.environ['GC_QA_RAG_ENV'] = 'production'
        
        # 重新初始化GC-QA-RAG的配置和LLM客户端
        self._reinitialize_gc_qa_rag_config()
        
        logger.info(f"✅ 设置GC-QA-RAG环境变量:")
        logger.info(f"   LLM模型: {config.default_llm_model}")
        logger.info(f"   嵌入模型: {config.default_embedding_model}")
        logger.info(f"   API基础URL: {config.one_api_base_url}")
        logger.info(f"   API Key: {config.one_api_key[:10]}...")
        
    def _reinitialize_gc_qa_rag_config(self):
        """重新初始化GC-QA-RAG的配置和LLM客户端"""
        try:
            # 强制重新加载配置
            from etlapp.common.config import Config
            new_config = Config.from_environment('production')
            
            # 重新创建LLM客户端
            from etlapp.common.llm import LLMClient
            import etlapp.common.llm as llm_module
            
            # 创建新的LLM客户端实例并替换全局实例
            llm_module.llm_client = LLMClient(
                api_key=new_config.llm.api_key,
                api_base=new_config.llm.api_base,
                model_name=new_config.llm.model_name,
                max_rpm=new_config.llm.max_rpm
            )
            
            logger.info("✅ 重新初始化GC-QA-RAG配置和LLM客户端")
            
        except Exception as e:
            logger.error(f"重新初始化GC-QA-RAG配置失败: {e}")
            raise
        
    def _sanitize_text(self, text: str) -> str:
        """清理文本中的图片/多媒体与内联base64，避免送入LLM。

        - 移除 Markdown 图片: ![...](...)
        - 移除 HTML 多媒体标签: <img>, <video>, <audio>, <source>, <iframe>, <embed>, <object>
        - 移除内联 data:image|video|audio 的 base64 段
        - 移除典型图片base64长串（PNG/JPG/GIF头）
        """
        if not text:
            return text
        s = text
        # Markdown 图片（无论是 http 还是 data:）
        s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", s, flags=re.IGNORECASE)
        # HTML 多媒体标签
        s = re.sub(r"<\s*(img|video|audio|source|iframe|embed|object)[^>]*>", "", s, flags=re.IGNORECASE)
        # 内联base64 多媒体
        s = re.sub(r"data:(image|video|audio|application)/[^;]+;base64,[A-Za-z0-9+/=\s]+", "", s, flags=re.IGNORECASE)
        # CSS url(data:...)
        s = re.sub(r"url\(\s*data:[^)]+\)", "", s, flags=re.IGNORECASE)
        # 典型图片base64头
        for p in (r"iVBORw0KGgo[A-Za-z0-9+/=]{200,}", r"/9j/[A-Za-z0-9+/=]{200,}", r"R0lGODlh[A-Za-z0-9+/=]{200,}"):
            s = re.sub(p, "", s)
        # 去除包含base64的代码块
        s = re.sub(r"```[\s\S]*?(?:base64|data:image|iVBORw0KGgo|/9j/|R0lGODlh)[\s\S]*?```", "", s, flags=re.IGNORECASE)
        s = re.sub(r"~~~[\s\S]*?(?:base64|data:image|iVBORw0KGgo|/9j/|R0lGODlh)[\s\S]*?~~~", "", s, flags=re.IGNORECASE)
        # 规范空白
        s = re.sub(r"\n{3,}", "\n\n", s)
        return s

    def _get_connection(self):
        """获取数据库连接（允许环境变量覆盖以与主后端一致）"""
        db_config = optimized_config_manager.settings.database_postgresql
        host = os.getenv('POSTGRESQL_HOST', db_config.host)
        port = int(os.getenv('POSTGRESQL_PORT', db_config.port))
        database = os.getenv('POSTGRESQL_DATABASE', db_config.database)
        user = os.getenv('POSTGRESQL_USERNAME', db_config.username)
        password = os.getenv('POSTGRESQL_PASSWORD', db_config.password)
        logger.info(f"[QA-GEN-DB] Connecting {user}@{host}:{port}/{database}")
        return psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        
    def _ensure_tables_exist(self):
        """确保QA相关数据库表存在"""
        create_tables_sql = """
        -- 确保pgvector扩展存在
        CREATE EXTENSION IF NOT EXISTS vector;
        
        -- QA生成任务表
        CREATE TABLE IF NOT EXISTS qa_generation_tasks (
            id SERIAL PRIMARY KEY,
            document_id VARCHAR(255),
            status VARCHAR(50) DEFAULT 'pending',
            qa_pairs_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP,
            error_message TEXT
        );
        
        -- QA对存储表（统一使用1024维，与网关默认embedding模型一致）
        CREATE TABLE IF NOT EXISTS generated_qa_pairs (
            id SERIAL PRIMARY KEY,
            task_id INTEGER REFERENCES qa_generation_tasks(id) ON DELETE CASCADE,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            summary TEXT,
            source_chunk TEXT,
            question_embedding vector(1024),
            answer_embedding vector(1024),
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_qa_tasks_document_id ON qa_generation_tasks(document_id);
        CREATE INDEX IF NOT EXISTS idx_qa_tasks_status ON qa_generation_tasks(status);
        CREATE INDEX IF NOT EXISTS idx_qa_pairs_task_id ON generated_qa_pairs(task_id);
        """
        
        # 分别创建向量索引，避免可能的错误
        # 注意：当前pgvector版本对2560维向量索引有限制，暂时跳过索引创建
        # 在实际生产环境中可考虑降维或使用更高版本的pgvector
        vector_indexes_sql = [
            # "CREATE INDEX IF NOT EXISTS idx_qa_question_embedding ON generated_qa_pairs USING hnsw (question_embedding vector_cosine_ops);",
            # "CREATE INDEX IF NOT EXISTS idx_qa_answer_embedding ON generated_qa_pairs USING hnsw (answer_embedding vector_cosine_ops);"
        ]
        
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute(create_tables_sql)
                
                # 尝试创建向量索引
                for index_sql in vector_indexes_sql:
                    try:
                        cursor.execute(index_sql)
                    except Exception as e:
                        logger.warning(f"向量索引创建可能失败: {e}")
                        
            conn.commit()
            conn.close()
            logger.info("QA generation tables ensured")
        except Exception as e:
            logger.error(f"Failed to create QA tables: {e}")
            raise
            
    async def create_qa_task(self, document_id: str, document_title: str = None) -> int:
        """创建QA生成任务"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO qa_generation_tasks (document_id, status, created_at)
                    VALUES (%s, 'pending', NOW())
                    RETURNING id
                """, (document_id,))
                
                result = cursor.fetchone()
                task_id = result[0] if result else None
                
            conn.commit()
            conn.close()
            
            if task_id:
                logger.info(f"Created QA generation task {task_id} for document {document_id}")
                return task_id
            else:
                raise Exception("Failed to create QA task")
                
        except Exception as e:
            logger.error(f"Error creating QA task: {e}")
            raise
            
    async def process_qa_task(self, task_id: int, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """处理QA生成任务

        Args:
            task_id: 任务ID
            config: QA生成配置参数 (可选)
                - chunk_size: 文档分块大小 (默认: 1200)
                - chunk_overlap: 分块重叠字符数 (默认: 100)
                - qa_count_per_chunk: 每块生成QA数量 (默认: 3)
                - language: 语言设置 (默认: "zh")
                - quality_threshold: 质量过滤阈值 (默认: 0.7)
                - include_summary: 是否包含摘要 (默认: True)
        """
        try:
            # 解析配置参数
            config = config or {}
            chunk_size = config.get('chunk_size', 1200)
            chunk_overlap = config.get('chunk_overlap', 100)
            qa_count_per_chunk = config.get('qa_count_per_chunk', 3)
            language = config.get('language', 'zh')
            quality_threshold = config.get('quality_threshold', 0.7)
            include_summary = config.get('include_summary', True)

            logger.info(f"Processing QA task {task_id} with config: chunk_size={chunk_size}, "
                       f"overlap={chunk_overlap}, qa_per_chunk={qa_count_per_chunk}, "
                       f"language={language}, threshold={quality_threshold}")

            # 更新任务状态为processing
            await self._update_task_status(task_id, 'processing')

            # 获取文档内容
            document_content = await self._get_document_content(task_id)
            if not document_content:
                await self._update_task_status(task_id, 'failed', 'Document content not found')
                return {"success": False, "error": "Document content not found"}

            logger.info(f"Processing QA task {task_id}, content length: {len(document_content)}")

            # 使用GC-QA-RAG算法生成QA对（加入长度保护：超长内容分段处理）
            qa_pairs: List[Dict[str, Any]] = []
            content = document_content or ""
            # 使用配置的chunk_size作为分段大小
            max_chars_per_call = chunk_size * 100  # 将chunk_size转换为合适的字符数
            if len(content) <= max_chars_per_call:
                qa_result = self.qa_generator.generate(content)
                logger.info(f"GC-QA-RAG generated result: {len(qa_result.get('Groups', []))} groups (single)")
                qa_pairs.extend(await self._process_qa_result(task_id, qa_result, content))
            else:
                logger.info(f"Content too large ({len(content)} chars). Generating in windows...")
                start = 0
                window_idx = 0
                while start < len(content):
                    end = min(start + max_chars_per_call, len(content))
                    window_text = content[start:end]
                    window_idx += 1
                    try:
                        qa_result = self.qa_generator.generate(window_text)
                        logger.info(f"Window {window_idx}: {len(qa_result.get('Groups', []))} groups")
                        qa_pairs.extend(await self._process_qa_result(task_id, qa_result, window_text))
                    except Exception as ge:
                        logger.error(f"QA generation failed on window {window_idx}: {ge}")
                    # 使用配置的chunk_overlap作为重叠大小
                    overlap = chunk_overlap
                    start = end - overlap
                    if start < 0:
                        start = end
            
            # 更新任务状态为completed
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
                "qa_pairs": qa_pairs[:5]  # 返回前5个作为预览
            }
            
        except Exception as e:
            logger.error(f"Error processing QA task {task_id}: {e}")
            await self._update_task_status(task_id, 'failed', str(e))
            return {"success": False, "error": str(e)}
            
    async def _get_document_content(self, task_id: int) -> Optional[str]:
        """获取文档内容"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                # 首先获取文档ID和标题
                cursor.execute("""
                    SELECT qgt.document_id, kd.title
                    FROM qa_generation_tasks qgt
                    LEFT JOIN knowledge_documents kd ON qgt.document_id = kd.id
                    WHERE qgt.id = %s
                """, (task_id,))
                
                task_result = cursor.fetchone()
                if not task_result:
                    return None
                    
                document_id, title = task_result
                
                # 获取文档的所有chunks内容
                cursor.execute("""
                    SELECT content
                    FROM document_chunks
                    WHERE document_id = %s
                    ORDER BY chunk_index
                """, (document_id,))
                
                chunks = cursor.fetchall()
                
            conn.close()
            
            if chunks:
                # 合并所有chunks的内容
                raw = "\n".join([chunk[0] for chunk in chunks if chunk[0]])
                # 清理图片/多媒体与base64
                content = self._sanitize_text(raw)
                
                # 如果内容太短，添加标题
                if content and len(content.strip()) < 100 and title:
                    content = f"标题: {title}\n\n{content}"
                    
                return content
            else:
                # 如果没有chunks，返回标题作为基础内容
                return f"标题: {title}" if title else None
            
        except Exception as e:
            logger.error(f"Error getting document content for task {task_id}: {e}")
            return None
            
    async def _process_qa_result(
        self, 
        task_id: int, 
        qa_result: Dict[str, Any], 
        source_content: str
    ) -> List[Dict[str, Any]]:
        """处理QA生成结果"""
        qa_pairs = []
        
        try:
            groups = qa_result.get('Groups', [])
            logger.info(f"Processing {len(groups)} groups from QA result")
            
            for group_idx, group in enumerate(groups):
                summary = group.get('Summary', '')
                possible_qa = group.get('PossibleQA', [])
                
                # 计算源片段
                source_chunks = split_text_into_sentence_groups(source_content)
                source_chunk = ""
                if group_idx < len(source_chunks):
                    source_chunk = "。".join(source_chunks[group_idx])
                    
                logger.info(f"Group {group_idx + 1}: {len(possible_qa)} QA pairs")
                
                for qa_idx, qa in enumerate(possible_qa):
                    question = qa.get('Question', '').strip()
                    answer = qa.get('Answer', '').strip()
                    
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
                                "qa_index": qa_idx,
                                "source_length": len(source_chunk),
                                "generated_at": datetime.now().isoformat()
                            }
                        )
                        
                        qa_pairs.append({
                            "id": qa_pair_id,
                            "question": question,
                            "answer": answer,
                            "summary": summary,
                            "source_chunk": source_chunk[:200] + "..." if len(source_chunk) > 200 else source_chunk
                        })
                        
            logger.info(f"Successfully processed {len(qa_pairs)} QA pairs")
            return qa_pairs
            
        except Exception as e:
            logger.error(f"Error processing QA result: {e}")
            raise
            
    async def _generate_embedding(self, text: str) -> List[float]:
        """生成文本嵌入向量"""
        try:
            from service.llm_config_gateway_client import get_llm_config_gateway_client
            client = await get_llm_config_gateway_client()
            cfg = await client.get_default_embedding_model()
            model_id = cfg[0] if cfg else None
            if not model_id:
                raise ValueError("未配置默认Embedding模型")
            resp = await client.create_embeddings(model_id, text)
            data = (resp.get('data') or [{}])[0]
            emb = data.get('embedding')
            if emb:
                return emb
            else:
                logger.warning(f"Failed to generate embedding for text: {text[:50]}...")
                # Fallback 使用预估维度（默认1024），避免与列维度不符
                return [0.0] * 1024
                
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * 1024

    def _get_table_vector_dim(self, conn, table: str, column: str) -> int:
        """读取pgvector列定义的维度，优先解析format_type，兜底为1024。

        说明：直接使用atttypmod在不同版本可能出现常数偏移（如1024→1020），
        这里采用format_type(atttypid, atttypmod)解析出`vector(XXXX)`中的维度，
        解析失败则回退到安全值1024。
        """
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT format_type(a.atttypid, a.atttypmod)
                    FROM pg_attribute a
                    WHERE a.attrelid = %s::regclass AND a.attname = %s
                    """,
                    (table, column),
                )
                row = cursor.fetchone()
                if row and row[0]:
                    fmt = str(row[0])  # e.g. 'vector(1024)'
                    if 'vector(' in fmt and fmt.endswith(')'):
                        try:
                            dim_str = fmt.split('vector(')[1].rstrip(')')
                            dim_val = int(dim_str)
                            if dim_val > 0:
                                return dim_val
                        except Exception:
                            pass
                # 兜底再尝试一次直接atttypmod读取并修正常见偏移
                cursor.execute(
                    """
                    SELECT a.atttypmod FROM pg_attribute a
                    WHERE a.attrelid = %s::regclass AND a.attname = %s
                    """,
                    (table, column),
                )
                row2 = cursor.fetchone()
                if row2 and row2[0] and int(row2[0]) > 0:
                    val = int(row2[0])
                    # 常见偏移修正：如果接近常用维度（+/- 4），以常用维度为准
                    for candidate in (256, 384, 512, 768, 1024, 1536, 2048, 2560):
                        if abs(val - candidate) <= 4:
                            return candidate
                    # 否则直接返回读取值
                    return val
        except Exception as e:
            logger.warning(f"Failed to read vector dim for {table}.{column}: {e}")
        return 1024

    def _adapt_vector(self, vec: List[float], dim: int) -> List[float]:
        """将向量截断/补零到指定维度"""
        if not isinstance(vec, list):
            return [0.0] * dim
        if len(vec) == dim:
            return vec
        if len(vec) > dim:
            return vec[:dim]
        # pad zeros
        return vec + [0.0] * (dim - len(vec))
            
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
        try:
            conn = self._get_connection()
            # 读取/缓存问答两列的表定义维度，分别适配
            if 'q' not in self._cached_dims:
                self._cached_dims['q'] = self._get_table_vector_dim(conn, 'generated_qa_pairs', 'question_embedding')
            if 'a' not in self._cached_dims:
                self._cached_dims['a'] = self._get_table_vector_dim(conn, 'generated_qa_pairs', 'answer_embedding')
            qdim = self._cached_dims.get('q') or 1024
            adim = self._cached_dims.get('a') or 1024
            qv = self._adapt_vector(question_embedding, qdim)
            av = self._adapt_vector(answer_embedding, adim)
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO generated_qa_pairs 
                    (task_id, question, answer, summary, source_chunk, 
                     question_embedding, answer_embedding, metadata, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    RETURNING id
                """, (
                    task_id,
                    question,
                    answer,
                    summary,
                    source_chunk,
                    qv,
                    av,
                    json.dumps(metadata)
                ))
                
                result = cursor.fetchone()
                qa_pair_id = result[0] if result else None
                
            conn.commit()
            conn.close()
            
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
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                if completed_at:
                    cursor.execute("""
                        UPDATE qa_generation_tasks 
                        SET status = %s, error_message = %s, qa_pairs_count = COALESCE(%s, qa_pairs_count),
                            completed_at = %s
                        WHERE id = %s
                    """, (status, error_message, qa_pairs_count, completed_at, task_id))
                else:
                    cursor.execute("""
                        UPDATE qa_generation_tasks 
                        SET status = %s, error_message = %s, qa_pairs_count = COALESCE(%s, qa_pairs_count)
                        WHERE id = %s
                    """, (status, error_message, qa_pairs_count, task_id))
                    
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error updating task status: {e}")
            raise
            
    async def get_qa_task_status(self, task_id: int) -> Optional[Dict[str, Any]]:
        """获取任务状态"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT qgt.id, qgt.document_id, qgt.status, qgt.qa_pairs_count, 
                           qgt.created_at, qgt.completed_at, qgt.error_message,
                           kd.title as document_title
                    FROM qa_generation_tasks qgt
                    LEFT JOIN knowledge_documents kd ON qgt.document_id = kd.id
                    WHERE qgt.id = %s
                """, (task_id,))
                
                result = cursor.fetchone()
                
            conn.close()
            
            if result:
                return {
                    "id": result[0],
                    "document_id": result[1],
                    "status": result[2],
                    "qa_pairs_count": result[3] or 0,
                    "created_at": result[4].isoformat() if result[4] else None,
                    "completed_at": result[5].isoformat() if result[5] else None,
                    "error_message": result[6],
                    "document_title": result[7]
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting task status: {e}")
            return None


# 全局服务实例
qa_generation_service_simplified = QAGenerationServiceSimplified()
