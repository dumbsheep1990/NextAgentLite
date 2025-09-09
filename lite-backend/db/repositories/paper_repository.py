"""
论文数据访问层 - Repository模式实现
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_

from core.logger import logger
from models.paper import Paper


class PaperRepository:
    """论文数据仓库"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_paper(
            self,
            title: str,
            authors: str,
            journal: Optional[str] = None,
            year: Optional[int] = None,
            pages: Optional[str] = None,
            doi: Optional[str] = None,
            url: Optional[str] = None,
            abstract: Optional[str] = None,
            content: Optional[str] = None,
            keywords: Optional[List[str]] = None,
            file_path: Optional[str] = None,
            file_size: Optional[int] = None,
            **kwargs
    ) -> int:
        """保存论文记录"""
        try:
            paper = Paper(
                title=title,
                authors=authors,
                journal=journal,
                year=year,
                pages=pages,
                doi=doi,
                url=url,
                abstract=abstract,
                content=content,
                keywords=keywords,
                file_path=file_path,
                file_size=file_size,
                **kwargs
            )
            self.session.add(paper)
            await self.session.commit()
            await self.session.refresh(paper)

            logger.info(f"论文记录已保存: id={paper.id}, title='{title[:50]}...'")
            return paper.id

        except Exception as e:
            await self.session.rollback()
            logger.error(f"保存论文记录失败: {e}")
            raise

    async def get_paper_by_id(self, paper_id: int) -> Optional[Paper]:
        """根据ID获取论文"""
        try:
            result = await self.session.execute(
                select(Paper).where(Paper.id == paper_id)
            )
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error(f"获取论文失败: id={paper_id}, error={e}")
            raise

    async def get_paper_by_doi(self, doi: str) -> Optional[Paper]:
        """根据DOI获取论文"""
        try:
            result = await self.session.execute(
                select(Paper).where(Paper.doi == doi)
            )
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error(f"获取论文失败: doi={doi}, error={e}")
            raise

    async def search_papers(
            self,
            query: Optional[str] = None,
            year_from: Optional[int] = None,
            year_to: Optional[int] = None,
            journal: Optional[str] = None,
            authors: Optional[str] = None,
            keywords: Optional[List[str]] = None,
            page: int = 1,
            size: int = 20,
            order_by: str = "created_at",
            order_desc: bool = True
    ) -> Dict[str, Any]:
        """搜索论文"""
        try:
            # 基础查询
            stmt = select(Paper)

            # 添加搜索条件
            if query:
                stmt = stmt.where(
                    or_(
                        Paper.title.ilike(f"%{query}%"),
                        Paper.abstract.ilike(f"%{query}%"),
                        Paper.content.ilike(f"%{query}%")
                    )
                )

            if year_from and year_to:
                stmt = stmt.where(Paper.year.between(year_from, year_to))
            elif year_from:
                stmt = stmt.where(Paper.year >= year_from)
            elif year_to:
                stmt = stmt.where(Paper.year <= year_to)

            if journal:
                stmt = stmt.where(Paper.journal.ilike(f"%{journal}%"))

            if authors:
                stmt = stmt.where(Paper.authors.ilike(f"%{authors}%"))

            if keywords:
                stmt = stmt.where(Paper.keywords.contains(keywords))

            # 获取总数
            count_stmt = select(func.count()).select_from(stmt)
            count_result = await self.session.execute(count_stmt)
            total = count_result.scalar()

            # 添加排序
            order_column = getattr(Paper, order_by, Paper.created_at)
            if order_desc:
                stmt = stmt.order_by(desc(order_column))
            else:
                stmt = stmt.order_by(order_column)

            # 分页
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # 执行查询
            result = await self.session.execute(stmt)
            papers = result.scalars().all()

            return {
                "papers": papers,
                "total": total,
                "page": page,
                "size": size,
                "total_pages": (total + size - 1) // size
            }

        except Exception as e:
            logger.error(f"搜索论文失败: {e}")
            raise

    async def update_paper(
            self,
            paper_id: int,
            update_data: Dict[str, Any]
    ) -> Optional[Paper]:
        """更新论文信息"""
        try:
            result = await self.session.execute(
                select(Paper).where(Paper.id == paper_id)
            )
            paper = result.scalar_one_or_none()

            if not paper:
                return None

            for key, value in update_data.items():
                if hasattr(paper, key):
                    setattr(paper, key, value)

            await self.session.commit()
            await self.session.refresh(paper)

            logger.info(f"论文已更新: id={paper_id}")
            return paper

        except Exception as e:
            await self.session.rollback()
            logger.error(f"更新论文失败: id={paper_id}, error={e}")
            raise

    async def delete_paper(self, paper_id: int) -> bool:
        """删除论文"""
        try:
            result = await self.session.execute(
                select(Paper).where(Paper.id == paper_id)
            )
            paper = result.scalar_one_or_none()

            if not paper:
                return False

            await self.session.delete(paper)
            await self.session.commit()

            logger.info(f"论文已删除: id={paper_id}")
            return True

        except Exception as e:
            await self.session.rollback()
            logger.error(f"删除论文失败: id={paper_id}, error={e}")
            raise

    async def get_paper_stats(self) -> Dict[str, Any]:
        """获取论文统计信息"""
        try:
            # 总论文数
            total_result = await self.session.execute(
                select(func.count(Paper.id))
            )
            total_papers = total_result.scalar()

            # 按年份统计
            year_stats_result = await self.session.execute(
                select(Paper.year, func.count(Paper.id))
                .where(Paper.year.isnot(None))
                .group_by(Paper.year)
                .order_by(Paper.year)
            )
            year_stats = {str(row[0]): row[1] for row in year_stats_result.fetchall()}

            # 按期刊统计
            journal_stats_result = await self.session.execute(
                select(Paper.journal, func.count(Paper.id))
                .where(Paper.journal.isnot(None))
                .group_by(Paper.journal)
                .order_by(func.count(Paper.id).desc())
                .limit(10)
            )
            journal_stats = {row[0]: row[1] for row in journal_stats_result.fetchall()}

            # 处理状态统计
            process_stats_result = await self.session.execute(
                select(Paper.processed, func.count(Paper.id))
                .group_by(Paper.processed)
            )
            process_stats = {row[0]: row[1] for row in process_stats_result.fetchall()}

            # 平均置信度
            avg_confidence_result = await self.session.execute(
                select(func.avg(Paper.confidence_score))
                .where(Paper.confidence_score.isnot(None))
            )
            avg_confidence = avg_confidence_result.scalar() or 0.0

            return {
                "total_papers": total_papers,
                "year_stats": year_stats,
                "journal_stats": journal_stats,
                "process_stats": process_stats,
                "avg_confidence": round(avg_confidence, 2)
            }

        except Exception as e:
            logger.error(f"获取论文统计失败: {e}")
            raise

    async def batch_update_embeddings(
            self,
            paper_ids: List[int],
            embeddings_data: Dict[str, List[float]]
    ) -> int:
        """批量更新论文向量嵌入"""
        try:
            update_count = 0
            for paper_id in paper_ids:
                result = await self.session.execute(
                    select(Paper).where(Paper.id == paper_id)
                )
                paper = result.scalar_one_or_none()

                if paper:
                    if "title_embedding" in embeddings_data:
                        paper.title_embedding = embeddings_data["title_embedding"]
                    if "abstract_embedding" in embeddings_data:
                        paper.abstract_embedding = embeddings_data["abstract_embedding"]
                    if "content_embedding" in embeddings_data:
                        paper.content_embedding = embeddings_data["content_embedding"]

                    paper.processed = "embedded"
                    update_count += 1

            await self.session.commit()
            logger.info(f"批量更新嵌入完成: 更新了{update_count}篇论文")
            return update_count

        except Exception as e:
            await self.session.rollback()
            logger.error(f"批量更新嵌入失败: {e}")
            raise

    async def get_papers_for_processing(
            self,
            limit: int = 100,
            processed_status: str = "pending"
    ) -> List[Paper]:
        """获取待处理的论文列表"""
        try:
            result = await self.session.execute(
                select(Paper)
                .where(Paper.processed == processed_status)
                .limit(limit)
            )
            return result.scalars().all()

        except Exception as e:
            logger.error(f"获取待处理论文失败: {e}")
            raise