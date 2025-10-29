"""
查询增强Hook示例 - 展示如何调用工具

本示例展示了Hook如何调用API和MCP工具进行查询增强
"""

import logging
from typing import Optional, Dict, List
from ..base import PreHook, RunInput, AgentSession
from ..registry import register_pre_hook

logger = logging.getLogger(__name__)


@register_pre_hook(
    hook_id='query_enhancement_example',
    metadata={
        'name': '查询增强示例',
        'description': '展示如何使用API和MCP工具进行查询增强',
        'category': 'enhancement'
    }
)
class QueryEnhancementExampleHook(PreHook):
    """查询增强Hook - 工具调用示例

    功能：
    1. 使用翻译API工具翻译查询
    2. 使用MCP同义词工具扩展查询
    3. 使用意图分类API识别查询类型
    """

    def __init__(self, config: Dict):
        super().__init__(config)

        # 从配置中提取工具配置
        hook_config = config.get('config', {})

        # 翻译工具配置
        self.enable_translation = hook_config.get('enable_translation', False)
        translation_config = hook_config.get('translation_tool', {})
        self.translation_tool_id = translation_config.get('tool_id', 'api:translation:translate_text')
        self.source_lang = translation_config.get('source_lang', 'auto')
        self.target_lang = translation_config.get('target_lang', 'en')

        # 同义词工具配置
        self.enable_synonym_expansion = hook_config.get('enable_synonym_expansion', False)
        synonym_config = hook_config.get('synonym_tool', {})
        self.synonym_tool_id = synonym_config.get('tool_id', 'mcp:wordnet:get_synonyms')
        self.max_synonyms = synonym_config.get('max_synonyms', 3)

        # 意图分类工具配置（可选）
        self.enable_intent_classification = hook_config.get('enable_intent_classification', False)
        self.intent_tool_id = hook_config.get('intent_classifier_tool', 'api:nlp_service:classify_intent')

        logger.info(
            f"QueryEnhancementExampleHook 初始化: "
            f"translation={self.enable_translation}, "
            f"synonyms={self.enable_synonym_expansion}, "
            f"intent={self.enable_intent_classification}"
        )

    async def execute(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> None:
        """执行查询增强

        Args:
            run_input: 运行输入（可修改）
            session: 会话信息
            user_id: 用户ID
            debug_mode: 调试模式
        """
        original_query = run_input.input_content
        logger.info(f"开始查询增强: query='{original_query[:50]}...'")

        # 初始化增强结果存储
        enhancement_results = {
            'original_query': original_query,
            'enhanced': False,
            'modifications': []
        }

        # =====================================================
        # 1. 使用API工具进行翻译
        # =====================================================
        if self.enable_translation:
            try:
                logger.info("调用翻译API工具...")

                # 方法1: 使用 call_api_tool (推荐)
                translation_result = await self.call_api_tool(
                    self.translation_tool_id,
                    text=original_query,
                    source_lang=self.source_lang,
                    target_lang=self.target_lang
                )

                # 或者使用 call_tool (自动识别类型)
                # translation_result = await self.call_tool(
                #     self.translation_tool_id,
                #     tool_type='auto',
                #     text=original_query,
                #     source_lang=self.source_lang,
                #     target_lang=self.target_lang
                # )

                if translation_result.get('success'):
                    translated_text = translation_result['data'].get('translated_text', '')

                    # 将翻译结果添加到context
                    run_input.context['translated_query'] = translated_text
                    enhancement_results['modifications'].append({
                        'type': 'translation',
                        'tool': self.translation_tool_id,
                        'result': translated_text
                    })

                    logger.info(f"✅ 翻译成功: '{translated_text[:50]}...'")
                else:
                    logger.warning(f"❌ 翻译失败: {translation_result.get('error')}")

            except Exception as e:
                logger.error(f"翻译工具调用异常: {e}")

        # =====================================================
        # 2. 使用MCP工具扩展同义词
        # =====================================================
        if self.enable_synonym_expansion:
            try:
                logger.info("调用同义词MCP工具...")

                # 提取关键词（简化示例，实际应使用分词）
                keywords = self._extract_keywords(original_query)
                all_synonyms = {}

                for keyword in keywords[:3]:  # 限制处理前3个关键词
                    # 方法2: 使用 call_mcp_tool
                    synonym_result = await self.call_mcp_tool(
                        self.synonym_tool_id,
                        word=keyword,
                        max_count=self.max_synonyms,
                        language='zh'
                    )

                    if synonym_result.get('success'):
                        synonyms = synonym_result['data'].get('synonyms', [])
                        if synonyms:
                            all_synonyms[keyword] = synonyms
                            logger.debug(f"关键词 '{keyword}' 的同义词: {synonyms}")

                if all_synonyms:
                    run_input.context['keyword_synonyms'] = all_synonyms
                    enhancement_results['modifications'].append({
                        'type': 'synonym_expansion',
                        'tool': self.synonym_tool_id,
                        'result': all_synonyms
                    })
                    logger.info(f"✅ 同义词扩展成功: {len(all_synonyms)} 个关键词")

            except Exception as e:
                logger.error(f"同义词工具调用异常: {e}")

        # =====================================================
        # 3. 使用API工具进行意图分类（可选）
        # =====================================================
        if self.enable_intent_classification:
            try:
                logger.info("调用意图分类API工具...")

                intent_result = await self.call_api_tool(
                    self.intent_tool_id,
                    query=original_query,
                    language='zh'
                )

                if intent_result.get('success'):
                    intent_data = intent_result['data']
                    intent_type = intent_data.get('intent', 'unknown')
                    confidence = intent_data.get('confidence', 0.0)

                    # 更新到context
                    run_input.context['query_intent'] = {
                        'type': intent_type,
                        'confidence': confidence,
                        'details': intent_data
                    }

                    enhancement_results['modifications'].append({
                        'type': 'intent_classification',
                        'tool': self.intent_tool_id,
                        'result': {'intent': intent_type, 'confidence': confidence}
                    })

                    logger.info(f"✅ 意图识别成功: {intent_type} (confidence: {confidence:.2f})")

            except Exception as e:
                logger.error(f"意图分类工具调用异常: {e}")

        # =====================================================
        # 4. 综合所有增强结果
        # =====================================================
        if enhancement_results['modifications']:
            enhancement_results['enhanced'] = True
            run_input.context['query_enhancement'] = enhancement_results

            logger.info(
                f"查询增强完成: 执行了 {len(enhancement_results['modifications'])} 项增强"
            )
        else:
            logger.info("查询增强完成: 未执行任何增强")

    def _extract_keywords(self, text: str) -> List[str]:
        """提取关键词（简化实现）

        实际应用中应使用专业的分词工具
        """
        # 简单示例：按空格分词并过滤停用词
        stop_words = {'的', '了', '是', '在', '和', '与', '或', '等'}
        words = text.split()
        return [w for w in words if w not in stop_words and len(w) > 1]


# =====================================================
# 示例：在配置文件中启用此Hook
# =====================================================
"""
配置文件示例 (config/hook_pipelines/my_pipeline.yaml):

pre_hooks:
  - hook_id: "query_enhancement_example"
    enabled: true
    class: "QueryEnhancementExampleHook"
    config:
      # 翻译功能
      enable_translation: true
      translation_tool:
        tool_id: "api:translation:translate_text"
        source_lang: "auto"
        target_lang: "en"

      # 同义词扩展
      enable_synonym_expansion: true
      synonym_tool:
        tool_id: "mcp:wordnet:get_synonyms"
        max_synonyms: 3

      # 意图分类
      enable_intent_classification: true
      intent_classifier_tool: "api:nlp_service:classify_intent"
"""

# =====================================================
# 工具调用方法总结
# =====================================================
"""
Hook中提供了三种工具调用方法：

1. call_tool(tool_id, tool_type='auto', **kwargs)
   - 通用方法，自动识别工具类型
   - 示例: await self.call_tool('api:config:tool', text='hello')

2. call_api_tool(tool_name, **kwargs)
   - 专门调用API工具
   - 示例: await self.call_api_tool('translation:translate', text='hello')

3. call_mcp_tool(tool_name, **kwargs)
   - 专门调用MCP工具
   - 示例: await self.call_mcp_tool('wordnet:get_synonyms', word='hello')

返回格式统一：
{
    'success': True/False,
    'data': {...},  # 工具返回的数据
    'error': '...',  # 错误信息（如果失败）
    'metadata': {...}  # 元数据
}
"""
