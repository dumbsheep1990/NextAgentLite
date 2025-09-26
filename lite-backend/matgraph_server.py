"""
DataGraph 服务器启动脚本
使用配置文件和环境变量管理 DataGraph 服务
"""
import subprocess
import sys
import os
import time
import signal
from pathlib import Path
from matgraph_config import setup_matgraph_env, get_matgraph_config

# DataGraph 服务器入口（datagraph_server）
DATAGRAPH_SERVER_PATH = Path(__file__).parent / "DataGraph" / "datagraph_core" / "api" / "datagraph_server.py"

class DataGraphServerManager:
    def __init__(self):
        self.process = None
        self.config = get_matgraph_config()
        
    def start_server(self):
        """启动 DataGraph 服务器"""
        if not DATAGRAPH_SERVER_PATH.exists():
            print(f"❌ DataGraph 服务器文件不存在: {DATAGRAPH_SERVER_PATH}")
            return False
            
        try:
            print("🚀 启动 DataGraph 服务器...")
            print(f"📡 服务器端口: {self.config['PORT']}")
            print(f"📁 服务器路径: {DATAGRAPH_SERVER_PATH}")
            print("=" * 60)
            
            # 设置环境变量
            env = os.environ.copy()
            
            # 从配置文件加载环境变量
            setup_matgraph_env()
            
            # 更新当前进程的环境变量
            for key, value in self.config.items():
                env[key] = str(value)
            
            # 创建工作目录
            Path(self.config["WORKING_DIR"]).mkdir(exist_ok=True)
            Path(self.config["INPUT_DIR"]).mkdir(exist_ok=True)
            
            # 启动 DataGraph 服务器
            self.process = subprocess.Popen(
                [sys.executable, str(DATAGRAPH_SERVER_PATH)],
                env=env,
                cwd=DATAGRAPH_SERVER_PATH.parent,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            print(f"✅ DataGraph 服务器已启动 (PID: {self.process.pid})")
            print(f"🌐 访问地址: http://localhost:{self.config['PORT']}")
            print(f"📱 Web UI: http://localhost:{self.config['PORT']}/webui")
            print("\n📋 服务日志:")
            print("-" * 40)
            
            # 实时输出日志
            try:
                for line in iter(self.process.stdout.readline, ''):
                    if line:
                        print(line.rstrip())
                    
                    # 检查进程是否还在运行
                    if self.process.poll() is not None:
                        break
                        
            except KeyboardInterrupt:
                print("\n🛑 收到停止信号，正在关闭服务器...")
                self.stop_server()
                
        except Exception as e:
            print(f"❌ 启动 DataGraph 服务器失败: {e}")
            return False
            
        return True
    
    def stop_server(self):
        """停止 DataGraph 服务器"""
        if self.process and self.process.poll() is None:
            print("🛑 正在停止 DataGraph 服务器...")
            
            try:
                # 尝试优雅关闭
                self.process.terminate()
                
                # 等待最多10秒
                try:
                    self.process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    # 强制关闭
                    print("⚠️  优雅关闭超时，强制终止进程...")
                    self.process.kill()
                    self.process.wait()
                    
                print("✅ DataGraph 服务器已停止")
                
            except Exception as e:
                print(f"❌ 停止服务器时出错: {e}")
                
            self.process = None
    
    def is_running(self):
        """检查服务器是否在运行"""
        return self.process and self.process.poll() is None

def main():
    """主函数"""
    manager = DataGraphServerManager()
    
    # 注册信号处理器
    def signal_handler(sig, frame):
        print(f"\n收到信号 {sig}，正在关闭服务器...")
        manager.stop_server()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # 启动服务器
    success = manager.start_server()
    
    if not success:
        print("❌ 服务器启动失败")
        sys.exit(1)

if __name__ == "__main__":
    main()
