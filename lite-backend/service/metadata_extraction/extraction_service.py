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

        核心逻辑:
        1. 通用场景(general)是所有场景的基础
        2. 其他场景(policy/academic/enterprise)继承通用字段并添加特定字段
        3. 场景特定字段可以覆盖通用字段的同名字段

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
            from core.logger import logger

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

            # === 核心修改: 实现场景继承机制 ===
            merged_metadata = {}
            all_errors = []
            all_warnings = []
            total_extraction_time = 0.0

            # Step 1: 始终先提取通用场景的基础字段
            if template.template_type != 'general':
                logger.info(f"文档 {document_id}: 先提取通用场景基础字段")
                general_extractor = self.extractors.get('general')
                if general_extractor:
                    general_result = await general_extractor.extract(content, filename, extraction_config)
                    if general_result.success:
                        merged_metadata.update(general_result.extracted_metadata)
                        logger.info(f"文档 {document_id}: 通用字段提取成功，提取了 {len(general_result.extracted_metadata)} 个字段")
                    else:
                        all_warnings.append("通用场景字段提取失败，继续提取场景特定字段")
                        logger.warning(f"文档 {document_id}: 通用字段提取失败: {general_result.errors}")

                    all_warnings.extend(general_result.warnings)
                    total_extraction_time += general_result.extraction_time

            # Step 2: 提取场景特定字段
            logger.info(f"文档 {document_id}: 提取 {template.template_type} 场景特定字段")
            scenario_result = await extractor.extract(content, filename, extraction_config)

            if scenario_result.success:
                # 场景特定字段会覆盖通用字段的同名字段
                before_count = len(merged_metadata)
                merged_metadata.update(scenario_result.extracted_metadata)
                after_count = len(merged_metadata)
                logger.info(f"文档 {document_id}: 场景特定字段提取成功，添加了 {after_count - before_count} 个新字段，最终共 {after_count} 个字段")

                all_errors.extend(scenario_result.errors)
                all_warnings.extend(scenario_result.warnings)
            else:
                all_errors.extend(scenario_result.errors)
                logger.error(f"文档 {document_id}: 场景特定字段提取失败")

            total_extraction_time += scenario_result.extraction_time

            # Step 3: 验证合并后的元数据
            if merged_metadata:
                validation_result = await extractor.validate(merged_metadata)

                if validation_result.warnings:
                    all_warnings.extend(validation_result.warnings)

                # 计算最终置信度
                confidence_score = self._calculate_combined_confidence(
                    merged_metadata,
                    template.template_type
                )

                if not validation_result.is_valid:
                    confidence_score *= 0.7  # 验证失败降低30%置信度
                    all_warnings.extend([f"验证失败: {error}" for error in validation_result.errors])

                # 记录成功日志
                self._log_extraction_success(document_id, template.template_type, merged_metadata, total_extraction_time)

                return MetadataExtractionResult(
                    success=True,
                    extracted_metadata=merged_metadata,
                    confidence_score=confidence_score,
                    extraction_time=total_extraction_time,
                    errors=all_errors,
                    warnings=all_warnings
                )
            else:
                logger.error(f"文档 {document_id}: 未提取到任何元数据")
                return MetadataExtractionResult(
                    success=False,
                    extracted_metadata={},
                    confidence_score=0.0,
                    extraction_time=total_extraction_time,
                    errors=all_errors or ["未提取到任何元数据"],
                    warnings=all_warnings
                )

        except Exception as e:
            from core.logger import logger
            logger.error(f"文档 {document_id} 元数据提取异常: {str(e)}", exc_info=True)

            return MetadataExtractionResult(
                success=False,
                extracted_metadata={},
                errors=[f"提取过程异常: {str(e)}"]
            )

    def _calculate_combined_confidence(
        self,
        merged_metadata: Dict[str, Any],
        template_type: str
    ) -> float:
        """计算合并后元数据的置信度"""
        # 获取通用和场景特定的必需字段
        general_required = self.extractors['general'].get_required_fields()
        scenario_required = self.extractors[template_type].get_required_fields()

        # 合并必需字段列表(去重)
        all_required = list(set(general_required + scenario_required))

        # 计算满足的必需字段比例
        met_required = sum(
            1 for field in all_required
            if field in merged_metadata and merged_metadata[field]
        )

        if not all_required:
            return 1.0

        return round(met_required / len(all_required), 3)

    def _log_extraction_success(
        self,
        document_id: str,
        template_type: str,
        metadata: Dict[str, Any],
        extraction_time: float
    ):
        """记录提取成功日志"""
        from core.logger import logger

        # 分类字段
        general_fields = []
        scenario_fields = []

        general_supported = self.extractors['general'].get_supported_fields()

        for field in metadata.keys():
            if field in general_supported:
                general_fields.append(field)
            else:
                scenario_fields.append(field)

        logger.info(
            f"文档 {document_id} 元数据提取完成 - "
            f"模版: {template_type}, "
            f"耗时: {extraction_time:.2f}秒, "
            f"通用字段: {len(general_fields)}, "
            f"场景字段: {len(scenario_fields)}, "
            f"总字段: {len(metadata)}"
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