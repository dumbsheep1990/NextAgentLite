# 任务队列系统使用指南

## 概述

新的任务队列系统替代了原有的内存任务管理器，提供了以下改进：

- **持久化存储**: 任务状态存储在数据库中，支持页面刷新后恢复
- **并发控制**: 限制同时处理的任务数量，防止系统过载
- **依赖管理**: 支持任务间的依赖关系
- **状态跟踪**: 实时任务进度跟踪和错误处理
- **自动重试**: 失败任务的自动重试机制

## 部署步骤

### 1. 数据库迁移

```bash
# 进入后端目录
cd mat-backend

# 应用任务队列系统迁移
python scripts/apply_task_queue_migration.py

# 或者手动执行SQL
psql -h localhost -U your_user -d your_database -f migrations/20250120_add_task_queue_system.sql
```

### 2. 启动增强任务管理器

在 `main.py` 中添加任务管理器初始化：

```python
from service.enhanced_task_manager import enhanced_task_manager

@app.on_event("startup")
async def startup_event():
    # 其他初始化代码...
    await enhanced_task_manager.initialize()

@app.on_event("shutdown")
async def shutdown_event():
    await enhanced_task_manager.shutdown()
```

### 3. 前端集成

在需要任务监控的页面中添加 `TaskStateRecovery` 组件：

```tsx
import { TaskStateRecovery } from '../../components/common';

const YourPage: React.FC = () => {
  const [sessionId] = useState(() => 
    `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  return (
    <div>
      {/* 其他页面内容 */}
      
      <TaskStateRecovery
        sessionId={sessionId}
        onTaskComplete={(taskId, result) => {
          console.log('任务完成:', taskId, result);
        }}
        onTaskError={(taskId, error) => {
          console.error('任务失败:', taskId, error);
        }}
      />
    </div>
  );
};
```

## API 端点

### 任务提交

```bash
POST /tasks/submit
{
  "task_type": "document_processing",
  "task_data": {
    "document_id": "doc_123",
    "config": {...}
  },
  "session_id": "session_xxx",
  "priority": 1
}
```

### 批量文档任务

```bash
POST /tasks/batch/documents
{
  "documents": [
    {
      "document_id": "doc_1",
      "config": {...},
      "vector_config": {...}
    }
  ],
  "session_id": "session_xxx",
  "enable_vectorization": true
}
```

### 任务状态查询

```bash
# 单个任务状态
GET /tasks/{task_id}/status

# 会话所有任务状态
GET /tasks/session/{session_id}/status

# 活跃任务（用于状态恢复）
GET /tasks/session/{session_id}/active
```

### 任务控制

```bash
# 取消单个任务
POST /tasks/{task_id}/cancel

# 取消会话所有任务
POST /tasks/session/{session_id}/cancel

# 重试失败任务
POST /tasks/retry/{task_id}
```

### 系统监控

```bash
# 队列统计信息
GET /tasks/queue/statistics

# 系统健康状态
GET /tasks/health

# 清理旧任务
POST /tasks/cleanup?hours=168
```

## ES数据清理工具

### 基本用法

```bash
# 进入后端目录
cd mat-backend

# 查看所有索引
python scripts/es_data_cleanup.py --list-indices

# 清空特定索引
python scripts/es_data_cleanup.py --clear-index knowledge_chunks --confirm

# 删除索引
python scripts/es_data_cleanup.py --delete-index old_index --confirm

# 清理失败任务数据（7天前）
python scripts/es_data_cleanup.py --cleanup-failed-tasks --days 7

# 清理孤立数据
python scripts/es_data_cleanup.py --cleanup-orphaned --confirm

# 获取清理摘要
python scripts/es_data_cleanup.py --summary
```

### 危险操作

```bash
# 清空所有索引（谨慎使用）
python scripts/es_data_cleanup.py --clear-all --confirm

# 重建索引映射
python scripts/es_data_cleanup.py --rebuild-mappings knowledge_chunks
```

## 任务类型

### 1. 文档处理 (document_processing)

处理文档解析和分块：

```python
task_data = {
    "document_id": "doc_123",
    "config": {
        "chunk_size": 512,
        "chunk_overlap": 50,
        "strategy": "semantic"
    }
}
```

### 2. 向量化 (vectorization)

处理文档向量化：

```python
task_data = {
    "document_id": "doc_123",
    "vector_config": {
        "model": "text-embedding-v4",
        "batch_size": 10,
        "strategy": "dual"
    }
}
```

### 3. QA数据集 (qa_dataset)

处理QA数据集导入：

```python
task_data = {
    "file_path": "/path/to/qa_dataset.xlsx",
    "config": {
        "validate": True,
        "create_index": True
    }
}
```

## 并发控制

系统默认配置：

- **最大并发任务数**: 5个
- **批量任务限制**: 单次最多5个文档
- **任务超时**: 30分钟
- **重试次数**: 3次

可通过环境变量或配置文件调整：

```yaml
task_queue:
  max_concurrent_tasks: 10
  default_timeout: 1800  # 30分钟
  max_retries: 5
  cleanup_interval: 3600  # 1小时
```

## 监控和调试

### 日志位置

- 任务日志: `logs/task_queue.log`
- 错误日志: `logs/task_errors.log`
- 系统日志: `logs/system.log`

### 性能监控

```python
# 获取任务队列统计
stats = await enhanced_task_manager.get_queue_statistics()
print(f"排队任务: {stats['pending_tasks']}")
print(f"运行任务: {stats['running_tasks']}")
print(f"平均处理时间: {stats['avg_processing_time']}秒")
```

### 故障排除

1. **任务卡死**: 检查任务锁表，清理过期锁
2. **内存泄漏**: 定期清理完成的任务记录
3. **数据库连接**: 监控连接池使用情况
4. **ES连接**: 检查ES集群健康状态

## 最佳实践

1. **会话管理**: 为每个用户会话生成唯一ID
2. **错误处理**: 实现适当的错误边界和用户反馈
3. **资源清理**: 定期清理旧任务和日志
4. **监控告警**: 设置任务失败率和处理时间告警
5. **数据备份**: 定期备份任务队列数据

## 故障恢复

### 系统重启后恢复

系统会自动恢复以下状态：

1. 重新启动被中断的任务
2. 恢复任务依赖关系
3. 清理过期的任务锁
4. 继续轮询任务状态

### 数据恢复

```bash
# 恢复任务状态
python scripts/recover_task_states.py

# 重新调度失败任务
python scripts/reschedule_failed_tasks.py --hours 24
``` 