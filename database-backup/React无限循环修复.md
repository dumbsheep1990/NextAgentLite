# React 无限循环问题修复

## 问题描述

**错误信息**:
```
Warning: Maximum update depth exceeded. This can happen when a component
calls setState inside useEffect, but useEffect either doesn't have a
dependency array, or one of the dependencies changes on every render.
```

**发生位置**: `CollectionManagementPage.tsx`

## 问题原因分析

### 1. useEffect 依赖问题

**原代码**:
```typescript
useEffect(() => {
  loadCollections();
  loadGlobalStatistics();
  loadTemplateTypes();
}, [loadCollections, loadGlobalStatistics, loadTemplateTypes]);
```

**问题**:
- 这些函数来自 Zustand store，每次渲染可能会重新创建
- 导致 useEffect 每次都执行，形成无限循环

**修复**:
```typescript
useEffect(() => {
  loadCollections();
  loadGlobalStatistics();
  loadTemplateTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // 只在组件挂载时执行一次
```

### 2. Table onChange 无限循环

**原代码**:
```typescript
const handleTableChange = (paginationInfo) => {
  if (paginationInfo) {
    setPagination({
      current: paginationInfo.current || 1,
      pageSize: paginationInfo.pageSize || 10
    });
    loadCollections({
      page: paginationInfo.current,
      size: paginationInfo.pageSize
    });
  }
};
```

**问题**:
1. 每次渲染都创建新的 `handleTableChange` 函数
2. `setPagination` 触发状态更新
3. 状态更新导致组件重新渲染
4. Table 的 pagination prop 变化触发 onChange
5. 回到步骤 1，形成无限循环

**修复**:
```typescript
const handleTableChange = useCallback((paginationInfo) => {
  if (paginationInfo) {
    const newCurrent = paginationInfo.current || 1;
    const newPageSize = paginationInfo.pageSize || 10;

    // 只有在页码或页面大小真正变化时才更新
    if (newCurrent !== pagination.current || newPageSize !== pagination.pageSize) {
      setPagination({
        current: newCurrent,
        pageSize: newPageSize
      });
      loadCollections({
        page: newCurrent,
        size: newPageSize
      });
    }
  }
}, [pagination.current, pagination.pageSize, setPagination, loadCollections]);
```

### 3. collections 依赖优化

**原代码**:
```typescript
useEffect(() => {
  // ... 获取检索模式逻辑
}, [collections, loading.collections, error]);
```

**问题**:
- `collections` 是数组，每次都是新引用
- 导致 useEffect 频繁执行

**修复**:
```typescript
useEffect(() => {
  // ... 获取检索模式逻辑
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [collections?.length]); // 只依赖数组长度
```

## 修复内容总结

### 修改的文件
`/Users/wxn/Desktop/NextAgentLite/lite-qa/src/pages/knowledge/CollectionManagementPage.tsx`

### 修改点

1. **导入 useCallback** (第4行)
   ```typescript
   import React, { useEffect, useState, useContext, useCallback } from 'react';
   ```

2. **修复初始化 useEffect** (第267-273行)
   ```typescript
   useEffect(() => {
     loadCollections();
     loadGlobalStatistics();
     loadTemplateTypes();
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);
   ```

3. **修复数据监听 useEffect** (第276-307行)
   ```typescript
   useEffect(() => {
     // ...
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [collections?.length]);
   ```

4. **修复 Table onChange 处理** (第343-360行)
   ```typescript
   const handleTableChange = useCallback((paginationInfo) => {
     if (paginationInfo) {
       const newCurrent = paginationInfo.current || 1;
       const newPageSize = paginationInfo.pageSize || 10;

       if (newCurrent !== pagination.current || newPageSize !== pagination.pageSize) {
         setPagination({ current: newCurrent, pageSize: newPageSize });
         loadCollections({ page: newCurrent, size: newPageSize });
       }
     }
   }, [pagination.current, pagination.pageSize, setPagination, loadCollections]);
   ```

## React 无限循环常见原因

### 1. useEffect 依赖问题
- ❌ 依赖函数/对象引用（每次都是新的）
- ✅ 只依赖基本类型或稳定引用

### 2. setState 在 render 中调用
- ❌ 在组件体中直接调用 setState
- ✅ 在事件处理器或 useEffect 中调用

### 3. 对象/数组依赖
- ❌ `useEffect(..., [someObject])`
- ✅ `useEffect(..., [someObject.id])` 或使用 `useMemo`

### 4. onChange 回调
- ❌ 每次渲染创建新函数
- ✅ 使用 `useCallback` 缓存

## 验证方法

### 1. 检查控制台
刷新页面后，控制台不应该有：
- "Maximum update depth exceeded" 错误
- 无限循环的日志输出

### 2. React DevTools Profiler
- 打开 React DevTools
- 切换到 Profiler 标签
- 开始录制，观察是否有频繁的重新渲染

### 3. 网络面板
- 打开浏览器 Network 面板
- 检查是否有重复的 API 请求

## 最佳实践

### 1. useEffect 依赖
```typescript
// ❌ 错误：依赖整个对象
useEffect(() => {
  doSomething(data);
}, [data]);

// ✅ 正确：只依赖需要的属性
useEffect(() => {
  doSomething(data);
}, [data.id, data.name]);

// ✅ 正确：使用 useMemo 稳定引用
const stableData = useMemo(() => data, [data.id]);
useEffect(() => {
  doSomething(stableData);
}, [stableData]);
```

### 2. 事件处理器
```typescript
// ❌ 错误：每次渲染都创建新函数
const handleClick = () => {
  doSomething();
};

// ✅ 正确：使用 useCallback
const handleClick = useCallback(() => {
  doSomething();
}, [/* 依赖 */]);
```

### 3. 条件更新
```typescript
// ❌ 错误：无条件更新
const handleChange = (value) => {
  setState(value);
};

// ✅ 正确：检查是否真正变化
const handleChange = useCallback((value) => {
  if (value !== currentValue) {
    setState(value);
  }
}, [currentValue]);
```

---

**修复时间**: 2025-10-10
**相关问题**: React无限循环、Maximum update depth exceeded
**解决方案**: useCallback + 依赖优化 + 条件判断
