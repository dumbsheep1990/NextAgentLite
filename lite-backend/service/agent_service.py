"""
智能体服务 - 基于Agno框架的多智能体系统
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
from agno.models.openai import OpenAIChat
from agno.models.base import Model
# agno 2.0.2版本的knowledge API有变化，使用新的导入方式
try:
    from agno.knowledge import Knowledge
    _has_knowledge = True
except ImportError:
    _has_knowledge = False
    Knowledge = None
# 如果需要特定的知识库类型，可以从document模块导入
try:
    from agno.knowledge.document import DocumentReader
    _has_document_reader = True
except ImportError:
    _has_document_reader = False
    DocumentReader = None

# 导入Agno原生memory功能
try:
    from agno.memory import AgentMemory
    from agno.storage import AgentStorage
    _has_agno_memory = True
except ImportError:
    _has_agno_memory = False
    AgentMemory = None
    AgentStorage = None

# Conditionally import models that may have missing dependencies
try:
    from agno.models.anthropic import Claude
    _has_claude = True
except ImportError:
    _has_claude = False
    Claude = None

try:
    from agno.models.google import Gemini
    _has_gemini = True
except ImportError:
    _has_gemini = False
    Gemini = None

from core.config_optimized import optimized_config_manager
from core.logger import logger
from service.llm_service import llm_service
from service.knowledge_binding_service import knowledge_binding_service

# 导入延迟优化服务
try:
    from service.latency_optimization_service import latency_optimization_service, LatencyMetrics
    _has_latency_optimization = True
except ImportError:
    _has_latency_optimization = False
    latency_optimization_service = None
    LatencyMetrics = None

# 导入Collection智能体工具
try:
    from service.collection_agent_tools import CollectionAgentTools, register_collection_tools_to_agent
    _has_collection_tools = True
except ImportError:
    _has_collection_tools = False
    CollectionAgentTools = None
    register_collection_tools_to_agent = None


class QwenApiTools(CustomApiTools):
    """基于Agno CustomApiTools的Qwen专用工具"""
    
    def __init__(self, model_id: str, api_key: str, base_url: str, **kwargs):
        # 配置CustomApiTools调用qwen API  
        base_url = base_url or "http://localhost:3000"  # 防止None
        super().__init__(
            base_url=base_url.rstrip('/'),
            api_key=api_key or "",  # 防止None
            headers={
                "Authorization": f"Bearer {api_key or ''}",
                "Content-Type": "application/json"
            }
        )
        self.model_id = model_id
        self.default_params = {
            "max_tokens": kwargs.get("max_tokens", 4096),
            "temperature": kwargs.get("temperature", 0.7),
            "top_p": kwargs.get("top_p", 0.95),
            "presence_penalty": kwargs.get("presence_penalty", 0.0),
            "frequency_penalty": kwargs.get("frequency_penalty", 0.0),
            "response_format": kwargs.get("response_format", {"type": "text"})  # 🔥 使用传入的参数
        }
        logger.info(f"[QWEN_API_TOOLS] 基于CustomApiTools初始化qwen客户端: {model_id}")
        logger.info(f"[QWEN_API_TOOLS] 参数: response_format={self.default_params['response_format']}")
    
    def chat_completion(self, messages: list, **kwargs) -> str:
        """使用CustomApiTools调用qwen chat completion API"""
        try:
            # 合并参数
            params = {**self.default_params, **kwargs}
            
            # 构建请求payload
            payload = {
                "model": self.model_id,
                "messages": messages,
                **params
            }
            
            logger.info(f"[QWEN_API_TOOLS] 调用chat completion，response_format=text")
            
            # 使用CustomApiTools的post方法
            response = self.post("/v1/chat/completions", payload)
            
            # 解析响应
            if isinstance(response, dict) and "choices" in response:
                content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
                logger.info(f"[QWEN_API_TOOLS] 成功获取响应，长度: {len(content)} 字符")
                return content
            else:
                logger.error(f"[QWEN_API_TOOLS] 响应格式异常: {response}")
                return f"API响应格式异常: {response}"
                
        except Exception as e:
            logger.error(f"[QWEN_API_TOOLS] 调用异常: {e}")
            return f"API调用异常: {e}"
    
    async def chat_completion_stream(self, messages: list, **kwargs):
        """使用CustomApiTools调用qwen流式chat completion API"""
        try:
            import httpx
            import json
            
            # 合并参数
            params = {**self.default_params, **kwargs}
            params["stream"] = True  # 流式
            
            # 构建请求payload
            payload = {
                "model": self.model_id,
                "messages": messages,
                **params
            }
            
            logger.info(f"[QWEN_API_TOOLS] 调用流式chat completion，response_format=text")
            
            # 直接使用httpx进行流式请求
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=60.0
                ) as response:
                    response.raise_for_status()
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]  # 移除 "data: " 前缀
                            if data_str.strip() == "[DONE]":
                                break
                            
                            try:
                                chunk_data = json.loads(data_str)
                                if "choices" in chunk_data and len(chunk_data["choices"]) > 0:
                                    delta = chunk_data["choices"][0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
                                
        except Exception as e:
            logger.error(f"[QWEN_API_TOOLS] 流式调用异常: {e}")
            yield f"流式API调用失败: {e}"

class CustomQwenClient:
    """自定义Qwen客户端 - 绕过Agno框架，直接调用qwen API"""
    
    def __init__(self, id: str, api_key: str, base_url: str, max_tokens: int = 4096, temperature: float = 0.7, **kwargs):
        self.model_id = id
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.max_tokens = max_tokens
        self.temperature = temperature
        self._client = None  # 延迟初始化，避免序列化问题
        logger.info(f"[QWEN_CUSTOM] 自定义Qwen客户端初始化: {id}")
    
    @property
    def client(self):
        """延迟初始化httpx客户端"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=120.0)
        return self._client
    
    async def invoke(self, messages, **kwargs):
        """同步调用qwen API"""
        try:
            # 构建请求体
            payload = {
                "model": self.model_id,
                "messages": self._format_messages(messages),
                "max_tokens": kwargs.get('max_tokens', self.max_tokens),
                "temperature": kwargs.get('temperature', self.temperature),
                "stream": False,
                "response_format": {"type": "text"}  # 强制文本格式
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            logger.info(f"[QWEN_CUSTOM] 发送请求: {self.base_url}/v1/chat/completions")
            logger.info(f"[QWEN_CUSTOM] response_format强制设置为text")
            
            response = await self.client.post(
                f"{self.base_url}/v1/chat/completions",
                json=payload,
                headers=headers
            )
            
            if response.status_code != 200:
                logger.error(f"[QWEN_CUSTOM] API调用失败: {response.status_code} {response.text}")
                return f"API调用失败: {response.status_code}"
            
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            logger.info(f"[QWEN_CUSTOM] 成功获取响应，长度: {len(content)} 字符")
            return content
            
        except Exception as e:
            logger.error(f"[QWEN_CUSTOM] 调用异常: {e}")
            return f"调用异常: {e}"
    
    async def invoke_stream(self, messages, **kwargs):
        """流式调用qwen API"""
        try:
            # 构建请求体
            payload = {
                "model": self.model_id,
                "messages": self._format_messages(messages),
                "max_tokens": kwargs.get('max_tokens', self.max_tokens),
                "temperature": kwargs.get('temperature', self.temperature),
                "stream": True,
                "response_format": {"type": "text"}  # 强制文本格式
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            logger.info(f"[QWEN_CUSTOM] 发送流式请求: {self.base_url}/v1/chat/completions")
            logger.info(f"[QWEN_CUSTOM] response_format强制设置为text")
            
            async with self.client.stream(
                "POST",
                f"{self.base_url}/v1/chat/completions",
                json=payload,
                headers=headers
            ) as response:
                if response.status_code != 200:
                    logger.error(f"[QWEN_CUSTOM] 流式API调用失败: {response.status_code}")
                    return
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            content = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
                            
        except Exception as e:
            logger.error(f"[QWEN_CUSTOM] 流式调用异常: {e}")
    
    def _format_messages(self, messages):
        """格式化消息为OpenAI格式"""
        formatted = []
        for msg in messages:
            if hasattr(msg, 'role') and hasattr(msg, 'content'):
                formatted.append({
                    "role": msg.role,
                    "content": str(msg.content)
                })
            elif isinstance(msg, dict):
                formatted.append({
                    "role": msg.get("role", "user"),
                    "content": str(msg.get("content", ""))
                })
            else:
                formatted.append({
                    "role": "user",
                    "content": str(msg)
                })
        return formatted
    
    def __getstate__(self):
        """支持pickle序列化"""
        state = self.__dict__.copy()
        # 移除不可序列化的httpx客户端
        state['_client'] = None
        return state
    
    def __setstate__(self, state):
        """支持pickle反序列化"""
        self.__dict__.update(state)
        self._client = None  # 重置客户端，将延迟初始化
    
    async def close(self):
        """清理资源"""
        if self._client:
            await self._client.aclose()
            self._client = None

class RoleMappedOpenAIChat(OpenAIChat):
    """OpenAI Chat模型的角色映射包装器 - 修复Agno框架的developer角色问题"""
    
    def __init__(self, *args, **kwargs):
        # 统一处理所有模型
        self._response_format = kwargs.pop('response_format', None)
        super().__init__(*args, **kwargs)
    
    def _map_message_role(self, role: str) -> str:
        """映射Agno特殊角色到OpenAI标准角色"""
        role_mapping = {
            'developer': 'system',
            'coordinator': 'system',
            'analyst': 'system',
            'researcher': 'system'
        }
        return role_mapping.get(role, role)
    
    def _process_messages(self, messages):
        """处理和映射消息角色"""
        processed_messages = []
        
        logger.info(f"原始消息: {[(getattr(msg, 'role', 'no_role'), type(msg).__name__) if hasattr(msg, 'role') else (msg.get('role', 'no_role'), 'dict') if isinstance(msg, dict) else ('unknown', type(msg).__name__) for msg in messages]}")
        
        for msg in messages:
            if isinstance(msg, dict):
                # 字典形式的消息
                role = msg.get('role', 'user')
                mapped_role = self._map_message_role(role)
                
                # 🔥 修复kimi-k2模型的消息格式问题
                content = msg.get('content', '')
                if content is not None:
                    # 确保content是有效的字符串
                    if not isinstance(content, str):
                        content = str(content)
                    
                    # 清理可能导致问题的字符
                    content = self._clean_message_content(content)
                
                processed_msg = {
                    **msg, 
                    'role': mapped_role,
                    'content': content
                }
                processed_messages.append(processed_msg)
                logger.debug(f"Dict消息映射: {role} -> {mapped_role}")
            elif hasattr(msg, 'role'):
                # 对象形式的消息
                original_role = msg.role
                mapped_role = self._map_message_role(original_role)
                
                # 获取并清理content
                content = getattr(msg, 'content', str(msg))
                if content is not None:
                    if not isinstance(content, str):
                        content = str(content)
                    content = self._clean_message_content(content)
                
                # 直接修改对象的role属性
                try:
                    msg.role = mapped_role
                    if hasattr(msg, 'content'):
                        msg.content = content
                    processed_messages.append(msg)
                    logger.debug(f"对象消息映射: {original_role} -> {mapped_role}")
                except AttributeError:
                    # 如果不能修改，创建字典
                    processed_msg = {
                        'role': mapped_role,
                        'content': content
                    }
                    processed_messages.append(processed_msg)
                    logger.debug(f"不可变对象转字典: {original_role} -> {mapped_role}")
            else:
                processed_messages.append(msg)
                logger.debug(f"未知消息类型: {type(msg)}")
                
        logger.info(f"处理后消息: {[(getattr(msg, 'role', 'no_role'), type(msg).__name__) if hasattr(msg, 'role') else (msg.get('role', 'no_role'), 'dict') if isinstance(msg, dict) else ('unknown', type(msg).__name__) for msg in processed_messages]}")
        return processed_messages
    
    def invoke(self, messages, **kwargs):
        """统一invoke方法"""
        if self._response_format:
            kwargs['response_format'] = self._response_format
        
        return super().invoke(messages, **kwargs)
    
    def invoke_stream(self, messages, **kwargs):
        """统一invoke_stream方法"""
        if self._response_format:
            kwargs['response_format'] = self._response_format
        
        return super().invoke_stream(messages, **kwargs)
    
    def _clean_message_content(self, content: str) -> str:
        """清理消息内容，确保kimi-k2模型兼容性"""
        if not isinstance(content, str):
            return str(content)
        
        # 移除控制字符（除了换行符和制表符）
        import re
        content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', content)
        
        # 规范化换行符
        content = content.replace('\r\n', '\n').replace('\r', '\n')
        
        # 移除过多的连续换行符
        content = re.sub(r'\n{3,}', '\n\n', content)
        
        # 移除首尾空白字符
        content = content.strip()
        
        # 确保内容不为空
        if not content:
            content = " "
        
        # 🔥 针对kimi-k2模型的特殊处理
        # 检查模型ID是否包含kimi-k2
        model_id = getattr(self, 'id', '')
        if 'kimi-k2' in str(model_id).lower():
            # 进一步清理可能导致问题的字符
            content = re.sub(r'[^\w\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef.,!?;:()\[\]{}\'"`~@#$%^&*+=|\\/<>]', '', content)
            
            # 确保没有过长的行
            lines = content.split('\n')
            cleaned_lines = []
            for line in lines:
                if len(line) > 1000:  # 限制单行长度
                    line = line[:1000] + "..."
                cleaned_lines.append(line)
            content = '\n'.join(cleaned_lines)
            
            # 限制总长度
            if len(content) > 32000:  # kimi-k2的上下文限制
                content = content[:32000] + "..."
        
        return content
    
    def _deep_clean_messages(self, messages):
        """深度清理消息，用于kimi-k2模型的错误恢复"""
        cleaned_messages = []
        
        for msg in messages:
            if isinstance(msg, dict):
                # 深度清理字典消息
                cleaned_msg = {
                    'role': msg.get('role', 'user'),
                    'content': self._deep_clean_content(msg.get('content', ''))
                }
                cleaned_messages.append(cleaned_msg)
            elif hasattr(msg, 'role'):
                # 深度清理对象消息
                try:
                    msg.role = msg.role
                    if hasattr(msg, 'content'):
                        msg.content = self._deep_clean_content(msg.content)
                    cleaned_messages.append(msg)
                except AttributeError:
                    # 创建新的字典
                    cleaned_msg = {
                        'role': getattr(msg, 'role', 'user'),
                        'content': self._deep_clean_content(getattr(msg, 'content', str(msg)))
                    }
                    cleaned_messages.append(cleaned_msg)
            else:
                cleaned_messages.append(msg)
        
        return cleaned_messages
    
    def _deep_clean_content(self, content):
        """深度清理内容，移除所有可能导致问题的字符"""
        if not isinstance(content, str):
            content = str(content)
        
        import re
        
        # 移除所有控制字符
        content = re.sub(r'[\x00-\x1F\x7F]', '', content)
        
        # 移除特殊Unicode字符
        content = re.sub(r'[\uFFFD\uFFFE\uFFFF]', '', content)
        
        # 只保留基本的中文、英文、数字和常用标点
        content = re.sub(r'[^\w\s\u4e00-\u9fff.,!?;:()\[\]{}\'"`~@#$%^&*+=|\\/<>-]', '', content)
        
        # 规范化空白字符
        content = re.sub(r'\s+', ' ', content)
        
        # 移除首尾空白
        content = content.strip()
        
        # 确保不为空
        if not content:
            content = " "
        
        # 限制长度
        if len(content) > 16000:  # 更保守的长度限制
            content = content[:16000] + "..."
        
        return content
    
    async def ainvoke(self, messages, **kwargs):
        """重写异步调用方法以映射角色"""
        processed_messages = self._process_messages(messages)
        logger.info(f"映射消息角色: {[msg.get('role') if isinstance(msg, dict) else getattr(msg, 'role', 'unknown') for msg in processed_messages]}")
        
        # 🔥 针对kimi-k2模型的特殊错误处理
        model_id = getattr(self, 'id', '')
        if 'kimi-k2' in str(model_id).lower():
            try:
                return await super().ainvoke(processed_messages, **kwargs)
            except Exception as e:
                if "Input should be a valid string" in str(e):
                    logger.warning(f"kimi-k2模型输入格式错误，尝试清理后重试: {e}")
                    # 进一步清理消息内容
                    cleaned_messages = self._deep_clean_messages(processed_messages)
                    try:
                        return await super().ainvoke(cleaned_messages, **kwargs)
                    except Exception as e2:
                        logger.error(f"kimi-k2模型重试失败: {e2}")
                        # 抛出原始错误，让上层处理
                        raise e
                else:
                    raise e
        else:
            # 其他模型正常处理
            return await super().ainvoke(processed_messages, **kwargs)
    
    def invoke(self, messages, **kwargs):
        """重写同步调用方法以映射角色"""
        processed_messages = self._process_messages(messages)
        logger.info(f"映射消息角色: {[msg.get('role') if isinstance(msg, dict) else getattr(msg, 'role', 'unknown') for msg in processed_messages]}")
        
        # 🔥 针对kimi-k2模型的特殊错误处理
        model_id = getattr(self, 'id', '')
        if 'kimi-k2' in str(model_id).lower():
            try:
                return super().invoke(processed_messages, **kwargs)
            except Exception as e:
                if "Input should be a valid string" in str(e):
                    logger.warning(f"kimi-k2模型输入格式错误，尝试清理后重试: {e}")
                    # 进一步清理消息内容
                    cleaned_messages = self._deep_clean_messages(processed_messages)
                    try:
                        return super().invoke(cleaned_messages, **kwargs)
                    except Exception as e2:
                        logger.error(f"kimi-k2模型重试失败: {e2}")
                        # 抛出原始错误，让上层处理
                        raise e
                else:
                    raise e
        else:
            # 其他模型正常处理
            return super().invoke(processed_messages, **kwargs)
    
    async def ainvoke_stream(self, messages, **kwargs):
        """重写异步流式调用方法以映射角色"""
        processed_messages = self._process_messages(messages)
        logger.info(f"流式映射消息角色: {[msg.get('role') if isinstance(msg, dict) else getattr(msg, 'role', 'unknown') for msg in processed_messages]}")
        
        # 🔥 针对kimi-k2模型的特殊错误处理
        model_id = getattr(self, 'id', '')
        if 'kimi-k2' in str(model_id).lower():
            try:
                # 创建异步生成器来包装父类的流式响应
                async for chunk in super().ainvoke_stream(processed_messages, **kwargs):
                    yield chunk
            except Exception as e:
                if "Input should be a valid string" in str(e):
                    logger.warning(f"kimi-k2模型输入格式错误，尝试清理后重试: {e}")
                    # 进一步清理消息内容
                    cleaned_messages = self._deep_clean_messages(processed_messages)
                    try:
                        async for chunk in super().ainvoke_stream(cleaned_messages, **kwargs):
                            yield chunk
                    except Exception as e2:
                        logger.error(f"kimi-k2模型重试失败: {e2}")
                        # 抛出原始错误，让上层处理
                        raise e
                else:
                    raise e
        else:
            # 其他模型正常处理
            async for chunk in super().ainvoke_stream(processed_messages, **kwargs):
                yield chunk
    
    def invoke_stream(self, messages, **kwargs):
        """重写同步流式调用方法以映射角色"""
        processed_messages = self._process_messages(messages)
        logger.info(f"流式映射消息角色: {[msg.get('role') if isinstance(msg, dict) else getattr(msg, 'role', 'unknown') for msg in processed_messages]}")
        
        # 🔥 添加LLM调用前的调试日志
        logger.info(f"[LLM_CALL] 开始调用super().invoke_stream()，消息数量: {len(processed_messages)}")
        
        try:
            result = super().invoke_stream(processed_messages, **kwargs)
            logger.info(f"[LLM_CALL] super().invoke_stream()调用成功，返回类型: {type(result)}")
            return result
        except Exception as llm_error:
            logger.error(f"[LLM_CALL_ERROR] super().invoke_stream()调用失败: {llm_error}")
            import traceback
            logger.error(f"[LLM_CALL_ERROR] 详细错误堆栈: {traceback.format_exc()}")
            raise llm_error
    
    async def aresponse(self, messages, **kwargs):
        """重写异步响应方法以映射角色"""
        processed_messages = self._process_messages(messages)
        logger.info(f"响应映射消息角色: {[msg.get('role') if isinstance(msg, dict) else getattr(msg, 'role', 'unknown') for msg in processed_messages]}")
        return await super().aresponse(processed_messages, **kwargs)
    
    def response(self, messages, **kwargs):
        """重写同步响应方法以映射角色"""
        processed_messages = self._process_messages(messages)
        logger.info(f"响应映射消息角色: {[msg.get('role') if isinstance(msg, dict) else getattr(msg, 'role', 'unknown') for msg in processed_messages]}")
        return super().response(processed_messages, **kwargs)
    
    def _format_message(self, message):
        """重写格式化消息方法 - 修复Agno框架hardcoded的developer角色转换"""
        # 首先调用父类的格式化方法
        formatted_msg = super()._format_message(message)
        
        # 检查并修复developer角色转换问题
        if isinstance(formatted_msg, dict) and formatted_msg.get('role') == 'developer':
            formatted_msg['role'] = 'system'
            logger.debug(f"修复Agno框架developer角色: developer -> system")
        
        return formatted_msg


@dataclass
class AgentResponse:
    """智能体响应数据结构"""
    content: str
    agent_name: str
    model_used: str
    confidence_score: Optional[float] = None
    processing_time: Optional[float] = None
    sources: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None
    knowledge_sources: Optional[List[Dict[str, Any]]] = None  # 知识库检索结果
    knowledge_stats: Optional[Dict[str, Any]] = None  # 知识库统计信息
    graph_sources: Optional[Dict[str, Any]] = None  # 知识图谱检索结果


# 全局存储搜索结果，供工具函数和前端访问
_global_search_results = []

def rrf_fusion(ranked_lists: List[List[Dict]], k: int = 60, min_score_threshold: float = 0.3) -> List[Dict]:
    """
    RRF (Reciprocal Rank Fusion) 倒排融合算法
    
    Args:
        ranked_lists: 多个排序后的结果列表
        k: RRF参数，用于计算倒排分数 (通常设置为60)
        min_score_threshold: 最低相关度阈值，过滤低质量结果
    
    Returns:
        融合后的排序结果列表
    """
    logger.info(f"[RRF] 开始融合 {len(ranked_lists)} 个排序列表")
    
    # 首先过滤低质量结果
    filtered_lists = []
    for i, rank_list in enumerate(ranked_lists):
        # 过滤掉相关度过低的结果
        filtered_list = [doc for doc in rank_list if doc.get('score', 0) >= min_score_threshold]
        filtered_lists.append(filtered_list)
        logger.info(f"[RRF] 列表 {i}: 原始 {len(rank_list)} 个，过滤后 {len(filtered_list)} 个 (阈值: {min_score_threshold})")
    
    # 收集所有唯一的文档
    all_docs = {}
    
    for list_idx, rank_list in enumerate(filtered_lists):
        for rank, doc in enumerate(rank_list, 1):
            # 使用更可靠的文档唯一标识符
            doc_id = doc.get('id')
            if not doc_id:
                # 如果没有ID，使用内容哈希
                import hashlib
                content_hash = hashlib.md5((doc.get('title', '') + doc.get('content', '')[:100]).encode()).hexdigest()
                doc_id = f"hash_{content_hash}"
            
            if doc_id not in all_docs:
                all_docs[doc_id] = {
                    **doc,
                    'rrf_score': 0,
                    'source_ranks': [],
                    'original_score': doc.get('score', 0)  # 保存原始分数
                }
            
            # 计算RRF分数: 1 / (k + rank)
            rrf_score = 1.0 / (k + rank)
            all_docs[doc_id]['rrf_score'] += rrf_score
            all_docs[doc_id]['source_ranks'].append(f"List{list_idx}_Rank{rank}")
            
            logger.debug(f"[RRF] 文档 {doc_id[:20]}... 获得RRF分数: {rrf_score:.4f} (排名: {rank})")
    
    # 按RRF分数排序
    sorted_docs = sorted(all_docs.values(), key=lambda x: x['rrf_score'], reverse=True)
    
    # 更新最终分数为RRF分数，但保留原始分数用于显示
    for doc in sorted_docs:
        doc['score'] = doc['rrf_score']
        # 添加调试信息
        logger.debug(f"[RRF] 最终结果: {doc.get('title', 'No Title')[:30]}... RRF:{doc['rrf_score']:.4f} 原始:{doc['original_score']:.3f}")
    
    logger.info(f"[RRF] 融合完成，返回 {len(sorted_docs)} 个结果")
    return sorted_docs

@tool(show_result=True)
def search_knowledge_base(query: str, top_k: int = 10) -> str:
    """
    检索知识库 - 混合检索文档和QA数据集
    
    Args:
        query: 搜索查询字符串，例如"材料性能分析"
        top_k: 返回结果数量，默认10个
        
    Returns:
        str: 格式化的搜索结果，包含文档和QA数据集信息
    """
    global _global_search_results
    try:
        import asyncio
        logger.info(f"[KNOWLEDGE_SEARCH] 🔍 独立工具函数开始检索: {query}")
        
        # 导入服务
        from service.knowledge_service import knowledge_service
        from service.embedding_service import embedding_service
        from service.intelligent_retrieval_service import intelligent_retrieval_service
        from db.database import get_elasticsearch_client
        
        def run_async_safely(coro):
            """安全地运行异步函数，避免事件循环冲突"""
            try:
                # 检查是否已在事件循环中
                try:
                    loop = asyncio.get_running_loop()
                    logger.warning("[KNOWLEDGE_SEARCH] 检测到运行中的事件循环，使用线程执行")
                    
                    # 使用线程池避免事件循环冲突
                    import concurrent.futures
                    import threading
                    
                    def thread_runner():
                        """线程中的异步执行器"""
                        # 为当前线程创建新的事件循环
                        new_loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(new_loop)
                        
                        try:
                            # 设置超时避免长时间阻塞
                            return new_loop.run_until_complete(
                                asyncio.wait_for(coro, timeout=30.0)
                            )
                        except asyncio.TimeoutError:
                            logger.error("[KNOWLEDGE_SEARCH] 检索操作超时")
                            return None
                        except Exception as e:
                            logger.error(f"[KNOWLEDGE_SEARCH] 检索异常: {e}")
                            return None
                        finally:
                            # 安全关闭事件循环
                            try:
                                # 取消所有待处理任务
                                pending = asyncio.all_tasks(new_loop)
                                for task in pending:
                                    task.cancel()
                                
                                if pending:
                                    new_loop.run_until_complete(
                                        asyncio.gather(*pending, return_exceptions=True)
                                    )
                            except Exception:
                                pass
                            finally:
                                new_loop.close()
                    
                    # 在专用线程中执行
                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                        future = executor.submit(thread_runner)
                        return future.result(timeout=35.0)
                        
                except RuntimeError:
                    # 没有运行的事件循环，直接执行
                    logger.info("[KNOWLEDGE_SEARCH] 无事件循环，直接执行异步操作")
                    return asyncio.run(coro)
                    
            except Exception as e:
                logger.error(f"[KNOWLEDGE_SEARCH] 异步执行失败: {e}")
                return None
        
        # 1. 文档检索 - 使用智能检索服务支持翻译
        doc_results = []
        try:
            logger.info(f"[KNOWLEDGE_SEARCH] 开始智能文档检索: query='{query}', top_k={top_k//2}")
            
            # 使用智能检索服务
            def run_intelligent_search():
                """使用智能检索服务"""
                import asyncio
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    return loop.run_until_complete(intelligent_retrieval_service.intelligent_search(
                        query=query,
                        top_k=top_k//2,  # 一半用于文档检索
                        enable_reranking=True,
                        original_query=query,  # 中文原始查询
                        translated_query=None  # 让intelligent_retrieval_service自动翻译
                    ))
                finally:
                    loop.close()
            
            # 在线程中执行避免事件循环冲突
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(run_intelligent_search)
                intelligent_result = future.result(timeout=30)
            
            # 转换intelligent_retrieval_service结果为标准格式
            if intelligent_result and intelligent_result.results:
                for result in intelligent_result.results:
                    # 🔥 修复：保留所有类型的结果，包括文档和QA数据
                    metadata = result.get('metadata', {})
                    # 判断是否为QA数据
                    is_qa_data = 'qa_dataset' in metadata.get('type', '')
                    
                    doc_results.append({
                        "id": result.get("id", ""),
                        "title": result.get("title", "QA问答" if is_qa_data else "文档片段"),
                        "content": result.get("content", ""),
                        "score": result.get("score", 0.0),
                        "source_type": "qa_dataset" if is_qa_data else "document",
                        "metadata": metadata,
                        "highlights": result.get("highlights", [])
                    })
            
            logger.info(f"[KNOWLEDGE_SEARCH] 智能文档检索完成: 返回 {len(doc_results)} 个结果")
            
        except Exception as e:
            logger.error(f"[KNOWLEDGE_SEARCH] 智能文档检索失败: {e}")
            doc_results = []
        
        # 2. 额外的QA数据集检索（补充intelligent_retrieval_service可能遗漏的QA数据）
        qa_results = []
        try:
            # 生成查询向量
            embedding_response = run_async_safely(embedding_service.create_embeddings(
                model_path="alibaba/text-embedding-v4", texts=[query]
            ))
            if embedding_response and embedding_response.embeddings:
                query_vector = embedding_response.embeddings[0]
                es_client = get_elasticsearch_client()
                
                search_body = {
                    "size": top_k//2,
                    "query": {
                        "script_score": {
                            "query": {"match_all": {}},
                            "script": {
                                "source": "cosineSimilarity(params.query_vector, 'question_vector_general') + 1.0",
                                "params": {"query_vector": query_vector}
                            }
                        }
                    },
                    "_source": ["question", "answer", "category", "dataset_id", "qa_pair_id"]
                }
                
                response = run_async_safely(es_client.search(
                    index="mat_qa_pairs_vectors",
                    body=search_body
                ))
                
                if response and 'hits' in response:
                    hits = response['hits']['hits']
                    logger.info(f"[KNOWLEDGE_SEARCH] 额外QA检索原始结果: {len(hits)} 个")
                    
                    for hit in hits:
                        raw_score = hit["_score"]
                        # 🔥 修复：直接进行归一化处理，确保分数在0-1范围内
                        score = max(0.0, min(1.0, raw_score - 1.0))  # 转换为0-1范围并归一化
                        source = hit["_source"]
                        
                        logger.info(f"  额外QA: {source.get('question', 'No Question')[:30]}... 原始分: {raw_score:.3f} -> 归一化: {score:.3f}")
                        
                        # 降低阈值，确保能找到相关QA对
                        if score >= 0.05:  # 进一步降低到0.05，确保更多QA数据能被返回
                            # 使用已归一化的分数
                            final_score = score
                            
                            qa_results.append({
                                "id": source.get("qa_pair_id", ""),
                                "title": source.get("question", ""),
                                "content": source.get("answer", ""),
                                "question": source.get("question", ""),
                                "answer": source.get("answer", ""),
                                "score": final_score,
                                "source_type": "qa_dataset",
                                "category": source.get("category", ""),
                                "dataset_id": source.get("dataset_id", ""),
                                "raw_score": raw_score  # 保留原始分数供调试
                            })
                            
                logger.info(f"[KNOWLEDGE_SEARCH] 额外QA pairs检索: 找到 {len(qa_results)} 个结果")
        except Exception as e:
            logger.warning(f"额外QA检索失败: {e}")
        
        # 3. 合并结果
        combined_results = []
        
        # 🔥 修复：安全检查，避免NoneType迭代错误
        if doc_results is None:
            doc_results = []
        if qa_results is None:
            qa_results = []
        
        # 添加智能检索结果（已包含文档和QA数据）
        for result in doc_results:
            source_type = result.get("source_type", "document")
            
            if source_type == "qa_dataset":
                # 处理QA数据格式 - 从多个位置尝试提取question和answer
                logger.info(f"[QA_DEBUG] 处理QA数据: {result}")
                
                source_info = result.get("source_info", {})
                metadata = result.get("metadata", {})
                
                # 🔥 修复：优先从顶层获取question和answer
                question = (
                    result.get("question", "") or 
                    source_info.get("question", "") or
                    metadata.get("question", "")
                )
                answer = (
                    result.get("answer", "") or 
                    source_info.get("answer", "") or
                    metadata.get("answer", "")
                )
                
                logger.info(f"[QA_DEBUG] 提取的question: '{question}', answer: '{answer[:50]}...'")
                
                combined_results.append({
                    "id": result.get("id", ""),
                    "content": result.get("content", f"问题: {question}\n答案: {answer}"),
                    "title": result.get("title", f"QA: {question[:50]}..."),
                    "score": result.get("score", 0.0),
                    "source_type": "qa_dataset",
                    "source": "intelligent_retrieval",
                    "metadata": result.get("metadata", {}),
                    "highlights": result.get("highlights", []),
                    "question": question,
                    "answer": answer
                })
            else:
                # 处理文档数据格式
                combined_results.append({
                    "id": result.get("id", ""),
                    "content": result.get("content", ""),
                    "title": result.get("title", "文档片段"),
                    "score": result.get("score", 0.0),
                    "source_type": "document",
                    "source": "intelligent_retrieval",
                    "metadata": result.get("metadata", {}),
                    "highlights": result.get("highlights", [])
                })
        
        # 添加额外的QA检索结果（防止重复）
        for result in qa_results:
            question = result.get("question", "")
            answer = result.get("answer", "")
            logger.info(f"[QA_DEBUG] 额外QA结果 - question: '{question}', answer: '{answer[:50]}...'")
            
            combined_results.append({
                "id": result.get("id", ""),
                "content": f"问题: {question}\n答案: {answer}",
                "title": f"QA: {question[:50]}..." if question else "QA数据",
                "score": result.get("score", 0.0),
                "source_type": "qa_dataset",
                "source": "qa_elasticsearch",
                "metadata": result.get("metadata", {}),
                "question": question,
                "answer": answer
            })
        
        # 详细记录检索结果
        doc_count = len([r for r in doc_results if r.get("source_type") == "document"])
        qa_count_from_intelligent = len([r for r in doc_results if r.get("source_type") == "qa_dataset"])
        qa_count_from_es = len(qa_results)
        
        logger.info(f"[KNOWLEDGE_SEARCH] 智能检索结果: {len(doc_results)} 个 (文档: {doc_count}, QA: {qa_count_from_intelligent})")
        for i, result in enumerate(doc_results[:3], 1):
            logger.info(f"  智能检索 {i}: {result.get('title', 'No Title')[:50]}... 分数: {result.get('score', 0):.3f} 类型: {result.get('source_type', 'unknown')}")
        
        logger.info(f"[KNOWLEDGE_SEARCH] 额外QA检索: {qa_count_from_es} 个结果")
        for i, result in enumerate(qa_results[:3], 1):
            logger.info(f"  额外QA {i}: {result.get('question', 'No Question')[:50]}... 分数: {result.get('score', 0):.3f}")
        
        # 使用已经构建好的combined_results，不要重复覆盖
        # combined_results = doc_results + qa_results  # 这行会覆盖之前精心构建的结果
        
        # 去重处理 - 基于ID和内容相似度
        unique_results = []
        seen_ids = set()
        seen_content = set()
        
        for result in combined_results:
            # 使用ID作为主要去重标识
            result_id = result.get('id', '')
            content_key = (result.get('title', '') + result.get('content', ''))[:100].strip()
            
            # 如果有ID，优先用ID去重
            if result_id and result_id not in seen_ids:
                seen_ids.add(result_id)
                unique_results.append(result)
                logger.info(f"[KNOWLEDGE_SEARCH] 去重: 保留ID={result_id} 的结果")
            # 如果没有ID，用内容去重
            elif not result_id and content_key and content_key not in seen_content:
                seen_content.add(content_key)
                unique_results.append(result)
                logger.info(f"[KNOWLEDGE_SEARCH] 去重: 保留内容={content_key[:30]}... 的结果")
            else:
                logger.info(f"[KNOWLEDGE_SEARCH] 去重: 跳过重复内容 ID={result_id} 标题={result.get('title', 'No Title')[:30]}...")
        
        logger.info(f"[KNOWLEDGE_SEARCH] 去重后结果: {len(unique_results)} 个")
        
        # 过滤低质量结果（降低阈值到0.01，确保更多数据能通过）
        filtered_results = [result for result in unique_results if result.get("score", 0) >= 0.01]
        logger.info(f"[KNOWLEDGE_SEARCH] 高质量过滤后: {len(filtered_results)} 个 (阈值: 0.01)")
        
        # 如果过滤后没有结果，但有原始结果，则强制返回最好的几个
        if not filtered_results and unique_results:
            logger.info(f"[KNOWLEDGE_SEARCH] 过滤后无结果，强制返回最好的3-5个结果")
            unique_results.sort(key=lambda x: x.get("score", 0), reverse=True)
            filtered_results = unique_results[:5]  # 至少返回前5个结果
        
        # 按分数排序
        filtered_results.sort(key=lambda x: x.get("score", 0), reverse=True)
        
        # 🔥 标记前5个高分结果为"被采用"
        adopted_count = min(5, len(filtered_results))
        for i, result in enumerate(filtered_results):
            result["adopted"] = i < adopted_count
        
        # 返回所有结果，但标记了哪些被采用
        final_results = filtered_results
        
        # 统计最终结果类型分布
        final_doc_count = len([r for r in final_results if r.get("source_type") == "document"])
        final_qa_count = len([r for r in final_results if r.get("source_type") == "qa_dataset"])
        adopted_doc_count = len([r for r in final_results if r.get("source_type") == "document" and r.get("adopted")])
        adopted_qa_count = len([r for r in final_results if r.get("source_type") == "qa_dataset" and r.get("adopted")])
        
        logger.info(f"[KNOWLEDGE_SEARCH] 最终返回结果: (文档: {final_doc_count}, QA: {final_qa_count}) 采用: (文档: {adopted_doc_count}, QA: {adopted_qa_count})")
        for i, result in enumerate(final_results, 1):
            title = result.get('title', result.get('question', 'No Title'))
            adopted_status = "✅ 采用" if result.get("adopted") else "📖 展示"
            logger.info(f"  {i}. {title[:50]}... 分数: {result.get('score', 0):.3f} 类型: {result.get('source_type', 'unknown')} {adopted_status}")
        
        # 临时注释RRF，先确保基础检索质量
        # 如果需要RRF，可以这样使用：
        # if len(doc_results) > 0 and len(qa_results) > 0:
        #     ranked_lists = [doc_results, qa_results]
        #     final_results = rrf_fusion(ranked_lists, k=60, min_score_threshold=0.4)[:3]
        # else:
        #     combined_results = doc_results + qa_results
        #     combined_results.sort(key=lambda x: x.get("score", 0), reverse=True)
        #     final_results = combined_results[:3]
        
        # 存储到全局变量
        global _global_search_results
        _global_search_results = final_results
        logger.info(f"[KNOWLEDGE_SEARCH] 更新全局检索结果: {len(_global_search_results)} 个")
        
        # 详细统计最终结果
        final_doc_results = [r for r in final_results if r.get("source_type") == "document"]
        final_qa_results = [r for r in final_results if r.get("source_type") == "qa_dataset"]
        
        logger.info(f"[KNOWLEDGE_SEARCH] ✅ 独立工具函数检索完成:")
        logger.info(f"  原始检索: 文档 {len([r for r in doc_results if r.get('source_type', 'document') == 'document'])} 个, QA {len([r for r in doc_results if r.get('source_type', 'document') == 'qa_dataset'])} 个")
        logger.info(f"  额外QA检索: {len(qa_results)} 个")
        logger.info(f"  最终返回: 文档 {len(final_doc_results)} 个, QA {len(final_qa_results)} 个")
        
        # 🔥 修复：返回具体检索内容给模型进行推理，但在流式输出中过滤掉
        if not final_results:
            return "未找到相关资料。"
        
        # 构建给模型的检索内容摘要 - 供模型推理使用
        content_for_model = "以下是检索到的相关资料：\n\n"
        
        for i, result in enumerate(final_results[:5], 1):  # 只给模型前5个结果
            title = result.get("title", "未知标题")
            content = result.get("content", "")
            source_type = result.get("source_type", "unknown")
            
            # 🔥 修复：对于QA类型，确保内容包含问题和答案
            if source_type == "qa_dataset":
                question = result.get("question", "")
                answer = result.get("answer", "")
                
                # 如果content为空或格式不正确，重新构建
                if not content.strip() or (question and answer and ("问题:" not in content or "答案:" not in content)):
                    content = f"问题: {question}\n答案: {answer}"
                    logger.info(f"[FINAL_FORMAT_FIX] 重新构建最终content: 问题长度={len(question)}, 答案长度={len(answer)}")
            
            logger.info(f"[FINAL_FORMAT] 结果{i}: 类型={source_type}, 内容长度={len(content)}, 内容预览='{content[:100]}...'")
            
            # 截取内容避免过长
            if len(content) > 300:
                content = content[:300] + "..."
            
            content_for_model += f"{i}. 【{source_type}】{title}\n{content}\n\n"
        
        logger.info(f"[FINAL_FORMAT] 最终content_for_model长度: {len(content_for_model)}")
        return content_for_model
        
    except Exception as e:
        logger.error(f"❌ 独立工具函数检索失败: {e}")
        return ""  # 返回空字符串，避免错误信息出现在AI回答中


class GeopolymerTools:
    """通用知识库工具"""
    
    def __init__(self):
        pass
    
    async def search_papers(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """搜索相关论文"""
        try:
            # 这里可以集成实际的论文搜索服务
            return [
                {
                    "title": f"相关研究资料 - {query}",
                    "authors": "研究作者",
                    "journal": "专业技术期刊",
                    "year": "2024",
                    "abstract": f"关于{query}的研究摘要...",
                    "score": 0.95
                }
            ]
        except Exception as e:
            logger.error(f"搜索论文失败: {e}")
            return []


class CustomKnowledgeTools(Toolkit):
    """自定义知识检索工具 - 替代Agno原生知识库"""
    
    # 类变量，用于存储当前的检索模式
    current_retrieval_mode = 'all'
    current_collection_id = None
    
    def __init__(self, collection_id: str = None):
        super().__init__(
            name="mat_knowledge_tools"
        )
        
        # 延迟导入避免循环依赖
        from service.knowledge_service import knowledge_service
        from service.qa_dataset_service import qa_dataset_service
        from service.intelligent_retrieval_service import intelligent_retrieval_service
        
        self.knowledge_service = knowledge_service
        self.qa_dataset_service = qa_dataset_service  
        self.intelligent_retrieval_service = intelligent_retrieval_service
        
        # 存储最近的搜索结果供前端访问
        self._last_search_results = []
        
        # 设置collection_id
        self.collection_id = collection_id
        if collection_id:
            cls.current_collection_id = collection_id
        
        # 🔥 手动注册工具函数
        self.register(self.search_knowledge_base)
        self.register(self.search_knowledge_graph)
    
    @classmethod
    def set_retrieval_mode(cls, mode: str):
        """设置检索模式"""
        cls.current_retrieval_mode = mode
    
    @classmethod
    def set_collection_id(cls, collection_id: str):
        """设置Collection ID"""
        cls.current_collection_id = collection_id
        logger.info(f"[KNOWLEDGE_SEARCH] 设置Collection ID: {collection_id}")
    
    def search_knowledge_base(self, query: str, top_k: int = 10, retrieval_mode: str = None) -> str:
        """
        检索知识库 - 支持不同检索模式
        
        Args:
            query: 搜索查询字符串，例如"相关技术分析"
            top_k: 返回结果数量，默认10个
            retrieval_mode: 检索模式，支持 'qa_only'/'papers_only'/'all'
            
        Returns:
            str: 格式化的搜索结果，包含文档和QA数据集信息
        """
        # 同步wrapper调用异步实现
        import asyncio
        
        try:
            # 获取当前事件循环，如果没有就创建新的
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # 如果已经在事件循环中，使用run_until_complete可能会阻塞
                # 创建新的任务
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(
                        asyncio.run,
                        self._async_search_knowledge_base(query, top_k, retrieval_mode)
                    )
                    return future.result(timeout=60)  # 60秒超时
            else:
                # 不在事件循环中，可以直接运行
                return loop.run_until_complete(
                    self._async_search_knowledge_base(query, top_k, retrieval_mode)
                )
        except Exception as e:
            logger.error(f"[KNOWLEDGE_SEARCH] 同步调用失败: {e}")
            return f"抱歉，知识库检索失败: {str(e)}"
    
    async def _async_search_knowledge_base(self, query: str, top_k: int = 10, retrieval_mode: str = None) -> str:
        """异步实现的知识库检索 - 原有逻辑"""
        # 使用传入的模式或类变量中的模式
        actual_mode = retrieval_mode or self.current_retrieval_mode
        
        try:
            logger.info(f"[KNOWLEDGE_SEARCH] 🔍 开始检索: {query}")
            logger.info(f"[KNOWLEDGE_SEARCH] 📞 CustomKnowledgeTools.search_knowledge_base 被调用")
            logger.info(f"[KNOWLEDGE_SEARCH] 🎯 检索模式: {actual_mode} (传入: {retrieval_mode}, 类变量: {self.current_retrieval_mode})")
            
            # 🔥 优化：统一使用智能检索服务，根据检索模式设置数据源过滤
            logger.info(f"[KNOWLEDGE_SEARCH] 开始统一检索: query='{query}', top_k={top_k}")
            
            # 根据检索模式和Collection ID设置过滤条件
            source_filters = {}
            if actual_mode == 'papers_only':
                source_filters["exclude_qa_dataset"] = True
                logger.info(f"[KNOWLEDGE_SEARCH] 🎯 只检索论文文档，排除QA数据集")
            elif actual_mode == 'qa_only':
                source_filters["only_qa_dataset"] = True
                logger.info(f"[KNOWLEDGE_SEARCH] 🎯 只检索QA数据集，排除论文文档")
            else:
                logger.info(f"[KNOWLEDGE_SEARCH] 🎯 检索所有数据源")
            
            # 添加Collection ID过滤
            if self.collection_id or self.current_collection_id:
                collection_id = self.collection_id or self.current_collection_id
                source_filters["collection_id"] = collection_id
                logger.info(f"[KNOWLEDGE_SEARCH] 🎯 限制在Collection范围内检索: {collection_id}")
            
            # 如果没有设置任何过滤条件，使用None
            if not source_filters:
                source_filters = None
            
            intelligent_result = await self.intelligent_retrieval_service.intelligent_search(
                query=query,
                top_k=top_k,
                filters=source_filters,  # 传递数据源过滤条件
                enable_reranking=True,
                original_query=query,  # 中文原始查询
                translated_query=None  # 让intelligent_retrieval_service自动翻译
            )
            
            # 从智能检索服务结果中分离文档和QA数据
            doc_results = []
            qa_results = []
            
            if intelligent_result and intelligent_result.results:
                logger.info(f"[KNOWLEDGE_SEARCH] 📊 智能检索返回 {len(intelligent_result.results)} 个原始结果")
                
                # 🔥 调试：检查智能检索返回的原始数据结构
                for i, result in enumerate(intelligent_result.results[:3], 1):
                    logger.info(f"[DEBUG_RAW_DATA] 原始结果{i}: title='{result.get('title', '')}', content长度={len(result.get('content', ''))}")
                    logger.info(f"[DEBUG_RAW_DATA] 原始结果{i}: content内容='{result.get('content', '')[:100]}...'")
                    if 'source' in result:
                        source_data = result['source']
                        logger.info(f"[DEBUG_RAW_DATA] 原始结果{i}: source.question='{source_data.get('question', '')}', source.answer='{source_data.get('answer', '')[:50]}...'")
                
                for result in intelligent_result.results:
                    metadata = result.get('metadata', {})
                    source_type = metadata.get('type', '')
                    logger.debug(f"[KNOWLEDGE_SEARCH] 处理结果: type={source_type}, title={result.get('title', '')[:50]}...")
                    
                    # 根据检索模式过滤结果
                    if actual_mode == 'papers_only':
                        # 只保留文档类型的结果
                        if 'qa_dataset' not in source_type:
                            doc_results.append({
                                "id": result.get("id", ""),
                                "content": result.get("content", ""),
                                "title": result.get("title", ""),
                                "score": result.get("score", 0.0),
                                "metadata": metadata,
                                "highlights": result.get("highlights", [])
                            })
                    elif actual_mode == 'qa_only':
                        # 只保留QA类型的结果
                        if 'qa_dataset' in source_type:
                            # 🔥 修复：确保QA结果包含完整的问题和答案内容
                            source_info = result.get("source", {})
                            original_content = result.get("content", "")
                            # 🔥 关键修复：question和answer在顶层，不在嵌套对象中
                            question = result.get("question", "") or source_info.get("question", "") or metadata.get("question", "")
                            answer = result.get("answer", "") or source_info.get("answer", "") or metadata.get("answer", "")
                            
                            # 🔥 调试日志：检查数据提取结果
                            logger.info(f"[QA_DATA_EXTRACT] 提取结果: question='{question[:50]}...', answer='{answer[:50]}...', 原始content长度={len(original_content)}")
                            
                            # 修复逻辑：如果原始content为空或者看起来是空格式，则重新构建
                            if not original_content.strip() or original_content.strip() == "问题: \n答案:" or original_content.strip() == "":
                                if question and answer:
                                    original_content = f"问题: {question}\n答案: {answer}"
                                    logger.info(f"[QA_CONTENT_FIX] 重新构建content: 问题='{question[:50]}...', 答案='{answer[:50]}...'")
                                else:
                                    logger.warning(f"[QA_CONTENT_FIX] 无法构建content: 问题或答案为空")
                            else:
                                logger.info(f"[QA_CONTENT_FIX] 使用原始content，长度: {len(original_content)}")
                            
                            qa_results.append({
                                "id": result.get("id", ""),
                                "content": original_content,
                                "title": result.get("title", ""),
                                "score": result.get("score", 0.0),
                                "metadata": metadata,
                                "question": question,
                                "answer": answer,
                                "highlights": result.get("highlights", [])
                            })
                    else:  # 'all' 模式
                        # 保留所有类型的结果
                        if 'qa_dataset' in source_type:
                            # 🔥 修复：确保QA结果包含完整的问题和答案内容
                            source_info = result.get("source", {})
                            original_content = result.get("content", "")
                            # 🔥 关键修复：question和answer在顶层，不在嵌套对象中
                            question = result.get("question", "") or source_info.get("question", "") or metadata.get("question", "")
                            answer = result.get("answer", "") or source_info.get("answer", "") or metadata.get("answer", "")
                            
                            # 🔥 调试日志：检查数据提取结果
                            logger.info(f"[QA_DATA_EXTRACT] 提取结果: question='{question[:50]}...', answer='{answer[:50]}...', 原始content长度={len(original_content)}")
                            
                            # 修复逻辑：如果原始content为空或者看起来是空格式，则重新构建
                            if not original_content.strip() or original_content.strip() == "问题: \n答案:" or original_content.strip() == "":
                                if question and answer:
                                    original_content = f"问题: {question}\n答案: {answer}"
                                    logger.info(f"[QA_CONTENT_FIX] 重新构建content: 问题='{question[:50]}...', 答案='{answer[:50]}...'")
                                else:
                                    logger.warning(f"[QA_CONTENT_FIX] 无法构建content: 问题或答案为空")
                            else:
                                logger.info(f"[QA_CONTENT_FIX] 使用原始content，长度: {len(original_content)}")
                            
                            qa_results.append({
                                "id": result.get("id", ""),
                                "content": original_content,
                                "title": result.get("title", ""),
                                "score": result.get("score", 0.0),
                                "metadata": metadata,
                                "question": question,
                                "answer": answer,
                                "highlights": result.get("highlights", [])
                            })
                        else:
                            doc_results.append({
                                "id": result.get("id", ""),
                                "content": result.get("content", ""),
                                "title": result.get("title", ""),
                                "score": result.get("score", 0.0),
                                "metadata": metadata,
                                "highlights": result.get("highlights", [])
                            })
            
            logger.info(f"[KNOWLEDGE_SEARCH] 统一检索完成: 文档结果 {len(doc_results)} 个, QA结果 {len(qa_results)} 个")
            logger.info(f"[KNOWLEDGE_SEARCH] 🎯 过滤模式: {actual_mode}, 最终返回: 文档{len(doc_results)}个, QA{len(qa_results)}个")
            
            # 3. 合并和标记结果
            combined_results = []
            
            # 🔥 修复：安全检查，避免NoneType迭代错误
            if doc_results is None:
                doc_results = []
            if qa_results is None:
                qa_results = []
            
            # 添加文档结果
            for result in doc_results:
                combined_results.append({
                    "id": result.get("id", ""),
                    "content": result.get("content", ""),
                    "title": result.get("title", ""),
                    "score": result.get("score", 0.0),
                    "source_type": "document",
                    "source": "knowledge_base",
                    "metadata": result.get("metadata", {}),
                    "highlights": result.get("highlights", [])
                })
            
            # 添加QA结果  
            for result in qa_results:
                combined_results.append({
                    "id": result.get("id", ""),
                    "content": f"问题: {result.get('question', '')}\n答案: {result.get('answer', '')}",
                    "title": f"QA: {result.get('question', '')[:50]}...",
                    "score": result.get("score", 0.0),
                    "source_type": "qa_dataset", 
                    "source": "qa_database",
                    "metadata": result.get("metadata", {}),
                    "question": result.get("question", ""),
                    "answer": result.get("answer", "")
                })
            
            # 4. 详细记录和处理检索结果
            logger.info(f"[KNOWLEDGE_SEARCH] 类实例 - 文档检索结果: {len(doc_results)} 个")
            for i, result in enumerate(doc_results[:3], 1):
                logger.info(f"  文档 {i}: {result.get('title', 'No Title')[:50]}... 分数: {result.get('score', 0):.3f}")
            
            logger.info(f"[KNOWLEDGE_SEARCH] 类实例 - QA检索结果: {len(qa_results)} 个")
            for i, result in enumerate(qa_results[:3], 1):
                logger.info(f"  QA {i}: {result.get('question', 'No Question')[:50]}... 分数: {result.get('score', 0):.3f}")
            
            # 使用之前构建的正确格式的 combined_results（无需重新合并）
            
            # 去重处理 - 基于内容相似度
            unique_results = []
            seen_content = set()
            
            for result in combined_results:
                # 使用内容的前100字符作为去重标识
                content_key = (result.get('title', '') + result.get('content', ''))[:100].strip()
                if content_key and content_key not in seen_content:
                    seen_content.add(content_key)
                    unique_results.append(result)
                else:
                    logger.info(f"[KNOWLEDGE_SEARCH] 类实例去重: 跳过重复内容 {result.get('title', 'No Title')[:30]}...")
            
            logger.info(f"[KNOWLEDGE_SEARCH] 类实例去重后结果: {len(unique_results)} 个")
            
            # 过滤低质量结果（相关度阈值0.1，确保不丢失有效结果）
            filtered_results = [result for result in unique_results if result.get("score", 0) >= 0.1]
            logger.info(f"[KNOWLEDGE_SEARCH] 类实例高质量过滤后: {len(filtered_results)} 个 (阈值: 0.1)")
            
            # 🔥 确保至少保留一些不同类型的结果
            if filtered_results:
                doc_count = len([r for r in filtered_results if r.get('source_type') == 'document'])
                qa_count = len([r for r in filtered_results if r.get('source_type') == 'qa_dataset'])
                logger.info(f"[KNOWLEDGE_SEARCH] 过滤后结果类型分布: 文档={doc_count}, QA={qa_count}")
            
            # 按分数排序，但确保包含不同类型的结果
            filtered_results.sort(key=lambda x: x.get("score", 0), reverse=True)
            
            # 🔥 确保返回多样化的结果：至少包含一个文档和一个QA（如果存在）
            doc_results = [r for r in filtered_results if r.get('source_type') == 'document']
            qa_results = [r for r in filtered_results if r.get('source_type') == 'qa_dataset']
            
            final_search_results = []
            
            # 如果两种类型都存在，确保都包含
            if doc_results and qa_results:
                # 优先选择高分数的结果，但确保两种类型都有
                all_results = filtered_results.copy()
                added_types = set()
                
                for result in all_results:
                    source_type = result.get('source_type')
                    if len(final_search_results) < 5:  # 增加到5个结果
                        final_search_results.append(result)
                        added_types.add(source_type)
                    elif source_type not in added_types and len(final_search_results) < 6:
                        # 如果还没有这种类型的结果，强制添加
                        final_search_results.append(result)
                        added_types.add(source_type)
            else:
                # 如果只有一种类型，直接取前5个
                final_search_results = filtered_results[:5]
            
            logger.info(f"[KNOWLEDGE_SEARCH] ✅ 类实例检索完成: 最终返回 {len(final_search_results)} 个高质量结果")
            for i, result in enumerate(final_search_results, 1):
                title = result.get('title', result.get('question', 'No Title'))
                logger.info(f"  {i}. {title[:50]}... 分数: {result.get('score', 0):.3f} 类型: {result.get('source_type', 'unknown')}")
            
            # 5. 格式化结果为字符串，同时存储原始结果
            formatted_result = self._format_search_results(final_search_results)
            
            # 6. 存储知识检索结果供后续传递给前端
            try:
                # 将检索结果存储到类属性中，供外部访问
                self._last_search_results = final_search_results  # 修复变量名不一致问题
                logger.info(f"[KNOWLEDGE_SEARCH] 存储了 {len(self._last_search_results)} 个检索结果供前端显示")
                
                # 记录存储的结果详情
                for i, result in enumerate(self._last_search_results, 1):
                    logger.info(f"  存储结果 {i}: {result.get('title', 'No Title')[:30]}... 类型: {result.get('source_type', 'unknown')}")
            except Exception as e:
                logger.warning(f"存储知识检索结果失败: {e}")
            
            return formatted_result
            
        except Exception as e:
            logger.error(f"❌ 知识库检索失败: {e}")
            import traceback
            logger.error(f"❌ 详细错误信息: {traceback.format_exc()}")
            return f"抱歉，知识库检索失败: {str(e)}"
    
    def _format_search_results(self, results: List[Dict[str, Any]]) -> str:
        """格式化搜索结果为简单确认信息 - 不返回详细内容避免在对话中显示"""
        if not results:
            return "未找到相关资料。"
        
        # 🔥 修复：返回完整检索内容供模型使用
        if results:
            # 构建完整的检索内容给模型
            content_parts = []
            for i, result in enumerate(results[:5], 1):  # 取前5个结果
                title = result.get('title', f'资料{i}')
                content = result.get('content', '')
                source = result.get('source', '未知来源')
                source_type = result.get('source_type', 'unknown')
                
                # 🔥 关键修复：对于QA类型，确保内容包含问题和答案
                if source_type == "qa_dataset":
                    question = result.get("question", "")
                    answer = result.get("answer", "")
                    
                    # 如果content为空或格式不正确，重新构建
                    if not content.strip() or (question and answer and ("问题:" not in content or "答案:" not in content)):
                        content = f"问题: {question}\n答案: {answer}"
                        logger.info(f"[FORMAT_SEARCH_FIX] 重新构建格式化content: 问题长度={len(question)}, 答案长度={len(answer)}")
                
                logger.info(f"[FORMAT_SEARCH] 格式化结果{i}: 类型={source_type}, 内容长度={len(content)}, 内容预览='{content[:100]}...'")
                content_parts.append(f"【资料{i}】{title}\n来源：{source}\n内容：{content}\n")
            
            full_content = f"成功检索到 {len(results)} 个相关资料：\n\n" + "\n".join(content_parts)
            logger.info(f"[FORMAT_SEARCH] 最终格式化结果长度: {len(full_content)}")
            return full_content
        else:
            return "未找到相关资料。"
    
    async def search_qa_dataset(self, query: str, top_k: int = 5) -> str:
        """
        专门检索QA问答数据集
        
        Args:
            query: 搜索查询字符串
            top_k: 返回结果数量，默认5个
            
        Returns:
            str: 格式化的QA搜索结果
        """
        try:
            logger.info(f"[QA_SEARCH] 🔍 开始QA检索: {query}")
            
            # 使用ES直接搜索QA数据集
            results = await self._search_qa_elasticsearch(
                query=query,
                top_k=top_k,
                similarity_threshold=0.3  # 降低阈值确保找到QA对
            )
            
            logger.info(f"[QA_SEARCH] ✅ QA检索完成: {len(results)} 个结果")
            
            if not results:
                return "未找到相关的QA问答数据。"
            
            # 🔥 修复：返回完整QA内容供模型使用
            content_parts = []
            for i, result in enumerate(results[:3], 1):
                question = result.get('question', f'问题{i}')
                answer = result.get('answer', '')
                source = result.get('source', '问答库')
                
                content_parts.append(f"【QA{i}】{question}\n答案：{answer}\n来源：{source}\n")
            
            full_content = f"成功检索到 {len(results)} 个相关QA问答：\n\n" + "\n".join(content_parts)
            return full_content
            
        except Exception as e:
            logger.error(f"❌ QA数据集检索失败: {e}")
            return f"抱歉，QA数据集检索失败: {str(e)}"
    
    async def search_documents(self, query: str, top_k: int = 5) -> str:
        """
        专门检索文档知识库
        
        Args:
            query: 搜索查询字符串
            top_k: 返回结果数量，默认5个
            
        Returns:
            str: 格式化的文档搜索结果
        """
        try:
            logger.info(f"[DOC_SEARCH] 🔍 开始文档检索: {query}")
            
            results = await self.knowledge_service.hybrid_search(
                query=query,
                top_k=top_k,
                boost_domain=True,
                use_rerank=True
            )
            
            logger.info(f"[DOC_SEARCH] ✅ 文档检索完成: {len(results)} 个结果")
            
            if not results:
                return "未找到相关的文档资料。"
            
            # 🔥 修复：返回完整文档内容供模型使用
            content_parts = []
            for i, result in enumerate(results[:3], 1):
                title = result.get('title', f'文档{i}')
                content = result.get('content', '')
                source = result.get('source', '文档库')
                
                content_parts.append(f"【文档{i}】{title}\n来源：{source}\n内容：{content}\n")
            
            full_content = f"成功检索到 {len(results)} 个相关文档：\n\n" + "\n".join(content_parts)
            return full_content
            
        except Exception as e:
            logger.error(f"❌ 文档检索失败: {e}")
            return f"抱歉，文档检索失败: {str(e)}"
    
    def search_knowledge_graph(self, query: str, top_k: int = 10, mode: str = "mix") -> str:
        """
        检索知识图谱 - 添加图谱检索功能到专家模式
        
        Args:
            query: 搜索查询字符串，例如"相关技术分析"
            top_k: 返回结果数量，默认10个
            mode: 检索模式，支持 'local'/'global'/'mix'，默认'mix'
            
        Returns:
            str: 格式化的知识图谱检索结果
        """
        # 同步wrapper调用异步实现
        import asyncio
        
        try:
            # 获取当前事件循环，如果没有就创建新的
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # 如果已经在事件循环中，使用run_until_complete可能会阻塞
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(
                        asyncio.run,
                        self._async_search_knowledge_graph(query, top_k, mode)
                    )
                    return future.result(timeout=60)  # 60秒超时
            else:
                # 不在事件循环中，可以直接运行
                return loop.run_until_complete(
                    self._async_search_knowledge_graph(query, top_k, mode)
                )
        except Exception as e:
            logger.error(f"[GRAPH_SEARCH] 同步调用失败: {e}")
            return f"抱歉，知识图谱检索失败: {str(e)}"
            
    async def _async_search_knowledge_graph(self, query: str, top_k: int = 10, mode: str = "mix") -> str:
        """
        检索知识图谱 - 添加图谱检索功能到专家模式
        
        Args:
            query: 搜索查询字符串，例如"相关技术分析"
            top_k: 返回结果数量，默认10个
            mode: 检索模式，支持 'local'/'global'/'mix'，默认'mix'
            
        Returns:
            str: 格式化的知识图谱检索结果
        """
        try:
            logger.info(f"[GRAPH_SEARCH] 🔍 开始知识图谱检索: {query}")
            logger.info(f"[GRAPH_SEARCH] 📞 CustomKnowledgeTools.search_knowledge_graph 被调用")
            logger.info(f"[GRAPH_SEARCH] 🎯 检索模式: {mode}, top_k: {top_k}")
            
            # 延迟导入避免循环依赖
            from service.lightrag_client_service import MatGraphClientService
            
            # 🔥 修复：使用新实例避免事件循环关闭问题
            matgraph_client = MatGraphClientService()
            
            # 执行知识图谱查询
            graph_result = await matgraph_client.query_knowledge_graph(
                query=query,
                mode=mode,  # 使用指定模式
                top_k=top_k,
                only_need_context=False,
                max_tokens=4000
            )
            
            if not graph_result.success or not graph_result.response:
                logger.warning(f"[GRAPH_SEARCH] ⚠️ 图谱检索失败: {graph_result.error_message}")
                return "未找到相关的知识图谱信息。"
            
            logger.info(f"[GRAPH_SEARCH] ✅ 图谱检索成功，响应长度: {len(graph_result.response)}")
            
            # 存储图谱检索结果供前端显示
            try:
                # 将知识图谱结果存储到类属性中，供外部访问
                graph_dict = graph_result.to_dict()
                self._last_graph_results = graph_dict
                logger.info(f"[GRAPH_SEARCH] ✅ 存储图谱检索结果供前端显示:")
                logger.info(f"[GRAPH_SEARCH]   - success: {graph_dict.get('success')}")
                logger.info(f"[GRAPH_SEARCH]   - response长度: {len(graph_dict.get('response', ''))}")
                logger.info(f"[GRAPH_SEARCH]   - entities: {len(graph_dict.get('entities', []))}")
                logger.info(f"[GRAPH_SEARCH]   - relationships: {len(graph_dict.get('relationships', []))}")
                logger.info(f"[GRAPH_SEARCH]   - sources: {len(graph_dict.get('sources', []))}")
                logger.info(f"[GRAPH_SEARCH]   - 完整数据: {graph_dict}")
            except Exception as e:
                logger.warning(f"存储知识图谱检索结果失败: {e}")
            
            # 🔥 修复：返回完整图谱内容供模型使用
            content_parts = []
            
            # 添加主要响应内容
            content_parts.append(f"【知识图谱检索结果】\n{graph_result.response}\n")
            
            # 添加实体信息（如果存在）
            if graph_result.entities:
                entities_info = []
                for entity in graph_result.entities[:5]:  # 取前5个实体
                    entity_info = f"- {entity.get('name', '未知实体')} ({entity.get('type', '未知类型')})"
                    if entity.get('description'):
                        entity_info += f": {entity['description'][:100]}..."
                    entities_info.append(entity_info)
                
                content_parts.append(f"【相关实体】\n" + "\n".join(entities_info) + "\n")
            
            # 添加关系信息（如果存在）
            if graph_result.relationships:
                relationships_info = []
                for rel in graph_result.relationships[:3]:  # 取前3个关系
                    rel_info = f"- {rel.get('source', '未知')} → {rel.get('type', '未知关系')} → {rel.get('target', '未知')}"
                    relationships_info.append(rel_info)
                
                content_parts.append(f"【相关关系】\n" + "\n".join(relationships_info) + "\n")
            
            # 添加来源信息（如果存在）
            if graph_result.sources:
                sources_info = []
                for source in graph_result.sources[:3]:  # 取前3个来源
                    source_info = f"- 来源: {source.get('source', '未知来源')}"
                    if source.get('score'):
                        source_info += f" (相关度: {source['score']:.3f})"
                    sources_info.append(source_info)
                
                content_parts.append(f"【数据来源】\n" + "\n".join(sources_info) + "\n")
            
            full_content = "\n".join(content_parts)
            logger.info(f"[GRAPH_SEARCH] 最终格式化结果长度: {len(full_content)}")
            
            # 🔥 图谱检索完成后，设置一个标志以便后续发送补充的knowledge_sources事件
            self._graph_search_completed = True
            self._graph_search_data = self._last_graph_results
            logger.info(f"[GRAPH_SEARCH] 🎯 设置图谱检索完成标志，准备发送补充事件")
            
            # 🔥 修复：确保关闭客户端连接
            try:
                await matgraph_client.close()
            except Exception as close_error:
                logger.warning(f"关闭MatGraph客户端失败: {close_error}")
            
            return full_content
            
        except Exception as e:
            logger.error(f"❌ 知识图谱检索失败: {e}")
            import traceback
            logger.error(f"❌ 详细错误信息: {traceback.format_exc()}")
            
            # 🔥 修复：异常情况下也要关闭客户端连接
            try:
                if 'matgraph_client' in locals():
                    await matgraph_client.close()
            except Exception as close_error:
                logger.warning(f"异常处理中关闭MatGraph客户端失败: {close_error}")
            
            return f"抱歉，知识图谱检索失败: {str(e)}"


class AgentFactory:
    """智能体工厂"""
    
    def __init__(self, db_pool=None):
        self._agents = {}
        self.db_pool = db_pool
        self.geopolymer_tools = GeopolymerTools()
        self.custom_knowledge_tools = CustomKnowledgeTools()  # 初始化自定义知识工具
        self.session_agents = {}  # session_id -> {agent_name: agent_instance}
        self._agent_cache_lock = asyncio.Lock()
    
    def _create_agno_model(self, agent_config, model_name: str = None) -> Optional[Any]:
        """创建Agno模型实例 - 统一通过OneAPI接口访问所有模型"""
        try:
            # 统一使用OpenAI兼容接口，无论原始配置中的provider是什么
            # 所有模型都通过OneAPI统一接口访问
            # 使用角色映射包装器来修复developer角色问题
            
            # 构建完整的API配置
            api_base = optimized_config_manager.settings.one_api_base_url
            api_key = optimized_config_manager.settings.one_api_key
            
            if not api_base or not api_key:
                logger.error("OneAPI配置不完整，无法创建模型")
                return None
            
            # 解析实际的模型名称
            if model_name:
                # 如果直接传入了model_name，使用它
                resolved_model_name = model_name
            else:
                # 通过model_id和provider解析实际的model_name
                model_config = optimized_config_manager.get_model_config(
                    agent_config.model_provider, 
                    agent_config.model_id
                )
                if model_config:
                    resolved_model_name = model_config.model_name
                    logger.info(f"模型解析: {agent_config.model_id} -> {resolved_model_name}")
                else:
                    # 如果找不到配置，回退到使用model_id
                    resolved_model_name = agent_config.model_id
                    logger.warning(f"未找到模型配置 {agent_config.model_provider}:{agent_config.model_id}，使用ID作为模型名称")
            
            # 使用角色映射包装器来修复Agno框架的developer角色问题
            # 针对qwen3-235b超大模型的特殊参数优化
            model_kwargs = {
                "id": resolved_model_name,
                "api_key": api_key,
                "base_url": api_base,
                "max_tokens": agent_config.max_tokens,
                "temperature": max(agent_config.temperature, 0.8)  # 强制最低温度0.8
            }
            
            # 统一模型配置 - 不再有qwen3-235b特殊处理
            
            # 针对kimi-k2模型的特殊优化 - 移除不支持的参数
            if "kimi-k2" in resolved_model_name.lower():
                logger.info(f"[MODEL_OPTIMIZE] 为kimi-k2模型应用标准配置")
            
            model = RoleMappedOpenAIChat(**model_kwargs)
            
            
            logger.info(f"成功创建模型实例: {resolved_model_name} (原始provider: {agent_config.model_provider}, 通过OneAPI访问)")
            return model
        
        except ImportError as e:
            logger.error(f"导入Agno模型类失败: {e}")
            return None
        except Exception as e:
            logger.error(f"创建模型实例失败: {e}")
            return None
    
    def _configure_agent_memory(self, session_id: str = None) -> tuple:
        """配置Agno原生memory和storage"""
        memory = None
        storage = None
        
        if _has_agno_memory and AgentMemory and AgentStorage:
            try:
                # 获取项目的PostgreSQL数据库引擎
                from db.database import get_sync_engine
                db_engine = get_sync_engine()
                
                # 配置Agent Memory - 支持session-based对话记忆
                memory = AgentMemory(
                    create_table=True,  # 自动创建记忆表
                    db_engine=db_engine,  # 使用项目的PostgreSQL数据库
                    table_name="agent_memory",
                    session_id=session_id  # 使用session_id进行隔离
                )
                
                # 配置Agent Storage - 支持持久化状态存储
                storage = AgentStorage(
                    create_table=True,  # 自动创建存储表
                    db_engine=db_engine,  # 使用项目的PostgreSQL数据库
                    table_name="agent_storage"
                )
                
                logger.info(f"成功配置Agno原生memory和storage，使用PostgreSQL，session_id: {session_id}")
            except Exception as e:
                logger.warning(f"配置Agno memory失败，降级使用传统方式: {e}")
                import traceback
                logger.error(traceback.format_exc())
                memory = None
                storage = None
        else:
            logger.info("Agno memory模块不可用，使用传统上下文管理")
        
        return memory, storage

    def create_agent(self, agent_name: str, search_knowledge: bool = True, session_id: str = None, search_graph: bool = False, model_name: str = None) -> Optional[Agent]:
        """创建智能体实例 - 基于Agno框架，支持原生memory"""
        # 为了支持动态知识库控制，不缓存智能体实例
        # if agent_name in self._agents:
        #     return self._agents[agent_name]
        
        agent_config = optimized_config_manager.get_agent_config(agent_name)
        if not agent_config:
            logger.error(f"未找到智能体配置: {agent_name}")
            return None
        
        try:
            # 创建Agno模型实例
            model = self._create_agno_model(agent_config)
            if not model:
                logger.error(f"无法创建模型实例: {agent_config.model_provider}:{agent_config.model_id}")
                return None
            
            # 🔥 修复知识库配置逻辑 - 针对qwen3-235b模型的特殊处理
            knowledge_base = None
            tools = []
            
            # 检查是否为qwen3-235b模型
            is_qwen235b = any(pattern in agent_config.model_id.lower() for pattern in ["qwen3-235b", "qwen-235b", "235b"]) if agent_config else False
            if not is_qwen235b and model_name:
                is_qwen235b = any(pattern in model_name.lower() for pattern in ["qwen3-235b", "qwen-235b", "235b"])
            
            if is_qwen235b:
                # qwen3-235b模型：使用基础工具但不包含检索工具（避免工具调用问题）
                tools = self._configure_basic_agent_tools(agent_name)
                logger.info(f"智能体 {agent_name} (qwen3-235b) 使用基础工具，依赖预检索")
            elif search_knowledge or search_graph:
                # 🔥 统一使用CustomKnowledgeTools处理所有检索模式，解决独立工具函数不工作的问题
                tools = self._configure_basic_agent_tools(agent_name)
                
                # 添加CustomKnowledgeTools实例（统一支持知识库和图谱检索）
                custom_knowledge_tools = CustomKnowledgeTools()
                tools.append(custom_knowledge_tools)
                
                # 🔥 添加Collection智能体工具支持
                if _has_collection_tools:
                    try:
                        collection_tools = CollectionAgentTools(self.db_pool)
                        tools.append(collection_tools)
                        logger.info(f"智能体 {agent_name} 启用Collection检索工具")
                    except Exception as e:
                        logger.warning(f"Collection工具添加失败: {e}")
                
                if search_graph:
                    logger.info(f"智能体 {agent_name} 启用统一检索工具（知识库+图谱+Collection）")
                else:
                    logger.info(f"智能体 {agent_name} 启用统一检索工具（知识库+Collection）")
                
                logger.info(f"智能体 {agent_name} 启用检索（知识库: {search_knowledge}, 图谱: {search_graph}）")
            else:
                # 添加基础工具集
                tools = self._configure_basic_agent_tools(agent_name)
                logger.info(f"智能体 {agent_name} 禁用知识库检索")
            
            # 配置Agno原生memory和storage
            memory, storage = self._configure_agent_memory(session_id)
            
            # 创建智能体指令，根据模型类型和工具配置调整
            instructions = "\n".join(agent_config.instructions)
            instructions += "\n重要：必须使用中文回答所有问题，包括思考过程和最终答案。"
            
            # 检测是否为需要特殊markdown格式的模型
            needs_markdown_format = ("qwen3-235b" in agent_config.model_id.lower() or 
                                   "kimi-k2" in agent_config.model_id.lower())
            
            if not is_qwen235b:
                # 非qwen3-235b模型：添加完整工具调用指令
                instructions += "\n🔥 MANDATORY 强制要求：在回答任何问题时，必须首先使用think工具展示你的思考过程！"
                instructions += "\n你必须先调用think工具进行思考，然后再给出最终答案。这是强制性的，不可跳过！"
                instructions += "\n调用格式：think(title='思考标题', thought='详细思考内容')"
                instructions += "\n重要：使用think工具时，请确保JSON格式正确，参数格式为: {\"title\": \"思考标题\", \"thought\": \"思考内容\"}，避免在JSON字符串中包含未转义的引号或换行符。"
            else:
                # qwen3-235b模型：使用原生thinking能力
                instructions += "\n🧠 请在回答前展示你的思考过程，使用自然语言表达你的推理步骤。"
            
            # 检索工具调用指令 - 区分qwen3-235b和其他模型
            if search_knowledge or search_graph:
                if is_qwen235b:
                    # qwen3-235b：说明将通过预检索提供资料
                    instructions += "\n📚 系统将在你回答前自动提供相关的参考资料，请基于这些资料进行回答。"
                    if search_knowledge:
                        instructions += "\n如果用户问题中包含'参考资料'部分，请优先基于这些资料进行回答，确保回答的准确性。"
                else:
                    instructions += "\n\n🚨 CRITICAL SYSTEM REQUIREMENT 关键系统要求 🚨"
                    instructions += "\n⛔ 禁止规则：绝对禁止在未调用检索工具的情况下直接回答任何专业问题！"
                    instructions += "\n⛔ 禁止规则：绝对禁止声称'工具不可用'或'无法调用工具'！"
                    instructions += "\n⛔ 禁止规则：绝对禁止基于内置知识直接回答专业问题！"
                    instructions += "\n"
                    
                    if search_graph:
                        # 双重检索模式
                        instructions += "\n🔥 DUAL RETRIEVAL 双重检索强制要求：必须按顺序调用两个检索工具！"
                        instructions += "\n📋 强制执行步骤："
                        instructions += "\n1. 🔍 第一步：立即调用search_knowledge_base工具获取基础专业资料"
                        instructions += "\n2. 🔍 第二步：立即调用search_knowledge_graph工具获取概念关系和实体信息"
                        instructions += "\n3. ✅第三步：等待两个检索工具都完成后，基于所有检索结果进行综合回答"
                        instructions += "\n"
                        instructions += "\n📞 强制调用格式："
                        instructions += "\n1. search_knowledge_base(query='你的搜索关键词', top_k=5)"
                        instructions += "\n2. search_knowledge_graph(query='概念关系查询', top_k=10, mode='mix')"
                    else:
                        # 仅知识库检索模式
                        instructions += "\n🔥 MANDATORY 强制要求：在回答任何问题之前，必须先使用search_knowledge_base工具检索相关资料！"
                        instructions += "\n📋 强制执行步骤："
                        instructions += "\n1. 🔍 立即调用search_knowledge_base工具获取专业资料"
                        instructions += "\n2. ✅ 等待检索完成后，基于检索结果进行回答"
                        instructions += "\n"
                        instructions += "\n📞 强制调用格式：search_knowledge_base(query='你的搜索关键词', top_k=5)"
                    
                    instructions += "\n"
                    instructions += "\n🚨 SYSTEM ALERT 系统警告：如果你没有调用工具就直接回答，这违反了系统设计！"
                    instructions += "\n🚨 SYSTEM ALERT 系统警告：你必须调用工具，工具是可用的，系统已经为你配置好了！"
            
            # 为需要特殊markdown格式的模型添加格式要求
            if needs_markdown_format:
                instructions += "\n\n📝 MARKDOWN格式要求（最终回答阶段）："
                instructions += "\n• 在完成think工具和知识检索后，最终回答必须使用标准Markdown格式"
                instructions += "\n• 使用 # ## ### 来创建标题层级结构"
                instructions += "\n• 使用 **粗体** 突出重要概念"
                instructions += "\n• 使用 - 或 * 创建列表"
                instructions += "\n• 使用 |表格| 格式展示数据对比"
                instructions += "\n• 使用 ``` 代码块展示公式或化学式"
                instructions += "\n\n请直接基于你的专业知识和对话历史回答用户问题，保持回答的专业性和准确性。"
                if search_knowledge:
                    instructions += "\n如果用户问题中包含'参考资料'部分，请优先基于这些资料进行回答，确保回答的准确性。"
            
            # 如果启用了Agno memory，在指令中添加记忆相关说明
            if memory:
                instructions += "\n\n你拥有记忆能力，可以记住之前的对话内容。请根据对话历史提供连贯和相关的回答。"
            
            # 创建智能体，不使用Agno原生知识库，统一使用自定义工具
            logger.info(f"创建Agent - {agent_name}: search_knowledge={search_knowledge}, 使用自定义知识库工具, memory={'启用' if memory else '禁用'}")
            
            agent_params = {
                "name": agent_config.name,
                "description": agent_config.role,  # Agno 2.0.2中使用description而非role
                "model": model,
                "instructions": instructions,
                "tools": tools,
                "knowledge": None,  # 🔥 不使用Agno原生知识库，避免冲突
                "search_knowledge": False,  # 🔥 禁用Agno原生搜索，使用自定义工具
                "markdown": agent_config.markdown  # Agno 2.0.2支持markdown参数
            }
            
            # 只在memory可用时添加memory和storage配置
            if memory:
                agent_params["memory"] = memory
            if storage:
                agent_params["storage"] = storage
            
            agent = Agent(**agent_params)
            
            # 统一处理所有模型 - 不再有qwen3-235b特殊逻辑
            
            # 验证Agent的配置
            logger.info(f"Agent创建完成 - {agent_name}: 知识库检索={'启用' if search_knowledge else '禁用'}")
            if hasattr(agent, 'tools') and agent.tools:
                tool_names = [getattr(tool, 'name', type(tool).__name__) for tool in agent.tools]
                logger.info(f"Agent工具列表: {tool_names}")
            else:
                logger.info(f"Agent工具列表: [] (无工具)")
            
            # 暂时不缓存以支持动态配置
            # self._agents[agent_name] = agent
            logger.info(f"成功创建智能体: {agent_name}，知识库检索: {'启用' if search_knowledge else '禁用'}")
            return agent
            
        except Exception as e:
            logger.error(f"创建智能体 {agent_name} 失败: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None
    
    def _configure_agent_tools_with_knowledge(self, agent_name: str) -> List:
        """配置包含知识库的智能体工具 - 新增方法"""
        tools = []
        
        # 添加推理工具
        reasoning_tools = ReasoningTools(
            add_instructions=False  # 禁用自动指令避免格式冲突
        )
        tools.append(reasoning_tools)
        logger.info(f"为智能体 {agent_name} 添加ReasoningTools")
        
        # 🔥 为所有启用知识库的智能体添加独立知识检索工具函数
        # 使用同步版本的独立工具函数避免异步兼容性问题
        tools.append(search_knowledge_base)
        logger.info(f"为智能体 {agent_name} 添加独立知识检索工具函数")
        
        # 根据智能体类型添加特定工具
        if agent_name in ["doc_analyzer", "literature_agent"]:
            if _has_duckduckgo and DuckDuckGoTools:
                tools.append(DuckDuckGoTools())
                logger.info(f"为智能体 {agent_name} 添加DuckDuckGoTools")
            else:
                logger.warning(f"DuckDuckGoTools不可用，跳过为 {agent_name} 添加搜索工具")
        
        # 为专家智能体添加专业工具
        if agent_name in ["qa_agent", "cailiao_zhuanjia"]:
            tools.append(self.geopolymer_tools)
            logger.info(f"为智能体 {agent_name} 添加专业工具")
        
        return tools
    
    def _configure_basic_agent_tools(self, agent_name: str) -> List:
        """配置基础智能体工具（不包含自定义知识库工具）"""
        tools = []
        
        # 🔥 恢复ReasoningTools配置，用于thinking功能
        
        # 配置推理工具 - 只使用支持的参数
        reasoning_tools = ReasoningTools(
            add_instructions=False  # 禁用自动指令避免格式冲突
        )
        tools.append(reasoning_tools)
        logger.info(f"为智能体 {agent_name} 添加ReasoningTools，配置: add_instructions=False")
        
        # 根据智能体类型添加特定工具（非知识库工具）
        if agent_name in ["doc_analyzer", "literature_agent"]:
            if _has_duckduckgo and DuckDuckGoTools:
                tools.append(DuckDuckGoTools())
                logger.info(f"为智能体 {agent_name} 添加DuckDuckGoTools")
            else:
                logger.warning(f"DuckDuckGoTools不可用，跳过为 {agent_name} 添加搜索工具")
        
        return tools
    
    def _configure_agent_tools(self, agent_name: str) -> List:
        """配置智能体工具（包含自定义知识库工具）"""
        tools = []
        
        # 🔥 恢复ReasoningTools配置，用于thinking功能
        
        # 配置推理工具 - 只使用支持的参数
        reasoning_tools = ReasoningTools(
            add_instructions=False  # 禁用自动指令避免格式冲突
        )
        tools.append(reasoning_tools)
        logger.info(f"为智能体 {agent_name} 添加ReasoningTools，配置: add_instructions=False")
        
        # 为所有智能体添加自定义知识检索工具
        tools.append(self.custom_knowledge_tools)
        logger.info(f"为智能体 {agent_name} 添加自定义知识检索工具")
        
        # 根据智能体类型添加特定工具
        if agent_name in ["doc_analyzer", "literature_agent"]:
            if _has_duckduckgo and DuckDuckGoTools:
                tools.append(DuckDuckGoTools())
                logger.info(f"为智能体 {agent_name} 添加DuckDuckGoTools")
            else:
                logger.warning(f"DuckDuckGoTools不可用，跳过为 {agent_name} 添加搜索工具")
        
        # 为专家智能体添加专业工具
        if agent_name in ["qa_agent", "cailiao_zhuanjia"]:
            tools.append(self.geopolymer_tools)
            logger.info(f"为智能体 {agent_name} 添加专业工具")
        
        return tools
    
    
    def _configure_agent_knowledge(self, agent_name: str):
        """配置智能体知识库 - 修复：返回单个知识库对象或None"""
        try:
            # 获取知识绑定服务中的文档
            documents = knowledge_binding_service.get_agent_documents(agent_name)
            
            if len(documents) == 0:
                logger.info(f"智能体 {agent_name} 没有可用的知识文档，禁用知识库")
                return None
            
            # 暂时禁用原生Agno知识库，避免'list' object has no attribute 'validate_filters'错误
            # 这是一个已知的兼容性问题，我们将在后续版本中解决
            logger.warning(f"智能体 {agent_name} 暂时禁用原生知识库以避免兼容性问题")
            logger.info(f"将使用自定义知识检索工具替代原生知识库功能")
            
            return None
            
            # TODO: 在Agno框架兼容性问题解决后，重新启用以下代码
            """
            # 选择第一个文档作为主要知识库
            primary_doc = documents[0]
            
            if primary_doc.get('type') == 'text':
                # 文本知识库
                knowledge_base = TextKnowledgeBase(
                    path=primary_doc['path'],
                    name=f"{agent_name}_knowledge"
                )
                logger.info(f"为智能体 {agent_name} 配置文本知识库: {primary_doc['path']}")
                return knowledge_base
                
            elif primary_doc.get('type') == 'pdf':
                # PDF知识库
                knowledge_base = PDFKnowledgeBase(
                    path=primary_doc['path'],
                    name=f"{agent_name}_knowledge"
                )
                logger.info(f"为智能体 {agent_name} 配置PDF知识库: {primary_doc['path']}")
                return knowledge_base
                
            else:
                # 通用文档知识库
                knowledge_base = DocumentKnowledgeBase(
                    name=f"{agent_name}_knowledge",
                    path=str(Path(optimized_config_manager.settings.upload_dir))
                )
                logger.info(f"为智能体 {agent_name} 配置文档知识库")
                return knowledge_base
            """
            
        except Exception as e:
            logger.error(f"配置智能体 {agent_name} 知识库失败: {e}")
            return None
    
    async def get_agent(self, agent_name: str, search_knowledge: bool = True, session_id: str = None, search_graph: bool = False, model_name: str = None) -> Optional[Agent]:
        """获取智能体实例 - 支持基于session_id的缓存以保持Agno内存状态"""
        if not session_id:
            # 没有session_id时直接创建新实例
            return self.create_agent(agent_name, search_knowledge, session_id, search_graph, model_name)
        
        # 构建缓存键（包含model_name以支持动态模型）
        model_suffix = f"_{model_name}" if model_name else ""
        cache_key = f"{agent_name}_{search_knowledge}_{search_graph}{model_suffix}"
        
        async with self._agent_cache_lock:
            # 检查是否已有缓存的Agent实例
            if session_id in self.session_agents:
                if cache_key in self.session_agents[session_id]:
                    cached_agent = self.session_agents[session_id][cache_key]
                    logger.info(f"[CACHE] 使用缓存的Agent实例: {agent_name}, session: {session_id}")
                    return cached_agent
            
            # 创建新的Agent实例
            new_agent = self.create_agent(agent_name, search_knowledge, session_id, search_graph, model_name)
            if new_agent:
                # 缓存Agent实例
                if session_id not in self.session_agents:
                    self.session_agents[session_id] = {}
                self.session_agents[session_id][cache_key] = new_agent
                logger.info(f"[CACHE] 缓存新的Agent实例: {agent_name}, session: {session_id}")
            
            return new_agent
    

class AgentTeamFactory:
    """智能体团队工厂"""
    
    def __init__(self, agent_factory: AgentFactory):
        self.agent_factory = agent_factory
        self._teams: Dict[str, Team] = {}
    
    def create_team(self, team_name: str) -> Optional[Team]:
        """创建智能体团队"""
        if team_name in self._teams:
            return self._teams[team_name]
        
        team_config = optimized_config_manager.get_agent_team_config(team_name)
        if not team_config:
            logger.error(f"未找到团队配置: {team_name}")
            return None
        
        try:
            # 创建团队成员 - 🔥 修复：确保团队成员启用知识检索
            members = []
            for member_name in team_config.members:
                agent = self.agent_factory.create_agent(member_name, search_knowledge=True)  # 强制启用知识检索
                if agent:
                    members.append(agent)
                    logger.info(f"团队成员创建成功: {member_name}，已启用知识检索")
                else:
                    logger.warning(f"无法创建团队成员: {member_name}")
            
            if not members:
                logger.error(f"团队 {team_name} 没有有效成员")
                return None
            
            # 创建协调器模型
            coordinator_config = optimized_config_manager.get_agent_config(team_config.coordinator)
            if not coordinator_config:
                logger.error(f"未找到协调器配置: {team_config.coordinator}")
                return None
            
            # 使用Agno模型而不是LLM服务模型，支持角色映射
            coordinator_model = self.agent_factory._create_agno_model(coordinator_config)
            if not coordinator_model:
                logger.error(f"无法创建协调器模型: {coordinator_config.model_provider}:{coordinator_config.model_id}")
                return None
            
            # 创建团队
            team = Team(
                name=team_config.name,
                members=members,
                model=coordinator_model,
                expected_output=team_config.success_criteria,  # Agno 2.0.2中使用expected_output而非success_criteria
                instructions=team_config.instructions,
                show_members_responses=coordinator_config.show_tool_calls,  # Agno 2.0.2中使用show_members_responses
                markdown=coordinator_config.markdown
            )
            
            self._teams[team_name] = team
            logger.info(f"成功创建智能体团队: {team_name}")
            return team
            
        except Exception as e:
            logger.error(f"创建智能体团队 {team_name} 失败: {e}")
            return None
    
    def get_team(self, team_name: str) -> Optional[Team]:
        """获取智能体团队"""
        return self._teams.get(team_name) or self.create_team(team_name)


class AgentService:
    """智能体服务主类"""
    
    def __init__(self, db_pool=None):
        self.db_pool = db_pool
        self.agent_factory = AgentFactory(db_pool)
        self.team_factory = AgentTeamFactory(self.agent_factory)
        
        # 会话管理 - 用于跟踪和取消活跃的会话
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self._session_lock = asyncio.Lock()
        
        # 中文智能体名称映射（前端中文ID到后端英文ID）
        self.agent_name_mapping = {
            'dijuwu_wendatuandui': 'qa_team',
            'geopolymer_qa_team_v2': 'geopolymer_qa_team_v2',  # 新的多语言Team
            'cailiao_zhuanjia': 'cailiao_zhuanjia',  # 直接使用同名映射
            'wenxian_jiansuozhuanjia': 'doc_analyzer', 
            'shuju_fenxizhuanjia': 'multimodal_agent'
        }
    
    async def _should_search_knowledge(self, query: str) -> bool:
        """
        使用系统内的qwen模型智能判断问题是否需要检索知识库
        避免对简单问候、身份询问等问题进行不必要的检索
        """
        try:
            # 使用系统内的qwen3-30b模型进行意图判断
            from config.optimized_config_manager import optimized_config_manager
            
            # 获取qwen3-30b模型配置
            model_config = optimized_config_manager.get_model_config('oneapi', 'qwen3-30b-a3b-instruct-2507')
            if not model_config:
                logger.warning("未找到qwen3-30b模型配置，使用简单规则判断")
                return self._simple_should_search_knowledge(query)
            
            # 创建模型实例
            model = RoleMappedOpenAIChat(
                id='qwen3-30b-a3b-instruct-2507',
                api_key=model_config.api_key,
                base_url=model_config.api_base,
                max_tokens=50,
                temperature=0
            )
            
            judgment_prompt = f"""请判断以下用户问题是否需要检索知识库中的相关资料。

用户问题："{query}"

判断标准：
- 需要检索：涉及专业知识、技术问题、需要查找资料的复杂问题
- 不需要检索：简单问候、身份询问、使用帮助、感谢等日常对话

请只回答"是"或"否"，不要添加任何解释。"""

            response = model.invoke([{"role": "user", "content": judgment_prompt}])
            result = response.content.strip() if hasattr(response, 'content') else str(response).strip()
            should_search = "是" in result or ("需要" in result and "检索" in result)
            
            logger.info(f"[SMART_SEARCH] 问题: {query[:30]}... -> {result} -> {'检索' if should_search else '跳过'}")
            return should_search
            
        except Exception as e:
            logger.warning(f"qwen模型判断失败，使用简单规则: {e}")
            # 回退到简单规则
            return self._simple_should_search_knowledge(query)
    
    def _simple_should_search_knowledge(self, query: str) -> bool:
        """简单规则判断（LLM判断失败时的回退方案）"""
        query_lower = query.lower().strip()
        
        # 简单问候和身份询问，不需要检索
        if any(keyword in query_lower for keyword in ['你好', 'hello', '你是谁', 'who are you', '介绍', '谢谢', 'thank']):
            return False
            
        # 过短的问题通常不需要检索
        if len(query_lower) < 4:
            return False
        
        # 包含技术关键词的问题需要检索（移除了特定领域限制）
        if any(keyword in query_lower for keyword in ['如何', '什么是', '怎样', '原理', '方法', 'how', 'what', 'principle']):
            return True
            
        # 默认对中等长度的问题进行检索
        return len(query_lower) > 6
    
    async def _preprocess_knowledge_for_qwen235b(self, query: str, knowledge_retrieval_mode: str = 'all', collection_id: str = None) -> tuple[str, list]:
        """
        为qwen3-235b模型预处理知识库检索
        在模型调用前先完成检索，避免模型输出工具调用格式
        
        Returns:
            tuple: (search_result_text, knowledge_sources_list)
        """
        try:
            logger.info(f"[QWEN235B_KNOWLEDGE] 开始预检索: {query}")
            
            # 🔥 智能判断是否需要检索知识库
            if not self._should_search_knowledge(query):
                logger.info(f"[QWEN235B_KNOWLEDGE] 问题无需检索知识库，跳过: {query[:50]}...")
                return "", []
            
            # 设置检索模式和Collection ID
            CustomKnowledgeTools.set_retrieval_mode(knowledge_retrieval_mode)
            if collection_id:
                CustomKnowledgeTools.set_collection_id(collection_id)
            
            # 直接调用知识库检索服务
            knowledge_tools = CustomKnowledgeTools(collection_id)
            search_result = await knowledge_tools.search_knowledge_base(query, top_k=5, retrieval_mode=knowledge_retrieval_mode)
            
            # 🔥 获取详细的知识源数据用于溯源
            knowledge_sources = []
            if hasattr(knowledge_tools, '_last_search_results') and knowledge_tools._last_search_results:
                knowledge_sources = knowledge_tools._last_search_results
                logger.info(f"[QWEN235B_KNOWLEDGE] ✅ 获取到 {len(knowledge_sources)} 个知识源用于溯源")
            
            if search_result and search_result.strip():
                logger.info(f"[QWEN235B_KNOWLEDGE] 预检索成功，结果长度: {len(search_result)}")
                return search_result, knowledge_sources
            else:
                logger.info(f"[QWEN235B_KNOWLEDGE] 预检索无结果")
                return "", knowledge_sources
                
        except Exception as e:
            logger.error(f"[QWEN235B_KNOWLEDGE] 预检索异常: {e}")
            return "", []

    def _map_agent_name(self, agent_name: str) -> str:
        """映射智能体名称（中文ID到英文ID）"""
        return self.agent_name_mapping.get(agent_name, agent_name)
    
    async def register_session(self, session_id: str) -> None:
        """注册新的会话"""
        async with self._session_lock:
            self.active_sessions[session_id] = {
                'start_time': time.time(),
                'status': 'active',
                'task': None,
                'cancelled': False
            }
            logger.info(f"[SESSION] 注册会话: {session_id}")
    
    async def cancel_session(self, session_id: str) -> bool:
        """取消指定会话的所有任务"""
        async with self._session_lock:
            if session_id in self.active_sessions:
                session_info = self.active_sessions[session_id]
                session_info['cancelled'] = True
                session_info['status'] = 'cancelled'
                
                # 如果有活跃的任务，尝试取消
                if session_info.get('task') and not session_info['task'].done():
                    session_info['task'].cancel()
                    logger.info(f"[SESSION] 取消会话任务: {session_id}")
                
                logger.info(f"[SESSION] 会话已标记为取消: {session_id}")
                return True
            return False
    
    async def cleanup_session(self, session_id: str) -> None:
        """清理会话资源"""
        async with self._session_lock:
            if session_id in self.active_sessions:
                session_info = self.active_sessions[session_id]
                
                # 取消任何未完成的任务
                if session_info.get('task') and not session_info['task'].done():
                    session_info['task'].cancel()
                    try:
                        await session_info['task']
                    except asyncio.CancelledError:
                        pass
                
                # 移除会话记录
                del self.active_sessions[session_id]
                logger.info(f"[SESSION] 清理会话资源: {session_id}")
        
        # 清理Agent缓存（但保留Agno内存中的历史对话）
        async with self.agent_factory._agent_cache_lock:
            if session_id in self.agent_factory.session_agents:
                # 注意：这里不删除session_agents缓存，因为Agno的memory需要持久化
                # 只在明确需要清理所有历史时才删除
                logger.info(f"[SESSION] 保留Agent缓存以维持Agno内存: {session_id}")
    
    async def _build_query_with_history(self, current_query: str, session_id: str, max_history: int = 10) -> str:
        """构建包含历史对话的查询"""
        try:
            from db.repositories.conversation_repository import ConversationRepository
            from db.database import get_db_session
            
            async with get_db_session() as session:
                conversation_repo = ConversationRepository(session)
                
                # 获取历史对话记录
                history = await conversation_repo.get_conversation_history(
                    session_id=session_id,
                    limit=max_history  # 限制历史记录数量
                )
                
                if not history:
                    logger.info(f"[HISTORY] 会话 {session_id} 无历史记录")
                    return current_query
                
                # 组装历史对话为文本格式
                history_text = ""
                
                # 将消息按照用户-助手对进行组织
                messages = sorted(history, key=lambda x: x.get('id', 0))
                current_question = None
                
                for msg in messages:
                    if msg['type'] == 'user':
                        current_question = msg['content']
                    elif msg['type'] == 'ai' and current_question:
                        history_text += f"用户: {current_question}\n"
                        history_text += f"助手: {msg['content']}\n\n"
                        current_question = None
                
                # 构建包含上下文的完整查询
                enhanced_query = f"""以下是我们之前的对话历史：

{history_text}基于上述对话历史，请回答我的新问题：
{current_query}"""
                
                logger.info(f"[HISTORY] 会话 {session_id} 加载了 {len(history)} 条历史记录")
                return enhanced_query
                
        except Exception as e:
            logger.error(f"构建历史对话失败: {e}")
            return current_query
    
    async def is_session_cancelled(self, session_id: str) -> bool:
        """检查会话是否已被取消"""
        async with self._session_lock:
            if session_id in self.active_sessions:
                return self.active_sessions[session_id].get('cancelled', False)
            return True  # 会话不存在，视为已取消
    
    def set_session_task(self, session_id: str, task: asyncio.Task) -> None:
        """设置会话的活跃任务（同步方法，避免在生成器中使用async）"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id]['task'] = task
    
    async def _create_team_with_memory(self, team_name: str, session_id: str):
        """创建带有session-based memory的团队实例"""
        try:
            team_config = optimized_config_manager.get_agent_team_config(team_name)
            if not team_config:
                logger.error(f"未找到团队配置: {team_name}")
                return None
                
            # 创建团队成员，每个成员都带有相同的session_id以共享记忆
            members = []
            for member_name in team_config.members:
                agent = await self.agent_factory.get_agent(member_name, search_knowledge=True, session_id=session_id)
                if agent:
                    members.append(agent)
                else:
                    logger.warning(f"无法创建团队成员: {member_name}")
                    
            if not members:
                logger.error(f"团队 {team_name} 没有有效成员")
                return None
                
            # 创建协调器模型（也使用同样的session_id记忆配置）
            coordinator_config = optimized_config_manager.get_agent_config(team_config.coordinator)
            if not coordinator_config:
                logger.error(f"未找到协调器配置: {team_config.coordinator}")
                return None
                
            coordinator_model = self.agent_factory._create_agno_model(coordinator_config)
            if not coordinator_model:
                logger.error(f"无法创建协调器模型: {coordinator_config.model_provider}:{coordinator_config.model_id}")
                return None
                
            # 配置团队级别的memory（如果Agno Team支持的话）
            memory, storage = self.agent_factory._configure_agent_memory(session_id)
            
            # 创建团队
            team_params = {
                "name": team_config.name,
                "members": members,
                "model": coordinator_model,
                "expected_output": team_config.success_criteria,  # Agno 2.0.2中使用expected_output而非success_criteria
                "instructions": team_config.instructions,
                "show_members_responses": coordinator_config.show_tool_calls,  # Agno 2.0.2中使用show_members_responses
                "markdown": coordinator_config.markdown
            }
            
            # 如果Agno Team支持memory，添加memory配置
            if memory:
                team_params["memory"] = memory
            if storage:
                team_params["storage"] = storage
                
            from agno.team.team import Team
            team = Team(**team_params)
            
            logger.info(f"成功创建带memory的智能体团队: {team_name}，session_id: {session_id}")
            return team
            
        except Exception as e:
            logger.error(f"创建带memory的智能体团队 {team_name} 失败: {e}")
            return None
    
    async def single_agent_query(self, agent_name: str, query: str, stream: bool = False, model_name: str = None, model_params: dict = None, search_knowledge: bool = True, search_graph: bool = False, knowledge_retrieval_mode: str = 'all', session_id: str = None, collection_id: str = None):
        """单智能体查询 - 集成延迟优化"""
        start_time = time.time()
        preprocessing_start = start_time
        
        # 打印single_agent_query接收到的参数
        print("🔍 [AGENT SERVICE DEBUG] single_agent_query接收参数:")
        print(f"   agent_name: {repr(agent_name)}")
        print(f"   query: {repr(query)}")
        print(f"   stream: {repr(stream)}")
        print(f"   model_name: {repr(model_name)}")
        print(f"   model_params: {repr(model_params)}")
        print(f"   search_knowledge: {repr(search_knowledge)}")
        print(f"   search_graph: {repr(search_graph)}")
        print(f"   session_id: {repr(session_id)}")
        
        try:
            # 如果有session_id，获取历史对话并组装成完整的消息历史
            if session_id:
                enhanced_query = await self._build_query_with_history(query, session_id)
                print(f"📚 [HISTORY DEBUG] 历史对话增强:")
                print(f"   原始query: {repr(query)}")
                print(f"   增强后enhanced_query: {repr(enhanced_query)}")
            else:
                enhanced_query = query
                print(f"📝 [QUERY DEBUG] 无历史记录，使用原始query: {repr(query)}")
            
            # 映射智能体名称
            mapped_agent_name = self._map_agent_name(agent_name)
            agent_config = optimized_config_manager.get_agent_config(mapped_agent_name)
            
            # 检查是否为qwen3-235b模型
            is_qwen235b_model = any(pattern in agent_config.model_id.lower() for pattern in ["qwen3-235b", "qwen-235b", "235b"]) if agent_config else False
            if not is_qwen235b_model and model_name:
                is_qwen235b_model = any(pattern in model_name.lower() for pattern in ["qwen3-235b", "qwen-235b", "235b"])
            
            # qwen3-235b预检索逻辑：模型调用前先完成知识库检索
            qwen235b_knowledge_sources = []  # 用于存储qwen3-235b的知识源数据
            if is_qwen235b_model and search_knowledge:
                logger.info(f"[QWEN235B_PREPROCESS] 开始qwen3-235b预检索逻辑")
                try:
                    # 直接调用知识库检索函数
                    search_results, knowledge_sources = await self._preprocess_knowledge_for_qwen235b(enhanced_query, knowledge_retrieval_mode, collection_id)
                    qwen235b_knowledge_sources = knowledge_sources  # 保存知识源用于后续发送事件
                    
                    if search_results:
                        # 将检索结果添加到查询中
                        enhanced_query_with_context = f"{enhanced_query}\n\n参考资料：\n{search_results}"
                        logger.info(f"[QWEN235B_PREPROCESS] 预检索完成，找到{len(search_results)}字符的参考资料")
                        enhanced_query = enhanced_query_with_context
                    else:
                        logger.info(f"[QWEN235B_PREPROCESS] 预检索未找到相关资料，使用原始查询")
                        
                except Exception as e:
                    logger.error(f"[QWEN235B_PREPROCESS] 预检索失败: {e}")
                    # 失败时继续使用原始查询
            
            # 设置检索模式
            CustomKnowledgeTools.set_retrieval_mode(knowledge_retrieval_mode)
            
            # qwen3-235b使用预处理检索，Agent创建时应该禁用工具调用
            agent_search_knowledge = search_knowledge and not is_qwen235b_model
            
            agent = await self.agent_factory.get_agent(mapped_agent_name, agent_search_knowledge, session_id, search_graph, model_name)
            if not agent:
                logger.error(f"❌ 无法获取智能体: {mapped_agent_name}")
                if stream:
                    yield {
                        "type": "error",
                        "data": {
                            "error": f"无法找到智能体 {mapped_agent_name}，请检查配置",
                            "agent_name": mapped_agent_name,
                            "timestamp": time.time()
                        }
                    }
                    return
                else:
                    yield {
                        "type": "error",
                        "data": {
                            "error": f"无法找到智能体 {mapped_agent_name}，请检查配置",
                            "agent_name": mapped_agent_name,
                            "timestamp": time.time()
                        }
                    }
                    return
            
            # 🔥 简化方案：qwen3-235b不使用CustomApiTools，而是通过模型参数强制response_format
            if is_qwen235b_model and model_name and "qwen3-235b" in model_name.lower():
                logger.info(f"[QWEN235B_FACTORY_FIX] 检测到qwen3-235b，将在模型层面强制text格式")
            
            # 如果指定了模型名称，动态创建新的模型实例
            if model_name:
                agent_config = optimized_config_manager.get_agent_config(mapped_agent_name)
                if agent_config:
                    new_model = self.agent_factory._create_agno_model(agent_config, model_name)
                    if new_model:
                        # 应用延迟优化
                        if _has_latency_optimization and latency_optimization_service:
                            new_model = latency_optimization_service.optimize_agent_model(new_model)
                        
                        agent.model = new_model
                        logger.info(f"为智能体 {mapped_agent_name} 切换模型到: {model_name}")
                        
                        # 🔥 简化方案：qwen3-235b使用普通模型，通过参数强制response_format=text
                        if "qwen3-235b" in model_name.lower():
                            logger.info(f"[QWEN235B_SWITCH] 检测到qwen3-235b模型，强制设置response_format=text")
                            # 为qwen3-235b模型添加强制的response_format参数
                            if hasattr(agent.model, 'client') and hasattr(agent.model.client, 'default_query'):
                                # 尝试在模型客户端级别设置
                                logger.info(f"[QWEN235B_SWITCH] 尝试在客户端级别设置response_format")
                            else:
                                logger.info(f"[QWEN235B_SWITCH] 模型已切换，保持工具配置不变")
            
            # 应用模型参数
            if model_params and hasattr(agent, 'model'):
                try:
                    # 更新模型参数
                    if hasattr(agent.model, 'temperature') and 'temperature' in model_params:
                        agent.model.temperature = model_params['temperature']
                    if hasattr(agent.model, 'max_tokens') and 'max_tokens' in model_params:
                        agent.model.max_tokens = model_params['max_tokens']
                    if hasattr(agent.model, 'top_p') and 'top_p' in model_params:
                        agent.model.top_p = model_params['top_p']
                    logger.info(f"为智能体 {mapped_agent_name} 应用模型参数: {model_params}")
                except Exception as e:
                    logger.warning(f"应用模型参数失败: {e}")
            
            preprocessing_end = time.time()
            preprocessing_latency = preprocessing_end - preprocessing_start
            
            if stream:
                # 🔥 对于qwen3-235b模型，在开始流式响应前发送知识源事件
                if is_qwen235b_model and qwen235b_knowledge_sources:
                    logger.info(f"[QWEN235B_SOURCES] 🔍 发送qwen3-235b知识源事件: {len(qwen235b_knowledge_sources)} 个源")
                    
                    # 生成统计信息
                    source_types = {}
                    total_score = 0.0
                    for source in qwen235b_knowledge_sources:
                        source_type = source.get("source_type", "unknown")
                        source_types[source_type] = source_types.get(source_type, 0) + 1
                        total_score += source.get("score", 0.0)
                    
                    knowledge_stats = {
                        "total_sources": len(qwen235b_knowledge_sources),
                        "source_types": source_types,
                        "average_score": total_score / len(qwen235b_knowledge_sources) if qwen235b_knowledge_sources else 0.0,
                        "search_time": 0.0
                    }
                    
                    # 🔥 收集图谱检索结果（如果Agent调用了图谱工具）
                    graph_sources = {}
                    if search_graph and hasattr(agent, 'tools') and agent.tools:
                        logger.info(f"[KNOWLEDGE_EVENT] 🔍 检查Agent工具列表，总共 {len(agent.tools)} 个工具")
                        for i, tool in enumerate(agent.tools):
                            logger.info(f"[KNOWLEDGE_EVENT] 工具 {i+1}: {type(tool).__name__}")
                            if isinstance(tool, CustomKnowledgeTools):
                                logger.info(f"[KNOWLEDGE_EVENT] 找到CustomKnowledgeTools实例")
                                logger.info(f"[KNOWLEDGE_EVENT] 检查_last_graph_results: {hasattr(tool, '_last_graph_results')}")
                                if hasattr(tool, '_last_graph_results'):
                                    logger.info(f"[KNOWLEDGE_EVENT] _last_graph_results内容: {tool._last_graph_results}")
                                    if tool._last_graph_results:
                                        graph_sources = tool._last_graph_results
                                        logger.info(f"[KNOWLEDGE_EVENT] ✅ 包含图谱数据到knowledge_sources事件")
                                        break
                                    else:
                                        logger.warning(f"[KNOWLEDGE_EVENT] _last_graph_results为空")
                                else:
                                    logger.warning(f"[KNOWLEDGE_EVENT] CustomKnowledgeTools没有_last_graph_results属性")
                    else:
                        if not search_graph:
                            logger.info(f"[KNOWLEDGE_EVENT] search_graph=False，跳过图谱检索")
                        elif not hasattr(agent, 'tools'):
                            logger.warning(f"[KNOWLEDGE_EVENT] Agent没有tools属性")
                        elif not agent.tools:
                            logger.warning(f"[KNOWLEDGE_EVENT] Agent的tools为空")
                    
                    # 发送知识源事件（包含图谱数据）
                    knowledge_sources_event = {
                        "type": "knowledge_sources",
                        "data": {
                            "knowledge_sources": qwen235b_knowledge_sources,
                            "knowledge_stats": knowledge_stats,
                            "graph_sources": graph_sources,  # 🔥 添加图谱数据
                            "agent_name": mapped_agent_name,
                            "timestamp": time.time()
                        }
                    }
                    logger.info(f"[DEBUG] 🔥 knowledge_sources事件包含图谱数据: {bool(graph_sources)}")
                    yield knowledge_sources_event
                
                # 生成流式响应
                async for chunk in self._stream_agent_response(agent, enhanced_query, mapped_agent_name, agent_name, start_time, preprocessing_latency, session_id, search_graph):
                    yield chunk
                return
            else:
                # 执行非流式查询
                model_call_start = time.time()
                response = agent.run(enhanced_query, stream=False)
                model_call_end = time.time()
                model_call_latency = model_call_end - model_call_start
                processing_time = time.time() - start_time
                
                # 记录延迟指标
                if _has_latency_optimization and latency_optimization_service and LatencyMetrics:
                    metrics = LatencyMetrics(
                        first_token_latency=model_call_latency,  # 非流式情况下首token等于模型调用延迟
                        total_response_time=processing_time,
                        network_latency=0.0,  # 非流式无法精确测量网络延迟
                        model_call_latency=model_call_latency,
                        preprocessing_latency=preprocessing_latency,
                        timestamp=time.time()
                    )
                    latency_optimization_service.record_metrics(metrics)
                
                # 🔥 修复知识检索结果获取逻辑
                # 尝试从Agent运行结果中提取知识检索结果
                knowledge_sources = []
                knowledge_stats = {}
                
                # 🔥 对于qwen3-235b模型，使用预检索的知识源
                if is_qwen235b_model and qwen235b_knowledge_sources:
                    knowledge_sources = qwen235b_knowledge_sources
                    logger.info(f"[QWEN235B_NON_STREAM] ✅ 使用预检索的 {len(knowledge_sources)} 个知识源")
                    
                    # 生成统计信息
                    source_types = {}
                    total_score = 0.0
                    for source in knowledge_sources:
                        source_type = source.get("source_type", "unknown")
                        source_types[source_type] = source_types.get(source_type, 0) + 1
                        total_score += source.get("score", 0.0)
                    
                    knowledge_stats = {
                        "total_sources": len(knowledge_sources),
                        "source_types": source_types,
                        "average_score": total_score / len(knowledge_sources) if knowledge_sources else 0.0,
                        "search_time": 0.0
                    }
                
                else:
                    # 非qwen3-235b模型：优先从全局搜索结果获取最新的搜索结果
                    try:
                        # 检查全局搜索结果（由独立工具函数search_knowledge_base设置）
                        if _global_search_results:
                            knowledge_sources = _global_search_results.copy()
                            logger.info(f"[NON_STREAM] ✅ 从全局搜索结果获取到 {len(knowledge_sources)} 个知识源")
                        
                        # 如果全局搜索结果为空，尝试从CustomKnowledgeTools获取
                        if not knowledge_sources and hasattr(agent, 'tools') and agent.tools:
                            for tool in agent.tools:
                                if isinstance(tool, CustomKnowledgeTools):
                                    if hasattr(tool, '_last_search_results') and tool._last_search_results:
                                        knowledge_sources = tool._last_search_results
                                        logger.info(f"[NON_STREAM] ✅ 从CustomKnowledgeTools获取到 {len(knowledge_sources)} 个知识源")
                                        break
                        
                        # 如果仍然没有结果，尝试从Agno知识库适配器获取
                        if not knowledge_sources:
                            try:
                                from service.agno_knowledge_adapter import agno_knowledge_base
                                if hasattr(agno_knowledge_base, '_last_search_results') and agno_knowledge_base._last_search_results:
                                    # 转换Agno Document格式为标准格式
                                    for doc in agno_knowledge_base._last_search_results:
                                        if hasattr(doc, 'content') and hasattr(doc, 'meta_data'):
                                            knowledge_sources.append({
                                                "content": doc.content,
                                                "source_type": doc.meta_data.get("source_type", "document"),
                                                "score": doc.meta_data.get("score", 0.0),
                                                "title": doc.meta_data.get("title", ""),
                                                "source": doc.meta_data.get("source", ""),
                                                "metadata": doc.meta_data
                                            })
                                    logger.info(f"[NON_STREAM] ✅ 从AgnoKnowledgeAdapter获取到 {len(knowledge_sources)} 个知识源")
                            except Exception as adapter_e:
                                logger.warning(f"从AgnoKnowledgeAdapter获取知识源失败: {adapter_e}")
                    
                    except Exception as e:
                        logger.warning(f"获取知识检索结果失败: {e}")
                
                # 检查response是否包含知识检索结果（备用方法）
                if not knowledge_sources and hasattr(response, 'messages') and response.messages:
                    for message in response.messages:
                        if hasattr(message, 'tool_calls') and message.tool_calls:
                            for tool_call in message.tool_calls:
                                if hasattr(tool_call, 'function') and tool_call.function:
                                    tool_name = tool_call.function.name
                                    if tool_name in ['search_knowledge_base', 'search_qa_dataset', 'search_documents']:
                                        # 尝试解析工具调用结果
                                        if hasattr(tool_call, 'result') and tool_call.result:
                                            try:
                                                if isinstance(tool_call.result, list):
                                                    knowledge_sources.extend(tool_call.result)
                                                elif isinstance(tool_call.result, str):
                                                    import json
                                                    parsed_result = json.loads(tool_call.result)
                                                    if isinstance(parsed_result, list):
                                                        knowledge_sources.extend(parsed_result)
                                            except Exception as e:
                                                logger.warning(f"解析知识检索结果失败: {e}")
                
                # 生成知识库统计信息
                if knowledge_sources:
                    source_types = {}
                    total_score = 0.0
                    for source in knowledge_sources:
                        source_type = source.get("source_type", "unknown")
                        source_types[source_type] = source_types.get(source_type, 0) + 1
                        total_score += source.get("score", 0.0)
                    
                    knowledge_stats = {
                        "total_sources": len(knowledge_sources),
                        "source_types": source_types,
                        "average_score": total_score / len(knowledge_sources) if knowledge_sources else 0.0,
                        "search_time": model_call_latency
                    }
                    
                    logger.info(f"[NON_STREAM] 📊 知识检索统计: {len(knowledge_sources)} 个源，类型: {source_types}")
                else:
                    logger.warning(f"[NON_STREAM] ⚠️ 未获取到任何知识检索结果")
                
                # 🔥 图谱检索应该由Agent在工具调用时执行，收集最终结果
                graph_sources = {}
                if search_graph and hasattr(agent, 'tools') and agent.tools:
                    for tool in agent.tools:
                        if isinstance(tool, CustomKnowledgeTools):
                            if hasattr(tool, '_last_graph_results') and tool._last_graph_results:
                                graph_sources = tool._last_graph_results
                                logger.info(f"[GRAPH_RETRIEVAL] ✅ 从Agent工具获取图谱数据")
                                break
                    if not graph_sources:
                        logger.info(f"[GRAPH_RETRIEVAL] ⚠️ Agent未执行图谱检索或无结果数据")
                else:
                    logger.info(f"[GRAPH_RETRIEVAL] 图谱检索已禁用或Agent无工具")
                
                yield {
                    "type": "complete",
                    "data": {
                        "content": response.content if hasattr(response, 'content') else str(response),
                        "agent_name": mapped_agent_name,
                        "model_used": agent.model.id if hasattr(agent.model, 'id') else 'unknown',
                        "processing_time": processing_time,
                        "timestamp": time.time(),
                        "sources": knowledge_sources,  # 填充sources字段用于前端显示
                        "knowledge_sources": knowledge_sources,
                        "knowledge_stats": knowledge_stats,
                        "graph_sources": graph_sources,  # 知识图谱检索结果
                        "metadata": {
                            "query": query,
                            "timestamp": time.time(),
                            "original_agent_name": agent_name,
                            "search_knowledge": search_knowledge,
                            "search_graph": search_graph,
                            "latency_metrics": {
                                "preprocessing": preprocessing_latency,
                                "model_call": model_call_latency,
                                "total": processing_time
                            }
                        }
                    }
                }
                return
            
        except Exception as e:
            logger.error(f"单智能体查询失败 ({agent_name}): {e}")
            # 返回友好的错误响应而不是None
            processing_time = time.time() - start_time
            error_response = self._create_error_response(agent_name, query, str(e), processing_time)
            yield {
                "type": "error",
                "data": {
                    "content": error_response.content,
                    "agent_name": error_response.agent_name,
                    "model_used": error_response.model_used,
                    "processing_time": error_response.processing_time,
                    "timestamp": time.time(),
                    "error": True,
                    "metadata": error_response.metadata or {}
                }
            }
    
    def _create_error_response(self, agent_name: str, query: str, error_msg: str, processing_time: float) -> AgentResponse:
        """创建错误响应"""
        # 检查是否是网络连接问题
        if "502" in error_msg or "503" in error_msg or "ConnectionError" in error_msg or "Error code: 502" in error_msg:
            error_type = "网络连接"
            friendly_msg = "抱歉，AI服务暂时不可用，请稍后重试。如果问题持续存在，请联系管理员检查One-API网关服务状态。"
        elif "401" in error_msg or "403" in error_msg:
            error_type = "认证"
            friendly_msg = "抱歉，API认证失败，请联系管理员检查API密钥配置。"
        elif "429" in error_msg:
            error_type = "请求限制"
            friendly_msg = "抱歉，请求过于频繁，请稍后重试。"
        else:
            error_type = "系统"
            friendly_msg = "抱歉，处理您的请求时出现了问题，请稍后重试。"
        
        return AgentResponse(
            content=friendly_msg,
            agent_name=agent_name,
            model_used="error_fallback",
            processing_time=processing_time,
            confidence_score=0.0,
            sources=[],
            metadata={
                "error": True,
                "error_type": error_type,
                "query": query,
                "timestamp": time.time(),
                "original_error": error_msg
            }
        )
    
    async def _stream_agent_response(self, agent, query: str, mapped_agent_name: str, original_agent_name: str, start_time: float, preprocessing_latency: float = 0.0, session_id: str = None, search_graph: bool = False):
        """异步生成器方法，用于处理流式Agent响应"""
        logger.info(f"[STREAM] 开始智能体 {mapped_agent_name} 的流式查询")
        
        # 🔥 声明全局变量
        global _global_search_results
        
        # 初始化响应数据结构 - 修复response_data未定义的bug
        response_data = {
            "knowledge_sources": [],
            "knowledge_stats": {}
        }
        
        try:
            # 记录模型调用开始时间
            model_call_start_time = time.time()
            
            # 调用智能体（使用Agno框架的stream方法）
            try:
                # 设置更严格的参数，减少JSON错误
                agent_params = {
                    "max_tokens": 2048,
                    "temperature": 0.3,  # 提高温度确保模型在工具调用后继续生成回答
                }
                
                response = agent.run(query, stream=True, **agent_params)
                logger.info(f"[STREAM] Agent.run执行成功，响应类型: {type(response)}")
            except Exception as e:
                # 增强JSON格式错误和工具参数错误的处理
                error_str = str(e)
                if any(keyword in error_str for keyword in ["Unable to decode function arguments", "unmatched", "JSON", "decode", "Missing required argument", "validation error"]):
                    logger.warning(f"[TOOL_ERROR] 检测到工具调用或JSON格式错误: {error_str[:200]}")
                    
                    # 尝试多种fallback策略
                    fallback_attempts = [
                        # 1. 只保留thinking工具，禁用其他复杂工具
                        {"max_tokens": 1024, "temperature": 0.0, "tools": [ReasoningTools(add_instructions=True)]},
                        # 2. 使用更简单的配置重试
                        {"max_tokens": 1024, "temperature": 0.0, "tools": []},
                        # 3. 完全禁用工具和复杂功能
                        {"max_tokens": 512, "temperature": 0.0, "tools": [], "disable_tools": True},
                        # 4. 最简配置 - 纯文本模式
                        {"max_tokens": 256, "temperature": 0.0, "disable_all_features": True}
                    ]
                    
                    for i, fallback_config in enumerate(fallback_attempts):
                        try:
                            logger.info(f"[FALLBACK_{i+1}] 尝试fallback配置: {fallback_config}")
                            
                            # 创建极简化的智能体指令
                            if i == 0:
                                simplified_instructions = "请用中文简洁地回答问题，避免使用复杂的思考过程。直接给出答案。"
                            elif i == 1:
                                simplified_instructions = "请用中文直接回答问题，不要使用任何工具或思考过程。"
                            else:
                                simplified_instructions = "用中文回答问题。"
                            
                            # 暂时修改智能体指令和配置
                            original_instructions = agent.instructions
                            original_tools = getattr(agent, 'tools', [])
                            
                            agent.instructions = simplified_instructions
                            
                            # 在最后一次尝试时，移除所有工具
                            if i >= 1:
                                agent.tools = []
                            
                            # 准备调用参数
                            run_params = {}
                            for key, value in fallback_config.items():
                                if key not in ['disable_tools', 'disable_all_features']:
                                    run_params[key] = value
                            
                            response = agent.run(query, stream=False, **run_params)
                            
                            # 恢复原始配置
                            agent.instructions = original_instructions
                            agent.tools = original_tools
                            
                            if response:
                                logger.info(f"[FALLBACK_{i+1}] 成功获得响应")
                                yield {
                                    "type": "chunk",
                                    "data": {
                                        "content": str(response),
                                        "agent_name": mapped_agent_name,
                                        "model_used": getattr(agent.model, 'id', 'unknown'),
                                        "processing_time": time.time() - start_time,
                                        "original_agent_name": original_agent_name,
                                        "timestamp": time.time(),
                                        "fallback_mode": True,
                                        "fallback_reason": f"工具调用错误，使用简化模式{i+1}"
                                    }
                                }
                                yield {
                                    "type": "done",
                                    "data": {
                                        "agent_name": mapped_agent_name,
                                        "total_processing_time": time.time() - start_time,
                                        "timestamp": time.time(),
                                        "fallback_used": True
                                    }
                                }
                                return
                        except Exception as fallback_error:
                            logger.warning(f"[FALLBACK_{i+1}] 失败: {fallback_error}")
                            # 确保恢复原始配置
                            try:
                                agent.instructions = original_instructions
                                agent.tools = original_tools
                            except:
                                pass
                            continue
                    
                    # 所有fallback都失败了
                    logger.error(f"[FALLBACK_ALL_FAILED] 所有fallback策略都失败")
                
                logger.error(f"智能体 {mapped_agent_name} 调用失败: {e}")
                # 提供更有用的错误信息
                error_message = self._format_user_friendly_error(str(e))
                
                yield {
                    "type": "error",
                    "data": {
                        "error": error_message,
                        "agent_name": mapped_agent_name,
                        "timestamp": time.time(),
                        "original_error": str(e)[:200]  # 限制错误信息长度
                    }
                }
                return

            model_call_end_time = time.time()
            model_call_latency = model_call_end_time - model_call_start_time
            
            # 处理流式响应
            if hasattr(response, '__iter__') and not isinstance(response, (str, dict)):
                logger.info(f"智能体 {mapped_agent_name} 获得真正的流式响应")
                sent_thinking_ids = set()
                accumulated_content = ""
                thinking_extracted = False
                first_event_time = None
                
                for event in response:
                    # 检查会话是否被取消
                    if session_id and session_id in self.active_sessions:
                        if self.active_sessions[session_id].get('cancelled', False):
                            logger.info(f"[INTERRUPT] 会话已取消，停止流式响应: {session_id}")
                            break
                    
                    current_time = time.time()
                    if first_event_time is None:
                        first_event_time = current_time
                    
                    event_type = getattr(event, 'event', 'UnknownEvent')
                    event_content = getattr(event, 'content', None)
                    
                    # 🔥 添加详细的事件调试信息
                    logger.info(f"[STREAM_DEBUG] 事件类型: {event_type}, 内容: {str(event_content)[:100] if event_content else 'None'}...")
                    
                    should_process_content = True
                    content_str = ""
                    
                    if event_type == 'ToolCallStarted':
                        tool_info = getattr(event, 'tool', None)
                        if tool_info:
                            tool_name = getattr(tool_info, 'tool_name', '')
                            tool_args = getattr(tool_info, 'tool_args', {})
                            
                            # 处理思考工具
                            if tool_name == 'think':
                                logger.info(f"[THINKING_DETECTION] 检测到think工具调用")
                                logger.info(f"[THINKING_ARGS] 工具参数: {tool_args}")
                                
                                if 'thought' in tool_args:
                                    logger.info(f"[THINKING_PROCESS] 开始处理thinking数据")
                                    # 清理和格式化思考内容，避免JSON编码问题
                                    thought_content = tool_args.get('thought', '')
                                    title_content = tool_args.get('title', '思考中...')
                                    
                                    # 强化字符清理：处理复杂的中文内容和特殊字符
                                    if isinstance(thought_content, str):
                                        # 1. 先限制长度避免过长内容导致的问题
                                        if len(thought_content) > 1000:
                                            thought_content = thought_content[:1000] + "..."
                                        
                                        # 2. 清理和规范化文本，确保JSON安全
                                        # 移除控制字符
                                        thought_content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', thought_content)
                                        
                                        # 规范化换行符和空白字符
                                        thought_content = re.sub(r'\r\n|\r', '\n', thought_content)
                                        thought_content = re.sub(r'\n+', ' | ', thought_content)  # 将换行替换为分隔符
                                        thought_content = re.sub(r'\s+', ' ', thought_content).strip()
                                        
                                        # 3. 处理可能导致JSON问题的字符
                                        thought_content = thought_content.replace('\\', '/')
                                        thought_content = thought_content.replace('"', "'")
                                        thought_content = thought_content.replace('\b', ' ')
                                        thought_content = thought_content.replace('\f', ' ')
                                        thought_content = thought_content.replace('\t', ' ')
                                        
                                        # 4. 确保内容不为空
                                        if not thought_content.strip():
                                            thought_content = "正在思考中..."
                                    
                                    if isinstance(title_content, str):
                                        title_content = title_content.replace('"', "'").replace('\\', '/')
                                        if len(title_content) > 100:
                                            title_content = title_content[:100] + "..."
                                    
                                    # 检查是否有可用的检索结果
                                    current_search_results = []
                                    if _global_search_results:
                                        current_search_results = _global_search_results.copy()
                                    
                                    thinking_event = {
                                        "type": "thinking",
                                        "title": title_content,
                                        "content": thought_content,
                                        "timestamp": time.time(),
                                        "search_results": current_search_results  # 包含检索结果
                                    }
                                    
                                    try:
                                        # 安全的JSON编码
                                        json_data = json.dumps(thinking_event, ensure_ascii=False, separators=(',', ':'))
                                        
                                        # 🔥 添加详细调试信息 - 完整数据检查
                                        logger.info(f"[THINKING_DEBUG] 准备发送的thinking_event对象: {thinking_event}")
                                        logger.info(f"[THINKING_DEBUG] JSON序列化后的数据: {json_data}")
                                        logger.info(f"[THINKING_DEBUG] 完整SSE格式: data: {json_data}\\n\\n")
                                        logger.info(f"[THINKING_DEBUG] JSON数据长度: {len(json_data)} 字符")
                                        logger.info(f"[THINKING_DEBUG] JSON数据类型: {type(json_data)}")
                                        
                                        # 🔥 修复格式不一致问题：发送字典格式而不是SSE字符串格式
                                        yield thinking_event  # 直接yield字典，与其他事件格式一致
                                        logger.info(f"[THINKING_DEBUG] 实际yield的数据: {thinking_event}")
                                        
                                    except (TypeError, ValueError) as json_error:
                                        logger.warning(f"[THINKING] JSON编码失败: {json_error}")
                                        # 检查是否有可用的检索结果
                                        current_search_results = []
                                        if _global_search_results:
                                            current_search_results = _global_search_results.copy()
                                        
                                        # 发送简化的thinking事件 - 也改为字典格式
                                        fallback_event = {
                                            "type": "thinking",
                                            "title": "思考中...",
                                            "content": "正在分析您的问题",
                                            "timestamp": time.time(),
                                            "search_results": current_search_results  # 包含检索结果
                                        }
                                        yield fallback_event  # 直接yield字典
                                        logger.info(f"[THINKING] 发送fallback thinking事件: {fallback_event}")
                                else:
                                    logger.warning(f"[THINKING] think工具调用缺少'thought'参数: {tool_args}")
                            
                            # 处理知识检索工具 - 新增
                            elif tool_name in ['search_knowledge_base', 'search_qa_dataset', 'search_documents']:
                                search_event = {
                                    "type": "knowledge_search",
                                    "tool": tool_name,
                                    "query": tool_args.get('query', ''),
                                    "status": "searching",
                                    "timestamp": time.time()
                                }
                                logger.info(f"[KNOWLEDGE_SEARCH] 🔍 开始检索: {tool_name}({tool_args.get('query', '')})")
                                yield search_event
                    
                    # 处理工具调用完成事件 - 新增知识检索结果处理
                    elif event_type == 'ToolCallCompleted':
                        tool_info = getattr(event, 'tool', None)
                        if tool_info:
                            tool_name = getattr(tool_info, 'tool_name', '')
                            tool_result = getattr(event, 'result', None)
                            
                            # 处理知识检索工具完成
                            if tool_name in ['search_knowledge_base', 'search_qa_dataset', 'search_documents']:
                                knowledge_results = []
                                
                                # 🔥 修复：优先从工具实例获取真实搜索结果
                                if hasattr(agent, 'tools') and agent.tools:
                                    for tool in agent.tools:
                                        if isinstance(tool, CustomKnowledgeTools):
                                            if hasattr(tool, '_last_search_results') and tool._last_search_results:
                                                knowledge_results = tool._last_search_results
                                                logger.info(f"[KNOWLEDGE_SEARCH] ✅ 从工具实例获取到 {len(knowledge_results)} 个实际结果")
                                                break
                                
                                # 如果工具实例中没有，尝试从全局变量获取
                                if not knowledge_results and _global_search_results:
                                    knowledge_results = _global_search_results
                                    logger.info(f"[KNOWLEDGE_SEARCH] ✅ 从全局变量获取到 {len(knowledge_results)} 个结果")
                                
                                # 如果还是没有，尝试解析工具返回结果
                                if not knowledge_results:
                                    if isinstance(tool_result, list):
                                        knowledge_results = tool_result
                                    elif isinstance(tool_result, str):
                                        try:
                                            # 尝试解析JSON格式的结果
                                            knowledge_results = json.loads(tool_result)
                                        except:
                                            # 如果解析失败，作为文本处理
                                            knowledge_results = [{"content": tool_result, "source": tool_name}]
                                
                                # 累积知识检索结果
                                response_data["knowledge_sources"].extend(knowledge_results)
                                
                                # 🔥 立即发送knowledge_sources事件（在工具调用完成时）
                                if knowledge_results:
                                    # 生成统计信息
                                    source_types = {}
                                    total_score = 0.0
                                    for source in knowledge_results:
                                        source_type = source.get("source_type", "unknown")
                                        source_types[source_type] = source_types.get(source_type, 0) + 1
                                        total_score += source.get("score", 0.0)
                                    
                                    knowledge_stats = {
                                        "total_sources": len(knowledge_results),
                                        "source_types": source_types,
                                        "average_score": total_score / len(knowledge_results) if knowledge_results else 0.0,
                                        "search_time": 0.0
                                    }
                                    
                                    # 🔥 收集图谱检索结果（如果Agent调用了图谱工具）
                                    graph_sources = {}
                                    if search_graph and hasattr(agent, 'tools') and agent.tools:
                                        for tool in agent.tools:
                                            if isinstance(tool, CustomKnowledgeTools):
                                                if hasattr(tool, '_last_graph_results') and tool._last_graph_results:
                                                    graph_sources = tool._last_graph_results
                                                    logger.info(f"[KNOWLEDGE_SEARCH] ✅ 包含图谱数据到knowledge_sources事件")
                                                    break
                                    
                                    # 立即发送独立的knowledge_sources事件（包含图谱数据）
                                    knowledge_sources_event = {
                                        "type": "knowledge_sources",
                                        "data": {
                                            "knowledge_sources": knowledge_results,
                                            "knowledge_stats": knowledge_stats,
                                            "graph_sources": graph_sources,  # 🔥 添加图谱数据
                                            "agent_name": mapped_agent_name,
                                            "timestamp": time.time()
                                        }
                                    }
                                    logger.info(f"[KNOWLEDGE_SEARCH] 🔍 立即发送knowledge_sources事件: {len(knowledge_results)} 个源")
                                    yield knowledge_sources_event
                                    
                                    # 清空全局变量避免重复发送
                                    try:
                                        _global_search_results = []
                                        logger.info(f"[KNOWLEDGE_SEARCH] 清空全局搜索结果变量")
                                    except:
                                        pass
                                
                                # 发送知识检索完成事件
                                search_result_event = {
                                    "type": "knowledge_search_complete",
                                    "tool": tool_name,
                                    "results": knowledge_results,
                                    "count": len(knowledge_results),
                                    "timestamp": time.time()
                                }
                                logger.info(f"[KNOWLEDGE_SEARCH] ✅ 检索完成: {tool_name} - {len(knowledge_results)} 个结果")
                                yield search_result_event
                            
                            # 🔥 处理图谱检索工具完成 - 发送补充的knowledge_sources事件
                            elif tool_name == 'search_knowledge_graph':
                                logger.info(f"[GRAPH_SEARCH] ✅ 图谱检索工具调用完成")
                                
                                # 从工具实例获取图谱数据
                                graph_sources = {}
                                if hasattr(agent, 'tools') and agent.tools:
                                    for tool in agent.tools:
                                        if isinstance(tool, CustomKnowledgeTools):
                                            if hasattr(tool, '_last_graph_results') and tool._last_graph_results:
                                                graph_sources = tool._last_graph_results
                                                logger.info(f"[GRAPH_SEARCH] 🔍 获取到图谱数据: {len(graph_sources.get('sources', []))} 个来源")
                                                break
                                
                                # 如果有图谱数据，发送补充的knowledge_sources事件
                                if graph_sources:
                                    # 获取之前收集的知识库数据
                                    existing_knowledge_sources = response_data.get("knowledge_sources", [])
                                    
                                    # 生成图谱数据的统计信息
                                    graph_stats = {
                                        "total_sources": len(graph_sources.get('sources', [])),
                                        "source_types": {"graph_query_result": len(graph_sources.get('sources', []))},
                                        "average_score": 0.95,  # 图谱结果给予高评分
                                        "search_time": graph_sources.get('query_time', 0.0)
                                    }
                                    
                                    # 发送包含图谱数据的补充knowledge_sources事件
                                    supplementary_knowledge_event = {
                                        "type": "knowledge_sources_update",  # 使用update类型区分补充事件
                                        "data": {
                                            "knowledge_sources": existing_knowledge_sources,  # 包含之前的知识库数据
                                            "knowledge_stats": {"total_sources": len(existing_knowledge_sources)},
                                            "graph_sources": graph_sources,  # 🔥 图谱数据
                                            "graph_stats": graph_stats,
                                            "agent_name": mapped_agent_name,
                                            "timestamp": time.time()
                                        }
                                    }
                                    logger.info(f"[GRAPH_SEARCH] 🎯 发送补充的knowledge_sources_update事件")
                                    yield supplementary_knowledge_event
                                else:
                                    logger.warning(f"[GRAPH_SEARCH] ❌ 图谱检索完成但无数据")
                    
                    elif event_type == 'RunResponseContent':
                        if event_content is not None:
                            content_str = str(event_content)
                            logger.info(f"[FILTER_DEBUG] RunResponseContent内容: '{content_str[:100]}'")
                            # 简化过滤逻辑 - 过滤工具调用和检索内容显示
                            if any(pattern in content_str for pattern in [
                                'think(title=', 'search_knowledge_base(', 
                                '{"name": "search_knowledge_base"', '{"name": "think"',
                                '以下是检索到的相关资料：', '【qa_dataset】', '【document】',
                                '已检索到', '条相关资料'
                            ]):
                                should_process_content = False
                                logger.info(f"[FILTER_DEBUG] ❌ 过滤工具调用片段: {content_str[:50]}...")
                            else:
                                accumulated_content += content_str
                                logger.info(f"[FILTER_DEBUG] ✅ 通过内容: '{content_str[:50]}...' 累积长度: {len(accumulated_content)}")
                        else:
                            should_process_content = False
                            logger.info(f"[FILTER_DEBUG] ❌ event_content为None")
                    
                    else:
                        # 其他事件类型的简化处理
                        if event_content is not None:
                            content_str = str(event_content)
                            # 与RunResponseContent保持一致的过滤逻辑
                            if any(pattern in content_str for pattern in [
                                'think(title=', 'search_knowledge_base(', 
                                '{"name": "search_knowledge_base"', '{"name": "think"',
                                '以下是检索到的相关资料：', '【qa_dataset】', '【document】',
                                '已检索到', '条相关资料'
                            ]):
                                should_process_content = False
                                logger.debug(f"[FILTER] 过滤其他事件工具调用: {content_str[:50]}...")
                            else:
                                accumulated_content += content_str
                        else:
                            should_process_content = False
                    
                    # 发送处理过的内容
                    if should_process_content and content_str.strip():
                        logger.info(f"[SEND_DEBUG] ✅ 发送内容块: '{content_str[:50]}...' 长度: {len(content_str)}")
                        yield {
                            "type": "chunk",
                            "data": {
                                "content": content_str,
                                "agent_name": mapped_agent_name,
                                "model_used": getattr(agent.model, 'id', 'unknown'),
                                "processing_time": time.time() - start_time,
                                "original_agent_name": original_agent_name,
                                "timestamp": time.time()
                            }
                        }
                    else:
                        logger.info(f"[SEND_DEBUG] ❌ 跳过内容: should_process={should_process_content}, content_length={len(content_str.strip()) if content_str else 0}")
                
                # 🔥 添加循环结束后的调试信息
                logger.info(f"[STREAM_DEBUG] 流式响应循环结束")
                logger.info(f"[STREAM_DEBUG] 累积内容长度: {len(accumulated_content)} 字符")
                logger.info(f"[STREAM_DEBUG] 累积内容预览: '{accumulated_content[:200]}...'")
                
                # 🔥 如果流式响应没有最终回复内容，手动获取非流式回复
                if len(accumulated_content.strip()) < 20:  # 内容太少，可能缺少最终回复
                    logger.info(f"[STREAM_DEBUG] 流式内容不足，尝试获取非流式最终回复")
                    try:
                        # 重新运行Agent获取完整回复
                        final_response = agent.run(query, stream=False)
                        final_content = final_response.content if hasattr(final_response, 'content') else str(final_response)
                        
                        if final_content and len(final_content.strip()) > 20:
                            logger.info(f"[STREAM_DEBUG] 获取到非流式最终回复，长度: {len(final_content)} 字符")
                            
                            # 分块发送最终内容，模拟流式效果
                            chunk_size = 50
                            for i in range(0, len(final_content), chunk_size):
                                chunk_text = final_content[i:i+chunk_size]
                                yield {
                                    "type": "chunk",
                                    "data": {
                                        "content": chunk_text,
                                        "agent_name": mapped_agent_name,
                                        "model_used": getattr(agent.model, 'id', 'unknown'),
                                        "processing_time": time.time() - start_time,
                                        "original_agent_name": original_agent_name,
                                        "timestamp": time.time()
                                    }
                                }
                        else:
                            logger.warning(f"[STREAM_DEBUG] 非流式回复也为空或太短: {len(final_content) if final_content else 0}")
                            
                    except Exception as e:
                        logger.error(f"[STREAM_DEBUG] 获取非流式回复失败: {e}")
                        
                # 🔥 移除累积内容重复发送逻辑 - 避免重复渲染
                # elif accumulated_content.strip():
                #     logger.info(f"[STREAM_DEBUG] 发现未发送的累积内容，尝试发送最终内容块")
                #     yield {
                #         "type": "chunk", 
                #         "data": {
                #             "content": accumulated_content.strip(),
                #             "agent_name": mapped_agent_name,
                #             "model_used": getattr(agent.model, 'id', 'unknown'),
                #             "processing_time": time.time() - start_time,
                #             "original_agent_name": original_agent_name,
                #             "timestamp": time.time()
                #         }
                #     }
                logger.info(f"[STREAM_DEBUG] 流式响应正常结束，不发送累积内容避免重复")
                
                # 🔥 注意：知识源事件已在工具调用完成时立即发送，这里不再重复发送
                logger.info(f"[STREAM] 知识源事件已在工具调用完成时发送，跳过重复发送")
                
                # 🔥 图谱检索应该由Agent在工具调用时执行，不在流式响应结束后手动执行
                logger.info(f"[STREAM] 图谱检索由Agent工具调用处理，不需要手动执行")
                # 🔥 修复：发送done事件，包含图谱数据供前端保存
                logger.info(f"[STREAM] ✅ 发送done事件，结束对话")
                
                # 收集最终的图谱数据
                final_graph_sources = {}
                if search_graph and hasattr(agent, 'tools') and agent.tools:
                    for tool in agent.tools:
                        if isinstance(tool, CustomKnowledgeTools):
                            if hasattr(tool, '_last_graph_results') and tool._last_graph_results:
                                final_graph_sources = tool._last_graph_results
                                logger.info(f"[STREAM] 📊 Done事件包含图谱数据: {len(str(final_graph_sources))} 字符")
                                break
                
                yield {
                    "type": "done",
                    "data": {
                        "agent_name": mapped_agent_name,
                        "total_processing_time": time.time() - start_time,
                        "timestamp": time.time(),
                        "graph_sources": final_graph_sources if final_graph_sources else {}  # 🔥 添加图谱数据
                    }
                }
                return
            
            else:
                # 非流式响应处理
                logger.info(f"智能体 {mapped_agent_name} 返回非流式响应")
                content = str(response) if response else "无响应内容"
                
                yield {
                    "type": "chunk",
                    "data": {
                        "content": content,
                        "agent_name": mapped_agent_name,
                        "model_used": getattr(agent.model, 'id', 'unknown'),
                        "processing_time": time.time() - start_time,
                        "original_agent_name": original_agent_name,
                        "timestamp": time.time()
                    }
                }
                
                yield {
                    "type": "done",
                    "data": {
                        "agent_name": mapped_agent_name,
                        "total_processing_time": time.time() - start_time,
                        "timestamp": time.time(),
                        "graph_sources": graph_sources if graph_sources else {}  # 🔥 添加图谱数据
                    }
                }
                return
                
        except Exception as e:
            logger.error(f"流式查询失败: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            # 🔥 增强异常类型识别和处理
            error_str = str(e)
            error_type = type(e).__name__
            
            # 特殊处理超时错误
            if "timeout" in error_str.lower() or "ReadTimeout" in error_type or "TimeoutError" in error_type:
                logger.warning(f"[TIMEOUT_HANDLER] 检测到超时错误: {error_type} - {error_str[:200]}")
                
                # 尝试生成部分响应而不是完全失败
                if accumulated_content and len(accumulated_content.strip()) > 10:
                    logger.info(f"[TIMEOUT_RECOVERY] 发送部分内容: {len(accumulated_content)} 字符")
                    yield {
                        "type": "chunk",
                        "data": {
                            "content": "\n\n[因网络超时，响应可能不完整]",
                            "agent_name": mapped_agent_name,
                            "model_used": getattr(agent.model, 'id', 'unknown'),
                            "processing_time": time.time() - start_time,
                            "original_agent_name": original_agent_name,
                            "timestamp": time.time(),
                            "partial_response": True,
                            "timeout_recovery": True
                        }
                    }
                
                # 发送超时错误信息
                yield {
                    "type": "error",
                    "data": {
                        "error": "模型响应超时，请稍后重试。如果问题持续存在，请尝试使用更简短的问题。",
                        "error_type": "timeout",
                        "agent_name": mapped_agent_name,
                        "timestamp": time.time(),
                        "original_error": f"{error_type}: {error_str[:200]}",
                        "retry_suggestion": "建议：缩短问题长度或稍后重试"
                    }
                }
                return
            
            # 处理连接错误
            elif any(keyword in error_str.lower() for keyword in ["connection", "network", "httpcore", "httpx"]):
                logger.warning(f"[CONNECTION_ERROR] 检测到连接错误: {error_type} - {error_str[:200]}")
                yield {
                    "type": "error",
                    "data": {
                        "error": "网络连接出现问题，请检查网络状态后重试",
                        "error_type": "connection",
                        "agent_name": mapped_agent_name,
                        "timestamp": time.time(),
                        "original_error": f"{error_type}: {error_str[:200]}",
                        "retry_suggestion": "建议：检查网络连接后重试"
                    }
                }
                return
            
            # 处理模型API错误
            elif any(keyword in error_str for keyword in ["API", "401", "403", "429", "quota", "rate limit"]):
                logger.warning(f"[API_ERROR] 检测到API错误: {error_type} - {error_str[:200]}")
                yield {
                    "type": "error",
                    "data": {
                        "error": "模型服务暂时不可用，请稍后重试",
                        "error_type": "api_error",
                        "agent_name": mapped_agent_name,
                        "timestamp": time.time(),
                        "original_error": f"{error_type}: {error_str[:200]}",
                        "retry_suggestion": "建议：等待片刻后重试"
                    }
                }
                return
            
            # 生成友好的错误响应
            error_message = self._format_user_friendly_error(str(e))
            
            yield {
                "type": "error",
                "data": {
                    "error": error_message,
                    "error_type": "general",
                    "agent_name": mapped_agent_name,
                    "timestamp": time.time(),
                    "original_error": f"{error_type}: {error_str[:200]}"
                }
            }
    
    def _parse_thinking_content(self, content: str) -> Tuple[List[Dict], str]:
        """基于标签解析thinking数据和最终答案 - 通用方法，适应不同模型"""
        thinking_data = []
        final_content = content
        
        try:
            import re
            
            # 1. 提取XML风格的thinking标签内容
            thinking_data.extend(self._extract_xml_thinking_tags(content))
            
            # 2. 提取JSON格式的thinking对象
            thinking_data.extend(self._extract_json_thinking_objects(content))
            
            # 3. 移除所有已提取的thinking内容
            final_content = self._remove_thinking_sections(content)
            
            # 4. 提取最终答案标签内容
            final_content = self._extract_final_answer(final_content)
            
            # 不再生成虚假的thinking数据，保持内容真实性
            # 只返回从实际内容中解析到的真实thinking数据
            
        except Exception as e:
            logger.warning(f"解析thinking数据失败: {e}")
            # 发生错误时，至少保证能返回原始内容
            final_content = content
        
        return thinking_data, final_content
    
    def _extract_xml_thinking_tags(self, content: str) -> List[Dict]:
        """提取XML风格的thinking标签"""
        thinking_data = []
        import re
        
        # 支持多种thinking标签格式
        tag_patterns = [
            (r'<thinking>(.*?)</thinking>', 'thinking'),
            (r'<thought>(.*?)</thought>', 'thought'),
            (r'<reasoning>(.*?)</reasoning>', 'reasoning'),
            (r'<analysis>(.*?)</analysis>', 'analysis'),
            (r'<步骤>(.*?)</步骤>', 'step'),
            (r'<思考>(.*?)</思考>', 'thinking'),
            (r'<分析>(.*?)</分析>', 'analysis')
        ]
        
        for pattern, tag_type in tag_patterns:
            matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
            for match in matches:
                thinking_data.append({
                    "name": tag_type,
                    "arguments": {
                        "title": f"{tag_type.title()}",
                        "thought": match.strip(),
                        "confidence": 0.9
                    }
                })
        
        return thinking_data
    
    def _extract_json_thinking_objects(self, content: str) -> List[Dict]:
        """提取JSON格式的thinking对象 - 不限制特定的name值"""
        thinking_data = []
        import json
        import re
        
        # 寻找JSON对象模式
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        potential_jsons = re.findall(json_pattern, content)
        
        for json_str in potential_jsons:
            try:
                json_obj = json.loads(json_str)
                if isinstance(json_obj, dict):
                    # 检查是否看起来像thinking对象（有name字段或thinking相关字段）
                    if ('name' in json_obj or 
                        'thought' in json_obj or 
                        'reasoning' in json_obj or
                        'analysis' in json_obj or
                        'arguments' in json_obj):
                        thinking_data.append(json_obj)
            except json.JSONDecodeError as e:
                # 🔥 新增：尝试修复JSON格式错误，特别是多余的右花括号
                logger.warning(f"[JSON_FIX] JSON解析失败: {e}, 尝试修复...")
                logger.debug(f"[JSON_FIX] 原始JSON: {json_str[:200]}...")
                
                try:
                    # 修复方法1: 移除多余的右花括号
                    fixed_json = json_str.strip()
                    open_braces = fixed_json.count('{')
                    close_braces = fixed_json.count('}')
                    
                    if close_braces > open_braces:
                        excess = close_braces - open_braces
                        logger.info(f"[JSON_FIX] 检测到{excess}个多余的右花括号")
                        
                        # 从末尾移除多余的右花括号
                        for _ in range(excess):
                            last_brace = fixed_json.rfind('}')
                            if last_brace != -1:
                                fixed_json = fixed_json[:last_brace] + fixed_json[last_brace+1:]
                        
                        logger.info(f"[JSON_FIX] 修复后: {fixed_json[-50:]}")
                        json_obj = json.loads(fixed_json)
                        
                        if isinstance(json_obj, dict) and ('name' in json_obj or 'thought' in json_obj or 'reasoning' in json_obj or 'analysis' in json_obj or 'arguments' in json_obj):
                            thinking_data.append(json_obj)
                            logger.info(f"[JSON_FIX] 修复成功，添加thinking对象")
                        
                except json.JSONDecodeError:
                    # 修复方法2: 手动解析title和thought字段
                    try:
                        logger.warning(f"[JSON_FIX] 尝试手动解析字段...")
                        title_match = re.search(r'"title":\s*"([^"]*)"', json_str)
                        thought_match = re.search(r'"thought":\s*"(.*?)"(?:\s*})*$', json_str, re.DOTALL)
                        
                        if title_match and thought_match:
                            manual_obj = {
                                "title": title_match.group(1),
                                "thought": thought_match.group(1).replace('\\n', '\n')
                            }
                            thinking_data.append(manual_obj)
                            logger.info(f"[JSON_FIX] 手动解析成功: title={manual_obj['title'][:30]}...")
                        else:
                            logger.error(f"[JSON_FIX] 手动解析也失败，跳过此JSON")
                    except Exception as manual_error:
                        logger.error(f"[JSON_FIX] 手动解析异常: {manual_error}")
                        continue
        
        return thinking_data
    
    def _remove_thinking_sections(self, content: str) -> str:
        """移除所有thinking相关的标签和JSON对象"""
        import re
        
        # 移除XML风格的thinking标签
        thinking_tag_patterns = [
            r'<thinking>.*?</thinking>',
            r'<thought>.*?</thought>',
            r'<reasoning>.*?</reasoning>',
            r'<analysis>.*?</analysis>',
            r'<步骤>.*?</步骤>',
            r'<思考>.*?</思考>',
            r'<分析>.*?</分析>'
        ]
        
        for pattern in thinking_tag_patterns:
            content = re.sub(pattern, '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # 移除JSON thinking对象
        json_pattern = r'\{[^{}]*(?:"(?:name|thought|reasoning|analysis|arguments)"[^{}]*)+[^{}]*\}'
        content = re.sub(json_pattern, '', content, flags=re.DOTALL)
        
        return content
    
    def _extract_final_answer(self, content: str) -> str:
        """提取最终答案内容 - 兼容有标签和无标签的格式"""
        import re
        
        # 支持多种最终答案标签格式
        answer_patterns = [
            r'<final_answer>(.*?)</final_answer>',
            r'<answer>(.*?)</answer>',
            r'<response>(.*?)</response>',
            r'<回答>(.*?)</回答>',
            r'<答案>(.*?)</答案>'
        ]
        
        for pattern in answer_patterns:
            match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # 如果没有找到标签，但内容看起来是正常的回答文本，直接返回
        # 先移除可能的thinking内容标记
        cleaned_content = content.strip()
        
        # 移除HTML标签（如<sup>等）
        cleaned_content = re.sub(r'<[^>]+>', '', cleaned_content)
        
        # 如果内容包含正常的回答特征（中文句子、段落等），保留
        if (len(cleaned_content) > 20 and 
            (re.search(r'[\u4e00-\u9fff]', cleaned_content) or  # 包含中文
             re.search(r'[a-zA-Z].*[.!?]', cleaned_content))):   # 包含英文句子
            return cleaned_content
        
        # 否则返回原内容
        return content.strip()
    
    def _clean_chunk_content(self, content: str) -> str:
        """基于标签解析的内容清理 - 通用方法，适用于不同模型"""
        if not content:
            return ""
        
        import re
        
        # 检查是否在thinking标签内（这种内容应该被过滤掉）
        if self._is_in_thinking_section(content):
            return ""
        
        # 移除JSON结构片段
        if self._is_json_fragment(content):
            return ""
        
        # 移除函数调用完成信息
        content = re.sub(r'[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\)\s*completed\s*in\s*[\d.]+s\.?', '', content)
        
        # 移除代码块标记
        content = re.sub(r'```(?:json|xml|html)?\s*', '', content)
        
        # 对于正常的文本内容（包含中文字符或有意义的英文），直接保留
        if self._is_meaningful_content(content):
            # 只做基本清理，保留正常文本
            content = re.sub(r'\n\s*\n+', '\n', content)
            return content.strip()
        
        # 清理空行和多余空格
        content = re.sub(r'\n\s*\n+', '\n', content)
        content = content.strip()
        
        return content
    
    def _is_meaningful_content(self, content: str) -> bool:
        """检测是否是有意义的回答内容"""
        import re
        
        content = content.strip()
        
        # 如果内容太短，可能不是有意义的回答
        if len(content) < 2:
            return False
        
        # 包含中文字符的内容通常是有意义的
        if re.search(r'[\u4e00-\u9fff]', content):
            return True
        
        # 包含英文单词和标点的内容
        if re.search(r'[a-zA-Z]{2,}', content) and re.search(r'[.!?]', content):
            return True
        
        # 包含数字和单位的内容（如技术数据）
        if re.search(r'\d+.*[a-zA-Z%]', content):
            return True
        
        return False
    
    def _is_in_thinking_section(self, content: str) -> bool:
        """检测内容是否位于thinking标签区域内"""
        import re
        
        # 检测常见的thinking标签模式
        thinking_tag_patterns = [
            r'<thinking>.*?</thinking>',
            r'<thought>.*?</thought>',
            r'<reasoning>.*?</reasoning>',
            r'<analysis>.*?</analysis>',
            r'<步骤>.*?</步骤>',
            r'<思考>.*?</思考>',
            r'<分析>.*?</分析>'
        ]
        
        for pattern in thinking_tag_patterns:
            if re.search(pattern, content, re.DOTALL | re.IGNORECASE):
                return True
        
        return False
    
    def _is_json_fragment(self, content: str) -> bool:
        """检测是否为JSON结构片段"""
        import re
        
        content = content.strip()
        
        # 检测纯JSON符号
        if re.match(r'^[\{\}",:\[\]]+$', content):
            return True
        
        # 检测JSON键值对片段
        if re.match(r'^"[^"]*":\s*', content):
            return True
        
        # 检测JSON值片段
        if re.match(r'^"[^"]*"[,\}]?$', content):
            return True
        
        # 检测数字值（通常是confidence等）
        if re.match(r'^\d+(\.\d+)?[\},]?$', content):
            return True
        
        # 检测单独的关键词
        common_json_keys = {'json', 'name', 'title', 'thought', 'action', 'confidence', 'arguments', 'result', 'analysis'}
        if content.lower() in common_json_keys:
            return True
        
        return False
    
    def _filter_streaming_content(self, content: str) -> str:
        """智能过滤流式内容 - 移除工具执行信息和系统消息"""
        import re
        
        if not content:
            return ""
        
        content = content.strip()
        
        # 1. 过滤工具执行完成信息
        tool_patterns = [
            r'search_knowledge_base\([^)]*\)\s*completed\s*in\s*[\d.]+s\.?',
            r'[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\)\s*completed\s*in\s*[\d.]+s\.?',
            r'Function\s+[a-zA-Z_][a-zA-Z0-9_]*\s+completed',
            r'Tool\s+execution\s+completed',
            r'调用\s*[^完成]*完成',
            r'执行\s*[^完成]*完成'
        ]
        
        for pattern in tool_patterns:
            content = re.sub(pattern, '', content, flags=re.IGNORECASE)
        
        # 2. 过滤纯空白内容
        if re.match(r'^\s*$', content):
            return ""
        
        # 3. 过滤纯换行符
        if re.match(r'^[\r\n\s]*$', content):
            return ""
        
        # 4. 过滤JSON结构片段
        if self._is_json_fragment(content):
            return ""
        
        # 5. 过滤thinking标签内容
        if self._is_in_thinking_section(content):
            return ""
        
        # 6. 过滤系统调试信息
        debug_patterns = [
            r'WARNING\s+Could not run function',
            r'ERROR\s+.*Traceback',
            r'File\s+".*?",\s+line\s+\d+',
            r'AttributeError:.*',
            r'Traceback\s*\(most recent call last\):',
            r'\s*\^\s*$',  # 错误指示符
            r'agno\..*?line\s+\d+',
            r'pydantic\._internal\._',
        ]
        
        for pattern in debug_patterns:
            content = re.sub(pattern, '', content, flags=re.MULTILINE | re.IGNORECASE)
        
        # 7. 清理多余的空格和换行
        content = re.sub(r'\n\s*\n+', '\n', content)
        content = content.strip()
        
        # 8. 只返回有意义的内容
        if self._is_meaningful_content(content):
            return content
        
        return ""
    
    def _format_user_friendly_error(self, error_message: str) -> str:
        """将技术错误信息转换为用户友好的错误信息"""
        error_lower = error_message.lower()
        
        # 超时相关错误
        if any(keyword in error_lower for keyword in ["timeout", "readtimeout", "timed out"]):
            return "模型响应超时，请稍后重试。如果问题持续存在，请尝试使用更简短的问题。"
        
        # 连接相关错误
        elif any(keyword in error_lower for keyword in ["connection", "network", "httpcore", "httpx", "connect"]):
            return "网络连接出现问题，请检查网络状态后重试"
        
        # API相关错误
        elif any(keyword in error_message for keyword in ["401", "403", "429", "quota", "rate limit", "API"]):
            return "模型服务暂时不可用，请稍后重试"
        
        # 工具调用相关错误
        elif "Unable to decode function arguments" in error_message:
            return "智能体处理您的问题时遇到格式错误，正在使用简化模式重试"
        elif "Missing required argument" in error_message:
            return "智能体工具调用参数错误，正在使用备用方案处理"
        elif "validation error" in error_message:
            return "智能体参数验证失败，正在重新处理您的请求"
        elif "unmatched" in error_lower:
            return "智能体回答格式出现问题，正在重新处理"
        elif "JSON" in error_message or "decode" in error_message:
            return "智能体数据处理错误，正在使用备用方案"
        
        # 模型相关错误
        elif any(keyword in error_lower for keyword in ["model", "service unavailable", "server error"]):
            return "模型服务暂时不可用，请稍后重试"
        
        # 默认错误信息
        else:
            return "智能体暂时遇到问题，请重新尝试"
    

    
    async def team_query(self, team_name: str, query: str, session_id: str = None, knowledge_retrieval_mode: str = 'all') -> Optional[AgentResponse]:
        """智能体团队查询 - 非流式，支持session-based memory"""
        start_time = time.time()
        
        try:
            # 映射团队名称
            mapped_team_name = self._map_agent_name(team_name)
            
            # 设置Team查询的检索模式
            CustomKnowledgeTools.set_retrieval_mode(knowledge_retrieval_mode)
            logger.info(f"[TEAM] 设置Team查询检索模式: {knowledge_retrieval_mode}")
            
            # 如果提供了session_id，需要创建带memory的团队实例
            if session_id:
                team = await self._create_team_with_memory(mapped_team_name, session_id)
            else:
                team = self.team_factory.get_team(mapped_team_name)
                
            if not team:
                return None
            
            # 团队协作查询 - 使用run方法而不是print_response
            response = team.run(query, stream=False)
            
            # 提取响应内容
            if hasattr(response, 'content'):
                content = response.content
            elif hasattr(response, 'data'):
                content = response.data
            elif isinstance(response, str):
                content = response
            else:
                content = str(response) if response is not None else None
                
            logger.info(f"[TEAM] AgentService团队响应类型: {type(response)}, 内容长度: {len(content) if content else 0}")
            
            processing_time = time.time() - start_time
            
            return AgentResponse(
                content=content,
                agent_name=mapped_team_name,
                model_used="team",
                processing_time=processing_time,
                metadata={
                    "query": query,
                    "timestamp": time.time(),
                    "team_members": [member.name for member in team.members],
                    "original_team_name": team_name,
                    "session_id": session_id
                }
            )
            
        except Exception as e:
            logger.error(f"智能体团队查询失败 ({team_name}): {e}")
            return None

    async def team_query_stream(self, team_name: str, query: str, session_id: str = None, knowledge_retrieval_mode: str = 'all'):
        """智能体团队查询 - 流式版本，支持session-based memory"""
        start_time = time.time()
        
        try:
            # 映射团队名称
            mapped_team_name = self._map_agent_name(team_name)
            
            # 设置Team流式查询的检索模式
            CustomKnowledgeTools.set_retrieval_mode(knowledge_retrieval_mode)
            logger.info(f"[TEAM_STREAM] 设置Team流式查询检索模式: {knowledge_retrieval_mode}")
            
            # 如果提供了session_id，需要创建带memory的团队实例
            if session_id:
                team = await self._create_team_with_memory(mapped_team_name, session_id)
            else:
                team = self.team_factory.get_team(mapped_team_name)
                
            if not team:
                yield {
                    "type": "error",
                    "data": {"error": f"团队 {team_name} 不存在"}
                }
                return
            
            # 使用团队的真正流式接口
            stream_response = team.run(query, stream=True)
            
            # 检查是否返回迭代器
            if hasattr(stream_response, '__iter__') or hasattr(stream_response, '__aiter__'):
                # 处理流式响应事件
                if hasattr(stream_response, '__aiter__'):
                    # 异步迭代器
                    async for event in stream_response:
                        # 检查会话是否被取消
                        if session_id and await self.is_session_cancelled(session_id):
                            logger.info(f"[INTERRUPT] 团队查询会话已取消: {session_id}")
                            break
                        yield await self._process_team_stream_event(event, mapped_team_name, start_time, team_name)
                else:
                    # 同步迭代器
                    for event in stream_response:
                        # 检查会话是否被取消
                        if session_id and session_id in self.active_sessions:
                            if self.active_sessions[session_id].get('cancelled', False):
                                logger.info(f"[INTERRUPT] 团队查询会话已取消: {session_id}")
                                break
                        yield await self._process_team_stream_event(event, mapped_team_name, start_time, team_name)
            else:
                # 回退：如果流式失败，使用非流式结果进行模拟
                logger.warning(f"团队 {mapped_team_name} 流式失败，回退到模拟流式")
                content = str(stream_response)
                
                # 不再使用错误的split()分词，保持内容完整性
                yield {
                    "type": "chunk",
                    "data": {
                        "content": content,
                        "agent_name": mapped_team_name,
                        "model_used": "team",
                        "processing_time": time.time() - start_time,
                        "original_agent_name": team_name,
                        "timestamp": time.time()
                    }
                }
            
            # 获取团队成员的知识源数据
            knowledge_sources = []
            knowledge_stats = {}
            
            try:
                logger.info(f"[TEAM_STREAM] 开始从团队成员中收集知识源...")
                for member in team.members if hasattr(team, 'members') and team.members else []:
                    logger.info(f"[TEAM_STREAM] 检查团队成员: {member.name if hasattr(member, 'name') else 'unknown'}")
                    if hasattr(member, 'tools') and member.tools:
                        for tool in member.tools:
                            if isinstance(tool, CustomKnowledgeTools):
                                logger.info(f"[TEAM_STREAM] 从成员 {member.name} 找到CustomKnowledgeTools")
                                if hasattr(tool, '_last_search_results') and tool._last_search_results:
                                    knowledge_sources.extend(tool._last_search_results)
                                    logger.info(f"[TEAM_STREAM] 从成员收集到 {len(tool._last_search_results)} 个知识源")
                
                # 生成统计信息
                if knowledge_sources:
                    source_types = {}
                    total_score = 0.0
                    for source in knowledge_sources:
                        source_type = source.get("source_type", "unknown")
                        source_types[source_type] = source_types.get(source_type, 0) + 1
                        total_score += source.get("score", 0.0)
                    
                    knowledge_stats = {
                        "total_sources": len(knowledge_sources),
                        "source_types": source_types,
                        "average_score": total_score / len(knowledge_sources) if knowledge_sources else 0.0
                    }
                    logger.info(f"[TEAM_STREAM] 团队知识源统计: {knowledge_stats}")
                else:
                    logger.info(f"[TEAM_STREAM] 团队没有收集到知识源")
                    
            except Exception as e:
                logger.warning(f"[TEAM_STREAM] 收集团队知识源失败: {e}")
            
            # 🔥 收集团队中的图谱检索结果
            team_graph_sources = {}
            if search_graph:
                try:
                    for member in team.members:
                        if hasattr(member, 'tools') and member.tools:
                            for tool in member.tools:
                                if isinstance(tool, CustomKnowledgeTools):
                                    if hasattr(tool, '_last_graph_results') and tool._last_graph_results:
                                        team_graph_sources = tool._last_graph_results
                                        logger.info(f"[TEAM_STREAM] ✅ 从团队成员收集到图谱数据")
                                        break
                            if team_graph_sources:
                                break
                except Exception as e:
                    logger.warning(f"[TEAM_STREAM] 收集团队图谱数据失败: {e}")
            
            # 首先发送独立的知识源事件（在done之前，包含图谱数据）
            if knowledge_sources:
                logger.info(f"[TEAM_STREAM] 🔍 发送独立的knowledge_sources事件: {len(knowledge_sources)} 个源")
                yield {
                    "type": "knowledge_sources",
                    "data": {
                        "knowledge_sources": knowledge_sources,
                        "knowledge_stats": knowledge_stats,
                        "graph_sources": team_graph_sources,  # 🔥 添加团队图谱数据
                        "agent_name": mapped_team_name,
                        "timestamp": time.time()
                    }
                }
            else:
                logger.info(f"[TEAM_STREAM] ⚠️ 团队未找到知识源数据，跳过knowledge_sources事件")
            
            # 然后发送纯净的done事件（不包含knowledge_sources）
            logger.info(f"[TEAM_STREAM] ✅ 发送done事件，结束团队对话")
            yield {
                "type": "done",
                "data": {
                    "agent_name": mapped_team_name,
                    "total_processing_time": time.time() - start_time,
                    "timestamp": time.time()
                    # 不再包含knowledge_sources和knowledge_stats
                }
            }
            
        except Exception as e:
            logger.error(f"团队流式查询失败 ({team_name}): {e}")
            yield {
                "type": "error",
                "data": {
                    "error": str(e),
                    "agent_name": mapped_team_name,
                    "timestamp": time.time()
                }
            }

    async def _process_team_stream_event(self, event, mapped_team_name: str, start_time: float, original_team_name: str):
        """处理团队流式事件"""
        try:
            # 根据事件类型处理
            if hasattr(event, 'content') and event.content:
                # 内容事件
                return {
                    "type": "chunk",
                    "data": {
                        "content": event.content,
                        "agent_name": mapped_team_name,
                        "model_used": "team",
                        "processing_time": time.time() - start_time,
                        "original_agent_name": original_team_name,
                        "timestamp": time.time()
                    }
                }
            elif hasattr(event, 'error'):
                # 错误事件
                return {
                    "type": "error",
                    "data": {
                        "error": str(event.error),
                        "agent_name": mapped_team_name,
                        "timestamp": time.time()
                    }
                }
            else:
                # 其他事件类型，记录但不发送给前端
                logger.debug(f"团队流式事件: {type(event).__name__}")
                return None
                
        except Exception as e:
            logger.warning(f"处理团队流式事件失败: {e}")
            return None
    
    async def geopolymer_qa(self, query: str, use_team: bool = True, agent_name: str = None, session_id: str = None) -> Optional[AgentResponse]:
        """智能问答 - 支持指定智能体和session-based memory"""
        if use_team and not agent_name:
            return await self.team_query(os.getenv('TEAM_DEFAULT_NAME', 'geopolymer_qa_team_v2'), query, session_id)
        elif agent_name:
            # 使用指定的智能体
            return await self.single_agent_query(agent_name, query, session_id=session_id)
        else:
            # 根据问题类型选择合适的单个智能体
            if any(keyword in query.lower() for keyword in ["文献", "论文", "研究", "参考"]):
                return await self.single_agent_query("doc_analyzer", query, session_id=session_id)
            elif any(keyword in query.lower() for keyword in ["数据", "分析", "性能", "测试"]):
                return await self.single_agent_query("multimodal_agent", query, session_id=session_id)
            else:
                return await self.single_agent_query("cailiao_zhuanjia", query, session_id=session_id)
    
    def get_available_agents(self) -> List[str]:
        """获取可用的智能体列表"""
        return list(optimized_config_manager.settings.agents.keys())
    
    def get_available_teams(self) -> List[str]:
        """获取可用的智能体团队列表"""
        return list(optimized_config_manager.settings.agent_teams.keys())
    
    async def search_literature(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """使用文献检索智能体搜索相关论文"""
        try:
            # 构建搜索提示
            search_prompt = f"""
            请搜索与以下查询相关的学术论文和文献："{query}"
            
            要求：
            1. 搜索最多 {limit} 篇相关论文
            2. 重点关注与查询相关的专业文献和资料
            3. 返回论文的标题、作者、摘要和链接
            4. 按相关性排序
            
            请以结构化的方式返回搜索结果。
            """
            
            # 使用文献检索智能体
            response = await self.single_agent_query("literature_agent", search_prompt)
            
            if not response:
                return []
            
            # 解析搜索结果（这里简化处理，实际应该解析智能体返回的结构化数据）
            return [
                {
                    "title": f"搜索结果：{query}",
                    "content": response.content,
                    "source": "literature_agent",
                    "relevance_score": 0.8,
                    "timestamp": time.time()
                }
            ]
            
        except Exception as e:
            logger.error(f"文献搜索失败: {e}")
            return []


# 全局智能体服务实例
agent_service = AgentService() 