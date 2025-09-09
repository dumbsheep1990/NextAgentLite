"""
通用材料科学三元组提取服务
基于多篇论文分析设计的通用提取系统，覆盖所有材料科学场景
"""

import asyncio
import re
import json
from typing import List, Dict, Any, Tuple, Optional, Union
from datetime import datetime

from core.logger import logger
from service.triplet_extraction_service import TripletExtractionService
from service.universal_materials_prompts import (
    UNIVERSAL_MATERIALS_EXTRACTION_PROMPT,
    UNIVERSAL_QA_EXTRACTION_PROMPT,
    UNIVERSAL_MATERIALS_ENTITY_HIERARCHY,
    UNIVERSAL_MATERIALS_RELATIONSHIPS,
    ADAPTIVE_EXTRACTION_CONFIG,
    get_universal_entity_list,
    get_universal_relationship_list,
    get_adaptive_config
)
from service.enhanced_materials_extraction import (
    enhanced_extraction_service,
    ExtractedEntity,
    ExtractedRelation
)


class UniversalTripletExtractionService(TripletExtractionService):
    """通用材料科学三元组提取服务"""
    
    def __init__(self):
        super().__init__()
        self.universal_entities = get_universal_entity_list()
        self.universal_relationships = get_universal_relationship_list()
        
        # 材料领域关键词映射，用于自动识别论文类型
        self.domain_keywords = {
            "geopolymer": [
                "geopolymer", "alkali-activated", "fly ash", "slag", "metakaolin", 
                "sodium hydroxide", "sodium silicate", "activator", "precursor"
            ],
            "composite": [
                "composite", "fiber", "reinforcement", "matrix", "interface",
                "laminate", "hybrid", "reinforced", "fiber-reinforced"
            ],
            "cement": [
                "cement", "concrete", "mortar", "hydration", "portland cement",
                "paste", "aggregate", "admixture", "curing"
            ],
            "ceramic": [
                "ceramic", "sintering", "mullite", "alumina", "zirconia",
                "firing", "kiln", "crystalline", "glaze"
            ],
            "polymer": [
                "polymer", "polymerization", "resin", "plastic", "elastomer",
                "thermoplastic", "thermoset", "crosslinking"
            ],
            "metal": [
                "metal", "alloy", "steel", "aluminum", "corrosion",
                "welding", "forging", "casting", "heat treatment"
            ]
        }
    
    async def extract_from_universal_document(
        self,
        document_content: str,
        document_type: str = "md",
        auto_detect_domain: bool = True,
        specified_domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        通用文档三元组提取
        
        Args:
            document_content: 文档内容
            document_type: 文档类型 ("md", "qa", "pdf")
            auto_detect_domain: 是否自动检测材料领域
            specified_domain: 指定的材料领域
        """
        
        try:
            logger.info(f"开始通用三元组提取 - 文档类型: {document_type}")
            
            # 检测材料领域
            detected_domain = None
            if auto_detect_domain:
                detected_domain = self._detect_material_domain(document_content)
                logger.info(f"检测到材料领域: {detected_domain}")
            
            material_domain = specified_domain or detected_domain
            
            # 获取自适应配置
            config = get_adaptive_config(document_type, material_domain)
            
            # 预处理文档
            processed_content = self._preprocess_document(document_content, document_type)
            
            # 分块处理
            chunks = self._split_document_adaptive(processed_content, config)
            
            # 并行提取
            extraction_tasks = []
            for i, chunk in enumerate(chunks):
                task = self._extract_from_chunk(
                    chunk, 
                    document_type, 
                    material_domain, 
                    chunk_id=i
                )
                extraction_tasks.append(task)
            
            # 等待所有提取完成
            chunk_results = await asyncio.gather(*extraction_tasks, return_exceptions=True)
            
            # 合并结果
            merged_results = self._merge_chunk_results(chunk_results, material_domain)
            
            # 保存原始文本用于增强提取
            merged_results["original_text"] = processed_content
            
            # 后处理优化
            final_results = self._post_process_universal_results(
                merged_results, 
                material_domain,
                document_type
            )
            
            logger.info(f"""通用提取完成 - 
                实体: {len(final_results.get('entities', []))}, 
                关系: {len(final_results.get('relationships', []))},
                领域: {material_domain}""")
            
            return final_results
            
        except Exception as e:
            logger.error(f"通用三元组提取失败: {e}")
            # 回退到基础提取
            return await super().extract_triplets_from_text(document_content)
    
    async def extract_triplets_from_document(
        self, 
        document,
        chunks = None,
        use_streaming: bool = True,
        session_id: str = None
    ) -> Dict[str, Any]:
        """
        重写父类方法，统一使用增强提取策略
        - 支持streaming和非streaming模式
        - 保持进度更新兼容性
        """
        try:
            logger.info(f"🚀 增强三元组提取 - 文档: {document.id}, streaming: {use_streaming}")
            
            # 🔧 从存储服务获取文档内容
            document_content = None
            try:
                # KnowledgeDocument对象没有content属性，需要从存储服务获取
                document_content = await self._get_document_content(document)
                logger.info(f"📖 成功获取文档内容，长度: {len(document_content)} 字符")
            except Exception as content_error:
                logger.error(f"❌ 无法获取文档内容: {content_error}")
                return {"entities": [], "relationships": [], "quantitative": []}
                    
            if not document_content:
                logger.warning(f"⚠️ 文档 {document.id} 内容为空")
                return {"entities": [], "relationships": [], "quantitative": []}
            
            # 🔧 为streaming模式添加进度更新支持
            if use_streaming and session_id:
                # 发送开始通知
                await self._send_progress_update(session_id, document.id, {
                    "stage": "增强提取开始",
                    "progress": 10,
                    "detail": "开始使用增强算法提取实体和关系",
                    "status": "processing"
                })
                
            # 🔧 使用增强的通用提取方法（支持所有模式）
            if use_streaming and session_id:
                # 发送提取中通知
                await self._send_progress_update(session_id, document.id, {
                    "stage": "智能提取中",
                    "progress": 50,
                    "detail": "正在使用增强算法进行深度提取",
                    "status": "processing"
                })
            
            result = await self.extract_from_universal_document(
                document_content=document_content,
                document_type="md",
                auto_detect_domain=True
            )
            
            logger.info(f"✅ 增强提取完成 - 实体: {len(result.get('entities', []))}, 关系: {len(result.get('relationships', []))}")
            
            # 🔧 构建知识图谱（这是关键的缺失步骤！）
            if result.get('entities') or result.get('relationships'):
                if use_streaming and session_id:
                    await self._send_progress_update(session_id, document.id, {
                        "stage": "构建知识图谱",
                        "progress": 80,
                        "detail": "正在将提取的实体和关系构建为知识图谱",
                        "status": "processing"
                    })
                
                try:
                    # 调用图谱构建方法（从父类继承）
                    graph_data = await self._build_graph_from_triplets(
                        result.get('entities', []),
                        result.get('relationships', []),
                        document
                    )
                    
                    # 更新结果中的图谱数据
                    result["graph_data"] = graph_data
                    logger.info(f"🎉 知识图谱构建完成: {graph_data.get('stats', {})}")
                    
                except Exception as graph_error:
                    logger.error(f"❌ 知识图谱构建失败: {graph_error}")
                    # 继续执行，不因图谱构建失败而中断整个流程
            
            # 🔧 为streaming模式发送完成通知
            if use_streaming and session_id:
                await self._send_progress_update(session_id, document.id, {
                    "stage": "增强提取完成",
                    "progress": 95,
                    "detail": f"增强提取完成：{len(result.get('entities', []))} 个实体，{len(result.get('relationships', []))} 个关系",
                    "status": "completed", 
                    "statistics": {
                        "chunksProcessed": result.get('extraction_stats', {}).get('total_chunks', 1),
                        "totalChunks": result.get('extraction_stats', {}).get('total_chunks', 1),
                        "entitiesExtracted": len(result.get('entities', [])),
                        "relationshipsExtracted": len(result.get('relationships', [])),
                        "keywordsExtracted": len(result.get('keywords', []))
                    }
                })
            
            # 🔧 更新文档状态为已完成知识图谱提取
            if hasattr(document, 'id') and document.id:
                try:
                    from db.database import get_async_session
                    from db.repositories.knowledge_repository import KnowledgeRepository
                    
                    async with get_async_session() as db_session:
                        knowledge_repo = KnowledgeRepository(db_session)
                        await knowledge_repo.update_document_status(document.id, "graph_extracted")
                        logger.info(f"✅ 已更新文档 {document.id} 状态为 graph_extracted")
                        
                except Exception as status_error:
                    logger.warning(f"⚠️ 更新文档状态失败: {status_error}")
            
            # 🔧 为streaming模式发送完成通知
            if use_streaming and session_id:
                await self._send_completion_update(session_id, document.id, {
                    "extraction_result": {
                        "entities_count": len(result.get('entities', [])),
                        "relationships_count": len(result.get('relationships', [])),
                        "entitiesExtracted": len(result.get('entities', [])),
                        "relationshipsExtracted": len(result.get('relationships', [])),
                        "keywordsExtracted": len(result.get('keywords', [])),
                        "total_entities": len(result.get('entities', [])),
                        "total_relationships": len(result.get('relationships', []))
                    },
                    "document_id": document.id,
                    "document_status": "graph_extracted"
                })
            
            return result
            
        except Exception as e:
            logger.error(f"❌ 增强三元组提取失败: {e}")
            # 发送失败通知
            if use_streaming and session_id:
                await self._send_failure_update(session_id, document.id, {
                    "error_message": str(e),
                    "error_type": "enhanced_extraction_error"
                })
            # 回退到父类方法
            return await super().extract_triplets_from_document(document, chunks, use_streaming, session_id)
    
    async def _send_progress_update(self, session_id: str, document_id: str, progress_data: dict):
        """发送进度更新到SSE"""
        try:
            # 调用父类的进度更新方法
            await super()._send_progress_update(session_id, document_id, progress_data)
        except Exception as e:
            logger.warning(f"发送进度更新失败: {e}")
    
    async def _send_completion_update(self, session_id: str, document_id: str, result_data: dict):
        """发送完成通知到SSE"""
        try:
            # 调用父类的完成通知方法
            await super()._send_completion_update(session_id, document_id, result_data)
        except Exception as e:
            logger.warning(f"发送完成通知失败: {e}")
    
    async def _send_failure_update(self, session_id: str, document_id: str, error_data: dict):
        """发送失败通知到SSE"""
        try:
            # 调用父类的失败通知方法
            await super()._send_failure_update(session_id, document_id, error_data)
        except Exception as e:
            logger.warning(f"发送失败通知失败: {e}")
    
    async def _get_document_content(self, document) -> str:
        """获取文档内容"""
        try:
            # 调用父类的获取文档内容方法
            return await super()._get_document_content(document)
        except Exception as e:
            logger.warning(f"获取文档内容失败: {e}")
            return ""
    
    def _detect_material_domain(self, content: str) -> Optional[str]:
        """自动检测材料科学领域"""
        content_lower = content.lower()
        domain_scores = {}
        
        for domain, keywords in self.domain_keywords.items():
            score = 0
            for keyword in keywords:
                # 使用词边界匹配，避免部分匹配
                pattern = r'\b' + re.escape(keyword) + r'\b'
                matches = len(re.findall(pattern, content_lower))
                score += matches
            
            if score > 0:
                domain_scores[domain] = score
        
        if not domain_scores:
            return None
        
        # 返回得分最高的领域
        detected_domain = max(domain_scores, key=domain_scores.get)
        logger.info(f"领域检测得分: {domain_scores}")
        
        return detected_domain if domain_scores[detected_domain] >= 3 else None
    
    def _preprocess_document(self, content: str, document_type: str) -> str:
        """预处理文档内容"""
        if document_type == "qa":
            return self._preprocess_qa_document(content)
        elif document_type == "md":
            return self._preprocess_markdown_document(content)
        else:
            return self._preprocess_generic_document(content)
    
    def _preprocess_qa_document(self, content: str) -> str:
        """预处理QA文档"""
        processed = content
        
        # 标准化问答标记
        processed = re.sub(r'^[Qq]\s*[:：]\s*', 'Question: ', processed, flags=re.MULTILINE)
        processed = re.sub(r'^[Aa]\s*[:：]\s*', 'Answer: ', processed, flags=re.MULTILINE)
        
        # 清理多余空行
        processed = re.sub(r'\n\s*\n\s*\n', '\n\n', processed)
        
        return processed
    
    def _preprocess_markdown_document(self, content: str) -> str:
        """预处理Markdown文档"""
        processed = content
        
        # 保留重要结构信息
        processed = re.sub(r'^#{1,6}\s+(.+)$', r'SECTION: \1', processed, flags=re.MULTILINE)
        
        # 清理图片但保留说明
        processed = re.sub(r'!\[([^\]]*)\]\([^)]+\)', r'Figure: \1', processed)
        
        # 简化表格格式但保留内容
        processed = re.sub(r'\|([^|\n]+)\|', r'\1', processed)
        
        # 处理数学公式
        processed = re.sub(r'\$\$([^$]+)\$\$', r'Equation: \1', processed)
        processed = re.sub(r'\$([^$]+)\$', r'\1', processed)
        
        # 清理多余标记
        processed = re.sub(r'---+', '', processed)
        
        return processed
    
    def _preprocess_generic_document(self, content: str) -> str:
        """预处理通用文档"""
        processed = content
        
        # 标准化换行
        processed = re.sub(r'\r\n', '\n', processed)
        processed = re.sub(r'\r', '\n', processed)
        
        # 清理多余空格
        processed = re.sub(r'[ \\t]+', ' ', processed)
        
        # 清理多余空行
        processed = re.sub(r'\\n\\s*\\n\\s*\\n', '\\n\\n', processed)
        
        return processed
    
    def _split_document_adaptive(self, content: str, config: Dict[str, Any]) -> List[str]:
        """自适应文档分块"""
        chunk_size = config.get("chunk_size", 3000)
        overlap = config.get("overlap", 200)
        
        # 按段落分割
        paragraphs = content.split('\n\n')
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            # 如果当前段落加上新段落超过块大小
            if len(current_chunk) + len(paragraph) > chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                
                # 保留重叠部分
                if len(current_chunk) > overlap:
                    current_chunk = current_chunk[-overlap:] + "\n\n" + paragraph
                else:
                    current_chunk = paragraph
            else:
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph
        
        # 添加最后一块
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        logger.info(f"文档分块完成: {len(chunks)} 块，平均大小: {sum(len(c) for c in chunks) // len(chunks) if chunks else 0}")
        
        return chunks
    
    async def _extract_from_chunk(
        self, 
        chunk: str, 
        document_type: str, 
        material_domain: Optional[str],
        chunk_id: int = 0
    ) -> Dict[str, Any]:
        """从单个块中提取三元组"""
        
        try:
            # 选择提示词模板
            if document_type == "qa":
                prompt_template = UNIVERSAL_QA_EXTRACTION_PROMPT
            else:
                prompt_template = UNIVERSAL_MATERIALS_EXTRACTION_PROMPT
            
            # 根据材料领域筛选实体和关系类型
            filtered_entities, filtered_relationships = self._filter_types_by_domain(material_domain)
            
            # 构建提示词
            full_prompt = prompt_template.format(
                language="Chinese",
                entity_categories=self._format_entity_categories(filtered_entities),
                relationship_categories=self._format_relationship_categories(filtered_relationships),
                tuple_delimiter="|",
                record_delimiter="##",
                completion_delimiter="<|COMPLETE|>",
                input_text=chunk[:4000]  # 限制输入长度
            )
            
            # 调用LLM (使用现有的网关接口)
            response = await self._call_gateway_for_extraction(full_prompt)
            
            # 解析响应
            parsed_result = self._parse_universal_response(response, chunk_id)
            
            return parsed_result
            
        except Exception as e:
            logger.error(f"块提取失败 (块{chunk_id}): {e}")
            return {"entities": [], "relationships": [], "keywords": [], "quantitative": []}
    
    def _filter_types_by_domain(self, material_domain: Optional[str]) -> Tuple[List[str], List[str]]:
        """根据材料领域筛选实体和关系类型"""
        
        if not material_domain or material_domain not in ADAPTIVE_EXTRACTION_CONFIG["material_domains"]:
            # 使用所有类型，但限制数量以避免prompt过长
            return (
                self.universal_entities[:40],  # 限制实体类型数量
                self.universal_relationships[:35]  # 限制关系类型数量
            )
        
        domain_config = ADAPTIVE_EXTRACTION_CONFIG["material_domains"][material_domain]
        
        # 获取领域特定的关键实体和关系
        key_entities = domain_config.get("key_entities", [])
        key_relationships = domain_config.get("key_relationships", [])
        
        # 补充通用类型
        additional_entities = [e for e in self.universal_entities[:30] if e not in key_entities]
        additional_relationships = [r for r in self.universal_relationships[:25] if r not in key_relationships]
        
        filtered_entities = key_entities + additional_entities[:25]
        filtered_relationships = key_relationships + additional_relationships[:20]
        
        return filtered_entities, filtered_relationships
    
    def _format_entity_categories(self, entities: List[str]) -> str:
        """格式化实体类别为字符串"""
        return ", ".join(entities)
    
    def _format_relationship_categories(self, relationships: List[str]) -> str:
        """格式化关系类别为字符串"""
        return ", ".join(relationships)
    
    def _parse_universal_response(self, response: str, chunk_id: int) -> Dict[str, Any]:
        """解析通用提取响应"""
        entities = []
        relationships = []
        keywords = []
        quantitative = []
        
        try:
            # 清理响应
            cleaned_response = response.replace("<|COMPLETE|>", "").strip()
            
            # 按记录分割
            records = cleaned_response.split("##")
            
            for record in records:
                record = record.strip()
                if not record:
                    continue
                
                try:
                    if record.startswith('("entity"'):
                        entity = self._parse_entity_record_universal(record, chunk_id)
                        if entity:
                            entities.append(entity)
                            
                    elif record.startswith('("relationship"'):
                        relationship = self._parse_relationship_record_universal(record, chunk_id)
                        if relationship:
                            relationships.append(relationship)
                            
                    elif record.startswith('("keywords"'):
                        keywords_text = self._extract_field_value(record, -1)
                        if keywords_text:
                            keywords = [kw.strip() for kw in keywords_text.split(",")]
                            
                    elif record.startswith('("quantitative"'):
                        quant_data = self._parse_quantitative_record_universal(record, chunk_id)
                        if quant_data:
                            quantitative.append(quant_data)
                            
                except Exception as e:
                    logger.warning(f"解析记录失败 (块{chunk_id}): {record[:100]}... 错误: {e}")
                    continue
            
            return {
                "entities": entities,
                "relationships": relationships,
                "keywords": keywords,
                "quantitative": quantitative,
                "chunk_id": chunk_id
            }
            
        except Exception as e:
            logger.error(f"解析通用响应失败 (块{chunk_id}): {e}")
            return {"entities": [], "relationships": [], "keywords": [], "quantitative": []}
    
    def _parse_entity_record_universal(self, record: str, chunk_id: int) -> Optional[Dict[str, Any]]:
        """解析实体记录"""
        try:
            # 提取字段值
            fields = self._extract_record_fields(record, 4)  # entity需要4个字段
            if len(fields) >= 3:
                return {
                    "name": fields[1].strip(),
                    "type": fields[2].strip(),
                    "description": fields[3].strip() if len(fields) > 3 else "",
                    "chunk_id": chunk_id,
                    "confidence": self._calculate_entity_confidence(fields[1], fields[2])
                }
        except Exception as e:
            logger.debug(f"解析实体记录失败: {e}")
        return None
    
    def _parse_relationship_record_universal(self, record: str, chunk_id: int) -> Optional[Dict[str, Any]]:
        """解析关系记录"""
        try:
            fields = self._extract_record_fields(record, 5)  # relationship需要5个字段
            if len(fields) >= 4:
                return {
                    "source": fields[1].strip(),
                    "target": fields[2].strip(),
                    "type": fields[3].strip(),
                    "evidence": fields[4].strip() if len(fields) > 4 else "",
                    "chunk_id": chunk_id,
                    "confidence": self._calculate_relationship_confidence(fields[3], fields[4] if len(fields) > 4 else "")
                }
        except Exception as e:
            logger.debug(f"解析关系记录失败: {e}")
        return None
    
    def _parse_quantitative_record_universal(self, record: str, chunk_id: int) -> Optional[Dict[str, Any]]:
        """解析量化数据记录"""
        try:
            fields = self._extract_record_fields(record, 5)
            if len(fields) >= 4:
                return {
                    "parameter": fields[1].strip(),
                    "value": fields[2].strip(),
                    "unit": fields[3].strip(),
                    "context": fields[4].strip() if len(fields) > 4 else "",
                    "chunk_id": chunk_id
                }
        except Exception as e:
            logger.debug(f"解析量化记录失败: {e}")
        return None
    
    def _extract_record_fields(self, record: str, expected_fields: int) -> List[str]:
        """从记录中提取字段"""
        # 移除外层括号和引号
        cleaned = record.strip()
        if cleaned.startswith('(') and cleaned.endswith(')'):
            cleaned = cleaned[1:-1]
        
        # 按分隔符分割
        fields = cleaned.split('|')
        return fields[:expected_fields]
    
    def _extract_field_value(self, record: str, field_index: int) -> str:
        """提取指定字段的值"""
        fields = self._extract_record_fields(record, abs(field_index) + 1)
        if field_index < 0:
            field_index = len(fields) + field_index
        
        if 0 <= field_index < len(fields):
            return fields[field_index].strip().strip('"')
        return ""
    
    def _calculate_entity_confidence(self, name: str, entity_type: str) -> float:
        """计算实体置信度"""
        confidence = 0.5  # 基础置信度
        
        # 根据实体名称长度调整
        if len(name) > 3:
            confidence += 0.1
        
        # 根据类型匹配调整
        if entity_type in self.universal_entities:
            confidence += 0.2
        
        # 根据科学术语特征调整
        if any(char.isdigit() for char in name):  # 包含数字
            confidence += 0.1
        if any(unit in name.lower() for unit in ['mpa', 'gpa', '°c', '%', 'wt%']):  # 包含单位
            confidence += 0.2
        
        return min(confidence, 1.0)
    
    def _calculate_relationship_confidence(self, rel_type: str, evidence: str) -> float:
        """计算关系置信度"""
        confidence = 0.5
        
        # 根据关系类型调整
        if rel_type in self.universal_relationships:
            confidence += 0.2
        
        # 根据证据质量调整
        if len(evidence) > 10:
            confidence += 0.1
        if any(word in evidence.lower() for word in ['measured', 'showed', 'achieved', 'resulted']):
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _merge_chunk_results(self, chunk_results: List[Dict[str, Any]], material_domain: Optional[str]) -> Dict[str, Any]:
        """合并多个块的提取结果"""
        merged_entities = []
        merged_relationships = []
        merged_keywords = []
        merged_quantitative = []
        
        for result in chunk_results:
            if isinstance(result, Exception):
                logger.warning(f"块结果包含异常: {result}")
                continue
                
            merged_entities.extend(result.get("entities", []))
            merged_relationships.extend(result.get("relationships", []))
            merged_keywords.extend(result.get("keywords", []))
            merged_quantitative.extend(result.get("quantitative", []))
        
        # 去重处理
        unique_entities = self._deduplicate_entities_universal(merged_entities)
        unique_relationships = self._deduplicate_relationships_universal(merged_relationships)
        unique_keywords = list(set(merged_keywords))
        unique_quantitative = self._deduplicate_quantitative(merged_quantitative)
        
        return {
            "entities": unique_entities,
            "relationships": unique_relationships,
            "keywords": unique_keywords,
            "quantitative": unique_quantitative,
            "material_domain": material_domain,
            "extraction_stats": {
                "total_chunks": len([r for r in chunk_results if not isinstance(r, Exception)]),
                "total_entities": len(unique_entities),
                "total_relationships": len(unique_relationships),
                "total_quantitative": len(unique_quantitative)
            }
        }
    
    def _deduplicate_entities_universal(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """去重实体（通用版本）"""
        seen = {}
        unique_entities = []
        
        for entity in entities:
            # 创建标准化的键
            name = entity.get("name", "").lower().strip()
            entity_type = entity.get("type", "").strip()
            key = f"{name}::{entity_type}"
            
            if key not in seen:
                seen[key] = entity
                unique_entities.append(entity)
            else:
                # 合并信息，保留置信度更高的
                existing = seen[key]
                if entity.get("confidence", 0) > existing.get("confidence", 0):
                    seen[key] = entity
                    unique_entities = [e if e != existing else entity for e in unique_entities]
        
        return unique_entities
    
    def _deduplicate_relationships_universal(self, relationships: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """去重关系（通用版本）"""
        seen = {}
        unique_relationships = []
        
        for rel in relationships:
            source = rel.get("source", "").lower().strip()
            target = rel.get("target", "").lower().strip()
            rel_type = rel.get("type", "").strip()
            key = f"{source}::{target}::{rel_type}"
            
            if key not in seen:
                seen[key] = rel
                unique_relationships.append(rel)
            else:
                # 合并证据信息
                existing = seen[key]
                if len(rel.get("evidence", "")) > len(existing.get("evidence", "")):
                    seen[key] = rel
                    unique_relationships = [r if r != existing else rel for r in unique_relationships]
        
        return unique_relationships
    
    def _deduplicate_quantitative(self, quantitative: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """去重量化数据"""
        seen = set()
        unique_quantitative = []
        
        for quant in quantitative:
            key = (
                quant.get("parameter", "").lower(),
                quant.get("value", ""),
                quant.get("unit", ""),
                quant.get("context", "")[:50]  # 只用前50字符避免过长
            )
            
            if key not in seen:
                seen.add(key)
                unique_quantitative.append(quant)
        
        return unique_quantitative
    
    def _post_process_universal_results(
        self, 
        results: Dict[str, Any], 
        material_domain: Optional[str],
        document_type: str
    ) -> Dict[str, Any]:
        """后处理通用提取结果"""
        
        # 验证关系实体存在性
        results["relationships"] = self._validate_relationships_universal(
            results["relationships"], 
            results["entities"]
        )
        
        # 标准化实体名称
        results["entities"] = self._normalize_entity_names_universal(results["entities"])
        
        # 🚀 增强关系提取 - 新增功能
        logger.info(f"开始增强关系提取 - 原有关系数: {len(results.get('relationships', []))}")
        enhanced_relationships = self._enhance_relationship_extraction(results)
        results["relationships"].extend(enhanced_relationships)
        logger.info(f"增强关系提取完成 - 新增关系数: {len(enhanced_relationships)}, 总关系数: {len(results['relationships'])}")
        
        # 添加领域特定的后处理
        if material_domain:
            results = self._apply_domain_specific_processing(results, material_domain)
        
        # 计算质量分数
        results["quality_score"] = self._calculate_extraction_quality(results)
        
        return results
    
    def _enhance_relationship_extraction(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """使用增强算法补充关系提取"""
        try:
            # 转换为增强服务的数据格式
            entities = []
            for entity_data in results.get("entities", []):
                entity = ExtractedEntity(
                    name=entity_data.get("name", ""),
                    type=entity_data.get("type", ""),
                    description=entity_data.get("description", ""),
                    context="",
                    confidence=entity_data.get("confidence", 0.8)
                )
                entities.append(entity)
            
            # 获取原始文本（从结果中）
            original_text = results.get("original_text", "")
            if not original_text:
                # 如果没有原始文本，从实体描述中重构
                original_text = " ".join([e.description for e in entities if e.description])
            
            # 使用增强服务提取关系
            enhanced_relations = enhanced_extraction_service.extract_enhanced_relations(entities, original_text)
            
            # 转换回标准格式
            enhanced_relationships = []
            for relation in enhanced_relations:
                relationship = {
                    "source": relation.source,
                    "target": relation.target,
                    "relationship": relation.relation_type,
                    "evidence": relation.evidence,
                    "confidence": relation.confidence,
                    "source_type": "enhanced_extraction"
                }
                enhanced_relationships.append(relationship)
            
            return enhanced_relationships
            
        except Exception as e:
            logger.warning(f"增强关系提取失败: {e}")
            return []
    
    def _validate_relationships_universal(
        self, 
        relationships: List[Dict[str, Any]], 
        entities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """验证关系中的实体是否存在"""
        entity_names = {entity.get("name", "").lower() for entity in entities}
        
        valid_relationships = []
        for rel in relationships:
            source = rel.get("source", "").lower()
            target = rel.get("target", "").lower()
            
            if source in entity_names and target in entity_names:
                valid_relationships.append(rel)
            else:
                logger.debug(f"关系验证失败: {source} -> {target}")
        
        logger.info(f"关系验证: {len(relationships)} -> {len(valid_relationships)}")
        return valid_relationships
    
    def _normalize_entity_names_universal(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """标准化实体名称"""
        for entity in entities:
            name = entity.get("name", "")
            # 标准化处理
            name = re.sub(r'\\s+', ' ', name)  # 统一空格
            name = name.strip()
            name = name.replace('"', '').replace("'", "")  # 移除引号
            entity["name"] = name
        
        return entities
    
    def _apply_domain_specific_processing(
        self, 
        results: Dict[str, Any], 
        material_domain: str
    ) -> Dict[str, Any]:
        """应用领域特定的后处理"""
        
        if material_domain == "geopolymer":
            # 地聚物领域特定处理
            results = self._process_geopolymer_specifics(results)
        elif material_domain == "composite":
            # 复合材料领域特定处理
            results = self._process_composite_specifics(results)
        
        return results
    
    def _process_geopolymer_specifics(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """地聚物领域特定处理"""
        # 可以添加地聚物特定的实体关系规则
        return results
    
    def _process_composite_specifics(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """复合材料领域特定处理"""
        # 可以添加复合材料特定的实体关系规则
        return results
    
    def _calculate_extraction_quality(self, results: Dict[str, Any]) -> float:
        """计算提取质量分数"""
        entities = results.get("entities", [])
        relationships = results.get("relationships", [])
        quantitative = results.get("quantitative", [])
        
        # 基础分数
        base_score = 0.5
        
        # 实体质量分数
        if entities:
            avg_entity_confidence = sum(e.get("confidence", 0.5) for e in entities) / len(entities)
            base_score += avg_entity_confidence * 0.2
        
        # 关系质量分数
        if relationships:
            avg_rel_confidence = sum(r.get("confidence", 0.5) for r in relationships) / len(relationships)
            base_score += avg_rel_confidence * 0.2
        
        # 数量平衡分数
        if entities and relationships:
            ratio = min(len(relationships) / len(entities), 1.0)  # 关系实体比
            base_score += ratio * 0.1
        
        return min(base_score, 1.0)


# 创建服务实例
universal_triplet_extraction_service = UniversalTripletExtractionService()