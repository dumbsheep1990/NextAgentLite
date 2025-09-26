"""
QA数据集服务 - 处理Excel格式的问答数据集
"""
import pandas as pd
import hashlib
import asyncio
import os
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime

from db.database import get_async_session
from db.repositories.qa_dataset_repository import QADatasetRepository, QAPairRepository, QACategoryRepository
from models.qa_dataset import QADataset, QAPair
from service.storage_service import storage_service
from service.embedding_service import embedding_service
from core.logger import logger
from core.task_config import task_config
from utils.data_cleaner import clean_and_validate_qa_dataset, safe_json_serialize


class QADatasetService:
    """QA数据集管理服务"""
    
    def __init__(self):
        self.supported_extensions = {'.xlsx', '.xls'}
        self.required_columns = {'分类', '问题', '答案'}  # 必需的列名
        self.optional_columns = {'编号'}  # 可选的列名
    
    async def upload_qa_dataset(
        self,
        file_data: bytes,
        filename: str,
        title: str = None,
        description: str = None,
        category: str = None,
        collection_id: str = None
    ) -> Dict[str, Any]:
        """
        上传QA数据集Excel文件
        
        Args:
            file_data: 文件数据
            filename: 文件名
            title: 数据集标题
            description: 数据集描述
            category: 数据集类别
            collection_id: 所属知识库ID
        
        Returns:
            包含数据集ID和处理状态的字典
        """
        try:
            # 1. 验证文件格式
            file_ext = Path(filename).suffix.lower()
            if file_ext not in self.supported_extensions:
                raise ValueError(f"不支持的文件格式: {file_ext}，仅支持 {self.supported_extensions}")
            
            # 2. 计算文件哈希
            file_hash = hashlib.sha256(file_data).hexdigest()
            
            # 3. 生成高精度时间戳用于区分相同文件的不同上传（东八区）
            import datetime
            import pytz
            
            # 设置东八区时区
            tz = pytz.timezone('Asia/Shanghai')
            timestamp = datetime.datetime.now(tz).strftime("%Y%m%d_%H%M%S_%f")[:-3]  # 精确到毫秒
            
            # 4. 计算唯一标识哈希（基于文件内容+标题+时间戳）
            unique_content = f"{file_hash}_{title or Path(filename).stem}_{timestamp}"
            unique_hash = hashlib.sha256(unique_content.encode()).hexdigest()
            
            # 5. 由于现在使用毫秒级时间戳，每次上传都会生成唯一的文件名
            # 不再进行重复检查，允许相同文件的多次上传
            
            # 6. 生成带时间戳的文件名并上传到存储
            name_part = Path(filename).stem
            ext_part = Path(filename).suffix
            
            # 为QA数据集创建特定的路径结构
            if collection_id:
                # 归属于特定知识库: qa_datasets/collection_id/filename
                timestamped_filename = f"qa_datasets/{collection_id}/{name_part}_{timestamp}{ext_part}"
            else:
                # 不归属任何知识库: qa_datasets/general/filename
                timestamped_filename = f"qa_datasets/general/{name_part}_{timestamp}{ext_part}"
            
            object_name, file_url, file_size = await storage_service.upload_document(
                file_data, timestamped_filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            logger.info(f"QA数据集文件上传成功: {object_name}")
            
            # 5. 解析Excel文件获取基本信息
            preview_info = await self._preview_excel_file(file_data, filename)
            
            # 6. 创建数据集记录
            # 设置默认向量模型（优先使用9050统一模型网关的默认embedding）
            try:
                from service.llm_config_gateway_client import get_default_embedding_config
                default_cfg = await get_default_embedding_config()
                if default_cfg:
                    gw_model, gw_provider = default_cfg  # (model, provider)
                    # 保存模型标识，后续向量化统一走网关
                    vector_model = gw_model
                else:
                    # 兼容旧配置
                    from core.config_optimized import optimized_config_manager
                    embedding_config = optimized_config_manager.get_embedding_models_config()
                    default_model = embedding_config.get('default_model')
                    if not default_model:
                        raise ValueError("未配置embedding模型，请在9050或环境中设置默认embedding模型")
                    vector_model = default_model
            except Exception:
                # 兜底旧逻辑
                from core.config_optimized import optimized_config_manager
                embedding_config = optimized_config_manager.get_embedding_models_config()
                default_model = embedding_config.get('default_model')
                if not default_model:
                    raise ValueError("未配置embedding模型，请在9050或环境中设置默认embedding模型")
                vector_model = default_model
            
            dataset_data = {
                "title": title or Path(filename).stem,
                "description": description,
                "category": category,
                "collection_id": collection_id,  # 添加知识库关联
                "file_path": object_name,
                "file_name": timestamped_filename,  # 使用带时间戳的文件名
                "file_size": file_size,
                "file_hash": unique_hash,  # 使用唯一哈希而不是原始文件哈希
                "status": "pending",
                "total_qa_pairs": preview_info["total_rows"],
                "categories_count": preview_info["categories_count"],
                "vector_model": vector_model,  # 设置默认向量模型
                "dataset_metadata": {
                    "columns": preview_info["columns"],
                    "sheets": preview_info["sheets"],
                    "preview": preview_info["preview_data"],
                    "original_filename": filename  # 保存原始文件名用于显示
                }
            }
            
            async with get_async_session() as session:
                dataset_repo = QADatasetRepository(session)
                dataset = await dataset_repo.create(dataset_data)
                dataset_id = str(dataset.id)
            
            logger.info(f"QA数据集创建成功: {dataset_id}")
            
            # 7. 将QA数据集处理任务添加到队列
            try:
                from service.simple_queue_service import simple_queue, TaskType
                task_id = await simple_queue.add_task(
                    task_type=TaskType.QA_DATASET_PROCESSING,
                    file_name=filename,
                    file_size=file_size,
                    handler=self._process_qa_dataset_async,
                    handler_args=(dataset_id,),
                    priority=1  # QA数据集保持高优先级
                )
                logger.info(f"QA数据集处理任务已添加到队列: {task_id}")
            except Exception as queue_error:
                # 如果队列失败，回退到直接处理
                logger.warning(f"队列添加失败，直接处理: {queue_error}")
                asyncio.create_task(self._process_qa_dataset_async(dataset_id))
                task_id = f"qa_task_{dataset_id}"  # 生成一个任务ID用于兼容
            
            return {
                "dataset_id": dataset_id,
                "task_id": task_id,
                "status": "uploaded",
                "message": "文件上传成功，已添加到处理队列",
                "preview": preview_info
            }
            
        except Exception as e:
            logger.error(f"上传QA数据集失败: {e}")
            raise
    
    async def _preview_excel_file(self, file_data: bytes, filename: str) -> Dict[str, Any]:
        """预览Excel文件内容"""
        try:
            # 读取Excel文件
            import io
            excel_file = io.BytesIO(file_data)
            
            # 获取所有工作表
            xl_file = pd.ExcelFile(excel_file)
            sheets = xl_file.sheet_names
            
            # 🔧 修复：只统计第一个有效工作表的QA对数据（修复400的问题）
            total_valid_qa_pairs = 0
            total_original_rows = 0
            all_categories = set()
            
            # 只处理第一个有效的工作表，避免重复计算
            first_valid_sheet_found = False
            
            for sheet_name in sheets:
                if first_valid_sheet_found:
                    logger.info(f"跳过工作表 '{sheet_name}'，已找到第一个有效工作表")
                    break
                    
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                
                # 验证必需列
                df_columns = set(df.columns.tolist())
                missing_columns = self.required_columns - df_columns
                if missing_columns:
                    logger.warning(f"工作表 {sheet_name} 缺少必需列，跳过")
                    continue
                
                # 统计当前工作表
                original_rows = len(df)
                valid_rows = df.dropna(subset=['问题', '答案'])
                valid_pairs = len(valid_rows)
                
                total_original_rows = original_rows
                total_valid_qa_pairs = valid_pairs
                first_valid_sheet_found = True
                
                # 收集分类
                if '分类' in df.columns:
                    sheet_categories = df['分类'].dropna().unique()
                    all_categories.update(sheet_categories)
                
                logger.info(f"使用工作表 '{sheet_name}': 原始行数={original_rows}, 有效QA对={valid_pairs}")
                logger.info(f"🔧 修复400问题：只使用第一个有效工作表，避免重复计算")
            
            # 读取第一个工作表用于预览
            df_preview = pd.read_excel(excel_file, sheet_name=0)
            
            # 预览数据（从第一个工作表取前5行）
            preview_data = df_preview.head(5).to_dict(orient='records')
            
            logger.info(f"📊 Excel文件分析: 总工作表数={len(sheets)}, 总原始行数={total_original_rows}, 总有效QA对={total_valid_qa_pairs}")
            
            return {
                "sheets": sheets,
                "columns": df_preview.columns.tolist(),
                "total_rows": total_valid_qa_pairs,  # 🔧 使用所有工作表的有效QA对总数
                "original_total_rows": total_original_rows,  # 所有工作表的原始行数
                "valid_qa_pairs": total_valid_qa_pairs,  # 有效QA对数量
                "categories": list(all_categories),  # 所有工作表的分类
                "categories_count": len(all_categories),  # 分类总数
                "preview_data": preview_data  # 第一个工作表的预览数据
            }
            
        except Exception as e:
            logger.error(f"预览Excel文件失败: {e}")
            raise
    
    async def _process_qa_dataset_async(self, dataset_id: str):
        """异步处理QA数据集 - 并发批量插入和向量化"""
        try:
            logger.info(f"开始处理QA数据集: {dataset_id}")
            
            async with get_async_session() as session:
                dataset_repo = QADatasetRepository(session)
                
                # 更新状态为处理中
                await dataset_repo.update_processing_status(dataset_id, "processing")
                
                # 获取数据集信息
                dataset = await dataset_repo.get_by_id(dataset_id)
                if not dataset:
                    raise ValueError(f"数据集不存在: {dataset_id}")
                
                # 下载文件
                file_data = await storage_service.get_file(storage_service.config.documents_bucket, dataset.file_path)
                if not file_data:
                    raise ValueError("无法下载数据集文件")
                
                # 解析Excel并创建问答对 - 返回原始数量和清理后数量
                qa_pairs_data, original_count = await self._parse_excel_to_qa_pairs(file_data, dataset_id)
                
                logger.info(f"Excel解析完成: 原始 {original_count} 个，清理后 {len(qa_pairs_data)} 个有效QA对")
                
                # 创建队列用于生产者-消费者模式
                import asyncio
                vectorization_queue = asyncio.Queue(maxsize=5)  # 限制队列大小，避免内存过载
                insertion_complete = asyncio.Event()
                
                # 启动并发任务：插入任务（生产者）和向量化任务（消费者）
                logger.info(f"🚀 [并发优化] 启动生产者-消费者模式：批量插入与向量化并发处理")
                
                insertion_task = asyncio.create_task(
                    self._batch_insertion_producer(dataset_id, qa_pairs_data, vectorization_queue, insertion_complete)
                )
                
                vectorization_task = asyncio.create_task(
                    self._vectorization_consumer(dataset_id, vectorization_queue, insertion_complete)
                )
                
                # 等待两个任务完成
                insertion_result, vectorization_result = await asyncio.gather(
                    insertion_task, vectorization_task, return_exceptions=True
                )
                
                # 检查任务结果
                if isinstance(insertion_result, Exception):
                    logger.error(f"批量插入任务失败: {insertion_result}")
                    raise insertion_result
                    
                if isinstance(vectorization_result, Exception):
                    logger.error(f"向量化任务失败: {vectorization_result}")
                    # 向量化失败不影响数据插入，记录错误但不抛出异常
                
                # 使用插入任务的结果来更新统计
                batch_result = insertion_result
                
                # 🔧 处理向量化完成后的最终状态更新
                if vectorization_result and not isinstance(vectorization_result, Exception):
                    logger.info(f"⚙️ [向量化完成] 处理向量化结果: {vectorization_result}")
                    total_vectorized = vectorization_result.get("total_vectorized", 0)
                    
                    # 更新数据集的向量化状态为完成
                    dataset = await dataset_repo.get_by_id(dataset_id)
                    if dataset:
                        dataset.vectorization_status = "completed"
                        dataset.processed_qa_pairs = total_vectorized
                        await session.commit()
                        logger.info(f"📊 最终更新数据集向量化状态: {dataset_id} -> completed, processed_qa_pairs: {total_vectorized}")
                    
                    # 发送最终完成事件 - 添加大文件标识
                    from core.large_file_config import large_file_config
                    is_large_file = large_file_config.get_file_size_category(batch_result["created_count"]) in ["large_files", "very_large_files"]
                    
                    await self._send_qa_dataset_sse_event(
                        dataset_id, "completed", 100, 
                        f"向量化完成 ({total_vectorized}/{batch_result['created_count']})", 
                        {
                            "stage": "completed",
                            "total_pairs": int(batch_result["created_count"]),  # 🔧 确保是整数
                            "vectorized_pairs": int(total_vectorized),         # 🔧 确保是整数
                            "vector_mode": "general_only",
                            "is_large_file": is_large_file,                    # 🔧 添加大文件标识
                            "processing_mode": "concurrent_large_file" if is_large_file else "concurrent_normal"
                        }
                    )
                    logger.info(f"🎉 [并发模式] 向量化完成事件已发送: {dataset_id}")
                else:
                    # 向量化失败，更新状态为失败
                    dataset = await dataset_repo.get_by_id(dataset_id)
                    if dataset:
                        dataset.vectorization_status = "failed"
                        await session.commit()
                        logger.warning(f"📊 向量化失败，更新数据集状态: {dataset_id} -> failed")
                
                # 创建分类记录
                await self._create_categories(dataset_id, qa_pairs_data[:batch_result["created_count"]])
                
                # 获取分类统计
                qa_pair_repo = QAPairRepository(session)
                stats = await qa_pair_repo.get_statistics_by_dataset(dataset_id)
                
                # 更新统计信息 - 使用清理后的有效数据量作为total_qa_pairs
                logger.info(f"🔢 更新数据集统计信息: dataset_id={dataset_id}, total_qa_pairs={batch_result['created_count']}, categories_count={stats['categories_count']}")
                await dataset_repo.update_statistics(
                    dataset_id, 
                    batch_result["created_count"],  # 使用实际成功插入的数据量
                    0,  # 向量化数量由向量化任务单独更新
                    stats["categories_count"]
                )
                
                # 在数据集的处理日志中记录详细信息
                processing_logs = {
                    "upload": {
                        "original_qa_pairs": original_count,
                        "cleaned_qa_pairs": len(qa_pairs_data),
                        "inserted_qa_pairs": batch_result["created_count"],
                        "cleaning_success_rate": round((len(qa_pairs_data) / original_count) * 100, 2) if original_count > 0 else 0,
                        "insertion_success_rate": batch_result["success_rate"],
                        "data_quality_info": f"原始{original_count}个，清理后{len(qa_pairs_data)}个，最终入库{batch_result['created_count']}个",
                        "processing_mode": "concurrent_insertion_vectorization",
                        "updated_at": datetime.utcnow().isoformat()
                    }
                }
                
                # 更新数据集的处理日志
                dataset.processing_logs = processing_logs
                await session.commit()
                
                # 更新状态为已完成
                await dataset_repo.update_processing_status(dataset_id, "completed")
                
                logger.info(f"🎉 [并发优化] QA数据集处理完成: {dataset_id} - 并发模式显著提升性能")
                
        except Exception as e:
            logger.error(f"处理QA数据集失败 {dataset_id}: {e}")
            async with get_async_session() as session:
                dataset_repo = QADatasetRepository(session)
                await dataset_repo.update_processing_status(
                    dataset_id, 
                    "failed", 
                    {"error": str(e), "timestamp": datetime.utcnow().isoformat()}
                )
    
    async def _parse_excel_to_qa_pairs(self, file_data: bytes, dataset_id: str) -> tuple[List[Dict[str, Any]], int]:
        """解析Excel文件为问答对数据，包含数据清理和验证
        
        Returns:
            tuple: (清理后的QA对列表, 原始QA对数量)
        """
        import io
        excel_file = io.BytesIO(file_data)
        
        # 读取所有工作表
        xl_file = pd.ExcelFile(excel_file)
        raw_qa_pairs = []
        
        # 🔧 修复：只处理第一个有效工作表，与预览逻辑保持一致
        first_valid_sheet_processed = False
        
        for sheet_name in xl_file.sheet_names:
            if first_valid_sheet_processed:
                logger.info(f"跳过工作表 '{sheet_name}'，已处理第一个有效工作表")
                break
                
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            
            # 验证列名
            if not self.required_columns.issubset(set(df.columns)):
                logger.warning(f"工作表 {sheet_name} 缺少必需列，跳过")
                continue
            
            logger.info(f"🔧 处理工作表 '{sheet_name}'，与预览逻辑保持一致")
            first_valid_sheet_processed = True
            
            # 处理每一行
            for index, row in df.iterrows():
                # 跳过空行或缺少关键信息的行
                if pd.isna(row['问题']) or pd.isna(row['答案']):
                    continue
                
                # 创建原始QA数据
                raw_qa_pair = {
                    "dataset_id": dataset_id,
                    "category": row['分类'],
                    "question": row['问题'],
                    "answer": row['答案'],
                    "row_number": index + 2,  # Excel行号从1开始，加上表头
                    "source_sheet": sheet_name,
                    "vector_status": "pending",
                    "quality_score": row.get('质量评分', None),  # 如果有质量评分列
                    "qa_metadata": row.to_dict()  # 包含原始行数据
                }
                raw_qa_pairs.append(raw_qa_pair)
        
        # 记录原始数据量
        original_count = len(raw_qa_pairs)
        logger.info(f"从Excel中提取了 {original_count} 个原始QA对")
        
        # 使用数据清理工具清理和验证数据
        logger.info(f"开始清理和验证 {original_count} 个原始QA对")
        cleaned_qa_pairs, errors = clean_and_validate_qa_dataset(raw_qa_pairs)
        
        # 记录清理结果
        if errors:
            logger.warning(f"数据清理发现 {len(errors)} 个问题:")
            for error in errors[:10]:  # 只记录前10个错误
                logger.warning(f"  - {error}")
            if len(errors) > 10:
                logger.warning(f"  - ... 还有 {len(errors) - 10} 个错误")
        
        logger.info(f"数据清理完成: 原始 {original_count} 个，清理后 {len(cleaned_qa_pairs)} 个有效QA对")
        
        # 为清理后的数据添加必需的数据库字段
        final_qa_pairs = []
        for qa_pair in cleaned_qa_pairs:
            # 确保必需字段存在
            final_qa_pair = {
                "dataset_id": dataset_id,
                "category": qa_pair.get('category', '未知'),
                "question": qa_pair.get('question', ''),
                "answer": qa_pair.get('answer', ''),
                "row_number": qa_pair.get('row_number', 0),
                "source_sheet": qa_pair.get('source_sheet', ''),
                "vector_status": "pending",
                "quality_score": qa_pair.get('quality_score', 0.0),
                "is_validated": False,
                "usage_count": 0,
                "qa_metadata": qa_pair.get('qa_metadata', {})
            }
            
            # 使用安全的JSON序列化确保metadata可以正确存储
            try:
                safe_json_serialize(final_qa_pair['qa_metadata'])
                final_qa_pairs.append(final_qa_pair)
            except Exception as e:
                logger.error(f"序列化qa_metadata失败，跳过该条记录: {e}")
                continue
        
        return final_qa_pairs, original_count
    
    async def _create_categories(self, dataset_id: str, qa_pairs_data: List[Dict[str, Any]]):
        """创建分类记录"""
        async with get_async_session() as session:
            category_repo = QACategoryRepository(session)
            
            # 统计每个分类的问答对数量
            category_counts = {}
            for qa_pair in qa_pairs_data:
                category = qa_pair['category']
                category_counts[category] = category_counts.get(category, 0) + 1
            
            # 创建分类记录
            for category_name, count in category_counts.items():
                category = await category_repo.get_or_create_category(
                    dataset_id, 
                    category_name,
                    f"{category_name}类别问答"
                )
                await category_repo.update_qa_count(str(category.id), count)
    
    async def _batch_insertion_producer(self, dataset_id: str, qa_pairs_data: List[Dict[str, Any]], 
                                       vectorization_queue: asyncio.Queue, insertion_complete: asyncio.Event):
        """生产者：批量插入数据到数据库，并将完成的批次放入队列供向量化使用"""
        try:
            logger.info(f"🏭 [生产者] 开始批量插入 {len(qa_pairs_data)} 个QA对")
            
            # 预先获取配置，避免在循环中重复导入
            from core.large_file_config import large_file_config
            batch_size = large_file_config.get_database_batch_size(len(qa_pairs_data))
            logger.info(f"🏭 [生产者] 使用批次大小: {batch_size}")
            
            async with get_async_session() as session:
                qa_pair_repo = QAPairRepository(session)
                
                total_pairs = len(qa_pairs_data)
                created_count = 0
                failed_count = 0
                errors = []
                all_created_objects = []
                
                # 分批处理
                # 选取集合级或默认的嵌入模型
                model_path_override: Optional[str] = None
                try:
                    dataset = await dataset_repo.get_by_id(dataset_id)
                    if dataset and getattr(dataset, 'collection_id', None):
                        from service.embedding_model_manager import get_model_for_collection, get_gateway_default_embedding
                        cfg = await get_model_for_collection(dataset.collection_id)
                        if cfg:
                            mid, prov = cfg
                            model_path_override = f"{prov}/{mid}"
                        else:
                            gw = await get_gateway_default_embedding()
                            if gw and gw.get('model_id') and gw.get('provider'):
                                model_path_override = f"{gw['provider']}/{gw['model_id']}"
                except Exception:
                    model_path_override = None

                for i in range(0, total_pairs, batch_size):
                    batch_data = qa_pairs_data[i:i + batch_size]
                    batch_num = i // batch_size + 1
                    total_batches = (total_pairs + batch_size - 1) // batch_size
                    
                    try:
                        logger.info(f"🏭 [生产者] 处理批次 {batch_num}/{total_batches}，包含 {len(batch_data)} 个问答对")
                        
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
                            session.add_all(qa_pair_objects)
                            await session.commit()
                            # 刷新对象以获得数据库生成的ID
                            for obj in qa_pair_objects:
                                await session.refresh(obj)
                            
                            created_count += len(qa_pair_objects)
                            all_created_objects.extend(qa_pair_objects)
                            
                            logger.info(f"🏭 [生产者] 批次 {batch_num} 完成，成功插入 {len(qa_pair_objects)} 个问答对")
                            
                            # 将完成的批次放入队列供向量化使用
                            await vectorization_queue.put({
                                "batch_num": batch_num,
                                "qa_objects": qa_pair_objects.copy(),  # 复制避免引用问题
                                "batch_size": len(qa_pair_objects),
                                "total_qa_pairs": len(qa_pairs_data),  # 🔧 添加总数
                                "total_batches": total_batches         # 🔧 添加总批次数
                            })
                            logger.info(f"🚚 [生产者] 批次 {batch_num} 已放入向量化队列")
                        else:
                            logger.warning(f"🏭 [生产者] 批次 {batch_num} 没有有效的问答对可插入")
                            
                    except Exception as e:
                        logger.error(f"🏭 [生产者] 批次 {batch_num} 处理失败: {e}")
                        await session.rollback()
                        failed_count += len(batch_data)
                        errors.append(f"批次 {batch_num}: {str(e)}")
                        continue
                
                # 标记插入完成
                insertion_complete.set()
                logger.info(f"🏭 [生产者] 批量插入完成: 成功 {created_count}/{total_pairs}")
                
                success_rate = (created_count / total_pairs * 100) if total_pairs > 0 else 0
                return {
                    "total_pairs": total_pairs,
                    "created_count": created_count,
                    "failed_count": failed_count,
                    "success_rate": success_rate,
                    "errors": errors[:10],
                    "created_objects": all_created_objects
                }
                
        except Exception as e:
            logger.error(f"🏭 [生产者] 批量插入失败: {e}")
            insertion_complete.set()  # 确保消费者知道插入已结束
            raise
    
    async def _vectorization_consumer(self, dataset_id: str, vectorization_queue: asyncio.Queue, 
                                    insertion_complete: asyncio.Event):
        """消费者：从队列中获取已插入的批次进行向量化"""
        try:
            logger.info(f"⚙️ [消费者] 向量化消费者启动，等待批次数据")
            
            async with get_async_session() as session:
                dataset_repo = QADatasetRepository(session)
                
                # 暂时不发送初始化事件，等第一个批次到达后再发送
                logger.info(f"⚙️ [消费者] 初始化向量化消费者: {dataset_id}")
                
                processed_batches = 0
                total_vectorized = 0
                is_first_batch = True  # 🔧 标记是否是第一个批次
                
                while True:
                    try:
                        # 等待队列中的批次或插入完成信号
                        try:
                            # 设置超时避免无限等待
                            batch_data = await asyncio.wait_for(vectorization_queue.get(), timeout=5.0)
                            
                            logger.info(f"⚙️ [消费者] 收到批次 {batch_data['batch_num']}, 开始向量化 {batch_data['batch_size']} 个QA对")
                            
                            # 🔧 第一个批次时发送初始化事件，包含总数信息
                            if is_first_batch:
                                # 判断是否为大文件
                                from core.large_file_config import large_file_config
                                total_pairs = batch_data.get('total_qa_pairs', 0)
                                is_large_file = large_file_config.get_file_size_category(total_pairs) in ["large_files", "very_large_files"]
                                
                                await self._update_vectorization_progress(
                                    dataset_repo, dataset_id, "processing", 0, 
                                    "开始并发向量化处理", {
                                        "stage": "concurrent_mode", 
                                        "vector_mode": "general_only",
                                        "total_pairs": int(total_pairs),  # 🔧 确保是整数
                                        "vectorized_pairs": 0,           # 🔧 已处理数
                                        "current_batch": 0,              # 🔧 当前批次
                                        "total_batches": batch_data.get('total_batches', 0),  # 🔧 总批次
                                        "is_large_file": is_large_file,  # 🔧 添加大文件标识
                                        "processing_mode": "concurrent_large_file" if is_large_file else "concurrent_normal"
                                    }
                                )
                                is_first_batch = False
                            
                            # 向量化当前批次 - 传递总数和当前累计数
                            vectorized_count = await self._vectorize_batch(
                                dataset_id, 
                                batch_data['qa_objects'], 
                                batch_data['total_qa_pairs'], 
                                total_vectorized
                            )
                            total_vectorized += vectorized_count
                            processed_batches += 1
                            
                            # 🔧 关键修复：发送进度更新SSE事件 - 大文件专用格式
                            progress = int((total_vectorized / batch_data['total_qa_pairs']) * 100) if batch_data['total_qa_pairs'] > 0 else 0
                            
                            # 判断是否为大文件
                            from core.large_file_config import large_file_config
                            is_large_file = large_file_config.get_file_size_category(batch_data['total_qa_pairs']) in ["large_files", "very_large_files"]
                            
                            await self._update_vectorization_progress(
                                dataset_repo, dataset_id, "processing", progress,
                                f"向量化进行中 ({total_vectorized}/{batch_data['total_qa_pairs']})", 
                                {
                                    "stage": "vectorizing", 
                                    "current_batch": batch_data['batch_num'],
                                    "total_batches": batch_data['total_batches'],
                                    "vectorized_pairs": int(total_vectorized),  # 🔧 确保是整数
                                    "total_pairs": int(batch_data['total_qa_pairs']),  # 🔧 确保是整数
                                    "is_large_file": is_large_file,  # 🔧 添加大文件标识
                                    "processing_mode": "concurrent_large_file" if is_large_file else "concurrent_normal"
                                }
                            )
                            
                            logger.info(f"⚙️ [消费者] 批次 {batch_data['batch_num']} 向量化完成: {vectorized_count}/{batch_data['batch_size']} 成功，总进度: {total_vectorized}/{batch_data['total_qa_pairs']}")
                            
                            # 标记队列任务完成
                            vectorization_queue.task_done()
                            
                        except asyncio.TimeoutError:
                            # 超时检查插入是否完成
                            if insertion_complete.is_set() and vectorization_queue.empty():
                                logger.info(f"⚙️ [消费者] 插入完成且队列为空，向量化消费者结束")
                                break
                            # 否则继续等待
                            continue
                            
                    except Exception as e:
                        logger.error(f"⚙️ [消费者] 处理批次时出错: {e}")
                        continue
                
                logger.info(f"⚙️ [消费者] 向量化消费者完成: 处理了 {processed_batches} 个批次，共 {total_vectorized} 个QA对")
                return {"processed_batches": processed_batches, "total_vectorized": total_vectorized}
                
        except Exception as e:
            logger.error(f"⚙️ [消费者] 向量化消费者失败: {e}")
            raise
    
    async def _vectorize_batch(self, dataset_id: str, qa_objects: List, total_qa_pairs: int = None, current_total_vectorized: int = 0) -> int:
        """向量化单个批次的QA对象 - 修复API批次限制和数据库会话管理"""
        try:
            if not qa_objects:
                return 0
            
            # 🔧 [API限制修复] embedding API批次大小不能超过10个
            # 从环境变量读取批次大小，确保不超过API限制
            env_batch_size = int(os.getenv('VECTORIZATION_BATCH_SIZE', '10'))
            api_max_batch_size = 10  # Qwen API最大批次限制
            vectorization_batch_size = min(env_batch_size, api_max_batch_size, len(qa_objects))
            delay_between_batches = 0.3  # 减少延迟到0.3秒
            
            logger.info(f"🔧 [API限制] 批次大小限制为 {vectorization_batch_size}（API最大10），延迟 {delay_between_batches}s，共 {len(qa_objects)} 个QA对")
            
            vectorized_count = 0
            failed_count = 0
            consecutive_failures = 0
            max_consecutive_failures = 3
            
            # 🔥 优化：在方法开始创建一次数据库会话，重用整个批次
            async with get_async_session() as session:
                qa_pair_repo = QAPairRepository(session)
                
                for i in range(0, len(qa_objects), vectorization_batch_size):
                    mini_batch = qa_objects[i:i + vectorization_batch_size]
                    batch_num = i // vectorization_batch_size + 1
                    total_mini_batches = (len(qa_objects) + vectorization_batch_size - 1) // vectorization_batch_size
                    
                    try:
                        logger.info(f"🔧 处理小批次 {batch_num}/{total_mini_batches}，包含 {len(mini_batch)} 个QA对")
                        
                        # 批量获取向量（最多10个）
                        # 仅对问题生成向量（检索使用问句向量）
                        texts = [qa.question for qa in mini_batch]
                        
                        # 重试机制
                        for attempt in range(3):
                            try:
                                # QA数据集只需要通用向量，直接使用embedding服务
                                from service.embedding_service import embedding_service
                                from core.config_optimized import optimized_config_manager
                                
                                # 从配置中获取默认嵌入模型
                                embedding_config = optimized_config_manager.get_embedding_models_config()
                                default_model = embedding_config.get('default_model', 'Qwen/Qwen3-Embedding-4B')
                                model_path = default_model
                                response = await embedding_service.create_embeddings(
                                    model_path=model_path,
                                    texts=texts
                                )
                                vectors = response.embeddings if response else []
                                if vectors and len(vectors) == len(mini_batch):
                                    # 存储向量到Elasticsearch并更新数据库记录
                                    from db.database import get_elasticsearch_client
                                    
                                    # 🔧 复用ES客户端避免连接泄漏
                                    es_client = get_elasticsearch_client()
                                    
                                    # 顺序处理每个QA对，避免数据库并发问题
                                    for qa, vector in zip(mini_batch, vectors):
                                        try:
                                            # 直接存储到Elasticsearch的QA向量索引
                                            
                                            vector_doc = {
                                                "question": qa.question,
                                                "answer": qa.answer,
                                                "category": qa.category,
                                                "dataset_id": str(qa.dataset_id),
                                                "qa_pair_id": str(qa.id),
                                                "question_vector_general": vector,  # 使用通用向量字段
                                                "created_at": datetime.utcnow().isoformat()
                                            }
                                            
                                            # 存储到QA向量索引
                                            response = await es_client.index(
                                                index="mat_qa_pairs_vectors",  # 使用现有的QA向量索引
                                                body=vector_doc
                                            )
                                            vector_id = response["_id"]
                                            
                                            # 使用专用数据库会话更新记录，避免并发冲突
                                            async with get_async_session() as update_session:
                                                update_repo = QAPairRepository(update_session)
                                                await update_repo.update_vector(qa.id, vector_id)
                                            
                                        except Exception as e:
                                            logger.error(f"QA对 {qa.id} 向量存储失败: {e}")
                                            raise
                                    
                                    vectorized_count += len(mini_batch)
                                    consecutive_failures = 0  # 重置连续失败计数
                                    logger.info(f"✅ 小批次 {batch_num} 向量化成功: {len(mini_batch)} 个QA对")
                                    
                                    # 🔧 大文件专用：每完成一个小批次就发送SSE更新
                                    if total_qa_pairs and total_qa_pairs > 20000:  # 大文件判断
                                        current_vectorized = current_total_vectorized + vectorized_count
                                        await self._send_mini_batch_sse_update(
                                            dataset_id, current_vectorized, total_qa_pairs, 
                                            f"处理中: {current_vectorized}/{total_qa_pairs}"
                                        )
                                    
                                    break
                                else:
                                    raise ValueError(f"向量化结果数量不匹配: 期望 {len(mini_batch)}, 实际 {len(vectors) if vectors else 0}")
                            except Exception as e:
                                if attempt < 2:  # 前两次重试
                                    logger.warning(f"⚠️ 小批次 {batch_num} 第 {attempt + 1} 次尝试失败: {str(e)}, 0.5秒后重试")
                                    await asyncio.sleep(0.5)
                                else:
                                    raise e
                    
                    except Exception as e:
                        failed_count += len(mini_batch)
                        consecutive_failures += 1
                        logger.error(f"❌ 小批次 {batch_num} 向量化失败: {str(e)}")
                        
                        if consecutive_failures >= max_consecutive_failures:
                            logger.error(f"🚫 连续 {max_consecutive_failures} 个小批次失败，停止向量化任务")
                            break
                
                    # 批次间延迟
                    if i + vectorization_batch_size < len(qa_objects):
                        await asyncio.sleep(delay_between_batches)
            
            logger.info(f"📊 批次向量化完成: 成功 {vectorized_count}, 失败 {failed_count}")
            return vectorized_count
            
        except Exception as e:
            logger.error(f"❌ 批次向量化异常: {str(e)}")
            return 0
    
    async def _vectorize_qa_dataset_async(self, dataset_id: str, qa_pairs: Optional[List] = None):
        """异步向量化QA数据集
        
        Args:
            dataset_id: 数据集ID
            qa_pairs: 可选的QA对象列表，如果提供则直接使用，否则查询数据库
        """
        try:
            logger.info(f"⏰ [时间追踪] 向量化任务开始执行: {dataset_id} at {datetime.utcnow().isoformat()}")
            logger.info(f"开始向量化QA数据集: {dataset_id}")
            
            logger.info(f"⏰ [时间追踪] 准备获取数据库连接: {dataset_id} at {datetime.utcnow().isoformat()}")
            
            async with get_async_session() as session:
                logger.info(f"⏰ [时间追踪] 数据库连接已建立: {dataset_id} at {datetime.utcnow().isoformat()}")
                
                dataset_repo = QADatasetRepository(session)
                qa_pair_repo = QAPairRepository(session)
                
                logger.info(f"⏰ [时间追踪] Repository实例已创建: {dataset_id} at {datetime.utcnow().isoformat()}")
                
                # 优先使用传入的QA对象，避免重新查询数据库
                if qa_pairs:
                    logger.info(f"⏰ [性能优化] 使用传入的 {len(qa_pairs)} 个QA对象，跳过数据库查询")
                    unvectorized_pairs = qa_pairs
                else:
                    # 获取未向量化的问答对（回退方案）
                    logger.info(f"⏰ [时间追踪] 开始查询未向量化的问答对: {dataset_id} at {datetime.utcnow().isoformat()}")
                    unvectorized_pairs = await qa_pair_repo.get_unvectorized(dataset_id)
                    logger.info(f"⏰ [时间追踪] 未向量化问答对查询完成: {dataset_id} at {datetime.utcnow().isoformat()}")
                
                # 更新向量化状态并初始化进度
                total_pairs = len(unvectorized_pairs)
                await self._update_vectorization_progress(
                    dataset_repo, dataset_id, "processing", 0, 
                    "开始通用向量化处理", {
                        "stage": "initializing", 
                        "vector_mode": "general_only",
                        "total_pairs": total_pairs,  # 🔧 添加总数
                        "vectorized_pairs": 0,       # 🔧 添加已处理数
                        "current_batch": 0,          # 🔧 添加当前批次
                        "total_batches": 0           # 🔧 添加总批次数
                    }
                )
                
                if not unvectorized_pairs:
                    logger.info(f"数据集 {dataset_id} 没有需要向量化的问答对")
                    await self._update_vectorization_progress(
                        dataset_repo, dataset_id, "completed", 100,
                        "没有需要向量化的问答对", {"stage": "completed"}
                    )
                    return
                
                total_pairs = len(unvectorized_pairs)
                logger.info(f"开始向量化 {total_pairs} 个问答对")
                
                # 分批处理向量化 - 使用优化配置动态调整批次大小
                from core.large_file_config import large_file_config
                batch_size = large_file_config.get_vectorization_batch_size(total_pairs)
                # 稍微调大访问间隔，从0.1秒调到0.5秒，避免API过载
                delay_between_batches = max(0.5, large_file_config.get_vectorization_delay())
                
                logger.info(f"选择向量化批次大小: {batch_size} (总计 {total_pairs} 个问答对，批次间延迟: {delay_between_batches}s)")
                vectorized_count = 0
                failed_count = 0
                consecutive_failures = 0  # 连续失败计数
                max_consecutive_failures = 3  # 最大连续失败次数
                
                for i in range(0, total_pairs, batch_size):
                    batch_pairs = unvectorized_pairs[i:i + batch_size]
                    batch_num = i // batch_size + 1
                    total_batches = (total_pairs + batch_size - 1) // batch_size
                    
                    try:
                        logger.info(f"尝试获取批次 {batch_num} 的向量 (尝试 1/3)")
                        questions = [pair.question for pair in batch_pairs]
                        
                        # 通过统一EmbeddingService获取向量，优先使用集合专属模型
                        vectors: list = []
                        try:
                            from service.embedding_service import embedding_service
                            from core.config_optimized import optimized_config_manager
                            mp = model_path_override
                            if not mp:
                                embedding_config = optimized_config_manager.get_embedding_models_config()
                                default_model = embedding_config.get('default_model')
                                if not default_model:
                                    raise ValueError("未配置embedding模型")
                                mp = default_model
                            resp = await embedding_service.create_embeddings(model_path=mp, texts=questions)
                            vectors = resp.embeddings if resp else []
                        except Exception as ge:
                            logger.error(f"获取嵌入失败: {ge}")
                            vectors = []

                        if vectors:
                            # 保存向量到ElasticSearch
                            await self._save_qa_vectors_to_es_batch(batch_pairs, vectors)
                            
                            vectorized_count += len(batch_pairs)
                            consecutive_failures = 0  # 重置连续失败计数
                            
                            # 更新进度
                            progress = int((vectorized_count / total_pairs) * 100)
                            await self._update_vectorization_progress(
                                dataset_repo, dataset_id, "processing", progress,
                                f"向量化进行中 ({vectorized_count}/{total_pairs})", 
                                {
                                    "stage": "vectorizing", 
                                    "current_batch": batch_num,  # 🔧 修复字段名匹配
                                    "total_batches": total_batches,
                                    "vectorized_pairs": vectorized_count,  # 🔧 关键修复：添加已向量化数量
                                    "total_pairs": total_pairs
                                }
                            )
                            
                            logger.info(f"批次 {batch_num}/{total_batches} 向量化成功，已完成 {vectorized_count}/{total_pairs}")
                        else:
                            failed_count += len(batch_pairs)
                            consecutive_failures += 1
                            logger.warning(f"批次 {batch_num} 向量化失败：未获得有效向量")
                            
                            # 检查连续失败次数
                            if consecutive_failures >= max_consecutive_failures:
                                logger.error(f"连续 {consecutive_failures} 个批次失败，停止向量化任务")
                                break
                    
                    except Exception as e:
                        failed_count += len(batch_pairs)
                        consecutive_failures += 1
                        logger.error(f"批次 {batch_num} 向量化异常: {e}")
                        
                        # 检查连续失败次数
                        if consecutive_failures >= max_consecutive_failures:
                            logger.error(f"连续 {consecutive_failures} 个批次异常，停止向量化任务")
                            break
                    
                    # 批次间延迟，避免API过载
                    if i + batch_size < total_pairs:
                        await asyncio.sleep(delay_between_batches)
                
                # 计算成功率
                success_count = vectorized_count
                total_processed = success_count + failed_count
                success_rate = (success_count / total_processed * 100) if total_processed > 0 else 0
                
                logger.info(f"向量化处理完成: 成功 {success_count}/{total_processed} ({success_rate:.1f}%)")
                
                # 根据成功率和连续失败情况决定最终状态
                if consecutive_failures >= max_consecutive_failures:
                    final_status = "failed"
                    final_message = f"向量化任务因连续失败而停止 ({success_count}/{total_processed})"
                elif success_rate >= 80:
                    final_status = "completed"
                    final_message = f"向量化基本完成 ({success_count}/{total_processed})"
                elif success_rate > 0:
                    final_status = "partial_completed"
                    final_message = f"向量化部分完成 ({success_count}/{total_processed})"
                else:
                    final_status = "failed"
                    final_message = f"向量化完全失败 ({success_count}/{total_processed})"
                
                # 最终进度更新
                await self._update_vectorization_progress(
                    dataset_repo, dataset_id, "processing", 95,
                    "正在保存通用向量化结果", {"stage": "finalizing", "vector_mode": "general_only"}
                )
                
                # 更新向量化状态
                dataset = await dataset_repo.get_by_id(dataset_id)
                if dataset:
                    dataset.vectorization_status = final_status
                    # QA数据只使用通用向量模型
                    from service.llm_config_gateway_client import get_llm_config_gateway_client
                    client = await get_llm_config_gateway_client()
                    cfg = await client.get_default_embedding_model()
                    dataset.vector_model = (cfg[0] if cfg else '')
                    await session.commit()
                else:
                    logger.error(f"无法找到数据集 {dataset_id} 进行状态更新")
                
                # 🔧 直接更新processed_qa_pairs为实际向量化成功的数量
                logger.info(f"📊 强制更新processed_qa_pairs: {dataset_id} -> {vectorized_count}")
                stats = await qa_pair_repo.get_statistics_by_dataset(dataset_id)
                categories_count = stats.get("categories_count", 0) if stats else 0
                await dataset_repo.update_statistics(
                    dataset_id,
                    total_pairs,  # 使用实际处理的总数
                    vectorized_count,  # 🔧 直接使用向量化成功的数量
                    categories_count
                )
                
                # 完成进度更新 - 强制发送完成事件
                final_progress = 100 if final_status == "completed" else 80 if final_status == "partial_completed" else 0
                await self._update_vectorization_progress(
                    dataset_repo, dataset_id, final_status, final_progress,
                    final_message,
                    {
                        "stage": "completed" if final_status == "completed" else "partial_failed" if final_status == "partial_completed" else "failed",
                        "total_pairs": total_pairs,
                        "vectorized_pairs": vectorized_count,  # 🔧 使用实际向量化数量
                        "failed_pairs": failed_count,
                        "success_rate": round(success_rate, 2),
                        "consecutive_failures": consecutive_failures,
                        "vector_mode": "general_only"
                    }
                )
                
                # 🔧 强制发送完成事件，确保前端收到最终状态
                logger.info(f"🔥 强制发送QA数据集完成事件: {dataset_id} -> {vectorized_count}/{total_pairs}")
                await self._send_qa_dataset_sse_event(dataset_id, "completed", 100, f"向量化完成 ({vectorized_count}/{total_pairs})", {
                    "total_pairs": total_pairs,
                    "vectorized_pairs": vectorized_count,
                    "vector_mode": "general_only",
                    "success_rate": round(success_rate, 2)
                })
                
                logger.info(f"QA数据集向量化完成: {dataset_id}, 最终状态: {final_status}")
                
        except Exception as e:
            logger.error(f"向量化QA数据集失败 {dataset_id}: {e}")
            async with get_async_session() as session:
                dataset_repo = QADatasetRepository(session)
                await self._update_vectorization_progress(
                    dataset_repo, dataset_id, "failed", 0,
                    f"向量化失败: {str(e)}", {"stage": "failed", "error": str(e)}
                )
    
    async def _update_vectorization_progress(
        self, 
        dataset_repo, 
        dataset_id: str, 
        status: str, 
        progress: int, 
        message: str, 
        details: Dict[str, Any] = None
    ):
        """更新向量化进度并发送SSE事件"""
        try:
            # 使用独立的session来避免事务冲突
            async with get_async_session() as session:
                from db.repositories.qa_dataset_repository import QADatasetRepository
                from sqlalchemy.orm import attributes
                progress_repo = QADatasetRepository(session)
                dataset = await progress_repo.get_by_id(dataset_id)
                if dataset:
                    dataset.vectorization_status = status
                    
                    # 🔧 关键修复：实时更新已处理的QA对数量
                    if details and details.get("vectorized_pairs"):
                        dataset.processed_qa_pairs = details["vectorized_pairs"]
                        logger.info(f"📊 实时更新已向量化数量: {dataset_id} -> {details['vectorized_pairs']} (数据库字段直接修改)")
                    
                    # 更新处理日志 - 需要创建新的字典对象来触发SQLAlchemy的dirty标记
                    processing_logs = dict(dataset.processing_logs) if dataset.processing_logs else {}
                    processing_logs["vectorization"] = {
                        "progress": progress,
                        "status": status,
                        "message": message,
                        "details": details or {},
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    # 重新赋值以触发SQLAlchemy的修改检测
                    dataset.processing_logs = processing_logs
                    
                    # 显式标记字段为已修改
                    attributes.flag_modified(dataset, "processing_logs")
                    if details and details.get("vectorized_pairs"):
                        attributes.flag_modified(dataset, "processed_qa_pairs")  # 🔧 强制标记processed_qa_pairs为已修改
                    
                    await session.commit()
                    logger.info(f"向量化进度更新: {dataset_id} - {progress}% - {message}")
                    
                    # 发送SSE事件通知前端
                    await self._send_qa_dataset_sse_event(dataset_id, status, progress, message, details)
                
        except Exception as e:
            logger.error(f"更新向量化进度失败 {dataset_id}: {e}")
    
    async def _send_qa_dataset_sse_event(
        self, 
        dataset_id: str, 
        status: str, 
        progress: int, 
        message: str, 
        details: Dict[str, Any] = None
    ):
        """发送QA数据集处理的SSE事件"""
        try:
            from api.routes import unified_sse_manager
            
            # 构建SSE事件数据 - 确保字段名称与前端期望匹配
            is_large_file = details.get("is_large_file", False) if details else False
            processing_mode = details.get("processing_mode", "normal") if details else "normal"
            
            # 🔧 根据文件大小选择不同的任务类型
            task_type = "qa_dataset_large_file_vectorization" if is_large_file else "qa_dataset_vectorization"
            
            progress_data = {
                "progress": progress,
                "stage": message,
                "detail": f"QA数据集处理进度: {progress}%",
                "status": "processing" if status == "processing" else "completed" if status == "completed" else "failed",
                "document_id": dataset_id,          # 前端会检查这个字段
                "dataset_id": dataset_id,           # 前端也会检查这个字段
                "qa_dataset_id": dataset_id,        # 前端还会检查这个字段
                "task_type": task_type,             # 🔧 根据文件大小区分任务类型
                "created_at": datetime.utcnow().isoformat(),
                # 添加详细信息字段，确保前端能正确解析
                "total_pairs": int(details.get("total_pairs")) if details and details.get("total_pairs") is not None else None,
                "vectorized_pairs": int(details.get("vectorized_pairs")) if details and details.get("vectorized_pairs") is not None else None,
                "processed_pairs": int(details.get("vectorized_pairs")) if details and details.get("vectorized_pairs") is not None else None,  # 前端可能期望这个字段名
                "current_batch": details.get("current_batch") if details else None,
                "total_batches": details.get("total_batches") if details else None,
                "success_rate": details.get("success_rate") if details else None,
                "current_stage": details.get("stage") if details else message,  # 前端可能期望这个字段名
                "vector_mode": details.get("vector_mode") if details else "general_only",
                "is_large_file": is_large_file,     # 🔧 添加大文件标识
                "processing_mode": processing_mode  # 🔧 添加处理模式
            }
            
            # 发送进度更新事件
            if status == "processing":
                await unified_sse_manager.broadcast_task_progress(
                    session_id="all",  # 广播给所有会话
                    task_id=f"qa_dataset_{dataset_id}",
                    progress_data=progress_data
                )
                logger.info(f"📡 发送QA数据集进度SSE事件: {dataset_id} -> {progress}%")
            
            elif status == "completed":
                # 发送完成事件
                completion_data = {
                    "document_id": dataset_id,
                    "dataset_id": dataset_id,
                    "qa_dataset_id": dataset_id,
                    "task_type": task_type,  # 🔧 使用正确的任务类型
                    "total_qa_pairs": int(details.get("total_pairs")) if details and details.get("total_pairs") is not None else 0,
                    "processed_qa_pairs": int(details.get("vectorized_pairs")) if details and details.get("vectorized_pairs") is not None else 0,
                    "vectorized_pairs": int(details.get("vectorized_pairs")) if details and details.get("vectorized_pairs") is not None else 0,
                    "detail": message,
                    "success_rate": details.get("success_rate") if details else 100,
                    "vector_mode": details.get("vector_mode") if details else "general_only",
                    "is_large_file": is_large_file,     # 🔧 添加大文件标识
                    "processing_mode": processing_mode  # 🔧 添加处理模式
                }
                
                await unified_sse_manager.broadcast_task_completed(
                    session_id="all",
                    task_id=f"qa_dataset_{dataset_id}",
                    result_data=completion_data
                )
                logger.info(f"📡 发送QA数据集完成SSE事件: {dataset_id}")
                
            elif status == "failed" or status == "partial_completed":
                # 发送失败/部分完成事件
                error_data = {
                    "document_id": dataset_id,
                    "dataset_id": dataset_id,
                    "qa_dataset_id": dataset_id,
                    "task_type": "qa_dataset_vectorization",
                    "error_message": message,
                    "detail": message,
                    "success_rate": details.get("success_rate") if details else 0,
                    "total_pairs": details.get("total_pairs") if details else 0,
                    "vectorized_pairs": details.get("vectorized_pairs") if details else 0,
                    "failed_pairs": details.get("failed_pairs") if details else 0,
                    "vector_mode": details.get("vector_mode") if details else "general_only"
                }
                
                if status == "partial_completed":
                    # 部分完成使用completed事件，但在消息中说明是部分完成
                    await unified_sse_manager.broadcast_task_completed(
                        session_id="all",
                        task_id=f"qa_dataset_{dataset_id}",
                        result_data=error_data
                    )
                    logger.info(f"📡 发送QA数据集部分完成SSE事件: {dataset_id}")
                else:
                    await unified_sse_manager.broadcast_task_failed(
                        session_id="all",
                        task_id=f"qa_dataset_{dataset_id}",
                        error_data=error_data
                    )
                    logger.info(f"📡 发送QA数据集失败SSE事件: {dataset_id}")
                
        except Exception as e:
            logger.error(f"发送QA数据集SSE事件失败 {dataset_id}: {e}")
    
    async def _send_mini_batch_sse_update(
        self, 
        dataset_id: str, 
        current_vectorized: int, 
        total_pairs: int, 
        message: str
    ):
        """发送小批次SSE更新 - 专用于大文件实时进度"""
        try:
            progress = int((current_vectorized / total_pairs) * 100) if total_pairs > 0 else 0
            
            # 使用轻量级SSE更新，避免数据库操作
            from api.routes import unified_sse_manager
            
            progress_data = {
                "progress": progress,
                "stage": message,
                "detail": f"大文件处理进度: {current_vectorized}/{total_pairs}",
                "status": "processing",
                "document_id": dataset_id,
                "dataset_id": dataset_id,
                "qa_dataset_id": dataset_id,
                "task_type": "qa_dataset_large_file_vectorization",
                "created_at": datetime.utcnow().isoformat(),
                "total_pairs": int(total_pairs),
                "vectorized_pairs": int(current_vectorized),
                "processed_pairs": int(current_vectorized),
                "is_large_file": True,
                "processing_mode": "concurrent_large_file_mini_batch",
                "mini_batch_update": True  # 标识这是小批次更新
            }
            
            await unified_sse_manager.broadcast_task_progress(
                session_id="all",
                task_id=f"qa_dataset_{dataset_id}",
                progress_data=progress_data
            )
            
            logger.info(f"📡 发送大文件小批次SSE更新: {dataset_id} -> {current_vectorized}/{total_pairs}")
            
        except Exception as e:
            logger.error(f"发送小批次SSE更新失败 {dataset_id}: {e}")
    
    async def _save_qa_vectors_to_es_batch(self, qa_pairs: List, general_vectors: List):
        """批量保存QA向量到ElasticSearch（仅通用向量）- 使用bulk API优化"""
        from db.database import get_elasticsearch_client
        from db.elasticsearch_qa_dataset_mappings import QA_PAIRS_VECTOR_INDEX
        
        es_client = get_elasticsearch_client()
        # 确保索引存在
        await self._ensure_qa_index_exists()
        
        # 构建bulk操作的documents
        bulk_docs = []
        qa_pair_updates = []  # 用于批量更新数据库
        
        for qa_pair, general_vector in zip(qa_pairs, general_vectors):
            try:
                doc_id = f"qa_{qa_pair.id}"
                
                vector_doc = {
                    "qa_pair_id": str(qa_pair.id),
                    "dataset_id": str(qa_pair.dataset_id),
                    "category": qa_pair.category,
                    "question": qa_pair.question,
                    "answer": qa_pair.answer,
                    "question_vector_general": general_vector,
                    "source_sheet": qa_pair.source_sheet,
                    "row_number": qa_pair.row_number,
                    "quality_score": qa_pair.quality_score,
                    "is_validated": qa_pair.is_validated,
                    "usage_count": qa_pair.usage_count,
                    "created_at": qa_pair.created_at.isoformat(),
                    "updated_at": qa_pair.updated_at.isoformat()
                }
                
                # 添加到bulk操作
                bulk_docs.append({
                    "_index": QA_PAIRS_VECTOR_INDEX,
                    "_id": doc_id,
                    "_source": vector_doc
                })
                
                # 记录需要更新的QA对信息
                qa_pair_updates.append({
                    "qa_pair_id": str(qa_pair.id),
                    "vector_id": doc_id,
                    "status": "completed"
                })
                
            except Exception as e:
                logger.error(f"准备QA向量文档失败 {qa_pair.id}: {e}")
                qa_pair_updates.append({
                    "qa_pair_id": str(qa_pair.id),
                    "vector_id": "",
                    "status": "failed"
                })
        
        # 执行bulk操作
        if bulk_docs:
            try:
                logger.info(f"开始批量保存 {len(bulk_docs)} 个QA向量到ES")
                
                # 使用bulk API批量插入 - 正确的格式
                operations = []
                for doc in bulk_docs:
                    # 添加index操作指令
                    operations.append({"index": {"_index": doc["_index"], "_id": doc["_id"]}})
                    # 添加文档内容
                    operations.append(doc["_source"])
                
                response = await es_client.bulk(operations=operations)
                
                # 检查bulk操作结果
                if response.get("errors", False):
                    logger.warning("部分ES bulk操作失败:")
                    for item in response.get("items", []):
                        if "index" in item and item["index"].get("status", 200) >= 300:
                            logger.warning(f"ES插入失败: {item}")
                else:
                    logger.info(f"ES bulk操作成功: {len(bulk_docs)} 个文档")
                
            except Exception as e:
                logger.error(f"ES bulk操作失败: {e}")
                # 如果bulk失败，标记所有QA对为失败状态
                for update in qa_pair_updates:
                    update["status"] = "failed"
        
        # 批量更新数据库中的向量信息
        await self._batch_update_vector_status(qa_pair_updates)
        # 关闭 ES 客户端
        try:
            await es_client.close()
        except Exception:
            pass
    
    async def _batch_update_vector_status(self, qa_pair_updates: List[Dict[str, str]]):
        """批量更新QA对的向量状态"""
        if not qa_pair_updates:
            return
        
        try:
            async with get_async_session() as session:
                qa_pair_repo = QAPairRepository(session)
                
                # 分批更新以避免单个事务过大
                batch_size = 100
                success_count = 0
                failed_count = 0
                
                for i in range(0, len(qa_pair_updates), batch_size):
                    batch_updates = qa_pair_updates[i:i + batch_size]
                    
                    try:
                        # 批量更新当前批次
                        for update in batch_updates:
                            await qa_pair_repo.update_vector_info(
                                update["qa_pair_id"], 
                                update["vector_id"], 
                                update["status"]
                            )
                            
                            if update["status"] == "completed":
                                success_count += 1
                            else:
                                failed_count += 1
                        
                        # 提交当前批次
                        await session.commit()
                        logger.debug(f"批量更新向量状态批次 {i//batch_size + 1} 完成")
                        
                    except Exception as e:
                        logger.error(f"批量更新向量状态批次 {i//batch_size + 1} 失败: {e}")
                        await session.rollback()
                        failed_count += len(batch_updates)
                
                logger.info(f"向量状态批量更新完成: 成功 {success_count}, 失败 {failed_count}")
                
        except Exception as e:
            logger.error(f"批量更新向量状态失败: {e}")
    
    async def _save_qa_vectors_to_es(self, qa_pairs: List, dual_results: List):
        """保存QA向量到ElasticSearch"""
        from db.database import get_elasticsearch_client
        from db.elasticsearch_qa_dataset_mappings import QA_PAIRS_VECTOR_INDEX
        
        es_client = get_elasticsearch_client()
        
        # 确保索引存在
        await self._ensure_qa_index_exists()
        
        for qa_pair, dual_result in zip(qa_pairs, dual_results):
            try:
                vector_doc = {
                    "qa_pair_id": str(qa_pair.id),
                    "dataset_id": str(qa_pair.dataset_id),
                    "category": qa_pair.category,
                    "question": qa_pair.question,
                    "answer": qa_pair.answer,
                    "question_vector_general": dual_result.general_vector,
                    "question_vector_domain": dual_result.domain_vector,
                    "source_sheet": qa_pair.source_sheet,
                    "row_number": qa_pair.row_number,
                    "quality_score": qa_pair.quality_score,
                    "is_validated": qa_pair.is_validated,
                    "usage_count": qa_pair.usage_count,
                    "created_at": qa_pair.created_at.isoformat(),
                    "updated_at": qa_pair.updated_at.isoformat()
                }
                
                # 保存到ES
                doc_id = f"qa_{qa_pair.id}"
                await es_client.index(
                    index=QA_PAIRS_VECTOR_INDEX,
                    id=doc_id,
                    document=vector_doc
                )
                
                # 更新数据库中的向量ID
                async with get_async_session() as session:
                    qa_pair_repo = QAPairRepository(session)
                    await qa_pair_repo.update_vector_info(str(qa_pair.id), doc_id, "completed")
                
                logger.debug(f"QA向量保存成功: {qa_pair.id}")
                
            except Exception as e:
                logger.error(f"保存QA向量失败 {qa_pair.id}: {e}")
                async with get_async_session() as session:
                    qa_pair_repo = QAPairRepository(session)
                    await qa_pair_repo.update_vector_info(str(qa_pair.id), "", "failed")
    
    async def _ensure_qa_index_exists(self):
        """确保QA相关的ES索引存在"""
        from db.database import get_elasticsearch_client
        from db.elasticsearch_qa_dataset_mappings import (
            QA_PAIRS_VECTOR_INDEX, QA_PAIRS_VECTOR_MAPPING,
            QA_DATASETS_INDEX, QA_DATASETS_MAPPING
        )
        
        es_client = get_elasticsearch_client()
        try:
            # 创建QA问答对向量索引
            if not await es_client.indices.exists(index=QA_PAIRS_VECTOR_INDEX):
                await es_client.indices.create(
                    index=QA_PAIRS_VECTOR_INDEX,
                    body=QA_PAIRS_VECTOR_MAPPING
                )
                logger.info(f"创建ES索引: {QA_PAIRS_VECTOR_INDEX}")
            # 创建QA数据集索引
            if not await es_client.indices.exists(index=QA_DATASETS_INDEX):
                await es_client.indices.create(
                    index=QA_DATASETS_INDEX,
                    body=QA_DATASETS_MAPPING
                )
                logger.info(f"创建ES索引: {QA_DATASETS_INDEX}")
        finally:
            try:
                await es_client.close()
            except Exception:
                pass
    
    async def get_qa_datasets(self, collection_id: str = None, status: str = None) -> List[Dict[str, Any]]:
        """获取QA数据集列表（按创建时间倒序排列）"""
        async with get_async_session() as session:
            dataset_repo = QADatasetRepository(session)
            qa_pair_repo = QAPairRepository(session)
            
            # 根据collection_id和status过滤
            if collection_id and status:
                datasets = await dataset_repo.get_by_collection_and_status(collection_id, status)
            elif collection_id:
                datasets = await dataset_repo.get_by_collection_id(collection_id)
            elif status:
                datasets = await dataset_repo.get_by_status(status)
            else:
                datasets = await dataset_repo.get_all()
            
            # 处理每个数据集，但保持原有的顺序
            result = []
            for dataset in datasets:
                # 确保UUID格式正确
                dataset_id = str(dataset.id) if hasattr(dataset.id, '__str__') else dataset.id
                
                # 🔧 智能修正processed_qa_pairs字段
                processed_qa_pairs = dataset.processed_qa_pairs
                total_qa_pairs = dataset.total_qa_pairs
                
                # 如果数据集已完成但processed_qa_pairs为0，从数据库获取实际统计数据
                if ((dataset.status == 'completed' or dataset.vectorization_status == 'completed') and 
                    processed_qa_pairs == 0 and total_qa_pairs > 0):
                    
                    try:
                        # 获取实际的向量化统计数据
                        stats = await qa_pair_repo.get_statistics_by_dataset(dataset_id)
                        actual_vectorized = stats.get("vectorized_qa_pairs", 0)
                        
                        # 如果实际向量化数量大于0，使用实际数量
                        if actual_vectorized > 0:
                            processed_qa_pairs = actual_vectorized
                            logger.info(f"📊 修正数据集 {dataset_id} 的processed_qa_pairs: {dataset.processed_qa_pairs} -> {processed_qa_pairs}")
                        # 如果实际向量化数量也是0，但数据集标记为完成，使用总数
                        elif actual_vectorized == 0 and total_qa_pairs > 0:
                            processed_qa_pairs = total_qa_pairs
                            logger.info(f"📊 修正数据集 {dataset_id} 的processed_qa_pairs (使用总数): {dataset.processed_qa_pairs} -> {processed_qa_pairs}")
                            
                    except Exception as e:
                        logger.warning(f"获取数据集 {dataset_id} 统计信息失败: {e}")
                        # 如果获取统计信息失败，但数据集标记为完成，使用总数作为兜底
                        if total_qa_pairs > 0:
                            processed_qa_pairs = total_qa_pairs
                            logger.info(f"📊 兜底修正数据集 {dataset_id} 的processed_qa_pairs: {dataset.processed_qa_pairs} -> {processed_qa_pairs}")
                
                result.append({
                    "id": dataset_id,
                    "title": dataset.title,
                    "description": dataset.description,
                    "category": dataset.category,
                    "file_name": dataset.file_name,
                    "file_size": dataset.file_size,
                    "status": dataset.status,
                    "vectorization_status": dataset.vectorization_status,
                    "total_qa_pairs": total_qa_pairs,
                    "processed_qa_pairs": processed_qa_pairs,  # 🔧 使用修正后的值
                    "categories_count": dataset.categories_count,
                    "vector_model": dataset.vector_model,
                    "created_at": dataset.created_at.isoformat(),
                    "updated_at": dataset.updated_at.isoformat(),
                    "processing_logs": dataset.processing_logs
                })
            
            return result
    
    async def get_qa_dataset_detail(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """获取QA数据集详情"""
        async with get_async_session() as session:
            dataset_repo = QADatasetRepository(session)
            qa_pair_repo = QAPairRepository(session)
            category_repo = QACategoryRepository(session)
            
            dataset = await dataset_repo.get_by_id(dataset_id)
            if not dataset:
                return None
            
            # 获取分类信息
            categories = await category_repo.get_by_dataset_id(dataset_id)
            
            # 获取统计信息
            stats = await qa_pair_repo.get_statistics_by_dataset(dataset_id)
            
            # 🔧 智能修正向量化数据
            vectorized_qa_pairs = stats["vectorized_qa_pairs"]
            total_qa_pairs = stats["total_qa_pairs"]
            
            # 如果数据集已完成但vectorized_qa_pairs为0，进行修正
            if ((dataset.status == 'completed' or dataset.vectorization_status == 'completed') and 
                vectorized_qa_pairs == 0 and total_qa_pairs > 0):
                
                # 检查数据库中processed_qa_pairs字段
                processed_qa_pairs = dataset.processed_qa_pairs
                if processed_qa_pairs > 0:
                    vectorized_qa_pairs = processed_qa_pairs
                    logger.info(f"📊 修正数据集详情 {dataset_id} 的vectorized_qa_pairs (使用processed_qa_pairs): {stats['vectorized_qa_pairs']} -> {vectorized_qa_pairs}")
                else:
                    # 如果processed_qa_pairs也是0，但数据集标记为完成，使用总数
                    vectorized_qa_pairs = total_qa_pairs
                    logger.info(f"📊 修正数据集详情 {dataset_id} 的vectorized_qa_pairs (使用总数): {stats['vectorized_qa_pairs']} -> {vectorized_qa_pairs}")
            
            return {
                "id": str(dataset.id),
                "title": dataset.title,
                "description": dataset.description,
                "category": dataset.category,
                "file_name": dataset.file_name,
                "file_path": dataset.file_path,
                "file_size": dataset.file_size,
                "status": dataset.status,
                "vectorization_status": dataset.vectorization_status,
                "total_qa_pairs": total_qa_pairs,
                "vectorized_qa_pairs": vectorized_qa_pairs,  # 🔧 使用修正后的值
                "categories_count": stats["categories_count"],
                "vector_model": dataset.vector_model,
                "categories": [
                    {
                        "id": str(cat.id),
                        "name": cat.name,
                        "description": cat.description,
                        "qa_count": cat.qa_count
                    } for cat in categories
                ],
                "dataset_metadata": dataset.dataset_metadata,
                "processing_logs": dataset.processing_logs,
                "created_at": dataset.created_at.isoformat(),
                "updated_at": dataset.updated_at.isoformat()
            }


    async def get_popular_questions(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        获取热门问题列表
        
        Args:
            limit: 返回数量限制
        
        Returns:
            热门问题列表
        """
        try:
            async with get_async_session() as session:
                qa_pair_repo = QAPairRepository(session)
                
                # 获取使用次数最多的问答对
                popular_pairs = await qa_pair_repo.get_popular_qa_pairs(limit)
                
                # 如果没有找到热门问题，返回空列表让API端点处理默认值
                if not popular_pairs:
                    logger.info("数据库中没有热门问题数据，将使用默认问题")
                    return []
                
                questions = []
                for pair in popular_pairs:
                    questions.append({
                        "id": str(pair.id),
                        "question": pair.question,
                        "usage_count": getattr(pair, 'usage_count', 0),
                        "category": getattr(pair, 'category', '通用'),
                        "dataset_id": str(pair.dataset_id) if pair.dataset_id else None
                    })
                
                return questions
                
        except Exception as e:
            logger.error(f"获取热门问题失败: {e}")
            # 抛出异常，让API端点处理默认值
            raise


# 全局服务实例
qa_dataset_service = QADatasetService()
