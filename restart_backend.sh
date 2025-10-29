#!/bin/bash

echo "========================================"
echo "重启NextAgentLite后端服务"
echo "========================================"

# 进入项目目录
cd /Users/wxn/Desktop/NextAgentLite

echo ""
echo "1. 停止现有后端服务..."
pm2 stop lite-backend

echo ""
echo "2. 等待2秒..."
sleep 2

echo ""
echo "3. 启动后端服务..."
pm2 start lite-backend

echo ""
echo "4. 查看服务状态..."
pm2 status

echo ""
echo "5. 查看最近日志..."
pm2 logs lite-backend --lines 20 --nostream

echo ""
echo "========================================"
echo "重启完成！"
echo "========================================"
echo ""
echo "测试API端点:"
echo "  curl http://localhost:8000/api/v1/hook-pipelines/available/hooks"
echo "  curl http://localhost:8000/api/v1/hook-pipelines/statistics"
