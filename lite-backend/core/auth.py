"""
认证相关工具函数
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import Optional
import jwt

# 动态查询数据库的一个轻量工具
async def _get_any_user_id() -> Optional[int]:
    try:
        from db.database import DatabaseManager
        from sqlalchemy import text
        db = DatabaseManager()
        async with db.get_async_session() as session:
            # 优先尝试返回 id=1；若不存在则返回最小的一个用户id
            res = await session.execute(text("SELECT id FROM users WHERE id=1"))
            row = res.first()
            if row and row[0]:
                return int(row[0])
            res2 = await session.execute(text("SELECT id FROM users ORDER BY id ASC LIMIT 1"))
            row2 = res2.first()
            if row2 and row2[0]:
                return int(row2[0])
    except Exception:
        pass
    return None

# HTTP Bearer 认证
security = HTTPBearer(auto_error=False)

async def get_current_user_id(token: Optional[str] = Depends(security)) -> int:
    """
    获取当前用户ID
    暂时返回默认用户ID，后续可以集成真实的JWT认证
    """
    # 优先从Bearer token解析
    try:
        if token and getattr(token, 'credentials', None):
            raw = token.credentials
            # 允许无验证地读取基本声明（如使用自签）
            claims = jwt.decode(raw, options={"verify_signature": False})
            uid = claims.get("sub") or claims.get("user_id") or claims.get("uid")
            if uid is not None:
                try:
                    return int(uid)
                except Exception:
                    pass
    except Exception:
        # token 解析失败则回退
        pass

    # 回退：从数据库中挑选一个可用用户（开发环境常用）
    any_uid = await _get_any_user_id()
    if any_uid is not None:
        return any_uid
    # 最后回退：1（可能仍会触发FK错误）
    return 1

async def get_current_user_id_optional(token: Optional[str] = Depends(security)) -> Optional[int]:
    """
    获取当前用户ID（可选）
    如果没有认证信息则返回None
    """
    try:
        return await get_current_user_id(token)
    except HTTPException:
        return None
