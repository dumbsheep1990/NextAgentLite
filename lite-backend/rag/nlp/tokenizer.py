"""
高级分词器模块
支持中英文分词、词性标注、文本规范化等功能
"""

import logging
import copy
import math
import os
import re
import string
import sys
from typing import List, Dict, Any, Optional

try:
    from hanziconv import HanziConv
except ImportError:
    logging.warning("hanziconv not available, traditional Chinese conversion disabled")
    HanziConv = None

try:
    # 注意：直接导入 nltk 顶层可能触发 scipy 依赖且与当前 numpy 版本不兼容。
    # 这里使用宽泛的异常捕获，若任何底层二进制不兼容导致导入失败，则降级为纯内置分词。
    from nltk.tokenize import word_tokenize  # type: ignore
    from nltk.stem import PorterStemmer, WordNetLemmatizer  # type: ignore
except Exception as e:  # noqa: BLE001
    logging.warning(
        "NLTK disabled or incompatible (fallback to simple tokenization): %s", e
    )
    word_tokenize = None
    PorterStemmer = None
    WordNetLemmatizer = None

from rag.utils.chunk_utils import num_tokens_from_string


class SimpleTokenizer:
    """简化版分词器，不依赖外部词典"""
    
    def __init__(self, debug=False):
        self.DEBUG = debug
        
        # 初始化英文处理器（如果可用）
        if PorterStemmer and WordNetLemmatizer:
            self.stemmer = PorterStemmer()
            self.lemmatizer = WordNetLemmatizer()
        else:
            self.stemmer = None
            self.lemmatizer = None
        
        # 分割字符模式
        self.SPLIT_CHAR = r"([ ,\\.<>/?;:'\\[\\]\\\\`!@#$%^&*\\(\\)\\{\\}\\|_+=《》，。？、；''：""【】~！￥%……（）——-]+|[a-z\\.-]+|[0-9,\\.-]+)"
    
    def _strQ2B(self, ustring):
        """全角字符转半角字符"""
        rstring = ""
        for uchar in ustring:
            inside_code = ord(uchar)
            if inside_code == 0x3000:
                inside_code = 0x0020
            else:
                inside_code -= 0xfee0
            if inside_code < 0x0020 or inside_code > 0x7e:
                rstring += uchar
            else:
                rstring += chr(inside_code)
        return rstring
    
    def _tradi2simp(self, line):
        """繁体中文转简体中文"""
        if HanziConv:
            return HanziConv.toSimplified(line)
        return line
    
    def english_normalize(self, tokens: List[str]) -> List[str]:
        """英文词汇标准化"""
        if not self.stemmer or not self.lemmatizer:
            return tokens
        
        normalized = []
        for token in tokens:
            if re.match(r"[a-zA-Z_-]+$", token):
                # 对英文单词进行词干提取和词形还原
                normalized_token = self.stemmer.stem(self.lemmatizer.lemmatize(token))
                normalized.append(normalized_token)
            else:
                normalized.append(token)
        return normalized
    
    def tokenize(self, text: str) -> str:
        """
        文本分词
        
        Args:
            text: 输入文本
        
        Returns:
            分词后的文本
        """
        # 基本文本清理
        text = re.sub(r"\\W+", " ", text)
        text = self._strQ2B(text).lower()
        text = self._tradi2simp(text)
        
        # 检测中文字符数量
        zh_num = len([1 for c in text if self.is_chinese(c)])
        
        if zh_num == 0:
            # 纯英文文本处理
            if word_tokenize and self.stemmer and self.lemmatizer:
                tokens = word_tokenize(text)
                return " ".join([self.stemmer.stem(self.lemmatizer.lemmatize(t)) for t in tokens])
            else:
                # 简单的英文分词
                return " ".join(text.split())
        
        # 中英文混合文本处理
        arr = re.split(self.SPLIT_CHAR, text)
        result = []
        
        for segment in arr:
            if len(segment) < 2 or re.match(r"[a-z\\.-]+$", segment) or re.match(r"[0-9\\.-]+$", segment):
                result.append(segment)
                continue
            
            # 简单的中文分词（按字符分割）
            if zh_num > 0:
                # 对于中文文本，进行基本的字符级分词
                tokens = self.simple_chinese_tokenize(segment)
                result.extend(tokens)
            else:
                result.append(segment)
        
        # 英文标准化
        result = self.english_normalize(result)
        
        return " ".join([token for token in result if token.strip()])
    
    def simple_chinese_tokenize(self, text: str) -> List[str]:
        """
        简单的中文分词
        
        Args:
            text: 中文文本
        
        Returns:
            分词结果列表
        """
        tokens = []
        current_word = ""
        
        for char in text:
            if self.is_chinese(char):
                if current_word and not self.is_chinese(current_word[-1]):
                    tokens.append(current_word)
                    current_word = char
                else:
                    current_word += char
            elif self.is_alphabet(char) or self.is_number(char):
                if current_word and self.is_chinese(current_word[-1]):
                    tokens.append(current_word)
                    current_word = char
                else:
                    current_word += char
            else:
                if current_word:
                    tokens.append(current_word)
                    current_word = ""
                if char.strip():
                    tokens.append(char)
        
        if current_word:
            tokens.append(current_word)
        
        return [token for token in tokens if token.strip()]
    
    def is_chinese(self, char: str) -> bool:
        """判断字符是否为中文"""
        if not char:
            return False
        return '\u4e00' <= char <= '\u9fa5'
    
    def is_alphabet(self, char: str) -> bool:
        """判断字符是否为英文字母"""
        if not char:
            return False
        return ('A' <= char <= 'Z') or ('a' <= char <= 'z')
    
    def is_number(self, char: str) -> bool:
        """判断字符是否为数字"""
        if not char:
            return False
        return '0' <= char <= '9'
    
    def fine_grained_tokenize(self, text: str) -> str:
        """
        细粒度分词
        
        Args:
            text: 输入文本
        
        Returns:
            细粒度分词结果
        """
        tokens = text.split()
        zh_num = len([1 for token in tokens if token and self.is_chinese(token[0])])
        
        if zh_num < len(tokens) * 0.2:
            # 主要是英文文本
            result = []
            for token in tokens:
                result.extend(token.split("/"))
            return " ".join(result)
        
        # 主要是中文文本，进行更细粒度的分词
        result = []
        for token in tokens:
            if len(token) < 3 or re.match(r"[0-9,\\.-]+$", token):
                result.append(token)
                continue
            
            # 对长词进行进一步分割
            if len(token) > 6:
                # 简单的长词分割策略
                sub_tokens = self.split_long_token(token)
                result.extend(sub_tokens)
            else:
                result.append(token)
        
        return " ".join(self.english_normalize(result))
    
    def split_long_token(self, token: str) -> List[str]:
        """
        分割长词
        
        Args:
            token: 长词
        
        Returns:
            分割后的词列表
        """
        if len(token) <= 6:
            return [token]
        
        # 简单的长词分割策略
        result = []
        for i in range(0, len(token), 3):
            sub_token = token[i:i+3]
            if sub_token:
                result.append(sub_token)
        
        return result


# 创建全局分词器实例
tokenizer = SimpleTokenizer()

# 导出主要函数
tokenize = tokenizer.tokenize
fine_grained_tokenize = tokenizer.fine_grained_tokenize
tradi2simp = tokenizer._tradi2simp
strQ2B = tokenizer._strQ2B

def naive_tokenize(text: str) -> List[str]:
    """简单的分词函数"""
    tokens = []
    current_token = ""
    
    for char in text:
        if char.isspace():
            if current_token:
                tokens.append(current_token)
                current_token = ""
        elif char in string.punctuation:
            if current_token:
                tokens.append(current_token)
                current_token = ""
            tokens.append(char)
        else:
            current_token += char
    
    if current_token:
        tokens.append(current_token)
    
    return tokens

__all__ = [
    'SimpleTokenizer',
    'tokenizer',
    'tokenize', 
    'fine_grained_tokenize',
    'tradi2simp',
    'strQ2B',
    'naive_tokenize'
]
