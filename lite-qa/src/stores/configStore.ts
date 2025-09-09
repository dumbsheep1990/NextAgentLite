/**
 * 配置状态管理 - 全局配置状态和变更追踪
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { configAdapter, type FrontendConfig, type BackendConfig } from '../services/configAdapter';
import { configValidationService, type ValidationResult, type ConfigValidationReport } from '../services/configValidation';
import { bffService } from '../services/bffService';

export interface ConfigState {
  // 当前配置状态
  currentConfig: FrontendConfig;
  backendConfig: BackendConfig;
  
  // 验证结果
  validationReport: ConfigValidationReport | null;
  validationInProgress: boolean;
  
  // 变更追踪
  hasUnsavedChanges: boolean;
  lastSavedConfig: FrontendConfig;
  changeHistory: Array<{
    timestamp: string;
    section: string;
    field: string;
    oldValue: any;
    newValue: any;
    user?: string;
  }>;
  
  // 配置状态
  configScore: number;
  configHealth: 'healthy' | 'warning' | 'error';
  lastValidation: string | null;
  lastSync: string | null;
  
  // 加载状态
  loading: boolean;
  saving: boolean;
  syncing: boolean;
  
  // Actions
  loadConfig: () => Promise<void>;
  updateConfig: (field: string, value: any, section?: string) => void;
  validateConfig: (config?: FrontendConfig) => Promise<ConfigValidationReport>;
  saveConfig: (sections?: string[]) => Promise<boolean>;
  resetConfig: (section?: string) => Promise<void>;
  syncWithBackend: () => Promise<void>;
  
  // 配置历史管理
  getConfigHistory: (section?: string) => Promise<void>;
  rollbackToVersion: (backupFile: string, section: string) => Promise<boolean>;
  
  // 配置模板
  getAvailableTemplates: () => Promise<void>;
  applyTemplate: (templateName: string, customizations?: Record<string, any>) => Promise<boolean>;
  
  // 实用工具
  exportConfig: (sections?: string[]) => Promise<{ config: any; metadata: any }>;
  importConfig: (configData: any, options?: { overwrite?: boolean; validate?: boolean }) => Promise<boolean>;
  getConfigDiff: (otherConfig: FrontendConfig) => Array<{ field: string; current: any; other: any }>;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentConfig: {},
      backendConfig: {},
      validationReport: null,
      validationInProgress: false,
      hasUnsavedChanges: false,
      lastSavedConfig: {},
      changeHistory: [],
      configScore: 0,
      configHealth: 'healthy',
      lastValidation: null,
      lastSync: null,
      loading: false,
      saving: false,
      syncing: false,

      // 加载配置
      loadConfig: async () => {
        try {
          set({ loading: true });
          
          // 获取系统配置
          const systemConfig = await bffService.getSystemConfig();
          
          // 转换为前端格式
          const frontendConfig = configAdapter.backendToFrontend({
            models: systemConfig.sections.find(s => s.name === 'models')?.settings,
            database: systemConfig.sections.find(s => s.name === 'database')?.settings,
            vectorization: systemConfig.sections.find(s => s.name === 'vectorization')?.settings,
            system: systemConfig.sections.find(s => s.name === 'system')?.settings,
            storage: systemConfig.sections.find(s => s.name === 'storage')?.settings,
            knowledge_graph: systemConfig.sections.find(s => s.name === 'knowledge_graph')?.settings
          });

          set({
            currentConfig: frontendConfig,
            lastSavedConfig: { ...frontendConfig },
            backendConfig: configAdapter.frontendToBackend(frontendConfig),
            hasUnsavedChanges: false,
            lastSync: new Date().toISOString()
          });

          // 自动验证加载的配置
          get().validateConfig(frontendConfig);
          
        } catch (error) {
          console.error('加载配置失败:', error);
          set({ configHealth: 'error' });
        } finally {
          set({ loading: false });
        }
      },

      // 更新配置字段
      updateConfig: (field: string, value: any, section?: string) => {
        const state = get();
        const oldValue = (state.currentConfig as any)[field];
        
        // 记录变更历史
        const changeRecord = {
          timestamp: new Date().toISOString(),
          section: section || 'unknown',
          field,
          oldValue,
          newValue: value
        };

        set({
          currentConfig: {
            ...state.currentConfig,
            [field]: value
          },
          hasUnsavedChanges: true,
          changeHistory: [changeRecord, ...state.changeHistory.slice(0, 99)] // 保留最近100条记录
        });

        // 触发实时验证
        const updatedConfig = { ...state.currentConfig, [field]: value };
        get().validateConfig(updatedConfig);
      },

      // 验证配置
      validateConfig: async (config?: FrontendConfig) => {
        try {
          set({ validationInProgress: true });
          
          const configToValidate = config || get().currentConfig;
          const validationReport = configValidationService.validateConfiguration(configToValidate);
          
          // 计算配置健康状态
          const errorCount = validationReport.results.filter(r => r.severity === 'error').length;
          const warningCount = validationReport.results.filter(r => r.severity === 'warning').length;
          
          let configHealth: 'healthy' | 'warning' | 'error' = 'healthy';
          if (errorCount > 0) {
            configHealth = 'error';
          } else if (warningCount > 0) {
            configHealth = 'warning';
          }

          set({
            validationReport,
            configScore: validationReport.score,
            configHealth,
            lastValidation: new Date().toISOString()
          });

          return validationReport;
        } catch (error) {
          console.error('配置验证失败:', error);
          set({ configHealth: 'error' });
          throw error;
        } finally {
          set({ validationInProgress: false });
        }
      },

      // 保存配置
      saveConfig: async (sections?: string[]) => {
        try {
          set({ saving: true });
          
          const state = get();
          const configToSave = state.currentConfig;
          
          // 先验证配置
          const validation = await get().validateConfig(configToSave);
          if (!validation.valid) {
            throw new Error('配置验证失败，请修复错误后再保存');
          }

          // 转换为后端格式并分组
          const backendConfigs = configAdapter.groupConfigBySections(configToSave);
          
          // 筛选要保存的段落
          const configsToSave = sections 
            ? Object.fromEntries(sections.map(s => [s, backendConfigs[s]]).filter(([_, v]) => v))
            : backendConfigs;
          
          // 构建批量更新请求
          const batchConfigs = Object.entries(configsToSave).map(([section, settings]) => ({
            section,
            settings,
            restartServices: false
          }));

          // 执行批量保存
          const result = await bffService.batchUpdateConfigs(batchConfigs);
          
          if (result.success) {
            set({
              lastSavedConfig: { ...configToSave },
              hasUnsavedChanges: false,
              lastSync: new Date().toISOString()
            });
            return true;
          } else {
            const failedSections = result.results.filter(r => !r.success);
            throw new Error(`部分配置保存失败: ${failedSections.map(r => r.section).join(', ')}`);
          }

        } catch (error) {
          console.error('保存配置失败:', error);
          throw error;
        } finally {
          set({ saving: false });
        }
      },

      // 重置配置
      resetConfig: async (section?: string) => {
        try {
          if (section) {
            // 重置特定段落
            const result = await bffService.resetConfigSection(section);
            if (result.success) {
              await get().loadConfig(); // 重新加载配置
            }
          } else {
            // 重置所有配置为默认值
            const defaultConfig = configAdapter.getDefaultValues();
            set({
              currentConfig: defaultConfig,
              hasUnsavedChanges: true
            });
            await get().validateConfig(defaultConfig);
          }
        } catch (error) {
          console.error('重置配置失败:', error);
          throw error;
        }
      },

      // 同步后端配置
      syncWithBackend: async () => {
        try {
          set({ syncing: true });
          await get().loadConfig();
        } catch (error) {
          console.error('同步后端配置失败:', error);
          throw error;
        } finally {
          set({ syncing: false });
        }
      },

      // 获取配置历史
      getConfigHistory: async (section?: string) => {
        try {
          const history = await bffService.getConfigHistory(section, 20);
          // 这里可以将历史记录合并到本地状态中
          // console.log('配置历史:', history);
        } catch (error) {
          console.error('获取配置历史失败:', error);
        }
      },

      // 回滚到指定版本
      rollbackToVersion: async (backupFile: string, section: string) => {
        try {
          const result = await bffService.rollbackConfig(section, backupFile);
          if (result.success) {
            await get().loadConfig(); // 重新加载配置
            return true;
          }
          return false;
        } catch (error) {
          console.error('配置回滚失败:', error);
          return false;
        }
      },

      // 获取可用模板
      getAvailableTemplates: async () => {
        try {
          const templates = await bffService.getConfigTemplates();
          // console.log('可用配置模板:', templates);
        } catch (error) {
          console.error('获取配置模板失败:', error);
        }
      },

      // 应用配置模板
      applyTemplate: async (templateName: string, customizations?: Record<string, any>) => {
        try {
          const result = await bffService.applyConfigTemplate(templateName, customizations);
          if (result.success) {
            await get().loadConfig(); // 重新加载配置
            return true;
          }
          return false;
        } catch (error) {
          console.error('应用配置模板失败:', error);
          return false;
        }
      },

      // 导出配置
      exportConfig: async (sections?: string[]) => {
        try {
          return await bffService.exportSystemConfig(sections);
        } catch (error) {
          console.error('导出配置失败:', error);
          throw error;
        }
      },

      // 导入配置
      importConfig: async (configData: any, options?: { overwrite?: boolean; validate?: boolean }) => {
        try {
          const result = await bffService.importSystemConfig(configData, options);
          if (result.success) {
            await get().loadConfig(); // 重新加载配置
            return true;
          }
          return false;
        } catch (error) {
          console.error('导入配置失败:', error);
          return false;
        }
      },

      // 获取配置差异
      getConfigDiff: (otherConfig: FrontendConfig) => {
        const currentConfig = get().currentConfig;
        const differences: Array<{ field: string; current: any; other: any }> = [];

        // 比较所有字段
        const allFields = new Set([
          ...Object.keys(currentConfig),
          ...Object.keys(otherConfig)
        ]);

        for (const field of allFields) {
          const currentValue = (currentConfig as any)[field];
          const otherValue = (otherConfig as any)[field];
          
          if (JSON.stringify(currentValue) !== JSON.stringify(otherValue)) {
            differences.push({
              field,
              current: currentValue,
              other: otherValue
            });
          }
        }

        return differences;
      }
    }),
    {
      name: 'mat-qa-config-store',
      // 只持久化部分状态
      partialize: (state) => ({
        currentConfig: state.currentConfig,
        lastSavedConfig: state.lastSavedConfig,
        changeHistory: state.changeHistory.slice(0, 20), // 只保存最近20条变更记录
        configScore: state.configScore,
        configHealth: state.configHealth,
        lastValidation: state.lastValidation,
        lastSync: state.lastSync
      })
    }
  )
);

// 配置状态 Hook 便捷导出
export const useConfigValidation = () => {
  const store = useConfigStore();
  return {
    validationReport: store.validationReport,
    validationInProgress: store.validationInProgress,
    configScore: store.configScore,
    configHealth: store.configHealth,
    validateConfig: store.validateConfig
  };
};

export const useConfigChanges = () => {
  const store = useConfigStore();
  return {
    hasUnsavedChanges: store.hasUnsavedChanges,
    changeHistory: store.changeHistory,
    updateConfig: store.updateConfig,
    saveConfig: store.saveConfig,
    resetConfig: store.resetConfig
  };
};

export const useConfigSync = () => {
  const store = useConfigStore();
  return {
    loading: store.loading,
    saving: store.saving,
    syncing: store.syncing,
    lastSync: store.lastSync,
    loadConfig: store.loadConfig,
    syncWithBackend: store.syncWithBackend
  };
};