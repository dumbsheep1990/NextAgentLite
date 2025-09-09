"""
数据库迁移管理器
"""
import os
import asyncio
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import db.database as database_module
from core.logger import logger


class MigrationManager:
    """数据库迁移管理器"""
    
    def __init__(self):
        self.migrations_dir = Path(__file__).parent
        self.migration_table = "schema_migrations"
    
    async def initialize_migration_table(self):
        """初始化迁移记录表"""
        async with database_module.async_engine.begin() as conn:
            await conn.execute(text(f"""
                CREATE TABLE IF NOT EXISTS {self.migration_table} (
                    id SERIAL PRIMARY KEY,
                    version VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    checksum VARCHAR(100)
                );
            """))
            logger.info("迁移记录表初始化完成")
    
    async def get_applied_migrations(self) -> List[str]:
        """获取已应用的迁移版本"""
        try:
            async with database_module.async_engine.begin() as conn:
                result = await conn.execute(
                    text(f"SELECT version FROM {self.migration_table} ORDER BY version")
                )
                return [row[0] for row in result.fetchall()]
        except Exception as e:
            logger.warning(f"获取已应用迁移失败: {e}")
            return []
    
    async def get_pending_migrations(self) -> List[Dict[str, Any]]:
        """获取待应用的迁移"""
        applied_migrations = await self.get_applied_migrations()
        all_migrations = self._discover_migrations()
        
        pending = []
        for migration in all_migrations:
            if migration["version"] not in applied_migrations:
                pending.append(migration)
        
        return sorted(pending, key=lambda x: x["version"])
    
    def _discover_migrations(self) -> List[Dict[str, Any]]:
        """发现所有迁移文件"""
        migrations = []
        
        # 查找SQL迁移文件
        for sql_file in self.migrations_dir.glob("*.sql"):
            if sql_file.name == "init_database.sql":
                migrations.append({
                    "version": "001_init_database",
                    "name": "初始化数据库",
                    "file_path": sql_file,
                    "type": "sql"
                })
        
        # 查找Python迁移文件
        for py_file in self.migrations_dir.glob("migration_*.py"):
            # 排除migration_manager.py文件
            if py_file.name == "migration_manager.py":
                continue
                
            version = py_file.stem.replace("migration_", "")
            migrations.append({
                "version": version,
                "name": f"迁移_{version}",
                "file_path": py_file,
                "type": "python"
            })
        
        return migrations
    
    async def apply_migration(self, migration: Dict[str, Any]) -> bool:
        """应用单个迁移"""
        try:
            logger.info(f"应用迁移: {migration['version']} - {migration['name']}")
            
            if migration["type"] == "sql":
                await self._apply_sql_migration(migration)
            elif migration["type"] == "python":
                await self._apply_python_migration(migration)
            
            # 记录迁移
            await self._record_migration(migration)
            
            logger.info(f"迁移应用成功: {migration['version']}")
            return True
            
        except Exception as e:
            logger.error(f"迁移应用失败 {migration['version']}: {e}")
            return False
    
    async def _apply_sql_migration(self, migration: Dict[str, Any]):
        """应用SQL迁移"""
        with open(migration["file_path"], "r", encoding="utf-8") as f:
            sql_content = f.read()
        
        # 特殊处理，直接执行整个SQL文件内容
        # 因为PostgreSQL的函数定义和DO块不能简单按分号分割
        try:
            async with database_module.async_engine.begin() as conn:
                await conn.execute(text(sql_content))
        except Exception as e:
            # 如果整体执行失败，尝试按语句分割执行
            logger.warning(f"整体执行失败，尝试分段执行: {e}")
            statements = self._split_sql_statements(sql_content)
            
            async with database_module.async_engine.begin() as conn:
                for statement in statements:
                    if statement.strip():
                        try:
                            await conn.execute(text(statement))
                        except Exception as stmt_e:
                            logger.error(f"SQL语句执行失败: {statement[:100]}... 错误: {stmt_e}")
                            raise
    
    def _split_sql_statements(self, sql_content: str) -> List[str]:
        """智能分割SQL语句"""
        statements = []
        current_statement = ""
        in_function = False
        in_do_block = False
        
        lines = sql_content.split('\n')
        for line in lines:
            stripped = line.strip()
            
            # 跳过注释行
            if stripped.startswith('--') or not stripped:
                continue
            
            # 检测函数开始
            if 'CREATE OR REPLACE FUNCTION' in line.upper() or 'CREATE FUNCTION' in line.upper():
                in_function = True
            
            # 检测DO块开始
            if stripped.upper().startswith('DO $$'):
                in_do_block = True
            
            current_statement += line + '\n'
            
            # 检测函数结束
            if in_function and ('$$ language' in line.lower() or '$$ LANGUAGE' in line):
                in_function = False
                statements.append(current_statement.strip())
                current_statement = ""
                continue
            
            # 检测DO块结束
            if in_do_block and stripped == '$$;':
                in_do_block = False
                statements.append(current_statement.strip())
                current_statement = ""
                continue
            
            # 普通语句以分号结尾
            if not in_function and not in_do_block and stripped.endswith(';'):
                statements.append(current_statement.strip())
                current_statement = ""
        
        # 添加剩余内容
        if current_statement.strip():
            statements.append(current_statement.strip())
        
        return statements
    
    async def _apply_python_migration(self, migration: Dict[str, Any]):
        """应用Python迁移"""
        # 动态导入Python迁移模块
        import importlib.util
        
        spec = importlib.util.spec_from_file_location("migration", migration["file_path"])
        migration_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration_module)
        
        # 调用迁移函数
        if hasattr(migration_module, "upgrade"):
            await migration_module.upgrade()
        else:
            raise ValueError(f"迁移文件 {migration['file_path']} 缺少 upgrade 函数")
    
    async def _record_migration(self, migration: Dict[str, Any]):
        """记录迁移"""
        checksum = self._calculate_checksum(migration["file_path"])
        
        async with database_module.async_engine.begin() as conn:
            await conn.execute(
                text(f"""
                    INSERT INTO {self.migration_table} (version, name, checksum)
                    VALUES (:version, :name, :checksum)
                """),
                {
                    "version": migration["version"],
                    "name": migration["name"],
                    "checksum": checksum
                }
            )
    
    def _calculate_checksum(self, file_path: Path) -> str:
        """计算文件校验和"""
        import hashlib
        
        with open(file_path, "rb") as f:
            content = f.read()
        
        return hashlib.md5(content).hexdigest()
    
    async def run_migrations(self):
        """运行所有待应用的迁移 - 幂等性实现"""
        try:
            # 首先确保数据库连接已初始化
            database_module.init_database()
            logger.info("数据库连接初始化完成")
            
            # 然后检查是否需要初始化迁移表
            await self.initialize_migration_table()
            
            # 获取待应用的迁移
            pending_migrations = await self.get_pending_migrations()
            
            if not pending_migrations:
                logger.info("✅ 所有数据库迁移均已应用，跳过重复执行")
                return
            
            logger.info(f"🔄 发现 {len(pending_migrations)} 个待应用的迁移")
            
            success_count = 0
            for migration in pending_migrations:
                logger.info(f"🚀 开始应用迁移: {migration['version']} - {migration['name']}")
                
                if await self.apply_migration(migration):
                    success_count += 1
                    logger.info(f"✅ 迁移应用成功: {migration['version']}")
                else:
                    logger.error(f"❌ 迁移失败，停止后续迁移: {migration['version']}")
                    break
            
            if success_count == len(pending_migrations):
                logger.info(f"✅ 所有迁移执行成功: {success_count}/{len(pending_migrations)}")
            else:
                logger.warning(f"⚠️ 部分迁移执行失败: {success_count}/{len(pending_migrations)} 成功")
        
        except Exception as e:
            logger.error(f"❌ 迁移执行过程中发生错误: {e}")
            raise
    
    async def reset_database(self):
        """重置数据库（危险操作）"""
        logger.warning("开始重置数据库...")
        
        # 获取所有表名
        async with database_module.async_engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            """))
            tables = [row[0] for row in result.fetchall()]
        
        # 删除所有表
        if tables:
            async with database_module.async_engine.begin() as conn:
                for table in tables:
                    await conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                logger.info(f"删除了 {len(tables)} 个表")
        
        # 重新运行迁移
        await self.run_migrations()
        logger.info("数据库重置完成")
    
    async def rollback_migration(self, target_version: str):
        """回滚到指定版本（简单实现）"""
        logger.warning(f"回滚功能尚未完全实现，目标版本: {target_version}")
        # 这里可以实现回滚逻辑
        # 需要在迁移文件中添加 downgrade 函数


async def main():
    """命令行入口"""
    import sys
    
    manager = MigrationManager()
    
    if len(sys.argv) < 2:
        print("用法: python migration_manager.py <command>")
        print("命令:")
        print("  migrate    - 运行待应用的迁移")
        print("  reset      - 重置数据库")
        print("  status     - 查看迁移状态")
        return
    
    command = sys.argv[1]
    
    if command == "migrate":
        await manager.run_migrations()
    elif command == "reset":
        confirm = input("确认要重置数据库吗？这将删除所有数据！(yes/no): ")
        if confirm.lower() == "yes":
            await manager.reset_database()
        else:
            print("操作已取消")
    elif command == "status":
        applied = await manager.get_applied_migrations()
        pending = await manager.get_pending_migrations()
        
        print(f"已应用的迁移: {len(applied)}")
        for migration in applied:
            print(f"  ✓ {migration}")
        
        print(f"待应用的迁移: {len(pending)}")
        for migration in pending:
            print(f"  - {migration['version']}: {migration['name']}")
    else:
        print(f"未知命令: {command}")


if __name__ == "__main__":
    asyncio.run(main())