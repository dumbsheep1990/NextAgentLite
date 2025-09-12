# NextAgentLite v2.0 Migration Summary

## 迁移完成日期
2025-09-11

## 主要变更内容

### 1. Elasticsearch 索引重构
- **移除双向量支持**: 删除了 `general_embedding` 和 `domain_embedding` 字段
- **统一向量字段**: 使用单一 `embedding` 字段
- **更新向量维度**: 从 2048 更新到 2560 (Qwen3-Embedding-4B 实际输出维度)
- **索引重命名**: 移除所有 `mat_qa_` 前缀

### 2. 索引名称映射

| 旧名称 (v1.x) | 新名称 (v2.0) |
|--------------|--------------|
| mat_qa_chunks | document_chunks |
| mat_qa_general_vectors | general_vectors |
| mat_qa_domain_vectors | domain_vectors |
| mat_qa_papers | papers |
| mat_qa_documents | documents |
| mat_qa_retrieval_cache | retrieval_cache |
| mat_qa_media | media |

### 3. 字段变更

#### 移除的字段
- `general_embedding` (dense_vector, 2048维)
- `domain_embedding` (dense_vector, 768维)
- `ali_embedding` (dense_vector, 2048维)
- `matbert_embedding` (dense_vector, 768维)
- `general_model` (keyword)
- `domain_model` (keyword)
- `vectorization_strategy` (keyword)

#### 新增/保留的字段
- `embedding` (dense_vector, 2560维) - 统一的向量字段
- `embedding_model` (keyword) - 嵌入模型标识

### 4. 系统集成更新

#### Python 环境统一
- 统一使用 conda 环境: `zzdsj-lite`
- Python 版本: 3.12.11
- agno 版本: 2.0.2

#### Youtu Agent 集成
- 完全集成到主系统环境
- 配置通过 `.env` 文件管理
- API 路径: `/api/v1/youtu`

### 5. 迁移文件

#### 核心迁移文件
1. `elasticsearch_index_templates_v2.json` - v2.0 索引模板定义
2. `migrate_to_v2.sh` - 自动化迁移脚本
3. `verify_v2_migration.py` - 迁移验证脚本

#### 更新的后端文件
- `migrations/init_elasticsearch.py` - ES初始化脚本
- `service/embedding_service.py` - 嵌入服务
- `service/knowledge_service.py` - 知识服务
- `service/intelligent_retrieval_service.py` - 智能检索服务

## 迁移步骤

### 执行迁移
```bash
cd database-backup/elasticsearch
bash migrate_to_v2.sh
```

### 验证迁移
```bash
cd database-backup
python verify_v2_migration.py
```

## 验证结果

✅ **所有检查通过**
- [✓] 索引命名 - 新索引创建成功，旧索引已清理
- [✓] 索引映射 - 字段配置正确，维度匹配
- [✓] 数据完整性 - 文档上传和向量化正常
- [✓] 索引别名 - 别名配置正确
- [✓] 嵌入服务 - 向量维度 2560 匹配

## 测试数据

成功上传测试文档:
- 文档ID: `6f9b1a9f-af30-4360-a8f0-ef0d0a4d7849`
- 分块ID: `d9b71ae3-dae7-4ebd-971b-e4e7ec1316d1`
- 向量维度: 2560
- 内容: 包含 v2.0 迁移说明的测试文档

## 注意事项

1. **数据迁移**: 迁移脚本会删除所有旧数据，需要重新上传和向量化文档
2. **向量维度**: 确保所有嵌入模型配置使用 2560 维度
3. **索引名称**: 所有代码中的索引引用需要更新为新名称
4. **环境变量**: 确保 `.env` 文件包含正确的配置

## 回滚方案

如需回滚到 v1.x:
1. 恢复备份的索引映射 (在 `backups/` 目录)
2. 重新创建旧索引结构
3. 更新代码中的索引引用和字段名称
4. 重新配置向量维度

## 性能影响

- **简化结构**: 移除双向量减少了存储和计算开销
- **统一维度**: 2560 维度提供更好的语义表示
- **索引优化**: 新的索引结构更易于维护和扩展

---

**迁移状态**: ✅ 完成
**系统版本**: v2.0.0
**最后更新**: 2025-09-11