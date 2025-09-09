/**
 * 认证状态管理
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: number;
  username: string;
  role: string;
  displayName: string;
}

interface AuthState {
  isAuthenticated: boolean;
  loginTime: string | null;
  user: AuthUser | null;
  
  // Actions
  login: (id: number, username: string, role: string, displayName: string) => void;
  logout: () => void;
  checkAuthStatus: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      loginTime: null,
      user: null,

      login: (id: number, username: string, role: string, displayName: string) => {
        const loginTime = new Date().toISOString();
        
        // 🔥 调试：检查用户登录参数
        console.log('[AUTH_STORE] 🔍 登录参数:', { id, username, role, displayName, idType: typeof id });
        
        set({
          isAuthenticated: true,
          loginTime,
          user: {
            id,
            username,
            role,
            displayName
          }
        });
        
        // 🔥 调试：检查保存后的状态
        const state = get();
        console.log('[AUTH_STORE] 🔍 保存后的用户状态:', state.user);
      },

      logout: () => {
        set({
          isAuthenticated: false,
          loginTime: null,
          user: null
        });
        // 清除本地存储
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('loginTime');
      },

      checkAuthStatus: () => {
        const { isAuthenticated, loginTime } = get();
        
        if (!isAuthenticated || !loginTime) {
          return false;
        }

        // 检查登录是否过期（24小时）
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          get().logout();
          return false;
        }

        return true;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        loginTime: state.loginTime,
        user: state.user
      })
    }
  )
);

// 导出类型
export type { AuthUser };