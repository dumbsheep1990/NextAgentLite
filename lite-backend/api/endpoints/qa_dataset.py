"""
QA数据集API端点 - 处理Excel格式的问答数据集管理
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query
from typing import List, Optional, Dict, Any
import uuid

from service.qa_dataset_service import qa_dataset_service
from core.logger import logger

router = APIRouter()


@router.post("/upload", response_model=Dict[str, Any])
async def upload_qa_dataset(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    collection_id: Optional[str] = Form(None)
):
    """
    上传QA数据集Excel文件
    
    Args:
        file: Excel文件(.xlsx/.xls)
        title: 数据集标题
        description: 数据集描述
        category: 数据集分类
        collection_id: 所属知识库ID
    
    Returns:
        包含数据集ID和状态的响应
    """
    try:
        # 验证文件类型
        if not file.filename:
            raise HTTPException(status_code=400, detail="文件名不能为空")
        
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="仅支持Excel文件格式(.xlsx/.xls)")
        
        # 检查文件大小（限制50MB）
        MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
        if file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="文件大小不能超过50MB")
        
        # 读取文件内容
        file_data = await file.read()
        if not file_data:
            raise HTTPException(status_code=400, detail="文件内容为空")
        
        # 验证知识库ID是否存在
        if collection_id:
            from db.database import get_async_session
            from db.repositories.knowledge_repository import KnowledgeRepository
            
            async with get_async_session() as session:
                knowledge_repo = KnowledgeRepository(session)
                collection = await knowledge_repo.get_collection_by_id(collection_id)
                if not collection:
                    raise HTTPException(status_code=400, detail="指定的知识库不存在")

        # 上传并处理
        result = await qa_dataset_service.upload_qa_dataset(
            file_data=file_data,
            filename=file.filename,
            title=title,
            description=description,
            category=category,
            collection_id=collection_id
        )
        
        logger.info(f"QA数据集上传成功: {result['dataset_id']}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"上传QA数据集失败: {e}")
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")


@router.get("/list", response_model=Dict[str, Any])
async def list_qa_datasets(
    collection_id: Optional[str] = Query(None, description="筛选知识库ID"),
    status: Optional[str] = Query(None, description="筛选状态: pending/processing/completed/failed"),
    limit: int = Query(50, ge=1, le=100, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量")
):
    """
    获取QA数据集列表
    
    Args:
        collection_id: 筛选知识库ID
        status: 筛选状态
        limit: 返回数量限制
        offset: 偏移量
    
    Returns:
        包含QA数据集列表和分页信息的响应
    """
    try:
        datasets = await qa_dataset_service.get_qa_datasets(
            collection_id=collection_id,
            status=status
        )
        
        # 应用分页
        total = len(datasets)
        paginated_datasets = datasets[offset:offset + limit]
        
        return {
            "total": total,
            "datasets": paginated_datasets,
            "limit": limit,
            "offset": offset,
            "collection_id": collection_id
        }
        
    except Exception as e:
        logger.error(f"获取QA数据集列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取列表失败: {str(e)}")


from pydantic import BaseModel, Field

class CustomQACreate(BaseModel):
    kb_id: str = Field(..., description="知识库ID")
    question: str
    answer: str
    keywords: Optional[List[str]] = []
    category: Optional[str] = "自定义问答"


@router.get("/{dataset_id}/qa-hits", response_model=Dict[str, Any])
async def get_qa_hits(dataset_id: str, limit: int = Query(3, ge=1, le=50)):
    """返回该数据集下各问答最近命中的查询（每条最多 limit 条）"""
    try:
        # 校验UUID
        try:
            uuid.UUID(dataset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的数据集ID格式")
        
        from db.database import get_async_session
        from sqlalchemy import text
        async with get_async_session() as session:
            sql = text(
                """
                SELECT h.qa_pair_id, h.query, h.created_at
                FROM qa_pair_hits h
                JOIN qa_pairs p ON p.id = h.qa_pair_id
                WHERE p.dataset_id = :ds
                ORDER BY h.created_at DESC
                """
            )
            result = await session.execute(sql, {"ds": dataset_id})
            rows = result.fetchall()
            out: Dict[str, List[Dict[str, Any]]] = {}
            for r in rows:
                qid = str(r[0])
                lst = out.setdefault(qid, [])
                if len(lst) < limit:
                    created = r[2].isoformat() if r[2] else None
                    lst.append({"query": r[1], "created_at": created})
            return {"dataset_id": dataset_id, "hits": out}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取QA命中记录失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取命中记录失败: {e}")


@router.post("/custom/add", response_model=Dict[str, Any])
async def add_custom_qa(item: CustomQACreate):
    """为指定知识库添加一条自定义问答（存入qa_datasets/qa_pairs，置顶自定义路径）"""
    try:
        from db.database import get_async_session
        from models.qa_dataset import QADataset, QAPair
        from sqlalchemy import select
        from service.qa_routing_service import qa_routing_service

        # 1) 确保存在手工数据集（kb:{kb_id}:manual_custom）
        async with get_async_session() as session:
            # 查找现有数据集
            result = await session.execute(select(QADataset).where(QADataset.collection_id == item.kb_id))
            datasets = result.scalars().all()
            manual_ds = None
            for ds in datasets:
                meta = ds.dataset_metadata or {}
                if str(meta.get('tag')) == 'manual_custom':
                    manual_ds = ds
                    break
            if not manual_ds:
                manual_ds = QADataset(
                    title=f"自定义问答（{item.kb_id}）",
                    description="手工添加的问答数据集",
                    category="manual_custom",
                    collection_id=item.kb_id,
                    file_path=f"manual_custom/{item.kb_id}",
                    file_name="manual_custom.csv",
                    file_size=0,
                    status="completed",
                    total_qa_pairs=0,
                    processed_qa_pairs=0,
                    categories_count=0,
                    vectorization_status="pending",
                    dataset_metadata={"tag": "manual_custom"}
                )
                session.add(manual_ds)
                await session.commit()
                await session.refresh(manual_ds)

            # 2) 插入问答对（keywords 放入 qa_metadata）
            qa = QAPair(
                dataset_id=manual_ds.id,
                category=item.category or "自定义问答",
                question=item.question,
                answer=item.answer,
                qa_metadata={"keywords": item.keywords or []}
            )
            session.add(qa)
            # 更新数据集统计（最小实现）
            manual_ds.total_qa_pairs = (manual_ds.total_qa_pairs or 0) + 1
            await session.commit()
            await session.refresh(qa)

        # 3) 向量化新增问答（仅9050，无回退；失败则报错）
        try:
            from service.llm_config_gateway_client import (
                get_llm_config_gateway_client, get_default_embedding_config
            )
            client = await get_llm_config_gateway_client()
            default_cfg = await get_default_embedding_config()
            if not default_cfg:
                raise HTTPException(status_code=500, detail="向量化失败：未配置默认embedding模型（9050）")
            model_id, _provider = default_cfg
            resp = await client.create_embeddings(model_id, [qa.question])
            if resp and resp.get('error'):
                # 透传网关错误细节，便于定位（例如上游403: Model disabled等）
                status = resp.get('status')
                body = resp.get('body')
                raise HTTPException(status_code=500, detail=f"向量化失败：网关返回 {status}: {body}")
            data = (resp or {}).get('data') or []
            if not data or not data[0].get('embedding'):
                raise HTTPException(status_code=500, detail="向量化失败：网关未返回embedding结果")
            vectors = [data[0]['embedding']]
            await qa_dataset_service._save_qa_vectors_to_es_batch([qa], vectors)
        except HTTPException:
            raise
        except Exception as ve:
            raise HTTPException(status_code=500, detail=f"向量化失败：{ve}")

        return {
            "success": True,
            "dataset_id": str(manual_ds.id),
            "qa_id": str(qa.id)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"新增自定义问答失败: {e}")
        raise HTTPException(status_code=500, detail=f"新增失败: {str(e)}")


@router.delete("/qa-pairs/{qa_id}", response_model=Dict[str, Any])
async def delete_qa_pair(qa_id: str):
    """删除单条自定义问答（同时不处理ES删除，简单先删DB）"""
    try:
        from db.database import get_async_session
        from db.repositories.qa_dataset_repository import QAPairRepository
        async with get_async_session() as session:
            repo = QAPairRepository(session)
            ok = await repo.delete(qa_id)
            if not ok:
                raise HTTPException(status_code=500, detail="删除失败")
        return {"success": True, "qa_id": qa_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除问答对异常: {e}")
        raise HTTPException(status_code=500, detail=f"删除异常: {e}")


class QAHitPayload(BaseModel):
    step: int = Field(default=1, description="自增步长")


@router.post("/qa-pairs/{qa_id}/hit", response_model=Dict[str, Any])
async def hit_qa_pair(qa_id: str, payload: QAHitPayload):
    """自增 usage_count 统计命中次数"""
    try:
        from db.database import get_async_session
        from db.repositories.qa_dataset_repository import QAPairRepository
        async with get_async_session() as session:
            repo = QAPairRepository(session)
            ok = await repo.increment_usage(qa_id, step=payload.step)
            if not ok:
                raise HTTPException(status_code=500, detail="更新命中次数失败")
        return {"success": True, "qa_id": qa_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新命中次数异常: {e}")
        raise HTTPException(status_code=500, detail=f"更新命中次数异常: {e}")


@router.get("/{dataset_id}/detail", response_model=Dict[str, Any])
async def get_qa_dataset_detail(dataset_id: str):
    """
    获取QA数据集详情
    
    Args:
        dataset_id: 数据集ID
    
    Returns:
        数据集详细信息
    """
    try:
        # 验证UUID格式
        try:
            uuid.UUID(dataset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的数据集ID格式")
        
        dataset = await qa_dataset_service.get_qa_dataset_detail(dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="数据集不存在")
        
        return dataset
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取QA数据集详情失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取详情失败: {str(e)}")


@router.get("/{dataset_id}/qa-pairs", response_model=Dict[str, Any])
async def get_qa_pairs(
    dataset_id: str,
    category: Optional[str] = Query(None, description="分类筛选"),
    limit: int = Query(20, ge=1, le=10000, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量")
):
    """
    获取数据集的问答对列表
    
    Args:
        dataset_id: 数据集ID
        category: 分类筛选
        limit: 返回数量限制
        offset: 偏移量
    
    Returns:
        问答对列表
    """
    try:
        # 验证UUID格式
        try:
            uuid.UUID(dataset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的数据集ID格式")
        
        # 验证数据集是否存在
        dataset = await qa_dataset_service.get_qa_dataset_detail(dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="数据集不存在")
        
        from db.database import get_async_session
        from db.repositories.qa_dataset_repository import QAPairRepository
        
        async with get_async_session() as session:
            qa_pair_repo = QAPairRepository(session)
            
            if category:
                # 对于分类查询，先获取总数
                all_pairs = await qa_pair_repo.get_by_category(dataset_id, category)
                total = len(all_pairs)
                paginated_pairs = all_pairs[offset:offset + limit]
            else:
                # 获取总数（优化：不查询具体内容）
                stats = await qa_pair_repo.get_statistics_by_dataset(dataset_id)
                total = stats["total_qa_pairs"]
                
                # 直接分页查询
                paginated_pairs = await qa_pair_repo.get_by_dataset_id(dataset_id, limit, offset)
            
            # 转换为字典格式
            pairs_data = []
            for pair in paginated_pairs:
                pairs_data.append({
                    "id": str(pair.id),
                    "category": pair.category,
                    "question": pair.question,
                    "answer": pair.answer,
                    "row_number": pair.row_number,
                    "source_sheet": pair.source_sheet,
                    "vector_status": pair.vector_status,
                    "quality_score": pair.quality_score,
                    "is_validated": pair.is_validated,
                    "usage_count": pair.usage_count,
                    "created_at": pair.created_at.isoformat(),
                    "updated_at": pair.updated_at.isoformat()
                })
            
            return {
                "total": total,
                "qa_pairs": pairs_data,
                "limit": limit,
                "offset": offset,
                "dataset_id": dataset_id,
                "category": category
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取问答对列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取问答对失败: {str(e)}")


@router.delete("/{dataset_id}")
async def delete_qa_dataset(dataset_id: str):
    """
    删除QA数据集
    
    Args:
        dataset_id: 数据集ID
    
    Returns:
        删除结果
    """
    try:
        # 验证UUID格式
        try:
            uuid.UUID(dataset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的数据集ID格式")
        
        # 验证数据集是否存在
        dataset = await qa_dataset_service.get_qa_dataset_detail(dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="数据集不存在")
        
        from db.database import get_async_session
        from db.repositories.qa_dataset_repository import QADatasetRepository
        from service.storage_service import storage_service
        from service.enhanced_task_manager import enhanced_task_manager
        from sqlalchemy import text
        
        # 首先取消该数据集相关的所有处理任务
        try:
            # 查询数据库获取该数据集相关的所有未完成任务
            async with get_async_session() as task_session:
                query = text("""
                    SELECT id FROM task_queue 
                    WHERE (task_data::jsonb ->> 'dataset_id' = :dataset_id 
                           OR task_data::jsonb ->> 'qa_dataset_id' = :dataset_id)
                    AND status IN ('pending', 'running')
                """)
                result = await task_session.execute(query, {"dataset_id": dataset_id})
                task_ids = [row.id for row in result.fetchall()]
            
            cancelled_count = 0
            for task_id in task_ids:
                success = await enhanced_task_manager.cancel_task(task_id)
                if success:
                    cancelled_count += 1
            
            if cancelled_count > 0:
                logger.info(f"已取消QA数据集 {dataset_id} 相关的 {cancelled_count} 个处理任务")
                
        except Exception as e:
            logger.warning(f"取消QA数据集相关任务时出错: {e}")
        
        async with get_async_session() as session:
            dataset_repo = QADatasetRepository(session)
            
            # 删除存储中的文件
            try:
                # 使用配置中定义的文档桶名
                from service.storage_service import storage_service
                bucket_name = storage_service.config.documents_bucket
                await storage_service.delete_file(bucket_name, dataset["file_path"])
                logger.info(f"删除存储文件成功: {dataset['file_path']}")
            except Exception as e:
                logger.warning(f"删除存储文件失败: {e}")
            
            # 删除ES中的向量数据
            try:
                from db.database import get_elasticsearch_client
                from db.elasticsearch_qa_dataset_mappings import QA_PAIRS_VECTOR_INDEX
                
                es_client = get_elasticsearch_client()
                
                # 删除该数据集的所有向量数据
                delete_query = {
                    "query": {
                        "term": {
                            "dataset_id": dataset_id
                        }
                    }
                }
                
                await es_client.delete_by_query(
                    index=QA_PAIRS_VECTOR_INDEX,
                    body=delete_query
                )
                logger.info(f"删除ES向量数据成功: {dataset_id}")
                
            except Exception as e:
                logger.warning(f"删除ES向量数据失败: {e}")
            
            # 删除数据库记录（级联删除问答对和分类）
            delete_success = await dataset_repo.delete(dataset_id)
            if not delete_success:
                raise HTTPException(status_code=500, detail="数据库删除失败")
            logger.info(f"删除QA数据集成功: {dataset_id}")
        
        return {
            "success": True,
            "message": "数据集删除成功",
            "dataset_id": dataset_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除QA数据集失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")


@router.post("/{dataset_id}/reprocess")
async def reprocess_qa_dataset(dataset_id: str):
    """
    重新处理QA数据集
    
    Args:
        dataset_id: 数据集ID
    
    Returns:
        重新处理结果
    """
    try:
        # 验证UUID格式
        try:
            uuid.UUID(dataset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的数据集ID格式")
        
        # 验证数据集是否存在
        dataset = await qa_dataset_service.get_qa_dataset_detail(dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="数据集不存在")
        
        # 检查当前状态
        if dataset["status"] == "processing":
            raise HTTPException(status_code=400, detail="数据集正在处理中，请稍后再试")
        
        from db.database import get_async_session
        from db.repositories.qa_dataset_repository import QADatasetRepository, QAPairRepository
        import asyncio
        
        async with get_async_session() as session:
            dataset_repo = QADatasetRepository(session)
            qa_pair_repo = QAPairRepository(session)
            
            # 重置状态
            await dataset_repo.update_processing_status(dataset_id, "pending")
            
            # 删除现有的问答对数据
            existing_pairs = await qa_pair_repo.get_by_dataset_id(dataset_id)
            for pair in existing_pairs:
                await qa_pair_repo.delete(str(pair.id))
            
            logger.info(f"清理现有数据完成，开始重新处理: {dataset_id}")
        
        # 启动异步重新处理
        asyncio.create_task(qa_dataset_service._process_qa_dataset_async(dataset_id))
        
        return {
            "success": True,
            "message": "已开始重新处理数据集",
            "dataset_id": dataset_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"重新处理QA数据集失败: {e}")
        raise HTTPException(status_code=500, detail=f"重新处理失败: {str(e)}")


@router.get("/{dataset_id}/processing-status")
async def get_processing_status(dataset_id: str):
    """
    获取QA数据集处理状态
    
    Args:
        dataset_id: 数据集ID
    
    Returns:
        处理状态信息
    """
    try:
        # 验证UUID格式
        try:
            uuid.UUID(dataset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的数据集ID格式")
        
        dataset = await qa_dataset_service.get_qa_dataset_detail(dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="数据集不存在")
        
        return {
            "dataset_id": dataset_id,
            "status": dataset["status"],
            "vectorization_status": dataset["vectorization_status"],
            "total_qa_pairs": dataset["total_qa_pairs"],
            "vectorized_qa_pairs": dataset["vectorized_qa_pairs"],
            "categories_count": dataset["categories_count"],
            "processing_logs": dataset.get("processing_logs", {}),
            "updated_at": dataset["updated_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取处理状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取状态失败: {str(e)}")


@router.get("/popular-questions", response_model=Dict[str, Any])
async def get_popular_questions(
    limit: int = Query(5, ge=1, le=50, description="返回数量限制")
):
    """
    获取热门问题列表
    
    Args:
        limit: 返回数量限制，默认5个
    
    Returns:
        热门问题列表
    """
    try:
        # 获取热门问答对
        popular_questions = await qa_dataset_service.get_popular_questions(limit)
        
        # 如果数据库中有数据，直接返回
        if popular_questions:
            return {
                "questions": popular_questions,
                "total": len(popular_questions),
                "limit": limit
            }
        
        # 数据库中没有数据，使用默认问题
        logger.info("数据库中无热门问题数据，使用默认问题")
        
    except Exception as e:
        logger.info(f"获取热门问题失败: {e}，使用默认问题")
    
    # 返回默认的热门问题
    default_questions = [
        {
            "id": "default-1",
            "question": "如何创建一个新的智能Agent？",
            "usage_count": 15,
            "category": "Agent开发"
        },
        {
            "id": "default-2", 
            "question": "团队协作模式如何配置？",
            "usage_count": 12,
            "category": "团队协作"
        },
        {
            "id": "default-3",
            "question": "如何上传和管理知识文档？",
            "usage_count": 10,
            "category": "知识管理"
        },
        {
            "id": "default-4",
            "question": "向量检索系统如何工作？",
            "usage_count": 8,
            "category": "技术原理"
        },
        {
            "id": "default-5",
            "question": "如何配置多种LLM模型？",
            "usage_count": 6,
            "category": "模型配置"
        }
    ][:limit]
    
    return {
        "questions": default_questions,
        "total": len(default_questions),
        "limit": limit
    }
