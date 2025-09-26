"""
HiRAG 与 Agno 框架集成
实现 HiRAG 作为 Agno Tool 和独立 Agent 的完整集成方案
"""
import asyncio
import json
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from pathlib import Path

# Agno 框架组件
from agno.agent.agent import Agent
from agno.team.team import Team
from agno.tools.toolkit import Toolkit
from agno.tools import tool

# HiRAG 组件
from hirag_core import HiRAG, QueryParam

# 现有服务
from core.config_optimized import optimized_config_manager
from core.logger import logger
from service.embedding_service import embedding_service
from service.llm_service import llm_service
from service.llm_config_gateway_client import LLMConfigGatewayClient
from db.repositories.knowledge_repository import KnowledgeRepository
from db.database import get_db, get_async_session


# ============================================================================
# HiRAG Tools - 作为 Agno Toolkit 集成
# ============================================================================

class HiRAGTools(Toolkit):
    """
    HiRAG 工具集 - 提供层次化知识检索能力
    支持 Local、Global、Bridge 三层知识结构的检索
    """
    
    def __init__(self, working_dir: str = "./hirag_workspace"):
        super().__init__(name="hirag_tools")
        
        # 初始化 HiRAG 实例
        self.hirag = self._init_hirag(working_dir)
        
        # 缓存管理
        self._index_cache = {}
        self._query_cache = {}
        
        # 知识库映射（per-collection HiRAG 实例）
        self._collection_hirag_map = {}
        
        logger.info("[HiRAG] HiRAG工具集初始化完成")
    
    def _init_hirag(self, working_dir: str) -> HiRAG:
        """初始化 HiRAG 实例，适配现有服务"""
        
        # 创建嵌入函数适配器
        class EmbeddingAdapter:
            """为 HiRAG 的 NanoVectorDBStorage 提供 embedding_func 接口。
            需具备 __call__ 和 embedding_dim 属性。
            """

            def __init__(self, model_path: Optional[str], default_dim: int = 1024):
                self.model_path = model_path
                # 尝试从一次探测中获取真实维度，否则使用默认值
                self.embedding_dim = default_dim

            async def __call__(self, texts: List[str]) -> Any:
                try:
                    # 延迟解析默认嵌入模型路径
                    if not self.model_path:
                        async with LLMConfigGatewayClient() as gw:
                            default_emb = await gw.get_default_embedding_model()
                            if default_emb and default_emb[0] and default_emb[1]:
                                self.model_path = f"{default_emb[1]}/{default_emb[0]}"
                            else:
                                raise RuntimeError(
                                    "Global model service unavailable or no default embedding model configured"
                                )
                    resp = await embedding_service.create_embeddings(
                        model_path=self.model_path, texts=texts
                    )
                    # 动态校正维度
                    if resp and getattr(resp, "dimension", None):
                        self.embedding_dim = resp.dimension or self.embedding_dim
                    return resp.embeddings
                except Exception as e:
                    logger.error(f"[HiRAG] 嵌入生成失败: {e}")
                    raise
        
        # 创建 LLM 函数适配器
        async def llm_adapter(prompt: str, **kwargs) -> str:
            """适配现有的 LLM 服务到 HiRAG"""
            try:
                # 优先从统一模型服务获取默认聊天模型
                model_id = None
                try:
                    async with LLMConfigGatewayClient() as gw:
                        default_chat = await gw.get_default_chat_model()
                        if default_chat and default_chat[0] and default_chat[1]:
                            # 统一传递 provider/model 形式，交由 llm_service 解析
                            model_id = f"{default_chat[1]}/{default_chat[0]}"
                except Exception:
                    model_id = None
                if not model_id:
                    raise RuntimeError("Global model service unavailable or no default chat model configured")

                response = await llm_service.generate(
                    prompt=prompt,
                    model=model_id,
                    **kwargs,
                )
                return response.text
            except Exception as e:
                logger.error(f"[HiRAG] LLM调用失败: {e}")
                raise
        
        # 配置 HiRAG
        # 嵌入模型路径改为延迟解析（避免在事件循环中阻塞）
        # 由 EmbeddingAdapter 首次调用时从网关获取，若失败则抛错
        embedding_model_path = None

        return HiRAG(
            working_dir=working_dir,
            enable_hierachical_mode=True,
            enable_naive_rag=True,
            enable_local=True,
            embedding_func=EmbeddingAdapter(
                model_path=embedding_model_path,
                default_dim=1024,
            ),
            best_model_func=llm_adapter,
            cheap_model_func=llm_adapter,
            chunk_token_size=1200,
            chunk_overlap_token_size=100,
            embedding_batch_num=6,
            embedding_func_max_async=8,
            enable_llm_cache=True
        )
    
    @tool
    async def index_collection_with_hirag(
        self, 
        collection_id: int,
        force_rebuild: bool = False
    ) -> Dict[str, Any]:
        """
        为知识库构建 HiRAG 层次化索引
        
        Args:
            collection_id: 知识库ID
            force_rebuild: 是否强制重建索引
            
        Returns:
            索引构建结果
        """
        try:
            # 检查缓存
            if collection_id in self._index_cache and not force_rebuild:
                return {
                    "success": True,
                    "message": "索引已存在",
                    "collection_id": collection_id,
                    "cached": True
                }
            
            # 获取/创建该集合的工作目录并缓存实例
            hi = await self._get_or_create_hirag_for_collection(str(collection_id))

            # 获取知识库文档
            async with get_db() as db:
                repo = KnowledgeRepository(db)
                documents = await repo.get_collection_documents(collection_id)
            
            if not documents:
                return {
                    "success": False,
                    "message": "知识库中无文档",
                    "collection_id": collection_id
                }
            
            # 构建 HiRAG 索引
            indexed_count = 0
            for doc in documents:
                await hi.insert(doc.content)
                indexed_count += 1
                
                if indexed_count % 10 == 0:
                    logger.info(f"[HiRAG] 已索引 {indexed_count}/{len(documents)} 个文档")
            
            # 更新缓存
            self._index_cache[collection_id] = True
            
            return {
                "success": True,
                "message": f"成功构建 HiRAG 索引",
                "collection_id": collection_id,
                "document_count": indexed_count,
                "hierarchical_levels": 3  # Local, Global, Bridge
            }
            
        except Exception as e:
            logger.error(f"[HiRAG] 索引构建失败: {e}")
            return {
                "success": False,
                "message": str(e),
                "collection_id": collection_id
            }
    
    @tool
    async def hierarchical_search(
        self,
        query: str,
        mode: str = "hi",
        collection_id: Optional[int] = None,
        top_k: int = 10
    ) -> Dict[str, Any]:
        """
        执行层次化检索
        
        Args:
            query: 查询内容
            mode: 检索模式 (hi|naive|hi_nobridge|hi_local|hi_global|hi_bridge)
            collection_id: 知识库ID（可选）
            top_k: 返回结果数量
            
        Returns:
            层次化检索结果
        """
        try:
            # 缓存键
            cache_key = f"{query}_{mode}_{collection_id}_{top_k}"
            if cache_key in self._query_cache:
                logger.info(f"[HiRAG] 使用缓存结果: {query[:30]}...")
                return self._query_cache[cache_key]
            
            # 选择对应集合的 HiRAG 实例
            hi = self.hirag
            if collection_id is not None:
                hi = await self._get_or_create_hirag_for_collection(str(collection_id))

            # 执行检索
            result = await hi.query(
                query,
                param=QueryParam(mode=mode, top_k=top_k)
            )
            
            # 解析结果
            formatted_result = self._format_search_results(result, mode)
            
            # 缓存结果
            self._query_cache[cache_key] = formatted_result
            
            return formatted_result
            
        except Exception as e:
            logger.error(f"[HiRAG] 检索失败: {e}")
            return {
                "success": False,
                "message": str(e),
                "query": query,
                "mode": mode
            }

    @tool
    async def update_with_texts(self, collection_id: str, texts: List[str]) -> Dict[str, Any]:
        """
        增量更新（按文本插入）：用于在文档向量化完成后，将新文本注入对应集合的 HiRAG 索引。
        注意：当前 HiRAG 实现会在 insert 时重算社区报告（丢弃旧报告并重建），属于“重算社区”式的增量。
        """
        try:
            if not texts:
                return {"success": True, "message": "no-op"}
            hi = await self._get_or_create_hirag_for_collection(str(collection_id))
            await hi.insert(texts)
            return {"success": True, "message": f"inserted {len(texts)} texts"}
        except Exception as e:
            logger.error(f"[HiRAG] 增量更新失败: {e}")
            return {"success": False, "error": str(e)}
    
    @tool
    async def get_community_reports(
        self,
        collection_id: Optional[int] = None,
        level: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        获取社区报告（Global Knowledge）
        
        Args:
            collection_id: 知识库ID
            level: 层次级别（1=一级社区, 2=二级社区, ...）
            
        Returns:
            社区报告列表
        """
        try:
            # 获取社区报告存储
            community_reports = self.hirag.community_reports
            
            # 获取所有报告
            all_reports = []
            async for report_id, report_data in community_reports.items():
                # 过滤层级
                if level and report_data.get("level") != level:
                    continue
                    
                all_reports.append({
                    "community_id": report_id,
                    "title": report_data.get("title"),
                    "summary": report_data.get("summary"),
                    "level": report_data.get("level"),
                    "impact_rating": report_data.get("impact_severity_rating"),
                    "entity_count": len(report_data.get("entities", [])),
                    "key_findings": report_data.get("detailed_findings", [])[:3]  # 前3个关键发现
                })
            
            return all_reports
            
        except Exception as e:
            logger.error(f"[HiRAG] 获取社区报告失败: {e}")
            return []
    
    @tool
    async def analyze_knowledge_hierarchy(
        self,
        query: str,
        collection_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        分析查询的知识层次结构
        
        Args:
            query: 查询内容
            collection_id: 知识库ID
            
        Returns:
            知识层次分析结果
        """
        try:
            # 并行执行三层检索
            local_task = self.hierarchical_search(query, "hi_local", collection_id)
            global_task = self.hierarchical_search(query, "hi_global", collection_id)
            bridge_task = self.hierarchical_search(query, "hi_bridge", collection_id)
            
            local_result, global_result, bridge_result = await asyncio.gather(
                local_task, global_task, bridge_task
            )
            
            # 分析层次贡献度
            analysis = {
                "query": query,
                "hierarchy_analysis": {
                    "local_knowledge": {
                        "contribution": self._calculate_contribution(local_result),
                        "entity_count": local_result.get("entity_count", 0),
                        "chunk_count": local_result.get("chunk_count", 0)
                    },
                    "global_knowledge": {
                        "contribution": self._calculate_contribution(global_result),
                        "community_count": global_result.get("community_count", 0),
                        "report_count": global_result.get("report_count", 0)
                    },
                    "bridge_knowledge": {
                        "contribution": self._calculate_contribution(bridge_result),
                        "connection_count": bridge_result.get("connection_count", 0),
                        "path_count": bridge_result.get("path_count", 0)
                    }
                },
                "recommended_mode": self._recommend_retrieval_mode(
                    local_result, global_result, bridge_result
                )
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"[HiRAG] 层次分析失败: {e}")
            return {
                "success": False,
                "message": str(e),
                "query": query
            }
    
    def _format_search_results(self, raw_results: Any, mode: str) -> Dict[str, Any]:
        """格式化检索结果"""
        formatted = {
            "success": True,
            "mode": mode,
            "results": [],
            "metadata": {}
        }
        
        # 根据模式解析结果
        if isinstance(raw_results, dict):
            if "answer" in raw_results:
                formatted["answer"] = raw_results["answer"]
            if "sources" in raw_results:
                formatted["sources"] = raw_results["sources"]
            if "entities" in raw_results:
                formatted["entities"] = raw_results["entities"]
                
        # 统计信息
        formatted["metadata"] = {
            "retrieval_mode": mode,
            "result_count": len(formatted.get("results", [])),
            "has_answer": "answer" in formatted,
            "knowledge_levels": self._identify_knowledge_levels(mode)
        }
        
        return formatted

    async def _get_or_create_hirag_for_collection(self, collection_id: str) -> HiRAG:
        """按集合维度创建/复用 HiRAG 实例，并确保 working_dir 存在与配置信息持久化。"""
        if collection_id in self._collection_hirag_map:
            return self._collection_hirag_map[collection_id]

        # 读取集合配置中的 working_dir，不存在则生成并持久化
        import os
        working_dir = None
        async with get_async_session() as session:
            from sqlalchemy import text
            q = text("SELECT config FROM knowledge_collections WHERE id=:cid LIMIT 1")
            res = await session.execute(q, {"cid": collection_id})
            row = res.first()
            cfg = row[0] if row else {}  # type: ignore
            hirag_cfg = (cfg.get('hirag') if isinstance(cfg, dict) else None) or {}
            working_dir = hirag_cfg.get('working_dir')
            if not working_dir:
                base_dir = os.getenv('HIRAG_BASE_DIR', './hirag_workspace')
                working_dir = os.path.join(base_dir, collection_id)
                await session.execute(
                    text(
                        """
                        UPDATE knowledge_collections
                        SET config = jsonb_set(
                            COALESCE(config,'{}'::jsonb), '{hirag,working_dir}', to_jsonb(:wd::text), true
                        )
                        WHERE id=:cid
                        """
                    ),
                    {"cid": collection_id, "wd": working_dir},
                )
                await session.commit()
        try:
            os.makedirs(working_dir, exist_ok=True)
        except Exception:
            pass

        hi = self._init_hirag(working_dir)
        self._collection_hirag_map[collection_id] = hi
        return hi
    
    def _calculate_contribution(self, result: Dict) -> float:
        """计算知识层的贡献度"""
        if not result.get("success"):
            return 0.0
            
        # 简单的贡献度计算
        score = 0.0
        if result.get("answer"):
            score += 0.5
        if result.get("sources"):
            score += len(result["sources"]) * 0.1
        if result.get("entities"):
            score += len(result["entities"]) * 0.05
            
        return min(1.0, score)
    
    def _recommend_retrieval_mode(self, local: Dict, global_: Dict, bridge: Dict) -> str:
        """推荐最佳检索模式"""
        contributions = {
            "hi_local": self._calculate_contribution(local),
            "hi_global": self._calculate_contribution(global_),
            "hi_bridge": self._calculate_contribution(bridge)
        }
        
        # 如果所有层都有贡献，使用完整模式
        if all(c > 0.3 for c in contributions.values()):
            return "hi"
        
        # 否则推荐贡献最大的模式
        return max(contributions, key=contributions.get)
    
    def _identify_knowledge_levels(self, mode: str) -> List[str]:
        """识别检索模式涉及的知识层"""
        level_map = {
            "hi": ["local", "global", "bridge"],
            "naive": ["local"],
            "hi_nobridge": ["local", "global"],
            "hi_local": ["local"],
            "hi_global": ["global"],
            "hi_bridge": ["bridge"]
        }
        return level_map.get(mode, [])


# ============================================================================
# HiRAG Agent - 作为独立的 Agno Agent
# ============================================================================

class HiRAGAgent(Agent):
    """
    HiRAG 智能体 - 专门处理层次化知识检索和问答
    可以作为 Team 成员或独立 Agent 使用
    """
    
    def __init__(
        self,
        model: str = None,
        temperature: float = 0.7,
        working_dir: str = "./hirag_workspace"
    ):
        # 初始化 Agent
        super().__init__(
            name="hirag_agent",
            role="层次化知识检索专家",
            model=model or optimized_config_manager.settings.llm.model,
            temperature=temperature,
            instructions=self._get_instructions()
        )
        
        # 添加 HiRAG 工具集
        self.tools = [HiRAGTools(working_dir)]
        
        # 初始化统计
        self.stats = {
            "queries_processed": 0,
            "indexes_built": 0,
            "cache_hits": 0
        }
        
        logger.info("[HiRAG Agent] 初始化完成")
    
    def _get_instructions(self) -> str:
        """获取 Agent 指令"""
        return """
        你是一个层次化知识检索专家，使用 HiRAG 系统进行智能检索。
        
        你的能力包括：
        1. 构建层次化知识索引（Local、Global、Bridge 三层）
        2. 根据查询特点选择最佳检索策略
        3. 整合多层次知识提供全面答案
        4. 分析知识层次结构和贡献度
        
        检索策略选择原则：
        - 简单事实查询：使用 hi_local 模式
        - 需要概览和总结：使用 hi_global 模式
        - 需要关联分析：使用 hi_bridge 模式
        - 复杂综合问题：使用完整 hi 模式
        
        回答问题时，请：
        1. 首先分析问题类型
        2. 选择合适的检索策略
        3. 整合多层次知识
        4. 提供结构化的答案
        """
    
    async def process_query(
        self,
        query: str,
        collection_id: Optional[int] = None,
        auto_select_mode: bool = True
    ) -> Dict[str, Any]:
        """
        处理查询请求
        
        Args:
            query: 用户查询
            collection_id: 知识库ID
            auto_select_mode: 是否自动选择检索模式
            
        Returns:
            处理结果
        """
        try:
            self.stats["queries_processed"] += 1
            
            # 如果需要，先构建索引
            if collection_id and collection_id not in self.tools[0]._index_cache:
                logger.info(f"[HiRAG Agent] 为知识库 {collection_id} 构建索引")
                await self.tools[0].index_collection_with_hirag(collection_id)
                self.stats["indexes_built"] += 1
            
            # 自动选择检索模式
            if auto_select_mode:
                # 先分析知识层次
                analysis = await self.tools[0].analyze_knowledge_hierarchy(
                    query, collection_id
                )
                mode = analysis.get("recommended_mode", "hi")
                logger.info(f"[HiRAG Agent] 自动选择模式: {mode}")
            else:
                mode = "hi"
            
            # 执行检索
            result = await self.tools[0].hierarchical_search(
                query, mode, collection_id
            )
            
            # 生成回答
            if result.get("success"):
                answer = await self._generate_answer(query, result)
                result["generated_answer"] = answer
            
            return result
            
        except Exception as e:
            logger.error(f"[HiRAG Agent] 处理失败: {e}")
            return {
                "success": False,
                "error": str(e),
                "query": query
            }
    
    async def _generate_answer(self, query: str, search_result: Dict) -> str:
        """基于检索结果生成答案"""
        # 这里可以调用 LLM 生成更好的答案
        # 目前直接返回检索的答案
        return search_result.get("answer", "未找到相关答案")


# ============================================================================
# 在 Team 中集成 HiRAG
# ============================================================================

def create_hirag_enhanced_team(team_name: str = "hirag_enhanced_team") -> Team:
    """
    创建集成了 HiRAG 的增强型 Team
    
    Returns:
        配置好的 Team 实例
    """
    
    # 创建 HiRAG Agent
    hirag_agent = HiRAGAgent()
    
    # 创建其他 Agent（复用现有的）
    from service.advanced_agent_team_service import AdvancedAgentTeamService
    team_service = AdvancedAgentTeamService()
    
    # 获取现有 agents
    decomposition_agent = team_service.create_agent("question_decomposition_agent")
    retrieval_agent = team_service.create_agent("knowledge_retrieval_agent")
    summary_agent = team_service.create_agent("summary_answer_agent")
    
    # 创建 Team
    team = Team(
        name=team_name,
        agents=[
            decomposition_agent,  # 问题分解
            hirag_agent,         # HiRAG 层次化检索（新增）
            retrieval_agent,     # 传统检索（保留）
            summary_agent        # 总结回答
        ],
        instructions="""
        你是一个增强型问答团队，结合了传统检索和 HiRAG 层次化检索。
        
        工作流程：
        1. 问题分解专家分析问题
        2. HiRAG 专家进行层次化检索（获取全局视角）
        3. 检索专家进行精确检索（获取具体细节）
        4. 总结专家整合两种检索结果，生成最终答案
        """
    )
    
    logger.info(f"[HiRAG Integration] 创建增强型 Team: {team_name}")
    return team


# ============================================================================
# 使用示例
# ============================================================================

async def example_usage():
    """使用示例"""
    
    # 1. 作为独立 Agent 使用
    hirag_agent = HiRAGAgent()
    result = await hirag_agent.process_query(
        "地聚物材料的强度影响因素有哪些？",
        collection_id=123
    )
    print("HiRAG Agent 结果:", result)
    
    # 2. 作为 Tool 使用
    hirag_tools = HiRAGTools()
    
    # 构建索引
    await hirag_tools.index_collection_with_hirag(123)
    
    # 执行检索
    search_result = await hirag_tools.hierarchical_search(
        "如何优化地聚物的耐久性？",
        mode="hi"
    )
    print("HiRAG Tools 结果:", search_result)
    
    # 3. 在 Team 中使用
    team = create_hirag_enhanced_team()
    team_result = await team.run("地聚物在海洋环境中的应用前景如何？")
    print("Team 结果:", team_result)


if __name__ == "__main__":
    asyncio.run(example_usage())
