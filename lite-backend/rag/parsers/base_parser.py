"""
基础文档解析器
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import os
from models.document_chunk import ContentType, DocumentBlock


class BaseParser(ABC):
    """基础文档解析器抽象类"""
    
    def __init__(self):
        self.supported_formats = []
    
    @abstractmethod
    def parse(self, file_path: str, **kwargs) -> List[DocumentBlock]:
        """
        解析文档并返回文档块列表
        
        Args:
            file_path: 文档文件路径
            **kwargs: 其他解析参数
        
        Returns:
            文档块列表
        """
        pass
    
    def is_supported(self, file_path: str) -> bool:
        """
        检查文件格式是否支持
        
        Args:
            file_path: 文件路径
        
        Returns:
            是否支持该文件格式
        """
        if not os.path.exists(file_path):
            return False
        
        _, ext = os.path.splitext(file_path.lower())
        return ext in self.supported_formats
    
    def create_document_block(
        self, 
        content: str, 
        content_type: ContentType = ContentType.TEXT,
        page_number: Optional[int] = None,
        headings: Optional[List[str]] = None,
        extra: Optional[Dict[str, Any]] = None
    ) -> DocumentBlock:
        """
        创建文档块
        
        Args:
            content: 文档内容
            content_type: 内容类型
            page_number: 页码
            headings: 标题层级
            extra: 额外信息
        
        Returns:
            文档块对象
        """
        block = DocumentBlock()
        block.content = content
        block.type = content_type
        block.page_number = {page_number} if page_number is not None else set()
        block.headings = headings or []
        block.extra = extra or {}
        
        return block
    
    def extract_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        提取文档元数据
        
        Args:
            file_path: 文件路径
        
        Returns:
            元数据字典
        """
        filename = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        
        return {
            'filename': filename,
            'file_size': file_size,
            'file_path': file_path
        }
    
    def preprocess_content(self, content: str) -> str:
        """
        预处理文档内容
        
        Args:
            content: 原始内容
        
        Returns:
            预处理后的内容
        """
        if not content:
            return ""
        
        # 移除多余的空白字符
        import re
        content = re.sub(r'\s+', ' ', content.strip())
        
        # 移除特殊字符
        content = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', content)
        
        return content
    
    def split_by_paragraphs(self, content: str) -> List[str]:
        """
        按段落分割内容
        
        Args:
            content: 文档内容
        
        Returns:
            段落列表
        """
        if not content:
            return []
        
        import re
        # 按多个换行符分割段落
        paragraphs = re.split(r'\n\s*\n', content)
        
        # 过滤空段落
        return [p.strip() for p in paragraphs if p.strip()]