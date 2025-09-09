"""
Embedding Atlas 数据服务
负责将向量数据库的数据转换为Atlas可用格式
"""

import pandas as pd
import numpy as np
import asyncio
import tempfile
import os
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from db.database import get_db_session
from sqlalchemy import text

logger = logging.getLogger(__name__)

class AtlasDataService:
    """Atlas数据服务类"""
    
    def __init__(self):
        self.temp_files = []  # 管理临时文件
    
    async def prepare_vector_data_for_atlas(
        self, 
        document_ids: Optional[List[str]] = None,
        limit: int = 10000
    ) -> pd.DataFrame:
        """将向量数据库的数据准备为Atlas可用的DataFrame
        
        Args:
            document_ids: 指定文档ID列表，None表示所有文档
            limit: 最大返回条数，防止数据过大
            
        Returns:
            pandas.DataFrame: Atlas格式的数据
        """
        try:
            logger.info(f"准备Atlas数据，文档数: {len(document_ids) if document_ids else '全部'}")
            
            # 1. 构建查询SQL
            base_query = """
            SELECT 
                dc.chunk_id,
                dc.content,
                dc.general_embedding,
                kd.document_id,
                kd.title as document_title,
                kd.source_type,
                dc.created_at,
                dc.chunk_index
            FROM document_chunks dc
            JOIN knowledge_documents kd ON dc.document_id = kd.document_id
            WHERE dc.general_embedding IS NOT NULL
            """
            
            params = []
            if document_ids:
                placeholders = ','.join(['%s'] * len(document_ids))
                base_query += f" AND dc.document_id IN ({placeholders})"
                params.extend(document_ids)
            
            base_query += f" ORDER BY dc.created_at DESC LIMIT {limit}"
            
            # 2. 执行查询
            async with get_db_session() as session:
                result = await session.execute(text(base_query), params)
                results = result.fetchall()
            
            if not results:
                logger.warning("未找到向量数据")
                return pd.DataFrame()
            
            # 3. 构建DataFrame
            data = []
            for idx, row in enumerate(results):
                try:
                    # 解析向量数据（假设存储为bytes）
                    if row['general_embedding']:
                        embedding_bytes = row['general_embedding']
                        if isinstance(embedding_bytes, str):
                            # 如果是字符串格式，需要转换
                            embedding = np.fromstring(embedding_bytes.strip('[]'), sep=',')
                        else:
                            # 如果是bytes格式
                            embedding = np.frombuffer(embedding_bytes, dtype=np.float32)
                    else:
                        continue
                    
                    # 构建Atlas需要的数据格式
                    item = {
                        'id': row['chunk_id'],
                        'text': row['content'][:500] if row['content'] else f"文档块 {row['chunk_id']}",  # 限制长度
                        'document_title': row['document_title'] or '未知文档',
                        'document_id': row['document_id'],
                        'source_type': row['source_type'] or '未知来源',
                        'timestamp': row['created_at'].strftime('%Y-%m-%d') if row['created_at'] else 'Unknown',
                        'chunk_index': row['chunk_index'] or 0,
                        'category': self._get_category(row['source_type'])
                    }
                    
                    data.append(item)
                    
                except Exception as e:
                    logger.error(f"处理行数据失败 {idx}: {e}")
                    continue
            
            logger.info(f"成功准备 {len(data)} 条数据")
            return pd.DataFrame(data)
            
        except Exception as e:
            logger.error(f"准备Atlas数据失败: {e}")
            raise
    
    def _get_category(self, source_type: str) -> str:
        """根据来源类型生成分类标签"""
        category_map = {
            'pdf': '学术文献',
            'web': '网页内容', 
            'doc': '文档资料',
            'txt': '文本资料'
        }
        return category_map.get(source_type, '其他')
    
    async def save_data_to_csv(
        self, 
        df: pd.DataFrame, 
        filename: Optional[str] = None
    ) -> str:
        """将数据保存为CSV文件
        
        Args:
            df: 要保存的DataFrame
            filename: 文件名，None时自动生成
            
        Returns:
            str: 保存的文件路径
        """
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"atlas_data_{timestamp}.csv"
        
        # 创建临时目录
        temp_dir = tempfile.mkdtemp(prefix='atlas_')
        file_path = os.path.join(temp_dir, filename)
        
        # 保存文件
        df.to_csv(file_path, index=False, encoding='utf-8')
        
        # 记录临时文件用于清理
        self.temp_files.append(file_path)
        
        logger.info(f"数据已保存到: {file_path}")
        return file_path
    
    def cleanup_temp_files(self):
        """清理临时文件"""
        for file_path in self.temp_files:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    # 尝试删除空目录
                    parent_dir = os.path.dirname(file_path)
                    if os.path.exists(parent_dir) and not os.listdir(parent_dir):
                        os.rmdir(parent_dir)
            except Exception as e:
                logger.error(f"清理临时文件失败 {file_path}: {e}")
        
        self.temp_files.clear()
    
    async def get_data_statistics(self) -> Dict[str, Any]:
        """获取向量数据统计信息 - 直接返回默认值避免数据库查询超时"""
        try:
            logger.info("Atlas数据统计查询：使用默认值避免数据库超时")
            
            # 直接返回默认值，避免复杂的数据库查询导致超时
            # 前端会根据这些值自动切换到演示模式
            return {
                'total_chunks': 0,
                'total_documents': 0,
                'vectorized_chunks': 0,
                'vectorization_rate': 0,
                'latest_update': None,
                'demo_mode': True  # 标识当前为演示模式
            }
            
        except Exception as e:
            logger.error(f"获取数据统计失败: {e}")
            return {
                'total_chunks': 0,
                'total_documents': 0,
                'vectorized_chunks': 0,
                'vectorization_rate': 0,
                'latest_update': None,
                'demo_mode': True
            }