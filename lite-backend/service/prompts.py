"""
地聚物知识图谱三元组提取提示词模板
针对地聚物材料科学领域优化的实体和关系提取提示词
"""
from __future__ import annotations
from typing import Any, Dict, List

# 分隔符配置
GEOPOLYMER_FIELD_SEP = "<SEP>"
GEOPOLYMER_TUPLE_DELIMITER = "<|>"
GEOPOLYMER_RECORD_DELIMITER = "##"
GEOPOLYMER_COMPLETION_DELIMITER = "<|COMPLETE|>"

# 地聚物领域关系类型定义
GEOPOLYMER_RELATIONSHIP_TYPES = [
    # 化学激发和合成关系
    "IS_ACTIVATOR_OF",          # 激发剂关系 (如: NaOH激发粉煤灰)
    "IS_PRECURSOR_OF",          # 前驱体关系 (如: 粉煤灰是地聚物的前驱体)
    "SYNTHESIZES",              # 合成关系 (如: 碱激发合成地聚物)
    
    # 性能和属性关系
    "HAS_PROPERTY",             # 具有性能 (如: 地聚物具有抗压强度)
    "HAS_MECHANICAL_PROPERTY",  # 具有力学性能
    "HAS_PHYSICAL_PROPERTY",    # 具有物理性能
    "HAS_THERMAL_PROPERTY",     # 具有热性能
    "HAS_DURABILITY_PROPERTY",  # 具有耐久性能
    
    # 影响和相关关系
    "INFLUENCES",               # 影响关系 (如: 养护温度影响强度)
    "INFLUENCED_BY",            # 被影响关系
    "CORRELATES_WITH",          # 相关关系 (如: 孔隙率与吸水率相关)
    "DEPENDS_ON",               # 依赖关系
    
    # 表征和测试关系
    "CHARACTERIZED_BY",         # 表征关系 (如: 通过XRD表征)
    "TESTED_BY",                # 测试关系 (如: 通过压缩试验测试)
    "MEASURED_BY",              # 测量关系
    
    # 结构和组成关系
    "HAS_STRUCTURE",            # 具有结构 (如: 具有微孔结构)
    "HAS_COMPOSITION",          # 具有组分
    "CONTAINS",                 # 包含关系 (如: 含有C-S-H凝胶)
    "CONSISTS_OF",              # 由...组成
    
    # 工艺和参数关系
    "HAS_PARAMETER",            # 具有参数 (如: 具有水胶比参数)
    "REQUIRES_CONDITION",       # 需要条件 (如: 需要特定养护条件)
    "PROCESSED_BY",             # 通过工艺处理
    
    # 应用和用途关系
    "APPLIED_IN",               # 应用于 (如: 应用于建筑材料)
    "SUITABLE_FOR",             # 适用于
    "USED_AS",                  # 用作
    
    # 文献和研究关系
    "STUDIED_BY",               # 研究者关系
    "REPORTED_IN",              # 文献报告关系
    "REFERENCED_BY",            # 引用关系
    
    # 比较和对比关系
    "BETTER_THAN",              # 优于关系
    "SIMILAR_TO",               # 相似关系
    "DIFFERENT_FROM",           # 不同于关系
    
    # 时间和发展关系
    "DEVELOPS_INTO",            # 发展为
    "EVOLVED_FROM",             # 演化自
    "LEADS_TO"                  # 导致
]

GEOPOLYMER_ENTITY_TYPES = {
    # 描述物质的实体
    "Material": [
        "Precursor",             # 原材料-前驱体 (如: 粉煤灰, 偏高岭土, 矿渣, 硅灰)
        "Activator",             # 激发剂 (如: NaOH, 碳酸钠, 电石渣)
        "Aggregate",             # 骨料 (如: 石英砂, 河砂)
        "Admixture",             # 外加剂 (如: 减水剂, CLDH)
        "ReinforcementFiber",    # 增强纤维 (总称)
        "PolymerMatrix",         # 聚合物基体 (如: 天然橡胶)
        "ChemicalCompound",      # 化学成分/物相 (如: SiO2, N-A-S-H, 钙矾石, LDH相)
        "GeopolymerProduct"      # 地聚合物产物 (最终的实验样品, 如: 砂浆, 净浆, 混凝土)
    ],

    # 增强纤维的细分
    "ReinforcementFiber": [
        "InorganicFiber",        # 无机纤维
        "NaturalFiber",          # 天然纤维
        "SyntheticFiber"         # 合成纤维
    ],

    # 描述材料或产物宏观、微观属性的实体
    "Property": [
        "MechanicalProperty",    # 力学性能 (如: 抗压强度, 弹性模量, 显微硬度)
        "PhysicalProperty",      # 物理性能 (如: 粒径, 密度, pH值, 孔隙率, 接触角)
        "ThermalProperty",       # 热性能 (如: 热应变, 热稳定性)
        "DurabilityProperty",    # 耐久性能 (如: 防水性, 软化系数, 抗高温, 抗剥落)
        "RheologicalProperty",   # 流变性能 (如: 流动度, 工作性)
        "CureProperty",          # 固化/凝结性能 (如: 凝结时间)
        "CalorimetricProperty",  # 水化热性能 (如: 放热速率, 总放热量)
      # *新增: 反应动力学性能，用于描述反应快慢、诱导期等
      # *来源: Ke et al. (2016) 论文重点关注反应动力学
        "KineticProperty"        # 反应动力学性能 (如: 反应速率, 诱导期)
    ],

    # 描述制备、合成、处理过程的实体
    "Process": [
        "SynthesisMethod",       # 合成方法 (如: 地质聚合, 碱激发)
        "MixingMethod",          # 混合方法
      # *扩展: 将热处理等明确为一种处理方法
        "TreatmentMethod",       # (预)处理方法 (如: 煅烧, 纤维碱处理)
        "CuringProcess",         # 养护过程
        "FabricationMethod"      # 制备方法 (如: 浇筑, 灌浆)
    ],

    # 描述微观/介观层面的结构实体
    "Structure": [
        "Microstructure",        # 微观结构 (如: 孔隙, 裂缝, 凝胶相)
        "Interface"              # 界面 (如: 纤维-基体界面, 界面过渡区)
    ],

    # 描述研究所用的方法论、理论模型和测试手段
    "Methodology": [
        "CharacterizationMethod",# 表征方法 (如: SEM, XRD, FTIR, DTA, TGA, NMR, MIP)
        "TestMethod",            # 性能测试方法 (如: 筛分法, 抗压强度测试)
        "ModelOrTheory"          # 模型或理论 (如: 响应面法, 准水灰比)
    ],

    # 描述实验所用的设备仪器
    "Equipment": [
        "TestingMachine",        # 测试仪器 (如: 万能试验机, 压汞仪, 热重分析仪)
        "ProcessingEquipment"    # 加工设备 (如: 搅拌机, 振动台, 马弗炉)
    ],

    # 描述抽象概念的实体
    "Concept": [
        "Application",           # 应用领域 (如: 可持续建筑材料, 土壤固化, 热屏障)
        "Parameter",             # 工艺/实验参数 (如: 水胶比, 碱当量, 矿渣替代率)
        "Phenomenon",            # 物理/化学现象 (如: 烧结, 脱水, 剥落, 晶种效应, 火山灰反应)
      # *新增: 物料作用，用于描述一种物料在体系中的功能角色
      # *来源: Ke et al. (2016) 中提到的“碳酸盐结合剂”
        "MaterialRole"           # 物料作用 (如: 碳酸盐结合剂, 填充剂, 火山灰材料)
    ],

    # 描述来源和出处的实体 (元数据)
    "Source": [
        "Researcher",            # 研究人员
        "Institution",           # 研究机构
        "Location",              # 地理位置
        "Paper"                  # 论文
    ]
}

# ==============================================================================
# 地聚合物知识图谱信息抽取与应用 - 完整版提示词(Prompt)
# 版本: 1.0
# 设计原则:
# 1. 任务分解: 将复杂的抽取任务分解为原子化的步骤，降低模型认知负荷。
# 2. 结构化输出: 强制使用标准化的类型和格式，便于程序解析和图谱构建。
# 3. 上下文丰富: 通过角色扮演和翔实的示例(Few-shot)引导模型。
# 4. 可扩展性: Schema设计灵活，便于未来扩展。
# ==============================================================================

# 提示词模板集合
GEOPOLYMER_PROMPTS: Dict[str, Any] = {}

# 默认语言
GEOPOLYMER_PROMPTS["DEFAULT_LANGUAGE"] = "English"

# ------------------------------------------------------------------------------
# 1. 主要的实体与关系提取提示词 (核心)
# ------------------------------------------------------------------------------
# 经过优化的核心提示词。它将任务分解为三步：先抽实体，再抽关系，最后提炼关键词。
# 关键改动：
# - 引入了`relationship_types`，强制关系标准化。
# - 移除了主观的`relationship_strength`。
# - 将关系描述改为直接提取原文证据，确保可追溯性。
GEOPOLYMER_PROMPTS["entity_extraction"] = """---Goal---
You are a materials science expert specializing in geopolymers. Your task is to meticulously analyze the provided scientific text. First, identify all relevant entities. Second, identify the direct relationships between those entities. Finally, provide summary keywords.
Use {language} as output language.

---Schema---
Entity Types: [{entity_types}]
Relationship Types: [{relationship_types}]

---Step 1: Entity Identification---
From the text, identify all entities that belong to the predefined "Entity Types". For each entity found, extract:
- entity_name: The name of the entity as it appears in the text. Use standard nomenclature for scientific terms.
- entity_type: The type of the entity, chosen from the "Entity Types" list.
- entity_description: A concise description summarizing the entity's role, properties, or significance *based solely on the information in the provided text*.

Format each entity as:
("entity"{tuple_delimiter}<entity_name>{tuple_delimiter}<entity_type>{tuple_delimiter}<entity_description>)

---Step 2: Relationship Identification---
From the list of entities you identified in Step 1, find all pairs of (source_entity, target_entity) that have a clear and direct relationship described in the text. For each relationship, extract:
- source_entity: The name of the source entity from Step 1.
- target_entity: The name of the target entity from Step 1.
- relationship_type: The type of the relationship, chosen from the predefined "Relationship Types" list.
- evidence: The specific sentence or clause from the text that explicitly states or strongly implies this relationship.

Format each relationship as:
("relationship"{tuple_delimiter}<source_entity>{tuple_delimiter}<target_entity>{tuple_delimiter}<relationship_type>{tuple_delimiter}<evidence>)

---Step 3: Content Keywords---
Provide a list of high-level keywords that summarize the main scientific themes of the text.
Format as:
("content_keywords"{tuple_delimiter}<list_of_keywords>)

---Execution Order---
1. First, list all entities from Step 1.
2. Second, list all relationships from Step 2.
3. Finally, provide the content keywords from Step 3.
4. Use **{record_delimiter}** to separate each record.
5. When finished, output {completion_delimiter}

######################
---Examples---
######################
{examples}

#############################
---Real Data---
######################
Entity Types: [{entity_types}]
Relationship Types: [{relationship_types}]
Text:
{input_text}
######################
Output:
"""

# ------------------------------------------------------------------------------
# 2. 用于主要提取的示例 (Few-shot Examples)
# ------------------------------------------------------------------------------
# 示例已根据上面的新格式重写。
GEOPOLYMER_PROMPTS["entity_extraction_examples"] = [
    """Example 1:

Entity_types: [Precursor, Activator, MechanicalProperty, CuringProcess, Parameter]
Relationship_Types: [IS_ACTIVATOR_OF, HAS_PROPERTY, INFLUENCED_BY, HAS_PARAMETER]
Text:
```

Fly ash-based geopolymers were synthesized using sodium hydroxide (NaOH) and sodium silicate activator solutions. The compressive strength of specimens cured at 60°C for 24 hours reached 45 MPa. The polymerization process was enhanced by maintaining the SiO2/Al2O3 molar ratio at 3.5.

```

Output:
("entity"{tuple_delimiter}"Fly ash-based geopolymers"{tuple_delimiter}"GeopolymerProduct"{tuple_delimiter}"A geopolymer material synthesized using fly ash as the precursor."{record_delimiter}
("entity"{tuple_delimiter}"sodium hydroxide (NaOH)"{tuple_delimiter}"Activator"{tuple_delimiter}"An alkaline activator solution used for synthesizing the geopolymer."{record_delimiter}
("entity"{tuple_delimiter}"sodium silicate"{tuple_delimiter}"Activator"{tuple_delimiter}"An activator solution used for synthesizing the geopolymer."{record_delimiter}
("entity"{tuple_delimiter}"compressive strength"{tuple_delimiter}"MechanicalProperty"{tuple_delimiter}"A mechanical property of the geopolymer, which reached 45 MPa under specific curing conditions."{record_delimiter}
("entity"{tuple_delimiter}"curing at 60°C for 24 hours"{tuple_delimiter}"CuringProcess"{tuple_delimiter}"A thermal curing process applied to the geopolymer specimens."{record_delimiter}
("entity"{tuple_delimiter}"SiO2/Al2O3 molar ratio"{tuple_delimiter}"Parameter"{tuple_delimiter}"A compositional parameter maintained at 3.5 to enhance the polymerization process."{record_delimiter}
("relationship"{tuple_delimiter}"sodium hydroxide (NaOH)"{tuple_delimiter}"Fly ash-based geopolymers"{tuple_delimiter}"IS_ACTIVATOR_OF"{tuple_delimiter}"Fly ash-based geopolymers were synthesized using sodium hydroxide (NaOH) and sodium silicate activator solutions."{record_delimiter}
("relationship"{tuple_delimiter}"sodium silicate"{tuple_delimiter}"Fly ash-based geopolymers"{tuple_delimiter}"IS_ACTIVATOR_OF"{tuple_delimiter}"Fly ash-based geopolymers were synthesized using sodium hydroxide (NaOH) and sodium silicate activator solutions."{record_delimiter}
("relationship"{tuple_delimiter}"Fly ash-based geopolymers"{tuple_delimiter}"compressive strength"{tuple_delimiter}"HAS_PROPERTY"{tuple_delimiter}"The compressive strength of specimens cured at 60°C for 24 hours reached 45 MPa."{record_delimiter}
("relationship"{tuple_delimiter}"compressive strength"{tuple_delimiter}"curing at 60°C for 24 hours"{tuple_delimiter}"INFLUENCED_BY"{tuple_delimiter}"The compressive strength of specimens cured at 60°C for 24 hours reached 45 MPa."{record_delimiter}
("content_keywords"{tuple_delimiter}"geopolymer synthesis, alkaline activation, mechanical properties, curing condition, fly ash"){completion_delimiter}
#############################""",

    """Example 2:

Entity_types: [Material, CharacterizationMethod, Structure, Property]
Relationship_Types: [CHARACTERIZED_BY, HAS_STRUCTURE, HAS_PROPERTY, CORRELATED_WITH]
Text:
```

The microstructural analysis of metakaolin-based geopolymers was conducted using X-ray diffraction (XRD) and scanning electron microscopy (SEM). Results showed formation of amorphous aluminosilicate gel with microporous structure. The porosity was measured at 12% using mercury intrusion porosimetry, which correlates with the observed water absorption of 8.5%.

```

Output:
("entity"{tuple_delimiter}"metakaolin-based geopolymers"{tuple_delimiter}"GeopolymerProduct"{tuple_delimiter}"A geopolymer synthesized using metakaolin as the precursor."{record_delimiter}
("entity"{tuple_delimiter}"X-ray diffraction (XRD)"{tuple_delimiter}"CharacterizationMethod"{tuple_delimiter}"An analytical technique used for microstructural analysis."{record_delimiter}
("entity"{tuple_delimiter}"scanning electron microscopy (SEM)"{tuple_delimiter}"CharacterizationMethod"{tuple_delimiter}"An imaging technique used for microstructural analysis."{record_delimiter}
("entity"{tuple_delimiter}"amorphous aluminosilicate gel"{tuple_delimiter}"Structure"{tuple_delimiter}"The binding phase formed in the geopolymer, characterized by a disordered network."{record_delimiter}
("entity"{tuple_delimiter}"microporous structure"{tuple_delimiter}"Structure"{tuple_delimiter}"The pore structure within the geopolymer matrix."{record_delimiter}
("entity"{tuple_delimiter}"porosity"{tuple_delimiter}"PhysicalProperty"{tuple_delimiter}"A physical property of the geopolymer, measured at 12%."{record_delimiter}
("entity"{tuple_delimiter}"water absorption"{tuple_delimiter}"PhysicalProperty"{tuple_delimiter}"A physical property related to the material's capacity to absorb water, measured at 8.5%."{record_delimiter}
("relationship"{tuple_delimiter}"metakaolin-based geopolymers"{tuple_delimiter}"X-ray diffraction (XRD)"{tuple_delimiter}"CHARACTERIZED_BY"{tuple_delimiter}"The microstructural analysis of metakaolin-based geopolymers was conducted using X-ray diffraction (XRD)."{record_delimiter}
("relationship"{tuple_delimiter}"metakaolin-based geopolymers"{tuple_delimiter}"amorphous aluminosilicate gel"{tuple_delimiter}"HAS_STRUCTURE"{tuple_delimiter}"Results showed formation of amorphous aluminosilicate gel."{record_delimiter}
("relationship"{tuple_delimiter}"porosity"{tuple_delimiter}"water absorption"{tuple_delimiter}"CORRELATED_WITH"{tuple_delimiter}"The porosity was measured at 12% using mercury intrusion porosimetry, which correlates with the observed water absorption of 8.5%."{record_delimiter}
("content_keywords"{tuple_delimiter}"microstructural analysis, material characterization, pore structure, amorphous gel, geopolymer"){completion_delimiter}
#############################"""
]

# ------------------------------------------------------------------------------
# 3. 循环检查与继续提取提示词
# ------------------------------------------------------------------------------
# 检查是否还有实体需要提取。修改后要求模型以JSON格式返回，并列出其认为遗漏的实体。
GEOPOLYMER_PROMPTS["entity_if_loop_extraction"] = """---Goal---
Review the provided scientific text and determine if there are any additional geopolymer-related entities that were missed in the previous extraction.
Consider all specified entity types: materials, processes, properties, methods, etc.

---Output Format---
Respond in JSON format ONLY.
If you find missed entities, the JSON should be: {"continue": true, "missed_entities": ["<entity_name_1>", "<entity_name_2>", ...]}
If you believe all entities have been extracted, the JSON should be: {"continue": false, "missed_entities": []}

######################
---Real Data---
Text:
{input_text}
######################
Output:
"""

# 继续提取提示词（当首次提取可能遗漏时）
GEOPOLYMER_PROMPTS["entity_continue_extraction"] = """---Goal---
Based on a previous analysis, it was determined that some entities and relationships were missed.
Please re-analyze the text and identify any additional geopolymer-related entities and relationships.
Use the same schema and format as the main extraction task.

---Schema---
Entity Types: [{entity_types}]
Relationship Types: [{relationship_types}]

---Reminder of Format---
Entity: ("entity"{tuple_delimiter}<entity_name>{tuple_delimiter}<entity_type>{tuple_delimiter}<entity_description>)
Relationship: ("relationship"{tuple_delimiter}<source_entity>{tuple_delimiter}<target_entity>{tuple_delimiter}<relationship_type>{tuple_delimiter}<evidence>)

---Execution---
Provide a list of the *additional* entities and relationships you have found.
Use **{record_delimiter}** to separate each record.
If you find no additional items, output "NONE".
When finished, output {completion_delimiter}

######################
---Real Data---
Text:
{input_text}
######################
Output:
"""

# ------------------------------------------------------------------------------
# 4. 其他辅助任务提示词 (总结、关键词、RAG)
# ------------------------------------------------------------------------------
# 实体描述总结提示词 (此Prompt设计已很完善，无需修改)
GEOPOLYMER_PROMPTS["summarize_entity_descriptions"] = """You are a materials science expert responsible for generating a comprehensive summary of geopolymer-related entities.
Given one or more entities and their descriptions, all related to geopolymer science, please consolidate them into a single, comprehensive description.

Make sure to include:
- Scientific accuracy and proper terminology
- Material properties and characteristics
- Synthesis and processing information
- Applications and performance data
- Chemical composition and structure details

If the provided descriptions are contradictory, resolve them based on established scientific knowledge and provide a coherent summary.
Write in third person and include entity names for full context.
Use {language} as output language.

#######
---Data---
Entities: {entity_name}
Description List: {description_list}
#######
Output:
"""

# 关键词提取提示词 (此Prompt设计已很完善，无需修改)
GEOPOLYMER_PROMPTS["keywords_extraction"] = """---Role---
You are a materials science expert tasked with identifying both high-level and low-level keywords in geopolymer research queries.

---Goal---
Given the query and conversation history about geopolymer science, list both high-level and low-level keywords.
High-level keywords focus on overarching scientific concepts, while low-level keywords focus on specific materials, compounds, parameters, or technical details.

---Instructions---
- Consider both the current query and relevant conversation history
- Focus on materials science terminology, especially geopolymer-related concepts
- Output keywords in JSON format for parsing
- Include both general materials science terms and geopolymer-specific terminology

######################
---Examples---
######################
{examples}

#############################
---Real Data---
######################
Conversation History:
{history}

Current Query: {query}
######################
Output:
"""

GEOPOLYMER_PROMPTS["keywords_extraction_examples"] = [
    # ... (关键词示例与上一轮相同，此处省略以保持简洁) ...
]

# RAG响应生成提示词 (修改了上下文和引用格式)
GEOPOLYMER_PROMPTS["rag_response"] = """---Role---
You are a materials science expert specializing in geopolymer research, responding to user queries based on the provided Knowledge Base.

---Goal---
Generate a scientifically accurate and comprehensive response based on the Knowledge Base, considering both conversation history and the current query.

---Conversation History---
{history}

---Knowledge Base---
The provided knowledge base is in JSON format and contains structured information from a Knowledge Graph (KG) and unstructured Document Chunks (DC).
Example Format:
{{
  "knowledge_graph": [
    {{"source": "Fly Ash", "relation": "HAS_CHEMICAL_COMPOSITION", "target": "SiO2", "properties": {{"percentage": 54.6}}, "doc_id": "doc1.pdf"}}, ...
  ],
  "document_chunks": [
    {{"source": "doc1.pdf", "content": "...UFFA was a by-product from the coal combustion..."}}, ...
  ]
}}

Context Data:
{context_data}

---Response Rules---
- Format: {response_type}
- Use proper scientific terminology.
- Include quantitative data (strengths, ratios, temperatures) when available.
- Use markdown formatting with appropriate section headings.
- Respond in {language}.
- Maintain continuity with conversation history.
- Under a "References" section, list up to 5 most important source documents that support your answer.
- Format references as: [Source: document_name] (e.g., [Source: doi_10.1016_j.conbuildmat.2021.125723.pdf])
- If the knowledge base is insufficient, state this limitation clearly.
- Additional user prompt: {user_prompt}

Response:
"""

# 简单RAG响应 (修改了引用格式)
GEOPOLYMER_PROMPTS["naive_rag_response"] = """---Role---
You are a materials science expert specializing in geopolymer research, responding to user queries based on the provided Document Chunks.

---Goal---
Generate a scientifically accurate response based *only* on the provided Document Chunks.

---Conversation History---
{history}

---Document Chunks (DC)---
{context_data}

---Response Rules---
- Format: {response_type}
- Use proper scientific terminology.
- Include quantitative data when available.
- Use markdown formatting with section headings.
- Respond in {language}.
- Maintain continuity with conversation history.
- Under a "References" section, list up to 5 source documents.
- Format references as: [Source: document_name]
- If information is insufficient, state so.
- Additional user prompt: {user_prompt}

Response:
"""

# 失败响应模板 (无需修改)
GEOPOLYMER_PROMPTS["fail_response"] = (
    "Sorry, I don't have sufficient information in the geopolymer knowledge base to answer that question accurately. "
    "Please provide more specific details or try rephrasing your query with materials science terminology.[no-context]"
)