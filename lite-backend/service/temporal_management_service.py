"""
时间轴管理服务 - 处理文档时效性和时间相关功能

主要功能：
1. 政策文档时效性管理 (生效日期、失效日期、版本更替)
2. 学术文档时间相关性评估 (发布年份、引用趋势)
3. 企业文档版本时间线管理 (版本历史、修改时间)
4. 时间轴结构化对象管理
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional, Tuple, Union
from dataclasses import dataclass
from enum import Enum

from core.logger import logger


class TimeStatus(Enum):
    """时间状态枚举"""
    FUTURE = "future"           # 未来生效
    CURRENT = "current"         # 当前有效
    EXPIRED = "expired"         # 已过期
    HISTORICAL = "historical"   # 历史版本
    SUPERSEDED = "superseded"   # 被新版本替代
    UNKNOWN = "unknown"         # 时间状态未知


@dataclass
class TemporalDocument:
    """时间轴文档对象"""
    document_id: str
    title: str
    metadata_template: str
    
    # 通用时间字段
    creation_date: Optional[datetime] = None
    publication_date: Optional[datetime] = None
    last_modified: Optional[datetime] = None
    
    # 政策文档特化字段
    effective_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    policy_level: Optional[str] = None
    issuing_authority: Optional[str] = None
    doc_number: Optional[str] = None
    
    # 学术文档特化字段
    conference_date: Optional[datetime] = None
    submission_date: Optional[datetime] = None
    acceptance_date: Optional[datetime] = None
    citation_trend: Optional[Dict[str, int]] = None
    
    # 企业文档特化字段
    version: Optional[str] = None
    approval_date: Optional[datetime] = None
    review_date: Optional[datetime] = None
    next_review_date: Optional[datetime] = None
    
    # 时间状态
    time_status: TimeStatus = TimeStatus.UNKNOWN
    temporal_score: float = 0.0  # 时间相关性评分


@dataclass
class TemporalQuery:
    """时间轴查询对象"""
    reference_time: datetime = None  # 参考时间点
    time_range: Optional[Tuple[datetime, datetime]] = None  # 时间范围
    time_status_filter: Optional[List[TimeStatus]] = None  # 状态过滤
    include_historical: bool = False  # 是否包含历史版本
    temporal_weight: float = 0.3  # 时间权重 (0-1)
    
    def __post_init__(self):
        if self.reference_time is None:
            self.reference_time = datetime.now(timezone.utc)


class TemporalManagementService:
    """时间轴管理服务"""
    
    def __init__(self):
        self.timezone = timezone.utc
        
        # 时间权重配置
        self.time_weights = {
            "policy": {
                "current_boost": 1.5,      # 当前有效政策加权
                "authority_time_decay": 0.1,  # 权威性时间衰减
                "superseded_penalty": -0.8    # 被替代政策惩罚
            },
            "academic": {
                "recency_boost": 0.3,      # 近期发表加权  
                "citation_time_factor": 0.2,  # 引用时间因子
                "conference_boost": 0.1       # 会议时间加权
            },
            "enterprise": {
                "version_currency": 1.2,    # 最新版本加权
                "approval_boost": 0.5,      # 已审批加权
                "review_decay": 0.05        # 审查时间衰减
            },
            "general": {
                "publication_recency": 0.2, # 发表时间新近性
                "modification_boost": 0.1   # 最近修改加权
            }
        }
    
    async def process_temporal_documents(
        self,
        documents: List[Dict[str, Any]],
        query_time: Optional[datetime] = None
    ) -> List[TemporalDocument]:
        """将文档转换为时间轴结构化对象"""
        
        if query_time is None:
            query_time = datetime.now(self.timezone)
        
        temporal_docs = []
        
        for doc_data in documents:
            try:
                temporal_doc = await self._create_temporal_document(doc_data, query_time)
                temporal_docs.append(temporal_doc)
            except Exception as e:
                logger.warning(f"创建时间轴文档失败 {doc_data.get('id', 'unknown')}: {e}")
                continue
        
        # 计算时间相关性评分
        await self._calculate_temporal_scores(temporal_docs, query_time)
        
        logger.info(f"处理了 {len(temporal_docs)} 个时间轴文档对象")
        return temporal_docs
    
    async def _create_temporal_document(
        self, 
        doc_data: Dict[str, Any], 
        reference_time: datetime
    ) -> TemporalDocument:
        """创建时间轴文档对象"""
        
        metadata = doc_data.get("metadata", {})
        template = doc_data.get("metadata_template", "general")
        
        # 创建基础时间轴文档
        temporal_doc = TemporalDocument(
            document_id=doc_data.get("document_id", doc_data.get("id")),
            title=doc_data.get("title", ""),
            metadata_template=template,
            creation_date=self._parse_datetime(metadata.get("creation_date")),
            publication_date=self._parse_datetime(metadata.get("publication_date")),
            last_modified=self._parse_datetime(metadata.get("last_modified"))
        )
        
        # 根据模版类型填充特化字段
        if template == "policy":
            await self._populate_policy_temporal_fields(temporal_doc, metadata)
        elif template == "academic":
            await self._populate_academic_temporal_fields(temporal_doc, metadata)
        elif template == "enterprise":
            await self._populate_enterprise_temporal_fields(temporal_doc, metadata)
        
        # 确定时间状态
        temporal_doc.time_status = self._determine_time_status(temporal_doc, reference_time)
        
        return temporal_doc
    
    async def _populate_policy_temporal_fields(
        self, 
        temporal_doc: TemporalDocument, 
        metadata: Dict[str, Any]
    ):
        """填充政策文档时间字段"""
        temporal_doc.effective_date = self._parse_datetime(metadata.get("effective_date"))
        temporal_doc.expiry_date = self._parse_datetime(metadata.get("expiry_date"))
        temporal_doc.policy_level = metadata.get("policy_level")
        temporal_doc.issuing_authority = metadata.get("issuing_authority")
        temporal_doc.doc_number = metadata.get("doc_number")
    
    async def _populate_academic_temporal_fields(
        self, 
        temporal_doc: TemporalDocument, 
        metadata: Dict[str, Any]
    ):
        """填充学术文档时间字段"""
        temporal_doc.conference_date = self._parse_datetime(metadata.get("conference_date"))
        temporal_doc.submission_date = self._parse_datetime(metadata.get("submission_date"))
        temporal_doc.acceptance_date = self._parse_datetime(metadata.get("acceptance_date"))
        
        # 处理引用趋势数据
        citation_data = metadata.get("citation_trend")
        if isinstance(citation_data, dict):
            temporal_doc.citation_trend = citation_data
    
    async def _populate_enterprise_temporal_fields(
        self, 
        temporal_doc: TemporalDocument, 
        metadata: Dict[str, Any]
    ):
        """填充企业文档时间字段"""
        temporal_doc.version = metadata.get("version")
        temporal_doc.approval_date = self._parse_datetime(metadata.get("approval_date"))
        temporal_doc.review_date = self._parse_datetime(metadata.get("review_date"))
        temporal_doc.next_review_date = self._parse_datetime(metadata.get("next_review_date"))
    
    def _determine_time_status(
        self, 
        temporal_doc: TemporalDocument, 
        reference_time: datetime
    ) -> TimeStatus:
        """确定文档时间状态"""
        
        template = temporal_doc.metadata_template
        
        if template == "policy":
            return self._determine_policy_time_status(temporal_doc, reference_time)
        elif template == "academic":
            return self._determine_academic_time_status(temporal_doc, reference_time)
        elif template == "enterprise":
            return self._determine_enterprise_time_status(temporal_doc, reference_time)
        else:
            return self._determine_general_time_status(temporal_doc, reference_time)
    
    def _determine_policy_time_status(
        self, 
        temporal_doc: TemporalDocument, 
        reference_time: datetime
    ) -> TimeStatus:
        """确定政策文档时间状态"""
        
        effective_date = temporal_doc.effective_date
        expiry_date = temporal_doc.expiry_date
        
        # 检查是否未来生效
        if effective_date and effective_date > reference_time:
            return TimeStatus.FUTURE
        
        # 检查是否已过期
        if expiry_date and expiry_date < reference_time:
            return TimeStatus.EXPIRED
        
        # 检查是否当前有效
        if effective_date and effective_date <= reference_time:
            if not expiry_date or expiry_date >= reference_time:
                return TimeStatus.CURRENT
        
        # 如果没有明确的时间信息，基于发布时间判断
        if temporal_doc.publication_date:
            days_since_publication = (reference_time - temporal_doc.publication_date).days
            if days_since_publication > 1825:  # 5年以上
                return TimeStatus.HISTORICAL
            else:
                return TimeStatus.CURRENT
        
        return TimeStatus.UNKNOWN
    
    def _determine_academic_time_status(
        self, 
        temporal_doc: TemporalDocument, 
        reference_time: datetime
    ) -> TimeStatus:
        """确定学术文档时间状态"""
        
        pub_date = temporal_doc.publication_date
        if not pub_date:
            return TimeStatus.UNKNOWN
        
        years_since_publication = (reference_time - pub_date).days / 365.25
        
        if years_since_publication <= 2:
            return TimeStatus.CURRENT  # 最近2年的研究
        elif years_since_publication <= 5:
            return TimeStatus.CURRENT  # 5年内仍有价值
        else:
            return TimeStatus.HISTORICAL  # 历史研究
    
    def _determine_enterprise_time_status(
        self, 
        temporal_doc: TemporalDocument, 
        reference_time: datetime
    ) -> TimeStatus:
        """确定企业文档时间状态"""
        
        # 检查审批日期和版本
        approval_date = temporal_doc.approval_date
        next_review = temporal_doc.next_review_date
        
        if approval_date and approval_date <= reference_time:
            # 已审批的文档
            if next_review and next_review < reference_time:
                return TimeStatus.EXPIRED  # 需要重新审查
            else:
                return TimeStatus.CURRENT  # 当前有效
        elif approval_date and approval_date > reference_time:
            return TimeStatus.FUTURE  # 未来审批
        
        # 基于最后修改时间判断
        if temporal_doc.last_modified:
            days_since_modified = (reference_time - temporal_doc.last_modified).days
            if days_since_modified > 180:  # 6个月未修改
                return TimeStatus.HISTORICAL
            else:
                return TimeStatus.CURRENT
        
        return TimeStatus.UNKNOWN
    
    def _determine_general_time_status(
        self, 
        temporal_doc: TemporalDocument, 
        reference_time: datetime
    ) -> TimeStatus:
        """确定通用文档时间状态"""
        
        # 基于发布时间和修改时间的综合判断
        pub_date = temporal_doc.publication_date
        mod_date = temporal_doc.last_modified
        
        latest_date = max(filter(None, [pub_date, mod_date]), default=None)
        
        if latest_date:
            days_since = (reference_time - latest_date).days
            if days_since <= 365:
                return TimeStatus.CURRENT  # 1年内
            elif days_since <= 1825:  # 5年内
                return TimeStatus.CURRENT
            else:
                return TimeStatus.HISTORICAL
        
        return TimeStatus.UNKNOWN
    
    async def _calculate_temporal_scores(
        self, 
        temporal_docs: List[TemporalDocument], 
        reference_time: datetime
    ):
        """计算时间相关性评分"""
        
        for doc in temporal_docs:
            template = doc.metadata_template
            weights = self.time_weights.get(template, self.time_weights["general"])
            
            score = 0.0
            
            if template == "policy":
                score = self._calculate_policy_temporal_score(doc, reference_time, weights)
            elif template == "academic":
                score = self._calculate_academic_temporal_score(doc, reference_time, weights)
            elif template == "enterprise":
                score = self._calculate_enterprise_temporal_score(doc, reference_time, weights)
            else:
                score = self._calculate_general_temporal_score(doc, reference_time, weights)
            
            # 基于时间状态的调整
            score *= self._get_time_status_multiplier(doc.time_status)
            
            # 确保评分在合理范围内
            doc.temporal_score = max(0.0, min(2.0, score))
    
    def _calculate_policy_temporal_score(
        self, 
        doc: TemporalDocument, 
        reference_time: datetime, 
        weights: Dict[str, float]
    ) -> float:
        """计算政策文档时间评分"""
        
        score = 1.0  # 基础分
        
        # 当前有效性加权
        if doc.time_status == TimeStatus.CURRENT:
            score *= weights["current_boost"]
        
        # 权威性时间衰减
        if doc.publication_date:
            years_since_pub = (reference_time - doc.publication_date).days / 365.25
            decay_factor = max(0.5, 1 - years_since_pub * weights["authority_time_decay"])
            score *= decay_factor
        
        # 被替代政策惩罚
        if doc.time_status == TimeStatus.SUPERSEDED:
            score += weights["superseded_penalty"]
        
        return score
    
    def _calculate_academic_temporal_score(
        self, 
        doc: TemporalDocument, 
        reference_time: datetime, 
        weights: Dict[str, float]
    ) -> float:
        """计算学术文档时间评分"""
        
        score = 1.0
        
        # 近期发表加权
        if doc.publication_date:
            years_since_pub = (reference_time - doc.publication_date).days / 365.25
            recency_boost = max(0, weights["recency_boost"] * (10 - years_since_pub) / 10)
            score += recency_boost
        
        # 引用趋势考虑
        if doc.citation_trend:
            recent_citations = sum(
                count for year, count in doc.citation_trend.items()
                if int(year) >= reference_time.year - 3
            )
            citation_boost = min(0.5, recent_citations * weights["citation_time_factor"] / 100)
            score += citation_boost
        
        # 会议时间加权
        if doc.conference_date:
            conf_recency = (reference_time - doc.conference_date).days / 365.25
            if conf_recency <= 2:  # 2年内的会议
                score += weights["conference_boost"]
        
        return score
    
    def _calculate_enterprise_temporal_score(
        self, 
        doc: TemporalDocument, 
        reference_time: datetime, 
        weights: Dict[str, float]
    ) -> float:
        """计算企业文档时间评分"""
        
        score = 1.0
        
        # 版本时效性
        if doc.time_status == TimeStatus.CURRENT:
            score *= weights["version_currency"]
        
        # 审批状态加权
        if doc.approval_date and doc.approval_date <= reference_time:
            score += weights["approval_boost"]
        
        # 审查时间衰减
        if doc.review_date:
            days_since_review = (reference_time - doc.review_date).days
            decay = days_since_review * weights["review_decay"] / 365
            score = max(0.5, score - decay)
        
        return score
    
    def _calculate_general_temporal_score(
        self, 
        doc: TemporalDocument, 
        reference_time: datetime, 
        weights: Dict[str, float]
    ) -> float:
        """计算通用文档时间评分"""
        
        score = 1.0
        
        # 发表时间新近性
        if doc.publication_date:
            years_since_pub = (reference_time - doc.publication_date).days / 365.25
            recency_boost = max(0, weights["publication_recency"] * (5 - years_since_pub) / 5)
            score += recency_boost
        
        # 最近修改加权
        if doc.last_modified:
            days_since_mod = (reference_time - doc.last_modified).days
            if days_since_mod <= 180:  # 6个月内修改
                score += weights["modification_boost"]
        
        return score
    
    def _get_time_status_multiplier(self, status: TimeStatus) -> float:
        """获取时间状态评分乘数"""
        multipliers = {
            TimeStatus.CURRENT: 1.0,
            TimeStatus.FUTURE: 0.7,    # 未来文档相关性较低
            TimeStatus.EXPIRED: 0.3,   # 过期文档相关性很低
            TimeStatus.HISTORICAL: 0.6, # 历史文档有一定价值
            TimeStatus.SUPERSEDED: 0.2, # 被替代文档价值很低
            TimeStatus.UNKNOWN: 0.8    # 未知状态适中
        }
        return multipliers.get(status, 0.8)
    
    def _parse_datetime(self, date_str: Optional[Union[str, datetime]]) -> Optional[datetime]:
        """解析时间字符串"""
        if not date_str:
            return None
        
        if isinstance(date_str, datetime):
            return date_str.replace(tzinfo=self.timezone)
        
        try:
            # 尝试多种时间格式
            formats = [
                "%Y-%m-%dT%H:%M:%S.%fZ",
                "%Y-%m-%dT%H:%M:%SZ", 
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%d",
                "%Y/%m/%d",
                "%d/%m/%Y"
            ]
            
            for fmt in formats:
                try:
                    dt = datetime.strptime(str(date_str), fmt)
                    return dt.replace(tzinfo=self.timezone)
                except ValueError:
                    continue
            
            logger.warning(f"无法解析时间字符串: {date_str}")
            return None
            
        except Exception as e:
            logger.warning(f"时间解析异常 {date_str}: {e}")
            return None
    
    async def filter_by_temporal_query(
        self,
        temporal_docs: List[TemporalDocument],
        temporal_query: TemporalQuery
    ) -> List[TemporalDocument]:
        """根据时间查询过滤文档"""
        
        filtered_docs = []
        
        for doc in temporal_docs:
            # 状态过滤
            if temporal_query.time_status_filter:
                if doc.time_status not in temporal_query.time_status_filter:
                    continue
            
            # 时间范围过滤
            if temporal_query.time_range:
                start_time, end_time = temporal_query.time_range
                doc_time = self._get_representative_time(doc)
                
                if doc_time and (doc_time < start_time or doc_time > end_time):
                    continue
            
            # 历史版本过滤
            if not temporal_query.include_historical:
                if doc.time_status in [TimeStatus.HISTORICAL, TimeStatus.EXPIRED, TimeStatus.SUPERSEDED]:
                    continue
            
            filtered_docs.append(doc)
        
        # 按时间相关性评分排序
        filtered_docs.sort(
            key=lambda d: d.temporal_score * temporal_query.temporal_weight, 
            reverse=True
        )
        
        return filtered_docs
    
    def _get_representative_time(self, doc: TemporalDocument) -> Optional[datetime]:
        """获取文档的代表性时间"""
        # 按优先级选择最合适的时间
        candidates = [
            doc.effective_date,
            doc.publication_date, 
            doc.approval_date,
            doc.conference_date,
            doc.creation_date,
            doc.last_modified
        ]
        
        return next((dt for dt in candidates if dt is not None), None)
    
    async def get_temporal_statistics(
        self, 
        temporal_docs: List[TemporalDocument]
    ) -> Dict[str, Any]:
        """获取时间轴统计信息"""
        
        if not temporal_docs:
            return {}
        
        # 状态分布统计
        status_dist = {}
        for doc in temporal_docs:
            status = doc.time_status.value
            status_dist[status] = status_dist.get(status, 0) + 1
        
        # 模版类型时间分布
        template_time_dist = {}
        for doc in temporal_docs:
            template = doc.metadata_template
            if template not in template_time_dist:
                template_time_dist[template] = {
                    "count": 0,
                    "avg_temporal_score": 0.0,
                    "status_breakdown": {}
                }
            
            template_stats = template_time_dist[template]
            template_stats["count"] += 1
            template_stats["avg_temporal_score"] += doc.temporal_score
            
            status = doc.time_status.value
            template_stats["status_breakdown"][status] = (
                template_stats["status_breakdown"].get(status, 0) + 1
            )
        
        # 计算平均分
        for stats in template_time_dist.values():
            if stats["count"] > 0:
                stats["avg_temporal_score"] /= stats["count"]
        
        # 时间范围统计
        time_range = self._calculate_time_range(temporal_docs)
        
        return {
            "total_documents": len(temporal_docs),
            "status_distribution": status_dist,
            "template_time_distribution": template_time_dist,
            "time_range": time_range,
            "avg_temporal_score": sum(d.temporal_score for d in temporal_docs) / len(temporal_docs)
        }
    
    def _calculate_time_range(self, temporal_docs: List[TemporalDocument]) -> Dict[str, str]:
        """计算文档时间范围"""
        all_times = []
        
        for doc in temporal_docs:
            times = [
                doc.creation_date, doc.publication_date, doc.last_modified,
                doc.effective_date, doc.expiry_date, doc.conference_date,
                doc.approval_date, doc.review_date
            ]
            all_times.extend([t for t in times if t is not None])
        
        if not all_times:
            return {}
        
        earliest = min(all_times)
        latest = max(all_times)
        
        return {
            "earliest_date": earliest.isoformat(),
            "latest_date": latest.isoformat(),
            "time_span_days": (latest - earliest).days
        }


# 创建全局服务实例
temporal_management_service = TemporalManagementService()

# 导出
__all__ = [
    'TemporalManagementService',
    'TemporalDocument', 
    'TemporalQuery',
    'TimeStatus',
    'temporal_management_service'
]