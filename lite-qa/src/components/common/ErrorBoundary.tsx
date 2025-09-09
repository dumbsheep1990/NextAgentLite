/**
 * 错误边界组件
 */
import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('错误边界捕获到错误:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误页面
      return (
        <div style={{ 
          padding: '50px',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Result
            status="error"
            title="页面加载失败"
            subTitle={
              <div style={{ textAlign: 'left', maxWidth: '600px' }}>
                <p>抱歉，页面遇到了错误。请尝试以下解决方案：</p>
                <ul style={{ margin: '16px 0', paddingLeft: '20px' }}>
                  <li>刷新页面重新加载</li>
                  <li>检查网络连接是否正常</li>
                  <li>清除浏览器缓存后重试</li>
                  <li>如果问题持续存在，请联系技术支持</li>
                </ul>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details style={{ 
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                      错误详情 (开发模式)
                    </summary>
                    <pre style={{ 
                      marginTop: '8px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {this.state.error.name}: {this.state.error.message}
                      {this.state.error.stack && (
                        <div style={{ marginTop: '8px' }}>
                          {this.state.error.stack}
                        </div>
                      )}
                    </pre>
                  </details>
                )}
              </div>
            }
            extra={[
              <Button key="reset" onClick={this.handleReset}>
                重试
              </Button>,
              <Button key="reload" type="primary" onClick={this.handleReload}>
                刷新页面
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 