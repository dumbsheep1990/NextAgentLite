import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link as HeroLink,
  Navbar,
  NavbarContent,
  NavbarItem,
  Tooltip
} from "@heroui/react";
import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, useLocation, useNavigate} from 'react-router-dom';

import {ChangePasswordDialog} from '@/components/ChangePasswordDialog';
import {LanguageSwitcher} from '@/components/LanguageSwitcher';
import LocalIcon from '@/components/LocalIcon';
import {WechatQRCode} from '@/components/WechatQRCode';
import {getCurrentUser} from '@/services/api';
import {toast} from '@/utils/toast';

// 去除图片 Logo，使用文字品牌

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const embedded = typeof window !== 'undefined' && window.self !== window.top;
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isDark, setIsDark] = React.useState(() => {
    const savedTheme = window.localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const [isWechatQRCodeOpen, setIsWechatQRCodeOpen] = React.useState(false);
  const [userInfo, setUserInfo] = useState<{ username: string; role: string } | null>(null);

  // Initialize theme on mount
  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (embedded) return; // 内嵌模式不请求用户信息，避免401跳转
    const fetchUserInfo = async () => {
      try {
        const response = await getCurrentUser();
        setUserInfo(response.data);
      } catch (error) {
        // 内嵌模式不展示用户信息，忽略错误；独立模式保留提示
        toast.error(t('errors.fetch_user', { error: (error as Error).message }), {
          duration: 3000,
        });
      }
    };

    fetchUserInfo();
  }, [t, embedded]);

  const llmConfigAdminOnly = window.RUNTIME_CONFIG?.LLM_CONFIG_ADMIN_ONLY;
  const canShowLLM = embedded
    ? true
    : (
      llmConfigAdminOnly === false ||
      (llmConfigAdminOnly === true && userInfo?.role === 'admin')
    );

  const menuGroups = [
    // 将“模型”分组放到第一位
    {
      key: 'chat-ai',
      label: '模型',
      items: [
        {
          key: 'chat',
          label: t('nav.chat'),
          icon: 'lucide:message-square',
          path: '/chat',
        },
        ...(canShowLLM ? [{
          key: 'llm',
          label: '对话模型',
          icon: 'lucide:brain',
          path: '/llm',
        }, {
          key: 'llm-embeddings',
          label: '向量模型',
          icon: 'lucide:tag',
          path: '/llm-embeddings',
        }, {
          key: 'llm-rerank',
          label: '重排模型',
          icon: 'lucide:list-filter',
          path: '/llm-rerank',
        }] : []),
      ]
    },
    // 工具分组保留为独立分组
    {
      key: 'tools-group',
      label: '工具',
      items: [
        {
          key: 'tools-mcp',
          label: 'MCP工具',
          icon: 'custom:mcp',
          path: '/tools/mcp',
        },
        {
          key: 'tools-api',
          label: 'API工具',
          icon: 'lucide:route',
          path: '/tools/api',
        },
      ]
    },
    {
      key: 'gateway-config',
      label: '网关',
      items: [
        {
          key: 'gateway',
          label: t('nav.gateway'),
          icon: 'lucide:server',
          path: '/gateway',
        },
        {
          key: 'config-versions',
          label: t('nav.config_versions'),
          icon: 'lucide:history',
          path: '/config-versions',
        },
      ]
    },
  ];

  const handleLogout = () => {
    window.localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    window.localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top navigation and header title removed for embedded usage */}

      <div className="flex h-screen">
        {/* Sidebar */}
        <div
          className={`h-screen bg-card text-foreground flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 border-r border-border shadow-lg ${
            isCollapsed ? "w-20" : "w-56"
          }`}
        >
          {/* Sidebar header: collapse toggle */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-3 border-b border-border/60 bg-card/80 backdrop-blur-sm`}>            
            {!isCollapsed && (
              <span className="text-xs font-semibold tracking-wide text-muted-foreground">配置</span>
            )}
            <button
              aria-label={isCollapsed ? '展开侧栏' : '折叠侧栏'}
              className="inline-flex items-center justify-center rounded-md hover:bg-accent/60 text-muted-foreground transition-colors w-8 h-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <LocalIcon icon={isCollapsed ? 'ri:menu-unfold-2-line' : 'ri:menu-unfold-line'} width={20} height={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            {menuGroups.map((group, groupIndex) => (
              <div key={group.key} className={groupIndex > 0 ? "mt-6" : ""}>
                {!isCollapsed && (
                  <div className="px-4 py-2 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                )}
                {isCollapsed && groupIndex > 0 && (
                  <div className="mx-2 mb-2 border-t border-border"></div>
                )}
                {group.items.map((item) => {
                  const isGatewaySection = item.path.startsWith('/gateway/');
                  const isActive = isGatewaySection
                    ? (location.pathname === item.path)
                    : (item.path === "/" ? location.pathname === "/" : (location.pathname === item.path || location.pathname.startsWith(item.path + "/")));
                  return isCollapsed ? (
                    <Tooltip
                      key={item.path}
                      content={item.label}
                      placement="right"
                    >
                      <Link
                        to={item.path}
                        className={`group flex items-center justify-center w-full px-0 py-0 rounded-lg mb-1 transition-colors ${isActive ? 'bg-primary/15 text-primary ring-1 ring-primary/20' : 'hover:bg-accent text-foreground'}`}
                        style={{ width: '2.5rem', height: '2.25rem', margin: '0 auto' }}
                      >
                        <LocalIcon icon={item.icon} width={18} height={18} />
                      </Link>
                    </Tooltip>
                  ) : (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`relative flex items-center w-full px-3 py-2 rounded-lg mb-1 transition-colors ${isActive ? 'bg-primary/15 text-primary ring-1 ring-primary/20 shadow-sm' : 'hover:bg-accent text-foreground'}`}
                    >
                      {/* active indicator */}
                      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r" />}
                      <LocalIcon icon={item.icon} width={18} height={18} className="mr-3 opacity-90" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* User Profile Section removed for embedded mode */}
        </div>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-56'} h-full overflow-hidden`}>
          <div className="p-6 h-full overflow-y-auto">
            {children}
          </div>
        </div>
      </div>

      <ChangePasswordDialog
        isOpen={isChangePasswordOpen}
        onOpenChange={() => setIsChangePasswordOpen(false)}
      />

      <WechatQRCode
        isOpen={isWechatQRCodeOpen}
        onOpenChange={() => setIsWechatQRCodeOpen(false)}
      />
    </div>
  );
}
