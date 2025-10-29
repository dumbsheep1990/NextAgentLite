#!/usr/bin/env python3
"""
知识图谱服务管理器
管理知识图谱服务的启动、停止和状态检查
"""
import subprocess
import sys
import time
import os
import signal
import threading
import requests
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class KnowledgeGraphService:
    """知识图谱服务管理器"""
    
    def __init__(self):
        self.process = None
        self.service_name = "知识图谱服务"
        self.service_port = 9622
        self.service_host = "localhost"
        self.service_url = f"http://{self.service_host}:{self.service_port}"
        
        # 服务器脚本路径 - 使用项目中的LightRAG API服务器
        backend_dir = Path(__file__).parent.parent
        self.server_script = backend_dir / "matgraph_server.py"
        
    def is_service_available(self, timeout=5):
        """检查服务是否可用"""
        try:
            response = requests.get(f"{self.service_url}/health", timeout=timeout)
            return response.status_code == 200
        except:
            return False
            
    def is_port_occupied(self):
        """检查端口是否被占用"""
        import socket
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex((self.service_host, self.service_port))
                return result == 0
        except:
            return False
    
    def start_service(self, background=True):
        """启动知识图谱服务"""
        if self.is_service_available():
            logger.info(f"✅ {self.service_name}已在运行")
            return True
            
        if not self.server_script.exists():
            logger.error(f"❌ {self.service_name}启动脚本不存在: {self.server_script}")
            return False
            
        try:
            logger.info(f"🚀 正在启动{self.service_name}...")
            
            # 设置环境变量
            env = os.environ.copy()
            env.update({
                "HOST": "0.0.0.0",
                "PORT": str(self.service_port),
                "WEBUI_TITLE": "知识图谱系统",
                "WEBUI_DESCRIPTION": "集成到 mat-demo 项目的知识图谱系统",
                
                # LLM 配置 - 使用环境变量或统一网关
                "LLM_BINDING": os.getenv("LLM_BINDING", "openai"),
                "LLM_MODEL": os.getenv("LLM_MODEL", "qwen3-235b-a22b-instruct-2507"),
                "LLM_BINDING_HOST": os.getenv("LLM_GATEWAY_URL", "http://127.0.0.1:9050"),
                "LLM_BINDING_API_KEY": os.getenv("OPENAI_API_KEY", "sk-default"),
                "TEMPERATURE": "0.1",

                # 嵌入模型配置 - 使用环境变量或统一网关
                "EMBEDDING_BINDING": os.getenv("EMBEDDING_BINDING", "openai"),
                "EMBEDDING_BINDING_HOST": os.getenv("LLM_GATEWAY_URL", "http://127.0.0.1:9050"),
                "EMBEDDING_BINDING_API_KEY": os.getenv("OPENAI_API_KEY", "sk-default"),
                "EMBEDDING_MODEL": os.getenv("EMBEDDING_MODEL") or os.getenv("DEFAULT_EMBEDDING_MODEL", "text-embedding-v4"),
                "EMBEDDING_DIM": "1024",
                
                # 存储配置
                "LIGHTRAG_KV_STORAGE": "JsonKVStorage",
                "LIGHTRAG_DOC_STATUS_STORAGE": "JsonDocStatusStorage",
                "LIGHTRAG_GRAPH_STORAGE": "NetworkXStorage",
                "LIGHTRAG_VECTOR_STORAGE": "NanoVectorDBStorage",
                
                # 工作目录
                "WORKING_DIR": str(Path(__file__).parent.parent / "lightrag_storage"),
                "INPUT_DIR": str(Path(__file__).parent.parent / "lightrag_inputs"),
                "WORKSPACE": "default",
                
                # 语言和其他设置
                "SUMMARY_LANGUAGE": "Chinese",
                "ENABLE_LLM_CACHE": "True",
                "CHUNK_SIZE": "1200",
                "CHUNK_OVERLAP_SIZE": "100",
                "MAX_ASYNC": "4",
            })
            
            # 创建工作目录
            Path(env["WORKING_DIR"]).mkdir(exist_ok=True)
            Path(env["INPUT_DIR"]).mkdir(exist_ok=True)
            
            if background:
                # 后台启动
                self.process = subprocess.Popen(
                    [sys.executable, str(self.server_script)],
                    env=env,
                    cwd=self.server_script.parent,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True  # 创建新的进程组
                )
                
                logger.info(f"📡 {self.service_name}正在后台启动... (PID: {self.process.pid})")
                
                # 等待服务启动
                for i in range(30):  # 最多等待30秒
                    if self.is_service_available():
                        logger.info(f"✅ {self.service_name}启动成功!")
                        logger.info(f"🌐 服务地址: {self.service_url}")
                        logger.info(f"📱 Web UI: {self.service_url}/webui")
                        return True
                    time.sleep(1)
                
                logger.warning(f"⚠️  {self.service_name}启动超时，但进程可能仍在启动中")
                return True
            else:
                # 前台启动（用于调试）
                self.process = subprocess.Popen(
                    [sys.executable, str(self.server_script)],
                    env=env,
                    cwd=self.server_script.parent
                )
                return True
                
        except Exception as e:
            logger.error(f"❌ 启动{self.service_name}失败: {e}")
            return False
    
    def stop_service(self):
        """停止知识图谱服务"""
        if self.process and self.process.poll() is None:
            logger.info(f"🛑 正在停止{self.service_name}...")
            
            try:
                # 尝试优雅关闭
                self.process.terminate()
                
                # 等待最多10秒
                try:
                    self.process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    # 强制关闭
                    logger.warning("⚠️  优雅关闭超时，强制终止进程...")
                    self.process.kill()
                    self.process.wait()
                    
                logger.info(f"✅ {self.service_name}已停止")
                
            except Exception as e:
                logger.error(f"❌ 停止{self.service_name}时出错: {e}")
                
            self.process = None
    
    def get_service_status(self):
        """获取服务状态信息"""
        is_available = self.is_service_available()
        is_running = self.process and self.process.poll() is None
        
        status = {
            "service_name": self.service_name,
            "available": is_available,
            "process_running": is_running,
            "service_url": self.service_url,
            "port": self.service_port,
            "process_id": self.process.pid if self.process else None
        }
        
        if is_available:
            try:
                response = requests.get(f"{self.service_url}/health", timeout=5)
                if response.status_code == 200:
                    health_data = response.json()
                    status.update({
                        "health": health_data,
                        "status": "healthy"
                    })
            except:
                pass
        
        return status
    
    def ensure_service_running(self):
        """确保服务正在运行，如果没有则启动"""
        if not self.is_service_available():
            logger.info(f"🔄 {self.service_name}未运行，正在启动...")
            return self.start_service(background=True)
        return True

# 全局服务实例
knowledge_graph_service = KnowledgeGraphService()

def start_knowledge_graph_service():
    """启动知识图谱服务（供外部调用）"""
    return knowledge_graph_service.start_service(background=True)

def stop_knowledge_graph_service():
    """停止知识图谱服务（供外部调用）"""
    knowledge_graph_service.stop_service()

def get_knowledge_graph_status():
    """获取知识图谱服务状态（供外部调用）"""
    return knowledge_graph_service.get_service_status()

def is_knowledge_graph_available():
    """检查知识图谱服务是否可用（供外部调用）"""
    return knowledge_graph_service.is_service_available()

if __name__ == "__main__":
    """命令行启动模式"""
    import argparse
    
    parser = argparse.ArgumentParser(description="知识图谱服务管理器")
    parser.add_argument("--start", action="store_true", help="启动服务")
    parser.add_argument("--stop", action="store_true", help="停止服务")
    parser.add_argument("--status", action="store_true", help="查看状态")
    parser.add_argument("--background", action="store_true", default=True, help="后台运行")
    
    args = parser.parse_args()
    
    if args.status:
        status = knowledge_graph_service.get_service_status()
        print("=" * 60)
        print(f"📊 {status['service_name']}状态")
        print("=" * 60)
        print(f"服务可用: {'✅ 是' if status['available'] else '❌ 否'}")
        print(f"进程运行: {'✅ 是' if status['process_running'] else '❌ 否'}")
        print(f"服务地址: {status['service_url']}")
        print(f"进程ID: {status.get('process_id', 'N/A')}")
        if status.get('health'):
            print(f"健康状态: {status['health']}")
        print("=" * 60)
        
    elif args.stop:
        knowledge_graph_service.stop_service()
        
    elif args.start:
        success = knowledge_graph_service.start_service(background=args.background)
        if success:
            if args.background:
                print(f"✅ {knowledge_graph_service.service_name}已在后台启动")
            else:
                print(f"✅ {knowledge_graph_service.service_name}启动成功")
        else:
            print(f"❌ {knowledge_graph_service.service_name}启动失败")
            sys.exit(1)
    else:
        parser.print_help()