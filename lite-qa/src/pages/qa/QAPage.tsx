/**
 * QA问答主页面 - 集成所有子组件
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Button, Drawer, Modal, notification } from 'antd';
import { useLocation } from 'react-router-dom';
import { 
  HistoryOutlined, 
  InfoCircleOutlined, 
  MenuOutlined,
  CloseOutlined,
  FullscreenOutlined,
  RobotOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { MessageList } from '../../components/qa/MessageList';
import { MessageItem } from '../../components/qa/MessageItem';
import { HistoryPanel } from '../../components/qa/HistoryPanel';
import { SourcePanel } from '../../components/qa/SourcePanel';
import { SourceViewer } from '../../components/qa/SourceViewer';
import { InputBox } from '../../components/qa/InputBox';
import { SystemSettings } from '../../components/common/SystemSettings';
import TeamExecutionDrawer from '../../components/qa/TeamExecutionDrawer';
import CurrentAgentStatusBar from '../../components/qa/CurrentAgentStatusBar';
import { useQAStore } from '../../stores/qaStore';
import { useAppStore } from '../../stores/appStore';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { useTeamExecutionStore } from '../../stores/teamExecutionStore';
import { useAuthStore } from '../../stores/authStore';
import { qaService } from '../../services/qaService';
import { getApiBaseUrl } from '../../config/appConfig';
import type { Message, HistoryConversation } from '../../types';

const QAPage: React.FC = () => {
  const location = useLocation();
  
  const {
    // 状态
    messages,
    conversations,
    currentSessionId,
    isLoading,
    isHistoryVisible,
    isSourceVisible,
    isMobileHistoryDrawerVisible,
    isMobileSourceDrawerVisible,
    inputValue,
    availableAgents,
    selectedAgent,
    imagePreviewVisible,
    currentImage,
    currentImageTitle,
    currentImageDesc,
    conversationsLoading,
    messagesLoading,
    conversationsPagination,

    // Actions
    setMessages,
    addMessage,
    setLoading,
    setHistoryVisible,
    setSourceVisible,
    setMobileHistoryDrawerVisible,
    setMobileSourceDrawerVisible,
    setInputValue,
    setSelectedAgent,
    setImagePreview,
    sendMessage,
    createNewConversation,
    loadConversation,
    initializeAgents,
    loadConversationHistory,
    forceReloadConversationHistory,
    loadMoreConversations,
    updateCurrentConversationFromMessage,
    updateConversation,
    setConversations,
    addConversation,
    setCurrentSessionId,
    createBlankConversation
  } = useQAStore();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [currentMessageForSource, setCurrentMessageForSource] = useState<Message | undefined>();
  const [systemSettingsVisible, setSystemSettingsVisible] = useState(false);
  const [searchKnowledge, setSearchKnowledge] = useState(true);  // 🔥 默认启用知识库检索（保持向后兼容）
  const [searchGraph, setSearchGraph] = useState(false);  // 🔥 知识图谱检索开关，默认关闭
  const [retrievalMode, setRetrievalMode] = useState<'qa_only' | 'papers_only' | 'all'>('all');  // 🔥 检索模式，默认全部检索
  const [enableTranslation, setEnableTranslation] = useState(false);  // 🔥 翻译功能开关，默认关闭
  const [knowledgeSourcesDrawerVisible, setKnowledgeSourcesDrawerVisible] = useState(false);
  const [selectedMessageForSources, setSelectedMessageForSources] = useState<Message | null>(null);
  const [chatSettings, setChatSettings] = useState({
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.8,
    maxTurns: 8,
    enableStream: true,
    enableMemory: true,
    systemPrompt: ''
  });
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // 新增模式切换状态 - 根据路由或localStorage设置
  const [currentMode, setCurrentMode] = useState<'default' | 'team'>(() => {
    // 如果当前路径是/team，则优先使用team模式
    if (location.pathname === '/team') {
      return 'team';
    }
    // 否则从localStorage恢复用户的最后选择
    const savedMode = localStorage.getItem('qa-current-mode') as 'default' | 'team' | null;
    return savedMode || 'default';
  });
  
  // 团队执行状态管理
  const { 
    currentExecution, 
    drawerVisible, 
    closeDrawer, 
    terminateExecution,
    updateTask 
  } = useTeamExecutionStore();
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('geopolymer_qa_team_v2');
  const [teamDefaultConfig, setTeamDefaultConfig] = useState<any>(null);
  
  // Agent状态管理
  const [currentAgentStatus, setCurrentAgentStatus] = useState<any>(null);
  
  // 处理HistoryPanel的模式切换（从expert/team映射到default/team）
  const handleHistoryModeChange = (mode: 'expert' | 'team') => {
    console.log('🏠 QAPage handleHistoryModeChange called:', { mode, currentMode });
    const mappedMode = mode === 'expert' ? 'default' : 'team';
    console.log('🏠 Mapped mode:', mappedMode);
    handleModeChange(mappedMode);
  };

  // 处理Team模式切换
  const handleModeChange = (mode: 'default' | 'team') => {
    console.log('🏠 QAPage handleModeChange called:', { mode, currentMode });
    
    // 如果模式发生变化，清空当前消息和会话ID
    if (mode !== currentMode) {
      console.log('🔄 模式切换，清空当前消息和会话ID');
      setMessages([]);
      setCurrentSessionId('');
    }
    
    // 保存用户的模式选择
    localStorage.setItem('qa-current-mode', mode);
    
    // 设置新模式（useEffect会自动处理对话历史加载）
    setCurrentMode(mode);
  };
  
  // 创建Team模式对话卡片
  const createTeamConversation = () => {
    const teamConversation = createBlankTeamConversation();
    
    // 将新对话添加到列表顶部
    const updatedConversations = [teamConversation, ...conversations];
    setConversations(updatedConversations);
    
    // 选中新对话并清空消息列表
    setCurrentSessionId(teamConversation.id);
    setMessages([]);
    
    console.log(`创建Team模式对话: ${teamConversation.id}`);
  };
  
  // 创建空白Team对话的辅助方法
  const createBlankTeamConversation = (): HistoryConversation => {
    // 使用store的createBlankConversation方法作为基础
    const baseConversation = createBlankConversation();
    
    // 添加Team模式特定的属性
    return {
      ...baseConversation,
      // 保持原有的 session_ 格式，通过 conversation_mode 区分模式
      title: '', // 空标题，让后端根据第一条消息自动生成
      conversation_mode: 'team',
      mode_display_name: 'Team模式'
    };
  };
  
  // 用于跟踪是否已经进行过会话同步
  const hasSyncedRef = useRef(false);

  // 获取模型配置
  const { modelConfig, setModelConfig } = useAppStore();
  const { refreshModelsFromAPI } = useKnowledgeStore();
  
  // 获取当前用户信息
  const { user: currentUser } = useAuthStore();

  // 监听路由变化，自动切换模式
  useEffect(() => {
    if (location.pathname === '/team') {
      if (currentMode !== 'team') {
        console.log('🔄 路由切换到/team，自动设置为team模式');
        handleModeChange('team');
      }
    } else if (location.pathname === '/qa') {
      // 在qa页面时，不强制改变模式，保持用户选择
    }
  }, [location.pathname]);

  // currentSessionId 已经是完整的 session_id，不需要额外处理
  const currentConversationId = currentSessionId;

  // 获取可用团队列表和默认配置
  useEffect(() => {
    const fetchTeamConfigAndDefaults = async () => {
      try {
        // 获取团队列表
        const teamsResponse = await fetch('/api/v1/team/teams');
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          if (teamsData.success && teamsData.data) {
            setAvailableTeams(teamsData.data);
          }
        }

        // 获取默认配置
        const defaultsResponse = await fetch('/api/v1/qa/defaults');
        if (defaultsResponse.ok) {
          const defaultsData = await defaultsResponse.json();
          if (defaultsData.success && defaultsData.data) {
            // 设置Team模式的默认选择
            if (defaultsData.data.team?.default_name) {
              setSelectedTeam(defaultsData.data.team.default_name);
            }
            // 更新专家模式的默认模型配置
            if (defaultsData.data.expert?.default_model) {
              setModelConfig({
                llm: {
                  ...modelConfig?.llm,
                  chatModel: defaultsData.data.expert.default_model
                }
              });
            }
            
            // 获取动态的Team配置（包含数据库中的Agent配置）
            const teamName = defaultsData.data.team?.default_name || 'geopolymer_qa_team_v2';
            try {
              const teamConfigResponse = await fetch(`${getApiBaseUrl()}/advanced-qa/team/${teamName}/config`);
              if (teamConfigResponse.ok) {
                const teamConfigData = await teamConfigResponse.json();
                // 合并默认配置和动态Team配置
                const mergedConfig = {
                  ...defaultsData.data,
                  team: {
                    ...defaultsData.data.team,
                    agents: teamConfigData.agents || [], // 使用动态的Agent配置
                    config: teamConfigData // 保存完整的Team配置
                  }
                };
                setTeamDefaultConfig(mergedConfig);
              } else {
                // 如果动态配置获取失败，使用静态默认配置
                setTeamDefaultConfig(defaultsData.data);
              }
            } catch (teamError) {
              console.error('获取动态Team配置失败:', teamError);
              setTeamDefaultConfig(defaultsData.data);
            }
          }
        }
      } catch (error) {
        console.error('获取团队配置失败:', error);
      }
    };
    
    fetchTeamConfigAndDefaults();
  }, []);


  // 刷新Team配置（在Agent配置保存后调用）
  const handleTeamConfigSaved = async () => {
    try {
      // 重新获取Team配置以反映最新的Agent配置
      await fetchTeamConfigAndDefaults();
    } catch (error) {
      console.error('刷新Team配置失败:', error);
    }
  };

  // 初始化数据 - 只在组件挂载时执行一次
  useEffect(() => {
    const initialize = async () => {
      try {
        // 根据当前模式加载对应的对话历史
        const historyMode = currentMode === 'default' ? 'expert' : 'team';
        console.log(`🚀 [QAPage] 初始化加载对话历史: mode=${historyMode} (currentMode=${currentMode})`);
        
        await Promise.all([
          initializeAgents(),
          loadConversationHistory(historyMode),
          refreshModelsFromAPI() // 刷新模型配置
        ]);
        
        // 标记初始化完成
        setIsInitialized(true);
        console.log(`✅ [QAPage] 页面初始化完成，currentMode: ${currentMode}`);
      } catch (error) {
        console.error('初始化失败:', error);
        // 5秒后自动重试加载历史对话
        setTimeout(() => {
          const retryMode = currentMode === 'default' ? 'expert' : 'team';
          loadConversationHistory(retryMode).catch(console.error);
        }, 5000);
      }
        };

    initialize();
  }, []);

  // 记录是否已经完成初始化
  const [isInitialized, setIsInitialized] = useState(false);

  // 监听模式变化，确保正确加载对话历史（仅在初始化完成后）
  useEffect(() => {
    // 只有在页面初始化完成后，才处理模式切换的对话历史加载
    if (isInitialized && currentMode) {
      const historyMode = currentMode === 'default' ? 'expert' : 'team';
      console.log(`🔄 [QAPage] 模式切换触发对话历史重新加载: mode=${historyMode} (currentMode=${currentMode})`);
      
      // 使用防抖机制避免频繁重新加载
      const timeoutId = setTimeout(() => {
        console.log(`🚀 [QAPage] 执行模式切换对话历史加载: ${historyMode}`);
        forceReloadConversationHistory(historyMode).catch(error => {
          console.error(`❌ [QAPage] 模式切换时加载对话历史失败:`, error);
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [currentMode, isInitialized]);

  // 监听清理事件
  useEffect(() => {
    const handleClearStores = () => {
      console.log('🧹 QAPage: 收到清理事件，重置QA状态');
      // 调用qa store的重置方法
      const qaStore = useQAStore.getState();
      if (qaStore.resetAllState) {
        qaStore.resetAllState();
      }
    };

    window.addEventListener('clear-all-stores', handleClearStores);
    return () => window.removeEventListener('clear-all-stores', handleClearStores);
  }, []); // 空依赖数组，只执行一次

  // 使用memo稳定agents长度引用，避免无限循环
  const agentsCount = useMemo(() => availableAgents.length, [availableAgents.length]);
  
  // 处理智能体默认选择 - 确保总是有默认选择
  useEffect(() => {
    if (agentsCount > 0 && !selectedAgent) {
      // 优先选择问答专家，否则选择第一个
      const defaultAgent = availableAgents.find(agent => agent.id === 'cailiao_zhuanjia') || availableAgents[0];
      setSelectedAgent(defaultAgent.id);
    }
  }, [agentsCount, selectedAgent, availableAgents]); // 使用稳定的计数而不是整个数组

  // 🔥 修复：处理页面初始加载后的会话状态同步问题（仅在组件首次挂载时执行）
  useEffect(() => {
    // 只在对话数据加载完成时执行，且避免与手动对话切换冲突
    if (conversations.length > 0 && !conversationsLoading && currentSessionId && !hasSyncedRef.current) {
      const currentConversation = conversations.find(conv => conv.id === currentSessionId);
      
      if (currentConversation) {
        // 🔥 关键修复：只在初始加载时自动同步消息列表
        if (currentConversation.messageCount > 0 && messages.length === 0) {
          // 只有在有内容的对话且消息列表为空时才自动加载
          console.log(`🔄 自动同步对话消息: ${currentSessionId}`);
          loadConversation(currentSessionId);
        }
        hasSyncedRef.current = true; // 标记已完成初始同步
      } else if (conversations[0]) {
        // 如果当前会话ID不存在，切换到第一个对话
        console.log(`🔄 当前会话不存在，切换到第一个对话: ${conversations[0].id}`);
        loadConversation(conversations[0].id);
        hasSyncedRef.current = true;
      }
    }
  }, [conversations.length, conversationsLoading, currentSessionId]); // 依赖关键状态变化
  
  // 重置同步标记当组件重新挂载时
  useEffect(() => {
    hasSyncedRef.current = false; // 组件挂载时重置同步标记
    return () => {
      hasSyncedRef.current = false;
    };
  }, []);

  // 监听用户变化，重新加载对话历史
  useEffect(() => {
    if (currentUser?.id && isInitialized) {
      console.log('👤 [QAPage] 用户变化，重新加载对话历史, userId:', currentUser.id);
      const historyMode = currentMode === 'default' ? 'expert' : 'team';
      
      // 清空当前对话数据，避免显示其他用户的对话
      setConversations([]);
      setMessages([]);
      setCurrentSessionId(null);
      
      // 重新加载当前用户的对话历史
      forceReloadConversationHistory(historyMode).catch(error => {
        console.error('❌ [QAPage] 用户变化时重新加载对话历史失败:', error);
      });
    }
  }, [currentUser?.id, isInitialized, currentMode]);
  
  

  // 响应式布局处理 - 避免频繁重新注册事件
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      
      // 避免频繁更新，只在变化超过阈值时更新
      if (Math.abs(newWidth - windowWidth) < 50) return;
      
      const oldWidth = windowWidth;
      setWindowWidth(newWidth);
      
      // 只在窗口大小类别发生变化时调整面板状态
      const getScreenType = (width: number) => {
        if (width < 768) return 'mobile';
        if (width < 1400) return 'tablet';
        return 'desktop';
      };
      
      const oldScreenType = getScreenType(oldWidth);
      const newScreenType = getScreenType(newWidth);
      
      // 只在屏幕类型变化时调整布局
      if (oldScreenType !== newScreenType) {
        // 移动端：隐藏所有侧边栏
        if (newScreenType === 'mobile') {
          setHistoryVisible(false);
          setSourceVisible(false);
        }
        // 平板端：只显示历史面板
        else if (newScreenType === 'tablet') {
          setHistoryVisible(true);
          setSourceVisible(false);
        }
        // 桌面端：显示历史面板，溯源面板保持用户设置的状态
        else if (newScreenType === 'desktop') {
          setHistoryVisible(true);
          // 不强制设置溯源面板状态，保持用户的选择
        }
      }
    };

    // 初始化时设置窗口宽度
    setWindowWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // 移除依赖避免重复注册事件

  // 处理发送消息
  const handleSendMessage = async (message: string, agentName?: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    addMessage(userMessage);
    setInputValue('');

    // 创建AI消息占位符，用于流式更新，带有loading状态
    const aiMessageId = (Date.now() + 1).toString();
    
    // 根据模式确定显示的智能体信息
    let displayAgentId, displayAgentName;
    if (currentMode === 'team') {
      // Team模式：显示团队信息
      displayAgentId = selectedTeam || 'geopolymer_qa_team_v2';
      displayAgentName = selectedTeam === 'geopolymer_multilingual_qa_team' 
        ? '地聚物多语言问答团队' 
        : '地聚物问答团队';
    } else {
      // 专家模式：显示智能体信息
      const currentAgent = availableAgents.find(agent => agent.id === (agentName || selectedAgent || 'cailiao_zhuanjia'));
      displayAgentId = currentAgent?.id || 'cailiao_zhuanjia';
      displayAgentName = currentAgent?.name || '问答专家';
    }
    
    const aiMessage: Message = {
      id: aiMessageId,
      type: 'assistant',
      content: '', // 开始时为空，流式填充
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: [],
      loading: true, // 标记为加载状态
      agentId: displayAgentId,
      agentName: displayAgentName,
      // Team模式需要初始化teamInfo
      ...(currentMode === 'team' && {
        teamInfo: {
          isTeamMessage: true,
          teamName: displayAgentName,
          teamMode: 'coordinate',
          executionId: '',
          memberCalls: [],
          query: message,
          startTime: Date.now()
        }
      })
    };

    addMessage(aiMessage);

    // 等待一个 tick 确保状态更新完成
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      // 设置loading状态
      setLoading(true);
      
      // 创建AbortController用于中断请求
      const controller = new AbortController();
      setAbortController(controller);
      
      // 使用流式API
      
      // 正确判断agent类型 - 基于当前模式而不是agent的type属性
      const currentAgentId = agentName || selectedAgent || 'cailiao_zhuanjia';
      const agentType = currentMode === 'team' ? 'team' : 'single';
      
      // 在Team模式下，使用选中的团队名称；在专家模式下，使用智能体ID
      const agentNameToSend = currentMode === 'team' ? selectedTeam : currentAgentId;
      
      
      await qaService.askQuestionStream(
        {
          message: message,
          conversation_id: currentSessionId,
          user_id: currentUser?.id, // 传递当前用户ID
          agentType: agentType,
          agentName: agentNameToSend,
          modelName: currentMode === 'team' 
            ? (teamDefaultConfig?.team?.default_model || 'qwen3-30b-a3b-instruct-2507')
            : (modelConfig?.llm?.chatModel || 'qwen-plus-latest'), // Team模式使用Team默认模型，专家模式使用用户选择的模型
          search_knowledge: searchKnowledge, // 所有模型现在都支持知识库检索（qwen3-235b通过预处理模式）
          search_graph: searchGraph, // 知识图谱检索开关
          knowledge_retrieval_mode: searchKnowledge ? retrievalMode : undefined, // 只有在知识库检索开启时才传递检索模式
          enable_translation: enableTranslation, // 添加翻译功能参数
          // 启用多轮对话上下文
          enable_context_memory: chatSettings.enableMemory, // 启用上下文记忆
          max_context_turns: chatSettings.maxTurns // 最大上下文轮数
        },
        // onChunk: 处理流式数据块
        (chunk: string) => {
          const chunkReceiveTime = performance.now();
          console.log(`[LATENCY] QAPage收到chunk: "${chunk.slice(0, 30)}" 时间: ${chunkReceiveTime.toFixed(3)}ms`);
          
          // 立即更新消息内容，不使用flushSync避免过度强制渲染
          setMessages(prevMessages => {
            
            if (!Array.isArray(prevMessages)) {
              console.log(`[ERROR] prevMessages不是数组:`, typeof prevMessages);
              return [];
            }
            
            // 找到目标消息的索引
            const targetIndex = prevMessages.findIndex(msg => msg.id === aiMessageId);
            
            if (targetIndex === -1) {
              return prevMessages;
            }
            
            // 只更新目标消息，其他消息保持引用不变
            const targetMessage = prevMessages[targetIndex];
            
            const updatedMessage = {
              ...targetMessage,
              content: targetMessage.content + chunk,
              loading: false // 收到第一个chunk时立即停止loading状态
            };
            
            // 创建新数组，只替换目标消息
            const newMessages = prevMessages.slice();
            newMessages[targetIndex] = updatedMessage;
            
            
            return newMessages;
          });
        },
        // onDone: 流式完成 - 可能包含图谱数据
        async (doneData?: any) => {
          console.log('🔍 [QAPage] 收到done事件:', doneData);
          
          // 🔥 检查done事件中的图谱数据
          if (doneData?.graph_sources) {
            console.log('🔥 [QAPage] Done事件包含图谱数据:', doneData.graph_sources);
            console.log('🔥 [QAPage] 当前aiMessageId:', aiMessageId);
            
            // 更新最新AI消息的图谱数据 - 使用最新的AI消息而不是依赖aiMessageId变量
            setMessages(prevMessages => {
              const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
              const aiMessages = safeMessages.filter(msg => msg.sender === 'ai');
              if (aiMessages.length === 0) {
                console.log('❌ [QAPage] Done事件处理时没有找到AI消息');
                return safeMessages;
              }
              
              const latestAiMessage = aiMessages[aiMessages.length - 1];
              console.log('🔥 [QAPage] 更新最新AI消息的图谱数据:', latestAiMessage.id);
              
              const updatedMessages = safeMessages.map(msg => 
                msg.id === latestAiMessage.id
                  ? { 
                      ...msg, 
                      graphSources: doneData.graph_sources
                    }
                  : msg
              );
              
              // 更新当前选中的溯源消息
              const updatedMessage = updatedMessages.find(m => m.id === latestAiMessage.id);
              if (updatedMessage) {
                setCurrentMessageForSource(updatedMessage);
                console.log('✅ [QAPage] 已更新图谱数据并设置为当前溯源消息');
              }
              
              return updatedMessages;
            });
          }
          
          // 清除loading状态和AbortController
          setLoading(false);
          setAbortController(null);
          
          // 🔥 处理Team V2的execution_id同步问题
          if (doneData?.execution_id && currentMode === 'team') {
            const oldSessionId = currentSessionId;
            const newSessionId = doneData.execution_id;
            
            // 只有当execution_id与当前session_id不同时才进行同步
            if (oldSessionId !== newSessionId) {
              console.log(`🔄 [QAPage] Team V2执行完成，同步session_id: ${oldSessionId} -> ${newSessionId}`);
              
              // 更新当前session_id
              setCurrentSessionId(newSessionId);
              
              // 更新对话列表中的对话ID（将临时的session_xxx替换为实际的exec_xxx）
              const currentConversations = useQAStore.getState().conversations;
              if (Array.isArray(currentConversations)) {
                const updatedConversations = currentConversations.map(conv => 
                  conv.id === oldSessionId 
                    ? { ...conv, id: newSessionId }
                    : conv
                );
                setConversations(updatedConversations);
                console.log(`🔄 [QAPage] 已更新对话列表中的session_id: ${oldSessionId} -> ${newSessionId}`);
              } else {
                console.warn('[QAPage] conversations不是数组:', currentConversations);
              }
              
              console.log(`✅ [QAPage] session_id同步完成: ${newSessionId}`);
            }
          }
          
          // 更新消息状态，只移除loading状态
          setMessages(prevMessages => {
            const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
            const updatedMessages = safeMessages.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    loading: false
                    // 不再在这里处理knowledge_sources，由独立事件处理
                  }
                : msg
            );
            const finalMessage = updatedMessages.find(m => m.id === aiMessageId);
            if (finalMessage) {
              setCurrentMessageForSource(finalMessage);
              
              // 异步处理对话保存逻辑
              setTimeout(async () => {
                // 确定正确的session_id（优先使用同步后的execution_id）
                const effectiveSessionId = (doneData?.execution_id && currentMode === 'team') 
                  ? doneData.execution_id 
                  : currentSessionId;
                
                // 更新对话标题和最后一条消息（如果是新对话）
                console.log(`🔄 [QAPage] 更新对话信息: mode=${currentMode}, sessionId=${effectiveSessionId}`);
                
                // 直接使用updateConversation而不是依赖updateCurrentConversationFromMessage
                // 因为后者依赖于currentSessionId，在Team模式下可能不同步
                const targetConv = conversations?.find(conv => conv.id === effectiveSessionId);
                if (targetConv && (!targetConv.title || targetConv.messageCount === 0)) {
                  const generateTitle = (question: string): string => {
                    return question.trim().slice(0, 50); // 限制标题长度
                  };
                  
                  updateConversation(effectiveSessionId, {
                    title: generateTitle(message),
                    lastMessage: finalMessage.content.length > 100 ? finalMessage.content.substring(0, 100) + '...' : finalMessage.content,
                    messageCount: (targetConv.messageCount || 0) + 2, // 用户消息 + AI回复
                    time: new Date().toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit', 
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  });
                  console.log(`✅ [QAPage] 已更新对话信息: ${effectiveSessionId}`);
                } else {
                  console.log(`🔍 [QAPage] 未找到目标对话或对话已有标题: ${effectiveSessionId}`);
                }
                
                // 对话保存后，获取数据库中的最新标题（Team模式由后端保存，这里统一处理标题更新）
                if (effectiveSessionId) {
                  try {
                    console.log(`🔄 [QAPage] 对话完成，开始更新对话详情: ${effectiveSessionId}`);
                    
                    // 🔥 只更新当前对话卡片的状态，不重新加载整个列表
                    setTimeout(async () => {
                      console.log(`🔄 [QAPage] 对话保存完成，更新当前对话状态: mode=${currentMode}, sessionId=${effectiveSessionId}`);
                      try {
                        // 获取对话详情并更新当前对话卡片
                        const details = await qaService.getConversationDetails(effectiveSessionId);
                        updateConversation(effectiveSessionId, { 
                          title: details.title,
                          messageCount: details.messageCount,
                          lastMessage: details.lastMessage,
                          time: details.time
                        });
                        console.log(`✅ [QAPage] 对话卡片状态已更新: ${details.title}`);
                      } catch (error) {
                        console.error(`❌ [QAPage] 更新对话状态失败:`, error);
                      }
                    }, 1000); // 1秒后更新状态
                  } catch (error) {
                    console.warn('获取对话详情失败:', error);
                    
                    // 如果获取详情失败，尝试手动生成标题
                    try {
                      const { title } = await qaService.autoGenerateTitle(effectiveSessionId);
                      updateConversation(effectiveSessionId, { title });
                    } catch (titleError) {
                      console.warn('自动生成标题失败:', titleError);
                    }
                  }
                }
              }, 0);
            }
            return updatedMessages;
          });
        },
        // onError: 处理错误
        (error: string) => {
          // 清除loading状态和AbortController
          setLoading(false);
          setAbortController(null);
          
          // 检查是否为用户主动中断
          if (error === '对话已中断') {
            // 用户主动中断，只移除loading状态，保留已接收的内容
            setMessages(prevMessages => {
              const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
              return safeMessages.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, loading: false }
                  : msg
              );
            });
            
            // 显示中断成功的提示
            notification.info({
              message: '对话已中断',
              description: '已停止当前对话生成',
              duration: 2
            });
          } else {
            // 真正的错误，显示错误信息
            setMessages(prevMessages => {
              const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
              return safeMessages.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: `❌ 对话失败: ${error}`, loading: false }
                  : msg
              );
            });
            
            notification.error({
              message: '发送失败',
              description: error || '消息发送失败，请稍后重试'
            });
          }
        },
        // onThinking: 处理思考过程数据
        (thinkingData: any) => {
          
          setMessages(prevMessages => {
            
            const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
            const targetIndex = safeMessages.findIndex(msg => msg.id === aiMessageId);
            
            
            if (targetIndex === -1) {
              console.error('未找到目标消息，thinking数据丢失');
              return prevMessages;
            }
            
            const targetMessage = safeMessages[targetIndex];
            const oldThinkingLength = targetMessage.thinking?.length || 0;
            const newThinking = [...(targetMessage.thinking || []), thinkingData];
            
            
            const updatedMessages = safeMessages.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    thinking: newThinking,
                    // 添加一个随机key来强制重新渲染
                    _forceUpdate: Date.now()
                  }
                : msg
            );
            
            
            
            return updatedMessages;
          });
        },
        // onKnowledgeSources: 处理知识源数据
        (knowledgeData: any) => {
          console.log('🔍 QAPage 收到knowledge_sources数据:', JSON.stringify(knowledgeData, null, 2));
          console.log('🔥 [QAPage] 图谱数据详细检查:', {
            hasGraphSources: !!knowledgeData.graph_sources,
            graphSourcesData: knowledgeData.graph_sources,
            graphSourcesKeys: knowledgeData.graph_sources ? Object.keys(knowledgeData.graph_sources) : [],
            graphSourcesType: typeof knowledgeData.graph_sources,
            graphSourcesStringified: JSON.stringify(knowledgeData.graph_sources)
          });
          
          // 更新当前消息的知识源数据
          setMessages(prevMessages => {
            const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
            const updatedMessages = safeMessages.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    knowledgeSources: knowledgeData.knowledge_sources || [],
                    knowledgeStats: knowledgeData.knowledge_stats || {},
                    graphSources: knowledgeData.graph_sources || {}
                  }
                : msg
            );
            
            // 更新当前选中的溯源消息
            const updatedMessage = updatedMessages.find(m => m.id === aiMessageId);
            if (updatedMessage) {
              setCurrentMessageForSource(updatedMessage);
            }
            
            return updatedMessages;
          });
        },
        // onAgentCall: 处理Team模式的Agent调用事件
        (agentCallData: any) => {
          console.log('🤖 QAPage 收到agent_call事件:', JSON.stringify(agentCallData, null, 2));
          
          // 更新当前消息的Team信息
          setMessages(prevMessages => {
            const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
            const updatedMessages = safeMessages.map(msg => {
              if (msg.id === aiMessageId) {
                const currentTeamInfo = msg.teamInfo || { 
                  isTeamMessage: true,
                  teamName: agentCallData.team_name || 'Team',
                  executionId: agentCallData.execution_id || '',
                  memberCalls: []
                };
                
                // 添加或更新Agent调用信息
                const existingCallIndex = currentTeamInfo.memberCalls?.findIndex(
                  call => call.memberId === agentCallData.agent_name && call.startTime === agentCallData.timestamp
                );
                
                const newMemberCall = {
                  memberId: agentCallData.agent_name,
                  memberName: agentCallData.agent_name,
                  role: 'Agent',
                  action: agentCallData.action || 'Processing',
                  callType: 'tool',
                  input: agentCallData.input || {},
                  output: agentCallData.output || {},
                  startTime: agentCallData.timestamp || Date.now(),
                  endTime: agentCallData.timestamp + (agentCallData.duration_ms || 0),
                  durationMs: agentCallData.duration_ms || 0,
                  status: agentCallData.status || 'running',
                  confidence: null,
                  errorMessage: null,
                  metadata: { execution_id: agentCallData.execution_id }
                };
                
                const updatedMemberCalls = [...(currentTeamInfo.memberCalls || [])];
                if (existingCallIndex >= 0) {
                  updatedMemberCalls[existingCallIndex] = newMemberCall;
                } else {
                  updatedMemberCalls.push(newMemberCall);
                }
                
                return {
                  ...msg,
                  teamInfo: {
                    ...currentTeamInfo,
                    memberCalls: updatedMemberCalls
                  }
                };
              }
              return msg;
            });
            
            return updatedMessages;
          });
        },
        // onTeamAnalysis: 处理Team模式的分析事件
        (teamAnalysisData: any) => {
          console.log('👥 QAPage 收到team_analysis事件:', JSON.stringify(teamAnalysisData, null, 2));
          console.log('🔍 [DEBUG] member_calls原始数据:', teamAnalysisData.member_calls);
          console.log('🔍 [DEBUG] member_calls数组长度:', teamAnalysisData.member_calls?.length || 0);
          
          // 更新当前消息的完整Team信息
          setMessages(prevMessages => {
            const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
            const updatedMessages = safeMessages.map(msg => {
              if (msg.id === aiMessageId) {
                const newTeamInfo = {
                  isTeamMessage: true,
                  teamName: teamAnalysisData.team_name || 'Team',
                  teamMode: 'coordinate',
                  executionId: teamAnalysisData.execution_id || '',
                  memberCalls: teamAnalysisData.member_calls || [],
                  structuredOutput: teamAnalysisData.structured_output,
                  coordinationInfo: teamAnalysisData.coordination_info,
                  totalSteps: teamAnalysisData.total_steps,
                  completedSteps: teamAnalysisData.completed_steps,
                  failedSteps: teamAnalysisData.failed_steps,
                  processingTime: teamAnalysisData.processing_time
                };
                console.log('🔍 [DEBUG] 设置的teamInfo.memberCalls长度:', newTeamInfo.memberCalls?.length || 0);
                
                return {
                  ...msg,
                  teamInfo: newTeamInfo
                };
              }
              return msg;
            });
            
            return updatedMessages;
          });
        },
        // onTeamStart: 处理Team模式的开始事件
        (teamStartData: any) => {
          console.log('🚀 QAPage 收到team_start事件:', JSON.stringify(teamStartData, null, 2));
          
          // 初始化Team消息结构
          setMessages(prevMessages => {
            const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
            const updatedMessages = safeMessages.map(msg => {
              if (msg.id === aiMessageId) {
                return {
                  ...msg,
                  teamInfo: {
                    isTeamMessage: true,
                    teamName: teamStartData.team_name || 'Team',
                    teamMode: 'coordinate',
                    executionId: teamStartData.execution_id || '',
                    memberCalls: [],
                    query: teamStartData.query,
                    startTime: teamStartData.timestamp
                  }
                };
              }
              return msg;
            });
            
            return updatedMessages;
          });
        },
        // onAgentStatus: 处理Agent状态变化事件
        (agentStatusData: any) => {
          console.log('👤 QAPage 收到agent_status事件:', JSON.stringify(agentStatusData, null, 2));
          
          // 更新当前Agent状态
          setCurrentAgentStatus(agentStatusData);
          
          // 设置定时器，如果Agent在一定时间内没有更新状态，则清除显示
          setTimeout(() => {
            setCurrentAgentStatus((prev: any) => {
              if (prev && prev.timestamp === agentStatusData.timestamp) {
                return null; // 清除状态显示
              }
              return prev;
            });
          }, 30000); // 30秒后自动清除
        },
        // onAgentDecision: 处理Team模式的Agent决策事件
        (agentDecisionData: any) => {
          console.log('🧠 QAPage 收到agent_decision事件:', JSON.stringify(agentDecisionData, null, 2));
          
          // Agent名称映射
          const agentNameMapping: { [key: string]: string } = {
            'question_decomposition_agent': '问题分析',
            'intelligent_routing_agent': '智能路由', 
            'dag_reconstruction_agent': 'DAG重构',
            'translation_agent': '翻译处理',
            'knowledge_retrieval_agent': '知识检索',
            'knowledge_graph_agent': '知识图谱',
            'summary_answer_agent': '答案总结'
          };
          
          const agentName = agentDecisionData.agent_name;
          const displayName = agentNameMapping[agentName] || agentName || 'Unknown Agent';
          
          // 更新当前消息的Team决策数据
          setMessages(prevMessages => {
            const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
            const updatedMessages = safeMessages.map(msg => {
              if (msg.id === aiMessageId) {
                const currentTeamInfo = msg.teamInfo || { 
                  isTeamMessage: true,
                  teamName: displayName,
                  executionId: agentDecisionData.execution_id || '',
                  teamDecisions: []
                };
                
                // 创建决策数据对象
                const newDecision = {
                  type: agentDecisionData.decision_type || 'team_coordination',
                  title: agentDecisionData.decision_content || '团队决策',
                  content: agentDecisionData.decision_content || '正在进行团队协调',
                  confidence: agentDecisionData.confidence || 0.9,
                  reasoning: agentDecisionData.reasoning || '',
                  agent: agentName,
                  agentName: displayName,
                  timestamp: agentDecisionData.timestamp || Date.now(),
                  metadata: agentDecisionData.metadata || {}
                };
                
                // 添加决策数据到列表
                const updatedDecisions = [...(currentTeamInfo.teamDecisions || []), newDecision];
                
                return {
                  ...msg,
                  teamInfo: {
                    ...currentTeamInfo,
                    teamDecisions: updatedDecisions
                  }
                };
              }
              return msg;
            });
            
            return updatedMessages;
          });
        },
        // onAgentStart: 处理Agent开始事件
        (agentStartData: any) => {
          console.log('🚀 QAPage 收到agent_start事件:', JSON.stringify(agentStartData, null, 2));
          
          // 更新当前消息的Agent状态
          setMessages(prevMessages => {
            const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
            return safeMessages.map(msg => {
              if (msg.id === aiMessageId && msg.teamInfo) {
                return {
                  ...msg,
                  teamInfo: {
                    ...msg.teamInfo,
                    currentAgent: {
                      id: agentStartData.agent_id,
                      name: agentStartData.agent_name,
                      role: agentStartData.role,
                      action: agentStartData.action,
                      step: agentStartData.step,
                      icon: agentStartData.icon,
                      status: 'running',
                      startTime: agentStartData.timestamp
                    },
                    agentProgress: {
                      currentStep: agentStartData.step,
                      totalSteps: agentStartData.total_steps
                    }
                  }
                };
              }
              return msg;
            });
          });
        },
        // onAgentComplete: 处理Agent完成事件
        (agentCompleteData: any) => {
          console.log('🏁 QAPage 收到agent_complete事件:', JSON.stringify(agentCompleteData, null, 2));
          
          // 更新当前消息的Agent状态
          setMessages(prevMessages => {
            const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
            return safeMessages.map(msg => {
              if (msg.id === aiMessageId && msg.teamInfo && msg.teamInfo.currentAgent) {
                return {
                  ...msg,
                  teamInfo: {
                    ...msg.teamInfo,
                    currentAgent: {
                      ...msg.teamInfo.currentAgent,
                      status: 'completed',
                      endTime: agentCompleteData.timestamp,
                      contentGenerated: agentCompleteData.content_generated
                    }
                  }
                };
              }
              return msg;
            });
          });
        },
        controller // 传递AbortController
      );
    } catch (error) {
      // 清除loading状态和AbortController
      setLoading(false);
      setAbortController(null);
      
      // 检查是否为用户主动中断错误
      if (error instanceof Error && error.name === 'AbortError') {
        // 用户主动中断，只移除loading状态，保留已接收的内容
        setMessages(prevMessages => {
          const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
          return safeMessages.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, loading: false }
              : msg
          );
        });
        
        // 显示中断成功的提示
        notification.info({
          message: '对话已中断',
          description: '已停止当前对话生成',
          duration: 2
        });
      } else {
        // 真正的网络错误，显示错误信息
        setMessages(prevMessages => {
          const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
          return safeMessages.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: `❌ 网络错误: ${error instanceof Error ? error.message : '未知错误'}`, loading: false }
              : msg
          );
        });
        
        notification.error({
          message: '网络错误',
          description: '无法连接到服务器，请检查网络连接'
        });
      }
    }
  };

  // 处理中断对话
  const handleInterrupt = () => {
    if (abortController) {
      abortController.abort();
      setLoading(false);
      setAbortController(null);
    }
  };

  // 处理消息操作
  const handleMessageAction = (action: 'like' | 'dislike' | 'regenerate' | 'copy' | 'view_sources', messageId: string) => {
    
    const targetMessage = messages.find(msg => msg.id === messageId);
    
    if (action === 'copy' && targetMessage) {
      // 复制消息内容到剪贴板
      import('../../utils/clipboardUtils').then(async ({ copyToClipboard }) => {
        const success = await copyToClipboard(targetMessage.content);
        if (success) {
          notification.success({
            message: '复制成功',
            description: '消息内容已复制到剪贴板',
            duration: 2
          });
        } else {
          notification.error({
            message: '复制失败',
            description: '无法复制消息内容'
          });
        }
      });
    } else if (action === 'view_sources' && targetMessage) {
      // 显示溯源抽屉
      console.log('📂 [QAPage] 准备显示溯源抽屉，调用 handleSelectMessageForSources...');
      handleSelectMessageForSources(targetMessage);
    } else if (action === 'regenerate') {
      // TODO: 实现重新生成功能
      notification.info({
        message: '功能开发中',
        description: '重新生成功能正在开发中'
      });
    } else {
      // 其他操作暂未实现
      console.log(`操作 ${action} 暂未实现`);
    }
  };

  // 处理图片预览
  const handleImagePreview = (image: string, title: string, desc: string) => {
    setImagePreview(true, image, title, desc);
  };

  // 处理历史对话选择
  const handleSelectConversation = async (id: string) => {
    try {
      await loadConversation(id);
      if (windowWidth < 768) {
        setMobileHistoryDrawerVisible(false);
      }
    } catch (error) {
      console.error('选择对话失败:', error);
    }
  };

  // 处理删除对话
  const handleDeleteConversation = async (id: string) => {
    try {
      console.log(`🗑️ [QAPage] 开始删除对话: ${id}`);
      
      // 检查是否删除的是当前选中的对话
      const isCurrentConversation = currentSessionId === id;
      
      let nextConversationId: string | null = null;
      
      // 只有删除当前选中的对话时，才需要找到下一个要聚焦的对话
      if (isCurrentConversation && conversations.length > 1) {
        const currentIndex = conversations.findIndex(conv => conv.id === id);
        
        // 如果有其他对话，选择下一个（或上一个）对话
        if (currentIndex < conversations.length - 1) {
          // 选择下一个对话
          nextConversationId = conversations[currentIndex + 1].id;
        } else if (currentIndex > 0) {
          // 选择上一个对话
          nextConversationId = conversations[currentIndex - 1].id;
        }
        
        console.log(`🎯 [QAPage] 删除当前对话，下一个聚焦对话: ${nextConversationId}`);
      }
      
      // 调用后端删除API
      await qaService.deleteConversation(id);
      
      // 🔥 只从前端列表中移除对话，保持列表顺序，不触发整体刷新
      const currentConversations = useQAStore.getState().conversations;
      if (Array.isArray(currentConversations)) {
        const updatedConversations = currentConversations.filter(conv => conv.id !== id);
        setConversations(updatedConversations);
        console.log(`✅ [QAPage] 已从列表中移除对话: ${id}, 剩余${updatedConversations.length}个对话`);
      }
      
      // 只有删除当前选中的对话时，才执行聚焦逻辑
      if (isCurrentConversation) {
        if (nextConversationId) {
          // 如果有下一个对话，自动聚焦到下一个对话
          await handleSelectConversation(nextConversationId);
        } else {
          // 如果没有剩余对话，根据当前模式创建新对话
          if (currentMode === 'team') {
            createTeamConversation();
          } else {
            createNewConversation();
          }
          console.log(`🆕 [QAPage] 删除最后一个对话后创建新对话`);
        }
      }
      
      notification.success({
        message: '删除成功',
        description: '对话已删除'
      });
      
      console.log(`✅ [QAPage] 对话删除完成: ${id}`);
    } catch (error) {
      console.error('删除对话失败:', error);
      notification.error({
        message: '删除失败',
        description: '删除对话失败，请稍后重试'
      });
    }
  };

  // 处理新建对话
  const handleNewConversation = () => {
    if (currentMode === 'team') {
      createTeamConversation();
    } else {
      createNewConversation();
    }
    if (windowWidth < 768) {
      setMobileHistoryDrawerVisible(false);
    }
  };

  // 处理清空所有对话
  const handleClearAllConversations = async () => {
    try {
      console.log('🗑️ 开始清空所有对话历史');
      
      // 调用后端API清空所有对话
      const result = await qaService.clearAllConversations();
      
      console.log('✅ 清空对话历史成功:', result);
      
      // 强制重新加载对话历史（应该为空，根据当前模式）
      const currentHistoryMode = currentMode === 'default' ? 'expert' : currentMode as 'team';
      await loadConversationHistory(currentHistoryMode);
      
      // 根据当前模式创建新对话
      if (currentMode === 'team') {
        createTeamConversation();
      } else {
        createNewConversation();
      }
      
      console.log('🎉 清空操作完成，已创建新对话');
      
    } catch (error) {
      console.error('❌ 清空对话历史失败:', error);
      notification.error({
        message: '清空失败',
        description: '清空对话历史时发生错误，请重试',
        placement: 'topRight'
      });
      throw error;
    }
  };

  // 处理系统设置
  const handleSystemSettings = () => {
    setSystemSettingsVisible(true);
  };

  // 处理重试加载历史记录
  const handleRetryLoadHistory = async () => {
    try {
      await forceReloadConversationHistory();
      notification.success({
        message: '重新加载成功',
        description: '历史对话列表已更新'
      });
    } catch (error) {
      console.error('重新加载历史对话失败:', error);
      notification.error({
        message: '重新加载失败',
        description: '无法加载历史对话，请检查网络连接'
      });
    }
  };

  // 处理知识源抽屉显示
  const handleShowKnowledgeSources = () => {
    // 🔥 修复：找到最新的有知识源或图谱源的消息
    const messagesWithSources = messages.filter(msg => {
      if (msg.type !== 'assistant') return false;
      
      const hasKnowledgeSources = msg.knowledgeSources && msg.knowledgeSources.length > 0;
      const hasGraphSources = msg.graphSources && (
        msg.graphSources.success || 
        msg.graphSources.response || 
        (msg.graphSources.sources && msg.graphSources.sources.length > 0)
      );
      
      return hasKnowledgeSources || hasGraphSources;
    });
    
    if (messagesWithSources.length > 0) {
      // 选择最新的消息
      const latestMessage = messagesWithSources[messagesWithSources.length - 1];
      setSelectedMessageForSources(latestMessage);
      setKnowledgeSourcesDrawerVisible(true);
      console.log('✅ [QAPage] 显示最新溯源消息:', {
        messageId: latestMessage.id,
        hasKnowledgeSources: !!(latestMessage.knowledgeSources && latestMessage.knowledgeSources.length > 0),
        hasGraphSources: !!(latestMessage.graphSources && (latestMessage.graphSources.success || latestMessage.graphSources.response))
      });
    } else {
      notification.info({
        message: '暂无溯源信息',
        description: '当前对话中没有检索到知识库或知识图谱来源信息'
      });
    }
  };

  // 处理消息选择（用于显示特定消息的知识源）
  const handleSelectMessageForSources = (message: Message) => {
    console.log('🔍 [QAPage] handleSelectMessageForSources called:', {
      messageId: message.id,
      hasKnowledgeSources: !!message.knowledgeSources,
      knowledgeSourcesLength: message.knowledgeSources?.length || 0,
      hasGraphSources: !!message.graphSources,
      graphSourcesData: message.graphSources,
      messageContent: message.content?.slice(0, 50) + '...'
    });
    
    // 🔥 修复：检查是否有知识库源或图谱源数据
    const hasKnowledgeSources = message.knowledgeSources && message.knowledgeSources.length > 0;
    const hasGraphSources = message.graphSources && (
      message.graphSources.success || 
      message.graphSources.response || 
      (message.graphSources.sources && message.graphSources.sources.length > 0)
    );
    
    if (hasKnowledgeSources || hasGraphSources) {
      setSelectedMessageForSources(message);
      setKnowledgeSourcesDrawerVisible(true);
      console.log('✅ [QAPage] 显示溯源抽屉:', {
        hasKnowledgeSources,
        hasGraphSources,
        knowledgeCount: message.knowledgeSources?.length || 0,
        graphSuccess: message.graphSources?.success,
        graphResponse: !!message.graphSources?.response
      });
    } else {
      notification.info({
        message: '无溯源信息',
        description: '该消息没有关联的知识库或知识图谱来源信息'
      });
    }
  };

  // 处理检索模式变化
  const handleRetrievalModeChange = (mode: 'qa_only' | 'papers_only' | 'all') => {
    setRetrievalMode(mode);
    console.log('🔍 检索模式已切换为:', mode);
  };

  // 移动端布局
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1400;
  const isDesktop = windowWidth >= 1400;

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#f3f4f6',
        margin: 0,
        padding: 0
      }}
    >
      {/* 桌面端左侧历史面板展开按钮 */}
      {!isMobile && !isHistoryVisible && (
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '8px',
            transform: 'translateY(-50%)',
            zIndex: 1000,
            background: 'rgba(59, 130, 246, 0.9)',
            color: 'white',
            padding: '12px 8px',
            borderRadius: '0 8px 8px 0',
            cursor: 'pointer',
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onClick={() => setHistoryVisible(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 1)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.9)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
          }}
          title="展开对话历史"
        >
          <MenuOutlined />
        </div>
      )}

      {/* 桌面端左侧历史面板 */}
      {!isMobile && isHistoryVisible && (
        <div className="w-80 border-r border-gray-200 bg-white flex-shrink-0">
          <HistoryPanel
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onClearAllConversations={handleClearAllConversations}
            onSystemSettings={handleSystemSettings}
            onRetryLoadHistory={handleRetryLoadHistory}
            onLoadMoreConversations={loadMoreConversations}
            loading={conversationsLoading}
            hasMoreConversations={conversationsPagination.hasMore}
            paginationInfo={{
              currentPage: conversationsPagination.currentPage,
              total: conversationsPagination.total,
              pageSize: conversationsPagination.pageSize
            }}
            currentMode={(() => {
              const historyMode = currentMode === 'default' ? 'expert' : 'team';
              console.log(`[QAPage] 传递给HistoryPanel的currentMode: ${historyMode} (原始currentMode: ${currentMode})`);
              return historyMode;
            })()}
            onModeChange={handleHistoryModeChange}
            onLoadConversationsByMode={async (mode) => {
              console.log(`📱 [QAPage] HistoryPanel(桌面版)请求加载对话: mode=${mode} (忽略，由QAPage统一管理)`);
              // 不在这里执行加载，由QAPage的useEffect统一管理
            }}
            onCollapse={() => setHistoryVisible(false)}
          />
        </div>
      )}

      {/* 中间主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* 消息列表 */}
        <MessageList
          key={currentSessionId || 'no-session'} // 🔥 强制重新渲染当会话改变时
          messages={messages}
          loading={isLoading}
          onMessageAction={handleMessageAction}
          onImagePreview={handleImagePreview}
          className="flex-1"
          currentMode={currentMode}
        />

        {/* 当前执行Agent状态栏 */}
        {currentMode === 'team' && currentAgentStatus && (
          <div style={{ 
            padding: '0 16px', 
            position: 'sticky', 
            bottom: '80px',
            zIndex: 100,
            pointerEvents: 'none' // 允许点击穿透到下层
          }}>
            <CurrentAgentStatusBar 
              agentStatus={currentAgentStatus}
              visible={!!currentAgentStatus}
              style={{ 
                pointerEvents: 'auto', // 组件本身可以交互
                maxWidth: '600px',
                margin: '0 auto'
              }}
            />
          </div>
        )}

        {/* 输入框 */}
        <InputBox
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          onInterrupt={handleInterrupt}
          loading={isLoading}
          availableAgents={availableAgents}
          selectedAgent={selectedAgent}
          onAgentChange={setSelectedAgent}
          isMobile={isMobile}
          onMobileHistoryOpen={() => setMobileHistoryDrawerVisible(true)}
          searchKnowledge={searchKnowledge}
          onSearchKnowledgeChange={setSearchKnowledge}
          searchGraph={searchGraph}
          onSearchGraphChange={setSearchGraph}
          retrievalMode={retrievalMode}
          onRetrievalModeChange={handleRetrievalModeChange}
          enableTranslation={enableTranslation}
          onTranslationChange={setEnableTranslation}
          inputText={inputValue}
          currentModel={modelConfig.llm.chatModel}
          chatSettings={chatSettings}
          onChatSettingsChange={setChatSettings}
          onTeamConfigSaved={handleTeamConfigSaved}
          onShowKnowledgeSources={handleShowKnowledgeSources}
          // 新增模式切换相关props
          currentMode={currentMode}
          onModeChange={handleModeChange}
          availableTeams={availableTeams}
          selectedTeam={selectedTeam}
          onTeamChange={setSelectedTeam}
          teamDefaultConfig={teamDefaultConfig}
          sidebarVisible={!isMobile && isHistoryVisible}
        />
      </div>


      {/* 移动端历史对话抽屉 */}
      <Drawer
        title="对话历史"
        placement="left"
        onClose={() => setMobileHistoryDrawerVisible(false)}
        open={isMobileHistoryDrawerVisible}
        width={320}
        className="md:hidden"
      >
        <HistoryPanel
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onClearAllConversations={handleClearAllConversations}
          onSystemSettings={handleSystemSettings}
          onRetryLoadHistory={handleRetryLoadHistory}
          onLoadMoreConversations={loadMoreConversations}
          loading={conversationsLoading}
          hasMoreConversations={conversationsPagination.hasMore}
          paginationInfo={{
            currentPage: conversationsPagination.currentPage,
            total: conversationsPagination.total,
            pageSize: conversationsPagination.pageSize
          }}
          currentMode={currentMode === 'default' ? 'expert' : currentMode as 'team'}
          onModeChange={handleHistoryModeChange}
          onLoadConversationsByMode={async (mode) => {
            console.log(`📱 [QAPage] HistoryPanel(移动版)请求加载对话: mode=${mode} (忽略，由QAPage统一管理)`);
            // 不在这里执行加载，由QAPage的useEffect统一管理  
          }}
          onCollapse={() => setMobileHistoryDrawerVisible(false)}
        />
      </Drawer>


      {/* 图片预览Modal */}
      <Modal
        open={imagePreviewVisible}
        onCancel={() => setImagePreview(false)}
        footer={null}
        width="80%"
        style={{ maxWidth: 800 }}
        centered
      >
        <div className="text-center">
          <img
            src={currentImage}
            alt={currentImageTitle}
            className="w-full h-auto max-h-96 object-contain mb-4"
          />
          <h3 className="text-lg font-semibold mb-2">{currentImageTitle}</h3>
          <p className="text-gray-600 text-sm">{currentImageDesc}</p>
        </div>
      </Modal>

      {/* 知识源抽屉 - 使用美化后的SourceViewer */}
      {knowledgeSourcesDrawerVisible && selectedMessageForSources && (
        <SourceViewer
          message={selectedMessageForSources}
          onClose={() => setKnowledgeSourcesDrawerVisible(false)}
          viewMode="drawer"
        />
      )}

      {/* 团队执行流程抽屉 */}
      <TeamExecutionDrawer
        visible={drawerVisible}
        onClose={closeDrawer}
        executionState={currentExecution}
        onTerminate={() => {
          terminateExecution();
          console.log('用户终止了团队执行');
        }}
        onRetry={(taskId) => {
          updateTask(taskId, { status: 'pending' });
          console.log('用户重试任务:', taskId);
        }}
        onPause={() => {
          console.log('用户暂停了团队执行');
        }}
        onResume={() => {
          console.log('用户恢复了团队执行');
        }}
      />

      {/* 系统设置弹窗 */}
      <SystemSettings
        visible={systemSettingsVisible}
        onClose={() => setSystemSettingsVisible(false)}
      />

      {/* 全局Layout已经管理SSE连接，此处不再重复 */}
    </div>
  );
};

export default QAPage; 