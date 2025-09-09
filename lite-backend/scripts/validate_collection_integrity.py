"""
Collection架构完整性验证脚本

用于验证系统的Collection架构是否正确配置和迁移完成。
检查数据一致性、关联关系和潜在问题。

Usage:
    python scripts/validate_collection_integrity.py [--detailed] [--fix-issues]
"""

import asyncio
import argparse
import json
from datetime import datetime
from typing import Dict, List, Any, Tuple
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 导入项目模块
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db_connection

class CollectionIntegrityValidator:
    """Collection架构完整性验证器"""
    
    def __init__(self, detailed: bool = False, fix_issues: bool = False):
        self.detailed = detailed
        self.fix_issues = fix_issues
        self.db_pool = None
        
        # 验证结果
        self.validation_results = {
            "overall_status": "unknown",
            "issues_found": [],
            "warnings": [],
            "fixed_issues": [],
            "statistics": {},
            "timestamp": datetime.now().isoformat()
        }
    
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
    
    async def check_collection_existence(self) -> Tuple[bool, Dict]:
        """检查Collection表和基础数据是否存在"""
        logger.info("🔍 检查Collection基础架构...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 检查knowledge_collections表是否存在
                table_exists = await conn.fetchval("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'knowledge_collections'
                    )
                """)
                
                if not table_exists:
                    issue = "knowledge_collections表不存在"
                    self.validation_results["issues_found"].append(issue)
                    return False, {"table_exists": False}
                
                # 检查Collection数量
                collection_count = await conn.fetchval(
                    "SELECT COUNT(*) FROM knowledge_collections"
                )
                
                # 检查默认Collection
                default_collections = await conn.fetch("""
                    SELECT id, name, config->>'is_default' as is_default
                    FROM knowledge_collections 
                    WHERE config->>'is_default' = 'true'
                """)
                
                result = {
                    "table_exists": True,
                    "total_collections": collection_count,
                    "default_collections": len(default_collections),
                    "default_collection_details": [
                        {"id": row["id"], "name": row["name"]} 
                        for row in default_collections
                    ]
                }
                
                # 验证默认Collection
                if len(default_collections) == 0:
                    warning = "没有找到默认Collection"
                    self.validation_results["warnings"].append(warning)
                    logger.warning(f"⚠️  {warning}")
                elif len(default_collections) > 1:
                    warning = f"存在多个默认Collection ({len(default_collections)}个)"
                    self.validation_results["warnings"].append(warning)
                    logger.warning(f"⚠️  {warning}")
                else:
                    logger.info(f"✅ 默认Collection配置正确: {default_collections[0]['name']}")
                
                logger.info(f"✅ Collection基础架构检查完成: {collection_count} 个Collections")
                return True, result
                
        except Exception as e:
            error = f"Collection基础架构检查失败: {e}"
            self.validation_results["issues_found"].append(error)
            logger.error(f"❌ {error}")
            return False, {}
    
    async def check_document_collection_mapping(self) -> Tuple[bool, Dict]:
        """检查文档的Collection映射关系"""
        logger.info("📄 检查文档Collection映射...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 统计文档Collection分布
                doc_stats = await conn.fetchrow("""
                    SELECT 
                        COUNT(*) as total_documents,
                        COUNT(collection_id) as mapped_documents,
                        COUNT(*) - COUNT(collection_id) as orphaned_documents
                    FROM knowledge_documents
                """)
                
                # 获取Collection分布
                collection_distribution = await conn.fetch("""
                    SELECT 
                        kc.name as collection_name,
                        kc.id as collection_id,
                        COUNT(kd.id) as document_count
                    FROM knowledge_collections kc
                    LEFT JOIN knowledge_documents kd ON kc.id = kd.collection_id
                    GROUP BY kc.id, kc.name
                    ORDER BY document_count DESC
                """)
                
                result = {
                    "total_documents": doc_stats["total_documents"],
                    "mapped_documents": doc_stats["mapped_documents"], 
                    "orphaned_documents": doc_stats["orphaned_documents"],
                    "collection_distribution": [
                        {
                            "collection_name": row["collection_name"],
                            "collection_id": row["collection_id"],
                            "document_count": row["document_count"]
                        }
                        for row in collection_distribution
                    ]
                }
                
                # 验证孤立文档
                if doc_stats["orphaned_documents"] > 0:
                    issue = f"存在 {doc_stats['orphaned_documents']} 个孤立文档（未映射到Collection）"
                    self.validation_results["issues_found"].append(issue)
                    logger.error(f"❌ {issue}")
                    
                    if self.fix_issues:
                        await self._fix_orphaned_documents()
                    
                    return False, result
                else:
                    logger.info("✅ 所有文档都已正确映射到Collection")
                    return True, result
                
        except Exception as e:
            error = f"文档Collection映射检查失败: {e}"
            self.validation_results["issues_found"].append(error)
            logger.error(f"❌ {error}")
            return False, {}
    
    async def check_chunk_collection_consistency(self) -> Tuple[bool, Dict]:
        """检查chunks的Collection一致性"""
        logger.info("🧩 检查chunks Collection一致性...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 检查chunks的Collection映射
                chunk_stats = await conn.fetchrow("""
                    SELECT 
                        COUNT(*) as total_chunks,
                        COUNT(dc.collection_id) as mapped_chunks,
                        COUNT(CASE WHEN dc.collection_id != kd.collection_id THEN 1 END) as inconsistent_chunks,
                        COUNT(CASE WHEN dc.collection_id IS NULL AND kd.collection_id IS NOT NULL THEN 1 END) as null_collection_chunks
                    FROM document_chunks dc
                    LEFT JOIN knowledge_documents kd ON dc.document_id = kd.id
                """)
                
                result = {
                    "total_chunks": chunk_stats["total_chunks"],
                    "mapped_chunks": chunk_stats["mapped_chunks"],
                    "inconsistent_chunks": chunk_stats["inconsistent_chunks"],
                    "null_collection_chunks": chunk_stats["null_collection_chunks"]
                }
                
                issues_found = False
                
                # 检查不一致的chunks
                if chunk_stats["inconsistent_chunks"] > 0:
                    issue = f"存在 {chunk_stats['inconsistent_chunks']} 个chunks的Collection与其文档不一致"
                    self.validation_results["issues_found"].append(issue)
                    logger.error(f"❌ {issue}")
                    issues_found = True
                    
                    if self.fix_issues:
                        await self._fix_inconsistent_chunks()
                
                # 检查Collection为空的chunks
                if chunk_stats["null_collection_chunks"] > 0:
                    issue = f"存在 {chunk_stats['null_collection_chunks']} 个chunks缺少Collection映射"
                    self.validation_results["issues_found"].append(issue)
                    logger.error(f"❌ {issue}")
                    issues_found = True
                    
                    if self.fix_issues:
                        await self._fix_null_collection_chunks()
                
                if not issues_found:
                    logger.info("✅ 所有chunks的Collection映射都正确")
                    return True, result
                else:
                    return False, result
                    
        except Exception as e:
            error = f"chunks Collection一致性检查失败: {e}"
            self.validation_results["issues_found"].append(error)
            logger.error(f"❌ {error}")
            return False, {}
    
    async def check_vector_data_integrity(self) -> Tuple[bool, Dict]:
        """检查向量数据完整性"""
        logger.info("🔍 检查向量数据完整性...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 统计向量数据
                vector_stats = await conn.fetchrow("""
                    SELECT 
                        COUNT(*) as total_chunks,
                        COUNT(general_embedding) as general_vectors,
                        COUNT(domain_embedding) as domain_vectors,
                        COUNT(CASE WHEN general_embedding IS NOT NULL AND domain_embedding IS NOT NULL THEN 1 END) as dual_vectors,
                        COUNT(CASE WHEN general_embedding IS NULL AND domain_embedding IS NULL THEN 1 END) as no_vectors
                    FROM document_chunks dc
                    LEFT JOIN knowledge_documents kd ON dc.document_id = kd.id
                    WHERE kd.collection_id IS NOT NULL
                """)
                
                # 按Collection统计向量数据
                collection_vector_stats = await conn.fetch("""
                    SELECT 
                        kc.name as collection_name,
                        kc.id as collection_id,
                        COUNT(dc.id) as total_chunks,
                        COUNT(dc.general_embedding) as general_vectors,
                        COUNT(dc.domain_embedding) as domain_vectors
                    FROM knowledge_collections kc
                    LEFT JOIN knowledge_documents kd ON kc.id = kd.collection_id
                    LEFT JOIN document_chunks dc ON kd.id = dc.document_id
                    GROUP BY kc.id, kc.name
                    ORDER BY total_chunks DESC
                """)
                
                result = {
                    "total_chunks": vector_stats["total_chunks"],
                    "general_vectors": vector_stats["general_vectors"],
                    "domain_vectors": vector_stats["domain_vectors"],
                    "dual_vectors": vector_stats["dual_vectors"],
                    "no_vectors": vector_stats["no_vectors"],
                    "vector_coverage": {
                        "general": (vector_stats["general_vectors"] / max(vector_stats["total_chunks"], 1)) * 100,
                        "domain": (vector_stats["domain_vectors"] / max(vector_stats["total_chunks"], 1)) * 100
                    },
                    "collection_stats": [
                        {
                            "collection_name": row["collection_name"],
                            "collection_id": row["collection_id"],
                            "total_chunks": row["total_chunks"],
                            "general_vectors": row["general_vectors"],
                            "domain_vectors": row["domain_vectors"]
                        }
                        for row in collection_vector_stats
                    ]
                }
                
                # 检查向量覆盖率
                general_coverage = result["vector_coverage"]["general"]
                domain_coverage = result["vector_coverage"]["domain"]
                
                if general_coverage < 90:
                    warning = f"通用向量覆盖率较低: {general_coverage:.1f}%"
                    self.validation_results["warnings"].append(warning)
                    logger.warning(f"⚠️  {warning}")
                
                if domain_coverage < 80:
                    warning = f"领域向量覆盖率较低: {domain_coverage:.1f}%"
                    self.validation_results["warnings"].append(warning)
                    logger.warning(f"⚠️  {warning}")
                
                logger.info(f"✅ 向量数据统计: 通用向量 {general_coverage:.1f}%, 领域向量 {domain_coverage:.1f}%")
                return True, result
                
        except Exception as e:
            error = f"向量数据完整性检查失败: {e}"
            self.validation_results["issues_found"].append(error)
            logger.error(f"❌ {error}")
            return False, {}
    
    async def check_metadata_template_consistency(self) -> Tuple[bool, Dict]:
        """检查元数据模板一致性"""
        logger.info("📋 检查元数据模板一致性...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 统计模板使用情况
                template_usage = await conn.fetch("""
                    SELECT 
                        kc.metadata_template,
                        COUNT(kc.id) as collection_count,
                        COUNT(kd.id) as document_count
                    FROM knowledge_collections kc
                    LEFT JOIN knowledge_documents kd ON kc.id = kd.collection_id
                    GROUP BY kc.metadata_template
                    ORDER BY collection_count DESC
                """)
                
                # 检查模板定义是否存在
                defined_templates = await conn.fetch("""
                    SELECT id, name, description FROM metadata_templates
                """)
                
                result = {
                    "template_usage": [
                        {
                            "template_name": row["metadata_template"],
                            "collection_count": row["collection_count"],
                            "document_count": row["document_count"]
                        }
                        for row in template_usage
                    ],
                    "defined_templates": [
                        {
                            "id": row["id"],
                            "name": row["name"],
                            "description": row["description"]
                        }
                        for row in defined_templates
                    ]
                }
                
                # 检查未定义的模板
                defined_template_names = {t["id"] for t in result["defined_templates"]}
                used_template_names = {t["template_name"] for t in result["template_usage"]}
                
                undefined_templates = used_template_names - defined_template_names
                
                if undefined_templates:
                    warning = f"使用了未定义的元数据模板: {', '.join(undefined_templates)}"
                    self.validation_results["warnings"].append(warning)
                    logger.warning(f"⚠️  {warning}")
                
                logger.info(f"✅ 元数据模板检查完成: {len(defined_templates)} 个已定义, {len(template_usage)} 种在使用")
                return True, result
                
        except Exception as e:
            error = f"元数据模板一致性检查失败: {e}"
            self.validation_results["issues_found"].append(error)
            logger.error(f"❌ {error}")
            return False, {}
    
    async def _fix_orphaned_documents(self):
        """修复孤立文档"""
        logger.info("🔧 自动修复孤立文档...")
        
        try:
            async with self.db_pool.acquire() as conn:
                # 获取默认Collection
                default_collection = await conn.fetchval("""
                    SELECT id FROM knowledge_collections 
                    WHERE config->>'is_default' = 'true'
                    ORDER BY created_at ASC LIMIT 1
                """)
                
                if not default_collection:
                    logger.error("❌ 无法修复：未找到默认Collection")
                    return
                
                # 修复孤立文档
                updated_count = await conn.fetchval("""
                    UPDATE knowledge_documents 
                    SET collection_id = $1, updated_at = NOW()
                    WHERE collection_id IS NULL
                    RETURNING (SELECT COUNT(*) FROM knowledge_documents WHERE collection_id = $1)
                """, default_collection)
                
                fix_msg = f"已将孤立文档迁移到默认Collection: {updated_count} 个"
                self.validation_results["fixed_issues"].append(fix_msg)
                logger.info(f"✅ {fix_msg}")
                
        except Exception as e:
            logger.error(f"❌ 修复孤立文档失败: {e}")
    
    async def _fix_inconsistent_chunks(self):
        """修复不一致的chunks"""
        logger.info("🔧 自动修复chunks Collection不一致...")
        
        try:
            async with self.db_pool.acquire() as conn:
                updated_count = await conn.fetchval("""
                    UPDATE document_chunks 
                    SET collection_id = kd.collection_id, updated_at = NOW()
                    FROM knowledge_documents kd
                    WHERE document_chunks.document_id = kd.id 
                    AND document_chunks.collection_id != kd.collection_id
                    RETURNING (SELECT COUNT(*) FROM document_chunks)
                """)
                
                fix_msg = f"已修复chunks Collection不一致问题: {updated_count} 个"
                self.validation_results["fixed_issues"].append(fix_msg)
                logger.info(f"✅ {fix_msg}")
                
        except Exception as e:
            logger.error(f"❌ 修复chunks不一致失败: {e}")
    
    async def _fix_null_collection_chunks(self):
        """修复Collection为空的chunks"""
        logger.info("🔧 自动修复chunks缺少Collection映射...")
        
        try:
            async with self.db_pool.acquire() as conn:
                updated_count = await conn.fetchval("""
                    UPDATE document_chunks 
                    SET collection_id = kd.collection_id, updated_at = NOW()
                    FROM knowledge_documents kd
                    WHERE document_chunks.document_id = kd.id 
                    AND document_chunks.collection_id IS NULL
                    AND kd.collection_id IS NOT NULL
                    RETURNING (SELECT COUNT(*) FROM document_chunks)
                """)
                
                fix_msg = f"已修复chunks缺少Collection映射: {updated_count} 个"
                self.validation_results["fixed_issues"].append(fix_msg)
                logger.info(f"✅ {fix_msg}")
                
        except Exception as e:
            logger.error(f"❌ 修复chunks Collection映射失败: {e}")
    
    async def generate_validation_report(self) -> str:
        """生成验证报告"""
        report_path = f"logs/collection_validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # 确定整体状态
        if not self.validation_results["issues_found"]:
            self.validation_results["overall_status"] = "healthy"
        elif self.validation_results["fixed_issues"]:
            self.validation_results["overall_status"] = "fixed"
        else:
            self.validation_results["overall_status"] = "issues_found"
        
        try:
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(self.validation_results, f, indent=2, ensure_ascii=False, default=str)
            
            logger.info(f"📋 验证报告已生成: {report_path}")
            return report_path
            
        except Exception as e:
            logger.error(f"⚠️  生成验证报告失败: {e}")
            return ""
    
    async def run_validation(self) -> bool:
        """运行完整的验证流程"""
        logger.info("🔍 开始Collection架构完整性验证")
        logger.info(f"   详细模式: {'开启' if self.detailed else '关闭'}")
        logger.info(f"   自动修复: {'开启' if self.fix_issues else '关闭'}")
        
        all_passed = True
        
        try:
            # 1. 检查Collection基础架构
            passed, stats = await self.check_collection_existence()
            if not passed:
                all_passed = False
            self.validation_results["statistics"]["collection_existence"] = stats
            
            # 2. 检查文档Collection映射
            passed, stats = await self.check_document_collection_mapping()
            if not passed:
                all_passed = False
            self.validation_results["statistics"]["document_mapping"] = stats
            
            # 3. 检查chunks一致性
            passed, stats = await self.check_chunk_collection_consistency()
            if not passed:
                all_passed = False
            self.validation_results["statistics"]["chunk_consistency"] = stats
            
            # 4. 检查向量数据完整性
            passed, stats = await self.check_vector_data_integrity()
            if not passed:
                all_passed = False
            self.validation_results["statistics"]["vector_integrity"] = stats
            
            # 5. 检查元数据模板一致性
            passed, stats = await self.check_metadata_template_consistency()
            if not passed:
                all_passed = False
            self.validation_results["statistics"]["metadata_consistency"] = stats
            
            # 生成报告
            await self.generate_validation_report()
            
            # 总结
            if all_passed:
                logger.info("🎉 Collection架构验证通过！系统状态良好")
            elif self.validation_results["fixed_issues"]:
                logger.info("🔧 Collection架构验证完成，已自动修复问题")
            else:
                logger.error("❌ Collection架构验证发现问题，需要手动处理")
            
            return all_passed
            
        except Exception as e:
            logger.error(f"❌ 验证流程异常: {e}")
            return False


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="Collection架构完整性验证")
    parser.add_argument(
        "--detailed", 
        action="store_true", 
        help="显示详细信息"
    )
    parser.add_argument(
        "--fix-issues", 
        action="store_true", 
        help="自动修复发现的问题"
    )
    
    args = parser.parse_args()
    
    validator = CollectionIntegrityValidator(
        detailed=args.detailed,
        fix_issues=args.fix_issues
    )
    
    try:
        await validator.initialize()
        success = await validator.run_validation()
        
        return 0 if success else 1
        
    except Exception as e:
        logger.error(f"❌ 验证脚本执行异常: {e}")
        return 1
        
    finally:
        await validator.cleanup()


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)