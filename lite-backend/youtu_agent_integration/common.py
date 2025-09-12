"""
Meta-Agent 通用数据结构
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional

@dataclass
class GeneratorTaskRecorder:
    """简化版的任务记录器，兼容youtu-agent的GeneratorTaskRecorder"""
    requirements: Optional[str] = None
    selected_tools: Optional[Dict[str, List[str]]] = None
    instructions: Optional[str] = None
    name: Optional[str] = None
    
    # 扩展字段
    status: str = "step1_requirements_clarification"
    current_step: int = 1
    conversation_history: List[Dict[str, str]] = field(default_factory=list)
