/**
 * 团队执行状态管理 - 全局管理团队执行流程状态
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface ExecutionTask {
  id: string;
  agentName: string;
  agentType: 'coordinator' | 'translator' | 'retriever' | 'analyzer' | 'synthesizer';
  taskName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  startTime?: number;
  endTime?: number;
  progress: number;
  confidence?: number;
  errorMessage?: string;
  reasoning?: string;
  dependencies?: string[];
}

interface ExecutionPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  tasks: ExecutionTask[];
  startTime?: number;
  endTime?: number;
}

interface TeamExecutionState {
  executionId: string;
  teamName: string;
  query: string;
  phases: ExecutionPhase[];
  totalProgress: number;
  remainingTasks: number;
  isActive: boolean;
  startTime: number;
  currentPhase?: string;
  timeoutWarnings: number;
  lastActivity: number;
}

interface TeamExecutionStore {
  // 状态
  currentExecution: TeamExecutionState | null;
  executionHistory: TeamExecutionState[];
  drawerVisible: boolean;
  
  // 操作
  startExecution: (executionData: Omit<TeamExecutionState, 'isActive' | 'startTime' | 'lastActivity'>) => void;
  updateExecution: (updates: Partial<TeamExecutionState>) => void;
  updateTask: (taskId: string, updates: Partial<ExecutionTask>) => void;
  updatePhase: (phaseId: string, updates: Partial<ExecutionPhase>) => void;
  completeExecution: () => void;
  terminateExecution: () => void;
  addTimeoutWarning: () => void;
  updateLastActivity: () => void;
  
  // 抽屉控制
  openDrawer: () => void;
  closeDrawer: () => void;
  
  // 辅助方法
  getExecutionStats: () => {
    total: number;
    completed: number;
    running: number;
    failed: number;
    timeout: number;
    pending: number;
  };
  
  getCurrentPhase: () => ExecutionPhase | null;
  getRunningTasks: () => ExecutionTask[];
  
  // 清理方法
  clearCurrentExecution: () => void;
  clearHistory: () => void;
}

export const useTeamExecutionStore = create<TeamExecutionStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    currentExecution: null,
    executionHistory: [],
    drawerVisible: false,
    
    // 开始新的执行
    startExecution: (executionData) => {
      const newExecution: TeamExecutionState = {
        ...executionData,
        isActive: true,
        startTime: Date.now(),
        lastActivity: Date.now(),
        timeoutWarnings: 0
      };
      
      set({ currentExecution: newExecution });
      
      console.log('[TEAM_EXECUTION] 开始新的执行:', newExecution.executionId);
    },
    
    // 更新执行状态
    updateExecution: (updates) => {
      const current = get().currentExecution;
      if (!current) return;
      
      const updatedExecution = {
        ...current,
        ...updates,
        lastActivity: Date.now()
      };
      
      set({ currentExecution: updatedExecution });
      
      console.log('[TEAM_EXECUTION] 更新执行状态:', updates);
    },
    
    // 更新特定任务
    updateTask: (taskId, updates) => {
      const current = get().currentExecution;
      if (!current) return;
      
      const updatedPhases = current.phases.map(phase => ({
        ...phase,
        tasks: phase.tasks.map(task => 
          task.id === taskId 
            ? { ...task, ...updates }
            : task
        )
      }));
      
      // 重新计算总进度
      const allTasks = updatedPhases.flatMap(phase => phase.tasks);
      const completedTasks = allTasks.filter(task => task.status === 'completed');
      const totalProgress = allTasks.length > 0 
        ? Math.round((completedTasks.length / allTasks.length) * 100)
        : 0;
      
      const remainingTasks = allTasks.filter(task => 
        task.status === 'pending' || task.status === 'running'
      ).length;
      
      set({
        currentExecution: {
          ...current,
          phases: updatedPhases,
          totalProgress,
          remainingTasks,
          lastActivity: Date.now()
        }
      });
      
      console.log('[TEAM_EXECUTION] 更新任务状态:', taskId, updates);
    },
    
    // 更新特定阶段
    updatePhase: (phaseId, updates) => {
      const current = get().currentExecution;
      if (!current) return;
      
      const updatedPhases = current.phases.map(phase => 
        phase.id === phaseId 
          ? { ...phase, ...updates }
          : phase
      );
      
      set({
        currentExecution: {
          ...current,
          phases: updatedPhases,
          lastActivity: Date.now()
        }
      });
      
      console.log('[TEAM_EXECUTION] 更新阶段状态:', phaseId, updates);
    },
    
    // 完成执行
    completeExecution: () => {
      const current = get().currentExecution;
      if (!current) return;
      
      const completedExecution = {
        ...current,
        isActive: false,
        totalProgress: 100,
        remainingTasks: 0
      };
      
      set({
        currentExecution: completedExecution,
        executionHistory: [...get().executionHistory, completedExecution]
      });
      
      console.log('[TEAM_EXECUTION] 执行完成:', completedExecution.executionId);
    },
    
    // 终止执行
    terminateExecution: () => {
      const current = get().currentExecution;
      if (!current) return;
      
      const terminatedExecution = {
        ...current,
        isActive: false
      };
      
      set({
        currentExecution: terminatedExecution,
        executionHistory: [...get().executionHistory, terminatedExecution]
      });
      
      console.log('[TEAM_EXECUTION] 执行已终止:', terminatedExecution.executionId);
    },
    
    // 添加超时警告
    addTimeoutWarning: () => {
      const current = get().currentExecution;
      if (!current) return;
      
      set({
        currentExecution: {
          ...current,
          timeoutWarnings: current.timeoutWarnings + 1,
          lastActivity: Date.now()
        }
      });
      
      console.log('[TEAM_EXECUTION] 添加超时警告:', current.timeoutWarnings + 1);
    },
    
    // 更新最后活动时间
    updateLastActivity: () => {
      const current = get().currentExecution;
      if (!current) return;
      
      set({
        currentExecution: {
          ...current,
          lastActivity: Date.now()
        }
      });
    },
    
    // 打开抽屉
    openDrawer: () => {
      set({ drawerVisible: true });
      console.log('[TEAM_EXECUTION] 打开执行流程抽屉');
    },
    
    // 关闭抽屉
    closeDrawer: () => {
      set({ drawerVisible: false });
      console.log('[TEAM_EXECUTION] 关闭执行流程抽屉');
    },
    
    // 获取执行统计
    getExecutionStats: () => {
      const current = get().currentExecution;
      if (!current) {
        return { total: 0, completed: 0, running: 0, failed: 0, timeout: 0, pending: 0 };
      }
      
      const allTasks = current.phases.flatMap(phase => phase.tasks);
      return {
        total: allTasks.length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        running: allTasks.filter(t => t.status === 'running').length,
        failed: allTasks.filter(t => t.status === 'failed').length,
        timeout: allTasks.filter(t => t.status === 'timeout').length,
        pending: allTasks.filter(t => t.status === 'pending').length
      };
    },
    
    // 获取当前阶段
    getCurrentPhase: () => {
      const current = get().currentExecution;
      if (!current || !current.currentPhase) return null;
      
      return current.phases.find(phase => phase.id === current.currentPhase) || null;
    },
    
    // 获取运行中的任务
    getRunningTasks: () => {
      const current = get().currentExecution;
      if (!current) return [];
      
      return current.phases.flatMap(phase => 
        phase.tasks.filter(task => task.status === 'running')
      );
    },
    
    // 清理当前执行
    clearCurrentExecution: () => {
      set({ currentExecution: null });
      console.log('[TEAM_EXECUTION] 清理当前执行状态');
    },
    
    // 清理历史记录
    clearHistory: () => {
      set({ executionHistory: [] });
      console.log('[TEAM_EXECUTION] 清理执行历史');
    }
  }))
);

// 导出类型
export type { ExecutionTask, ExecutionPhase, TeamExecutionState };