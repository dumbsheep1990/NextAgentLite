/**
 * 清理所有缓存的工具函数
 * 包括Store状态、localStorage、sessionStorage、定时器等
 */

export const clearAllCaches = async (autoReload: boolean = false): Promise<void> => {
  console.log('🧹 开始清理所有缓存...');
  
  try {
    // 1. 发送清理事件通知所有组件
    console.log('📢 发送清理事件...');
    window.dispatchEvent(new CustomEvent('clear-all-stores'));
    
    // 等待组件响应清理事件
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 2. 清理各种Store状态
    console.log('🗑️ 清理Store状态...');
    
    // 清理知识库Store
    try {
      const { useKnowledgeStore } = await import('../stores/knowledgeStore');
      const knowledgeStore = useKnowledgeStore.getState();
      
      // 停止所有轮询
      if (knowledgeStore.pollingIntervals) {
        knowledgeStore.pollingIntervals.forEach((interval, documentId) => {
          console.log(`🛑 停止文档轮询: ${documentId}`);
          clearInterval(interval);
        });
      }
      
      // 重置Store状态
      if (knowledgeStore.resetAllState) {
        knowledgeStore.resetAllState();
      }
    } catch (error) {
      console.warn('⚠️ 清理知识库Store失败:', error);
    }
    
    // 清理QA Store
    try {
      const { useQAStore } = await import('../stores/qaStore');
      const qaStore = useQAStore.getState();
      if (qaStore.resetAllState) {
        qaStore.resetAllState();
      }
    } catch (error) {
      console.warn('⚠️ 清理QA Store失败:', error);
    }
    
    // 清理其他Store（AppStore没有重置方法，所以跳过）
    try {
      const { useAppStore } = await import('../stores/appStore');
      const appStore = useAppStore.getState();
      
      // AppStore通常保留配置，只清理通知
      if (appStore.clearNotifications) {
        appStore.clearNotifications();
      }
      
      // 重置存储状态
      appStore.setStorageStatus(null);
      appStore.setGlobalLoading(false);
    } catch (error) {
      console.warn('⚠️ 清理App Store失败:', error);
    }

    // 3. 设置全局轮询禁用标记（在清理定时器之前）
    console.log('🚫 设置轮询禁用标记...');
    localStorage.setItem('__POLLING_DISABLED__', 'true');
    sessionStorage.setItem('__POLLING_DISABLED__', 'true');
    (window as any).__POLLING_DISABLED__ = true;
    
    // 4. 暴力清除所有JavaScript定时器
    console.log('🔥 暴力清除所有定时器...');
    try {
      // 获取当前最高的timer ID
      const highestTimeoutId = Number(setTimeout(function() {}, 0));
      const highestIntervalId = Number(setInterval(function() {}, 0));
      
      // 清除所有timeout
      for (let i = 1; i < highestTimeoutId + 1000; i++) {
        clearTimeout(i);
      }
      
      // 清除所有interval
      for (let i = 1; i < highestIntervalId + 1000; i++) {
        clearInterval(i);
      }
      
      console.log(`✅ 清除了timeout ID 1-${highestTimeoutId + 1000}, interval ID 1-${highestIntervalId + 1000}`);
    } catch (error) {
      console.warn('⚠️ 清除定时器时出错:', error);
    }
    
    // 5. 清理LocalStorage（保留关键配置）
    console.log('🗑️ 清理LocalStorage...');
    const keysToKeep = ['auth_token', 'user_preferences', 'language', '__POLLING_DISABLED__'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // 清理特定的缓存键
    const cacheKeysToRemove = [
      'task_', 'session_', 'upload_', 'vectoriz', 'processing_',
      'knowledge_', 'qa_', 'conversation_', 'retrieval_'
    ];
    
    cacheKeysToRemove.forEach(prefix => {
      allKeys.forEach(key => {
        if (key.includes(prefix)) {
          localStorage.removeItem(key);
        }
      });
    });

    // 6. 清理SessionStorage（包括sessionId）
    console.log('🗑️ 清理SessionStorage...');
    const sessionKeysToKeep = ['user_session'];
    const allSessionKeys = Object.keys(sessionStorage);
    
    allSessionKeys.forEach(key => {
      if (!sessionKeysToKeep.includes(key)) {
        sessionStorage.removeItem(key);
      }
    });
    
    // 特别清理sessionId缓存
    sessionStorage.removeItem('knowledge-session-id');
    sessionStorage.removeItem('qa-session-id');
    
    // 7. 清理浏览器缓存和数据库
    console.log('🗑️ 清理浏览器缓存...');
    try {
      // 清理Cache API
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // 清理IndexedDB
      if ('indexedDB' in window) {
        // 清理常见的IndexedDB数据库
        const dbNames = ['app-cache', 'workbox-precache', 'user-data'];
        for (const dbName of dbNames) {
          try {
            indexedDB.deleteDatabase(dbName);
          } catch (error) {
            console.warn(`⚠️ 清理IndexedDB ${dbName} 失败:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ 清理浏览器缓存时出错:', error);
    }

    // 8. 清理WebSocket连接
    console.log('🔌 清理WebSocket连接...');
    try {
      // 检查并关闭可能的WebSocket连接
      if ((window as any).wsConnections) {
        Object.values((window as any).wsConnections).forEach((ws: any) => {
          if (ws && ws.close) {
            ws.close();
          }
        });
        (window as any).wsConnections = {};
      }
    } catch (error) {
      console.warn('⚠️ 清理WebSocket连接时出错:', error);
    }

    // 9. 清理全局状态
    console.log('🌐 清理全局状态...');
    try {
      // 清理可能的全局变量
      delete (window as any).appState;
      delete (window as any).userSession;
      delete (window as any).uploadTasks;
      delete (window as any).vectorizeTasks;
      
      // 重置URL状态（移除查询参数）
      const url = new URL(window.location.href);
      if (url.search) {
        const newUrl = `${url.origin}${url.pathname}`;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (error) {
      console.warn('⚠️ 清理全局状态时出错:', error);
    }

    // 10. 自动重新启用轮询（清理完成后立即重新启用）
    console.log('🔄 重新启用轮询...');
    setTimeout(() => {
      localStorage.removeItem('__POLLING_DISABLED__');
      sessionStorage.removeItem('__POLLING_DISABLED__');
      delete (window as any).__POLLING_DISABLED__;
      console.log('✅ 轮询已重新启用，页面刷新后可以正常轮询真实任务');
    }, 2000); // 2秒后重新启用，给清理操作留出时间
    
    // 自动刷新页面
    if (autoReload) {
      console.log('🔄 2秒后自动刷新页面...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
    
    console.log('🎉 缓存清理完成！');
    
  } catch (error) {
    console.error('❌ 清理缓存时发生错误:', error);
    throw error;
  }
};

/**
 * 在浏览器控制台中可用的全局函数
 */
if (typeof window !== 'undefined') {
  (window as any).clearAllCaches = clearAllCaches;
} 