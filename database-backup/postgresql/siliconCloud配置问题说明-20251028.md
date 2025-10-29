# siliconCloud 配置未同步问题说明

**问题发现时间**: 2025-10-28
**问题描述**: 测试环境 Unla 模型管理中 siliconCloud 显示未启用，但前端仍能显示默认模型

---

## 问题原因分析

### 1. 之前的同步脚本缺陷

之前创建的 `sync_model_config_from_local.sql` 脚本**只同步了模型状态**，但**没有同步 API Key**：

```sql
-- ❌ 之前的脚本只做了这些
UPDATE unla_embedding_models SET status = 'active' WHERE id IN (7, 8);
UPDATE unla_rerank_models SET status = 'active' WHERE id IN (4, 5, 6);
UPDATE llm_providers SET status = 'active';
```

**缺少了关键的 API Key 同步！**

### 2. 数据库版本差异

#### 备份文件中的配置（旧）
- **API Key**: `sk-mnennlifdngjififromhljflqsblutyfgfvwerkfhsxummcn`
- **更新时间**: 2025-10-16 13:53:10

#### 本地数据库当前配置（新）
- **API Key**: `sk-abpjgaflfhrqthzitxyuifuxqjdtdrbwuspbuwzunlzofhlj`
- **更新时间**: 2025-10-27 09:34:45

**结论**: 本地数据库的 API Key 在 2025-10-27 更新过，备份文件是旧的。

### 3. 为什么前端显示"默认模型"？

Unla Web 前端可能有以下几种情况：
1. **缓存数据**: 浏览器缓存了之前的配置
2. **默认值显示**: 前端代码在 API 返回空时使用硬编码的默认值
3. **配置错误**: 前端读取了错误的配置源

---

## 解决方案

### 方案1：执行完整同步脚本（推荐）

使用新创建的 `sync_siliconcloud_config.sql` 脚本：

```bash
# 在测试服务器上执行
PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo \
  -f /home/NextAgentLite/database-backup/sync_siliconcloud_config.sql
```

**这个脚本会同步**:
1. ✅ LLM Provider 配置（包括 API Key）
2. ✅ Embedding 模型状态
3. ✅ Rerank 模型状态

### 方案2：手动更新（不推荐，仅用于验证）

```sql
-- 更新 siliconCloud 配置
UPDATE llm_providers
SET
    type = 'siliconcloud',
    base_url = 'https://api.siliconflow.cn/v1',
    api_key_enc = 'sk-abpjgaflfhrqthzitxyuifuxqjdtdrbwuspbuwzunlzofhlj',
    status = 'active',
    updated_at = NOW()
WHERE name = 'siliconcloud';
```

---

## 执行步骤

### 步骤1: 上传同步脚本到测试服务器

```bash
# 本地机器执行
scp database-backup/postgresql/sync_siliconcloud_config.sql \
  root@8.136.49.11:/home/NextAgentLite/database-backup/
```

### 步骤2: 在测试服务器执行同步

```bash
# SSH登录测试服务器
ssh root@8.136.49.11

# 切换到项目目录
cd /home/NextAgentLite

# 执行同步脚本
PGPASSWORD='zzdsj123!' psql \
  -h localhost \
  -p 5434 \
  -U zzdsj_demo \
  -d zzdsj_demo \
  -f database-backup/sync_siliconcloud_config.sql
```

**预期输出**:
```
=== 开始同步 siliconCloud 配置 ===

[1/3] 更新 LLM Provider 配置...
 id |     name     |     type     |            base_url            | api_key_preview | status |         updated_at
----+--------------+--------------+--------------------------------+-----------------+--------+----------------------------
  1 | siliconcloud | siliconcloud | https://api.siliconflow.cn/v1 | sk-abpjgaf...   | active | 2025-10-28 14:30:00.123456

[2/3] 同步 Embedding 模型配置...
 id |   provider   |           model_id           |      display_name       | status
----+--------------+------------------------------+-------------------------+--------
  7 | siliconcloud | Qwen/Qwen3-Embedding-8B      | Qwen3-Embedding-8B      | active
  8 | siliconcloud | Qwen/Qwen3-Embedding-0.6B    | Qwen3-Embedding-0.6B    | active

[3/3] 同步 Rerank 模型配置...
 id |   provider   |          model_id           | status
----+--------------+-----------------------------+--------
  4 | siliconcloud | Qwen/Qwen3-Reranker-0.6B    | active
  5 | siliconcloud | Qwen/Qwen3-Reranker-4B      | active
  6 | siliconcloud | Qwen/Qwen3-Reranker-8B      | active

=== siliconCloud 配置同步完成 ===
✅ siliconCloud 完整配置已同步！
```

### 步骤3: 清除浏览器缓存并验证

1. **清除浏览器缓存**:
   - Chrome/Edge: `Ctrl+Shift+Delete` → 清除缓存和Cookie
   - 或使用无痕模式访问

2. **访问 Unla Web**:
   ```
   http://8.136.49.11:8000/api-gateway/model
   ```

3. **验证配置**:
   - LLM 厂商列表中 siliconCloud 应显示为**已启用**
   - Embedding 模型应显示 2 个启用的模型
   - Rerank 模型应显示 3 个启用的模型

### 步骤4: 重启相关服务（可选）

如果前端仍显示不正确，尝试重启服务：

```bash
# 重启 unla-apiserver（负责读取数据库配置）
pm2 restart unla-apiserver

# 重启 llm-gateway（如果使用）
pm2 restart llm-gateway

# 查看日志
pm2 logs unla-apiserver --lines 50
```

---

## 验证清单

完成同步后，请验证以下内容：

### 数据库层面
```sql
-- 1. 验证 llm_providers
SELECT name, base_url, LEFT(api_key_enc, 15) || '...' as api_key, status
FROM llm_providers
WHERE name = 'siliconcloud';

-- 预期结果：
-- name: siliconcloud
-- base_url: https://api.siliconflow.cn/v1
-- api_key: sk-abpjgaflfh...
-- status: active

-- 2. 验证 Embedding 模型
SELECT provider, model_id, status
FROM unla_embedding_models
WHERE provider = 'siliconcloud' AND status = 'active';

-- 预期结果：2 行（Qwen3-Embedding-8B, Qwen3-Embedding-0.6B）

-- 3. 验证 Rerank 模型
SELECT provider, model_id, status
FROM unla_rerank_models
WHERE provider = 'siliconcloud' AND status = 'active';

-- 预期结果：3 行（Qwen3-Reranker-0.6B, 4B, 8B）
```

### 前端页面验证

访问 Unla Web 管理界面后：

1. **LLM 厂商配置页面**:
   - [ ] siliconCloud 显示为**已启用**
   - [ ] 可以看到 API Key（部分隐藏）
   - [ ] Base URL 正确显示

2. **Embedding 模型页面**:
   - [ ] 显示 2 个启用的 siliconcloud 模型
   - [ ] 模型名称正确

3. **Rerank 模型页面**:
   - [ ] 显示 3 个启用的 siliconcloud 模型
   - [ ] 可以设置为默认模型

---

## 常见问题

### Q1: 为什么之前的同步脚本没有包含 API Key？

**A**: 之前的脚本 `sync_model_config_from_local.sql` 主要关注模型的启用状态同步，假设 llm_providers 表的基础配置已经存在且正确。但实际上测试环境的 siliconCloud 配置缺少或不正确。

### Q2: 如何确认 API Key 是否正确？

**A**:
1. 查询数据库：
```sql
SELECT api_key_enc FROM llm_providers WHERE name = 'siliconcloud';
```

2. 本地数据库的正确值应该是：
```
sk-abpjgaflfhrqthzitxyuifuxqjdtdrbwuspbuwzunlzofhlj
```

### Q3: 前端仍显示"未启用"怎么办？

**A**:
1. 清除浏览器缓存（重要！）
2. 检查是否连接到正确的数据库（zzdsj_demo，不是 postgres）
3. 重启 unla-apiserver 服务
4. 检查浏览器 Network 标签，查看实际的 API 响应

### Q4: 如何验证 API Key 是否有效？

**A**: 可以使用 curl 测试：
```bash
curl https://api.siliconflow.cn/v1/models \
  -H "Authorization: Bearer sk-abpjgaflfhrqthzitxyuifuxqjdtdrbwuspbuwzunlzofhlj"
```

如果返回模型列表，说明 API Key 有效。

---

## 相关文件

- 同步脚本: `/database-backup/postgresql/sync_siliconcloud_config.sql`
- 原始备份: `/database-backup/postgresql/complete_dump.sql`
- 之前的同步脚本: `/database-backup/postgresql/sync_model_config_from_local.sql`

---

## 经验教训

### 1. 完整性原则
数据库同步脚本应该包含完整的配置信息，不能只同步部分字段（如只更新 status）。

### 2. 版本验证
在执行同步前，应该先验证本地数据库的配置是否是最新的、正确的。

### 3. 测试验证
同步后必须在多个层面验证：
- 数据库查询验证
- API 接口验证
- 前端页面验证

### 4. 文档记录
每次同步操作都应该有详细的文档记录，包括：
- 同步的内容
- 执行的SQL
- 验证方法
- 预期结果

---

**修复完成！** ✅

如有问题，请查看：
- PM2 日志: `pm2 logs unla-apiserver`
- PostgreSQL 连接: 确保使用 `zzdsj_demo` 数据库
- 浏览器控制台: 检查网络请求和响应
