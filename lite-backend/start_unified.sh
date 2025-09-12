#!/bin/bash
# NextAgentLite 统一环境启动脚本
# 使用 zzdsj-lite 环境 (Python 3.12.11)

echo "=========================================="
echo "NextAgentLite 统一环境启动"
echo "=========================================="
echo ""

# 激活conda环境
echo "激活 zzdsj-lite 环境..."
source /opt/anaconda3/etc/profile.d/conda.sh
conda activate zzdsj-lite

# 显示环境信息
echo "Python环境信息:"
which python
python --version
echo ""

# 检查关键依赖
echo "检查关键依赖:"
python -c "
import agno
import utu
from youtu_agent_integration.core import YoutuAgentCore
print(f'  - agno: {agno.__version__}')
print('  - utu: OK')
print('  - youtu_agent_integration: OK')
" 2>/dev/null || echo "警告: 部分依赖检查失败，但系统可能仍可运行"
echo ""

# 加载环境变量
if [ -f .env ]; then
    echo "加载 .env 配置文件..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "警告: 未找到 .env 文件，使用默认配置"
fi

# 启动服务
echo "启动后端服务..."
echo "   地址: http://localhost:8000"
echo "   API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止服务"
echo "=========================================="
echo ""

# 使用zzdsj-lite环境的Python启动
/opt/anaconda3/envs/zzdsj-lite/bin/python main.py