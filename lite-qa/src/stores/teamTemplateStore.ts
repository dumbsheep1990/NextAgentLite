/**
 * NextAgent Lite 团队模板状态管理
 * 使用Zustand管理团队模板相关状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { teamTemplateService, TeamTemplate, TeamInstance, ExecutionModeInfo, AgentConfig } from '../services/teamTemplateService';

interface TeamTemplateState {
  // 状态数据
  templates: TeamTemplate[];
  currentTemplate: TeamTemplate | null;
  currentInstance: TeamInstance | null;
  executionModes: ExecutionModeInfo | null;
  templateAgents: Record<string, AgentConfig> | null;
  
  // 加载状态
  loading: {
    templates: boolean;
    template: boolean;
    instance: boolean;
    modes: boolean;
    agents: boolean;
  };
  
  // 错误状态
  errors: {
    templates: string | null;
    template: string | null;
    instance: string | null;
    modes: string | null;
    agents: string | null;
  };
  
  // 缓存状态
  lastUpdated: {
    templates: number | null;
    modes: number | null;
  };
  
  // Actions
  loadTemplates: () => Promise<void>;
  loadTemplate: (templateId: string) => Promise<void>;
  loadTemplateAgents: (templateId: string) => Promise<void>;
  loadExecutionModes: () => Promise<void>;
  createInstance: (templateId: string, executionMode?: string) => Promise<TeamInstance | null>;
  getInstance: (instanceKey: string) => Promise<void>;
  cleanupInstances: () => Promise<void>;
  clearErrors: () => void;
  clearCurrentTemplate: () => void;
  clearCurrentInstance: () => void;
}

export const useTeamTemplateStore = create<TeamTemplateState>()(
  persist(
    (set, get) => ({
      // 初始状态
      templates: [],
      currentTemplate: null,
      currentInstance: null,
      executionModes: null,
      templateAgents: null,
      
      loading: {
        templates: false,
        template: false,
        instance: false,
        modes: false,
        agents: false,
      },
      
      errors: {
        templates: null,
        template: null,
        instance: null,
        modes: null,
        agents: null,
      },
      
      lastUpdated: {
        templates: null,
        modes: null,
      },
      
      // Actions实现
      loadTemplates: async () => {
        const state = get();
        
        // 检查缓存（5分钟有效期）
        const now = Date.now();
        if (state.lastUpdated.templates && 
            now - state.lastUpdated.templates < 5 * 60 * 1000 && 
            state.templates.length > 0) {
          return;
        }
        
        set(state => ({
          loading: { ...state.loading, templates: true },
          errors: { ...state.errors, templates: null }
        }));
        
        try {
          const templates = await teamTemplateService.getAllTemplates();
          set(state => ({
            templates,
            loading: { ...state.loading, templates: false },
            lastUpdated: { ...state.lastUpdated, templates: now }
          }));
        } catch (error) {
          console.error('加载团队模板失败:', error);
          set(state => ({
            loading: { ...state.loading, templates: false },
            errors: { 
              ...state.errors, 
              templates: error instanceof Error ? error.message : '加载团队模板失败' 
            }
          }));
        }
      },
      
      loadTemplate: async (templateId: string) => {
        set(state => ({
          loading: { ...state.loading, template: true },
          errors: { ...state.errors, template: null }
        }));
        
        try {
          const template = await teamTemplateService.getTemplate(templateId);
          set(state => ({
            currentTemplate: template,
            loading: { ...state.loading, template: false }
          }));
        } catch (error) {
          console.error('加载团队模板失败:', error);
          set(state => ({
            loading: { ...state.loading, template: false },
            errors: { 
              ...state.errors, 
              template: error instanceof Error ? error.message : '加载团队模板失败' 
            }
          }));
        }
      },
      
      loadTemplateAgents: async (templateId: string) => {
        set(state => ({
          loading: { ...state.loading, agents: true },
          errors: { ...state.errors, agents: null }
        }));
        
        try {
          const agents = await teamTemplateService.getTemplateAgents(templateId);
          set(state => ({
            templateAgents: agents,
            loading: { ...state.loading, agents: false }
          }));
        } catch (error) {
          console.error('加载智能体配置失败:', error);
          set(state => ({
            loading: { ...state.loading, agents: false },
            errors: { 
              ...state.errors, 
              agents: error instanceof Error ? error.message : '加载智能体配置失败' 
            }
          }));
        }
      },
      
      loadExecutionModes: async () => {
        const state = get();
        
        // 检查缓存（10分钟有效期）
        const now = Date.now();
        if (state.lastUpdated.modes && 
            now - state.lastUpdated.modes < 10 * 60 * 1000 && 
            state.executionModes) {
          return;
        }
        
        set(state => ({
          loading: { ...state.loading, modes: true },
          errors: { ...state.errors, modes: null }
        }));
        
        try {
          const modes = await teamTemplateService.getExecutionModes();
          set(state => ({
            executionModes: modes,
            loading: { ...state.loading, modes: false },
            lastUpdated: { ...state.lastUpdated, modes: now }
          }));
        } catch (error) {
          console.error('加载执行模式失败:', error);
          set(state => ({
            loading: { ...state.loading, modes: false },
            errors: { 
              ...state.errors, 
              modes: error instanceof Error ? error.message : '加载执行模式失败' 
            }
          }));
        }
      },
      
      createInstance: async (templateId: string, executionMode?: string): Promise<TeamInstance | null> => {
        set(state => ({
          loading: { ...state.loading, instance: true },
          errors: { ...state.errors, instance: null }
        }));
        
        try {
          const instance = await teamTemplateService.createTeamInstance({
            template_id: templateId,
            execution_mode: executionMode
          });
          
          set(state => ({
            currentInstance: instance,
            loading: { ...state.loading, instance: false }
          }));
          
          return instance;
        } catch (error) {
          console.error('创建团队实例失败:', error);
          set(state => ({
            loading: { ...state.loading, instance: false },
            errors: { 
              ...state.errors, 
              instance: error instanceof Error ? error.message : '创建团队实例失败' 
            }
          }));
          return null;
        }
      },
      
      getInstance: async (instanceKey: string) => {
        set(state => ({
          loading: { ...state.loading, instance: true },
          errors: { ...state.errors, instance: null }
        }));
        
        try {
          const instance = await teamTemplateService.getTeamInstance(instanceKey);
          set(state => ({
            currentInstance: instance,
            loading: { ...state.loading, instance: false }
          }));
        } catch (error) {
          console.error('获取团队实例失败:', error);
          set(state => ({
            loading: { ...state.loading, instance: false },
            errors: { 
              ...state.errors, 
              instance: error instanceof Error ? error.message : '获取团队实例失败' 
            }
          }));
        }
      },
      
      cleanupInstances: async () => {
        try {
          await teamTemplateService.cleanupInstances();
          console.log('实例清理完成');
        } catch (error) {
          console.error('清理实例失败:', error);
        }
      },
      
      clearErrors: () => {
        set(state => ({
          errors: {
            templates: null,
            template: null,
            instance: null,
            modes: null,
            agents: null,
          }
        }));
      },
      
      clearCurrentTemplate: () => {
        set(state => ({
          currentTemplate: null,
          templateAgents: null
        }));
      },
      
      clearCurrentInstance: () => {
        set(state => ({
          currentInstance: null
        }));
      },
    }),
    {
      name: 'nextagent-team-template-store',
      // 只持久化必要的数据
      partialize: (state) => ({
        templates: state.templates,
        executionModes: state.executionModes,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);