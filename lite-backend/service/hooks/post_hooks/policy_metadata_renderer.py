"""
政策元数据渲染Hook (Post-Hook)

在LLM回答前，渲染检索到的政策文档的元数据信息
以markdown表格形式输出政策文档的关键元数据字段
"""

import logging
from typing import Optional, Dict, List, Any
from ..base import PostHook, RunInput, AgentSession
from ..registry import register_post_hook

logger = logging.getLogger(__name__)


@register_post_hook(
    hook_id='policy_metadata_renderer',
    metadata={
        'name': '政策元数据表格渲染',
        'description': '在回答前渲染检索到的政策文档元数据（markdown表格）',
        'category': 'enhancement',
        'scene': 'policy_qa'
    }
)
class PolicyMetadataRendererHook(PostHook):
    """政策元数据渲染Hook

    从检索结果中提取政策文档的元数据，并渲染为markdown表格

    支持的元数据字段：
    - 索引号 (index_number)
    - 信息分类 (category)
    - 发布机构 (issuing_agency)
    - 生成日期 (issue_date)
    - 文号 (document_number)
    - 是否有效 (is_valid)
    - 名称 (title/name)
    """

    # 元数据字段映射（爬虫字段 -> 显示名称）
    METADATA_FIELD_MAPPING = {
        '索引号': 'index_number',
        '信息分类': 'category',
        '发布机构': 'issuing_agency',
        '生成日期': 'issue_date',
        '文号': 'document_number',
        '是否有效': 'is_valid',
        '名称': 'title',
        '政策名称': 'policy_name',
        '发文机关': 'issuing_agency',
        '发布日期': 'issue_date',
        '文件编号': 'document_number',
        '有效性': 'is_valid'
    }

    def __init__(self, config: Dict):
        super().__init__(config)

        # 提取配置
        hook_config = config.get('config', {})
        self.enabled = hook_config.get('enabled', True)
        self.max_documents = hook_config.get('max_documents', 5)  # 最多渲染几个文档的元数据
        self.show_empty_fields = hook_config.get('show_empty_fields', False)  # 是否显示空字段
        self.table_style = hook_config.get('table_style', 'compact')  # compact/full

        logger.info(
            f"PolicyMetadataRendererHook 初始化完成: "
            f"最大文档数={self.max_documents}, "
            f"显示空字段={self.show_empty_fields}, "
            f"表格样式={self.table_style}"
        )

    async def execute(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> Optional[str]:
        """执行元数据渲染

        Args:
            run_input: 运行输入
            session: 会话信息
            user_id: 用户ID
            debug_mode: 调试模式
            **kwargs: 可能包含retrieval_results等上下文

        Returns:
            渲染的markdown表格文本（如果有元数据）
        """
        if not self.enabled:
            logger.debug("PolicyMetadataRendererHook 未启用")
            return None

        # 从kwargs获取检索结果
        retrieval_results = kwargs.get('retrieval_results', [])

        if not retrieval_results:
            logger.debug("没有检索结果，跳过元数据渲染")
            return None

        logger.info(f"开始渲染政策元数据，检索结果数量: {len(retrieval_results)}")

        # 提取并渲染元数据
        metadata_tables = self._render_metadata_tables(retrieval_results)

        if metadata_tables:
            # 在context中标记已渲染元数据
            run_input.context['metadata_rendered'] = True
            logger.info(f"成功渲染 {len(metadata_tables)} 个文档的元数据")
            return metadata_tables
        else:
            logger.debug("没有可渲染的元数据")
            return None

    def _render_metadata_tables(self, retrieval_results: List[Dict]) -> Optional[str]:
        """渲染元数据表格

        Args:
            retrieval_results: 检索结果列表

        Returns:
            markdown表格文本
        """
        tables = []

        # 限制处理的文档数量
        documents_to_process = retrieval_results[:self.max_documents]

        for idx, result in enumerate(documents_to_process, 1):
            # 提取文档元数据
            doc_metadata = self._extract_document_metadata(result)

            if not doc_metadata:
                continue

            # 渲染单个文档的元数据表格
            table = self._render_single_table(doc_metadata, idx)
            if table:
                tables.append(table)

        if not tables:
            return None

        # 组合所有表格
        header = "## 📋 相关政策文档信息\n\n"
        if len(tables) == 1:
            return header + tables[0]
        else:
            return header + "\n\n---\n\n".join(tables)

    def _extract_document_metadata(self, result: Dict) -> Optional[Dict]:
        """从检索结果中提取文档元数据

        Args:
            result: 单个检索结果

        Returns:
            元数据字典
        """
        # 尝试从不同路径提取元数据
        metadata = {}

        # 路径1: result.metadata
        if 'metadata' in result and isinstance(result['metadata'], dict):
            raw_meta = result['metadata']
            metadata.update(self._normalize_metadata(raw_meta))

        # 路径2: result.document_metadata
        if 'document_metadata' in result and isinstance(result['document_metadata'], dict):
            raw_meta = result['document_metadata']
            metadata.update(self._normalize_metadata(raw_meta))

        # 路径3: result.crawl_metadata（爬虫元数据）
        if 'crawl_metadata' in result and isinstance(result['crawl_metadata'], dict):
            crawl_meta = result['crawl_metadata']
            metadata.update(self._normalize_metadata(crawl_meta))

        # 路径4: 嵌套在document_metadata.crawl_metadata中
        if 'document_metadata' in result and isinstance(result['document_metadata'], dict):
            doc_meta = result['document_metadata']
            if 'crawl_metadata' in doc_meta and isinstance(doc_meta['crawl_metadata'], dict):
                metadata.update(self._normalize_metadata(doc_meta['crawl_metadata']))

        # 提取标题（如果没有在元数据中）
        if 'title' not in metadata:
            if 'title' in result:
                metadata['title'] = result['title']
            elif 'document_title' in result:
                metadata['title'] = result['document_title']
            elif 'name' in result:
                metadata['title'] = result['name']

        return metadata if metadata else None

    def _normalize_metadata(self, raw_metadata: Dict) -> Dict:
        """规范化元数据字段名

        Args:
            raw_metadata: 原始元数据

        Returns:
            规范化后的元数据
        """
        normalized = {}

        # 遍历原始元数据
        for key, value in raw_metadata.items():
            # 跳过None和空字符串
            if value is None or (isinstance(value, str) and not value.strip()):
                continue

            # 查找映射
            normalized_key = None
            for display_name, standard_key in self.METADATA_FIELD_MAPPING.items():
                if key == display_name or key == standard_key:
                    normalized_key = standard_key
                    break

            # 如果找到映射，使用标准key
            if normalized_key:
                normalized[normalized_key] = value
            else:
                # 保留原始key
                normalized[key] = value

        return normalized

    def _render_single_table(self, metadata: Dict, doc_index: int) -> Optional[str]:
        """渲染单个文档的元数据表格

        Args:
            metadata: 文档元数据
            doc_index: 文档索引

        Returns:
            markdown表格
        """
        if not metadata:
            return None

        # 定义显示顺序和字段名称
        field_order = [
            ('title', '政策名称'),
            ('document_number', '文号'),
            ('issuing_agency', '发布机构'),
            ('issue_date', '发布日期'),
            ('index_number', '索引号'),
            ('category', '信息分类'),
            ('is_valid', '是否有效'),
            ('policy_name', '政策名称'),
        ]

        # 收集有值的字段
        rows = []
        for field_key, field_name in field_order:
            if field_key in metadata:
                value = metadata[field_key]
                if value or self.show_empty_fields:
                    # 格式化值
                    formatted_value = self._format_value(value)
                    rows.append((field_name, formatted_value))

        # 添加未在预定义列表中的字段
        for key, value in metadata.items():
            # 跳过已处理的字段
            if any(key == field_key for field_key, _ in field_order):
                continue

            # 跳过内部字段
            if key.startswith('_') or key in ['id', 'document_id', 'chunk_id']:
                continue

            if value or self.show_empty_fields:
                formatted_value = self._format_value(value)
                rows.append((key, formatted_value))

        if not rows:
            return None

        # 构建表格
        if self.table_style == 'compact':
            # 紧凑样式：两列表格
            table_lines = [
                f"### 文档 {doc_index}",
                "",
                "| 字段 | 内容 |",
                "|------|------|"
            ]
            for field_name, value in rows:
                # 转义管道符
                escaped_value = str(value).replace('|', '\\|')
                table_lines.append(f"| **{field_name}** | {escaped_value} |")
        else:
            # 完整样式：展开每个字段
            table_lines = [f"### 文档 {doc_index}", ""]
            for field_name, value in rows:
                table_lines.append(f"**{field_name}**: {value}  ")

        return "\n".join(table_lines)

    def _format_value(self, value: Any) -> str:
        """格式化字段值

        Args:
            value: 原始值

        Returns:
            格式化后的字符串
        """
        if value is None:
            return ""

        if isinstance(value, bool):
            return "是" if value else "否"

        if isinstance(value, (list, tuple)):
            return "、".join(str(v) for v in value)

        if isinstance(value, dict):
            # 对于字典，尝试提取有意义的字段
            if 'name' in value:
                return str(value['name'])
            elif 'value' in value:
                return str(value['value'])
            else:
                return str(value)

        return str(value).strip()
