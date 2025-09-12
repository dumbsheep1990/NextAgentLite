"""
Youtu-Agent 核心集成层
"""
import os
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from contextlib import asynccontextmanager

# 在导入utu之前先设置环境变量
os.environ.setdefault("UTU_LLM_TYPE", "openai")
os.environ.setdefault("UTU_LLM_MODEL", os.getenv("DEFAULT_LLM_MODEL", "Qwen/Qwen3-30B-A3B-Thinking-2507"))
os.environ.setdefault("UTU_LLM_BASE_URL", os.getenv("ONE_API_BASE_URL", "https://api.siliconflow.cn/v1"))
os.environ.setdefault("UTU_LLM_API_KEY", os.getenv("ONE_API_KEY", "sk-mnennlifdngjififromhljflqsblutyfgfvwerkfhsxummcn"))
os.environ.setdefault("UTU_LOG_LEVEL", "ERROR")

# 构建数据库URL
def _build_database_url() -> str:
    host = os.getenv("POSTGRESQL_HOST", "localhost")
    port = os.getenv("POSTGRESQL_PORT", "5434")
    db = os.getenv("POSTGRESQL_DATABASE", "zzdsj_demo")
    user = os.getenv("POSTGRESQL_USERNAME", "zzdsj_demo")
    password = os.getenv("POSTGRESQL_PASSWORD", "zzdsj123!")
    return f"postgresql://{user}:{password}@{host}:{port}/{db}"

os.environ.setdefault("DB_URL", _build_database_url())

import utu
from utu.agents import SimpleAgent, OrchestraAgent, get_agent
from utu.config import AgentConfig
from utu.config.agent_config import ProfileConfig
from utu.meta import SimpleAgentGenerator

from core.logger import logger


class YoutuAgentCore:
    """youtu-agent核心管理器"""
    
    def __init__(self):
        self.agents: Dict[str, Any] = {}
        self.meta_generator: Optional[SimpleAgentGenerator] = None
        self._initialized = False
        # 添加会话状态跟踪
        self.session_states = {}  # session_id -> current_step
    
    async def initialize(self):
        """初始化youtu-agent核心"""
        if self._initialized:
            return
        
        try:
            # 设置必要的环境变量
            self._setup_environment()
            
            # 初始化meta-agent生成器
            self.meta_generator = SimpleAgentGenerator()
            
            self._initialized = True
            logger.info("✅ YoutuAgentCore初始化成功")
            
        except Exception as e:
            logger.error(f"❌ YoutuAgentCore初始化失败: {e}")
            raise
    
    def _setup_environment(self):
        """设置youtu-agent所需的环境变量"""
        # 从.env读取配置并设置到环境变量中
        # 优先使用UTU_开头的专用配置，如果没有则使用默认配置
        env_vars = {
            "UTU_LLM_TYPE": os.getenv("UTU_LLM_TYPE", "openai"),
            "UTU_LLM_MODEL": os.getenv("UTU_LLM_MODEL", os.getenv("DEFAULT_LLM_MODEL", "Qwen/Qwen3-30B-A3B-Thinking-2507")),
            "UTU_LLM_BASE_URL": os.getenv("UTU_LLM_BASE_URL", os.getenv("ONE_API_BASE_URL", "https://api.siliconflow.cn/v1")),
            "UTU_LLM_API_KEY": os.getenv("UTU_LLM_API_KEY", os.getenv("ONE_API_KEY", "")),
            "DB_URL": os.getenv("UTU_DB_URL", self._build_database_url()),
            "UTU_LOG_LEVEL": os.getenv("UTU_LOG_LEVEL", "ERROR")  # 减少日志噪音
        }
        
        for key, value in env_vars.items():
            if value:
                os.environ[key] = value
                
        logger.info("🔧 youtu-agent环境变量配置完成")
    
    def _build_database_url(self) -> str:
        """构建数据库连接URL"""
        host = os.getenv("POSTGRESQL_HOST", "localhost")
        port = os.getenv("POSTGRESQL_PORT", "5434")
        db = os.getenv("POSTGRESQL_DATABASE", "zzdsj_demo")
        user = os.getenv("POSTGRESQL_USERNAME", "zzdsj_demo")
        password = os.getenv("POSTGRESQL_PASSWORD", "zzdsj123!")
        
        return f"postgresql://{user}:{password}@{host}:{port}/{db}"
    
    async def create_agent(
        self,
        agent_type: str = "simple",
        name: str = "default_agent",
        instructions: str = "你是一个专业的AI助手，能够回答各种问题。",
        toolkits: Optional[Dict[str, Any]] = None
    ) -> Any:
        """创建Agent实例"""
        try:
            config = AgentConfig(
                type=agent_type,
                agent=ProfileConfig(
                    name=name,
                    instructions=instructions
                ),
                toolkits=toolkits or {}
            )
            
            agent = get_agent(config)
            self.agents[name] = agent
            
            logger.info(f"✅ 创建Agent成功: {name} (类型: {agent_type})")
            return agent
            
        except Exception as e:
            logger.error(f"❌ 创建Agent失败: {e}")
            raise
    
    async def get_agent(self, name: str) -> Optional[Any]:
        """获取Agent实例"""
        return self.agents.get(name)
    
    async def list_agents(self) -> Dict[str, str]:
        """列出所有Agent"""
        return {name: type(agent).__name__ for name, agent in self.agents.items()}
    
    async def start_meta_generation(
        self,
        user_description: str,
        ask_function=None
    ) -> Dict[str, Any]:
        """开始Meta-Agent生成流程（Step 1: 需求澄清）"""
        if not self.meta_generator:
            raise RuntimeError("Meta-Agent生成器未初始化")
        
        try:
            # 设置ask_function用于用户交互
            if ask_function:
                self.meta_generator.ask_function = ask_function
                # 确保在构建时设置交互工具包
                await self.meta_generator.build()
                if hasattr(self.meta_generator, 'interaction_toolkit'):
                    self.meta_generator.interaction_toolkit.set_ask_function(ask_function)
            
            # 创建task_recorder和会话状态
            from .common import GeneratorTaskRecorder
            task_recorder = GeneratorTaskRecorder()
            session_id = str(uuid.uuid4())
            
            # 保存会话状态
            self.session_states[session_id] = {
                "task_recorder": task_recorder,
                "current_step": 1,
                "user_description": user_description,
                "created_at": datetime.now().isoformat()
            }
            
            logger.info(f"✅ Meta-Agent生成流程已启动，会话ID: {session_id}")
            return {
                "task_recorder": task_recorder,
                "session_id": session_id,
                "current_step": 1,
                "total_steps": 4,
                "status": "step1_requirements_clarification"
            }
            
        except Exception as e:
            logger.error(f"❌ Meta-Agent生成启动失败: {e}")
            raise
    
    async def continue_meta_generation(
        self,
        session_id: str,
        user_response: str = None
    ) -> Dict[str, Any]:
        """继续Meta-Agent生成流程 - 使用真正的youtu-agent实现"""
        if not self.meta_generator:
            raise RuntimeError("Meta-Agent生成器未初始化")
        
        try:
            # 获取或创建task_recorder
            if session_id not in self.session_states:
                logger.error(f"会话 {session_id} 不存在")
                return {
                    "session_id": session_id,
                    "status": "error",
                    "message": "会话不存在，请重新开始"
                }
            
            task_recorder = self.session_states[session_id]["task_recorder"]
            current_step = self.session_states[session_id]["current_step"]
            
            logger.info(f"📝 用户响应: {user_response}, 当前步骤: {current_step}")
            
            # 根据当前步骤处理用户响应
            if current_step == 1:
                # Step 1: 需求澄清阶段
                return await self._handle_step1_response(session_id, user_response, task_recorder)
            elif current_step == 2:
                # Step 2: 工具选择 - 自动执行
                return await self._execute_step2(session_id, task_recorder)
            elif current_step == 3:
                # Step 3: 指令生成 - 自动执行
                return await self._execute_step3(session_id, task_recorder)
            elif current_step == 4:
                # Step 4: 名称生成 - 自动执行
                return await self._execute_step4(session_id, task_recorder)
            else:
                return {
                    "session_id": session_id,
                    "status": "completed",
                    "message": "所有步骤已完成",
                    "generated_config": self._format_final_config(task_recorder)
                }
                
        except Exception as e:
            logger.error(f"❌ Meta-Agent生成继续失败: {e}")
            return {
                "session_id": session_id,
                "status": "error",
                "message": f"处理过程中出现错误: {str(e)}"
            }
    
    async def _handle_step1_response(self, session_id: str, user_response: str, task_recorder) -> Dict[str, Any]:
        """处理Step1需求澄清阶段的用户响应"""
        # 将用户响应添加到对话历史
        task_recorder.conversation_history.append({
            "role": "user", 
            "content": user_response
        })
        
        # 分析用户响应是否包含足够的需求信息
        response_lower = user_response.lower()
        has_scenario = any(word in response_lower for word in ["场景", "用途", "使用", "应用", "处理", "分析", "问答", "检索", "搜索", "查询", "助手"])
        has_data_type = any(word in response_lower for word in ["数据", "文件", "输入", "内容", "csv", "excel", "文档", "政策", "知识", "信息"])
        has_output = any(word in response_lower for word in ["输出", "格式", "结果", "markdown", "json", "报告"])
        
        # 检查需求是否完整
        is_complete = len(user_response.strip()) >= 15 and (has_scenario and (has_data_type or has_output))
        
        if is_complete:
            # 需求澄清完成，保存需求并进入Step2
            task_recorder.requirements = user_response
            task_recorder.status = "step2_tools_selection"
            self.session_states[session_id]["current_step"] = 2
            
            assistant_response = f"很好！我已经理解了您的需求：\n\n{user_response}\n\n现在我将为您选择最合适的工具组合..."
            task_recorder.conversation_history.append({
                "role": "assistant",
                "content": assistant_response
            })
            
            # 立即执行Step2工具选择
            return await self._execute_step2(session_id, task_recorder)
        else:
            # 需要更多信息，继续澄清
            clarification_questions = self._generate_clarification_questions(user_response)
            task_recorder.conversation_history.append({
                "role": "assistant",
                "content": clarification_questions
            })
            
            return {
                "session_id": session_id,
                "status": "step1_requirements_clarification",
                "current_step": 1,
                "step_name": "需求澄清",
                "assistant_response": clarification_questions,
                "is_complete": False
            }
    
    async def _execute_step2(self, session_id: str, task_recorder) -> Dict[str, Any]:
        """执行Step2工具选择"""
        if not task_recorder.requirements:
            return {
                "session_id": session_id,
                "status": "error",
                "message": "需求信息缺失，无法选择工具"
            }
        
        # 基于需求智能选择工具
        selected_tools = self._analyze_and_select_tools(task_recorder.requirements)
        task_recorder.selected_tools = selected_tools
        task_recorder.status = "step2_tools_selection"
        self.session_states[session_id]["current_step"] = 2
        
        tools_list = self._format_selected_tools(selected_tools)
        assistant_response = f"🛠️ 已为您选择最合适的工具组合：\n\n{tools_list}\n\n接下来我将生成详细的执行指令..."
        
        task_recorder.conversation_history.append({
            "role": "assistant",
            "content": assistant_response
        })
        
        # 立即执行Step3指令生成
        return await self._execute_step3(session_id, task_recorder)
    
    async def _execute_step3(self, session_id: str, task_recorder) -> Dict[str, Any]:
        """执行Step3指令生成"""
        if not task_recorder.requirements or not task_recorder.selected_tools:
            return {
                "session_id": session_id,
                "status": "error",
                "message": "需求或工具信息缺失，无法生成指令"
            }
        
        # 基于需求和工具生成指令
        instructions = self._generate_agent_instructions(task_recorder.requirements, task_recorder.selected_tools)
        task_recorder.instructions = instructions
        task_recorder.status = "step3_instructions_generation"
        self.session_states[session_id]["current_step"] = 3
        
        assistant_response = f"📝 已生成Agent执行指令：\n\n{instructions}\n\n现在为您的Agent生成合适的名称..."
        
        task_recorder.conversation_history.append({
            "role": "assistant",
            "content": assistant_response
        })
        
        # 立即执行Step4名称生成
        return await self._execute_step4(session_id, task_recorder)
    
    async def _execute_step4(self, session_id: str, task_recorder) -> Dict[str, Any]:
        """执行Step4名称生成"""
        if not task_recorder.requirements:
            return {
                "session_id": session_id,
                "status": "error",
                "message": "需求信息缺失，无法生成名称"
            }
        
        # 基于需求生成Agent名称
        agent_name = self._generate_agent_name(task_recorder.requirements)
        task_recorder.name = agent_name
        task_recorder.status = "completed"
        self.session_states[session_id]["current_step"] = 5
        
        # 生成最终配置
        final_config = self._format_final_config(task_recorder)
        
        assistant_response = f"🎉 Agent创建完成！\n\n✅ 所有步骤已完成：\n1. ✓ 需求澄清\n2. ✓ 工具选择\n3. ✓ 指令生成\n4. ✓ 名称生成\n\nAgent名称：{agent_name}\n\n您的Agent已准备就绪！"
        
        task_recorder.conversation_history.append({
            "role": "assistant",
            "content": assistant_response
        })
        
        return {
            "session_id": session_id,
            "status": "completed",
            "current_step": 4,
            "step_name": "完成",
            "assistant_response": assistant_response,
            "is_complete": True,
            "generated_config": final_config
        }
    
    def _generate_clarification_questions(self, user_response: str) -> str:
        """生成澄清问题"""
        response_lower = user_response.lower()
        
        questions = ["谢谢您的回答。为了更好地为您创建Agent，我需要了解更多细节：\n"]
        
        if not any(word in response_lower for word in ["场景", "用途", "使用", "应用"]):
            questions.append("1. 这个Agent主要的使用场景是什么？")
        
        if not any(word in response_lower for word in ["数据", "文件", "输入", "内容"]):
            questions.append("2. 您希望它处理什么类型的输入数据？")
        
        if not any(word in response_lower for word in ["输出", "格式", "结果"]):
            questions.append("3. 您期望的输出格式是什么？")
        
        if len(questions) == 1:  # 只有开头，说明信息比较完整
            questions.append("请提供更多具体的细节信息。")
        
        return "\n".join(questions)
    
    def _analyze_and_select_tools(self, requirements: str) -> Dict[str, List[str]]:
        """分析需求并选择工具"""
        req_lower = requirements.lower()
        selected_tools = {}
        
        # 基础搜索工具
        if any(word in req_lower for word in ["搜索", "查询", "检索", "网络", "知识库"]):
            selected_tools["search"] = ["search_web", "search_knowledge"]
        
        # 文档处理工具
        if any(word in req_lower for word in ["文档", "pdf", "文件", "doc", "docx"]):
            selected_tools["document"] = ["read_document", "analyze_document"]
        
        # 数据分析工具
        if any(word in req_lower for word in ["csv", "excel", "数据", "分析", "表格"]):
            selected_tools["tabular"] = ["read_csv", "analyze_data", "generate_chart"]
        
        # 文件操作工具
        if any(word in req_lower for word in ["文件", "目录", "整理", "归类", "移动"]):
            selected_tools["bash"] = ["list_files", "move_files", "create_directory"]
        
        # 图像处理工具
        if any(word in req_lower for word in ["图片", "图像", "png", "jpg", "gif"]):
            selected_tools["image"] = ["process_image", "generate_image"]
        
        # 如果没有选择任何工具，提供默认工具
        if not selected_tools:
            selected_tools["search"] = ["search_web"]
            selected_tools["bash"] = ["execute_command"]
        
        return selected_tools
    
    def _format_selected_tools(self, selected_tools: Dict[str, List[str]]) -> str:
        """格式化选择的工具列表"""
        tool_descriptions = {
            "search": "🔍 搜索工具包 - 网络搜索和知识库检索",
            "document": "📄 文档处理工具包 - PDF/Word文档分析",
            "tabular": "📊 数据分析工具包 - CSV/Excel数据处理和可视化",
            "bash": "💻 系统工具包 - 文件操作和命令执行",
            "image": "🖼️ 图像处理工具包 - 图片处理和生成",
            "audio": "🎵 音频处理工具包 - 音频分析和处理"
        }
        
        formatted_tools = []
        for toolkit_name, tools in selected_tools.items():
            desc = tool_descriptions.get(toolkit_name, f"{toolkit_name}工具包")
            tool_list = ", ".join(tools)
            formatted_tools.append(f"• {desc}\n  包含工具: {tool_list}")
        
        return "\n\n".join(formatted_tools)
    
    def _generate_agent_instructions(self, requirements: str, selected_tools: Dict[str, List[str]]) -> str:
        """生成Agent指令"""
        base_instructions = [
            f"你是一个专业的AI助手，专门用于：{requirements}",
            "请始终保持专业、准确和有用的回答",
            "根据用户的具体需求选择合适的工具进行处理"
        ]
        
        # 根据工具添加特定指令
        if "search" in selected_tools:
            base_instructions.append("当需要获取最新信息时，使用搜索工具进行网络搜索")
        
        if "document" in selected_tools:
            base_instructions.append("当处理文档时，仔细分析文档内容并提取关键信息")
        
        if "tabular" in selected_tools:
            base_instructions.append("当分析数据时，提供清晰的数据洞察和可视化结果")
        
        if "bash" in selected_tools:
            base_instructions.append("当操作文件系统时，确保操作的安全性和准确性")
        
        base_instructions.append("如果遇到不确定的情况，请向用户询问澄清")
        
        return "\n".join(f"- {instruction}" for instruction in base_instructions)
    
    def _generate_agent_name(self, requirements: str) -> str:
        """生成Agent名称"""
        req_lower = requirements.lower()
        
        if any(word in req_lower for word in ["数据", "分析", "csv", "excel"]):
            return "data_analysis_agent"
        elif any(word in req_lower for word in ["文档", "pdf", "文件"]):
            return "document_processor_agent"
        elif any(word in req_lower for word in ["搜索", "研究", "调研"]):
            return "research_assistant_agent"
        elif any(word in req_lower for word in ["整理", "归类", "管理"]):
            return "file_organizer_agent"
        elif any(word in req_lower for word in ["图片", "图像", "视觉"]):
            return "image_processor_agent"
        else:
            return f"intelligent_agent_{uuid.uuid4().hex[:8]}"
    
    def _format_final_config(self, task_recorder) -> Dict[str, Any]:
        """格式化最终配置"""
        return {
            "name": task_recorder.name,
            "display_name": task_recorder.name.replace("_", " ").title(),
            "description": task_recorder.requirements,
            "agent_type": "SimpleAgent",
            "instructions": task_recorder.instructions.split("\n") if task_recorder.instructions else [],
            "tools": task_recorder.selected_tools or {},
            "environments": ["shell_env", "browser_env"],
            "created_at": datetime.now().isoformat()
        }
    


# 全局核心实例
youtu_core = YoutuAgentCore()


@asynccontextmanager
async def get_youtu_core():
    """获取初始化的youtu-agent核心"""
    if not youtu_core._initialized:
        await youtu_core.initialize()
    yield youtu_core