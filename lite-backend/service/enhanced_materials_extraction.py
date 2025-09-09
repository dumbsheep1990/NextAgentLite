"""
增强的材料科学知识图谱提取系统
专注于提高关系提取的准确性和完整性
"""

import re
import json
from typing import List, Dict, Any, Set, Tuple
from dataclasses import dataclass
from core.logger import logger

@dataclass
class ExtractedEntity:
    name: str
    type: str
    description: str
    context: str
    confidence: float = 0.0

@dataclass
class ExtractedRelation:
    source: str
    target: str
    relation_type: str
    evidence: str
    confidence: float = 0.0

class EnhancedMaterialsExtractionService:
    """增强的材料科学知识提取服务"""
    
    def __init__(self):
        # 材料科学领域的核心关系模式
        self.core_relation_patterns = {
            # 组成关系
            "composition": {
                "patterns": [
                    r"(?P<material1>\w+(?:\s+\w+)*)\s+(?:contains?|includes?|comprises?|incorporates?)\s+(?P<material2>\w+(?:\s+\w+)*)",
                    r"(?P<material1>\w+(?:\s+\w+)*)\s+(?:is\s+)?(?:composed|made|consists)\s+of\s+(?P<material2>\w+(?:\s+\w+)*)",
                    r"(?P<material2>\w+(?:\s+\w+)*)\s+(?:in|within|inside)\s+(?P<material1>\w+(?:\s+\w+)*)",
                ],
                "relation_type": "CONTAINS"
            },
            
            # 性能关系
            "property": {
                "patterns": [
                    r"(?P<material>\w+(?:\s+\w+)*)\s+(?:shows?|exhibits?|demonstrates?|achieves?)\s+(?P<property>\w+(?:\s+\w+)*)",
                    r"(?P<property>\w+(?:\s+\w+)*)\s+of\s+(?P<material>\w+(?:\s+\w+)*)",
                    r"(?P<material>\w+(?:\s+\w+)*)\s+has\s+(?:a\s+)?(?P<property>\w+(?:\s+\w+)*)",
                ],
                "relation_type": "HAS_PROPERTY"
            },
            
            # 工艺关系
            "process": {
                "patterns": [
                    r"(?P<material>\w+(?:\s+\w+)*)\s+(?:is\s+)?(?:cured|treated|processed|prepared)\s+(?:at|with|by|using)\s+(?P<condition>\w+(?:\s+\w+)*)",
                    r"(?P<process>\w+(?:\s+\w+)*)\s+(?:of|on)\s+(?P<material>\w+(?:\s+\w+)*)",
                    r"(?P<material>\w+(?:\s+\w+)*)\s+undergoes?\s+(?P<process>\w+(?:\s+\w+)*)",
                ],
                "relation_type": "PROCESSED_BY"
            },
            
            # 增强关系
            "reinforcement": {
                "patterns": [
                    r"(?P<matrix>\w+(?:\s+\w+)*)\s+(?:reinforced|strengthened|enhanced)\s+(?:with|by)\s+(?P<reinforcement>\w+(?:\s+\w+)*)",
                    r"(?P<reinforcement>\w+(?:\s+\w+)*)\s+(?:reinforces?|strengthens?|enhances?)\s+(?P<matrix>\w+(?:\s+\w+)*)",
                ],
                "relation_type": "REINFORCED_BY"
            },
            
            # 数值关系
            "quantitative": {
                "patterns": [
                    r"(?P<property>\w+(?:\s+\w+)*)\s+(?:of|in)\s+(?P<material>\w+(?:\s+\w+)*)\s+(?:is|was|reaches?|achieves?)\s+(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>\w+)",
                    r"(?P<material>\w+(?:\s+\w+)*)\s+(?:shows?|exhibits?)\s+(?P<property>\w+(?:\s+\w+)*)\s+of\s+(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>\w+)",
                ],
                "relation_type": "MEASURES"
            }
        }
        
        # 材料科学实体类型识别词典
        self.entity_type_keywords = {
            "GeopolymerProduct": ["geopolymer", "alkali-activated", "AAM", "GP"],
            "Precursor": ["fly ash", "slag", "metakaolin", "silica fume", "GGBS"],
            "Parameter": ["temperature", "concentration", "ratio", "time", "pressure"],
            "CuringProcess": ["curing", "heating", "ambient", "oven", "autoclave"],
            "ProcessingEquipment": ["mixer", "mold", "press", "furnace", "kiln"],
            "MechanicalProperty": ["strength", "modulus", "toughness", "hardness"],
            "ChemicalProperty": ["pH", "alkalinity", "reactivity", "durability"],
            "TestMethod": ["compression", "tensile", "XRD", "SEM", "FTIR", "NMR"]
        }
    
    def extract_enhanced_relations(self, entities: List[ExtractedEntity], text: str) -> List[ExtractedRelation]:
        """使用增强算法提取关系"""
        relations = []
        
        # 1. 基于模式的关系提取
        pattern_relations = self._extract_pattern_relations(text)
        relations.extend(pattern_relations)
        
        # 2. 基于共现的关系推导
        cooccurrence_relations = self._extract_cooccurrence_relations(entities, text)
        relations.extend(cooccurrence_relations)
        
        # 3. 基于材料科学知识的关系补全
        domain_relations = self._extract_domain_relations(entities)
        relations.extend(domain_relations)
        
        # 4. 数值关系提取
        quantitative_relations = self._extract_quantitative_relations(entities, text)
        relations.extend(quantitative_relations)
        
        # 去重和置信度计算
        relations = self._deduplicate_and_score_relations(relations)
        
        logger.info(f"增强提取完成: {len(relations)} 个关系")
        return relations
    
    def _extract_pattern_relations(self, text: str) -> List[ExtractedRelation]:
        """基于正则模式提取关系"""
        relations = []
        
        for category, config in self.core_relation_patterns.items():
            patterns = config["patterns"]
            relation_type = config["relation_type"]
            
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    groups = match.groupdict()
                    
                    if len(groups) >= 2:
                        # 获取匹配的实体
                        entities = list(groups.values())
                        if len(entities) >= 2:
                            source = entities[0].strip()
                            target = entities[1].strip()
                            evidence = match.group(0)
                            
                            relation = ExtractedRelation(
                                source=source,
                                target=target,
                                relation_type=relation_type,
                                evidence=evidence,
                                confidence=0.8
                            )
                            relations.append(relation)
        
        return relations
    
    def _extract_cooccurrence_relations(self, entities: List[ExtractedEntity], text: str) -> List[ExtractedRelation]:
        """基于实体共现提取隐含关系"""
        relations = []
        text_lower = text.lower()
        
        # 在同一句话中出现的实体可能有关系
        sentences = re.split(r'[.!?]+', text)
        
        for sentence in sentences:
            sentence_entities = []
            for entity in entities:
                if entity.name.lower() in sentence.lower():
                    sentence_entities.append(entity)
            
            # 为同一句话中的实体建立关系
            if len(sentence_entities) >= 2:
                for i, entity1 in enumerate(sentence_entities):
                    for entity2 in sentence_entities[i+1:]:
                        # 基于实体类型推导关系类型
                        relation_type = self._infer_relation_type(entity1, entity2, sentence)
                        
                        if relation_type:
                            relation = ExtractedRelation(
                                source=entity1.name,
                                target=entity2.name,
                                relation_type=relation_type,
                                evidence=sentence.strip(),
                                confidence=0.6
                            )
                            relations.append(relation)
        
        return relations
    
    def _extract_domain_relations(self, entities: List[ExtractedEntity]) -> List[ExtractedRelation]:
        """基于材料科学领域知识推导关系"""
        relations = []
        
        # 材料科学领域的常见关系规则
        domain_rules = [
            # 前驱体 -> 地聚物产品
            ("Precursor", "GeopolymerProduct", "IS_PRECURSOR_OF"),
            # 地聚物产品 -> 机械性能
            ("GeopolymerProduct", "MechanicalProperty", "HAS_PROPERTY"),
            # 工艺参数 -> 固化工艺
            ("Parameter", "CuringProcess", "CONTROLS"),
            # 测试方法 -> 性能
            ("TestMethod", "MechanicalProperty", "MEASURES"),
            # 设备 -> 工艺
            ("ProcessingEquipment", "CuringProcess", "USED_IN"),
        ]
        
        for rule in domain_rules:
            source_type, target_type, relation_type = rule
            
            # 找到匹配类型的实体
            source_entities = [e for e in entities if e.type == source_type]
            target_entities = [e for e in entities if e.type == target_type]
            
            for source_entity in source_entities:
                for target_entity in target_entities:
                    relation = ExtractedRelation(
                        source=source_entity.name,
                        target=target_entity.name,
                        relation_type=relation_type,
                        evidence=f"Domain knowledge: {source_type} -> {target_type}",
                        confidence=0.7
                    )
                    relations.append(relation)
        
        return relations
    
    def _extract_quantitative_relations(self, entities: List[ExtractedEntity], text: str) -> List[ExtractedRelation]:
        """提取数值关系"""
        relations = []
        
        # 查找数值模式
        numerical_patterns = [
            r"(?P<material>\w+(?:\s+\w+)*)\s+(?:achieves?|reaches?|shows?)\s+(?P<property>\w+(?:\s+\w+)*)\s+of\s+(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>\w+)",
            r"(?P<property>\w+(?:\s+\w+)*)\s+of\s+(?P<material>\w+(?:\s+\w+)*)\s+(?:is|was)\s+(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>\w+)",
        ]
        
        for pattern in numerical_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                groups = match.groupdict()
                if 'material' in groups and 'property' in groups:
                    material = groups['material'].strip()
                    property_name = groups['property'].strip()
                    value = groups.get('value', '')
                    unit = groups.get('unit', '')
                    
                    relation = ExtractedRelation(
                        source=material,
                        target=property_name,
                        relation_type="ACHIEVES",
                        evidence=f"{match.group(0)} ({value} {unit})",
                        confidence=0.9
                    )
                    relations.append(relation)
        
        return relations
    
    def _infer_relation_type(self, entity1: ExtractedEntity, entity2: ExtractedEntity, context: str) -> str:
        """基于实体类型和上下文推导关系类型"""
        type1, type2 = entity1.type, entity2.type
        context_lower = context.lower()
        
        # 基于实体类型的关系映射
        type_relation_map = {
            ("Precursor", "GeopolymerProduct"): "IS_PRECURSOR_OF",
            ("GeopolymerProduct", "Precursor"): "DERIVED_FROM",
            ("GeopolymerProduct", "MechanicalProperty"): "HAS_PROPERTY",
            ("Parameter", "CuringProcess"): "CONTROLS",
            ("CuringProcess", "GeopolymerProduct"): "PRODUCES",
            ("TestMethod", "MechanicalProperty"): "MEASURES",
            ("ProcessingEquipment", "CuringProcess"): "USED_IN",
        }
        
        # 检查直接映射
        if (type1, type2) in type_relation_map:
            return type_relation_map[(type1, type2)]
        elif (type2, type1) in type_relation_map:
            return type_relation_map[(type2, type1)]
        
        # 基于上下文关键词推导
        if any(word in context_lower for word in ["contains", "includes", "comprises"]):
            return "CONTAINS"
        elif any(word in context_lower for word in ["reinforced", "strengthened", "enhanced"]):
            return "REINFORCED_BY"
        elif any(word in context_lower for word in ["cured", "treated", "processed"]):
            return "PROCESSED_BY"
        elif any(word in context_lower for word in ["shows", "exhibits", "demonstrates"]):
            return "HAS_PROPERTY"
        
        # 默认关系
        return "RELATED_TO"
    
    def _deduplicate_and_score_relations(self, relations: List[ExtractedRelation]) -> List[ExtractedRelation]:
        """去重和置信度评分"""
        # 按照 (source, target, relation_type) 去重
        relation_dict = {}
        
        for relation in relations:
            key = (relation.source.lower(), relation.target.lower(), relation.relation_type)
            
            if key not in relation_dict:
                relation_dict[key] = relation
            else:
                # 保留置信度更高的
                if relation.confidence > relation_dict[key].confidence:
                    relation_dict[key] = relation
        
        return list(relation_dict.values())

# 创建服务实例
enhanced_extraction_service = EnhancedMaterialsExtractionService()