# 剪贴板功能修复指南

## 问题描述

在线上非HTTPS环境中，前端应用的复制功能报错：
```
Uncaught TypeError: Cannot read properties of undefined (reading 'writeText')
```

这是因为 `navigator.clipboard` API 只在HTTPS或localhost环境中可用，在HTTP环境中为 `undefined`。

## 解决方案

### 1. 创建兼容的剪贴板工具函数

创建了 `src/utils/clipboardUtils.ts` 文件，提供兼容的复制功能：

- **现代方法**: 优先使用 `navigator.clipboard.writeText()` (HTTPS环境)
- **备用方法**: 使用传统的 `document.execCommand('copy')` (HTTP环境)
- **错误处理**: 完善的错误处理和用户提示

### 2. 修复所有复制功能

已修复以下文件中的复制功能：

- ✅ `QADatasetPanel.tsx` - QA数据集问题复制
- ✅ `SourceViewer.tsx` - 溯源内容复制  
- ✅ `TranslationPreview.tsx` - 翻译结果复制
- ✅ `MessageList.tsx` - 消息内容复制
- ✅ `QAPage.tsx` - QA页面消息复制

### 3. 核心功能特性

```typescript
// 主要API
copyToClipboard(text: string): Promise<boolean>

// 环境检测
isClipboardApiSupported(): boolean
isSecureContext(): boolean
getClipboardInfo(): object
```

## 使用方法

### 基本使用

```typescript
import { copyToClipboard } from '../../utils/clipboardUtils';

// 在事件处理函数中使用
const handleCopy = async () => {
  const success = await copyToClipboard('要复制的文本');
  if (success) {
    message.success('复制成功');
  } else {
    message.error('复制失败，请手动复制');
  }
};
```

### 环境检测

```typescript
import { getClipboardInfo } from '../../utils/clipboardUtils';

const info = getClipboardInfo();
console.log('Clipboard API支持:', info.hasClipboardApi);
console.log('安全上下文:', info.isSecureContext);
console.log('备用方法可用:', info.fallbackAvailable);
```

## 测试验证

### 在浏览器控制台中测试

```javascript
// 运行完整测试套件
testClipboard();

// 或者直接调用测试函数
runClipboardTests();
```

### 测试用例覆盖

- ✅ 短文本复制
- ✅ 长文本复制  
- ✅ 特殊字符复制
- ✅ 多行文本复制
- ✅ JSON数据复制

## 兼容性说明

### 支持的环境

| 环境 | Clipboard API | 备用方法 | 结果 |
|------|---------------|----------|------|
| HTTPS | ✅ | ✅ | 完全支持 |
| localhost | ✅ | ✅ | 完全支持 |
| HTTP | ❌ | ✅ | 备用支持 |
| 旧浏览器 | ❌ | ✅ | 备用支持 |

### 浏览器兼容性

- **现代浏览器**: Chrome 66+, Firefox 63+, Safari 13.1+
- **备用方法**: 支持所有现代浏览器
- **移动端**: iOS Safari, Android Chrome

## 部署注意事项

### 生产环境建议

1. **优先使用HTTPS**: 获得最佳的复制功能体验
2. **备用方案**: 在HTTP环境中自动降级到兼容方法
3. **用户提示**: 复制失败时提供明确的错误信息

### 错误处理策略

```typescript
const handleCopy = async (text: string) => {
  try {
    const success = await copyToClipboard(text);
    if (success) {
      // 成功提示
      message.success('内容已复制到剪贴板');
    } else {
      // 失败提示 + 备用方案
      message.error('复制失败，请手动复制');
      console.log('复制内容:', text); // 在控制台显示内容
    }
  } catch (error) {
    // 异常处理
    console.error('复制功能异常:', error);
    message.error('复制功能不可用');
  }
};
```

## 常见问题

### Q: 为什么在本地HTTPS环境下工作，但线上HTTP环境不工作？

A: `navigator.clipboard` API 需要安全上下文（HTTPS或localhost）。我们的解决方案提供了兼容的备用方法。

### Q: 备用方法的兼容性如何？

A: `document.execCommand('copy')` 虽然已被标记为deprecated，但仍在所有现代浏览器中工作，是很好的备用方案。

### Q: 如何测试复制功能是否正常？

A: 在浏览器控制台运行 `testClipboard()` 进行完整测试，或者直接测试具体的复制按钮。

### Q: 移动端支持如何？

A: 支持iOS Safari和Android Chrome，备用方法在移动端同样有效。

## 更新日志

- **v1.0.0**: 初始版本，修复HTTP环境下复制功能失效问题
- 支持自动降级到兼容方法
- 完善的错误处理和用户提示
- 全面的测试套件 