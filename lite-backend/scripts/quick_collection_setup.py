"""
快速Collection设置脚本

用于开发和测试环境的快速Collection初始化。
执行简化的迁移流程，确保系统具备基本的Collection架构。

Usage:
    python scripts/quick_collection_setup.py
"""

import asyncio
import json
import uuid
from datetime import datetime
import logging

# 配置简单日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 导入项目模块
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db_connection
from core.config import settings

class QuickCollectionSetup:
    """快速Collection设置"""
    
    def __init__(self):
        self.db_pool = None
        self.default_collection_id = None
    
    async def initialize(self):
        """初始化数据库连接"""
        try:
            self.db_pool = await get_db_connection()
            logger.info("✅ 数据库连接成功")
        except Exception as e:
            logger.error(f"❌ 数据库连接失败: {e}")
            raise
    
    async def cleanup(self):
        """清理资源"""
        if self.db_pool:
            await self.db_pool.close()
    
    async def ensure_default_collection(self) -> str:
        """确保默认Collection存在"""
        logger.info("🔍 检查默认Collection...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 检查是否已存在默认Collection
                existing = await conn.fetchrow("""
                    SELECT id, name FROM knowledge_collections 
                    WHERE config->>'is_default' = 'true'
                    ORDER BY created_at ASC LIMIT 1
                """)
                
                if existing:
                    self.default_collection_id = existing['id']
                    logger.info(f"✅ 默认Collection已存在: {existing['name']}")
                    return self.default_collection_id
                
                # 创建默认Collection
                collection_id = str(uuid.uuid4())
                config = {
                    "is_default": True,
                    "created_by": "quick_setup",
                    "setup_date": datetime.now().isoformat()
                }
                
                await conn.execute("""
                    INSERT INTO knowledge_collections 
                    (id, name, description, metadata_template, config, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                """, 
                    collection_id,
                    "默认知识库",
                    "系统自动创建的默认知识库",
                    "general",
                    json.dumps(config)
                )
                
                self.default_collection_id = collection_id
                logger.info(f"✅ 默认Collection创建成功: {collection_id}")
                return collection_id
                
        except Exception as e:
            logger.error(f"❌ 默认Collection设置失败: {e}")
            raise
    
    async def quick_migrate_orphaned_data(self):
        """快速迁移孤立数据"""
        logger.info("⚡ 快速迁移孤立数据...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 统计孤立数据
                orphaned_docs = await conn.fetchval(
                    "SELECT COUNT(*) FROM knowledge_documents WHERE collection_id IS NULL"
                )
                
                if orphaned_docs > 0:
                    logger.info(f"📄 迁移 {orphaned_docs} 个孤立文档...")
                    await conn.execute("""
                        UPDATE knowledge_documents 
                        SET collection_id = $1, updated_at = NOW()
                        WHERE collection_id IS NULL
                    """, self.default_collection_id)
                
                # 迁移chunks
                orphaned_chunks = await conn.fetchval("""
                    SELECT COUNT(*) FROM document_chunks dc
                    LEFT JOIN knowledge_documents kd ON dc.document_id = kd.id
                    WHERE kd.collection_id = $1 AND dc.collection_id IS NULL
                """, self.default_collection_id)
                
                if orphaned_chunks > 0:
                    logger.info(f"🧩 迁移 {orphaned_chunks} 个孤立chunks...")
                    await conn.execute("""
                        UPDATE document_chunks 
                        SET collection_id = $1, updated_at = NOW()
                        WHERE document_id IN (
                            SELECT id FROM knowledge_documents 
                            WHERE collection_id = $1
                        ) AND collection_id IS NULL
                    """, self.default_collection_id)
                
                logger.info(f"✅ 快速迁移完成: {orphaned_docs} 文档, {orphaned_chunks} chunks")
                
        except Exception as e:
            logger.error(f"❌ 快速迁移失败: {e}")
            raise
    
    async def initialize_metadata_templates(self):
        """初始化元数据模板（如果需要）"""
        logger.info("📋 检查元数据模板...")
        
        try:
            async with self.db_pool.acquire() as conn:
                template_count = await conn.fetchval(
                    "SELECT COUNT(*) FROM metadata_templates"
                )
                
                if template_count == 0:
                    logger.info("📝 初始化基础元数据模板...")
                    
                    basic_template = {
                        "title": {"type": "string", "required": True, "label": "标题"},
                        "description": {"type": "text", "required": False, "label": "描述"},
                        "tags": {"type": "array", "required": False, "label": "标签"},
                        "source": {"type": "string", "required": False, "label": "来源"}
                    }
                    
                    await conn.execute("""
                        INSERT INTO metadata_templates 
                        (id, name, description, fields, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, NOW(), NOW())
                    """,
                        "general",
                        "通用模板", 
                        "适用于一般文档的基础模板",
                        json.dumps(basic_template)
                    )
                    
                    logger.info("✅ 基础元数据模板创建完成")
                else:
                    logger.info(f"✅ 元数据模板已存在 ({template_count} 个)")
                    
        except Exception as e:
            logger.error(f"❌ 元数据模板初始化失败: {e}")
            # 这不是关键错误，继续执行
    
    async def run_setup(self):
        """运行快速设置"""
        logger.info("🚀 开始快速Collection设置...")
        
        try:
            # 1. 确保默认Collection存在
            await self.ensure_default_collection()
            
            # 2. 快速迁移孤立数据
            await self.quick_migrate_orphaned_data()
            
            # 3. 初始化基础模板
            await self.initialize_metadata_templates()
            
            logger.info("🎉 快速Collection设置完成！")
            logger.info(f"   默认Collection ID: {self.default_collection_id}")
            logger.info("   系统已准备好使用Collection架构")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ 快速设置失败: {e}")
            return False


async def main():
    """主函数"""
    setup = QuickCollectionSetup()
    
    try:
        await setup.initialize()
        success = await setup.run_setup()
        
        if success:
            return 0
        else:
            return 1
            
    except Exception as e:
        logger.error(f"❌ 设置脚本执行异常: {e}")
        return 1
        
    finally:
        await setup.cleanup()


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)