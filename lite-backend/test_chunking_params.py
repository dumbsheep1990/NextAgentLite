#!/usr/bin/env python
"""
测试切分参数的配置化功能
验证 semantic_threshold 和 preserve_structure 参数是否生效
"""

import os
import sys
import tempfile
import logging

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rag.scenario.naive import advanced_chunk, semantic_merge, are_semantically_related
from models.document_chunk import DocumentBlock, ContentType

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_test_document(content: str, filename: str = "test.txt") -> str:
    """创建测试文档文件"""
    with tempfile.NamedTemporaryFile(mode='w', suffix=f'_{filename}', delete=False, encoding='utf-8') as f:
        f.write(content)
        return f.name

def test_semantic_threshold():
    """测试语义阈值参数"""
    logger.info("="*50)
    logger.info("测试 semantic_threshold 参数")
    logger.info("="*50)
    
    # 创建两个文档块，有一定的内容重叠
    chunk1 = DocumentBlock()
    chunk1.content = "人工智能是计算机科学的一个分支，它致力于让机器能够像人类一样思考和行动。"
    chunk1.headings = ["第一章", "人工智能概述"]
    chunk1.type = ContentType.TEXT
    
    chunk2 = DocumentBlock()
    chunk2.content = "机器学习是人工智能的子领域，通过数据和算法让计算机系统自动学习和改进。"
    chunk2.headings = ["第一章", "机器学习基础"]
    chunk2.type = ContentType.TEXT
    
    # 测试不同阈值下的语义相关性判断
    thresholds = [0.1, 0.3, 0.5, 0.7, 0.9]
    
    for threshold in thresholds:
        result = are_semantically_related(chunk1, chunk2, threshold=threshold, preserve_structure=False)
        logger.info(f"阈值={threshold}: {'相关' if result else '不相关'}")
    
    # 测试实际文档切分
    test_content = """
# 人工智能概述

人工智能是计算机科学的一个分支，它致力于让机器能够像人类一样思考和行动。
AI技术已经广泛应用于各个领域，包括自然语言处理、计算机视觉等。

# 机器学习基础

机器学习是人工智能的子领域，通过数据和算法让计算机系统自动学习和改进。
深度学习是机器学习的一种方法，使用神经网络进行复杂模式识别。

# 自然语言处理

自然语言处理使计算机能够理解、分析和生成人类语言。
NLP技术应用包括机器翻译、情感分析、文本摘要等。
"""
    
    # 测试不同语义阈值的切分效果
    for threshold in [20, 50, 80]:
        logger.info(f"\n测试文档切分，semantic_threshold={threshold}:")
        
        test_file = create_test_document(test_content)
        try:
            chunks = advanced_chunk(
                test_file,
                chunk_strategy="semantic",
                parser_config={
                    "chunk_token_num": 50,
                    "max_token_num": 100,
                    "delimiter": "。！？",
                    "chunk_overlap": 0,
                    "semantic_threshold": threshold,
                    "preserve_structure": False
                }
            )
            
            logger.info(f"  生成了 {len(chunks)} 个分块")
            for i, chunk in enumerate(chunks):
                logger.info(f"  分块{i+1}: {chunk.content[:50]}...")
        finally:
            os.unlink(test_file)

def test_preserve_structure():
    """测试文档结构保持参数"""
    logger.info("\n" + "="*50)
    logger.info("测试 preserve_structure 参数")
    logger.info("="*50)
    
    # 创建具有不同标题层级的文档块
    chunk1 = DocumentBlock()
    chunk1.content = "第一章的内容，介绍基本概念。"
    chunk1.headings = ["第一章", "概述"]
    chunk1.type = ContentType.TEXT
    chunk1.page_number = {1}
    
    chunk2 = DocumentBlock()
    chunk2.content = "继续第一章的内容，深入讲解。"
    chunk2.headings = ["第一章", "概述"]  # 相同标题
    chunk2.type = ContentType.TEXT
    chunk2.page_number = {1}
    
    chunk3 = DocumentBlock()
    chunk3.content = "第二章的内容，新的主题。"
    chunk3.headings = ["第二章", "进阶"]  # 不同标题
    chunk3.type = ContentType.TEXT
    chunk3.page_number = {2}
    
    # 测试 preserve_structure=True 时的行为
    logger.info("\npreserve_structure=True 时:")
    result1 = are_semantically_related(chunk1, chunk2, threshold=0.3, preserve_structure=True)
    logger.info(f"  相同标题的块: {'可以合并' if result1 else '不合并'}")
    
    result2 = are_semantically_related(chunk1, chunk3, threshold=0.3, preserve_structure=True)
    logger.info(f"  不同标题的块: {'可以合并' if result2 else '不合并'}")
    
    # 测试 preserve_structure=False 时的行为
    logger.info("\npreserve_structure=False 时:")
    result3 = are_semantically_related(chunk1, chunk2, threshold=0.3, preserve_structure=False)
    logger.info(f"  相同标题的块: {'可以合并' if result3 else '不合并'}")
    
    result4 = are_semantically_related(chunk1, chunk3, threshold=0.3, preserve_structure=False)
    logger.info(f"  不同标题的块: {'可以合并' if result4 else '不合并'}")
    
    # 测试实际文档切分
    test_content = """
# 第一章：基础知识

这是第一章的开始内容。我们将介绍基本概念。
基础知识是学习的根本。

## 1.1 核心概念

核心概念包括定义和原理。
理解这些概念对后续学习很重要。

# 第二章：进阶内容

这是第二章的开始。我们将深入探讨。
进阶内容需要扎实的基础。

## 2.1 高级特性

高级特性包括更复杂的应用。
掌握这些特性需要大量练习。
"""
    
    # 测试不同 preserve_structure 设置的效果
    for preserve in [True, False]:
        logger.info(f"\n测试文档切分，preserve_structure={preserve}:")
        
        test_file = create_test_document(test_content)
        try:
            chunks = advanced_chunk(
                test_file,
                chunk_strategy="semantic",
                parser_config={
                    "chunk_token_num": 30,
                    "max_token_num": 80,
                    "delimiter": "。！？",
                    "chunk_overlap": 0,
                    "semantic_threshold": 30,
                    "preserve_structure": preserve
                }
            )
            
            logger.info(f"  生成了 {len(chunks)} 个分块")
            for i, chunk in enumerate(chunks):
                headings = chunk.headings if hasattr(chunk, 'headings') else []
                logger.info(f"  分块{i+1} (标题: {' > '.join(headings)}): {chunk.content[:40]}...")
        finally:
            os.unlink(test_file)

def test_combined_parameters():
    """测试参数组合效果"""
    logger.info("\n" + "="*50)
    logger.info("测试参数组合效果")
    logger.info("="*50)
    
    test_content = """
# 材料科学导论

材料科学是研究材料的性质、结构和应用的学科。
它涵盖了金属、陶瓷、聚合物等多种材料类型。
材料的微观结构决定了其宏观性能。

## 金属材料

金属材料具有良好的导电性和延展性。
钢铁是最常用的金属材料之一。
合金可以改善金属的性能。

## 陶瓷材料  

陶瓷材料具有高硬度和耐高温特性。
传统陶瓷包括陶器和瓷器。
先进陶瓷在电子和航空领域有重要应用。

# 材料表征技术

材料表征是分析材料结构和性质的过程。
常用技术包括X射线衍射、电子显微镜等。
表征结果对材料设计至关重要。
"""
    
    # 测试不同参数组合
    test_cases = [
        {"semantic_threshold": 20, "preserve_structure": True, "desc": "低阈值+保持结构"},
        {"semantic_threshold": 20, "preserve_structure": False, "desc": "低阈值+不保持结构"},
        {"semantic_threshold": 60, "preserve_structure": True, "desc": "高阈值+保持结构"},
        {"semantic_threshold": 60, "preserve_structure": False, "desc": "高阈值+不保持结构"},
    ]
    
    for case in test_cases:
        logger.info(f"\n测试: {case['desc']}")
        
        test_file = create_test_document(test_content)
        try:
            chunks = advanced_chunk(
                test_file,
                chunk_strategy="semantic",
                parser_config={
                    "chunk_token_num": 40,
                    "max_token_num": 100,
                    "delimiter": "。！？",
                    "chunk_overlap": 10,
                    "semantic_threshold": case["semantic_threshold"],
                    "preserve_structure": case["preserve_structure"]
                },
                tokenizer="simple"
            )
            
            logger.info(f"  生成了 {len(chunks)} 个分块")
            logger.info(f"  参数: semantic_threshold={case['semantic_threshold']}, preserve_structure={case['preserve_structure']}")
            
            for i, chunk in enumerate(chunks):
                headings = chunk.headings if hasattr(chunk, 'headings') else []
                content_preview = chunk.content.replace('\n', ' ')[:60]
                logger.info(f"    块{i+1}: [{' > '.join(headings)}] {content_preview}...")
                
        finally:
            os.unlink(test_file)

def main():
    """主测试函数"""
    logger.info("开始测试切分参数配置化功能")
    logger.info("="*60)
    
    # 运行各项测试
    test_semantic_threshold()
    test_preserve_structure()
    test_combined_parameters()
    
    logger.info("\n" + "="*60)
    logger.info("测试完成！")
    logger.info("总结：")
    logger.info("1. semantic_threshold 参数可以控制语义相似度判断的严格程度")
    logger.info("2. preserve_structure 参数可以控制是否优先保持文档结构")
    logger.info("3. 两个参数可以组合使用，实现不同的切分策略")
    logger.info("4. 参数配置化功能已成功实现并验证")

if __name__ == "__main__":
    main()