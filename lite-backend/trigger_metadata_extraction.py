#!/usr/bin/env python3
"""
手动触发URL文档的元数据提取
用于补充已有文档的元数据
"""
import asyncio
import sys
from service.url_document_processor import url_document_processor
from db.database import get_db
from db.repositories.knowledge_repository import KnowledgeRepository

async def trigger_extraction_for_document(document_id: str):
    """为指定文档触发元数据提取"""
    try:
        # 获取文档
        async for db in get_db():
            repo = KnowledgeRepository(db)
            document = await repo.get_document(document_id)
            break

        if not document:
            print(f"❌ 文档不存在: {document_id}")
            return False

        print(f"📄 文档信息:")
        print(f"  ID: {document.id}")
        print(f"  标题: {document.title}")
        print(f"  URL: {document.source_url}")
        print(f"  类型: {document.file_type}")
        print(f"  元数据状态: {document.metadata_extraction_status}")
        print()

        # 触发元数据提取
        print("🔄 开始元数据提取...")
        await url_document_processor._trigger_metadata_extraction(document)

        # 查询更新后的状态
        async for db in get_db():
            repo = KnowledgeRepository(db)
            updated_doc = await repo.get_document(document_id)
            break

        print()
        print(f"✅ 元数据提取完成!")
        print(f"  状态: {updated_doc.metadata_extraction_status}")
        print(f"  模板ID: {updated_doc.metadata_template_id}")
        print(f"  提取字段数: {len(updated_doc.structured_metadata) if updated_doc.structured_metadata else 0}")

        if updated_doc.structured_metadata:
            print(f"\n📊 提取的元数据:")
            for key, value in updated_doc.structured_metadata.items():
                print(f"  - {key}: {value}")

        return True

    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    if len(sys.argv) < 2:
        print("用法: python trigger_metadata_extraction.py <document_id>")
        print("示例: python trigger_metadata_extraction.py 643221fe-8053-47d7-b184-d36b0ffe42d2")
        sys.exit(1)

    document_id = sys.argv[1]
    success = await trigger_extraction_for_document(document_id)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
