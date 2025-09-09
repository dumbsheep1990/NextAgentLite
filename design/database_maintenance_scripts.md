# MAT-DEMO 数据库维护脚本集合

## 概述
本文档包含MAT-DEMO地聚物材料智能问答系统的数据库维护脚本，包括PostgreSQL、ElasticSearch、Redis的常用运维操作。

## 1. PostgreSQL 维护脚本

### 1.1 数据库健康检查
```sql
-- 查看数据库连接状态
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change
FROM pg_stat_activity 
WHERE state = 'active';

-- 查看表大小和记录数统计
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_stat_get_tuples_returned(c.oid) as row_estimate,
    pg_stat_get_tuples_inserted(c.oid) as inserts,
    pg_stat_get_tuples_updated(c.oid) as updates,
    pg_stat_get_tuples_deleted(c.oid) as deletes
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看索引使用情况
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### 1.2 性能优化脚本
```sql
-- 更新表统计信息
ANALYZE;

-- 重建索引（谨慎使用）
-- REINDEX INDEX CONCURRENTLY idx_name;

-- 清理过期数据
DELETE FROM retrieval_results WHERE expires_at < NOW() - INTERVAL '7 days';
DELETE FROM task_queue WHERE status = 'completed' AND completed_at < NOW() - INTERVAL '30 days';

-- 查看慢查询
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC 
LIMIT 20;
```

### 1.3 数据备份脚本
```bash
#!/bin/bash
# PostgreSQL备份脚本

DB_NAME="mat_demo"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 全量备份
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$BACKUP_DIR/${DB_NAME}_full_$DATE.sql"

# 压缩备份文件
gzip "$BACKUP_DIR/${DB_NAME}_full_$DATE.sql"

# 清理7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "备份完成: ${DB_NAME}_full_$DATE.sql.gz"
```

## 2. ElasticSearch 维护脚本

### 2.1 集群健康检查
```bash
#!/bin/bash
# ElasticSearch健康检查脚本

ES_HOST="localhost:9200"

echo "=== ElasticSearch 集群状态 ==="
curl -X GET "$ES_HOST/_cluster/health?pretty"

echo -e "\n=== 索引统计 ==="
curl -X GET "$ES_HOST/_cat/indices?v&s=store.size:desc"

echo -e "\n=== 节点信息 ==="
curl -X GET "$ES_HOST/_cat/nodes?v"

echo -e "\n=== 分片状态 ==="
curl -X GET "$ES_HOST/_cat/shards?v&s=index"
```

### 2.2 索引维护脚本
```python
#!/usr/bin/env python3
"""
ElasticSearch索引维护脚本
"""

from elasticsearch import Elasticsearch
from datetime import datetime, timedelta
import json

class ESMaintenance:
    def __init__(self, hosts=["localhost:9200"]):
        self.es = Elasticsearch(hosts)
    
    def cleanup_old_cache(self, days=7):
        """清理过期缓存索引"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        query = {
            "query": {
                "range": {
                    "expires_at": {
                        "lt": cutoff_date.isoformat()
                    }
                }
            }
        }
        
        result = self.es.delete_by_query(
            index="mat_qa_retrieval_cache",
            body=query
        )
        
        print(f"清理了 {result['deleted']} 条过期缓存记录")
    
    def reindex_with_new_mapping(self, source_index, target_index, new_mapping):
        """使用新映射重建索引"""
        # 创建目标索引
        self.es.indices.create(index=target_index, body=new_mapping)
        
        # 重建索引
        reindex_body = {
            "source": {"index": source_index},
            "dest": {"index": target_index}
        }
        
        task = self.es.reindex(body=reindex_body, wait_for_completion=False)
        print(f"重建索引任务ID: {task['task']}")
        
        return task['task']
    
    def optimize_indices(self):
        """优化索引"""
        indices = ["mat_qa_chunks", "mat_qa_papers", "mat_qa_documents"]
        
        for index in indices:
            try:
                self.es.indices.forcemerge(index=index, max_num_segments=1)
                print(f"优化索引: {index}")
            except Exception as e:
                print(f"优化失败 {index}: {e}")
    
    def backup_index(self, index_name, backup_path):
        """备份索引数据"""
        from elasticsearch.helpers import scan
        import os
        
        docs = scan(self.es, index=index_name)
        backup_file = os.path.join(backup_path, f"{index_name}_backup.jsonl")
        
        with open(backup_file, 'w', encoding='utf-8') as f:
            for doc in docs:
                f.write(json.dumps(doc) + '\n')
        
        print(f"索引备份完成: {backup_file}")

# 使用示例
if __name__ == "__main__":
    maintenance = ESMaintenance()
    
    # 清理过期缓存
    maintenance.cleanup_old_cache(days=7)
    
    # 优化索引
    maintenance.optimize_indices()
```

### 2.3 索引模板更新脚本
```python
#!/usr/bin/env python3
"""
ElasticSearch索引模板更新脚本
"""

import json
from elasticsearch import Elasticsearch

def update_index_templates(es_host="localhost:9200"):
    """更新索引模板"""
    es = Elasticsearch([es_host])
    
    # 加载新的模板配置
    with open('elasticsearch_index_templates.json', 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    templates = config['elasticsearch_index_design']['index_templates']
    
    for template_name, template_config in templates.items():
        try:
            # 检查是否需要更新
            existing = None
            try:
                existing = es.indices.get_template(name=template_name)
            except:
                pass
            
            if existing:
                # 比较版本
                current_version = existing[template_name].get('version', 0)
                new_version = template_config.get('version', 1)
                
                if new_version <= current_version:
                    print(f"跳过模板 {template_name} (版本 {current_version} >= {new_version})")
                    continue
            
            # 更新模板
            es.indices.put_template(
                name=template_name,
                body=template_config
            )
            print(f"更新模板: {template_name}")
            
        except Exception as e:
            print(f"更新模板失败 {template_name}: {e}")

if __name__ == "__main__":
    update_index_templates()
```

## 3. Redis 维护脚本

### 3.1 Redis监控脚本
```python
#!/usr/bin/env python3
"""
Redis监控和维护脚本
"""

import redis
import time
import json
from datetime import datetime

class RedisMonitor:
    def __init__(self, host='localhost', port=6379, db=0):
        self.redis = redis.Redis(host=host, port=port, db=db, decode_responses=True)
    
    def get_memory_stats(self):
        """获取内存使用统计"""
        info = self.redis.info('memory')
        return {
            'used_memory_human': info.get('used_memory_human'),
            'used_memory_peak_human': info.get('used_memory_peak_human'),
            'used_memory_rss_human': info.get('used_memory_rss_human'),
            'mem_fragmentation_ratio': info.get('mem_fragmentation_ratio')
        }
    
    def get_key_stats(self):
        """获取键统计信息"""
        info = self.redis.info('keyspace')
        db_info = info.get('db0', {})
        return {
            'total_keys': self.redis.dbsize(),
            'db0_keys': db_info.get('keys', 0),
            'db0_expires': db_info.get('expires', 0)
        }
    
    def analyze_key_patterns(self):
        """分析键模式"""
        patterns = {}
        cursor = 0
        
        while True:
            cursor, keys = self.redis.scan(cursor, count=1000)
            for key in keys:
                pattern = key.split(':')[0] if ':' in key else 'no_namespace'
                patterns[pattern] = patterns.get(pattern, 0) + 1
            
            if cursor == 0:
                break
        
        return patterns
    
    def cleanup_expired_keys(self):
        """清理过期键"""
        cursor = 0
        expired_count = 0
        
        while True:
            cursor, keys = self.redis.scan(cursor, match="*cache:*", count=1000)
            
            for key in keys:
                try:
                    data = self.redis.get(key)
                    if data:
                        parsed = json.loads(data)
                        expires_at = parsed.get('expires_at')
                        if expires_at and expires_at < time.time():
                            self.redis.delete(key)
                            expired_count += 1
                except:
                    continue
            
            if cursor == 0:
                break
        
        print(f"清理了 {expired_count} 个过期键")
        return expired_count
    
    def get_slow_log(self, count=10):
        """获取慢查询日志"""
        return self.redis.slowlog_get(count)
    
    def monitor_realtime(self, duration=60):
        """实时监控"""
        print(f"开始 {duration} 秒实时监控...")
        start_time = time.time()
        
        while time.time() - start_time < duration:
            stats = {
                'timestamp': datetime.now().isoformat(),
                'memory': self.get_memory_stats(),
                'keys': self.get_key_stats(),
                'clients': self.redis.info('clients')['connected_clients']
            }
            
            print(f"[{stats['timestamp']}] "
                  f"内存: {stats['memory']['used_memory_human']}, "
                  f"键数: {stats['keys']['total_keys']}, "
                  f"连接数: {stats['clients']}")
            
            time.sleep(5)

# 使用示例
if __name__ == "__main__":
    monitor = RedisMonitor()
    
    print("=== Redis 状态监控 ===")
    print("内存统计:", monitor.get_memory_stats())
    print("键统计:", monitor.get_key_stats())
    print("键模式分析:", monitor.analyze_key_patterns())
    
    # 清理过期键
    monitor.cleanup_expired_keys()
```

### 3.2 Redis备份脚本
```bash
#!/bin/bash
# Redis备份脚本

REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_DB="0"
BACKUP_DIR="/backup/redis"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# RDB备份
redis-cli -h $REDIS_HOST -p $REDIS_PORT BGSAVE

# 等待备份完成
sleep 10

# 复制RDB文件
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/dump_$DATE.rdb"

# 压缩备份
gzip "$BACKUP_DIR/dump_$DATE.rdb"

# 清理7天前的备份
find $BACKUP_DIR -name "dump_*.rdb.gz" -mtime +7 -delete

echo "Redis备份完成: dump_$DATE.rdb.gz"
```

### 3.3 Redis性能调优脚本
```python
#!/usr/bin/env python3
"""
Redis性能分析和调优脚本
"""

import redis
import time
import statistics

class RedisPerformanceTuner:
    def __init__(self, host='localhost', port=6379, db=0):
        self.redis = redis.Redis(host=host, port=port, db=db, decode_responses=True)
    
    def benchmark_operations(self):
        """基准测试操作"""
        operations = {
            'SET': lambda: self.redis.set(f'benchmark_key_{time.time()}', 'test_value'),
            'GET': lambda: self.redis.get('benchmark_key'),
            'INCR': lambda: self.redis.incr('benchmark_counter'),
            'LPUSH': lambda: self.redis.lpush('benchmark_list', 'item'),
            'SADD': lambda: self.redis.sadd('benchmark_set', f'member_{time.time()}')
        }
        
        results = {}
        for op_name, operation in operations.items():
            times = []
            for _ in range(100):
                start = time.time()
                operation()
                end = time.time()
                times.append((end - start) * 1000)  # 转换为毫秒
            
            results[op_name] = {
                'avg_ms': statistics.mean(times),
                'min_ms': min(times),
                'max_ms': max(times),
                'p95_ms': statistics.quantiles(times, n=20)[18]  # 95th percentile
            }
        
        # 清理测试数据
        self.redis.delete('benchmark_key', 'benchmark_counter', 'benchmark_list', 'benchmark_set')
        
        return results
    
    def analyze_memory_usage(self):
        """分析内存使用"""
        cursor = 0
        memory_by_type = {}
        sample_count = 0
        max_samples = 1000
        
        while cursor != 0 or sample_count == 0:
            cursor, keys = self.redis.scan(cursor, count=100)
            
            for key in keys:
                if sample_count >= max_samples:
                    break
                
                try:
                    key_type = self.redis.type(key)
                    memory_usage = self.redis.memory_usage(key)
                    
                    if key_type not in memory_by_type:
                        memory_by_type[key_type] = []
                    
                    memory_by_type[key_type].append(memory_usage)
                    sample_count += 1
                    
                except:
                    continue
            
            if sample_count >= max_samples:
                break
        
        # 计算统计信息
        stats = {}
        for key_type, memory_list in memory_by_type.items():
            stats[key_type] = {
                'count': len(memory_list),
                'total_bytes': sum(memory_list),
                'avg_bytes': statistics.mean(memory_list),
                'max_bytes': max(memory_list),
                'min_bytes': min(memory_list)
            }
        
        return stats
    
    def find_large_keys(self, threshold_bytes=1024):
        """查找大键"""
        cursor = 0
        large_keys = []
        
        while True:
            cursor, keys = self.redis.scan(cursor, count=100)
            
            for key in keys:
                try:
                    memory_usage = self.redis.memory_usage(key)
                    if memory_usage > threshold_bytes:
                        key_info = {
                            'key': key,
                            'type': self.redis.type(key),
                            'memory_bytes': memory_usage,
                            'ttl': self.redis.ttl(key)
                        }
                        
                        # 获取元素数量
                        if key_info['type'] == 'string':
                            key_info['size'] = len(self.redis.get(key) or '')
                        elif key_info['type'] == 'list':
                            key_info['size'] = self.redis.llen(key)
                        elif key_info['type'] == 'set':
                            key_info['size'] = self.redis.scard(key)
                        elif key_info['type'] == 'hash':
                            key_info['size'] = self.redis.hlen(key)
                        elif key_info['type'] == 'zset':
                            key_info['size'] = self.redis.zcard(key)
                        
                        large_keys.append(key_info)
                        
                except:
                    continue
            
            if cursor == 0:
                break
        
        # 按内存使用排序
        large_keys.sort(key=lambda x: x['memory_bytes'], reverse=True)
        return large_keys
    
    def generate_report(self):
        """生成性能报告"""
        print("=== Redis 性能分析报告 ===")
        print(f"生成时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 基本信息
        info = self.redis.info()
        print(f"\n=== 基本信息 ===")
        print(f"Redis版本: {info['redis_version']}")
        print(f"运行时间: {info['uptime_in_seconds']} 秒")
        print(f"总键数: {self.redis.dbsize()}")
        print(f"内存使用: {info['used_memory_human']}")
        print(f"连接数: {info['connected_clients']}")
        
        # 基准测试
        print(f"\n=== 操作性能基准 ===")
        benchmark = self.benchmark_operations()
        for op, stats in benchmark.items():
            print(f"{op}: 平均 {stats['avg_ms']:.2f}ms, "
                  f"P95 {stats['p95_ms']:.2f}ms, "
                  f"最大 {stats['max_ms']:.2f}ms")
        
        # 内存分析
        print(f"\n=== 内存使用分析 ===")
        memory_stats = self.analyze_memory_usage()
        for key_type, stats in memory_stats.items():
            print(f"{key_type}: {stats['count']} 个键, "
                  f"平均 {stats['avg_bytes']} 字节, "
                  f"总计 {stats['total_bytes']} 字节")
        
        # 大键分析
        print(f"\n=== 大键分析 (>1KB) ===")
        large_keys = self.find_large_keys(1024)[:10]  # 显示前10个
        for key_info in large_keys:
            print(f"{key_info['key']}: {key_info['memory_bytes']} 字节, "
                  f"类型 {key_info['type']}, "
                  f"大小 {key_info.get('size', 'N/A')}")

# 使用示例
if __name__ == "__main__":
    tuner = RedisPerformanceTuner()
    tuner.generate_report()
```

## 4. 综合维护脚本

### 4.1 每日维护脚本
```bash
#!/bin/bash
# MAT-DEMO 每日维护脚本

LOG_FILE="/var/log/mat-demo-maintenance.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] 开始每日维护任务" >> $LOG_FILE

# PostgreSQL维护
echo "[$DATE] PostgreSQL维护..." >> $LOG_FILE
psql -d mat_demo -c "DELETE FROM retrieval_results WHERE expires_at < NOW() - INTERVAL '7 days';" >> $LOG_FILE 2>&1
psql -d mat_demo -c "DELETE FROM task_queue WHERE status = 'completed' AND completed_at < NOW() - INTERVAL '30 days';" >> $LOG_FILE 2>&1

# ElasticSearch维护
echo "[$DATE] ElasticSearch维护..." >> $LOG_FILE
python3 /scripts/es_cleanup.py >> $LOG_FILE 2>&1

# Redis维护
echo "[$DATE] Redis维护..." >> $LOG_FILE
python3 /scripts/redis_cleanup.py >> $LOG_FILE 2>&1

echo "[$DATE] 每日维护任务完成" >> $LOG_FILE
```

### 4.2 健康检查脚本
```python
#!/usr/bin/env python3
"""
MAT-DEMO 系统健康检查脚本
"""

import psycopg2
import redis
from elasticsearch import Elasticsearch
import json
import time
from datetime import datetime

class SystemHealthChecker:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'postgresql': {},
            'elasticsearch': {},
            'redis': {},
            'overall_status': 'unknown'
        }
    
    def check_postgresql(self):
        """检查PostgreSQL状态"""
        try:
            conn = psycopg2.connect(
                host="localhost",
                database="mat_demo",
                user="postgres",
                password="your_password"
            )
            cursor = conn.cursor()
            
            # 基本连接测试
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            
            # 检查表数量
            cursor.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
            table_count = cursor.fetchone()[0]
            
            # 检查数据量
            cursor.execute("SELECT count(*) FROM users;")
            user_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT count(*) FROM conversations;")
            conv_count = cursor.fetchone()[0]
            
            self.results['postgresql'] = {
                'status': 'healthy',
                'version': version,
                'table_count': table_count,
                'user_count': user_count,
                'conversation_count': conv_count
            }
            
            conn.close()
            
        except Exception as e:
            self.results['postgresql'] = {
                'status': 'error',
                'error': str(e)
            }
    
    def check_elasticsearch(self):
        """检查ElasticSearch状态"""
        try:
            es = Elasticsearch(['localhost:9200'])
            
            # 集群健康状态
            health = es.cluster.health()
            
            # 索引统计
            indices = es.cat.indices(format='json')
            index_count = len(indices)
            
            # 文档总数
            stats = es.cluster.stats()
            doc_count = stats['indices']['docs']['count']
            
            self.results['elasticsearch'] = {
                'status': 'healthy',
                'cluster_status': health['status'],
                'node_count': health['number_of_nodes'],
                'index_count': index_count,
                'document_count': doc_count
            }
            
        except Exception as e:
            self.results['elasticsearch'] = {
                'status': 'error',
                'error': str(e)
            }
    
    def check_redis(self):
        """检查Redis状态"""
        try:
            r = redis.Redis(host='localhost', port=6379, db=0)
            
            # 基本连接测试
            r.ping()
            
            # 获取基本信息
            info = r.info()
            
            self.results['redis'] = {
                'status': 'healthy',
                'version': info['redis_version'],
                'memory_used': info['used_memory_human'],
                'connected_clients': info['connected_clients'],
                'total_keys': r.dbsize()
            }
            
        except Exception as e:
            self.results['redis'] = {
                'status': 'error',
                'error': str(e)
            }
    
    def determine_overall_status(self):
        """确定整体状态"""
        statuses = [
            self.results['postgresql'].get('status'),
            self.results['elasticsearch'].get('status'),
            self.results['redis'].get('status')
        ]
        
        if all(status == 'healthy' for status in statuses):
            self.results['overall_status'] = 'healthy'
        elif any(status == 'error' for status in statuses):
            self.results['overall_status'] = 'critical'
        else:
            self.results['overall_status'] = 'degraded'
    
    def run_check(self):
        """执行完整健康检查"""
        print("开始系统健康检查...")
        
        self.check_postgresql()
        self.check_elasticsearch()
        self.check_redis()
        self.determine_overall_status()
        
        return self.results
    
    def generate_report(self):
        """生成健康检查报告"""
        results = self.run_check()
        
        print("\n=== MAT-DEMO 系统健康检查报告 ===")
        print(f"检查时间: {results['timestamp']}")
        print(f"整体状态: {results['overall_status'].upper()}")
        
        print(f"\n--- PostgreSQL ---")
        pg = results['postgresql']
        if pg['status'] == 'healthy':
            print(f"状态: ✅ 正常")
            print(f"版本: {pg.get('version', 'N/A')}")
            print(f"表数量: {pg.get('table_count', 'N/A')}")
            print(f"用户数: {pg.get('user_count', 'N/A')}")
            print(f"对话数: {pg.get('conversation_count', 'N/A')}")
        else:
            print(f"状态: ❌ 错误")
            print(f"错误: {pg.get('error', 'N/A')}")
        
        print(f"\n--- ElasticSearch ---")
        es = results['elasticsearch']
        if es['status'] == 'healthy':
            print(f"状态: ✅ 正常")
            print(f"集群状态: {es.get('cluster_status', 'N/A')}")
            print(f"节点数: {es.get('node_count', 'N/A')}")
            print(f"索引数: {es.get('index_count', 'N/A')}")
            print(f"文档数: {es.get('document_count', 'N/A')}")
        else:
            print(f"状态: ❌ 错误")
            print(f"错误: {es.get('error', 'N/A')}")
        
        print(f"\n--- Redis ---")
        rd = results['redis']
        if rd['status'] == 'healthy':
            print(f"状态: ✅ 正常")
            print(f"版本: {rd.get('version', 'N/A')}")
            print(f"内存使用: {rd.get('memory_used', 'N/A')}")
            print(f"连接数: {rd.get('connected_clients', 'N/A')}")
            print(f"键总数: {rd.get('total_keys', 'N/A')}")
        else:
            print(f"状态: ❌ 错误")
            print(f"错误: {rd.get('error', 'N/A')}")
        
        return results

if __name__ == "__main__":
    checker = SystemHealthChecker()
    results = checker.generate_report()
    
    # 保存结果到文件
    with open('/tmp/health_check_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n详细结果已保存到: /tmp/health_check_results.json")
```

## 5. 自动化部署脚本

### 5.1 Docker Compose 维护
```yaml
# docker-compose.maintenance.yml
version: '3.8'

services:
  db-backup:
    image: postgres:14
    volumes:
      - /backup/postgresql:/backup
    environment:
      PGPASSWORD: ${POSTGRES_PASSWORD}
    command: |
      sh -c "
        pg_dump -h postgres -U postgres -d mat_demo > /backup/mat_demo_$$(date +%Y%m%d_%H%M%S).sql &&
        find /backup -name '*.sql' -mtime +7 -delete
      "
    depends_on:
      - postgres
  
  es-maintenance:
    image: curlimages/curl:latest
    volumes:
      - ./scripts:/scripts
    command: |
      sh -c "
        curl -X POST 'elasticsearch:9200/mat_qa_*/_forcemerge?max_num_segments=1' &&
        curl -X DELETE 'elasticsearch:9200/mat_qa_retrieval_cache/_doc/_query' -H 'Content-Type: application/json' -d '{\"query\":{\"range\":{\"expires_at\":{\"lt\":\"now-7d\"}}}}'
      "
    depends_on:
      - elasticsearch
  
  redis-cleanup:
    image: redis:7-alpine
    command: |
      sh -c "
        redis-cli -h redis BGSAVE &&
        sleep 10 &&
        redis-cli -h redis --scan --pattern '*:cache:*' | xargs -r redis-cli -h redis DEL
      "
    depends_on:
      - redis
```

### 5.2 Kubernetes维护Job
```yaml
# k8s-maintenance-job.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mat-demo-maintenance
spec:
  schedule: "0 2 * * *"  # 每天凌晨2点执行
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: maintenance
            image: mat-demo/maintenance:latest
            command: ["/scripts/daily_maintenance.sh"]
            env:
            - name: POSTGRES_HOST
              value: "postgres-service"
            - name: REDIS_HOST
              value: "redis-service"
            - name: ES_HOST
              value: "elasticsearch-service:9200"
            volumeMounts:
            - name: backup-volume
              mountPath: /backup
          restartPolicy: OnFailure
          volumes:
          - name: backup-volume
            persistentVolumeClaim:
              claimName: backup-pvc
```

## 6. 监控和告警

### 6.1 Prometheus监控配置
```yaml
# prometheus-rules.yml
groups:
- name: mat-demo
  rules:
  - alert: PostgreSQLDown
    expr: up{job="postgresql"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "PostgreSQL数据库不可用"
      
  - alert: ElasticSearchDown
    expr: up{job="elasticsearch"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "ElasticSearch服务不可用"
      
  - alert: RedisDown
    expr: up{job="redis"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Redis服务不可用"
      
  - alert: HighMemoryUsage
    expr: (redis_memory_used_bytes / redis_memory_max_bytes) > 0.9
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Redis内存使用率过高"
```

### 6.2 日志聚合配置
```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/mat-demo/*.log
  fields:
    service: mat-demo
  multiline.pattern: '^\d{4}-\d{2}-\d{2}'
  multiline.negate: true
  multiline.match: after

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "mat-demo-logs-%{+yyyy.MM.dd}"

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

这套维护脚本集合提供了MAT-DEMO系统的完整运维支持，包括日常维护、性能监控、备份恢复、健康检查等功能。根据实际部署环境调整配置参数和路径。