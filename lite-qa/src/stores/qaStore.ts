/**
 * QA问答状态管理 - 使用zustand
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { qaService } from '../services/qaService';
import { useAuthStore } from './authStore';
import type { 
  Message, 
  HistoryConversation, 
  QARequest, 
  QAResponse,
  AgentInfo 
} from '../types';

interface QAState {
  // 当前会话信息
  currentSessionId: string | null;
  
  // 消息列表
  messages: Message[];
  
  // 历史对话列表
  conversations: HistoryConversation[];
  
  // UI状态
  isLoading: boolean;
  isHistoryVisible: boolean;
  isSourceVisible: boolean;
  isMobileHistoryDrawerVisible: boolean;
  isMobileSourceDrawerVisible: boolean;
  
  // 输入状态
  inputValue: string;
  
  // 智能体信息
  availableAgents: AgentInfo[];
  selectedAgent: string | null;
  
  // 加载状态 - 防止重复API调用
  agentsLoading: boolean;
  conversationsLoading: boolean;
  messagesLoading: boolean;
  agentsInitialized: boolean;
  conversationsInitialized: boolean;
  
  // 分页状态
  conversationsPagination: {
    currentPage: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  
  // 图片预览
  imagePreviewVisible: boolean;
  currentImage: string;
  currentImageTitle: string;
  currentImageDesc: string;
  
  // Actions - 状态重置
  resetAllState: () => void;
  
  // Actions
  setCurrentSessionId: (sessionId: string | null) => void;
  setMessages: (messages: Message[] | ((prevMessages: Message[]) => Message[])) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  
  setConversations: (conversations: HistoryConversation[]) => void;
  addConversation: (conversation: HistoryConversation) => void;
  updateConversation: (id: string, updates: Partial<HistoryConversation>) => void;
  setActiveConversation: (id: string) => void;
  updateCurrentConversationFromMessage: (userMessage: string, aiResponse: string) => void;
  
  setLoading: (loading: boolean) => void;
  setMessagesLoading: (loading: boolean) => void;
  setHistoryVisible: (visible: boolean) => void;
  setSourceVisible: (visible: boolean) => void;
  setMobileHistoryDrawerVisible: (visible: boolean) => void;
  setMobileSourceDrawerVisible: (visible: boolean) => void;
  
  setInputValue: (value: string) => void;
  
  setAvailableAgents: (agents: AgentInfo[]) => void;
  setSelectedAgent: (agent: string | null) => void;
  
  setImagePreview: (visible: boolean, image?: string, title?: string, desc?: string) => void;
  
  // 复合操作
  sendMessage: (question: string) => Promise<void>;
  createNewConversation: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  clearCurrentConversation: () => void;
  initializeAgents: () => Promise<void>;
  loadConversationHistory: (mode?: 'expert' | 'team') => Promise<void>;
  forceReloadConversationHistory: (mode?: 'expert' | 'team') => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  createBlankConversation: () => HistoryConversation;
  createBlankTeamConversation: () => HistoryConversation;
}

// 移除本地历史数据 - 所有历史对话都从数据库获取

const mockAgents: AgentInfo[] = [
  {
    id: 'cailiao_zhuanjia',
    name: '问答专家',
    type: 'agent',
    description: '智能问答专家，专注于问题解答',
    icon: 'ExperimentOutlined', // 实验图标
    color: '#1890ff', // 蓝色
    models: [
      { id: 'kimi-k2-siliconflow', name: 'Kimi K2 SiliconFlow', description: 'Moonshot Kimi大模型' },
      { id: 'qwen3-235b-a22b-instruct-2507', name: 'Qwen3 235B A22B Instruct', description: '阿里通义千问3代模型' },
      { id: 'qwen-plus-latest', name: 'Qwen Plus Latest', description: '通义千问Plus模型' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'OpenAI GPT模型' },
      { id: 'gemini-2.5-flash-preview-thinking', name: 'Gemini 2.5 Flash Preview', description: 'Google Gemini模型' }
    ],
    defaultModel: 'qwen3-30b-a3b-instruct-2507'
  },
  {
    id: 'wenxian_jiansuozhuanjia',
    name: '文献检索专家',
    type: 'agent',
    description: '文献检索专家，擅长论文搜索和分析',
    icon: 'FileSearchOutlined', // 文件搜索图标
    color: '#52c41a', // 绿色
    models: [
      { id: 'kimi-k2-siliconflow', name: 'Kimi K2 SiliconFlow', description: 'Moonshot Kimi大模型' },
      { id: 'qwen3-235b-a22b-instruct-2507', name: 'Qwen3 235B A22B Instruct', description: '阿里通义千问3代模型' },
      { id: 'gemini-2.5-flash-preview-thinking', name: 'Gemini 2.5 Flash Preview', description: 'Google Gemini模型' }
    ],
    defaultModel: 'qwen3-30b-a3b-instruct-2507'
  },
  {
    id: 'shuju_fenxizhuanjia',
    name: '数据分析专家',
    type: 'agent',
    description: '数据分析专家，专门处理实验数据',
    icon: 'BarChartOutlined', // 图表图标
    color: '#fa8c16', // 橙色
    models: [
      { id: 'kimi-k2-siliconflow', name: 'Kimi K2 SiliconFlow', description: 'Moonshot Kimi大模型' },
      { id: 'qwen3-235b-a22b-instruct-2507', name: 'Qwen3 235B A22B Instruct', description: '阿里通义千问3代模型' },
      { id: 'qwen-plus-latest', name: 'Qwen Plus Latest', description: '通义千问Plus模型' }
    ],
    defaultModel: 'qwen3-30b-a3b-instruct-2507'
  },
  {
    id: 'dijuwu_wendatuandui',
    name: '通用多语言问答团队',
    type: 'team',
    description: '多智能体协作团队，提供全面的通用知识解答',
    icon: 'TeamOutlined', // 团队图标
    color: '#722ed1', // 紫色
    models: [
      { id: 'kimi-k2-siliconflow', name: 'Kimi K2 SiliconFlow', description: 'Moonshot Kimi大模型' },
      { id: 'qwen3-235b-a22b-instruct-2507', name: 'Qwen3 235B A22B Instruct', description: '阿里通义千问3代模型' },
      { id: 'qwen-plus-latest', name: 'Qwen Plus Latest', description: '通义千问Plus模型' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'OpenAI GPT模型' },
      { id: 'gemini-2.5-flash-preview-thinking', name: 'Gemini 2.5 Flash Preview', description: 'Google Gemini模型' }
    ],
    defaultModel: 'qwen3-30b-a3b-instruct-2507'
  }
];

export const useQAStore = create<QAState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      currentSessionId: null, // 初始时没有会话，等待loadConversationHistory创建
      messages: [],
      conversations: [], // 初始时为空，等待loadConversationHistory加载或创建
      isLoading: false,
      isHistoryVisible: true,
      isSourceVisible: false,
      isMobileHistoryDrawerVisible: false,
      isMobileSourceDrawerVisible: false,
      inputValue: '',
      availableAgents: mockAgents,
      selectedAgent: 'cailiao_zhuanjia', // 默认选择材料专家（对应后端qa_agent）
      agentsLoading: false,
      conversationsLoading: false,
      messagesLoading: false,
      agentsInitialized: false,
      conversationsInitialized: false,
      conversationsPagination: {
        currentPage: 1,
        pageSize: 20,
        total: 0,
        hasMore: false
      },
      imagePreviewVisible: false,
      currentImage: '',
      currentImageTitle: '',
      currentImageDesc: '',

      // 状态重置
      resetAllState: () => {
        set({
          currentSessionId: null,
          messages: [],
          conversations: [],
          isLoading: false,
          isHistoryVisible: true,
          isSourceVisible: false,
          isMobileHistoryDrawerVisible: false,
          isMobileSourceDrawerVisible: false,
          inputValue: '',
          availableAgents: mockAgents,
          selectedAgent: 'cailiao_zhuanjia',
          agentsLoading: false,
          conversationsLoading: false,
          messagesLoading: false,
          agentsInitialized: false,
          conversationsInitialized: false,
          conversationsPagination: {
            currentPage: 1,
            pageSize: 20,
            total: 0,
            hasMore: false
          },
          imagePreviewVisible: false,
          currentImage: '',
          currentImageTitle: '',
          currentImageDesc: ''
        });
        console.log('💬 QA Store 状态已重置');
      },

      // 基础状态设置
      setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),
      
      setMessages: (messages) => set((state) => ({
        messages: typeof messages === 'function' ? messages(state.messages) : messages
      })),
      
      addMessage: (message) => set((state) => ({
        messages: [...(Array.isArray(state.messages) ? state.messages : []), message]
      })),
      
      updateMessage: (id, updates) => set((state) => ({
        messages: (Array.isArray(state.messages) ? state.messages : []).map(msg => 
          msg.id === id ? { ...msg, ...updates } : msg
        )
      })),
      
      deleteMessage: (id) => set((state) => ({
        messages: (Array.isArray(state.messages) ? state.messages : []).filter(msg => msg.id !== id)
      })),
      
      setConversations: (conversations) => set({ conversations }),
      
      addConversation: (conversation) => set((state) => ({
        conversations: [conversation, ...state.conversations]
      })),
      
      updateConversation: (id, updates) => set((state) => ({
        conversations: state.conversations.map(conv => 
          conv.id === id ? { ...conv, ...updates } : conv
        )
      })),
      
      setActiveConversation: (id) => set((state) => ({
        conversations: state.conversations.map(conv => ({
          ...conv
        }))
      })),

      updateCurrentConversationFromMessage: (userMessage: string, aiResponse: string) => {
        const state = get();
        const currentConvId = state.currentSessionId; // 直接使用，不需要移除前缀
        if (!currentConvId) return;

        const currentConv = state.conversations.find(conv => conv.id === currentConvId);
        if (currentConv && (!currentConv.title || currentConv.messageCount === 0)) {
          // 直接使用第一个问题作为对话标题
          const generateTitle = (question: string): string => {
            return question.trim();
          };

          const updates: Partial<HistoryConversation> = {
            title: generateTitle(userMessage),
            lastMessage: aiResponse.length > 100 ? aiResponse.substring(0, 100) + '...' : aiResponse,
            messageCount: (currentConv.messageCount || 0) + 2, // 用户消息 + AI回复
            time: new Date().toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          };
          
          // 更新对话信息
          state.updateConversation(currentConvId, updates);
          
          // 更新后重新按时间排序
          const sortedConversations = state.conversations.sort((a, b) => {
            const timeA = new Date(a.time).getTime();
            const timeB = new Date(b.time).getTime();
            return timeB - timeA; // 倒序排列，最新的在前
          });
          
          state.setConversations(sortedConversations);
        }
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      setMessagesLoading: (loading) => set({ messagesLoading: loading }),
      setHistoryVisible: (visible) => set({ isHistoryVisible: visible }),
      setSourceVisible: (visible) => set({ isSourceVisible: visible }),
      setMobileHistoryDrawerVisible: (visible) => set({ isMobileHistoryDrawerVisible: visible }),
      setMobileSourceDrawerVisible: (visible) => set({ isMobileSourceDrawerVisible: visible }),
      
      setInputValue: (value) => set({ inputValue: value }),
      
      setAvailableAgents: (agents) => set({ availableAgents: agents }),
      setSelectedAgent: (agent) => set({ selectedAgent: agent }),
      
      setImagePreview: (visible, image = '', title = '', desc = '') => set({
        imagePreviewVisible: visible,
        currentImage: image,
        currentImageTitle: title,
        currentImageDesc: desc
      }),

      // 复合操作
      sendMessage: async (question: string) => {
        const state = get();
        
        // 添加用户消息
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: question,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        state.addMessage(userMessage);
        state.setInputValue('');
        state.setLoading(true);
        
        try {
          // 这里将调用API服务
          // 暂时使用模拟数据
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `关于"${question}"的回答：\n\n这是一个专业问题。AI将为您提供详细的解答和分析。`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          
          state.addMessage(aiMessage);
          
        } catch (error) {
          // Message sending failed
        } finally {
          state.setLoading(false);
        }
      },
      
      createNewConversation: () => {
        const state = get();
        
        // 检查是否已经有未使用的空白对话
        const existingBlankConversation = state.conversations.find(conv => 
          !conv.title && conv.messageCount === 0
        );
        
        if (existingBlankConversation) {
          // 如果已有空白对话，直接切换到它
          state.setCurrentSessionId(existingBlankConversation.id);
          state.setMessages([]);
          console.log(`切换到现有空白对话: ${existingBlankConversation.id}`);
          return;
        }
        
        const newConversation = state.createBlankConversation();
        
        // 将新对话添加到列表顶部
        const updatedConversations = [newConversation, ...state.conversations];
        
        state.setConversations(updatedConversations);
        
        // 选中新对话
        state.setCurrentSessionId(newConversation.id);
        
        // 清空当前消息列表
        state.setMessages([]);
        
        console.log(`创建新对话: ${newConversation.id}`);
      },
      
      loadConversation: async (conversationId: string) => {
        const state = get();
        state.setActiveConversation(conversationId);
        state.setCurrentSessionId(conversationId); // 直接使用session_id，不需要加前缀
        
        // 🔥 关键修复：立即清空当前消息，防止显示旧对话内容
        state.setMessages([]);
        
        // 检查是否是空白对话（messageCount为0的对话）
        const conversation = state.conversations.find(conv => conv.id === conversationId);
        if (conversation && conversation.messageCount === 0) {
          // 空白对话直接显示空消息列表，不需要从后端加载
          console.log(`加载空白对话: ${conversationId}，跳过数据库查询`);
          return;
        }
        
        // 加载具体的对话消息
        try {
          state.setMessagesLoading(true);
          const messages = await qaService.getConversationMessages(conversationId);
          state.setMessages(messages);
          console.log(`成功加载对话消息: ${conversationId}，消息数量: ${messages.length}`);
        } catch (error) {
          console.error(`加载对话消息失败: ${conversationId}`, error);
          // 如果是404错误且是新创建的对话，直接显示空列表
          if (error instanceof Error && error.message.includes('404')) {
            console.log(`对话不存在于数据库中，显示空消息列表: ${conversationId}`);
            state.setMessages([]);
          } else {
            // 其他错误也清空消息列表
            state.setMessages([]);
          }
        } finally {
          state.setMessagesLoading(false);
        }
      },
      
      clearCurrentConversation: () => {
        set({ messages: [] });
      },

      // 初始化智能体列表 - 防止重复调用
      initializeAgents: async () => {
        const state = get();
        if (state.agentsLoading || state.agentsInitialized) return;
        
        set({ agentsLoading: true });
        try {
          const agents = await qaService.getAvailableAgents();
          set({ 
            availableAgents: agents,
            agentsInitialized: true,
            agentsLoading: false
          });
          
          // 如果没有选中的智能体，则设置默认选择（优先选择问答专家）
          const currentState = get();
          if (!currentState.selectedAgent && agents.length > 0) {
            const defaultAgent = agents.find(agent => agent.id === 'cailiao_zhuanjia') || agents[0];
            set({ selectedAgent: defaultAgent.id });
          }
        } catch (error) {
          // 使用模拟数据作为备选
          set({ 
            availableAgents: mockAgents, 
            selectedAgent: 'cailiao_zhuanjia',
            agentsInitialized: true,
            agentsLoading: false
          });
        }
      },

      // 加载对话历史 - 防止重复调用
      loadConversationHistory: async (mode?: 'expert' | 'team') => {
        const state = get();
        if (state.conversationsLoading) {
          console.log('[QAStore] 对话历史正在加载中，跳过重复请求');
          return;
        }
        
        set({ conversationsLoading: true });
        
        try {
          console.log('[QAStore] 开始加载对话历史...', { mode });
          // 获取当前用户ID
          const currentUser = useAuthStore.getState().user;
          const userId = currentUser?.id;
          
          // 🔧 修复：正确处理mode参数，传递用户ID
          const response = await qaService.getConversationHistory(userId, 1, 20, mode);
          console.log(`📊 [QAStore] API返回的对话数量: ${response.conversations.length}, 总数: ${response.total}`);
          
          // 对历史对话按时间倒序排列（最新的在前）
          const sortedConversations = response.conversations.sort((a, b) => {
            const timeA = new Date(a.time).getTime();
            const timeB = new Date(b.time).getTime();
            return timeB - timeA; // 倒序排列
          });
          
          console.log(`🔄 [QAStore] 排序后的对话列表:`, sortedConversations.map(c => `${c.id}(${c.messageCount}条消息)`).join(', '));
          
          // 检查是否已有对应模式的空白对话，没有的话创建一个
          let finalConversations = [...sortedConversations];
          let defaultSessionId = '';
          
          const existingBlankConversation = sortedConversations.find(conv => {
            // 检查空白对话且模式匹配
            if (!conv.title && conv.messageCount === 0) {
              const convMode = conv.conversation_mode || 'expert';
              const targetMode = mode || 'expert';
              return convMode === targetMode;
            }
            return false;
          });
          
          if (existingBlankConversation) {
            // 使用现有的同模式空白对话
            defaultSessionId = existingBlankConversation.id;
            console.log(`🔄 使用现有${mode || 'expert'}模式空白对话: ${defaultSessionId}`);
          } else {
            // 创建对应模式的新空白对话
            const newConversation = mode === 'team' 
              ? get().createBlankTeamConversation()
              : get().createBlankConversation();
            finalConversations = [newConversation, ...sortedConversations];
            defaultSessionId = newConversation.id;
            console.log(`🆕 创建新${mode || 'expert'}模式空白对话: ${defaultSessionId}`);
          }
          
          set({ 
            conversations: finalConversations,
            currentSessionId: defaultSessionId,
            conversationsInitialized: true,
            conversationsLoading: false,
            conversationsPagination: {
              currentPage: response.page,
              pageSize: response.size,
              total: response.total,
              hasMore: response.hasMore
            }
          });
          
          console.log(`✅ 加载对话历史完成: ${response.conversations.length}个历史对话, 当前对话ID: ${defaultSessionId}, 分页信息: ${response.page}/${Math.ceil(response.total / response.size)}`);
        } catch (error) {
          console.error('❌ 加载对话历史失败:', error);
          
          // API失败时，检查当前是否已有对话
          const currentState = get();
          let finalConversations = [...currentState.conversations];
          let defaultSessionId = currentState.currentSessionId;
          
          if (finalConversations.length === 0) {
            // 如果没有任何对话，根据模式创建一个新的
            const newConversation = mode === 'team' 
              ? get().createBlankTeamConversation()
              : get().createBlankConversation();
            finalConversations = [newConversation];
            defaultSessionId = newConversation.id;
          }
          
          set({ 
            conversations: finalConversations,
            currentSessionId: defaultSessionId,
            conversationsInitialized: false, // 不标记为已初始化，允许重试
            conversationsLoading: false
          });
          
          console.log(`⚠️ API失败，使用现有对话: ${defaultSessionId}，可以稍后重试加载历史记录`);
        }
      },

      // 强制重新加载对话历史（删除对话后使用）
      forceReloadConversationHistory: async (mode?: 'expert' | 'team') => {
        console.log(`🔄 [QAStore] 强制重新加载对话历史, mode: ${mode}`);
        // 重置初始化状态，强制重新加载
        set({ 
          conversationsInitialized: false, 
          conversationsLoading: false,
          conversationsPagination: {
            currentPage: 1,
            pageSize: 20,
            total: 0,
            hasMore: false
          }
        });
        await get().loadConversationHistory(mode);
        console.log(`✅ [QAStore] 强制重新加载完成`);
      },

      // 加载更多对话历史
      loadMoreConversations: async () => {
        const state = get();
        
        // 如果正在加载或没有更多数据，直接返回
        if (state.conversationsLoading || !state.conversationsPagination.hasMore) {
          console.log('[QAStore] 跳过加载更多对话 - 正在加载或无更多数据');
          return;
        }

        set({ conversationsLoading: true });

        try {
          const nextPage = state.conversationsPagination.currentPage + 1;
          console.log(`[QAStore] 加载第${nextPage}页对话历史...`);
          
          // 获取当前用户ID
          const currentUser = useAuthStore.getState().user;
          const userId = currentUser?.id;
          
          const response = await qaService.getConversationHistory(userId, nextPage, state.conversationsPagination.pageSize);
          
          // 对新获取的对话按时间倒序排列
          const sortedNewConversations = response.conversations.sort((a, b) => {
            const timeA = new Date(a.time).getTime();
            const timeB = new Date(b.time).getTime();
            return timeB - timeA;
          });

          // 合并到现有对话列表
          const updatedConversations = [...state.conversations, ...sortedNewConversations];

          set({
            conversations: updatedConversations,
            conversationsLoading: false,
            conversationsPagination: {
              currentPage: response.page,
              pageSize: response.size,
              total: response.total,
              hasMore: response.hasMore
            }
          });

          console.log(`✅ 加载更多对话完成: 新增${response.conversations.length}个对话, 总计${updatedConversations.length}个对话`);
        } catch (error) {
          console.error('❌ 加载更多对话失败:', error);
          set({ conversationsLoading: false });
        }
      },

      // 创建空白对话的辅助方法
      createBlankConversation: (): HistoryConversation => {
        // 生成与后端一致的session_id格式
        const uuid = () => Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        const sessionId = `session_${uuid()}${uuid()}_${timestamp}`;
        
        return {
          id: sessionId,
          title: '',  // 空标题，让后端根据第一条消息自动生成
          lastMessage: '',
          time: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          messageCount: 0,
          conversation_mode: 'expert',  // 明确标记为专家模式
          mode_display_name: '专家模式'
        };
      },

      // 创建空白团队对话的辅助方法
      createBlankTeamConversation: (): HistoryConversation => {
        // 生成与后端一致的session_id格式
        const uuid = () => Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        const sessionId = `session_${uuid()}${uuid()}_${timestamp}`;
        
        return {
          id: sessionId,
          title: '',  // 空标题，让后端根据第一条消息自动生成
          lastMessage: '',
          time: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          messageCount: 0,
          conversation_mode: 'team',  // 明确标记为团队模式
          mode_display_name: 'Team模式'
        };
      },

      // 重置所有状态（删除重复定义）
    }),
    { name: 'qa-store' }
  )
);

// 添加事件监听器，响应全局清理事件
if (typeof window !== 'undefined') {
  window.addEventListener('clear-all-stores', () => {
    console.log('🔄 QA Store 收到清理事件');
    useQAStore.getState().resetAllState();
  });
} 