"""
PostgreSQL pgvector adapter for GC-QA-RAG integration
适配GC-QA-RAG的Qdrant向量操作到PostgreSQL pgvector
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional, Tuple
import asyncpg
import json
from dataclasses import dataclass
from core.config_optimized import optimized_config_manager

logger = logging.getLogger(__name__)


@dataclass
class VectorConfig:
    """Configuration for vector parameters (adapted for NextAgentLite)."""
    dense_vector_size: int = 2560  # qwen-embedding-v4 维度
    # Note: pgvector doesn't support sparse vectors directly like Qdrant
    # We'll store sparse vector data as JSONB for compatibility


class PgVectorAdapter:
    """
    PostgreSQL pgvector adapter for GC-QA-RAG compatibility.
    
    This class provides methods compatible with GC-QA-RAG's VectorClient
    but uses PostgreSQL with pgvector extension instead of Qdrant.
    """
    
    def __init__(self, vector_config: Optional[VectorConfig] = None):
        """Initialize the PgVectorAdapter with database configuration."""
        self.vector_config = vector_config or VectorConfig()
        self.db_config = optimized_config_manager.settings.database_postgresql
        self._pool = None
        
    async def _get_pool(self) -> asyncpg.Pool:
        """Get or create connection pool."""
        if self._pool is None:
            self._pool = await asyncpg.create_pool(
                host=self.db_config.host,
                port=self.db_config.port,
                database=self.db_config.database,
                user=self.db_config.username,
                password=self.db_config.password,
                min_size=5,
                max_size=20
            )
        return self._pool
        
    async def ensure_collection_exists(self, collection_name: str) -> None:
        """
        Ensure a collection (table) exists, create it if it doesn't.
        
        In pgvector context, this creates a table with vector columns
        compatible with GC-QA-RAG's format.
        """
        if not collection_name:
            raise ValueError("Collection name cannot be empty")
            
        pool = await self._get_pool()
        
        # Sanitize collection name for SQL
        safe_collection_name = collection_name.replace('-', '_').replace(' ', '_')
        
        create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS {safe_collection_name} (
            id BIGSERIAL PRIMARY KEY,
            payload JSONB NOT NULL,
            question_dense_vector vector({self.vector_config.dense_vector_size}),
            answer_dense_vector vector({self.vector_config.dense_vector_size}),
            question_sparse_vector JSONB,
            answer_sparse_vector JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Create vector indexes
        CREATE INDEX IF NOT EXISTS idx_{safe_collection_name}_question_vector 
        ON {safe_collection_name} USING ivfflat (question_dense_vector vector_cosine_ops);
        
        CREATE INDEX IF NOT EXISTS idx_{safe_collection_name}_answer_vector 
        ON {safe_collection_name} USING ivfflat (answer_dense_vector vector_cosine_ops);
        
        -- Create GIN index for payload JSONB
        CREATE INDEX IF NOT EXISTS idx_{safe_collection_name}_payload 
        ON {safe_collection_name} USING gin (payload);
        """
        
        async with pool.acquire() as conn:
            try:
                await conn.execute(create_table_sql)
                logger.info(f"Ensured collection/table {safe_collection_name} exists")
            except Exception as e:
                logger.error(f"Failed to create collection {safe_collection_name}: {str(e)}")
                raise
                
    async def insert_to_collection(
        self, collection_name: str, points: List[Dict[str, Any]]
    ) -> None:
        """
        Insert or update points in a collection.
        
        Args:
            collection_name: Name of the collection (table)
            points: List of points compatible with GC-QA-RAG format
        """
        if not collection_name:
            raise ValueError("Collection name cannot be empty")
        if not points:
            raise ValueError("Points list cannot be empty")
            
        pool = await self._get_pool()
        safe_collection_name = collection_name.replace('-', '_').replace(' ', '_')
        
        # Prepare insert query
        insert_sql = f"""
        INSERT INTO {safe_collection_name} 
        (id, payload, question_dense_vector, answer_dense_vector, 
         question_sparse_vector, answer_sparse_vector)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
            payload = EXCLUDED.payload,
            question_dense_vector = EXCLUDED.question_dense_vector,
            answer_dense_vector = EXCLUDED.answer_dense_vector,
            question_sparse_vector = EXCLUDED.question_sparse_vector,
            answer_sparse_vector = EXCLUDED.answer_sparse_vector
        """
        
        async with pool.acquire() as conn:
            try:
                for point in points:
                    # Extract data from GC-QA-RAG point format
                    point_id = point.get('id')
                    payload = point.get('payload', {})
                    vectors = point.get('vector', {})
                    
                    # Extract dense vectors
                    question_dense = vectors.get('question_dense', [])
                    answer_dense = vectors.get('answer_dense', [])
                    
                    # Extract sparse vectors (store as JSONB for compatibility)
                    question_sparse = vectors.get('question_sparse', {})
                    answer_sparse = vectors.get('answer_sparse', {})
                    
                    await conn.execute(
                        insert_sql,
                        point_id,
                        json.dumps(payload),
                        question_dense if question_dense else None,
                        answer_dense if answer_dense else None,
                        json.dumps(question_sparse) if question_sparse else None,
                        json.dumps(answer_sparse) if answer_sparse else None
                    )
                    
                logger.info(f"Successfully inserted {len(points)} points to {safe_collection_name}")
                
            except Exception as e:
                logger.error(f"Failed to insert points to collection {collection_name}: {str(e)}")
                raise
                
    async def search_collection(
        self, 
        collection_name: str, 
        query_vector: List[float],
        vector_field: str = "question_dense_vector",
        limit: int = 10,
        score_threshold: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Search in collection using vector similarity.
        
        Args:
            collection_name: Name of the collection
            query_vector: Query vector
            vector_field: Vector field to search in
            limit: Maximum number of results
            score_threshold: Minimum similarity score
            
        Returns:
            List of search results with scores
        """
        pool = await self._get_pool()
        safe_collection_name = collection_name.replace('-', '_').replace(' ', '_')
        
        search_sql = f"""
        SELECT id, payload, 
               1 - ({vector_field} <=> $1) as score
        FROM {safe_collection_name}
        WHERE {vector_field} IS NOT NULL
        ORDER BY {vector_field} <=> $1
        LIMIT $2
        """
        
        async with pool.acquire() as conn:
            try:
                rows = await conn.fetch(search_sql, query_vector, limit)
                
                results = []
                for row in rows:
                    score = float(row['score'])
                    if score >= score_threshold:
                        results.append({
                            'id': row['id'],
                            'payload': json.loads(row['payload']) if row['payload'] else {},
                            'score': score
                        })
                        
                logger.info(f"Found {len(results)} results in {collection_name}")
                return results
                
            except Exception as e:
                logger.error(f"Failed to search collection {collection_name}: {str(e)}")
                raise
                
    async def update_collection_aliases(self, collection_name: str, alias_name: str) -> None:
        """
        Update collection aliases - implemented as metadata in a separate table.
        
        Args:
            collection_name: Name of the collection
            alias_name: Name of the alias to create
        """
        pool = await self._get_pool()
        
        # Create aliases table if not exists
        create_aliases_table = """
        CREATE TABLE IF NOT EXISTS collection_aliases (
            alias_name VARCHAR(255) PRIMARY KEY,
            collection_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """
        
        upsert_alias_sql = """
        INSERT INTO collection_aliases (alias_name, collection_name, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (alias_name) DO UPDATE SET
            collection_name = EXCLUDED.collection_name,
            updated_at = EXCLUDED.updated_at
        """
        
        async with pool.acquire() as conn:
            try:
                await conn.execute(create_aliases_table)
                await conn.execute(upsert_alias_sql, alias_name, collection_name)
                logger.info(f"Updated alias {alias_name} for collection {collection_name}")
                
            except Exception as e:
                logger.error(f"Failed to update alias {alias_name}: {str(e)}")
                raise
                
    async def get_collections_info(self) -> List[Dict[str, Any]]:
        """
        Get information about all collections (tables).
        
        Returns:
            List of collection information dictionaries
        """
        pool = await self._get_pool()
        
        # Query for tables that look like collections (have vector columns)
        query_sql = """
        SELECT 
            t.table_name as name,
            COALESCE(pg_stat_user_tables.n_tup_ins, 0) as points_count,
            CASE 
                WHEN c.column_name IS NOT NULL THEN 'green'
                ELSE 'unknown'
            END as status
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c 
            ON t.table_name = c.table_name 
            AND c.data_type = 'vector'
        LEFT JOIN pg_stat_user_tables 
            ON t.table_name = pg_stat_user_tables.relname
        WHERE t.table_schema = 'public' 
            AND t.table_type = 'BASE TABLE'
            AND c.column_name IS NOT NULL
        GROUP BY t.table_name, pg_stat_user_tables.n_tup_ins, c.column_name
        """
        
        async with pool.acquire() as conn:
            try:
                rows = await conn.fetch(query_sql)
                
                collections_info = []
                for row in rows:
                    collections_info.append({
                        "name": row['name'],
                        "vectors_count": int(row['points_count']),
                        "points_count": int(row['points_count']),
                        "status": row['status']
                    })
                    
                logger.info(f"Retrieved information for {len(collections_info)} collections")
                return collections_info
                
            except Exception as e:
                logger.error(f"Failed to get collections info: {str(e)}")
                raise
                
    async def get_collection_aliases(self) -> List[Dict[str, Any]]:
        """
        Get information about all collection aliases.
        
        Returns:
            List of alias information dictionaries
        """
        pool = await self._get_pool()
        
        query_sql = """
        SELECT alias_name, collection_name
        FROM collection_aliases
        ORDER BY alias_name
        """
        
        async with pool.acquire() as conn:
            try:
                # Check if aliases table exists
                table_exists_sql = """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'collection_aliases'
                );
                """
                
                table_exists = await conn.fetchval(table_exists_sql)
                if not table_exists:
                    return []
                    
                rows = await conn.fetch(query_sql)
                
                aliases_info = []
                for row in rows:
                    aliases_info.append({
                        "alias_name": row['alias_name'],
                        "collection_name": row['collection_name']
                    })
                    
                logger.info(f"Retrieved {len(aliases_info)} aliases")
                return aliases_info
                
            except Exception as e:
                logger.error(f"Failed to get collection aliases: {str(e)}")
                raise
                
    async def close(self):
        """Close the connection pool."""
        if self._pool:
            await self._pool.close()
            self._pool = None


# Global adapter instance
pgvector_adapter = PgVectorAdapter()