"""
用户种子数据服务
在系统启动时，如果 users 表为空，则根据 .env 中的配置插入默认用户。

支持的环境变量（已在 .env 示例中）：
- ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_ROLE, ADMIN_DISPLAY_NAME
- RESEARCHER1_USERNAME/PASSWORD/ROLE/DISPLAY_NAME
- RESEARCHER2_...
- RESEARCHER3_...

注意：为简化集成，密码使用 PostgreSQL md5(text) 生成32位hex，
auth.verify_password 已支持 MD5/bcrypt/明文多种校验。
"""
from typing import List, Dict
import os
from core.logger import logger
from db.database import DatabaseManager
from sqlalchemy import text


def _collect_user_env() -> List[Dict]:
    users: List[Dict] = []

    # 管理员
    admin_user = os.getenv("ADMIN_USERNAME", "admin").strip()
    admin_pass = os.getenv("ADMIN_PASSWORD", "admin123").strip()
    admin_name = os.getenv("ADMIN_DISPLAY_NAME", "管理员").strip()
    admin_role = os.getenv("ADMIN_ROLE", "admin").strip()
    if admin_user and admin_pass:
        users.append({
            "username": admin_user,
            "password": admin_pass,
            "full_name": admin_name or admin_user,
            "role": admin_role or "admin",
            "email": f"{admin_user}@local",
            "is_superuser": True,
        })

    # 研究员/普通用户
    for idx in (1, 2, 3):
        prefix = f"RESEARCHER{idx}_"
        u = os.getenv(prefix + "USERNAME", "").strip()
        p = os.getenv(prefix + "PASSWORD", "").strip()
        r = os.getenv(prefix + "ROLE", "user").strip()
        d = os.getenv(prefix + "DISPLAY_NAME", u).strip() or u
        if u and p:
            users.append({
                "username": u,
                "password": p,
                "full_name": d,
                "role": r or "user",
                "email": f"{u}@local",
                "is_superuser": (r == "admin"),
            })

    return users


async def seed_default_users_if_empty():
    try:
        db = DatabaseManager()
        async with db.get_async_session() as session:
            # 检查是否已有用户
            res = await session.execute(text("SELECT COUNT(*) FROM users"))
            cnt = int(res.scalar() or 0)
            if cnt > 0:
                logger.info(f"[USER-SEED] 检测到现有用户数量: {cnt}，跳过默认用户插入")
                return

            users = _collect_user_env()
            if not users:
                logger.warning("[USER-SEED] 未从环境变量读取到任何默认用户配置，跳过")
                return

            inserted = 0
            first = True
            for u in users:
                try:
                    # 使用 md5 作为 hashed_password（verify_password 兼容）
                    if first:
                        # 确保存在 id=1 的默认用户，便于开发期依赖（如 get_current_user_id 返回1）
                        await session.execute(text(
                            """
                            INSERT INTO users (id, username, email, hashed_password, full_name, role, is_active, is_superuser, password_hash)
                            VALUES (1, :username, :email, md5(:password), :full_name, :role, true, :is_superuser, md5(:password))
                            ON CONFLICT (id) DO NOTHING
                            """
                        ), u)
                        first = False
                    # 正常插入/更新（按用户名幂等）
                    await session.execute(text(
                        """
                        INSERT INTO users (username, email, hashed_password, full_name, role, is_active, is_superuser, password_hash)
                        VALUES (:username, :email, md5(:password), :full_name, :role, true, :is_superuser, md5(:password))
                        ON CONFLICT (username) DO UPDATE SET 
                          email=EXCLUDED.email,
                          hashed_password=EXCLUDED.hashed_password,
                          password_hash=EXCLUDED.password_hash,
                          full_name=EXCLUDED.full_name,
                          role=EXCLUDED.role,
                          is_active=true,
                          is_superuser=EXCLUDED.is_superuser
                        """
                    ), u)
                    inserted += 1
                except Exception as e:
                    logger.warning(f"[USER-SEED] 插入/更新用户失败 {u.get('username')}: {e}")
            await session.commit()
            logger.info(f"[USER-SEED] 默认用户插入/更新完成: {inserted} 条")
    except Exception as e:
        logger.error(f"[USER-SEED] 执行用户种子失败: {e}")


async def seed_default_users(force: bool = False) -> int:
    """无条件插入/更新默认用户，返回受影响的用户数。
    当 force=True 时，即使表非空也执行。"""
    try:
        db = DatabaseManager()
        async with db.get_async_session() as session:
            if not force:
                res = await session.execute(text("SELECT COUNT(*) FROM users"))
                cnt = int(res.scalar() or 0)
                if cnt > 0:
                    logger.info(f"[USER-SEED] 表非空（{cnt}），跳过seed_default_users(force=False)")
                    return 0

            users = _collect_user_env()
            if not users:
                logger.warning("[USER-SEED] 未从环境变量读取到任何默认用户配置，跳过")
                return 0

            affected = 0
            first = True
            for u in users:
                try:
                    if first:
                        # 同步保证 id=1 存在（仅在空表seed时）
                        await session.execute(text(
                            """
                            INSERT INTO users (id, username, email, hashed_password, full_name, role, is_active, is_superuser, password_hash)
                            VALUES (1, :username, :email, md5(:password), :full_name, :role, true, :is_superuser, md5(:password))
                            ON CONFLICT (id) DO NOTHING
                            """
                        ), u)
                        first = False
                    await session.execute(text(
                        """
                        INSERT INTO users (username, email, hashed_password, full_name, role, is_active, is_superuser, password_hash)
                        VALUES (:username, :email, md5(:password), :full_name, :role, true, :is_superuser, md5(:password))
                        ON CONFLICT (username) DO UPDATE SET 
                          email=EXCLUDED.email,
                          hashed_password=EXCLUDED.hashed_password,
                          password_hash=EXCLUDED.password_hash,
                          full_name=EXCLUDED.full_name,
                          role=EXCLUDED.role,
                          is_active=true,
                          is_superuser=EXCLUDED.is_superuser
                        """
                    ), u)
                    affected += 1
                except Exception as e:
                    logger.warning(f"[USER-SEED] 插入/更新用户失败 {u.get('username')}: {e}")
            await session.commit()
            logger.info(f"[USER-SEED] 强制seed完成: {affected} 条")
            return affected
    except Exception as e:
        logger.error(f"[USER-SEED] seed_default_users(force={force}) 失败: {e}")
        return 0
