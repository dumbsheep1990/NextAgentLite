"""
智能体服务 V2 - 基于统一模型配置网关的新实现
使用 LLM Config Gateway (端口9050) 获取模型配置
"""
import time
import asyncio
import json
import re
import os
import httpx
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from pathlib import Path

from agno.agent.agent import Agent
from agno.team.team import Team
from agno.tools.reasoning import ReasoningTools
from agno.tools.api import CustomApiTools
from agno.tools.toolkit import Toolkit
from agno.tools import tool

# 条件导入DuckDuckGoTools
try:
    from agno.tools.duckduckgo import DuckDuckGoTools
    _has_duckduckgo = True
except ImportError:
    _has_duckduckgo = False
    DuckDuckGoTools = None

# 导入BaiduSearchTools
try:
    from service.baidu_search_tools import BaiduSearchTools
    _has_baidusearch = True
except ImportError:
    _has_baidusearch = False
    BaiduSearchTools = None
    
from agno.models.openai import OpenAIChat
from agno.models.base import Model

# agno 2.0.2版本的knowledge API有变化，使用新的导入方式
try:
    from agno.knowledge import Knowledge
    _has_knowledge = True
except ImportError:
    _has_knowledge = False
    Knowledge = None

# 导入Agno原生memory功能
try:
    from agno.memory import AgentMemory
    from agno.storage import AgentStorage
    _has_agno_memory = True
except ImportError:
    _has_agno_memory = False
    AgentMemory = None
    AgentStorage = None

# 导入新的统一模型配置客户端
from service.llm_config_gateway_client import (
    get_llm_config_gateway_client,
    get_default_chat_config,
    get_available_chat_models,
    gateway_health_check,
    ModelInfo
)
from service.tools_registry import get_tool_registry
from service.agent_template_service import agent_template_service
from service.datagraph_agno_tools import DataGraphTools
# 引入自定义知识检索工具（复用现有实现）
from service.agent_service import CustomKnowledgeTools
# 导入自定义爬虫工具
from service.custom_crawler_agno_tools import CustomCrawlerTools

# 保留原有的相关导入
from core.logger import logger
from core.config_optimized import optimized_config_manager

@dataclass
class AgentConfigV2:
    """智能体配置V2 - 支持统一模型配置"""
    name: str
    role: str
    instructions: List[str]
    # 新的模型配置方式
    model_id: Optional[str] = None
    model_provider: Optional[str] = None
    # 其他配置保持兼容
    temperature: float = 0.1
    max_tokens: int = 4096
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    show_tool_calls: bool = True
    markdown: bool = True

class AgentServiceV2:
    """智能体服务V2 - 基于统一模型配置网关"""
    
    def __init__(self):
        self.client = None
        self._agents = {}
        self._config_cache = {}
        self._config_cache_time = {}
        self._cache_ttl = 300  # 5分钟缓存
        
        # 降级策略相关
        self._gateway_available = None
        self._last_health_check = 0
        self._health_check_interval = 60  # 60秒检查一次
        
        # 从原有服务导入相关工具配置
        self._initialize_tools()
    
    def _initialize_tools(self):
        """初始化工具相关配置"""
        # 这里可以导入原有的工具配置逻辑
        pass
    
    async def _ensure_client(self):
        """确保客户端连接"""
        if self.client is None:
            self.client = await get_llm_config_gateway_client()
    
    async def _check_gateway_health(self) -> bool:
        """检查网关健康状态（带缓存）"""
        current_time = time.time()
        
        # 如果最近检查过且结果为可用，直接返回
        if (self._gateway_available and 
            current_time - self._last_health_check < self._health_check_interval):
            return True
        
        # 执行健康检查
        is_healthy = await gateway_health_check()
        self._gateway_available = is_healthy
        self._last_health_check = current_time
        
        if not is_healthy:
            logger.error("LLM Config Gateway 不可用且不允许降级")
        
        return is_healthy
    
    async def get_model_config_from_gateway(self, 
                                          agent_name: str, 
                                          prefer_model: Optional[str] = None,
                                          prefer_provider: Optional[str] = None) -> Optional[Tuple[str, str]]:
        """从网关获取模型配置"""
        try:
            await self._ensure_client()
            
            # 检查网关健康状态
            if not await self._check_gateway_health():
                return None
            
            # 如果指定了模型（即使未指定厂商），优先使用该模型
            if prefer_model:
                # 尝试从可用模型中反查厂商
                try:
                    models = await get_available_chat_models()
                    prov = None
                    for m in models:
                        if m.model_id == prefer_model and m.provider_name:
                            prov = m.provider_name
                            break
                    return prefer_model, (prefer_provider or prov or '')
                except Exception:
                    # 回退：仅返回模型ID，厂商留空（对OpenAI兼容接口不影响）
                    return prefer_model, (prefer_provider or '')
            
            # 获取默认配置
            default_config = await get_default_chat_config()
            if default_config:
                model, provider = default_config
                logger.info(f"智能体 {agent_name} 使用网关默认模型: {model} (厂商: {provider})")
                return model, provider
            
            # 如果没有默认配置，获取第一个可用模型
            available_models = await get_available_chat_models()
            if available_models:
                first_model = available_models[0]
                logger.info(f"智能体 {agent_name} 使用网关第一个可用模型: {first_model.model_id} (厂商: {first_model.provider_name})")
                return first_model.model_id, first_model.provider_name
            
            logger.warning(f"智能体 {agent_name} 无法从网关获取任何可用模型")
            return None
            
        except Exception as e:
            logger.error(f"从网关获取模型配置失败: {e}")
            return None
    
    def get_fallback_model_config(self, agent_name: str) -> Tuple[str, str]:
        """已禁用降级：统一走9050，直接抛错。"""
        raise RuntimeError("LLM网关不可用或未返回模型配置（已禁用降级）。请修复9050配置/健康状态。")
    
    async def resolve_model_config(self, 
                                 agent_name: str, 
                                 prefer_model: Optional[str] = None,
                                 prefer_provider: Optional[str] = None) -> Tuple[str, str]:
        """解析模型配置（网关优先，降级支持）"""
        
        # 优先从网关获取
        gateway_config = await self.get_model_config_from_gateway(
            agent_name, prefer_model, prefer_provider
        )
        
        if gateway_config:
            return gateway_config
        
        # 禁用降级
        raise RuntimeError(f"无法从网关解析模型配置（agent={agent_name}）。请检查9050默认模型或可用模型配置。")
    
    async def create_agno_model_v2(self, 
                                 agent_name: str,
                                 model_id: Optional[str] = None,
                                 model_provider: Optional[str] = None,
                                 **kwargs) -> Tuple[Optional[Any], bool]:
        """创建Agno模型实例V2
        返回: (model, native_tools_supported)
        """
        try:
            # 解析模型配置
            resolved_model, resolved_provider = await self.resolve_model_config(
                agent_name, model_id, model_provider
            )
            
            # 统一通过本地网关（9050）走 OpenAI 兼容协议
            # 强制使用 LLM_GATEWAY_URL（默认 http://127.0.0.1:9050），忽略误设的 ONE_API_BASE_URL
            gateway_base = f"{os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050').rstrip('/')}/v1"
            api_key = os.getenv("ONE_API_KEY", "")  # 本地代理通常不需要 key

            # 显式设置网关默认厂商，仍按 display_name 传 model
            try:
                from service.llm_config_gateway_client import get_llm_config_gateway_client
                gw_client = await get_llm_config_gateway_client()
                if resolved_provider:
                    # 同时设置默认厂商与默认模型（display_name），确保网关路由与我们选择一致
                    await gw_client.set_defaults_simple(provider=resolved_provider, default_model=resolved_model)
            except Exception as _e:
                logger.debug(f"设置网关默认厂商失败(忽略): {_e}")

            model = OpenAIChat(
                id=resolved_model,
                api_key=api_key,
                base_url=gateway_base,
                temperature=kwargs.get('temperature', 0.1),
                max_tokens=kwargs.get('max_tokens', 4096),
                top_p=kwargs.get('top_p', 1.0),
                frequency_penalty=kwargs.get('frequency_penalty', 0.0),
                presence_penalty=kwargs.get('presence_penalty', 0.0),
            )

            # 决策：是否使用原生 tools/function-calling
            native_supported = await self._decide_native_tools_support(resolved_model)
            try:
                if hasattr(model, 'supports_native_structured_outputs'):
                    setattr(model, 'supports_native_structured_outputs', bool(native_supported))
                if hasattr(model, 'supports_structured_outputs'):
                    setattr(model, 'supports_structured_outputs', bool(native_supported))
                if not native_supported and hasattr(model, 'supports_json_output'):
                    setattr(model, 'supports_json_output', False)
            except Exception as _e:
                logger.warning(f"设置原生工具能力标志失败: {_e}")

            mode = 'native-tools' if native_supported else 'local-react'
            logger.info(f"智能体 {agent_name} 创建模型实例: {resolved_model} (厂商: {resolved_provider}) via {gateway_base} 模式={mode}")
            return model, native_supported
                
        except Exception as e:
            logger.error(f"创建模型实例失败: {e}")
            return None, False
    
    async def create_agent_v2(self, 
                            agent_name: str, 
                            search_knowledge: bool = True, 
                            session_id: str = None, 
                            search_graph: bool = False, 
                            model_name: str = None,
                            model_provider: str = None,
                            selected_tools: Optional[List[str]] = None) -> Optional[Agent]:
        """创建智能体实例V2"""
        try:
            # 获取智能体配置（优先从网关，降级到原有系统）
            agent_config = await self._get_agent_config_v2(agent_name)
            if not agent_config:
                # 允许无“已命名配置”时以传入的 model_name 构造最小可用配置（用于工作室测试流）
                if model_name:
                    agent_config = AgentConfigV2(
                        name=agent_name or 'studio_agent',
                        role='智能助手',
                        instructions=['你是一个有用的AI助手。'],
                        model_id=model_name,
                        model_provider=model_provider or None,
                        temperature=0.3,
                        max_tokens=2048,
                        top_p=0.9,
                    )
                    logger.warning(f"未找到智能体配置，使用最小配置启动: {agent_name} -> {model_name}")
                else:
                    logger.error(f"未找到智能体配置: {agent_name}")
                    return None
            
            # 创建模型实例
            model, native_tools_supported = await self.create_agno_model_v2(
                agent_name,
                model_name or agent_config.model_id,
                model_provider or agent_config.model_provider,
                temperature=agent_config.temperature,
                max_tokens=agent_config.max_tokens,
                top_p=agent_config.top_p,
                frequency_penalty=agent_config.frequency_penalty,
                presence_penalty=agent_config.presence_penalty
            )
            
            if not model:
                logger.error(f"无法创建模型实例: {agent_name}")
                return None
            
            # 配置工具（保持与原有逻辑兼容）
            tools = await self._configure_agent_tools_v2(agent_name, search_knowledge, search_graph, selected_tools, use_native_tools=native_tools_supported)

            # 构建指令（传递已加载的工具列表，用于动态生成工具说明）
            instructions = self._build_agent_instructions_v2(
                agent_config, search_knowledge, search_graph,
                use_local_react=not native_tools_supported,
                available_tools=tools
            )
            logger.info(f"[Agent] instructions预览 (前500字): {instructions[:500]}")
            logger.info(f"[Agent] instructions预览 (后500字): {instructions[-500:]}")
            
            # 创建智能体
            # 优先使用最小参数集构造，避免不兼容告警
            try:
                agent = Agent(
                    name=agent_config.name,
                    model=model,
                    tools=tools,
                    instructions=instructions,
                    # 关闭内置 reasoning，避免对不支持结构化输出的模型解析失败
                    reasoning=False,
                    markdown=True,
                )
            except TypeError as e:
                # 若极端情况下仍不兼容，尝试包含 role 参数
                logger.warning(f"Agent最小参数构造失败，尝试加入role: {e}")
                agent = Agent(
                    name=agent_config.name,
                    role=agent_config.role,
                    model=model,
                    tools=tools,
                    instructions=instructions,
                    reasoning=False,
                    markdown=True,
                )

            # 可选：在实例化后挂载内存与存储（仅当可用且属性存在）
            try:
                memory, storage = self._configure_agent_memory_v2(session_id)
                if memory is not None and hasattr(agent, 'memory'):
                    setattr(agent, 'memory', memory)
                if storage is not None and hasattr(agent, 'storage'):
                    setattr(agent, 'storage', storage)
            except Exception as e:
                logger.warning(f"挂载内存/存储失败，跳过: {e}")
            
            logger.info(f"成功创建智能体V2: {agent_name}")
            return agent
            
        except Exception as e:
            logger.error(f"创建智能体V2失败: {e}")
            return None
    
    async def _get_agent_config_v2(self, agent_name: str) -> Optional[AgentConfigV2]:
        """获取智能体配置V2（优先网关，降级原有系统）"""
        try:
            # 首先尝试从原有配置系统获取基础配置
            original_config = optimized_config_manager.get_agent_config(agent_name)
            if not original_config:
                # 兼容模板系统：若未在旧配置中找到，尝试从数据库模板获取
                try:
                    tpl_cfg = await agent_template_service.get_agent_config(agent_name)
                except Exception as e:
                    tpl_cfg = None
                if not tpl_cfg:
                    return None
                # 构造成与旧配置相近的对象结构
                class T:
                    pass
                t = T()
                setattr(t, 'name', tpl_cfg.get('name', agent_name))
                setattr(t, 'role', tpl_cfg.get('base_config', {}).get('role', '智能助手'))
                setattr(t, 'instructions', tpl_cfg.get('base_config', {}).get('instructions', ['你是一个有用的AI助手']))
                mc = tpl_cfg.get('model_config', {}) or {}
                setattr(t, 'model_id', mc.get('model_id'))
                setattr(t, 'model_provider', mc.get('model_provider'))
                original_config = t
            
            # 创建V2配置对象
            config_v2 = AgentConfigV2(
                name=getattr(original_config, 'name', agent_name),
                role=getattr(original_config, 'role', '智能助手'),
                instructions=getattr(original_config, 'instructions', ['你是一个有用的AI助手']),
                model_id=getattr(original_config, 'model_id', None),
                model_provider=getattr(original_config, 'model_provider', None),
                temperature=getattr(original_config, 'temperature', 0.1),
                max_tokens=getattr(original_config, 'max_tokens', 4096),
                top_p=getattr(original_config, 'top_p', 1.0),
                frequency_penalty=getattr(original_config, 'frequency_penalty', 0.0),
                presence_penalty=getattr(original_config, 'presence_penalty', 0.0),
                show_tool_calls=getattr(original_config, 'show_tool_calls', True),
                markdown=getattr(original_config, 'markdown', True)
            )
            
            return config_v2
            
        except Exception as e:
            logger.error(f"获取智能体配置V2失败: {e}")
            return None
    
    async def _configure_agent_tools_v2(self,
                                      agent_name: str,
                                      search_knowledge: bool,
                                      search_graph: bool,
                                      selected_tools: Optional[List[str]] = None,
                                      use_native_tools: bool = False) -> List[Any]:
        """配置智能体工具V2

        重要：只有当用户明确选择了工具时才加载工具
        - selected_tools = None 或 [] : 不加载任何内置工具
        - selected_tools = ["builtin:baidusearch"] : 只加载百度搜索
        """
        tools = []
        selected_set = set(selected_tools or [])
        has_tool_selection = selected_tools is not None and len(selected_tools) > 0

        # 基础工具 - 推理工具
        # 仅在用户明确选择时加载
        if use_native_tools and 'builtin:reasoning' in selected_set:
            try:
                tools.append(ReasoningTools())
                logger.info("已添加推理工具 (用户选择)")
            except Exception as e:
                logger.warning(f"添加推理工具失败: {e}")

        # DuckDuckGo搜索工具
        # 仅在用户明确选择时加载
        if _has_duckduckgo and 'builtin:duckduckgo' in selected_set:
            try:
                tools.append(DuckDuckGoTools())
                logger.info("已添加DuckDuckGo搜索工具 (用户选择)")
            except Exception as e:
                logger.warning(f"添加DuckDuckGo搜索工具失败: {e}")

        # 百度搜索工具
        # 仅在用户明确选择时加载
        if _has_baidusearch and 'builtin:baidusearch' in selected_set:
            try:
                tools.append(BaiduSearchTools())
                logger.info("已添加百度搜索工具 (用户选择)")
            except Exception as e:
                logger.warning(f"添加百度搜索工具失败: {e}")
        
        # 知识库/图谱工具
        if search_knowledge or search_graph:
            logger.info(f"智能体 {agent_name} 启用检索工具（知识库: {search_knowledge}, 图谱: {search_graph}）")
            # 知识库检索工具（本地 ReAct 工具链可直接调用 search_knowledge_base）
            try:
                tools.append(CustomKnowledgeTools())
            except Exception as e:
                logger.warning(f"添加CustomKnowledgeTools失败: {e}")
            # 图谱检索工具（DataGraph）
            if search_graph:
                try:
                    tools.append(DataGraphTools())
                except Exception as e:
                    logger.warning(f"添加DataGraph工具失败: {e}")
        
        # 动态注册：MCP 与 API 工具（来自 9050）
        # 注：build_tool_objects 内部会根据 selected 参数过滤工具
        # 如果 selected=None 或 []，不会加载任何动态工具
        if has_tool_selection:
            try:
                reg = await get_tool_registry()
                dynamic_tools = await reg.build_tool_objects(selected=selected_tools)
                if dynamic_tools:
                    tools.extend(dynamic_tools)
                    logger.info(f"已挂载动态工具 {len(dynamic_tools)} 个 (用户选择)")
                else:
                    logger.info("用户选择的工具中没有MCP或API工具")
            except Exception as e:
                logger.warning(f"动态工具注册失败: {e}")
        else:
            logger.info("用户未选择任何工具，跳过动态工具加载")

        # 自定义爬虫工具（从数据库加载）
        # 格式: custom:{tool_id}, 例如 custom:1
        custom_tool_ids = []
        if has_tool_selection:
            for tool_code in selected_set:
                if tool_code.startswith('custom:'):
                    try:
                        tool_id = int(tool_code.split(':', 1)[1])
                        custom_tool_ids.append(tool_id)
                    except (IndexError, ValueError) as e:
                        logger.warning(f"无效的自定义工具代码: {tool_code}, 错误: {e}")

        if custom_tool_ids:
            try:
                custom_crawler_tools = CustomCrawlerTools(selected_tool_ids=custom_tool_ids)
                tools.append(custom_crawler_tools)
                logger.info(f"已加载自定义爬虫工具: {custom_tool_ids}")
            except Exception as e:
                logger.warning(f"加载自定义爬虫工具失败: {e}")

        # 汇总日志
        if tools:
            logger.info(f"智能体 {agent_name} 共加载 {len(tools)} 个工具")
        else:
            logger.info(f"智能体 {agent_name} 未加载任何工具 (纯对话模式)")

        return tools
    
    def _configure_agent_memory_v2(self, session_id: str = None) -> Tuple[Optional[Any], Optional[Any]]:
        """配置智能体内存V2"""
        memory = None
        storage = None
        
        if _has_agno_memory and session_id:
            try:
                # 配置会话级内存
                memory = AgentMemory()
                storage = AgentStorage()
                logger.info(f"启用会话内存: {session_id}")
            except Exception as e:
                logger.warning(f"配置内存失败: {e}")
        
        return memory, storage
    
    def _build_agent_instructions_v2(self,
                                    config: AgentConfigV2,
                                    search_knowledge: bool,
                                    search_graph: bool,
                                    use_local_react: bool = True,
                                    available_tools: Optional[List[Any]] = None) -> str:
        """构建智能体指令V2

        Args:
            config: Agent配置
            search_knowledge: 是否启用知识库检索
            search_graph: 是否启用图谱检索
            use_local_react: 是否使用本地ReAct模式
            available_tools: 可用的工具列表
        """
        instructions = "\n".join(config.instructions)
        instructions += "\n重要：必须使用中文回答所有问题，包括思考过程和最终答案。"

        # 原生 tools 模式下才提示思考工具；本地 ReAct 不提示
        if not use_local_react:
            instructions += "\n[MANDATORY 强制要求] 在回答任何问题时，必须首先使用think工具展示你的思考过程！"
            instructions += "\n你必须先调用think工具进行思考，然后再给出最终答案。这是强制性的，不可跳过！"

        # 添加检索工具指令
        if search_knowledge or search_graph:
            instructions += "\n\n[CRITICAL SYSTEM REQUIREMENT 关键系统要求]"
            instructions += "\n[禁止规则] 绝对禁止在未调用检索工具的情况下直接回答任何专业问题！"
            if search_graph:
                instructions += "\n[DUAL RETRIEVAL 双重检索强制要求] 必须按顺序调用两个检索工具！"
                instructions += "\n1. 第一步：立即调用search_knowledge_base工具获取基础专业资料"
                instructions += "\n2. 第二步：立即调用search_knowledge_graph工具获取概念关系和实体信息"
            else:
                instructions += "\n在回答专业问题时，务必先调用search_knowledge_base工具检索相关资料"

        # 添加可用工具说明
        if available_tools and len(available_tools) > 0:
            # 提取工具名称和描述
            tool_descriptions = []
            for tool in available_tools:
                # 尝试多种方式获取工具信息
                tool_name = None
                tool_desc = None

                # 方式1: 直接从工具对象获取
                if hasattr(tool, 'name'):
                    tool_name = tool.name
                    tool_desc = getattr(tool, 'description', None)

                # 方式2: 检查是否是工具类实例，查找@tool装饰的方法
                if not tool_name:
                    for attr_name in dir(tool):
                        if attr_name.startswith('_'):
                            continue
                        try:
                            attr = getattr(tool, attr_name, None)
                            # @tool装饰的方法有name属性，即使不是callable
                            if hasattr(attr, 'name'):
                                tool_name = attr.name
                                tool_desc = getattr(attr, 'description', None)
                                break
                        except Exception:
                            continue

                # 方式3: 使用类名或函数名
                if not tool_name:
                    tool_name = getattr(tool, '__name__', tool.__class__.__name__)

                # 跳过知识库和图谱工具（已在上面说明）
                if 'knowledge' in tool_name.lower() or 'graph' in tool_name.lower():
                    continue

                if tool_desc:
                    tool_descriptions.append(f"  - {tool_name}: {tool_desc}")
                else:
                    tool_descriptions.append(f"  - {tool_name}")

            if tool_descriptions:
                instructions += "\n\n【可用工具】"
                instructions += "\n你可以根据需要调用以下工具来辅助回答："
                instructions += "\n" + "\n".join(tool_descriptions)

                # 针对搜索工具的特殊说明
                has_search_tool = any('search' in str(t).lower() or 'baidu' in str(t).lower()
                                     or 'duckduckgo' in str(t).lower()
                                     for t in available_tools)
                if has_search_tool:
                    instructions += "\n\n[搜索工具使用规则]"
                    instructions += "\n- 当用户明确要求'搜索'、'检索'、'查询'、'查找最新'时，必须调用搜索工具"
                    instructions += "\n- 当需要查询最新信息、新闻、实时数据时，应该使用搜索工具"
                    instructions += "\n- 如果凭借已有知识可以回答，则无需搜索"
                    instructions += "\n- 搜索后请基于搜索结果回答，并适当引用来源"

        # 本地工具调用规范（不依赖上游模型的原生tools）
        if use_local_react:
            instructions += (
                "\n\n【工具调用规范（本地执行）】"
                "\n- 当需要调用工具时，请严格使用以下格式输出调用意图（不要额外添加说明）："
                "\n  Action: <工具名>"
                "\n  Action Input: <JSON参数>"
                "\n- 系统将执行该工具，并以 Observation 的形式返回结果。你应根据 Observation 继续思考与后续步骤，直至给出最终答案。"
                "\n- 调用示例："
                "\n  Action: baidu_search"
                "\n  Action Input: {\"query\": \"人工智能最新发展\", \"max_results\": 5}"
                "\n  （系统返回）Observation: <搜索结果>"
                "\n  Final Answer: <基于搜索结果的中文回答>"
            )

        return instructions

    async def _decide_native_tools_support(self, model_id: str) -> bool:
        """根据网关 supports_tools 与环境变量决定是否启用原生工具调用。
        优先级：AGNO_ENABLE_NATIVE_TOOLS 显式控制 > 网关返回 supports_tools 标志 > 默认关闭。
        """
        v = os.getenv('AGNO_ENABLE_NATIVE_TOOLS', '').strip().lower()
        if v in ('1', 'true', 'on', 'yes'):
            logger.info("已通过 AGNO_ENABLE_NATIVE_TOOLS 强制开启原生 tools 模式")
            return True
        if v in ('0', 'false', 'off', 'no'):
            logger.info("已通过 AGNO_ENABLE_NATIVE_TOOLS 强制关闭原生 tools 模式")
            return False

        try:
            models = await self.list_available_models_v2()
            for m in models:
                if m.model_id == model_id:
                    st = getattr(m, 'supports_tools', None)
                    if st is True:
                        logger.info(f"[TOOLS] 模型 {model_id} supports_tools=True，启用原生 tools")
                        return True
                    logger.info(f"[TOOLS] 模型 {model_id} supports_tools={st}, 采用本地 ReAct 工具链")
                    return False
        except Exception as e:
            logger.warning(f"探测 supports_tools 失败，使用本地 ReAct 工具链: {e}")
        return False
    
    async def list_available_models_v2(self) -> List[ModelInfo]:
        """获取可用模型列表V2"""
        try:
            await self._ensure_client()
            
            if await self._check_gateway_health():
                models = await get_available_chat_models()
                return models
            else:
                logger.warning("网关不可用，返回降级模型列表")
                # 返回降级模型列表
                return []
        except Exception as e:
            logger.error(f"获取模型列表失败: {e}")
            return []
    
    async def get_model_info_v2(self, model_id: str) -> Optional[ModelInfo]:
        """获取特定模型信息V2"""
        try:
            models = await self.list_available_models_v2()
            for model in models:
                if model.model_id == model_id:
                    return model
            return None
        except Exception as e:
            logger.error(f"获取模型信息失败: {e}")
            return None

# 全局服务实例
_agent_service_v2 = None

async def get_agent_service_v2() -> AgentServiceV2:
    """获取智能体服务V2单例"""
    global _agent_service_v2
    if _agent_service_v2 is None:
        _agent_service_v2 = AgentServiceV2()
    return _agent_service_v2

# 便捷函数
async def create_agent_v2(agent_name: str, **kwargs) -> Optional[Agent]:
    """创建智能体V2便捷函数"""
    service = await get_agent_service_v2()
    return await service.create_agent_v2(agent_name, **kwargs)

async def get_available_models_v2() -> List[ModelInfo]:
    """获取可用模型列表便捷函数"""
    service = await get_agent_service_v2()
    return await service.list_available_models_v2()
