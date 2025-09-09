#!/usr/bin/env python3
"""
系统初始化脚本
用于部署时自动执行完整的系统初始化
包括数据库初始化和ElasticSearch初始化
"""

import sys
import os
import asyncio
import argparse
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from core.config_optimized import optimized_config_manager
from core.logger import logger
from migrations.migration_manager import MigrationManager
from migrations.es_migration_manager import ESMigrationManager


class SystemInitializer:
    """系统初始化器"""
    
    def __init__(self, force: bool = False, skip_es: bool = False):
        """
        初始化
        
        Args:
            force: 强制重新初始化
            skip_es: 跳过ElasticSearch初始化
        """
        self.force = force
        self.skip_es = skip_es
        self.success_count = 0
        self.total_tasks = 3 if not skip_es else 2
    
    async def initialize_database(self) -> bool:
        """初始化PostgreSQL数据库"""
        logger.info("=== 开始初始化PostgreSQL数据库 ===")
        
        try:
            # 初始化数据库连接
            from db.database import init_database, check_database_connection, create_tables
            init_database()
            
            # 检查数据库连接
            if not await check_database_connection():
                logger.error("数据库连接失败")
                return False
            
            logger.info("数据库连接正常")
            
            # 创建表结构
            await create_tables()
            logger.info("数据库表结构创建完成")
            
            # 执行数据库迁移
            migration_manager = MigrationManager()
            if self.force:
                logger.info("强制模式：重新执行所有迁移")
                # 这里可以添加重置数据库逻辑
            
            success = await migration_manager.check_and_migrate()
            
            if success:
                logger.info("✓ PostgreSQL数据库初始化完成")
                return True
            else:
                logger.error("✗ PostgreSQL数据库迁移失败")
                return False
                
        except Exception as e:
            logger.error(f"✗ PostgreSQL数据库初始化异常: {e}")
            return False
    
    def initialize_elasticsearch(self) -> bool:
        """初始化ElasticSearch"""
        if self.skip_es:
            logger.info("跳过ElasticSearch初始化")
            return True
        
        logger.info("=== 开始初始化ElasticSearch ===")
        
        try:
            es_manager = ESMigrationManager()
            
            if self.force:
                logger.info("强制模式：重新执行ES迁移")
                # 可以添加重置ES索引的逻辑
            
            # 检查并执行迁移
            success = es_manager.check_and_migrate()
            
            if success:
                # 验证索引状态
                indices_status = es_manager.validate_indices()
                healthy_count = sum(1 for status in indices_status.values() if status)
                total_count = len(indices_status)
                
                logger.info(f"ElasticSearch索引状态: {healthy_count}/{total_count} 正常")
                
                if healthy_count == total_count:
                    logger.info("✓ ElasticSearch初始化完成")
                    return True
                else:
                    logger.warning(f"部分索引状态异常: {indices_status}")
                    
                    # 尝试修复索引
                    logger.info("尝试修复损坏的索引...")
                    if es_manager.repair_indices():
                        logger.info("✓ 索引修复成功")
                        return True
                    else:
                        logger.error("✗ 索引修复失败")
                        return False
            else:
                logger.error("✗ ElasticSearch初始化失败")
                return False
                
        except Exception as e:
            logger.error(f"✗ ElasticSearch初始化异常: {e}")
            return False
    
    def verify_services(self) -> bool:
        """验证服务状态"""
        logger.info("=== 验证系统服务状态 ===")
        
        verification_results = {}
        
        # 验证数据库连接
        try:
            from db.database import init_database, check_database_connection
            init_database()
            
            # 使用同步方式检查
            import asyncio
            db_status = asyncio.run(check_database_connection())
            verification_results["postgresql"] = db_status
            
            if db_status:
                logger.info("✓ PostgreSQL连接正常")
            else:
                logger.error("✗ PostgreSQL连接失败")
                
        except Exception as e:
            logger.error(f"✗ PostgreSQL验证异常: {e}")
            verification_results["postgresql"] = False
        
        # 验证ElasticSearch
        if not self.skip_es:
            try:
                es_manager = ESMigrationManager()
                indices_status = es_manager.validate_indices()
                es_healthy = all(indices_status.values())
                verification_results["elasticsearch"] = es_healthy
                
                if es_healthy:
                    logger.info("✓ ElasticSearch状态正常")
                else:
                    logger.error(f"✗ ElasticSearch状态异常: {indices_status}")
                    
            except Exception as e:
                logger.error(f"✗ ElasticSearch验证异常: {e}")
                verification_results["elasticsearch"] = False
        else:
            verification_results["elasticsearch"] = True  # 跳过时视为正常
        
        # 总体验证结果
        all_healthy = all(verification_results.values())
        
        if all_healthy:
            logger.info("✓ 所有系统服务状态正常")
        else:
            logger.error(f"✗ 部分系统服务状态异常: {verification_results}")
        
        return all_healthy
    
    async def run_initialization(self) -> bool:
        """执行完整的系统初始化"""
        logger.info("🚀 开始系统初始化...")
        logger.info("=" * 60)
        
        start_time = logger.info("初始化开始时间")
        
        try:
            # 1. 初始化PostgreSQL数据库
            if await self.initialize_database():
                self.success_count += 1
                logger.info(f"进度: {self.success_count}/{self.total_tasks}")
            else:
                logger.error("数据库初始化失败，终止初始化")
                return False
            
            # 2. 初始化ElasticSearch
            if self.initialize_elasticsearch():
                self.success_count += 1
                logger.info(f"进度: {self.success_count}/{self.total_tasks}")
            else:
                logger.error("ElasticSearch初始化失败，终止初始化")
                return False
            
            # 3. 验证系统服务
            if self.verify_services():
                self.success_count += 1
                logger.info(f"进度: {self.success_count}/{self.total_tasks}")
            else:
                logger.error("系统验证失败")
                return False
            
            logger.info("=" * 60)
            logger.info("🎉 系统初始化完成！")
            logger.info(f"完成任务: {self.success_count}/{self.total_tasks}")
            
            return True
            
        except Exception as e:
            logger.error(f"✗ 系统初始化异常: {e}")
            return False
    
    def print_summary(self, success: bool):
        """打印初始化总结"""
        logger.info("=" * 60)
        logger.info("系统初始化总结")
        logger.info("=" * 60)
        
        if success:
            logger.info("✅ 初始化状态: 成功")
            logger.info("✅ 系统可以正常启动")
            logger.info("")
            logger.info("下一步:")
            logger.info("  1. 启动应用: python main.py")
            logger.info("  2. 访问API文档: http://localhost:8000/docs")
            logger.info("  3. 查看系统信息: http://localhost:8000/info")
        else:
            logger.error("❌ 初始化状态: 失败")
            logger.error("❌ 请检查错误日志并解决问题后重试")
            logger.info("")
            logger.info("故障排除:")
            logger.info("  1. 检查PostgreSQL服务是否启动")
            logger.info("  2. 检查ElasticSearch服务是否启动")
            logger.info("  3. 检查配置文件是否正确")
            logger.info("  4. 查看详细错误日志")
        
        logger.info("=" * 60)


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="地聚物材料QA系统初始化脚本")
    parser.add_argument("--force", action="store_true", help="强制重新初始化")
    parser.add_argument("--skip-es", action="store_true", help="跳过ElasticSearch初始化")
    parser.add_argument("--config", type=str, help="指定配置文件路径")
    parser.add_argument("--env", type=str, choices=["dev", "test", "prod"], 
                       default="dev", help="运行环境")
    
    args = parser.parse_args()
    
    # 设置环境变量
    if args.env:
        os.environ["ENVIRONMENT"] = args.env
    
    # 加载配置
    if args.config:
        os.environ["CONFIG_FILE"] = args.config
    
    logger.info(f"运行环境: {args.env}")
    logger.info(f"强制模式: {args.force}")
    logger.info(f"跳过ES: {args.skip_es}")
    
    # 创建初始化器并运行
    initializer = SystemInitializer(force=args.force, skip_es=args.skip_es)
    
    try:
        success = asyncio.run(initializer.run_initialization())
        initializer.print_summary(success)
        
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        logger.info("初始化被用户中断")
        sys.exit(1)
    except Exception as e:
        logger.error(f"初始化脚本异常: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 