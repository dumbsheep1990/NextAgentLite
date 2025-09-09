"""
通用材料科学知识图谱提取提示词系统
基于多篇论文分析，设计覆盖所有材料科学场景的通用提示词
"""

from typing import Dict, List, Any

# ==========================================
# 通用材料科学实体分类体系（分层设计）
# ==========================================

UNIVERSAL_MATERIALS_ENTITY_HIERARCHY = {
    # 第一层：材料实体（Material Entities）
    "Material": {
        # 基础材料
        "BaseMaterial": [
            "Precursor",              # 前驱体材料（粉煤灰、矿渣、硅灰等）
            "Binder",                 # 胶凝材料（水泥、地聚物等）
            "Activator",              # 激发剂（氢氧化钠、硅酸钠等）
            "Aggregate",              # 骨料（天然骨料、人工骨料）
            "Admixture",              # 外加剂（减水剂、引气剂等）
            "Additive",               # 添加剂（纤维、填料等）
            "WasteMaterial"           # 废料（工业副产品、回收材料）
        ],
        
        # 复合材料
        "CompositeMaterial": [
            "GeopolymerComposite",    # 地聚物复合材料
            "CementComposite",        # 水泥复合材料
            "FiberComposite",         # 纤维复合材料
            "LayeredComposite",       # 层状复合材料
            "HybridMaterial"          # 混合材料
        ],
        
        # 增强材料
        "ReinforcementMaterial": [
            "Fiber",                  # 纤维（天然纤维、合成纤维、无机纤维）
            "Particle",               # 颗粒增强
            "Whisker",                # 晶须
            "Platelet"                # 片状增强
        ],
        
        # 功能材料
        "FunctionalMaterial": [
            "ConductiveMaterial",     # 导电材料
            "InsulatingMaterial",     # 绝缘材料
            "MagneticMaterial",       # 磁性材料
            "OpticalMaterial",        # 光学材料
            "SmartMaterial"           # 智能材料
        ]
    },
    
    # 第二层：性能实体（Property Entities）
    "Property": {
        # 力学性能
        "MechanicalProperty": [
            "Strength",               # 强度（抗压、抗拉、抗弯等）
            "Modulus",                # 模量（弹性模量、剪切模量等）
            "Toughness",              # 韧性
            "Hardness",               # 硬度
            "Fatigue",                # 疲劳性能
            "Creep",                  # 蠕变
            "Fracture"                # 断裂性能
        ],
        
        # 物理性能
        "PhysicalProperty": [
            "Density",                # 密度
            "Porosity",               # 孔隙率
            "Permeability",           # 渗透性
            "WaterAbsorption",        # 吸水率
            "Shrinkage",              # 收缩
            "Expansion",              # 膨胀
            "Workability"             # 工作性
        ],
        
        # 热性能
        "ThermalProperty": [
            "ThermalConductivity",    # 导热系数
            "ThermalExpansion",       # 热膨胀
            "HeatCapacity",           # 热容
            "ThermalStability",       # 热稳定性
            "ThermalShock",           # 热冲击
            "FireResistance"          # 耐火性
        ],
        
        # 化学性能
        "ChemicalProperty": [
            "ChemicalResistance",     # 化学稳定性
            "Corrosion",              # 腐蚀性能
            "Carbonation",            # 碳化
            "Leaching",               # 浸出性
            "pHValue",                # pH值
            "Reactivity"              # 反应活性
        ],
        
        # 耐久性能
        "DurabilityProperty": [
            "FreezeThaw",             # 冻融循环
            "Weathering",             # 风化
            "Aging",                  # 老化
            "FatigueLife",            # 疲劳寿命
            "ServiceLife"             # 使用寿命
        ],
        
        # 微观性能
        "MicroProperty": [
            "MicroStructure",         # 微观结构
            "CrystalStructure",       # 晶体结构
            "PhaseComposition",       # 相组成
            "SurfaceArea",            # 比表面积
            "PoreStructure"           # 孔结构
        ]
    },
    
    # 第三层：工艺实体（Process Entities）
    "Process": {
        # 制备工艺
        "PreparationProcess": [
            "Mixing",                 # 混合
            "Molding",                # 成型
            "Casting",                # 浇筑
            "Compaction",             # 压实
            "Pelletization",          # 造粒
            "Sintering"               # 烧结
        ],
        
        # 处理工艺
        "TreatmentProcess": [
            "HeatTreatment",          # 热处理
            "ChemicalTreatment",      # 化学处理
            "MechanicalTreatment",    # 机械处理
            "SurfaceTreatment",       # 表面处理
            "Carbonation",            # 碳化处理
            "Activation"              # 活化处理
        ],
        
        # 养护工艺
        "CuringProcess": [
            "AmbientCuring",          # 常温养护
            "HeatCuring",             # 热养护
            "SteamCuring",            # 蒸汽养护
            "AutoclaveCuring",        # 高压养护
            "WetCuring",              # 湿养护
            "DryCuring"               # 干养护
        ]
    },
    
    # 第四层：测试方法实体（Testing Method Entities）
    "TestMethod": {
        # 力学测试
        "MechanicalTest": [
            "CompressionTest",        # 压缩试验
            "TensileTest",            # 拉伸试验
            "FlexuralTest",           # 弯曲试验
            "ShearTest",              # 剪切试验
            "ImpactTest",             # 冲击试验
            "FatigueTest",            # 疲劳试验
            "HardnessTest"            # 硬度试验
        ],
        
        # 物理测试
        "PhysicalTest": [
            "DensityTest",            # 密度测试
            "PorosityTest",           # 孔隙率测试
            "PermeabilityTest",       # 渗透性测试
            "ShrinkageTest",          # 收缩测试
            "WorkabilityTest"         # 工作性测试
        ],
        
        # 微观表征
        "CharacterizationMethod": [
            "SEM",                    # 扫描电镜
            "TEM",                    # 透射电镜
            "XRD",                    # X射线衍射
            "FTIR",                   # 红外光谱
            "NMR",                    # 核磁共振
            "TGA",                    # 热重分析
            "DSC",                    # 差示扫描量热
            "XPS",                    # X射线光电子能谱
            "AFM"                     # 原子力显微镜
        ],
        
        # 标准规范
        "Standard": [
            "ASTMStandard",           # ASTM标准
            "ISOStandard",            # ISO标准
            "BSStandard",             # BS标准
            "JISStandard",            # JIS标准
            "GBStandard"              # GB标准
        ]
    },
    
    # 第五层：参数实体（Parameter Entities）
    "Parameter": {
        # 配方参数
        "CompositionParameter": [
            "Ratio",                  # 比率（水胶比、碱硅比等）
            "Content",                # 含量（掺量、替代率等）
            "Concentration",          # 浓度
            "Proportion"              # 比例
        ],
        
        # 工艺参数
        "ProcessParameter": [
            "Temperature",            # 温度
            "Pressure",               # 压力
            "Time",                   # 时间
            "Speed",                  # 速度
            "Humidity",               # 湿度
            "Atmosphere"              # 气氛
        ],
        
        # 几何参数
        "GeometricParameter": [
            "Size",                   # 尺寸
            "Dimension",              # 尺寸规格
            "Thickness",              # 厚度
            "Diameter",               # 直径
            "Length",                 # 长度
            "Volume"                  # 体积
        ]
    },
    
    # 第六层：环境与应用实体（Environment & Application Entities)
    "Application": {
        # 应用领域
        "ApplicationField": [
            "Construction",           # 建筑工程
            "Infrastructure",         # 基础设施
            "Aerospace",              # 航空航天
            "Automotive",             # 汽车工业
            "Electronics",            # 电子工业
            "Energy",                 # 能源领域
            "Environmental"           # 环境工程
        ],
        
        # 环境条件
        "Environment": [
            "HighTemperature",        # 高温环境
            "LowTemperature",         # 低温environment
            "Corrosive",              # 腐蚀环境
            "Marine",                 # 海洋环境
            "Seismic",                # 地震环境
            "Chemical"                # 化学环境
        ]
    }
}

# ==========================================
# 通用材料科学关系类型体系
# ==========================================

UNIVERSAL_MATERIALS_RELATIONSHIPS = {
    # 组成关系（Composition Relations）
    "Composition": [
        "CONTAINS",                   # 包含
        "COMPOSED_OF",                # 由...组成
        "CONSISTS_OF",                # 由...构成
        "INCLUDES",                   # 包括
        "INCORPORATES",               # 掺入
        "BLENDED_WITH",               # 与...共混
        "REINFORCED_BY",              # 被...增强
        "MODIFIED_BY"                 # 被...改性
    ],
    
    # 性能关系（Property Relations） 
    "Property": [
        "HAS_PROPERTY",               # 具有性能
        "SHOWS_BEHAVIOR",             # 表现出行为
        "EXHIBITS",                   # 展现
        "DEMONSTRATES",               # 证明具有
        "ACHIEVES",                   # 达到
        "REACHES",                    # 到达
        "MAINTAINS",                  # 保持
        "LOSES"                       # 失去
    ],
    
    # 工艺关系（Process Relations）
    "Process": [
        "PROCESSED_BY",               # 通过...处理
        "PREPARED_USING",             # 使用...制备
        "CURED_AT",                   # 在...条件下养护
        "HEATED_TO",                  # 加热到
        "COOLED_TO",                  # 冷却到
        "MIXED_FOR",                  # 混合...时间
        "TREATED_WITH",               # 用...处理
        "ACTIVATED_BY"                # 被...激发
    ],
    
    # 测试关系（Testing Relations）
    "Testing": [
        "TESTED_BY",                  # 通过...测试
        "MEASURED_USING",             # 使用...测量
        "CHARACTERIZED_BY",           # 通过...表征
        "ANALYZED_WITH",              # 用...分析
        "EVALUATED_BY",               # 通过...评估
        "DETERMINED_BY",              # 由...确定
        "ASSESSED_USING",             # 使用...评估
        "MONITORED_BY"                # 由...监测
    ],
    
    # 数量关系（Quantitative Relations）
    "Quantitative": [
        "EQUALS",                     # 等于
        "HIGHER_THAN",                # 高于
        "LOWER_THAN",                 # 低于
        "RANGES_FROM",                # 范围从...到
        "VARIES_WITH",                # 随...变化
        "INCREASES_WITH",             # 随...增加
        "DECREASES_WITH",             # 随...减少
        "PROPORTIONAL_TO"             # 与...成比例
    ],
    
    # 影响关系（Influence Relations）
    "Influence": [
        "AFFECTS",                    # 影响
        "INFLUENCES",                 # 影响
        "CONTROLS",                   # 控制
        "DETERMINES",                 # 决定
        "DEPENDS_ON",                 # 依赖于
        "RELATED_TO",                 # 与...相关
        "CORRELATES_WITH",            # 与...相关
        "GOVERNED_BY"                 # 受...控制
    ],
    
    # 因果关系（Causal Relations）
    "Causal": [
        "CAUSES",                     # 引起
        "RESULTS_IN",                 # 导致
        "LEADS_TO",                   # 导致
        "INDUCED_BY",                 # 由...引起
        "ATTRIBUTED_TO",              # 归因于
        "DUE_TO",                     # 由于
        "BECAUSE_OF",                 # 因为
        "TRIGGERS"                    # 触发
    ],
    
    # 比较关系（Comparison Relations）
    "Comparison": [
        "BETTER_THAN",                # 优于
        "WORSE_THAN",                 # 劣于
        "SIMILAR_TO",                 # 相似于
        "DIFFERENT_FROM",             # 不同于
        "COMPARED_WITH",              # 与...比较
        "RELATIVE_TO",                # 相对于
        "EQUIVALENT_TO",              # 等效于
        "SUPERIOR_TO"                 # 优于
    ],
    
    # 应用关系（Application Relations）
    "Application": [
        "USED_FOR",                   # 用于
        "APPLIED_IN",                 # 应用于
        "SUITABLE_FOR",               # 适用于
        "DESIGNED_FOR",               # 设计用于
        "INTENDED_FOR",               # 旨在用于
        "EMPLOYED_IN",                # 采用于
        "UTILIZED_IN",                # 利用于
        "IMPLEMENTED_IN"              # 实施于
    ]
}

# ==========================================
# 通用材料科学提取提示词模板
# ==========================================

UNIVERSAL_MATERIALS_EXTRACTION_PROMPT = """---Goal---
You are a materials science expert analyzing scientific literature. Your task is to extract comprehensive knowledge from materials science texts covering various domains including:
- Geopolymers and alkali-activated materials
- Composite materials and reinforcement systems
- Cement and concrete technology
- Material characterization and testing
- Processing and manufacturing
- Property-structure relationships

Use {language} as output language.

---Universal Materials Science Schema---
Entity Categories: {entity_categories}
Relationship Categories: {relationship_categories}

---Step 1: Comprehensive Entity Identification---
Extract all materials science entities with focus on:

**Materials**: Identify all materials including precursors, binders, aggregates, composites, and waste materials
**Properties**: Extract mechanical, physical, thermal, chemical, and durability properties
**Processes**: Capture all preparation, treatment, and curing processes
**Testing**: Include all characterization methods, testing procedures, and standards
**Parameters**: Extract quantitative parameters, ratios, concentrations, and conditions
**Applications**: Identify application fields and environmental conditions

For each entity, provide:
- entity_name: Standard scientific terminology
- entity_type: From the hierarchical classification
- entity_description: Concise description based on text context

Format: ("entity"{tuple_delimiter}<entity_name>{tuple_delimiter}<entity_type>{tuple_delimiter}<entity_description>)

---Step 2: Multi-dimensional Relationship Identification---
Extract relationships across multiple dimensions:

**Composition Relationships**: What materials contain or are composed of others
**Property Relationships**: What properties materials exhibit or achieve
**Process Relationships**: How materials are prepared, treated, or processed
**Testing Relationships**: How properties are measured or characterized
**Quantitative Relationships**: Numerical values, ranges, and comparisons
**Causal Relationships**: What causes changes in properties or behavior
**Application Relationships**: Where and how materials are used

Format: ("relationship"{tuple_delimiter}<source_entity>{tuple_delimiter}<target_entity>{tuple_delimiter}<relationship_type>{tuple_delimiter}<evidence>)

---Step 3: Quantitative Data Extraction---
Extract numerical data with context:
Format: ("quantitative"{tuple_delimiter}<parameter>{tuple_delimiter}<value>{tuple_delimiter}<unit>{tuple_delimiter}<context>)

---Step 4: Technical Keywords---
Provide domain-specific keywords:
Format: ("keywords"{tuple_delimiter}<keyword_list>)

---Enhanced Guidelines---
1. **Capture Complete Material Names**: Include modifiers (e.g., "fly ash-based geopolymer", "bamboo-reinforced composite")
2. **Extract All Numerical Values**: Include measurements, percentages, ratios, temperatures, pressures
3. **Identify Standard References**: ASTM, ISO, GB standards and test methods
4. **Note Processing Conditions**: Temperature, time, pressure, atmosphere details
5. **Include Statistical Data**: Standard deviations, confidence intervals, R² values
6. **Capture Microstructural Features**: Phase compositions, crystal structures, morphologies

---Examples Across Different Material Types---

Example 1 - Geopolymer System:
Text: "Fly ash-based geopolymer activated with 10M NaOH solution achieved 45 MPa compressive strength after curing at 60°C for 24 hours."

Output:
("entity"{tuple_delimiter}"fly ash-based geopolymer"{tuple_delimiter}"GeopolymerComposite"{tuple_delimiter}"A geopolymer synthesized using fly ash as the primary aluminosilicate precursor.")##
("entity"{tuple_delimiter}"10M NaOH solution"{tuple_delimiter}"Activator"{tuple_delimiter}"Sodium hydroxide alkaline activator solution at 10 molar concentration.")##
("entity"{tuple_delimiter}"compressive strength"{tuple_delimiter}"Strength"{tuple_delimiter}"Mechanical property measuring resistance to axial compression loading.")##
("relationship"{tuple_delimiter}"fly ash-based geopolymer"{tuple_delimiter}"10M NaOH solution"{tuple_delimiter}"ACTIVATED_BY"{tuple_delimiter}"Fly ash-based geopolymer activated with 10M NaOH solution")##
("relationship"{tuple_delimiter}"fly ash-based geopolymer"{tuple_delimiter}"compressive strength"{tuple_delimiter}"ACHIEVES"{tuple_delimiter}"achieved 45 MPa compressive strength")##
("quantitative"{tuple_delimiter}"compressive_strength"{tuple_delimiter}"45"{tuple_delimiter}"MPa"{tuple_delimiter}"fly ash-based geopolymer after specific curing")##

Example 2 - Composite Material:
Text: "The addition of 20% steel fibers improved the flexural strength of concrete from 4.2 to 8.6 MPa."

Output:
("entity"{tuple_delimiter}"steel fibers"{tuple_delimiter}"Fiber"{tuple_delimiter}"Metallic fibers used as reinforcement in concrete composites.")##
("entity"{tuple_delimiter}"concrete"{tuple_delimiter}"CementComposite"{tuple_delimiter}"Cement-based composite material used in construction.")##
("entity"{tuple_delimiter}"flexural strength"{tuple_delimiter}"Strength"{tuple_delimiter}"Mechanical property measuring resistance to bending loads.")##
("relationship"{tuple_delimiter}"steel fibers"{tuple_delimiter}"concrete"{tuple_delimiter}"REINFORCED_BY"{tuple_delimiter}"concrete reinforced with steel fibers")##
("relationship"{tuple_delimiter}"steel fibers"{tuple_delimiter}"flexural strength"{tuple_delimiter}"INCREASES"{tuple_delimiter}"improved the flexural strength from 4.2 to 8.6 MPa")##
("quantitative"{tuple_delimiter}"fiber_content"{tuple_delimiter}"20"{tuple_delimiter}"%"{tuple_delimiter}"steel fiber addition to concrete")##

---Execution Instructions---
1. Process text systematically, preserving all technical details
2. Use hierarchical entity classification for precise categorization
3. Extract complete quantitative information with units and context
4. Identify all standard test methods and procedures
5. Capture environmental and processing conditions completely
6. Note author names, institutions, and citations when mentioned
7. Use {record_delimiter} to separate records
8. End with {completion_delimiter}

Entity Categories: {entity_categories}
Relationship Categories: {relationship_categories}
Text: {input_text}
Output:
"""

# ==========================================
# QA数据专用提示词
# ==========================================

UNIVERSAL_QA_EXTRACTION_PROMPT = """---Goal for QA Data---
Extract knowledge from materials science question-answer pairs. QA data typically contains:
- Direct conceptual definitions and explanations
- Clear cause-effect relationships 
- Simplified technical descriptions
- Comparative information

Focus on extracting:
1. **Concept Definitions**: What materials, properties, or processes are defined
2. **Mechanism Explanations**: How processes work or why phenomena occur
3. **Relationship Descriptions**: Direct statements about material interactions
4. **Property Correlations**: How different properties relate to each other

Process each Q&A pair to extract embedded scientific relationships and facts.

{base_extraction_template}
"""

# ==========================================
# 自适应提取策略配置
# ==========================================

ADAPTIVE_EXTRACTION_CONFIG = {
    "document_types": {
        "md": {
            "prompt": UNIVERSAL_MATERIALS_EXTRACTION_PROMPT,
            "chunk_size": 1200,  # 减少到1200字符，适合2-3个段落
            "overlap": 150,      # 增加重叠，确保跨段落关系不丢失
            "focus": "comprehensive"
        },
        "qa": {
            "prompt": UNIVERSAL_QA_EXTRACTION_PROMPT,
            "chunk_size": 800,   # QA数据更小块，聚焦单个概念
            "overlap": 100,
            "focus": "conceptual"
        },
        "pdf": {
            "prompt": UNIVERSAL_MATERIALS_EXTRACTION_PROMPT,
            "chunk_size": 1000,  # PDF文档更细致分割
            "overlap": 200,      # 更大重叠，处理格式复杂性
            "focus": "technical"
        }
    },
    
    "material_domains": {
        "geopolymer": {
            "key_entities": ["Precursor", "Activator", "GeopolymerComposite", "Strength", "Curing"],
            "key_relationships": ["ACTIVATED_BY", "HAS_PROPERTY", "CURED_AT", "ACHIEVES"]
        },
        "composite": {
            "key_entities": ["Fiber", "CompositeMaterial", "ReinforcementMaterial", "Interface"],
            "key_relationships": ["REINFORCED_BY", "COMPOSED_OF", "STRENGTHENED_BY"]
        },
        "cement": {
            "key_entities": ["Binder", "Aggregate", "Admixture", "Hydration"],
            "key_relationships": ["MIXED_WITH", "HYDRATES_TO", "SETS_AT"]
        }
    }
}

def get_universal_entity_list() -> List[str]:
    """获取扁平化的通用实体类型列表"""
    entities = []
    for category, subcategories in UNIVERSAL_MATERIALS_ENTITY_HIERARCHY.items():
        if isinstance(subcategories, dict):
            for subcat, items in subcategories.items():
                entities.extend(items)
        else:
            entities.extend(subcategories)
    return entities

def get_universal_relationship_list() -> List[str]:
    """获取扁平化的通用关系类型列表"""
    relationships = []
    for category, items in UNIVERSAL_MATERIALS_RELATIONSHIPS.items():
        relationships.extend(items)
    return relationships

def get_adaptive_config(document_type: str = "md", material_domain: str = None) -> Dict[str, Any]:
    """根据文档类型和材料领域获取自适应配置"""
    base_config = ADAPTIVE_EXTRACTION_CONFIG["document_types"].get(document_type, 
                                                                  ADAPTIVE_EXTRACTION_CONFIG["document_types"]["md"])
    
    if material_domain and material_domain in ADAPTIVE_EXTRACTION_CONFIG["material_domains"]:
        domain_config = ADAPTIVE_EXTRACTION_CONFIG["material_domains"][material_domain]
        base_config.update(domain_config)
    
    return base_config