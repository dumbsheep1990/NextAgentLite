#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Elasticsearch索引初始化脚本

使用方法:
    python init_elasticsearch.py --host localhost:9200 --user elastic --password your_password
"""

import json
import requests
import argparse
import sys
from urllib3.exceptions import InsecureRequestWarning

# 禁用SSL警告
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)


def init_elasticsearch(host, username, password, secure=False):
    """初始化Elasticsearch索引"""

    protocol = "https" if secure else "http"
    base_url = f"{protocol}://{host}"
    auth = (username, password) if username and password else None

    print("=" * 60)
    print("Elasticsearch 索引初始化")
    print("=" * 60)
    print(f"服务器: {base_url}")
    print(f"用户: {username}")
    print("")

    # 1. 测试连接
    print("步骤1: 测试连接")
    print("-" * 60)
    try:
        response = requests.get(
            f"{base_url}/_cluster/health",
            auth=auth,
            verify=False,
            timeout=10
        )
        if response.status_code == 200:
            health = response.json()
            print(f"✓ 连接成功")
            print(f"  集群状态: {health['status']}")
            print(f"  节点数: {health['number_of_nodes']}")
        else:
            print(f"✗ 连接失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 连接错误: {str(e)}")
        return False

    print("")

    # 2. 读取索引模板
    print("步骤2: 读取索引模板")
    print("-" * 60)

    template_file = "elasticsearch/elasticsearch_index_templates_v2.json"
    try:
        with open(template_file, 'r', encoding='utf-8') as f:
            templates = json.load(f)
        print(f"✓ 读取到 {len(templates)} 个索引模板")
    except FileNotFoundError:
        print(f"✗ 模板文件不存在: {template_file}")
        return False
    except json.JSONDecodeError as e:
        print(f"✗ JSON解析错误: {str(e)}")
        return False

    print("")

    # 3. 创建索引
    print("步骤3: 创建Elasticsearch索引")
    print("-" * 60)

    # 索引列表
    indices = [
        "mat_qa_chunks",
        "mat_qa_general_vectors",
        "mat_qa_domain_vectors",
        "mat_qa_papers",
        "mat_qa_documents",
        "mat_qa_retrieval_cache",
        "mat_qa_media"
    ]

    success_count = 0
    failed_count = 0

    for index_name in indices:
        print(f"\n创建索引: {index_name}")

        # 检查索引是否已存在
        check_url = f"{base_url}/{index_name}"
        response = requests.head(check_url, auth=auth, verify=False)

        if response.status_code == 200:
            print(f"  ⚠ 索引已存在")
            user_input = input(f"  是否删除并重建? (y/N): ").strip().lower()
            if user_input == 'y':
                # 删除索引
                requests.delete(check_url, auth=auth, verify=False)
                print(f"  ✓ 旧索引已删除")
            else:
                print(f"  ⊙ 跳过")
                continue

        # 创建索引（使用基本配置）
        index_config = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "max_result_window": 50000
            },
            "mappings": {
                "properties": {
                    "content": {"type": "text"},
                    "chunk_id": {"type": "keyword"},
                    "document_id": {"type": "keyword"},
                    "metadata": {"type": "object", "enabled": False}
                }
            }
        }

        # 如果是向量索引，添加向量字段
        if "vectors" in index_name or "chunks" in index_name:
            if "general" in index_name or "chunks" in index_name:
                index_config["mappings"]["properties"]["general_embedding"] = {
                    "type": "dense_vector",
                    "dims": 1024,
                    "similarity": "cosine"
                }
            if "domain" in index_name or "chunks" in index_name:
                index_config["mappings"]["properties"]["domain_embedding"] = {
                    "type": "dense_vector",
                    "dims": 768,
                    "similarity": "cosine"
                }

        try:
            response = requests.put(
                check_url,
                auth=auth,
                verify=False,
                json=index_config,
                timeout=30
            )

            if response.status_code in [200, 201]:
                print(f"  ✓ 创建成功")
                success_count += 1
            else:
                print(f"  ✗ 创建失败: {response.status_code}")
                print(f"     {response.text}")
                failed_count += 1
        except Exception as e:
            print(f"  ✗ 错误: {str(e)}")
            failed_count += 1

    print("")
    print("=" * 60)
    print(f"索引创建完成: 成功 {success_count} 个, 失败 {failed_count} 个")
    print("=" * 60)

    # 4. 验证
    print("\n步骤4: 验证索引")
    print("-" * 60)

    try:
        response = requests.get(
            f"{base_url}/_cat/indices?v",
            auth=auth,
            verify=False
        )
        if response.status_code == 200:
            print(response.text)
    except Exception as e:
        print(f"验证失败: {str(e)}")

    return success_count > 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="初始化Elasticsearch索引")
    parser.add_argument("--host", default="localhost:9200", help="ES主机地址")
    parser.add_argument("--user", default="elastic", help="ES用户名")
    parser.add_argument("--password", required=True, help="ES密码")
    parser.add_argument("--secure", action="store_true", help="使用HTTPS")

    args = parser.parse_args()

    success = init_elasticsearch(
        args.host,
        args.user,
        args.password,
        args.secure
    )

    sys.exit(0 if success else 1)
