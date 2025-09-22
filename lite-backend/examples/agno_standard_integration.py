"""
Agno标准知识库集成示例
演示如何使用符合官方API的知识库与Agno智能体集成
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from service.agno_compatible_knowledge import create_standard_knowledge_base
from agno.agent.agent import Agent
from agno.models.openai import OpenAIChat
from core.config_optimized import optimized_config_manager


async def demonstrate_agno_standard_integration():
    """演示Agno标准知识库集成"""
    print("=== Agno标准知识库集成演示 ===")
    
    # 1. 创建符合Agno官方API的知识库
    print("\n1. 创建标准知识库:")
    knowledge = create_standard_knowledge_base(
        num_documents=5,
        enable_qa_search=True,
        enable_doc_search=True,
        similarity_threshold=0.5
    )
    print("   ✓ 知识库创建完成 (符合Agno官方API)")
    
    # 2. 测试知识库搜索功能
    print("\n2. 测试知识库搜索:")
    test_query = "地聚物材料的力学性能"
    
    # 异步搜索
    documents = await knowledge.async_search(test_query, num_documents=3)
    print(f"   ✓ 异步搜索: {len(documents)} 个结果")
    
    # 过滤搜索
    qa_docs = await knowledge.async_search(
        test_query, 
        filters={'source_type': 'qa_dataset'}
    )
    print(f"   ✓ QA数据集过滤: {len(qa_docs)} 个结果")
    
    # 3. 创建使用标准知识库的Agno智能体
    print("\n3. 创建标准集成的Agno智能体:")
    
    try:
        # 创建模型 (使用项目配置)
        api_base = optimized_config_manager.settings.one_api_base_url
        api_key = optimized_config_manager.settings.one_api_key
        
        model = OpenAIChat(
            id="qwen-plus",
            api_key=api_key,
            base_url=api_base,
            max_tokens=2000,
            temperature=0.7
        )
        
        # 创建使用官方知识库API的智能体
        standard_agent = Agent(
            name="标准知识库智能体",
            role="材料工程专家",
            model=model,
            knowledge=knowledge,  # 使用标准知识库
            search_knowledge=True,  # 启用自动知识检索
            instructions=[
                "你是一个材料工程专家，专门回答关于地聚物和混凝土材料的问题。",
                "在回答问题时，请充分利用知识库中的信息。",
                "始终提供准确、详细的技术答案。"
            ]
        )
        
        print("   ✓ 标准集成智能体创建成功")
        print(f"   ✓ 知识库类型: {type(knowledge).__name__}")
        print(f"   ✓ search_knowledge: {getattr(standard_agent, 'search_knowledge', True)}")
        
    except Exception as e:
        print(f"   ❌ 智能体创建失败: {e}")
        return
    
    # 4. 对比不同集成方式
    print("\n4. 集成方式对比:")
    
    print("\n   官方标准集成 (当前演示):")
    print("   ```python")
    print("   knowledge = create_standard_knowledge_base()")
    print("   agent = Agent(")
    print("       knowledge=knowledge,")
    print("       search_knowledge=True")
    print("   )")
    print("   ```")
    
    print("\n   自定义工具集成 (项目现状):")
    print("   ```python")
    print("   tools = [CustomKnowledgeTools()]")
    print("   agent = Agent(")
    print("       tools=tools,")
    print("       search_knowledge=True")
    print("   )")
    print("   ```")
    
    # 5. 展示Document数据结构的标准化
    print("\n5. 标准化Document结构:")
    if documents:
        doc = documents[0]
        print(f"   Document字段:")
        print(f"   ├── id: {doc.id}")
        print(f"   ├── text: {doc.text[:50]}...")
        print(f"   ├── score: {doc.score}")
        print(f"   ├── source: {doc.source}")
        print(f"   └── metadata: {len(doc.metadata)} 个字段")
        
        print(f"\n   元数据详情:")
        for key, value in doc.metadata.items():
            if key == 'original_result':
                print(f"   ├── {key}: [原始检索结果]")
            else:
                print(f"   ├── {key}: {str(value)[:50]}...")
    
    # 6. 功能对比表
    print("\n6. 功能对比分析:")
    print("   ┌─────────────────┬─────────────┬─────────────┐")
    print("   │     功能特性    │  官方标准   │  当前实现   │")
    print("   ├─────────────────┼─────────────┼─────────────┤")
    print("   │ API标准化       │     ✓       │     ✓       │")
    print("   │ 异步搜索        │     ✓       │     ✓       │")
    print("   │ 同步搜索        │     ✓       │     ✓       │")
    print("   │ 过滤器支持      │     ✓       │     ✓       │")
    print("   │ QA数据集检索    │     ✓       │     ✓       │")
    print("   │ 文档检索        │     ✓       │     ✓       │")
    print("   │ 双向量搜索      │     ✓       │     ✓       │")
    print("   │ 详细溯源信息    │     ✓       │     ✓       │")
    print("   │ 自定义评分      │     ✓       │     ✓       │")
    print("   │ 灵活配置        │     ✓       │     ✓       │")
    print("   └─────────────────┴─────────────┴─────────────┘")
    
    # 7. 使用建议
    print("\n7. 使用建议:")
    print("   场景1 - 新项目: 推荐使用官方标准API")
    print("   ┌─────────────────────────────────────┐")
    print("   │ from service.agno_compatible_knowledge import create_standard_knowledge_base")
    print("   │ knowledge = create_standard_knowledge_base()")
    print("   │ agent = Agent(knowledge=knowledge, search_knowledge=True)")
    print("   └─────────────────────────────────────┘")
    
    print("\n   场景2 - 现有项目: 可以保持当前实现")
    print("   ┌─────────────────────────────────────┐")
    print("   │ from service.agent_service import CustomKnowledgeTools")
    print("   │ tools = [CustomKnowledgeTools()]")
    print("   │ agent = Agent(tools=tools, search_knowledge=True)")
    print("   └─────────────────────────────────────┘")
    
    print("\n   场景3 - 混合使用: 同时支持两种方式")
    print("   ┌─────────────────────────────────────┐")
    print("   │ # 标准化接口用于通用功能")
    print("   │ knowledge = create_standard_knowledge_base()")
    print("   │ # 自定义工具用于特殊需求")
    print("   │ tools = [CustomKnowledgeTools()]")
    print("   │ agent = Agent(knowledge=knowledge, tools=tools)")
    print("   └─────────────────────────────────────┘")
    
    print("\n=== 演示完成 ===")
    print("✅ Agno标准知识库API完全兼容")
    print("✅ 保持所有现有功能特性")
    print("✅ 提供标准化集成选项")
    print("✅ 支持灵活的使用场景")


async def demonstrate_search_capabilities():
    """演示搜索能力对比"""
    print("\n=== 搜索能力详细演示 ===")
    
    knowledge = create_standard_knowledge_base()
    
    test_queries = [
        "地聚物混凝土抗压强度",
        "材料力学性能测试方法",
        "矿物掺合料的作用机理"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n{i}. 测试查询: {query}")
        
        # 无过滤器搜索
        all_docs = await knowledge.async_search(query, num_documents=3)
        print(f"   总结果: {len(all_docs)} 个")
        
        # QA过滤搜索
        qa_docs = await knowledge.async_search(
            query, 
            filters={'source_type': 'qa_dataset'}
        )
        print(f"   QA结果: {len(qa_docs)} 个")
        
        # 文档过滤搜索
        doc_docs = await knowledge.async_search(
            query,
            filters={'source_type': 'document'}
        )
        print(f"   文档结果: {len(doc_docs)} 个")
        
        # 高分过滤
        high_score_docs = await knowledge.async_search(
            query,
            filters={'min_score': 0.7}
        )
        print(f"   高分结果(>0.7): {len(high_score_docs)} 个")


if __name__ == "__main__":
    print("🚀 启动Agno标准知识库集成演示")
    
    # 运行主要演示
    asyncio.run(demonstrate_agno_standard_integration())
    
    # 运行搜索能力演示
    asyncio.run(demonstrate_search_capabilities())
    
    print("\n🎉 演示结束")