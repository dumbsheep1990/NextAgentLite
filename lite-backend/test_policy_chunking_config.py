#!/usr/bin/env python3
"""诊断政策知识库的切分配置问题"""
import asyncio
from sqlalchemy import select, text
from db.database import get_async_session
from models.knowledge_collection import KnowledgeCollection
from models.chunking_config import ChunkingConfig
from core.logger import logger

async def diagnose_chunking_config():
    """诊断切分配置问题"""

    async with get_async_session() as session:
        # 1. 查找政策知识库
        print("=" * 80)
        print("1. 查找政策知识库...")
        print("=" * 80)

        stmt = select(KnowledgeCollection).where(
            KnowledgeCollection.name.like('%政策%')
        )
        result = await session.execute(stmt)
        collections = result.scalars().all()

        if not collections:
            print("❌ 未找到政策知识库")
            return

        for coll in collections:
            print(f"\n✅ 找到知识库: {coll.name} (ID: {coll.id})")
            print(f"   - default_chunking_config_id: {coll.default_chunking_config_id}")
            print(f"   - chunking_config (JSON): {coll.chunking_config}")

            # 2. 检查该知识库的切分配置ID是否有效
            if coll.default_chunking_config_id:
                print(f"\n2. 检查切分配置ID: {coll.default_chunking_config_id}")
                print("=" * 80)

                config_stmt = select(ChunkingConfig).where(
                    ChunkingConfig.id == coll.default_chunking_config_id
                )
                config_result = await session.execute(config_stmt)
                config = config_result.scalar_one_or_none()

                if config:
                    print(f"✅ 找到配置记录:")
                    print(f"   - 名称: {config.name}")
                    print(f"   - 策略: {config.strategy}")
                    print(f"   - 作用域: {config.scope}")
                    print(f"   - 知识库ID: {config.collection_id}")
                    print(f"   - 是否激活: {config.is_active}")
                    print(f"   - 是否默认: {config.is_default}")
                    print(f"   - chunk_token_num: {config.chunk_token_num}")
                    print(f"   - chunk_overlap: {config.chunk_overlap}")
                else:
                    print(f"❌ 配置不存在! ID: {coll.default_chunking_config_id}")
                    print("   这就是为什么系统回退到硬编码默认配置的原因!")
            else:
                print("\n⚠️  知识库没有设置 default_chunking_config_id")

            # 3. 列出该知识库的所有collection_specific配置
            print(f"\n3. 列出知识库 '{coll.name}' 的所有专属配置:")
            print("=" * 80)

            specific_stmt = select(ChunkingConfig).where(
                ChunkingConfig.scope == 'collection_specific',
                ChunkingConfig.collection_id == coll.id
            )
            specific_result = await session.execute(specific_stmt)
            specific_configs = specific_result.scalars().all()

            if specific_configs:
                for cfg in specific_configs:
                    print(f"\n📋 配置: {cfg.name} (ID: {cfg.id})")
                    print(f"   - 策略: {cfg.strategy}")
                    print(f"   - 是否激活: {cfg.is_active}")
                    print(f"   - chunk_token_num: {cfg.chunk_token_num}")
                    print(f"   - 创建时间: {cfg.created_at}")

                    # 检查是否这个配置被collection引用
                    if coll.default_chunking_config_id == cfg.id:
                        print(f"   ✅ 这个配置被知识库引用 (应该使用这个!)")
                    else:
                        print(f"   ⚠️  这个配置没有被知识库引用")
            else:
                print("   ❌ 没有找到专属配置")

        # 4. 列出所有全局配置
        print(f"\n4. 列出所有全局配置:")
        print("=" * 80)

        global_stmt = select(ChunkingConfig).where(
            ChunkingConfig.scope == 'global',
            ChunkingConfig.is_active == True
        )
        global_result = await session.execute(global_stmt)
        global_configs = global_result.scalars().all()

        for cfg in global_configs:
            default_marker = " [默认]" if cfg.is_default else ""
            print(f"📋 {cfg.name}{default_marker} (ID: {cfg.id})")
            print(f"   - 策略: {cfg.strategy}, chunk_token_num: {cfg.chunk_token_num}")

        # 5. 检查最近上传的文档使用了什么配置
        print(f"\n5. 检查最近上传的文档的切分配置:")
        print("=" * 80)

        for coll in collections:
            doc_query = text("""
                SELECT
                    kd.id,
                    kd.filename,
                    kd.document_metadata,
                    dc.chunk_metadata
                FROM knowledge_documents kd
                LEFT JOIN document_chunks dc ON dc.document_id = kd.id
                WHERE kd.collection_id = :collection_id
                ORDER BY kd.created_at DESC
                LIMIT 5
            """)
            doc_result = await session.execute(doc_query, {"collection_id": coll.id})
            docs = doc_result.fetchall()

            if docs:
                print(f"\n知识库: {coll.name}")
                for doc in docs[:1]:  # 只看第一个文档的第一个chunk
                    print(f"\n📄 文档: {doc.filename} (ID: {doc.id})")
                    print(f"   document_metadata: {doc.document_metadata}")
                    print(f"   chunk_metadata: {doc.chunk_metadata}")

                    # 从metadata中提取配置信息
                    if doc.chunk_metadata and 'processing_config' in doc.chunk_metadata:
                        proc_config = doc.chunk_metadata['processing_config']
                        print(f"\n   📊 使用的切分配置:")
                        print(f"      - 配置ID: {proc_config.get('chunking_config_id')}")
                        print(f"      - 配置名称: {proc_config.get('chunking_config_name')}")
                        print(f"      - 切分策略: {proc_config.get('chunking_strategy')}")
                        print(f"      - chunk_size: {proc_config.get('chunk_size')}")
                        print(f"      - chunk_overlap: {proc_config.get('chunk_overlap')}")
            else:
                print(f"   ⚠️  没有找到文档")

if __name__ == "__main__":
    asyncio.run(diagnose_chunking_config())
