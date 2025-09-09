"""
复合材料领域专门的实体和关系模板
基于测试文档分析结果设计的针对性模板
"""

from typing import Dict, List, Any

# 复合材料专门的实体识别模板
COMPOSITE_ENTITY_TEMPLATES = {
    # 材料名称模板 - 捕获复合材料的完整名称
    "composite_material_patterns": [
        r"([a-zA-Z\-]+)[\-\s]*reinforced\s+([a-zA-Z\-]+)\s+composite[s]?",
        r"([a-zA-Z\-]+)[\-\s]*based\s+geopolymer[s]?",
        r"([a-zA-Z\-]+)\s+fiber[\-\s]*reinforced\s+([a-zA-Z\-]+)",
        r"([a-zA-Z\-]+)[\-\s]*geopolymer\s+composite[s]?",
        r"K[\-\s]*based\s+geopolymer[s]?",
        r"potassium[\-\s]*based\s+geopolymer[s]?",
        r"([a-zA-Z\-]+)\s+composite\s+([a-zA-Z\-]+)"
    ],
    
    # 数值+单位模板 - 捕获量化数据
    "quantitative_patterns": [
        r"(\d+\.?\d*)\s*(MPa|kPa|Pa|GPa)",                    # 强度单位
        r"(\d+\.?\d*)\s*(°C|C|degrees?)",                     # 温度单位
        r"(\d+\.?\d*)\s*(hours?|hrs?|minutes?|mins?|days?)",  # 时间单位
        r"(\d+\.?\d*)\s*(wt%|vol%|%)",                        # 百分比
        r"(\d+\.?\d*)\s*(mm|cm|m|μm|nm)",                     # 长度单位
        r"(\d+\.?\d*)\s*(g|kg|mg)",                           # 质量单位
        r"(\d+\.?\d*)\s*(rpm|min⁻¹)",                         # 转速单位
        r"(\d+\.?\d*)\s*×\s*(\d+\.?\d*)\s*×\s*(\d+\.?\d*)\s*(mm|cm|m)"  # 尺寸
    ],
    
    # 测试方法模板
    "test_method_patterns": [
        r"ASTM\s+[A-Z]?\d+\-?\d*",                           # ASTM标准
        r"(four|three|two)[\-\s]*point\s+.*?test",          # 多点测试
        r"(flexural|compression|tensile)\s+.*?test",        # 力学测试
        r"scanning\s+electron\s+microscopy",                # SEM
        r"X[\-\s]*ray\s+diffraction",                       # XRD
        r"mercury\s+intrusion\s+porosimetry",              # MIP
        r"Weibull\s+(analysis|distribution|plot)"          # Weibull分析
    ],
    
    # 工艺条件模板
    "process_condition_patterns": [
        r"cured?\s+at\s+(\d+\.?\d*)\s*°C\s+for\s+(\d+\.?\d*)\s*(hours?|hrs?)",
        r"mixed?\s+.*?for\s+(\d+\.?\d*)\s*(minutes?|mins?)",
        r"pressed?\s+at\s+(\d+\.?\d*)\s*(MPa|kPa)",
        r"heated?\s+.*?at\s+(\d+\.?\d*)\s*°C",
        r"cooled?\s+.*?at\s+(\d+\.?\d*)\s*°C",
        r"maintained?\s+.*?at\s+(\d+\.?\d*)\s*°C"
    ]
}

# 关系提取模板 - 基于语言模式识别关系
COMPOSITE_RELATION_TEMPLATES = {
    # 增强关系模板
    "reinforcement_patterns": [
        {
            "pattern": r"([^,.\n]+)\s+reinforced\s+with\s+([^,.\n]+)",
            "relation": "REINFORCED_BY",
            "subject_group": 1,
            "object_group": 2
        },
        {
            "pattern": r"([^,.\n]+)\s+fibers?\s+.*?reinforce[ds]?\s+([^,.\n]+)",
            "relation": "REINFORCES",
            "subject_group": 1,
            "object_group": 2
        }
    ],
    
    # 性能关系模板
    "property_patterns": [
        {
            "pattern": r"([^,.\n]+)\s+.*?(strength|modulus|toughness)\s+.*?(\d+\.?\d*)\s*(MPa|GPa|kPa|Pa)",
            "relation": "HAS_MECHANICAL_PROPERTY",
            "subject_group": 1,
            "property_group": 2,
            "value_group": 3,
            "unit_group": 4
        },
        {
            "pattern": r"([^,.\n]+)\s+showed?\s+.*?([^,.\n]+)\s+of\s+(\d+\.?\d*)\s*(MPa|GPa|%)",
            "relation": "DEMONSTRATES_BEHAVIOR",
            "subject_group": 1,
            "property_group": 2,
            "value_group": 3,
            "unit_group": 4
        }
    ],
    
    # 测试关系模板
    "testing_patterns": [
        {
            "pattern": r"([^,.\n]+)\s+.*?tested\s+.*?using\s+([^,.\n]+)",
            "relation": "TESTED_BY",
            "subject_group": 1,
            "object_group": 2
        },
        {
            "pattern": r"([^,.\n]+)\s+.*?characterized\s+.*?by\s+([^,.\n]+)",
            "relation": "CHARACTERIZED_BY",
            "subject_group": 1,
            "object_group": 2
        },
        {
            "pattern": r"([^,.\n]+)\s+.*?analyzed\s+.*?using\s+([^,.\n]+)",
            "relation": "ANALYZED_WITH",
            "subject_group": 1,
            "object_group": 2
        }
    ],
    
    # 工艺关系模板
    "process_patterns": [
        {
            "pattern": r"([^,.\n]+)\s+.*?cured\s+at\s+(\d+\.?\d*°C)\s+for\s+(\d+\.?\d*)\s*(hours?|hrs?)",
            "relation": "CURED_AT",
            "subject_group": 1,
            "temperature_group": 2,
            "time_group": 3,
            "time_unit_group": 4
        },
        {
            "pattern": r"([^,.\n]+)\s+.*?mixed\s+.*?for\s+(\d+\.?\d*)\s*(minutes?|mins?)",
            "relation": "MIXED_FOR",
            "subject_group": 1,
            "duration_group": 2,
            "unit_group": 3
        }
    ],
    
    # 因果关系模板
    "causal_patterns": [
        {
            "pattern": r"([^,.\n]+)\s+.*?influence[ds]?\s+([^,.\n]+)",
            "relation": "INFLUENCES",
            "subject_group": 1,
            "object_group": 2
        },
        {
            "pattern": r"([^,.\n]+)\s+.*?affect[eds]?\s+([^,.\n]+)",
            "relation": "AFFECTS",
            "subject_group": 1,
            "object_group": 2
        },
        {
            "pattern": r"([^,.\n]+)\s+.*?depend[eds]?\s+on\s+([^,.\n]+)",
            "relation": "DEPENDS_ON",
            "subject_group": 1,
            "object_group": 2
        }
    ]
}

# 针对竹纤维复合材料的专门模板
BAMBOO_COMPOSITE_TEMPLATES = {
    # 竹纤维特定实体
    "bamboo_entities": [
        "Guadua angustifolia",
        "bamboo culms",
        "bamboo chips", 
        "bamboo fiber bundles",
        "short bamboo fibers",
        "cellulose content",
        "lignin content",
        "hemicellulose content"
    ],
    
    # 地聚物特定实体
    "geopolymer_entities": [
        "potassium silicate solution",
        "potassium water glass",
        "metakaolin",
        "Metamax metakaolin",
        "fumed silica",
        "potassium hydroxide pellets",
        "K₂O·2SiO₂·11H₂O",
        "K₂O·Al₂O₃·4SiO₂·11H₂O"
    ],
    
    # 测试特定实体
    "testing_entities": [
        "four-point flexural strength",
        "third-point loading",
        "ASTM C1341-13",
        "Instron testing machine",
        "Weibull analysis",
        "median rank method",
        "JSM-6060LV JEOL",
        "Siemens/Bruker D-5000"
    ],
    
    # 关系模式
    "bamboo_relations": [
        ("bamboo fibers", "geopolymer matrix", "REINFORCES"),
        ("potassium water glass", "metakaolin", "MIXED_WITH"),
        ("curing temperature", "mechanical properties", "INFLUENCES"),
        ("fiber-matrix interface", "composite strength", "DETERMINES"),
        ("Weibull modulus", "material reliability", "INDICATES")
    ]
}

# 统计分析相关模板
STATISTICAL_ANALYSIS_TEMPLATES = {
    "weibull_patterns": [
        r"Weibull\s+(modulus|parameter|distribution|analysis)",
        r"scale\s+parameter\s+σ₀?",
        r"shape\s+parameter\s+m",
        r"median\s+rank\s+method",
        r"coefficient\s+of\s+determination",
        r"gamma\s+function\s+Γ",
        r"standard\s+deviation\s+S"
    ],
    
    "statistical_relations": [
        ("Weibull modulus", "material reliability", "INDICATES"),
        ("scale parameter", "characteristic strength", "REPRESENTS"),
        ("standard deviation", "data scatter", "MEASURES"),
        ("coefficient of determination", "model fit", "EVALUATES")
    ]
}

# 用于QA数据的简化模板
QA_EXTRACTION_TEMPLATES = {
    "qa_patterns": [
        r"What\s+is\s+([^?]+)\?",          # 定义类问题
        r"How\s+does\s+([^?]+)\?",         # 机制类问题  
        r"Why\s+is\s+([^?]+)\?",           # 原因类问题
        r"([^?]+)\s+because\s+([^.]+)",    # 因果关系答案
        r"([^?]+)\s+results?\s+in\s+([^.]+)",  # 结果关系答案
        r"([^?]+)\s+is\s+used\s+for\s+([^.]+)"  # 用途关系答案
    ],
    
    "qa_relations": [
        ("question_entity", "definition", "IS_DEFINED_AS"),
        ("cause", "effect", "RESULTS_IN"),
        ("material", "application", "USED_FOR"),
        ("method", "purpose", "APPLIED_FOR")
    ]
}

def get_template_for_material_type(material_type: str) -> Dict[str, Any]:
    """根据材料类型返回相应的模板"""
    if "bamboo" in material_type.lower() or "fiber" in material_type.lower():
        return BAMBOO_COMPOSITE_TEMPLATES
    elif "composite" in material_type.lower():
        return COMPOSITE_ENTITY_TEMPLATES
    else:
        return COMPOSITE_ENTITY_TEMPLATES

def get_enhanced_prompts_for_document_type(doc_type: str = "md") -> str:
    """根据文档类型返回优化的提示词"""
    from .optimized_prompts import OPTIMIZED_EXTRACTION_PROMPT, QA_EXTRACTION_PROMPT
    
    if doc_type.lower() == "qa":
        return QA_EXTRACTION_PROMPT
    else:
        return OPTIMIZED_EXTRACTION_PROMPT