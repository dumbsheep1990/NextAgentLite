"""
地聚物三元组提取服务
基于LLM的实体和关系提取，专门针对地聚物材料科学领域
"""
import asyncio
import uuid
import re
import json
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

from core.logger import logger
from service.prompts import (
    GEOPOLYMER_PROMPTS, 
    GEOPOLYMER_ENTITY_TYPES,
    GEOPOLYMER_RELATIONSHIP_TYPES,
    GEOPOLYMER_TUPLE_DELIMITER,
    GEOPOLYMER_RECORD_DELIMITER,
    GEOPOLYMER_COMPLETION_DELIMITER
)
from service.llm_service import LLMService
from service.graph_service import GraphService
from models.knowledge import Document, DocumentChunk


class TripletExtractionService:
    """地聚物三元组提取服务"""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.graph_service = GraphService()
        
        # 获取知识图谱专用模型配置
        try:
            import os
            from core.config_optimized import optimized_config_manager
            
            # 首先尝试从环境变量获取知识图谱专用模型
            kg_default_model = os.getenv('KNOWLEDGE_GRAPH_DEFAULT_MODEL', 'gpt-4o-mini')
            kg_model_priority = os.getenv('KNOWLEDGE_GRAPH_MODEL_PRIORITY', 'gpt-4o-mini,gemini-2.5-flash-preview-nothinking,gemini-2.5-flash-preview-thinking')
            
            # 解析优先级列表
            priority_models = [model.strip() for model in kg_model_priority.split(',')]
            
            # 获取系统可用模型
            llm_config = optimized_config_manager.get_llm_models_config()
            all_models = llm_config.get('all_models', [])
            
            logger.info(f"知识图谱模型配置 - 默认: {kg_default_model}, 优先级: {priority_models}")
            
            # 按优先级查找可用模型
            selected_model = None
            for preferred in priority_models:
                if preferred in all_models:
                    selected_model = preferred
                    logger.info(f"找到适合的知识图谱模型: {preferred}")
                    break
                    
            # 如果优先级列表中没有可用模型，使用默认模型
            if not selected_model:
                if kg_default_model in all_models:
                    selected_model = kg_default_model
                    logger.info(f"使用知识图谱默认模型: {kg_default_model}")
                else:
                    # 最后尝试从可用模型中选择轻量级模型
                    lightweight_models = ['gpt-4o-mini', 'gemini-2.5-flash-preview-nothinking']
                    for model in lightweight_models:
                        if model in all_models:
                            selected_model = model
                            logger.warning(f"使用备用轻量级模型: {model}")
                            break
            
            # 最后的fallback
            self.default_model = selected_model or kg_default_model
            self.chunk_size = 2000  # 三元组提取优化的块大小
            
            # 从环境变量读取并发配置
            self.max_concurrent = int(os.getenv('TRIPLET_EXTRACTION_MAX_CONCURRENT', '3'))
            self.batch_size = int(os.getenv('TRIPLET_EXTRACTION_BATCH_SIZE', '3'))
            self.extraction_timeout = int(os.getenv('TRIPLET_EXTRACTION_TIMEOUT', '60'))
            self.debug_enabled = os.getenv('TRIPLET_EXTRACTION_DEBUG', 'true').lower() == 'true'
            self.max_retries = int(os.getenv('TRIPLET_EXTRACTION_MAX_RETRIES', '2'))
            
            logger.info(f"知识图谱三元组提取服务配置 - 专用模型: {self.default_model}, 块大小: {self.chunk_size}")
            logger.info(f"并发配置 - 最大并发: {self.max_concurrent}, 批次大小: {self.batch_size}, 超时: {self.extraction_timeout}s")
            logger.info(f"调试模式: {self.debug_enabled}, 最大重试: {self.max_retries}")
        except Exception as e:
            logger.error(f"获取知识图谱模型配置失败: {e}")
            # 设置默认值
            import os
            self.default_model = os.getenv('KNOWLEDGE_GRAPH_DEFAULT_MODEL', 'gpt-4o-mini')
            self.max_concurrent = int(os.getenv('TRIPLET_EXTRACTION_MAX_CONCURRENT', '3'))
            self.batch_size = int(os.getenv('TRIPLET_EXTRACTION_BATCH_SIZE', '3'))
            self.extraction_timeout = int(os.getenv('TRIPLET_EXTRACTION_TIMEOUT', '60'))
            self.debug_enabled = os.getenv('TRIPLET_EXTRACTION_DEBUG', 'true').lower() == 'true'
            self.max_retries = int(os.getenv('TRIPLET_EXTRACTION_MAX_RETRIES', '2'))
            logger.warning(f"使用知识图谱默认配置 - 模型: {self.default_model}")
        
        # 实体类型映射到ArangoDB集合
        self.entity_type_mapping = {
            "material": "materials",
            "chemical_compound": "entities",
            "property": "concepts",
            "process": "concepts",
            "structure": "concepts",
            "equipment": "entities",
            "test_method": "concepts",
            "application": "concepts",
            "parameter": "concepts",
            "researcher": "entities",
            "location": "entities",
            "paper": "papers"
        }
        
        # 关系类型映射到ArangoDB边集合
        self.relation_type_mapping = {
            "chemical_activation": "relationships",
            "synthesis": "relationships",
            "mechanical_property": "relationships",
            "characterization": "relationships",
            "property_correlation": "relationships",
            "process_parameter": "relationships",
            "composition": "contains",
            "material_property": "relationships",
            "application_requirement": "relationships"
        }
    
    async def extract_triplets_from_document(
        self, 
        document: Document,
        chunks: List[DocumentChunk] = None,
        use_streaming: bool = True,
        session_id: str = None
    ) -> Dict[str, Any]:
        """从文档中提取三元组"""
        try:
            logger.info(f"开始从文档 {document.id} 提取三元组, session_id: {session_id}")
            
            # 检查SSE连接状态
            if session_id:
                from api.routes import unified_sse_manager
                if session_id in unified_sse_manager.connections:
                    logger.info(f"📡 SSE会话存在: {session_id}, 连接数: {len(unified_sse_manager.connections[session_id])}")
                else:
                    logger.warning(f"📡 SSE会话不存在: {session_id}, 当前活跃会话: {list(unified_sse_manager.connections.keys())}")
            
            # 发送开始提取的SSE消息
            if session_id:
                await self._send_progress_update(session_id, document.id, {
                    "stage": "文档分段",
                    "progress": 0,
                    "detail": "开始分析文档内容",
                    "status": "processing"
                })
            
            if chunks is None:
                # 如果没有提供chunks，从存储服务读取文档内容
                text_content = await self._get_document_content(document)
                if not text_content:
                    raise ValueError(f"无法获取文档内容: {document.id}")
            else:
                # 合并chunks内容
                text_content = "\n\n".join([chunk.content for chunk in chunks])
            
            # 从配置获取块大小，优化三元组提取效率
            chunk_size = getattr(self, 'chunk_size', 2000)  # 默认使用2000以提高效率
            text_chunks = self._split_text_into_chunks(text_content, max_chunk_size=chunk_size)
            
            # 发送分段完成的SSE消息
            if session_id:
                await self._send_progress_update(session_id, document.id, {
                    "stage": "文档分段",
                    "progress": 100,
                    "detail": f"文档分割为 {len(text_chunks)} 个段落",
                    "status": "processing"
                })
                
            # 发送实体提取开始阶段
            if session_id:
                await self._send_progress_update(session_id, document.id, {
                    "stage": "实体提取",
                    "progress": 0,
                    "detail": f"开始从 {len(text_chunks)} 个文档块中提取实体和关系",
                    "status": "processing"
                })
            
            all_entities = {}
            all_relationships = []
            all_keywords = []
            
            # 并发处理配置（从环境变量读取）
            max_concurrent = min(self.max_concurrent, len(text_chunks))
            logger.info(f"开始并发处理 {len(text_chunks)} 个文档块，最大并发数: {max_concurrent} (配置: {self.max_concurrent})")
            
            # 创建并发任务
            async def process_chunk_with_progress(i, chunk_text):
                """处理单个文档块并发送进度"""
                try:
                    logger.info(f"开始处理文档块 {i+1}/{len(text_chunks)}")
                    extraction_result = await self._extract_entities_and_relations(
                        chunk_text, 
                        use_streaming=use_streaming
                    )
                    
                    logger.info(f"文档块 {i+1} 处理完成: {len(extraction_result['entities'])} 个实体, {len(extraction_result['relationships'])} 个关系")
                    return i, extraction_result
                    
                except Exception as e:
                    logger.warning(f"处理文档块 {i+1} 失败: {e}")
                    return i, None
            
            # 分批并发处理（使用配置的批次大小）
            all_results = []
            batch_size = min(max_concurrent, self.batch_size)
            for batch_start in range(0, len(text_chunks), batch_size):
                batch_end = min(batch_start + batch_size, len(text_chunks))
                batch_tasks = [
                    process_chunk_with_progress(i, text_chunks[i]) 
                    for i in range(batch_start, batch_end)
                ]
                
                logger.info(f"处理批次 {batch_start+1}-{batch_end}/{len(text_chunks)}")
                batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
                all_results.extend(batch_results)
                
                # 发送批次进度
                if session_id:
                    completed_chunks = min(batch_end, len(text_chunks))
                    progress = int((completed_chunks / len(text_chunks)) * 90)  # 留10%给后处理
                    await self._send_progress_update(session_id, document.id, {
                        "stage": "实体提取",
                        "progress": progress,
                        "detail": f"已完成 {completed_chunks}/{len(text_chunks)} 个文档块的并发处理",
                        "status": "processing"
                    })
            
            # 合并所有结果并实时发送统计更新
            successful_chunks = 0
            for i, result in all_results:
                if isinstance(result, Exception):
                    logger.warning(f"文档块 {i+1} 处理异常: {result}")
                    continue
                
                if result is None:
                    continue
                    
                successful_chunks += 1
                
                # 合并结果
                self._merge_extraction_results(
                    all_entities, 
                    all_relationships, 
                    all_keywords,
                    result
                )
                
                # 实时发送累积统计到前端
                if session_id and successful_chunks % 3 == 0:  # 每处理3个块发送一次更新
                    current_progress = int((successful_chunks / len(text_chunks)) * 90)
                    await self._send_progress_update(session_id, document.id, {
                        "stage": "实体提取",
                        "progress": current_progress,
                        "detail": f"累积提取进度: {len(all_entities)} 个实体, {len(all_relationships)} 个关系",
                        "status": "processing",
                        "statistics": {
                            "chunksProcessed": successful_chunks,
                            "totalChunks": len(text_chunks),
                            "entitiesExtracted": len(all_entities),
                            "relationshipsExtracted": len(all_relationships),
                            "keywordsExtracted": len(all_keywords)
                        }
                    })
            
            logger.info(f"并发处理完成: {successful_chunks}/{len(text_chunks)} 个文档块成功处理")
            
            # 实体提取完成，开始后处理
            if session_id:
                await self._send_progress_update(session_id, document.id, {
                    "stage": "实体提取",
                    "progress": 100,
                    "detail": f"提取完成：{len(all_entities)} 个实体，{len(all_relationships)} 个关系",
                    "status": "processing",
                    "statistics": {
                        "chunksProcessed": successful_chunks,
                        "totalChunks": len(text_chunks),
                        "entitiesExtracted": len(all_entities),
                        "relationshipsExtracted": len(all_relationships),
                        "keywordsExtracted": len(all_keywords)
                    }
                })
                
            # 发送后处理阶段开始
            if session_id:
                await self._send_progress_update(session_id, document.id, {
                    "stage": "数据后处理",
                    "progress": 0,
                    "detail": "开始对实体和关系进行清洗和优化",
                    "status": "processing"
                })
            
            # 后处理和优化
            processed_entities = await self._post_process_entities(all_entities)
            processed_relationships = self._post_process_relationships(all_relationships, processed_entities)
            
            # 发送后处理完成
            if session_id:
                await self._send_progress_update(session_id, document.id, {
                    "stage": "数据后处理",
                    "progress": 100,
                    "detail": f"后处理完成：{len(processed_entities)} 个实体，{len(processed_relationships)} 个关系",
                    "status": "processing",
                    "statistics": {
                        "chunksProcessed": len(text_chunks),
                        "totalChunks": len(text_chunks),
                        "entitiesExtracted": len(processed_entities),
                        "relationshipsExtracted": len(processed_relationships),
                        "keywordsExtracted": len(all_keywords)
                    }
                })
            
            # 发送图谱构建进度
            if session_id:
                await self._send_progress_update(session_id, document.id, {
                    "stage": "图谱构建",
                    "progress": 0,
                    "detail": f"开始构建图谱数据库结构...",
                    "status": "processing",
                    "statistics": {
                        "chunksProcessed": len(text_chunks),
                        "totalChunks": len(text_chunks),
                        "entitiesExtracted": len(processed_entities),
                        "relationshipsExtracted": len(processed_relationships),
                        "keywordsExtracted": len(all_keywords)
                    }
                })
            
            # 构建图谱数据
            graph_data = await self._build_graph_from_triplets(
                processed_entities,
                processed_relationships,
                document
            )
            
            # 发送构建完成进度
            if session_id:
                await self._send_progress_update(session_id, document.id, {
                    "stage": "图谱构建",
                    "progress": 100,
                    "detail": f"知识图谱构建完成，共 {len(processed_entities)} 个节点，{len(processed_relationships)} 个边",
                    "status": "completed",
                    "statistics": {
                        "chunksProcessed": len(text_chunks),
                        "totalChunks": len(text_chunks),
                        "entitiesExtracted": len(processed_entities),
                        "relationshipsExtracted": len(processed_relationships),
                        "keywordsExtracted": len(all_keywords)
                    }
                })
            
            result = {
                "document_id": document.id,
                "entities": processed_entities,
                "relationships": processed_relationships,
                "keywords": all_keywords,
                "graph_data": graph_data,
                "extraction_stats": {
                    "total_entities": len(processed_entities),
                    "total_relationships": len(processed_relationships),
                    "text_chunks_processed": len(text_chunks),
                    "extracted_at": datetime.utcnow().isoformat()
                }
            }
            
            logger.info(f"文档 {document.id} 三元组提取完成: {len(processed_entities)} 个实体, {len(processed_relationships)} 个关系")
            
            # 🔧 更新文档状态为已完成
            try:
                from db.database import get_async_session
                from db.repositories.knowledge_repository import KnowledgeRepository
                
                async with get_async_session() as db_session:
                    knowledge_repo = KnowledgeRepository(db_session)
                    await knowledge_repo.update_document_status(document.id, "graph_extracted")
                    logger.info(f"✅ 已更新文档 {document.id} 状态为 graph_extracted")
                    
            except Exception as status_error:
                logger.warning(f"⚠️ 更新文档状态失败: {status_error}")
            
            # 发送完成通知
            if session_id:
                await self._send_completion_update(session_id, document.id, {
                    "extraction_result": {
                        "entities_count": len(processed_entities),
                        "relationships_count": len(processed_relationships),
                        "entitiesExtracted": len(processed_entities),  # 兼容前端字段
                        "relationshipsExtracted": len(processed_relationships),  # 兼容前端字段
                        "keywordsExtracted": len(all_keywords),
                        "total_entities": len(processed_entities),
                        "total_relationships": len(processed_relationships)
                    },
                    "graph_build_result": graph_data.get("stats", {}),
                    "document_id": document.id,
                    "document_status": "graph_extracted"  # 通知前端状态变更
                })
            
            return result
            
        except Exception as e:
            logger.error(f"文档 {document.id} 三元组提取失败: {e}")
            
            # 发送失败通知
            if session_id:
                await self._send_failure_update(session_id, document.id, {
                    "error_message": str(e),
                    "error_type": "extraction_error"
                })
            
            raise
    
    async def _extract_entities_and_relations(
        self, 
        text: str, 
        use_streaming: bool = True,
        max_retries: int = None
    ) -> Dict[str, Any]:
        """从文本中提取实体和关系"""
        
        # 准备提示词
        # 将实体类型字典展平为列表
        entity_types_list = []
        for category, types in GEOPOLYMER_ENTITY_TYPES.items():
            entity_types_list.extend(types)
        
        prompt = GEOPOLYMER_PROMPTS["entity_extraction"].format(
            language=GEOPOLYMER_PROMPTS["DEFAULT_LANGUAGE"],
            entity_types=", ".join(entity_types_list),
            relationship_types=", ".join(GEOPOLYMER_RELATIONSHIP_TYPES),
            tuple_delimiter=GEOPOLYMER_TUPLE_DELIMITER,
            record_delimiter=GEOPOLYMER_RECORD_DELIMITER,
            completion_delimiter=GEOPOLYMER_COMPLETION_DELIMITER,
            examples="\n".join(GEOPOLYMER_PROMPTS["entity_extraction_examples"]),
            input_text=text
        )
        
        # 使用配置的重试次数
        max_retries = max_retries if max_retries is not None else self.max_retries
        for attempt in range(max_retries + 1):
            try:
                # 直接调用网关API进行三元组提取
                full_response = await self._call_gateway_for_extraction(prompt)
                
                # 调试：记录LLM的原始输出（如果启用调试模式）
                if self.debug_enabled:
                    logger.info(f"📝 LLM原始输出长度: {len(full_response)} 字符")
                    logger.info(f"📝 LLM输出前500字符: {full_response[:500]}")
                    if "relationship" in full_response.lower():
                        logger.info(f"📝 输出包含relationship关键词")
                    else:
                        logger.warning(f"⚠️  输出不包含relationship关键词")
                
                # 解析提取结果
                parsed_result = self._parse_extraction_response(full_response)
                logger.info(f"📊 解析结果: {len(parsed_result['entities'])} 个实体, {len(parsed_result['relationships'])} 个关系")
                
                # 如果提取结果不完整，尝试继续提取
                if self._should_continue_extraction(parsed_result):
                    additional_result = await self._continue_extraction(text, parsed_result)
                    self._merge_parsed_results(parsed_result, additional_result)
                
                return parsed_result
                
            except ValueError as e:
                error_msg = str(e)
                logger.warning(f"提取尝试 {attempt + 1} 失败: {error_msg}")
                
                # 对于超时错误，使用更长的等待时间
                if "响应超时" in error_msg or "ReadTimeout" in error_msg:
                    wait_time = (attempt + 1) * 5  # 5, 10, 15秒递增等待
                    logger.info(f"网络超时，等待 {wait_time} 秒后重试...")
                    await asyncio.sleep(wait_time)
                elif "网络连接异常" in error_msg:
                    wait_time = (attempt + 1) * 3  # 3, 6, 9秒递增等待
                    logger.info(f"网络连接异常，等待 {wait_time} 秒后重试...")
                    await asyncio.sleep(wait_time)
                else:
                    await asyncio.sleep(1)  # 其他错误等待1秒
                
                if attempt == max_retries:
                    raise
                    
            except Exception as e:
                logger.warning(f"提取尝试 {attempt + 1} 失败: {e}")
                logger.exception(f"完整错误信息:")  # 添加完整的异常堆栈信息
                if attempt == max_retries:
                    raise
                await asyncio.sleep(1)  # 重试前等待
    
    def _parse_extraction_response(self, response: str) -> Dict[str, Any]:
        """解析LLM的提取响应"""
        entities = {}
        relationships = []
        keywords = []
        
        try:
            # 分割记录
            records = response.split(GEOPOLYMER_RECORD_DELIMITER)
            
            for record in records:
                record = record.strip()
                if not record:
                    continue
                
                # 解析实体
                if record.startswith('("entity"'):
                    entity = self._parse_entity_record(record)
                    if entity:
                        entities[entity["name"]] = entity
                
                # 解析关系
                elif record.startswith('("relationship"'):
                    relationship = self._parse_relationship_record(record)
                    if relationship:
                        relationships.append(relationship)
                
                # 解析关键词
                elif record.startswith('("content_keywords"'):
                    keywords_text = self._parse_keywords_record(record)
                    if keywords_text:
                        keywords.extend([kw.strip() for kw in keywords_text.split(",")])
        
        except Exception as e:
            logger.error(f"解析提取响应失败: {e}")
        
        return {
            "entities": entities,
            "relationships": relationships,
            "keywords": keywords
        }
    
    def _parse_entity_record(self, record: str) -> Optional[Dict[str, Any]]:
        """解析实体记录"""
        try:
            # 使用正则表达式提取实体信息
            pattern = r'\("entity"' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r'([^' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r']+)' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r'([^' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r']+)' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r'([^)]+)\)'
            
            match = re.search(pattern, record)
            if match:
                name = match.group(1).strip().strip('"')
                entity_type = match.group(2).strip().strip('"')
                description = match.group(3).strip().strip('"')
                
                return {
                    "name": name,
                    "type": entity_type,
                    "description": description,
                    "id": str(uuid.uuid4())
                }
        except Exception as e:
            logger.warning(f"解析实体记录失败: {record[:100]}... 错误: {e}")
        
        return None
    
    def _parse_relationship_record(self, record: str) -> Optional[Dict[str, Any]]:
        """解析关系记录"""
        try:
            # 使用正则表达式提取关系信息（4字段格式：source_entity, target_entity, relationship_type, evidence）
            pattern = r'\("relationship"' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r'([^' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r']+)' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r'([^' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r']+)' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r'([^' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r']+)' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r'([^)]+)\)'
            
            match = re.search(pattern, record)
            if match:
                source = match.group(1).strip().strip('"')
                target = match.group(2).strip().strip('"')
                relationship_type = match.group(3).strip().strip('"')
                evidence = match.group(4).strip().strip('"')
                
                return {
                    "source": source,
                    "target": target,
                    "type": relationship_type,
                    "evidence": evidence,
                    "id": str(uuid.uuid4())
                }
        except Exception as e:
            logger.warning(f"解析关系记录失败: {record[:100]}... 错误: {e}")
        
        return None
    
    def _parse_keywords_record(self, record: str) -> Optional[str]:
        """解析关键词记录"""
        try:
            pattern = r'\("content_keywords"' + re.escape(GEOPOLYMER_TUPLE_DELIMITER) + r'([^)]+)\)'
            match = re.search(pattern, record)
            if match:
                return match.group(1).strip().strip('"')
        except Exception as e:
            logger.warning(f"解析关键词记录失败: {record[:100]}... 错误: {e}")
        
        return None
    
    def _should_continue_extraction(self, result: Dict[str, Any]) -> bool:
        """判断是否需要继续提取"""
        entities_count = len(result.get("entities", {}))
        relationships_count = len(result.get("relationships", []))
        
        # 如果实体或关系数量较少，可能还有遗漏
        return entities_count < 5 or relationships_count < 3
    
    async def _continue_extraction(
        self, 
        text: str, 
        previous_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """继续提取遗漏的实体和关系"""
        
        # 准备实体类型列表
        entity_types_list = []
        for category, types in GEOPOLYMER_ENTITY_TYPES.items():
            entity_types_list.extend(types)
        
        prompt = GEOPOLYMER_PROMPTS["entity_continue_extraction"].format(
            entity_types=", ".join(entity_types_list),
            relationship_types=", ".join(GEOPOLYMER_RELATIONSHIP_TYPES),
            tuple_delimiter=GEOPOLYMER_TUPLE_DELIMITER,
            record_delimiter=GEOPOLYMER_RECORD_DELIMITER,
            completion_delimiter=GEOPOLYMER_COMPLETION_DELIMITER,
            input_text=text
        )
        
        try:
            # 直接调用网关API进行继续提取
            full_response = await self._call_gateway_for_extraction(prompt)
            return self._parse_extraction_response(full_response)
        except Exception as e:
            logger.error(f"继续提取失败: {e}")
            return {"entities": {}, "relationships": [], "keywords": []}
    
    def _merge_extraction_results(
        self, 
        all_entities: Dict[str, Any], 
        all_relationships: List[Dict[str, Any]], 
        all_keywords: List[str],
        new_result: Dict[str, Any]
    ):
        """合并提取结果"""
        # 合并实体（去重）
        for name, entity in new_result.get("entities", {}).items():
            if name not in all_entities:
                all_entities[name] = entity
            else:
                # 如果实体已存在，合并描述
                existing_entity = all_entities[name]
                if len(entity["description"]) > len(existing_entity["description"]):
                    existing_entity["description"] = entity["description"]
        
        # 合并关系
        all_relationships.extend(new_result.get("relationships", []))
        
        # 合并关键词
        all_keywords.extend(new_result.get("keywords", []))
    
    def _merge_parsed_results(
        self, 
        base_result: Dict[str, Any], 
        additional_result: Dict[str, Any]
    ):
        """合并解析结果"""
        # 合并实体
        base_result["entities"].update(additional_result.get("entities", {}))
        
        # 合并关系
        base_result["relationships"].extend(additional_result.get("relationships", []))
        
        # 合并关键词
        base_result["keywords"].extend(additional_result.get("keywords", []))
    
    async def _post_process_entities(self, entities: Dict[str, Any]) -> List[Dict[str, Any]]:
        """后处理实体数据"""
        processed_entities = []
        
        for name, entity in entities.items():
            # 规范化实体类型
            normalized_type = self._normalize_entity_type(entity["type"])
            
            # 创建标准化的实体数据
            processed_entity = {
                "id": entity["id"],
                "name": name,
                "label": name,
                "type": normalized_type,
                "description": entity["description"],
                "properties": {
                    "original_type": entity["type"],
                    "confidence": 0.8,  # 默认置信度
                    "source": "llm_extraction"
                },
                "collection": self.entity_type_mapping.get(normalized_type, "entities")
            }
            
            processed_entities.append(processed_entity)
        
        return processed_entities
    
    def _post_process_relationships(
        self, 
        relationships: List[Dict[str, Any]], 
        entities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """后处理关系数据"""
        processed_relationships = []
        entity_name_to_id = {entity["name"]: entity["id"] for entity in entities}
        
        for rel in relationships:
            source_id = entity_name_to_id.get(rel["source"])
            target_id = entity_name_to_id.get(rel["target"])
            
            if source_id and target_id:
                # 使用提取的关系类型
                relation_type = rel.get("type", "UNKNOWN_RELATION")
                
                # 计算置信度（基于evidence长度和内容质量）
                evidence = rel.get("evidence", "")
                confidence = min(len(evidence) / 100.0, 1.0) if evidence else 0.5
                
                processed_relationship = {
                    "id": rel["id"],
                    "from_node_id": source_id,
                    "to_node_id": target_id,
                    "label": relation_type,  # 使用关系类型作为标签
                    "type": relation_type,
                    "properties": {
                        "evidence": evidence,
                        "confidence": confidence,
                        "source": "llm_extraction",
                        "relationship_type": relation_type
                    },
                    "weight": confidence,
                    "confidence": confidence,
                    "collection": self.relation_type_mapping.get(relation_type, "relationships")
                }
                
                processed_relationships.append(processed_relationship)
        
        return processed_relationships
    
    def _normalize_entity_type(self, entity_type: str) -> str:
        """规范化实体类型"""
        entity_type = entity_type.lower().strip()
        
        # 映射规则
        type_mapping = {
            "compound": "chemical_compound",
            "chemical": "chemical_compound",
            "method": "test_method",
            "testing": "test_method",
            "technique": "test_method"
        }
        
        return type_mapping.get(entity_type, entity_type)
    
    def _determine_relation_type(self, keywords: str) -> str:
        """根据关键词确定关系类型"""
        keywords_lower = keywords.lower()
        
        # 关系类型映射规则
        if "synthesis" in keywords_lower or "activation" in keywords_lower:
            return "synthesis"
        elif "property" in keywords_lower or "mechanical" in keywords_lower:
            return "mechanical_property"
        elif "characterization" in keywords_lower or "analysis" in keywords_lower:
            return "characterization"
        elif "correlation" in keywords_lower:
            return "property_correlation"
        elif "parameter" in keywords_lower or "process" in keywords_lower:
            return "process_parameter"
        elif "composition" in keywords_lower:
            return "composition"
        elif "application" in keywords_lower:
            return "application_requirement"
        else:
            return "relationship"
    
    async def _build_graph_from_triplets(
        self, 
        entities: List[Dict[str, Any]], 
        relationships: List[Dict[str, Any]],
        document: Document
    ) -> Dict[str, Any]:
        """从三元组构建图谱数据"""
        try:
            # 转换实体数据格式以适配GraphNode模型
            formatted_entities = []
            for entity in entities:
                formatted_entity = {
                    "id": entity.get('id', str(uuid.uuid4())),
                    "label": entity.get('name', entity.get('label', '')),  # 优先使用name，回退到label
                    "type": entity.get('type', 'entity').lower(),
                    "properties": {
                        "description": entity.get('description', ''),
                        "confidence": entity.get('confidence', 0.0),
                        "source_documents": entity.get('source_documents', [document.id])
                    },
                    "source_document_id": document.id,
                    "created_at": datetime.utcnow()
                }
                formatted_entities.append(formatted_entity)
            
            # 创建节点（先创建节点以获取ID）
            created_nodes = await self.graph_service.create_nodes_batch(formatted_entities)
            
            # 🔧 创建实体名称到ID的映射字典
            entity_name_to_id = {}
            for node in created_nodes:
                if isinstance(node, dict):
                    # 使用label作为键，因为这是实体的显示名称
                    entity_name = node.get('label', '')
                    entity_id = node.get('id', '')
                    if entity_name and entity_id:
                        entity_name_to_id[entity_name] = entity_id
                        # 也添加小写版本以提高匹配率
                        entity_name_to_id[entity_name.lower()] = entity_id
            
            logger.info(f"🔧 实体名称映射: {len(entity_name_to_id)} 个映射 = {list(entity_name_to_id.keys())[:5]}...")
            
            # 转换关系数据格式以适配GraphEdge模型（现在有实体ID映射了）
            formatted_relationships = []
            for relationship in relationships:
                # 🔧 从关系中获取实体名称并映射为ID
                source_name = relationship.get('source', '')
                target_name = relationship.get('target', '')
                
                # 尝试多种方式匹配实体名称到ID
                source_id = None
                target_id = None
                
                # 精确匹配
                if source_name in entity_name_to_id:
                    source_id = entity_name_to_id[source_name]
                elif source_name.lower() in entity_name_to_id:
                    source_id = entity_name_to_id[source_name.lower()]
                
                if target_name in entity_name_to_id:
                    target_id = entity_name_to_id[target_name]
                elif target_name.lower() in entity_name_to_id:
                    target_id = entity_name_to_id[target_name.lower()]
                
                # 如果没有找到精确匹配，尝试模糊匹配
                if not source_id:
                    for entity_name, entity_id in entity_name_to_id.items():
                        if source_name.lower() in entity_name.lower() or entity_name.lower() in source_name.lower():
                            source_id = entity_id
                            break
                
                if not target_id:
                    for entity_name, entity_id in entity_name_to_id.items():
                        if target_name.lower() in entity_name.lower() or entity_name.lower() in target_name.lower():
                            target_id = entity_id
                            break
                
                # 🔧 只有当两个实体ID都找到时才创建关系
                if source_id and target_id:
                    formatted_relationship = {
                        "from_node_id": source_id,
                        "to_node_id": target_id,
                        "label": relationship.get('type', relationship.get('label', '')),
                        "type": relationship.get('type', 'relationship'),
                        "properties": {
                            "evidence": relationship.get('evidence', ''),
                            "confidence": relationship.get('confidence', 0.0),
                            "source_documents": relationship.get('source_documents', [document.id]),
                            "source_entity_name": source_name,  # 保留原始实体名称用于调试
                            "target_entity_name": target_name
                        },
                        "weight": relationship.get('confidence', 1.0),
                        "source_document_id": document.id,
                        "created_at": datetime.utcnow()
                    }
                    formatted_relationships.append(formatted_relationship)
                else:
                    logger.warning(f"⚠️ 跳过关系 {source_name} -> {target_name}: 无法找到对应的实体ID (source_id={source_id}, target_id={target_id})")
            
            logger.info(f"🔧 成功映射 {len(formatted_relationships)}/{len(relationships)} 个关系")
            
            # 创建边（现在有正确的实体ID了）
            created_edges = await self.graph_service.create_edges_batch(formatted_relationships)
            
            return {
                "nodes": created_nodes,
                "edges": created_edges,
                "stats": {
                    "nodes_created": len(created_nodes),
                    "edges_created": len(created_edges)
                }
            }
            
        except Exception as e:
            logger.error(f"构建图谱数据失败: {e}")
            return {"nodes": [], "edges": [], "stats": {"nodes_created": 0, "edges_created": 0}}
    
    async def _call_gateway_for_extraction(self, prompt: str) -> str:
        """直接调用统一网关进行三元组提取"""
        try:
            # 获取网关配置
            from core.config_optimized import optimized_config_manager
            import httpx
            
            gateway_config = optimized_config_manager.get_unified_gateway_config()
            base_url = gateway_config['base_url']
            api_key = gateway_config['api_key']
            
            # 构建请求
            url = f"{base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            # 三元组提取优化参数：低温度、限制输出长度
            payload = {
                "model": self.default_model,
                "messages": [
                    {
                        "role": "system",
                        "content": "你是一个专业的知识提取助手，专门从科学文献中提取实体和关系。请严格按照要求的格式输出，不要添加额外的解释或分析。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.05,  # 更低温度提高一致性
                "max_tokens": 3000,   # 限制输出长度提高速度
                "top_p": 0.9,         # 控制输出随机性
                "stream": False
            }
            
            logger.info(f"调用网关进行三元组提取: {url}")
            logger.info(f"使用模型: {self.default_model}")
            
            # 发送请求 - 使用配置的超时时间
            timeout_config = httpx.Timeout(self.extraction_timeout, connect=30.0)
            async with httpx.AsyncClient(timeout=timeout_config) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                
                result = response.json()
                
                # 提取回复内容
                if 'choices' in result and len(result['choices']) > 0:
                    content = result['choices'][0]['message']['content']
                    return content.strip()
                else:
                    raise ValueError(f"网关响应格式异常: {result}")
                    
        except httpx.ReadTimeout as e:
            logger.error(f"网关请求超时 (120s): {e}")
            raise ValueError(f"LLM服务响应超时，请稍后重试")
        except httpx.RequestError as e:
            logger.error(f"网关请求错误: {e}")
            raise ValueError(f"网络连接异常: {str(e)}")
        except Exception as e:
            logger.error(f"调用网关进行三元组提取失败: {e}")
            raise ValueError(f"三元组提取服务异常: {str(e)}")

    def _split_text_into_chunks(self, text: str, max_chunk_size: int = 4000) -> List[str]:
        """将长文本分割成块"""
        if len(text) <= max_chunk_size:
            return [text]
        
        chunks = []
        sentences = text.split('. ')
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) + 2 <= max_chunk_size:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    async def _send_progress_update(self, session_id: str, document_id: str, progress_data: dict):
        """发送进度更新到SSE"""
        if not session_id:
            logger.warning("📡 跳过SSE进度更新：未提供session_id")
            return
            
        try:
            # 导入SSE管理器
            from api.routes import unified_sse_manager
            
            # 检查会话是否存在
            if session_id not in unified_sse_manager.connections:
                logger.warning(f"📡 SSE会话不存在，等待前端连接: {session_id}")
                logger.warning(f"📡 当前活跃会话: {list(unified_sse_manager.connections.keys())}")
                # 不直接创建连接，等待前端主动连接
                return
                
            logger.info(f"📡 发送知识图谱进度更新: session={session_id}, doc={document_id}, stage={progress_data.get('stage')}, progress={progress_data.get('progress')}%")
            
            await unified_sse_manager.broadcast_graph_extraction_progress(
                session_id, document_id, progress_data
            )
            logger.info(f"📡 ✅ 成功发送进度更新: {progress_data.get('stage', '')}: {progress_data.get('progress', 0)}%")
        except Exception as e:
            logger.error(f"📡 ❌ 发送SSE进度更新失败: {e}")
            import traceback
            logger.error(traceback.format_exc())
    
    async def _send_completion_update(self, session_id: str, document_id: str, result_data: dict):
        """发送完成通知到SSE"""
        if not session_id:
            return
            
        try:
            from api.routes import unified_sse_manager
            if session_id in unified_sse_manager.connections:
                await unified_sse_manager.broadcast_graph_extraction_completed(
                    session_id, document_id, result_data
                )
                logger.info(f"📡 已发送完成通知: {session_id}")
            else:
                logger.warning(f"📡 SSE会话不存在，无法发送完成通知: {session_id}")
        except Exception as e:
            logger.warning(f"📡 发送SSE完成通知失败: {e}")
    
    async def _send_failure_update(self, session_id: str, document_id: str, error_data: dict):
        """发送失败通知到SSE"""
        if not session_id:
            return
            
        try:
            from api.routes import unified_sse_manager
            if session_id in unified_sse_manager.connections:
                await unified_sse_manager.broadcast_graph_extraction_failed(
                    session_id, document_id, error_data
                )
                logger.info(f"📡 已发送失败通知: {session_id}")
            else:
                logger.warning(f"📡 SSE会话不存在，无法发送失败通知: {session_id}")
        except Exception as e:
            logger.warning(f"📡 发送SSE失败通知失败: {e}")
    
    async def _get_document_content(self, document) -> str:
        """从存储服务获取文档内容"""
        try:
            # 导入存储服务
            from service.storage_service import storage_service
            
            if not document.file_path:
                raise ValueError(f"文档 {document.id} 没有文件路径")
            
            # 根据文档标签确定存储桶  
            bucket_name = "mat-qa-knowledge-graph"  # 知识图谱专用存储桶
            if hasattr(document, 'tags') and document.tags:
                if isinstance(document.tags, list) and "knowledge_graph" in document.tags:
                    bucket_name = "mat-qa-knowledge-graph"
                elif isinstance(document.tags, str) and "knowledge_graph" in document.tags:
                    bucket_name = "mat-qa-knowledge-graph"
            
            # 从存储服务获取文件内容
            file_content = await storage_service.get_file(bucket_name, document.file_path)
            
            if not file_content:
                raise ValueError(f"无法从存储服务获取文件内容: {document.file_path}")
            
            # 根据文件类型解析内容
            file_extension = document.file_type.lower()
            
            if file_extension in ['txt', 'md']:
                # 纯文本文件
                text_content = file_content.decode('utf-8')
            elif file_extension == 'pdf':
                # PDF文件需要解析
                text_content = await self._extract_pdf_content(file_content)
            elif file_extension in ['doc', 'docx']:
                # Word文档需要解析
                text_content = await self._extract_word_content(file_content)
            elif file_extension == 'html':
                # HTML文件需要解析
                text_content = await self._extract_html_content(file_content)
            else:
                # 尝试按UTF-8解码
                try:
                    text_content = file_content.decode('utf-8')
                except UnicodeDecodeError:
                    raise ValueError(f"不支持的文件类型或编码: {file_extension}")
            
            if not text_content.strip():
                raise ValueError(f"文档内容为空: {document.id}")
            
            logger.info(f"成功获取文档内容: {document.id}, 长度: {len(text_content)}")
            return text_content
            
        except Exception as e:
            logger.error(f"获取文档内容失败 {document.id}: {e}")
            raise
    
    async def _extract_pdf_content(self, file_content: bytes) -> str:
        """提取PDF文档内容"""
        try:
            import PyPDF2
            import io
            
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            text_content = ""
            
            for page in pdf_reader.pages:
                text_content += page.extract_text() + "\n"
            
            return text_content.strip()
        except ImportError:
            logger.warning("PyPDF2未安装，无法解析PDF文件")
            raise ValueError("PDF解析库未安装")
        except Exception as e:
            logger.error(f"PDF内容提取失败: {e}")
            raise ValueError(f"PDF内容提取失败: {str(e)}")
    
    async def _extract_word_content(self, file_content: bytes) -> str:
        """提取Word文档内容"""
        try:
            import docx
            import io
            
            doc = docx.Document(io.BytesIO(file_content))
            text_content = ""
            
            for paragraph in doc.paragraphs:
                text_content += paragraph.text + "\n"
            
            return text_content.strip()
        except ImportError:
            logger.warning("python-docx未安装，无法解析Word文件")
            raise ValueError("Word解析库未安装")
        except Exception as e:
            logger.error(f"Word内容提取失败: {e}")
            raise ValueError(f"Word内容提取失败: {str(e)}")
    
    async def _extract_html_content(self, file_content: bytes) -> str:
        """提取HTML文档内容"""
        try:
            from bs4 import BeautifulSoup
            
            soup = BeautifulSoup(file_content.decode('utf-8'), 'html.parser')
            # 移除脚本和样式元素
            for script in soup(["script", "style"]):
                script.decompose()
            
            text_content = soup.get_text()
            # 清理多余的空白
            lines = (line.strip() for line in text_content.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text_content = ' '.join(chunk for chunk in chunks if chunk)
            
            return text_content
        except ImportError:
            logger.warning("beautifulsoup4未安装，无法解析HTML文件")
            raise ValueError("HTML解析库未安装")
        except Exception as e:
            logger.error(f"HTML内容提取失败: {e}")
            raise ValueError(f"HTML内容提取失败: {str(e)}")
    
    async def extract_keywords_from_query(self, query: str, history: str = "") -> Dict[str, List[str]]:
        """从查询中提取关键词"""
        prompt = GEOPOLYMER_PROMPTS["keywords_extraction"].format(
            examples="\n".join(GEOPOLYMER_PROMPTS["keywords_extraction_examples"]),
            history=history,
            query=query
        )
        
        try:
            # 直接调用网关API进行关键词提取
            content = await self._call_gateway_for_extraction(prompt)
            if not content:
                content = "{}"
            
            # 解析JSON响应
            keywords_data = json.loads(content)
            return keywords_data
            
        except Exception as e:
            logger.error(f"关键词提取失败: {e}")
            return {"high_level_keywords": [], "low_level_keywords": []}


# 创建全局服务实例
triplet_extraction_service = TripletExtractionService() 