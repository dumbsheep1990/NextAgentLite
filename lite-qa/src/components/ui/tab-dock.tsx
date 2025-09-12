import React from 'react';
import { motion } from 'motion/react';

interface TabItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

interface TabDockProps {
  items: TabItem[];
  activeId?: string;
  onTabChange?: (id: string) => void;
  className?: string;
}

export function TabDock({ items, activeId, onTabChange, className }: TabDockProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900">创建方式</h3>
          <p className="text-xs text-gray-500 mt-1">选择适合的Agent创建方式</p>
        </div>
        
        {/* Navigation Items */}
        <div className="p-2">
          {items.map((item, index) => (
            <motion.button
              key={item.id}
              className={`
                relative flex items-center gap-3 px-3 py-3 rounded-md font-medium text-left w-full mb-1
                transition-all duration-200 border
                ${activeId === item.id 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-white text-gray-700 border-transparent hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200'
                }
              `}
              onClick={() => {
                onTabChange?.(item.id);
                item.onClick?.();
              }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              
              {/* Icon */}
              <div className={`text-base flex-shrink-0 ${activeId === item.id ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.icon}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${activeId === item.id ? 'text-blue-900' : 'text-gray-900'}`}>
                  {item.label}
                </div>
                <div className={`text-xs mt-0.5 leading-relaxed ${activeId === item.id ? 'text-blue-600' : 'text-gray-500'}`}>
                  {getItemDescription(item.id)}
                </div>
              </div>

              {/* Arrow for active state */}
              {activeId === item.id && (
                <motion.div
                  className="text-blue-500 text-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15, delay: 0.1 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 获取描述信息的辅助函数
function getItemDescription(id: string): string {
  const descriptions: Record<string, string> = {
    'auto': '通过对话自动生成配置',
    'template': '基于预设模板快速创建',
    'manual': '完全自定义配置参数'
  };
  return descriptions[id] || '';
}

export default TabDock;