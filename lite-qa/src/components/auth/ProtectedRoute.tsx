/**
 * 受保护的路由组件
 */
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useGlobalResourceStore } from '../../stores/globalResourceStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, checkAuthStatus } = useAuthStore();
  const { isInitialized, initializeResources } = useGlobalResourceStore();
  const location = useLocation();

  useEffect(() => {
    // 检查认证状态
    checkAuthStatus();
    
    // 如果已认证但资源未初始化，则初始化资源
    if (isAuthenticated && !isInitialized) {
      initializeResources().catch(error => {
        console.error('资源初始化失败:', error);
      });
    }
  }, [isAuthenticated, isInitialized, checkAuthStatus, initializeResources]);

  if (!isAuthenticated) {
    // 保存当前路径，登录后可以跳转回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;