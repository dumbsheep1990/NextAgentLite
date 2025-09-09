/**
 * 清理缓存按钮组件
 * 可以在任何页面使用的一键清理功能
 */

import React, { useState } from 'react';
import { Button, Tooltip, message } from 'antd';
import { DeleteOutlined, LoadingOutlined } from '@ant-design/icons';

interface ClearCacheButtonProps {
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'text' | 'link';
  style?: React.CSSProperties;
  className?: string;
  showText?: boolean;
  tooltip?: string;
}

const ClearCacheButton: React.FC<ClearCacheButtonProps> = ({
  size = 'middle',
  type = 'default',
  style = {},
  className = '',
  showText = true,
  tooltip = '清理前端缓存和状态，解决异常轮询问题'
}) => {
  const [clearing, setClearing] = useState(false);

  const handleClearCache = async () => {
    setClearing(true);
    
    try {
      console.log('🧹 开始清理前端缓存和状态...');
      
      // 显示开始清理的消息
      message.loading({ content: '正在清理缓存...', key: 'clear-cache', duration: 0 });
      
      // 1. 首先停止所有Store中的轮询任务
      console.log('⏹️ 强制停止所有轮询任务...');
      try {
        // 获取所有Store实例并停止轮询
        // const { useKnowledgeStore } = await import('../../stores/knowledgeStore');
        // const { useQAStore } = await import('../../stores/qaStore');
        
        // const knowledgeStore = useKnowledgeStore.getState();
        // const qaStore = useQAStore.getState();
        
        // 停止知识库的所有轮询 (已迁移到SSE，此代码保留以兼容)
        // if (knowledgeStore.stopAllPolling) {
        //   knowledgeStore.stopAllPolling();
        //   console.log('✅ 知识库轮询已停止');
        // }
        
        // 清理知识库状态中的轮询Map (已迁移到SSE，此代码保留以兼容)
        // if (knowledgeStore.pollingIntervals) {
        //   knowledgeStore.pollingIntervals.forEach((interval: any) => {
        //     clearInterval(interval);
        //   });
        //   knowledgeStore.pollingIntervals.clear();
        //   console.log('✅ 知识库轮询Map已清理');
        // }
        
      } catch (error) {
        console.warn('⚠️ 停止Store轮询时出错:', error);
      }
      
      // 2. 暴力清除所有JavaScript定时器
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
      
      // 3. 清理localStorage中的任务相关数据
      const localKeys = Object.keys(localStorage);
      const taskKeys = localKeys.filter(key => 
        key.includes('task') || 
        key.includes('session') || 
        key.includes('knowledge') || 
        key.includes('qa') || 
        key.includes('conversation') ||
        key.includes('polling') ||
        key.includes('document') ||
        key.includes('store') ||
        key.includes('upload') ||
        key.includes('processing') ||
        key.includes('vectoriz') ||
        key.startsWith('mat-') // 项目特定前缀
      );
      
      console.log('🎯 清理localStorage键:', taskKeys);
      taskKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // 4. 清理sessionStorage中的任务相关数据  
      const sessionKeys = Object.keys(sessionStorage);
      const sessionTaskKeys = sessionKeys.filter(key => 
        key.includes('task') || 
        key.includes('session') || 
        key.includes('knowledge') || 
        key.includes('qa') ||
        key.includes('polling') ||
        key.includes('document') ||
        key.includes('upload') ||
        key.includes('processing') ||
        key.includes('vectoriz')
      );
      
      console.log('🎯 清理sessionStorage键:', sessionTaskKeys);
      sessionTaskKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });

      // 5. 设置一个标记，防止页面重新加载后重启轮询
      console.log('🚫 设置轮询禁用标记...');
      localStorage.setItem('__POLLING_DISABLED__', 'true');
      localStorage.setItem('__CACHE_CLEARED_TIME__', Date.now().toString());
      
      // 6. 重置所有Store状态
      console.log('🔄 广播清理事件到所有组件和Store...');
      window.dispatchEvent(new CustomEvent('clear-all-stores', {
        detail: { forceClear: true, disablePolling: true }
      }));
      
      // 7. 额外的安全措施：设置一个全局标记阻止新的轮询启动
      (window as any).__POLLING_DISABLED__ = true;
      
      // 等待一下让事件处理完成
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('✅ 前端缓存清理完成');
      
      // 显示成功消息
      message.success({ 
        content: '✅ 缓存清理完成！页面即将刷新...', 
        key: 'clear-cache',
        duration: 2
      });
      
      // 延迟2秒后刷新页面
      setTimeout(() => {
        // 清除禁用标记，允许页面重新加载后正常工作
        localStorage.removeItem('__POLLING_DISABLED__');
        delete (window as any).__POLLING_DISABLED__;
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('缓存清理失败:', error);
      message.error({ 
        content: '❌ 缓存清理失败', 
        key: 'clear-cache',
        duration: 3
      });
      setClearing(false);
    }
  };

  const buttonContent = (
    <Button
      size={size}
      type={type}
      style={style}
      className={className}
      loading={clearing}
      icon={clearing ? <LoadingOutlined /> : <DeleteOutlined />}
      onClick={handleClearCache}
      danger={type !== 'text'}
    >
      {showText && (clearing ? '清理中...' : '清理缓存')}
    </Button>
  );

  if (tooltip && !clearing) {
    return (
      <Tooltip title={tooltip} placement="top">
        {buttonContent}
      </Tooltip>
    );
  }

  return buttonContent;
};

export default ClearCacheButton; 