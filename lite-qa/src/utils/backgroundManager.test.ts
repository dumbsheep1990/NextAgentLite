/**
 * 背景管理器测试文件
 */

import { backgroundManager, getRandomBackground } from './backgroundManager';

// 测试函数
async function testBackgroundManager() {
  console.log('🧪 开始测试背景管理器...');
  
  try {
    // 测试配置
    const testConfig = {
      basePath: '/background',
      supportedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      fallbackImage: '/background/default.jpg'
    };
    
    // 初始化背景管理器
    await backgroundManager.initialize(testConfig);
    
    // 获取所有可用背景
    const allBackgrounds = backgroundManager.getAllBackgrounds();
    console.log('📋 所有可用背景图片:', allBackgrounds);
    
    // 获取背景图片数量
    const count = backgroundManager.getBackgroundCount();
    console.log(`📊 背景图片总数: ${count}`);
    
    // 测试随机选择
    for (let i = 0; i < 3; i++) {
      const randomBg = backgroundManager.getRandomBackground();
      console.log(`🎲 随机背景 ${i + 1}: ${randomBg}`);
    }
    
    // 测试便捷函数
    const quickBg = await getRandomBackground(testConfig);
    console.log(`⚡ 便捷函数获取: ${quickBg}`);
    
    console.log('✅ 背景管理器测试完成');
    
  } catch (error) {
    console.error('❌ 背景管理器测试失败:', error);
  }
}

// 如果在浏览器环境中运行测试
if (typeof window !== 'undefined') {
  // 延迟执行，确保DOM加载完成
  setTimeout(() => {
    testBackgroundManager();
  }, 1000);
}

export { testBackgroundManager };