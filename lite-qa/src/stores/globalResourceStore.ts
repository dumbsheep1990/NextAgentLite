/**
 * 全局资源状态管理 - 管理需要在系统启动时预加载的资源
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChunkingConfig } from '../services/chunkingConfigService';
import type { ModelConfig, VectorConfig } from '../types';
import { chunkingConfigService } from '../services/chunkingConfigService';
import { knowledgeService } from '../services/knowledgeService';

interface GlobalResourceState {
  // 资源状态
  isInitialized: boolean;
  isLoading: boolean;
  loadErrors: Record<string, string>;
  
  // 切分配置
  chunkingConfigs: ChunkingConfig[];
  defaultChunkingConfig: ChunkingConfig | null;
  
  // 模型配置
  modelConfigs: ModelConfig[];
  embeddingModels: ModelConfig[];
  chatModels: ModelConfig[];
  
  // 向量配置
  vectorConfig: VectorConfig | null;
  
  // 系统配置
  systemConfig: any;
  
  // Actions
  initializeResources: () => Promise<void>;
  refreshChunkingConfigs: () => Promise<void>;
  refreshModelConfigs: () => Promise<void>;
  refreshVectorConfig: () => Promise<void>;
  refreshSystemConfig: () => Promise<void>;
  setLoadError: (resource: string, error: string) => void;
  clearLoadError: (resource: string) => void;
  
  // Getters
  getChunkingConfigById: (id: string) => ChunkingConfig | undefined;
  getDefaultChunkingConfig: () => ChunkingConfig | null;
  getModelById: (id: string) => ModelConfig | undefined;
  isResourceLoaded: (resource: string) => boolean;
}

export const useGlobalResourceStore = create<GlobalResourceState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      isInitialized: false,
      isLoading: false,
      loadErrors: {},
      
      chunkingConfigs: [],
      defaultChunkingConfig: null,
      
      modelConfigs: [],
      embeddingModels: [],
      chatModels: [],
      
      vectorConfig: null,
      systemConfig: null,

      // 初始化所有资源
      initializeResources: async () => {
        const state = get();
        if (state.isLoading) {
          return;
        }

        // 重置状态，清空之前的错误，允许重试
        set({ isLoading: true, loadErrors: {}, isInitialized: false });
        
        try {
          console.log('🚀 开始初始化全局资源...');
          
          // 并行加载所有资源
          const promises = [
            get().refreshChunkingConfigs(),
            get().refreshModelConfigs(),
            get().refreshVectorConfig(),
            get().refreshSystemConfig()
          ];
          
          // 使用 Promise.allSettled 确保即使某些资源加载失败，其他资源仍能加载
          const results = await Promise.allSettled(promises);
          
          // 检查加载结果
          const resourceNames = ['切分配置', '模型配置', '向量配置', '系统配置'];
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.warn(`❌ ${resourceNames[index]}加载失败:`, result.reason);
              get().setLoadError(resourceNames[index], result.reason?.message || '加载失败');
            } else {
              console.log(`✅ ${resourceNames[index]}加载成功`);
              // 清除该资源的错误状态
              get().clearLoadError(resourceNames[index]);
            }
          });
          
          // 检查是否还有错误，如果所有资源都加载成功，确保错误状态被清空
          const hasAnyErrors = results.some(result => result.status === 'rejected');
          if (!hasAnyErrors) {
            set({ loadErrors: {} }); // 确保没有残留的错误状态
          }
          
          set({ isInitialized: true });
          console.log('✅ 全局资源初始化完成');
          
        } catch (error) {
          console.error('❌ 全局资源初始化失败:', error);
          set({ loadErrors: { ...get().loadErrors, 'global': '全局资源初始化失败' } });
        } finally {
          set({ isLoading: false });
        }
      },

      // 刷新切分配置
      refreshChunkingConfigs: async () => {
        try {
          console.log('📋 加载切分配置...');
          
          // 尝试从后端API加载，如果失败则使用服务提供的默认配置
          try {
            // 并行获取所有配置和默认配置
            const [configs, defaultConfig] = await Promise.all([
              chunkingConfigService.getAllConfigs(),
              chunkingConfigService.getDefaultConfig()
            ]);
            
            set({
              chunkingConfigs: configs,
              defaultChunkingConfig: defaultConfig
            });
            
            console.log(`✅ 切分配置加载完成: ${configs.length} 个配置`);
          } catch (apiError) {
            // API失败时，抛出错误而不是使用硬编码配置
            console.error('❌ 切分配置API失败:', apiError);
            const errorMessage = apiError instanceof Error ? apiError.message : '网络错误';
            throw new Error(`无法获取切分配置: ${errorMessage}`);
          }
          
          get().clearLoadError('切分配置');
          
        } catch (error) {
          console.error('❌ 切分配置加载失败:', error);
          get().setLoadError('切分配置', error instanceof Error ? error.message : '加载失败');
          throw error;
        }
      },

      // 刷新模型配置
      refreshModelConfigs: async () => {
        try {
          console.log('🤖 加载模型配置...');
          
          const configs = await knowledgeService.getModelConfigs();
          
          const embeddingModels = configs.filter(m => m.type === 'embedding');
          const chatModels = configs.filter(m => m.type === 'chat');
          
          set({
            modelConfigs: configs,
            embeddingModels,
            chatModels
          });
          
          get().clearLoadError('模型配置');
          console.log(`✅ 模型配置加载完成: ${configs.length} 个模型 (${embeddingModels.length} 个嵌入模型, ${chatModels.length} 个对话模型)`);
          
        } catch (error) {
          console.error('❌ 模型配置加载失败:', error);
          get().setLoadError('模型配置', error instanceof Error ? error.message : '加载失败');
          throw error;
        }
      },

      // 刷新向量配置
      refreshVectorConfig: async () => {
        try {
          console.log('🔗 加载向量配置...');
          
          const config = await knowledgeService.getVectorConfig();
          
          set({ vectorConfig: config });
          
          get().clearLoadError('向量配置');
          console.log('✅ 向量配置加载完成');
          
        } catch (error) {
          console.error('❌ 向量配置加载失败:', error);
          get().setLoadError('向量配置', error instanceof Error ? error.message : '加载失败');
          throw error;
        }
      },

      // 刷新系统配置
      refreshSystemConfig: async () => {
        try {
          console.log('⚙️ 加载系统配置...');
          
          // 动态导入系统配置服务
          const { systemConfigService } = await import('../services/systemConfigService');
          const config = await systemConfigService.getSystemConfig();
          
          set({ systemConfig: config });
          
          get().clearLoadError('系统配置');
          console.log('✅ 系统配置加载完成');
          
        } catch (error) {
          console.error('❌ 系统配置加载失败:', error);
          get().setLoadError('系统配置', error instanceof Error ? error.message : '加载失败');
          throw error;
        }
      },

      // 设置加载错误
      setLoadError: (resource, error) => {
        set(state => ({
          loadErrors: { ...state.loadErrors, [resource]: error }
        }));
      },

      // 清除加载错误
      clearLoadError: (resource) => {
        set(state => {
          const newErrors = { ...state.loadErrors };
          delete newErrors[resource];
          return { loadErrors: newErrors };
        });
      },

      // Getters
      getChunkingConfigById: (id) => {
        const configs = get().chunkingConfigs;
        const found = configs.find(config => config.id === id);
        if (process.env.NODE_ENV === 'development' && !found && id) {
          console.log('🔍 getChunkingConfigById 未找到配置:', {
            searchId: id,
            availableConfigs: configs.map(c => ({ id: c.id, name: c.name }))
          });
        }
        return found;
      },

      getDefaultChunkingConfig: () => {
        const state = get();
        return state.defaultChunkingConfig || 
               state.chunkingConfigs.find(config => config.isDefault) || 
               state.chunkingConfigs[0] || 
               null;
      },

      getModelById: (id) => {
        return get().modelConfigs.find(model => model.id === id);
      },

      isResourceLoaded: (resource) => {
        const state = get();
        switch (resource) {
          case '切分配置':
            return state.chunkingConfigs.length > 0;
          case '模型配置':
            return state.modelConfigs.length > 0;
          case '向量配置':
            return state.vectorConfig !== null;
          case '系统配置':
            return state.systemConfig !== null;
          default:
            return false;
        }
      }
    }),
    { name: 'global-resource-store' }
  )
);