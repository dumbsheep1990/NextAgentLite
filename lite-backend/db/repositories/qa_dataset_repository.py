"""
QA数据集数据仓库 - 数据访问层
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.exc import IntegrityError

from models.qa_dataset import QADataset, QAPair, QACategory
from core.logger import logger


class QADatasetRepository:
    """QA数据集仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, data: Dict[str, Any]) -> QADataset:
        """创建数据集"""
        dataset = QADataset(**data)
        self.session.add(dataset)
        await self.session.commit()
        await self.session.refresh(dataset)
        return dataset
    
    async def get_by_id(self, dataset_id: str) -> Optional[QADataset]:
        """根据ID获取数据集"""
        import uuid
        try:
            # 确保dataset_id是有效的UUID格式
            uuid_obj = uuid.UUID(dataset_id)
            query = select(QADataset).where(QADataset.id == uuid_obj)
            result = await self.session.execute(query)
            return result.scalar_one_or_none()
        except ValueError:
            logger.error(f"无效的UUID格式: {dataset_id}")
            return None
    
    async def get_all(self) -> List[QADataset]:
        """获取所有数据集（按创建时间倒序排列）"""
        query = select(QADataset).order_by(QADataset.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def delete(self, dataset_id: str) -> bool:
        """删除数据集"""
        try:
            import uuid
            uuid_obj = uuid.UUID(dataset_id)
            query = delete(QADataset).where(QADataset.id == uuid_obj)
            await self.session.execute(query)
            await self.session.commit()
            return True
        except Exception as e:
            logger.error(f"删除数据集失败: {e}")
            await self.session.rollback()
            return False
    
    async def get_by_file_hash(self, file_hash: str) -> Optional[QADataset]:
        """根据文件哈希获取数据集"""
        query = select(QADataset).where(QADataset.file_hash == file_hash)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_file_hash_and_title(self, file_hash: str, title: str) -> Optional[QADataset]:
        """根据文件哈希和标题获取数据集（用于检查重复）"""
        query = select(QADataset).where(
            QADataset.file_hash == file_hash,
            QADataset.title == title
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_status(self, status: str) -> List[QADataset]:
        """根据状态获取数据集列表（按创建时间倒序排列）"""
        query = select(QADataset).where(QADataset.status == status).order_by(QADataset.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_by_collection_id(self, collection_id: str) -> List[QADataset]:
        """根据知识库ID获取数据集列表（按创建时间倒序排列）"""
        query = select(QADataset).where(QADataset.collection_id == collection_id).order_by(QADataset.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_by_collection_and_status(self, collection_id: str, status: str) -> List[QADataset]:
        """根据知识库ID和状态获取数据集列表（按创建时间倒序排列）"""
        query = select(QADataset).where(
            QADataset.collection_id == collection_id,
            QADataset.status == status
        ).order_by(QADataset.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def update_processing_status(self, dataset_id: str, status: str, logs: Dict = None) -> bool:
        """更新处理状态"""
        try:
            import uuid
            uuid_obj = uuid.UUID(dataset_id)
            update_data = {"status": status}
            if logs:
                update_data["processing_logs"] = logs
            
            query = update(QADataset).where(QADataset.id == uuid_obj).values(**update_data)
            await self.session.execute(query)
            await self.session.commit()
            return True
        except Exception as e:
            logger.error(f"更新数据集状态失败: {e}")
            await self.session.rollback()
            return False
    
    async def update_statistics(self, dataset_id: str, total_qa_pairs: int, processed_qa_pairs: int, categories_count: int) -> bool:
        """更新统计信息"""
        try:
            import uuid
            uuid_obj = uuid.UUID(dataset_id)
            query = update(QADataset).where(QADataset.id == uuid_obj).values(
                total_qa_pairs=total_qa_pairs,
                processed_qa_pairs=processed_qa_pairs,
                categories_count=categories_count
            )
            await self.session.execute(query)
            await self.session.commit()
            return True
        except Exception as e:
            logger.error(f"更新数据集统计失败: {e}")
            await self.session.rollback()
            return False


class QAPairRepository:
    """QA问答对仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def delete(self, qa_pair_id: str) -> bool:
        """删除问答对"""
        try:
            query = delete(QAPair).where(QAPair.id == qa_pair_id)
            await self.session.execute(query)
            await self.session.commit()
            return True
        except Exception as e:
            logger.error(f"删除问答对失败: {e}")
            await self.session.rollback()
            return False
    
    async def get_by_dataset_id(self, dataset_id: str, limit: int = None, offset: int = 0) -> List[QAPair]:
        """获取数据集的问答对（支持分页）"""
        import uuid
        try:
            uuid_obj = uuid.UUID(dataset_id)
            query = select(QAPair).where(QAPair.dataset_id == uuid_obj).order_by(QAPair.row_number)
            
            if limit:
                query = query.limit(limit).offset(offset)
                
            result = await self.session.execute(query)
            return result.scalars().all()
        except ValueError:
            logger.error(f"无效的UUID格式: {dataset_id}")
            return []
    
    async def get_by_category(self, dataset_id: str, category: str) -> List[QAPair]:
        """获取指定分类的问答对"""
        import uuid
        try:
            uuid_obj = uuid.UUID(dataset_id)
            query = select(QAPair).where(
                QAPair.dataset_id == uuid_obj,
                QAPair.category == category
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except ValueError:
            logger.error(f"无效的UUID格式: {dataset_id}")
            return []

    async def increment_usage(self, qa_pair_id: str, step: int = 1) -> bool:
        """自增问答对的 usage_count"""
        try:
            stmt = update(QAPair).where(QAPair.id == qa_pair_id).values(
                usage_count=QAPair.usage_count + step
            )
            await self.session.execute(stmt)
            await self.session.commit()
            return True
        except Exception as e:
            logger.error(f"更新usage_count失败: {e}")
            await self.session.rollback()
            return False
    
    async def get_unvectorized(self, dataset_id: str) -> List[QAPair]:
        """获取未向量化的问答对"""
        import uuid
        try:
            uuid_obj = uuid.UUID(dataset_id)
            query = select(QAPair).where(
                QAPair.dataset_id == uuid_obj,
                QAPair.vector_status == "pending"
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except ValueError:
            logger.error(f"无效的UUID格式: {dataset_id}")
            return []
    
    async def update_vector_info(self, qa_pair_id: str, vector_id: str, status: str) -> bool:
        """更新向量化信息"""
        try:
            query = update(QAPair).where(QAPair.id == qa_pair_id).values(
                question_vector_id=vector_id,
                vector_status=status
            )
            await self.session.execute(query)
            await self.session.commit()
            return True
        except Exception as e:
            logger.error(f"更新问答对向量信息失败: {e}")
            await self.session.rollback()
            return False
    
    async def update_vector(self, qa_pair_id: str, vector_id: str) -> bool:
        """更新问答对的向量ID"""
        try:
            query = update(QAPair).where(QAPair.id == qa_pair_id).values(
                question_vector_id=vector_id,
                vector_status="completed"
            )
            await self.session.execute(query)
            await self.session.commit()
            return True
        except Exception as e:
            logger.error(f"更新问答对向量失败: {e}")
            await self.session.rollback()
            return False
    
    async def batch_create(self, qa_pairs: List[Dict[str, Any]], batch_size: int = 1000) -> Dict[str, Any]:
        """批量创建问答对，支持大文件分批处理"""
        total_pairs = len(qa_pairs)
        created_count = 0
        failed_count = 0
        errors = []
        created_objects = []  # 新增：存储成功创建的对象
        
        logger.info(f"开始批量创建 {total_pairs} 个问答对，批次大小: {batch_size}")
        
        # 分批处理
        for i in range(0, total_pairs, batch_size):
            batch_data = qa_pairs[i:i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (total_pairs + batch_size - 1) // batch_size
            
            try:
                logger.info(f"处理批次 {batch_num}/{total_batches}，包含 {len(batch_data)} 个问答对")
                
                # 创建批次对象
                qa_pair_objects = []
                for qa_data in batch_data:
                    try:
                        qa_pair = QAPair(**qa_data)
                        qa_pair_objects.append(qa_pair)
                    except Exception as e:
                        logger.error(f"创建QA对象失败: {e}")
                        failed_count += 1
                        errors.append(f"第{i + len(qa_pair_objects) + 1}行: {str(e)}")
                        continue
                
                if qa_pair_objects:
                    # 批量插入
                    self.session.add_all(qa_pair_objects)
                    await self.session.commit()
                    # 刷新对象以获得数据库生成的ID
                    for obj in qa_pair_objects:
                        await self.session.refresh(obj)
                    
                    created_count += len(qa_pair_objects)
                    created_objects.extend(qa_pair_objects)  # 新增：保存成功创建的对象
                    
                    logger.info(f"批次 {batch_num} 完成，成功插入 {len(qa_pair_objects)} 个问答对")
                else:
                    logger.warning(f"批次 {batch_num} 没有有效的问答对可插入")
                    
            except Exception as e:
                logger.error(f"批次 {batch_num} 处理失败: {e}")
                await self.session.rollback()
                failed_count += len(batch_data)
                errors.append(f"批次 {batch_num}: {str(e)}")
                continue
        
        success_rate = (created_count / total_pairs * 100) if total_pairs > 0 else 0
        logger.info(f"批量创建完成: 成功 {created_count}/{total_pairs} ({success_rate:.1f}%)")
        
        return {
            "total_pairs": total_pairs,
            "created_count": created_count,
            "failed_count": failed_count,
            "success_rate": success_rate,
            "errors": errors[:10],  # 只返回前10个错误
            "created_objects": created_objects  # 新增：返回成功创建的对象
        }
    
    async def get_statistics_by_dataset(self, dataset_id: str) -> Dict[str, Any]:
        """获取数据集的统计信息"""
        import uuid
        try:
            uuid_obj = uuid.UUID(dataset_id)
            
            # 总数
            total_query = select(func.count(QAPair.id)).where(QAPair.dataset_id == uuid_obj)
            total_result = await self.session.execute(total_query)
            total_count = total_result.scalar()
            
            # 已向量化数量
            vectorized_query = select(func.count(QAPair.id)).where(
                QAPair.dataset_id == uuid_obj,
                QAPair.vector_status == "completed"
            )
            vectorized_result = await self.session.execute(vectorized_query)
            vectorized_count = vectorized_result.scalar()
            
            # 分类数量
            categories_query = select(func.count(func.distinct(QAPair.category))).where(
                QAPair.dataset_id == uuid_obj
            )
            categories_result = await self.session.execute(categories_query)
            categories_count = categories_result.scalar()
            
            return {
                "total_qa_pairs": total_count,
                "vectorized_qa_pairs": vectorized_count,
                "categories_count": categories_count
            }
        except ValueError:
            logger.error(f"无效的UUID格式: {dataset_id}")
            return {
                "total_qa_pairs": 0,
                "vectorized_qa_pairs": 0,
                "categories_count": 0
            }
    
    async def get_popular_qa_pairs(self, limit: int = 5) -> List[QAPair]:
        """获取热门问答对（按使用次数排序）"""
        try:
            query = select(QAPair).where(
                QAPair.usage_count > 0
            ).order_by(
                QAPair.usage_count.desc()
            ).limit(limit)
            
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"获取热门问答对失败: {e}")
            return []


class QACategoryRepository:
    """QA分类仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_dataset_id(self, dataset_id: str) -> List[QACategory]:
        """获取数据集的所有分类"""
        import uuid
        try:
            uuid_obj = uuid.UUID(dataset_id)
            query = select(QACategory).where(QACategory.dataset_id == uuid_obj)
            result = await self.session.execute(query)
            return result.scalars().all()
        except ValueError:
            logger.error(f"无效的UUID格式: {dataset_id}")
            return []
    
    async def get_or_create_category(self, dataset_id: str, name: str, description: str = None) -> QACategory:
        """获取或创建分类"""
        import uuid
        uuid_obj = uuid.UUID(dataset_id)
        
        # 先尝试获取
        query = select(QACategory).where(
            QACategory.dataset_id == uuid_obj,
            QACategory.name == name
        )
        result = await self.session.execute(query)
        category = result.scalar_one_or_none()
        
        if category:
            return category
        
        # 不存在则创建
        try:
            category = QACategory(
                dataset_id=uuid_obj,
                name=name,
                description=description
            )
            self.session.add(category)
            await self.session.commit()
            return category
        except Exception as e:
            logger.error(f"创建QA分类失败: {e}")
            await self.session.rollback()
            raise
    
    async def update_qa_count(self, category_id: str, qa_count: int) -> bool:
        """更新分类下的问答对数量"""
        try:
            query = update(QACategory).where(QACategory.id == category_id).values(qa_count=qa_count)
            await self.session.execute(query)
            await self.session.commit()
            return True
        except Exception as e:
            logger.error(f"更新分类问答对数量失败: {e}")
            await self.session.rollback()
            return False
