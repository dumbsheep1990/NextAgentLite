"""
数据清理工具模块
用于处理Excel文件解析时遇到的无效数据，如NaN值、空值等
"""

import json
import math
import pandas as pd
from typing import Any, Dict, List, Union
import logging

logger = logging.getLogger(__name__)

def clean_nan_values(data: Any) -> Any:
    """
    递归清理数据中的NaN值，将其转换为None或合适的默认值
    
    Args:
        data: 需要清理的数据
        
    Returns:
        清理后的数据
    """
    if isinstance(data, dict):
        return {k: clean_nan_values(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_nan_values(item) for item in data]
    elif isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return None
        return data
    elif pd.isna(data):
        return None
    else:
        return data

def clean_qa_pair_data(qa_pair: Dict[str, Any]) -> Dict[str, Any]:
    """
    清理单个QA问答对数据
    
    Args:
        qa_pair: 原始QA问答对数据
        
    Returns:
        清理后的QA问答对数据
    """
    cleaned_pair = {}
    
    for key, value in qa_pair.items():
        if key in ['question', 'answer', 'category']:
            # 文本字段：确保不为空且为字符串
            if pd.isna(value) or value is None:
                cleaned_pair[key] = '未知' if key == 'category' else '数据缺失'
            else:
                cleaned_pair[key] = str(value).strip()
        elif key in ['row_number']:
            # 数值字段：确保为有效数字
            if pd.isna(value) or math.isnan(value) if isinstance(value, float) else False:
                cleaned_pair[key] = 0
            else:
                try:
                    cleaned_pair[key] = int(value)
                except (ValueError, TypeError):
                    cleaned_pair[key] = 0
        elif key in ['quality_score']:
            # 分数字段：处理NaN并设置默认值
            if pd.isna(value) or (isinstance(value, float) and (math.isnan(value) or math.isinf(value))):
                cleaned_pair[key] = 0.0
            else:
                try:
                    score = float(value)
                    # 确保分数在合理范围内
                    cleaned_pair[key] = max(0.0, min(100.0, score))
                except (ValueError, TypeError):
                    cleaned_pair[key] = 0.0
        elif key == 'qa_metadata':
            # JSON字段：特别处理
            if value is None or pd.isna(value):
                cleaned_pair[key] = {}
            else:
                try:
                    if isinstance(value, str):
                        # 如果是字符串，尝试解析为JSON
                        metadata = json.loads(value)
                    else:
                        metadata = value
                    
                    # 递归清理metadata中的NaN值
                    cleaned_pair[key] = clean_nan_values(metadata)
                except (json.JSONDecodeError, TypeError):
                    logger.warning(f"无法解析metadata JSON: {value}")
                    cleaned_pair[key] = {"original_data": str(value) if value is not None else ""}
        else:
            # 其他字段：通用清理
            cleaned_pair[key] = clean_nan_values(value)
    
    return cleaned_pair

def validate_qa_pair(qa_pair: Dict[str, Any]) -> tuple[bool, str]:
    """
    验证QA问答对的数据完整性
    
    Args:
        qa_pair: QA问答对数据
        
    Returns:
        (是否有效, 错误信息)
    """
    # 检查必需字段
    required_fields = ['question', 'answer']
    for field in required_fields:
        if not qa_pair.get(field) or qa_pair[field] == '数据缺失':
            return False, f"缺少必需字段: {field}"
    
    # 检查文本长度
    if len(qa_pair['question'].strip()) < 5:
        return False, "问题文本过短"
    
    if len(qa_pair['answer'].strip()) < 5:
        return False, "答案文本过短"
    
    return True, ""

def clean_and_validate_qa_dataset(qa_pairs: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], List[str]]:
    """
    清理和验证整个QA数据集
    
    Args:
        qa_pairs: 原始QA问答对列表
        
    Returns:
        (清理后的有效QA对列表, 错误信息列表)
    """
    cleaned_pairs = []
    errors = []
    
    for i, pair in enumerate(qa_pairs):
        try:
            # 清理数据
            cleaned_pair = clean_qa_pair_data(pair)
            
            # 验证数据
            is_valid, error_msg = validate_qa_pair(cleaned_pair)
            
            if is_valid:
                cleaned_pairs.append(cleaned_pair)
            else:
                errors.append(f"第{i+1}行: {error_msg}")
                
        except Exception as e:
            logger.error(f"处理第{i+1}行数据时发生错误: {str(e)}")
            errors.append(f"第{i+1}行: 数据处理错误 - {str(e)}")
    
    return cleaned_pairs, errors

def safe_json_serialize(data: Any) -> str:
    """
    安全的JSON序列化，处理NaN等特殊值
    
    Args:
        data: 要序列化的数据
        
    Returns:
        JSON字符串
    """
    cleaned_data = clean_nan_values(data)
    return json.dumps(cleaned_data, ensure_ascii=False, default=str) 