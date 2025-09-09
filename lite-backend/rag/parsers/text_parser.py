"""
文本文件解析器
"""

import os
from typing import List
from .base_parser import BaseParser
from models.document_chunk import ContentType, DocumentBlock
from rag.nlp import find_codec


class TextParser(BaseParser):
    """文本文件解析器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['.txt', '.text', '.log']
    
    def parse(self, file_path: str, **kwargs) -> List[DocumentBlock]:
        """
        解析文本文件
        
        Args:
            file_path: 文件路径
            **kwargs: 解析参数
        
        Returns:
            文档块列表
        """
        if not self.is_supported(file_path):
            raise ValueError(f"Unsupported file format: {file_path}")
        
        # 读取文件内容
        content = self._read_text_file(file_path)
        
        if not content.strip():
            return []
        
        # 分段处理
        paragraphs = self.split_by_paragraphs(content)
        
        blocks = []
        for i, paragraph in enumerate(paragraphs):
            if not paragraph.strip():
                continue
            
            # 预处理内容
            processed_content = self.preprocess_content(paragraph)
            
            # 创建文档块
            block = self.create_document_block(
                content=processed_content,
                content_type=ContentType.TEXT,
                page_number=1,  # 文本文件只有一页
                headings=[],
                extra={
                    'paragraph_index': i,
                    'original_length': len(paragraph)
                }
            )
            
            blocks.append(block)
        
        return blocks
    
    def _read_text_file(self, file_path: str) -> str:
        """
        读取文本文件内容，自动检测编码
        
        Args:
            file_path: 文件路径
        
        Returns:
            文件内容
        """
        try:
            # 先尝试UTF-8编码
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            # UTF-8失败，尝试自动检测编码
            try:
                with open(file_path, 'rb') as f:
                    raw_data = f.read()
                
                encoding = find_codec(raw_data)
                
                with open(file_path, 'r', encoding=encoding) as f:
                    return f.read()
            except Exception as e:
                # 最后尝试GBK编码
                try:
                    with open(file_path, 'r', encoding='gbk') as f:
                        return f.read()
                except Exception:
                    # 如果都失败了，使用错误处理方式读取
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        return f.read()
    
    def extract_metadata(self, file_path: str) -> dict:
        """
        提取文本文件元数据
        
        Args:
            file_path: 文件路径
        
        Returns:
            元数据字典
        """
        base_metadata = super().extract_metadata(file_path)
        
        # 读取内容以获取更多信息
        content = self._read_text_file(file_path)
        
        # 统计信息
        line_count = len(content.split('\n'))
        word_count = len(content.split())
        char_count = len(content)
        
        base_metadata.update({
            'line_count': line_count,
            'word_count': word_count,
            'char_count': char_count,
            'encoding': 'auto-detected'
        })
        
        return base_metadata
    
    def split_by_paragraphs(self, content: str) -> List[str]:
        """
        按段落分割内容（重写基类方法，支持更细粒度的分割）
        
        Args:
            content: 文档内容
        
        Returns:
            段落列表
        """
        if not content:
            return []
        
        import re
        
        # 首先尝试按双换行符分割（标准段落）
        paragraphs = re.split(r'\n\s*\n', content)
        
        # 如果只有一个段落，尝试按单换行符分割
        if len(paragraphs) == 1:
            paragraphs = content.split('\n')
        
        # 如果段落仍然很少但内容很长，按句号分割
        if len(paragraphs) <= 2 and len(content) > 500:
            # 按句号、感叹号、问号分割
            sentences = re.split(r'[。！？.!?]+\s*', content)
            
            # 将短句合并成段落，避免过多小段落
            combined_paragraphs = []
            current_paragraph = ""
            
            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue
                
                # 如果当前段落+新句子超过200字符，开始新段落
                if current_paragraph and len(current_paragraph + sentence) > 200:
                    combined_paragraphs.append(current_paragraph.strip())
                    current_paragraph = sentence
                else:
                    if current_paragraph:
                        current_paragraph += " " + sentence
                    else:
                        current_paragraph = sentence
            
            # 添加最后的段落
            if current_paragraph.strip():
                combined_paragraphs.append(current_paragraph.strip())
            
            paragraphs = combined_paragraphs
        
        # 过滤空段落
        return [p.strip() for p in paragraphs if p.strip()]