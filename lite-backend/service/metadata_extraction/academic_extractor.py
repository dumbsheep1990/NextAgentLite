"""
学术文档元数据提取器 - 专门用于学术论文
按照组件拆分原则，控制文件大小 < 280行
"""
import re
import time
from typing import Dict, Any, List, Optional
from .base_extractor import BaseMetadataExtractor, MetadataExtractionResult, ValidationResult


class AcademicMetadataExtractor(BaseMetadataExtractor):
    """学术文档元数据提取器"""
    
    def __init__(self):
        super().__init__("academic")
        self.extraction_rules = {
            'supported_fields': [
                'paper_title', 'authors', 'publication_venue', 'publication_type', 
                'publication_date', 'impact_factor', 'citation_count', 'h_index',
                'peer_review_status', 'research_field', 'methodology', 'keywords',
                'abstract', 'research_type', 'reference_count', 'key_references',
                'cited_by', 'novelty_score', 'technical_depth', 'practical_applicability'
            ],
            'required_fields': ['paper_title', 'authors'],
            'auto_extract_fields': [
                'paper_title', 'authors', 'publication_date', 'keywords', 'abstract'
            ],
            'llm_extract_fields': [
                'research_field', 'methodology', 'research_type', 'technical_depth'
            ],
            'external_api_fields': ['citation_count', 'impact_factor'],
            'manual_fields': ['peer_review_status', 'novelty_score']
        }
        
        # 研究类型映射
        self.research_types = {
            'theoretical': ['理论', '数学', '建模', '模型'],
            'experimental': ['实验', '测试', '测量', '观察'],
            'survey': ['调研', '综述', '回顾', '比较'],
            'review': ['综述', '回顾', '分析', '总结']
        }
        
        # 技术深度映射  
        self.technical_depths = {
            'basic': ['入门', '基础', '简介', '概述'],
            'intermediate': ['中级', '进阶', '应用'],
            'advanced': ['高级', '前沿', '先进', '创新']
        }
    
    async def extract(
        self, 
        content: str, 
        filename: str, 
        config: Dict[str, Any]
    ) -> MetadataExtractionResult:
        """提取学术文档元数据"""
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
            
            # 4. 清理和标准化数据
            cleaned_metadata = self.clean_extracted_data(extracted_metadata)
            
            # 5. 计算置信度
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
            error_msg = f"学术元数据提取失败: {str(e)}"
            
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
        
        # 提取论文标题
        extracted['paper_title'] = self._extract_paper_title(content, filename)
        
        # 提取作者
        authors = self._extract_authors(content)
        if authors:
            extracted['authors'] = authors
        
        # 提取摘要
        abstract = self._extract_abstract(content)
        if abstract:
            extracted['abstract'] = abstract
        
        # 提取关键词
        keywords = self._extract_keywords(content)
        if keywords:
            extracted['keywords'] = keywords
        
        return extracted
    
    def _extract_paper_title(self, content: str, filename: str) -> str:
        """提取论文标题"""
        lines = content.strip().split('\n')
        
        # 学术论文标题通常在最前面且较短
        for line in lines[:10]:
            line = line.strip()
            if line and 10 <= len(line) <= 200:
                # 避免明显的非标题行
                if not re.match(r'^(abstract|keywords|author)', line.lower()):
                    return line
        
        # 从文件名提取
        title_from_filename = filename
        if '.' in title_from_filename:
            title_from_filename = title_from_filename.rsplit('.', 1)[0]
        return re.sub(r'[_-]', ' ', title_from_filename).strip()
    
    def _extract_authors(self, content: str) -> List[str]:
        """提取作者信息"""
        lines = content.split('\n')[:20]  # 检查前20行
        authors = []
        
        for line in lines:
            line = line.strip()
            # 查找包含作者信息的行
            if re.search(r'(author|作者)', line.lower()):
                # 简单的作者提取逻辑
                # 移除"Authors:"等标识
                author_line = re.sub(r'(authors?|作者)[:：]?', '', line, flags=re.IGNORECASE).strip()
                
                # 按逗号或分号分割作者
                author_candidates = re.split(r'[,;，；]', author_line)
                
                for author in author_candidates:
                    author = author.strip()
                    if author and len(author) > 1 and len(author) < 50:
                        authors.append(author)
        
        return authors[:10]  # 最多返回10个作者
    
    def _extract_abstract(self, content: str) -> Optional[str]:
        """提取摘要"""
        # 查找摘要部分
        abstract_patterns = [
            r'abstract[:：]\s*(.*?)(?=\n\s*(?:keywords?|introduction|1\.|\n\n))',
            r'摘\s*要[:：]\s*(.*?)(?=\n\s*(?:关键词|引言|1\.|\n\n))'
        ]
        
        for pattern in abstract_patterns:
            matches = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if matches:
                abstract = matches.group(1).strip()
                if len(abstract) > 50:  # 摘要应该有一定长度
                    return abstract[:1000]  # 限制长度
        
        return None
    
    def _extract_keywords(self, content: str) -> List[str]:
        """提取关键词"""
        keyword_patterns = [
            r'keywords?[:：]\s*(.*?)(?=\n|$)',
            r'关键词[:：]\s*(.*?)(?=\n|$)'
        ]
        
        for pattern in keyword_patterns:
            matches = re.search(pattern, content, re.IGNORECASE)
            if matches:
                keyword_line = matches.group(1).strip()
                
                # 按常见分隔符分割关键词
                keywords = re.split(r'[,;，；、]', keyword_line)
                
                # 清理关键词
                cleaned_keywords = []
                for keyword in keywords:
                    keyword = keyword.strip()
                    if keyword and len(keyword) > 1 and len(keyword) < 50:
                        cleaned_keywords.append(keyword)
                
                return cleaned_keywords[:15]  # 最多返回15个关键词
        
        return []
    
    async def _pattern_extract_fields(self, content: str) -> Dict[str, Any]:
        """基于模式匹配提取字段"""
        extracted = {}
        
        # 提取发表日期
        publication_date = self._extract_publication_date(content)
        if publication_date:
            extracted['publication_date'] = publication_date
        
        # 提取期刊或会议信息
        venue = self._extract_publication_venue(content)
        if venue:
            extracted['publication_venue'] = venue
        
        return extracted
    
    def _extract_publication_date(self, content: str) -> Optional[str]:
        """提取发表日期"""
        date_patterns = [
            r'(\d{4})',  # 简单年份匹配
            r'(\d{4})年',
            r'(\d{4})-(\d{1,2})-(\d{1,2})',
        ]
        
        # 在文档前部分查找日期
        search_text = content[:1000]
        
        for pattern in date_patterns:
            matches = re.finditer(pattern, search_text)
            for match in matches:
                year = match.group(1)
                try:
                    year_int = int(year)
                    if 1990 <= year_int <= 2030:  # 合理的年份范围
                        return year
                except ValueError:
                    continue
        
        return None
    
    def _extract_publication_venue(self, content: str) -> Optional[str]:
        """提取发表场所"""
        # 常见期刊/会议指示词
        venue_patterns = [
            r'published in (.+?)(?=\n|,|\.)',
            r'journal of (.+?)(?=\n|,|\.)',
            r'proceedings of (.+?)(?=\n|,|\.)',
        ]
        
        for pattern in venue_patterns:
            matches = re.search(pattern, content, re.IGNORECASE)
            if matches:
                venue = matches.group(1).strip()
                if len(venue) < 200:
                    return venue
        
        return None
    
    async def _infer_fields(self, content: str) -> Dict[str, Any]:
        """推断字段"""
        extracted = {}
        
        # 推断研究类型
        research_type = self._infer_research_type(content)
        if research_type:
            extracted['research_type'] = research_type
        
        # 推断技术深度
        technical_depth = self._infer_technical_depth(content)
        if technical_depth:
            extracted['technical_depth'] = technical_depth
        
        return extracted
    
    def _infer_research_type(self, content: str) -> Optional[str]:
        """推断研究类型"""
        content_lower = content.lower()
        
        for research_type, keywords in self.research_types.items():
            keyword_matches = sum(1 for keyword in keywords if keyword in content_lower)
            if keyword_matches >= 1:
                return research_type
        
        return None
    
    def _infer_technical_depth(self, content: str) -> Optional[str]:
        """推断技术深度"""
        content_lower = content.lower()
        
        for depth, keywords in self.technical_depths.items():
            keyword_matches = sum(1 for keyword in keywords if keyword in content_lower)
            if keyword_matches >= 1:
                return depth
        
        return 'intermediate'  # 默认中级
    
    async def validate(self, metadata: Dict[str, Any]) -> ValidationResult:
        """验证学术元数据"""
        errors = []
        warnings = []
        
        # 检查必需字段
        required_fields = self.extraction_rules['required_fields']
        for field in required_fields:
            if field not in metadata or not metadata[field]:
                errors.append(f"缺少必需字段: {field}")
        
        # 验证作者字段
        if 'authors' in metadata:
            authors = metadata['authors']
            if not isinstance(authors, list):
                errors.append("作者字段必须是列表格式")
            elif len(authors) == 0:
                errors.append("至少需要一个作者")
        
        # 验证研究类型
        if 'research_type' in metadata:
            research_type = metadata['research_type']
            valid_types = list(self.research_types.keys())
            if research_type not in valid_types:
                errors.append(f"无效的研究类型: {research_type}")
        
        is_valid = len(errors) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings
        )
    
    def get_extraction_rules(self) -> Dict[str, Any]:
        """获取提取规则"""
        return self.extraction_rules.copy()