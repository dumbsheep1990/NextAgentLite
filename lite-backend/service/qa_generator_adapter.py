"""
QA生成器适配器 - 集成GC-QA-RAG算法但使用NextAgentLite的配置
"""

import json
import logging
from typing import Dict, List, Any
from dataclasses import dataclass

from service.llm_service import llm_service
from core.config_optimized import optimized_config_manager

logger = logging.getLogger(__name__)


@dataclass
class PromptConfig:
    """QA生成提示词配置"""
    single_group_template: str = """## instruction
我在构建一个检索系统，需要提取下面文档中的知识点，文档为通用文本，需要总结并提炼，然后针对不同的角度各生成一个相似的问题及其答案，问题需要在源文档中找到答案，问题不少于{{QA_Count}}个，使用中文回答。

## output schema
始终以如下JSON格式返回：{"Summary":"string","PossibleQA":[{"Question":"string","Answer":"string"}]}。  

## 要处理的文档
{{Content}}
"""

    multi_group_template1: str = """请记住下面的文本内容，它将对你后续要做的任务有帮助。
{{Content_Full}}
"""

    multi_group_template2: str = """## instruction
我在构建一个知识检索系统，需要提取下面文本片段中的知识点，需要先总结并提炼片段部分的概要，然后针对片段内不同的知识点各生成一个相关的问题及其答案，问题需要在源文档中找到答案，问题不少于{{QA_Count}}个，使用中文回答。

## 输出格式
始终直接以如下JSON格式返回：{"Summary":"string","PossibleQA":[{"Question":"string","Answer":"string"}]}。  

## 文本片段
{{Content_Chunk}}
"""

    assistant_response: str = "好的，我将在后续任务参考上述文本。请告诉我你的具体任务。"


def split_text_into_sentence_groups(
    text: str,
    group_size: int = 10,
    min_group_size: int = 5,
    sentence_delimiter: str = "。",
) -> List[List[str]]:
    """
    将文本分割为句子组
    
    Args:
        text: 输入文本
        group_size: 每组最大句子数
        min_group_size: 最小组大小
        sentence_delimiter: 句子分隔符
        
    Returns:
        句子组列表
    """
    if not text:
        return []

    sentences = text.split(sentence_delimiter)
    # 移除空句子
    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return []

    groups = []
    current_group = []

    for sentence in sentences:
        current_group.append(sentence)

        if len(current_group) >= group_size:
            groups.append(current_group)
            current_group = []

    # 处理剩余句子
    if current_group:
        if len(current_group) < min_group_size and groups:
            # 如果太小，合并到最后一组
            groups[-1].extend(current_group)
        else:
            groups.append(current_group)

    return groups


def extract_qa_object(response: str) -> Dict[str, Any]:
    """
    从LLM响应中提取QA对象
    
    Args:
        response: LLM原始响应
        
    Returns:
        解析后的QA对象
    """
    try:
        # 清理响应文本
        cleaned_response = response.strip()
        
        # 尝试找到JSON部分
        start_idx = cleaned_response.find('{')
        end_idx = cleaned_response.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_str = cleaned_response[start_idx:end_idx + 1]
            return json.loads(json_str)
        else:
            # 如果找不到JSON，返回默认结构
            logger.warning(f"无法从响应中提取JSON: {response[:100]}...")
            return {"Summary": "", "PossibleQA": []}
            
    except json.JSONDecodeError as e:
        logger.error(f"JSON解析错误: {e}, 响应: {response[:100]}...")
        return {"Summary": "", "PossibleQA": []}
    except Exception as e:
        logger.error(f"QA对象提取错误: {e}")
        return {"Summary": "", "PossibleQA": []}


class QAGeneratorAdapter:
    """
    QA生成器适配器
    
    使用GC-QA-RAG的核心算法，但适配NextAgentLite的LLM服务
    """
    
    def __init__(self, prompt_config: PromptConfig = None):
        self.prompt_config = prompt_config or PromptConfig()
        
    async def _generate_single_qa(self, prompt: str) -> Dict[str, Any]:
        """生成单个QA对"""
        try:
            # 使用NextAgentLite的LLM服务
            response = await llm_service.call_llm_async(
                prompt=prompt,
                model=optimized_config_manager.get_default_model(),
                max_tokens=2000,
                temperature=0.7
            )
            return extract_qa_object(response)
        except Exception as e:
            logger.error(f"单QA生成错误: {e}")
            return {"Summary": "", "PossibleQA": []}

    async def _generate_multi_qa(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """生成多轮QA对"""
        try:
            # 转换消息格式
            conversation_text = ""
            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                conversation_text += f"{role}: {content}\n"
            
            # 使用最后一个用户消息作为主要提示
            user_messages = [msg for msg in messages if msg.get("role") == "user"]
            if user_messages:
                main_prompt = user_messages[-1]["content"]
            else:
                main_prompt = conversation_text
                
            response = await llm_service.call_llm_async(
                prompt=main_prompt,
                model=optimized_config_manager.get_default_model(),
                max_tokens=2000,
                temperature=0.7
            )
            return extract_qa_object(response)
        except Exception as e:
            logger.error(f"多轮QA生成错误: {e}")
            return {"Summary": "", "PossibleQA": []}

    async def generate_by_single_group(
        self, main_content: str, group: List[str]
    ) -> Dict[str, Any]:
        """单组生成QA对"""
        sentence_length = len(group)
        prompt = self.prompt_config.single_group_template.replace(
            "{{QA_Count}}", str(sentence_length)
        ).replace("{{Content}}", main_content)
        
        qa_object = await self._generate_single_qa(prompt)
        return {"Groups": [qa_object]}

    async def generate_by_groups(
        self, main_content: str, groups: List[List[str]]
    ) -> Dict[str, Any]:
        """多组生成QA对"""
        objects = []
        for group in groups:
            sentence_length = len(group)
            sentence_text = "。".join(group)
            messages = [
                {"role": "system", "content": "你是一个乐于解答各种问题的助手。"},
                {
                    "role": "user",
                    "content": self.prompt_config.multi_group_template1.replace(
                        "{{Content_Full}}", main_content
                    ),
                },
                {"role": "assistant", "content": self.prompt_config.assistant_response},
                {
                    "role": "user",
                    "content": self.prompt_config.multi_group_template2.replace(
                        "{{QA_Count}}", str(sentence_length)
                    ).replace("{{Content_Chunk}}", sentence_text),
                },
            ]
            qa_object = await self._generate_multi_qa(messages)
            objects.append(qa_object)
        return {"Groups": objects}

    async def generate(self, text: str) -> Dict[str, Any]:
        """
        主要的QA生成方法
        
        Args:
            text: 输入文本
            
        Returns:
            生成的QA结果
        """
        try:
            main_content = text
            groups = split_text_into_sentence_groups(main_content)
            
            if len(groups) > 1:
                return await self.generate_by_groups(main_content, groups)
            else:
                return await self.generate_by_single_group(main_content, groups[0] if groups else [])
                
        except Exception as e:
            logger.error(f"QA生成错误: {e}")
            return {"Groups": [{"Summary": "生成失败", "PossibleQA": []}]}


# 全局QA生成器实例
qa_generator_adapter = QAGeneratorAdapter()