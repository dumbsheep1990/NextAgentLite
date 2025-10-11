#!/usr/bin/env python3
"""
简化的GC-QA-RAG测试脚本
只测试核心QA生成算法，不涉及数据库操作
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# 添加GC-QA-RAG路径（使用相对路径）
_qa_gen_etl_path = os.path.join(project_root, 'qa_gen', 'sources', 'gc-qa-rag-etl')
_qa_gen_etl_path = os.path.abspath(_qa_gen_etl_path)
sys.path.append(_qa_gen_etl_path)

# 设置GC-QA-RAG工作目录
original_cwd = os.getcwd()
os.chdir(_qa_gen_etl_path)

try:
    from etlapp.etl.etl_generic.generate import QAGenerator, PromptConfig
    from etlapp.common.chunk import split_text_into_sentence_groups
    print("✅ GC-QA-RAG模块导入成功")
except Exception as e:
    print(f"❌ GC-QA-RAG模块导入失败: {e}")
    sys.exit(1)
finally:
    # 恢复工作目录
    os.chdir(original_cwd)

def test_qa_generation():
    """测试QA生成功能"""
    print("\n🤖 测试GC-QA-RAG核心QA生成功能...")
    
    # 测试文本
    test_content = """
    地聚物材料是一种新型的无机胶凝材料，具有优异的力学性能和耐久性。
    地聚物的制备过程包括原料预处理、碱激活、聚合固化等步骤。
    地聚物材料在建筑工程中有广泛的应用前景，可以替代传统的水泥材料。
    研究表明，地聚物材料具有良好的抗压强度和抗渗透性能。
    地聚物的微观结构呈现三维网状结构，这是其优异性能的基础。
    """
    
    try:
        # 创建QA生成器
        generator = QAGenerator()
        print("✅ QA生成器创建成功")
        
        # 生成QA对
        print("🔄 生成QA对中...")
        result = generator.generate(test_content)
        
        if result and 'Groups' in result:
            total_qa_pairs = 0
            print(f"✅ QA生成成功，包含 {len(result['Groups'])} 个组")
            
            for i, group in enumerate(result['Groups'], 1):
                summary = group.get('Summary', '')
                qa_pairs = group.get('PossibleQA', [])
                total_qa_pairs += len(qa_pairs)
                
                print(f"\n📋 组 {i}:")
                if summary:
                    print(f"  摘要: {summary}")
                
                print(f"  QA对数量: {len(qa_pairs)}")
                
                # 显示前2个QA对
                for j, qa in enumerate(qa_pairs[:2], 1):
                    question = qa.get('Question', '')
                    answer = qa.get('Answer', '')
                    print(f"\n    QA{j}:")
                    print(f"    问题: {question}")
                    print(f"    答案: {answer}")
            
            print(f"\n🎉 总共生成了 {total_qa_pairs} 个QA对")
            return True
        else:
            print("❌ QA生成失败，返回结果格式不正确")
            print(f"结果: {result}")
            return False
            
    except Exception as e:
        print(f"❌ QA生成测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_text_chunking():
    """测试文本分片功能"""
    print("\n📄 测试文本分片功能...")
    
    test_text = """
    地聚物材料是一种新型材料。它具有优异的性能。制备过程包括多个步骤。
    首先是原料预处理。然后进行碱激活。最后是聚合固化。
    地聚物在建筑中应用广泛。它可以替代传统水泥。研究表明性能优异。
    微观结构呈网状。这是性能基础。未来前景广阔。
    """
    
    try:
        groups = split_text_into_sentence_groups(test_text, group_size=5, min_group_size=3)
        print(f"✅ 文本分片成功，共 {len(groups)} 组")
        
        for i, group in enumerate(groups, 1):
            print(f"  组 {i}: {len(group)} 个句子")
            print(f"    内容: {' '.join(group[:2])}...")
            
        return True
        
    except Exception as e:
        print(f"❌ 文本分片测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始GC-QA-RAG核心功能测试")
    print("=" * 50)
    
    tests = [
        ("文本分片功能", test_text_chunking),
        ("QA生成功能", test_qa_generation),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 测试: {test_name}")
        print("-" * 30)
        
        try:
            result = test_func()
            if result:
                print(f"✅ {test_name} 测试通过")
                passed += 1
            else:
                print(f"❌ {test_name} 测试失败")
        except Exception as e:
            print(f"❌ {test_name} 测试异常: {e}")
    
    print("\n" + "=" * 50)
    print("📋 测试结果汇总:")
    print("=" * 50)
    print(f"通过: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 所有核心功能测试通过！")
        print("GC-QA-RAG集成准备就绪，可以继续集成到NextAgentLite")
    else:
        print(f"\n⚠️ {total - passed} 个测试失败")
        print("需要检查GC-QA-RAG配置和环境")

if __name__ == "__main__":
    main()