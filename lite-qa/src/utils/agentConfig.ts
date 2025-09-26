/**
 * 智能体配置 - 统一管理智能体头像、图标和样式
 */
import React from 'react';
import { 
  ExperimentOutlined, 
  ApiOutlined, 
  StarOutlined, 
  DeploymentUnitOutlined, 
  RobotOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';

export interface AgentAvatarConfig {
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  name: string;
}

// 恢复原始的智能体配置 - 每个智能体有不同的图标
export const AGENT_CONFIGS: Record<string, AgentAvatarConfig> = {
  'cailiao_zhuanjia': {
    icon: ExperimentOutlined,
    color: '#1890ff',
    bgColor: 'rgba(24, 144, 255, 0.1)',
    borderColor: 'rgba(24, 144, 255, 0.2)',
    name: '材料专家'
  },
  'wenxian_jiansuozhuanjia': {
    icon: FileSearchOutlined,
    color: '#52c41a',
    bgColor: 'rgba(82, 196, 26, 0.1)',
    borderColor: 'rgba(82, 196, 26, 0.2)',
    name: '文献检索专家'
  },
  'shuju_fenxizhuanjia': {
    icon: BarChartOutlined,
    color: '#fa8c16',
    bgColor: 'rgba(250, 140, 22, 0.1)',
    borderColor: 'rgba(250, 140, 22, 0.2)',
    name: '数据分析专家'
  },
  'dijuwu_wendatuandui': {
    icon: TeamOutlined,
    color: '#722ed1',
    bgColor: 'rgba(114, 46, 209, 0.1)',
    borderColor: 'rgba(114, 46, 209, 0.2)',
    name: 'NextAgent问答团队'
  }
};

// 默认配置
export const DEFAULT_AGENT_CONFIG: AgentAvatarConfig = {
  icon: RobotOutlined,
  color: '#10b981',
  bgColor: 'rgba(16, 185, 129, 0.1)',
  borderColor: 'rgba(16, 185, 129, 0.2)',
  name: '智能助手'
};

/**
 * 获取智能体头像配置
 * @param agentId 智能体ID
 * @returns 智能体配置
 */
export const getAgentAvatarConfig = (agentId?: string): AgentAvatarConfig => {
  if (!agentId) return DEFAULT_AGENT_CONFIG;
  return AGENT_CONFIGS[agentId] || DEFAULT_AGENT_CONFIG;
};

/**
 * 获取智能体图标组件
 * @param agentId 智能体ID
 * @param style 额外样式
 * @returns React图标组件
 */
export const getAgentIcon = (agentId?: string, style?: React.CSSProperties): React.ReactElement => {
  // 修正的图标映射 - 使用实际的智能体ID
  const iconMap: Record<string, any> = {
    'qa_agent': ExperimentOutlined,           // 问答智能体 - 蓝色实验瓶
    'doc_analyzer': FileSearchOutlined,       // 文档分析智能体 - 绿色搜索
    'multimodal_agent': BarChartOutlined,     // 多模态智能体 - 橙色图表  
    'qa_team': TeamOutlined,                  // NextAgent问答团队 - 紫色团队
    // 保留旧的ID作为后备
    'cailiao_zhuanjia': ExperimentOutlined,
    'wenxian_jiansuozhuanjia': FileSearchOutlined,
    'shuju_fenxizhuanjia': BarChartOutlined,
    'dijuwu_wendatuandui': TeamOutlined
  };
  
  const colorMap: Record<string, string> = {
    'qa_agent': '#1890ff',                    // 问答智能体 - 蓝色
    'doc_analyzer': '#52c41a',                // 文档分析智能体 - 绿色
    'multimodal_agent': '#fa8c16',            // 多模态智能体 - 橙色
    'qa_team': '#722ed1',                     // NextAgent问答团队 - 紫色
    // 保留旧的ID作为后备
    'cailiao_zhuanjia': '#1890ff',
    'wenxian_jiansuozhuanjia': '#52c41a',
    'shuju_fenxizhuanjia': '#fa8c16',
    'dijuwu_wendatuandui': '#722ed1'
  };
  
  
  const IconComponent = iconMap[agentId || 'cailiao_zhuanjia'] || ExperimentOutlined;
  const iconColor = colorMap[agentId || 'cailiao_zhuanjia'] || '#1890ff';
  
  return React.createElement(IconComponent, {
    style: { 
      fontSize: '18px', 
      color: iconColor,
      fontWeight: 600,
      display: 'inline-block',
      ...style
    }
  });
};

/**
 * 获取智能体背景样式类名
 * @param agentId 智能体ID
 * @returns CSS类名字符串
 */
export const getAgentBackgroundClass = (agentId?: string): string => {
  if (!agentId) return 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200';
  
  const bgClasses: Record<string, string> = {
    // 使用实际的智能体ID
    'qa_agent': 'bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-200',
    'doc_analyzer': 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200', 
    'multimodal_agent': 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200',
    'qa_team': 'bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200',
    // 保留旧的ID作为后备
    'cailiao_zhuanjia': 'bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-200',
    'wenxian_jiansuozhuanjia': 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200',
    'shuju_fenxizhuanjia': 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200',
    'dijuwu_wendatuandui': 'bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200'
  };
  
  return bgClasses[agentId] || 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200';
};

/**
 * 获取智能体头像容器样式（包含加载动画）
 * @param agentId 智能体ID
 * @param isLoading 是否在加载中
 * @returns 样式对象
 */
export const getAgentAvatarStyle = (agentId?: string, isLoading?: boolean) => {
  const config = getAgentAvatarConfig(agentId);
  
  return {
    width: '42px',
    height: '42px',
    background: config.bgColor,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 4px 16px ${config.bgColor}`,
    border: `1.5px solid ${config.borderColor}`,
    position: 'relative' as const,
    overflow: 'hidden',
    ...(isLoading && {
      animation: 'pulse 2s ease-in-out infinite'
    })
  };
};
