#!/usr/bin/env python3
"""
用户管理脚本
用于手动添加、删除、修改和查看系统用户
"""
import os
import sys
import asyncio
import argparse
from typing import Optional
from datetime import datetime

# 添加父目录到Python路径以导入项目模块
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update, delete
import os

# 直接使用数据库配置而不依赖配置模块
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/mat_qa')

# 简化的User模型定义（避免复杂的导入依赖）
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    password_hash = Column(String)  # 兼容字段
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(String, default="student")
    organization = Column(String)
    research_interests = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    last_login = Column(DateTime)

# 简单的日志记录
import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class UserManager:
    """用户管理器"""
    
    def __init__(self):
        """初始化数据库连接"""
        # 将同步数据库URL转换为异步URL
        db_url = DATABASE_URL
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif db_url.startswith("sqlite:///"):
            db_url = db_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        
        self.engine = create_async_engine(db_url, echo=False)
        self.async_session = sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
    
    async def list_users(self):
        """列出所有用户"""
        async with self.async_session() as session:
            result = await session.execute(select(User))
            users = result.scalars().all()
            
            if not users:
                print("没有找到任何用户")
                return
            
            print("\n用户列表:")
            print("=" * 80)
            print(f"{'ID':<5} {'用户名':<15} {'角色':<15} {'显示名称':<20} {'状态':<10} {'创建时间'}")
            print("-" * 80)
            
            for user in users:
                status = "活跃" if user.is_active else "禁用"
                created_at = user.created_at.strftime('%Y-%m-%d %H:%M') if user.created_at else 'N/A'
                print(f"{user.id:<5} {user.username:<15} {user.role:<15} {user.full_name:<20} {status:<10} {created_at}")
    
    async def add_user(self, username: str, password: str, role: str, full_name: str, email: Optional[str] = None):
        """添加新用户"""
        async with self.async_session() as session:
            # 检查用户名是否已存在
            existing_user = await session.execute(
                select(User).where(User.username == username)
            )
            if existing_user.scalar():
                print(f"错误: 用户名 '{username}' 已存在")
                return False
            
            # 检查邮箱是否已存在
            if email:
                existing_email = await session.execute(
                    select(User).where(User.email == email)
                )
                if existing_email.scalar():
                    print(f"错误: 邮箱 '{email}' 已存在")
                    return False
            
            # 创建新用户
            new_user = User(
                username=username,
                email=email or f"{username}@geopolymer.com",
                hashed_password=password,  # 实际应用中应该加密
                password_hash=password,
                full_name=full_name,
                role=role,
                is_active=True,
                is_superuser=(role == 'admin'),
                created_at=datetime.now()
            )
            
            session.add(new_user)
            await session.commit()
            print(f"✅ 用户 '{username}' 添加成功!")
            return True
    
    async def update_user(self, username: str, **kwargs):
        """更新用户信息"""
        async with self.async_session() as session:
            result = await session.execute(
                select(User).where(User.username == username)
            )
            user = result.scalar()
            
            if not user:
                print(f"错误: 用户 '{username}' 不存在")
                return False
            
            # 更新用户字段
            updated_fields = []
            for field, value in kwargs.items():
                if hasattr(user, field) and value is not None:
                    setattr(user, field, value)
                    updated_fields.append(f"{field}={value}")
            
            user.updated_at = datetime.now()
            await session.commit()
            
            print(f"✅ 用户 '{username}' 更新成功!")
            if updated_fields:
                print(f"更新字段: {', '.join(updated_fields)}")
            return True
    
    async def delete_user(self, username: str):
        """删除用户"""
        async with self.async_session() as session:
            result = await session.execute(
                select(User).where(User.username == username)
            )
            user = result.scalar()
            
            if not user:
                print(f"错误: 用户 '{username}' 不存在")
                return False
            
            if user.role == 'admin':
                confirm = input("⚠️  警告: 您即将删除管理员用户，确定要继续吗? (yes/no): ")
                if confirm.lower() != 'yes':
                    print("操作已取消")
                    return False
            
            await session.delete(user)
            await session.commit()
            print(f"✅ 用户 '{username}' 已删除")
            return True
    
    async def reset_password(self, username: str, new_password: str):
        """重置用户密码"""
        async with self.async_session() as session:
            result = await session.execute(
                update(User)
                .where(User.username == username)
                .values(
                    hashed_password=new_password,
                    password_hash=new_password,
                    updated_at=datetime.now()
                )
            )
            
            if result.rowcount == 0:
                print(f"错误: 用户 '{username}' 不存在")
                return False
            
            await session.commit()
            print(f"✅ 用户 '{username}' 密码重置成功!")
            return True
    
    async def toggle_user_status(self, username: str):
        """切换用户状态 (活跃/禁用)"""
        async with self.async_session() as session:
            result = await session.execute(
                select(User).where(User.username == username)
            )
            user = result.scalar()
            
            if not user:
                print(f"错误: 用户 '{username}' 不存在")
                return False
            
            new_status = not user.is_active
            user.is_active = new_status
            user.updated_at = datetime.now()
            await session.commit()
            
            status_text = "活跃" if new_status else "禁用"
            print(f"✅ 用户 '{username}' 状态已设置为: {status_text}")
            return True

async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='用户管理脚本')
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # 列出用户
    subparsers.add_parser('list', help='列出所有用户')
    
    # 添加用户
    add_parser = subparsers.add_parser('add', help='添加新用户')
    add_parser.add_argument('username', help='用户名')
    add_parser.add_argument('password', help='密码')
    add_parser.add_argument('role', choices=['admin', 'researcher', 'student'], help='角色')
    add_parser.add_argument('full_name', help='显示名称')
    add_parser.add_argument('--email', help='邮箱地址')
    
    # 更新用户
    update_parser = subparsers.add_parser('update', help='更新用户信息')
    update_parser.add_argument('username', help='用户名')
    update_parser.add_argument('--full_name', help='显示名称')
    update_parser.add_argument('--email', help='邮箱地址')
    update_parser.add_argument('--role', choices=['admin', 'researcher', 'student'], help='角色')
    
    # 删除用户
    delete_parser = subparsers.add_parser('delete', help='删除用户')
    delete_parser.add_argument('username', help='用户名')
    
    # 重置密码
    reset_parser = subparsers.add_parser('reset-password', help='重置用户密码')
    reset_parser.add_argument('username', help='用户名')
    reset_parser.add_argument('password', help='新密码')
    
    # 切换用户状态
    toggle_parser = subparsers.add_parser('toggle-status', help='切换用户状态')
    toggle_parser.add_argument('username', help='用户名')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    user_manager = UserManager()
    
    try:
        if args.command == 'list':
            await user_manager.list_users()
        
        elif args.command == 'add':
            await user_manager.add_user(
                username=args.username,
                password=args.password,
                role=args.role,
                full_name=args.full_name,
                email=args.email
            )
        
        elif args.command == 'update':
            update_data = {}
            if args.full_name:
                update_data['full_name'] = args.full_name
            if args.email:
                update_data['email'] = args.email
            if args.role:
                update_data['role'] = args.role
                update_data['is_superuser'] = (args.role == 'admin')
            
            await user_manager.update_user(args.username, **update_data)
        
        elif args.command == 'delete':
            await user_manager.delete_user(args.username)
        
        elif args.command == 'reset-password':
            await user_manager.reset_password(args.username, args.password)
        
        elif args.command == 'toggle-status':
            await user_manager.toggle_user_status(args.username)
    
    except Exception as e:
        logger.error(f"执行命令时出错: {e}")
        print(f"❌ 错误: {e}")
    
    finally:
        await user_manager.engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())