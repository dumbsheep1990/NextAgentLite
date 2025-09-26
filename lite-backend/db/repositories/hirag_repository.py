"""
HiRAG 数据仓库：社区报告与配置
采用轻量 SQL（text）以避免新增 ORM 模型。
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


class HiRAGRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert_community_report(
        self,
        collection_id: Optional[str],
        community_id: str,
        report: Dict[str, Any],
    ) -> None:
        """UPSERT 单条社区报告。
        report 结构参考 HiRAG CommunitySchema：包含 level/nodes/edges/report_json/report_string 等。
        """
        # 提取字段
        level = int(report.get("level", 1))
        nodes = report.get("nodes", []) or []
        edges = report.get("edges", []) or []
        chunk_ids = report.get("chunk_ids", []) or []
        occurrence = report.get("occurrence")
        sub_communities = report.get("sub_communities", []) or []

        report_json = report.get("report_json", {}) or {}
        title = report_json.get("title")
        summary = report_json.get("summary")
        findings = report_json.get("findings")  # list 或 None
        rating = report_json.get("rating")  # 数值
        rating_explanation = report_json.get("rating_explanation")

        entities = nodes  # 简化存储：将节点列表作为实体集合
        entity_count = len(nodes)
        relationship_count = len(edges)

        # 使用 INSERT ... ON CONFLICT 进行 upsert
        stmt = text(
            """
            INSERT INTO hirag_community_reports (
                community_id, collection_id, level, parent_community_id,
                title, summary, impact_rating, rating_explanation,
                detailed_findings, entities, entity_count, relationship_count,
                generation_model, generation_prompt
            ) VALUES (
                :community_id, :collection_id, :level, NULL,
                :title, :summary, :impact_rating, :rating_explanation,
                :detailed_findings, :entities, :entity_count, :relationship_count,
                :generation_model, :generation_prompt
            )
            ON CONFLICT (community_id)
            DO UPDATE SET
                collection_id = EXCLUDED.collection_id,
                level = EXCLUDED.level,
                title = EXCLUDED.title,
                summary = EXCLUDED.summary,
                impact_rating = EXCLUDED.impact_rating,
                rating_explanation = EXCLUDED.rating_explanation,
                detailed_findings = EXCLUDED.detailed_findings,
                entities = EXCLUDED.entities,
                entity_count = EXCLUDED.entity_count,
                relationship_count = EXCLUDED.relationship_count,
                updated_at = CURRENT_TIMESTAMP
            """
        )

        await self.session.execute(
            stmt,
            {
                "community_id": str(community_id),
                "collection_id": collection_id,
                "level": level,
                "title": title,
                "summary": summary,
                "impact_rating": rating,
                "rating_explanation": rating_explanation,
                "detailed_findings": findings,
                "entities": entities,
                "entity_count": entity_count,
                "relationship_count": relationship_count,
                "generation_model": None,
                "generation_prompt": None,
            },
        )

    async def bulk_upsert_community_reports(
        self, collection_id: Optional[str], reports_map: Dict[str, Dict[str, Any]]
    ) -> int:
        """批量 upsert 社区报告。返回成功条数（忽略个别错误，尽量推进）。"""
        success = 0
        for cid, report in reports_map.items():
            try:
                await self.upsert_community_report(collection_id, cid, report)
                success += 1
            except Exception:
                # 不中断批处理；实际错误记录交给上层 logger
                pass
        await self.session.commit()
        return success

    async def list_community_reports(
        self,
        collection_id: Optional[str] = None,
        level: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        where = []
        params: Dict[str, Any] = {"limit": limit, "offset": offset}
        if collection_id:
            where.append("collection_id = :collection_id")
            params["collection_id"] = collection_id
        if level is not None:
            where.append("level = :level")
            params["level"] = level
        where_clause = ("WHERE " + " AND ".join(where)) if where else ""
        q = text(
            f"""
            SELECT community_id, collection_id, level, title, summary,
                   impact_rating, entity_count, relationship_count,
                   entities, detailed_findings, updated_at
            FROM hirag_community_reports
            {where_clause}
            ORDER BY impact_rating DESC NULLS LAST, updated_at DESC
            LIMIT :limit OFFSET :offset
            """
        )
        result = await self.session.execute(q, params)
        rows = result.mappings().all()
        return [dict(r) for r in rows]

