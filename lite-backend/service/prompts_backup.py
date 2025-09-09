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

# 地聚物领域特定的实体类型
GEOPOLYMER_ENTITY_TYPES = [
    "material",           # 材料（地聚物、硅酸盐、铝硅酸盐等）
    "chemical_compound",  # 化学化合物（NaOH、KOH、硅酸钠等）
    "property",          # 性能属性（抗压强度、流动性、工作性等）
    "process",           # 工艺过程（固化、聚合、激发等）
    "structure",         # 微观结构（孔隙、晶体结构等）
    "equipment",         # 设备仪器（混合器、养护箱、测试仪等）
    "test_method",       # 测试方法（抗压试验、XRD分析等）
    "application",       # 应用领域（建筑、路面、防火等）
    "parameter",         # 参数（温度、湿度、配比等）
    "researcher",        # 研究人员/机构
    "location",          # 地理位置
    "paper"              # 论文/文献
]

# 提示词模板集合
GEOPOLYMER_PROMPTS: Dict[str, Any] = {}

# 默认语言
GEOPOLYMER_PROMPTS["DEFAULT_LANGUAGE"] = "English"

# 主要的实体和关系提取提示词
GEOPOLYMER_PROMPTS["entity_extraction"] = """---Goal---
Given a scientific text document about geopolymers, identify all entities of specified types and all relationships among the identified entities.
Focus on materials science concepts, chemical processes, mechanical properties, and research methodologies.
Use {language} as output language.

---Steps---
1. Identify all entities. For each identified entity, extract the following information:
- entity_name: Name of the entity, use same language as input text. For scientific terms, use standard nomenclature.
- entity_type: One of the following types: [{entity_types}]
- entity_description: Comprehensive description of the entity's attributes, properties, or significance in geopolymer research
Format each entity as ("entity"{tuple_delimiter}<entity_name>{tuple_delimiter}<entity_type>{tuple_delimiter}<entity_description>)

2. From the entities identified in step 1, identify all pairs of (source_entity, target_entity) that are *clearly related* to each other.
For each pair of related entities, extract the following information:
- source_entity: name of the source entity, as identified in step 1
- target_entity: name of the target entity, as identified in step 1
- relationship_description: explanation of how the entities are related in the context of geopolymer science
- relationship_strength: a numeric score (1-10) indicating strength of the relationship
- relationship_keywords: high-level keywords that categorize the relationship (e.g., "chemical_reaction", "mechanical_property", "synthesis_parameter")
Format each relationship as ("relationship"{tuple_delimiter}<source_entity>{tuple_delimiter}<target_entity>{tuple_delimiter}<relationship_description>{tuple_delimiter}<relationship_keywords>{tuple_delimiter}<relationship_strength>)

3. Identify high-level keywords that summarize the main concepts, themes, or topics of the entire text.
Focus on geopolymer science themes such as: synthesis, characterization, properties, applications, mechanisms.
Format the content-level keywords as ("content_keywords"{tuple_delimiter}<high_level_keywords>)

4. Return output in {language} as a single list of all the entities and relationships identified in steps 1 and 2. Use **{record_delimiter}** as the list delimiter.

5. When finished, output {completion_delimiter}

######################
---Examples---
######################
{examples}

#############################
---Real Data---
######################
Entity_types: [{entity_types}]
Text:
{input_text}
######################
Output:"""

# 地聚物领域的提取示例
GEOPOLYMER_PROMPTS["entity_extraction_examples"] = [
    """Example 1:

Entity_types: [material, chemical_compound, property, process, parameter]
Text:
```
Fly ash-based geopolymers were synthesized using sodium hydroxide (NaOH) and sodium silicate activator solutions. The compressive strength of specimens cured at 60°C for 24 hours reached 45 MPa. The polymerization process was enhanced by maintaining the SiO2/Al2O3 molar ratio at 3.5 and the Na2O/Al2O3 ratio at 1.0.
```

Output:
("entity"{tuple_delimiter}"Fly ash-based geopolymers"{tuple_delimiter}"material"{tuple_delimiter}"Fly ash-based geopolymers are inorganic polymeric materials synthesized from industrial waste fly ash and alkaline activators."){record_delimiter}
("entity"{tuple_delimiter}"Sodium hydroxide"{tuple_delimiter}"chemical_compound"{tuple_delimiter}"Sodium hydroxide (NaOH) is a strong alkaline activator commonly used in geopolymer synthesis."){record_delimiter}
("entity"{tuple_delimiter}"Sodium silicate"{tuple_delimiter}"chemical_compound"{tuple_delimiter}"Sodium silicate is an alkaline activator solution that provides silica for the geopolymerization reaction."){record_delimiter}
("entity"{tuple_delimiter}"Compressive strength"{tuple_delimiter}"property"{tuple_delimiter}"Compressive strength is a mechanical property measuring the maximum compressive stress a material can withstand."){record_delimiter}
("entity"{tuple_delimiter}"Polymerization process"{tuple_delimiter}"process"{tuple_delimiter}"Polymerization process refers to the chemical reaction forming the three-dimensional aluminosilicate network in geopolymers."){record_delimiter}
("entity"{tuple_delimiter}"Curing temperature"{tuple_delimiter}"parameter"{tuple_delimiter}"Curing temperature of 60°C is an elevated temperature condition used to accelerate geopolymer hardening."){record_delimiter}
("entity"{tuple_delimiter}"SiO2/Al2O3 molar ratio"{tuple_delimiter}"parameter"{tuple_delimiter}"SiO2/Al2O3 molar ratio of 3.5 is a critical compositional parameter controlling geopolymer properties."){record_delimiter}
("relationship"{tuple_delimiter}"Sodium hydroxide"{tuple_delimiter}"Fly ash-based geopolymers"{tuple_delimiter}"Sodium hydroxide acts as an alkaline activator in the synthesis of fly ash-based geopolymers."{tuple_delimiter}"chemical_activation, synthesis"{tuple_delimiter}9){record_delimiter}
("relationship"{tuple_delimiter}"Sodium silicate"{tuple_delimiter}"Fly ash-based geopolymers"{tuple_delimiter}"Sodium silicate serves as an activator solution providing silica for geopolymer formation."{tuple_delimiter}"chemical_activation, synthesis"{tuple_delimiter}9){record_delimiter}
("relationship"{tuple_delimiter}"Curing temperature"{tuple_delimiter}"Compressive strength"{tuple_delimiter}"Curing at 60°C for 24 hours resulted in specimens achieving 45 MPa compressive strength."{tuple_delimiter}"process_parameter, mechanical_property"{tuple_delimiter}8){record_delimiter}
("relationship"{tuple_delimiter}"SiO2/Al2O3 molar ratio"{tuple_delimiter}"Polymerization process"{tuple_delimiter}"Maintaining SiO2/Al2O3 molar ratio at 3.5 enhances the polymerization process."{tuple_delimiter}"compositional_control, chemical_process"{tuple_delimiter}8){record_delimiter}
("content_keywords"{tuple_delimiter}"geopolymer synthesis, alkaline activation, mechanical properties, process optimization, compositional design"){completion_delimiter}
#############################""",

    """Example 2:

Entity_types: [material, test_method, property, structure, equipment]
Text:
```
The microstructural analysis of metakaolin-based geopolymers was conducted using X-ray diffraction (XRD) and scanning electron microscopy (SEM). Results showed formation of amorphous aluminosilicate gel with microporous structure. The porosity was measured at 12% using mercury intrusion porosimetry, which correlates with the observed water absorption of 8.5%.
```

Output:
("entity"{tuple_delimiter}"Metakaolin-based geopolymers"{tuple_delimiter}"material"{tuple_delimiter}"Metakaolin-based geopolymers are geopolymeric materials synthesized using calcined kaolinite clay as the primary aluminosilicate source."){record_delimiter}
("entity"{tuple_delimiter}"X-ray diffraction"{tuple_delimiter}"test_method"{tuple_delimiter}"X-ray diffraction (XRD) is an analytical technique used to determine the crystalline structure and phase composition of materials."){record_delimiter}
("entity"{tuple_delimiter}"Scanning electron microscopy"{tuple_delimiter}"test_method"{tuple_delimiter}"Scanning electron microscopy (SEM) is an imaging technique used to examine the microstructural features of materials at high magnification."){record_delimiter}
("entity"{tuple_delimiter}"Amorphous aluminosilicate gel"{tuple_delimiter}"structure"{tuple_delimiter}"Amorphous aluminosilicate gel is the primary binding phase in geopolymers, characterized by a disordered three-dimensional network."){record_delimiter}
("entity"{tuple_delimiter}"Microporous structure"{tuple_delimiter}"structure"{tuple_delimiter}"Microporous structure refers to the network of small pores within the geopolymer matrix affecting its properties."){record_delimiter}
("entity"{tuple_delimiter}"Mercury intrusion porosimetry"{tuple_delimiter}"test_method"{tuple_delimiter}"Mercury intrusion porosimetry is a technique used to measure the porosity and pore size distribution of materials."){record_delimiter}
("entity"{tuple_delimiter}"Porosity"{tuple_delimiter}"property"{tuple_delimiter}"Porosity of 12% represents the volume fraction of pores in the geopolymer matrix."){record_delimiter}
("entity"{tuple_delimiter}"Water absorption"{tuple_delimiter}"property"{tuple_delimiter}"Water absorption of 8.5% indicates the material's capacity to absorb water, related to its pore structure."){record_delimiter}
("relationship"{tuple_delimiter}"X-ray diffraction"{tuple_delimiter}"Metakaolin-based geopolymers"{tuple_delimiter}"XRD was used to analyze the microstructural characteristics of metakaolin-based geopolymers."{tuple_delimiter}"characterization, microstructural_analysis"{tuple_delimiter}8){record_delimiter}
("relationship"{tuple_delimiter}"Scanning electron microscopy"{tuple_delimiter}"Metakaolin-based geopolymers"{tuple_delimiter}"SEM was employed to examine the microstructural features of metakaolin-based geopolymers."{tuple_delimiter}"characterization, microstructural_analysis"{tuple_delimiter}8){record_delimiter}
("relationship"{tuple_delimiter}"Metakaolin-based geopolymers"{tuple_delimiter}"Amorphous aluminosilicate gel"{tuple_delimiter}"Analysis revealed that metakaolin-based geopolymers contain amorphous aluminosilicate gel as the binding phase."{tuple_delimiter}"composition, microstructure"{tuple_delimiter}9){record_delimiter}
("relationship"{tuple_delimiter}"Porosity"{tuple_delimiter}"Water absorption"{tuple_delimiter}"The measured porosity of 12% correlates with the observed water absorption of 8.5%."{tuple_delimiter}"property_correlation, physical_property"{tuple_delimiter}7){record_delimiter}
("content_keywords"{tuple_delimiter}"microstructural analysis, material characterization, pore structure, amorphous gel, analytical techniques"){completion_delimiter}
#############################""",

    """Example 3:

Entity_types: [application, material, property, process, parameter]
Text:
```
High-strength geopolymer concrete demonstrated excellent fire resistance properties at temperatures up to 800°C, making it suitable for structural applications in high-temperature environments. The thermal stability was attributed to the ceramic-like nature of the geopolymer binder.
```

Output:
("entity"{tuple_delimiter}"High-strength geopolymer concrete"{tuple_delimiter}"material"{tuple_delimiter}"High-strength geopolymer concrete is a construction material with enhanced mechanical properties and thermal stability."){record_delimiter}
("entity"{tuple_delimiter}"Fire resistance"{tuple_delimiter}"property"{tuple_delimiter}"Fire resistance is the ability of a material to withstand high temperatures without significant degradation."){record_delimiter}
("entity"{tuple_delimiter}"Structural applications"{tuple_delimiter}"application"{tuple_delimiter}"Structural applications refer to the use of materials in load-bearing components of buildings and infrastructure."){record_delimiter}
("entity"{tuple_delimiter}"High-temperature environments"{tuple_delimiter}"application"{tuple_delimiter}"High-temperature environments are conditions where materials are exposed to elevated temperatures during service."){record_delimiter}
("entity"{tuple_delimiter}"Thermal stability"{tuple_delimiter}"property"{tuple_delimiter}"Thermal stability is the ability of a material to maintain its properties under elevated temperature conditions."){record_delimiter}
("entity"{tuple_delimiter}"Geopolymer binder"{tuple_delimiter}"material"{tuple_delimiter}"Geopolymer binder is the binding agent in geopolymer concrete that provides cohesion and strength."){record_delimiter}
("relationship"{tuple_delimiter}"High-strength geopolymer concrete"{tuple_delimiter}"Fire resistance"{tuple_delimiter}"High-strength geopolymer concrete demonstrates excellent fire resistance properties at temperatures up to 800°C."{tuple_delimiter}"material_property, thermal_performance"{tuple_delimiter}9){record_delimiter}
("relationship"{tuple_delimiter}"Fire resistance"{tuple_delimiter}"Structural applications"{tuple_delimiter}"Excellent fire resistance makes the material suitable for structural applications."{tuple_delimiter}"property_application, performance_requirement"{tuple_delimiter}8){record_delimiter}
("relationship"{tuple_delimiter}"Thermal stability"{tuple_delimiter}"Geopolymer binder"{tuple_delimiter}"The thermal stability is attributed to the ceramic-like nature of the geopolymer binder."{tuple_delimiter}"property_mechanism, material_characteristic"{tuple_delimiter}8){record_delimiter}
("content_keywords"{tuple_delimiter}"fire resistance, thermal stability, structural applications, high-temperature performance, geopolymer concrete"){completion_delimiter}
#############################"""
]

# 继续提取提示词（当首次提取可能遗漏时）
GEOPOLYMER_PROMPTS["entity_continue_extraction"] = """
MANY entities and relationships were missed in the last extraction. 
Please identify additional geopolymer-related entities and relationships that may have been overlooked.

---Remember Steps---

1. Identify all entities, focusing on:
- Raw materials (fly ash, metakaolin, slag, etc.)
- Chemical activators and compounds
- Processing parameters and conditions  
- Material properties and characteristics
- Testing methods and equipment
- Applications and performance requirements

2. Identify relationships, particularly focusing on:
- Synthesis relationships (material + activator → geopolymer)
- Property-performance relationships
- Process-parameter relationships
- Characterization relationships
- Application-requirement relationships

Format each entity as ("entity"{tuple_delimiter}<entity_name>{tuple_delimiter}<entity_type>{tuple_delimiter}<entity_description>)
Format each relationship as ("relationship"{tuple_delimiter}<source_entity>{tuple_delimiter}<target_entity>{tuple_delimiter}<relationship_description>{tuple_delimiter}<relationship_keywords>{tuple_delimiter}<relationship_strength>)

Use **{record_delimiter}** as the list delimiter.
When finished, output {completion_delimiter}

---Output---

Add them below using the same format:
""".strip()

# 检查是否还有实体需要提取
GEOPOLYMER_PROMPTS["entity_if_loop_extraction"] = """
---Goal---

It appears some geopolymer-related entities may have still been missed.
Consider scientific terminology, chemical compounds, material properties, testing methods, and application areas.

---Output---

Answer ONLY by `YES` OR `NO` if there are still entities that need to be added.
""".strip()

# 实体描述总结提示词
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

# 关键词提取提示词
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
    """Example 1:

Query: "How does the SiO2/Al2O3 ratio affect the compressive strength of fly ash geopolymers?"
################
Output:
{
  "high_level_keywords": ["Geopolymer properties", "Compositional effects", "Mechanical performance", "Materials optimization"],
  "low_level_keywords": ["SiO2/Al2O3 ratio", "Compressive strength", "Fly ash geopolymers", "Molar ratio", "Mechanical testing"]
}
#############################""",

    """Example 2:

Query: "What are the optimal curing conditions for metakaolin-based geopolymers?"
################
Output:
{
  "high_level_keywords": ["Process optimization", "Geopolymer synthesis", "Curing parameters", "Material processing"],
  "low_level_keywords": ["Metakaolin", "Curing temperature", "Curing time", "Humidity control", "Process conditions"]
}
#############################""",

    """Example 3:

Query: "Compare the fire resistance of geopolymer concrete with ordinary Portland cement concrete"
################
Output:
{
  "high_level_keywords": ["Material comparison", "Fire resistance", "Thermal properties", "Construction materials"],
  "low_level_keywords": ["Geopolymer concrete", "Portland cement concrete", "High temperature performance", "Thermal stability", "Fire testing"]
}
#############################"""
]

# RAG响应生成提示词
GEOPOLYMER_PROMPTS["rag_response"] = """---Role---

You are a materials science expert specializing in geopolymer research, responding to user queries based on Knowledge Graph and Document Chunks provided in JSON format.

---Goal---

Generate a scientifically accurate and comprehensive response based on the Knowledge Base, considering both conversation history and the current query. 
Ensure all information is technically sound and uses proper materials science terminology.
Focus on geopolymer synthesis, characterization, properties, and applications.

When handling relationships with timestamps:
1. Consider both semantic content and temporal information
2. For conflicting information, use scientific judgment and recent research
3. Prioritize peer-reviewed research findings over preliminary data

---Conversation History---
{history}

---Knowledge Graph and Document Chunks---
{context_data}

---Response Rules---

- Target format and length: {response_type}
- Use proper scientific terminology and nomenclature
- Include quantitative data when available (strengths, ratios, temperatures, etc.)
- Use markdown formatting with appropriate section headings
- Respond in the same language as the user's question
- Maintain continuity with conversation history
- List up to 5 most important reference sources under "References" section
- Format references as: [KG/DC] file_path
- If uncertain, state limitations clearly
- Do not include unverified information
- Additional user prompt: {user_prompt}

Response:"""

# 简单RAG响应（仅基于文档块）
GEOPOLYMER_PROMPTS["naive_rag_response"] = """---Role---

You are a materials science expert specializing in geopolymer research, responding to user queries based on Document Chunks provided in JSON format.

---Goal---

Generate a scientifically accurate response based on the provided Document Chunks, focusing on geopolymer-related content.
Ensure technical accuracy and use proper materials science terminology.

---Conversation History---
{history}

---Document Chunks(DC)---
{content_data}

---Response Rules---

- Target format and length: {response_type}
- Use proper scientific terminology
- Include quantitative data when available
- Use markdown formatting with section headings
- Respond in the same language as the user's question
- Maintain continuity with conversation history
- List up to 5 reference sources under "References" section as: [DC] file_path
- State limitations if information is insufficient
- Do not include unverified information
- Additional user prompt: {user_prompt}

Response:"""

# 失败响应模板
GEOPOLYMER_PROMPTS["fail_response"] = (
    "Sorry, I don't have sufficient information in the geopolymer knowledge base to answer that question accurately. "
    "Please provide more specific details or try rephrasing your query with materials science terminology.[no-context]"
) 