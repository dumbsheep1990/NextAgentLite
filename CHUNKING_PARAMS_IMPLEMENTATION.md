# 切分参数配置化实现文档

## 实现概述

成功实现了文档切分参数的完整配置化功能，包括 `semantic_threshold`（语义阈值）和 `preserve_structure`（保持结构）两个核心参数的前后端贯通。

## 功能特性

### 1. 参数配置化
- ✅ **semantic_threshold**: 语义相似度阈值（0-100%），控制文档块合并的严格程度
- ✅ **preserve_structure**: 文档结构保持开关，控制是否严格遵守文档结构边界
- ✅ **完整参数传递链**: 前端配置 → API → 后端服务 → 切分算法
- ✅ **向后兼容**: 所有新参数都有默认值，不影响现有功能

### 2. 用户界面增强
- ✅ **参数说明抽屉**: 详细的参数说明文档，包含：
  - 参数概述和作用
  - 推荐值范围
  - 最佳实践示例
  - 智能建议提示
- ✅ **内联提示**: 每个参数输入框都有Tooltip提示
- ✅ **动态验证**: 实时验证参数合理性（如重叠不超过30%）
- ✅ **视觉反馈**: Switch组件显示启用/禁用状态

### 3. 参数详细说明

#### semantic_threshold（语义阈值）
- **范围**: 0-100（百分比）
- **默认值**: 30
- **作用**: 控制语义相似度判断的严格程度
- **推荐设置**:
  - 0-20: 宽松合并，适合高内聚文档
  - 20-40: 适中合并（推荐默认）
  - 40-60: 严格合并，适合主题多样文档
  - 60-100: 非常严格，只合并高度相关内容

#### preserve_structure（保持结构）
- **类型**: Boolean
- **默认值**: true
- **作用**: 控制是否严格保持文档结构
- **启用时**:
  - 相同标题的内容优先合并
  - 不同标题的内容不会合并
  - 保持页码边界，不跨页合并
- **禁用时**:
  - 基于语义相似度灵活合并
  - 可以跨越结构边界
  - 更适合连续性文本

## 技术实现

### 后端实现
```python
# rag/scenario/naive.py
def semantic_merge(..., semantic_threshold=30, preserve_structure=True):
    """支持配置化参数的语义合并"""
    threshold_decimal = semantic_threshold / 100.0
    can_merge = are_semantically_related(chunk1, chunk2, threshold_decimal, preserve_structure)

def are_semantically_related(..., threshold=0.3, preserve_structure=True):
    """配置化的语义相关性判断"""
    if preserve_structure:
        # 检查结构相关性
        if chunk1.headings != chunk2.headings:
            return False
    # 语义相似度判断
    similarity = overlap / total
    return similarity > threshold
```

### 前端实现
```tsx
// CreateChunkingConfigModal.tsx
<Form.Item
  label={
    <Space>
      <span>语义阈值 (%)</span>
      <Tooltip title="控制语义相似度判断...">
        <InfoCircleOutlined />
      </Tooltip>
    </Space>
  }
  name="semantic_threshold"
>
  <InputNumber min={0} max={100} step={5} />
</Form.Item>

<Drawer title="切分参数详细说明">
  {/* 完整的参数说明文档 */}
</Drawer>
```

## 使用示例

### 场景1: 学术论文
```json
{
  "strategy": "semantic",
  "chunk_token_num": 500,
  "chunk_overlap": 60,
  "preserve_structure": true,
  "semantic_threshold": 40
}
```
效果：保持章节结构，适度合并相关内容

### 场景2: 对话记录
```json
{
  "strategy": "sentence",
  "chunk_token_num": 150,
  "chunk_overlap": 20,
  "preserve_structure": false,
  "semantic_threshold": 20
}
```
效果：灵活切分，保持对话连贯性

### 场景3: 技术文档
```json
{
  "strategy": "paragraph",
  "chunk_token_num": 400,
  "chunk_overlap": 40,
  "preserve_structure": true,
  "semantic_threshold": 30
}
```
效果：保持文档结构，平衡合并策略

## 测试验证

通过 `test_chunking_params.py` 脚本验证了：
- ✅ 不同 semantic_threshold 值的效果
- ✅ preserve_structure 开关的行为差异
- ✅ 参数组合的综合效果
- ✅ 向后兼容性

## 文件变更

### 后端文件
- `/lite-backend/rag/scenario/naive.py`
  - `semantic_merge()`: 添加新参数
  - `are_semantically_related()`: 实现配置化逻辑
  - `advanced_chunk()`: 参数传递

### 前端文件
- `/lite-qa/src/components/knowledge/CreateChunkingConfigModal.tsx`
  - 添加参数说明抽屉组件
  - 增强参数输入提示
  - 实现帮助文档界面

### 测试文件
- `/lite-backend/test_chunking_params.py`
  - 完整的参数测试脚本

## 注意事项

1. **参数生效条件**:
   - `semantic_threshold` 仅在 `strategy="semantic"` 时生效
   - `preserve_structure` 对所有策略都有影响

2. **性能考虑**:
   - 高语义阈值会减少合并，增加块数量
   - 启用结构保持可能产生更多小块

3. **最佳实践**:
   - 先使用预设模板
   - 小批量测试调优
   - 根据文档类型选择策略

## 总结

实现了完整的切分参数配置化功能，提供了：
- 灵活的参数控制
- 清晰的用户界面
- 详细的帮助文档
- 完整的测试验证

用户现在可以根据不同文档类型和需求，精确控制文档切分行为，提高检索和理解的准确性。