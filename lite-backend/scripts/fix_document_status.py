#!/usr/bin/env python3
"""
修复文档状态一致性问题
将所有 'completed' 状态统一改为 'vectorized'
"""

import asyncio
import json
from sqlalchemy import text, select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from models.knowledge import KnowledgeDocument as KnowledgeDocumentModel
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fix_document_status():
    """修复文档状态一致性"""
    
    async for db in get_db():
        try:
            # 1. 获取当前状态统计
            logger.info("=== 修复前的状态分布 ===")
            status_query = select(
                KnowledgeDocumentModel.status,
                func.count(KnowledgeDocumentModel.id).label('count')
            ).group_by(KnowledgeDocumentModel.status)
            
            result = await db.execute(status_query)
            status_stats = result.all()
            
            for status, count in status_stats:
                logger.info(f"状态 '{status}': {count} 个文档")
            
            # 2. 更新 status 字段从 completed 到 vectorized
            update_query = update(KnowledgeDocumentModel).where(
                KnowledgeDocumentModel.status == 'completed'
            ).values(
                status='vectorized',
                updated_at=func.now()
            )
            
            result = await db.execute(update_query)
            updated_count = result.rowcount
            await db.commit()
            
            logger.info(f"\n已更新 {updated_count} 个文档的状态从 'completed' 改为 'vectorized'")
            
            # 3. 处理 vector_status JSON 字段
            logger.info("\n=== 处理 vector_status JSON 字段 ===")
            
            # 查找需要更新的记录
            docs_query = select(KnowledgeDocumentModel).where(
                KnowledgeDocumentModel.vector_status.isnot(None)
            )
            docs_result = await db.execute(docs_query)
            documents = docs_result.scalars().all()
            
            json_updated_count = 0
            for doc in documents:
                if doc.vector_status:
                    try:
                        vector_status = doc.vector_status if isinstance(doc.vector_status, dict) else json.loads(doc.vector_status)
                        if vector_status.get('status') == 'completed':
                            vector_status['status'] = 'vectorized'
                            doc.vector_status = vector_status
                            json_updated_count += 1
                    except Exception as e:
                        logger.warning(f"处理文档 {doc.id} 的 vector_status 时出错: {e}")
            
            if json_updated_count > 0:
                await db.commit()
                logger.info(f"已更新 {json_updated_count} 个文档的 vector_status JSON 字段")
            
            # 4. 显示修复后的状态分布
            logger.info("\n=== 修复后的状态分布 ===")
            result = await db.execute(status_query)
            status_stats = result.all()
            
            total_docs = sum(count for _, count in status_stats)
            for status, count in status_stats:
                percentage = (count / total_docs * 100) if total_docs > 0 else 0
                logger.info(f"状态 '{status}': {count} 个文档 ({percentage:.1f}%)")
            
            # 5. 检查是否还有不一致的情况
            logger.info("\n=== 一致性检查 ===")
            
            # 检查是否还有 completed 状态
            check_query = select(func.count(KnowledgeDocumentModel.id)).where(
                KnowledgeDocumentModel.status == 'completed'
            )
            result = await db.execute(check_query)
            completed_count = result.scalar()
            
            if completed_count == 0:
                logger.info("✅ 所有文档状态已统一，不再有 'completed' 状态")
            else:
                logger.warning(f"⚠️ 仍有 {completed_count} 个文档使用 'completed' 状态")
            
            # 6. 显示当前使用的状态值
            logger.info("\n=== 当前系统使用的状态值 ===")
            logger.info("标准状态值: pending, processing, vectorized, failed, graph_extracted")
            
            return True
            
        except Exception as e:
            logger.error(f"修复过程中出现错误: {e}")
            await db.rollback()
            return False
        finally:
            await db.close()

async def main():
    """主函数"""
    logger.info("开始修复文档状态一致性问题...")
    logger.info("=" * 50)
    
    success = await fix_document_status()
    
    if success:
        logger.info("\n✅ 修复完成！")
        logger.info("建议：")
        logger.info("1. 检查前端代码，确保使用 'vectorized' 而不是 'completed'")
        logger.info("2. 更新后端代码，统一使用 'vectorized' 状态")
        logger.info("3. 考虑添加数据库约束以防止未来出现不一致")
    else:
        logger.error("\n❌ 修复失败，请检查错误日志")

if __name__ == "__main__":
    asyncio.run(main())