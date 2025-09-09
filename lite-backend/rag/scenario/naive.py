import base64
import copy
import json

import os
import time



import re
from io import BytesIO
from typing import List

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

from models.document_chunk import ContentType, DocumentBlock
from rag.utils.chunk_utils import num_tokens_from_string, split_text_by_delimiter
from rag.utils.lang_detect import analyze_document_language
from rag.nlp import naive_merge, tokenize_chunks, formatting_res
from rag.nlp.tokenizer import tokenize, fine_grained_tokenize
from rag.parsers.text_parser import TextParser
from rag.parsers.markdown_parser import MarkdownParser
from rag.parsers.pdf_parser import PDFParser
from rag.parsers.docx_parser import DocxParser
from rag.parsers.excel_parser import ExcelParser


class MarkdownParser:

    def get_picture(self, url):
        """从URL获取图像并返回PIL.Image对象或None（带容错）"""
        try:
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            img.verify()  # 验证图片是否完整
            img = Image.open(BytesIO(response.content))  # 重新打开以用于后续操作
            return img
        except Exception as e:
            print(f"[图片获取失败] URL: {url}，原因: {e}")
            return None

    def _convert_table_to_markdown(self, table_element):
        """
        将HTML表格转换为Markdown格式的表格
        """
        rows = table_element.find_all('tr')
        markdown_rows = []

        for row in rows:
            # 处理表头或表格行
            cells = row.find_all(['th', 'td'])
            markdown_cells = [cell.get_text(strip=True) for cell in cells]
            markdown_rows.append('| ' + ' | '.join(markdown_cells) + ' |')

        # 添加表头分隔行
        if len(rows) > 0:
            header_separator = '| ' + ' | '.join(['---'] * len(rows[0].find_all(['th', 'td']))) + ' |'
            markdown_rows.insert(1, header_separator)

        return '\n'.join(markdown_rows)

    def _convert_list_to_markdown(self, list_element):
        """
        将HTML列表转换为Markdown格式的列表
        """
        list_items = []
        for li in list_element.find_all('li', recursive=False):
            # 获取列表项的文本内容
            text = li.get_text(strip=True)
            # 如果是嵌套列表，递归处理
            nested_lists = li.find_all(['ul', 'ol'], recursive=False)
            if nested_lists:
                nested_md = self._convert_list_to_markdown(nested_lists[0])
                text += '\n' + nested_md
            # 根据列表类型添加前缀
            prefix = '- ' if list_element.name == 'ul' else '1. '
            list_items.append(prefix + text)
        return '\n'.join(list_items)

    def _convert_blockquote_to_markdown(self, blockquote_element):
        """
        将HTML引用块转换为Markdown格式的引用块
        """
        quote_text = blockquote_element.get_text(strip=True)
        # 每行前面添加 '> '
        return '> ' + quote_text.replace('\n', '\n> ')

    def image_to_base64(self, img, format='PNG'):
        """将PIL图像编码为Base64字符串"""
        buffered = BytesIO()
        img.save(buffered, format=format)
        return base64.b64encode(buffered.getvalue()).decode('utf-8')

    def __call__(self, filename):
        if filename:
            with open(filename, 'r', encoding='utf-8') as file:
                md_content = file.read()

        # 使用markdown库解析Markdown内容
        if MARKDOWN_AVAILABLE:
            html = markdown.markdown(md_content, extensions=[TableExtension(), FencedCodeExtension()])
            # 使用BeautifulSoup解析HTML
            soup = BeautifulSoup(html, 'html.parser')
        else:
            # Fallback: 简单处理Markdown内容
            return self._simple_markdown_parse(md_content)

        structured_data = []
        current_heading_stack = []
        blocks = []

        for element in soup.find_all(
                ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'table', 'img', 'pre', 'ul', 'ol', 'blockquote']):
            if element.name.startswith('h'):
                # 处理标题
                level = int(element.name[1])
                current_heading_stack = current_heading_stack[:level - 1]
                current_heading_stack.append(element.get_text(strip=True))
            elif element.name == 'p':
                # 处理段落
                content_text = element.get_text(strip=True)
                block = DocumentBlock()
                block.page_number = set()
                block.headings = current_heading_stack.copy()
                block.type = ContentType.TEXT
                block.content = content_text
                blocks.append(block)
            elif element.name == 'table':
                # 处理表格
                # table_md = self._convert_table_to_markdown(element)
                block = DocumentBlock()
                block.page_number = set()
                block.headings = current_heading_stack.copy()
                block.type = ContentType.TABLE
                block.content = element
                blocks.append(block)

            elif element.name == 'img':
                # 处理图像
                img_url = element.get('src')
                img = self.get_picture(img_url)
                if img:
                    block = DocumentBlock()
                    block.page_number = set()
                    block.headings = current_heading_stack.copy()
                    block.type = ContentType.IMAGE
                    block.content = self.image_to_base64(img)
                    blocks.append(block)
            elif element.name == 'pre':
                # 处理代码块
                code_element = element.find('code')
                if code_element:
                    code_text = code_element.get_text(strip=True)
                    block = DocumentBlock()
                    block.page_number = set()
                    block.headings = current_heading_stack.copy()
                    block.type = ContentType.TEXT
                    block.content = code_text
                    blocks.append(block)
            elif element.name in ['ul', 'ol']:
                # 处理列表（无序列表和有序列表），保留Markdown格式
                list_md = self._convert_list_to_markdown(element)
                block = DocumentBlock()
                block.page_number = set()
                block.headings = current_heading_stack.copy()
                block.type = ContentType.TEXT
                block.content = list_md
                blocks.append(block)

            elif element.name == 'blockquote':
                # 处理引用块，保留Markdown格式
                blockquote_md = self._convert_blockquote_to_markdown(element)
                block = DocumentBlock()
                block.page_number = set()
                block.headings = current_heading_stack.copy()
                block.type = ContentType.TEXT
                block.content = blockquote_md
                blocks.append(block)
        return blocks

    def _simple_markdown_parse(self, md_content):
        """简单的Markdown解析fallback方法"""
        # 将Markdown内容按行分割，简单处理
        lines = md_content.split('\n')
        blocks = []
        current_headings = []
        current_text = []
        
        for line in lines:
            if line.startswith('#'):
                # 处理标题
                if current_text:
                    # 保存之前的文本块
                    block = DocumentBlock()
                    block.page_number = set()
                    block.headings = current_headings.copy()
                    block.type = ContentType.TEXT
                    block.content = '\n'.join(current_text).strip()
                    if block.content:
                        blocks.append(block)
                    current_text = []
                
                # 更新标题层级
                level = len(line) - len(line.lstrip('#'))
                title = line.lstrip('# ').strip()
                current_headings = current_headings[:level-1] + [title]
            else:
                # 普通文本行
                current_text.append(line)
        
        # 处理最后的文本块
        if current_text:
            block = DocumentBlock()
            block.page_number = set()
            block.headings = current_headings.copy()
            block.type = ContentType.TEXT
            block.content = '\n'.join(current_text).strip()
            if block.content:
                blocks.append(block)
        
        return blocks


def naive_merge_docx(sections: List[DocumentBlock], chunk_token_num=128, max_token_num=248, delimiter=None, chunk_overlap=0):
    """
        合并文档片段，确保每个片段的 token 数不超过 max_token_num，并根据分隔符分割文本。

        Args:
            sections (list): 文档片段列表，每个片段包含标题、文本、图像、页码等信息。
            chunk_token_num (int): 每个 chunk 的最小 token 数。
            max_token_num (int): 每个 chunk 的最大 token 数。
            delimiter (str): 文本分割符，用于分割长文本。
            chunk_overlap (int): 相邻chunk之间的重叠token数。

        Returns:
            list: 合并后的文档片段列表。
            list: 每个片段的 token 数列表。
    """
    if delimiter is None:
        delimiter = analyze_document_language(sections)

    if not sections:
        return [], []

    cks: List[DocumentBlock] = []
    tk_nums = []

    def add_chunk(sec: DocumentBlock):
        """
            将文档片段添加到 chunks 中，并根据 token 数和分隔符进行合并或分割。

            Args:
                section (dict): 文档片段，包含标题、文本、图像、页码等信息。
                position_marker (str): 用于标记文本位置的字符串。
        """
        nonlocal cks, tk_nums

        title_index = "-> ".join(sec.headings)
        t = sec.content
        page = sec.page_number
        type = sec.type
        if type == ContentType.TABLE or type == ContentType.IMAGE:
            tnum = num_tokens_from_string(t)
            tk_nums.append(tnum)
            cks.append(sec)
            return
        tnum = num_tokens_from_string(t)

        # 如果当前文本的 token 数超过 max_token_num，则根据 delimiter 分割
        if tnum > max_token_num:
            chunks = split_text_by_delimiter(t, max_token_num, delimiter)
            for chunk in chunks:
                chunk_token_count = num_tokens_from_string(chunk)
                if len(cks) > 0 and cks[-1].type == ContentType.TEXT and title_index == "-> ".join(
                        cks[-1].headings) and not any(
                    cks[-1].content.endswith(d) for d in delimiter):
                    # 从下一段文本中找到 delimiter 之前的文本
                    delimiter_pos = -1
                    next_token_count = num_tokens_from_string(chunk)

                    for d in delimiter:
                        pos_index = chunk.find(d)
                        if pos_index != -1 and (delimiter_pos == -1 or pos_index < delimiter_pos):
                            delimiter_pos = pos_index
                    if delimiter_pos != -1:
                        # 累加 delimiter 之前的文本
                        cks[-1].content += chunk[:delimiter_pos + 1]
                        tk_nums[-1] += num_tokens_from_string(chunk[:delimiter_pos + 1])
                        # 修改下一段文本的 text 值
                        chunk = chunk[delimiter_pos + 1:]
                    else:
                        # 如果没有 delimiter，则累加整个文本，并置空下一段文本的 text 值
                        cks[-1].content += chunk
                        tk_nums[-1] += next_token_count
                        continue
                if len(cks) <= 0 or tk_nums[-1] > chunk_token_num or title_index != "-> ".join(cks[-1].headings) or cks[
                    -1].type != ContentType.TEXT:
                    new_chunk = copy.deepcopy(sec)
                    new_chunk.content = chunk
                    cks.append(new_chunk)
                    tk_nums.append(chunk_token_count)
                else:
                    cks[-1].content = cks[-1].content + "\n" + chunk
                    tk_nums[-1] += chunk_token_count
                    if page is not None:
                        for p in page:
                            cks[-1].page_number.add(p)
        else:
            if len(cks) > 0 and cks[-1].type == ContentType.TEXT and title_index == "-> ".join(cks[-1].headings) and \
                    tk_nums[
                        -1] > chunk_token_num and tk_nums[-1] < max_token_num and not any(
                cks[-1].content.endswith(d) for d in delimiter):
                # 从下一段文本中找到 delimiter 之前的文本
                next_text = t
                delimiter_pos = -1
                next_token_count = num_tokens_from_string(next_text)

                for d in delimiter:
                    pos_index = next_text.find(d)
                    if pos_index != -1 and (delimiter_pos == -1 or pos_index < delimiter_pos):
                        delimiter_pos = pos_index
                if delimiter_pos != -1:
                    # 累加 delimiter 之前的文本
                    cks[-1].content += next_text[:delimiter_pos + 1]
                    tk_nums[-1] += num_tokens_from_string(next_text[:delimiter_pos + 1])
                    # 修改下一段文本的 text 值
                    sec.content = next_text[delimiter_pos + 1:]
                else:
                    # 如果没有 delimiter，则累加整个文本，并置空下一段文本的 text 值
                    cks[-1].content += next_text
                    tk_nums[-1] += next_token_count
                    sec.content = ""
                    return

            if len(cks) <= 0 or tk_nums[-1] > chunk_token_num or title_index != "-> ".join(cks[-1].headings) or cks[
                -1].type != ContentType.TEXT:
                cks.append(sec)
                tk_nums.append(tnum)
            else:
                cks[-1].content = cks[-1].content + "\n" + t
                tk_nums[-1] += tnum
                if page is not None:
                    for p in page:
                        cks[-1].page_number.add(p)

    for sec in sections:
        add_chunk(sec)

    return cks

def advanced_chunk(filepath, **kwargs) -> List[DocumentBlock]:
    """
    高级文档切分功能，支持多种文档格式和智能切分策略
    
    Args:
        filepath: 文件路径
        **kwargs: 切分参数
            - parser_config: 解析配置
            - chunk_strategy: 切分策略 ('naive', 'semantic', 'fixed')
            - tokenizer: 分词器类型 ('simple', 'advanced')
    
    Returns:
        文档块列表
    """
    filename = os.path.basename(filepath)
    parser_config = kwargs.get("parser_config", {
        "chunk_token_num": 400, 
        "max_token_num": 512, 
        "delimiter": "!?。！？"
    })
    
    chunk_strategy = kwargs.get("chunk_strategy", "naive")
    tokenizer_type = kwargs.get("tokenizer", "simple")
    
    min_token_num = parser_config.get("chunk_token_num")
    max_token_num = parser_config.get("max_token_num")
    delimiter = parser_config.get("delimiter", "!?。！？")
    chunk_overlap = parser_config.get("chunk_overlap", 0)
    
    # 选择合适的解析器
    if re.search(r"\.(md|markdown)$", filepath, re.IGNORECASE):
        parser = MarkdownParser()
        sections = parser.parse(filepath)
    elif re.search(r"\.(txt|text|log)$", filepath, re.IGNORECASE):
        parser = TextParser()
        sections = parser.parse(filepath)
    elif re.search(r"\.(pdf)$", filepath, re.IGNORECASE):
        parser = PDFParser()
        sections = parser.parse(filepath)
    elif re.search(r"\.(doc|docx)$", filepath, re.IGNORECASE):
        parser = DocxParser()
        sections = parser.parse(filepath)
    elif re.search(r"\.(xlsx|xls|csv)$", filepath, re.IGNORECASE):
        parser = ExcelParser()
        sections = parser.parse(filepath)
    else:
        # 回退到原有的解析逻辑
        return chunk(filepath, **kwargs)
    
    # 应用切分策略
    if chunk_strategy == "semantic":
        chunks = semantic_merge(sections, min_token_num, max_token_num, delimiter, chunk_overlap)
    elif chunk_strategy == "fixed":
        chunks = fixed_size_merge(sections, max_token_num, chunk_overlap)
    else:
        chunks = naive_merge_docx(sections, min_token_num, max_token_num, delimiter, chunk_overlap)
    
    # 应用重叠逻辑（如果设置了chunk_overlap）
    if chunk_overlap > 0:
        chunks = apply_chunk_overlap(chunks, chunk_overlap)
    
    # 应用分词处理
    if tokenizer_type == "advanced":
        chunks = tokenize_chunks(chunks)
    
    return chunks

def apply_chunk_overlap(chunks: List[DocumentBlock], chunk_overlap: int) -> List[DocumentBlock]:
    """
    在现有的文档块之间应用重叠逻辑
    
    Args:
        chunks: 原始文档块列表
        chunk_overlap: 重叠的token数量
    
    Returns:
        应用重叠后的文档块列表
    """
    if not chunks or chunk_overlap <= 0:
        return chunks
    
    overlapped_chunks = []
    
    for i, chunk in enumerate(chunks):
        if i == 0:
            # 第一个chunk直接添加
            overlapped_chunks.append(chunk)
        else:
            # 从前一个chunk的末尾提取重叠内容
            prev_chunk = chunks[i-1]
            prev_content = prev_chunk.content
            
            # 简单的重叠实现：取前一个chunk末尾的部分文本
            prev_tokens = prev_content.split()
            if len(prev_tokens) > chunk_overlap:
                overlap_text = " ".join(prev_tokens[-chunk_overlap:])
                # 将重叠内容添加到当前chunk的开头
                new_content = overlap_text + " " + chunk.content
            else:
                # 如果前一个chunk太短，使用全部内容作为重叠
                new_content = prev_content + " " + chunk.content
            
            # 创建新的文档块，保持其他属性不变
            new_chunk = DocumentBlock()
            new_chunk.content = new_content
            new_chunk.type = chunk.type
            new_chunk.headings = chunk.headings
            new_chunk.page_number = chunk.page_number
            overlapped_chunks.append(new_chunk)
    
    return overlapped_chunks

def semantic_merge(sections: List[DocumentBlock], min_token_num=128, max_token_num=512, delimiter="!?。！？", chunk_overlap=0) -> List[DocumentBlock]:
    """
    语义感知的文档块合并算法
    
    Args:
        sections: 文档片段列表
        min_token_num: 最小token数
        max_token_num: 最大token数
        delimiter: 分隔符
    
    Returns:
        合并后的文档块列表
    """
    if not sections:
        return []
    
    chunks = []
    current_chunk = None
    
    for section in sections:
        section_tokens = num_tokens_from_string(section.content)
        
        # 如果当前片段太大，需要分割
        if section_tokens > max_token_num:
            # 先保存当前块
            if current_chunk and num_tokens_from_string(current_chunk.content) >= min_token_num:
                chunks.append(current_chunk)
                current_chunk = None
            
            # 分割大片段
            split_chunks = split_large_section(section, max_token_num, delimiter)
            chunks.extend(split_chunks)
            continue
        
        # 检查是否可以与当前块合并
        if current_chunk is None:
            current_chunk = copy.deepcopy(section)
        else:
            current_tokens = num_tokens_from_string(current_chunk.content)
            
            # 语义相似性检查（简化版）
            can_merge = (
                current_tokens + section_tokens <= max_token_num and
                are_semantically_related(current_chunk, section)
            )
            
            if can_merge:
                # 合并块
                current_chunk.content += "\n" + section.content
                if hasattr(section, 'page_number') and section.page_number:
                    if isinstance(current_chunk.page_number, set):
                        current_chunk.page_number.update(section.page_number)
                    else:
                        current_chunk.page_number = set(list(current_chunk.page_number) + list(section.page_number))
            else:
                # 保存当前块，开始新块
                if current_tokens >= min_token_num:
                    chunks.append(current_chunk)
                current_chunk = copy.deepcopy(section)
    
    # 处理最后一个块
    if current_chunk:
        if num_tokens_from_string(current_chunk.content) >= min_token_num:
            chunks.append(current_chunk)
        elif chunks:
            # 如果最后一个块太小，与前一个块合并
            last_chunk = chunks[-1]
            last_tokens = num_tokens_from_string(last_chunk.content)
            current_tokens = num_tokens_from_string(current_chunk.content)
            
            if last_tokens + current_tokens <= max_token_num:
                last_chunk.content += "\n" + current_chunk.content
                if hasattr(current_chunk, 'page_number') and current_chunk.page_number:
                    if isinstance(last_chunk.page_number, set):
                        last_chunk.page_number.update(current_chunk.page_number)
            else:
                chunks.append(current_chunk)
        else:
            chunks.append(current_chunk)
    
    return chunks

def fixed_size_merge(sections: List[DocumentBlock], max_token_num=512, chunk_overlap=0) -> List[DocumentBlock]:
    """
    固定大小的文档块合并算法
    
    Args:
        sections: 文档片段列表
        max_token_num: 最大token数
    
    Returns:
        合并后的文档块列表
    """
    if not sections:
        return []
    
    chunks = []
    current_chunk = None
    current_tokens = 0
    
    for section in sections:
        section_tokens = num_tokens_from_string(section.content)
        
        if current_chunk is None:
            current_chunk = copy.deepcopy(section)
            current_tokens = section_tokens
        elif current_tokens + section_tokens <= max_token_num:
            # 可以合并
            current_chunk.content += "\n" + section.content
            current_tokens += section_tokens
            
            # 合并页码
            if hasattr(section, 'page_number') and section.page_number:
                if isinstance(current_chunk.page_number, set):
                    current_chunk.page_number.update(section.page_number)
        else:
            # 保存当前块，开始新块
            chunks.append(current_chunk)
            current_chunk = copy.deepcopy(section)
            current_tokens = section_tokens
    
    # 添加最后一个块
    if current_chunk:
        chunks.append(current_chunk)
    
    return chunks

def split_large_section(section: DocumentBlock, max_token_num: int, delimiter: str) -> List[DocumentBlock]:
    """
    分割过大的文档片段
    
    Args:
        section: 文档片段
        max_token_num: 最大token数
        delimiter: 分隔符
    
    Returns:
        分割后的文档块列表
    """
    content = section.content
    split_texts = split_text_by_delimiter(content, max_token_num, delimiter)
    
    chunks = []
    for i, text in enumerate(split_texts):
        chunk = copy.deepcopy(section)
        chunk.content = text
        chunks.append(chunk)
    
    return chunks

def are_semantically_related(chunk1: DocumentBlock, chunk2: DocumentBlock) -> bool:
    """
    简单的语义相关性检查
    
    Args:
        chunk1: 文档块1
        chunk2: 文档块2
    
    Returns:
        是否语义相关
    """
    # 检查标题层级是否相同
    if hasattr(chunk1, 'headings') and hasattr(chunk2, 'headings'):
        if chunk1.headings == chunk2.headings:
            return True
    
    # 检查内容类型是否相同
    if hasattr(chunk1, 'type') and hasattr(chunk2, 'type'):
        if chunk1.type == chunk2.type:
            return True
    
    # 简单的关键词重叠检查
    words1 = set(chunk1.content.lower().split())
    words2 = set(chunk2.content.lower().split())
    
    if not words1 or not words2:
        return False
    
    overlap = len(words1.intersection(words2))
    total = len(words1.union(words2))
    
    # 如果重叠度超过30%，认为相关
    return overlap / total > 0.3

def chunk(filepath, **kwargs) -> List[DocumentBlock]:
    """
        支持的文件格式为docx、pdf、excel、txt。
        此方法将原始方法应用于块文件。
        连续的文本将使用“分隔符”分割成几个部分。
        接下来，这些连续的片段被合并成令牌数不超过“最大令牌数”的块。
    """
    filename = os.path.basename(filepath)
    parser_config = kwargs.get("parser_config", {"chunk_token_num": 400, "max_token_num": 512, "delimiter": "!?。！？"})
    min_token_num = parser_config.get("chunk_token_num" )
    max_token_num = parser_config.get("max_token_num")

    if re.search(r"\.(md|markdown)$", filepath, re.IGNORECASE):
        # 使用新的MarkdownParser
        try:
            parser = MarkdownParser()
            sections = parser.parse(filepath)
            chunks = naive_merge_docx(sections, min_token_num, max_token_num)
        except Exception as e:
            # 回退到原始实现
            sections = MarkdownParser()(filepath)
            chunks = naive_merge_docx(sections, min_token_num, max_token_num)
    elif re.search(r"\.(txt|text|log)$", filepath, re.IGNORECASE):
        # 支持文本文件
        from rag.parsers.text_parser import TextParser
        parser = TextParser()
        sections = parser.parse(filepath)
        chunks = naive_merge_docx(sections, min_token_num, max_token_num)
    else:
        raise NotImplementedError("file type not supported yet(md,txt)")

    return chunks


def process_folder(input_path=None):
    """支持处理单个文件或整个文件夹"""
    # 检查输入路径是否存在
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"输入路径不存在: {input_path}")

    # 确定输入类型（文件或文件夹）
    if os.path.isfile(input_path):
        # 处理单个文件
        input_dir = os.path.dirname(input_path)
        files_to_process = [os.path.basename(input_path)]
    else:
        # 处理整个文件夹
        input_dir = input_path
        files_to_process = os.listdir(input_dir)

    # 创建输出文件夹（输入目录下的json子目录）
    output_folder = os.path.join(input_dir, "json")
    os.makedirs(output_folder, exist_ok=True)

    # 空回调函数
    def dummy(prog=None, msg=""):
        pass

    # 遍历处理文件
    for filename in files_to_process:
        # 跳过非文件类型（如子文件夹）
        file_path = os.path.join(input_dir, filename)
        if not os.path.isfile(file_path):
            continue

        # 仅处理指定类型文件
        if filename.lower().endswith(
                ('.docx','.doc', '.pdf', ".md", ".txt", ".xlsx",".xls", ".doc", ".json", ".html", ".ppt", ".pptx")):
            # 执行文件解析
            res = chunk(file_path)

            # # 移除图像数据
            # for item in res:
            #     item.pop('image', None)

            # 生成输出路径
            output_filename = os.path.splitext(filename)[0] + "_" + os.path.splitext(filename)[1] + '.json'
            output_path = os.path.join(output_folder, output_filename)
            res_dict = [doc.to_dict() for doc in res]

            # 保存JSON文件
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(res_dict, f, ensure_ascii=False, indent=4)

            print(f"处理完成: {file_path} -> {output_path}")


if __name__ == "__main__":
    # 配置路径
    start_time = time.time()
    input_folder = r"D:\work\cgkj\mat-qa-project\mat-backend\papers\papers\doi_10.1002_9780470456200\raw\doi_10.1002_9780470456200.md"
    # input_folder =r"rpc/model_parse/data/naive/中华人民共和国政府采购法.docx"
    process_folder(input_folder)

    end_time = time.time()
    execution_time = end_time - start_time

    # 打印文件路径和执行时间
    print(f"执行时间: {execution_time:.2f} 秒")
    # 执行处理
    print("批量处理完成！")
