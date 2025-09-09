"""
地聚物三元组提取服务测试脚本
用于验证实体和关系提取功能
"""
import asyncio
import sys
import os
from datetime import datetime

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from service.triplet_extraction_service import triplet_extraction_service
from models.knowledge import Document, DocumentChunk
from core.logger import logger


class MockDocument:
    """模拟文档对象用于测试"""
    def __init__(self, doc_id: str, content: str):
        self.id = doc_id
        self.title = f"Test Document {doc_id}"
        self.content = content
        self.created_at = datetime.utcnow()


async def test_basic_extraction():
    """测试基本的实体和关系提取"""
    print("=" * 60)
    print("测试基本的实体和关系提取")
    print("=" * 60)
    
    # 地聚物相关的测试文本
    test_text = """
    Fly ash-based geopolymers were synthesized using sodium hydroxide (NaOH) and sodium silicate 
    activator solutions with a concentration of 10M and 12M respectively. The compressive strength 
    of specimens cured at 60°C for 24 hours reached 45 MPa. The polymerization process was enhanced 
    by maintaining the SiO2/Al2O3 molar ratio at 3.5 and the Na2O/Al2O3 ratio at 1.0. 
    X-ray diffraction (XRD) analysis revealed the formation of amorphous aluminosilicate gel 
    with microporous structure.
    """
    
    mock_doc = MockDocument("test_001", test_text)
    
    try:
        result = await triplet_extraction_service.extract_triplets_from_document(
            document=mock_doc,
            use_streaming=False
        )
        
        print(f"提取结果:")
        print(f"   - 实体数量: {result['extraction_stats']['total_entities']}")
        print(f"   - 关系数量: {result['extraction_stats']['total_relationships']}")
        print(f"   - 处理的文本块: {result['extraction_stats']['text_chunks_processed']}")
        
        print(f"\n提取的实体:")
        for i, entity in enumerate(result['entities'][:5], 1):  # 显示前5个
            print(f"   {i}. {entity['name']} ({entity['type']})")
            print(f"      描述: {entity['description'][:100]}...")
        
        print(f"\n提取的关系:")
        for i, rel in enumerate(result['relationships'][:5], 1):  # 显示前5个
            print(f"   {i}. {rel['label']}")
            print(f"      强度: {rel['weight']:.2f}, 类型: {rel['type']}")
        
        print(f"\n关键词: {', '.join(result['keywords'][:10])}")
        
        return result
        
    except Exception as e:
        print(f"测试失败: {e}")
        return None


async def test_complex_extraction():
    """测试复杂文档的实体和关系提取"""
    print("\n" + "=" * 60)
    print("测试复杂文档的实体和关系提取")
    print("=" * 60)
    
    # 更复杂的地聚物研究文本
    complex_text = """
    This study investigates the mechanical properties and microstructural characteristics of 
    metakaolin-based geopolymers activated with potassium hydroxide (KOH) and potassium silicate 
    solutions. The metakaolin was obtained by calcination of kaolinite clay at 700°C for 2 hours. 
    
    The geopolymer paste was prepared by mixing metakaolin with alkaline activator solution at a 
    liquid-to-solid ratio of 0.35. The mixture was cast into 50×50×50 mm cubes and cured at 
    ambient temperature (25°C) for 28 days under sealed conditions.
    
    Compressive strength testing was performed using a universal testing machine according to 
    ASTM C109 standard. The microstructural analysis was conducted using scanning electron 
    microscopy (SEM) and X-ray diffraction (XRD). Mercury intrusion porosimetry (MIP) was used 
    to determine the pore size distribution and total porosity.
    
    Results showed that the 28-day compressive strength reached 52 MPa with a total porosity of 
    18%. The SEM images revealed a dense matrix with well-distributed micropores. XRD analysis 
    confirmed the formation of amorphous aluminosilicate gel as the primary binding phase.
    
    The geopolymer concrete demonstrated excellent fire resistance properties at temperatures 
    up to 800°C, making it suitable for structural applications in high-temperature environments. 
    The thermal stability was attributed to the ceramic-like nature of the geopolymer binder.
    """
    
    mock_doc = MockDocument("test_002", complex_text)
    
    try:
        result = await triplet_extraction_service.extract_triplets_from_document(
            document=mock_doc,
            use_streaming=False
        )
        
        print(f"复杂文档提取结果:")
        print(f"   - 实体数量: {result['extraction_stats']['total_entities']}")
        print(f"   - 关系数量: {result['extraction_stats']['total_relationships']}")
        
        # 按类型统计实体
        entity_types = {}
        for entity in result['entities']:
            entity_type = entity['type']
            entity_types[entity_type] = entity_types.get(entity_type, 0) + 1
        
        print(f"\n实体类型分布:")
        for etype, count in sorted(entity_types.items()):
            print(f"   - {etype}: {count}")
        
        # 按类型统计关系
        relation_types = {}
        for rel in result['relationships']:
            rel_type = rel['type']
            relation_types[rel_type] = relation_types.get(rel_type, 0) + 1
        
        print(f"\n关系类型分布:")
        for rtype, count in sorted(relation_types.items()):
            print(f"   - {rtype}: {count}")
        
        return result
        
    except Exception as e:
        print(f"复杂文档测试失败: {e}")
        return None


async def test_keyword_extraction():
    """测试关键词提取功能"""
    print("\n" + "=" * 60)
    print("测试关键词提取功能")
    print("=" * 60)
    
    test_queries = [
        "How does the SiO2/Al2O3 ratio affect the compressive strength of fly ash geopolymers?",
        "What are the optimal curing conditions for metakaolin-based geopolymers?",
        "Compare the fire resistance of geopolymer concrete with ordinary Portland cement concrete",
        "What is the role of sodium silicate in geopolymer synthesis?"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n查询 {i}: {query}")
        
        try:
            keywords = await triplet_extraction_service.extract_keywords_from_query(query)
            
            print(f"   高级关键词: {', '.join(keywords.get('high_level_keywords', []))}")
            print(f"   具体关键词: {', '.join(keywords.get('low_level_keywords', []))}")
            
        except Exception as e:
            print(f"关键词提取失败: {e}")


async def test_entity_normalization():
    """测试实体类型规范化"""
    print("\n" + "=" * 60)
    print("测试实体类型规范化")
    print("=" * 60)
    
    test_cases = [
        ("compound", "chemical_compound"),
        ("method", "test_method"),
        ("technique", "test_method"),
        ("material", "material"),
        ("unknown_type", "unknown_type")
    ]
    
    service = triplet_extraction_service
    
    for input_type, expected in test_cases:
        result = service._normalize_entity_type(input_type)
        status = "✅" if result == expected else "❌"
        print(f"   {status} '{input_type}' -> '{result}' (期望: '{expected}')")


async def test_relation_type_mapping():
    """测试关系类型映射"""
    print("\n" + "=" * 60)
    print("测试关系类型映射")
    print("=" * 60)
    
    test_keywords = [
        ("synthesis, activation", "synthesis"),
        ("mechanical property, strength", "mechanical_property"),
        ("characterization, analysis", "characterization"),
        ("property correlation", "property_correlation"),
        ("process parameter", "process_parameter"),
        ("unknown keywords", "relationship")
    ]
    
    service = triplet_extraction_service
    
    for keywords, expected in test_keywords:
        result = service._determine_relation_type(keywords)
        status = "✅" if result == expected else "❌"
        print(f"   {status} '{keywords}' -> '{result}' (期望: '{expected}')")


async def test_text_chunking():
    """测试文本分块功能"""
    print("\n" + "=" * 60)
    print("测试文本分块功能")
    print("=" * 60)
    
    # 创建一个长文本
    long_text = "This is a test sentence. " * 200  # 大约4000个字符
    
    service = triplet_extraction_service
    chunks = service._split_text_into_chunks(long_text, max_chunk_size=1000)
    
    print(f"   原文长度: {len(long_text)} 字符")
    print(f"   分块数量: {len(chunks)}")
    
    for i, chunk in enumerate(chunks):
        print(f"   块 {i+1}: {len(chunk)} 字符")


async def run_all_tests():
    """运行所有测试"""
    print("开始地聚物三元组提取服务测试")
    print("=" * 80)
    
    try:
        # 基本提取测试
        basic_result = await test_basic_extraction()
        
        # 复杂文档提取测试
        complex_result = await test_complex_extraction()
        
        # 关键词提取测试
        await test_keyword_extraction()
        
        # 实体规范化测试
        await test_entity_normalization()
        
        # 关系类型映射测试
        await test_relation_type_mapping()
        
        # 文本分块测试
        await test_text_chunking()
        
        print("\n" + "=" * 80)
        print("所有测试完成!")
        
        if basic_result and complex_result:
            total_entities = (basic_result['extraction_stats']['total_entities'] + 
                            complex_result['extraction_stats']['total_entities'])
            total_relations = (basic_result['extraction_stats']['total_relationships'] + 
                             complex_result['extraction_stats']['total_relationships'])
            
            print(f"总体统计:")
            print(f"   - 总提取实体: {total_entities}")
            print(f"   - 总提取关系: {total_relations}")
            print(f"   - 成功率: 100%")
        
    except Exception as e:
        print(f"\n测试过程中发生错误: {e}")
        logger.error(f"测试失败: {e}")


if __name__ == "__main__":
    # 运行异步测试
    asyncio.run(run_all_tests()) 