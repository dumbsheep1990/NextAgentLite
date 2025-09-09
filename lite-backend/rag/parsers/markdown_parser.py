"""
Markdown文件解析器
"""

import re
import base64
from io import BytesIO
from typing import List, Dict, Any, Optional
from .base_parser import BaseParser
from models.document_chunk import ContentType, DocumentBlock

try:
    import markdown
    from markdown.extensions.fenced_code import FencedCodeExtension
    from markdown.extensions.tables import TableExtension
    from bs4 import BeautifulSoup
    MARKDOWN_AVAILABLE = True
except ImportError:
    MARKDOWN_AVAILABLE = False

try:
    import requests
    from PIL import Image
    IMAGE_PROCESSING_AVAILABLE = True
except ImportError:
    IMAGE_PROCESSING_AVAILABLE = False


class MarkdownParser(BaseParser):
    """Markdown文件解析器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['.md', '.markdown']
    
    def parse(self, file_path: str, **kwargs) -> List[DocumentBlock]:
        """
        解析Markdown文件
        
        Args:
            file_path: 文件路径
            **kwargs: 解析参数
        
        Returns:
            文档块列表
        """
        if not self.is_supported(file_path):
            raise ValueError(f"Unsupported file format: {file_path}")
        
        if not MARKDOWN_AVAILABLE:
            # 如果没有markdown库，使用简单解析
            return self._simple_parse(file_path)
        
        # 读取Markdown内容
        with open(file_path, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # 使用markdown库解析
        html = markdown.markdown(
            md_content, 
            extensions=[TableExtension(), FencedCodeExtension()]
        )
        
        # 使用BeautifulSoup解析HTML
        soup = BeautifulSoup(html, 'html.parser')
        
        blocks = []
        current_heading_stack = []
        
        # 遍历所有元素
        for element in soup.find_all([
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
            'p', 'table', 'img', 'pre', 'ul', 'ol', 'blockquote'
        ]):
            
            if element.name.startswith('h'):
                # 处理标题
                level = int(element.name[1])
                current_heading_stack = current_heading_stack[:level - 1]
                current_heading_stack.append(element.get_text(strip=True))
                
            elif element.name == 'p':
                # 处理段落
                content_text = element.get_text(strip=True)
                if content_text:
                    block = self.create_document_block(
                        content=content_text,
                        content_type=ContentType.TEXT,
                        headings=current_heading_stack.copy()
                    )
                    blocks.append(block)
                    
            elif element.name == 'table':
                # 处理表格
                table_content = self._convert_table_to_markdown(element)
                block = self.create_document_block(
                    content=table_content,
                    content_type=ContentType.TABLE,
                    headings=current_heading_stack.copy()
                )
                blocks.append(block)
                
            elif element.name == 'img':
                # 处理图像
                img_data = self._process_image(element)
                if img_data:
                    block = self.create_document_block(
                        content=img_data,
                        content_type=ContentType.IMAGE,
                        headings=current_heading_stack.copy()
                    )
                    blocks.append(block)
                    
            elif element.name == 'pre':
                # 处理代码块
                code_element = element.find('code')
                if code_element:
                    code_text = code_element.get_text(strip=True)
                    block = self.create_document_block(
                        content=code_text,
                        content_type=ContentType.TEXT,
                        headings=current_heading_stack.copy(),
                        extra={'type': 'code'}
                    )
                    blocks.append(block)
                    
            elif element.name in ['ul', 'ol']:
                # 处理列表
                list_content = self._convert_list_to_markdown(element)
                block = self.create_document_block(
                    content=list_content,
                    content_type=ContentType.TEXT,
                    headings=current_heading_stack.copy(),
                    extra={'type': 'list'}
                )
                blocks.append(block)
                
            elif element.name == 'blockquote':
                # 处理引用块
                quote_content = self._convert_blockquote_to_markdown(element)
                block = self.create_document_block(
                    content=quote_content,
                    content_type=ContentType.TEXT,
                    headings=current_heading_stack.copy(),
                    extra={'type': 'quote'}
                )
                blocks.append(block)
        
        return blocks
    
    def _simple_parse(self, file_path: str) -> List[DocumentBlock]:
        """
        简单Markdown解析（不依赖外部库）
        
        Args:
            file_path: 文件路径
        
        Returns:
            文档块列表
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        blocks = []
        lines = content.split('\n')
        current_content = []
        current_headings = []
        
        for line in lines:
            line = line.strip()
            
            if not line:
                if current_content:
                    # 保存当前段落
                    content_text = '\n'.join(current_content)
                    if content_text.strip():
                        block = self.create_document_block(
                            content=content_text,
                            content_type=ContentType.TEXT,
                            headings=current_headings.copy()
                        )
                        blocks.append(block)
                    current_content = []
                continue
            
            # 检测标题
            if line.startswith('#'):
                # 保存之前的内容
                if current_content:
                    content_text = '\n'.join(current_content)
                    if content_text.strip():
                        block = self.create_document_block(
                            content=content_text,
                            content_type=ContentType.TEXT,
                            headings=current_headings.copy()
                        )
                        blocks.append(block)
                    current_content = []
                
                # 处理新标题
                level = len(line) - len(line.lstrip('#'))
                title = line.lstrip('#').strip()
                current_headings = current_headings[:level-1] + [title]
                
            else:
                current_content.append(line)
        
        # 处理最后的内容
        if current_content:
            content_text = '\n'.join(current_content)
            if content_text.strip():
                block = self.create_document_block(
                    content=content_text,
                    content_type=ContentType.TEXT,
                    headings=current_headings.copy()
                )
                blocks.append(block)
        
        return blocks
    
    def _convert_table_to_markdown(self, table_element) -> str:
        """将HTML表格转换为Markdown格式"""
        rows = table_element.find_all('tr')
        markdown_rows = []
        
        for row in rows:
            cells = row.find_all(['th', 'td'])
            markdown_cells = [cell.get_text(strip=True) for cell in cells]
            markdown_rows.append('| ' + ' | '.join(markdown_cells) + ' |')
        
        # 添加表头分隔行
        if len(rows) > 0:
            header_separator = '| ' + ' | '.join(['---'] * len(rows[0].find_all(['th', 'td']))) + ' |'
            markdown_rows.insert(1, header_separator)
        
        return '\n'.join(markdown_rows)
    
    def _convert_list_to_markdown(self, list_element) -> str:
        """将HTML列表转换为Markdown格式"""
        list_items = []
        for li in list_element.find_all('li', recursive=False):
            text = li.get_text(strip=True)
            prefix = '- ' if list_element.name == 'ul' else '1. '
            list_items.append(prefix + text)
        return '\n'.join(list_items)
    
    def _convert_blockquote_to_markdown(self, blockquote_element) -> str:
        """将HTML引用块转换为Markdown格式"""
        quote_text = blockquote_element.get_text(strip=True)
        return '> ' + quote_text.replace('\n', '\n> ')
    
    def _process_image(self, img_element) -> Optional[str]:
        """处理图像元素"""
        if not IMAGE_PROCESSING_AVAILABLE:
            return img_element.get('alt', 'Image')
        
        img_url = img_element.get('src')
        if not img_url:
            return None
        
        try:
            if img_url.startswith('http'):
                # 网络图片
                response = requests.get(img_url, timeout=5)
                response.raise_for_status()
                img = Image.open(BytesIO(response.content))
            else:
                # 本地图片
                img = Image.open(img_url)
            
            # 转换为base64
            buffered = BytesIO()
            img.save(buffered, format='PNG')
            return base64.b64encode(buffered.getvalue()).decode('utf-8')
            
        except Exception as e:
            # 图片处理失败，返回alt文本
            return img_element.get('alt', f'Image loading failed: {str(e)}')
    
    def extract_metadata(self, file_path: str) -> Dict[str, Any]:
        """提取Markdown文件元数据"""
        base_metadata = super().extract_metadata(file_path)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 统计标题数量
        heading_count = len(re.findall(r'^#+\s', content, re.MULTILINE))
        
        # 统计代码块数量
        code_block_count = len(re.findall(r'```', content)) // 2
        
        # 统计链接数量
        link_count = len(re.findall(r'\[.*?\]\(.*?\)', content))
        
        # 统计图片数量
        image_count = len(re.findall(r'!\[.*?\]\(.*?\)', content))
        
        base_metadata.update({
            'heading_count': heading_count,
            'code_block_count': code_block_count,
            'link_count': link_count,
            'image_count': image_count,
            'markdown_features': {
                'has_tables': '|' in content,
                'has_code_blocks': '```' in content,
                'has_links': '[' in content and '](' in content,
                'has_images': '![' in content
            }
        })
        
        return base_metadata