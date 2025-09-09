"""
时区转换工具模块
"""
import pytz
from datetime import datetime
from typing import Optional

# 中国时区
CHINA_TZ = pytz.timezone('Asia/Shanghai')
UTC_TZ = pytz.UTC

def utc_to_china_time(utc_datetime: datetime) -> datetime:
    """
    将UTC时间转换为中国时间
    
    Args:
        utc_datetime: UTC时间（可以是aware或naive）
    
    Returns:
        中国时间的datetime对象
    """
    if utc_datetime is None:
        return None
    
    # 如果是naive datetime，假设它是UTC
    if utc_datetime.tzinfo is None:
        utc_datetime = UTC_TZ.localize(utc_datetime)
    
    # 转换为中国时间
    china_time = utc_datetime.astimezone(CHINA_TZ)
    return china_time

def format_china_time(utc_datetime: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    将UTC时间转换为中国时间并格式化
    
    Args:
        utc_datetime: UTC时间
        format_str: 格式化字符串
    
    Returns:
        格式化后的中国时间字符串
    """
    if utc_datetime is None:
        return ""
    
    china_time = utc_to_china_time(utc_datetime)
    return china_time.strftime(format_str)

def china_time_isoformat(utc_datetime: datetime) -> str:
    """
    将UTC时间转换为中国时间的ISO格式
    
    Args:
        utc_datetime: UTC时间
    
    Returns:
        中国时间的ISO格式字符串
    """
    if utc_datetime is None:
        return ""
    
    china_time = utc_to_china_time(utc_datetime)
    return china_time.isoformat()

def get_china_now() -> datetime:
    """
    获取当前中国时间
    
    Returns:
        当前中国时间的datetime对象
    """
    return datetime.now(CHINA_TZ)