"""
认证相关工具函数
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import Optional
import jwt

# HTTP Bearer 认证
security = HTTPBearer(auto_error=False)

async def get_current_user_id(token: Optional[str] = Depends(security)) -> int:
    """
    获取当前用户ID
    暂时返回默认用户ID，后续可以集成真实的JWT认证
    """
    # 暂时返回固定的用户ID，在实际部署时应该实现真实的JWT认证
    # TODO: 实现真实的JWT token验证
    return 1  # 默认用户ID

async def get_current_user_id_optional(token: Optional[str] = Depends(security)) -> Optional[int]:
    """
    获取当前用户ID（可选）
    如果没有认证信息则返回None
    """
    try:
        return await get_current_user_id(token)
    except HTTPException:
        return None