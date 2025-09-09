/**
 * 对话设置组件 - 使用磨砂玻璃卡片样式
 */
import React, { useState, useEffect } from 'react';
import { Slider, InputNumber, Switch, Row, Col, Typography, Select, Card, Tag, message, Modal } from 'antd';
import { 
  SettingOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  ApiOutlined,
  CloseOutlined,
  TeamOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { teamService } from '../../services/teamService';
import { getApiBaseUrl } from '../../config/appConfig';
import './ChatSettings.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface ChatSettingsProps {
  visible: boolean;
  onCancel: () => void;
  settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
    maxTurns: number;
    enableStream: boolean;
    enableMemory: boolean;
    systemPrompt: string;
  };
  onSettingsChange: (settings: any) => void;
  onTeamConfigSaved?: () => void; // 新增：Team配置保存后的回调
  isMobile?: boolean;
}

// 智能体配置接口
interface AgentConfig {
  agent_name: string;
  current_config: {
    model_provider: string;
    model_id: string;
    temperature: number;
    max_tokens: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
  };
  available_models: Array<{
    provider: string;
    model: string;
    name: string;
  }>;
  instructions: string;
  tools: string[];
}

// Team配置接口
interface TeamConfig {
  team_name: string;
  agents: AgentConfig[];
  mode: string;
  coordinator: string;
}

export const ChatSettings: React.FC<ChatSettingsProps> = ({
  visible,
  onCancel,
  settings,
  onSettingsChange,
  onTeamConfigSaved,
  isMobile = false
}) => {
  const [activeTab, setActiveTab] = useState('conversation');
  const [teamConfig, setTeamConfig] = useState<TeamConfig | null>(null);
  const [originalTeamConfig, setOriginalTeamConfig] = useState<TeamConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 获取智能体配置
  useEffect(() => {
    if (visible && activeTab === 'agent') {
      fetchTeamConfig();
    }
  }, [visible, activeTab]);

  const fetchTeamConfig = async () => {
    setLoading(true);
    try {
      // 临时使用直接fetch来测试正确的路径
      const response = await fetch(`${getApiBaseUrl()}/advanced-qa/team/geopolymer_qa_team_v2/config`);
      if (response.ok) {
        const config = await response.json();
        setTeamConfig(config);
        setOriginalTeamConfig(JSON.parse(JSON.stringify(config))); // 深拷贝原始配置
        setHasChanges(false);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('获取智能体配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  // 本地配置更改，不立即保存
  const handleAgentConfigChange = (agentName: string, configChanges: any) => {
    if (!teamConfig) return;
    
    const updatedConfig = {
      ...teamConfig,
      agents: teamConfig.agents.map(agent => 
        agent.agent_name === agentName
          ? {
              ...agent,
              current_config: {
                ...agent.current_config,
                ...configChanges
              }
            }
          : agent
      )
    };
    
    setTeamConfig(updatedConfig);
    setHasChanges(true);
  };

  // 保存所有配置更改
  const handleSaveChanges = async () => {
    if (!teamConfig || !hasChanges) return;
    
    setSaving(true);
    try {
      let updatedCount = 0;
      
      // 逐个更新每个智能体的配置
      for (const agent of teamConfig.agents) {
        const originalAgent = originalTeamConfig?.agents.find(a => a.agent_name === agent.agent_name);
        
        // 检查是否有配置更改
        if (originalAgent && JSON.stringify(originalAgent.current_config) !== JSON.stringify(agent.current_config)) {
          // 构建符合后端期望的配置对象，只包含必要字段
          const configUpdate = {
            model_provider: agent.current_config.model_provider,
            model_id: agent.current_config.model_id,
            temperature: agent.current_config.temperature,
            max_tokens: agent.current_config.max_tokens,
            top_p: agent.current_config.top_p,
            frequency_penalty: agent.current_config.frequency_penalty,
            presence_penalty: agent.current_config.presence_penalty
          };
          
          // 临时使用直接fetch来测试正确的路径
          const response = await fetch(`${getApiBaseUrl()}/advanced-qa/agent/${agent.agent_name}/config`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(configUpdate)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`更新 ${agent.agent_name} 配置失败:`, response.status, errorText);
            throw new Error(`更新 ${agent.agent_name} 配置失败: ${response.status} ${response.statusText}`);
          }
          
          updatedCount++;
        }
      }
      
      // 如果有配置更新，刷新Team配置缓存
      if (updatedCount > 0) {
        // 调用父组件回调，通知Team配置已更新
        if (onTeamConfigSaved) {
          onTeamConfigSaved();
        }
      }
      
      // 保存成功后更新原始配置
      setOriginalTeamConfig(JSON.parse(JSON.stringify(teamConfig)));
      setHasChanges(false);
      
      // 显示成功消息
      message.success(`智能体配置保存成功${updatedCount > 0 ? `，更新了 ${updatedCount} 个Agent配置` : ''}`);
      
    } catch (error) {
      console.error('保存智能体配置失败:', error);
      message.error(`保存失败: ${error.message || '未知错误'}`);
      // 恢复到原始配置
      if (originalTeamConfig) {
        setTeamConfig(JSON.parse(JSON.stringify(originalTeamConfig)));
        setHasChanges(false);
      }
    } finally {
      setSaving(false);
    }
  };

  // 取消更改，恢复到原始配置
  const handleCancelChanges = () => {
    if (originalTeamConfig) {
      setTeamConfig(JSON.parse(JSON.stringify(originalTeamConfig)));
      setHasChanges(false);
    }
  };

  // 处理关闭对话框，检查未保存的更改
  const handleClose = () => {
    if (hasChanges && activeTab === 'agent') {
      Modal.confirm({
        title: '有未保存的更改',
        content: '您有未保存的智能体配置更改，确定要关闭吗？',
        okText: '放弃更改',
        cancelText: '继续编辑',
        okType: 'danger',
        onOk: () => {
          handleCancelChanges();
          onCancel();
        },
      });
    } else {
      onCancel();
    }
  };

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-3xl">
        <div className="relative settings-modal overflow-hidden rounded-xl">
          {/* 头部区域 */}
          <div className="settings-header p-4 relative">
            {/* 网格背景 */}
            <div className="absolute inset-0 opacity-10">
              <div 
                className="w-full h-full" 
                style={{ 
                  backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', 
                  backgroundSize: '15px 15px' 
                }} 
              />
            </div>
            
            <div className="relative flex items-center justify-between">
              {/* 左侧：图标和TAB按钮 */}
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-lg gradient-border inner-glow flex items-center justify-center">
                  <SettingOutlined className="text-indigo-400 text-lg" />
                </div>
                
                {/* TAB按钮 */}
                <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('conversation')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                      activeTab === 'conversation'
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <MessageOutlined className="text-blue-400" />
                    <span className="font-medium">对话设置</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('agent')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                      activeTab === 'agent'
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <TeamOutlined className="text-green-400" />
                    <span className="font-medium">智能体设置</span>
                  </button>
                </div>
              </div>
              
              {/* 右侧：关闭按钮 */}
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg glass hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                <CloseOutlined className="text-white/70 hover:text-white" />
              </button>
            </div>
          </div>

          {/* 分割线 */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {/* 内容区域 */}
          <div className="p-4 overflow-y-auto max-h-[70vh]">
            {activeTab === 'conversation' ? (
              <div className="space-y-5">
                {/* 模型参数 */}
                <div className="settings-card rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-7 h-7 rounded-lg glass flex items-center justify-center border border-orange-400/30">
                      <ThunderboltOutlined className="text-orange-400 text-sm" />
                    </div>
                    <span className="text-white font-medium text-sm">模型参数</span>
                  </div>

                  <div className="space-y-4">
                    {/* 温度设置 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Text className="text-white font-medium text-sm">创造性温度</Text>
                          <div className="text-xs text-white/60 mt-1">
                            控制回答的创造性和随机性
                          </div>
                        </div>
                        <div className="glass px-2 py-1 rounded border border-white/20">
                          <InputNumber
                            min={0}
                            max={2}
                            step={0.1}
                            value={settings.temperature}
                            onChange={(value) => handleChange('temperature', value)}
                            size="small"
                            className="w-16 text-white custom-input-number"
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.1) !important', 
                              color: 'white !important',
                              border: '1px solid rgba(255, 255, 255, 0.2) !important',
                              borderRadius: '4px !important'
                            }}
                          />
                        </div>
                      </div>
                      <Slider
                        min={0}
                        max={2}
                        step={0.1}
                        value={settings.temperature}
                        onChange={(value) => handleChange('temperature', value)}
                        trackStyle={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                        handleStyle={{ 
                          borderColor: '#6366f1',
                          backgroundColor: '#6366f1',
                          boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)'
                        }}
                        railStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      />
                      <div className="flex justify-between text-xs text-white/50 mt-1">
                        <span>精确</span>
                        <span>平衡</span>
                        <span>创造</span>
                      </div>
                    </div>

                    {/* 最大回复长度 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Text className="text-white font-medium text-sm">最大回复长度</Text>
                          <div className="text-xs text-white/60 mt-1">
                            限制单次回复的最大字符数
                          </div>
                        </div>
                        <div className="glass px-2 py-1 rounded border border-white/20">
                          <InputNumber
                            min={100}
                            max={4000}
                            step={100}
                            value={settings.maxTokens}
                            onChange={(value) => handleChange('maxTokens', value)}
                            size="small"
                            className="w-16 text-white custom-input-number"
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.1) !important', 
                              color: 'white !important',
                              border: '1px solid rgba(255, 255, 255, 0.2) !important',
                              borderRadius: '4px !important'
                            }}
                          />
                        </div>
                      </div>
                      <Slider
                        min={100}
                        max={4000}
                        step={100}
                        value={settings.maxTokens}
                        onChange={(value) => handleChange('maxTokens', value)}
                        trackStyle={{ background: 'linear-gradient(90deg, #10b981, #3b82f6)' }}
                        handleStyle={{ 
                          borderColor: '#10b981',
                          backgroundColor: '#10b981',
                          boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                        }}
                        railStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 对话管理 */}
                <div className="settings-card rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-7 h-7 rounded-lg glass flex items-center justify-center border border-green-400/30">
                      <MessageOutlined className="text-green-400 text-sm" />
                    </div>
                    <span className="text-white font-medium text-sm">对话管理</span>
                  </div>

                  <div className="space-y-4">
                    <Row align="middle" justify="space-between">
                      <Col span={16}>
                        <div>
                          <Text className="text-white font-medium text-sm">最大对话轮次</Text>
                          <div className="text-xs text-white/60 mt-1">
                            控制系统记忆的历史对话数量
                          </div>
                        </div>
                      </Col>
                      <Col span={8} className="text-right">
                        <div className="glass px-2 py-1 rounded border border-white/20 inline-block">
                          <InputNumber
                            min={1}
                            max={12}
                            value={settings.maxTurns}
                            onChange={(value) => handleChange('maxTurns', value)}
                            size="small"
                            className="w-16 text-white text-right custom-input-number"
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.1) !important', 
                              color: 'white !important',
                              border: '1px solid rgba(255, 255, 255, 0.2) !important',
                              borderRadius: '4px !important'
                            }}
                          />
                        </div>
                      </Col>
                    </Row>

                    <Row align="middle" justify="space-between">
                      <Col span={16}>
                        <div>
                          <Text className="text-white font-medium text-sm">流式输出</Text>
                          <div className="text-xs text-white/60 mt-1">
                            启用打字机效果，实时显示回答过程
                          </div>
                        </div>
                      </Col>
                      <Col span={8} className="text-right">
                        <Switch
                          checked={settings.enableStream}
                          onChange={(checked) => handleChange('enableStream', checked)}
                          size="small"
                          className="bg-white/20"
                        />
                      </Col>
                    </Row>

                    <Row align="middle" justify="space-between">
                      <Col span={16}>
                        <div>
                          <Text className="text-white font-medium text-sm">上下文记忆</Text>
                          <div className="text-xs text-white/60 mt-1">
                            保持对话连贯性，记住前面的交流内容
                          </div>
                        </div>
                      </Col>
                      <Col span={8} className="text-right">
                        <Switch
                          checked={settings.enableMemory}
                          onChange={(checked) => handleChange('enableMemory', checked)}
                          size="small"
                          className="bg-white/20"
                        />
                      </Col>
                    </Row>
                  </div>
                </div>

                {/* 快速配置 */}
                <div className="settings-card rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-7 h-7 rounded-lg glass flex items-center justify-center border border-purple-400/30">
                      <ApiOutlined className="text-purple-400 text-sm" />
                    </div>
                    <span className="text-white font-medium text-sm">快速配置</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        title: '专业模式',
                        desc: '精确回答',
                        colorClass: 'text-blue-400 group-hover:text-blue-300',
                        borderClass: 'border-blue-400/30 hover:border-blue-300/50',
                        config: { temperature: 0.1, topP: 0.3, maxTokens: 1500, maxTurns: 10 }
                      },
                      {
                        title: '平衡模式',
                        desc: '均衡回答',
                        colorClass: 'text-green-400 group-hover:text-green-300',
                        borderClass: 'border-green-400/30 hover:border-green-300/50',
                        config: { temperature: 0.7, topP: 0.8, maxTokens: 2000, maxTurns: 12 }
                      },
                      {
                        title: '创造模式',
                        desc: '创意回答',
                        colorClass: 'text-purple-400 group-hover:text-purple-300',
                        borderClass: 'border-purple-400/30 hover:border-purple-300/50',
                        config: { temperature: 1.2, topP: 0.9, maxTokens: 2500, maxTurns: 15 }
                      }
                    ].map((preset, index) => (
                      <div
                        key={index}
                        className={`glass rounded-lg p-3 cursor-pointer hover:bg-white/20 hover:shadow-lg hover:shadow-black/30 hover:scale-105 transition-all duration-300 border border-white/20 ${preset.borderClass} group`}
                        onClick={() => onSettingsChange({ ...settings, ...preset.config })}
                      >
                        <div className="text-center">
                          <div className={`${preset.colorClass} font-medium text-sm mb-1`}>
                            {preset.title}
                          </div>
                          <div className="text-xs text-white/60 group-hover:text-white/80">
                            {preset.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-white/60">加载智能体配置中...</div>
                  </div>
                ) : teamConfig ? (
                  <>
                    {/* Team信息 */}
                    <div className="settings-card rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-7 h-7 rounded-lg glass flex items-center justify-center border border-blue-400/30">
                          <CodeOutlined className="text-blue-400 text-sm" />
                        </div>
                        <span className="text-white font-medium text-sm">智能体团队</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Text className="text-white/80 text-sm">团队名称</Text>
                          <Text className="text-white font-medium">{teamConfig.team_name}</Text>
                        </div>
                        <div className="flex items-center justify-between">
                          <Text className="text-white/80 text-sm">协作模式</Text>
                          <Tag color="blue">{teamConfig.mode}</Tag>
                        </div>
                        <div className="flex items-center justify-between">
                          <Text className="text-white/80 text-sm">协调者</Text>
                          <Text className="text-white font-medium">{teamConfig.coordinator}</Text>
                        </div>
                      </div>
                    </div>

                    {/* 智能体列表 */}
                    <div className="space-y-4">
                      {teamConfig.agents.map((agent, index) => (
                        <div key={index} className="settings-card rounded-lg p-4">
                                                  <div className="flex items-center space-x-3 mb-4">
                          <div className="w-7 h-7 rounded-lg glass flex items-center justify-center border border-green-400/30">
                            <TeamOutlined className="text-green-400 text-sm" />
                          </div>
                          <span className="text-white font-medium text-sm">{agent.agent_name}</span>
                        </div>

                          <div className="space-y-4">
                            {/* 模型选择 */}
                            <div>
                              <Text className="text-white font-medium text-sm mb-2 block">模型配置</Text>
                              <div>
                                <Text className="text-white/60 text-xs block mb-1">选择模型</Text>
                                <Select
                                  value={agent.current_config.model_id}
                                  onChange={(value) => handleAgentConfigChange(agent.agent_name, {
                                    model_id: value
                                  })}
                                  size="small"
                                  className="w-full"
                                  style={{ background: 'transparent' }}
                                >
                                  {agent.available_models.map((model, idx) => (
                                    <Option key={idx} value={model.model}>{model.name}</Option>
                                  ))}
                                </Select>
                              </div>
                            </div>

                            {/* 模型参数 */}
                            <div>
                              <Text className="text-white font-medium text-sm mb-2 block">模型参数</Text>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Text className="text-white/60 text-xs block mb-1">温度</Text>
                                  <InputNumber
                                    min={0}
                                    max={2}
                                    step={0.1}
                                    value={agent.current_config.temperature}
                                    onChange={(value) => handleAgentConfigChange(agent.agent_name, {
                                      temperature: value
                                    })}
                                    size="small"
                                    className="w-full custom-input-number"
                                    style={{ 
                                      background: 'rgba(255, 255, 255, 0.1) !important', 
                                      color: 'white !important',
                                      border: '1px solid rgba(255, 255, 255, 0.2) !important',
                                      borderRadius: '6px !important'
                                    }}
                                  />
                                </div>
                                <div>
                                  <Text className="text-white/60 text-xs block mb-1">最大Token</Text>
                                  <InputNumber
                                    min={100}
                                    max={8000}
                                    step={100}
                                    value={agent.current_config.max_tokens}
                                    onChange={(value) => handleAgentConfigChange(agent.agent_name, {
                                      max_tokens: value
                                    })}
                                    size="small"
                                    className="w-full custom-input-number"
                                    style={{ 
                                      background: 'rgba(255, 255, 255, 0.1) !important', 
                                      color: 'white !important',
                                      border: '1px solid rgba(255, 255, 255, 0.2) !important',
                                      borderRadius: '6px !important'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 工具列表 */}
                            <div>
                              <Text className="text-white font-medium text-sm mb-2 block">可用工具</Text>
                              <div className="flex flex-wrap gap-2">
                                {agent.tools.map((tool, idx) => (
                                  <Tag key={idx} color="green" className="text-xs">
                                    {tool}
                                  </Tag>
                                ))}
                              </div>
                            </div>

                            {/* 指令 */}
                            <div>
                              <Text className="text-white font-medium text-sm mb-2 block">智能体指令</Text>
                              <div className="glass rounded p-3">
                                <Text className="text-white/80 text-xs leading-relaxed">
                                  {agent.instructions}
                                </Text>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-white/60">无法加载智能体配置</div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 底部操作按钮 - 仅在智能体设置时显示 */}
          {activeTab === 'agent' && teamConfig && (
            <div className="border-t border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {hasChanges && (
                    <div className="flex items-center space-x-2 text-orange-400">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-xs">有未保存的更改</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleCancelChanges}
                    disabled={!hasChanges}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      hasChanges
                        ? 'text-white/80 hover:text-white hover:bg-white/10 border border-white/20'
                        : 'text-white/40 cursor-not-allowed border border-white/10'
                    }`}
                  >
                    取消更改
                  </button>
                  
                  <button
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || saving}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      hasChanges && !saving
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        : saving
                        ? 'bg-blue-500/50 text-white cursor-not-allowed'
                        : 'bg-gray-500/50 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>保存中...</span>
                      </div>
                    ) : (
                      '保存配置'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};