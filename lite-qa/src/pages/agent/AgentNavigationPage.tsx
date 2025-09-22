/**
 * 智能体导航页面 - 独立的智能体管理和创建入口
 * 展示智能体卡片列表，支持创建新智能体和管理现有智能体
 */
import React, { useState, useEffect } from 'react';
import {
  Button, Row, Col, Typography, Space, Tag, Avatar, 
  Tooltip, message, Modal, Spin, Empty, Tabs
} from 'antd';
import {
  PlusOutlined, UserOutlined, TeamOutlined, ExperimentOutlined, SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userAgentService } from '../../services/userAgentService';
import type { AgentTemplate, UserAgent } from '../../services/userAgentService';
import AgentCreationWizard from './AgentCreationWizard';
import { AgentGradientCard } from '../../components/ui/agent-gradient-card';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const AgentNavigationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [activeTab, setActiveTab] = useState<'templates' | 'my-agents'>('templates');
  const [templateTypeTab, setTemplateTypeTab] = useState<'single' | 'team'>('single');
  const [creationWizardVisible, setCreationWizardVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, userAgentsData] = await Promise.all([
        userAgentService.getAgentTemplates(),
        userAgentService.getMyAgents()
      ]);
      setTemplates(templatesData);
      setUserAgents(userAgentsData);
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 处理基于模板创建
  const handleCreateFromTemplate = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setCreationWizardVisible(true);
  };

  // 处理开始对话
  const handleChatWithAgent = (agent: UserAgent) => {
    // 导航到对话页面，使用智能体ID作为参数
    if (agent.agent_type === 'team') {
      navigate(`/app/agent/team?agentId=${agent.id}`);
    } else {
      navigate(`/app/agent/single?agentId=${agent.id}`);
    }
  };

  // 处理编辑智能体
  const handleEditAgent = (agent: UserAgent) => {
    message.info('编辑功能开发中');
    // TODO: 实现编辑功能
  };

  // 处理删除智能体
  const handleDeleteAgent = (agent: UserAgent) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除智能体"${agent.agent_name}"吗？此操作不可恢复。`,
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await userAgentService.deleteUserAgent(agent.id);
          message.success('智能体删除成功');
          loadData(); // 重新加载数据
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      }
    });
  };

  // 处理创建完成
  const handleCreationComplete = () => {
    setCreationWizardVisible(false);
    setSelectedTemplate(null);
    loadData(); // 重新加载数据
    setActiveTab('my-agents'); // 切换到我的智能体标签
  };

  // 根据当前选择的类型过滤模板
  const filteredTemplates = templates.filter(template => template.template_type === templateTypeTab);
  
  // 获取当前类型的统计数量
  const getTemplateTypeCount = (type: 'single' | 'team') => {
    return templates.filter(t => t.template_type === type).length;
  };

  const getUserAgentTypeCount = (type: 'single' | 'team') => {
    return userAgents.filter(a => a.agent_type === type).length;
  };

  const renderAgentGrid = (agents: (AgentTemplate | UserAgent)[], type: 'template' | 'user') => {
    if (agents.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={type === 'template' ? '暂无可用模板' : '暂无智能体'}
        />
      );
    }

    return (
      <Row gutter={[16, 16]}>
        {agents.map((agent) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={6} key={agent.id}>
            <AgentGradientCard
              agent={agent}
              type={type}
              onCreateFromTemplate={type === 'template' ? handleCreateFromTemplate : undefined}
              onChatWithAgent={type === 'user' ? handleChatWithAgent : undefined}
              onEditAgent={type === 'user' ? handleEditAgent : undefined}
              onShowDetails={(agent) => {
                const isTemplate = type === 'template';
                if (isTemplate) {
                  message.info(`模板详情：${agent.description || '暂无详细描述'}`);
                } else {
                  message.info(`智能体详情：${agent.description || '暂无详细描述'}`);
                }
              }}
            />
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="p-6">
      <Spin spinning={loading}>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab as any}
        >
          <TabPane 
            tab={
              <span>
                <ExperimentOutlined />
                智能体模板
              </span>
            } 
            key="templates"
          >
            {/* 模板类型分类 */}
            <div className="mt-4 mb-6">
              <div className="flex items-center gap-2 rounded-lg p-1 w-fit" 
                   style={{ backgroundColor: '#f3f4f6' }}>
                <button
                  onClick={() => setTemplateTypeTab('single')}
                  className="px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 shadow-sm"
                  style={{
                    backgroundColor: templateTypeTab === 'single' ? '#ffffff' : 'transparent',
                    color: templateTypeTab === 'single' ? '#111827' : '#6b7280'
                  }}
                >
                  <UserOutlined className="mr-2" />
                  单体智能体
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full"
                        style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                    {getTemplateTypeCount('single')}
                  </span>
                </button>
                <button
                  onClick={() => setTemplateTypeTab('team')}
                  className="px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 shadow-sm"
                  style={{
                    backgroundColor: templateTypeTab === 'team' ? '#ffffff' : 'transparent',
                    color: templateTypeTab === 'team' ? '#111827' : '#6b7280'
                  }}
                >
                  <TeamOutlined className="mr-2" />
                  团队智能体
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full"
                        style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                    {getTemplateTypeCount('team')}
                  </span>
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              {renderAgentGrid(filteredTemplates, 'template')}
            </div>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <SettingOutlined />
                我的智能体 ({userAgents.length})
              </span>
            } 
            key="my-agents"
          >
            <div className="mt-4">
              {userAgents.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="还没有创建任何智能体"
                  children={
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => setCreationWizardVisible(true)}
                    >
                      创建第一个智能体
                    </Button>
                  }
                />
              ) : (
                <div>
                  {/* 单体智能体 */}
                  {userAgents.filter(agent => agent.agent_type === 'single').length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <UserOutlined className="text-blue-500" />
                        <Text strong className="text-base">单体智能体</Text>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                          {getUserAgentTypeCount('single')}
                        </span>
                      </div>
                      {renderAgentGrid(userAgents.filter(agent => agent.agent_type === 'single'), 'user')}
                    </div>
                  )}
                  
                  {/* 团队智能体 */}
                  {userAgents.filter(agent => agent.agent_type === 'team').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <TeamOutlined className="text-purple-500" />
                        <Text strong className="text-base">团队智能体</Text>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                          {getUserAgentTypeCount('team')}
                        </span>
                      </div>
                      {renderAgentGrid(userAgents.filter(agent => agent.agent_type === 'team'), 'user')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </Spin>

      {/* 智能体创建向导 */}
      <AgentCreationWizard
        visible={creationWizardVisible}
        onClose={() => {
          setCreationWizardVisible(false);
          setSelectedTemplate(null);
        }}
        onComplete={handleCreationComplete}
        preselectedTemplate={selectedTemplate}
      />
    </div>
  );
};

export default AgentNavigationPage;