"""
高级NLP处理模块
支持中英文分词、文本预处理、语言检测等功能
"""

import json
import logging
import random
import uuid
from collections import Counter
from typing import List, Dict, Any, Tuple
import unicodedata
import re
import copy
import chardet
import string

# 常见编码格式列表
all_codecs = [
    'utf-8', 'gb2312', 'gbk', 'utf_16', 'ascii', 'big5', 'big5hkscs',
    'cp037', 'cp273', 'cp424', 'cp437', 'cp500', 'cp720', 'cp737', 'cp775', 
    'cp850', 'cp852', 'cp855', 'cp856', 'cp857', 'cp858', 'cp860', 'cp861', 
    'cp862', 'cp863', 'cp864', 'cp865', 'cp866', 'cp869', 'cp874', 'cp875', 
    'cp932', 'cp949', 'cp950', 'cp1006', 'cp1026', 'cp1125', 'cp1140', 
    'cp1250', 'cp1251', 'cp1252', 'cp1253', 'cp1254', 'cp1255', 'cp1256',
    'cp1257', 'cp1258', 'euc_jp', 'euc_jis_2004', 'euc_jisx0213', 'euc_kr',
    'gb2312', 'gb18030', 'hz', 'iso2022_jp', 'iso2022_jp_1', 'iso2022_jp_2',
    'iso2022_jp_2004', 'iso2022_jp_3', 'iso2022_jp_ext', 'iso2022_kr', 'latin_1',
    'iso8859_2', 'iso8859_3', 'iso8859_4', 'iso8859_5', 'iso8859_6', 'iso8859_7',
    'iso8859_8', 'iso8859_9', 'iso8859_10', 'iso8859_11', 'iso8859_13',
    'iso8859_14', 'iso8859_15', 'iso8859_16', 'johab', 'koi8_r', 'koi8_t', 'koi8_u',
    'kz1048', 'mac_cyrillic', 'mac_greek', 'mac_iceland', 'mac_latin2', 'mac_roman',
    'mac_turkish', 'ptcp154', 'shift_jis', 'shift_jis_2004', 'shift_jisx0213',
    'utf_32', 'utf_32_be', 'utf_32_le', 'utf_16_be', 'utf_16_le', 'utf_7', 
    'windows-1250', 'windows-1251', 'windows-1252', 'windows-1253', 'windows-1254', 
    'windows-1255', 'windows-1256', 'windows-1257', 'windows-1258', 'latin-2'
]

def find_codec(blob):
    """自动检测文本编码"""
    detected = chardet.detect(blob[:1024])
    if detected['confidence'] > 0.5:
        return detected['encoding']
    
    for c in all_codecs:
        try:
            blob[:1024].decode(c)
            return c
        except Exception:
            pass
        try:
            blob.decode(c)
            return c
        except Exception:
            pass
    
    return "utf-8"

def is_chinese(s):
    """判断字符是否为中文"""
    if s >= u'\u4e00' and s <= u'\u9fa5':
        return True
    else:
        return False

def is_number(s):
    """判断字符是否为数字"""
    if s >= u'\u0030' and s <= u'\u0039':
        return True
    else:
        return False

def is_alphabet(s):
    """判断字符是否为英文字母"""
    if (s >= u'\u0041' and s <= u'\u005a') or (s >= u'\u0061' and s <= u'\u007a'):
        return True
    else:
        return False

def naive_merge(chunks: List[Dict[str, Any]], min_chunk_size: int = 128, max_chunk_size: int = 512) -> List[Dict[str, Any]]:
    """
    简单的块合并算法，将小块合并为适当大小的块
    
    Args:
        chunks: 输入的文档块列表
        min_chunk_size: 最小块大小
        max_chunk_size: 最大块大小
    
    Returns:
        合并后的块列表
    """
    if not chunks:
        return []
    
    merged_chunks = []
    current_chunk = chunks[0].copy()
    
    for i in range(1, len(chunks)):
        chunk = chunks[i]
        current_size = len(current_chunk.get('content', ''))
        chunk_size = len(chunk.get('content', ''))
        
        # 如果当前块加上新块不超过最大大小，则合并
        if current_size + chunk_size <= max_chunk_size:
            current_chunk['content'] += '\n' + chunk.get('content', '')
            # 合并页码信息
            if 'page_number' in chunk:
                current_pages = current_chunk.get('page_number', set())
                if isinstance(current_pages, (list, tuple)):
                    current_pages = set(current_pages)
                if isinstance(chunk['page_number'], (list, tuple)):
                    chunk_pages = set(chunk['page_number'])
                else:
                    chunk_pages = chunk['page_number']
                current_chunk['page_number'] = current_pages.union(chunk_pages)
        else:
            # 如果当前块达到最小大小，保存它
            if current_size >= min_chunk_size:
                merged_chunks.append(current_chunk)
            current_chunk = chunk.copy()
    
    # 添加最后一个块
    if len(current_chunk.get('content', '')) >= min_chunk_size:
        merged_chunks.append(current_chunk)
    elif merged_chunks:
        # 如果最后一个块太小，与前一个块合并
        merged_chunks[-1]['content'] += '\n' + current_chunk.get('content', '')
    else:
        merged_chunks.append(current_chunk)
    
    return merged_chunks

def tokenize_chunks(chunks: List[Dict[str, Any]], tokenizer=None) -> List[Dict[str, Any]]:
    """
    对文档块进行分词处理
    
    Args:
        chunks: 文档块列表
        tokenizer: 分词器，如果为None则使用简单分词
    
    Returns:
        处理后的文档块列表
    """
    processed_chunks = []
    
    for chunk in chunks:
        processed_chunk = chunk.copy()
        content = chunk.get('content', '')
        
        if tokenizer:
            # 使用高级分词器
            processed_content = tokenizer.tokenize(content)
        else:
            # 使用简单分词
            processed_content = simple_tokenize(content)
        
        processed_chunk['tokenized_content'] = processed_content
        processed_chunks.append(processed_chunk)
    
    return processed_chunks

def simple_tokenize(text: str) -> str:
    """
    简单的文本分词处理
    
    Args:
        text: 输入文本
    
    Returns:
        分词后的文本
    """
    # 基本的中英文分词处理
    text = re.sub(r'\s+', ' ', text)  # 合并多个空格
    text = re.sub(r'([。！？；])', r'\1 ', text)  # 在中文标点后添加空格
    text = re.sub(r'([.!?;])', r'\1 ', text)  # 在英文标点后添加空格
    return text.strip()

def concat_img(images, direction='horizontal'):
    """
    拼接图像
    
    Args:
        images: 图像列表
        direction: 拼接方向，'horizontal' 或 'vertical'
    
    Returns:
        拼接后的图像
    """
    try:
        from PIL import Image
        
        if not images:
            return None
        
        if len(images) == 1:
            return images[0]
        
        if direction == 'horizontal':
            # 水平拼接
            widths = [img.width for img in images]
            heights = [img.height for img in images]
            total_width = sum(widths)
            max_height = max(heights)
            
            new_img = Image.new('RGB', (total_width, max_height), 'white')
            x_offset = 0
            for img in images:
                new_img.paste(img, (x_offset, 0))
                x_offset += img.width
        else:
            # 垂直拼接
            widths = [img.width for img in images]
            heights = [img.height for img in images]
            max_width = max(widths)
            total_height = sum(heights)
            
            new_img = Image.new('RGB', (max_width, total_height), 'white')
            y_offset = 0
            for img in images:
                new_img.paste(img, (0, y_offset))
                y_offset += img.height
        
        return new_img
    except ImportError:
        logging.warning("PIL not available, cannot concat images")
        return None

def tokenize_table(table_content: str) -> str:
    """
    表格内容分词处理
    
    Args:
        table_content: 表格内容
    
    Returns:
        处理后的表格内容
    """
    # 基本的表格内容处理
    # 移除多余的空白字符
    processed = re.sub(r'\s+', ' ', table_content)
    # 在表格分隔符后添加换行
    processed = re.sub(r'\|', '|\n', processed)
    return processed.strip()

def formatting_res(filename: str, chunks: List[Any]) -> List[Dict[str, Any]]:
    """
    格式化处理结果
    
    Args:
        filename: 文件名
        chunks: 文档块列表
    
    Returns:
        格式化后的结果
    """
    result = []
    
    for i, chunk in enumerate(chunks):
        formatted_chunk = {
            'id': f"{filename}_{i}",
            'filename': filename,
            'chunk_index': i,
            'content': getattr(chunk, 'content', str(chunk)) if hasattr(chunk, 'content') else str(chunk),
            'type': getattr(chunk, 'type', 'text') if hasattr(chunk, 'type') else 'text',
            'page_number': getattr(chunk, 'page_number', set()) if hasattr(chunk, 'page_number') else set(),
            'headings': getattr(chunk, 'headings', []) if hasattr(chunk, 'headings') else [],
            'extra': getattr(chunk, 'extra', {}) if hasattr(chunk, 'extra') else {}
        }
        result.append(formatted_chunk)
    
    return result

# 导出主要函数
__all__ = [
    'find_codec',
    'is_chinese',
    'is_number', 
    'is_alphabet',
    'naive_merge',
    'tokenize_chunks',
    'concat_img',
    'tokenize_table',
    'formatting_res',
    'simple_tokenize'
]