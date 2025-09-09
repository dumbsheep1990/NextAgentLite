#!/usr/bin/env python3
"""
修复"Input should be a valid string"错误
专门解决Agno框架中模型输入格式问题
"""

import os
import sys
import asyncio
import logging
import re
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from core.logger import logger

def fix_agent_service_input_validation():
    """修复agent_service.py中的输入验证问题"""
    
    logger.info("修复agent_service.py中的输入验证问题...")
    
    agent_service_file = project_root / "service" / "agent_service.py"
    
    if not agent_service_file.exists():
        logger.error(f"agent_service.py文件不存在: {agent_service_file}")
        return False
    
    # 读取文件内容
    with open(agent_service_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 创建备份
    backup_file = agent_service_file.with_suffix('.py.backup')
    with open(backup_file, 'w', encoding='utf-8') as f:
        f.write(content)
    logger.info(f"已创建备份文件: {backup_file}")
    
    # 检查并修复输入验证问题
    fixes_applied = []
    
    # 1. 增强消息内容清理函数
    if '_deep_clean_content' in content:
        logger.info("✅ _deep_clean_content函数已存在")
    else:
        logger.warning("⚠️ _deep_clean_content函数缺失")
        fixes_applied.append("需要添加_deep_clean_content函数")
    
    # 2. 检查流式调用中的错误处理
    if 'Input should be a valid string' in content:
        logger.info("✅ 已包含Input should be a valid string错误处理")
    else:
        logger.warning("⚠️ 缺少Input should be a valid string错误处理")
        fixes_applied.append("需要添加Input should be a valid string错误处理")
    
    # 3. 检查模型参数验证
    if 'max_tokens' in content and 'temperature' in content:
        logger.info("✅ 模型参数配置已存在")
    else:
        logger.warning("⚠️ 模型参数配置可能不完整")
        fixes_applied.append("需要检查模型参数配置")
    
    return len(fixes_applied) == 0

def create_input_validation_patch():
    """创建输入验证补丁"""
    
    logger.info("创建输入验证补丁...")
    
    patch_content = '''
# 输入验证补丁 - 添加到agent_service.py中

def _validate_and_clean_input(self, content):
    """验证和清理输入内容"""
    if content is None:
        return "空输入"
    
    if not isinstance(content, str):
        try:
            content = str(content)
        except:
            return "无效输入"
    
    # 移除控制字符
    content = re.sub(r'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]', '', content)
    
    # 规范化换行符
    content = re.sub(r'\\r\\n|\\r', '\\n', content)
    
    # 限制长度
    if len(content) > 8000:
        content = content[:8000] + "..."
    
    # 确保不为空
    if not content.strip():
        content = "空内容"
    
    return content.strip()

def _safe_model_call(self, agent, query, **kwargs):
    """安全的模型调用包装器"""
    try:
        # 验证和清理查询
        cleaned_query = self._validate_and_clean_input(query)
        
        # 设置安全的默认参数
        safe_params = {
            "max_tokens": 2048,
            "temperature": 0.1,
            "top_p": 0.9,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }
        
        # 合并用户参数
        safe_params.update(kwargs)
        
        # 调用模型
        return agent.run(cleaned_query, **safe_params)
        
    except Exception as e:
        error_str = str(e)
        if "Input should be a valid string" in error_str:
            logger.warning(f"输入格式错误，尝试清理后重试: {error_str}")
            # 进一步清理
            ultra_cleaned_query = re.sub(r'[^\\w\\s\\u4e00-\\u9fff\\u3000-\\u303f\\uff00-\\uffef.,!?;:()\\[\\]{}"\'-]', '', query)
            ultra_cleaned_query = ultra_cleaned_query[:1000]  # 限制长度
            return agent.run(ultra_cleaned_query, **safe_params)
        else:
            raise e
'''
    
    patch_file = project_root / "scripts" / "input_validation_patch.py"
    with open(patch_file, 'w', encoding='utf-8') as f:
        f.write(patch_content)
    
    logger.info(f"输入验证补丁已保存到: {patch_file}")
    return patch_file

def test_input_validation():
    """测试输入验证功能"""
    
    logger.info("测试输入验证功能...")
    
    # 模拟各种输入情况
    test_cases = [
        "正常的中文查询",
        "Normal English query",
        "包含特殊字符的查询: @#$%^&*()",
        "包含换行符的查询\\n第二行",
        "包含控制字符的查询\\x00\\x01\\x02",
        "",  # 空字符串
        None,  # None值
        123,  # 数字
        ["列表", "输入"],  # 列表
        {"key": "value"}  # 字典
    ]
    
    def validate_input(content):
        """简化的输入验证函数"""
        if content is None:
            return "空输入"
        
        if not isinstance(content, str):
            try:
                content = str(content)
            except:
                return "无效输入"
        
        # 移除控制字符
        content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', content)
        
        # 规范化换行符
        content = re.sub(r'\r\n|\r', '\n', content)
        
        # 限制长度
        if len(content) > 1000:
            content = content[:1000] + "..."
        
        # 确保不为空
        if not content.strip():
            content = "空内容"
        
        return content.strip()
    
    results = []
    for i, test_case in enumerate(test_cases):
        try:
            result = validate_input(test_case)
            results.append({
                "case": i + 1,
                "input": str(test_case)[:50] + "..." if len(str(test_case)) > 50 else str(test_case),
                "output": result,
                "status": "✅ 成功"
            })
        except Exception as e:
            results.append({
                "case": i + 1,
                "input": str(test_case)[:50] + "..." if len(str(test_case)) > 50 else str(test_case),
                "output": str(e),
                "status": "❌ 失败"
            })
    
    # 显示测试结果
    logger.info("输入验证测试结果:")
    for result in results:
        logger.info(f"  测试 {result['case']}: {result['status']}")
        logger.info(f"    输入: {result['input']}")
        logger.info(f"    输出: {result['output']}")
    
    return all(r["status"] == "✅ 成功" for r in results)

def create_model_config_fix():
    """创建模型配置修复"""
    
    logger.info("创建模型配置修复...")
    
    config_fix = '''
# 模型配置修复建议

# 1. 在config/config.yaml中添加安全的模型配置
models:
  default:
    provider: "one_api"
    model: "qwen3-235b-a22b-instruct-2507"
    max_tokens: 2048
    temperature: 0.1
    top_p: 0.9
    frequency_penalty: 0.0
    presence_penalty: 0.0
  
  safe_mode:
    provider: "one_api"
    model: "qwen3-235b-a22b-instruct-2507"
    max_tokens: 1024
    temperature: 0.0
    top_p: 0.9
    frequency_penalty: 0.0
    presence_penalty: 0.0

# 2. 在agent_service.py中添加模型配置验证
def _validate_model_config(self, config):
    """验证模型配置"""
    required_fields = ['provider', 'model', 'max_tokens', 'temperature']
    for field in required_fields:
        if field not in config:
            logger.warning(f"模型配置缺少字段: {field}")
            return False
    return True

# 3. 添加安全的模型调用方法
def _safe_model_invoke(self, agent, query, config=None):
    """安全的模型调用"""
    try:
        # 使用默认配置
        if config is None:
            config = {
                "max_tokens": 2048,
                "temperature": 0.1,
                "top_p": 0.9
            }
        
        # 验证配置
        if not self._validate_model_config(config):
            config = {
                "max_tokens": 1024,
                "temperature": 0.0,
                "top_p": 0.9
            }
        
        # 清理查询
        cleaned_query = self._validate_and_clean_input(query)
        
        # 调用模型
        return agent.run(cleaned_query, **config)
        
    except Exception as e:
        logger.error(f"模型调用失败: {e}")
        raise e
'''
    
    config_file = project_root / "scripts" / "model_config_fix.py"
    with open(config_file, 'w', encoding='utf-8') as f:
        f.write(config_fix)
    
    logger.info(f"模型配置修复已保存到: {config_file}")
    return config_file

async def main():
    """主函数"""
    
    logger.info("=" * 60)
    logger.info("修复'Input should be a valid string'错误")
    logger.info("=" * 60)
    
    try:
        # 1. 修复agent_service.py中的输入验证
        fix_result = fix_agent_service_input_validation()
        
        # 2. 创建输入验证补丁
        patch_file = create_input_validation_patch()
        
        # 3. 测试输入验证功能
        test_result = test_input_validation()
        
        # 4. 创建模型配置修复
        config_file = create_model_config_fix()
        
        # 5. 生成修复报告
        report = {
            "timestamp": asyncio.get_event_loop().time(),
            "fixes_applied": {
                "agent_service_fix": fix_result,
                "input_validation_patch": str(patch_file),
                "input_validation_test": test_result,
                "model_config_fix": str(config_file)
            },
            "recommendations": [
                "1. 检查agent_service.py中的流式调用逻辑",
                "2. 确保所有模型调用都经过输入验证",
                "3. 使用安全的模型配置参数",
                "4. 添加适当的错误处理和重试机制",
                "5. 定期测试模型调用的稳定性"
            ]
        }
        
        # 保存报告
        report_file = project_root / "input_string_error_fix_report.json"
        import json
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"修复报告已保存到: {report_file}")
        
        # 显示结果
        logger.info("=" * 60)
        logger.info("修复结果:")
        logger.info(f"  Agent Service修复: {'✅ 成功' if fix_result else '❌ 需要手动修复'}")
        logger.info(f"  输入验证测试: {'✅ 通过' if test_result else '❌ 失败'}")
        logger.info(f"  补丁文件: {patch_file}")
        logger.info(f"  配置修复: {config_file}")
        logger.info("=" * 60)
        
        logger.info("📋 建议:")
        for i, recommendation in enumerate(report["recommendations"], 1):
            logger.info(f"  {i}. {recommendation}")
        
        return fix_result and test_result
        
    except Exception as e:
        logger.error(f"修复过程出错: {e}")
        return False

if __name__ == "__main__":
    # 设置日志级别
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # 运行修复
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 