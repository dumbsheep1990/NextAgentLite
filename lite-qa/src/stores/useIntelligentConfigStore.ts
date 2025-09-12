/**
 * 智能配置状态管理 - 简化版Zustand Store (不使用immer)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  YoutuAgentConfig,
  MetaAgentSession,
  HybridAgentStrategy,
  ExecutionHistory,
  SystemInfo,
  ConversationMessage
} from '../services/youtuAgentService';

// 状态类型定义
interface MetaAgentState {
  sessions: MetaAgentSession[];
  currentSession: MetaAgentSession | null;
  isGenerating: boolean;
  conversationBuffer: ConversationMessage[];
}

interface AgentConfigState {
  configs: YoutuAgentConfig[];
  currentConfig: YoutuAgentConfig | null;
  isEditing: boolean;
  editingId: string | null;
  validationErrors: Record<string, string[]>;
}

interface HybridAgentStrategyState {
  availableStrategies: Record<string, HybridAgentStrategy>;
  customStrategies: HybridAgentStrategy[];
  currentStrategy: string;
  defaultStrategy: string;
  frameworkCapabilities: Record<string, any>;
}

interface SystemState {
  integrationStatus: 'connected' | 'disconnected' | 'error' | 'loading';
  systemInfo: SystemInfo | null;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: string | null;
}

interface ExecutionState {
  history: ExecutionHistory[];
  currentExecution: ExecutionHistory | null;
  isExecuting: boolean;
  streamingResults: any[];
}

interface UIState {
  activeTab: 'meta' | 'config' | 'strategy' | 'monitor';
  sidebarCollapsed: boolean;
  configWizardVisible: boolean;
  testDialogVisible: boolean;
}

// 完整状态接口
interface IntelligentConfigState {
  metaAgent: MetaAgentState;
  agentConfigs: AgentConfigState;
  strategies: HybridAgentStrategyState;
  system: SystemState;
  execution: ExecutionState;
  ui: UIState;
}

// Actions接口
interface IntelligentConfigActions {
  // 元智能体Actions
  setCurrentMetaSession: (session: MetaAgentSession | null) => void;
  addMetaSession: (session: MetaAgentSession) => void;
  updateMetaSession: (sessionId: string, updates: Partial<MetaAgentSession>) => void;
  setMetaGenerating: (isGenerating: boolean) => void;
  addConversationMessage: (message: ConversationMessage) => void;
  clearConversationBuffer: () => void;

  // Agent配置Actions
  setAgentConfigs: (configs: YoutuAgentConfig[]) => void;
  addAgentConfig: (config: YoutuAgentConfig) => void;
  updateAgentConfig: (configId: string, updates: Partial<YoutuAgentConfig>) => void;
  deleteAgentConfig: (configId: string) => void;
  setCurrentConfig: (config: YoutuAgentConfig | null) => void;
  setEditing: (isEditing: boolean, configId?: string) => void;

  // 混合策略Actions
  setAvailableStrategies: (strategies: Record<string, HybridAgentStrategy>) => void;
  addCustomStrategy: (strategy: HybridAgentStrategy) => void;
  setCurrentStrategy: (strategyName: string) => void;
  setFrameworkCapabilities: (capabilities: Record<string, any>) => void;

  // 系统Actions
  setIntegrationStatus: (status: SystemState['integrationStatus']) => void;
  setSystemInfo: (info: SystemInfo) => void;
  setHealthStatus: (status: SystemState['healthStatus']) => void;
  updateLastHealthCheck: () => void;

  // 执行Actions
  setExecutionHistory: (history: ExecutionHistory[]) => void;
  addExecutionRecord: (record: ExecutionHistory) => void;
  setCurrentExecution: (execution: ExecutionHistory | null) => void;
  setExecuting: (isExecuting: boolean) => void;
  addStreamingResult: (result: any) => void;
  clearStreamingResults: () => void;

  // UI Actions
  setActiveTab: (tab: UIState['activeTab']) => void;
  toggleSidebar: () => void;
  setConfigWizardVisible: (visible: boolean) => void;
  setTestDialogVisible: (visible: boolean) => void;

  // 重置Actions
  resetAll: () => void;
}

// 初始状态
const initialState: IntelligentConfigState = {
  metaAgent: {
    sessions: [],
    currentSession: null,
    isGenerating: false,
    conversationBuffer: []
  },
  agentConfigs: {
    configs: [],
    currentConfig: null,
    isEditing: false,
    editingId: null,
    validationErrors: {}
  },
  strategies: {
    availableStrategies: {},
    customStrategies: [],
    currentStrategy: 'intelligent_routing',
    defaultStrategy: 'intelligent_routing',
    frameworkCapabilities: {}
  },
  system: {
    integrationStatus: 'loading',
    systemInfo: null,
    healthStatus: 'unknown',
    lastHealthCheck: null
  },
  execution: {
    history: [],
    currentExecution: null,
    isExecuting: false,
    streamingResults: []
  },
  ui: {
    activeTab: 'meta',
    sidebarCollapsed: false,
    configWizardVisible: false,
    testDialogVisible: false
  }
};

// 创建Store
export const useIntelligentConfigStore = create<IntelligentConfigState & IntelligentConfigActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 元智能体Actions
      setCurrentMetaSession: (session) => 
        set((state) => ({
          ...state,
          metaAgent: {
            ...state.metaAgent,
            currentSession: session
          }
        })),

      addMetaSession: (session) =>
        set((state) => {
          const existingIndex = state.metaAgent.sessions.findIndex(s => s.session_id === session.session_id);
          const newSessions = [...state.metaAgent.sessions];
          
          if (existingIndex >= 0) {
            newSessions[existingIndex] = session;
          } else {
            newSessions.unshift(session);
          }
          
          return {
            ...state,
            metaAgent: {
              ...state.metaAgent,
              sessions: newSessions
            }
          };
        }),

      updateMetaSession: (sessionId, updates) =>
        set((state) => {
          const newSessions = state.metaAgent.sessions.map(s => 
            s.session_id === sessionId ? { ...s, ...updates } : s
          );
          
          const newCurrentSession = state.metaAgent.currentSession?.session_id === sessionId 
            ? { ...state.metaAgent.currentSession, ...updates }
            : state.metaAgent.currentSession;
          
          return {
            ...state,
            metaAgent: {
              ...state.metaAgent,
              sessions: newSessions,
              currentSession: newCurrentSession
            }
          };
        }),

      setMetaGenerating: (isGenerating) =>
        set((state) => ({
          ...state,
          metaAgent: {
            ...state.metaAgent,
            isGenerating
          }
        })),

      addConversationMessage: (message) =>
        set((state) => ({
          ...state,
          metaAgent: {
            ...state.metaAgent,
            conversationBuffer: [...state.metaAgent.conversationBuffer, message]
          }
        })),

      clearConversationBuffer: () =>
        set((state) => ({
          ...state,
          metaAgent: {
            ...state.metaAgent,
            conversationBuffer: []
          }
        })),

      // Agent配置Actions
      setAgentConfigs: (configs) =>
        set((state) => ({
          ...state,
          agentConfigs: {
            ...state.agentConfigs,
            configs
          }
        })),

      addAgentConfig: (config) =>
        set((state) => {
          const existingIndex = state.agentConfigs.configs.findIndex(c => c.id === config.id);
          const newConfigs = [...state.agentConfigs.configs];
          
          if (existingIndex >= 0) {
            newConfigs[existingIndex] = config;
          } else {
            newConfigs.unshift(config);
          }
          
          return {
            ...state,
            agentConfigs: {
              ...state.agentConfigs,
              configs: newConfigs
            }
          };
        }),

      updateAgentConfig: (configId, updates) =>
        set((state) => {
          const newConfigs = state.agentConfigs.configs.map(c => 
            c.id === configId ? { ...c, ...updates } : c
          );
          
          const newCurrentConfig = state.agentConfigs.currentConfig?.id === configId 
            ? { ...state.agentConfigs.currentConfig, ...updates }
            : state.agentConfigs.currentConfig;
          
          return {
            ...state,
            agentConfigs: {
              ...state.agentConfigs,
              configs: newConfigs,
              currentConfig: newCurrentConfig
            }
          };
        }),

      deleteAgentConfig: (configId) =>
        set((state) => ({
          ...state,
          agentConfigs: {
            ...state.agentConfigs,
            configs: state.agentConfigs.configs.filter(c => c.id !== configId),
            currentConfig: state.agentConfigs.currentConfig?.id === configId ? null : state.agentConfigs.currentConfig
          }
        })),

      setCurrentConfig: (config) =>
        set((state) => ({
          ...state,
          agentConfigs: {
            ...state.agentConfigs,
            currentConfig: config
          }
        })),

      setEditing: (isEditing, configId) =>
        set((state) => ({
          ...state,
          agentConfigs: {
            ...state.agentConfigs,
            isEditing,
            editingId: configId || null
          }
        })),

      // 混合策略Actions
      setAvailableStrategies: (strategies) =>
        set((state) => ({
          ...state,
          strategies: {
            ...state.strategies,
            availableStrategies: strategies
          }
        })),

      addCustomStrategy: (strategy) =>
        set((state) => {
          const existingIndex = state.strategies.customStrategies.findIndex(s => s.name === strategy.name);
          const newStrategies = [...state.strategies.customStrategies];
          
          if (existingIndex >= 0) {
            newStrategies[existingIndex] = strategy;
          } else {
            newStrategies.push(strategy);
          }
          
          return {
            ...state,
            strategies: {
              ...state.strategies,
              customStrategies: newStrategies
            }
          };
        }),

      setCurrentStrategy: (strategyName) =>
        set((state) => ({
          ...state,
          strategies: {
            ...state.strategies,
            currentStrategy: strategyName
          }
        })),

      setFrameworkCapabilities: (capabilities) =>
        set((state) => ({
          ...state,
          strategies: {
            ...state.strategies,
            frameworkCapabilities: capabilities
          }
        })),

      // 系统Actions
      setIntegrationStatus: (status) =>
        set((state) => ({
          ...state,
          system: {
            ...state.system,
            integrationStatus: status
          }
        })),

      setSystemInfo: (info) =>
        set((state) => ({
          ...state,
          system: {
            ...state.system,
            systemInfo: info
          }
        })),

      setHealthStatus: (status) =>
        set((state) => ({
          ...state,
          system: {
            ...state.system,
            healthStatus: status
          }
        })),

      updateLastHealthCheck: () =>
        set((state) => ({
          ...state,
          system: {
            ...state.system,
            lastHealthCheck: new Date().toISOString()
          }
        })),

      // 执行Actions
      setExecutionHistory: (history) =>
        set((state) => ({
          ...state,
          execution: {
            ...state.execution,
            history
          }
        })),

      addExecutionRecord: (record) =>
        set((state) => {
          const existingIndex = state.execution.history.findIndex(r => r.id === record.id);
          const newHistory = [...state.execution.history];
          
          if (existingIndex >= 0) {
            newHistory[existingIndex] = record;
          } else {
            newHistory.unshift(record);
          }
          
          return {
            ...state,
            execution: {
              ...state.execution,
              history: newHistory
            }
          };
        }),

      setCurrentExecution: (execution) =>
        set((state) => ({
          ...state,
          execution: {
            ...state.execution,
            currentExecution: execution
          }
        })),

      setExecuting: (isExecuting) =>
        set((state) => ({
          ...state,
          execution: {
            ...state.execution,
            isExecuting
          }
        })),

      addStreamingResult: (result) =>
        set((state) => ({
          ...state,
          execution: {
            ...state.execution,
            streamingResults: [...state.execution.streamingResults, result]
          }
        })),

      clearStreamingResults: () =>
        set((state) => ({
          ...state,
          execution: {
            ...state.execution,
            streamingResults: []
          }
        })),

      // UI Actions
      setActiveTab: (tab) =>
        set((state) => ({
          ...state,
          ui: {
            ...state.ui,
            activeTab: tab
          }
        })),

      toggleSidebar: () =>
        set((state) => ({
          ...state,
          ui: {
            ...state.ui,
            sidebarCollapsed: !state.ui.sidebarCollapsed
          }
        })),

      setConfigWizardVisible: (visible) =>
        set((state) => ({
          ...state,
          ui: {
            ...state.ui,
            configWizardVisible: visible
          }
        })),

      setTestDialogVisible: (visible) =>
        set((state) => ({
          ...state,
          ui: {
            ...state.ui,
            testDialogVisible: visible
          }
        })),

      // 重置Actions
      resetAll: () => set(initialState),
    }),
    {
      name: 'intelligent-config-storage',
      partialize: (state) => ({
        strategies: {
          currentStrategy: state.strategies.currentStrategy,
          customStrategies: state.strategies.customStrategies
        },
        ui: {
          activeTab: state.ui.activeTab,
          sidebarCollapsed: state.ui.sidebarCollapsed
        }
      })
    }
  )
);

// 选择器 - 为组件提供优化的状态选择
export const useMetaAgentSelector = () => {
  return useIntelligentConfigStore(state => state.metaAgent);
};

export const useAgentConfigSelector = () => {
  return useIntelligentConfigStore(state => state.agentConfigs);
};

export const useStrategySelector = () => {
  return useIntelligentConfigStore(state => state.strategies);
};

export const useSystemSelector = () => {
  return useIntelligentConfigStore(state => state.system);
};

export const useExecutionSelector = () => {
  return useIntelligentConfigStore(state => state.execution);
};

export const useUISelector = () => {
  return useIntelligentConfigStore(state => state.ui);
};

// 复合选择器
export const useIntegrationReady = () => {
  return useIntelligentConfigStore(state => 
    state.system.integrationStatus === 'connected' && 
    state.system.healthStatus === 'healthy'
  );
};

export const useCurrentEditingConfig = () => {
  return useIntelligentConfigStore(state => {
    if (state.agentConfigs.editingId) {
      return state.agentConfigs.configs.find(c => c.id === state.agentConfigs.editingId);
    }
    return state.agentConfigs.currentConfig;
  });
};