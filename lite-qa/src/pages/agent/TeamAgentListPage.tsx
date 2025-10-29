/**
 * 多智能体列表页面
 * 显示用户创建的所有多智能体团队，支持创建、编辑、删除操作
 */
import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Input, Space, Button, Spin, message, Modal, Tag, Popover } from 'antd';
import { PlusOutlined, ReloadOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userAgentService } from '../../services/userAgentService';
import type { AgentTemplate, UserAgent } from '../../services/userAgentService';
import { AgentGradientCard, Grid } from '../../components/ui/agent-gradient-card';
import { EmptyState } from '../../components/ui/empty-state';
import { Users, Workflow, Puzzle } from 'lucide-react';

const { Title, Text } = Typography;

const TeamAgentListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<UserAgent[]>([]);
  const [query, setQuery] = useState('');

  // 模板选择弹窗状态
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);

  // 加载我的智能体（仅多智能体）
  const loadAgents = async () => {
    try {
      setLoading(true);
      const myAgents = await userAgentService.getMyAgents();
      // 过滤只显示多智能体（agent_type === 'team'）
      const teamAgents = (myAgents || []).filter(a => a.agent_type === 'team');
      setAgents(teamAgents);
    } catch (e: any) {
      message.error(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  // 搜索过滤
  const filteredAgents = agents.filter(a => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (a.agent_name || '').toLowerCase().includes(q) ||
           (a.description || '').toLowerCase().includes(q);
  });

  // 打开模板选择弹窗
  const handleCreateAgent = async () => {
    try {
      setTemplateLoading(true);
      setTemplateModalVisible(true);

      // 加载多智能体模板（优先显示测试/演示模板）
      const allTemplates = await userAgentService.getAgentTemplates();
      const teamTemplatesAll = (allTemplates || []).filter(t => t.template_type === 'team');

      // 优先匹配测试/演示/示例模板（与智能体导航一致）
      const testKeywords = ['测试','演示','示例','demo','test'];
      const teamSorted = [...teamTemplatesAll].sort((a,b)=>{
        const an = (a.template_name||'') + ((a as any).category||'');
        const bn = (b.template_name||'') + ((b as any).category||'');
        const as = testKeywords.some(k => an.toLowerCase().includes(k)) ? 1 : 0;
        const bs = testKeywords.some(k => bn.toLowerCase().includes(k)) ? 1 : 0;
        return bs - as;
      });

      setTemplates(teamSorted);
    } catch (e: any) {
      message.error(e?.message || '加载模板失败');
    } finally {
      setTemplateLoading(false);
    }
  };

  // 从模板创建智能体
  const handleSelectTemplate = (template: AgentTemplate) => {
    setTemplateModalVisible(false);
    // 导航到团队工作室，添加from参数用于返回
    navigate(`/app/agent/team-studio?templateId=${encodeURIComponent(template.id)}&from=team-agents`);
  };

  // 渲染模板详情内容（用于Popover）
  const renderTemplateDetail = (template: AgentTemplate) => (
    <div style={{ width: 320, padding: '8px 4px' }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>分类</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14, color: '#334155' }}>
            {(template as any).category || '通用'}
          </Text>
          {template.is_system && (
            <Tag color="green" style={{ margin: 0, fontSize: 11 }}>系统</Tag>
          )}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>描述</div>
        <Text style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
          {(template as any).description || '暂无描述'}
        </Text>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>我的多智能体</Title>
        <Space>
          <Input.Search
            allowClear
            placeholder="搜索智能体名称或描述"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: 280 }}
          />
          <Button icon={<ReloadOutlined />} onClick={loadAgents}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateAgent}>
            创建多智能体
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {filteredAgents.map(a => (
            <Col key={a.id} xs={24} sm={12} md={8} lg={6}>
              <AgentGradientCard
                type="user"
                agent={a as any}
                deletable={true}
                onChatWithAgent={(ag) => navigate(`/app/agent/team-studio?agentId=${encodeURIComponent(ag.id)}&from=team-agents`)}
                onEditAgent={(ag) => navigate(`/app/agent/team-studio?agentId=${encodeURIComponent(ag.id)}&openConfig=1&from=team-agents`)}
                onDeleteAgent={async (ag) => {
                  try {
                    // 检查是否有发布版本
                    const publishStatus = await userAgentService.checkPublishStatus(ag.id);

                    if (publishStatus.hasPublished) {
                      if (publishStatus.enabled) {
                        // 发布版本已启用，不允许删除
                        Modal.warning({
                          title: '无法删除',
                          content: `智能体"${ag.agent_name}"存在已启用的发布版本，请先在"智能体导航 > 已发布"中关闭或删除该发布版本。`,
                          okText: '我知道了'
                        });
                        return;
                      } else {
                        // 发布版本未启用，询问是否一起删除
                        Modal.confirm({
                          title: '检测到发布版本',
                          content: `智能体"${ag.agent_name}"存在未启用的发布版本，是否一起删除？`,
                          okText: '一起删除',
                          cancelText: '仅删除智能体',
                          okButtonProps: { danger: true },
                          onOk: async () => {
                            try {
                              await userAgentService.deletePublish(ag.id);
                              await userAgentService.deleteUserAgent(ag.id);
                              message.success('已删除智能体及其发布版本');
                              await loadAgents();
                            } catch(e: any) {
                              message.error(e?.message || '删除失败');
                            }
                          },
                          onCancel: async () => {
                            try {
                              await userAgentService.deleteUserAgent(ag.id);
                              message.success('已删除智能体');
                              await loadAgents();
                            } catch(e: any) {
                              message.error(e?.message || '删除失败');
                            }
                          }
                        });
                        return;
                      }
                    }

                    // 没有发布版本，直接确认删除
                    Modal.confirm({
                      title: '确认删除',
                      content: `确定要删除智能体"${ag.agent_name}"吗？`,
                      okText: '确认删除',
                      cancelText: '取消',
                      okButtonProps: { danger: true },
                      onOk: async () => {
                        try {
                          await userAgentService.deleteUserAgent(ag.id);
                          message.success('已删除');
                          await loadAgents();
                        } catch(e: any) {
                          message.error(e?.message || '删除失败');
                        }
                      }
                    });
                  } catch(e: any) {
                    message.error(e?.message || '检查发布状态失败');
                  }
                }}
                onPublishAgent={async (ag) => {
                  try {
                    // 检查是否已经发布
                    const publishStatus = await userAgentService.checkPublishStatus(ag.id);

                    if (publishStatus.hasPublished) {
                      Modal.info({
                        title: '智能体已发布',
                        content: `智能体"${ag.agent_name}"已经发布，版本 ${publishStatus.version}。您可以在"智能体导航 > 已发布"中管理发布版本。`,
                        okText: '我知道了'
                      });
                      return;
                    }

                    // 确认发布
                    Modal.confirm({
                      title: '确认发布',
                      content: `确定要发布智能体"${ag.agent_name}"吗？发布后将在智能体导航中显示。`,
                      okText: '确认发布',
                      cancelText: '取消',
                      onOk: async () => {
                        try {
                          await userAgentService.publishUserAgent(ag.id);
                          message.success('发布成功！可以在"智能体导航 > 已发布"中查看和管理。');
                          // 刷新列表
                          await loadAgents();
                        } catch (e: any) {
                          message.error(e?.message || '发布失败');
                        }
                      }
                    });
                  } catch (e: any) {
                    message.error(e?.message || '检查发布状态失败');
                  }
                }}
              />
            </Col>
          ))}
          {(!loading && filteredAgents.length === 0) && (
            <Col span={24} style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <EmptyState
                title="暂无多智能体团队"
                description="创建您的第一个多智能体团队,体验协作的力量"
                icons={[Users, Workflow, Puzzle]}
                action={{
                  label: "创建多智能体",
                  onClick: handleCreateAgent
                }}
                variant="team-agent"
                className="max-w-none w-full"
              />
            </Col>
          )}
        </Row>
      </Spin>

      {/* 模板选择弹窗 */}
      <Modal
        title={null}
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        footer={null}
        width={1000}
        styles={{
          body: { padding: 0 },
          content: {
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)'
          }
        }}
        closeIcon={
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            backdropFilter: 'blur(8px)'
          }}>
            <span style={{ fontSize: 16, color: '#64748b' }}>✕</span>
          </div>
        }
      >
        {/* 顶部标题区 - 带装饰背景 */}
        <div style={{
          position: 'relative',
          padding: '32px 32px 24px',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
          overflow: 'hidden',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20
        }}>
          {/* 背景装饰图案 */}
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(40px)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            filter: 'blur(30px)'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 14px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              borderRadius: 20,
              marginBottom: 12,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
            }}>
              <TeamOutlined style={{ fontSize: 16, color: '#ffffff' }} />
              <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 500 }}>多智能体</span>
            </div>
            <h2 style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 8,
              letterSpacing: '-0.5px'
            }}>
              创建多智能体应用
            </h2>
            <p style={{
              margin: 0,
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400
            }}>
              创建协作团队，体验多智能体的强大能力
            </p>
          </div>
        </div>

        {/* 内容区 */}
        <div style={{
          padding: '28px 32px 36px',
          background: '#fafbfc',
          position: 'relative',
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20
        }}>
          {/* 微妙的背景纹理 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.3,
            pointerEvents: 'none',
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(14, 165, 233, 0.05) 0%, transparent 40%),
              radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.05) 0%, transparent 40%)
            `
          }} />

          <Spin spinning={templateLoading}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <Row gutter={[18, 18]}>
                {templates.map(t => (
                  <Col key={t.id} xs={24} sm={12} md={8}>
                    <div style={{
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      willChange: 'transform'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                      e.currentTarget.style.filter = 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.1))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.filter = 'none';
                    }}>
                      <AgentGradientCard
                        type="template"
                        agent={t as any}
                        onCreateFromTemplate={handleSelectTemplate}
                        detailPopoverContent={renderTemplateDetail(t)}
                        detailPopoverTitle={<div style={{ fontWeight: 600, fontSize: 14 }}>{t.template_name}</div>}
                      />
                    </div>
                  </Col>
                ))}
                {(!templateLoading && templates.length === 0) && (
                  <Col span={24}>
                    <div style={{
                      textAlign: 'center',
                      padding: '48px 20px',
                      background: '#ffffff',
                      borderRadius: 16,
                      border: '2px dashed #e5e7eb'
                    }}>
                      <FileTextOutlined style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 12 }} />
                      <div><Text style={{ fontSize: 15, color: '#6b7280' }}>暂无可用模板</Text></div>
                    </div>
                  </Col>
                )}
              </Row>
            </div>
          </Spin>
        </div>
      </Modal>
    </div>
  );
};

export default TeamAgentListPage;
