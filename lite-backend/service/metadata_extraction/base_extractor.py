"""
基础元数据提取器 - 所有提取器的抽象基类
按照组件拆分原则，控制文件大小 < 200行
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass 
class MetadataExtractionResult:
    """元数据提取结果"""
    success: bool
    extracted_metadata: Dict[str, Any]
    confidence_score: float = 0.0
    extraction_time: float = 0.0
    errors: List[str] = None
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []


@dataclass
class ValidationResult:
    """验证结果"""
    is_valid: bool
    errors: List[str] = None
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []


class BaseMetadataExtractor(ABC):
    """基础元数据提取器抽象类"""
    
    def __init__(self, extractor_type: str):
        self.extractor_type = extractor_type
        self.extraction_rules = {}
        self.validation_rules = {}
    
    @abstractmethod
    async def extract(
        self, 
        content: str, 
        filename: str, 
        config: Dict[str, Any]
    ) -> MetadataExtractionResult:
        """
        提取元数据的主要方法
        
        Args:
            content: 文档内容
            filename: 文件名
            config: 提取配置
            
        Returns:
            MetadataExtractionResult: 提取结果
        """
        pass
    
    @abstractmethod
    async def validate(self, metadata: Dict[str, Any]) -> ValidationResult:
        """
        验证提取的元数据
        
        Args:
            metadata: 待验证的元数据
            
        Returns:
            ValidationResult: 验证结果
        """
        pass
    
    @abstractmethod
    def get_extraction_rules(self) -> Dict[str, Any]:
        """
        获取提取规则
        
        Returns:
            Dict: 提取规则配置
        """
        pass
    
    def get_supported_fields(self) -> List[str]:
        """获取支持的字段列表"""
        rules = self.get_extraction_rules()
        return list(rules.get('supported_fields', []))
    
    def get_required_fields(self) -> List[str]:
        """获取必需字段列表"""
        rules = self.get_extraction_rules()
        return list(rules.get('required_fields', []))
    
    def calculate_confidence(
        self, 
        extracted_fields: Dict[str, Any], 
        required_fields: List[str]
    ) -> float:
        """
        计算提取置信度
        
        Args:
            extracted_fields: 已提取的字段
            required_fields: 必需字段
            
        Returns:
            float: 置信度分数 (0.0-1.0)
        """
        if not required_fields:
            return 1.0
        
        extracted_required = sum(
            1 for field in required_fields 
            if field in extracted_fields and extracted_fields[field]
        )
        
        base_confidence = extracted_required / len(required_fields)
        
        # 考虑可选字段的加分
        supported_fields = self.get_supported_fields()
        optional_fields = [f for f in supported_fields if f not in required_fields]
        
        if optional_fields:
            extracted_optional = sum(
                1 for field in optional_fields 
                if field in extracted_fields and extracted_fields[field]
            )
            optional_bonus = (extracted_optional / len(optional_fields)) * 0.2
            base_confidence = min(1.0, base_confidence + optional_bonus)
        
        return round(base_confidence, 3)
    
    def clean_extracted_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        清理和标准化提取的数据
        
        Args:
            raw_data: 原始提取数据
            
        Returns:
            Dict: 清理后的数据
        """
        cleaned_data = {}
        
        for key, value in raw_data.items():
            if value is None:
                continue
            
            # 字符串清理
            if isinstance(value, str):
                cleaned_value = value.strip()
                if cleaned_value:
                    cleaned_data[key] = cleaned_value
            
            # 列表清理
            elif isinstance(value, list):
                cleaned_list = [
                    item.strip() if isinstance(item, str) else item 
                    for item in value 
                    if item is not None and (not isinstance(item, str) or item.strip())
                ]
                if cleaned_list:
                    cleaned_data[key] = cleaned_list
            
            # 其他类型直接添加
            else:
                cleaned_data[key] = value
        
        return cleaned_data
    
    def log_extraction_attempt(
        self, 
        filename: str, 
        success: bool, 
        extraction_time: float, 
        error_msg: str = None
    ):
        """
        记录提取尝试日志
        
        Args:
            filename: 文件名
            success: 是否成功
            extraction_time: 提取耗时
            error_msg: 错误信息
        """
        from core.logger import logger
        
        status = "成功" if success else "失败"
        log_msg = f"{self.extractor_type}提取器处理文件 {filename}: {status}, 耗时{extraction_time:.2f}秒"
        
        if success:
            logger.info(log_msg)
        else:
            logger.error(f"{log_msg}, 错误: {error_msg}")