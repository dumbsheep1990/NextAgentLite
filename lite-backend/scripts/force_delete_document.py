"""
强制删除单个文档及其所有关联引用的数据脚本（安全顺序删除，规避外键约束）。

使用方法：
    python lite-backend/scripts/force_delete_document.py --doc-id <DOCUMENT_ID>

说明：
    - 删除顺序：generated_qa_pairs → qa_generation_tasks → qa_extraction_queue → qa_datasets → document_chunks → knowledge_documents
    - 执行完成后会打印剩余引用计数，确认清理干净。
"""
import argparse
import asyncio
import sys
from pathlib import Path
from typing import Dict

from sqlalchemy import text

# 修正导入路径，使脚本可直接从仓库根目录运行
REPO_ROOT = Path(__file__).resolve().parents[2]
LITE_BACKEND_ROOT = REPO_ROOT / "lite-backend"
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
if str(LITE_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(LITE_BACKEND_ROOT))

from db.database import get_async_session
from core.logger import logger


COUNT_SQL = text(
    """
WITH params AS (
  SELECT :doc_id::text AS doc_id
)
SELECT
  (SELECT COUNT(*) FROM qa_generation_tasks t JOIN params p ON t.document_id = p.doc_id)                          AS gen_tasks,
  (SELECT COUNT(*) FROM generated_qa_pairs qp WHERE qp.task_id IN (SELECT t.id FROM qa_generation_tasks t, params p WHERE t.document_id = p.doc_id)) AS gen_pairs,
  (SELECT COUNT(*) FROM qa_extraction_queue q JOIN params p ON q.document_id = p.doc_id)                           AS queue_by_doc,
  (SELECT COUNT(*) FROM qa_datasets d JOIN params p ON d.source_document_id = p.doc_id)                            AS datasets_by_doc,
  (SELECT COUNT(*) FROM qa_extraction_queue q WHERE q.target_dataset_id IN (SELECT d.id FROM qa_datasets d, params p WHERE d.source_document_id = p.doc_id)) AS queue_by_dataset,
  (SELECT COUNT(*) FROM document_chunks c JOIN params p ON c.document_id = p.doc_id)                               AS chunks,
  (SELECT COUNT(*) FROM knowledge_documents kd JOIN params p ON kd.id = p.doc_id)                                  AS doc_exists
"""
)


DELETE_SQLS = [
    # 1) 删除生成的QA对（如果有）
    text(
        """
        DELETE FROM generated_qa_pairs
        WHERE task_id IN (
          SELECT id FROM qa_generation_tasks t WHERE t.document_id = :doc_id
        )
        """
    ),
    # 2) 删除生成任务
    text("DELETE FROM qa_generation_tasks WHERE document_id = :doc_id"),
    # 3) 删除提取队列（先按文档ID）
    text("DELETE FROM qa_extraction_queue WHERE document_id = :doc_id"),
    # 4) 再删除仍指向该文档衍生数据集的队列项（按数据集外键）
    text(
        """
        DELETE FROM qa_extraction_queue
        WHERE target_dataset_id IN (
          SELECT id FROM qa_datasets WHERE source_document_id = :doc_id
        )
        """
    ),
    # 5) 删除该文档衍生的数据集
    text("DELETE FROM qa_datasets WHERE source_document_id = :doc_id"),
    # 6) 删除分块（若有）
    text("DELETE FROM document_chunks WHERE document_id = :doc_id"),
    # 7) 删除文档本体
    text("DELETE FROM knowledge_documents WHERE id = :doc_id"),
]


async def count_refs(session, doc_id: str) -> Dict[str, int]:
    res = await session.execute(COUNT_SQL, {"doc_id": doc_id})
    row = res.fetchone()
    keys = [
        "gen_tasks",
        "gen_pairs",
        "queue_by_doc",
        "datasets_by_doc",
        "queue_by_dataset",
        "chunks",
        "doc_exists",
    ]
    return {k: int(row[i]) for i, k in enumerate(keys)}


async def force_delete_document(doc_id: str) -> None:
    async with get_async_session() as session:
        before = await count_refs(session, doc_id)
        logger.info(f"[强制删除-前] 引用计数: {before}")

        # 依次执行删除（每步单独提交，避免整个事务回滚）
        for idx, stmt in enumerate(DELETE_SQLS, start=1):
            try:
                result = await session.execute(stmt, {"doc_id": doc_id})
                await session.commit()
                logger.info(f"[强制删除-步骤{idx}] 影响行数: {result.rowcount}")
            except Exception as e:
                logger.warning(f"[强制删除-步骤{idx}] 执行失败: {e}. 将继续后续步骤。")
                try:
                    await session.rollback()
                except Exception:
                    pass

        after = await count_refs(session, doc_id)
        logger.info(f"[强制删除-后] 引用计数: {after}")
        if after.get("doc_exists", 0) == 0:
            print(f"✅ 文档 {doc_id} 及其关联数据已清理干净")
        else:
            print(f"⚠️ 文档 {doc_id} 仍存在，剩余计数: {after}")


def main():
    parser = argparse.ArgumentParser(description="强制删除单个文档及其关联数据")
    parser.add_argument("--doc-id", required=True, help="要强制删除的文档ID")
    args = parser.parse_args()

    asyncio.run(force_delete_document(args.doc_id))


if __name__ == "__main__":
    main()
