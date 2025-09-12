/**
 * QA输入框组件 - 问题输入和发送
 */
import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Select, Tooltip, Space, Dropdown, Modal, Switch } from 'antd';
import { 
  SendOutlined, 
  RobotOutlined, 
  TeamOutlined, 
  SettingOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  CloseOutlined,
  ThunderboltOutlined,
  UserOutlined,
  DeploymentUnitOutlined,
  ExperimentOutlined,
  ApiOutlined,
  FireOutlined,
  StarOutlined,
  ApartmentOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  DatabaseOutlined,
  StopOutlined,
  MessageOutlined,
  FileSearchOutlined,
  TranslationOutlined,
  DownOutlined
} from '@ant-design/icons';
import type { AgentInfo } from '../../types';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { useAppStore } from '../../stores/appStore';
import { ChatSettings } from './ChatSettings';
import { getAgentIcon, getAgentBackgroundClass } from '../../utils/agentConfig';
import TranslationPreview from './TranslationPreview';

const { TextArea } = Input;
const { Option } = Select;

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, agentName?: string) => void;
  onInterrupt?: () => void;
  loading?: boolean;
  placeholder?: string;
  availableAgents?: AgentInfo[];
  selectedAgent?: string;
  onAgentChange?: (agent: string) => void;
  disabled?: boolean;
  className?: string;
  isMobile?: boolean;
  onMobileHistoryOpen?: () => void;
  searchKnowledge?: boolean;
  onSearchKnowledgeChange?: (enabled: boolean) => void;
  searchGraph?: boolean;
  onSearchGraphChange?: (enabled: boolean) => void;
  // 新增检索模式相关属性
  retrievalMode?: 'qa_only' | 'papers_only' | 'all';
  onRetrievalModeChange?: (mode: 'qa_only' | 'papers_only' | 'all') => void;
  enableTranslation?: boolean;
  onTranslationChange?: (enabled: boolean) => void;
  inputText?: string;
  currentModel?: string;
  chatSettings?: {
    temperature: number;
    maxTokens: number;
    topP: number;
    maxTurns: number;
    enableStream: boolean;
    enableMemory: boolean;
    systemPrompt: string;
  };
  onChatSettingsChange?: (settings: any) => void;
  onTeamConfigSaved?: () => void; // 新增：Team配置保存后的回调
  onShowKnowledgeSources?: () => void;
  // 新增模式切换相关属性
  currentMode?: 'default' | 'team';
  onModeChange?: (mode: 'default' | 'team') => void;
  availableTeams?: any[];
  selectedTeam?: string;
  onTeamChange?: (team: string) => void;
  teamDefaultConfig?: any;
  sidebarVisible?: boolean;
  // 控制是否显示模式切换标签
  hideModeSwitch?: boolean;
  // 历史和来源按钮相关
  isHistoryVisible?: boolean;
  isSourceVisible?: boolean;
  onHistoryToggle?: () => void;
  onSourceToggle?: () => void;
}

export const InputBox: React.FC<InputBoxProps> = ({
  value,
  onChange,
  onSend,
  onInterrupt,
  loading = false,
  placeholder = "请输入您的问题...",
  availableAgents = [],
  selectedAgent,
  onAgentChange,
  disabled = false,
  className = '',
  isMobile = false,
  onMobileHistoryOpen,
  searchKnowledge = false,
  onSearchKnowledgeChange,
  searchGraph = false,
  onSearchGraphChange,
  // 新增检索模式相关参数
  retrievalMode = 'all',
  onRetrievalModeChange,
  enableTranslation = false,
  onTranslationChange,
  inputText,
  currentModel: propCurrentModel,
  chatSettings,
  onChatSettingsChange,
  onTeamConfigSaved,
  onShowKnowledgeSources,
  // 新增模式切换相关参数
  currentMode = 'default',
  onModeChange,
  availableTeams = [],
  selectedTeam,
  onTeamChange,
  teamDefaultConfig,
  sidebarVisible = true,
  // 控制是否显示模式切换标签
  hideModeSwitch = false,
  // 历史和来源按钮相关
  isHistoryVisible = false,
  isSourceVisible = false,
  onHistoryToggle,
  onSourceToggle
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const textAreaRef = useRef<any>(null);

  // 使用传入的对话设置，如果没有则使用默认值
  const defaultChatSettings = {
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.8,
    maxTurns: 8,
    enableStream: true,
    enableMemory: true,
    systemPrompt: ''
  };
  const currentChatSettings = chatSettings || defaultChatSettings;

  // 监听快速问题点击事件
  useEffect(() => {
    const handleQuickQuestion = (event: any) => {
      const question = event.detail?.question;
      if (question) {
        onChange(question);
        // 聚焦到输入框
        if (textAreaRef.current) {
          textAreaRef.current.focus();
        }
      }
    };

    window.addEventListener('quickQuestionClick', handleQuickQuestion);
    
    return () => {
      window.removeEventListener('quickQuestionClick', handleQuickQuestion);
    };
  }, [onChange]);
  
  // 获取模型数据和配置
  const { chatModels } = useKnowledgeStore();
  const { modelConfig, setModelConfig } = useAppStore();

  const handleSend = () => {
    if (loading) {
      // 如果正在加载，则执行中断操作
      if (onInterrupt) {
        onInterrupt();
      }
      return;
    }
    
    if (!value.trim()) return;
    onSend(value.trim(), selectedAgent || undefined);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAgentChange = (agentName: string) => {
    onAgentChange?.(agentName);
  };

  const handleModelChange = (modelId: string) => {
    setModelConfig({
      llm: {
        ...modelConfig.llm,
        chatModel: modelId
      }
    });
  };

  const getAgentInfo = (agentId: string) => {
    return availableAgents.find(agent => agent.id === agentId);
  };

  const getCurrentModel = () => {
    return chatModels.find(model => model.id === modelConfig.llm.chatModel);
  };

  // 确保总是有智能体显示，优先显示问答专家
  const currentAgent = (() => {
    if (selectedAgent && getAgentInfo(selectedAgent)) {
      return getAgentInfo(selectedAgent);
    }
    // 优先显示问答专家
    const qaAgent = availableAgents.find(agent => agent.id === 'cailiao_zhuanjia');
    if (qaAgent) return qaAgent;
    // 否则显示第一个可用的
    return availableAgents[0] || null;
  })();
  const currentModel = getCurrentModel();
  
  // qwen3-235b现在支持知识库检索（通过预处理模式），不再需要屏蔽
  const isQwen235bModel = false;
  
  // 使用统一的智能体图标配置

  // 智能体选择下拉菜单 - 根据模式显示不同选项
  const agentDropdownItems = (() => {
    if (currentMode === 'team') {
      // Team模式：显示团队选项
      return [
        {
          key: 'general_qa_team_v2',
          label: (
            <div className="flex items-center justify-between p-2 hover:bg-gray-50/80 rounded-lg transition-all duration-200">
              <div className="flex items-center">
                <div className="w-7 h-7 rounded-md flex items-center justify-center mr-2 border shadow-sm bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
                  <TeamOutlined style={{ fontSize: '14px', color: '#f97316' }} />
                </div>
                <div>
                  <div className="font-medium text-gray-700 text-sm">通用智能问答团队V2</div>
                  <div className="text-xs text-gray-500/80">智能问答协作</div>
                </div>
              </div>
              <div className="flex items-center justify-center w-8 h-5 ml-3">
                {selectedTeam === 'general_qa_team_v2' && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-sm ring-2 ring-orange-200"></div>
                )}
              </div>
            </div>
          ),
          onClick: () => onTeamChange?.('general_qa_team_v2')
        }
      ];
    } else {
      // 专家模式：显示专家选项 - 过滤掉团队相关的agent
      const expertAgents = availableAgents.filter(agent => 
        !agent.id.includes('team') && 
        !agent.name.includes('团队') && 
        !agent.name.includes('Team')
      );
      
      return expertAgents.map(agent => {
        return {
          key: agent.id,
          label: (
            <div className="flex items-center justify-between p-2 hover:bg-gray-50/80 rounded-lg transition-all duration-200">
              <div className="flex items-center">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center mr-2 border shadow-sm ${getAgentBackgroundClass(agent.id)}`}>
                  {getAgentIcon(agent.id)}
                </div>
                <div>
                  <div className="font-medium text-gray-700 text-sm">
                    {agent.name.length > 12 ? `${agent.name.substring(0, 12)}...` : agent.name}
                  </div>
                  <div className="text-xs text-gray-500/80">
                    {agent.description.length > 20 ? `${agent.description.substring(0, 20)}...` : agent.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center w-8 h-5 ml-3">
                {(selectedAgent === agent.id || (!selectedAgent && agent.id === 'cailiao_zhuanjia')) && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-sm ring-2 ring-blue-200"></div>
                )}
              </div>
            </div>
          ),
          onClick: () => handleAgentChange(agent.id)
        };
      });
    }
  })();

  // 根据模型ID确定提供商和图标 - 前端渲染层，不依赖后端provider字段
  const getModelProviderByID = (modelId: string): string => {
    if (!modelId) return 'unknown';
    
    const id = modelId.toLowerCase();
    
    // 基于模型ID模式判断提供商
    if (id.includes('qwen') || id.includes('tongyi')) {
      return 'alibaba';
    } else if (id.includes('gpt') || id.includes('openai')) {
      return 'openai';
    } else if (id.includes('gemini') || id.includes('bard')) {
      return 'google';
    } else if (id.includes('kimi') || id.includes('moonshot')) {
      return 'moonshot';
    } else if (id.includes('claude')) {
      return 'anthropic';
    } else if (id.includes('llama')) {
      return 'meta';
    }
    
    return 'unknown';
  };

  // 获取模型图标和颜色 - 使用前端映射而非后端数据
  const getModelIcon = (model: any) => {
    const provider = getModelProviderByID(model.id);
    
    switch (provider) {
      case 'alibaba':
        return <FireOutlined style={{ fontSize: '12px', color: '#c2410c' }} />;
      case 'openai':
      case 'moonshot':
        return <ThunderboltOutlined style={{ fontSize: '12px', color: '#1d4ed8' }} />;
      case 'google':
        return <StarOutlined style={{ fontSize: '12px', color: '#047857' }} />;
      case 'anthropic':
        return <ExperimentOutlined style={{ fontSize: '12px', color: '#f97316' }} />;
      case 'meta':
        return <DeploymentUnitOutlined style={{ fontSize: '12px', color: '#1e40af' }} />;
      default:
        return <ApiOutlined style={{ fontSize: '12px', color: '#7c3aed' }} />;
    }
  };

  // Agent ID到显示名称的映射
  const agentDisplayNames: { [key: string]: string } = {
    'question_decomposition_agent': '问题分解专家',
    'intelligent_routing_agent': '智能路由专家',
    'translation_agent': '实时翻译专家', 
    'knowledge_retrieval_agent': '知识检索专家',
    'knowledge_graph_agent': '知识图谱专家',
    'summary_answer_agent': '总结回答专家',
    'qa_coordinator_v2': '协调器'
  };

  // Team模式下的Agent模型信息 - 从动态配置获取
  const getTeamAgentModels = () => {
    if (currentMode !== 'team' || !selectedTeam) return [];
    
    // 尝试从teamDefaultConfig获取动态Agent配置
    if (teamDefaultConfig?.team?.agents && Array.isArray(teamDefaultConfig.team.agents)) {
      const models = teamDefaultConfig.team.agents.map((agent: any) => {
        const displayName = agentDisplayNames[agent.agent_name] || agent.agent_name;
        const modelId = agent.current_config?.model_id || 'qwen3-30b-a3b-instruct-2507';
        
        // 根据模型ID确定提供商
        let provider = 'alibaba'; // 默认
        if (modelId.includes('gpt') || modelId.includes('openai')) {
          provider = 'openai';
        } else if (modelId.includes('gemini') || modelId.includes('google')) {
          provider = 'google';
        } else if (modelId.includes('qwen')) {
          provider = 'alibaba';
        }
        
        return {
          name: displayName,
          model: modelId,
          provider: provider,
          agentId: agent.agent_name
        };
      });
      
      console.log('🎯 getTeamAgentModels 返回模型数据:', models);
      return models;
    }
    
    // 回退到静态配置（兼容性）
    if (selectedTeam === 'general_qa_team_v2') {
      return [
        { name: '问题分解专家', model: 'qwen3-30b-a3b-instruct-2507', provider: 'alibaba' },
        { name: '实时翻译专家', model: 'gemini-2.5-flash-preview-thinking', provider: 'google' },
        { name: '知识检索专家', model: 'qwen3-30b-a3b-instruct-2507', provider: 'alibaba' },
        { name: '知识图谱专家', model: 'qwen3-30b-a3b-instruct-2507', provider: 'alibaba' },
        { name: '总结回答专家', model: 'qwen3-30b-a3b-instruct-2507', provider: 'alibaba' },
        { name: '协调器', model: 'qwen3-30b-a3b-instruct-2507', provider: 'alibaba' }
      ];
    }
    return [];
  };

  // 模型选择下拉菜单
  const teamAgentModels = getTeamAgentModels();
  console.log('🎯 Team模式下的Agent模型列表:', teamAgentModels);
  
  const modelDropdownItems = currentMode === 'team' 
    ? teamAgentModels.map((agent, index) => ({
        key: `agent_${index}`,
        label: (
          <div className="flex items-center justify-between p-2 hover:bg-gray-50/80 rounded-lg transition-all duration-200">
            <div className="flex items-center">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center mr-2 border shadow-sm ${
                agent.provider === 'alibaba' 
                  ? 'bg-gradient-to-br from-orange-50 to-red-100 border-orange-200' 
                  : agent.provider === 'google'
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200'
                  : 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200'
              }`}>
                {agent.provider === 'alibaba' ? <FireOutlined style={{ fontSize: '12px', color: '#c2410c' }} /> :
                 agent.provider === 'google' ? <StarOutlined style={{ fontSize: '12px', color: '#047857' }} /> :
                 <ApiOutlined style={{ fontSize: '12px', color: '#7c3aed' }} />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                <span className="text-xs text-gray-500">{agent.model}</span>
              </div>
            </div>
          </div>
        ),
        onClick: () => {
          console.log('🔥 点击Agent模型:', agent.name, agent.model);
          // 这里可以添加点击后的处理逻辑
          // 比如显示详细信息或切换到该Agent
        }
      }))
    : chatModels.map(model => {
        const provider = getModelProviderByID(model.id);
        return {
          key: model.id,
          label: (
            <div className="flex items-center justify-between p-2 hover:bg-gray-50/80 rounded-lg transition-all duration-200">
              <div className="flex items-center">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center mr-2 border shadow-sm ${
                  provider === 'alibaba' 
                    ? 'bg-gradient-to-br from-orange-50 to-red-100 border-orange-200' 
                    : provider === 'openai' || provider === 'moonshot'
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200'
                    : provider === 'google'
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200'
                    : provider === 'anthropic'
                    ? 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200'
                    : provider === 'meta'
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200'
                    : 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200'
                }`}>
                  {getModelIcon(model)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-700 text-sm break-words">
                    {model.alias || model.name}
                  </div>
                  <div className="text-xs text-gray-500/80">{provider === 'unknown' ? (model.provider || 'AI模型') : provider}</div>
                </div>
              </div>
              <div className="flex items-center justify-center w-8 h-5 ml-3">
                {model.id === modelConfig.llm.chatModel && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm ring-2 ring-green-200"></div>
                )}
              </div>
            </div>
          ),
          onClick: () => handleModelChange(model.id)
        };
      });



  return (
    <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40 ${isMobile ? 'w-[calc(100%-3rem)]' : 'w-full max-w-3xl px-6'} ${className}`}>
      {/* 翻译预览组件 - 显示在输入框上方 */}
      {enableTranslation && (
        <TranslationPreview
          inputText={inputText || value}
          enabled={enableTranslation}
          model={propCurrentModel || modelConfig.llm.chatModel}
          onClose={() => onTranslationChange?.(false)}
        />
      )}
      
      {/* 模式切换Tab - 小尺寸，带样式 */}
      {!hideModeSwitch && (
        <div className="max-w-4xl w-full mx-auto">
          <div className="flex justify-start">
            <div className="flex items-end">
            <button
              onClick={() => {
                onModeChange?.('default');
              }}
              className={`relative px-3 py-1.5 text-xs font-medium transition-all duration-200 flex items-center border border-b-0 ${
                currentMode === 'default'
                  ? 'text-white z-10 shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:shadow-sm border-gray-300'
              }`}
              style={{
                borderRadius: '4px 4px 0 0',
                fontSize: '11px',
                backgroundColor: currentMode === 'default' ? '#3b82f6' : undefined
              }}
            >
              <UserOutlined className="mr-1" style={{ fontSize: '10px' }} />
              专家模式
            </button>
            <button
              onClick={() => {
                onModeChange?.('team');
              }}
              className={`relative px-3 py-1.5 text-xs font-medium transition-all duration-200 flex items-center border border-b-0 ${
                currentMode === 'team'
                  ? 'text-white z-10 shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:shadow-sm border-gray-300'
              }`}
              style={{
                borderRadius: '4px 4px 0 0',
                fontSize: '11px',
                backgroundColor: currentMode === 'team' ? '#f97316' : undefined
              }}
            >
              <TeamOutlined className="mr-1" style={{ fontSize: '10px' }} />
              Team模式
            </button>
          </div>
        </div>
        </div>
      )}
      
      {/* 悬浮输入框 - 文件夹样式 */}
      <div className="w-full floating-input-container">
                  <div 
            className="relative transition-all duration-300"
            style={{
              background: 'transparent',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              border: currentMode === 'default' 
                ? '1px solid rgba(59, 130, 246, 0.4)' 
                : currentMode === 'team'
                ? '1px solid rgba(249, 115, 22, 0.4)'
                : '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '0 0 16px 16px',
              boxShadow: currentMode === 'default'
                ? '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(59, 130, 246, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(148, 163, 184, 0.08)'
                : currentMode === 'team'
                ? '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(249, 115, 22, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(148, 163, 184, 0.08)'
                : '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(148, 163, 184, 0.08)',
              overflow: 'hidden'
            }}
          >
          {/* 顶部光效 */}
          <div 
            className="absolute top-0 left-0 right-0 h-px opacity-60"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.5) 50%, transparent 100%)'
            }}
          />
          
          {/* 内容区域 */}
          <div className="relative z-10">
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/80">
            <div className="flex items-center space-x-3">
              {/* 智能体选择 */}
              {availableAgents.length > 0 && (
                <Dropdown menu={{ items: agentDropdownItems }} trigger={['click']} placement="topLeft">
                  <Button 
                    type="text" 
                    size="small"
                    className="flex items-center px-2 py-1 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center mr-2 border ${
                      currentMode === 'team'
                        ? 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200'
                        : getAgentBackgroundClass(currentAgent?.id)
                    }`} style={{ fontSize: '12px' }}>
                      {currentMode === 'team'
                        ? <TeamOutlined style={{ fontSize: '12px', color: '#f97316' }} />
                        : getAgentIcon(currentAgent?.id, { fontSize: '12px' })
                      }
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {currentMode === 'team' 
                        ? (selectedTeam === 'general_qa_team_v2' ? '通用智能问答团队V2' : '选择团队')
                        : (currentAgent?.name || '问答专家')
                      }
                    </span>
                  </Button>
                </Dropdown>
              )}
              
              {/* 分隔线 */}
              <div className="w-px h-4 bg-gray-200"></div>
              
              {/* 模型选择 */}
              <Dropdown 
                menu={{ items: modelDropdownItems }} 
                trigger={['click']} 
                placement="topLeft"
                overlayStyle={{ minWidth: '280px' }}
              >
                <Button 
                  type="text" 
                  size="small"
                  className="flex items-center px-2 py-1 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center mr-2 border ${
                    currentMode === 'team'
                      ? 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200'
                      : (() => {
                          const provider = currentModel ? getModelProviderByID(currentModel.id) : 'unknown';
                          return provider === 'alibaba' 
                            ? 'bg-gradient-to-br from-orange-50 to-red-100 border-orange-200' 
                            : provider === 'openai' || provider === 'moonshot'
                            ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200'
                            : provider === 'google'
                            ? 'bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200'
                            : provider === 'anthropic'
                            ? 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200'
                            : provider === 'meta'
                            ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200'
                            : 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200';
                        })()
                  }`} style={{ fontSize: '12px' }}>
                    {currentMode === 'team'
                      ? <ApartmentOutlined style={{ fontSize: '12px', color: '#f97316' }} />
                      : currentModel && getModelIcon(currentModel)
                    }
                  </div>
                  <span className="text-xs font-medium text-gray-600 truncate max-w-[160px]" title={
                    currentMode === 'team'
                      ? '多Agent模型'
                      : (currentModel?.alias || currentModel?.name || '选择模型')
                  }>
                    {currentMode === 'team'
                      ? '多Agent模型'
                      : (currentModel?.alias || currentModel?.name || '选择模型')
                    }
                  </span>
                </Button>
              </Dropdown>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* 移动端历史按钮 */}
              {isMobile && (
                <Tooltip title="对话历史">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<HistoryOutlined />}
                    onClick={onMobileHistoryOpen}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-all duration-200"
                  />
                </Tooltip>
              )}

              <Tooltip title="对话设置">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<SettingOutlined />}
                  onClick={() => setSettingsVisible(true)}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-all duration-200"
                />
              </Tooltip>
            </div>
          </div>

          {/* 输入区域 */}
          <div className="flex items-end px-4 py-4">
            <div className="flex-1 mr-3">
              <TextArea
                ref={textAreaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={disabled || loading}
                className="resize-none border-0 focus:ring-0 text-gray-800 placeholder-gray-400 bg-transparent"
                style={{
                  background: 'transparent',
                  boxShadow: 'none',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              {value.trim() && (
                <Tooltip title="清空输入">
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => onChange('')}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  />
                </Tooltip>
              )}

              
              <Tooltip title={loading ? "点击中断对话" : "发送消息 (Enter)"}>
                <Button
                  type="primary"
                  onClick={handleSend}
                  disabled={disabled || (!loading && !value.trim())}
                  className={`
                    relative overflow-hidden h-10 px-5 rounded-xl font-semibold 
                    transition-all duration-300 ease-out shadow-lg hover:shadow-xl
                    transform hover:scale-[1.02] active:scale-[0.98]
                    border-0 text-white
                    ${loading
                      ? `bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
                         shadow-red-500/25 hover:shadow-red-500/40 ring-2 ring-red-500/20 hover:ring-red-500/30`
                      : value.trim()
                      ? `bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black
                         shadow-gray-800/25 hover:shadow-gray-900/40 ring-2 ring-gray-700/20 hover:ring-gray-800/30` 
                      : `bg-gradient-to-r from-gray-300 to-gray-400 cursor-not-allowed
                         shadow-gray-300/20 ring-1 ring-gray-300/30 text-gray-500 hover:shadow-none hover:scale-100`
                    }
                  `}
                  style={{
                    background: loading
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      : value.trim()
                      ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
                      : 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
                    boxShadow: loading
                      ? '0 8px 25px -8px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                      : value.trim()
                      ? '0 8px 25px -8px rgba(31, 41, 55, 0.4), 0 0 0 1px rgba(31, 41, 55, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                      : '0 4px 12px -4px rgba(156, 163, 175, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '0.025em'
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-sm" style={{
                            background: 'white',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                        <span>中断</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 flex items-center justify-center">
                          <svg 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            className="w-4 h-4"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2.5} 
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        </div>
                        <span>发送</span>
                      </>
                    )}
                  </span>
                  {/* 光效背景 */}
                  <div 
                    className={`absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100 ${
                      !disabled && (loading || value.trim()) ? 'block' : 'hidden'
                    }`}
                    style={{
                      background: loading
                        ? 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)'
                        : 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)',
                      backgroundSize: '200% 200%',
                      animation: !disabled && (loading || value.trim()) ? 'shimmer 2s infinite' : 'none'
                    }}
                  />
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* 底部信息栏 */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3 flex-1">
              <Button 
                type="text" 
                size="small" 
                icon={<PlusOutlined style={{ fontSize: '12px' }} />}
                className="text-gray-400 hover:text-gray-600 text-xs hover:bg-gray-50 rounded-md px-2 py-1 transition-all duration-200"
              >
                附件
              </Button>
              
              {/* 分隔线 */}
              <div className="w-px h-4 bg-gray-200"></div>
              
              {/* 功能开关区域 */}
              <div className="flex items-center space-x-3">
                {/* 知识库检索开关 */}
                <Tooltip 
                  title={isQwen235bModel ? "qwen3-235b模型暂不支持知识库检索功能" : (searchKnowledge ? "已启用知识库检索" : "已禁用知识库检索")}
                  placement="top"
                >
                  <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-lg transition-all duration-200 ${
                    isQwen235bModel ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}>
                    <DatabaseOutlined 
                      style={{ 
                        fontSize: '14px', 
                        color: isQwen235bModel 
                          ? '#ff4d4f' 
                          : searchKnowledge 
                          ? '#52c41a' 
                          : '#d9d9d9'
                      }} 
                    />
                    <Switch
                      size="small"
                      checked={searchKnowledge && !isQwen235bModel}
                      onChange={isQwen235bModel ? undefined : onSearchKnowledgeChange}
                      disabled={isQwen235bModel}
                      style={{ minWidth: '28px' }}
                    />
                    <span className={`text-xs font-medium ${
                      isQwen235bModel ? 'text-red-500' : 'text-gray-600'
                    }`}>
                      知识库
                    </span>
                  </div>
                </Tooltip>
                
                {/* 检索模式选择下拉菜单 - 独立显示 */}
                {searchKnowledge && !isQwen235bModel && (
                  <Tooltip title="选择检索数据类型" placement="top">
                    <Dropdown 
                      menu={{
                        items: [
                          {
                            key: 'all',
                            label: (
                              <div className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 rounded-md transition-colors">
                                <span className="text-sm font-medium text-gray-700">全部检索</span>
                                <span className="text-xs text-gray-500">QA + 论文</span>
                              </div>
                            ),
                            onClick: () => onRetrievalModeChange?.('all')
                          },
                          {
                            key: 'qa_only', 
                            label: (
                              <div className="flex items-center justify-between px-3 py-2 hover:bg-green-50 rounded-md transition-colors">
                                <span className="text-sm font-medium text-gray-700">仅QA数据</span>
                                <span className="text-xs text-gray-500">问答库</span>
                              </div>
                            ),
                            onClick: () => onRetrievalModeChange?.('qa_only')
                          },
                          {
                            key: 'papers_only',
                            label: (
                              <div className="flex items-center justify-between px-3 py-2 hover:bg-orange-50 rounded-md transition-colors">
                                <span className="text-sm font-medium text-gray-700">仅论文数据</span>
                                <span className="text-xs text-gray-500">学术文献</span>
                              </div>
                            ),
                            onClick: () => onRetrievalModeChange?.('papers_only')
                          }
                        ],
                        selectable: true,
                        selectedKeys: [retrievalMode],
                        style: {
                          minWidth: '160px',
                          padding: '8px'
                        }
                      }}
                      trigger={['click']}
                      placement="topLeft"
                      overlayStyle={{
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        borderRadius: '8px'
                      }}
                    >
                      <Button
                        size="small"
                        className="flex items-center px-2 py-0.5 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200"
                        style={{ minWidth: '50px' }}
                      >
                        <span className="text-xs text-gray-600 font-medium">
                          {retrievalMode === 'all' ? '全部' : 
                           retrievalMode === 'qa_only' ? 'QA' : 
                           retrievalMode === 'papers_only' ? '论文' : '全部'}
                        </span>
                        <DownOutlined style={{ fontSize: '10px', marginLeft: '4px', color: '#666' }} />
                      </Button>
                    </Dropdown>
                  </Tooltip>
                )}
                
                {/* 知识图谱检索开关 - 放在检索模式选择的后面 */}
                <Tooltip 
                  title={searchGraph ? "已启用知识图谱检索" : "已禁用知识图谱检索"}
                  placement="top"
                >
                  <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-lg transition-all duration-200 hover:bg-gray-50">
                    <ApartmentOutlined 
                      style={{ 
                        fontSize: '14px', 
                        color: searchGraph ? '#1890ff' : '#d9d9d9'
                      }} 
                    />
                    <Switch
                      size="small"
                      checked={searchGraph}
                      onChange={onSearchGraphChange}
                      style={{ minWidth: '28px' }}
                    />
                    <span className="text-xs font-medium text-gray-600">
                      图谱
                    </span>
                  </div>
                </Tooltip>
                
                {/* 翻译开关 */}
                <Tooltip title={enableTranslation ? "已启用中英文翻译检索" : "已禁用翻译检索"}>
                  <div className="flex items-center space-x-1 px-1.5 py-0.5 hover:bg-gray-50 rounded-lg transition-all duration-200">
                    <TranslationOutlined 
                      style={{ 
                        fontSize: '14px', 
                        color: enableTranslation ? '#52c41a' : '#d9d9d9' 
                      }} 
                    />
                    <Switch
                      size="small"
                      checked={enableTranslation}
                      onChange={onTranslationChange}
                      style={{ minWidth: '28px' }}
                    />
                    <span className="text-xs font-medium text-gray-600">
                      翻译
                    </span>
                  </div>
                </Tooltip>
              </div>
            </div>
            <div className={`text-xs transition-colors font-mono ${
              value.length > 1800 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {value.length}/2000
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* 对话设置弹窗 */}
      <ChatSettings
        visible={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        settings={currentChatSettings}
        onSettingsChange={onChatSettingsChange || (() => {})}
        onTeamConfigSaved={onTeamConfigSaved}
        isMobile={isMobile}
      />
    </div>
  );
}; 