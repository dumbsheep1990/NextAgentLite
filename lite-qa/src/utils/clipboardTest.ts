/**
 * 剪贴板功能测试脚本
 * 用于验证在不同环境下的复制功能兼容性
 */

import { copyToClipboard, getClipboardInfo, isClipboardApiSupported, isSecureContext } from './clipboardUtils';

// 测试用例接口
interface TestCase {
  name: string;
  text: string;
  description: string;
}

// 定义测试用例
const testCases: TestCase[] = [
  {
    name: '短文本测试',
    text: '这是一个测试文本',
    description: '测试简单短文本复制'
  },
  {
    name: '长文本测试',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    description: '测试长文本复制功能'
  },
  {
    name: '特殊字符测试',
    text: '特殊字符：@#$%^&*()_+-={}[]|\\:";\'<>?,./`~！@#￥%……&*（）——+｛｝【】|、：""；《》？，。/',
    description: '测试包含特殊字符的文本复制'
  },
  {
    name: '多行文本测试',
    text: '第一行文本\n第二行文本\n第三行文本\n包含换行符的多行文本测试',
    description: '测试多行文本复制'
  },
  {
    name: 'JSON数据测试',
    text: JSON.stringify({
      name: "测试数据",
      value: 12345,
      array: [1, 2, 3],
      nested: { key: "value" }
    }, null, 2),
    description: '测试JSON格式数据复制'
  }
];

/**
 * 运行单个测试用例
 */
async function runSingleTest(testCase: TestCase): Promise<{
  success: boolean;
  error?: string;
  duration: number;
}> {
  const startTime = performance.now();
  
  try {
    const success = await copyToClipboard(testCase.text);
    const duration = performance.now() - startTime;
    
    return {
      success,
      duration
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration
    };
  }
}

/**
 * 运行所有测试用例
 */
export async function runClipboardTests(): Promise<void> {
  console.log('🧪 开始运行剪贴板功能测试...\n');
  
  // 显示环境信息
  const clipboardInfo = getClipboardInfo();
  console.log('📋 剪贴板环境信息:');
  console.log(`  - Clipboard API 支持: ${clipboardInfo.hasClipboardApi ? '✅' : '❌'}`);
  console.log(`  - 安全上下文 (HTTPS): ${clipboardInfo.isSecureContext ? '✅' : '❌'}`);
  console.log(`  - 备用方法可用: ${clipboardInfo.fallbackAvailable ? '✅' : '❌'}`);
  console.log(`  - 当前协议: ${location.protocol}`);
  console.log(`  - 当前域名: ${location.hostname}`);
  console.log('');
  
  // 运行测试用例
  let passedTests = 0;
  const totalTests = testCases.length;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`🔍 测试 ${i + 1}/${totalTests}: ${testCase.name}`);
    console.log(`   描述: ${testCase.description}`);
    
    const result = await runSingleTest(testCase);
    
    if (result.success) {
      console.log(`   ✅ 通过 (耗时: ${result.duration.toFixed(2)}ms)`);
      passedTests++;
    } else {
      console.log(`   ❌ 失败 (耗时: ${result.duration.toFixed(2)}ms)`);
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
    }
    console.log('');
  }
  
  // 显示测试结果总结
  console.log('📊 测试结果总结:');
  console.log(`   总测试数: ${totalTests}`);
  console.log(`   通过测试: ${passedTests}`);
  console.log(`   失败测试: ${totalTests - passedTests}`);
  console.log(`   成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('   🎉 所有测试都通过了！');
  } else {
    console.log('   ⚠️  部分测试失败，请检查复制功能实现');
  }
}

/**
 * 在控制台运行测试的便捷函数
 */
export function testClipboard(): void {
  runClipboardTests().catch(error => {
    console.error('测试运行失败:', error);
  });
}

// 如果在浏览器环境中，将测试函数暴露到全局
if (typeof window !== 'undefined') {
  (window as any).testClipboard = testClipboard;
  (window as any).runClipboardTests = runClipboardTests;
}

export { testCases }; 