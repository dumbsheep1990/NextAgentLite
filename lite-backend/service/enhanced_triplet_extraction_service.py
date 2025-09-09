"""
增强的三元组提取服务
基于测试文档分析结果优化，支持MD原文和QA数据的差异化处理
"""

import asyncio
import re
import json
from typing import List, Dict, Any, Tuple, Optional, Union
from datetime import datetime

from core.logger import logger
from service.triplet_extraction_service import TripletExtractionService
from service.optimized_prompts import (
    OPTIMIZED_EXTRACTION_PROMPT, 
    QA_EXTRACTION_PROMPT,
    BAMBOO_COMPOSITE_PROMPT,
    ENHANCED_GEOPOLYMER_ENTITY_TYPES,
    ENHANCED_GEOPOLYMER_RELATIONSHIP_TYPES
)
from service.composite_material_templates import (
    COMPOSITE_ENTITY_TEMPLATES,
    COMPOSITE_RELATION_TEMPLATES,
    BAMBOO_COMPOSITE_TEMPLATES,
    get_template_for_material_type,
    get_enhanced_prompts_for_document_type
)


class EnhancedTripletExtractionService(TripletExtractionService):
    """增强的三元组提取服务"""
    
    def __init__(self):
        super().__init__()
        self.composite_templates = COMPOSITE_ENTITY_TEMPLATES
        self.relation_templates = COMPOSITE_RELATION_TEMPLATES
        self.bamboo_templates = BAMBOO_COMPOSITE_TEMPLATES
        
    async def extract_from_document(
        self, 
        document_content: str, 
        document_type: str = "md",
        material_focus: Optional[str] = None,
        extraction_strategy: str = "comprehensive"
    ) -> Dict[str, Any]:
        """
        从文档中提取三元组，支持不同的文档类型和提取策略
        
        Args:
            document_content: 文档内容
            document_type: 文档类型 ("md", "qa", "pdf")
            material_focus: 材料焦点 ("bamboo", "fiber", "composite")
            extraction_strategy: 提取策略 ("comprehensive", "focused", "statistical")
        """
        try:
            logger.info(f"开始增强三元组提取 - 文档类型: {document_type}, 材料焦点: {material_focus}")
            
            # 选择合适的提示词模板
            prompt_template = self._select_prompt_template(document_type, material_focus)
            
            # 选择合适的实体和关系类型
            entity_types, relation_types = self._select_schema(material_focus, extraction_strategy)
            
            # 预处理文档内容
            processed_content = self._preprocess_content(document_content, document_type)
            
            # 执行提取
            extraction_results = await self._extract_with_enhanced_prompts(
                processed_content, 
                prompt_template,
                entity_types,
                relation_types
            )
            
            # 后处理结果
            refined_results = self._post_process_results(extraction_results, material_focus)
            
            # 应用模板规则进行补充提取
            template_results = self._apply_template_extraction(processed_content, material_focus)
            
            # 合并结果
            final_results = self._merge_extraction_results(refined_results, template_results)
            
            logger.info(f"增强提取完成 - 实体: {len(final_results.get('entities', []))}, 关系: {len(final_results.get('relationships', []))}")
            
            return final_results
            
        except Exception as e:
            logger.error(f"增强三元组提取失败: {e}")
            # 回退到基础提取
            return await super().extract_triplets_from_text(document_content)
    
    def _select_prompt_template(self, document_type: str, material_focus: Optional[str]) -> str:
        """选择合适的提示词模板"""
        if document_type.lower() == "qa":
            return QA_EXTRACTION_PROMPT
        elif material_focus and "bamboo" in material_focus.lower():
            return BAMBOO_COMPOSITE_PROMPT
        else:
            return OPTIMIZED_EXTRACTION_PROMPT
    
    def _select_schema(self, material_focus: Optional[str], strategy: str) -> Tuple[List[str], List[str]]:
        """选择合适的实体和关系类型"""
        if strategy == "focused" and material_focus:
            # 使用针对性的实体类型
            if "bamboo" in material_focus.lower():
                entity_types = self._get_bamboo_focused_entities()
                relation_types = self._get_bamboo_focused_relations()
            elif "composite" in material_focus.lower():
                entity_types = self._get_composite_focused_entities()  
                relation_types = self._get_composite_focused_relations()
            else:
                entity_types = self._flatten_entity_types(ENHANCED_GEOPOLYMER_ENTITY_TYPES)
                relation_types = ENHANCED_GEOPOLYMER_RELATIONSHIP_TYPES
        else:
            # 使用完整的实体和关系类型
            entity_types = self._flatten_entity_types(ENHANCED_GEOPOLYMER_ENTITY_TYPES)
            relation_types = ENHANCED_GEOPOLYMER_RELATIONSHIP_TYPES
            
        return entity_types, relation_types
    
    def _flatten_entity_types(self, entity_dict: Dict[str, List[str]]) -> List[str]:
        """展平实体类型字典为列表"""
        flattened = []
        for category, types in entity_dict.items():
            flattened.extend(types)
        return flattened
    
    def _get_bamboo_focused_entities(self) -> List[str]:
        """获取竹纤维复合材料重点关注的实体类型"""
        return [
            "CompositeMaterial", "ReinforcementFiber", "MatrixMaterial",
            "FlexuralProperty", "MechanicalProperty", "InterfaceProperty",
            "CuringProcess", "TestingProcess", "StatisticalProperty",
            "NumericalResult", "ProcessParameter"
        ]
    
    def _get_bamboo_focused_relations(self) -> List[str]:
        """获取竹纤维复合材料重点关注的关系类型"""
        return [
            "REINFORCED_BY", "REINFORCES", "HAS_FLEXURAL_STRENGTH",
            "HAS_MECHANICAL_PROPERTY", "TESTED_BY", "CURED_AT",
            "INFLUENCED_BY", "DEMONSTRATES_BEHAVIOR", "HAS_VALUE",
            "CHARACTERIZED_BY", "RESULTS_IN"
        ]
    
    def _get_composite_focused_entities(self) -> List[str]:
        """获取复合材料重点关注的实体类型"""
        return [
            "CompositeMaterial", "ReinforcementFiber", "MatrixMaterial",
            "MechanicalProperty", "FlexuralProperty", "InterfaceProperty",
            "TestingProcess", "ProcessParameter", "NumericalResult"
        ]
    
    def _get_composite_focused_relations(self) -> List[str]:
        """获取复合材料重点关注的关系类型"""
        return [
            "REINFORCED_BY", "COMPOSED_OF", "HAS_MECHANICAL_PROPERTY",
            "TESTED_BY", "PROCESSED_BY", "INFLUENCES", "HAS_VALUE"
        ]
    
    def _preprocess_content(self, content: str, document_type: str) -> str:
        """预处理文档内容"""
        if document_type.lower() == "qa":
            return self._preprocess_qa_content(content)
        elif document_type.lower() == "md":
            return self._preprocess_md_content(content)
        else:
            return content
    
    def _preprocess_qa_content(self, content: str) -> str:
        """预处理QA数据"""
        # 将QA对转换为更适合提取的格式
        processed = content
        
        # 标识问答对
        processed = re.sub(r'^Q\s*[:：]\s*', 'Question: ', processed, flags=re.MULTILINE)
        processed = re.sub(r'^A\s*[:：]\s*', 'Answer: ', processed, flags=re.MULTILINE)
        
        # 清理格式
        processed = re.sub(r'\n\s*\n', '\n\n', processed)
        
        return processed
    
    def _preprocess_md_content(self, content: str) -> str:
        """预处理Markdown内容"""
        # 清理Markdown标记但保留结构信息
        processed = content
        
        # 保留重要的结构标记
        processed = re.sub(r'^#+\s+(.+)$', r'SECTION: \1', processed, flags=re.MULTILINE)
        
        # 清理图片标记但保留caption
        processed = re.sub(r'!\[([^\]]*)\]\([^)]+\)', r'Figure: \1', processed)
        
        # 清理表格标记但保留内容
        processed = re.sub(r'\|([^|\n]+)\|', r'\1', processed)
        
        # 清理数学公式标记
        processed = re.sub(r'\$\$([^$]+)\$\$', r'Formula: \1', processed)
        processed = re.sub(r'\$([^$]+)\$', r'\1', processed)
        
        return processed
    
    async def _extract_with_enhanced_prompts(
        self, 
        content: str,
        prompt_template: str,
        entity_types: List[str],
        relation_types: List[str]
    ) -> Dict[str, Any]:
        """使用增强提示词执行提取"""
        try:
            # 构建完整的提示词
            full_prompt = prompt_template.format(
                language="Chinese",
                entity_types=", ".join(entity_types[:30]),  # 限制长度避免token超限
                relationship_types=", ".join(relation_types[:30]),
                tuple_delimiter="|",
                record_delimiter="##",
                completion_delimiter="<|COMPLETE|>",
                input_text=content[:4000]  # 限制输入长度
            )
            
            # 调用LLM服务
            response = await self.llm_service.complete(
                prompt=full_prompt,
                model=self.default_model,
                max_tokens=2000,
                temperature=0.1  # 降低温度提高一致性
            )
            
            # 解析响应
            return self._parse_enhanced_response(response)
            
        except Exception as e:
            logger.error(f"增强提示词提取失败: {e}")
            return {"entities": [], "relationships": [], "keywords": []}
    
    def _parse_enhanced_response(self, response: str) -> Dict[str, Any]:
        """解析增强提取的响应"""
        entities = []
        relationships = []
        keywords = []
        quantitative_data = []
        
        try:
            # 按记录分割
            records = response.split("##")
            
            for record in records:
                record = record.strip()
                if not record or record == "<|COMPLETE|>":
                    continue
                
                if record.startswith('("entity"'):
                    entity = self._parse_entity_record(record)
                    if entity:
                        entities.append(entity)
                        
                elif record.startswith('("relationship"'):
                    relationship = self._parse_relationship_record(record)
                    if relationship:
                        relationships.append(relationship)
                        
                elif record.startswith('("content_keywords"'):
                    keywords_text = record.split("|")[-1].strip(')"')
                    keywords = [kw.strip() for kw in keywords_text.split(",")]
                    
                elif record.startswith('("quantitative_data"'):
                    quant_data = self._parse_quantitative_record(record)
                    if quant_data:
                        quantitative_data.append(quant_data)
            
            return {
                "entities": entities,
                "relationships": relationships,
                "keywords": keywords,
                "quantitative_data": quantitative_data
            }
            
        except Exception as e:
            logger.error(f"解析增强响应失败: {e}")
            return {"entities": [], "relationships": [], "keywords": []}
    
    def _parse_entity_record(self, record: str) -> Optional[Dict[str, Any]]:
        """解析实体记录"""
        try:
            # 提取括号内容
            match = re.match(r'\("entity"\|([^|]+)\|([^|]+)\|([^"]+)\)', record)
            if match:
                return {
                    "name": match.group(1).strip(),
                    "type": match.group(2).strip(),
                    "description": match.group(3).strip()
                }
        except Exception as e:
            logger.warning(f"解析实体记录失败: {e}")
        return None
    
    def _parse_relationship_record(self, record: str) -> Optional[Dict[str, Any]]:
        """解析关系记录"""
        try:
            match = re.match(r'\("relationship"\|([^|]+)\|([^|]+)\|([^|]+)\|([^"]+)\)', record)
            if match:
                return {
                    "source": match.group(1).strip(),
                    "target": match.group(2).strip(),
                    "type": match.group(3).strip(),
                    "evidence": match.group(4).strip()
                }
        except Exception as e:
            logger.warning(f"解析关系记录失败: {e}")
        return None
    
    def _parse_quantitative_record(self, record: str) -> Optional[Dict[str, Any]]:
        """解析量化数据记录"""
        try:
            match = re.match(r'\("quantitative_data"\|([^|]+)\|([^|]+)\|([^|]+)\|([^"]+)\)', record)
            if match:
                return {
                    "parameter": match.group(1).strip(),
                    "value": match.group(2).strip(),
                    "unit": match.group(3).strip(),
                    "context": match.group(4).strip()
                }
        except Exception as e:
            logger.warning(f"解析量化数据记录失败: {e}")
        return None
    
    def _apply_template_extraction(self, content: str, material_focus: Optional[str]) -> Dict[str, Any]:
        """应用模板规则进行补充提取"""
        template_entities = []
        template_relationships = []
        
        try:
            # 应用数值模板
            quantitative_entities = self._extract_by_quantitative_templates(content)
            template_entities.extend(quantitative_entities)
            
            # 应用关系模板
            template_relations = self._extract_by_relation_templates(content)
            template_relationships.extend(template_relations)
            
            # 应用材料特定模板
            if material_focus:
                specific_entities, specific_relations = self._extract_by_material_templates(content, material_focus)
                template_entities.extend(specific_entities)
                template_relationships.extend(specific_relations)
                
        except Exception as e:
            logger.error(f"模板提取失败: {e}")
        
        return {
            "entities": template_entities,
            "relationships": template_relationships
        }
    
    def _extract_by_quantitative_templates(self, content: str) -> List[Dict[str, Any]]:
        """使用量化模板提取数值实体"""
        entities = []
        
        for pattern in self.composite_templates["quantitative_patterns"]:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                value = match.group(1)
                unit = match.group(2) if len(match.groups()) > 1 else ""
                
                entities.append({
                    "name": f"{value} {unit}".strip(),
                    "type": "NumericalResult",
                    "description": f"Quantitative measurement: {value} {unit}",
                    "source": "template_extraction"
                })
        
        return entities
    
    def _extract_by_relation_templates(self, content: str) -> List[Dict[str, Any]]:
        """使用关系模板提取关系"""
        relationships = []
        
        for category, patterns in self.relation_templates.items():
            for template in patterns:
                matches = re.finditer(template["pattern"], content, re.IGNORECASE)
                for match in matches:
                    try:
                        source = match.group(template["subject_group"]).strip()
                        target = match.group(template["object_group"]).strip()
                        relation_type = template["relation"]
                        evidence = match.group(0)  # 完整匹配作为证据
                        
                        relationships.append({
                            "source": source,
                            "target": target,
                            "type": relation_type,
                            "evidence": evidence,
                            "source": "template_extraction"
                        })
                    except (IndexError, AttributeError) as e:
                        continue
        
        return relationships
    
    def _extract_by_material_templates(self, content: str, material_focus: str) -> Tuple[List[Dict], List[Dict]]:
        """使用材料特定模板提取"""
        entities = []
        relationships = []
        
        if "bamboo" in material_focus.lower():
            # 应用竹纤维特定模板
            for entity_name in self.bamboo_templates["bamboo_entities"]:
                if entity_name.lower() in content.lower():
                    entities.append({
                        "name": entity_name,
                        "type": "ReinforcementFiber" if "bamboo" in entity_name else "Material",
                        "description": f"Material entity identified from bamboo composite context",
                        "source": "bamboo_template"
                    })
            
            # 应用预定义关系
            for source, target, relation_type in self.bamboo_templates["bamboo_relations"]:
                if source.lower() in content.lower() and target.lower() in content.lower():
                    relationships.append({
                        "source": source,
                        "target": target,
                        "type": relation_type,
                        "evidence": f"Template-based relation in bamboo composite context",
                        "source": "bamboo_template"
                    })
        
        return entities, relationships
    
    def _post_process_results(self, results: Dict[str, Any], material_focus: Optional[str]) -> Dict[str, Any]:
        """后处理提取结果"""
        # 去重
        results["entities"] = self._deduplicate_entities(results.get("entities", []))
        results["relationships"] = self._deduplicate_relationships(results.get("relationships", []))
        
        # 标准化实体名称
        results["entities"] = self._normalize_entity_names(results["entities"])
        
        # 验证关系的实体存在性
        results["relationships"] = self._validate_relationships(results["relationships"], results["entities"])
        
        return results
    
    def _deduplicate_entities(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """去重实体"""
        seen = set()
        unique_entities = []
        
        for entity in entities:
            key = (entity.get("name", "").lower(), entity.get("type", ""))
            if key not in seen:
                seen.add(key)
                unique_entities.append(entity)
        
        return unique_entities
    
    def _deduplicate_relationships(self, relationships: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """去重关系"""
        seen = set()
        unique_relationships = []
        
        for rel in relationships:
            key = (
                rel.get("source", "").lower(),
                rel.get("target", "").lower(),
                rel.get("type", "")
            )
            if key not in seen:
                seen.add(key)
                unique_relationships.append(rel)
        
        return unique_relationships
    
    def _normalize_entity_names(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """标准化实体名称"""
        for entity in entities:
            name = entity.get("name", "")
            # 标准化科学术语
            name = re.sub(r'\s+', ' ', name)  # 规范化空格
            name = name.strip()
            entity["name"] = name
        
        return entities
    
    def _validate_relationships(self, relationships: List[Dict[str, Any]], entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
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
        
        return valid_relationships
    
    def _merge_extraction_results(self, llm_results: Dict[str, Any], template_results: Dict[str, Any]) -> Dict[str, Any]:
        """合并LLM提取和模板提取的结果"""
        merged = {
            "entities": llm_results.get("entities", []) + template_results.get("entities", []),
            "relationships": llm_results.get("relationships", []) + template_results.get("relationships", []),
            "keywords": llm_results.get("keywords", []),
            "quantitative_data": llm_results.get("quantitative_data", [])
        }
        
        # 最终去重
        merged["entities"] = self._deduplicate_entities(merged["entities"])
        merged["relationships"] = self._deduplicate_relationships(merged["relationships"])
        
        return merged


# 创建增强服务实例
enhanced_triplet_extraction_service = EnhancedTripletExtractionService()