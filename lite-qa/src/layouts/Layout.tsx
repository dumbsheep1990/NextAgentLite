/**
 * 主布局组件 - 包含侧边栏导航和内容区域
 */
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Space, Tooltip } from 'antd';
import {
  MessageOutlined,
  TeamOutlined,
  BookOutlined,
  NodeIndexOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  AndroidOutlined,
  BulbOutlined,
  DashboardOutlined,
  ToolOutlined,
  RadarChartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  GlobalOutlined,
  UploadOutlined,
  PlusOutlined,
  ExportOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  MenuFoldOutlined,
  HomeOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  ExperimentOutlined,
  MonitorOutlined,
  ReloadOutlined,
  RightOutlined,
  AppstoreOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  UnorderedListOutlined,
  BranchesOutlined,
  ControlOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { useAppStore } from '../stores/appStore';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import { useAuthStore } from '../stores/authStore';
import { routes } from '../routes';
import type { MenuProps } from 'antd';
import ResourceStatusIndicator from '../components/common/ResourceStatusIndicator';
import { SSEStatusIndicator } from '../components/common';
import { SSEConnectionManager } from '../components/knowledge/SSEConnectionManager';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

const { Header, Sider, Content } = AntLayout;

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 侧边栏收起状态 - 首页默认展开，对话页面才折叠
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  
  // 菜单展开状态
  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    // 根据当前路径初始化展开状态
    if (location.pathname.startsWith('/app/knowledge')) {
      return ['/app/knowledge'];
    } else if (location.pathname.startsWith('/app/agent-management')) {
      return ['/app/intelligent'];
    } else if (location.pathname.startsWith('/app/agent-config') || location.pathname.startsWith('/app/dag-strategy')) {
      return ['/app/scene-management'];
    } else if (location.pathname.startsWith('/app/agent')) {
      return ['/app/agent'];
    } else if (location.pathname.startsWith('/app/intelligent')) {
      return ['/app/intelligent'];
    }
    return [];
  });
  
  // 生成会话ID
  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem('mat-session-id');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('mat-session-id', id);
    }
    return id;
  });
  
  const { 
    preferences, 
    toggleTheme, 
    toggleLanguage 
  } = useAppStore();

  // 认证相关状态和操作
  const { user, logout } = useAuthStore();

  // 知识库相关状态和操作
  const { setUploadModalVisible } = useKnowledgeStore();

  // 面包屑导航
  const { breadcrumbs } = useBreadcrumb();

  // 监听路径变化，自动更新菜单展开状态
  useEffect(() => {
    if (location.pathname.startsWith('/app/knowledge')) {
      setOpenKeys(['/app/knowledge']);
    } else if (location.pathname.startsWith('/app/agent-management')) {
      setOpenKeys(['/app/intelligent']);
    } else if (location.pathname.startsWith('/app/agent-config') || location.pathname.startsWith('/app/dag-strategy')) {
      setOpenKeys(['/app/scene-management']);
    } else if (location.pathname.startsWith('/app/agent')) {
      setOpenKeys(['/app/agent']);
    } else if (location.pathname.startsWith('/app/intelligent')) {
      setOpenKeys(['/app/intelligent']);
    } else {
      setOpenKeys([]);
    }
  }, [location.pathname]);

  // 监听智能体页面路径变化，自动折叠侧边栏
  useEffect(() => {
    if (location.pathname.startsWith('/app/agent/single') || 
        location.pathname.startsWith('/app/agent/team')) {
      setSiderCollapsed(true);
    }
  }, [location.pathname]);

  // 监听自动折叠侧边栏事件
  useEffect(() => {
    const handleCollapseSidebar = () => {
      setSiderCollapsed(true);
    };
    
    window.addEventListener('collapse-sidebar', handleCollapseSidebar);
    
    return () => {
      window.removeEventListener('collapse-sidebar', handleCollapseSidebar);
    };
  }, []);

  // 导航菜单项 - 基础菜单，不在这里处理折叠状态
  const menuItems: MenuProps['items'] = routes.map(route => {
    if (route.children) {
      // 有子菜单的导航项
      return {
        key: route.path,
        icon: getIcon(route.icon),
        label: route.name,
        children: route.children.map(child => ({
          key: child.path,
          icon: getIcon(child.icon),
          label: child.name,
          onClick: () => {
            // 如果是智能体相关页面，自动折叠侧边栏
            if (child.path.startsWith('/app/agent/')) {
              setSiderCollapsed(true);
            }
            
            // 如果当前在知识库页面，强制页面刷新
            if (location.pathname.startsWith('/app/knowledge')) {
              window.location.href = child.path;
            } else {
              navigate(child.path);
            }
          }
        }))
      };
    } else {
      // 普通导航项
      return {
        key: route.path,
        icon: getIcon(route.icon),
        label: route.name,
        onClick: () => {
          // 如果当前在知识库页面，强制页面刷新
          if (location.pathname.startsWith('/app/knowledge')) {
            window.location.href = route.path;
          } else {
            navigate(route.path);
          }
        }
      };
    }
  });

  // 清理缓存功能
  const handleClearCache = async () => {
    try {
      console.log('🧹 开始清理前端缓存和状态...');
      
      // 1. 清理localStorage中的任务相关数据
      const localKeys = Object.keys(localStorage);
      const taskKeys = localKeys.filter(key => 
        key.includes('task') || 
        key.includes('session') || 
        key.includes('knowledge') || 
        key.includes('qa') || 
        key.includes('conversation') ||
        key.includes('polling') ||
        key.includes('document') ||
        key.includes('store') ||
        key.startsWith('mat-') // 项目特定前缀
      );
      
      console.log('🎯 清理localStorage键:', taskKeys);
      taskKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // 2. 清理sessionStorage中的任务相关数据  
      const sessionKeys = Object.keys(sessionStorage);
      const sessionTaskKeys = sessionKeys.filter(key => 
        key.includes('task') || 
        key.includes('session') || 
        key.includes('knowledge') || 
        key.includes('qa') ||
        key.includes('polling') ||
        key.includes('document')
      );
      
      console.log('🎯 清理sessionStorage键:', sessionTaskKeys);
      sessionTaskKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });

      // 3. 重置所有Store状态
      window.dispatchEvent(new CustomEvent('clear-all-stores'));
      
      // 4. 停止所有定时器（清除轮询）
      const timerId = setTimeout(function() {}, 0);
      clearTimeout(timerId);
      // 清除可能存在的其他定时器
      for (let i = 1; i < 10000; i++) {
        clearTimeout(i);
        clearInterval(i);
      }
      
      console.log('✅ 前端缓存清理完成');
      
      // 延迟1秒后刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('缓存清理失败:', error);
    }
  };

  // 用户菜单 - 现代化设计
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'theme',
      label: (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            {preferences.theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937', lineHeight: '1.3' }}>
              {preferences.theme === 'light' ? '切换到深色主题' : '切换到浅色主题'}
            </div>
          </div>
        </div>
      ),
      onClick: toggleTheme
    },
    {
      type: 'divider'
    },
    {
      key: 'language',
      label: (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            <GlobalOutlined />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937', lineHeight: '1.3' }}>
              {preferences.language === 'zh' ? 'Switch to English' : '切换到中文'}
            </div>
          </div>
        </div>
      ),
      onClick: toggleLanguage
    },
    {
      type: 'divider'
    },
    {
      key: 'clear-cache',
      label: (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97706',
            fontSize: '16px'
          }}>
            <DeleteOutlined />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#d97706', lineHeight: '1.3' }}>
              清理缓存
            </div>
          </div>
        </div>
      ),
      onClick: handleClearCache
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc2626',
            fontSize: '16px'
          }}>
            <LogoutOutlined />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#dc2626', lineHeight: '1.3' }}>
              退出登录
            </div>
          </div>
        </div>
      ),
      onClick: () => {
        logout();
        navigate('/login');
      }
    }
  ];

  return (
    <>
      <AntLayout style={{ minHeight: '100vh' }}>
        {/* 侧边栏 */}
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={siderCollapsed}
          width={240}
          collapsedWidth={64}
          style={{
            background: '#ffffff',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)',
            borderRight: '1px solid rgba(148, 163, 184, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            height: '100vh'
          }}
        >
        {/* 侧边栏背景装饰 - 暂时隐藏 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'transparent',
          pointerEvents: 'none'
        }} />
        
        {/* Logo区域 */}
        <div style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: siderCollapsed ? 'center' : 'flex-start',
          padding: siderCollapsed ? '0' : '0 24px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
          background: '#f8fafc',
          position: 'relative',
          zIndex: 1
        }}>
          <img 
            src="/zz-logo-1.png" 
            alt="NextAgent Logo" 
            style={{
              width: '40px',
              height: '40px'
            }}
          />
          {!siderCollapsed && (
            <div style={{ marginLeft: '16px', color: '#1e293b' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#1e293b'
              }}>
                NextAgentLite
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#64748b',
                marginTop: '2px'
              }}>
                智能体应用平台
              </div>
            </div>
          )}
        </div>

        {/* 导航菜单 */}
        <div style={{ 
          padding: siderCollapsed ? '24px 0' : '24px 16px', 
          position: 'relative', 
          zIndex: 1 
        }}>
          {siderCollapsed ? (
            // 折叠状态：自定义菜单项带悬浮效果
            <div className="collapsed-menu">
              {routes.map(route => (
                <div key={route.path} className="collapsed-menu-item">
                  {route.children ? (
                    // 有子菜单的项目
                    <Dropdown
                      overlay={
                        <div style={{
                          background: 'white',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          padding: '8px 0',
                          minWidth: '160px'
                        }}>
                          {route.children.map(child => (
                            <div
                              key={child.path}
                              onClick={() => {
                                // 如果是智能体相关页面，确保保持折叠状态
                                if (child.path.startsWith('/app/agent/')) {
                                  setSiderCollapsed(true);
                                }
                                navigate(child.path);
                              }}
                              style={{
                                padding: '8px 16px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                color: '#1f2937',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              {getIcon(child.icon)}
                              <span>{child.name}</span>
                            </div>
                          ))}
                        </div>
                      }
                      placement="rightTop"
                      trigger={['hover']}
                      overlayStyle={{ zIndex: 9999 }}
                      mouseEnterDelay={0.3}
                    >
                      <div 
                        className={`collapsed-icon ${location.pathname.startsWith(route.path) ? 'selected' : ''}`}
                        style={{
                          width: '40px',
                          height: '40px',
                          margin: '8px auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {getIcon(route.icon)}
                      </div>
                    </Dropdown>
                  ) : (
                    // 普通菜单项
                    <Tooltip title={route.name} placement="right" mouseEnterDelay={0.3}>
                      <div 
                        className={`collapsed-icon ${location.pathname === route.path ? 'selected' : ''}`}
                        onClick={() => navigate(route.path)}
                        style={{
                          width: '40px',
                          height: '40px',
                          margin: '8px auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {getIcon(route.icon)}
                      </div>
                    </Tooltip>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // 展开状态：正常的Menu组件
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              openKeys={openKeys}
              onOpenChange={(keys) => setOpenKeys(keys)}
              items={menuItems}
              style={{ 
                border: 'none',
                background: 'transparent'
              }}
              className="sidebar-menu"
            />
          )}
        </div>

        {/* 侧边栏底部系统设置卡片 */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: siderCollapsed ? '0' : '16px',
          right: siderCollapsed ? '0' : '16px',
          zIndex: 1,
          ...(siderCollapsed ? {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          } : {})
        }}>
          {siderCollapsed ? (
            // 折叠状态：精致的圆形设置按钮，与Logo一致的渐变背景
            <Tooltip title="系统设置" placement="right" overlayStyle={{ zIndex: 9999 }}>
              <Button
                type="text"
                icon={<SettingOutlined />}
                onClick={() => {
                  // 发送打开系统设置事件
                  window.dispatchEvent(new CustomEvent('open-system-settings'));
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
                  border: 'none',
                  borderRadius: '50%',
                  color: 'white',
                  fontSize: '16px',
                  boxShadow: '0 4px 16px rgba(0, 201, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className="system-settings-collapsed-btn"
              />
            </Tooltip>
          ) : (
            // 展开状态：紧凑型设置卡片，与Logo一致的渐变背景
            <div 
              className="system-settings-card"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 201, 255, 0.15) 0%, rgba(146, 254, 157, 0.15) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(0, 201, 255, 0.2)',
                padding: '12px',
                boxShadow: '0 4px 16px rgba(0, 201, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                position: 'relative',
                zIndex: 1
              }}>
                {/* 设置按钮 - 与Logo一致的渐变背景 */}
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => {
                    // 发送打开系统设置事件
                    window.dispatchEvent(new CustomEvent('open-system-settings'));
                  }}
                  style={{
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '500',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(0, 201, 255, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  className="system-settings-main-btn"
                >
                  <span>系统设置</span>
                </Button>
                
                {/* 版本信息 */}
                <div style={{
                  fontSize: '10px',
                  color: '#64748b',
                  textAlign: 'center',
                  paddingTop: '4px',
                  borderTop: '1px solid rgba(148, 163, 184, 0.2)'
                }}>
                  NextAgentLite v1.3.2
                </div>
              </div>
            </div>
          )}
        </div>
      </Sider>

      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: siderCollapsed ? 'calc(100vw - 64px)' : 'calc(100vw - 240px)',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 顶部工具栏 - 在侧边栏旁边 */}
        <Header style={{
          background: '#ffffff',
          padding: '0 20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          width: '100%',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          minWidth: '1200px'
        }}>
          {/* 左侧：折叠按钮和页面图标 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <Button
              type="text"
              icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setSiderCollapsed(!siderCollapsed)}
              style={{
                fontSize: '18px',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                color: '#64748b',
                background: 'transparent',
                border: 'none'
              }}
            />
            
            {/* 面包屑导航或页面标题 */}
            {breadcrumbs.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* 面包屑导航 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)',
                  border: '1px solid #e6f0ff',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                  height: '32px',
                  maxWidth: '400px',
                  overflow: 'hidden'
                }}>
                  {breadcrumbs.map((item, index) => (
                    <React.Fragment key={index}>
                      <div 
                        onClick={item.onClick}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: item.onClick ? 'pointer' : 'default',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease',
                          ...(item.onClick ? {
                            ':hover': {
                              background: 'rgba(24, 144, 255, 0.08)'
                            }
                          } : {})
                        }}
                        onMouseEnter={(e) => {
                          if (item.onClick) {
                            e.currentTarget.style.background = 'rgba(24, 144, 255, 0.08)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (item.onClick) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <div style={{ fontSize: '12px', color: '#1890ff' }}>
                          {item.icon}
                        </div>
                        <span style={{ 
                          fontSize: '13px', 
                          color: '#1e293b',
                          fontWeight: '500'
                        }}>
                          {item.text}
                        </span>
                      </div>
                      {index < breadcrumbs.length - 1 && (
                        <RightOutlined style={{ 
                          fontSize: '8px', 
                          color: '#8c8c8c',
                          margin: '0 2px'
                        }} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* 返回按钮 (仅在有面包屑时显示，即文档管理视图) */}
                {breadcrumbs.length > 1 && (
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={breadcrumbs[0].onClick}
                    size="small"
                    style={{
                      borderRadius: '6px',
                      border: '1px solid #e6f0ff',
                      background: '#ffffff',
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 500,
                      height: '32px',
                      fontSize: '12px',
                      color: '#1890ff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1890ff';
                      e.currentTarget.style.background = 'rgba(24, 144, 255, 0.05)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e6f0ff';
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.04)';
                    }}
                  >
                    返回
                  </Button>
                )}
              </div>
            ) : location.pathname === '/app/qa' ? (
              <div style={{
                fontSize: '20px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center'
              }}>
                <UserOutlined />
              </div>
            ) : (
              <div style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b',
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.025em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '300px'
              }}>
                {(() => {
                  const directMatch = routes.find(route => route.path === location.pathname);
                  if (directMatch) return directMatch.name;
                  
                  for (const route of routes) {
                    if (route.children) {
                      const childMatch = route.children.find(child => child.path === location.pathname);
                      if (childMatch) return childMatch.name;
                    }
                  }
                  
                  return 'NextAgentLite';
                })()}
              </div>
            )}
          </div>

          {/* 右侧：用户信息 */}
          <div style={{ 
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            zIndex: 101,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '4px 8px',
            borderRadius: '20px'
          }}>
            <Dropdown 
              menu={{ 
                items: userMenuItems,
                style: {
                  minWidth: '200px',
                  padding: '8px',
                  borderRadius: '12px',
                  boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  background: 'white'
                }
              }} 
              placement="bottomRight"
              trigger={['click']}
            >
              <Button 
                type="text" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  height: '40px',
                  border: 'none',
                  background: 'rgba(248, 250, 252, 0.6)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  position: 'relative',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                  flexShrink: 0
                }}>
                  <UserOutlined style={{ 
                    color: 'white', 
                    fontSize: '14px',
                    fontWeight: '600'
                  }} />
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start'
                }}>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#1e293b',
                    lineHeight: '1.2'
                  }}>
                    {user?.displayName || '用户'}
                  </span>
                  {user?.role && (
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#64748b',
                      lineHeight: '1.2'
                    }}>
                      {user.role === 'admin' ? '管理员' : 
                       user.role === 'researcher' ? '研究员' : 
                       user.role === 'student' ? '学生' : user.role}
                    </span>
                  )}
                </div>
              </Button>
            </Dropdown>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content style={{
          margin: 0,
          padding: 0,
          background: location.pathname === '/app/atlas' ? '#ffffff' : '#f8fafc',
          overflow: location.pathname === '/app/atlas' ? 'hidden' : 'auto',
          minWidth: '1200px',
          maxWidth: 'calc(100vw - 240px)',
          position: 'relative',
          height: location.pathname === '/app/atlas' ? 'calc(100vh - 56px)' : 'auto'
        }}>
          <Outlet />
        </Content>
      </div>
    </AntLayout>

    {/* 全局SSE连接管理器 */}
    <SSEConnectionManager 
      sessionId={sessionId}
      onConnectionStatusChange={(status) => console.log('📡 全局SSE连接状态变化:', status)}
    />

    {/* SSE连接状态指示器 - 在知识图谱和Atlas页面不显示 */}
    {!location.pathname.includes('/app/graph') && 
     !location.pathname.includes('/app/atlas') && 
     !location.pathname.includes('/app/intelligent/monitoring/atlas') && (
      <SSEStatusIndicator sessionId={sessionId} />
    )}

    {/* 自定义样式 */}
    <style>{`
        /* 侧边栏菜单样式 */
        .sidebar-menu .ant-menu-item {
          margin: 8px 0 !important;
          border-radius: 12px !important;
          height: 48px !important;
          line-height: 48px !important;
          padding: 0 16px !important;
          color: #64748b !important;
          background: transparent !important;
          border: none !important;
          border-color: transparent !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          overflow: hidden !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        /* 移除主菜单项的伪元素背景，避免重复嵌套 */

        .sidebar-menu .ant-menu-item:hover {
          color: #1e293b !important;
          background: rgba(59, 130, 246, 0.1) !important;
          border: none !important;
          border-color: transparent !important;
          transform: none !important;
          box-shadow: none !important;
        }

        .sidebar-menu .ant-menu-item-selected {
          color: #1e293b !important;
          background: rgba(59, 130, 246, 0.15) !important;
          border: none !important;
          border-color: transparent !important;
          border-right: none !important;
          box-shadow: none !important;
          transform: none !important;
        }

        .sidebar-menu .ant-menu-item-selected::after {
          display: none !important;
        }

        .sidebar-menu .ant-menu-item .anticon {
          font-size: 18px !important;
          margin-right: 12px !important;
        }

        /* 子菜单样式 */
        .sidebar-menu .ant-menu-submenu {
          margin: 8px 0 !important;
          border-radius: 12px !important;
          background: transparent !important;
          border: none !important;
          border-color: transparent !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          overflow: hidden !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        /* 移除子菜单的伪元素背景，避免重复嵌套 */

        .sidebar-menu .ant-menu-submenu:hover {
          background: transparent !important;
          border: none !important;
          border-color: transparent !important;
          transform: none !important;
          box-shadow: none !important;
        }

        .sidebar-menu .ant-menu-submenu-title {
          height: 48px !important;
          line-height: 48px !important;
          padding: 0 16px !important;
          color: #64748b !important;
          border-radius: 12px !important;
          margin: 0 !important;
          position: relative !important;
          z-index: 1 !important;
        }

        .sidebar-menu .ant-menu-submenu-title:hover {
          color: #1e293b !important;
        }

        .sidebar-menu .ant-menu-submenu-title .anticon {
          font-size: 18px !important;
          margin-right: 12px !important;
        }

        .sidebar-menu .ant-menu-submenu-open > .ant-menu-submenu-title {
          color: #1e293b !important;
          background: rgba(59, 130, 246, 0.1) !important;
        }

        .sidebar-menu .ant-menu-submenu-open {
          background: transparent !important;
          border: none !important;
          border-color: transparent !important;
          transform: none !important;
          box-shadow: none !important;
        }

        /* 伪元素已完全移除，不再需要额外的隐藏规则 */

        .sidebar-menu .ant-menu-submenu .ant-menu-sub {
          background: transparent !important;
          margin-left: 20px !important;
          border-left: 2px solid rgba(59, 130, 246, 0.2) !important;
          padding-left: 16px !important;
          padding-right: 20px !important;
          margin-right: 0 !important;
        }

        .sidebar-menu .ant-menu-submenu .ant-menu-item {
          height: 40px !important;
          line-height: 40px !important;
          margin: 4px 0 !important;
          padding: 0 12px !important;
          border-radius: 8px !important;
          color: #64748b !important;
          background: transparent !important;
          border: none !important;
          border-color: transparent !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          overflow: hidden !important;
          margin-right: 0 !important;
          max-width: calc(100% - 10px) !important;
          width: calc(100% - 10px) !important;
        }

        /* 移除子菜单项的伪元素背景，避免重复嵌套 */

        .sidebar-menu .ant-menu-submenu .ant-menu-item:hover {
          color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.05) !important;
          border: none !important;
          border-color: transparent !important;
          transform: translateX(0px) !important;
          box-shadow: none !important;
          border-bottom: 1px solid rgba(59, 130, 246, 0.3) !important;
        }

        .sidebar-menu .ant-menu-submenu .ant-menu-item-selected {
          color: #3b82f6 !important;
          background: transparent !important;
          border: none !important;
          border-color: transparent !important;
          box-shadow: none !important;
          transform: translateX(4px) !important;
          position: relative !important;
          font-weight: 600 !important;
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) !important;
        }
        
        .sidebar-menu .ant-menu-submenu .ant-menu-item-selected::before {
          content: '' !important;
          position: absolute !important;
          left: -20px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          width: 3px !important;
          height: 20px !important;
          background: linear-gradient(180deg, #3b82f6 0%, #06b6d4 100%) !important;
          border-radius: 2px !important;
          box-shadow: 
            0 0 8px rgba(59, 130, 246, 0.4),
            0 0 16px rgba(59, 130, 246, 0.2) !important;
          animation: pulse-line 2s ease-in-out infinite !important;
          z-index: 10 !important;
        }
        
        @keyframes pulse-line {
          0% { 
            box-shadow: 
              0 0 8px rgba(59, 130, 246, 0.4),
              0 0 16px rgba(59, 130, 246, 0.2);
            opacity: 0.8;
          }
          50% { 
            box-shadow: 
              0 0 12px rgba(59, 130, 246, 0.6),
              0 0 24px rgba(59, 130, 246, 0.3),
              0 0 36px rgba(59, 130, 246, 0.1);
            opacity: 1;
          }
          100% { 
            box-shadow: 
              0 0 8px rgba(59, 130, 246, 0.4),
              0 0 16px rgba(59, 130, 246, 0.2);
            opacity: 0.8;
          }
        }


        .sidebar-menu .ant-menu-submenu .ant-menu-item .anticon {
          font-size: 16px !important;
          margin-right: 8px !important;
        }

        /* 折叠按钮样式 - 去掉hover效果 */
        .fold-button-no-hover {
          background: transparent !important;
          border: none !important;
        }
        .fold-button-no-hover:hover {
          background: transparent !important;
          color: #64748b !important;
          transform: none !important;
          border: none !important;
        }
        .fold-button-no-hover:focus {
          background: transparent !important;
          color: #64748b !important;
          transform: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* 用户头像按钮样式 */
        .user-avatar-button:hover {
          background: rgba(59, 130, 246, 0.08) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15) !important;
        }

        .user-avatar-button:hover > div:first-of-type {
          transform: scale(1.05) !important;
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4) !important;
        }

        /* 现代化下拉菜单样式 */
        .modern-user-dropdown .ant-dropdown-menu-item {
          transition: all 0.2s ease;
          border-radius: 8px !important;
          margin: 2px 0 !important;
          padding: 12px !important;
          background: transparent !important;
          border: none !important;
          height: auto !important;
          line-height: normal !important;
          min-height: 44px !important;
        }

        .modern-user-dropdown .ant-dropdown-menu-item:hover {
          background: rgba(59, 130, 246, 0.08) !important;
          transform: translateX(4px) !important;
        }

        .modern-user-dropdown .ant-dropdown-menu-divider {
          background: rgba(148, 163, 184, 0.2) !important;
          height: 1px !important;
          margin: 8px 12px !important;
        }

        .modern-user-dropdown .ant-dropdown-menu {
          padding: 8px !important;
        }

        /* 折叠状态样式 - 强制图标居中 */
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-item {
          width: 100% !important;
          margin: 8px 0 !important;
          padding: 0 !important;
          height: 40px !important;
          border-radius: 10px !important;
          text-align: center !important;
          position: relative !important;
        }

        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu {
          width: 100% !important;
          margin: 8px 0 !important;
          padding: 0 !important;
          height: 40px !important;
          border-radius: 10px !important;
          text-align: center !important;
          position: relative !important;
        }

        /* 折叠状态下子菜单标题 */
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu .ant-menu-submenu-title {
          width: 100% !important;
          height: 40px !important;
          margin: 0 !important;
          padding: 0 !important;
          border-radius: 10px !important;
          text-align: center !important;
          position: relative !important;
          line-height: 40px !important;
        }

        /* 折叠状态下所有图标样式 - 绝对居中 */
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-item .anticon,
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu .ant-menu-submenu-title .anticon {
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          margin: 0 !important;
          font-size: 18px !important;
          color: inherit !important;
        }

        /* 折叠状态下隐藏文字 */
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-item span:last-child,
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu .ant-menu-submenu-title span:last-child {
          display: none !important;
        }

        /* 折叠状态下隐藏子菜单箭头 */
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu .ant-menu-submenu-title .ant-menu-submenu-arrow {
          display: none !important;
        }

        /* 折叠状态下hover效果 - 强制覆盖所有可能的选择器 */
        .ant-layout-sider-collapsed .sidebar-menu li.ant-menu-item:hover,
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-item:hover,
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-item:hover:not(.ant-menu-item-selected),
        .ant-layout-sider-collapsed .sidebar-menu li.ant-menu-item:hover:not(.ant-menu-item-selected) {
          background: rgba(59, 130, 246, 0.1) !important;
          border-radius: 10px !important;
          transform: none !important;
          width: 40px !important;
          height: 40px !important;
          margin: 8px auto !important;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2) !important;
          transition: all 0.3s ease !important;
          border: none !important;
          outline: none !important;
        }

        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu:hover > .ant-menu-submenu-title,
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu .ant-menu-submenu-title:hover,
        .ant-layout-sider-collapsed .sidebar-menu li.ant-menu-submenu:hover > .ant-menu-submenu-title,
        .ant-layout-sider-collapsed .sidebar-menu li.ant-menu-submenu .ant-menu-submenu-title:hover {
          background: rgba(59, 130, 246, 0.1) !important;
          border-radius: 10px !important;
          transform: none !important;
          width: 40px !important;
          height: 40px !important;
          margin: 0 auto !important;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2) !important;
          transition: all 0.3s ease !important;
          border: none !important;
          outline: none !important;
        }

        /* 折叠状态下选中效果 - 更高优先级 */
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-item-selected,
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-item.ant-menu-item-selected {
          background: rgba(59, 130, 246, 0.15) !important;
          border-radius: 10px !important;
          transform: none !important;
          width: 40px !important;
          height: 40px !important;
          margin: 8px auto !important;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
        }

        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu-open > .ant-menu-submenu-title,
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu-selected > .ant-menu-submenu-title,
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu .ant-menu-submenu-title.ant-menu-submenu-selected {
          background: rgba(59, 130, 246, 0.15) !important;
          border-radius: 10px !important;
          transform: none !important;
          width: 40px !important;
          height: 40px !important;
          margin: 0 auto !important;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
        }

        /* 折叠状态下隐藏子菜单展开的内容 */
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu .ant-menu-sub {
          display: none !important;
        }

        /* 折叠状态下隐藏子菜单的箭头 */
        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu .ant-menu-submenu-arrow {
          display: none !important;
        }

        .ant-layout-sider-collapsed .sidebar-menu .ant-menu-submenu .ant-menu-submenu-title::after {
          display: none !important;
        }



        /* 用户头像响应式样式 */
        .user-avatar-button {
          transition: all 0.3s ease;
        }
        
        /* Header容器防溢出 */
        .ant-layout-header {
          box-sizing: border-box !important;
        }
        
        /* 响应式设计 */
        @media (max-width: 1200px) {
          .ant-layout-header {
            padding: 0 16px !important;
          }
        }
        
        @media (max-width: 768px) {
          .ant-layout-sider {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            z-index: 1000 !important;
          }
          
          .ant-layout-sider.ant-layout-sider-collapsed {
            left: -280px !important;
          }
          
          .ant-layout-header {
            padding: 0 12px !important;
          }
        }
        
        @media (max-width: 480px) {
          .ant-layout-header {
            padding: 0 8px !important;
          }
          
          .ant-layout-header > div:first-child {
            gap: 8px !important;
          }
          
          .ant-layout-header > div:last-child {
            gap: 4px !important;
          }
        }

        /* 自定义折叠菜单样式 */
        .collapsed-menu {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        .collapsed-menu-item {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .collapsed-icon:hover {
          background: rgba(59, 130, 246, 0.1) !important;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2) !important;
        }

        .collapsed-icon.selected {
          background: rgba(59, 130, 246, 0.15) !important;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
        }

        .collapsed-icon .anticon {
          font-size: 18px !important;
          color: #64748b !important;
        }

        .collapsed-icon:hover .anticon,
        .collapsed-icon.selected .anticon {
          color: #1e293b !important;
        }

        /* 系统设置卡片样式 */
        .system-settings-collapsed-btn:hover {
          transform: translateY(-2px) scale(1.08) !important;
          box-shadow: 0 6px 20px rgba(0, 201, 255, 0.4) !important;
          background: linear-gradient(135deg, #00d4ff 0%, #9eff9e 100%) !important;
          color: white !important;
        }

        .system-settings-main-btn:hover {
          transform: translateY(-1px) scale(1.02) !important;
          box-shadow: 0 6px 20px rgba(0, 201, 255, 0.4) !important;
          background: linear-gradient(135deg, #00d4ff 0%, #9eff9e 100%) !important;
        }

        .quick-action-btn:hover {
          transform: translateY(-1px) scale(1.05) !important;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15) !important;
          background: rgba(255, 255, 255, 1) !important;
          border-color: rgba(0, 201, 255, 0.3) !important;
        }

        .quick-action-btn:active {
          transform: translateY(0px) scale(0.98) !important;
        }

        /* 系统设置卡片进入动画 */
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .system-settings-card {
          animation: slideInUp 0.6s ease-out;
        }

        /* 装饰性背景的脉冲动画 */
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        .system-settings-card .bg-decoration {
          animation: pulse-glow 4s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

// 根据图标名称获取对应的图标组件
function getIcon(iconName: string) {
  const iconMap: Record<string, React.ReactNode> = {
    HomeOutlined: <HomeOutlined />,
    MessageOutlined: <MessageOutlined />,
    BookOutlined: <BookOutlined />,
    NodeIndexOutlined: <NodeIndexOutlined />,
    ThunderboltOutlined: <ThunderboltOutlined />,
    RobotOutlined: <RobotOutlined />,
    AndroidOutlined: <AndroidOutlined />,
    BulbOutlined: <BulbOutlined />,
    DashboardOutlined: <DashboardOutlined />,
    ToolOutlined: <ToolOutlined />,
    RadarChartOutlined: <RadarChartOutlined />,
    DatabaseOutlined: <DatabaseOutlined />,
    FileTextOutlined: <FileTextOutlined />,
    QuestionCircleOutlined: <QuestionCircleOutlined />,
    ExperimentOutlined: <ExperimentOutlined />,
    SettingOutlined: <SettingOutlined />,
    UserOutlined: <UserOutlined />,
    TeamOutlined: <TeamOutlined />,
    BranchesOutlined: <BranchesOutlined />,
    AppstoreOutlined: <AppstoreOutlined />,
    GlobalOutlined: <GlobalOutlined />,
    MonitorOutlined: <MonitorOutlined />,
    UnorderedListOutlined: <UnorderedListOutlined />,
    ControlOutlined: <ControlOutlined />,
    BarChartOutlined: <BarChartOutlined />,
    FileSearchOutlined: <FileSearchOutlined />
  };
  
  return iconMap[iconName] || <MessageOutlined />;
}

export default Layout;