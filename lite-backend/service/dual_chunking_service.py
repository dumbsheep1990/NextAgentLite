"""
双向量化分块服务 - 为不同的向量模型提供适配的分块策略
"""
import os
import tempfile
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from core.logger import logger
from rag.scenario.naive import advanced_chunk
from rag.utils.chunk_utils import split_text_by_delimiter, num_tokens_from_string, truncate
from service.chunking_config_service import chunking_config_service


@dataclass
class ModelChunkingConfig:
    """模型分块配置"""
    max_tokens: int  # 模型最大token限制
    chunk_size: int  # 分块大小
    chunk_overlap: int  # 分块重叠
    strategy: str  # 分块策略
    delimiter: str = "!?。！？"  # 分隔符


class DualChunkingService:
    """双向量化分块服务"""
    
    def __init__(self):
        # 模型特定的分块配置
        self.model_configs = {
            # MatBERT模型配置 - 严格限制在512以内
            "matbert": ModelChunkingConfig(
                max_tokens=500,  # 留一些buffer，避免512边界问题
                chunk_size=400,  # 保守的分块大小
                chunk_overlap=50,
                strategy="semantic",
                delimiter="!?。！？"
            ),
            # 通用模型配置 - 可以处理更长文本
            "general": ModelChunkingConfig(
                max_tokens=8000,  # text-embedding-v4的限制
                chunk_size=1000,  # 更大的分块
                chunk_overlap=100,
                strategy="semantic",
                delimiter="!?。！？"
            )
        }
    
    async def create_dual_chunks(
        self, 
        document_id: str, 
        content: str, 
        config_id: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        为双向量化创建两套分块
        
        Args:
            document_id: 文档ID
            content: 文档内容
            config_id: 分块配置ID（可选）
        
        Returns:
            (general_chunks, matbert_chunks): 两套分块结果
        """
        try:
            # 获取用户配置作为基础
            base_config = None
            if config_id:
                base_config = await chunking_config_service.get_config_by_id(config_id)
            if not base_config:
                base_config = await chunking_config_service.get_default_config()
            
            # 创建通用模型分块
            general_chunks = await self._create_chunks_for_model(
                document_id, content, "general", base_config
            )
            
            # 创建MatBERT分块
            matbert_chunks = await self._create_chunks_for_model(
                document_id, content, "matbert", base_config
            )
            
            logger.info(f"双向量分块完成: {document_id}, 通用分块: {len(general_chunks)}, MatBERT分块: {len(matbert_chunks)}")
            
            return general_chunks, matbert_chunks
            
        except Exception as e:
            logger.error(f"双向量分块失败 {document_id}: {e}")
            raise
    
    async def _create_chunks_for_model(
        self, 
        document_id: str, 
        content: str, 
        model_type: str,
        base_config: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """
        为特定模型创建分块
        
        Args:
            document_id: 文档ID
            content: 文档内容
            model_type: 模型类型 ("general" 或 "matbert")
            base_config: 基础配置
        
        Returns:
            分块结果列表
        """
        model_config = self.model_configs[model_type]
        
        try:
            # 使用高级分块算法
            chunks = await self._advanced_chunk_with_model_config(
                content, model_config, base_config
            )
            
            # 验证并修复超长分块
            validated_chunks = self._validate_and_fix_chunks(chunks, model_config)
            
            # 转换为数据库格式
            chunk_data = []
            for i, chunk_content in enumerate(validated_chunks):
                chunk_data.append({
                    "document_id": document_id,
                    "content": chunk_content,
                    "chunk_index": i,
                    "metadata": {
                        "model_type": model_type,
                        "strategy": model_config.strategy,
                        "max_tokens": model_config.max_tokens,
                        "chunk_size": model_config.chunk_size,
                        "token_count": num_tokens_from_string(chunk_content)
                    }
                })
            
            return chunk_data
            
        except Exception as e:
            logger.warning(f"高级分块失败，使用简单分块: {e}")
            # 回退到简单分块
            return self._simple_chunk_with_model_config(document_id, content, model_config)
    
    async def _advanced_chunk_with_model_config(
        self, 
        content: str, 
        model_config: ModelChunkingConfig,
        base_config: Optional[Any] = None
    ) -> List[str]:
        """使用高级分块算法并应用模型配置"""
        
        # 构建适配模型的parser配置
        parser_config = {
            "chunk_token_num": model_config.chunk_size,
            "max_token_num": model_config.max_tokens,
            "delimiter": model_config.delimiter
        }
        
        # 如果有用户配置，优先使用用户的策略设置
        chunk_strategy = model_config.strategy
        tokenizer_type = "simple"
        
        if base_config:
            chunk_strategy = base_config.strategy
            tokenizer_type = base_config.tokenizer_type
            # 但保持模型特定的token限制
            parser_config["chunk_token_num"] = min(
                base_config.chunk_token_num, model_config.chunk_size
            )
            parser_config["max_token_num"] = min(
                base_config.max_token_num, model_config.max_tokens
            )
        
        # 创建临时文件进行处理
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            chunks = advanced_chunk(
                tmp_file_path,
                chunk_strategy=chunk_strategy,
                parser_config=parser_config,
                tokenizer=tokenizer_type
            )
            
            # 提取文本内容
            chunk_texts = [chunk.content for chunk in chunks]
            return chunk_texts
            
        finally:
            # 清理临时文件
            os.unlink(tmp_file_path)
    
    def _simple_chunk_with_model_config(
        self, 
        document_id: str, 
        content: str, 
        model_config: ModelChunkingConfig
    ) -> List[Dict[str, Any]]:
        """使用简单分块并应用模型配置"""
        
        # 使用基于分隔符的分块
        chunks = split_text_by_delimiter(
            content, 
            max_token_num=model_config.chunk_size,
            delimiter=model_config.delimiter
        )
        
        # 验证并修复超长分块
        validated_chunks = self._validate_and_fix_chunks(chunks, model_config)
        
        # 转换为数据库格式
        chunk_data = []
        for i, chunk_content in enumerate(validated_chunks):
            chunk_data.append({
                "document_id": document_id,
                "content": chunk_content,
                "chunk_index": i,
                "metadata": {
                    "model_type": "simple",
                    "strategy": "delimiter",
                    "max_tokens": model_config.max_tokens,
                    "chunk_size": model_config.chunk_size,
                    "token_count": num_tokens_from_string(chunk_content)
                }
            })
        
        return chunk_data
    
    def _validate_and_fix_chunks(
        self, 
        chunks: List[str], 
        model_config: ModelChunkingConfig
    ) -> List[str]:
        """验证并修复超长的分块"""
        fixed_chunks = []
        
        for chunk in chunks:
            token_count = num_tokens_from_string(chunk)
            
            if token_count <= model_config.max_tokens:
                # 分块大小合适，直接使用
                fixed_chunks.append(chunk)
            else:
                # 分块过长，需要进一步切分
                logger.warning(f"检测到超长分块 ({token_count} tokens)，进行二次切分")
                
                # 使用截断方式确保不超过限制
                truncated_chunk = truncate(chunk, model_config.max_tokens)
                
                # 如果截断后仍然很长，进一步分割
                if num_tokens_from_string(truncated_chunk) > model_config.max_tokens:
                    # 强制按字符分割
                    sub_chunks = self._force_split_chunk(truncated_chunk, model_config.max_tokens)
                    fixed_chunks.extend(sub_chunks)
                else:
                    fixed_chunks.append(truncated_chunk)
        
        return fixed_chunks
    
    def _force_split_chunk(self, chunk: str, max_tokens: int) -> List[str]:
        """强制分割超长分块"""
        sub_chunks = []
        
        # 估算每个字符的token数量（约3个字符=1个token）
        chars_per_token = 3
        max_chars = max_tokens * chars_per_token
        
        # 按估算的字符数分割
        for i in range(0, len(chunk), max_chars):
            sub_chunk = chunk[i:i + max_chars]
            
            # 验证token数量
            if num_tokens_from_string(sub_chunk) <= max_tokens:
                sub_chunks.append(sub_chunk)
            else:
                # 如果还是太长，使用truncate
                sub_chunks.append(truncate(sub_chunk, max_tokens))
        
        return sub_chunks
    
    def get_model_config(self, model_type: str) -> ModelChunkingConfig:
        """获取模型配置"""
        return self.model_configs.get(model_type, self.model_configs["general"])


# 创建全局实例
dual_chunking_service = DualChunkingService()