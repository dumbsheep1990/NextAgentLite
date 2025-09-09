#!/usr/bin/env python3
"""
测试kimi-k2模型修复脚本
验证针对"Input should be a valid string"错误的修复是否有效
"""

import asyncio
import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from core.config_optimized import optimized_config_manager
from service.agent_service import AgentService
from core.logger import logger

async def test_kimi_k2_model():
    """测试kimi-k2模型的修复"""
    logger.info("开始测试kimi-k2模型修复...")
    
    try:
        # 初始化服务
        agent_service = AgentService()
        
        # 测试查询
        test_queries = [
            "你好，请介绍一下地聚物材料的基本概念。",
            "地聚物材料的强度如何？",
            "请详细解释地聚物材料的制备工艺。",
            "地聚物材料与传统水泥材料相比有什么优势？",
            "地聚物材料在工程应用中的前景如何？"
        ]
        
        for i, query in enumerate(test_queries, 1):
            logger.info(f"测试查询 {i}: {query}")
            
            try:
                # 使用kimi-k2模型进行查询
                response = await agent_service.single_agent_query(
                    agent_name="cailiao_zhuanjia",  # 使用配置中的材料专家智能体
                    query=query,
                    stream=False,  # 先测试非流式
                    model_name="kimi-k2-siliconflow",  # 明确指定kimi-k2模型
                    search_knowledge=True
                )
                
                if response:
                    logger.info(f"✅ 查询 {i} 成功")
                    logger.info(f"响应内容长度: {len(response.content)}")
                    logger.info(f"使用的模型: {response.model_used}")
                else:
                    logger.warning(f"⚠️ 查询 {i} 返回空响应")
                    
            except Exception as e:
                logger.error(f"❌ 查询 {i} 失败: {e}")
                if "Input should be a valid string" in str(e):
                    logger.error("检测到原始错误，修复可能无效")
                else:
                    logger.error("其他类型的错误")
        
        # 测试流式查询
        logger.info("测试流式查询...")
        try:
            stream_response = agent_service.single_agent_query(
                agent_name="cailiao_zhuanjia",
                query="请简要介绍地聚物材料的定义和特点。",
                stream=True,
                model_name="kimi-k2-siliconflow",
                search_knowledge=True
            )
            
            # 处理流式响应
            async for chunk in stream_response:
                if hasattr(chunk, 'content') and chunk.content:
                    logger.info(f"流式响应: {chunk.content[:100]}...")
                    
            logger.info("✅ 流式查询测试完成")
            
        except Exception as e:
            logger.error(f"❌ 流式查询失败: {e}")
            if "Input should be a valid string" in str(e):
                logger.error("流式查询中检测到原始错误，修复可能无效")
        
        logger.info("🎉 kimi-k2模型修复测试完成")
        
    except Exception as e:
        logger.error(f"测试过程中发生错误: {e}")
        import traceback
        logger.error(traceback.format_exc())

async def test_model_creation():
    """测试模型创建过程"""
    logger.info("测试模型创建...")
    
    try:
        from service.agent_service import AgentFactory
        
        factory = AgentFactory()
        
        # 获取智能体配置
        agent_config = optimized_config_manager.get_agent_config("cailiao_zhuanjia")
        if not agent_config:
            logger.error("未找到智能体配置")
            return
        
        logger.info(f"智能体配置: {agent_config.model_provider}:{agent_config.model_id}")
        
        # 创建模型
        model = factory._create_agno_model(agent_config, "kimi-k2-siliconflow")
        if model:
            logger.info("✅ 模型创建成功")
            logger.info(f"模型ID: {getattr(model, 'id', 'unknown')}")
        else:
            logger.error("❌ 模型创建失败")
            
    except Exception as e:
        logger.error(f"模型创建测试失败: {e}")
        import traceback
        logger.error(traceback.format_exc())

async def test_message_processing():
    """测试消息处理逻辑"""
    logger.info("测试消息处理逻辑...")
    
    try:
        from service.agent_service import RoleMappedOpenAIChat
        
        # 创建测试模型实例
        model = RoleMappedOpenAIChat(
            id="kimi-k2-siliconflow",
            api_key="test",
            base_url="test"
        )
        
        # 测试消息
        test_messages = [
            {
                "role": "system",
                "content": "你是一个地聚物材料专家。"
            },
            {
                "role": "user", 
                "content": "请介绍地聚物材料的基本概念。"
            }
        ]
        
        # 测试消息处理
        processed_messages = model._process_messages(test_messages)
        logger.info(f"✅ 消息处理成功，处理了 {len(processed_messages)} 条消息")
        
        # 测试内容清理
        test_content = "这是一个测试内容\n包含换行符\r\n和一些特殊字符\x00\x01"
        cleaned_content = model._clean_message_content(test_content)
        logger.info(f"✅ 内容清理成功: {cleaned_content}")
        
        # 测试深度清理
        cleaned_messages = model._deep_clean_messages(test_messages)
        logger.info(f"✅ 深度清理成功，清理了 {len(cleaned_messages)} 条消息")
        
    except Exception as e:
        logger.error(f"消息处理测试失败: {e}")
        import traceback
        logger.error(traceback.format_exc())

async def main():
    """主测试函数"""
    logger.info("🚀 开始kimi-k2模型修复验证测试")
    
    # 测试1: 模型创建
    await test_model_creation()
    
    # 测试2: 消息处理
    await test_message_processing()
    
    # 测试3: 完整查询流程
    await test_kimi_k2_model()
    
    logger.info("🎯 所有测试完成")

if __name__ == "__main__":
    # 设置日志级别
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s'
    )
    
    # 运行测试
    asyncio.run(main()) 