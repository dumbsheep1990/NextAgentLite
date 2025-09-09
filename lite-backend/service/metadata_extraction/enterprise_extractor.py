"""
企业文档元数据提取器 - 专门用于企业内部文档
按照组件拆分原则，控制文件大小 < 250行
"""
import re
import time
from typing import Dict, Any, List, Optional
from .base_extractor import BaseMetadataExtractor, MetadataExtractionResult, ValidationResult


class EnterpriseMetadataExtractor(BaseMetadataExtractor):
    """企业文档元数据提取器"""
    
    def __init__(self):
        super().__init__("enterprise")
        self.extraction_rules = {
            'supported_fields': [
                'document_title', 'department', 'business_line', 'project_code', 'document_type',
                'confidentiality_level', 'access_permissions', 'approval_status', 'data_classification',
                'version_number', 'revision_history', 'responsible_person', 'reviewer', 'approver',
                'process_stage', 'kpi_relevance', 'compliance_requirements', 'business_impact',
                'review_cycle', 'next_review_date', 'retention_period', 'disposal_method'
            ],
            'required_fields': [
                'document_title', 'department', 'confidentiality_level', 
                'version_number', 'responsible_person'
            ],
            'auto_extract_fields': ['document_title', 'version_number'],
            'user_input_fields': ['department', 'confidentiality_level', 'responsible_person'],
            'llm_extract_fields': ['document_type', 'business_impact', 'compliance_requirements'],
            'workflow_fields': ['approval_status', 'reviewer', 'approver'],
            'manual_fields': ['access_permissions', 'review_cycle']
        }
        
        # 文档类型映射
        self.document_types = {
            'policy': ['政策', '制度', '规定', '办法'],
            'procedure': ['流程', '程序', '操作', '指南'],
            'report': ['报告', '总结', '分析', '汇报'],
            'manual': ['手册', '指导', '说明', '教程'],
            'specification': ['规范', '标准', '要求', '规格']
        }
        
        # 保密级别
        self.confidentiality_levels = ['public', 'internal', 'confidential', 'secret']
        
        # 业务影响级别
        self.business_impacts = {
            'low': ['一般', '较小', '轻微'],
            'medium': ['中等', '适中', '普通'],
            'high': ['重要', '较大', '显著'],
            'critical': ['关键', '重大', '严重', '核心']
        }
    
    async def extract(
        self, 
        content: str, 
        filename: str, 
        config: Dict[str, Any]
    ) -> MetadataExtractionResult:
        """提取企业文档元数据"""
        start_time = time.time()
        
        try:
            extracted_metadata = {}
            errors = []
            warnings = []
            
            # 1. 自动提取字段
            auto_extracted = await self._auto_extract_fields(content, filename)
            extracted_metadata.update(auto_extracted)
            
            # 2. 模式匹配提取
            pattern_extracted = await self._pattern_extract_fields(content)
            extracted_metadata.update(pattern_extracted)
            
            # 3. 推断字段
            inferred = await self._infer_fields(content)
            extracted_metadata.update(inferred)
            
            # 4. 从配置中获取用户输入字段
            if config.get('user_inputs'):
                extracted_metadata.update(config['user_inputs'])
            
            # 5. 清理和标准化数据
            cleaned_metadata = self.clean_extracted_data(extracted_metadata)
            
            # 6. 计算置信度
            confidence = self.calculate_confidence(
                cleaned_metadata, 
                self.extraction_rules['required_fields']
            )
            
            extraction_time = time.time() - start_time
            
            # 记录日志
            self.log_extraction_attempt(filename, True, extraction_time)
            
            return MetadataExtractionResult(
                success=True,
                extracted_metadata=cleaned_metadata,
                confidence_score=confidence,
                extraction_time=extraction_time,
                errors=errors,
                warnings=warnings
            )
            
        except Exception as e:
            extraction_time = time.time() - start_time
            error_msg = f"企业元数据提取失败: {str(e)}"
            
            # 记录错误日志
            self.log_extraction_attempt(filename, False, extraction_time, error_msg)
            
            return MetadataExtractionResult(
                success=False,
                extracted_metadata={},
                confidence_score=0.0,
                extraction_time=extraction_time,
                errors=[error_msg]
            )
    
    async def _auto_extract_fields(self, content: str, filename: str) -> Dict[str, Any]:
        """自动提取基础字段"""
        extracted = {}
        
        # 提取文档标题
        extracted['document_title'] = self._extract_document_title(content, filename)
        
        # 提取版本号
        version = self._extract_version_number(content, filename)
        if version:
            extracted['version_number'] = version
        
        return extracted
    
    def _extract_document_title(self, content: str, filename: str) -> str:
        """提取文档标题"""
        lines = content.strip().split('\n')
        
        # 企业文档标题通常在前几行
        for line in lines[:10]:
            line = line.strip()
            if line and len(line) > 5 and len(line) < 200:
                # 避免明显的非标题行
                if not re.match(r'^(版本|日期|部门)', line):
                    return line
        
        # 从文件名提取
        title_from_filename = filename
        if '.' in title_from_filename:
            title_from_filename = title_from_filename.rsplit('.', 1)[0]
        return re.sub(r'[_-]', ' ', title_from_filename).strip()
    
    def _extract_version_number(self, content: str, filename: str) -> Optional[str]:
        """提取版本号"""
        # 常见版本号模式
        version_patterns = [
            r'版本[:：]?\s*([vV]?\d+\.\d+(?:\.\d+)?)',  # 版本: v1.0 或 版本：1.0.1
            r'[vV](\d+\.\d+(?:\.\d+)?)',                # v1.0
            r'(\d+\.\d+(?:\.\d+)?)',                    # 1.0.1
        ]
        
        # 首先在内容前部分查找
        search_text = content[:500]
        
        for pattern in version_patterns:
            matches = re.search(pattern, search_text)
            if matches:
                return matches.group(1)
        
        # 然后在文件名中查找
        for pattern in version_patterns:
            matches = re.search(pattern, filename)
            if matches:
                return matches.group(1)
        
        return "1.0"  # 默认版本
    
    async def _pattern_extract_fields(self, content: str) -> Dict[str, Any]:
        """基于模式匹配提取字段"""
        extracted = {}
        
        # 提取负责人
        responsible_person = self._extract_responsible_person(content)
        if responsible_person:
            extracted['responsible_person'] = responsible_person
        
        # 提取部门信息
        department = self._extract_department(content)
        if department:
            extracted['department'] = department
        
        return extracted
    
    def _extract_responsible_person(self, content: str) -> Optional[str]:
        """提取负责人"""
        person_patterns = [
            r'负责人[:：]\s*([^\n\r,，]{2,10})',
            r'责任人[:：]\s*([^\n\r,，]{2,10})',
            r'编制[:：]\s*([^\n\r,，]{2,10})',
        ]
        
        search_text = content[:1000]
        
        for pattern in person_patterns:
            matches = re.search(pattern, search_text)
            if matches:
                person = matches.group(1).strip()
                if len(person) >= 2:
                    return person
        
        return None
    
    def _extract_department(self, content: str) -> Optional[str]:
        """提取部门信息"""
        dept_patterns = [
            r'部门[:：]\s*([^\n\r]{2,50})',
            r'所属部门[:：]\s*([^\n\r]{2,50})',
            r'(\w+部|\w+科|\w+处|\w+室|\w+中心)'
        ]
        
        search_text = content[:1000]
        
        for pattern in dept_patterns:
            matches = re.search(pattern, search_text)
            if matches:
                dept = matches.group(1).strip()
                if len(dept) >= 2:
                    return dept
        
        return None
    
    async def _infer_fields(self, content: str) -> Dict[str, Any]:
        """推断字段"""
        extracted = {}
        
        # 推断文档类型
        document_type = self._infer_document_type(content)
        if document_type:
            extracted['document_type'] = document_type
        
        # 推断业务影响
        business_impact = self._infer_business_impact(content)
        if business_impact:
            extracted['business_impact'] = business_impact
        
        # 设置默认值
        extracted['confidentiality_level'] = 'internal'  # 默认内部
        extracted['approval_status'] = 'draft'           # 默认草稿
        
        return extracted
    
    def _infer_document_type(self, content: str) -> Optional[str]:
        """推断文档类型"""
        content_lower = content.lower()
        
        for doc_type, keywords in self.document_types.items():
            keyword_matches = sum(1 for keyword in keywords if keyword in content_lower)
            if keyword_matches >= 1:
                return doc_type
        
        return None
    
    def _infer_business_impact(self, content: str) -> Optional[str]:
        """推断业务影响"""
        content_lower = content.lower()
        
        for impact, keywords in self.business_impacts.items():
            keyword_matches = sum(1 for keyword in keywords if keyword in content_lower)
            if keyword_matches >= 1:
                return impact
        
        return 'medium'  # 默认中等影响
    
    async def validate(self, metadata: Dict[str, Any]) -> ValidationResult:
        """验证企业元数据"""
        errors = []
        warnings = []
        
        # 检查必需字段
        required_fields = self.extraction_rules['required_fields']
        for field in required_fields:
            if field not in metadata or not metadata[field]:
                errors.append(f"缺少必需字段: {field}")
        
        # 验证保密级别
        if 'confidentiality_level' in metadata:
            level = metadata['confidentiality_level']
            if level not in self.confidentiality_levels:
                errors.append(f"无效的保密级别: {level}")
        
        # 验证业务影响
        if 'business_impact' in metadata:
            impact = metadata['business_impact']
            valid_impacts = list(self.business_impacts.keys())
            if impact not in valid_impacts:
                errors.append(f"无效的业务影响级别: {impact}")
        
        # 验证版本号格式
        if 'version_number' in metadata:
            version = metadata['version_number']
            if not re.match(r'^\d+\.\d+(\.\d+)?$', version):
                warnings.append("版本号格式建议使用x.y或x.y.z格式")
        
        is_valid = len(errors) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings
        )
    
    def get_extraction_rules(self) -> Dict[str, Any]:
        """获取提取规则"""
        return self.extraction_rules.copy()