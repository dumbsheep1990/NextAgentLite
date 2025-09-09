/**
 * QA问答服务 - API调用封装
 */
import { apiService } from './api';
import { getApiUrl } from '../config/appConfig';
import type { 
  QARequest, 
  QAResponse, 
  AgentInfo, 
  HistoryConversation, 
  Message 
} from '../types';

export class QAService {
  // 智能体ID映射 - 将前端中文ID映射为后端英文ID
  private mapAgentName(frontendAgentName?: string): string {
    const agentMapping: Record<string, string> = {
      'dijuwu_wendatuandui': 'qa_team',
      'geopolymer_qa_team_v2': 'geopolymer_qa_team_v2',  // 新的多语言Team
      'cailiao_zhuanjia': 'cailiao_zhuanjia',  // 直接映射
      'wenxian_jiansuozhuanjia': 'doc_analyzer',
      'shuju_fenxizhuanjia': 'multimodal_agent'
    };
    
    if (!frontendAgentName) return 'qa_team';
    
    // 如果已经是英文ID，直接返回
    if (Object.values(agentMapping).includes(frontendAgentName)) {
      return frontendAgentName;
    }
    
    // 映射中文ID到英文ID
    return agentMapping[frontendAgentName] || 'qa_team';
  }

  // 发送问题到AI智能体（流式）- 添加详细的延迟分析
  async askQuestionStream(
    request: QARequest,
    onChunk: (chunk: string) => void,
    onDone: (doneData?: any) => void,
    onError: (error: string) => void,
    onThinking?: (thinkingData: any) => void,
    onKnowledgeSources?: (knowledgeData: any) => void,
    onAgentCall?: (agentCallData: any) => void,
    onTeamAnalysis?: (teamAnalysisData: any) => void,
    onTeamStart?: (teamStartData: any) => void,
    onAgentStatus?: (agentStatusData: any) => void,
    onAgentDecision?: (agentDecisionData: any) => void,
    onAgentStart?: (agentStartData: any) => void,
    onAgentComplete?: (agentCompleteData: any) => void,
    abortController?: AbortController
  ): Promise<void> {
    console.log('🚀 qaService.askQuestionStream 开始调用');
    console.log('📋 请求参数:', request);
    console.log('🔗 回调函数状态:', {
      onChunk: !!onChunk,
      onDone: !!onDone,
      onError: !!onError,
      onThinking: !!onThinking,
      onKnowledgeSources: !!onKnowledgeSources,
      onAgentCall: !!onAgentCall,
      onTeamAnalysis: !!onTeamAnalysis,
      onTeamStart: !!onTeamStart,
      onAgentStatus: !!onAgentStatus,
      onAgentDecision: !!onAgentDecision
    });
    
    try {
      // 记录请求开始时间
      const requestStartTime = performance.now();
      console.log(`[LATENCY] 前端请求开始时间: ${requestStartTime.toFixed(3)}ms`);
      
      // 转换前端请求格式到后端接口格式
      const backendRequest = request.agentType === 'team' ? {
        // Team API 格式
        team_name: request.agentName || 'geopolymer_qa_team_v2',
        query: request.message,
        session_id: request.conversation_id,
        user_id: request.user_id, // 添加用户ID
        stream: true,  // 强制启用流式响应
        enable_monitoring: true
      } : {
        // QA API 格式
        question: request.message,
        session_id: request.conversation_id,
        user_id: request.user_id, // 添加用户ID
        agent_type: request.agentType || 'single',
        agent_name: this.mapAgentName(request.agentName),
        model_name: request.modelName, // 添加模型名称
        context: request.agent_config,
        search_knowledge: request.search_knowledge, // 添加知识库检索参数
        search_graph: request.search_graph, // 添加知识图谱检索参数
        knowledge_retrieval_mode: request.search_knowledge ? request.retrieval_mode : undefined, // 只有在知识库检索开启时才传递检索模式
        enable_translation: request.enable_translation, // 添加翻译功能参数
        // 多轮对话上下文参数
        enable_context_memory: request.enable_context_memory ?? true, // 默认启用上下文记忆
        max_context_turns: request.max_context_turns ?? 8 // 默认最大8轮上下文
      };
      

      // 根据agentType选择正确的API端点
      const endpoint = request.agentType === 'team' 
        ? 'team-v2/query'  // Team模式使用team V2 API
        : 'qa/ask/stream';  // 专家模式使用qa API
      
      const url = getApiUrl(endpoint);

      // 记录网络请求开始时间
      const networkStartTime = performance.now();
      console.log(`[LATENCY] 网络请求准备耗时: ${(networkStartTime - requestStartTime).toFixed(3)}ms`);

      console.log('🌐 发送fetch请求到:', url);
      console.log('📦 请求体:', JSON.stringify(backendRequest, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(backendRequest),
        // 网络优化配置
        keepalive: true,
        signal: abortController?.signal || AbortSignal.timeout(300000), // 使用传入的AbortController或默认超时
      });
      
      console.log('📡 fetch响应状态:', response.status, response.statusText);

      // 记录网络响应时间
      const responseTime = performance.now();
      const networkLatency = responseTime - networkStartTime;
      console.log(`[LATENCY] 网络请求耗时: ${networkLatency.toFixed(3)}ms`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let firstEventReceived = false;
      let firstChunkReceived = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            console.log('📨 QAService 收到SSE行:', JSON.stringify(line));
            
            if (line.startsWith('data: ')) {
              console.log('✅ QAService 匹配到data行:', line);
              
              try {
                const jsonString = line.slice(6).trim();
                console.log('🔍 QAService 提取JSON字符串:', JSON.stringify(jsonString));
                
                // 检查是否为空或无效JSON
                if (!jsonString || jsonString === '') {
                  console.log('⚠️ QAService JSON字符串为空，跳过');
                  continue;
                }
                
                console.log('🔄 QAService 开始解析JSON...');
                let data = JSON.parse(jsonString);
                console.log('✅ QAService 第一层JSON解析成功:', data);
                
                // 检查是否是双重嵌套的JSON字符串
                if (typeof data === 'string' && data.startsWith('data: ')) {
                  console.log('🔍 检测到双重嵌套，解析第二层...');
                  const innerJsonString = data.slice(6).trim();
                  data = JSON.parse(innerJsonString);
                  console.log('✅ QAService 第二层JSON解析成功:', data);
                }
                
                console.log('🏷️ QAService 最终事件类型:', data.type);
                
                // 记录首个SSE事件接收时间
                if (!firstEventReceived) {
                  firstEventReceived = true;
                  const firstEventTime = performance.now();
                  const totalFirstEventLatency = firstEventTime - requestStartTime;
                  console.log(`[LATENCY] 首个SSE事件接收延迟: ${totalFirstEventLatency.toFixed(3)}ms`);
                }
                
                // Process SSE event
                
                switch (data.type) {
                  case 'thinking':
                    console.log('🎯 QAService 匹配到thinking事件!');
                    console.log('🔍 QAService onThinking回调存在?', !!onThinking);
                    console.log('📦 QAService 原始thinking数据:', data);
                    
                    // 处理思考过程数据
                    if (onThinking) {
                      console.log('🧠 QAService 收到thinking原始数据:', JSON.stringify(data, null, 2));
                      // 传递完整的thinking数据，兼容后端的字段名（thought vs content）
                      const thinkingData = {
                        title: data.title || '思考中...',
                        content: data.content || data.thought || '',  // 兼容thought字段
                        timestamp: data.timestamp || Date.now(),
                        search_results: data.search_results || []  // 包含检索结果
                      };
                      console.log('🔧 QAService 转换后的thinking数据:', JSON.stringify(thinkingData, null, 2));
                      console.log('🚀 QAService 调用onThinking回调...');
                      onThinking(thinkingData);
                      console.log('✅ QAService onThinking回调已调用');
                    } else {
                      console.log('❌ QAService onThinking回调不存在!');
                    }
                    break;
                  case 'knowledge_sources':
                    // 🔥 新增：处理独立的知识源事件
                    console.log('🔍 QAService 匹配到knowledge_sources事件!');
                    console.log('📊 QAService 原始knowledge_sources数据:', JSON.stringify(data, null, 2));
                    
                    const knowledgeData = data.data || {};
                    if (knowledgeData.knowledge_sources && knowledgeData.knowledge_sources.length > 0) {
                      console.log('✅ [qaService] 独立knowledge_sources事件包含数据:', knowledgeData.knowledge_sources.length, '个源');
                      
                      // 调用专门的知识源回调
                      if (onKnowledgeSources) {
                        console.log('🚀 [qaService] 调用onKnowledgeSources回调...');
                        onKnowledgeSources({
                          knowledge_sources: knowledgeData.knowledge_sources,
                          knowledge_stats: knowledgeData.knowledge_stats || {},
                          graph_sources: knowledgeData.graph_sources || {}  // 添加知识图谱检索结果
                        });
                        console.log('✅ [qaService] onKnowledgeSources回调已调用');
                      } else {
                        console.log('❌ [qaService] onKnowledgeSources回调不存在!');
                      }
                    } else {
                      console.log('⚠️ [qaService] knowledge_sources事件中无有效数据');
                    }
                    break;
                  case 'knowledge_sources_update':
                    // 🔥 新增：处理图谱检索完成后的补充知识源更新事件
                    console.log('🔍 QAService 匹配到knowledge_sources_update事件!');
                    console.log('📊 QAService 原始knowledge_sources_update数据:', JSON.stringify(data, null, 2));
                    
                    const updateData = data.data || {};
                    
                    // 调用知识源更新回调，合并图谱数据
                    if (onKnowledgeSources) {
                      console.log('🚀 [qaService] 调用onKnowledgeSources回调更新图谱数据...');
                      onKnowledgeSources({
                        knowledge_sources: updateData.knowledge_sources || [],
                        knowledge_stats: updateData.knowledge_stats || {},
                        graph_sources: updateData.graph_sources || {}  // 包含图谱检索完成后的数据
                      });
                      console.log('✅ [qaService] onKnowledgeSources更新回调已调用，图谱数据已合并');
                    } else {
                      console.log('❌ [qaService] onKnowledgeSources更新回调不存在!');
                    }
                    break;
                  case 'chunk':
                    // 处理chunk事件数据结构
                    const chunkContent = data.data?.content || data.content || '';
                    const chunkSize = chunkContent.length;
                    
                    // 记录首个chunk接收时间
                    if (!firstChunkReceived) {
                      firstChunkReceived = true;
                      const firstChunkTime = performance.now();
                      const totalFirstChunkLatency = firstChunkTime - requestStartTime;
                      console.log(`[LATENCY] 首个内容chunk接收延迟: ${totalFirstChunkLatency.toFixed(3)}ms`);
                    }
                    
                    // 实时渲染 - 接收多少渲染多少，无缓冲
                    if (chunkContent) {
                      onChunk(chunkContent);
                    }
                    break;
                  case 'content':
                    // 🔥 修复重复显示问题：处理content事件（Team模式使用）
                    const contentData = data.data?.content || data.content || '';
                    
                    console.log(`[TEAM_CONTENT] 收到content事件: "${contentData.slice(0, 30)}..."`);
                    
                    // 记录首个content接收时间
                    if (!firstChunkReceived) {
                      firstChunkReceived = true;
                      const firstChunkTime = performance.now();
                      const totalFirstChunkLatency = firstChunkTime - requestStartTime;
                      console.log(`[LATENCY] 首个内容content接收延迟: ${totalFirstChunkLatency.toFixed(3)}ms`);
                    }
                    
                    // 实时渲染content内容
                    if (contentData) {
                      onChunk(contentData);
                    }
                    break;
                  case 'agent_call':
                    // 🔥 新增：处理Team模式的Agent调用事件
                    console.log('🤖 [qaService] 匹配到agent_call事件!');
                    console.log('📊 [qaService] 原始agent_call数据:', JSON.stringify(data, null, 2));
                    
                    const agentCallData = data.data || {};
                    if (onAgentCall) {
                      console.log('🚀 [qaService] 调用onAgentCall回调...');
                      onAgentCall({
                        agent_name: agentCallData.agent_name,
                        action: agentCallData.action,
                        status: agentCallData.status,
                        timestamp: agentCallData.timestamp,
                        input: agentCallData.input,
                        output: agentCallData.output,
                        duration_ms: agentCallData.duration_ms,
                        execution_id: agentCallData.execution_id
                      });
                      console.log('✅ [qaService] onAgentCall回调已调用');
                    } else {
                      console.log('❌ [qaService] onAgentCall回调不存在!');
                    }
                    break;

                  case 'agent_decision':
                    // 🔥 新增：处理Team模式的Agent决策事件 - 用于决策时间线显示
                    console.log('🧠 [qaService] 匹配到agent_decision事件!');
                    console.log('📊 [qaService] 原始agent_decision数据:', JSON.stringify(data, null, 2));
                    
                    const decisionData = data.data || {};
                    if (onAgentDecision) {
                      console.log('🚀 [qaService] 调用onAgentDecision回调...');
                      onAgentDecision({
                        agent_name: decisionData.agent_name,
                        decision_type: decisionData.decision_type,
                        title: decisionData.title,
                        content: decisionData.content,
                        confidence: decisionData.confidence,
                        reasoning: decisionData.reasoning,
                        timestamp: decisionData.timestamp,
                        execution_id: decisionData.execution_id,
                        metadata: decisionData.metadata
                      });
                      console.log('✅ [qaService] onAgentDecision回调已调用');
                    } else {
                      console.log('❌ [qaService] onAgentDecision回调不存在!');
                    }
                    break;
                  
                  case 'agent_start':
                    // 🔥 新增：处理Agent开始事件
                    console.log('🚀 [qaService] 匹配到agent_start事件!');
                    console.log('📊 [qaService] 原始agent_start数据:', JSON.stringify(data, null, 2));
                    
                    if (onAgentStart) {
                      console.log('✅ [qaService] 调用onAgentStart回调...');
                      onAgentStart({
                        agent_id: data.data?.agent_id,
                        agent_name: data.data?.agent_name,
                        role: data.data?.role,
                        action: data.data?.action,
                        step: data.data?.step,
                        icon: data.data?.icon,
                        total_steps: data.data?.total_steps,
                        timestamp: data.data?.timestamp
                      });
                    } else {
                      console.log('❌ [qaService] onAgentStart回调不存在!');
                    }
                    break;
                  
                  case 'agent_complete':
                    // 🔥 新增：处理Agent完成事件
                    console.log('🏁 [qaService] 匹配到agent_complete事件!');
                    console.log('📊 [qaService] 原始agent_complete数据:', JSON.stringify(data, null, 2));
                    
                    if (onAgentComplete) {
                      console.log('✅ [qaService] 调用onAgentComplete回调...');
                      onAgentComplete({
                        agent_id: data.data?.agent_id,
                        agent_name: data.data?.agent_name,
                        step: data.data?.step,
                        content_generated: data.data?.content_generated,
                        timestamp: data.data?.timestamp,
                        is_final: data.data?.is_final
                      });
                    } else {
                      console.log('❌ [qaService] onAgentComplete回调不存在!');
                    }
                    break;

                  case 'agent_status':
                    // 🔥 新增：处理Agent状态变化事件 - 用于显示当前执行的Agent
                    console.log('👤 [qaService] 匹配到agent_status事件!');
                    console.log('📊 [qaService] 原始agent_status数据:', JSON.stringify(data, null, 2));
                    
                    const statusData = data.data || {};
                    if (onAgentStatus) {
                      console.log('🚀 [qaService] 调用onAgentStatus回调...');
                      onAgentStatus({
                        agent_name: statusData.agent_name,
                        status: statusData.status,
                        action: statusData.action,
                        confidence: statusData.confidence,
                        content_preview: statusData.content_preview,
                        timestamp: statusData.timestamp,
                        team_name: statusData.team_name
                      });
                      console.log('✅ [qaService] onAgentStatus回调已调用');
                    } else {
                      console.log('❌ [qaService] onAgentStatus回调不存在!');
                    }
                    break;

                  case 'team_execution_start':
                    // 🔥 新增：处理团队执行开始事件
                    console.log('🏁 [qaService] 匹配到team_execution_start事件!');
                    console.log('📊 [qaService] 原始team_execution_start数据:', JSON.stringify(data, null, 2));
                    
                    const executionData = data.data || {};
                    console.log('✅ [qaService] team_execution_start事件已识别');
                    break;
                  case 'team_analysis':
                    // 🔥 新增：处理Team模式的分析事件
                    console.log('👥 [qaService] 匹配到team_analysis事件!');
                    console.log('📊 [qaService] 原始team_analysis数据:', JSON.stringify(data, null, 2));
                    
                    const teamAnalysisData = data.data || {};
                    if (onTeamAnalysis) {
                      console.log('🚀 [qaService] 调用onTeamAnalysis回调...');
                      onTeamAnalysis({
                        execution_id: teamAnalysisData.execution_id,
                        team_name: teamAnalysisData.team_name,
                        member_calls: teamAnalysisData.member_calls || [],
                        knowledge_sources: teamAnalysisData.knowledge_sources || [],
                        coordination_info: teamAnalysisData.coordination_info,
                        structured_output: teamAnalysisData.structured_output,
                        total_steps: teamAnalysisData.total_steps,
                        completed_steps: teamAnalysisData.completed_steps,
                        failed_steps: teamAnalysisData.failed_steps,
                        timestamp: teamAnalysisData.timestamp
                      });
                      console.log('✅ [qaService] onTeamAnalysis回调已调用');
                    } else {
                      console.log('❌ [qaService] onTeamAnalysis回调不存在!');
                    }
                    break;
                  case 'team_start':
                    // 🔥 新增：处理Team模式的开始事件
                    console.log('🚀 [qaService] 匹配到team_start事件!');
                    console.log('📊 [qaService] 原始team_start数据:', JSON.stringify(data, null, 2));
                    
                    const teamStartData = data.data || {};
                    if (onTeamStart) {
                      console.log('🚀 [qaService] 调用onTeamStart回调...');
                      onTeamStart({
                        execution_id: teamStartData.execution_id,
                        team_name: teamStartData.team_name,
                        query: teamStartData.query,
                        timestamp: teamStartData.timestamp
                      });
                      console.log('✅ [qaService] onTeamStart回调已调用');
                    } else {
                      console.log('❌ [qaService] onTeamStart回调不存在!');
                    }
                    break;
                  case 'complete':
                    // Team V2 completion event - 新Team系统的完成事件
                    const completionTime = performance.now();
                    const totalLatency = completionTime - requestStartTime;
                    console.log(`[LATENCY] Team V2执行完成，总耗时: ${totalLatency.toFixed(3)}ms`);
                    
                    const completeData = data.data || {};
                    console.log('✅ [qaService] 收到complete事件:', JSON.stringify(completeData, null, 2));
                    
                    // 调用onDone回调终止loading状态
                    onDone({
                      execution_id: completeData.execution_id,
                      processing_time: completeData.processing_time,
                      timestamp: completeData.timestamp
                    });
                    return;
                    
                  case 'ToolCallCompleted':
                    // 🔥 新增：处理工具调用完成事件（包含图谱检索结果）
                    console.log('🔧 [qaService] 匹配到ToolCallCompleted事件!');
                    console.log('📊 [qaService] 原始ToolCallCompleted数据:', JSON.stringify(data, null, 2));
                    
                    // 检查是否包含图谱检索结果
                    const toolCallContent = data.content || '';
                    if (toolCallContent.includes('search_knowledge_graph') && toolCallContent.includes('completed')) {
                      console.log('🔍 [qaService] 检测到图谱检索工具调用完成');
                      // 这里可以触发获取最新的图谱数据，但通常图谱数据已在knowledge_sources事件中传递
                    }
                    break;

                  case 'done':
                    // SSE stream completed - 纯净的结束事件，不再包含溯源数据
                    const doneCompletionTime = performance.now();
                    const doneTotalLatency = doneCompletionTime - requestStartTime;
                    console.log(`[LATENCY] 流式响应完成，总耗时: ${doneTotalLatency.toFixed(3)}ms`);
                    
                    // done事件只包含基本的完成信息
                    const doneData = data.data || {};
                    console.log('✅ [qaService] 收到纯净的done事件:', JSON.stringify(doneData, null, 2));
                    
                    // 直接调用onDone回调，不再处理knowledge_sources
                    onDone({
                      agent_name: doneData.agent_name,
                      total_processing_time: doneData.total_processing_time,
                      timestamp: doneData.timestamp,
                      execution_id: doneData.execution_id,
                      processing_time: doneData.processing_time
                    });
                    return;
                  case 'error':
                    // SSE error received
                    onError(data.data.error || '未知错误');
                    return;
                }
              } catch (e) {
                // Failed to parse SSE data - silently continue
                console.warn('SSE数据解析失败，跳过:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      // Stream request failed
      const errorTime = performance.now();
      console.error(`[LATENCY] 请求失败时间: ${errorTime.toFixed(3)}ms`);
      
      // 检查是否为中断错误
      if (error instanceof Error && error.name === 'AbortError') {
        onError('对话已中断');
      } else {
        onError(error instanceof Error ? error.message : '网络错误');
      }
    }
  }

  // 发送问题到AI智能体（非流式）
  async askQuestion(request: QARequest): Promise<QAResponse> {
    try {
      // 转换前端请求格式到后端接口格式
      const backendRequest = {
        question: request.message,
        session_id: request.conversation_id,
        user_id: request.user_id, // 添加用户ID
        agent_type: request.agentType || 'team',
        agent_name: this.mapAgentName(request.agentName),
        context: request.agent_config,
        search_knowledge: request.search_knowledge, // 添加知识库检索参数
        enable_translation: request.enable_translation, // 添加翻译功能参数
        // 多轮对话上下文参数
        enable_context_memory: request.enable_context_memory ?? true, // 默认启用上下文记忆
        max_context_turns: request.max_context_turns ?? 8 // 默认最大8轮上下文
      };
      
      
      const backendResponse = await apiService.post<{
        answer: string;
        session_id: string;
        agent_name: string;
        model_used: string;
        confidence_score?: number;
        processing_time: number;
        sources?: any[];
        metadata?: any;
        timestamp: number;
      }>('/qa/ask', backendRequest);
      
      // 转换后端响应格式到前端格式
      return {
        message: backendResponse.answer,
        sources: backendResponse.sources?.map(source => ({
          id: source.id || source.document_id || String(Math.random()),
          title: source.title || source.content?.substring(0, 50) + '...' || '未知来源',
          authors: source.authors || source.metadata?.authors,
          url: source.url,
          confidence: source.relevance || source.confidence || source.score
        })) || [],
        conversation_id: backendResponse.session_id,
        message_id: String(Date.now())
      };
    } catch (error) {
      // Question sending failed
      throw error;
    }
  }

  // 智能体名称映射
  private getChineseName(agentName: string): string {
    const nameMapping: Record<string, string> = {
      // 英文ID映射
      'qa_agent': '问答专家',
      'doc_analyzer': '文档分析专家', 
      'multimodal_agent': '多模态专家',
      'qa_team': '通用问答团队',
      'geopolymer_qa_team_v2': '通用多语言问答团队V2',
      // 前端中文ID映射
      'cailiao_zhuanjia': '问答专家',
      'wenxian_jiansuozhuanjia': '文档分析专家',
      'shuju_fenxizhuanjia': '多模态专家',
      'dijuwu_wendatuandui': '通用多语言问答团队'
    };
    return nameMapping[agentName] || agentName;
  }

  // 智能体描述映射
  private getChineseDescription(agentName: string, originalDesc: string): string {
    const descMapping: Record<string, string> = {
      // 英文ID映射
      'qa_agent': '专业的问答智能体，擅长回答各类问题',
      'doc_analyzer': '文档分析专家，专门处理文档内容分析',
      'multimodal_agent': '多模态智能体，支持文本、图像等多种输入',
      'qa_team': '多智能体协作团队，提供全面的通用知识解答',
      'geopolymer_qa_team_v2': '基于Agno框架的多智能体协作团队，支持多语言通用知识问答，包含问题分解、翻译、检索、知识图谱和总结回答专家',
      // 前端中文ID映射
      'cailiao_zhuanjia': '专业的问答智能体，擅长回答各类问题',
      'wenxian_jiansuozhuanjia': '文档分析专家，专门处理文档内容分析',
      'shuju_fenxizhuanjia': '多模态智能体，支持文本、图像等多种输入',
      'dijuwu_wendatuandui': '多智能体协作团队，提供全面的通用知识解答'
    };
    return descMapping[agentName] || originalDesc;
  }

  // 获取可用的智能体列表
  async getAvailableAgents(): Promise<AgentInfo[]> {
    try {
      const backendResponse = await apiService.get<{
        name: string;
        type: string;
        description: string;
      }[]>('/qa/agents');
      
      // 转换后端响应格式到前端格式
      return backendResponse.map(agent => ({
        id: agent.name,
        name: this.getChineseName(agent.name),
        description: this.getChineseDescription(agent.name, agent.description),
        type: agent.type as 'agent' | 'team',
        models: [
          {
            id: 'default',
            name: '默认模型',
            description: '系统默认配置的模型'
          }
        ],
        defaultModel: 'default'
      }));
    } catch (error) {
      // Failed to get agent list
      throw error;
    }
  }

  // 获取支持的模型列表
  async getSupportedModels(): Promise<Record<string, string[]>> {
    try {
      const response = await apiService.get<{ models: Record<string, string[]> }>('/qa/models');
      return response.models;
    } catch (error) {
      // Failed to get model list
      throw error;
    }
  }

  // 获取对话历史列表
  async getConversationHistory(userId?: number, page: number = 1, size: number = 20, mode?: 'expert' | 'team'): Promise<{
    conversations: HistoryConversation[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
  }> {
    try {
      const params: any = { page, size };
      if (userId) params.user_id = userId;
      if (mode) params.mode = mode;
      
      console.log('[QAService] 请求对话历史列表:', '/conversations', params);
      
      const backendResponse = await apiService.get<{
        conversations: {
          id: number;
          session_id: string;
          title?: string;
          message_count: number;
          last_message?: string;
          created_at: string;
          updated_at?: string;
          // 新增模式信息
          conversation_mode?: 'expert' | 'team';
          mode_display_name?: string;
        }[];
        total: number;
        page: number;
        size: number;
      }>('/conversations', { params });
      
      console.log('[QAService] 后端响应:', backendResponse);
      
      // 转换后端响应格式到前端格式
      const conversations = backendResponse.conversations.map(conv => ({
        id: conv.session_id,
        title: conv.title && conv.title.trim() && conv.title !== 'None' ? conv.title : '',
        lastMessage: conv.last_message || '',
        time: new Date(conv.created_at).toLocaleString(),
        messageCount: conv.message_count,
        // 新增模式信息映射
        conversation_mode: conv.conversation_mode || 'expert',
        mode_display_name: conv.mode_display_name || '专家模式'
      }));
      
      console.log('[QAService] 转换后的对话列表:', conversations);
      
      return {
        conversations,
        total: backendResponse.total,
        page: backendResponse.page,
        size: backendResponse.size,
        hasMore: conversations.length === size && (backendResponse.page * size) < backendResponse.total
      };
    } catch (error) {
      console.error('[QAService] 获取对话历史失败:', error);
      // Failed to get conversation history
      throw error;
    }
  }

  // 获取对话统计信息（按模式）
  async getConversationStats(userId?: number): Promise<{
    expertCount: number;
    teamCount: number;
    totalCount: number;
  }> {
    try {
      console.log('[QAService] 请求对话统计信息, userId:', userId);
      
      // 构建请求参数，包含用户ID
      const expertParams: any = { page: 1, size: 1, mode: 'expert' };
      const teamParams: any = { page: 1, size: 1, mode: 'team' };
      
      if (userId) {
        expertParams.user_id = userId;
        teamParams.user_id = userId;
      }
      
      // 并发请求两种模式的统计信息
      console.log('[QAService] 发送expert模式请求:', expertParams);
      console.log('[QAService] 发送team模式请求:', teamParams);
      
      const [expertResponse, teamResponse] = await Promise.all([
        apiService.get<{ total: number }>('/conversations', { params: expertParams }),
        apiService.get<{ total: number }>('/conversations', { params: teamParams })
      ]);
      
      console.log('[QAService] expert模式响应:', expertResponse);
      console.log('[QAService] team模式响应:', teamResponse);
      
      const expertCount = expertResponse.total;
      const teamCount = teamResponse.total;
      const totalCount = expertCount + teamCount;
      
      console.log('[QAService] 对话统计信息:', { expertCount, teamCount, totalCount });
      
      return { expertCount, teamCount, totalCount };
    } catch (error) {
      console.error('[QAService] 获取对话统计信息失败:', error);
      // 返回默认值，避免页面错误
      return { expertCount: 0, teamCount: 0, totalCount: 0 };
    }
  }

  // 获取特定对话的消息列表
  async getConversationMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    try {
      const response = await apiService.get<{
        session_id: string;
        messages: Array<{
          id: string;
          type: 'user' | 'ai';
          content: string;
          created_at: string;
          confidence?: number;
          sources?: any[];
          knowledgeSources?: any[];  // 添加knowledgeSources字段
          graphSources?: any;  // 添加graphSources字段用于知识图谱检索结果
          images?: any[];
          tables?: any[];
          highlights?: any[];
          thinking?: any[];  // 添加thinking字段
          processing_time?: number;
          model_used?: string;
          agent_id?: string;
          agent_name?: string;
          // 添加team相关字段
          teamInfo?: {
            isTeamMessage: boolean;
            teamName: string;
            teamMode: string;
            executionId?: string;
            memberCalls?: any[];
            structuredOutput?: any;
            coordinationInfo?: any;
            monitoringData?: any;
            processingTime?: number;
            teamDecisions?: any[];
            knowledge_sources?: any[];
          };
        }>;
        total_messages: number;
      }>(`/qa/conversations/${conversationId}/history`, { params: { limit } });
      
      console.log('🔍 [QAService] 获取历史消息:', response.messages.length, '条');
      response.messages.forEach((msg, index) => {
        if (msg.type === 'ai' && msg.knowledgeSources) {
          console.log(`📄 [QAService] 消息${index} knowledgeSources:`, msg.knowledgeSources.length, '个');
        }
        if (msg.type === 'ai' && msg.graphSources) {
          console.log(`📊 [QAService] 消息${index} graphSources:`, JSON.stringify(msg.graphSources).slice(0, 100));
        }
        if (msg.teamInfo) {
          console.log(`👥 [QAService] 消息${index} 是Team消息:`, {
            isTeamMessage: msg.teamInfo.isTeamMessage,
            teamName: msg.teamInfo.teamName,
            memberCalls: msg.teamInfo.memberCalls?.length || 0,
            teamDecisions: msg.teamInfo.teamDecisions?.length || 0
          });
        }
      });
      
      // 转换后端响应格式到前端格式
      const mappedMessages = response.messages.map(msg => ({
        id: msg.id,
        type: msg.type === 'ai' ? 'assistant' : msg.type,
        content: msg.content,
        timestamp: new Date(msg.created_at).getTime(),
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: msg.confidence,
        sources: msg.sources?.map(source => ({
          id: source.id || String(Math.random()),
          title: source.title || '未知来源',
          authors: source.authors,
          url: source.url,
          confidence: source.confidence || source.relevance || source.score
        })) || [],
        knowledgeSources: msg.knowledgeSources?.map(ks => ({
          id: ks.id || String(Math.random()),
          content: ks.content || '',
          title: ks.title || ks.question || '',
          score: ks.score || 0,
          source_type: ks.source_type || 'document',
          source: ks.source || '',
          metadata: ks.metadata || {},
          question: ks.question || '',
          answer: ks.answer || '',
          highlights: ks.highlights || []
        })) || [],
        graphSources: msg.graphSources || {},  // 🔥 添加graphSources字段用于知识图谱检索结果
        images: msg.images || [],
        tables: msg.tables || [],
        highlights: msg.highlights || [],
        thinking: msg.thinking || [],  // 添加thinking数据
        // 添加agent信息，优先使用后端返回的agent信息
        ...(msg.type === 'ai' && {
          agentId: msg.agent_id || 'cailiao_zhuanjia', // 使用真实的agentId或默认值
          agentName: msg.agent_name || '问答专家' // 使用真实的agentName或默认值
        }),
        // 添加team信息处理
        ...(msg.teamInfo && {
          teamInfo: {
            isTeamMessage: msg.teamInfo.isTeamMessage,
            teamName: msg.teamInfo.teamName,
            teamMode: msg.teamInfo.teamMode,
            executionId: msg.teamInfo.executionId,
            memberCalls: msg.teamInfo.memberCalls || [],
            structuredOutput: msg.teamInfo.structuredOutput,
            coordinationInfo: msg.teamInfo.coordinationInfo,
            monitoringData: msg.teamInfo.monitoringData,
            processingTime: msg.teamInfo.processingTime,
            teamDecisions: msg.teamInfo.teamDecisions || [],
            knowledge_sources: msg.teamInfo.knowledge_sources || []
          }
        })
      }));
      
      // 验证映射结果
      const aiMessagesWithSources = mappedMessages.filter(msg => 
        msg.type === 'assistant' && msg.knowledgeSources && msg.knowledgeSources.length > 0
      );
      const teamMessages = mappedMessages.filter(msg => 
        msg.teamInfo?.isTeamMessage
      );
      console.log(`✅ [QAService] 最终映射完成，包含溯源数据的AI消息: ${aiMessagesWithSources.length} 条`);
      console.log(`👥 [QAService] 最终映射完成，Team消息: ${teamMessages.length} 条`);
      
      return mappedMessages;
    } catch (error) {
      // Failed to get conversation messages
      throw error;
    }
  }

  // 创建新对话
  async createConversation(title?: string): Promise<HistoryConversation> {
    try {
      // 对话创建在第一次发送消息时自动处理
      // 这里返回一个临时的对话对象
      const sessionId = `session_${Date.now()}`;
      return {
        id: sessionId,
        title: title || '',
        lastMessage: '',
        time: new Date().toLocaleString(),
        messageCount: 0
      };
    } catch (error) {
      // Failed to create conversation
      throw error;
    }
  }

  // 删除对话
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await apiService.delete(`/qa/conversations/${conversationId}`);
    } catch (error) {
      // Failed to delete conversation
      throw error;
    }
  }

  // 清空所有对话历史
  async clearAllConversations(): Promise<{ 
    message: string; 
    deleted_conversations: number; 
    deleted_messages: number 
  }> {
    try {
      console.log('[QAService] 开始清空所有对话历史');
      const response = await apiService.delete<{
        message: string;
        deleted_conversations: number;
        deleted_messages: number;
      }>('/qa/conversations/');
      
      console.log('[QAService] 清空对话历史成功:', response);
      return response;
    } catch (error) {
      console.error('[QAService] 清空对话历史失败:', error);
      throw error;
    }
  }

  // 重命名对话
  async renameConversation(conversationId: string, newTitle: string): Promise<void> {
    try {
      await apiService.put(`/qa/conversations/${conversationId}/title`, {
        title: newTitle
      });
    } catch (error) {
      // Failed to rename conversation
      throw error;
    }
  }

  // 自动生成对话标题
  async autoGenerateTitle(conversationId: string): Promise<{ title: string; source_message: string }> {
    try {
      const response = await apiService.post<{
        message: string;
        session_id: string;
        title: string;
        source_message: string;
      }>(`/qa/conversations/${conversationId}/auto-title`);
      
      return {
        title: response.title,
        source_message: response.source_message
      };
    } catch (error) {
      // Failed to auto generate title
      throw error;
    }
  }

  // 获取单个对话的详细信息（包括标题）
  async getConversationDetails(conversationId: string): Promise<{ title: string; messageCount: number; lastMessage: string; time: string }> {
    try {
      const response = await apiService.get<{
        conversations: Array<{
          id: number;
          session_id: string;
          title?: string;
          message_count: number;
          last_message?: string;
          created_at: string;
          updated_at?: string;
        }>;
      }>('/qa/conversations', { params: { session_id: conversationId, size: 1 } });
      
      if (response.conversations && response.conversations.length > 0) {
        const conv = response.conversations[0];
        return {
          title: conv.title && conv.title.trim() && conv.title !== 'None' ? conv.title : '',
          messageCount: conv.message_count,
          lastMessage: conv.last_message || '',
          time: new Date(conv.created_at).toLocaleString()
        };
      } else {
        throw new Error('对话不存在');
      }
    } catch (error) {
      throw error;
    }
  }

  // 批量更新所有对话标题
  async batchUpdateTitles(): Promise<{ message: string; updated_count: number; total_found: number; success_rate: string }> {
    try {
      const response = await apiService.post<{
        message: string;
        total_found: number;
        updated_count: number;
        error_count: number;
        success_rate: string;
      }>('/qa/conversations/batch-update-titles');
      
      return {
        message: response.message,
        updated_count: response.updated_count,
        total_found: response.total_found,
        success_rate: response.success_rate
      };
    } catch (error) {
      throw error;
    }
  }

  // 评估回答质量
  async evaluateAnswer(sessionId: string, rating: number, feedback?: string): Promise<void> {
    try {
      await apiService.post('/qa/evaluate', {
        session_id: sessionId,
        rating,
        feedback
      });
    } catch (error) {
      // Failed to evaluate answer
      throw error;
    }
  }

  // 重新生成回答
  async regenerateAnswer(sessionId: string, messageId: string): Promise<QAResponse> {
    try {
      const backendResponse = await apiService.post<{
        answer: string;
        session_id: string;
        agent_name: string;
        model_used: string;
        confidence_score?: number;
        processing_time: number;
        sources?: any[];
        metadata?: any;
        timestamp: number;
      }>('/qa/regenerate', {
        session_id: sessionId,
        message_id: messageId
      });
      
      // 转换后端响应格式到前端格式
      return {
        message: backendResponse.answer,
        sources: backendResponse.sources?.map(source => ({
          id: source.id || source.document_id || String(Math.random()),
          title: source.title || source.content?.substring(0, 50) + '...' || '未知来源',
          authors: source.authors || source.metadata?.authors,
          url: source.url,
          confidence: source.relevance || source.confidence || source.score
        })) || [],
        conversation_id: backendResponse.session_id,
        message_id: String(Date.now())
      };
    } catch (error) {
      // Failed to regenerate answer
      throw error;
    }
  }

  // 获取回答的溯源信息
  async getAnswerSources(sessionId: string, messageId: string): Promise<any> {
    try {
      const response = await apiService.get(`/qa/sources/${sessionId}/${messageId}`);
      return response;
    } catch (error) {
      // Failed to get source information
      throw error;
    }
  }

  // 搜索对话历史
  async searchConversations(query: string, userId?: string): Promise<HistoryConversation[]> {
    try {
      const params: any = { q: query };
      if (userId) params.user_id = userId;
      
      const response = await apiService.get<HistoryConversation[]>('/conversations/search', { params });
      return response;
    } catch (error) {
      // Failed to search conversations
      throw error;
    }
  }

  // 导出对话
  async exportConversation(conversationId: string, format: 'pdf' | 'markdown' | 'json' = 'markdown'): Promise<void> {
    try {
      await apiService.download(
        `/conversations/${conversationId}/export?format=${format}`,
        `conversation_${conversationId}.${format}`
      );
    } catch (error) {
      // Failed to export conversation
      throw error;
    }
  }

  // 分享对话
  async shareConversation(conversationId: string): Promise<{ shareUrl: string; shareId: string }> {
    try {
      const response = await apiService.post<{ shareUrl: string; shareId: string }>(
        `/conversations/${conversationId}/share`
      );
      return response;
    } catch (error) {
      // Failed to share conversation
      throw error;
    }
  }

  // 获取分享的对话
  async getSharedConversation(shareId: string): Promise<{
    conversation: HistoryConversation;
    messages: Message[];
  }> {
    try {
      const response = await apiService.get<{
        conversation: HistoryConversation;
        messages: Message[];
      }>(`/conversations/shared/${shareId}`);
      return response;
    } catch (error) {
      // Failed to get shared conversation
      throw error;
    }
  }

  // 保存Team模式对话（前端调用）
  async saveTeamConversation(data: {
    session_id: string;
    question: string;
    answer: string;
    team_name: string;
    team_info?: any;
    model_used?: string;
    processing_time?: number;
    knowledge_sources?: any[];
    metadata?: any;
    user_id?: number;
  }): Promise<void> {
    try {
      console.log('💾 QAService 保存Team对话:', data.session_id);
      
      await apiService.post('/conversations/team', {
        session_id: data.session_id,
        question: data.question,
        answer: data.answer,
        team_name: data.team_name,
        team_mode: 'coordinate',
        team_info: data.team_info,
        user_id: data.user_id, // 确保用户ID被传递
        model_used: data.model_used || 'team',
        processing_time: data.processing_time || 0,
        confidence_score: null,
        sources: null,
        knowledge_sources: data.knowledge_sources || [],
        thinking: null,
        metadata: data.metadata
      });
      
      console.log('✅ QAService Team对话保存成功');
    } catch (error) {
      console.error('❌ QAService Team对话保存失败:', error);
      throw error;
    }
  }
}

// 导出QA服务实例
export const qaService = new QAService(); 