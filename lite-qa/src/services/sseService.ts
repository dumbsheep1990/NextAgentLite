/**
 * SSE服务 - 统一实时推送
 * 支持文档状态和任务进度的实时推送，完全替代轮询机制
 */
import { APP_CONFIG } from '../config/appConfig';

interface SSEMessage {
  type: string;
  [key: string]: any;
}

class DocumentStatusSSE {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = APP_CONFIG.sse.maxReconnectAttempts;
  private reconnectInterval = APP_CONFIG.sse.reconnectInterval;
  private lastConnectAttempt = 0;
  private minConnectInterval = APP_CONFIG.sse.reconnectInterval; // 使用配置的重连间隔
  private isConnecting = false;
  private sessionId: string | null = null;
  private connectionStartTime = 0;
  
  // 连接状态持久化 - 防止页面刷新后重复连接
  private readonly CONNECTION_STATE_KEY = 'sse_connection_state';
  private connectionState: {
    sessionId: string | null;
    connected: boolean;
    timestamp: number;
  } = this.loadConnectionState();

  constructor() {
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.sessionId) {
        // 页面重新可见时，检查连接状态
        this.checkConnectionHealth();
      }
    });

    // 监听页面刷新/关闭
    window.addEventListener('beforeunload', () => {
      // 页面关闭前保存当前状态
      if (this.isConnected() && this.sessionId) {
        this.connectionState = {
          sessionId: this.sessionId,
          connected: true,
          timestamp: Date.now()
        };
        this.saveConnectionState();
      }
    });
  }

  /**
   * 检查连接健康状态
   */
  private checkConnectionHealth(): void {
    if (this.sessionId && !this.isConnected()) {
      console.log('📡 检测到连接断开，尝试重连');
      this.connect(this.sessionId, false);
    }
  }

  /**
   * 加载连接状态
   */
  private loadConnectionState() {
    try {
      const saved = localStorage.getItem(this.CONNECTION_STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        // 检查状态是否过期（超过5分钟认为过期）
        if (Date.now() - state.timestamp < 5 * 60 * 1000) {
          return state;
        }
      }
    } catch (error) {
      console.warn('📡 加载SSE连接状态失败:', error);
    }
    return { sessionId: null, connected: false, timestamp: 0 };
  }

  /**
   * 保存连接状态
   */
  private saveConnectionState() {
    try {
      this.connectionState.timestamp = Date.now();
      localStorage.setItem(this.CONNECTION_STATE_KEY, JSON.stringify(this.connectionState));
    } catch (error) {
      console.warn('📡 保存SSE连接状态失败:', error);
    }
  }

  /**
   * 连接到SSE端点
   */
  async connect(sessionId: string, force: boolean = false): Promise<void> {
    const now = Date.now();
    
    // 检查持久化状态和当前连接状态
    const isCurrentlyConnected = this.isConnected();
    const isSameSession = this.sessionId === sessionId;
    const hasValidPersistedState = this.connectionState.connected && 
                                  this.connectionState.sessionId === sessionId &&
                                  Date.now() - this.connectionState.timestamp < 60 * 1000; // 1分钟内有效

    // 如果已经连接且会话ID相同，或者有有效的持久化状态，则跳过
    if (!force && ((isCurrentlyConnected && isSameSession) || hasValidPersistedState)) {
      console.log('📡 SSE已连接，跳过重复连接', {
        isCurrentlyConnected,
        isSameSession,
        hasValidPersistedState,
        sessionId
      });
      return;
    }

    // 防止频繁连接（除非强制连接）
    if (!force && now - this.lastConnectAttempt < this.minConnectInterval) {
      console.log('📡 SSE连接过于频繁，跳过连接请求');
      return;
    }

    // 防止并发连接
    if (this.isConnecting) {
      console.log('📡 SSE正在连接中，跳过重复连接');
      return;
    }

    this.isConnecting = true;
    this.lastConnectAttempt = now;
    this.connectionStartTime = now;
    this.sessionId = sessionId;

    try {
      // 关闭现有连接
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      const url = `/api/v1/sse/document-status/${sessionId}`;
      console.log('📡 建立统一SSE连接:', url);
      
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        const connectionTime = Date.now() - this.connectionStartTime;
        console.log(`📡 统一SSE连接已建立 (耗时: ${connectionTime}ms)`);
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        
        // 更新连接状态并保存
        this.connectionState = {
          sessionId: this.sessionId,
          connected: true,
          timestamp: Date.now()
        };
        this.saveConnectionState();
        
        // 发送连接成功事件
        window.dispatchEvent(new CustomEvent('sse-connection-status', { 
          detail: { status: 'connected', connectionTime } 
        }));
      };

      this.eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('📡 解析SSE消息失败:', error, event.data);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('📡 SSE连接错误:', error);
        this.isConnecting = false;
        
        // 更新连接状态
        this.connectionState.connected = false;
        this.saveConnectionState();
        
        // 发送连接错误事件
        window.dispatchEvent(new CustomEvent('sse-connection-status', { 
          detail: { status: 'error', error } 
        }));
        
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.scheduleReconnect();
        }
      };

      // 连接超时检测
      setTimeout(() => {
        if (this.isConnecting) {
          console.warn('📡 SSE连接超时');
          this.isConnecting = false;
          window.dispatchEvent(new CustomEvent('sse-connection-status', { 
            detail: { status: 'timeout' } 
          }));
        }
      }, 10000);

    } catch (error) {
      console.error('📡 创建SSE连接失败:', error);
      this.isConnecting = false;
      window.dispatchEvent(new CustomEvent('sse-connection-status', { 
        detail: { status: 'error', error } 
      }));
      this.scheduleReconnect();
    }
  }

  /**
   * 处理接收到的SSE消息
   */
  private handleMessage(message: SSEMessage): void {
    console.log('📡 收到统一SSE消息:', message);

    // 发送统一事件供其他组件监听
    window.dispatchEvent(new CustomEvent('sse-message', { detail: message }));

    switch (message.type) {
      case 'connection_established':
        console.log('📡 统一SSE连接确认:', message);
        if (message.unified_sse) {
          console.log('📡 支持功能:', message.capabilities);
        }
        break;

      case 'heartbeat':
        // 心跳包，无需处理
        break;

      case 'document_status_update':
        this.handleDocumentStatusUpdate(message);
        break;

      case 'task_progress_update':
        this.handleTaskProgressUpdate(message);
        break;

      case 'task_completed':
        this.handleTaskCompleted(message);
        break;

      case 'task_failed':
        this.handleTaskFailed(message);
        break;

      case 'task_cancelled':
        this.handleTaskCancelled(message);
        break;

      default:
        console.log('📡 未知SSE消息类型:', message.type);
    }
  }

  /**
   * 处理文档状态更新
   */
  private handleDocumentStatusUpdate(message: SSEMessage): void {
    console.log('📄 文档状态更新:', message.document_id, message.data);
    
    // 为兼容现有组件，也发送旧格式事件
    window.dispatchEvent(new CustomEvent('document-status-update', {
      detail: {
        documentId: message.document_id,
        status: message.data
      }
    }));
  }

  /**
   * 处理任务进度更新
   */
  private handleTaskProgressUpdate(message: SSEMessage): void {
    console.log('⚙️ 任务进度更新:', message.task_id, message.data);
    
    // 兼容旧格式事件（如果还有组件使用）
    window.dispatchEvent(new CustomEvent('sse-task-progress', {
      detail: {
        task_id: message.task_id,
        progress: message.data.progress,
        stage: message.data.stage,
        detail: message.data.detail,
        status: message.data.status,
        document_id: message.document_id, // 修复：从顶层获取document_id
        task_type: message.data.task_type
      }
    }));
  }

  /**
   * 处理任务完成
   */
  private handleTaskCompleted(message: SSEMessage): void {
    console.log('✅ 任务完成:', message.task_id, message.data);
    
    // 兼容旧格式事件
    window.dispatchEvent(new CustomEvent('sse-task-completed', {
      detail: {
        task_id: message.task_id,
        status: 'completed',
        stage: '已完成',
        detail: message.data.detail || '任务已完成',
        progress: 100,
        processing_time: message.data.processing_time,
        result: message.data.result
      }
    }));
  }

  /**
   * 处理任务失败
   */
  private handleTaskFailed(message: SSEMessage): void {
    console.log('❌ 任务失败:', message.task_id, message.data);
    
    // 兼容旧格式事件
    window.dispatchEvent(new CustomEvent('sse-task-failed', {
      detail: {
        task_id: message.task_id,
        status: 'failed',
        stage: '失败',
        detail: message.data.detail || '任务失败',
        error_message: message.data.error_message,
        error_type: message.data.error_type
      }
    }));
  }

  /**
   * 处理任务取消
   */
  private handleTaskCancelled(message: SSEMessage): void {
    console.log('🚫 任务取消:', message.task_id);
    
    // 兼容旧格式事件
    window.dispatchEvent(new CustomEvent('sse-task-cancelled', {
      detail: {
        task_id: message.task_id,
        status: 'cancelled',
        stage: '已取消',
        detail: '任务已取消'
      }
    }));
  }

  /**
   * 调度重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('📡 SSE重连次数已达上限，停止自动重连');
      window.dispatchEvent(new CustomEvent('sse-connection-status', { 
        detail: { status: 'max_retries_reached' } 
      }));
      return;
    }

    this.reconnectAttempts++;
    // 指数退避算法，但限制最大延迟为30秒
    const delay = Math.min(
      this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );
    
    console.log(`📡 SSE将在 ${Math.round(delay/1000)}秒 后重连 (第${this.reconnectAttempts}次)`);
    
    window.dispatchEvent(new CustomEvent('sse-connection-status', { 
      detail: { 
        status: 'reconnecting', 
        attempt: this.reconnectAttempts,
        delay: Math.round(delay/1000)
      } 
    }));
    
    setTimeout(() => {
      if (this.sessionId) {
        this.connect(this.sessionId, false);
      }
    }, delay);
  }

  /**
   * 强制重连（手动触发）
   */
  forceReconnect(sessionId?: string): void {
    console.log('📡 手动触发SSE重连');
    this.reconnectAttempts = 0; // 重置重连计数
    const targetSessionId = sessionId || this.sessionId;
    if (targetSessionId) {
      this.connect(targetSessionId, true);
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('📡 主动断开SSE连接');
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.sessionId = null;
    
    // 清理连接状态
    this.connectionState = {
      sessionId: null,
      connected: false,
      timestamp: Date.now()
    };
    this.saveConnectionState();
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): number {
    return this.eventSource?.readyState ?? EventSource.CLOSED;
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// 导出单例实例
export const documentStatusSSE = new DocumentStatusSSE(); 