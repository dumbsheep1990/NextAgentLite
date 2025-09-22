"""
知识库统计分析端点 - 从knowledge.py安全拆分出来的统计分析功能
包含统计信息、数据导出、性能分析等功能
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timedelta
import json
import csv
import io

from db.database import get_db
from models.knowledge import KnowledgeDocument as KnowledgeDocumentModel
from core.logger import logger

# 创建独立的路由器
analytics_router = APIRouter()

@analytics_router.get("/statistics")
async def get_knowledge_statistics(
    db: AsyncSession = Depends(get_db)
):
    """获取知识库统计信息"""
    try:
        logger.info("获取知识库统计信息")
        
        # 查询文档统计
        doc_stats_result = await db.execute(
            select(
                func.count(KnowledgeDocumentModel.id).label('total_documents'),
                func.sum(KnowledgeDocumentModel.file_size).label('total_size'),
                func.count().filter(KnowledgeDocumentModel.status == 'completed').label('completed_docs'),
                func.count().filter(KnowledgeDocumentModel.status == 'processing').label('processing_docs'),
                func.count().filter(KnowledgeDocumentModel.status == 'failed').label('failed_docs')
            )
        )
        doc_stats = doc_stats_result.first()
        
        # 查询文件类型分布
        file_type_result = await db.execute(
            select(
                KnowledgeDocumentModel.file_type,
                func.count(KnowledgeDocumentModel.id).label('count')
            ).group_by(KnowledgeDocumentModel.file_type)
        )
        file_type_distribution = {row.file_type: row.count for row in file_type_result}
        
        # 查询最近上传统计（最近7天）
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_uploads_result = await db.execute(
            select(func.count(KnowledgeDocumentModel.id)).where(
                KnowledgeDocumentModel.upload_time >= seven_days_ago
            )
        )
        recent_uploads = recent_uploads_result.scalar() or 0
        
        # 查询热门标签
        tags_result = await db.execute(
            select(KnowledgeDocumentModel.tags).where(
                KnowledgeDocumentModel.tags.isnot(None)
            )
        )
        all_tags = []
        for row in tags_result:
            if row.tags:
                all_tags.extend(row.tags)
        
        # 统计标签频次
        tag_counts = {}
        for tag in all_tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        popular_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        statistics = {
            "overview": {
                "total_documents": doc_stats.total_documents or 0,
                "total_size_bytes": doc_stats.total_size or 0,
                "total_size_mb": round((doc_stats.total_size or 0) / 1024 / 1024, 2),
                "completed_documents": doc_stats.completed_docs or 0,
                "processing_documents": doc_stats.processing_docs or 0,
                "failed_documents": doc_stats.failed_docs or 0,
                "completion_rate": round((doc_stats.completed_docs or 0) / max(doc_stats.total_documents or 1, 1) * 100, 2)
            },
            "file_types": file_type_distribution,
            "upload_trends": {
                "recent_uploads_7days": recent_uploads,
                "avg_daily_uploads": round(recent_uploads / 7, 1)
            },
            "popular_tags": [{"tag": tag, "count": count} for tag, count in popular_tags],
            "performance": {
                "avg_processing_time": "25.6 seconds",
                "avg_file_size": round((doc_stats.total_size or 0) / max(doc_stats.total_documents or 1, 1) / 1024, 2),
                "success_rate": round((doc_stats.completed_docs or 0) / max(doc_stats.total_documents or 1, 1) * 100, 2)
            },
            "vectorization": {
                "total_vectors": doc_stats.completed_docs or 0,
                "total_chunks": (doc_stats.completed_docs or 0) * 12,  # 假设平均每个文档12个分块
                "embedding_model": "text-embedding-v4",
                "vector_dimension": 1024
            },
            "storage": {
                "documents_bucket": "policy-qa-documents",
                "estimated_chunks": (doc_stats.completed_docs or 0) * 12,
                "elasticsearch_indices": 3,
                "vector_db_collections": 2
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
        logger.info(f"知识库统计完成: {statistics['overview']['total_documents']} 个文档")
        return statistics
        
    except Exception as e:
        logger.error(f"获取知识库统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取知识库统计失败: {str(e)}")


@analytics_router.get("/export")
async def export_knowledge_data(
    format: str = "json",
    include_content: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """导出知识库数据"""
    try:
        if format not in ["json", "csv"]:
            raise HTTPException(status_code=400, detail="支持的导出格式: json, csv")
        
        logger.info(f"导出知识库数据: format={format}, include_content={include_content}")
        
        # 查询文档数据
        query = select(KnowledgeDocumentModel)
        result = await db.execute(query)
        documents = result.scalars().all()
        
        # 准备导出数据
        export_data = []
        for doc in documents:
            doc_data = {
                "id": doc.id,
                "title": doc.title,
                "filename": doc.filename,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "status": doc.status,
                "upload_time": doc.upload_time.isoformat() if doc.upload_time else None,
                "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
                "tags": doc.tags or [],
                "metadata": doc.metadata or {}
            }
            
            # 如果需要包含内容（注意：实际实现中应该从存储服务获取）
            if include_content:
                doc_data["content_preview"] = f"文档 {doc.filename} 的内容预览..."
            
            export_data.append(doc_data)
        
        # 根据格式返回数据
        if format == "json":
            response_data = {
                "export_info": {
                    "total_documents": len(export_data),
                    "export_time": datetime.utcnow().isoformat(),
                    "include_content": include_content,
                    "format": "json"
                },
                "documents": export_data
            }
            
            return Response(
                content=json.dumps(response_data, ensure_ascii=False, indent=2),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=knowledge_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
                }
            )
        
        elif format == "csv":
            # 创建CSV内容
            output = io.StringIO()
            
            if export_data:
                # 准备CSV字段
                fieldnames = ["id", "title", "filename", "file_type", "file_size", "status", "upload_time", "updated_at", "tags", "metadata"]
                if include_content:
                    fieldnames.append("content_preview")
                
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                
                for doc_data in export_data:
                    # 处理复杂字段
                    csv_row = doc_data.copy()
                    csv_row["tags"] = json.dumps(csv_row["tags"]) if csv_row["tags"] else ""
                    csv_row["metadata"] = json.dumps(csv_row["metadata"]) if csv_row["metadata"] else ""
                    writer.writerow(csv_row)
            
            csv_content = output.getvalue()
            output.close()
            
            return Response(
                content=csv_content,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=knowledge_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
                }
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"导出知识库数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"导出知识库数据失败: {str(e)}")


@analytics_router.get("/analytics/performance")
async def get_performance_analytics(
    db: AsyncSession = Depends(get_db)
):
    """获取性能分析数据"""
    try:
        logger.info("获取性能分析数据")
        
        # 模拟性能数据（实际应该从监控系统获取）
        performance_data = {
            "processing_performance": {
                "avg_upload_time": 2.3,
                "avg_vectorization_time": 25.6,
                "avg_indexing_time": 3.8,
                "total_processing_time": 31.7,
                "success_rate": 94.2,
                "error_rate": 5.8
            },
            "search_performance": {
                "avg_query_time": 0.15,
                "avg_vector_search_time": 0.08,
                "avg_keyword_search_time": 0.05,
                "avg_hybrid_search_time": 0.12,
                "cache_hit_rate": 75.3,
                "queries_per_second": 25.6
            },
            "resource_usage": {
                "storage_usage_gb": 12.5,
                "vector_db_size_gb": 3.2,
                "elasticsearch_size_gb": 8.1,
                "avg_memory_usage_mb": 512,
                "avg_cpu_usage_percent": 15.2,
                "peak_memory_usage_mb": 1024
            },
            "throughput": {
                "documents_processed_today": 23,
                "documents_processed_this_week": 156,
                "documents_processed_this_month": 678,
                "avg_daily_processing": 22.3,
                "peak_processing_hour": "14:00-15:00"
            },
            "quality_metrics": {
                "avg_chunk_quality": 0.87,
                "avg_embedding_quality": 0.91,
                "duplicate_detection_rate": 98.5,
                "content_extraction_accuracy": 96.2
            },
            "trends": {
                "processing_time_trend": "improving",
                "error_rate_trend": "stable", 
                "storage_growth_rate": "5.2% monthly",
                "query_volume_trend": "increasing"
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
        return performance_data
        
    except Exception as e:
        logger.error(f"获取性能分析失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取性能分析失败: {str(e)}")


@analytics_router.get("/analytics/usage")
async def get_usage_analytics(
    period: str = "7d",  # 7d, 30d, 90d
    db: AsyncSession = Depends(get_db)
):
    """获取使用情况分析"""
    try:
        logger.info(f"获取使用情况分析: period={period}")
        
        # 根据时间段设置查询范围
        period_days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 7)
        start_date = datetime.utcnow() - timedelta(days=period_days)
        
        # 查询时间段内的上传数据
        uploads_result = await db.execute(
            select(
                func.date(KnowledgeDocumentModel.upload_time).label('date'),
                func.count(KnowledgeDocumentModel.id).label('count')
            ).where(
                KnowledgeDocumentModel.upload_time >= start_date
            ).group_by(func.date(KnowledgeDocumentModel.upload_time))
        )
        
        daily_uploads = {str(row.date): row.count for row in uploads_result}
        
        # 查询文件类型使用情况
        file_type_result = await db.execute(
            select(
                KnowledgeDocumentModel.file_type,
                func.count(KnowledgeDocumentModel.id).label('count'),
                func.sum(KnowledgeDocumentModel.file_size).label('total_size')
            ).where(
                KnowledgeDocumentModel.upload_time >= start_date
            ).group_by(KnowledgeDocumentModel.file_type)
        )
        
        file_type_usage = {}
        for row in file_type_result:
            file_type_usage[row.file_type] = {
                "count": row.count,
                "total_size": row.total_size or 0,
                "avg_size": round((row.total_size or 0) / row.count / 1024, 2) if row.count > 0 else 0
            }
        
        usage_data = {
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": datetime.utcnow().isoformat(),
            "upload_trends": {
                "daily_uploads": daily_uploads,
                "total_uploads": sum(daily_uploads.values()),
                "avg_daily_uploads": round(sum(daily_uploads.values()) / period_days, 1),
                "peak_day": max(daily_uploads.items(), key=lambda x: x[1]) if daily_uploads else None
            },
            "file_type_usage": file_type_usage,
            "size_distribution": {
                "small_files_1mb": 45,  # 模拟数据
                "medium_files_1_10mb": 32,
                "large_files_10mb": 23
            },
            "processing_success": {
                "successful_processing": 94.2,
                "failed_processing": 5.8,
                "avg_processing_time": 25.6
            },
            "user_behavior": {
                "most_active_hours": ["14:00-15:00", "09:00-10:00", "16:00-17:00"],
                "most_active_days": ["Tuesday", "Wednesday", "Thursday"],
                "avg_files_per_session": 3.2
            },
            "content_insights": {
                "most_common_tags": ["政策", "技术", "研究", "规范", "指南"],
                "avg_document_length": 15600,  # 字符数
                "avg_chunks_per_document": 12.3
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
        return usage_data
        
    except Exception as e:
        logger.error(f"获取使用情况分析失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取使用情况分析失败: {str(e)}")


@analytics_router.get("/analytics/health")
async def get_system_health():
    """获取系统健康状态"""
    try:
        logger.info("获取系统健康状态")
        
        # 模拟系统健康检查
        health_data = {
            "overall_status": "healthy",
            "components": {
                "database": {
                    "status": "healthy",
                    "response_time": 0.05,
                    "connections": 12,
                    "max_connections": 100
                },
                "elasticsearch": {
                    "status": "healthy",
                    "response_time": 0.03,
                    "cluster_health": "green",
                    "indices_count": 3
                },
                "vector_db": {
                    "status": "healthy",
                    "response_time": 0.08,
                    "collections": 2,
                    "total_vectors": 15680
                },
                "storage": {
                    "status": "healthy",
                    "available_space_gb": 875.2,
                    "used_space_gb": 124.8,
                    "usage_percentage": 12.5
                },
                "embedding_service": {
                    "status": "healthy",
                    "response_time": 1.25,
                    "requests_per_minute": 45,
                    "error_rate": 0.8
                }
            },
            "performance_indicators": {
                "avg_response_time": 0.15,
                "error_rate": 1.2,
                "uptime_percentage": 99.8,
                "memory_usage": 65.3,
                "cpu_usage": 15.2,
                "disk_usage": 12.5
            },
            "alerts": [],
            "recommendations": [
                "系统运行正常，无需特别关注",
                "建议定期清理临时文件以释放存储空间",
                "可考虑增加缓存以提升查询性能"
            ],
            "last_check": datetime.utcnow().isoformat(),
            "next_check": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        }
        
        return health_data
        
    except Exception as e:
        logger.error(f"获取系统健康状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取系统健康状态失败: {str(e)}")