/**
 * 对话设置组件 - 使用磨砂玻璃卡片样式
 */
import React, { useState, useEffect } from 'react';
import { Slider, InputNumber, Switch, Row, Col, Typography, Select, Tag, message, Modal, Button } from 'antd';
import { 
  SettingOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  ApiOutlined,
  TeamOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { getApiBaseUrl } from '../../config/appConfig';
import './ChatSettings.css';

const { Text } = Typography;
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
    <Modal
      title={
        <div className="flex items-center" style={{ padding: '2px 0' }}>
          <div className="w-5 h-5 rounded flex items-center justify-center mr-2" style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none'
          }}>
            <SettingOutlined style={{ fontSize: '10px', color: '#ffffff' }} />
          </div>
          <div>
            <div style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600' }}>对话设置</div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={900}
      height={600}
      centered
      destroyOnClose
      maskClosable={false}
      className="chat-settings-modal"
      styles={{
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)'
        },
        header: {
          padding: '12px 24px',
          borderBottom: '1px solid #f0f0f0',
          background: '#ffffff'
        },
        body: {
          padding: '16px 24px',
          background: '#ffffff',
          height: 'calc(600px - 57px)',
          overflow: 'hidden'
        }
      }}
      footer={null}
    >
      {/* TAB导航 */}
      <div className="flex space-x-1 bg-gray-50 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('conversation')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === 'conversation'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <MessageOutlined className="text-sm" />
          <span className="font-medium text-sm">对话设置</span>
        </button>
        <button
          onClick={() => setActiveTab('agent')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === 'agent'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <TeamOutlined className="text-sm" />
          <span className="font-medium text-sm">智能体设置</span>
        </button>
      </div>

      {/* 内容区域 */}
      <div className="h-full overflow-y-auto" style={{ maxHeight: 'calc(600px - 140px)' }}>
            {activeTab === 'conversation' ? (
              <div className="space-y-5">
                {/* 模型参数 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-7 h-7 rounded-lg glass flex items-center justify-center border border-orange-400/30">
                      <ThunderboltOutlined className="text-orange-400 text-sm" />
                    </div>
                    <span className="text-gray-800 font-medium text-sm">模型参数</span>
                  </div>

                  <div className="space-y-4">
                    {/* 温度设置 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Text className="text-gray-800 font-medium text-sm">创造性温度</Text>
                          <div className="text-xs text-gray-500 mt-1">
                            控制回答的创造性和随机性
                          </div>
                        </div>
                        <div className="bg-gray-50 px-2 py-1 rounded border border-gray-200">
                          <InputNumber
                            min={0}
                            max={2}
                            step={0.1}
                            value={settings.temperature}
                            onChange={(value) => handleChange('temperature', value)}
                            size="small"
                            className="w-16"
                            style={{
                              backgroundColor: '#fff',
                              borderColor: '#d1d5db'
                            }}
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
                          boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)',
                          border: '2px solid #6366f1',
                          borderRadius: '50%',
                          outline: 'none'
                        }}
                        railStyle={{ backgroundColor: '#e5e7eb' }}
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>精确</span>
                        <span>平衡</span>
                        <span>创造</span>
                      </div>
                    </div>

                    {/* 最大回复长度 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Text className="text-gray-800 font-medium text-sm">最大回复长度</Text>
                          <div className="text-xs text-gray-500 mt-1">
                            限制单次回复的最大字符数
                          </div>
                        </div>
                        <div className="bg-gray-50 px-2 py-1 rounded border border-gray-200">
                          <InputNumber
                            min={100}
                            max={4000}
                            step={100}
                            value={settings.maxTokens}
                            onChange={(value) => handleChange('maxTokens', value)}
                            size="small"
                            className="w-16"
                            style={{
                              backgroundColor: '#fff',
                              borderColor: '#d1d5db'
                            }}
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
                          boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
                          border: '2px solid #10b981',
                          borderRadius: '50%',
                          outline: 'none'
                        }}
                        railStyle={{ backgroundColor: '#e5e7eb' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 对话管理 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-7 h-7 rounded-lg glass flex items-center justify-center border border-green-400/30">
                      <MessageOutlined className="text-green-400 text-sm" />
                    </div>
                    <span className="text-gray-800 font-medium text-sm">对话管理</span>
                  </div>

                  <div className="space-y-4">
                    <Row align="middle" justify="space-between">
                      <Col span={16}>
                        <div>
                          <Text className="text-gray-800 font-medium text-sm">最大对话轮次</Text>
                          <div className="text-xs text-gray-500 mt-1">
                            控制系统记忆的历史对话数量
                          </div>
                        </div>
                      </Col>
                      <Col span={8} className="text-right">
                        <div className="bg-gray-50 px-2 py-1 rounded border border-gray-200 inline-block">
                          <InputNumber
                            min={1}
                            max={12}
                            value={settings.maxTurns}
                            onChange={(value) => handleChange('maxTurns', value)}
                            size="small"
                            className="w-16 text-right"
                            style={{
                              backgroundColor: '#fff',
                              borderColor: '#d1d5db'
                            }}
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
                          <Text className="text-gray-800 font-medium text-sm">流式输出</Text>
                          <div className="text-xs text-gray-500 mt-1">
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
                          <Text className="text-gray-800 font-medium text-sm">上下文记忆</Text>
                          <div className="text-xs text-gray-500 mt-1">
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
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-7 h-7 rounded-lg glass flex items-center justify-center border border-purple-400/30">
                      <ApiOutlined className="text-purple-400 text-sm" />
                    </div>
                    <span className="text-gray-800 font-medium text-sm">快速配置</span>
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
                        className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
                        onClick={() => onSettingsChange({ ...settings, ...preset.config })}
                        style={{ borderColor: preset.color + '20' }}
                      >
                        <div className="text-center">
                          <div className="font-medium text-sm mb-1" style={{ color: preset.color }}>
                            {preset.title}
                          </div>
                          <div className="text-xs text-gray-500">
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
                    <div className="text-gray-500">加载智能体配置中...</div>
                  </div>
                ) : teamConfig ? (
                  <>
                    {/* Team信息 */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-7 h-7 rounded-lg glass flex items-center justify-center border border-blue-400/30">
                          <CodeOutlined className="text-blue-400 text-sm" />
                        </div>
                        <span className="text-gray-800 font-medium text-sm">智能体团队</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Text className="text-gray-700 text-sm">团队名称</Text>
                          <Text className="text-gray-800 font-medium">{teamConfig.team_name}</Text>
                        </div>
                        <div className="flex items-center justify-between">
                          <Text className="text-gray-700 text-sm">协作模式</Text>
                          <Tag color="blue">{teamConfig.mode}</Tag>
                        </div>
                        <div className="flex items-center justify-between">
                          <Text className="text-gray-700 text-sm">协调者</Text>
                          <Text className="text-gray-800 font-medium">{teamConfig.coordinator}</Text>
                        </div>
                      </div>
                    </div>

                    {/* 智能体列表 */}
                    <div className="space-y-4">
                      {teamConfig.agents.map((agent, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                  <div className="flex items-center space-x-3 mb-4">
                          <div className="w-7 h-7 rounded-lg glass flex items-center justify-center border border-green-400/30">
                            <TeamOutlined className="text-green-400 text-sm" />
                          </div>
                          <span className="text-gray-800 font-medium text-sm">{agent.agent_name}</span>
                        </div>

                          <div className="space-y-4">
                            {/* 模型选择 */}
                            <div>
                              <Text className="text-gray-800 font-medium text-sm mb-2 block">模型配置</Text>
                              <div>
                                <Text className="text-gray-500 text-xs block mb-1">选择模型</Text>
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
                              <Text className="text-gray-800 font-medium text-sm mb-2 block">模型参数</Text>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Text className="text-gray-500 text-xs block mb-1">温度</Text>
                                  <InputNumber
                                    min={0}
                                    max={2}
                                    step={0.1}
                                    value={agent.current_config.temperature}
                                    onChange={(value) => handleAgentConfigChange(agent.agent_name, {
                                      temperature: value
                                    })}
                                    size="small"
                                    className="w-full"
                                    style={{
                                      backgroundColor: '#fff',
                                      borderColor: '#d1d5db'
                                    }}
                                    style={{ 
                                      background: 'rgba(255, 255, 255, 0.1) !important', 
                                      color: 'white !important',
                                      border: '1px solid rgba(255, 255, 255, 0.2) !important',
                                      borderRadius: '6px !important'
                                    }}
                                  />
                                </div>
                                <div>
                                  <Text className="text-gray-500 text-xs block mb-1">最大Token</Text>
                                  <InputNumber
                                    min={100}
                                    max={8000}
                                    step={100}
                                    value={agent.current_config.max_tokens}
                                    onChange={(value) => handleAgentConfigChange(agent.agent_name, {
                                      max_tokens: value
                                    })}
                                    size="small"
                                    className="w-full"
                                    style={{
                                      backgroundColor: '#fff',
                                      borderColor: '#d1d5db'
                                    }}
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
                              <Text className="text-gray-800 font-medium text-sm mb-2 block">可用工具</Text>
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
                              <Text className="text-gray-800 font-medium text-sm mb-2 block">智能体指令</Text>
                              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                                <Text className="text-gray-800/80 text-xs leading-relaxed">
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
                    <div className="text-gray-500">无法加载智能体配置</div>
                  </div>
                )}
              </div>
            )}
          </div>
          
      {/* 底部操作按钮 - 仅在智能体设置时显示 */}
      {activeTab === 'agent' && teamConfig && (
        <div className="border-t bg-gray-50 p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {hasChanges && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                  <span className="text-xs">有未保存的更改</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleCancelChanges}
                disabled={!hasChanges}
                size="small"
              >
                取消更改
              </Button>
              
              <Button
                type="primary"
                onClick={handleSaveChanges}
                disabled={!hasChanges || saving}
                loading={saving}
                size="small"
              >
                保存配置
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* 自定义滑动条样式 */}
      <style>{`
        .chat-settings-modal .ant-slider-handle {
          border-radius: 50% !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .chat-settings-modal .ant-slider-handle:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
        }
        .chat-settings-modal .ant-slider-handle:hover {
          outline: none !important;
        }
        .chat-settings-modal .ant-input-number {
          border: 1px solid #d1d5db !important;
        }
        .chat-settings-modal .ant-select .ant-select-selector {
          border: 1px solid #d1d5db !important;
        }
      `}</style>
    </Modal>
  );
};