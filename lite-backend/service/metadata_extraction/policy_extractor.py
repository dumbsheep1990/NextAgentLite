"""
政策文档元数据提取器 - 专门用于政策类文档
按照组件拆分原则，控制文件大小 < 300行
"""
import re
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from .base_extractor import BaseMetadataExtractor, MetadataExtractionResult, ValidationResult


class PolicyMetadataExtractor(BaseMetadataExtractor):
    """政策文档元数据提取器"""
    
    def __init__(self):
        super().__init__("policy")
        self.extraction_rules = {
            'supported_fields': [
                # 标准政府文档字段 (贵州省格式)
                'index_number',           # 索引号
                'information_category',   # 信息分类
                'issuing_authority',      # 发布机构
                'publish_date',           # 生成日期
                'document_number',        # 文号
                'is_valid',              # 是否有效
                'policy_name',           # 名称
                # 其他可选字段
                'policy_title', 'authority_level',
                'effective_date', 'expiry_date', 'version',
                'geographic_scope', 'applicable_groups', 'industry_scope', 'policy_category',
                'parent_policies', 'child_policies', 'related_policies', 'superseded_policies',
                'key_points', 'application_conditions', 'procedures', 'required_materials'
            ],
            'required_fields': [
                'policy_name', 'issuing_authority', 'publish_date',
                'document_number', 'index_number'
            ],
            'auto_extract_fields': [
                'index_number', 'information_category', 'issuing_authority',
                'publish_date', 'document_number', 'is_valid', 'policy_name'
            ],
            'llm_extract_fields': [
                'key_points', 'application_conditions'
            ],
            'manual_fields': ['effective_date', 'authority_level']
        }
        
        # 政策分类映射
        self.policy_categories = {
            '税收': ['税', '税收', '税务', '纳税', '免税', '减税'],
            '社保': ['社保', '社会保障', '医保', '医疗保险', '养老', '失业', '工伤'],
            '企业': ['企业', '公司', '工商', '营业', '注册', '登记'],
            '劳动': ['劳动', '就业', '招聘', '工资', '薪酬', '劳务'],
            '住房': ['住房', '房地产', '购房', '租房', '住房公积金'],
            '其他': []
        }
        
        # 权威级别映射
        self.authority_levels = {
            '国家级': ['国务院', '财政部', '税务总局', '人社部', '住建部', '央行', '银保监会'],
            '省级': ['省政府', '省', '市政府'],
            '市级': ['市政府', '市', '区政府'],
            '区县级': ['区', '县', '镇', '街道']
        }
    
    async def extract(
        self, 
        content: str, 
        filename: str, 
        config: Dict[str, Any]
    ) -> MetadataExtractionResult:
        """提取政策文档元数据"""
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

            # 3. LLM辅助提取（如果配置中启用）
            if config.get('enable_llm_extraction', True):
                try:
                    llm_extracted = await self._llm_extract_fields(content, config)
                    extracted_metadata.update(llm_extracted)
                except Exception as e:
                    warnings.append(f"LLM提取失败: {str(e)}")

            # 4. 推断权威级别（基于已提取的issuing_authority）
            if 'issuing_authority' in extracted_metadata and extracted_metadata['issuing_authority']:
                extracted_metadata['authority_level'] = self._infer_authority_level(
                    extracted_metadata['issuing_authority']
                )

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
            error_msg = f"政策元数据提取失败: {str(e)}"
            
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

        # 首先尝试提取标准政府文档格式的结构化字段
        structured_fields = self._extract_structured_gov_fields(content)
        if structured_fields:
            extracted.update(structured_fields)

        # 如果没有提取到policy_name，使用policy_title
        if 'policy_name' not in extracted or not extracted['policy_name']:
            extracted['policy_title'] = self._extract_policy_title(content, filename)
            extracted['policy_name'] = extracted.get('policy_title', '')

        # 如果没有提取到发布日期，使用通用方法
        if 'publish_date' not in extracted or not extracted['publish_date']:
            publish_date = self._extract_publish_date(content)
            if publish_date:
                extracted['publish_date'] = publish_date

        return extracted

    def _extract_structured_gov_fields(self, content: str) -> Dict[str, Any]:
        """提取标准政府文档格式的结构化字段

        贵州省政府文档格式：
        - 索 引 号：11520000009390180Q/2025-1376394
        - 信息分类：政策文件  卫生、体育  通知
        - 发布机构：贵州省人民政府办公厅
        - 生成日期：2025-10-21
        - 文  号：黔府办发〔2025〕17号
        - 是否有效：是
        - 名  称：省人民政府办公厅印发《...》的通知
        """
        extracted = {}

        # 定义字段提取模式（支持多种变体）
        field_patterns = {
            'index_number': [
                r'[-\s]*索\s*引\s*号\s*[：:]\s*\n?\s*[-\s]*([^\n]+)',
                r'索引号\s*[：:]\s*([^\n]+)'
            ],
            'information_category': [
                r'[-\s]*信息分类\s*[：:]\s*\n?\s*[-\s]*([^\n]+)',
                r'信息分类\s*[：:]\s*([^\n]+)'
            ],
            'issuing_authority': [
                r'[-\s]*发布机构\s*[：:]\s*\n?\s*[-\s]*([^\n]+)',
                r'发布机构\s*[：:]\s*([^\n]+)',
                r'[-\s]*发文机关\s*[：:]\s*\n?\s*[-\s]*([^\n]+)',
                r'发文机关\s*[：:]\s*([^\n]+)'
            ],
            'publish_date': [
                r'[-\s]*生成日期\s*[：:]\s*\n?\s*[-\s]*(\d{4}-\d{1,2}-\d{1,2})',
                r'生成日期\s*[：:]\s*(\d{4}-\d{1,2}-\d{1,2})',
                r'[-\s]*发布[日时]期\s*[：:]\s*\n?\s*[-\s]*(\d{4}-\d{1,2}-\d{1,2})',
                r'发布日期\s*[：:]\s*(\d{4}-\d{1,2}-\d{1,2})'
            ],
            'document_number': [
                r'[-\s]*文\s*号\s*[：:]\s*\n?\s*[-\s]*([^\n]+)',
                r'文号\s*[：:]\s*([^\n]+)',
                r'[-\s]*文件编号\s*[：:]\s*\n?\s*[-\s]*([^\n]+)'
            ],
            'is_valid': [
                r'[-\s]*是否有效\s*[：:]\s*\n?\s*[-\s]*([^\n]+)',
                r'是否有效\s*[：:]\s*([^\n]+)'
            ],
            'policy_name': [
                r'[-\s]*名\s*称\s*[：:]\s*\n?\s*[-\s]*([^\n]+(?:\n[^\n-]+)*)',
                r'名称\s*[：:]\s*([^\n]+)',
                r'[-\s]*标\s*题\s*[：:]\s*\n?\s*[-\s]*([^\n]+)',
                r'标题\s*[：:]\s*([^\n]+)'
            ]
        }

        # 在文档前3000字符内搜索
        search_text = content[:3000]

        for field_name, patterns in field_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, search_text, re.MULTILINE)
                if match:
                    value = match.group(1).strip()
                    # 清理值：移除前导的列表符号和空格
                    value = re.sub(r'^[-\s]+', '', value).strip()
                    if value and value != '-':
                        extracted[field_name] = value
                        break  # 找到后停止尝试其他模式

        return extracted
    
    def _extract_policy_title(self, content: str, filename: str) -> str:
        """提取政策标题"""
        # 政策标题通常包含特定关键词
        lines = content.strip().split('\n')
        
        for line in lines[:20]:  # 检查前20行
            line = line.strip()
            if not line:
                continue
            
            # 政策标题的特征模式
            policy_indicators = ['关于', '通知', '公告', '办法', '规定', '意见', '通告', '决定']
            
            if any(indicator in line for indicator in policy_indicators):
                if len(line) > 10 and len(line) < 200:
                    return line
        
        # 如果没找到，使用通用标题提取逻辑
        return self._extract_generic_title(content, filename)
    
    def _extract_generic_title(self, content: str, filename: str) -> str:
        """通用标题提取逻辑"""
        lines = content.strip().split('\n')
        for line in lines[:5]:
            line = line.strip()
            if line and len(line) > 5 and len(line) < 200:
                return line
        
        # 从文件名提取
        title_from_filename = filename
        if '.' in title_from_filename:
            title_from_filename = title_from_filename.rsplit('.', 1)[0]
        return re.sub(r'[_-]', ' ', title_from_filename).strip()
    
    def _extract_publish_date(self, content: str) -> Optional[str]:
        """提取发布日期"""
        # 常见日期格式模式
        date_patterns = [
            r'(\d{4})年(\d{1,2})月(\d{1,2})日',  # 2023年12月1日
            r'(\d{4})-(\d{1,2})-(\d{1,2})',      # 2023-12-01
            r'(\d{4})\.(\d{1,2})\.(\d{1,2})',    # 2023.12.01
            r'(\d{4})/(\d{1,2})/(\d{1,2})',      # 2023/12/01
        ]
        
        # 在文档前部分查找日期
        search_text = content[:2000]  # 只搜索前2000字符
        
        for pattern in date_patterns:
            matches = re.finditer(pattern, search_text)
            for match in matches:
                groups = match.groups()
                if len(groups) == 3:
                    year, month, day = groups
                    try:
                        # 验证日期合法性
                        date_obj = datetime(int(year), int(month), int(day))
                        # 只接受合理的年份范围
                        if 1990 <= date_obj.year <= 2030:
                            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    except ValueError:
                        continue
        
        return None
    
    async def _pattern_extract_fields(self, content: str) -> Dict[str, Any]:
        """基于模式匹配提取字段

        注意：不提取issuing_authority，因为_extract_structured_gov_fields已经提取了
        authority_level的推断移到extract()方法中进行
        """
        extracted = {}

        # 提取政策编号
        policy_number = self._extract_policy_number(content)
        if policy_number:
            extracted['policy_number'] = policy_number

        # 推断政策分类
        policy_category = self._infer_policy_category(content)
        if policy_category:
            extracted['policy_category'] = policy_category

        return extracted
    
    def _extract_policy_number(self, content: str) -> Optional[str]:
        """提取政策编号"""
        # 常见政策编号模式
        number_patterns = [
            r'([A-Z\u4e00-\u9fff]{2,10}〔\d{4}〕\d+号)',  # 国发〔2023〕12号
            r'([\u4e00-\u9fff]{2,10}\[\d{4}\]\d+号)',      # 国发[2023]12号  
            r'(\w+\d{4}-\d+)',                            # ABC2023-001
        ]
        
        search_text = content[:1000]  # 在文档开头搜索
        
        for pattern in number_patterns:
            matches = re.finditer(pattern, search_text)
            for match in matches:
                return match.group(1)
        
        return None
    
    def _extract_issuing_authority(self, content: str) -> Optional[str]:
        """提取发文机关"""
        # 常见发文机关关键词
        authority_indicators = [
            '国务院', '财政部', '税务总局', '人社部', '住建部',
            '省政府', '市政府', '区政府', '县政府'
        ]
        
        lines = content.split('\n')[:30]  # 检查前30行
        
        for line in lines:
            for authority in authority_indicators:
                if authority in line:
                    # 尝试提取完整机关名称
                    return authority
        
        return None
    
    def _infer_authority_level(self, issuing_authority: str) -> str:
        """推断权威级别"""
        for level, authorities in self.authority_levels.items():
            for authority in authorities:
                if authority in issuing_authority:
                    return level
        
        return '其他'
    
    def _infer_policy_category(self, content: str) -> Optional[str]:
        """推断政策分类"""
        content_lower = content.lower()
        
        for category, keywords in self.policy_categories.items():
            if category == '其他':
                continue
            
            keyword_matches = sum(1 for keyword in keywords if keyword in content_lower)
            if keyword_matches >= 2:  # 至少匹配2个关键词
                return category
        
        return '其他'
    
    async def _llm_extract_fields(self, content: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """使用LLM提取复杂字段"""
        # 这里可以集成LLM服务来提取更复杂的字段
        # 暂时返回空值，待后续集成LLM服务
        return {
            'key_points': [],
            'application_conditions': [],
            'procedures': [],
            'required_materials': []
        }
    
    async def validate(self, metadata: Dict[str, Any]) -> ValidationResult:
        """验证政策元数据"""
        errors = []
        warnings = []
        
        # 检查必需字段
        required_fields = self.extraction_rules['required_fields']
        for field in required_fields:
            if field not in metadata or not metadata[field]:
                errors.append(f"缺少必需字段: {field}")
        
        # 验证日期格式
        date_fields = ['publish_date', 'effective_date', 'expiry_date']
        for field in date_fields:
            if field in metadata and metadata[field]:
                if not self._is_valid_date_format(metadata[field]):
                    errors.append(f"日期格式错误: {field}")
        
        # 验证权威级别
        if 'authority_level' in metadata:
            level = metadata['authority_level']
            valid_levels = list(self.authority_levels.keys()) + ['其他']
            if level not in valid_levels:
                errors.append(f"无效的权威级别: {level}")
        
        # 验证政策分类
        if 'policy_category' in metadata:
            category = metadata['policy_category']
            valid_categories = list(self.policy_categories.keys())
            if category not in valid_categories:
                errors.append(f"无效的政策分类: {category}")
        
        is_valid = len(errors) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings
        )
    
    def _is_valid_date_format(self, date_str: str) -> bool:
        """验证日期格式"""
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
            return True
        except ValueError:
            return False
    
    def get_extraction_rules(self) -> Dict[str, Any]:
        """获取提取规则"""
        return self.extraction_rules.copy()