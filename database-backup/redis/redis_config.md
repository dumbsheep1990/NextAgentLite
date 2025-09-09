# Redis Configuration Export

**Database**: NextAgent Lite Redis Cache & Queue  
**Server**: 103.6.168.6:6379  
**Export Date**: 2025-08-27  

## Connection Configuration

```yaml
redis:
  host: "103.6.168.6"
  port: 6379
  password: "zzdsj123"
  db: 0
  timeout: 10
  max_connections: 20
  connection_pool:
    max_connections: 20
    retry_on_timeout: true
    health_check_interval: 30
```

## Usage in NextAgent Lite

### 1. Caching Layer
- **LLM Response Cache**: Stores expensive API call results
- **Translation Cache**: Caches translation results with TTL
- **Configuration Cache**: System settings and model configs
- **Session Cache**: User session data and preferences

### 2. Task Queue System
- **File Processing Queue**: Document upload and processing tasks
- **Vectorization Queue**: Embedding generation tasks  
- **Background Jobs**: Cleanup, statistics, maintenance
- **Priority Queues**: Different priority levels for urgent tasks

### 3. Real-time Features
- **SSE Connection Tracking**: Active websocket connections
- **User Activity**: Live user status and activity
- **System Metrics**: Performance counters and statistics
- **Rate Limiting**: API call rate limiting per user

## Key Data Patterns

### Cache Keys Structure
```
# LLM Cache
llm_cache:{model}:{hash} = {response_data}
TTL: 1 hour

# Translation Cache  
translation:{source_lang}:{target_lang}:{hash} = {translated_text}
TTL: 24 hours

# User Sessions
session:{session_id} = {user_data}
TTL: 30 minutes

# Configuration Cache
config:{category}:{key} = {value}
TTL: 6 hours
```

### Queue Keys Structure
```
# Task Queues
queue:document_processing = list of task_ids
queue:vectorization = list of task_ids  
queue:high_priority = list of urgent_task_ids
queue:cleanup = list of maintenance_task_ids

# Task Data
task:{task_id} = {task_details_json}
TTL: 24 hours after completion

# Worker Status
worker:{worker_id} = {worker_status}
TTL: 5 minutes (heartbeat)
```

### Real-time Features
```
# Active Connections
sse_connections:{session_id} = set of connection_ids
TTL: Connection lifetime

# User Activity
user_activity:{user_id} = {last_activity_timestamp}
TTL: 1 hour

# System Metrics
metrics:api_calls:{minute} = counter
metrics:errors:{minute} = counter  
metrics:response_time:{minute} = average
TTL: 1 hour
```

## Configuration Commands

### 1. Basic Redis Setup
```bash
# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Configure Redis (edit /etc/redis/redis.conf)
bind 0.0.0.0
port 6379
requirepass zzdsj123
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### 2. Security Settings
```bash
# In redis.conf
requirepass zzdsj123
protected-mode yes
bind 103.6.168.6 127.0.0.1

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
```

### 3. Performance Tuning
```bash
# Memory optimization
maxmemory 2gb
maxmemory-policy allkeys-lru
maxmemory-samples 10

# Network optimization  
tcp-keepalive 300
tcp-backlog 511
timeout 0

# Persistence (for development)
save 900 1
save 300 10  
save 60 10000
```

## Data Export Commands

### Export All Data
```bash
# Create RDB snapshot
redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 BGSAVE

# Export specific patterns
redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 --scan --pattern "llm_cache:*" > llm_cache_keys.txt
redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 --scan --pattern "queue:*" > queue_keys.txt
redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 --scan --pattern "session:*" > session_keys.txt
```

### Backup Script
```bash
#!/bin/bash
# backup_redis.sh

REDIS_HOST="103.6.168.6"
REDIS_PORT="6379"  
REDIS_PASS="zzdsj123"
BACKUP_DIR="/backup/redis/$(date +%Y%m%d_%H%M%S)"

mkdir -p $BACKUP_DIR

# Export key patterns
patterns=("llm_cache:*" "translation:*" "config:*" "queue:*" "task:*" "session:*" "sse_connections:*" "metrics:*")

for pattern in "${patterns[@]}"; do
    echo "Exporting pattern: $pattern"
    redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS --scan --pattern "$pattern" > "$BACKUP_DIR/keys_${pattern//:/_}.txt"
done

# Create RDB snapshot
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS BGSAVE
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/"

echo "Redis backup completed in $BACKUP_DIR"
```

## Migration Notes

### To New Redis Instance
1. **Install Redis** with same version (6.x+)
2. **Configure authentication** and network settings
3. **Import RDB file** or use MIGRATE commands
4. **Update application configuration** with new connection details
5. **Test cache functionality** and queue processing

### Data Cleanup Recommendations
```bash
# Clean expired sessions (run periodically)
redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 --scan --pattern "session:*" | \
while read key; do
    ttl=$(redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 TTL "$key")
    if [ "$ttl" -eq -1 ]; then
        echo "Key $key has no TTL, setting to 1 hour"
        redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 EXPIRE "$key" 3600
    fi
done

# Clean old metrics (keep last 24 hours)
redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 --scan --pattern "metrics:*" | \
while read key; do
    redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 EXPIRE "$key" 86400
done
```

## Monitoring Commands

```bash
# Check Redis status
redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 INFO

# Monitor memory usage
redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 INFO memory

# Check connected clients  
redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 CLIENT LIST

# Monitor commands in real-time
redis-cli -h 103.6.168.6 -p 6379 -a zzdsj123 MONITOR
```