"""
通用元数据提取器 - 适用于一般文档
按照组件拆分原则，控制文件大小 < 300行
"""
import re
import time
from typing import Dict, Any, List, Optional
from .base_extractor import BaseMetadataExtractor, MetadataExtractionResult, ValidationResult


class GeneralMetadataExtractor(BaseMetadataExtractor):
    """通用场景元数据提取器"""
    
    def __init__(self):
        super().__init__("general")
        self.extraction_rules = {
            'supported_fields': [
                'title', 'author', 'language', 'content_type', 'category', 
                'tags', 'keywords', 'subject', 'credibility', 'timeliness', 
                'completeness', 'access_count', 'reference_count'
            ],
            'required_fields': ['title', 'content_type'],
            'auto_extract_fields': ['title', 'language', 'content_type', 'keywords'],
            'llm_extract_fields': ['category', 'subject', 'tags'],
            'manual_fields': ['credibility', 'timeliness']
        }
    
    async def extract(
        self, 
        content: str, 
        filename: str, 
        config: Dict[str, Any]
    ) -> MetadataExtractionResult:
        """提取通用元数据"""
        start_time = time.time()
        
        try:
            extracted_metadata = {}
            errors = []
            warnings = []
            
            # 1. 自动提取字段
            auto_extracted = await self._auto_extract_fields(content, filename)
            extracted_metadata.update(auto_extracted)
            
            # 2. LLM辅助提取（如果配置中启用）
            if config.get('enable_llm_extraction', True):
                try:
                    llm_extracted = await self._llm_extract_fields(content, config)
                    extracted_metadata.update(llm_extracted)
                except Exception as e:
                    warnings.append(f"LLM提取失败: {str(e)}")
            
            # 3. 清理和标准化数据
            cleaned_metadata = self.clean_extracted_data(extracted_metadata)
            
            # 4. 计算置信度
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
            error_msg = f"通用元数据提取失败: {str(e)}"
            
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
        
        # 提取标题
        extracted['title'] = self._extract_title(content, filename)
        
        # 检测语言
        extracted['language'] = self._detect_language(content)
        
        # 确定内容类型
        extracted['content_type'] = self._determine_content_type(filename, content)
        
        # 提取关键词
        extracted['keywords'] = self._extract_keywords(content)
        
        return extracted
    
    def _extract_title(self, content: str, filename: str) -> str:
        """提取文档标题"""
        # 1. 尝试从内容开头提取标题
        lines = content.strip().split('\n')
        for line in lines[:10]:  # 只检查前10行
            line = line.strip()
            if line and len(line) > 5 and len(line) < 200:
                # 简单启发式：较短且非空的行可能是标题
                if not line.startswith('#') and not line.startswith('//'):
                    return line
        
        # 2. 从文件名提取
        title_from_filename = filename
        if '.' in title_from_filename:
            title_from_filename = title_from_filename.rsplit('.', 1)[0]
        
        # 替换下划线和连字符为空格
        title_from_filename = re.sub(r'[_-]', ' ', title_from_filename)
        
        return title_from_filename.strip()
    
    def _detect_language(self, content: str) -> str:
        """检测文档语言"""
        # 简单的中英文检测
        chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', content))
        english_chars = len(re.findall(r'[a-zA-Z]', content))
        total_chars = chinese_chars + english_chars
        
        if total_chars == 0:
            return 'unknown'
        
        chinese_ratio = chinese_chars / total_chars
        english_ratio = english_chars / total_chars
        
        if chinese_ratio > 0.5:
            return 'zh'
        elif english_ratio > 0.5:
            return 'en'
        elif chinese_ratio > 0.1 and english_ratio > 0.1:
            return 'mixed'
        else:
            return 'unknown'
    
    def _determine_content_type(self, filename: str, content: str) -> str:
        """确定内容类型"""
        file_ext = filename.lower().split('.')[-1] if '.' in filename else ''
        
        # 基于文件扩展名
        ext_mapping = {
            'pdf': 'pdf',
            'docx': 'docx', 
            'doc': 'docx',
            'txt': 'text',
            'md': 'md',
            'markdown': 'md'
        }
        
        if file_ext in ext_mapping:
            return ext_mapping[file_ext]
        
        # 基于内容特征
        if content.startswith('# ') or '## ' in content:
            return 'md'
        
        return 'text'
    
    def _extract_keywords(self, content: str, max_keywords: int = 10) -> List[str]:
        """提取关键词"""
        # 简单的关键词提取逻辑
        # 移除常用停用词
        chinese_stopwords = {'的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'}
        english_stopwords = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'}
        
        # 分词（简单实现）
        words = re.findall(r'[\u4e00-\u9fff]+|[a-zA-Z]+', content.lower())
        
        # 过滤停用词和短词
        filtered_words = [
            word for word in words 
            if len(word) > 1 
            and word not in chinese_stopwords 
            and word not in english_stopwords
        ]
        
        # 统计词频
        word_freq = {}
        for word in filtered_words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # 返回前N个高频词
        top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in top_words[:max_keywords]]
    
    async def _llm_extract_fields(self, content: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """使用LLM提取更复杂的字段"""
        # 这里可以集成LLM服务来提取category, subject, tags等字段
        # 暂时返回空值，待后续集成LLM服务
        return {
            'category': None,
            'subject': None,
            'tags': []
        }
    
    async def validate(self, metadata: Dict[str, Any]) -> ValidationResult:
        """验证通用元数据"""
        errors = []
        warnings = []
        
        # 检查必需字段
        required_fields = self.extraction_rules['required_fields']
        for field in required_fields:
            if field not in metadata or not metadata[field]:
                errors.append(f"缺少必需字段: {field}")
        
        # 验证特定字段格式
        if 'title' in metadata:
            title = metadata['title']
            if isinstance(title, str) and len(title) > 500:
                warnings.append("标题过长，建议缩短至500字符以内")
        
        if 'language' in metadata:
            language = metadata['language']
            valid_languages = ['zh', 'en', 'mixed', 'unknown']
            if language not in valid_languages:
                errors.append(f"无效的语言代码: {language}")
        
        if 'keywords' in metadata:
            keywords = metadata['keywords']
            if isinstance(keywords, list) and len(keywords) > 20:
                warnings.append("关键词数量过多，建议控制在20个以内")
        
        is_valid = len(errors) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings
        )
    
    def get_extraction_rules(self) -> Dict[str, Any]:
        """获取提取规则"""
        return self.extraction_rules.copy()