/**
 * Team服务 - 提供Agno Team的查询、监控和管理功能
 */
import { api } from './api';

export interface TeamQueryRequest {
  team_name?: string;
  query: string;
  session_id?: string;
  stream?: boolean;
  enable_monitoring?: boolean;
  knowledge_retrieval_mode?: 'all' | 'qa_only' | 'papers_only';  // 知识库检索模式
  knowledge_retrieval_enabled?: boolean;  // 知识库检索开关
  knowledge_graph_enabled?: boolean;  // 知识图谱检索开关
  user_id?: number;  // 🔥 用户ID
}

export interface TeamQueryResponse {
  content: string;
  team_name: string;
  execution_id: string;
  processing_time: number;
  member_calls: TeamMemberCall[];
  structured_output?: TeamStructuredOutput;
  coordination_info?: TeamCoordinationInfo;
  monitoring_data?: any;
  metadata?: any;
}

export interface TeamMemberCall {
  memberId: string;
  memberName: string;
  role: string;
  action: string;
  callType: string;
  input: any;
  output: any;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: string;
  confidence?: number;
  errorMessage?: string;
  metadata?: any;
}

export interface TeamStructuredOutput {
  type: string;
  data: any;
  confidence: number;
  sources: string[];
  metadata?: any;
}

export interface TeamCoordinationInfo {
  coordinatorId: string;
  coordinationMode: string;
  coordinationStrategy: string;
  memberAssignments: Record<string, string[]>;
  executionOrder: string[];
  performanceMetrics: Record<string, any>;
  routingDecisions: any[];
  sharedState: Record<string, any>;
}

export interface TeamExecutionStatus {
  team_name: string;
  query: string;
  start_time: number;
  status: string;
  session_id?: string;
}

export interface LangDBMetrics {
  metrics: any[];
  execution_history: any[];
  member_performance: Record<string, any>;
}

export interface TeamStats {
  overall_stats: any;
  team_stats: any[];
  member_performance: any[];
}

export interface AvailableTeam {
  name: string;
  display_name: string;
  description: string;
  mode: string;
  members: string[];
}

class TeamService {
  /**
   * 执行Team查询
   */
  async executeTeamQuery(request: TeamQueryRequest): Promise<TeamQueryResponse> {
    try {
      const response = await api.post('/team-v2/query', request);
      return response.data.data;
    } catch (error) {
      console.error('Team查询失败:', error);
      throw error;
    }
  }

  /**
   * 流式执行Team查询
   */
  async executeTeamQueryStream(
    request: TeamQueryRequest,
    onEvent: (event: any) => void
  ): Promise<void> {
    console.log('🔗 [TEAM_SERVICE] 准备建立SSE连接, request:', request);
    try {
      const response = await fetch(`${api.defaults.baseURL}/team-v2/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          stream: true
        }),
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
      let lastHeartbeat = Date.now();
      let heartbeatCount = 0;
      const heartbeatTimeout = 60000; // 60秒心跳超时

      // 🔥 添加心跳检查定时器
      const heartbeatChecker = setInterval(() => {
        const now = Date.now();
        if (now - lastHeartbeat > heartbeatTimeout) {
          console.error('[TEAM_SERVICE] 心跳超时，SSE连接可能已断开');
          clearInterval(heartbeatChecker);
          reader.cancel();
          throw new Error('SSE连接心跳超时，连接可能已断开');
        }
      }, 30000); // 每30秒检查一次

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('[TEAM_SERVICE] SSE流结束');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6));
                console.log('[TEAM_SERVICE] 解析SSE事件成功:', eventData.type);
                
                // 🔥 处理心跳事件
                if (eventData.type === 'heartbeat') {
                  lastHeartbeat = Date.now();
                  heartbeatCount++;
                  console.debug(`[TEAM_SERVICE] 收到心跳 #${heartbeatCount}:`, eventData.data.message);
                  // 不转发心跳事件到业务逻辑
                  continue;
                }
                
                // 🔥 处理完成事件 - 关键修复
                if (['complete', 'done', 'stream_complete', 'team_complete'].includes(eventData.type)) {
                  console.log(`[TEAM_SERVICE] 🎯 检测到完成事件: ${eventData.type}`);
                  console.log(`[TEAM_SERVICE] 🎯 完成事件原始数据:`, eventData);
                  
                  // 更新心跳时间并立即转发完成事件
                  lastHeartbeat = Date.now();
                  onEvent(eventData);
                  
                  // 清理心跳检查器
                  clearInterval(heartbeatChecker);
                  console.log('[TEAM_SERVICE] 🎉 Team执行完成，准备结束SSE流');
                  
                  // 🔥 不延迟，立即结束，确保状态更新及时
                  try {
                    reader.cancel();
                    console.log('[TEAM_SERVICE] 🎉 SSE连接已取消');
                  } catch (cancelError) {
                    console.warn('[TEAM_SERVICE] SSE连接取消失败:', cancelError);
                  }
                  return; // 结束SSE处理
                }
                
                // 更新最后活动时间
                lastHeartbeat = Date.now();
                onEvent(eventData);
              } catch (e) {
                console.warn('解析SSE事件失败:', e);
                console.warn('失败的SSE行数据:', line);
              }
            } else if (line.trim() && !line.startsWith(':')) {
              console.log('[TEAM_SERVICE] 收到非data行:', line);
            }
          }
        }
      } finally {
        clearInterval(heartbeatChecker);
      }
    } catch (error) {
      console.error('流式Team查询失败:', error);
      throw error;
    }
  }

  /**
   * 获取执行状态
   */
  async getExecutionStatus(executionId: string): Promise<TeamExecutionStatus> {
    try {
      const response = await api.get(`/team-v2/executions/${executionId}`);
      return response.data.data;
    } catch (error) {
      console.error('获取执行状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取执行指标
   */
  async getExecutionMetrics(executionId: string): Promise<any> {
    try {
      const response = await api.get(`/api/team/metrics/${executionId}`);
      return response.data.data;
    } catch (error) {
      console.error('获取执行指标失败:', error);
      throw error;
    }
  }

  /**
   * 取消执行
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    try {
      const response = await api.post(`/api/team/executions/${executionId}/cancel`);
      return response.data.success;
    } catch (error) {
      console.error('取消执行失败:', error);
      throw error;
    }
  }

  /**
   * 获取LangDB监控指标
   */
  async getLangDBMetrics(sessionId: string): Promise<LangDBMetrics> {
    try {
      const response = await api.get(`/api/team/langdb/metrics/${sessionId}`);
      return response.data.data;
    } catch (error) {
      console.error('获取LangDB指标失败:', error);
      throw error;
    }
  }

  /**
   * 获取LangDB执行历史
   */
  async getLangDBHistory(sessionId: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await api.get(`/api/team/langdb/history/${sessionId}`, {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('获取LangDB历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取LangDB性能数据
   */
  async getLangDBPerformance(sessionId: string): Promise<Record<string, any>> {
    try {
      const response = await api.get(`/api/team/langdb/performance/${sessionId}`);
      return response.data.data;
    } catch (error) {
      console.error('获取LangDB性能失败:', error);
      throw error;
    }
  }

  /**
   * 启动LangDB监控
   */
  async startLangDBMonitoring(sessionId: string, teamConfig: any): Promise<boolean> {
    try {
      const response = await api.post('/api/team/langdb/start', {
        session_id: sessionId,
        team_config: teamConfig
      });
      return response.data.success;
    } catch (error) {
      console.error('启动LangDB监控失败:', error);
      throw error;
    }
  }

  /**
   * 停止LangDB监控
   */
  async stopLangDBMonitoring(sessionId: string): Promise<boolean> {
    try {
      const response = await api.post('/api/team/langdb/stop', {
        session_id: sessionId
      });
      return response.data.success;
    } catch (error) {
      console.error('停止LangDB监控失败:', error);
      throw error;
    }
  }

  /**
   * 获取可用的Team列表
   */
  async getAvailableTeams(): Promise<AvailableTeam[]> {
    try {
      const response = await api.get('/team-v2/templates');
      return response.data.templates || [];
    } catch (error) {
      console.error('获取Team列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取Team统计信息
   */
  async getTeamStats(): Promise<TeamStats> {
    try {
      const response = await api.get('/team-v2/statistics');
      return response.data;
    } catch (error) {
      console.error('获取Team统计失败:', error);
      throw error;
    }
  }

  /**
   * 测试Team功能
   */
  async testTeamFunctionality(): Promise<any> {
    try {
      const response = await api.post('/api/team/test');
      return response.data.data;
    } catch (error) {
      console.error('Team功能测试失败:', error);
      throw error;
    }
  }

  /**
   * 获取Team配置
   */
  async getTeamConfig(teamName: string = 'geopolymer_qa_team_v2'): Promise<any> {
    try {
      const response = await api.get(`/advanced-qa/team/${teamName}/config`);
      return response.data;
    } catch (error) {
      console.error('获取Team配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新Agent配置
   */
  async updateAgentConfig(agentName: string, config: any): Promise<any> {
    try {
      const response = await api.put(`/advanced-qa/agent/${agentName}/config`, config);
      return response.data;
    } catch (error) {
      console.error('更新Agent配置失败:', error);
      throw error;
    }
  }

  /**
   * 刷新Team配置缓存
   */
  async refreshTeamConfig(teamName: string = 'geopolymer_qa_team_v2'): Promise<boolean> {
    try {
      const response = await api.post(`/advanced-qa/team/${teamName}/refresh`);
      return response.data.success;
    } catch (error) {
      console.error('刷新Team配置失败:', error);
      throw error;
    }
  }

  /**
   * 创建Team消息格式
   */
  createTeamMessage(
    content: string,
    teamInfo: {
      teamId: string;
      teamName: string;
      teamMode: string;
      executionId: string;
      memberCalls: TeamMemberCall[];
      structuredOutput?: TeamStructuredOutput;
      coordinationInfo?: TeamCoordinationInfo;
    }
  ) {
    return {
      id: `team_${Date.now()}`,
      type: 'assistant' as const,
      content,
      timestamp: Date.now(),
      teamInfo: {
        isTeamMessage: true,
        ...teamInfo
      }
    };
  }

  /**
   * 解析Team流式事件
   */
  parseTeamStreamEvent(event: any): {
    type: string;
    data: any;
    isTeamMessage: boolean;
  } {
    const eventType = event.type;
    
    switch (eventType) {
      case 'team_start':
        return {
          type: 'team_start',
          data: event.data,
          isTeamMessage: false
        };
      
      case 'content_chunk':
      case 'content':  // 🔥 添加对content类型事件的支持
        return {
          type: 'content_chunk',
          data: event.data,
          isTeamMessage: false
        };
      
      case 'member_call':
        return {
          type: 'member_call',
          data: event.data,
          isTeamMessage: false
        };
      
      case 'coordination_event':
        return {
          type: 'coordination_event',
          data: event.data,
          isTeamMessage: false
        };
      
      // 🔥 新增：Agent切换事件处理
      case 'agent_start':
        console.log('[TEAM_SERVICE] 解析agent_start事件:', event);
        return {
          type: 'agent_start',
          data: event.data,
          isTeamMessage: false
        };
      
      case 'agent_complete':
        console.log('[TEAM_SERVICE] 解析agent_complete事件:', event);
        return {
          type: 'agent_complete',
          data: event.data,
          isTeamMessage: false
        };
      
      case 'team_complete':
      case 'complete':
      case 'done':
      case 'stream_complete':
        console.log('[TEAM_SERVICE] 🎯 解析完成事件:', event.type, event);
        console.log('[TEAM_SERVICE] 🎯 完成事件数据:', JSON.stringify(event.data, null, 2));
        const completionResult = {
          type: 'team_complete', // 统一为team_complete给前端组件使用
          data: event.data,
          isTeamMessage: true
        };
        console.log('[TEAM_SERVICE] 🎯 返回的完成事件:', completionResult);
        return completionResult;
      
      case 'team_error':
        return {
          type: 'team_error',
          data: event.data,
          isTeamMessage: false
        };
      
      case 'timeout_warning':
        return {
          type: 'timeout_warning',
          data: {
            ...event.data,
            severity: 'warning',
            action: 'show_warning'
          },
          isTeamMessage: false
        };
      
      case 'chunk_timeout_warning':
        return {
          type: 'chunk_timeout_warning',
          data: {
            ...event.data,
            severity: 'warning',
            action: 'show_agent_timeout'
          },
          isTeamMessage: false
        };
      
      case 'execution_timeout':
        return {
          type: 'execution_timeout',
          data: {
            ...event.data,
            severity: 'error',
            action: 'auto_terminate'
          },
          isTeamMessage: false
        };
      
      default:
        // 🔥 调试：检查是否有遗漏的完成事件类型
        console.log('[TEAM_SERVICE] 🔍 未识别的事件类型:', event.type, event);
        
        // 🔥 兜底逻辑：如果事件类型包含complete相关关键词，也当作完成事件处理
        if (event.type && typeof event.type === 'string' && 
            (event.type.includes('complete') || event.type.includes('done') || 
             event.type.includes('finish') || event.type.includes('end'))) {
          console.log('[TEAM_SERVICE] 🎯 通过关键词匹配识别为完成事件:', event.type);
          return {
            type: 'team_complete',
            data: event.data,
            isTeamMessage: true
          };
        }
        
        return {
          type: 'unknown',
          data: event,
          isTeamMessage: false
        };
    }
  }

  /**
   * 格式化Team执行时间
   */
  formatExecutionTime(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * 获取成员状态颜色
   */
  getMemberStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#52c41a';
      case 'running':
        return '#1890ff';
      case 'error':
        return '#ff4d4f';
      case 'pending':
        return '#faad14';
      default:
        return '#d9d9d9';
    }
  }

  /**
   * 获取团队执行性能分析数据
   */
  async getExecutionPerformance(executionId: string): Promise<any> {
    try {
      const response = await api.get(`/api/v2/team/executions/${executionId}`);
      return response.data;
    } catch (error) {
      console.error('获取团队执行性能数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取Team V2系统状态
   */
  async getSystemStatus(): Promise<any> {
    try {
      const response = await api.get('/team-v2/status');
      return response.data;
    } catch (error) {
      console.error('获取系统状态失败:', error);
      throw error;
    }
  }

  /**
   * 清理Team实例
   */
  async cleanupTeamInstances(): Promise<any> {
    try {
      const response = await api.post('/api/v2/team/cleanup');
      return response.data;
    } catch (error) {
      console.error('清理Team实例失败:', error);
      throw error;
    }
  }

  /**
   * 释放指定Team实例
   */
  async releaseTeamInstance(teamName: string, sessionId: string): Promise<any> {
    try {
      const response = await api.post(`/api/v2/team/teams/${teamName}/release/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('释放Team实例失败:', error);
      throw error;
    }
  }

  /**
   * 获取系统健康状态
   */
  async getHealthStatus(): Promise<any> {
    try {
      const response = await api.get('/team-v2/health');
      return response.data;
    } catch (error) {
      console.error('获取健康状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取成员状态图标
   */
  getMemberStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'running':
        return 'loading';
      case 'error':
        return 'exclamation-circle';
      case 'pending':
        return 'clock-circle';
      default:
        return 'question-circle';
    }
  }
}

export const teamService = new TeamService(); 