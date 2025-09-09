"""
优化的地聚物知识图谱三元组提取提示词
基于实际测试文档（竹纤维地聚物复合材料）的分析结果优化
"""

# 针对复合材料的增强实体类型
ENHANCED_GEOPOLYMER_ENTITY_TYPES = {
    # 材料实体 - 增强复合材料识别
    "Material": [
        "Precursor",                 # 前驱体材料
        "Activator",                 # 激发剂
        "ReinforcementFiber",        # 增强纤维（竹纤维、玄武岩纤维等）
        "MatrixMaterial",            # 基体材料（地聚物基体）
        "CompositeMaterial",         # 复合材料（纤维增强地聚物）
        "Aggregate",                 # 骨料
        "Admixture",                 # 外加剂
        "ChemicalCompound",          # 化学成分
        "RawMaterial"                # 原材料
    ],
    
    # 性能实体 - 细化力学性能
    "Property": [
        "MechanicalProperty",        # 力学性能
        "FlexuralProperty",          # 弯曲性能（特别重要）
        "CompressiveProperty",       # 压缩性能
        "TensileProperty",           # 拉伸性能
        "PhysicalProperty",          # 物理性能
        "ThermalProperty",           # 热性能
        "DurabilityProperty",        # 耐久性能
        "StatisticalProperty",       # 统计性能（Weibull分析等）
        "InterfaceProperty"          # 界面性能
    ],
    
    # 工艺过程 - 增强制备工艺
    "Process": [
        "SynthesisMethod",           # 合成方法
        "MixingProcess",             # 混合工艺
        "CuringProcess",             # 养护工艺
        "FiberPreparation",          # 纤维预处理
        "CompositeFormation",        # 复合材料成型
        "TestingProcess",            # 测试过程
        "TreatmentMethod"            # 处理方法
    ],
    
    # 测试方法 - 增强标准测试
    "TestMethod": [
        "MechanicalTest",            # 力学测试
        "FlexuralTest",              # 弯曲测试（如四点弯曲）
        "CompressionTest",           # 压缩测试
        "CharacterizationMethod",    # 表征方法
        "MicroscopyMethod",          # 显微方法
        "DiffractionMethod",         # 衍射方法
        "StatisticalAnalysis"        # 统计分析方法
    ],
    
    # 参数实体 - 增强实验参数
    "Parameter": [
        "GeometricParameter",        # 几何参数（尺寸、厚度等）
        "ProcessParameter",          # 工艺参数（温度、时间等）
        "CompositionParameter",      # 组成参数（比例、含量等）
        "TestParameter",             # 测试参数（加载速率等）
        "StatisticalParameter"       # 统计参数（置信区间等）
    ],
    
    # 结果实体 - 增强结果类型
    "Result": [
        "NumericalResult",           # 数值结果
        "ExperimentalResult",        # 实验结果
        "AnalysisResult",            # 分析结果
        "ComparisonResult",          # 对比结果
        "ConclusionResult"           # 结论结果
    ]
}

# 针对复合材料优化的关系类型
ENHANCED_GEOPOLYMER_RELATIONSHIP_TYPES = [
    # 材料组成关系
    "REINFORCED_BY",                 # 被...增强（如：地聚物被竹纤维增强）
    "REINFORCES",                    # 增强...
    "COMPOSED_OF",                   # 由...组成
    "CONTAINS",                      # 包含
    "MIXED_WITH",                    # 与...混合
    
    # 性能关系
    "HAS_MECHANICAL_PROPERTY",       # 具有力学性能
    "HAS_FLEXURAL_STRENGTH",         # 具有弯曲强度
    "HAS_COMPRESSIVE_STRENGTH",      # 具有压缩强度
    "SHOWS_PERFORMANCE",             # 显示性能
    "DEMONSTRATES_BEHAVIOR",         # 表现出行为
    
    # 工艺关系
    "PROCESSED_BY",                  # 通过...处理
    "CURED_AT",                      # 在...条件下养护
    "MIXED_FOR",                     # 混合...时间
    "FORMED_BY",                     # 通过...成型
    "PREPARED_USING",                # 使用...制备
    
    # 测试关系
    "TESTED_BY",                     # 通过...测试
    "MEASURED_USING",                # 使用...测量
    "CHARACTERIZED_BY",              # 通过...表征
    "ANALYZED_WITH",                 # 用...分析
    "EVALUATED_BY",                  # 通过...评估
    
    # 数值关系
    "HAS_VALUE",                     # 具有数值
    "EQUALS",                        # 等于
    "RANGES_FROM",                   # 范围从...到
    "AVERAGES",                      # 平均为
    "VARIES_WITH",                   # 随...变化
    
    # 比较关系
    "HIGHER_THAN",                   # 高于
    "LOWER_THAN",                    # 低于
    "SIMILAR_TO",                    # 相似于
    "COMPARED_WITH",                 # 与...比较
    "RELATIVE_TO",                   # 相对于
    
    # 影响关系
    "AFFECTS",                       # 影响
    "INFLUENCED_BY",                 # 被...影响
    "DEPENDS_ON",                    # 依赖于
    "CORRELATES_WITH",               # 与...相关
    "DETERMINES",                    # 决定
    
    # 原因结果关系
    "RESULTS_IN",                    # 导致
    "CAUSED_BY",                     # 由...引起
    "LEADS_TO",                      # 导致
    "DUE_TO",                        # 由于
    "BECAUSE_OF"                     # 因为
]

# 优化的三元组提取提示词 - 针对复合材料论文
OPTIMIZED_EXTRACTION_PROMPT = """---Goal---
You are a materials science expert specializing in fiber-reinforced geopolymer composites. Your task is to extract comprehensive knowledge from scientific text about composite materials, with special attention to:
1. Fiber-matrix interactions and interfaces
2. Mechanical properties and testing methods
3. Processing conditions and their effects
4. Quantitative relationships and statistical data

Use {language} as output language.

---Enhanced Schema for Composite Materials---
Entity Types: [{entity_types}]
Relationship Types: [{relationship_types}]

---Step 1: Entity Identification with Quantitative Focus---
Identify all entities with special attention to:
- Composite material names (e.g., "bamboo-reinforced geopolymer composite")
- Quantitative values with units (e.g., "4.63 MPa", "5 wt%", "50°C")
- Testing standards and methods (e.g., "ASTM C1341-13", "four-point flexural test")
- Statistical parameters (e.g., "Weibull modulus", "standard deviation")
- Processing conditions (e.g., "cured at 50°C for 24 hours")

Format: ("entity"{tuple_delimiter}<entity_name>{tuple_delimiter}<entity_type>{tuple_delimiter}<entity_description>)

---Step 2: Relationship Identification with Evidence---
Focus on extracting:
- Reinforcement relationships (fiber-matrix interactions)
- Quantitative relationships (property values and conditions)
- Processing-property relationships
- Testing-result relationships
- Comparative relationships

Format: ("relationship"{tuple_delimiter}<source_entity>{tuple_delimiter}<target_entity>{tuple_delimiter}<relationship_type>{tuple_delimiter}<evidence>)

---Step 3: Quantitative Data Extraction---
In addition to keywords, extract quantitative relationships:
Format: ("quantitative_data"{tuple_delimiter}<parameter>{tuple_delimiter}<value>{tuple_delimiter}<unit>{tuple_delimiter}<context>)

---Enhanced Examples for Composite Materials---

Example 1 - Composite Material with Quantitative Data:
Text: "The bamboo-reinforced geopolymer composite achieved a four-point flexural strength of 4.63 MPa when cured at 50°C for 24 hours."

Output:
("entity"{tuple_delimiter}"bamboo-reinforced geopolymer composite"{tuple_delimiter}"CompositeMaterial"{tuple_delimiter}"A composite material combining bamboo fibers as reinforcement with geopolymer matrix.")##
("entity"{tuple_delimiter}"four-point flexural strength"{tuple_delimiter}"FlexuralProperty"{tuple_delimiter}"The flexural strength measured using four-point bending test method.")##
("entity"{tuple_delimiter}"4.63 MPa"{tuple_delimiter}"NumericalResult"{tuple_delimiter}"The measured flexural strength value with statistical significance.")##
("entity"{tuple_delimiter}"curing at 50°C for 24 hours"{tuple_delimiter}"CuringProcess"{tuple_delimiter}"The thermal curing treatment applied to the composite.")##
("relationship"{tuple_delimiter}"bamboo-reinforced geopolymer composite"{tuple_delimiter}"four-point flexural strength"{tuple_delimiter}"HAS_FLEXURAL_STRENGTH"{tuple_delimiter}"The bamboo-reinforced geopolymer composite achieved a four-point flexural strength of 4.63 MPa.")##
("relationship"{tuple_delimiter}"four-point flexural strength"{tuple_delimiter}"curing at 50°C for 24 hours"{tuple_delimiter}"INFLUENCED_BY"{tuple_delimiter}"achieved a four-point flexural strength of 4.63 MPa when cured at 50°C for 24 hours.")##
("quantitative_data"{tuple_delimiter}"flexural_strength"{tuple_delimiter}"4.63"{tuple_delimiter}"MPa"{tuple_delimiter}"bamboo-reinforced geopolymer composite under specific curing conditions")##

Example 2 - Interface and Microstructure:
Text: "SEM micrographs revealed gaps between bamboo fibers and the geopolymer matrix, indicating weak interfacial bonding."

Output:
("entity"{tuple_delimiter}"SEM micrographs"{tuple_delimiter}"MicroscopyMethod"{tuple_delimiter}"Scanning electron microscopy images used for microstructural analysis.")##
("entity"{tuple_delimiter}"gaps"{tuple_delimiter}"InterfaceProperty"{tuple_delimiter}"Voids or spaces observed at the fiber-matrix interface.")##
("entity"{tuple_delimiter}"bamboo fibers"{tuple_delimiter}"ReinforcementFiber"{tuple_delimiter}"Natural fibers used as reinforcement in the composite.")##
("entity"{tuple_delimiter}"geopolymer matrix"{tuple_delimiter}"MatrixMaterial"{tuple_delimiter}"The binding phase in the composite material.")##
("entity"{tuple_delimiter}"weak interfacial bonding"{tuple_delimiter}"InterfaceProperty"{tuple_delimiter}"Poor adhesion between fiber and matrix as observed from microstructural analysis.")##
("relationship"{tuple_delimiter}"bamboo fibers"{tuple_delimiter}"geopolymer matrix"{tuple_delimiter}"HAS_INTERFACE_WITH"{tuple_delimiter}"gaps between bamboo fibers and the geopolymer matrix")##
("relationship"{tuple_delimiter}"gaps"{tuple_delimiter}"weak interfacial bonding"{tuple_delimiter}"INDICATES"{tuple_delimiter}"gaps between bamboo fibers and the geopolymer matrix, indicating weak interfacial bonding")##

---Execution Instructions---
1. Process the text systematically, sentence by sentence
2. Pay special attention to numerical data and units
3. Identify compound material names accurately
4. Extract complete experimental conditions
5. Capture statistical and comparative information
6. Use {record_delimiter} to separate records
7. End with {completion_delimiter}

######################
---Real Data---
######################
Entity Types: [{entity_types}]
Relationship Types: [{relationship_types}]
Text:
{input_text}
######################
Output:
"""

# 专门针对竹纤维复合材料的提示词
BAMBOO_COMPOSITE_PROMPT = """---Specialized Goal for Bamboo-Geopolymer Composites---
You are analyzing scientific text about bamboo fiber-reinforced geopolymer composites. Focus specifically on:

1. **Bamboo Fiber Characteristics:**
   - Species (e.g., Guadua angustifolia)
   - Preparation methods (chopping, processing)
   - Chemical composition (cellulose, lignin content)
   - Physical properties (size, morphology)

2. **Geopolymer Matrix:**
   - Precursor materials (metakaolin, potassium water glass)
   - Activation process and chemistry
   - Curing conditions and effects

3. **Composite Properties:**
   - Mechanical performance (flexural, compressive strength)
   - Microstructural features (interface, porosity)
   - Statistical analysis (Weibull distribution)

4. **Testing and Characterization:**
   - Standard test methods (ASTM standards)
   - Analytical techniques (SEM, XRD)
   - Statistical evaluation methods

Extract entities and relationships with emphasis on the bamboo-geopolymer system specifics.

{base_prompt}
"""

# 用于QA数据的专门提示词
QA_EXTRACTION_PROMPT = """---Goal for QA Data Extraction---
You are processing question-answer pairs about geopolymer materials. QA data often contains:
- Direct conceptual relationships in answers
- Clear cause-effect explanations
- Simplified technical descriptions
- Key terminology definitions

Focus on:
1. Concept-definition relationships from Q&A pairs
2. Cause-effect relationships explicitly stated in answers
3. Property-value relationships mentioned in responses
4. Method-application relationships

Process each Q&A pair as a unit and extract the embedded knowledge relationships.

{base_prompt}
"""