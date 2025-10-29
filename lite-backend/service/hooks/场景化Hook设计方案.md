# 场景化Hook设计方案

**版本**: v1.0
**日期**: 2025-10-20
**状态**: 设计中

---

## 📋 设计目标

为不同应用场景设计专用的Pre-hooks和Post-hooks，提供场景化的输入校验、内容检测、格式验证和敏感词过滤等功能。

### 核心原则

1. **场景专用**: 每个场景有独特的校验和处理逻辑
2. **可配置性**: Hook行为可通过配置调整
3. **工具集成**: 支持调用外部API和MCP工具
4. **优雅降级**: Hook失败不应阻断核心流程（可配置）
5. **可观测性**: 详细的日志和执行元数据

---

## 🎯 场景分类

### 1. 政策问答场景 (Policy QA)

**应用场景**: 政府政策文件问答、法规解读

**特点**:
- 严格的内容审查要求
- 政策文档有特定的元数据结构
- 输出格式需要规范化
- 对敏感词汇有特殊要求

**Pre-Hooks**:
1. `PolicySensitiveWordCheckHook` - 政策敏感词检测
2. `PolicyMetadataExtractorHook` - 政策文档元数据提取
3. `PolicyQueryNormalizationHook` - 政策查询标准化

**Post-Hooks**:
1. `PolicyOutputFormatValidationHook` - 输出格式验证
2. `PolicySensitiveWordFilterHook` - 输出敏感词过滤
3. `PolicyCitationEnhancementHook` - 政策引用增强

---

### 2. 学术问答场景 (Academic QA)

**应用场景**: 学术论文检索、科研问答

**特点**:
- 重视引用和出处
- 需要学术规范性检查
- 防止学术不端
- 专业术语标准化

**Pre-Hooks**:
1. `AcademicQueryNormalizationHook` - 学术查询标准化
2. `AcademicTermStandardizationHook` - 学术术语标准化
3. `CitationRequirementCheckHook` - 引用要求检查

**Post-Hooks**:
1. `AcademicCitationValidationHook` - 学术引用格式验证
2. `AcademicFormatCheckHook` - 学术格式检查
3. `PlagiarismCheckHook` - 原创性检查（可选）

---

### 3. 客服问答场景 (Customer Service QA)

**应用场景**: 客户服务机器人、售后支持

**特点**:
- 情绪感知和处理
- 语气友好度要求
- 快速响应时间
- 客户满意度追踪

**Pre-Hooks**:
1. `CustomerSentimentAnalysisHook` - 客户情绪分析
2. `CustomerQueryClassificationHook` - 客户问题分类
3. `UrgencyDetectionHook` - 紧急程度检测

**Post-Hooks**:
1. `CustomerResponseToneCheckHook` - 回复语气检查
2. `CustomerSatisfactionPredictionHook` - 满意度预测
3. `FollowUpSuggestionHook` - 后续建议生成

---

### 4. 法律咨询场景 (Legal Consultation)

**应用场景**: 法律条文查询、法律咨询

**特点**:
- 严格的法律准确性要求
- 法条引用规范
- 免责声明必需
- 敏感案件识别

**Pre-Hooks**:
1. `LegalQueryClassificationHook` - 法律问题分类
2. `LegalSensitiveCaseCheckHook` - 敏感案件识别
3. `LegalTermStandardizationHook` - 法律术语标准化

**Post-Hooks**:
1. `LegalCitationValidationHook` - 法条引用验证
2. `LegalDisclaimerInjectionHook` - 免责声明注入
3. `LegalAccuracyCheckHook` - 法律准确性检查

---

### 5. 医疗健康场景 (Medical/Health)

**应用场景**: 医疗知识问答、健康咨询

**特点**:
- 医疗安全性要求
- 禁止诊断性建议
- 医学术语规范
- 紧急情况识别

**Pre-Hooks**:
1. `MedicalSafetyCheckHook` - 医疗安全检查
2. `MedicalEmergencyDetectionHook` - 紧急情况识别
3. `MedicalTermNormalizationHook` - 医学术语规范化

**Post-Hooks**:
1. `MedicalDisclaimerInjectionHook` - 医疗免责声明
2. `DiagnosisPreventionHook` - 诊断性建议拦截
3. `MedicalReferenceValidationHook` - 医学参考验证

---

### 6. 通用问答场景 (General QA)

**应用场景**: 通用知识问答、百科查询

**特点**:
- 灵活的配置
- 基础的安全检查
- 通用格式验证

**Pre-Hooks**:
1. `InputValidationHook` - 通用输入验证
2. `IntentAnalysisHook` - 意图分析
3. `DataCleaningHook` - 数据清洗

**Post-Hooks**:
1. `OutputValidationHook` - 通用输出验证
2. `DesensitizationHook` - 敏感信息脱敏
3. `QualityCheckHook` - 输出质量检查

---

## 🔧 政策问答场景详细设计

### Pre-Hook 1: PolicySensitiveWordCheckHook

**功能**: 检测政策查询中的敏感词汇

**配置**:
```yaml
hook_id: policy_sensitive_word_check
hook_type: pre
enabled: true
config:
  # 敏感词库来源
  sensitive_word_source: "policy_sensitive_words"  # API或本地词库
  # 检测级别
  check_level: "strict"  # strict/moderate/loose
  # 是否阻断
  block_on_detection: true
  # 是否记录
  log_violations: true
  # 敏感词分类
  categories:
    - political  # 政治敏感
    - legal      # 法律敏感
    - ethnic     # 民族宗教
```

**行为**:
- 检测到敏感词 → 抛出`InputCheckError`
- 记录违规日志用于审计
- 支持分级处理（不同级别不同行为）

**输出**:
```python
# 检测到敏感词时
raise InputCheckError(
    "输入包含敏感内容，请修改后重试",
    check_trigger=CheckTrigger.SECURITY_VIOLATION
)

# 记录到context
run_input.context['sensitive_word_check'] = {
    'detected': True,
    'categories': ['political'],
    'action': 'blocked'
}
```

---

### Pre-Hook 2: PolicyMetadataExtractorHook

**功能**: 从查询中提取政策文档元数据信息（非强制）

**配置**:
```yaml
hook_id: policy_metadata_extractor
hook_type: pre
enabled: true
config:
  # 是否强制要求元数据
  required: false
  # 元数据字段
  metadata_fields:
    - policy_number    # 政策编号
    - issue_date      # 发布日期
    - issuing_agency  # 发文机关
    - policy_level    # 政策级别（国家/省/市）
    - effective_date  # 生效日期
  # 提取方式
  extraction_method: "hybrid"  # regex/llm/hybrid
  # 是否调用外部工具
  use_external_tool: true
  external_tool_name: "policy_metadata_extraction_api"
```

**行为**:
- 尝试从查询中提取政策元数据
- 提取失败不阻断流程（非强制）
- 提取的元数据存入context，用于后续检索优化

**输出**:
```python
# 成功提取元数据
run_input.context['policy_metadata'] = {
    'extracted': True,
    'data': {
        'policy_number': '国发〔2024〕15号',
        'issue_date': '2024-03-15',
        'issuing_agency': '国务院',
        'policy_level': 'national'
    },
    'confidence': 0.92
}

# 未提取到元数据（不报错）
run_input.context['policy_metadata'] = {
    'extracted': False,
    'reason': 'no_metadata_pattern_found'
}
```

---

### Pre-Hook 3: PolicyQueryNormalizationHook

**功能**: 政策查询标准化处理

**配置**:
```yaml
hook_id: policy_query_normalization
hook_type: pre
enabled: true
config:
  # 标准化操作
  operations:
    - remove_redundant_words   # 去除冗余词
    - expand_abbreviations     # 展开缩写
    - standardize_terms        # 标准化术语
    - extract_keywords         # 提取关键词
  # 术语词典
  term_dictionary: "policy_terms"
  # 是否使用NLP工具
  use_nlp: true
  nlp_tool: "policy_nlp_api"
```

**行为**:
- 清理和标准化查询文本
- 展开政策领域的常见缩写
- 提取关键实体和术语

**输出**:
```python
# 修改run_input.input_content
原始: "国发15号文件关于XXX的规定"
标准化后: "国务院发布的国发〔2024〕15号文件关于XXX的规定"

# 添加到context
run_input.context['query_normalization'] = {
    'original_query': "国发15号文件关于XXX的规定",
    'normalized_query': "国务院发布的国发〔2024〕15号文件关于XXX的规定",
    'keywords': ['国发〔2024〕15号', '国务院', 'XXX'],
    'entities': [
        {'type': 'policy_number', 'value': '国发〔2024〕15号'},
        {'type': 'agency', 'value': '国务院'}
    ]
}
```

---

### Post-Hook 1: PolicyOutputFormatValidationHook

**功能**: 验证政策问答输出的格式规范

**配置**:
```yaml
hook_id: policy_output_format_validation
hook_type: post
enabled: true
config:
  # 必需的格式元素
  required_sections:
    - policy_reference  # 政策依据
    - answer_content    # 答案内容
    - source_citation   # 来源引用
  # 格式检查规则
  format_rules:
    - has_policy_number    # 必须包含政策编号
    - has_source_link      # 必须包含来源链接
    - proper_markdown      # 使用规范的Markdown
  # 检查严格度
  strictness: "moderate"  # strict/moderate/loose
  # 失败时的行为
  on_validation_failure: "warn"  # block/warn/ignore
```

**行为**:
- 检查输出是否包含必需的格式元素
- 验证政策引用的完整性
- 确保Markdown格式规范

**输出**:
```python
# 验证通过
run_output.metadata['format_validation'] = {
    'passed': True,
    'checked_rules': ['has_policy_number', 'has_source_link', 'proper_markdown'],
    'all_passed': True
}

# 验证失败（根据配置决定是否阻断）
run_output.metadata['format_validation'] = {
    'passed': False,
    'failed_rules': ['has_policy_number'],
    'warnings': ['输出缺少政策编号引用']
}
```

---

### Post-Hook 2: PolicySensitiveWordFilterHook

**功能**: 过滤输出中的敏感词汇

**配置**:
```yaml
hook_id: policy_sensitive_word_filter
hook_type: post
enabled: true
config:
  # 敏感词库
  sensitive_word_source: "policy_output_sensitive_words"
  # 处理方式
  filter_action: "mask"  # mask/remove/replace/block
  # 替换文本
  replacement_text: "[已过滤]"
  # 是否记录
  log_filtering: true
  # 分类处理
  category_actions:
    political: "block"     # 政治敏感直接阻断
    legal: "mask"          # 法律敏感脱敏处理
    personal: "remove"     # 个人信息删除
```

**行为**:
- 检测输出中的敏感词
- 根据配置进行过滤/脱敏/阻断
- 记录过滤操作

**输出**:
```python
# 检测到敏感词并过滤
原始输出: "根据政策XXX，涉及到敏感词YYY的规定..."
过滤后: "根据政策XXX，涉及到[已过滤]的规定..."

run_output.metadata['sensitive_word_filter'] = {
    'filtered': True,
    'detected_count': 2,
    'categories': ['legal', 'personal'],
    'action_taken': 'masked',
    'filtered_words': ['YYY', 'ZZZ']  # 实际可能不记录具体词汇
}

# 检测到严重敏感词，阻断输出
raise OutputCheckError(
    "输出包含不允许的敏感内容",
    check_trigger=CheckTrigger.SECURITY_VIOLATION
)
```

---

### Post-Hook 3: PolicyCitationEnhancementHook

**功能**: 增强政策引用的完整性和准确性

**配置**:
```yaml
hook_id: policy_citation_enhancement
hook_type: post
enabled: true
config:
  # 是否自动补充引用信息
  auto_enhance: true
  # 引用格式
  citation_format: "standard"  # standard/detailed/minimal
  # 是否添加链接
  add_links: true
  # 链接来源
  link_source: "official_policy_database"
  # 是否验证引用有效性
  validate_citations: true
```

**行为**:
- 检测输出中的政策引用
- 补充完整的引用信息（编号、日期、机关等）
- 添加官方链接
- 验证引用的准确性

**输出**:
```python
# 增强前
原始: "根据国发15号文件..."

# 增强后
"根据国务院发布的《国发〔2024〕15号文件：关于XXX的通知》（发布日期：2024-03-15）..."

run_output.metadata['citation_enhancement'] = {
    'enhanced': True,
    'citations_found': 3,
    'citations_enhanced': 3,
    'links_added': 3,
    'validation_passed': True
}
```

---

## 🛠️ 技术实现要点

### 1. 敏感词检测实现

**技术方案**:
- **方案A**: 本地敏感词库 + 正则匹配
- **方案B**: 调用外部敏感词检测API
- **方案C**: 混合方案（本地快速检测 + API深度检测）

**推荐**: 方案C - 混合方案

```python
async def _check_sensitive_words(self, content: str) -> Dict:
    # 1. 本地快速检测
    local_result = self._local_sensitive_word_check(content)

    if local_result['detected']:
        return local_result

    # 2. API深度检测（如果配置）
    if self.use_external_api:
        api_result = await self.call_api_tool(
            'sensitive_word_detection',
            content=content,
            categories=['political', 'legal', 'ethnic']
        )
        if api_result.get('success'):
            return api_result['data']

    return {'detected': False}
```

### 2. 元数据提取实现

**技术方案**:
- **方案A**: 正则表达式匹配（快速但覆盖有限）
- **方案B**: NLP模型提取（准确但较慢）
- **方案C**: LLM提取（最准确但成本高）
- **方案D**: 混合方案（正则 + NLP + LLM降级）

**推荐**: 方案D - 混合方案

```python
async def _extract_metadata(self, query: str) -> Dict:
    # 1. 正则快速提取
    regex_result = self._regex_extract(query)

    if regex_result['confidence'] > 0.8:
        return regex_result

    # 2. NLP模型提取
    if self.use_nlp:
        nlp_result = await self._nlp_extract(query)
        if nlp_result['confidence'] > 0.7:
            return nlp_result

    # 3. LLM提取（兜底）
    if self.use_llm_fallback:
        llm_result = await self._llm_extract(query)
        return llm_result

    return {'extracted': False}
```

### 3. 格式验证实现

**技术方案**:
- Markdown解析 + 结构验证
- 必需元素检查
- 引用格式验证

```python
async def _validate_format(self, output: str) -> Dict:
    validation_results = {}

    # 检查Markdown格式
    validation_results['proper_markdown'] = self._check_markdown(output)

    # 检查政策编号
    validation_results['has_policy_number'] = self._check_policy_number(output)

    # 检查来源引用
    validation_results['has_source_citation'] = self._check_citations(output)

    # 检查必需章节
    validation_results['required_sections'] = self._check_sections(output)

    all_passed = all(validation_results.values())

    return {
        'passed': all_passed,
        'details': validation_results
    }
```

---

## 📊 Hook执行流程

### Pre-Hooks执行顺序（政策问答场景）

```
用户输入
    ↓
┌─────────────────────────────────────┐
│ 1. PolicySensitiveWordCheckHook    │
│    - 检测敏感词                     │
│    - 阻断违规输入                   │
└─────────────────────────────────────┘
    ↓ (通过)
┌─────────────────────────────────────┐
│ 2. PolicyMetadataExtractorHook     │
│    - 提取政策元数据（可选）         │
│    - 增强检索上下文                 │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. PolicyQueryNormalizationHook    │
│    - 标准化查询                     │
│    - 提取关键词和实体               │
└─────────────────────────────────────┘
    ↓
进入检索和生成流程
```

### Post-Hooks执行顺序（政策问答场景）

```
LLM生成输出
    ↓
┌─────────────────────────────────────┐
│ 1. PolicyCitationEnhancementHook   │
│    - 增强政策引用                   │
│    - 添加引用链接                   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. PolicyOutputFormatValidationHook│
│    - 验证输出格式                   │
│    - 检查必需元素                   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. PolicySensitiveWordFilterHook   │
│    - 过滤敏感词                     │
│    - 脱敏处理                       │
└─────────────────────────────────────┘
    ↓
返回给用户
```

---

## 📝 Hook配置示例

### 政策问答场景Pipeline配置

```yaml
# config/hook_pipelines/policy_qa_pipeline.yaml

pipeline_id: policy_qa_standard_pipeline
pipeline_name: "政策问答标准Pipeline"
description: "适用于政策文件问答场景的标准Hook流程"
scene: policy_qa
enabled: true

pre_hooks:
  - hook_id: policy_sensitive_word_check
    order: 1
    enabled: true
    config:
      check_level: strict
      block_on_detection: true
      categories: [political, legal, ethnic]

  - hook_id: policy_metadata_extractor
    order: 2
    enabled: true
    config:
      required: false
      use_external_tool: true
      external_tool_name: policy_metadata_extraction_api

  - hook_id: policy_query_normalization
    order: 3
    enabled: true
    config:
      operations: [remove_redundant_words, expand_abbreviations, standardize_terms]
      use_nlp: true

post_hooks:
  - hook_id: policy_citation_enhancement
    order: 1
    enabled: true
    config:
      auto_enhance: true
      add_links: true
      validate_citations: true

  - hook_id: policy_output_format_validation
    order: 2
    enabled: true
    config:
      strictness: moderate
      on_validation_failure: warn

  - hook_id: policy_sensitive_word_filter
    order: 3
    enabled: true
    config:
      filter_action: mask
      log_filtering: true
      category_actions:
        political: block
        legal: mask
```

---

## 🚀 实施计划

### 阶段1: 政策问答场景 (Week 1-2)

- [x] 设计文档完成
- [ ] 实现PolicySensitiveWordCheckHook
- [ ] 实现PolicyMetadataExtractorHook
- [ ] 实现PolicyQueryNormalizationHook
- [ ] 实现PolicyOutputFormatValidationHook
- [ ] 实现PolicySensitiveWordFilterHook
- [ ] 实现PolicyCitationEnhancementHook
- [ ] 编写单元测试
- [ ] 创建Pipeline配置
- [ ] 集成测试

### 阶段2: 学术问答场景 (Week 3)

- [ ] 实现AcademicQueryNormalizationHook
- [ ] 实现AcademicCitationValidationHook
- [ ] 实现AcademicFormatCheckHook
- [ ] 编写单元测试
- [ ] 创建Pipeline配置

### 阶段3: 客服问答场景 (Week 4)

- [ ] 实现CustomerSentimentAnalysisHook
- [ ] 实现CustomerQueryClassificationHook
- [ ] 实现CustomerResponseToneCheckHook
- [ ] 编写单元测试
- [ ] 创建Pipeline配置

### 阶段4: 其他场景 (Week 5-6)

- [ ] 法律咨询场景Hooks
- [ ] 医疗健康场景Hooks
- [ ] 编写文档和使用指南

---

## 📚 参考资料

1. Hook系统基础架构: `service/hooks/base.py`
2. 现有Hook实现: `service/hooks/pre_hooks/`, `service/hooks/post_hooks/`
3. Hook注册机制: `service/hooks/registry.py`
4. Pipeline配置: `config/hook_pipelines/`

---

**创建时间**: 2025-10-20
**作者**: Hook开发团队
**状态**: 设计完成，待实施
