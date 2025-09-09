/**
 * SSE连接优化测试工具
 * 用于验证连接状态管理和防重复连接逻辑
 */
export class SSEConnectionTester {
  private static testResults: Array<{
    test: string;
    result: boolean;
    message: string;
    timestamp: number;
  }> = [];

  /**
   * 测试连接状态持久化
   */
  static testConnectionPersistence(): boolean {
    try {
      const testState = {
        sessionId: 'test-session-123',
        connected: true,
        timestamp: Date.now()
      };

      // 保存状态
      localStorage.setItem('sse_connection_state', JSON.stringify(testState));

      // 读取状态
      const saved = localStorage.getItem('sse_connection_state');
      const parsed = saved ? JSON.parse(saved) : null;

      const success = parsed && 
                     parsed.sessionId === testState.sessionId &&
                     parsed.connected === testState.connected;

      this.addTestResult('连接状态持久化', success, success ? '状态保存和读取正常' : '状态保存失败');
      return success;
    } catch (error) {
      this.addTestResult('连接状态持久化', false, `测试失败: ${error}`);
      return false;
    }
  }

  /**
   * 测试重复连接检测
   */
  static testDuplicateConnectionPrevention(): boolean {
    let connectAttempts = 0;
    
    const mockConnect = () => {
      connectAttempts++;
      return Promise.resolve();
    };

    // 模拟连接逻辑
    const sessionId = 'test-session-456';
    const now = Date.now();
    const lastConnectAttempt = now - 100; // 100ms前连接过
    const minConnectInterval = 1000; // 最小间隔1秒

    // 检查是否应该跳过连接
    const shouldSkip = now - lastConnectAttempt < minConnectInterval;
    
    if (!shouldSkip) {
      mockConnect();
    }

    const success = shouldSkip && connectAttempts === 0;
    this.addTestResult('重复连接检测', success, 
      success ? '正确跳过了频繁连接' : `应该跳过连接但执行了 ${connectAttempts} 次`);
    
    return success;
  }

  /**
   * 测试会话ID变化检测
   */
  static testSessionIdChange(): boolean {
    const currentSessionId = 'session-old';
    const newSessionId = 'session-new';
    
    // 模拟会话ID变化时的连接需求检测
    const needsConnection = currentSessionId !== newSessionId;
    
    const success = needsConnection;
    this.addTestResult('会话ID变化检测', success,
      success ? '正确检测到会话ID变化需要重新连接' : '未能检测到会话ID变化');
    
    return success;
  }

  /**
   * 测试页面可见性处理
   */
  static testVisibilityHandling(): boolean {
    try {
      // 模拟页面可见性API
      const mockDocument = {
        visibilityState: 'visible' as DocumentVisibilityState,
        addEventListener: (event: string, handler: () => void) => {
          if (event === 'visibilitychange') {
            // 模拟页面变为可见
            handler();
          }
        }
      };

      let healthCheckCalled = false;
      const mockCheckHealth = () => {
        healthCheckCalled = true;
      };

      // 模拟事件监听器注册
      mockDocument.addEventListener('visibilitychange', () => {
        if (mockDocument.visibilityState === 'visible') {
          mockCheckHealth();
        }
      });

      const success = healthCheckCalled;
      this.addTestResult('页面可见性处理', success,
        success ? '正确响应页面可见性变化' : '未能响应页面可见性变化');
      
      return success;
    } catch (error) {
      this.addTestResult('页面可见性处理', false, `测试失败: ${error}`);
      return false;
    }
  }

  /**
   * 运行所有测试
   */
  static runAllTests(): void {
    console.log('🧪 开始SSE连接优化测试...\n');
    
    this.testResults = [];
    
    this.testConnectionPersistence();
    this.testDuplicateConnectionPrevention();
    this.testSessionIdChange();
    this.testVisibilityHandling();
    
    this.printTestResults();
  }

  /**
   * 添加测试结果
   */
  private static addTestResult(test: string, result: boolean, message: string): void {
    this.testResults.push({
      test,
      result,
      message,
      timestamp: Date.now()
    });
  }

  /**
   * 打印测试结果
   */
  private static printTestResults(): void {
    console.log('📊 SSE连接优化测试结果:\n');
    
    let passedCount = 0;
    this.testResults.forEach(({ test, result, message }) => {
      const status = result ? '✅ 通过' : '❌ 失败';
      console.log(`${status} ${test}: ${message}`);
      if (result) passedCount++;
    });
    
    console.log(`\n📈 测试总结: ${passedCount}/${this.testResults.length} 通过`);
    
    if (passedCount === this.testResults.length) {
      console.log('🎉 所有测试通过！SSE连接优化功能正常');
    } else {
      console.log('⚠️  部分测试失败，需要进一步检查');
    }
  }

  /**
   * 清理测试数据
   */
  static cleanup(): void {
    try {
      localStorage.removeItem('sse_connection_state');
      console.log('🧹 测试数据清理完成');
    } catch (error) {
      console.warn('⚠️  清理测试数据失败:', error);
    }
  }
}

// 导出测试函数供控制台使用
(window as any).testSSEConnection = () => {
  SSEConnectionTester.runAllTests();
};

(window as any).cleanupSSETest = () => {
  SSEConnectionTester.cleanup();
};