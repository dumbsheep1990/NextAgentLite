#!/bin/bash
#################################################
# MinIO对象存储初始化脚本
#
# 功能: 创建所有需要的存储桶并设置权限
# 使用方法: bash init_minio.sh
# 前置条件: 需要先安装 mc 工具
#################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
MINIO_ENDPOINT="${MINIO_ENDPOINT:-localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minio}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minio123}"

echo "======================================"
echo "MinIO 对象存储初始化"
echo "======================================"
echo "服务器: http://${MINIO_ENDPOINT}"
echo "Access Key: ${MINIO_ACCESS_KEY}"
echo ""

# 步骤1: 检查mc是否安装
echo -e "${BLUE}步骤1: 检查MinIO Client (mc)${NC}"
echo "----------------------------------------"

if ! command -v mc &> /dev/null; then
    echo -e "${RED}✗ mc未安装${NC}"
    echo ""
    echo "请先安装 MinIO Client (mc):"
    echo ""
    echo "Linux:"
    echo "  wget https://dl.min.io/client/mc/release/linux-amd64/mc"
    echo "  chmod +x mc"
    echo "  sudo mv mc /usr/local/bin/"
    echo ""
    echo "macOS:"
    echo "  brew install minio/stable/mc"
    echo ""
    echo "或手动下载:"
    echo "  https://min.io/docs/minio/linux/reference/minio-mc.html"
    exit 1
else
    echo -e "${GREEN}✓ mc已安装${NC}"
    mc --version
fi

echo ""

# 步骤2: 配置mc别名
echo -e "${BLUE}步骤2: 配置MinIO连接${NC}"
echo "----------------------------------------"

mc alias set nextagent-minio "http://${MINIO_ENDPOINT}" \
    "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 连接配置成功${NC}"
else
    echo -e "${RED}✗ 连接配置失败${NC}"
    exit 1
fi

# 测试连接
echo -n "测试连接..."
if mc admin info nextagent-minio > /dev/null 2>&1; then
    echo -e " ${GREEN}✓ 成功${NC}"
else
    echo -e " ${RED}✗ 失败${NC}"
    echo ""
    echo "请检查:"
    echo "  1. MinIO服务是否运行"
    echo "  2. 端点地址是否正确: ${MINIO_ENDPOINT}"
    echo "  3. 访问密钥是否正确"
    exit 1
fi

echo ""

# 步骤3: 创建存储桶
echo -e "${BLUE}步骤3: 创建存储桶${NC}"
echo "----------------------------------------"

# 存储桶列表
BUCKETS=(
    "policy-qa-documents:文档存储"
    "policy-qa-media:多媒体文件"
    "policy-qa-thumbnails:缩略图"
    "policy-qa-knowledge-graph:知识图谱资源"
    "policy-qa-reports:生成报告"
    "policy-qa-backups:系统备份"
    "policy-qa-logs:日志归档"
    "policy-qa-cache:临时缓存"
)

SUCCESS=0
SKIPPED=0

for bucket_info in "${BUCKETS[@]}"; do
    # 分离桶名和描述
    bucket_name=$(echo "$bucket_info" | cut -d: -f1)
    bucket_desc=$(echo "$bucket_info" | cut -d: -f2)

    echo ""
    printf "%-35s %-30s " "$bucket_name" "($bucket_desc)"

    # 检查存储桶是否存在
    if mc ls nextagent-minio/$bucket_name > /dev/null 2>&1; then
        echo -e "${YELLOW}已存在${NC}"
        SKIPPED=$((SKIPPED + 1))
    else
        # 创建存储桶
        if mc mb nextagent-minio/$bucket_name > /dev/null 2>&1; then
            echo -e "${GREEN}✓ 创建成功${NC}"
            SUCCESS=$((SUCCESS + 1))
        else
            echo -e "${RED}✗ 创建失败${NC}"
        fi
    fi
done

echo ""
echo "======================================"
echo "创建完成: 新建 $SUCCESS 个, 已存在 $SKIPPED 个"
echo "======================================"

# 步骤4: 设置访问策略
echo ""
echo -e "${BLUE}步骤4: 设置访问策略${NC}"
echo "----------------------------------------"

# 缩略图桶设置为公共读取
echo -n "设置 policy-qa-thumbnails 为公共读取..."
if mc policy set download nextagent-minio/policy-qa-thumbnails > /dev/null 2>&1; then
    echo -e " ${GREEN}✓ 成功${NC}"
else
    echo -e " ${YELLOW}⚠ 失败（可能需要管理员权限）${NC}"
fi

echo ""

# 步骤5: 验证
echo -e "${BLUE}步骤5: 验证存储桶${NC}"
echo "----------------------------------------"
echo ""

for bucket_info in "${BUCKETS[@]}"; do
    bucket_name=$(echo "$bucket_info" | cut -d: -f1)
    bucket_desc=$(echo "$bucket_info" | cut -d: -f2)

    # 获取策略
    POLICY=$(mc policy get nextagent-minio/$bucket_name 2>/dev/null | grep -oP '(private|public|download|upload)' | head -1 || echo "private")

    # 检查存在性
    if mc ls nextagent-minio/$bucket_name > /dev/null 2>&1; then
        STATUS="${GREEN}✓${NC}"
    else
        STATUS="${RED}✗${NC}"
    fi

    printf "  %b %-35s %-30s [%s]\n" "$STATUS" "$bucket_name" "$bucket_desc" "$POLICY"
done

echo ""
echo -e "${GREEN}======================================"
echo "✓ MinIO初始化完成！"
echo "======================================${NC}"

echo ""
echo "下一步:"
echo "  1. 更新应用配置文件中的MinIO端点"
echo "  2. 确保应用可以访问 http://${MINIO_ENDPOINT}"
echo "  3. 测试文件上传功能"
echo ""
echo "注意: 桶名称 (policy-qa-*) 与 .env 配置文件一致"
echo "     如需修改桶名，请同步更新 lite-backend/.env 文件"
