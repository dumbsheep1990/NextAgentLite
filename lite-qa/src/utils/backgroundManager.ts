/**
 * 背景图片管理工具
 */

interface BackgroundConfig {
  basePath: string;
  supportedExtensions: string[];
  fallbackImage?: string;
}

class BackgroundManager {
  private static instance: BackgroundManager;
  private availableBackgrounds: string[] = [];
  private isInitialized = false;
  
  private constructor() {}
  
  static getInstance(): BackgroundManager {
    if (!BackgroundManager.instance) {
      BackgroundManager.instance = new BackgroundManager();
    }
    return BackgroundManager.instance;
  }
  
  /**
   * 初始化背景图片列表 - 通过检测目录下所有支持的图片文件
   */
  async initialize(config: BackgroundConfig = {
    basePath: '/background',
    supportedExtensions: ['jpg', 'jpeg', 'png', 'webp']
  }): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      console.log('🖼️ 开始扫描背景图片目录...', config.basePath);
      this.availableBackgrounds = [];
      
      // 定义常见的背景图片文件名模式
      const commonPatterns = [
        // 数字命名（减少到合理数量）
        ...Array.from({length: 20}, (_, i) => `${i + 1}`),
        // 描述性命名
        'bg', 'background', 'wallpaper', 'main', 'default',
        'login', 'auth', 'cover', 'hero', 'landscape', 'abstract',
        'nature', 'tech', 'blue', 'dark', 'light'
      ];
      
      // 优化的批量检测策略：分批并行检测，避免过多并发请求
      const batchSize = 8; // 每批检测8个图片
      let foundCount = 0;
      
      for (let i = 0; i < commonPatterns.length; i += batchSize) {
        const batchPatterns = commonPatterns.slice(i, i + batchSize);
        const batchPromises: Promise<string | null>[] = [];
        
        for (const pattern of batchPatterns) {
          for (const ext of config.supportedExtensions) {
            const imagePath = `${config.basePath}/${pattern}.${ext}`;
            batchPromises.push(
              this.checkImageExists(imagePath).then(exists => exists ? imagePath : null)
            );
          }
        }
        
        // 检测当前批次
        const batchResults = await Promise.allSettled(batchPromises);
        
        // 收集当前批次的有效图片
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value) {
            this.availableBackgrounds.push(result.value);
            foundCount++;
          }
        }
        
        // 如果已经找到足够多的背景图片，可以提前结束
        if (foundCount >= 10) {
          console.log(`🎯 已找到足够的背景图片 (${foundCount} 张)，停止检测`);
          break;
        }
      }
      
      // 去重（防止同一图片被重复检测）
      this.availableBackgrounds = [...new Set(this.availableBackgrounds)];
      
      // 如果没找到任何图片且有fallback，添加fallback
      if (this.availableBackgrounds.length === 0 && config.fallbackImage) {
        const fallbackExists = await this.checkImageExists(config.fallbackImage);
        if (fallbackExists) {
          this.availableBackgrounds.push(config.fallbackImage);
        }
      }
      
      this.isInitialized = true;
      console.log(`🎉 背景图片扫描完成，找到 ${this.availableBackgrounds.length} 张图片:`);
      this.availableBackgrounds.forEach((bg, index) => {
        console.log(`  ${index + 1}. ${bg}`);
      });
      
    } catch (error) {
      console.error('❌ 背景图片初始化失败:', error);
      this.isInitialized = true; // 即使失败也标记为已初始化，避免重复尝试
    }
  }
  
  /**
   * 检查单个图片文件是否存在并可加载
   */
  private async checkImageExists(imagePath: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        img.src = ''; // 取消加载
        resolve(false); // 超时认为不存在
      }, 1000); // 进一步缩短超时时间到1秒
      
      img.onload = () => {
        clearTimeout(timeout);
        // 只在第一次发现时记录日志，避免过多输出
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      
      // 设置图片源开始加载
      img.src = imagePath;
    });
  }
  
  /**
   * 获取随机背景图片
   */
  getRandomBackground(): string {
    if (this.availableBackgrounds.length === 0) {
      console.warn('⚠️ 没有可用的背景图片');
      return '';
    }
    
    const randomIndex = Math.floor(Math.random() * this.availableBackgrounds.length);
    const selectedImage = this.availableBackgrounds[randomIndex];
    
    console.log(`🎲 随机选择背景图片: ${selectedImage} (${randomIndex + 1}/${this.availableBackgrounds.length})`);
    return selectedImage;
  }
  
  /**
   * 获取所有可用背景图片
   */
  getAllBackgrounds(): string[] {
    return [...this.availableBackgrounds];
  }
  
  /**
   * 获取背景图片数量
   */
  getBackgroundCount(): number {
    return this.availableBackgrounds.length;
  }
  
  /**
   * 重新扫描背景图片（用于运行时添加/删除图片的情况）
   */
  async refresh(config?: BackgroundConfig): Promise<void> {
    this.isInitialized = false;
    this.availableBackgrounds = [];
    await this.initialize(config);
  }
  
  /**
   * 预加载所有背景图片到浏览器缓存
   */
  async preloadBackgrounds(): Promise<void> {
    if (this.availableBackgrounds.length === 0) {
      return;
    }
    
    console.log('📥 开始预加载背景图片...');
    
    const loadPromises = this.availableBackgrounds.map(imagePath => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log(`✅ 预加载完成: ${imagePath}`);
          resolve();
        };
        img.onerror = () => {
          console.warn(`⚠️ 预加载失败: ${imagePath}`);
          resolve(); // 继续加载其他图片
        };
        img.src = imagePath;
      });
    });
    
    try {
      await Promise.all(loadPromises);
      console.log('🎉 所有背景图片预加载完成');
    } catch (error) {
      console.error('❌ 背景图片预加载出错:', error);
    }
  }
}

// 导出单例实例
export const backgroundManager = BackgroundManager.getInstance();

// 导出便捷函数
export const getRandomBackground = async (config?: BackgroundConfig): Promise<string> => {
  await backgroundManager.initialize(config);
  return backgroundManager.getRandomBackground();
};

export const preloadBackgrounds = async (config?: BackgroundConfig): Promise<void> => {
  await backgroundManager.initialize(config);
  await backgroundManager.preloadBackgrounds();
};

export default backgroundManager;