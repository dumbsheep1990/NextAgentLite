from elasticsearch import Elasticsearch
import os

# 本地环境测试连接
es_url = os.getenv('ELASTICSEARCH_URL', 'http://localhost:9200')
es_username = os.getenv('ELASTICSEARCH_USERNAME')
es_password = os.getenv('ELASTICSEARCH_PASSWORD')
es_api_key = os.getenv('ELASTICSEARCH_API_KEY')

# 构建连接配置
es_config = {
    "hosts": [es_url],
    "verify_certs": False,
    "ssl_show_warn": False,
    "ssl_context": None
}

# 添加认证（如果有）
if es_api_key:
    es_config["api_key"] = es_api_key
elif es_username and es_password:
    es_config["basic_auth"] = (es_username, es_password)

es = Elasticsearch(**es_config)
print(f"Elasticsearch连接测试: {es.ping()}")
