# QA路由接口缺失清单

## 前端页面 QARoutingPage.tsx 需要的接口

### 1. 路由规则管理
- **获取路由规则列表** ✅ 已有基础实现 (listQARoutes)
- **创建路由规则** ✅ 已有基础实现 (createQARoute)  
- **更新路由规则** ✅ 已有基础实现 (updateQARoute)
- **删除路由规则** ✅ 已有基础实现 (deleteQARoute)
- **切换规则启用状态** ❌ 缺失 (需要专门的 toggleRule 接口)
- **复制路由规则** ❌ 缺失 (可通过前端实现)

### 2. 路由日志
- **获取路由日志** ❌ 完全缺失
- **清理路由日志** ❌ 完全缺失
- **导出路由日志** ❌ 完全缺失

### 3. 测试功能
- **测试路由匹配** ❌ 缺失完整实现 (searchQARoutes 仅部分支持)
- **模拟路由执行** ❌ 完全缺失

### 4. Collection和Agent资源
- **获取可用Collection列表** ❌ 缺失 (需要从knowledge_collection表获取)
- **获取可用Agent列表** ❌ 缺失 (需要从agent配置获取)

### 5. 导入导出
- **导出路由配置** ❌ 完全缺失
- **导入路由配置** ❌ 部分缺失 (只有从QA数据集导入)

### 6. 统计信息
- **获取路由统计信息** ✅ 已有基础实现 (getRouteStatistics)
- **获取路由使用报告** ❌ 完全缺失

## 需要补充的后端接口

### 优先级 1 - 核心功能
1. **路由规则的高级管理**
   - PUT `/api/qa-routing/rules/{rule_id}/toggle` - 切换规则启用状态
   - POST `/api/qa-routing/rules/test` - 测试路由规则

2. **路由日志管理**
   - GET `/api/qa-routing/logs` - 获取路由日志列表
   - POST `/api/qa-routing/logs/cleanup` - 清理历史日志
   - GET `/api/qa-routing/logs/export` - 导出日志

3. **资源管理**
   - GET `/api/qa-routing/resources/collections` - 获取可用知识库列表
   - GET `/api/qa-routing/resources/agents` - 获取可用Agent列表

### 优先级 2 - 增强功能
1. **导入导出**
   - GET `/api/qa-routing/rules/export` - 导出路由规则配置
   - POST `/api/qa-routing/rules/import` - 导入路由规则配置

2. **统计报告**
   - GET `/api/qa-routing/reports/usage` - 获取使用报告
   - GET `/api/qa-routing/reports/performance` - 获取性能报告

## 前端服务需要调整

### qaRoutingService.ts 需要新增的方法

```typescript
// 路由规则管理
async toggleRule(ruleId: string, enabled: boolean): Promise<void>
async testRouting(question: string, kbId?: string): Promise<TestResult>

// 路由日志
async getRoutingLogs(params: LogQueryParams): Promise<RoutingLog[]>
async cleanupLogs(beforeDate: string): Promise<void>
async exportLogs(format: 'csv' | 'json'): Promise<Blob>

// 资源管理
async getAvailableCollections(): Promise<Collection[]>
async getAvailableAgents(): Promise<Agent[]>

// 导入导出
async exportRules(kbId: string): Promise<Blob>
async importRules(kbId: string, file: File): Promise<ImportResult>

// 统计报告
async getUsageReport(kbId: string, dateRange?: DateRange): Promise<UsageReport>
async getPerformanceReport(kbId: string): Promise<PerformanceReport>
```

## 数据模型调整

### 需要新增的数据表或字段

1. **qa_routing_logs** 表
   - id: UUID
   - rule_id: UUID (关联到qa_routes)
   - question: TEXT
   - matched_pattern: TEXT
   - routed_to: TEXT
   - routing_type: VARCHAR
   - response_time: FLOAT
   - success: BOOLEAN
   - user_id: UUID (可选)
   - session_id: VARCHAR
   - created_at: TIMESTAMP

2. **qa_routes** 表需要新增字段
   - usage_count: INTEGER (使用次数)
   - success_count: INTEGER (成功次数)
   - last_used_at: TIMESTAMP
   - question_patterns: TEXT[] (问题模式数组)
   - target_collections: TEXT[] (目标知识库ID数组)
   - target_agents: TEXT[] (目标Agent ID数组)
   - routing_strategy: VARCHAR (路由策略)
   - fallback_behavior: VARCHAR (回退行为)

## 实现优先级建议

1. **立即实现** - 阻塞页面功能的接口
   - 获取可用Collection列表
   - 获取可用Agent列表
   - 测试路由规则
   - 切换规则启用状态

2. **短期实现** - 增强用户体验
   - 路由日志管理
   - 导入导出功能

3. **长期优化** - 完善功能
   - 统计报告
   - 性能分析