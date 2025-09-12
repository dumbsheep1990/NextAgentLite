/**
 * 简化测试渲染器 - 纯SSE流式渲染，无任何统计监控逻辑
 * 用于测试是否是复杂组件导致的渲染中断问题
 */
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Alert } from 'antd';
import { SendOutlined, LoadingOutlined } from '@ant-design/icons';
import { getApiBaseUrl } from '../../config/appConfig';

const { TextArea } = Input;

interface SimpleTestRendererProps {
  teamName?: string;
}

const SimpleTestRenderer: React.FC<SimpleTestRendererProps> = ({ teamName = 'general_qa_team_v2' }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev.slice(-20), `[${timestamp}] ${message}`]);
    console.log(`[SimpleTestRenderer] ${message}`);
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setContent('');
    setError(null);
    addDebugLog(`开始查询: ${query}`);

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 创建新的AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const url = `${getApiBaseUrl().replace('/api/v1', '')}/api/v2/team/query`;
      addDebugLog(`发起Team V2查询: ${url}`);

      // 使用fetch进行POST请求，获取SSE流
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_name: teamName,
          query: query.trim(),
          session_id: `simple_test_${Date.now()}`,
          stream: true,
          knowledge_retrieval_mode: 'all'
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // 处理流式响应
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              addDebugLog('SSE流结束');
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  addDebugLog(`收到事件: ${data.type}`);
                  
                  // 处理不同类型的事件
                  if (data.type === 'content' && data.data?.content) {
                    setContent(prev => prev + data.data.content);
                    // 自动滚动到底部
                    setTimeout(() => {
                      if (contentRef.current) {
                        contentRef.current.scrollTop = contentRef.current.scrollHeight;
                      }
                    }, 10);
                  } else if (data.type === 'error') {
                    addDebugLog(`收到错误: ${data.data?.error || '未知错误'}`);
                    setError(data.data?.error || '未知错误');
                    setIsLoading(false);
                    return;
                  } else if (data.type === 'complete' || data.type === 'done') {
                    addDebugLog('查询完成');
                    setIsLoading(false);
                    return;
                  }
                } catch (parseError) {
                  addDebugLog(`解析事件数据失败: ${parseError}`);
                  console.error('Failed to parse event data:', parseError);
                }
              }
            }
          }
        } catch (streamError) {
          addDebugLog(`流处理错误: ${streamError}`);
          setError(streamError instanceof Error ? streamError.message : '流处理失败');
          setIsLoading(false);
        } finally {
          reader.releaseLock();
        }
      };

      // 开始处理流
      processStream();

    } catch (err) {
      addDebugLog(`查询失败: ${err}`);
      setError(err instanceof Error ? err.message : '查询失败');
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      addDebugLog('用户手动停止查询');
    }
    setIsLoading(false);
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <Card title="🧪 简化Team测试器" bordered={false}>
        
        {/* 查询输入区 */}
        <div style={{ marginBottom: 20 }}>
          <Input
            placeholder="输入你的问题，例如：人工智能是什么"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={handleSubmit}
            disabled={isLoading}
            style={{ marginBottom: 10 }}
          />
          <div>
            <Button
              type="primary"
              icon={isLoading ? <LoadingOutlined /> : <SendOutlined />}
              onClick={handleSubmit}
              disabled={isLoading || !query.trim()}
              style={{ marginRight: 10 }}
            >
              {isLoading ? '处理中...' : '发送查询'}
            </Button>
            {isLoading && (
              <Button onClick={handleStop}>
                停止
              </Button>
            )}
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <Alert
            message="查询出错"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 20 }}
          />
        )}

        {/* 内容显示区 */}
        <Card 
          title="📄 回答内容" 
          style={{ marginBottom: 20 }}
          bodyStyle={{ padding: 0 }}
        >
          <div
            ref={contentRef}
            style={{
              height: 400,
              padding: 20,
              overflow: 'auto',
              backgroundColor: '#fafafa',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'monospace',
              fontSize: 14,
              lineHeight: 1.6,
              border: '1px solid #d9d9d9'
            }}
          >
            {content || (isLoading ? '等待响应...' : '请输入问题开始测试')}
          </div>
        </Card>

        {/* 调试日志 */}
        <Card title="🔍 调试日志" size="small">
          <div
            style={{
              height: 200,
              overflow: 'auto',
              backgroundColor: '#f5f5f5',
              padding: 10,
              border: '1px solid #d9d9d9',
              fontFamily: 'monospace',
              fontSize: 12
            }}
          >
            {debugLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </Card>
      </Card>
    </div>
  );
};

export default SimpleTestRenderer;