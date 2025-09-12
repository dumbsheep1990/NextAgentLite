/**
 * 单体智能体页面 - 专家模式（从原QA页面拆分）
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
  UserOutlined
} from '@ant-design/icons';
import { MessageList } from '../../components/qa/MessageList';
import { MessageItem } from '../../components/qa/MessageItem';
import { HistoryPanel } from '../../components/qa/HistoryPanel';
import { SourcePanel } from '../../components/qa/SourcePanel';
import { SourceViewer } from '../../components/qa/SourceViewer';
import { InputBox } from '../../components/qa/InputBox';
import { SystemSettings } from '../../components/common/SystemSettings';
import CurrentAgentStatusBar from '../../components/qa/CurrentAgentStatusBar';
import { useQAStore } from '../../stores/qaStore';
import { useAppStore } from '../../stores/appStore';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { useAuthStore } from '../../stores/authStore';
import { qaService } from '../../services/qaService';
import { getApiBaseUrl } from '../../config/appConfig';
import type { Message, HistoryConversation } from '../../types';

const SingleAgentPage: React.FC = () => {
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
  const [searchKnowledge, setSearchKnowledge] = useState(true);  // 默认启用知识库检索
  const [searchGraph, setSearchGraph] = useState(false);  // 知识图谱检索开关，默认关闭
  const [retrievalMode, setRetrievalMode] = useState<'qa_only' | 'papers_only' | 'all'>('all');  // 检索模式，默认全部检索
  const [enableTranslation, setEnableTranslation] = useState(false);  // 翻译功能开关，默认关闭
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
  
  // 固定为专家模式（单体智能体）
  const currentMode = 'default';
  
  // Agent状态管理
  const [currentAgentStatus, setCurrentAgentStatus] = useState<any>(null);
  
  // 用于跟踪是否已经进行过会话同步
  const hasSyncedRef = useRef(false);

  // 获取模型配置
  const { modelConfig, setModelConfig } = useAppStore();
  const { refreshModelsFromAPI } = useKnowledgeStore();
  
  // 获取当前用户信息
  const { user: currentUser } = useAuthStore();

  // currentSessionId 已经是完整的 session_id，不需要额外处理
  const currentConversationId = currentSessionId;

  // 初始化数据 - 只在组件挂载时执行一次
  useEffect(() => {
    const initialize = async () => {
      try {
        // 加载专家模式的对话历史
        console.log(`[SingleAgentPage] 初始化加载对话历史: mode=expert`);
        
        await Promise.all([
          initializeAgents(),
          loadConversationHistory('expert'), // 固定加载专家模式历史
          refreshModelsFromAPI() // 刷新模型列表
        ]);
      } catch (error) {
        console.error('初始化失败:', error);
      }
    };
    
    initialize();
  }, []); // 只在组件挂载时执行

  // 监听窗口大小变化和系统设置事件
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    const handleOpenSystemSettings = () => {
      setSystemSettingsVisible(true);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('open-system-settings', handleOpenSystemSettings);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('open-system-settings', handleOpenSystemSettings);
    };
  }, []);

  // 响应式判断
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // SSE连接管理
  const messagesRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, []);

  // 消息变化时自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 处理知识库切换
  const handleKnowledgeToggle = (checked: boolean) => {
    setSearchKnowledge(checked);
    if (!checked) {
      setSearchGraph(false); // 如果关闭知识库，同时关闭图谱
    }
  };

  // 处理图谱切换
  const handleGraphToggle = (checked: boolean) => {
    setSearchGraph(checked);
    if (checked && !searchKnowledge) {
      setSearchKnowledge(true); // 如果开启图谱，自动开启知识库
    }
  };

  // 处理发送消息 - 专家模式特殊处理
  const handleSendMessage = async (message: string, agentName?: string) => {
    if (!message.trim() || isLoading) return;
    
    setLoading(true);
    
    try {
      // 专家模式的发送逻辑 - 参考原始QA页面
      let displayAgentId: string;
      let displayAgentName: string;

      // 专家模式：显示智能体信息
      const currentAgentId = agentName || selectedAgent || 'cailiao_zhuanjia';
      const currentAgent = availableAgents.find(agent => agent.id === currentAgentId);
      displayAgentId = currentAgent?.id || 'cailiao_zhuanjia';
      displayAgentName = currentAgent?.name || '问答专家';

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentId: displayAgentId,
        agentName: displayAgentName,
        loading: true
      };
      
      // 添加用户消息
      addMessage({
        id: (Date.now() - 1).toString(),
        type: 'user', 
        content: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      
      // 添加AI消息
      addMessage(aiMessage);
      setInputValue('');
      
      // 创建新的AbortController用于请求控制
      const newAbortController = new AbortController();
      setAbortController(newAbortController);
      
      // 正确判断agent类型和名称 - 专家模式
      const agentType = 'single';
      const agentNameToSend = currentAgentId;
      
      await qaService.askQuestionStream(
        {
          message: message,
          conversation_id: currentSessionId,
          user_id: currentUser?.id,
          agentType: agentType,
          agentName: agentNameToSend,
          modelName: modelConfig?.llm?.chatModel || 'qwen-plus-latest',
          search_knowledge: searchKnowledge,
          search_graph: searchGraph,
          retrieval_mode: retrievalMode,
          enable_translation: enableTranslation,
          // 启用多轮对话上下文
          enable_context_memory: chatSettings.enableMemory,
          max_context_turns: chatSettings.maxTurns
        },
        // onChunk: 处理流式数据块
        (chunk: string) => {
          // 累积内容更新
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, content: (msg.content || '') + chunk }
              : msg
          ));
        },
        // onDone: 流式传输完成
        (doneData?: any) => {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, loading: false }
              : msg
          ));
          setLoading(false);
          setAbortController(null);
          
          // 更新对话
          if (currentSessionId) {
            const finalMessage = messages.find(m => m.id === aiMessage.id);
            if (finalMessage) {
              updateCurrentConversationFromMessage(message, finalMessage.content, currentSessionId);
            }
          }
        },
        // onError: 错误处理
        (error: string) => {
          console.error('发送消息失败:', error);
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { 
                  ...msg, 
                  content: '抱歉，消息发送失败，请稍后重试。', 
                  loading: false,
                  error: true 
                }
              : msg
          ));
          setLoading(false);
          setAbortController(null);
        },
        undefined, // onThinking
        undefined, // onKnowledgeSources
        undefined, // onAgentCall
        undefined, // onTeamAnalysis
        undefined, // onTeamStart
        undefined, // onAgentStatus
        undefined, // onAgentDecision
        undefined, // onAgentStart
        undefined, // onAgentComplete
        newAbortController
      );
      
    } catch (error) {
      console.error('处理消息发送失败:', error);
      setLoading(false);
      setAbortController(null);
    }
  };

  // 处理中断
  const handleInterrupt = () => {
    if (abortController) {
      abortController.abort();
      setLoading(false);
      setAbortController(null);
    }
  };

  // 处理模式切换（Single页面固定为default模式，不实际切换）
  const handleModeChange = (mode: 'default' | 'team') => {
    // Single页面固定为default模式，忽略切换请求
    console.log('SingleAgentPage: 忽略模式切换请求:', mode, '当前固定为default模式');
  };

  // 计算布局
  const getLayoutConfig = () => {
    if (isMobile) {
      return {
        showSidePanels: false,
        useDrawers: true,
        messageColSpan: 24,
        historyColSpan: 0,
        sourceColSpan: 0
      };
    }

    const showHistory = isHistoryVisible;
    const showSource = isSourceVisible;

    if (showHistory && showSource) {
      return {
        showSidePanels: true,
        useDrawers: false,
        messageColSpan: 12,
        historyColSpan: 6,
        sourceColSpan: 6
      };
    } else if (showHistory || showSource) {
      return {
        showSidePanels: true,
        useDrawers: false,
        messageColSpan: 18,
        historyColSpan: showHistory ? 6 : 0,
        sourceColSpan: showSource ? 6 : 0
      };
    } else {
      return {
        showSidePanels: false,
        useDrawers: false,
        messageColSpan: 24,
        historyColSpan: 0,
        sourceColSpan: 0
      };
    }
  };

  const layoutConfig = getLayoutConfig();

  // 构建主界面
  const renderMainContent = () => (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 专家模式顶部栏 */}
      <div className="bg-white border-b shadow-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserOutlined className="text-blue-500 text-lg" />
          <span className="text-sm font-medium text-gray-800">
            {availableAgents.find(agent => agent.id === (selectedAgent || 'cailiao_zhuanjia'))?.name || '问答专家'}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {!isMobile && (
            <>
              <Button
                type={isHistoryVisible ? "primary" : "text"}
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => {
                  setHistoryVisible(!isHistoryVisible);
                  // 自动折叠侧边导航栏
                  window.dispatchEvent(new CustomEvent('collapse-sidebar'));
                }}
                className="px-2"
              >
                历史
              </Button>
              <Button
                type={isSourceVisible ? "primary" : "text"}
                size="small" 
                icon={<InfoCircleOutlined />}
                onClick={() => {
                  setSourceVisible(!isSourceVisible);
                  // 自动折叠侧边导航栏
                  window.dispatchEvent(new CustomEvent('collapse-sidebar'));
                }}
                className="px-2"
              >
                溯源
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 桌面端侧边栏 */}
        {!isMobile && layoutConfig.showSidePanels && (
          <>
            {/* 历史对话面板 */}
            {isHistoryVisible && (
              <div className="w-80 bg-white border-r flex flex-col">
                <HistoryPanel 
                  conversations={conversations || []}
                  currentConversationId={currentConversationId}
                  onSelectConversation={loadConversation}
                  onNewConversation={createNewConversation}
                  onDeleteConversation={async (id) => {
                    try {
                      console.log(`🗑️ [SingleAgentPage] 开始删除对话: ${id}`);
                      
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
                        
                        console.log(`🎯 [SingleAgentPage] 删除当前对话，下一个聚焦对话: ${nextConversationId}`);
                      }
                      
                      // 调用后端删除API
                      await qaService.deleteConversation(id);
                      
                      // 🔥 只从前端列表中移除对话，保持列表顺序，不触发整体刷新
                      const currentConversations = useQAStore.getState().conversations;
                      if (Array.isArray(currentConversations)) {
                        const updatedConversations = currentConversations.filter(conv => conv.id !== id);
                        setConversations(updatedConversations);
                        console.log(`✅ [SingleAgentPage] 已从列表中移除对话: ${id}, 剩余${updatedConversations.length}个对话`);
                      }
                      
                      // 只有删除当前选中的对话时，才执行聚焦逻辑
                      if (isCurrentConversation) {
                        if (nextConversationId) {
                          // 如果有下一个对话，自动聚焦到下一个对话
                          await loadConversation(nextConversationId);
                        } else {
                          // 如果没有剩余对话，创建新对话
                          createNewConversation();
                        }
                      }
                      
                      console.log('✅ [SingleAgentPage] 删除对话成功:', id);
                    } catch (error) {
                      console.error('❌ [SingleAgentPage] 删除对话失败:', error);
                    }
                  }}
                  mode="expert" // 固定为专家模式
                  onModeChange={() => {}} // 不允许切换模式
                  onLoadConversationsByMode={async (mode) => {
                    console.log(`📱 [SingleAgentPage] HistoryPanel请求加载对话: mode=${mode}`);
                    await loadConversationHistory('expert');
                  }}
                  onCollapse={() => setHistoryVisible(false)}
                  hideModeSwitch={true} // 隐藏模式切换按钮
                />
              </div>
            )}
          </>
        )}

        {/* 中间消息区域 */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Agent状态栏 */}
          {currentAgentStatus && (
            <CurrentAgentStatusBar 
              status={currentAgentStatus}
              onClose={() => setCurrentAgentStatus(null)}
            />
          )}

          {/* 消息列表 - 占满整个区域 */}
          <div 
            ref={messagesRef}
            className="absolute inset-0 overflow-y-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-orange-50"
          >
            <MessageList
              key={currentSessionId || 'no-session'}
              messages={messages}
              loading={isLoading}
              onMessageAction={(action, messageId) => {
                console.log('消息操作:', action, messageId);
                // TODO: 实现消息操作
              }}
              onImagePreview={(image, title, desc) => {
                setImagePreview(true, image, title, desc);
              }}
              currentMode={currentMode}
            />
          </div>

          {/* 浮动输入框 */}
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
            onMobileSourceOpen={() => setMobileSourceDrawerVisible(true)}
            searchKnowledge={searchKnowledge}
            searchGraph={searchGraph}
            retrievalMode={retrievalMode}
            enableTranslation={enableTranslation}
            onSearchKnowledgeChange={handleKnowledgeToggle}
            onSearchGraphChange={handleGraphToggle}
            onRetrievalModeChange={setRetrievalMode}
            onTranslationChange={setEnableTranslation}
            chatSettings={chatSettings}
            currentMode={currentMode} // 传递当前模式
            onModeChange={handleModeChange} // 传递模式切换处理函数
            hideModeSwitch={true} // 隐藏模式切换标签
          />
        </div>

        {/* 桌面端来源面板 */}
        {!isMobile && isSourceVisible && (
          <div className="w-80 bg-white border-l flex flex-col">
            <SourcePanel />
          </div>
        )}
      </div>

      {/* 移动端抽屉 */}
      {isMobile && (
        <>
          {/* 历史抽屉 */}
          <Drawer
            title="历史对话"
            placement="left"
            open={isMobileHistoryDrawerVisible}
            onClose={() => setMobileHistoryDrawerVisible(false)}
            width="85vw"
          >
            <HistoryPanel 
              conversations={conversations || []}
              currentConversationId={currentConversationId}
              onSelectConversation={loadConversation}
              onNewConversation={createNewConversation}
              onDeleteConversation={async (id) => {
                try {
                  console.log(`🗑️ [SingleAgentPage-移动版] 开始删除对话: ${id}`);
                  
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
                    
                    console.log(`🎯 [SingleAgentPage-移动版] 删除当前对话，下一个聚焦对话: ${nextConversationId}`);
                  }
                  
                  // 调用后端删除API
                  await qaService.deleteConversation(id);
                  
                  // 🔥 只从前端列表中移除对话，保持列表顺序，不触发整体刷新
                  const currentConversations = useQAStore.getState().conversations;
                  if (Array.isArray(currentConversations)) {
                    const updatedConversations = currentConversations.filter(conv => conv.id !== id);
                    setConversations(updatedConversations);
                    console.log(`✅ [SingleAgentPage-移动版] 已从列表中移除对话: ${id}, 剩余${updatedConversations.length}个对话`);
                  }
                  
                  // 只有删除当前选中的对话时，才执行聚焦逻辑
                  if (isCurrentConversation) {
                    if (nextConversationId) {
                      // 如果有下一个对话，自动聚焦到下一个对话
                      await loadConversation(nextConversationId);
                    } else {
                      // 如果没有剩余对话，创建新对话
                      createNewConversation();
                    }
                  }
                  
                  console.log('✅ [SingleAgentPage-移动版] 删除对话成功:', id);
                } catch (error) {
                  console.error('❌ [SingleAgentPage-移动版] 删除对话失败:', error);
                }
              }}
              mode="expert" // 固定为专家模式
              onModeChange={() => {}} // 不允许切换模式
              onLoadConversationsByMode={async (mode) => {
                console.log(`📱 [SingleAgentPage] HistoryPanel(移动版)请求加载对话: mode=${mode}`);
                await loadConversationHistory('expert');
              }}
              onCollapse={() => setMobileHistoryDrawerVisible(false)}
              hideModeSwitch={true} // 隐藏模式切换按钮
            />
          </Drawer>

          {/* 来源抽屉 */}
          <Drawer
            title="消息来源"
            placement="right"
            open={isMobileSourceDrawerVisible}
            onClose={() => setMobileSourceDrawerVisible(false)}
            width="85vw"
          >
            <SourcePanel />
          </Drawer>
        </>
      )}

      {/* 系统设置弹窗 */}
      <SystemSettings
        visible={systemSettingsVisible}
        onClose={() => setSystemSettingsVisible(false)}
      />

      {/* 图片预览 */}
      <Modal
        open={imagePreviewVisible}
        title={currentImageTitle}
        footer={null}
        onCancel={() => setImagePreview(false)}
        width="80vw"
        style={{ maxWidth: 800 }}
        centered
      >
        {currentImage && (
          <div className="text-center">
            <img 
              src={currentImage} 
              alt={currentImageTitle}
              className="max-w-full h-auto"
            />
            {currentImageDesc && (
              <p className="mt-4 text-gray-600">{currentImageDesc}</p>
            )}
          </div>
        )}
      </Modal>

      {/* 知识源详情抽屉 */}
      <Drawer
        title="知识来源详情"
        placement="right"
        open={knowledgeSourcesDrawerVisible}
        onClose={() => setKnowledgeSourcesDrawerVisible(false)}
        width={isMobile ? "90vw" : 600}
      >
        {selectedMessageForSources && (
          <SourceViewer message={selectedMessageForSources} />
        )}
      </Drawer>

      {/* 全局Layout已经管理SSE连接，此处不再重复 */}
    </div>
  );

  return renderMainContent();
};

export default SingleAgentPage;