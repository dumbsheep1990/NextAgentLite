"""
验证embedding模型配置修复
检查系统中是否还有硬编码的embedding模型配置
"""
import asyncio
import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from service.embedding_config_service import embedding_config_service, validate_embedding_config
from service.multilayer_retrieval_service import multilayer_retrieval_service
from service.qa_routing_service import qa_routing_service
import os


async def test_embedding_config_service():
    """测试统一的embedding配置服务"""
    print("="*50)
    print("测试统一Embedding配置服务")
    print("="*50)
    
    try:
        # 初始化配置服务
        await embedding_config_service.initialize()
        
        # 验证配置
        validation_result = validate_embedding_config()
        
        print(f"配置验证结果:")
        print(f"  ✅ 配置有效: {validation_result['valid']}")
        print(f"  📋 默认模型: {validation_result['default_model']}")
        print(f"  📋 可用模型数量: {len(validation_result['all_models'])}")
        
        if validation_result['errors']:
            print(f"  ❌ 错误:")
            for error in validation_result['errors']:
                print(f"    - {error}")
        
        # 测试获取模型路径
        try:
            full_path = embedding_config_service.get_full_model_path()
            print(f"  ✅ 完整模型路径: {full_path}")
        except Exception as e:
            print(f"  ❌ 获取模型路径失败: {e}")
            
        return validation_result['valid']
        
    except Exception as e:
        print(f"❌ 配置服务测试失败: {e}")
        return False


async def test_multilayer_service():
    """测试多层检索服务的配置"""
    print("\n" + "="*50)
    print("测试多层检索服务配置")
    print("="*50)
    
    try:
        # 检查服务初始化
        await multilayer_retrieval_service.initialize()
        
        model = multilayer_retrieval_service.default_embedding_model
        print(f"  ✅ 多层检索服务embedding模型: {model}")
        
        # 检查是否包含硬编码
        if "text-embedding-v4" in model or "Qwen3-Embedding-4B" in model:
            if not model.startswith("alibaba/"):
                print(f"  ⚠️ 可能包含硬编码: {model}")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ 多层检索服务测试失败: {e}")
        return False


def check_hardcoded_patterns():
    """检查代码中是否还有硬编码模式"""
    print("\n" + "="*50)
    print("检查硬编码模式")
    print("="*50)
    
    # 要检查的文件
    service_files = [
        "service/multilayer_retrieval_service.py",
        "service/qa_routing_service.py", 
        "service/knowledge_service.py",
        "service/qa_dataset_service.py",
        "service/hybrid_search_service.py",
        "service/qa_generation_service_simplified.py",
        "service/enhanced_task_manager.py"
    ]
    
    hardcoded_patterns = [
        '"alibaba/text-embedding-v4"',
        '"alibaba/Qwen/Qwen3-Embedding-4B"',
        '"text-embedding-v4"',
        "'alibaba/text-embedding-v4'",
        "'alibaba/Qwen/Qwen3-Embedding-4B'",
        "'text-embedding-v4'"
    ]
    
    found_issues = []
    
    for file_path in service_files:
        full_path = Path(__file__).parent.parent / file_path
        if not full_path.exists():
            print(f"  ⚠️ 文件不存在: {file_path}")
            continue
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            file_issues = []
            for pattern in hardcoded_patterns:
                if pattern in content:
                    file_issues.append(pattern)
                    
            if file_issues:
                found_issues.append({
                    'file': file_path,
                    'patterns': file_issues
                })
                print(f"  ❌ {file_path}: 发现硬编码 {file_issues}")
            else:
                print(f"  ✅ {file_path}: 无硬编码模式")
                
        except Exception as e:
            print(f"  ❌ 检查文件失败 {file_path}: {e}")
    
    return len(found_issues) == 0, found_issues


def check_environment_variables():
    """检查必要的环境变量"""
    print("\n" + "="*50)
    print("检查环境变量")
    print("="*50)
    
    required_vars = [
        "DEFAULT_EMBEDDING_MODEL",
        "GATEWAY_EMBEDDING_MODELS"
    ]
    
    found_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if value:
            found_vars.append(var)
            print(f"  ✅ {var}: {value}")
        else:
            print(f"  ❌ {var}: 未设置")
    
    if not found_vars:
        print(f"  ⚠️ 警告: 未发现任何embedding模型配置环境变量")
        print(f"  📋 请设置以下变量之一:")
        for var in required_vars:
            print(f"    - {var}")
        return False
    
    return True


async def main():
    """主测试函数"""
    print("验证Embedding模型配置修复")
    print("检查是否已消除所有硬编码配置")
    
    test_results = []
    
    # 1. 测试环境变量
    env_ok = check_environment_variables()
    test_results.append(("环境变量检查", env_ok))
    
    # 2. 测试配置服务
    config_ok = await test_embedding_config_service()
    test_results.append(("配置服务测试", config_ok))
    
    # 3. 测试多层检索服务
    multilayer_ok = await test_multilayer_service()
    test_results.append(("多层检索服务测试", multilayer_ok))
    
    # 4. 检查硬编码模式
    no_hardcode, issues = check_hardcoded_patterns()
    test_results.append(("硬编码检查", no_hardcode))
    
    # 输出总结
    print("\n" + "="*50)
    print("测试总结")
    print("="*50)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n总体结果: {passed}/{total} 项测试通过")
    
    if passed == total:
        print("🎉 所有测试通过！embedding模型配置已完全统一")
    else:
        print("⚠️ 存在问题，需要进一步修复")
        
        if not no_hardcode and issues:
            print("\n发现的硬编码问题:")
            for issue in issues:
                print(f"  文件: {issue['file']}")
                for pattern in issue['patterns']:
                    print(f"    模式: {pattern}")
    
    # 清理
    try:
        await multilayer_retrieval_service.close()
    except:
        pass


if __name__ == "__main__":
    asyncio.run(main())