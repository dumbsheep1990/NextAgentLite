"""
元数据提取服务 - 主要服务类
按照组件拆分原则，控制文件大小 < 500行
"""
import asyncio
import time
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass

from models.knowledge_collection import MetadataTemplate
from .base_extractor import BaseMetadataExtractor, MetadataExtractionResult, ValidationResult
from .general_extractor import GeneralMetadataExtractor
from .policy_extractor import PolicyMetadataExtractor
from .academic_extractor import AcademicMetadataExtractor
from .enterprise_extractor import EnterpriseMetadataExtractor


@dataclass
class BatchExtractionResult:
    """批量提取结果"""
    total_count: int
    success_count: int
    failed_count: int
    results: List[Tuple[str, MetadataExtractionResult]]  # (document_id, result)
    total_time: float


class MetadataExtractionService:
    """元数据提取服务主类"""
    
    def __init__(self):
        self.extractors: Dict[str, BaseMetadataExtractor] = {
            "general": GeneralMetadataExtractor(),
            "policy": PolicyMetadataExtractor(), 
            "academic": AcademicMetadataExtractor(),
            "enterprise": EnterpriseMetadataExtractor()
        }
        
        # 文档类型自动检测规则
        self.auto_detection_rules = {
            'policy': [
                '关于', '通知', '公告', '办法', '规定', '意见', '通告', '决定', 
                '国务院', '财政部', '税务总局', '政府', '发文机关'
            ],
            'academic': [
                'abstract', 'keywords', 'author', 'journal', 'conference',
                '摘要', '关键词', '作者', '期刊', '会议', 'doi', 'issn'
            ],
            'enterprise': [
                '部门', '版本', '负责人', '审核', '批准', '流程', '规范', 
                '制度', '手册', '标准', '程序'
            ]
        }
    
    async def extract_metadata(
        self, 
        document_id: str,
        content: str, 
        filename: str,
        template: MetadataTemplate,
        config: Dict[str, Any] = None
    ) -> MetadataExtractionResult:
        """
        提取单个文档的元数据
        
        Args:
            document_id: 文档ID
            content: 文档内容
            filename: 文件名
            template: 元数据模版
            config: 提取配置
            
        Returns:
            MetadataExtractionResult: 提取结果
        """
        if config is None:
            config = {}
        
        try:
            # 获取对应的提取器
            extractor = self.extractors.get(template.template_type)
            if not extractor:
                return MetadataExtractionResult(
                    success=False,
                    extracted_metadata={},
                    errors=[f"不支持的模版类型: {template.template_type}"]
                )
            
            # 合并模版配置
            extraction_config = {
                **config,
                'template_config': template.extraction_config or {},
                'validation_rules': template.validation_rules or {},
                'enable_llm_extraction': config.get('enable_llm_extraction', True)
            }
            
            # 执行提取
            result = await extractor.extract(content, filename, extraction_config)
            
            # 如果提取成功，进行验证
            if result.success and result.extracted_metadata:
                validation_result = await extractor.validate(result.extracted_metadata)
                
                # 将验证警告添加到提取结果中
                if validation_result.warnings:
                    result.warnings.extend(validation_result.warnings)
                
                # 如果验证失败，降低置信度
                if not validation_result.is_valid:
                    result.confidence_score *= 0.7  # 降低30%置信度
                    result.warnings.extend([f"验证失败: {error}" for error in validation_result.errors])
            
            return result
            
        except Exception as e:
            from core.logger import logger
            logger.error(f"文档 {document_id} 元数据提取异常: {str(e)}")
            
            return MetadataExtractionResult(
                success=False,
                extracted_metadata={},
                errors=[f"提取过程异常: {str(e)}"]
            )
    
    async def auto_detect_template(
        self, 
        content: str, 
        filename: str
    ) -> str:
        """
        自动检测文档类型并推荐模版
        
        Args:
            content: 文档内容
            filename: 文件名
            
        Returns:
            str: 推荐的模版类型
        """
        content_lower = content.lower()
        filename_lower = filename.lower()
        combined_text = content_lower + " " + filename_lower
        
        # 计算各类型的匹配分数
        scores = {}
        for template_type, keywords in self.auto_detection_rules.items():
            score = sum(1 for keyword in keywords if keyword in combined_text)
            if score > 0:
                scores[template_type] = score
        
        # 返回得分最高的类型，如果没有匹配则返回general
        if scores:
            return max(scores.items(), key=lambda x: x[1])[0]
        else:
            return 'general'
    
    async def batch_extract_metadata(
        self, 
        documents: List[Dict[str, Any]], 
        template: MetadataTemplate,
        config: Dict[str, Any] = None,
        max_concurrent: int = 5
    ) -> BatchExtractionResult:
        """
        批量提取多个文档的元数据
        
        Args:
            documents: 文档列表，每个包含 {'id', 'content', 'filename'}
            template: 元数据模版
            config: 提取配置
            max_concurrent: 最大并发数
            
        Returns:
            BatchExtractionResult: 批量提取结果
        """
        start_time = time.time()
        
        # 创建信号量控制并发
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def extract_single(doc_info):
            async with semaphore:
                return doc_info['id'], await self.extract_metadata(
                    doc_info['id'],
                    doc_info['content'],
                    doc_info['filename'], 
                    template,
                    config
                )
        
        # 执行并发提取
        tasks = [extract_single(doc) for doc in documents]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 统计结果
        success_count = 0
        failed_count = 0
        processed_results = []
        
        for result in results:
            if isinstance(result, Exception):
                failed_count += 1
                processed_results.append(("unknown", MetadataExtractionResult(
                    success=False,
                    extracted_metadata={},
                    errors=[f"批量处理异常: {str(result)}"]
                )))
            else:
                doc_id, extraction_result = result
                if extraction_result.success:
                    success_count += 1
                else:
                    failed_count += 1
                processed_results.append((doc_id, extraction_result))
        
        total_time = time.time() - start_time
        
        return BatchExtractionResult(
            total_count=len(documents),
            success_count=success_count,
            failed_count=failed_count,
            results=processed_results,
            total_time=total_time
        )
    
    async def validate_metadata_against_template(
        self, 
        metadata: Dict[str, Any], 
        template: MetadataTemplate
    ) -> ValidationResult:
        """
        根据模版验证元数据
        
        Args:
            metadata: 待验证的元数据
            template: 元数据模版
            
        Returns:
            ValidationResult: 验证结果
        """
        extractor = self.extractors.get(template.template_type)
        if not extractor:
            return ValidationResult(
                is_valid=False,
                errors=[f"不支持的模版类型: {template.template_type}"]
            )
        
        return await extractor.validate(metadata)
    
    def get_supported_template_types(self) -> List[str]:
        """获取支持的模版类型列表"""
        return list(self.extractors.keys())
    
    def get_extractor_info(self, template_type: str) -> Dict[str, Any]:
        """
        获取提取器信息
        
        Args:
            template_type: 模版类型
            
        Returns:
            Dict: 提取器信息
        """
        extractor = self.extractors.get(template_type)
        if not extractor:
            return {}
        
        return {
            'template_type': template_type,
            'supported_fields': extractor.get_supported_fields(),
            'required_fields': extractor.get_required_fields(),
            'extraction_rules': extractor.get_extraction_rules()
        }
    
    def get_all_extractors_info(self) -> Dict[str, Dict[str, Any]]:
        """获取所有提取器的信息"""
        return {
            template_type: self.get_extractor_info(template_type)
            for template_type in self.extractors.keys()
        }
    
    async def test_extraction(
        self, 
        content: str, 
        filename: str, 
        template_type: str = 'general'
    ) -> Dict[str, Any]:
        """
        测试提取功能
        
        Args:
            content: 测试内容
            filename: 测试文件名
            template_type: 模版类型
            
        Returns:
            Dict: 测试结果
        """
        # 自动检测模版类型
        detected_type = await self.auto_detect_template(content, filename)
        
        # 使用指定或检测的类型进行提取
        extractor = self.extractors.get(template_type, self.extractors['general'])
        
        # 执行提取
        start_time = time.time()
        result = await extractor.extract(content, filename, {})
        extraction_time = time.time() - start_time
        
        # 验证结果
        validation_result = await extractor.validate(result.extracted_metadata) if result.success else None
        
        return {
            'detected_template_type': detected_type,
            'used_template_type': template_type,
            'extraction_result': result,
            'validation_result': validation_result,
            'extraction_time': extraction_time,
            'extractor_info': self.get_extractor_info(template_type)
        }


# 全局服务实例
metadata_extraction_service = MetadataExtractionService()