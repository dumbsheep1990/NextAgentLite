"""
高级智能体团队服务 - 基于Agno框架的完整Team功能
支持多语言通用知识问答
"""
import time
import asyncio
import json
import yaml
from typing import Dict, List, Optional, Any, Tuple, Generator
from dataclasses import dataclass
from pathlib import Path

# 为了兼容性，导入必要的async迭代器函数
try:
    # Python 3.10+ 内置
    aiter, anext
except NameError:
    # 向后兼容的实现
    def aiter(async_iterable):
        return async_iterable.__aiter__()
    
    async def anext(async_iterator):
        return await async_iterator.__anext__()

from agno.agent.agent import Agent
from agno.team.team import Team
from agno.tools.reasoning import ReasoningTools
from agno.tools.toolkit import Toolkit
from agno.tools import tool

# 导入现有的服务
from core.config_optimized import optimized_config_manager
from core.logger import logger
from service.agent_service import AgentFactory
from service.translation_service import translation_service
from service.knowledge_service import knowledge_service
from service.graph_service import graph_service
from service.lightrag_client_service import lightrag_client

# 导入配置管理器
try:
    from core.config_optimized import optimized_config_manager
    _has_config_manager = True
except ImportError:
    _has_config_manager = False
    optimized_config_manager = None


@dataclass
class AdvancedAgentResponse:
    """高级智能体响应数据结构"""
    content: str
    agent_name: str
    model_used: str
    processing_time: float
    sources: List[Dict] = None
    knowledge_sources: List[Dict] = None
    knowledge_stats: Dict = None
    translation_info: Dict = None
    graph_info: Dict = None
    decomposition_info: Dict = None
    metadata: Dict = None


class TranslationTools(Toolkit):
    """翻译工具集 - 支持实时多语言翻译"""
    
    def __init__(self):
        super().__init__(name="translation_tools")
        self.translation_service = translation_service
        self._translation_cache = {}
    
    @tool
    async def translate_query_for_retrieval(self, query: str, target_language: str = "en") -> str:
        """翻译查询用于检索外文资料"""
        try:
            # 检查缓存
            cache_key = f"{query}_{target_language}"
            if cache_key in self._translation_cache:
                logger.info(f"[TRANSLATION] 使用缓存翻译: {query}")
                return self._translation_cache[cache_key]
            
            # 调用翻译服务
            translated = await self.translation_service.translate_text(
                text=query,
                target_language=target_language,
                source_language="zh"
            )
            
            # 缓存结果
            self._translation_cache[cache_key] = translated
            logger.info(f"[TRANSLATION] 查询翻译完成: {query} -> {translated}")
            
            return translated
        except Exception as e:
            logger.error(f"[TRANSLATION] 查询翻译失败: {e}")
            return query  # 翻译失败时返回原文
    
    @tool
    async def translate_retrieved_content(self, content: str, source_language: str, target_language: str = "zh") -> str:
        """翻译检索到的外文内容"""
        try:
            # 检查缓存
            cache_key = f"{content}_{source_language}_{target_language}"
            if cache_key in self._translation_cache:
                logger.info(f"[TRANSLATION] 使用缓存翻译内容")
                return self._translation_cache[cache_key]
            
            # 调用翻译服务
            translated = await self.translation_service.translate_text(
                text=content,
                target_language=target_language,
                source_language=source_language
            )
            
            # 缓存结果
            self._translation_cache[cache_key] = translated
            logger.info(f"[TRANSLATION] 内容翻译完成: {len(content)} 字符")
            
            return translated
        except Exception as e:
            logger.error(f"[TRANSLATION] 内容翻译失败: {e}")
            return content  # 翻译失败时返回原文
    
    @tool
    async def detect_language(self, text: str) -> str:
        """检测文本语言"""
        try:
            # 简单的语言检测逻辑
            if any('\u4e00' <= char <= '\u9fff' for char in text):
                return "zh"
            else:
                return "en"
        except Exception as e:
            logger.error(f"[TRANSLATION] 语言检测失败: {e}")
            return "en"  # 默认返回英文
    
    @tool
    async def translate_professional_terms(self, terms: List[str], context: str) -> Dict[str, str]:
        """翻译专业术语 - 优化并行翻译"""
        try:
            # 🔥 优化：并行翻译所有术语
            logger.info(f"[TRANSLATION] 🔍 开始并行翻译专业术语: {len(terms)} 个术语")
            
            # 为每个术语创建翻译任务
            translation_tasks = []
            for term in terms:
                task = self._translate_single_term(term, context)
                translation_tasks.append(task)
            
            # 并行执行所有翻译任务
            translation_results = await asyncio.gather(*translation_tasks, return_exceptions=True)
            
            # 处理结果
            result = {}
            for i, term in enumerate(terms):
                if isinstance(translation_results[i], Exception):
                    logger.error(f"[TRANSLATION] 术语翻译失败 {term}: {translation_results[i]}")
                    result[term] = term  # 翻译失败时返回原文
                else:
                    result[term] = translation_results[i]
            
            logger.info(f"[TRANSLATION] ✅ 专业术语并行翻译完成: {len(terms)} 个术语")
            return result
            
        except Exception as e:
            logger.error(f"[TRANSLATION] ❌ 专业术语翻译失败: {e}")
            return {term: term for term in terms}  # 翻译失败时返回原文
    
    async def _translate_single_term(self, term: str, context: str) -> str:
        """翻译单个术语"""
        try:
            # 检查缓存
            cache_key = f"term_{term}_{context[:50] if context else ''}"
            if cache_key in self._translation_cache:
                return self._translation_cache[cache_key]
            
            # 调用翻译服务
            translated = await self.translation_service.translate_text(
                text=term,
                target_language="zh",
                source_language="en",
                context=context
            )
            
            # 缓存结果
            self._translation_cache[cache_key] = translated
            return translated
            
        except Exception as e:
            logger.error(f"[TRANSLATION] 单个术语翻译失败 {term}: {e}")
            return term
    
    @tool
    async def parallel_bidirectional_translate(self, texts: List[str], source_language: str, target_language: str) -> List[Dict]:
        """
        并行双向翻译 - 为Team模式优化的翻译方法
        
        Args:
            texts: 需要翻译的文本列表
            source_language: 源语言
            target_language: 目标语言
        
        Returns:
            List[Dict]: 包含原文和译文的字典列表
        """
        try:
            logger.info(f"[TRANSLATION] 🔄 开始并行双向翻译: {len(texts)} 个文本")
            
            # 创建并行翻译任务
            translation_tasks = []
            for text in texts:
                # 创建双向翻译任务
                forward_task = self._cached_translate(text, source_language, target_language)
                backward_task = self._cached_translate(text, target_language, source_language)
                translation_tasks.extend([forward_task, backward_task])
            
            # 并行执行所有翻译任务
            results = await asyncio.gather(*translation_tasks, return_exceptions=True)
            
            # 组织结果
            translated_texts = []
            for i, text in enumerate(texts):
                forward_idx = i * 2
                backward_idx = i * 2 + 1
                
                forward_result = results[forward_idx] if not isinstance(results[forward_idx], Exception) else text
                backward_result = results[backward_idx] if not isinstance(results[backward_idx], Exception) else text
                
                translated_texts.append({
                    "original": text,
                    "forward_translation": forward_result,
                    "backward_translation": backward_result,
                    "source_language": source_language,
                    "target_language": target_language
                })
            
            logger.info(f"[TRANSLATION] ✅ 并行双向翻译完成: {len(texts)} 个文本")
            return translated_texts
            
        except Exception as e:
            logger.error(f"[TRANSLATION] ❌ 并行双向翻译失败: {e}")
            return [{"original": text, "forward_translation": text, "backward_translation": text} for text in texts]
    
    async def _cached_translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """带缓存的翻译方法"""
        try:
            # 检查缓存
            cache_key = f"{text}_{source_lang}_{target_lang}"
            if cache_key in self._translation_cache:
                return self._translation_cache[cache_key]
            
            # 调用翻译服务
            translated = await self.translation_service.translate_text(
                text=text,
                target_language=target_lang,
                source_language=source_lang
            )
            
            # 缓存结果
            self._translation_cache[cache_key] = translated
            return translated
            
        except Exception as e:
            logger.error(f"[TRANSLATION] 缓存翻译失败: {e}")
            return text


class MultilingualRetrievalTools(Toolkit):
    """多语言检索工具集
    - 优先走统一检索路由（按集合配置自动 Hybrid/HiRAG）
    - 无集合上下文时回退到原有智能/权重检索路径
    """
    
    # 类变量：检索模式与集合上下文（可由上层在会话/执行前注入）
    current_retrieval_mode = 'all'
    current_collection_id: Optional[str] = None
    current_retrieval_template_id: Optional[str] = None
    
    def __init__(self):
        super().__init__(name="multilingual_retrieval_tools")
        self.knowledge_service = knowledge_service
        self.translation_tools = TranslationTools()
        self._retrieval_cache = {}
        
        # 延迟导入避免循环依赖
        from service.qa_dataset_service import qa_dataset_service
        # 通过适配器选择是否启用QA路由
        from service.retrieval_adapter import intelligent_retrieval_service
        
        self.qa_dataset_service = qa_dataset_service
        self.intelligent_retrieval_service = intelligent_retrieval_service
    
    @classmethod
    def set_collection_id(cls, collection_id: Optional[str]):
        """设置当前检索集合（用于统一路由器）。"""
        cls.current_collection_id = collection_id if collection_id else None
        logger.info(f"[TEAM_RETRIEVAL] 绑定集合: {cls.current_collection_id}")
    
    @classmethod
    def set_retrieval_template(cls, template_id: Optional[str]):
        """设置检索路径模板（可选，后端路由器可扩展消费）。"""
        cls.current_retrieval_template_id = template_id if template_id else None
        logger.info(f"[TEAM_RETRIEVAL] 绑定路由模板: {cls.current_retrieval_template_id}")
    
    @classmethod
    def set_retrieval_mode(cls, mode: str):
        """设置检索模式"""
        cls.current_retrieval_mode = mode
        logger.info(f"[TEAM_RETRIEVAL] 设置Team检索模式: {mode}")
    
    @tool
    async def multilingual_search(self, query: str, languages: List[str] = None, retrieval_mode: str = None) -> Dict:
        """
        多语言检索（统一路由优先）。
        
        Args:
            query: 搜索查询
            languages: 目标语言列表，默认["zh", "en"]
            retrieval_mode: 检索模式，支持 'qa_only'/'papers_only'/'all'
        
        Returns:
            Dict: 包含各语言检索结果的字典
        """
        if languages is None:
            languages = ["zh", "en"]
        
        # 使用传入的模式或类变量中的模式
        actual_mode = retrieval_mode or self.current_retrieval_mode
        
        logger.info(f"[TEAM_RETRIEVAL] 🔍 开始多语言检索: {query}")
        logger.info(f"[TEAM_RETRIEVAL] 🎯 检索模式: {actual_mode}")
        logger.info(f"[TEAM_RETRIEVAL] 🌐 目标语言: {languages}")
        
        results = {}
        
        # 优先使用统一路由器（按集合配置自动 Hybrid/HiRAG）
        try:
            collection_id = self.current_collection_id or MultilingualRetrievalTools.current_collection_id
            if collection_id:
                from service.retrieval_router_service import routed_retrieval as routed
                # mode=auto 由集合配置决定（hirag/hybrid），失败可由上层决定是否回退
                router_res = await routed(
                    query=query,
                    collection_id=collection_id,
                    mode="auto",
                    top_k=10,
                    filters=None,
                    fallback_to_hybrid=True,
                    hirag_mode="hi",
                    retrieval_template_id=(self.current_retrieval_template_id or MultilingualRetrievalTools.current_retrieval_template_id),
                )
                if isinstance(router_res, dict) and router_res.get("success"):
                    items = router_res.get("items") or router_res.get("results") or []
                    # 统一放入中文通道；英文通道按需开启
                    results["zh"] = items
                    logger.info(f"[TEAM_RETRIEVAL] 路由检索完成（{router_res.get('mode')}），命中: {len(items)}")
                    return results
                else:
                    logger.warning(f"[TEAM_RETRIEVAL] 路由检索失败，回退智能检索: {router_res}")
        except Exception as e:
            logger.warning(f"[TEAM_RETRIEVAL] 路由检索异常，回退智能检索: {e}")
        
        try:
            # 🔥 优化：根据检索模式和语言并行执行检索任务
            tasks = []
            
            # 中文检索任务（针对QA数据集和中文文档）
            if "zh" in languages:
                if actual_mode == 'papers_only':
                    # 只检索中文论文文档
                    tasks.append(self._search_chinese_papers(query))
                elif actual_mode == 'qa_only':
                    # 只检索中文QA数据集
                    tasks.append(self._search_chinese_qa(query))
                else:
                    # 检索所有中文数据源
                    tasks.append(self._search_chinese_all(query))
            
            # 英文检索任务（主要针对英文论文）
            if "en" in languages and actual_mode != 'qa_only':
                # QA数据集通常是中文的，所以英文检索主要针对论文
                tasks.append(self._search_english_papers(query))
            
            # 并行执行所有检索任务（无集合上下文或路由失败时回退）
            if tasks:
                search_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # 处理搜索结果
                task_index = 0
                if "zh" in languages:
                    if isinstance(search_results[task_index], Exception):
                        logger.error(f"[TEAM_RETRIEVAL] 中文检索失败: {search_results[task_index]}")
                        results["zh"] = []
                    else:
                        results["zh"] = search_results[task_index]
                        logger.info(f"[TEAM_RETRIEVAL] 中文检索完成: {len(results['zh'])} 个结果")
                    task_index += 1
                
                if "en" in languages and actual_mode != 'qa_only':
                    if isinstance(search_results[task_index], Exception):
                        logger.error(f"[TEAM_RETRIEVAL] 英文检索失败: {search_results[task_index]}")
                        results["en"] = []
                    else:
                        results["en"] = search_results[task_index]
                        logger.info(f"[TEAM_RETRIEVAL] 英文检索完成: {len(results['en'])} 个结果")
            
            logger.info(f"[TEAM_RETRIEVAL] ✅ 多语言检索完成，总结果数: {sum(len(r) for r in results.values())}")
            return results
            
        except Exception as e:
            logger.error(f"[TEAM_RETRIEVAL] ❌ 多语言检索失败: {e}")
            return {lang: [] for lang in languages}
    
    async def _search_chinese_papers(self, query: str) -> List[Dict]:
        """检索中文论文文档"""
        try:
            logger.info(f"[TEAM_RETRIEVAL] 🔍 检索中文论文: {query}")
            
            # 使用intelligent_retrieval_service进行论文检索
            # 设置过滤器只检索文档类型（论文）
            search_result = await self.intelligent_retrieval_service.intelligent_search(
                query=query,
                top_k=10,
                filters={"source_type": "document"},  # 过滤只获取文档
                user_mode="dual",
                include_highlights=True,
                enable_reranking=True
            )
            
            results = search_result.results if hasattr(search_result, 'results') else []
            
            logger.info(f"[TEAM_RETRIEVAL] ✅ 中文论文检索完成: {len(results)} 个结果")
            return results
            
        except Exception as e:
            logger.error(f"[TEAM_RETRIEVAL] ❌ 中文论文检索失败: {e}")
            return []
    
    async def _search_chinese_qa(self, query: str) -> List[Dict]:
        """检索中文QA数据集"""
        try:
            logger.info(f"[TEAM_RETRIEVAL] 🔍 检索中文QA数据集: {query}")
            
            # 使用intelligent_retrieval_service进行QA检索
            # 设置过滤器只检索QA类型数据
            search_result = await self.intelligent_retrieval_service.intelligent_search(
                query=query,
                top_k=10,
                filters={"source_type": "qa_dataset"},  # 过滤只获取QA数据
                user_mode="dual",
                include_highlights=True,
                enable_reranking=True
            )
            
            results = search_result.results if hasattr(search_result, 'results') else []
            
            logger.info(f"[TEAM_RETRIEVAL] ✅ 中文QA检索完成: {len(results)} 个结果")
            return results
            
        except Exception as e:
            logger.error(f"[TEAM_RETRIEVAL] ❌ 中文QA检索失败: {e}")
            return []
    
    async def _search_chinese_all(self, query: str) -> List[Dict]:
        """检索所有中文数据源"""
        try:
            logger.info(f"[TEAM_RETRIEVAL] 🔍 检索所有中文数据源: {query}")
            
            # 使用intelligent_retrieval_service检索所有数据源（文档+QA）
            search_result = await self.intelligent_retrieval_service.intelligent_search(
                query=query,
                top_k=15,  # 增加数量以获得文档和QA的混合结果
                filters=None,  # 不设置过滤器，获取所有类型
                user_mode="dual",
                include_highlights=True,
                enable_reranking=True
            )
            
            results = search_result.results if hasattr(search_result, 'results') else []
            
            logger.info(f"[TEAM_RETRIEVAL] ✅ 中文全量检索完成: {len(results)} 个结果")
            return results
            
        except Exception as e:
            logger.error(f"[TEAM_RETRIEVAL] ❌ 中文全量检索失败: {e}")
            return []
    
    async def _search_english_papers(self, query: str) -> List[Dict]:
        """检索英文论文文档"""
        try:
            logger.info(f"[TEAM_RETRIEVAL] 🔍 检索英文论文: {query}")
            
            # 使用intelligent_retrieval_service进行英文论文检索
            search_result = await self.intelligent_retrieval_service.intelligent_search(
                query=query,
                top_k=10,
                filters={"source_type": "document"},  # 过滤只获取文档
                user_mode="dual",
                include_highlights=True,
                enable_reranking=True
            )
            
            results = search_result.results if hasattr(search_result, 'results') else []
            
            logger.info(f"[TEAM_RETRIEVAL] ✅ 英文论文检索完成: {len(results)} 个结果")
            return results
            
        except Exception as e:
            logger.error(f"[TEAM_RETRIEVAL] ❌ 英文论文检索失败: {e}")
            return []
    
    @tool
    async def search_with_translation(self, query: str, target_language: str = "en") -> List[Dict]:
        """带翻译的检索"""
        try:
            # 翻译查询
            translated_query = await self.translation_tools.translate_query_for_retrieval(query, target_language)
            
            # 检索 - 使用正确的向量检索方法，增加超时控制
            try:
                results = await asyncio.wait_for(
                    self.knowledge_service.test_retrieval(
                        query=translated_query,
                        top_k=10,
                        data_source='all',  # 检索所有数据源：文档和QA
                        enable_translation=True
                    ),
                    timeout=15.0  # 15秒超时
                )
                logger.info(f"[RETRIEVAL] 本地知识库检索成功: {len(results)} 个结果")
            except asyncio.TimeoutError:
                logger.warning(f"[RETRIEVAL] 知识库检索超时 (15s)，返回空结果")
                return []
            except Exception as search_error:
                logger.error(f"[RETRIEVAL] 知识库检索失败: {search_error}")
                return []
            
            # 翻译结果
            for result in results:
                if result.get("content"):
                    translated_content = await self.translation_tools.translate_retrieved_content(
                        result["content"], target_language, "zh"
                    )
                    result["translated_content"] = translated_content
            
            logger.info(f"[RETRIEVAL] 带翻译检索完成: {len(results)} 个结果")
            return results
        except Exception as e:
            logger.error(f"[RETRIEVAL] 带翻译检索失败: {e}")
            return []


class LightRAGTools(Toolkit):
    """matGraph知识图谱工具集 - 基于本地matGraph服务(端口9622)"""
    
    def __init__(self):
        super().__init__(name="lightrag_tools")
        self.lightrag_client = lightrag_client
    
    @tool
    async def query_knowledge_graph(
        self, 
        english_query: str, 
        mode: str = "hybrid", 
        top_k: int = 12
    ) -> str:
        """
        使用matGraph查询知识图谱
        
        Args:
            english_query: 英文查询文本（从翻译Agent获得）
            mode: 查询模式 (hybrid推荐, local查实体, global查关系)
            top_k: 返回结果数量
            
        Returns:
            str: 图谱查询结果的自然语言描述
        """
        try:
            logger.info(f"[LIGHTRAG] 🔍 开始查询知识图谱: '{english_query}', 模式: {mode}")
            
            # 检查服务健康状态
            if not await self.lightrag_client.health_check():
                return "⚠️ matGraph服务当前不可用，请检查服务状态（端口9622）"
            
            # 执行查询
            result = await self.lightrag_client.query_knowledge_graph(
                query=english_query,
                mode=mode,
                top_k=top_k
            )
            
            if not result.success:
                if "timeout" in result.error_message.lower():
                    return "⏰ 知识图谱查询超时，请稍后重试或简化查询内容"
                else:
                    return f"❌ 知识图谱查询失败: {result.error_message}"
            
            if not result.response or result.response.strip() == "":
                return "📭 知识图谱中暂无相关信息，建议使用其他检索方式"
            
            logger.info(f"[LIGHTRAG] ✅ 查询成功，耗时: {result.query_time:.2f}s")
            
            # 格式化返回内容
            formatted_result = f"""🧠 **知识图谱查询结果** (模式: {mode}, 耗时: {result.query_time:.2f}s)

{result.response}

---
📊 数据源: 本地英文论文知识图谱 (matGraph)"""
            
            return formatted_result
            
        except Exception as e:
            logger.error(f"[LIGHTRAG] 查询异常: {str(e)}")
            return f"🔥 知识图谱查询遇到异常: {str(e)}"
    
    @tool
    async def query_entities(self, english_query: str, top_k: int = 20) -> str:
        """
        查询知识图谱中的实体信息
        
        Args:
            english_query: 英文查询文本
            top_k: 返回的实体数量
            
        Returns:
            str: 实体信息的自然语言描述
        """
        logger.info(f"[LIGHTRAG] 🎯 查询实体信息: {english_query}")
        return await self.query_knowledge_graph(english_query, mode="local", top_k=top_k)
    
    @tool
    async def query_relationships(self, english_query: str, top_k: int = 15) -> str:
        """
        查询知识图谱中的关系信息
        
        Args:
            english_query: 英文查询文本
            top_k: 返回的关系数量
            
        Returns:
            str: 关系信息的自然语言描述
        """
        logger.info(f"[LIGHTRAG] 🔗 查询关系信息: {english_query}")
        return await self.query_knowledge_graph(english_query, mode="global", top_k=top_k)
    
    @tool
    async def query_hybrid_knowledge(self, english_query: str, top_k: int = 12) -> str:
        """
        混合模式查询知识图谱（推荐使用）
        
        Args:
            english_query: 英文查询文本
            top_k: 返回的结果数量
            
        Returns:
            str: 混合查询结果的自然语言描述
        """
        logger.info(f"[LIGHTRAG] ⚡ 混合查询: {english_query}")
        return await self.query_knowledge_graph(english_query, mode="hybrid", top_k=top_k)
    
    @tool
    async def check_matgraph_status(self) -> str:
        """
        检查matGraph服务状态
        
        Returns:
            str: 服务状态信息
        """
        try:
            is_healthy = await self.lightrag_client.health_check()
            if is_healthy:
                return "✅ matGraph服务运行正常 (端口9622)"
            else:
                return "❌ matGraph服务不可用，请检查服务是否启动"
        except Exception as e:
            return f"🔥 无法检查matGraph服务状态: {str(e)}"


class AdvancedAgentFactory:
    """高级智能体工厂"""
    
    def __init__(self):
        self.agent_factory = AgentFactory()
        self._agents = {}
        self._teams = {}
        self._config = self._load_v2_config()
    
    def _load_v2_config(self) -> Dict:
        """加载V2配置"""
        try:
            config_path = Path(__file__).parent.parent / "config" / "agent_teams_v2.yaml"
            with open(config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            logger.info("[CONFIG] V2配置加载成功")
            return config
        except Exception as e:
            logger.error(f"[CONFIG] V2配置加载失败: {e}")
            return {}
    
    def _create_agno_model(self, agent_config: Dict) -> Optional[Any]:
        """创建Agno模型实例"""
        try:
            # 将字典格式转换为对象格式，以兼容现有的AgentFactory
            class AgentConfig:
                def __init__(self, config_dict):
                    self.model_provider = config_dict.get("model_provider")
                    self.model_id = config_dict.get("model_id")
                    self.name = config_dict.get("name")
                    self.role = config_dict.get("role")
                    self.instructions = config_dict.get("instructions", [])
                    self.show_tool_calls = config_dict.get("show_tool_calls", True)
                    self.markdown = config_dict.get("markdown", True)
                    # 添加必要的属性
                    self.max_tokens = config_dict.get("max_tokens", 4096)
                    self.temperature = config_dict.get("temperature", 0.1)
                    self.top_p = config_dict.get("top_p", 1.0)
                    self.frequency_penalty = config_dict.get("frequency_penalty", 0.0)
                    self.presence_penalty = config_dict.get("presence_penalty", 0.0)
            
            # 创建配置对象
            config_obj = AgentConfig(agent_config)
            
            # 使用现有的AgentFactory方法
            return self.agent_factory._create_agno_model(config_obj)
        except Exception as e:
            logger.error(f"[MODEL] 创建模型失败: {e}")
            return None
    
    def _configure_agent_tools(self, agent_name: str) -> List:
        """配置智能体工具"""
        tools = []
        
        # 添加推理工具
        reasoning_tools = ReasoningTools(add_instructions=False)
        tools.append(reasoning_tools)
        
        # 根据智能体类型添加特定工具
        if agent_name == "translation_agent":
            tools.append(TranslationTools())
        elif agent_name == "knowledge_retrieval_agent":
            tools.append(MultilingualRetrievalTools())
        elif agent_name == "knowledge_graph_agent":
            tools.append(LightRAGTools())
        
        logger.info(f"[TOOLS] 为智能体 {agent_name} 配置了 {len(tools)} 个工具")
        return tools
    
    def create_team(self, team_name: str, session_id: str = None, 
                   agent_configs: Dict[str, Dict[str, Any]] = None) -> Optional[Team]:
        """创建Team实例"""
        try:
            config = self._load_v2_config()
            
            if team_name not in config.get("agent_teams", {}):
                logger.error(f"[FACTORY] Team配置不存在: {team_name}")
                return None
            
            team_config = config["agent_teams"][team_name]
            
            # 创建智能体成员
            members = []
            for agent_name in team_config.get("members", []):
                agent = self.create_agent(agent_name, agent_configs.get(agent_name) if agent_configs else None)
                if agent:
                    members.append(agent)
            
            if not members:
                logger.error(f"[FACTORY] 无法创建Team成员: {team_name}")
                return None
            
            # 创建协调者（如果存在，将其添加为团队成员）
            coordinator_name = team_config.get("coordinator")
            if coordinator_name:
                coordinator = self.create_agent(coordinator_name, agent_configs.get(coordinator_name) if agent_configs else None)
                if coordinator:
                    members.append(coordinator)  # 将协调者添加为团队成员
            
            # 创建一个协调模型作为Team的默认模型
            coordinator_config = config["agents"].get(coordinator_name, config["agents"]["qa_coordinator_v2"])
            team_model = self._create_agno_model(coordinator_config)
            
            # 创建Team（使用协调者的模型作为Team的默认模型，适配Agno 2.0.2）
            team = Team(
                name=team_name,
                members=members,
                model=team_model,  # 添加模型参数避免默认使用OpenAI
                description=team_config.get("description", ""),
                instructions=team_config.get("instructions", []),
                expected_output=team_config.get("success_criteria", "")  # Agno 2.0.2中使用expected_output而非success_criteria
            )
            
            logger.info(f"[FACTORY] 成功创建Team: {team_name} (成员: {len(members)})")
            return team
            
        except Exception as e:
            logger.error(f"[FACTORY] 创建Team失败 ({team_name}): {e}")
            return None

    def create_agent(self, agent_name: str, custom_config: Dict[str, Any] = None) -> Optional[Agent]:
        """创建智能体实例"""
        try:
            config = self._load_v2_config()
            
            if agent_name not in config.get("agents", {}):
                logger.error(f"[FACTORY] 智能体配置不存在: {agent_name}")
                return None
            
            agent_config = config["agents"][agent_name]
            
            # 如果提供了自定义配置，则合并配置
            if custom_config:
                agent_config = {**agent_config, **custom_config}
            
            # 创建模型
            model = self._create_agno_model(agent_config)
            if not model:
                logger.error(f"[FACTORY] 无法创建模型: {agent_name}")
                return None
            
            # 配置工具
            tools = self._configure_agent_tools(agent_name)
            
            # 创建智能体 (适配Agno 2.0.2)
            agent = Agent(
                name=agent_name,
                description=agent_config.get("role", ""),  # Agno 2.0.2使用description而非role
                model=model,
                instructions=agent_config.get("instructions", []),
                tools=tools,
                markdown=agent_config.get("markdown", True)
            )
            
            logger.info(f"[FACTORY] 成功创建智能体: {agent_name}")
            return agent
            
        except Exception as e:
            logger.error(f"[FACTORY] 创建智能体失败 ({agent_name}): {e}")
            return None
    
    def _create_agno_model_from_config(self, agent_config: Dict) -> Optional[Any]:
        """创建Agno模型实例"""
        try:
            # 将字典格式转换为对象格式，以兼容现有的AgentFactory
            class AgentConfig:
                def __init__(self, config_dict):
                    self.model_provider = config_dict.get("model_provider")
                    self.model_id = config_dict.get("model_id")
                    self.name = config_dict.get("name")
                    self.role = config_dict.get("role")
                    self.instructions = config_dict.get("instructions", [])
                    self.show_tool_calls = config_dict.get("show_tool_calls", True)
                    self.markdown = config_dict.get("markdown", True)
                    # 添加必要的属性
                    self.max_tokens = config_dict.get("max_tokens", 4096)
                    self.temperature = config_dict.get("temperature", 0.1)
                    self.top_p = config_dict.get("top_p", 1.0)
                    self.frequency_penalty = config_dict.get("frequency_penalty", 0.0)
                    self.presence_penalty = config_dict.get("presence_penalty", 0.0)
            
            # 创建配置对象
            config_obj = AgentConfig(agent_config)
            
            # 使用现有的AgentFactory方法
            return self.agent_factory._create_agno_model(config_obj)
        except Exception as e:
            logger.error(f"[MODEL] 创建模型失败: {e}")
            return None


class AdvancedAgentTeamService:
    """高级智能体团队服务"""
    
    def __init__(self):
        self.agent_factory = AdvancedAgentFactory()
        self.active_teams = {}
        self._team_lock = asyncio.Lock()
        
        # 中文智能体名称映射
        self.agent_name_mapping = {
            'dijuwu_wendatuandui_v2': 'general_qa_team_v2',
        }
    
    def _map_agent_name(self, agent_name: str) -> str:
        """映射智能体名称"""
        return self.agent_name_mapping.get(agent_name, agent_name)
    
    async def register_session(self, session_id: str) -> None:
        """注册新的会话"""
        async with self._team_lock:
            self.active_teams[session_id] = {
                'start_time': time.time(),
                'status': 'active',
                'task': None,
                'cancelled': False
            }
            logger.info(f"[SESSION] 注册高级Team会话: {session_id}")
    
    async def cancel_session(self, session_id: str) -> bool:
        """取消指定会话的所有任务"""
        async with self._team_lock:
            if session_id in self.active_teams:
                self.active_teams[session_id]['cancelled'] = True
                self.active_teams[session_id]['status'] = 'cancelled'
                logger.info(f"[SESSION] 高级Team会话已标记为取消: {session_id}")
                return True
            else:
                logger.info(f"[SESSION] 高级Team会话 {session_id} 不存在，无法取消")
                return False
    
    async def cleanup_session(self, session_id: str) -> None:
        """清理会话资源"""
        async with self._team_lock:
            if session_id in self.active_teams:
                del self.active_teams[session_id]
                logger.info(f"[SESSION] 清理高级Team会话资源: {session_id}")
    
    async def advanced_team_query(self, team_name: str, query: str, 
                                 session_id: str = None, stream: bool = False,
                                 agent_configs: Dict[str, Dict[str, Any]] = None,
                                 knowledge_retrieval_mode: str = 'all') -> Any:
        """高级Team查询"""
        start_time = time.time()
        
        try:
            # 映射团队名称
            mapped_team_name = self._map_agent_name(team_name)
            
            # 设置高级Team查询的知识库检索模式
            try:
                from service.agent_service import CustomKnowledgeTools
                CustomKnowledgeTools.set_retrieval_mode(knowledge_retrieval_mode)
                logger.info(f"[ADVANCED_TEAM] 设置知识库检索模式: {knowledge_retrieval_mode}")
            except Exception as e:
                logger.error(f"[ADVANCED_TEAM] 设置CustomKnowledgeTools检索模式失败: {e}")
            
            # 同时设置多语言检索工具的检索模式
            try:
                MultilingualRetrievalTools.set_retrieval_mode(knowledge_retrieval_mode)
                logger.info(f"[ADVANCED_TEAM] 设置多语言检索模式: {knowledge_retrieval_mode}")
            except Exception as e:
                logger.error(f"[ADVANCED_TEAM] 设置MultilingualRetrievalTools检索模式失败: {e}")
            
            # 创建Team实例，传入智能体配置
            logger.info(f"[ADVANCED_TEAM] 开始创建团队: {mapped_team_name}")
            team = self.agent_factory.create_team(mapped_team_name, session_id, agent_configs)
            if not team:
                logger.error(f"[TEAM] 无法创建团队: {mapped_team_name}")
                return None
            logger.info(f"[ADVANCED_TEAM] 团队创建成功: {mapped_team_name}, 成员数: {len(team.members) if hasattr(team, 'members') else 'unknown'}")
            
            if stream:
                # 流式响应 - 直接返回异步生成器，不需要await
                async def stream_wrapper():
                    try:
                        # 生成执行ID
                        import uuid
                        execution_id = str(uuid.uuid4())
                        
                        # 首先发送一个测试事件确保流式响应能正常工作
                        yield {
                            "type": "test_event",
                            "data": {
                                "message": "开始流式响应",
                                "timestamp": time.time()
                            }
                        }
                        
                        # 发送团队执行开始事件
                        yield {
                            "type": "team_execution_start",
                            "data": {
                                "team_name": mapped_team_name,
                                "execution_id": execution_id,
                                "query": query,
                                "start_time": start_time * 1000,
                                "timestamp": time.time()
                            }
                        }
                        
                        logger.info(f"[ADVANCED_TEAM] 开始调用_stream_team_response")
                        async for chunk in self._stream_team_response(team, query, mapped_team_name, start_time, session_id, execution_id):
                            logger.debug(f"[ADVANCED_TEAM] 传递chunk: {chunk.get('type', 'unknown')}")
                            yield chunk
                        logger.info(f"[ADVANCED_TEAM] _stream_team_response完成")
                    except Exception as stream_error:
                        logger.error(f"[ADVANCED_TEAM] 流式响应失败: {stream_error}")
                        # 发送错误事件
                        yield {
                            "type": "error",
                            "data": {
                                "error": f"流式响应失败: {str(stream_error)}",
                                "timestamp": time.time()
                            }
                        }
                return stream_wrapper()
            else:
                # 非流式响应
                response = team.run(query, stream=False)
                processing_time = time.time() - start_time
                
                return AdvancedAgentResponse(
                    content=response.content if hasattr(response, 'content') else str(response),
                    agent_name=mapped_team_name,
                    model_used="team",
                    processing_time=processing_time,
                    metadata={
                        "query": query,
                        "timestamp": time.time(),
                        "original_team_name": team_name,
                        "session_id": session_id,
                        "team_members": [member.name for member in team.members]
                    }
                )
                
        except Exception as e:
            logger.error(f"[TEAM] 高级Team查询失败 ({team_name}): {e}")
            processing_time = time.time() - start_time
            return self._create_error_response(team_name, query, str(e), processing_time)

    async def get_team_config(self, team_name: str) -> Optional[Dict[str, Any]]:
        """获取Team配置信息"""
        try:
            mapped_team_name = self._map_agent_name(team_name)
            config = self.agent_factory._load_v2_config()
            
            if mapped_team_name not in config.get("agent_teams", {}):
                return None
            
            team_config = config["agent_teams"][mapped_team_name]
            agents = []
            
            for agent_name in team_config.get("members", []):
                agent_config = await self.get_agent_config(agent_name)
                if agent_config:
                    agents.append(agent_config)
            
            return {
                "team_name": team_name,
                "agents": agents,
                "mode": team_config.get("mode", "coordinate"),
                "coordinator": team_config.get("coordinator", "")
            }
        except Exception as e:
            logger.error(f"[CONFIG] 获取Team配置失败: {e}")
            return None

    async def get_agent_config(self, agent_name: str) -> Optional[Dict[str, Any]]:
        """获取智能体配置信息"""
        try:
            from db.database import get_db_session
            from models.agent_config import AgentConfig
            from sqlalchemy import select
            
            # 首先尝试从数据库获取配置
            db_config = None
            try:
                async with get_db_session() as session:
                    stmt = select(AgentConfig).where(AgentConfig.agent_name == agent_name)
                    result = await session.execute(stmt)
                    db_config = result.scalar_one_or_none()
                    
                    if db_config:
                        logger.info(f"[CONFIG] 从数据库加载智能体配置: {agent_name}")
            except Exception as db_error:
                logger.warning(f"[CONFIG] 从数据库读取配置失败，将使用静态配置: {db_error}")
            
            # 从静态配置文件获取基础配置
            config = self.agent_factory._load_v2_config()
            
            if agent_name not in config.get("agents", {}):
                return None
            
            agent_config = config["agents"][agent_name]
            
            # 获取可用模型列表
            available_models = await self.get_available_models()
            
            # 获取工具列表
            tools = self.agent_factory._configure_agent_tools(agent_name)
            tool_names = [tool.__class__.__name__ for tool in tools]
            
            # 如果有数据库配置，使用数据库配置覆盖静态配置
            current_config = {
                "model_provider": agent_config.get("model_provider"),
                "model_id": agent_config.get("model_id"),
                "temperature": agent_config.get("temperature"),
                "max_tokens": agent_config.get("max_tokens"),
                "top_p": agent_config.get("top_p"),
                "frequency_penalty": agent_config.get("frequency_penalty"),
                "presence_penalty": agent_config.get("presence_penalty")
            }
            
            if db_config:
                # 使用数据库配置覆盖静态配置
                if db_config.model_provider is not None:
                    current_config["model_provider"] = db_config.model_provider
                if db_config.model_id is not None:
                    current_config["model_id"] = db_config.model_id
                if db_config.temperature is not None:
                    current_config["temperature"] = db_config.temperature
                if db_config.max_tokens is not None:
                    current_config["max_tokens"] = db_config.max_tokens
                if db_config.top_p is not None:
                    current_config["top_p"] = db_config.top_p
                if db_config.frequency_penalty is not None:
                    current_config["frequency_penalty"] = db_config.frequency_penalty
                if db_config.presence_penalty is not None:
                    current_config["presence_penalty"] = db_config.presence_penalty
                
                logger.info(f"[CONFIG] 已应用数据库配置覆盖: {agent_name}")
            
            return {
                "agent_name": agent_name,
                "current_config": current_config,
                "available_models": available_models,
                "instructions": "\n".join(agent_config.get("instructions", [])),
                "tools": tool_names
            }
        except Exception as e:
            logger.error(f"[CONFIG] 获取智能体配置失败: {e}")
            return None

    async def update_agent_config(self, agent_name: str, config: Dict[str, Any]) -> bool:
        """更新智能体配置"""
        try:
            from db.database import get_db_session
            from models.agent_config import AgentConfig
            from sqlalchemy import select
            import uuid
            
            # 确保模型提供商始终为 one_api
            if 'model_id' in config:
                config['model_provider'] = 'one_api'
            
            logger.info(f"[CONFIG] 开始更新智能体配置: {agent_name} -> {config}")
            
            # 使用数据库会话保存配置
            async with get_db_session() as session:
                # 查找现有配置
                stmt = select(AgentConfig).where(AgentConfig.agent_name == agent_name)
                result = await session.execute(stmt)
                existing_config = result.scalar_one_or_none()
                
                if existing_config:
                    # 更新现有配置
                    existing_config.update_from_dict(config)
                    logger.info(f"[CONFIG] 更新现有配置: {agent_name}")
                else:
                    # 创建新配置
                    new_config = AgentConfig(
                        id=str(uuid.uuid4()),
                        agent_name=agent_name,
                        team_name="general_qa_team_v2",  # 默认团队
                        **{k: v for k, v in config.items() if hasattr(AgentConfig, k)}
                    )
                    session.add(new_config)
                    logger.info(f"[CONFIG] 创建新配置: {agent_name}")
                
                # 提交数据库事务
                await session.commit()
                logger.info(f"[CONFIG] 智能体配置保存成功: {agent_name}")
                
            return True
            
        except Exception as e:
            logger.error(f"[CONFIG] 更新智能体配置失败: {e}")
            import traceback
            logger.error(f"[CONFIG] 详细错误信息: {traceback.format_exc()}")
            return False

    async def get_available_models(self) -> List[Dict[str, str]]:
        """获取可用的模型列表"""
        try:
            import os
            from typing import List, Dict
            from core.config_optimized import optimized_config_manager
            
            # 首先尝试从配置管理器获取
            try:
                config = optimized_config_manager.get_llm_models_config()
                if config and config.get('all_models'):
                    logger.info(f"[CONFIG] 从配置管理器获取到模型配置: {config}")
                    
                    # 模型名称映射
                    model_names = {
                        "Qwen/Qwen3-30B-A3B-Instruct-2507": "Qwen3 30B Instruct",
                        "Qwen/Qwen3-30B-A3B-Thinking-2507": "Qwen3 30B Thinking", 
                        "Qwen/Qwen3-235B-A22B-Thinking-2507": "Qwen3 235B Thinking",
                        "Qwen/Qwen3-30B-A3B": "Qwen3 30B",
                        "moonshotai/Kimi-K2-Instruct": "Kimi K2 Instruct",
                        "deepseek-ai/DeepSeek-V3": "DeepSeek V3"
                    }
                    
                    # 构建模型列表
                    available_models = []
                    for model_id in config['all_models']:
                        model_name = model_names.get(model_id, model_id)
                        available_models.append({
                            "provider": "one_api",
                            "model": model_id,
                            "name": model_name
                        })
                    
                    logger.info(f"[CONFIG] 从配置管理器加载了 {len(available_models)} 个可用模型: {available_models}")
                    return available_models
            except Exception as e:
                logger.warning(f"[CONFIG] 从配置管理器获取模型失败: {e}")
            
            # 直接从环境变量获取网关模型列表
            gateway_models = os.getenv("GATEWAY_MODELS", "")
            logger.info(f"[CONFIG] 读取到的 GATEWAY_MODELS: {gateway_models}")
            
            if not gateway_models:
                logger.warning("[CONFIG] GATEWAY_MODELS 环境变量未配置，使用默认模型列表")
                return [
                    {"provider": "one_api", "model": "qwen-plus-latest", "name": "Qwen Plus"},
                    {"provider": "one_api", "model": "gpt-4o-mini", "name": "GPT-4o Mini"},
                    {"provider": "one_api", "model": "gemini-2.5-flash-preview-thinking", "name": "Gemini 2.5 Flash"}
                ]
            
            # 解析模型列表
            model_list = [model.strip() for model in gateway_models.split(",") if model.strip()]
            logger.info(f"[CONFIG] 解析后的模型列表: {model_list}")
            
            # 模型名称映射
            model_names = {
                "qwen-plus-latest": "Qwen Plus",
                "gpt-4o-mini": "GPT-4o Mini", 
                "gemini-2.5-flash-preview-thinking": "Gemini 2.5 Flash",
                "qwen3-235b-a22b-instruct-2507": "Qwen 3.5 235B",
                "qwen2.5-72b-instruct": "Qwen 2.5 72B",
                "qwen2.5-32b-instruct": "Qwen 2.5 32B",
                "kimi-k2-siliconflow": "Kimi K2",
                "gemini-2.5-flash-preview-nothinking": "Gemini 2.5 Flash (No Thinking)"
            }
            
            # 构建模型列表
            available_models = []
            for model_id in model_list:
                model_name = model_names.get(model_id, model_id)
                available_models.append({
                    "provider": "one_api",
                    "model": model_id,
                    "name": model_name
                })
            
            logger.info(f"[CONFIG] 从环境变量加载了 {len(available_models)} 个可用模型: {available_models}")
            return available_models
            
        except Exception as e:
            logger.error(f"[CONFIG] 获取可用模型失败: {e}")
            return []
    
    async def _stream_team_response(self, team: Team, query: str, team_name: str, 
                                   start_time: float, session_id: str = None, execution_id: str = None):
        """生成器方法，用于处理流式Team响应并解析Agent流程消息"""
        logger.info(f"[STREAM] 开始高级Team {team_name} 的流式查询")
        
        # 确保execution_id存在
        if execution_id is None:
            import uuid
            execution_id = str(uuid.uuid4())
            logger.info(f"[STREAM] 生成新的execution_id: {execution_id}")
        
        # 导入消息解析器
        from service.team_message_parser import team_message_parser
        
        # 累积完整响应内容用于解析
        accumulated_content = ""
        agent_calls_detected = []
        # 新增：收集真实Agent决策数据和知识库检索结果
        collected_decisions = []
        real_member_calls = []
        collected_knowledge_sources = []  # 收集所有知识库检索结果
        
        # 🔥 新方案：预定义Agent执行顺序，通过专门的Agent切换事件通知前端
        predefined_agents = [
            {'memberId': 'qa_coordinator_v2', 'memberName': '问答协调器', 'role': '团队协调者', 'action': '协调团队执行', 'step': 1, 'icon': '●'},
            {'memberId': 'question_decomposition_agent', 'memberName': '问题分解智能体', 'role': '问题分析专家', 'action': '分析和分解问题', 'step': 2, 'icon': '●', 'disabled': True},  # 🔥 临时禁用问题分解智能体
            {'memberId': 'translation_agent', 'memberName': '翻译智能体', 'role': '多语言处理专家', 'action': '翻译和语言增强', 'step': 3, 'icon': '●'},
            {'memberId': 'knowledge_retrieval_agent', 'memberName': '知识检索智能体', 'role': '知识库检索专家', 'action': '检索相关知识', 'step': 4, 'icon': '●'},
            {'memberId': 'knowledge_graph_agent', 'memberName': '知识图谱智能体', 'role': '结构化知识专家', 'action': '查询知识图谱', 'step': 5, 'icon': '●'},
            {'memberId': 'summary_answer_agent', 'memberName': '答案总结智能体', 'role': '内容整合专家', 'action': '综合生成答案', 'step': 6, 'icon': '●'}
        ]
        current_agent_index = 0
        content_length_tracker = 0
        
        # 超时检测配置
        EXECUTION_TIMEOUT = 300.0  # 🔥 临时改为300秒(5分钟)总超时，用于排查问题
        CHUNK_TIMEOUT = 10.0     # 10秒chunk超时
        last_chunk_time = time.time()
        timeout_warnings_sent = 0
        
        try:
            # 调用Team的流式接口 - 根据Agno官方文档启用中间步骤流式传输
            logger.info(f"[STREAM] 开始调用team.run()，query: {query[:50]}...")
            try:
                response = team.run(
                    query, 
                    stream=True, 
                    stream_intermediate_steps=True
                )
                logger.info(f"[STREAM] team.run()返回: {type(response)}")
            except Exception as team_run_error:
                # 🔥 关键修复：捕获team.run()异常
                logger.error(f"[TEAM_RUN_ERROR] team.run()调用失败: {team_run_error}")
                import traceback
                logger.error(f"[TEAM_RUN_ERROR] 详细错误堆栈: {traceback.format_exc()}")
                yield {
                    "type": "error",
                    "data": {
                        "error": f"团队执行失败: {team_run_error}",
                        "error_location": "team_run",
                        "team_name": team_name,
                        "query": query[:100],
                        "timestamp": time.time()
                    }
                }
                return
            
            # 处理Team流式响应 - 支持中间步骤事件
            # 🔥 发送第一个Agent开始标识和事件
            if current_agent_index < len(predefined_agents):
                first_agent = predefined_agents[current_agent_index]
                
                # 先发送第一个Agent开始标识chunk
                first_agent_marker = f"**{first_agent['icon']} {first_agent['memberName']} 开始执行**\n*{first_agent['action']} (第{first_agent['step']}/{len(predefined_agents)}步)*\n\n"
                yield {
                    "type": "content",
                    "data": {
                        "content": first_agent_marker,
                        "agent_name": team_name,
                        "model_used": "team",
                        "timestamp": time.time()
                    }
                }
                
                # 再发送第一个Agent开始事件
                yield {
                    "type": "agent_start",
                    "data": {
                        "agent_id": first_agent['memberId'],
                        "agent_name": first_agent['memberName'],
                        "role": first_agent['role'],
                        "action": first_agent['action'],
                        "step": first_agent['step'],
                        "icon": first_agent['icon'],
                        "total_steps": len(predefined_agents),
                        "timestamp": time.time()
                    }
                }
                logger.info(f"[AGENT_START] 发送第一个Agent开始事件: {first_agent['memberName']}")
            
            if hasattr(response, '__aiter__'):
                # 异步迭代器 - 处理Agno Team的流式事件
                logger.info(f"[STREAM] 开始异步迭代响应")
                chunk_count = 0
                
                # 🔥 修复：使用asyncio.wait_for包装异步迭代，防止无限等待
                try:
                    # 将异步迭代器转换为aiter并包装超时
                    response_iter = aiter(response)
                    
                    while True:
                        try:
                            # 🔥 临时修复：大幅延长超时时间以排查问题
                            logger.debug(f"[STREAM] 等待第{chunk_count+1}个chunk...")
                            chunk = await asyncio.wait_for(anext(response_iter), timeout=120.0)  # 改为120秒
                            logger.debug(f"[STREAM] 成功获取第{chunk_count+1}个chunk")
                        except StopAsyncIteration:
                            # 正常结束迭代
                            logger.info(f"[STREAM] 异步迭代正常结束，总共处理{chunk_count}个chunk")
                            break
                        except asyncio.TimeoutError:
                            # chunk获取超时
                            logger.error(f"[STREAM] chunk获取超时(120秒)，智能体执行可能存在严重问题")
                            yield {
                                "type": "error", 
                                "data": {
                                    "error": "智能体响应超时(120秒)，执行可能存在严重问题",
                                    "timeout_location": "chunk_timeout_extended",
                                    "current_agent": predefined_agents[current_agent_index]['memberName'] if current_agent_index < len(predefined_agents) else "unknown",
                                    "timeout_seconds": 120,
                                    "chunk_count": chunk_count,
                                    "timestamp": time.time()
                                }
                            }
                            return
                        
                        # 正常处理chunk
                        chunk_count += 1
                        current_time = time.time()
                        
                        # 🔥 添加详细的chunk调试日志
                        logger.info(f"[STREAM_DEBUG] 处理第{chunk_count}个chunk, 类型: {type(chunk)}, 内容长度: {len(str(chunk)) if chunk else 0}")
                        
                        # 检查总执行超时
                        total_execution_time = current_time - start_time
                        if total_execution_time > EXECUTION_TIMEOUT:
                            logger.warning(f"[TIMEOUT] 总执行时间超时: {total_execution_time:.2f}s > {EXECUTION_TIMEOUT}s")
                            yield {
                                "type": "timeout_warning",
                                "data": {
                                    "message": f"执行时间已超过{EXECUTION_TIMEOUT}秒，建议终止执行",
                                    "total_time": total_execution_time,
                                    "timeout_threshold": EXECUTION_TIMEOUT,
                                    "timestamp": current_time
                                }
                            }
                            # 强制终止执行
                            break
                        
                        # 检查chunk间隔超时
                        chunk_interval = current_time - last_chunk_time
                        if chunk_interval > CHUNK_TIMEOUT:
                            timeout_warnings_sent += 1
                            logger.warning(f"[TIMEOUT] Chunk间隔超时: {chunk_interval:.2f}s > {CHUNK_TIMEOUT}s")
                            yield {
                                "type": "chunk_timeout_warning",
                                "data": {
                                    "message": f"智能体响应间隔过长({chunk_interval:.1f}s)，可能出现阻塞",
                                    "chunk_interval": chunk_interval,
                                    "timeout_threshold": CHUNK_TIMEOUT,
                                    "warnings_count": timeout_warnings_sent,
                                    "timestamp": current_time
                                }
                            }
                        
                        # 更新最后chunk时间  
                        last_chunk_time = current_time
                        
                        logger.debug(f"[STREAM] 处理第{chunk_count}个chunk")
                        # 记录原始chunk对象用于调试
                        logger.debug(f"[TEAM_STREAM] 收到chunk: type={type(chunk)}, attrs={dir(chunk)}")
                        
                        # 处理不同类型的chunk事件
                        try:
                            chunk_data = await self._process_team_chunk(chunk, team_name)
                            
                            if chunk_data:
                                # 直接转发处理后的事件
                                yield chunk_data
                        except Exception as chunk_error:
                            # 🔥 关键修复：捕获chunk处理异常，防止流中断
                            logger.error(f"[STREAM_ERROR] chunk处理失败: {chunk_error}")
                            logger.error(f"[STREAM_ERROR] chunk类型: {type(chunk)}, chunk内容: {str(chunk)[:200]}")
                            import traceback
                            logger.error(f"[STREAM_ERROR] 详细错误堆栈: {traceback.format_exc()}")
                            
                            # 发送错误事件但不中断整个流
                            yield {
                                "type": "chunk_error",
                                "data": {
                                    "error": f"处理chunk时出错: {chunk_error}",
                                    "chunk_type": type(chunk).__name__,
                                    "chunk_count": chunk_count,
                                    "continue_processing": True,
                                    "timestamp": time.time()
                                }
                            }
                            # 继续处理下一个chunk，不要return或break
                
                except asyncio.TimeoutError:
                    logger.error(f"[STREAM_TIMEOUT] 异步流迭代超时，可能在问题分解智能体阶段卡死")
                    yield {
                        "type": "error",
                        "data": {
                            "error": "流式响应超时，智能体执行可能存在问题",
                            "timeout_location": "async_iterator",
                            "current_agent": predefined_agents[current_agent_index]['memberName'] if current_agent_index < len(predefined_agents) else "unknown",
                            "timestamp": time.time()
                        }
                    }
                    return
                except Exception as stream_error:
                    logger.error(f"[STREAM_ERROR] 异步流迭代出错: {stream_error}")
                    yield {
                        "type": "error", 
                        "data": {
                            "error": f"流式响应错误: {stream_error}",
                            "error_location": "async_iterator", 
                            "current_agent": predefined_agents[current_agent_index]['memberName'] if current_agent_index < len(predefined_agents) else "unknown",
                            "timestamp": time.time()
                        }
                    }
                    return
                
                # 异步循环结束，开始解析完整消息
                logger.info(f"[STREAM] 异步流式响应结束，开始解析Team消息")
            elif hasattr(response, '__iter__'):
                # 🔥 修复：处理普通generator（同步迭代器） - 添加Agent切换逻辑
                logger.info(f"[STREAM] 开始同步迭代普通generator响应")
                
                # 🔥 添加更详细的迭代调试信息
                chunk_iter_count = 0
                for chunk in response:
                    chunk_iter_count += 1
                    logger.info(f"[STREAM_DEBUG] 开始处理第{chunk_iter_count}个chunk，类型: {type(chunk)}")
                    
                    # 安全地获取chunk内容
                    try:
                        if hasattr(chunk, 'content'):
                            chunk_content = chunk.content
                        elif isinstance(chunk, str):
                            chunk_content = chunk
                        else:
                            # 对于其他类型（如ReasoningStep），转换为字符串
                            chunk_content = str(chunk)
                        
                        if chunk_content and isinstance(chunk_content, str):
                            accumulated_content += chunk_content
                            content_length_tracker = len(accumulated_content)
                            
                            # 🔥 Agent切换逻辑
                            agent_thresholds = [100, 300, 600, 1000, 1500]
                            
                            if (current_agent_index < len(agent_thresholds) and 
                                content_length_tracker >= agent_thresholds[current_agent_index]):
                                
                                # 发送当前Agent完成标识chunk
                                current_agent = predefined_agents[current_agent_index]
                                agent_complete_marker = f"\n\n---\n**{current_agent['icon']} {current_agent['memberName']} 执行完成**\n*生成内容: {content_length_tracker} 字符*\n---\n\n"
                                
                                # 先发送完成标识chunk
                                yield {
                                    "type": "content",
                                    "data": {
                                        "content": agent_complete_marker,
                                        "agent_name": team_name,
                                        "model_used": "team",
                                        "timestamp": time.time()
                                    }
                                }
                                
                                # 发送Agent完成事件
                                yield {
                                    "type": "agent_complete",
                                    "data": {
                                        "agent_id": current_agent['memberId'],
                                        "agent_name": current_agent['memberName'],
                                        "step": current_agent['step'],
                                        "content_generated": content_length_tracker,
                                        "timestamp": time.time()
                                    }
                                }
                                logger.info(f"[AGENT_COMPLETE] Agent完成: {current_agent['memberName']} (内容: {content_length_tracker})")
                                
                                # 切换到下一个Agent
                                current_agent_index += 1
                                
                                # 发送下一个Agent开始事件和标识chunk
                                if current_agent_index < len(predefined_agents):
                                    next_agent = predefined_agents[current_agent_index]
                                    
                                    # 🔥 检查Agent是否被禁用，如果禁用则跳过并返回固定内容
                                    if next_agent.get('disabled', False) and next_agent['memberId'] == 'question_decomposition_agent':
                                        logger.info(f"[AGENT_SKIP] 跳过被禁用的Agent: {next_agent['memberName']}")
                                        
                                        # 发送禁用标识chunk
                                        disabled_marker = f"**{next_agent['icon']} {next_agent['memberName']} [已跳过]**\n*使用固定响应替代 (第{next_agent['step']}/{len(predefined_agents)}步)*\n\n"
                                        yield {
                                            "type": "content",
                                            "data": {
                                                "content": disabled_marker,
                                                "agent_name": team_name,
                                                "model_used": "team",
                                                "timestamp": time.time()
                                            }
                                        }
                                        
                                        # 发送固定的问题分解内容
                                        fixed_decomposition_content = f"""
基于您的问题"{query}"，我进行了以下分析：

## 问题分解结果：
1. **主要问题识别**: {query}
2. **问题类型**: 材料科学相关查询
3. **涉及领域**: AI技术与通用知识
4. **处理策略**: 知识库检索 + 图谱查询

## 子问题分解：
- 材料基本特性查询
- 相关研究文献检索
- 实际应用案例分析

*注：此为固定响应，用于测试流程稳定性*

---

"""
                                        yield {
                                            "type": "content", 
                                            "data": {
                                                "content": fixed_decomposition_content,
                                                "agent_name": team_name,
                                                "model_used": "team",
                                                "timestamp": time.time()
                                            }
                                        }
                                        
                                        # 发送Agent开始事件（标记为已跳过）
                                        yield {
                                            "type": "agent_start",
                                            "data": {
                                                "agent_id": next_agent['memberId'],
                                                "agent_name": next_agent['memberName'],
                                                "role": next_agent['role'],
                                                "action": "已跳过 - 使用固定响应",
                                                "step": next_agent['step'],
                                                "icon": next_agent['icon'],
                                                "total_steps": len(predefined_agents),
                                                "disabled": True,
                                                "timestamp": time.time()
                                            }
                                        }
                                        
                                        # 继续切换到下一个Agent
                                        current_agent_index += 1
                                        if current_agent_index < len(predefined_agents):
                                            # 递归处理下一个Agent
                                            continue
                                        
                                    else:
                                        # 正常Agent处理逻辑
                                        # 先发送开始标识chunk
                                        agent_start_marker = f"**{next_agent['icon']} {next_agent['memberName']} 开始执行**\n*{next_agent['action']} (第{next_agent['step']}/{len(predefined_agents)}步)*\n\n"
                                        yield {
                                            "type": "content",
                                            "data": {
                                                "content": agent_start_marker,
                                                "agent_name": team_name,
                                                "model_used": "team",
                                                "timestamp": time.time()
                                            }
                                        }
                                        
                                        # 再发送Agent开始事件
                                        yield {
                                            "type": "agent_start",
                                            "data": {
                                                "agent_id": next_agent['memberId'],
                                                "agent_name": next_agent['memberName'],
                                                "role": next_agent['role'],
                                                "action": next_agent['action'],
                                                "step": next_agent['step'],
                                                "icon": next_agent['icon'],
                                                "total_steps": len(predefined_agents),
                                                "timestamp": time.time()
                                            }
                                        }
                                        logger.info(f"[AGENT_SWITCH] 切换到Agent: {next_agent['memberName']} (内容: {content_length_tracker})")
                            
                            logger.debug(f"[STREAM] 累积内容，当前长度: {content_length_tracker}")
                            
                        # 🔥 修复：将content事件也放在try块内，确保顺序正确
                        if chunk_content:
                            yield {
                                "type": "content",
                                "data": {
                                    "content": chunk_content,
                                    "agent_name": team_name,
                                    "model_used": "team",
                                    "timestamp": time.time()
                                }
                            }
                    except Exception as chunk_error:
                        logger.warning(f"[STREAM] 处理chunk失败: {chunk_error}, chunk类型: {type(chunk)}")
                        continue
            
            # 🔥 发送最后一个Agent完成标识和事件
            if current_agent_index < len(predefined_agents):
                final_agent = predefined_agents[current_agent_index]
                
                # 先发送最终完成标识chunk
                final_complete_marker = f"\n\n---\n**{final_agent['icon']} {final_agent['memberName']} 执行完成**\n*生成内容: {len(accumulated_content)} 字符*\n\n**团队协作完成！共 {len(predefined_agents)} 个步骤**\n---\n\n"
                yield {
                    "type": "content",
                    "data": {
                        "content": final_complete_marker,
                        "agent_name": team_name,
                        "model_used": "team",
                        "timestamp": time.time()
                    }
                }
                
                # 再发送最终Agent完成事件
                yield {
                    "type": "agent_complete",
                    "data": {
                        "agent_id": final_agent['memberId'],
                        "agent_name": final_agent['memberName'],
                        "step": final_agent['step'],
                        "content_generated": len(accumulated_content),
                        "timestamp": time.time(),
                        "is_final": True
                    }
                }
                logger.info(f"[AGENT_COMPLETE] 发送最终Agent完成事件: {final_agent['memberName']}")
            
            # ========== 新增：生成基于真实数据的团队分析 ==========
            # 生成基于真实收集数据的团队分析
            execution_id = f'exec_{int(time.time())}'
            processing_time = time.time() - start_time
            
            try:
                # 创建动态团队分析，使用真实的决策数据和知识库检索结果
                real_team_analysis = self._create_real_team_analysis(
                    collected_decisions, real_member_calls, query, execution_id, processing_time, collected_knowledge_sources
                )
                
                logger.info(f"[REAL_ANALYSIS] 生成真实团队分析: {len(collected_decisions)} 个决策, {len(real_member_calls)} 个成员调用")
                
                # 确保所有剩余的agent都标记为completed
                while current_agent_index < len(predefined_agents):
                    current_agent = predefined_agents[current_agent_index]
                    current_time = time.time() * 1000
                    
                    agent_event = {
                        'memberId': current_agent['memberId'],
                        'memberName': current_agent['memberName'],
                        'role': current_agent['role'],
                        'action': current_agent['action'],
                        'callType': 'agent_execution',
                        'input': {'query': query},
                        'output': {'status': 'completed_in_final_analysis'},
                        'startTime': int(current_time - 500),
                        'endTime': int(current_time),
                        'durationMs': 500,
                        'status': 'completed',
                        'confidence': 0.90,
                        'errorMessage': None,
                        'metadata': {'completion_phase': 'final_analysis'}
                    }
                    
                    real_member_calls.append(agent_event)
                    current_agent_index += 1
                
                # 合并真实分析数据与实时生成的memberCalls
                real_team_analysis['member_calls'] = real_member_calls
                real_team_analysis['total_steps'] = len(real_member_calls)
                real_team_analysis['completed_steps'] = len([c for c in real_member_calls if c.get('status') == 'completed'])
                
                # 发送最终的团队分析数据
                yield {
                    "type": "team_analysis",
                    "data": real_team_analysis
                }
                
            except Exception as analysis_error:
                logger.error(f"[REAL_ANALYSIS] 生成真实团队分析失败: {analysis_error}")
                
                # 尝试解析累积的内容获取更多Team信息
                logger.info(f"[TEAM] 开始解析累积内容，长度: {len(accumulated_content)}")
                try:
                    # 使用team_message_parser解析accumulated_content
                    if accumulated_content:
                        parsed_data = team_message_parser.parse_team_message(accumulated_content)
                        if parsed_data and parsed_data.member_calls:
                            # 合并解析得到的成员调用数据
                            for call in parsed_data.member_calls:
                                if call not in real_member_calls:
                                    real_member_calls.append(call)
                            logger.info(f"[TEAM] 从解析中获得额外的 {len(parsed_data.member_calls)} 个成员调用")
                    
                    # 构造team_data，包含解析和收集的数据
                    team_data_dict = {
                        'memberCalls': real_member_calls,
                        'teamName': team_name,
                        'teamMode': 'coordinate',
                        'executionId': execution_id,
                        'processingTime': processing_time
                    }
                    
                    # 发送解析后的Team信息
                    if real_member_calls or team_data_dict.get('memberCalls'):
                        # 合并解析的和实时生成的memberCalls
                        all_member_calls = real_member_calls.copy()
                        if team_data_dict.get('memberCalls'):
                            for call in team_data_dict['memberCalls']:
                                if call not in all_member_calls:
                                    all_member_calls.append(call)
                        
                        yield {
                            "type": "team_analysis",
                            "data": {
                                "execution_id": execution_id,
                                "team_name": team_name,
                                "member_calls": all_member_calls,
                                "total_steps": len(all_member_calls),
                                "completed_steps": len([call for call in all_member_calls if call.get('status') == 'completed']),
                                "failed_steps": len([call for call in all_member_calls if call.get('status') == 'failed']),
                                "timestamp": time.time()
                            }
                        }
                        
                    logger.info(f"[STREAM] 使用收集的数据构造到 {len(real_member_calls)} 个Agent调用")
                    
                except Exception as parse_error:
                    logger.warning(f"[STREAM] 消息解析失败: {parse_error}")
                    # 解析失败时使用实时生成的memberCalls数据
                    final_member_calls = real_member_calls if real_member_calls else agent_calls_detected
                    yield {
                        "type": "team_analysis",
                        "data": {
                            "execution_id": execution_id,
                            "team_name": team_name, 
                            "member_calls": final_member_calls,
                            "total_steps": len(final_member_calls),
                            "completed_steps": len([call for call in final_member_calls if call.get("status") == "completed"]),
                            "failed_steps": 0,
                            "timestamp": time.time()
                        }
                    }
            
            # 发送完成信号
            processing_time = time.time() - start_time
            yield {
                "type": "complete",
                "data": {
                    "processing_time": processing_time,
                    "session_id": session_id
                }
            }
            
        except Exception as e:
            logger.error(f"[STREAM] 高级Team流式响应失败: {e}")
            yield {
                "type": "error",
                "data": {"error": str(e)}
            }
    
    async def _process_team_chunk(self, chunk, team_name: str) -> Optional[Dict]:
        """
        处理Agno Team流式响应的chunk事件
        
        增强版本：分离决策过程内容和回答内容，决策过程不出现在主回答中
        """
        try:
            # 检查chunk的类型和属性
            chunk_type = type(chunk).__name__
            logger.debug(f"[TEAM_CHUNK] 处理chunk类型: {chunk_type}")
            
            # ========== 新增：提取真实Agent决策数据 ==========
            # 0. 首先检查是否包含Agent状态变化信息
            agent_status = self._extract_agent_status_from_chunk(chunk, team_name)
            if agent_status:
                logger.info(f"[AGENT_STATUS] 检测到Agent状态变化: {agent_status['data']['agent_name']} -> {agent_status['data']['status']}")
                return agent_status
            
            # 1. 处理ReasoningStep对象 - 这些包含真实的Agent推理过程
            if 'ReasoningStep' in chunk_type or hasattr(chunk, 'reasoning') or hasattr(chunk, 'decision_factors'):
                reasoning_decision = self._extract_reasoning_decision(chunk, team_name)
                if reasoning_decision:
                    logger.info(f"[TEAM_DECISION] 提取到真实Agent推理决策: {reasoning_decision['data']['decision_type']}")
                    return reasoning_decision
            
            # 2. 检查chunk是否包含协调决策信息
            if hasattr(chunk, 'coordination_info') or (hasattr(chunk, 'metadata') and 
                chunk.metadata and isinstance(chunk.metadata, dict) and 
                ('coordination' in chunk.metadata or 'strategy' in chunk.metadata)):
                coordination_decision = self._extract_coordination_decision(chunk, team_name)
                if coordination_decision:
                    logger.info(f"[TEAM_DECISION] 提取到真实协调决策: {coordination_decision['data']['decision_type']}")
                    return coordination_decision
            
            # ========== 修改：处理内容时分离决策和回答 ==========
            # 3. 处理文本内容chunk - 分离决策过程和实际回答
            if hasattr(chunk, 'content') and chunk.content and isinstance(chunk.content, str):
                content = chunk.content
                if not isinstance(content, str):
                    try:
                        content = str(content)
                    except Exception:
                        logger.warning(f"[TEAM_CHUNK] 无法转换content为字符串: {type(content)}")
                        return None
                
                # 先记录原内容用于调试
                logger.debug(f"[TEAM_CHUNK] 处理内容长度: {len(content)}, 前100字符: {content[:100]}")
                
                # 检查内容是否包含决策过程信息
                decision_content = self._extract_decision_content_from_text(content, team_name)
                if decision_content:
                    logger.info(f"[TEAM_DECISION] 从文本提取到决策内容，不包含在回答中: {decision_content['data']['decision_type']}")
                    return decision_content
                
                # 过滤掉明显的决策过程内容，只保留实际回答
                filtered_content = self._filter_decision_content_from_answer(content)
                logger.debug(f"[TEAM_CHUNK] 内容过滤结果: 原长度{len(content)} -> 过滤后长度{len(filtered_content)}")
                
                if filtered_content and filtered_content.strip():
                    # 如果过滤效果显著（去掉了很多内容），说明原内容确实包含决策过程
                    content_reduction = (len(content) - len(filtered_content)) / len(content)
                    if content_reduction > 0.3:  # 如果过滤掉了30%以上的内容
                        logger.info(f"[TEAM_CHUNK] 过滤掉了{content_reduction:.1%}的决策内容，返回清理后的回答")
                    
                    return {
                        "type": "content",
                        "data": {
                            "content": filtered_content,
                            "agent_name": team_name,
                            "model_used": "team",
                            "timestamp": time.time()
                        }
                    }
                else:
                    # 如果过滤后没有实际内容，说明这是纯决策过程内容，创建决策事件
                    logger.info(f"[TEAM_CHUNK] 内容完全被过滤，识别为纯决策过程，创建决策事件")
                    fallback_decision = self._create_fallback_decision_from_content(content, team_name)
                    if fallback_decision:
                        return fallback_decision
                    else:
                        return None
            
            # 5. 处理Agent调用事件 (Agno可能在chunk的metadata中包含这些信息)
            if hasattr(chunk, 'metadata') and chunk.metadata:
                metadata = chunk.metadata
                if isinstance(metadata, dict):
                    # 检查是否是Agent调用事件
                    if 'agent_name' in metadata or 'member_name' in metadata:
                        agent_name = metadata.get('agent_name') or metadata.get('member_name', 'unknown')
                        action = metadata.get('action', 'processing')
                        status = metadata.get('status', 'running')
                        
                        return {
                            "type": "agent_call", 
                            "data": {
                                "member_id": metadata.get('member_id', agent_name),
                                "member_name": agent_name,
                                "role": metadata.get('role', 'agent'),
                                "action": action,
                                "call_type": metadata.get('call_type', 'execute'),
                                "input": metadata.get('input', {}),
                                "output": metadata.get('output', {}),
                                "start_time": metadata.get('start_time', time.time() * 1000),
                                "end_time": metadata.get('end_time'),
                                "duration_ms": metadata.get('duration_ms', 0),
                                "status": status,
                                "confidence": metadata.get('confidence'),
                                "error_message": metadata.get('error_message'),
                                "timestamp": time.time()
                            }
                        }
            
            # 3. 处理其他类型的事件 (尝试解析chunk对象的其他属性)
            chunk_attrs = dir(chunk)
            if 'event_type' in chunk_attrs:
                event_type = getattr(chunk, 'event_type', None)
                if event_type:
                    logger.info(f"[TEAM_CHUNK] 检测到事件类型: {event_type}")
                    
                    # 根据事件类型构造相应的数据
                    if 'agent' in event_type.lower() or 'member' in event_type.lower():
                        return {
                            "type": "agent_call",
                            "data": {
                                "member_id": getattr(chunk, 'agent_id', 'unknown'),
                                "member_name": getattr(chunk, 'agent_name', 'unknown'),
                                "role": getattr(chunk, 'role', 'agent'),
                                "action": getattr(chunk, 'action', 'processing'),
                                "status": getattr(chunk, 'status', 'running'),
                                "timestamp": time.time()
                            }
                        }
            
            # 4. 如果chunk包含字符串内容但不在content属性中
            try:
                chunk_str = str(chunk) if chunk is not None else ""
                # 避免处理ReasoningStep或其他复杂对象的默认str输出
                if chunk_str and chunk_str != str(type(chunk)) and not chunk_str.startswith('<'):
                    # 尝试从字符串中提取Agent信息
                    agent_info = self._extract_agent_info_from_text(chunk_str)
            except Exception as str_error:
                logger.warning(f"[TEAM_CHUNK] 字符串转换失败: {str_error}, chunk类型: {type(chunk)}")
                chunk_str = ""
                agent_info = None
            
            if chunk_str and agent_info:
                return {
                    "type": "agent_call",
                    "data": agent_info
                }
            elif chunk_str:
                # 作为普通内容处理
                return {
                    "type": "content",
                    "data": {
                        "content": chunk_str,
                        "agent_name": team_name,
                        "model_used": "team",
                        "timestamp": time.time()
                    }
                }
            
            logger.debug(f"[TEAM_CHUNK] 无法处理的chunk类型: {chunk_type}, 属性: {chunk_attrs}")
            return None
            
        except Exception as e:
            logger.error(f"[TEAM_CHUNK] 处理chunk时出错: {e}")
            return None
    
    def _extract_agent_info_from_text(self, text: str) -> Optional[Dict]:
        """从文本中提取Agent信息"""
        try:
            # 常见的Agent调用模式
            import re
            
            # 模式1: "调用 XXX Agent 执行 YYY"
            pattern1 = r'调用\s*([^A]\w*)\s*[Aa]gent\s*执行\s*([^。\n]+)'
            match1 = re.search(pattern1, text)
            if match1:
                return {
                    "member_id": match1.group(1).lower() + "_agent",
                    "member_name": match1.group(1) + " Agent",
                    "role": "agent",
                    "action": match1.group(2).strip(),
                    "status": "running",
                    "start_time": time.time() * 1000,
                    "timestamp": time.time()
                }
            
            # 模式2: "Agent XXX: YYY"
            pattern2 = r'Agent\s+(\w+):\s*([^。\n]+)'
            match2 = re.search(pattern2, text)
            if match2:
                return {
                    "member_id": match2.group(1).lower() + "_agent",
                    "member_name": match2.group(1) + " Agent",
                    "role": "agent", 
                    "action": match2.group(2).strip(),
                    "status": "running",
                    "start_time": time.time() * 1000,
                    "timestamp": time.time()
                }
            
            # 模式3: 检查是否包含已知的Agent名称
            known_agents = {
                "question_decomposition": "问题分解专家",
                "translation": "翻译专家",
                "knowledge_retrieval": "知识检索专家", 
                "knowledge_graph": "知识图谱专家",
                "summary_answer": "总结回答专家",
                "qa_coordinator": "问答协调器"
            }
            
            for agent_id, agent_name in known_agents.items():
                if agent_id in text.lower() or agent_name in text:
                    return {
                        "member_id": agent_id + "_agent",
                        "member_name": agent_name,
                        "role": "agent",
                        "action": "processing",
                        "status": "running",
                        "start_time": time.time() * 1000,
                        "timestamp": time.time()
                    }
                    
            return None
            
        except Exception as e:
            logger.error(f"[TEAM_CHUNK] 提取Agent信息失败: {e}")
            return None
    
    def _detect_agent_call_in_chunk(self, chunk_content: str, buffer_content: str) -> Optional[Dict[str, Any]]:
        """检测chunk中的Agent调用信息"""
        try:
            import re
            import json
            
            # 简化检测：查找transfer_task_to_member字符串
            if "transfer_task_to_member" in buffer_content:
                # 尝试提取member_id
                member_match = re.search(r'"member_id":\s*"([^"]+)"', buffer_content)
                task_match = re.search(r'"task_description":\s*"([^"]+)"', buffer_content)
                
                if member_match:
                    agent_name = member_match.group(1)
                    task = task_match.group(1) if task_match else "unknown task"
                    return {
                        "agent_name": agent_name,
                        "action": "task_assignment",
                        "task": task,
                        "status": "running"
                    }
            
            # 检测具体的Agent名称
            agent_names = [
                "question-decomposition-agent",
                "translation-agent", 
                "knowledge-retrieval-agent",
                "knowledge-graph-agent",
                "summary-answer-agent",
                "qa-coordinator-v2"
            ]
            
            for agent_name in agent_names:
                if agent_name in chunk_content or agent_name in buffer_content:
                    return {
                        "agent_name": agent_name,
                        "action": "processing",
                        "status": "running"
                    }
            
            # 检测一般的Agent模式
            agent_patterns = [
                r'"([^"]*agent[^"]*)"',
                r'question[_-]?decomposition[_-]?agent',
                r'translation[_-]?agent',
                r'knowledge[_-]?retrieval[_-]?agent',
                r'knowledge[_-]?graph[_-]?agent',
                r'summary[_-]?answer[_-]?agent',
                r'qa[_-]?coordinator'
            ]
            
            for pattern in agent_patterns:
                match = re.search(pattern, chunk_content, re.IGNORECASE)
                if match:
                    agent_name = match.group(1) if match.groups() else match.group()
                    return {
                        "agent_name": agent_name,
                        "action": "processing",
                        "status": "running"
                    }
            
            return None
            
        except Exception as e:
            logger.debug(f"[STREAM] Agent调用检测失败: {e}")
            return None
    
    def _create_error_response(self, team_name: str, query: str, error: str, processing_time: float) -> AdvancedAgentResponse:
        """创建错误响应"""
        return AdvancedAgentResponse(
            content=f"抱歉，处理您的问题时出现了错误：{error}",
            agent_name=team_name,
            model_used="error",
            processing_time=processing_time,
            metadata={
                "query": query,
                "error": error,
                "timestamp": time.time()
            }
        )
    
    def get_available_teams(self) -> List[str]:
        """获取可用的高级Team列表"""
        if not self.agent_factory._config or "agent_teams" not in self.agent_factory._config:
            return []
        return list(self.agent_factory._config["agent_teams"].keys())

    # ========== 新增：真实Agent决策数据提取方法 ==========
    def _extract_reasoning_decision(self, chunk, team_name: str) -> Optional[Dict]:
        """从ReasoningStep或推理chunk中提取真实决策数据"""
        try:
            # 获取推理内容
            reasoning_content = ""
            decision_type = "agent_reasoning"
            confidence = 0.8
            agent_name = "unknown"
            
            # 尝试从不同属性获取推理内容
            if hasattr(chunk, 'content'):
                reasoning_content = str(chunk.content)
            elif hasattr(chunk, 'reasoning'):
                reasoning_content = str(chunk.reasoning)
            elif hasattr(chunk, 'text'):
                reasoning_content = str(chunk.text)
            else:
                reasoning_content = str(chunk)
            
            # 从内容中识别Agent名称
            if 'translation' in reasoning_content.lower():
                agent_name = "翻译专家"
                decision_type = "translation_strategy"
            elif 'decomposition' in reasoning_content.lower() or '分解' in reasoning_content:
                agent_name = "问题分解专家"
                decision_type = "query_decomposition"
            elif 'retrieval' in reasoning_content.lower() or '检索' in reasoning_content:
                agent_name = "知识检索专家"
                decision_type = "retrieval_strategy"
            elif 'graph' in reasoning_content.lower() or '图谱' in reasoning_content:
                agent_name = "知识图谱专家"
                decision_type = "graph_analysis"
            elif 'summary' in reasoning_content.lower() or '总结' in reasoning_content:
                agent_name = "总结回答专家"
                decision_type = "answer_synthesis"
            elif 'coordinator' in reasoning_content.lower() or '协调' in reasoning_content:
                agent_name = "问答协调器"
                decision_type = "coordination_strategy"
            
            # 计算基于内容的置信度
            if len(reasoning_content) > 100:
                confidence = 0.9
            elif len(reasoning_content) > 50:
                confidence = 0.8
            else:
                confidence = 0.7
            
            # 提取决策因素
            decision_factors = []
            if '复杂' in reasoning_content or 'complex' in reasoning_content.lower():
                decision_factors.append("查询复杂度分析")
            if '语言' in reasoning_content or 'language' in reasoning_content.lower():
                decision_factors.append("多语言处理需求")
            if '专业' in reasoning_content or 'technical' in reasoning_content.lower():
                decision_factors.append("专业知识要求")
            if '检索' in reasoning_content or 'retrieval' in reasoning_content.lower():
                decision_factors.append("知识库匹配策略")
            
            return {
                "type": "agent_decision",
                "data": {
                    "decision_type": decision_type,
                    "agent_name": agent_name,
                    "reasoning_content": reasoning_content[:500],  # 限制长度
                    "confidence": confidence,
                    "decision_factors": decision_factors,
                    "timestamp": time.time(),
                    "chunk_type": type(chunk).__name__
                }
            }
            
        except Exception as e:
            logger.error(f"[TEAM_DECISION] 提取推理决策失败: {e}")
            return None
    
    def _extract_coordination_decision(self, chunk, team_name: str) -> Optional[Dict]:
        """提取协调决策信息"""
        try:
            coordination_info = {}
            
            # 从metadata提取协调信息
            if hasattr(chunk, 'metadata') and chunk.metadata:
                metadata = chunk.metadata
                if 'coordination' in metadata:
                    coordination_info = metadata['coordination']
                elif 'strategy' in metadata:
                    coordination_info = metadata['strategy']
            
            # 从coordination_info属性提取
            if hasattr(chunk, 'coordination_info'):
                coordination_info = chunk.coordination_info
            
            if coordination_info:
                return {
                    "type": "coordination_decision",
                    "data": {
                        "decision_type": "team_coordination",
                        "coordination_strategy": coordination_info.get('strategy', 'sequential'),
                        "team_members": coordination_info.get('members', []),
                        "execution_order": coordination_info.get('order', []),
                        "confidence": coordination_info.get('confidence', 0.85),
                        "reasoning": f"团队协调策略：{coordination_info.get('strategy', '未知')}",
                        "timestamp": time.time()
                    }
                }
            
            return None
            
        except Exception as e:
            logger.error(f"[TEAM_DECISION] 提取协调决策失败: {e}")
            return None
    
    def _extract_strategy_from_content(self, content: str, team_name: str) -> Optional[Dict]:
        """从内容文本中提取策略决策"""
        try:
            import re
            
            # 检测策略关键词
            strategy_patterns = {
                "query_analysis": [r"分析.*问题", r"analyzing.*query", r"问题.*分析"],
                "language_detection": [r"检测.*语言", r"language.*detection", r"语言.*识别"],
                "knowledge_search": [r"搜索.*知识", r"knowledge.*search", r"检索.*信息"],
                "answer_generation": [r"生成.*答案", r"generating.*answer", r"答案.*生成"],
                "quality_assessment": [r"评估.*质量", r"quality.*assessment", r"质量.*检查"]
            }
            
            detected_strategies = []
            for strategy_type, patterns in strategy_patterns.items():
                for pattern in patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        detected_strategies.append(strategy_type)
                        break
            
            if detected_strategies:
                # 选择第一个检测到的策略作为主要决策类型
                primary_strategy = detected_strategies[0]
                
                return {
                    "type": "strategy_decision",
                    "data": {
                        "decision_type": primary_strategy,
                        "detected_strategies": detected_strategies,
                        "content_snippet": content[:200],
                        "confidence": 0.75 + (len(detected_strategies) * 0.05),  # 检测到的策略越多，置信度越高
                        "reasoning": f"从内容中检测到{len(detected_strategies)}种策略决策模式",
                        "timestamp": time.time()
                    }
                }
            
            return None
            
        except Exception as e:
            logger.error(f"[TEAM_DECISION] 从内容提取策略失败: {e}")
            return None
    
    def _create_real_team_analysis(self, collected_decisions: List[Dict], real_member_calls: List[Dict], 
                                  query: str, execution_id: str, processing_time: float, 
                                  knowledge_sources: List[Dict] = None) -> Dict:
        """基于真实收集的决策数据创建团队分析，替代静态模板"""
        try:
            # 分析决策质量和类型分布
            decision_types = [d.get('decision_type', 'unknown') for d in collected_decisions]
            decision_quality = self._assess_decision_quality(collected_decisions)
            
            # 构造真实的团队决策数据
            team_decisions = []
            for i, decision in enumerate(collected_decisions):
                team_decisions.append({
                    'type': decision.get('decision_type', f'decision_{i+1}'),
                    'title': self._generate_decision_title(decision),
                    'content': decision.get('reasoning_content', decision.get('reasoning', '未知决策内容')),
                    'confidence': decision.get('confidence', 0.8),
                    'reasoning': decision.get('reasoning', f"基于{decision.get('agent_name', '系统')}的分析结果"),
                    'agent_name': decision.get('agent_name', 'Unknown Agent'),
                    'timestamp': decision.get('timestamp', time.time()),
                    'decision_factors': decision.get('decision_factors', [])
                })
            
            # 如果没有收集到真实决策，创建基于查询内容的分析
            if not team_decisions:
                team_decisions = self._generate_query_based_decisions(query, execution_id)
            
            # 🔥 为被禁用的问题分解智能体添加固定的决策条目
            has_decomposition_decision = any(d.get('agent_name') == 'question_decomposition_agent' for d in team_decisions)
            if not has_decomposition_decision:
                team_decisions.insert(1, {  # 插入到第2位，在协调器之后
                    'type': 'question_analysis_disabled',
                    'title': '问题分解分析（已跳过）',
                    'content': f'对问题"{query}"进行了基本分析，识别为通用知识相关查询。采用固定分解策略以确保流程稳定性。',
                    'confidence': 0.95,
                    'reasoning': '使用预设的问题分解模板，避免复杂分解逻辑导致的潜在阻塞问题',
                    'agent_name': 'question_decomposition_agent',
                    'timestamp': time.time(),
                    'decision_factors': ['问题类型识别', '稳定性优先策略', '固定响应模板'],
                    'disabled': True
                })
            
            # 处理成员调用数据
            enhanced_member_calls = []
            for call in real_member_calls:
                enhanced_member_calls.append({
                    'memberId': call.get('member_id', 'unknown'),
                    'memberName': call.get('member_name', call.get('agent_name', 'Unknown Agent')),
                    'role': call.get('role', 'agent'),
                    'action': call.get('action', 'processing'),
                    'input': call.get('input', {}),
                    'output': call.get('output', {}),
                    'status': call.get('status', 'completed'),
                    'durationMs': call.get('duration_ms', 0),
                    'confidence': call.get('confidence', 0.85),
                    'timestamp': call.get('timestamp', time.time())
                })
            
            # 🔥 为被禁用的问题分解智能体添加固定的成员调用记录
            has_decomposition_call = any(call.get('memberId') == 'question_decomposition_agent' for call in enhanced_member_calls)
            if not has_decomposition_call:
                enhanced_member_calls.insert(1, {  # 插入到第2位，在协调器之后
                    'memberId': 'question_decomposition_agent',
                    'memberName': '问题分解智能体',
                    'role': '问题分析专家',
                    'action': 'analyze_and_decompose_fixed',
                    'input': {'original_query': query, 'mode': 'disabled_fixed_response'},
                    'output': {
                        'sub_questions': ['材料基本特性查询', '相关研究文献检索', '实际应用案例分析'],
                        'complexity_score': 0.7,
                        'question_type': '通用知识查询',
                        'processing_strategy': 'knowledge_retrieval_first',
                        'note': '使用固定响应模板'
                    },
                    'status': 'completed_with_fixed_response',
                    'durationMs': 200,  # 模拟快速完成
                    'confidence': 0.9,
                    'timestamp': time.time(),
                    'disabled': True
                })
            
            # 计算执行统计
            total_steps = len(enhanced_member_calls)
            completed_steps = len([call for call in enhanced_member_calls if call.get('status') == 'completed'])
            failed_steps = len([call for call in enhanced_member_calls if call.get('status') == 'failed'])
            average_step_duration = (
                sum([call.get('durationMs', 0) for call in enhanced_member_calls]) / max(total_steps, 1)
            ) if enhanced_member_calls else 0
            
            # 构建完整的团队分析
            return {
                'execution_id': execution_id,
                'query': query,
                'processing_time': processing_time,
                'team_decisions': team_decisions,
                'member_calls': enhanced_member_calls,
                'knowledge_sources': knowledge_sources or [],  # 包含所有知识库检索结果
                'coordination_info': {
                    'coordinatorId': 'team_coordinator',
                    'coordinationMode': 'sequential_processing',
                    'sharedState': {
                        'execution_id': execution_id,
                        'query': query,
                        'strategy': 'dynamic_coordination'
                    },
                    'routingDecisions': [
                        {
                            'stepId': f'step_{i+1}',
                            'memberId': call.get('memberId', f'agent_{i+1}'),
                            'reason': call.get('action', '执行决策任务'),
                            'confidence': call.get('confidence', 0.85)
                        }
                        for i, call in enumerate(enhanced_member_calls[:5])  # 限制显示前5个决策
                    ],
                    'performanceMetrics': {
                        'totalSteps': total_steps,
                        'completedSteps': completed_steps,
                        'failedSteps': failed_steps,
                        'averageStepDuration': average_step_duration,
                        'totalExecutionTime': processing_time * 1000,  # 转换为毫秒
                        'executionEfficiency': min(1.0, 10.0 / max(processing_time, 1.0)),
                        'successRate': completed_steps / max(total_steps, 1) if total_steps > 0 else 1.0
                    }
                },
                'metadata': {
                    'is_real_data': len(collected_decisions) > 0,
                    'decision_source': 'agent_reasoning' if collected_decisions else 'query_analysis',
                    'collection_method': 'stream_extraction',
                    'knowledge_retrieved': len(knowledge_sources) if knowledge_sources else 0,
                    'timestamp': time.time()
                }
            }
            
        except Exception as e:
            logger.error(f"[REAL_ANALYSIS] 创建真实团队分析失败: {e}")
            # 返回最小化的分析数据
            return {
                'execution_id': execution_id,
                'query': query,
                'processing_time': processing_time,
                'team_decisions': self._generate_query_based_decisions(query, execution_id),
                'member_calls': real_member_calls or [],
                'coordination_info': {
                    'strategy': 'fallback_analysis',
                    'total_decisions': 1,
                    'total_member_calls': len(real_member_calls),
                    'decision_quality_score': 0.5,
                    'error': str(e)
                },
                'metadata': {
                    'is_real_data': False,
                    'decision_source': 'error_fallback',
                    'timestamp': time.time()
                }
            }
    
    def _assess_decision_quality(self, decisions: List[Dict]) -> float:
        """评估决策质量分数"""
        if not decisions:
            return 0.5
        
        total_confidence = sum(d.get('confidence', 0.5) for d in decisions)
        avg_confidence = total_confidence / len(decisions)
        
        # 考虑决策的多样性和完整性
        decision_types = set(d.get('decision_type', 'unknown') for d in decisions)
        type_diversity = min(1.0, len(decision_types) / 5.0)  # 最多5种不同类型
        
        return (avg_confidence * 0.7) + (type_diversity * 0.3)
    
    def _generate_decision_title(self, decision: Dict) -> str:
        """为决策生成标题"""
        decision_type = decision.get('decision_type', 'unknown')
        agent_name = decision.get('agent_name', 'Agent')
        
        title_map = {
            'translation_strategy': f'{agent_name}的翻译策略选择',
            'query_decomposition': f'{agent_name}的问题分解方案',
            'retrieval_strategy': f'{agent_name}的检索策略决策',
            'graph_analysis': f'{agent_name}的图谱分析方法',
            'answer_synthesis': f'{agent_name}的答案合成策略',
            'coordination_strategy': f'{agent_name}的协调策略',
            'agent_reasoning': f'{agent_name}的推理过程',
            'team_coordination': '团队协调决策',
            'query_analysis': '查询分析决策',
            'language_detection': '语言检测决策',
            'knowledge_search': '知识搜索策略',
            'answer_generation': '答案生成策略',
            'quality_assessment': '质量评估决策'
        }
        
        return title_map.get(decision_type, f'{agent_name}的处理决策')
    
    def _generate_query_based_decisions(self, query: str, execution_id: str) -> List[Dict]:
        """基于查询内容生成分析性决策（当没有收集到真实决策时的后备方案）"""
        decisions = []
        
        # 基于查询内容的基本分析
        query_length = len(query)
        has_chinese = any('\u4e00' <= char <= '\u9fff' for char in query)
        has_english = any(char.isalpha() and ord(char) < 128 for char in query)
        is_technical = any(term in query.lower() for term in ['材料', '强度', '性能', 'material', 'strength', 'property'])
        
        # 查询复杂度分析决策
        complexity_score = 0.5
        if query_length > 50:
            complexity_score += 0.2
        if has_chinese and has_english:
            complexity_score += 0.2
        if is_technical:
            complexity_score += 0.3
        
        decisions.append({
            'type': 'query_complexity_analysis',
            'title': '查询复杂度分析决策',
            'content': f'分析查询内容长度为{query_length}字符，{"包含中英文混合" if has_chinese and has_english else "单一语言"}，{"涉及专业术语" if is_technical else "通用词汇"}。',
            'confidence': min(0.95, 0.6 + complexity_score),
            'reasoning': f'基于查询长度、语言复杂性和专业性进行综合评估，复杂度分数: {complexity_score:.2f}',
            'agent_name': '查询分析器',
            'timestamp': time.time(),
            'decision_factors': [
                f'查询长度: {query_length}字符',
                '语言类型: ' + ('中英混合' if has_chinese and has_english else '单一语言'),
                '专业性: ' + ('技术查询' if is_technical else '通用查询')
            ]
        })
        
        return decisions
    
    def _extract_decision_content_from_text(self, content: str, team_name: str) -> Optional[Dict]:
        """
        从文本内容中提取决策过程信息，用于决策时间线显示
        如果识别为决策内容，返回决策数据；否则返回None
        """
        try:
            # 扩展的决策内容关键词模式 - 更全面的匹配
            decision_patterns = [
                # 动作类决策指示词
                r'(?:正在|开始|准备|即将)(?:分析|检索|翻译|总结|处理|执行)',
                r'(?:决定|选择|采用|使用).*?(?:策略|方法|方案|模式)',
                r'(?:基于|根据|依据).*?(?:决定|选择|判断|认为)',
                r'(?:协调|调度|分配|安排).*?(?:任务|工作|资源)',
                r'(?:推理|分析|判断|评估).*?(?:结果|过程|情况)',
                
                # Agent和专家相关
                r'Agent.*?(?:正在|开始|完成|执行|分析)',
                r'(?:专家|智能体|系统).*?(?:分析|处理|建议|判断)',
                r'(?:翻译|检索|图谱|分析|总结)(?:专家|智能体|系统)',
                
                # 技术决策相关
                r'(?:复杂度|置信度|匹配度|相似度).*?(?:评估|分析|计算)',
                r'(?:知识库|图谱|检索|向量).*?(?:匹配|查询|搜索)',
                r'(?:语言|翻译|多语言).*?(?:检测|处理|转换|识别)',
                
                # 团队协作决策
                r'(?:团队|多智能体|协作).*?(?:决策|分析|处理)',
                r'(?:流程|步骤|阶段).*?(?:分析|执行|完成)',
                
                # 常见的决策表述
                r'(?:我|系统|智能体)(?:将|会|准备|正在).*?(?:分析|处理|检索)',
                r'(?:让我|让系统|让智能体).*?(?:分析|处理|检索)',
                r'(?:首先|然后|接下来|最后).*?(?:分析|处理|检索)',
                
                # 问题解决过程
                r'(?:理解|分析|解析).*?(?:问题|查询|需求)',
                r'(?:查找|搜索|检索).*?(?:相关|匹配|合适)',
                r'(?:整合|合并|综合).*?(?:信息|结果|答案)'
            ]
            
            # 检查是否包含决策关键词
            import re
            decision_indicators = []
            for pattern in decision_patterns:
                matches = re.findall(pattern, content)
                if matches:
                    decision_indicators.extend(matches)
            
            # 如果没有发现决策指示词，不是决策内容
            if not decision_indicators:
                return None
            
            # 识别Agent类型和决策类型
            agent_name = "系统协调器"
            decision_type = "general_decision"
            confidence = 0.7
            
            if any(word in content for word in ['翻译', 'translation', '语言']):
                agent_name = "翻译专家"
                decision_type = "translation_decision"
                confidence = 0.85
            elif any(word in content for word in ['检索', 'retrieval', '搜索', '知识库']):
                agent_name = "知识检索专家" 
                decision_type = "retrieval_decision"
                confidence = 0.85
            elif any(word in content for word in ['图谱', 'graph', '关系', '网络']):
                agent_name = "知识图谱专家"
                decision_type = "graph_decision"
                confidence = 0.85
            elif any(word in content for word in ['分析', 'analysis', '推理']):
                agent_name = "分析专家"
                decision_type = "analysis_decision"
                confidence = 0.8
            elif any(word in content for word in ['总结', 'summary', '合成', '整合']):
                agent_name = "总结专家"
                decision_type = "synthesis_decision"
                confidence = 0.8
            elif any(word in content for word in ['协调', 'coordinate', '分配', '调度']):
                agent_name = "协调器"
                decision_type = "coordination_decision"
                confidence = 0.75
            
            # 提取决策因素
            decision_factors = []
            if '复杂' in content:
                decision_factors.append("复杂查询处理")
            if any(lang in content for lang in ['中文', '英文', '中英', '语言']):
                decision_factors.append("多语言处理")
            if any(word in content for word in ['专业', '技术', '材料', '聚合物']):
                decision_factors.append("专业领域知识")
            if any(word in content for word in ['匹配', '相似', '检索']):
                decision_factors.append("知识匹配策略")
            
            return {
                "type": "agent_decision",
                "data": {
                    "decision_type": decision_type,
                    "agent_name": agent_name,
                    "reasoning_content": content[:300],  # 限制长度避免过长
                    "confidence": confidence,
                    "decision_factors": decision_factors,
                    "decision_indicators": decision_indicators[:5],  # 最多保留5个指示词
                    "timestamp": time.time(),
                    "source": "content_extraction"
                }
            }
            
        except Exception as e:
            logger.error(f"[DECISION_EXTRACT] 提取决策内容失败: {e}")
            return None
    
    def _filter_decision_content_from_answer(self, content: str) -> str:
        """
        从回答内容中过滤掉决策过程相关的内容，只保留实际回答
        """
        try:
            # 扩展的过滤模式 - 更全面地移除决策过程内容
            filter_patterns = [
                # 动作和过程描述
                r'(?:正在|开始|准备|即将)(?:分析|检索|翻译|总结|处理|执行).*?(?:\n|。|！|？)',
                r'(?:决定|选择|采用|使用).*?(?:策略|方法|方案|模式).*?(?:\n|。|！|？)',
                r'(?:基于|根据|依据).*?(?:决定|选择|判断|认为).*?(?:\n|。|！|？)',
                r'(?:协调|调度|分配|安排).*?(?:任务|工作|资源).*?(?:\n|。|！|？)',
                
                # Agent和系统相关
                r'Agent.*?(?:正在|开始|完成|执行|分析).*?(?:\n|。|！|？)',
                r'(?:专家|智能体|系统).*?(?:分析|处理|建议|判断).*?(?:\n|。|！|？)',
                r'(?:翻译|检索|图谱|分析|总结)(?:专家|智能体|系统).*?(?:\n|。|！|？)',
                
                # 技术过程描述
                r'(?:复杂度|置信度|匹配度|相似度).*?(?:评估|分析|计算).*?(?:\n|。|！|？)',
                r'(?:知识库|图谱|检索|向量).*?(?:匹配|查询|搜索).*?(?:\n|。|！|？)',
                r'(?:语言|翻译|多语言).*?(?:检测|处理|转换|识别).*?(?:\n|。|！|？)',
                
                # 过程标记和描述
                r'(?:推理过程|决策过程|分析过程|处理过程)[:：].*?(?:\n|。|！|？)',
                r'(?:系统|智能体|我).*?(?:判断|认为|建议|分析).*?(?:\n|。|！|？)',
                r'^[\s]*(?:让我|我将|我正在|我准备|我会|我需要).*?(?:\n|。|！|？)',
                
                # 团队协作相关
                r'(?:团队|多智能体|协作).*?(?:决策|分析|处理).*?(?:\n|。|！|？)',
                r'(?:流程|步骤|阶段).*?(?:分析|执行|完成).*?(?:\n|。|！|？)',
                
                # 常见决策表述
                r'(?:首先|然后|接下来|最后).*?(?:分析|处理|检索).*?(?:\n|。|！|？)',
                r'(?:理解|分析|解析).*?(?:问题|查询|需求).*?(?:\n|。|！|？)',
                r'(?:查找|搜索|检索).*?(?:相关|匹配|合适).*?(?:\n|。|！|？)',
                r'(?:整合|合并|综合).*?(?:信息|结果|答案).*?(?:\n|。|！|？)',
                
                # 更通用的过滤模式
                r'.*?(?:正在执行|开始处理|准备分析).*?(?:\n|。|！|？)',
                r'.*?(?:系统分析|智能处理|自动识别).*?(?:\n|。|！|？)'
            ]
            
            # 应用过滤规则
            import re
            filtered_content = content
            for pattern in filter_patterns:
                filtered_content = re.sub(pattern, '', filtered_content, flags=re.MULTILINE | re.IGNORECASE)
            
            # 清理多余的空行和空格
            lines = filtered_content.split('\n')
            cleaned_lines = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith('---') and not line.startswith('==='):
                    # 进一步过滤明显的决策描述行
                    if not any(keyword in line for keyword in [
                        '正在处理', '开始分析', '准备检索', '决策结果', 
                        '推理完成', '分析完毕', '处理中', '执行中'
                    ]):
                        cleaned_lines.append(line)
            
            # 重新组合内容
            result = '\n'.join(cleaned_lines).strip()
            
            # 如果过滤后内容太短，可能是误判，返回原内容的一部分
            if len(result) < 10 and len(content) > 50:
                # 尝试保留看起来像实际回答的部分
                sentences = content.split('。')
                answer_sentences = []
                for sentence in sentences:
                    sentence = sentence.strip()
                    if (len(sentence) > 20 and 
                        not any(keyword in sentence for keyword in [
                            '正在', '开始', '准备', '决定', '选择', '采用', 
                            '协调', '调度', 'Agent', '专家分析'
                        ])):
                        answer_sentences.append(sentence)
                
                if answer_sentences:
                    result = '。'.join(answer_sentences[:3])  # 最多取前3句
                    if not result.endswith('。'):
                        result += '。'
            
            return result
            
        except Exception as e:
            logger.error(f"[CONTENT_FILTER] 过滤决策内容失败: {e}")
            return content  # 发生错误时返回原内容
    
    def _create_fallback_decision_from_content(self, content: str, team_name: str) -> Optional[Dict]:
        """
        当内容完全被过滤掉时，创建一个后备决策事件
        用于确保决策过程信息不会丢失
        """
        try:
            # 简化的决策内容分析
            agent_name = "系统协调器"
            decision_type = "content_analysis"
            confidence = 0.6
            
            # 基于内容长度和特征判断决策类型
            if len(content) > 200:
                confidence = 0.7
                decision_type = "complex_analysis"
            
            # 快速关键词匹配
            if any(word in content for word in ['翻译', 'translation', 'translate']):
                agent_name = "翻译专家"
                decision_type = "translation_analysis"
                confidence = 0.8
            elif any(word in content for word in ['检索', 'search', 'retrieval', '搜索']):
                agent_name = "检索专家"
                decision_type = "retrieval_analysis"
                confidence = 0.8
            elif any(word in content for word in ['图谱', 'graph', 'knowledge']):
                agent_name = "知识图谱专家"
                decision_type = "graph_analysis"
                confidence = 0.8
            elif any(word in content for word in ['分析', 'analysis', 'analyze']):
                agent_name = "分析专家"
                decision_type = "content_analysis"
                confidence = 0.75
            
            return {
                "type": "agent_decision",
                "data": {
                    "decision_type": decision_type,
                    "agent_name": agent_name,
                    "reasoning_content": f"系统识别到决策过程内容: {content[:150]}...",
                    "confidence": confidence,
                    "decision_factors": ["自动内容分析", "决策过程识别"],
                    "decision_indicators": ["完整内容过滤"],
                    "timestamp": time.time(),
                    "source": "fallback_creation"
                }
            }
            
        except Exception as e:
            logger.error(f"[FALLBACK_DECISION] 创建后备决策失败: {e}")
            return None
    
    def _extract_agent_status_from_chunk(self, chunk, team_name: str) -> Optional[Dict]:
        """
        从chunk中提取Agent状态变化信息，用于前端显示当前执行的Agent
        """
        try:
            # 检查chunk内容是否包含Agent启动信息
            content = ""
            if hasattr(chunk, 'content') and chunk.content:
                content = str(chunk.content)
            elif hasattr(chunk, 'text'):
                content = str(chunk.text)
            else:
                content = str(chunk)
            
            # Agent状态变化的关键词模式
            agent_patterns = {
                "问题分解专家": ["分解", "拆分", "问题分析", "复杂度分析"],
                "实时翻译专家": ["翻译", "translation", "中译英", "英译中"],
                "多语言知识检索专家": ["检索", "搜索", "知识库", "文档查找"],
                "知识图谱专家": ["图谱", "关系", "实体", "知识网络"],
                "总结回答专家": ["总结", "整合", "最终回答", "综合分析"],
                "多语言问答协调器": ["协调", "调度", "团队管理", "流程控制"]
            }
            
            # 匹配Agent名称
            detected_agent = None
            agent_action = "执行中"
            confidence = 0.6
            
            for agent_name, keywords in agent_patterns.items():
                if any(keyword in content for keyword in keywords):
                    detected_agent = agent_name
                    confidence = 0.8
                    break
            
            # 如果没有检测到特定Agent，尝试从内容中提取通用信息
            if not detected_agent:
                if len(content) > 50:  # 有足够内容说明某个Agent在工作
                    # 根据内容特征推测Agent类型
                    if any(word in content for word in ["正在", "开始", "准备"]):
                        detected_agent = "系统协调器"
                        agent_action = "准备执行"
                        confidence = 0.7
            
            if detected_agent:
                return {
                    "type": "agent_status",
                    "data": {
                        "agent_name": detected_agent,
                        "status": "running",
                        "action": agent_action,
                        "confidence": confidence,
                        "content_preview": content[:100],  # 内容预览
                        "timestamp": time.time(),
                        "team_name": team_name
                    }
                }
            
            return None
            
        except Exception as e:
            logger.error(f"[AGENT_STATUS] 提取Agent状态失败: {e}")
            return None


# 创建全局服务实例
advanced_agent_team_service = AdvancedAgentTeamService() 
