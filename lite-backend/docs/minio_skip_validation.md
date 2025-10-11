# MinIO 跳过验证功能使用说明

## 功能概述

为了解决线上环境中MinIO签名验证失败的问题，系统新增了 `skip_bucket_validation` 配置选项。当启用此选项时，系统将跳过存储桶的验证和创建过程，直接连接到已存在的MinIO存储桶。

## 使用场景

- 线上环境中MinIO已经完成数据迁移，存储桶已存在
- MinIO签名验证出现问题（如SignatureDoesNotMatch错误）
- 需要连接到由外部管理的MinIO存储桶

## 配置方法

### 1. 通过配置文件

在 `config.yaml` 或 `production.yaml` 中设置：

```yaml
storage:
  minio:
    enabled: true
    endpoint: "your-minio-endpoint"
    access_key: "your-access-key"
    secret_key: "your-secret-key"
    # 其他配置...
    
    skip_bucket_validation: true  # 跳过存储桶验证
    auto_create_buckets: false    # 建议同时关闭自动创建
```

### 2. 通过环境变量

设置环境变量：

```bash
export MINIO_SKIP_BUCKET_VALIDATION=true
export MINIO_AUTO_CREATE_BUCKETS=false
```

### 3. 通过.env文件

在 `.env` 文件中添加：

```env
MINIO_SKIP_BUCKET_VALIDATION=true
MINIO_AUTO_CREATE_BUCKETS=false
```

## 配置说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `skip_bucket_validation` | boolean | false | 是否跳过存储桶验证和创建 |
| `auto_create_buckets` | boolean | true | 是否自动创建存储桶 |

## 注意事项

1. **存储桶必须已存在**: 启用 `skip_bucket_validation` 后，系统不会检查或创建存储桶，请确保所需的存储桶已在MinIO中存在：
   - `mat-qa-documents`
   - `mat-qa-media`
   - `mat-qa-thumbnails`
   - `mat-qa-knowledge-graph`

2. **权限检查**: 确保提供的MinIO凭据有访问这些存储桶的权限。

3. **建议配置**: 在生产环境中建议同时设置：
   ```yaml
   skip_bucket_validation: true
   auto_create_buckets: false
   ```

## 错误处理

如果启用了 `skip_bucket_validation` 但存储桶不存在，系统会在文件操作时返回相应的错误信息。建议在部署前确认所有存储桶都已正确创建。

## 日志信息

启用跳过验证功能后，系统会在日志中显示：

```
跳过MinIO存储桶验证，直接连接已存在的存储桶
```

## 故障排除

如果仍然遇到连接问题：

1. 检查MinIO凭据是否正确
2. 确认网络连接和防火墙设置
3. 验证存储桶是否存在且有正确的权限
4. 检查MinIO服务器的时间同步（签名验证对时间敏感）

## 迁移建议

从开发环境迁移到生产环境时：

1. 先在生产环境的MinIO中创建所需的存储桶
2. 迁移数据文件
3. 更新配置文件，启用 `skip_bucket_validation`
4. 重启服务并验证功能正常 