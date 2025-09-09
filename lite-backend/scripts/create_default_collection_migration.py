"""
创建默认Collection和数据迁移脚本

此脚本的目的是为现有的NextAgentLite系统提供Collection架构的平滑升级路径：
1. 创建默认Collection（如果不存在）
2. 将现有的孤立文档和chunks迁移到默认Collection
3. 更新相关的元数据和关联关系
4. 验证迁移完整性

Usage:
    python scripts/create_default_collection_migration.py [--dry-run] [--force]
"""

import asyncio
import argparse
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/collection_migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 导入项目模块
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db_connection
from service.knowledge_collection_service import KnowledgeCollectionService
from core.config import settings

class CollectionMigrationManager:
    """Collection迁移管理器"""
    
    def __init__(self, dry_run: bool = False, force: bool = False):
        self.dry_run = dry_run
        self.force = force
        self.db_pool = None
        self.collection_service = None
        self.default_collection_id = None
        
        # 迁移统计
        self.stats = {
            "documents_migrated": 0,
            "chunks_migrated": 0,
            "embeddings_migrated": 0,
            "errors": [],
            "start_time": None,
            "end_time": None
        }
    
    async def initialize(self):
        """初始化数据库连接和服务"""
        logger.info("初始化迁移管理器...")
        
        try:
            self.db_pool = await get_db_connection()
            self.collection_service = KnowledgeCollectionService(self.db_pool)
            logger.info("✅ 迁移管理器初始化成功")
        except Exception as e:
            logger.error(f"❌ 初始化失败: {e}")
            raise
    
    async def cleanup(self):
        """清理资源"""
        if self.db_pool:
            await self.db_pool.close()
            logger.info("✅ 数据库连接已关闭")
    
    async def create_default_collection(self) -> str:
        """创建默认Collection"""
        logger.info("🏗️  检查并创建默认Collection...")
        
        # 默认Collection配置
        default_config = {
            "name": "系统默认知识库",
            "description": "系统迁移时自动创建的默认知识库，包含所有历史文档和数据。",
            "metadata_template": "general",
            "config": {
                "is_default": True,
                "created_by": "system_migration",
                "migration_date": datetime.now().isoformat(),
                "version": "1.0"
            }
        }
        
        try:
            # 检查是否已存在默认Collection
            async with self.db_pool.acquire() as conn:
                existing = await conn.fetchrow("""
                    SELECT id, name, config 
                    FROM knowledge_collections 
                    WHERE config->>'is_default' = 'true'
                    ORDER BY created_at ASC
                    LIMIT 1
                """)
                
                if existing and not self.force:
                    self.default_collection_id = existing['id']
                    logger.info(f"✅ 默认Collection已存在: {existing['name']} (ID: {self.default_collection_id})")
                    return self.default_collection_id
                
                if self.dry_run:
                    logger.info(f"🔍 [DRY-RUN] 将创建默认Collection: {default_config['name']}")
                    self.default_collection_id = "dry-run-collection-id"
                    return self.default_collection_id
                
                # 创建新的默认Collection
                collection_id = str(uuid.uuid4())
                await conn.execute("""
                    INSERT INTO knowledge_collections 
                    (id, name, description, metadata_template, config, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                """, 
                    collection_id,
                    default_config["name"],
                    default_config["description"], 
                    default_config["metadata_template"],
                    json.dumps(default_config["config"])
                )
                
                self.default_collection_id = collection_id
                logger.info(f"✅ 默认Collection创建成功: {default_config['name']} (ID: {collection_id})")
                return collection_id
                
        except Exception as e:
            error_msg = f"创建默认Collection失败: {e}"
            logger.error(f"❌ {error_msg}")
            self.stats["errors"].append(error_msg)
            raise
    
    async def analyze_migration_scope(self) -> Dict[str, int]:
        """分析迁移范围和数据量"""
        logger.info("📊 分析迁移数据范围...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 统计孤立文档（没有collection_id的文档）
                orphaned_docs = await conn.fetchval("""
                    SELECT COUNT(*) 
                    FROM knowledge_documents 
                    WHERE collection_id IS NULL
                """)
                
                # 统计孤立chunks
                orphaned_chunks = await conn.fetchval("""
                    SELECT COUNT(*) 
                    FROM document_chunks dc
                    LEFT JOIN knowledge_documents kd ON dc.document_id = kd.id
                    WHERE kd.collection_id IS NULL
                """)
                
                # 统计孤立embeddings（通过chunks关联）
                orphaned_embeddings = await conn.fetchval("""
                    SELECT COUNT(*) 
                    FROM document_chunks dc
                    LEFT JOIN knowledge_documents kd ON dc.document_id = kd.id
                    WHERE kd.collection_id IS NULL 
                    AND (dc.general_embedding IS NOT NULL OR dc.domain_embedding IS NOT NULL)
                """)
                
                # 统计现有Collection数量
                existing_collections = await conn.fetchval("""
                    SELECT COUNT(*) FROM knowledge_collections
                """)
                
                scope = {
                    "orphaned_documents": orphaned_docs,
                    "orphaned_chunks": orphaned_chunks, 
                    "orphaned_embeddings": orphaned_embeddings,
                    "existing_collections": existing_collections
                }
                
                logger.info("📋 迁移范围分析结果:")
                logger.info(f"   • 孤立文档: {scope['orphaned_documents']} 个")
                logger.info(f"   • 孤立chunks: {scope['orphaned_chunks']} 个")
                logger.info(f"   • 孤立向量: {scope['orphaned_embeddings']} 个")
                logger.info(f"   • 现有Collections: {scope['existing_collections']} 个")
                
                return scope
                
        except Exception as e:
            error_msg = f"分析迁移范围失败: {e}"
            logger.error(f"❌ {error_msg}")
            self.stats["errors"].append(error_msg)
            raise
    
    async def migrate_orphaned_documents(self) -> int:
        """迁移孤立文档到默认Collection"""
        logger.info("📄 开始迁移孤立文档...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 获取所有孤立文档
                orphaned_docs = await conn.fetch("""
                    SELECT id, title, source, created_at
                    FROM knowledge_documents 
                    WHERE collection_id IS NULL
                    ORDER BY created_at ASC
                """)
                
                if not orphaned_docs:
                    logger.info("✅ 没有发现孤立文档，跳过迁移")
                    return 0
                
                logger.info(f"🔄 发现 {len(orphaned_docs)} 个孤立文档，开始迁移...")
                
                if self.dry_run:
                    logger.info(f"🔍 [DRY-RUN] 将迁移 {len(orphaned_docs)} 个文档到默认Collection")
                    return len(orphaned_docs)
                
                # 批量更新文档的collection_id
                doc_ids = [doc['id'] for doc in orphaned_docs]
                
                await conn.execute("""
                    UPDATE knowledge_documents 
                    SET collection_id = $1, updated_at = NOW()
                    WHERE id = ANY($2::uuid[])
                """, self.default_collection_id, doc_ids)
                
                self.stats["documents_migrated"] = len(orphaned_docs)
                logger.info(f"✅ 成功迁移 {len(orphaned_docs)} 个文档到默认Collection")
                
                # 记录迁移详情
                for doc in orphaned_docs[:10]:  # 只记录前10个
                    logger.debug(f"   • 迁移文档: {doc['title']} (ID: {doc['id']})")
                
                if len(orphaned_docs) > 10:
                    logger.debug(f"   • ... 以及其他 {len(orphaned_docs) - 10} 个文档")
                
                return len(orphaned_docs)
                
        except Exception as e:
            error_msg = f"迁移孤立文档失败: {e}"
            logger.error(f"❌ {error_msg}")
            self.stats["errors"].append(error_msg)
            raise
    
    async def migrate_orphaned_chunks(self) -> int:
        """迁移孤立chunks（通过文档关联）"""
        logger.info("🧩 开始迁移孤立chunks...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 统计需要更新的chunks
                orphaned_chunks = await conn.fetchval("""
                    SELECT COUNT(*)
                    FROM document_chunks dc
                    LEFT JOIN knowledge_documents kd ON dc.document_id = kd.id
                    WHERE kd.collection_id = $1 AND dc.collection_id IS NULL
                """, self.default_collection_id)
                
                if orphaned_chunks == 0:
                    logger.info("✅ 没有发现孤立chunks，跳过迁移")
                    return 0
                
                logger.info(f"🔄 发现 {orphaned_chunks} 个孤立chunks，开始迁移...")
                
                if self.dry_run:
                    logger.info(f"🔍 [DRY-RUN] 将迁移 {orphaned_chunks} 个chunks到默认Collection")
                    return orphaned_chunks
                
                # 更新chunks的collection_id
                await conn.execute("""
                    UPDATE document_chunks 
                    SET collection_id = $1, updated_at = NOW()
                    WHERE document_id IN (
                        SELECT id FROM knowledge_documents 
                        WHERE collection_id = $1
                    ) AND collection_id IS NULL
                """, self.default_collection_id)
                
                self.stats["chunks_migrated"] = orphaned_chunks
                logger.info(f"✅ 成功迁移 {orphaned_chunks} 个chunks到默认Collection")
                
                return orphaned_chunks
                
        except Exception as e:
            error_msg = f"迁移孤立chunks失败: {e}"
            logger.error(f"❌ {error_msg}")
            self.stats["errors"].append(error_msg)
            raise
    
    async def update_embedding_metadata(self) -> int:
        """更新向量嵌入的Collection关联"""
        logger.info("🔍 更新向量嵌入的Collection关联...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 统计有向量数据的chunks
                embedding_chunks = await conn.fetchval("""
                    SELECT COUNT(*)
                    FROM document_chunks dc
                    LEFT JOIN knowledge_documents kd ON dc.document_id = kd.id
                    WHERE kd.collection_id = $1 
                    AND (dc.general_embedding IS NOT NULL OR dc.domain_embedding IS NOT NULL)
                """, self.default_collection_id)
                
                if embedding_chunks == 0:
                    logger.info("✅ 没有发现向量数据，跳过更新")
                    return 0
                
                logger.info(f"🔄 发现 {embedding_chunks} 个包含向量的chunks，更新关联...")
                
                if self.dry_run:
                    logger.info(f"🔍 [DRY-RUN] 将更新 {embedding_chunks} 个向量chunks的Collection关联")
                    return embedding_chunks
                
                # 更新向量chunks的元数据，添加collection信息
                await conn.execute("""
                    UPDATE document_chunks 
                    SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                        jsonb_build_object('collection_id', $1, 'migration_updated', NOW())
                    WHERE document_id IN (
                        SELECT id FROM knowledge_documents 
                        WHERE collection_id = $1
                    ) 
                    AND (general_embedding IS NOT NULL OR domain_embedding IS NOT NULL)
                """, self.default_collection_id)
                
                self.stats["embeddings_migrated"] = embedding_chunks
                logger.info(f"✅ 成功更新 {embedding_chunks} 个向量chunks的Collection关联")
                
                return embedding_chunks
                
        except Exception as e:
            error_msg = f"更新向量嵌入关联失败: {e}"
            logger.error(f"❌ {error_msg}")
            self.stats["errors"].append(error_msg)
            raise
    
    async def validate_migration(self) -> bool:
        """验证迁移完整性"""
        logger.info("🔍 验证迁移完整性...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 检查是否还有孤立文档
                orphaned_docs = await conn.fetchval("""
                    SELECT COUNT(*) FROM knowledge_documents WHERE collection_id IS NULL
                """)
                
                # 检查是否还有孤立chunks
                orphaned_chunks = await conn.fetchval("""
                    SELECT COUNT(*) 
                    FROM document_chunks dc
                    LEFT JOIN knowledge_documents kd ON dc.document_id = kd.id
                    WHERE kd.collection_id IS NULL
                """)
                
                # 检查默认Collection的数据统计
                default_stats = await conn.fetchrow("""
                    SELECT 
                        COUNT(DISTINCT kd.id) as documents,
                        COUNT(DISTINCT dc.id) as chunks,
                        COUNT(CASE WHEN dc.general_embedding IS NOT NULL THEN 1 END) as general_vectors,
                        COUNT(CASE WHEN dc.domain_embedding IS NOT NULL THEN 1 END) as domain_vectors
                    FROM knowledge_documents kd
                    LEFT JOIN document_chunks dc ON kd.id = dc.document_id
                    WHERE kd.collection_id = $1
                """, self.default_collection_id)
                
                logger.info("📊 迁移验证结果:")
                logger.info(f"   • 剩余孤立文档: {orphaned_docs} 个")
                logger.info(f"   • 剩余孤立chunks: {orphaned_chunks} 个")
                logger.info(f"   • 默认Collection统计:")
                logger.info(f"     - 文档: {default_stats['documents']} 个")
                logger.info(f"     - 文档块: {default_stats['chunks']} 个")
                logger.info(f"     - 通用向量: {default_stats['general_vectors']} 个")
                logger.info(f"     - 领域向量: {default_stats['domain_vectors']} 个")
                
                # 验证结果
                validation_passed = (orphaned_docs == 0 and orphaned_chunks == 0)
                
                if validation_passed:
                    logger.info("✅ 迁移验证通过：所有数据已成功迁移到Collection架构")
                else:
                    logger.error("❌ 迁移验证失败：仍有孤立数据存在")
                
                return validation_passed
                
        except Exception as e:
            error_msg = f"迁移验证失败: {e}"
            logger.error(f"❌ {error_msg}")
            self.stats["errors"].append(error_msg)
            return False
    
    async def generate_migration_report(self) -> str:
        """生成迁移报告"""
        report_path = f"logs/collection_migration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # 计算执行时间
        if self.stats["start_time"] and self.stats["end_time"]:
            duration = (self.stats["end_time"] - self.stats["start_time"]).total_seconds()
        else:
            duration = 0
        
        report = {
            "migration_info": {
                "default_collection_id": self.default_collection_id,
                "execution_mode": "dry_run" if self.dry_run else "actual",
                "force_mode": self.force,
                "start_time": self.stats["start_time"].isoformat() if self.stats["start_time"] else None,
                "end_time": self.stats["end_time"].isoformat() if self.stats["end_time"] else None,
                "duration_seconds": duration
            },
            "migration_stats": self.stats,
            "system_info": {
                "database_host": settings.DATABASE_URL,
                "migration_script_version": "1.0",
                "python_version": sys.version
            }
        }
        
        try:
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False, default=str)
            
            logger.info(f"📋 迁移报告已生成: {report_path}")
            return report_path
            
        except Exception as e:
            logger.error(f"⚠️  生成迁移报告失败: {e}")
            return ""
    
    async def run_migration(self) -> bool:
        """执行完整的迁移流程"""
        logger.info("🚀 开始Collection数据迁移流程")
        logger.info(f"   模式: {'DRY-RUN' if self.dry_run else 'ACTUAL'}")
        logger.info(f"   强制重建: {'是' if self.force else '否'}")
        
        self.stats["start_time"] = datetime.now()
        
        try:
            # 1. 分析迁移范围
            scope = await self.analyze_migration_scope()
            
            if scope["orphaned_documents"] == 0 and scope["orphaned_chunks"] == 0:
                logger.info("✅ 系统已经完全迁移到Collection架构，无需执行迁移")
                return True
            
            # 2. 创建默认Collection
            await self.create_default_collection()
            
            # 3. 迁移孤立文档
            await self.migrate_orphaned_documents()
            
            # 4. 迁移孤立chunks
            await self.migrate_orphaned_chunks()
            
            # 5. 更新向量嵌入关联
            await self.update_embedding_metadata()
            
            # 6. 验证迁移结果
            if not self.dry_run:
                validation_passed = await self.validate_migration()
                if not validation_passed:
                    logger.error("❌ 迁移验证失败，请检查日志并手动修复")
                    return False
            
            self.stats["end_time"] = datetime.now()
            
            # 7. 生成迁移报告
            await self.generate_migration_report()
            
            logger.info("🎉 Collection数据迁移流程完成！")
            return True
            
        except Exception as e:
            self.stats["end_time"] = datetime.now()
            logger.error(f"❌ 迁移流程失败: {e}")
            self.stats["errors"].append(f"迁移流程失败: {e}")
            
            # 仍然生成报告记录失败信息
            await self.generate_migration_report()
            return False


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="Collection数据迁移脚本")
    parser.add_argument(
        "--dry-run", 
        action="store_true", 
        help="执行模拟运行，不实际修改数据"
    )
    parser.add_argument(
        "--force", 
        action="store_true", 
        help="强制重新创建默认Collection（如果已存在）"
    )
    
    args = parser.parse_args()
    
    migration_manager = CollectionMigrationManager(
        dry_run=args.dry_run, 
        force=args.force
    )
    
    try:
        await migration_manager.initialize()
        success = await migration_manager.run_migration()
        
        if success:
            logger.info("✅ 迁移完成！系统已成功升级到Collection架构")
            return 0
        else:
            logger.error("❌ 迁移失败！请检查日志并手动修复问题")
            return 1
            
    except Exception as e:
        logger.error(f"❌ 迁移脚本执行异常: {e}")
        return 1
        
    finally:
        await migration_manager.cleanup()


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)