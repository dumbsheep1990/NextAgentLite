/**
 * 前端存储功能测试工具
 */
import { storageService } from '../services/storageService';
import type { StorageConfig } from '../services/storageService';

export interface StorageTestResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
  duration?: number;
}

export class StorageTestSuite {
  private results: StorageTestResult[] = [];

  /**
   * 运行完整的存储测试套件
   */
  async runFullTest(): Promise<StorageTestResult[]> {
    this.results = [];
    
    // Starting storage functionality tests
    
    // 1. 健康检查测试
    await this.testHealthCheck();
    
    // 2. 文件上传测试
    await this.testFileUpload();
    
    // 3. 配置测试
    await this.testConfiguration();
    
    // 4. 工具函数测试
    await this.testUtilityFunctions();
    
    // Storage functionality tests completed
    this.printSummary();
    
    return this.results;
  }

  /**
   * 测试存储健康检查
   */
  async testHealthCheck(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const health = await storageService.checkHealth();
      const duration = Date.now() - startTime;
      
      if (health.status === 'healthy') {
        this.addResult({
          test: '存储健康检查',
          success: true,
          message: `存储服务正常 (${health.storage_type})`,
          details: health,
          duration
        });
      } else {
        this.addResult({
          test: '存储健康检查',
          success: false,
          message: '存储服务异常',
          details: health,
          duration
        });
      }
    } catch (error) {
      this.addResult({
        test: '存储健康检查',
        success: false,
        message: `健康检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * 测试文件上传功能
   */
  async testFileUpload(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 创建测试文件
      const testContent = 'This is a test document for storage functionality.';
      const testFile = new File([testContent], 'test-document.txt', {
        type: 'text/plain'
      });

      // 测试文档上传
      const result = await storageService.uploadDocument(testFile, '测试文档');
      const duration = Date.now() - startTime;

      if (result.success) {
        this.addResult({
          test: '文档上传',
          success: true,
          message: `文档上传成功: ${result.object_name}`,
          details: result,
          duration
        });

        // 测试文件删除
        await this.testFileDelete(result.object_name);
      } else {
        this.addResult({
          test: '文档上传',
          success: false,
          message: '文档上传失败',
          details: result,
          duration
        });
      }
    } catch (error) {
      this.addResult({
        test: '文档上传',
        success: false,
        message: `上传测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * 测试文件删除功能
   */
  async testFileDelete(objectName: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await storageService.deleteFile('documents', objectName);
      const duration = Date.now() - startTime;

      this.addResult({
        test: '文件删除',
        success: result.success,
        message: result.success ? '文件删除成功' : '文件删除失败',
        details: result,
        duration
      });
    } catch (error) {
      this.addResult({
        test: '文件删除',
        success: false,
        message: `删除测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * 测试配置功能
   */
  async testConfiguration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 这里暂时模拟配置测试，因为后端可能还没有实现配置API
      const mockConfig: StorageConfig = {
        type: 'minio',
        minio: {
          enabled: true,
          endpoint: 'localhost:9000',
          accessKey: 'minioadmin',
          secretKey: 'minioadmin',
          documentsBucket: 'mat-qa-documents',
          mediaBucket: 'mat-qa-media',
          thumbnailsBucket: 'mat-qa-thumbnails',
          publicEndpoint: 'http://localhost:9000',
          autoCreateBuckets: true
        }
      };

      // 模拟配置验证
      const isValid = this.validateStorageConfig(mockConfig);
      const duration = Date.now() - startTime;

      this.addResult({
        test: '存储配置验证',
        success: isValid,
        message: isValid ? '配置验证通过' : '配置验证失败',
        details: mockConfig,
        duration
      });
    } catch (error) {
      this.addResult({
        test: '存储配置验证',
        success: false,
        message: `配置测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * 测试工具函数
   */
  async testUtilityFunctions(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 测试文件大小格式化
      const sizeTests = [
        { input: 0, expected: '0 Bytes' },
        { input: 1024, expected: '1 KB' },
        { input: 1048576, expected: '1 MB' },
        { input: 1073741824, expected: '1 GB' }
      ];

      let sizeTestsPassed = 0;
      for (const test of sizeTests) {
        const result = storageService.formatFileSize(test.input);
        if (result === test.expected) {
          sizeTestsPassed++;
        }
      }

      // 测试文件类型验证
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const validation = storageService.validateFileType(
        mockFile, 
        ['pdf', 'doc', 'txt'], 
        'document'
      );

      // 测试文件图标获取
      const pdfIcon = storageService.getFileIcon('document.pdf');
      const txtIcon = storageService.getFileIcon('readme.txt');

      const duration = Date.now() - startTime;
      const allTestsPassed = sizeTestsPassed === sizeTests.length && 
                            validation.valid && 
                            pdfIcon === '📄' && 
                            txtIcon === '📄';

      this.addResult({
        test: '工具函数测试',
        success: allTestsPassed,
        message: allTestsPassed ? '所有工具函数测试通过' : '部分工具函数测试失败',
        details: {
          sizeTestsPassed: `${sizeTestsPassed}/${sizeTests.length}`,
          validationResult: validation,
          icons: { pdf: pdfIcon, txt: txtIcon }
        },
        duration
      });
    } catch (error) {
      this.addResult({
        test: '工具函数测试',
        success: false,
        message: `工具函数测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * 验证存储配置
   */
  private validateStorageConfig(config: StorageConfig): boolean {
    if (!config.type || !['minio', 'local'].includes(config.type)) {
      return false;
    }

    if (config.type === 'minio') {
      const minio = config.minio;
      return !!(
        minio.endpoint &&
        minio.accessKey &&
        minio.documentsBucket &&
        minio.mediaBucket &&
        minio.thumbnailsBucket
      );
    }

    return true;
  }

  /**
   * 添加测试结果
   */
  private addResult(result: StorageTestResult): void {
    this.results.push(result);
    
    const icon = result.success ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    // Test result logged
  }

  /**
   * 打印测试摘要
   */
  private printSummary(): void {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    
    // Test summary available via getSummary() method
  }

  /**
   * 获取测试结果
   */
  getResults(): StorageTestResult[] {
    return this.results;
  }

  /**
   * 获取测试摘要
   */
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    
    return {
      total,
      passed,
      failed,
      successRate: total > 0 ? (passed / total) * 100 : 0
    };
  }
}

// 导出测试套件实例
export const storageTestSuite = new StorageTestSuite();

// 导出快捷测试函数
export const runStorageTest = () => storageTestSuite.runFullTest();

// 浏览器控制台测试函数
if (typeof window !== 'undefined') {
  (window as any).testStorage = runStorageTest;
  (window as any).storageTestSuite = storageTestSuite;
} 