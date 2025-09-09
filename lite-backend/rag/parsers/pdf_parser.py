"""
PDF文件解析器（简化版本）
"""

from typing import List
from .base_parser import BaseParser
from models.document_chunk import ContentType, DocumentBlock


class PDFParser(BaseParser):
    """PDF文件解析器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['.pdf']
    
    def parse(self, file_path: str, **kwargs) -> List[DocumentBlock]:
        """
        解析PDF文件
        
        Args:
            file_path: 文件路径
            **kwargs: 解析参数
        
        Returns:
            文档块列表
        """
        # 这里是简化实现，实际项目中需要使用PDF解析库
        # 如 PyPDF2, pdfplumber, 或其他PDF处理库
        
        try:
            # 尝试使用PyPDF2
            import PyPDF2
            return self._parse_with_pypdf2(file_path)
        except ImportError:
            try:
                # 尝试使用pdfplumber
                import pdfplumber
                return self._parse_with_pdfplumber(file_path)
            except ImportError:
                # 如果都没有安装，返回占位符
                return self._create_placeholder_block(file_path)
    
    def _parse_with_pypdf2(self, file_path: str) -> List[DocumentBlock]:
        """使用PyPDF2解析PDF"""
        import PyPDF2
        
        blocks = []
        
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page_num, page in enumerate(pdf_reader.pages):
                text = page.extract_text()
                
                if text.strip():
                    # 按段落分割
                    paragraphs = self.split_by_paragraphs(text)
                    
                    for paragraph in paragraphs:
                        if paragraph.strip():
                            block = self.create_document_block(
                                content=self.preprocess_content(paragraph),
                                content_type=ContentType.TEXT,
                                page_number=page_num + 1,
                                extra={'source': 'pdf_pypdf2'}
                            )
                            blocks.append(block)
        
        return blocks
    
    def _parse_with_pdfplumber(self, file_path: str) -> List[DocumentBlock]:
        """使用pdfplumber解析PDF"""
        import pdfplumber
        
        blocks = []
        
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text()
                
                if text and text.strip():
                    # 按段落分割
                    paragraphs = self.split_by_paragraphs(text)
                    
                    for paragraph in paragraphs:
                        if paragraph.strip():
                            block = self.create_document_block(
                                content=self.preprocess_content(paragraph),
                                content_type=ContentType.TEXT,
                                page_number=page_num + 1,
                                extra={'source': 'pdf_pdfplumber'}
                            )
                            blocks.append(block)
                
                # 尝试提取表格
                tables = page.extract_tables()
                for table in tables or []:
                    if table:
                        table_text = self._table_to_text(table)
                        if table_text.strip():
                            block = self.create_document_block(
                                content=table_text,
                                content_type=ContentType.TABLE,
                                page_number=page_num + 1,
                                extra={'source': 'pdf_table'}
                            )
                            blocks.append(block)
        
        return blocks
    
    def _table_to_text(self, table) -> str:
        """将表格转换为文本格式"""
        if not table:
            return ""
        
        lines = []
        for row in table:
            if row:
                # 过滤None值并连接单元格
                cells = [str(cell) if cell is not None else "" for cell in row]
                lines.append(" | ".join(cells))
        
        return "\n".join(lines)
    
    def _create_placeholder_block(self, file_path: str) -> List[DocumentBlock]:
        """创建占位符块（当没有PDF解析库时）"""
        import os
        filename = os.path.basename(file_path)
        
        block = self.create_document_block(
            content=f"PDF文件: {filename}\n注意：需要安装PyPDF2或pdfplumber库来解析PDF内容",
            content_type=ContentType.TEXT,
            page_number=1,
            extra={'source': 'placeholder', 'error': 'no_pdf_library'}
        )
        
        return [block]