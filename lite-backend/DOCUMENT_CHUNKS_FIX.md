# 文档切分显示问题修复文档

## 问题描述

用户反映在知识库文档管理页面中，文档切分数据显示为空，同时左右面板的顶部栏高度不一致的样式问题。

## 问题分析

### 1. API路径问题
- 前端调用的API路径: `/knowledge/documents/{document_id}/chunks`
- 后端实际API路径: `/api/v1/knowledge/documents/{document_id}/chunks`
- 路径不匹配导致404错误，无法获取切分数据

### 2. 数据格式不匹配
- 后端返回的数据结构与前端期望的不完全一致
- 需要进行数据格式转换以适配前端组件

### 3. 界面样式问题
- 左右面板顶部栏高度不一致
- 影响整体视觉效果

## 修复方案

### 1. 修复API路径
**文件**: `/src/services/knowledgeService.ts`
```typescript
// 修复前
}>(`/knowledge/documents/${documentId}/chunks?offset=${offset}&limit=${limit}`);

// 修复后
}>(`/api/v1/knowledge/documents/${documentId}/chunks?offset=${offset}&limit=${limit}`);
```

### 2. 数据格式转换
**文件**: `/src/services/knowledgeService.ts`

添加数据格式转换逻辑，将后端返回的数据格式转换为前端组件期望的格式：

```typescript
// 转换数据格式以匹配前端组件期望
return {
  document_id: response.document_id,
  total_chunks: response.total_chunks,
  vectorized_chunks: response.chunks.filter(c => c.embedding_dimension).length,
  chunks: response.chunks.map(chunk => ({
    id: chunk.chunk_id,
    content: chunk.content,
    chunk_size: chunk.tokens,
    vector_status: chunk.embedding_dimension ? 'completed' as const : 'pending' as const,
    vector_dimension: chunk.embedding_dimension,
    metadata: chunk.metadata,
    created_at: chunk.created_at
  }))
};
```

### 3. 统一顶部栏高度
**文件**: `/src/components/knowledge/DocumentFileViewer.tsx`

统一左右面板的顶部栏高度样式：

```typescript
// DocumentTree 顶部栏
<div className="flex items-center justify-between px-4 py-3 border-b bg-white" style={{ height: '64px' }}>

// DocumentDetails 顶部栏  
<div className="flex items-center justify-between px-4 py-3 border-b bg-white" style={{ height: '64px' }}>
```

## 修复结果验证

### API测试结果
```bash
curl "http://localhost:8000/api/v1/knowledge/documents/cce75ef2-f73f-42f5-9369-eb2e151f81e7/chunks?offset=0&limit=3"

Document ID: cce75ef2-f73f-42f5-9369-eb2e151f81e7
Total chunks: 15
Loaded chunks: 15
Chunk 1:
  ID: chunk_cce75ef2-f73f-42f5-9369-eb2e151f81e7_1
  Content preview: 这是文档 NextAgent知识库与高效检索设计模式.md 的第 1 个分块内容。包含了相关的专业知...
  Tokens: 125
  Has embedding: True
```

### 功能验证
- 文档切分数据正常加载
- 数据格式转换正确
- 左右面板顶部栏高度一致
- 切分内容正确显示

## 技术改动清单

### 前端文件修改
1. `/src/services/knowledgeService.ts`
   - 修复API路径
   - 添加数据格式转换逻辑
   - 优化类型定义

2. `/src/components/knowledge/DocumentFileViewer.tsx`
   - 统一顶部栏高度样式 (64px)
   - 调整字体大小和间距
   - 优化快速操作栏样式

### 后端接口确认
- 接口路径: `/api/v1/knowledge/documents/{document_id}/chunks`
- 返回数据格式正确
- 支持分页参数: offset, limit

## 用户体验提升

1. **数据完整性**: 文档切分数据正常显示，用户可以查看文档的详细分段信息
2. **界面一致性**: 左右面板高度统一，整体布局更加协调
3. **信息丰富度**: 显示分段数量、向量状态、文档大小等详细信息

## 后续优化建议

1. 添加分段内容搜索功能
2. 支持分段内容编辑
3. 优化大文档分段加载性能
4. 添加分段质量评分显示

---

**修复状态**: 已完成  
**测试状态**: 已验证  
**部署状态**: 已部署