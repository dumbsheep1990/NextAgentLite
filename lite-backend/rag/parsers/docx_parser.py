"""
DOCX文件解析器
"""

from typing import List
from .base_parser import BaseParser
from models.document_chunk import ContentType, DocumentBlock


class DocxParser(BaseParser):
    """DOCX文件解析器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['.docx', '.doc']
    
    def parse(self, file_path: str, **kwargs) -> List[DocumentBlock]:
        """
        解析DOCX文件
        
        Args:
            file_path: 文件路径
            **kwargs: 解析参数
        
        Returns:
            文档块列表
        """
        try:
            # 尝试使用python-docx
            from docx import Document
            return self._parse_with_python_docx(file_path)
        except ImportError:
            # 如果没有安装python-docx，返回占位符
            return self._create_placeholder_block(file_path)
    
    def _parse_with_python_docx(self, file_path: str) -> List[DocumentBlock]:
        """使用python-docx解析DOCX"""
        from docx import Document
        from docx.shared import Inches
        
        doc = Document(file_path)
        blocks = []
        current_headings = []
        
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            
            if not text:
                continue
            
            # 检测标题样式
            style_name = paragraph.style.name.lower()
            
            if 'heading' in style_name:
                # 提取标题级别
                try:
                    level = int(style_name.split()[-1]) if style_name.split()[-1].isdigit() else 1
                except:
                    level = 1
                
                # 更新标题堆栈
                current_headings = current_headings[:level-1] + [text]
                
                # 标题也作为内容块
                block = self.create_document_block(
                    content=text,
                    content_type=ContentType.TEXT,
                    headings=current_headings.copy(),
                    extra={'style': style_name, 'is_heading': True, 'level': level}
                )
                blocks.append(block)
                
            else:
                # 普通段落
                processed_text = self.preprocess_content(text)
                
                block = self.create_document_block(
                    content=processed_text,
                    content_type=ContentType.TEXT,
                    headings=current_headings.copy(),
                    extra={'style': style_name}
                )
                blocks.append(block)
        
        # 处理表格
        for table in doc.tables:
            table_text = self._extract_table_text(table)
            if table_text.strip():
                block = self.create_document_block(
                    content=table_text,
                    content_type=ContentType.TABLE,
                    headings=current_headings.copy(),
                    extra={'type': 'table'}
                )
                blocks.append(block)
        
        return blocks
    
    def _extract_table_text(self, table) -> str:
        """提取表格文本"""
        table_data = []
        
        for row in table.rows:
            row_data = []
            for cell in row.cells:
                cell_text = cell.text.strip()
                row_data.append(cell_text)
            table_data.append(" | ".join(row_data))
        
        return "\n".join(table_data)
    
    def _create_placeholder_block(self, file_path: str) -> List[DocumentBlock]:
        """创建占位符块（当没有python-docx库时）"""
        import os
        filename = os.path.basename(file_path)
        
        block = self.create_document_block(
            content=f"DOCX文件: {filename}\n注意：需要安装python-docx库来解析DOCX内容",
            content_type=ContentType.TEXT,
            page_number=1,
            extra={'source': 'placeholder', 'error': 'no_docx_library'}
        )
        
        return [block]