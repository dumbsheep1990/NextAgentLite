"""
Excel文件解析器
"""

from typing import List
from .base_parser import BaseParser
from models.document_chunk import ContentType, DocumentBlock


class ExcelParser(BaseParser):
    """Excel文件解析器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['.xlsx', '.xls', '.csv']
    
    def parse(self, file_path: str, **kwargs) -> List[DocumentBlock]:
        """
        解析Excel文件
        
        Args:
            file_path: 文件路径
            **kwargs: 解析参数
        
        Returns:
            文档块列表
        """
        import os
        file_ext = os.path.splitext(file_path.lower())[1]
        
        if file_ext == '.csv':
            return self._parse_csv(file_path)
        else:
            try:
                # 尝试使用pandas
                import pandas as pd
                return self._parse_with_pandas(file_path)
            except ImportError:
                try:
                    # 尝试使用openpyxl
                    import openpyxl
                    return self._parse_with_openpyxl(file_path)
                except ImportError:
                    # 如果都没有安装，返回占位符
                    return self._create_placeholder_block(file_path)
    
    def _parse_csv(self, file_path: str) -> List[DocumentBlock]:
        """解析CSV文件"""
        import csv
        
        blocks = []
        
        try:
            with open(file_path, 'r', encoding='utf-8', newline='') as f:
                # 尝试自动检测分隔符
                sample = f.read(1024)
                f.seek(0)
                sniffer = csv.Sniffer()
                delimiter = sniffer.sniff(sample).delimiter
                
                reader = csv.reader(f, delimiter=delimiter)
                rows = list(reader)
                
                if rows:
                    # 将整个CSV作为一个表格块
                    table_text = self._rows_to_table_text(rows)
                    
                    block = self.create_document_block(
                        content=table_text,
                        content_type=ContentType.TABLE,
                        extra={'source': 'csv', 'row_count': len(rows)}
                    )
                    blocks.append(block)
                    
        except Exception as e:
            # CSV解析失败，尝试作为文本读取
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                block = self.create_document_block(
                    content=self.preprocess_content(content),
                    content_type=ContentType.TEXT,
                    extra={'source': 'csv_fallback', 'error': str(e)}
                )
                blocks.append(block)
            except Exception:
                blocks = self._create_placeholder_block(file_path)
        
        return blocks
    
    def _parse_with_pandas(self, file_path: str) -> List[DocumentBlock]:
        """使用pandas解析Excel"""
        import pandas as pd
        
        blocks = []
        
        try:
            # 读取所有工作表
            excel_data = pd.read_excel(file_path, sheet_name=None)
            
            for sheet_name, df in excel_data.items():
                if df.empty:
                    continue
                
                # 将DataFrame转换为文本格式
                table_text = self._dataframe_to_table_text(df)
                
                block = self.create_document_block(
                    content=table_text,
                    content_type=ContentType.TABLE,
                    extra={
                        'source': 'excel_pandas',
                        'sheet_name': sheet_name,
                        'row_count': len(df),
                        'column_count': len(df.columns)
                    }
                )
                blocks.append(block)
                
        except Exception as e:
            blocks = self._create_placeholder_block(file_path)
            
        return blocks
    
    def _parse_with_openpyxl(self, file_path: str) -> List[DocumentBlock]:
        """使用openpyxl解析Excel"""
        import openpyxl
        
        blocks = []
        
        try:
            workbook = openpyxl.load_workbook(file_path, read_only=True)
            
            for sheet_name in workbook.sheetnames:
                sheet = workbook[sheet_name]
                
                rows = []
                for row in sheet.iter_rows(values_only=True):
                    if any(cell is not None for cell in row):
                        rows.append([str(cell) if cell is not None else "" for cell in row])
                
                if rows:
                    table_text = self._rows_to_table_text(rows)
                    
                    block = self.create_document_block(
                        content=table_text,
                        content_type=ContentType.TABLE,
                        extra={
                            'source': 'excel_openpyxl',
                            'sheet_name': sheet_name,
                            'row_count': len(rows)
                        }
                    )
                    blocks.append(block)
            
            workbook.close()
            
        except Exception as e:
            blocks = self._create_placeholder_block(file_path)
            
        return blocks
    
    def _dataframe_to_table_text(self, df) -> str:
        """将pandas DataFrame转换为表格文本"""
        # 包含列名
        lines = [" | ".join(str(col) for col in df.columns)]
        
        # 添加分隔线
        lines.append(" | ".join(["---"] * len(df.columns)))
        
        # 添加数据行
        for _, row in df.iterrows():
            line = " | ".join(str(val) if pd.notna(val) else "" for val in row)
            lines.append(line)
        
        return "\n".join(lines)
    
    def _rows_to_table_text(self, rows) -> str:
        """将行数据转换为表格文本"""
        if not rows:
            return ""
        
        lines = []
        for i, row in enumerate(rows):
            line = " | ".join(str(cell) for cell in row)
            lines.append(line)
            
            # 在第一行后添加分隔线（假设第一行是标题）
            if i == 0 and len(rows) > 1:
                separator = " | ".join(["---"] * len(row))
                lines.append(separator)
        
        return "\n".join(lines)
    
    def _create_placeholder_block(self, file_path: str) -> List[DocumentBlock]:
        """创建占位符块"""
        import os
        filename = os.path.basename(file_path)
        
        block = self.create_document_block(
            content=f"Excel文件: {filename}\n注意：需要安装pandas或openpyxl库来解析Excel内容",
            content_type=ContentType.TEXT,
            page_number=1,
            extra={'source': 'placeholder', 'error': 'no_excel_library'}
        )
        
        return [block]