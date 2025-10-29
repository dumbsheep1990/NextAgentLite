"""
用户管理端点
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import json
from pathlib import Path

from core.logger import logger

router = APIRouter()

class UserPreferences(BaseModel):
    """用户偏好模型"""
    theme: str = Field("light", description="主题设置", pattern="^(light|dark|auto)$")
    language: str = Field("zh", description="语言设置", pattern="^(zh|en)$")
    fontSize: str = Field("medium", description="字体大小", pattern="^(small|medium|large)$")
    autoSave: bool = Field(True, description="自动保存")
    showSources: bool = Field(True, description="显示溯源信息")
    showConfidence: bool = Field(True, description="显示置信度")
    pageSize: int = Field(20, description="页面大小", ge=10, le=100)
    enableNotifications: bool = Field(True, description="启用通知")
    defaultSearchMode: str = Field("dual", description="默认搜索模式", pattern="^(dual|general|domain)$")
    ui_layout: Dict[str, Any] = Field(
        default={
            "sidebar_collapsed": False,
            "chat_width": "50%",
            "knowledge_view": "grid",
            "show_advanced_options": False
        },
        description="UI布局设置"
    )
    qa_settings: Dict[str, Any] = Field(
        default={
            "auto_expand_sources": True,
            "show_processing_time": True,
            "enable_quick_actions": True,
            "default_agent": "geopolymer_qa_team"
        },
        description="问答设置"
    )
    knowledge_settings: Dict[str, Any] = Field(
        default={
            "auto_vectorize": True,
            "show_upload_progress": True,
            "default_file_filters": ["pdf", "docx", "txt"],
            "enable_batch_operations": True
        },
        description="知识库设置"
    )

class UserPreferencesUpdate(BaseModel):
    """用户偏好更新模型"""
    theme: Optional[str] = Field(None, pattern="^(light|dark|auto)$")
    language: Optional[str] = Field(None, pattern="^(zh|en)$")
    fontSize: Optional[str] = Field(None, pattern="^(small|medium|large)$")
    autoSave: Optional[bool] = None
    showSources: Optional[bool] = None
    showConfidence: Optional[bool] = None
    pageSize: Optional[int] = Field(None, ge=10, le=100)
    enableNotifications: Optional[bool] = None
    defaultSearchMode: Optional[str] = Field(None, pattern="^(dual|general|domain)$")
    ui_layout: Optional[Dict[str, Any]] = None
    qa_settings: Optional[Dict[str, Any]] = None
    knowledge_settings: Optional[Dict[str, Any]] = None

def get_preferences_path(user_id: str = "default") -> Path:
    """获取用户偏好文件路径"""
    config_dir = Path("config/user_preferences")
    config_dir.mkdir(parents=True, exist_ok=True)
    return config_dir / f"{user_id}.json"

def load_user_preferences(user_id: str = "default") -> UserPreferences:
    """加载用户偏好"""
    prefs_path = get_preferences_path(user_id)
    
    if prefs_path.exists():
        try:
            with open(prefs_path, 'r', encoding='utf-8') as f:
                prefs_data = json.load(f)
            return UserPreferences(**prefs_data)
        except Exception as e:
            logger.warning(f"加载用户偏好失败，使用默认设置: {e}")
    
    return UserPreferences()

def save_user_preferences(preferences: UserPreferences, user_id: str = "default") -> None:
    """保存用户偏好"""
    prefs_path = get_preferences_path(user_id)
    
    with open(prefs_path, 'w', encoding='utf-8') as f:
        json.dump(preferences.dict(), f, ensure_ascii=False, indent=2)

@router.get("/preferences")
async def get_user_preferences(user_id: str = "default"):
    """获取用户偏好设置"""
    try:
        preferences = load_user_preferences(user_id)
        
        return {
            "success": True,
            "data": preferences.dict(),
            "message": "获取用户偏好成功"
        }
        
    except Exception as e:
        logger.error(f"获取用户偏好失败: {e}")
        raise HTTPException(status_code=500, detail="获取偏好设置失败")

@router.put("/preferences")
async def update_user_preferences(
    preferences_update: UserPreferencesUpdate,
    user_id: str = "default"
):
    """更新用户偏好设置"""
    try:
        # 加载当前偏好
        current_preferences = load_user_preferences(user_id)
        
        # 更新偏好
        update_data = preferences_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(current_preferences, key):
                if isinstance(value, dict) and isinstance(getattr(current_preferences, key), dict):
                    # 合并字典类型的偏好设置
                    current_value = getattr(current_preferences, key)
                    current_value.update(value)
                    setattr(current_preferences, key, current_value)
                else:
                    setattr(current_preferences, key, value)
        
        # 保存偏好
        save_user_preferences(current_preferences, user_id)
        
        return {
            "success": True,
            "data": current_preferences.dict(),
            "message": "用户偏好更新成功"
        }
        
    except Exception as e:
        logger.error(f"更新用户偏好失败: {e}")
        raise HTTPException(status_code=500, detail="偏好更新失败")

@router.post("/preferences/reset")
async def reset_user_preferences(user_id: str = "default"):
    """重置用户偏好为默认值"""
    try:
        default_preferences = UserPreferences()
        save_user_preferences(default_preferences, user_id)
        
        return {
            "success": True,
            "data": default_preferences.dict(),
            "message": "用户偏好已重置为默认值"
        }
        
    except Exception as e:
        logger.error(f"重置用户偏好失败: {e}")
        raise HTTPException(status_code=500, detail="偏好重置失败")

@router.get("/preferences/export")
async def export_user_preferences(user_id: str = "default"):
    """导出用户偏好设置"""
    try:
        preferences = load_user_preferences(user_id)
        
        export_data = {
            "user_id": user_id,
            "exported_at": "2023-12-01T10:00:00Z",
            "preferences": preferences.dict(),
            "version": "1.0"
        }
        
        return {
            "success": True,
            "data": export_data,
            "message": "用户偏好导出成功"
        }
        
    except Exception as e:
        logger.error(f"导出用户偏好失败: {e}")
        raise HTTPException(status_code=500, detail="偏好导出失败")

@router.post("/preferences/import")
async def import_user_preferences(
    import_data: Dict[str, Any],
    user_id: str = "default"
):
    """导入用户偏好设置"""
    try:
        # 验证导入数据格式
        if "preferences" not in import_data:
            raise HTTPException(status_code=400, detail="导入数据格式无效")
        
        preferences_data = import_data["preferences"]
        preferences = UserPreferences(**preferences_data)
        
        # 保存导入的偏好
        save_user_preferences(preferences, user_id)
        
        return {
            "success": True,
            "data": preferences.dict(),
            "message": "用户偏好导入成功"
        }
        
    except ValueError as e:
        logger.error(f"偏好数据验证失败: {e}")
        raise HTTPException(status_code=400, detail="偏好数据格式无效")
    except Exception as e:
        logger.error(f"导入用户偏好失败: {e}")
        raise HTTPException(status_code=500, detail="偏好导入失败")

@router.get("/profile")
async def get_user_profile(user_id: str = "default"):
    """获取用户档案信息"""
    try:
        # 加载用户偏好
        preferences = load_user_preferences(user_id)
        
        # 构建用户档案（模拟数据）
        profile = {
            "user_id": user_id,
            "username": "用户" + user_id,
            "email": f"{user_id}@example.com" if user_id != "default" else None,
            "created_at": "2023-01-01T00:00:00Z",
            "last_login": "2023-12-01T10:00:00Z",
            "preferences": preferences.dict(),
            "usage_stats": {
                "total_questions": 150,
                "total_conversations": 25,
                "documents_uploaded": 8,
                "average_session_time": "15分钟"
            },
            "subscription": {
                "plan": "basic",
                "expires_at": None,
                "features": {
                    "max_documents": 100,
                    "max_conversations": 1000,
                    "advanced_search": True
                }
            }
        }
        
        return {
            "success": True,
            "data": profile,
            "message": "获取用户档案成功"
        }
        
    except Exception as e:
        logger.error(f"获取用户档案失败: {e}")
        raise HTTPException(status_code=500, detail="获取用户档案失败")

@router.put("/profile")
async def update_user_profile(
    profile_data: Dict[str, Any],
    user_id: str = "default"
):
    """更新用户档案信息"""
    try:
        # 这里应该实现实际的用户档案更新逻辑
        # 目前只支持更新用户名和邮箱
        allowed_fields = ["username", "email", "avatar_url"]
        updates = {k: v for k, v in profile_data.items() if k in allowed_fields}
        
        if not updates:
            raise HTTPException(status_code=400, detail="没有提供有效的更新字段")
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "updates": updates,
                "updated_at": "2023-12-01T10:00:00Z"
            },
            "message": "用户档案更新成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新用户档案失败: {e}")
        raise HTTPException(status_code=500, detail="档案更新失败")

@router.get("/sessions")
async def get_user_sessions(
    user_id: str = "default",
    limit: int = 20,
    offset: int = 0
):
    """获取用户会话历史"""
    try:
        # 模拟会话数据
        sessions = [
            {
                "session_id": f"session_{i}",
                "started_at": f"2023-12-{i:02d}T10:00:00Z",
                "ended_at": f"2023-12-{i:02d}T10:30:00Z",
                "duration": 1800,  # 30分钟
                "questions_count": 5,
                "device": "desktop" if i % 2 == 0 else "mobile",
                "ip_address": "192.168.1.1"
            }
            for i in range(1, limit + 1)
        ]
        
        return {
            "success": True,
            "data": {
                "sessions": sessions,
                "total": 50,
                "limit": limit,
                "offset": offset
            },
            "message": "获取会话历史成功"
        }
        
    except Exception as e:
        logger.error(f"获取用户会话失败: {e}")
        raise HTTPException(status_code=500, detail="获取会话历史失败")

@router.delete("/data")
async def delete_user_data(
    user_id: str = "default",
    confirm: bool = False
):
    """删除用户数据"""
    try:
        if not confirm:
            raise HTTPException(
                status_code=400, 
                detail="请确认删除操作（设置 confirm=true）"
            )
        
        # 删除用户偏好文件
        prefs_path = get_preferences_path(user_id)
        if prefs_path.exists():
            prefs_path.unlink()
        
        # 这里应该删除其他用户相关数据
        # - 对话历史
        # - 上传的文档
        # - 评估记录等
        
        return {
            "success": True,
            "message": f"用户 {user_id} 的数据已删除"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除用户数据失败: {e}")
        raise HTTPException(status_code=500, detail="数据删除失败")

# ================================================================
# 导航菜单配置管理（数据库持久化）
# ================================================================

class NavMenuConfigUpdate(BaseModel):
    """导航菜单配置更新模型"""
    hiddenNavKeys: list[str] = Field(default=[], description="隐藏的导航菜单键列表")

@router.get("/nav-menu-config")
async def get_nav_menu_config(user_id: str = "default"):
    """获取用户的导航菜单配置（从数据库）"""
    try:
        from core.database import get_db_pool

        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # 查询用户偏好
            result = await conn.fetchrow(
                """
                SELECT preferences
                FROM user_preferences
                WHERE user_id = $1
                """,
                user_id
            )

            if result and result['preferences']:
                # 从JSONB字段中提取导航菜单配置
                preferences = result['preferences'] if isinstance(result['preferences'], dict) else {}
                hidden_nav_keys = preferences.get("hiddenNavKeys", [])
            else:
                hidden_nav_keys = []

            return {
                "success": True,
                "data": {
                    "hiddenNavKeys": hidden_nav_keys
                },
                "message": "获取导航菜单配置成功"
            }

    except Exception as e:
        logger.error(f"获取导航菜单配置失败: {e}")
        raise HTTPException(status_code=500, detail="获取菜单配置失败")

@router.put("/nav-menu-config")
async def update_nav_menu_config(
    config: NavMenuConfigUpdate,
    user_id: str = "default"
):
    """更新用户的导航菜单配置（保存到数据库）"""
    try:
        from core.database import get_db_pool
        import uuid
        from datetime import datetime

        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # 首先检查用户偏好记录是否存在
            result = await conn.fetchrow(
                "SELECT id, preferences FROM user_preferences WHERE user_id = $1",
                user_id
            )

            if result:
                # 更新现有记录
                pref_id = result['id']
                current_prefs = result['preferences']
                preferences = current_prefs if isinstance(current_prefs, dict) else {}
                preferences["hiddenNavKeys"] = config.hiddenNavKeys

                await conn.execute(
                    """
                    UPDATE user_preferences
                    SET preferences = $1::jsonb,
                        updated_at = $2
                    WHERE user_id = $3
                    """,
                    json.dumps(preferences),
                    datetime.now(),
                    user_id
                )
            else:
                # 创建新记录
                pref_id = str(uuid.uuid4())
                preferences = {"hiddenNavKeys": config.hiddenNavKeys}

                await conn.execute(
                    """
                    INSERT INTO user_preferences (id, user_id, preferences, created_at, updated_at)
                    VALUES ($1, $2, $3::jsonb, $4, $5)
                    """,
                    pref_id,
                    user_id,
                    json.dumps(preferences),
                    datetime.now(),
                    datetime.now()
                )

            return {
                "success": True,
                "data": {
                    "hiddenNavKeys": config.hiddenNavKeys
                },
                "message": "导航菜单配置已保存到数据库"
            }

    except Exception as e:
        logger.error(f"更新导航菜单配置失败: {e}")
        raise HTTPException(status_code=500, detail="菜单配置更新失败")