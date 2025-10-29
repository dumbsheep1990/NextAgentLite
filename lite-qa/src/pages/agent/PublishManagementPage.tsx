/**
 * 发布管理页面
 * 按单智能体和多智能体分类显示已发布的智能体
 */
import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Tabs, Spin, message, Modal, Tag, Button, Switch } from 'antd';
import { MessageOutlined, LinkOutlined, ApiOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userAgentService } from '../../services/userAgentService';
import { Grid } from '../../components/ui/agent-gradient-card';
import { EmptyState } from '../../components/ui/empty-state';
import { Bot, Workflow, Rocket } from 'lucide-react';

const { Title, Text } = Typography;

interface PublishedAgent {
  agent_id: string;
  agent_name: string;
  description?: string;
  icon?: string;
  color?: string;
  version: number;
  published_at: string;
  service_name?: string;
  publish_mode?: string;
  enabled?: boolean;
  deleted?: boolean;
  agent_type?: string;  // 用于区分单智能体和多智能体
}

const PublishManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [published, setPublished] = useState<PublishedAgent[]>([]);
  const [allAgents, setAllAgents] = useState<any[]>([]);

  // API说明弹窗
  const [apiOpen, setApiOpen] = useState(false);
  const [apiAgent, setApiAgent] = useState<PublishedAgent | null>(null);

  // 运行时设置弹窗
  const [rtOpen, setRtOpen] = useState(false);
  const [rtAgentId, setRtAgentId] = useState<string | null>(null);
  const [rtLoading, setRtLoading] = useState(false);
  const [rtModels, setRtModels] = useState<Array<{value:string,label:string}>>([]);
  const [rtModel, setRtModel] = useState<string>('');
  const [rtMulti, setRtMulti] = useState<boolean>(false);
  const [rtMaxRounds, setRtMaxRounds] = useState<number>(6);
  const [rtContextWin, setRtContextWin] = useState<number>(8);

  const loadPublished = async () => {
    try {
      setLoading(true);
      const [pub, agents] = await Promise.all([
        userAgentService.getPublishedAgents().catch(() => []),
        userAgentService.getMyAgents().catch(() => []),
      ]);

      // 合并agent_type信息
      const enriched = (pub || []).map((p: any) => {
        const agent = (agents || []).find((a: any) => a.id === p.agent_id);
        return {
          ...p,
          agent_type: agent?.agent_type || 'single'
        };
      });

      setPublished(enriched);
      setAllAgents(agents || []);
    } catch (e: any) {
      message.error(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublished();
  }, []);

  // 过滤单智能体和多智能体
  const singlePublished = published.filter(p => p.agent_type !== 'team');
  const teamPublished = published.filter(p => p.agent_type === 'team');

  // 发布卡片组件
  const PublishedCard: React.FC<{ agent: PublishedAgent }> = ({ agent }) => (
    <div className="relative p-6 rounded-3xl overflow-hidden min-h-[240px] flex flex-col transition-shadow duration-200"
         style={{
           background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
           border:'1px solid #d5e4f7',
           boxShadow:'0 2px 12px rgba(30,64,175,0.04)'
         }}>
      <Grid size={20} />

      {/* 顶部右上角 启用开关 */}
      <div style={{
        position:'absolute',
        top:10,
        right:10,
        display:'flex',
        alignItems:'center',
        gap:6,
        padding:'4px 8px',
        background:'#ffffffcc',
        border:'1px solid #d5e4f7',
        borderRadius:999
      }}>
        <span style={{ fontSize:12, color:'#64748b' }}>启用</span>
        <Switch
          size="small"
          disabled={!!agent.deleted}
          checked={!(agent.enabled===false) && !agent.deleted}
          onChange={async (checked)=>{
            try {
              await userAgentService.setPublishEnabled(agent.agent_id, checked);
              await loadPublished();
              message.success(checked ? '已启用' : '已禁用');
            } catch(e:any) {
              message.error(e?.message||'切换失败');
            }
          }}
        />
      </div>

      <div className="relative z-20 flex-1">
        <h3 className="text-lg font-bold mb-1" style={{ color:'#1f2937' }}>
          {agent.service_name || agent.agent_name}
        </h3>

        <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap: 'wrap' }}>
          <Tag color={agent.agent_type === 'team' ? 'orange' : 'blue'}>
            {agent.agent_type === 'team' ? 'Team' : '单体'}
          </Tag>
          <Tag color={'purple'}>API</Tag>
          <Tag>v{agent.version}</Tag>
          <Tag color={agent.enabled===false || agent.deleted ? 'red' : 'green'}>
            {agent.deleted ? '已删除' : (agent.enabled===false ? '已禁用' : '已启用')}
          </Tag>
        </div>

        <div style={{ color:'#6b7280', fontSize:12, marginBottom:12 }}>
          发布于 {new Date(agent.published_at).toLocaleString()}
        </div>

        <div className="mt-auto" style={{ display:'flex', gap:8, flexWrap: 'wrap' }}>
          <Button
            type="primary"
            icon={<MessageOutlined />}
            shape="round"
            size="small"
            onClick={()=> {
              const path = agent.agent_type === 'team'
                ? `/app/agent/team-studio?agentId=${encodeURIComponent(agent.agent_id)}`
                : `/app/agent/studio?agentId=${encodeURIComponent(agent.agent_id)}`;
              navigate(path);
            }}
            disabled={agent.enabled===false || agent.deleted}
            style={{ background:'#2563eb', borderColor:'#2563eb' }}
          >
            对话
          </Button>

          <Button
            icon={<LinkOutlined />}
            shape="round"
            size="small"
            onClick={()=> window.open(`/embed/agent/${encodeURIComponent(agent.agent_id)}`, '_blank')}
            disabled={agent.enabled===false || agent.deleted}
            style={{
              background: (agent.enabled===false || agent.deleted) ? undefined : '#10b981',
              borderColor:(agent.enabled===false || agent.deleted) ? undefined : '#10b981',
              color:(agent.enabled===false || agent.deleted)? undefined : '#fff'
            }}
          >
            嵌入页
          </Button>

          <Button
            icon={<ApiOutlined />}
            shape="round"
            size="small"
            onClick={()=> { setApiAgent(agent); setApiOpen(true); }}
            style={{ background:'#a855f7', borderColor:'#a855f7', color:'#fff' }}
          >
            API
          </Button>

          <Button
            shape="round"
            size="small"
            onClick={async ()=>{
              setRtOpen(true);
              setRtAgentId(agent.agent_id);
              setRtLoading(true);
              try {
                const models = await userAgentService.getAvailableModels().catch(()=>[]);
                setRtModels((models||[]).map((m:any)=>({ value:m.id, label: m.name })));
                const rs = await userAgentService.getRuntimeSettings(agent.agent_id);
                setRtModel(rs?.default_model || '');
                const chat = rs?.chat || {};
                setRtMulti(!!chat?.multi_turn);
                setRtMaxRounds(typeof chat?.max_rounds==='number'? chat?.max_rounds : 6);
                setRtContextWin(typeof chat?.context_window==='number'? chat?.context_window : 8);
              } catch(e:any) {
                message.error(e?.message||'加载设置失败');
              } finally {
                setRtLoading(false);
              }
            }}
            style={{ background:'#f59e0b', borderColor:'#f59e0b', color:'#fff' }}
          >
            设置
          </Button>
        </div>
      </div>

      <div className="relative z-20 mt-3 flex items-center justify-between">
        <div style={{ color:'#64748b', fontSize:12, maxWidth:'66%' }}>
          {agent.description || ' '}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Button
            danger
            size="small"
            shape="round"
            onClick={()=>{
              Modal.confirm({
                title: '确认删除发布版本',
                content: `确定要删除智能体"${agent.service_name || agent.agent_name}"的发布版本吗？删除后API和嵌入页面将无法访问。`,
                okText: '确认删除',
                cancelText: '取消',
                okButtonProps: { danger: true },
                onOk: async () => {
                  try {
                    await userAgentService.deletePublish(agent.agent_id);
                    message.success('删除发布版本成功');
                    await loadPublished();
                  } catch(e:any) {
                    message.error(e?.message||'删除失败');
                  }
                }
              });
            }}
          >
            删除
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>发布管理</Title>
        <Button icon={<ReloadOutlined />} onClick={loadPublished}>刷新</Button>
      </div>

      <Tabs
        items={[
          {
            key: 'single',
            label: `单智能体 (${singlePublished.length})`,
            children: (
              <Spin spinning={loading}>
                <Row gutter={[16, 16]}>
                  {singlePublished.map(p => (
                    <Col key={`${p.agent_id}-v${p.version}`} xs={24} sm={12} md={8} lg={6}>
                      <PublishedCard agent={p} />
                    </Col>
                  ))}
                  {(!loading && singlePublished.length === 0) && (
                    <Col span={24} style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                      <EmptyState
                        title="暂无已发布的单智能体"
                        description="在单智能体列表中点击发布按钮,即可发布智能体"
                        icons={[Bot, Rocket]}
                        variant="single-agent"
                        className="max-w-none w-full"
                      />
                    </Col>
                  )}
                </Row>
              </Spin>
            )
          },
          {
            key: 'team',
            label: `多智能体 (${teamPublished.length})`,
            children: (
              <Spin spinning={loading}>
                <Row gutter={[16, 16]}>
                  {teamPublished.map(p => (
                    <Col key={`${p.agent_id}-v${p.version}`} xs={24} sm={12} md={8} lg={6}>
                      <PublishedCard agent={p} />
                    </Col>
                  ))}
                  {(!loading && teamPublished.length === 0) && (
                    <Col span={24} style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                      <EmptyState
                        title="暂无已发布的多智能体"
                        description="在多智能体列表中点击发布按钮,即可发布智能体团队"
                        icons={[Workflow, Rocket]}
                        variant="team-agent"
                        className="max-w-none w-full"
                      />
                    </Col>
                  )}
                </Row>
              </Spin>
            )
          }
        ]}
      />

      {/* API说明弹窗（从AgentNavigationPage复制） */}
      <Modal
        title="API 调用说明"
        open={apiOpen}
        onCancel={()=>setApiOpen(false)}
        footer={null}
        width={700}
      >
        {apiAgent && (
          <div>
            <p><strong>智能体:</strong> {apiAgent.service_name || apiAgent.agent_name}</p>
            <p><strong>版本:</strong> v{apiAgent.version}</p>
            <p style={{marginTop:16}}><strong>API端点:</strong></p>
            <pre style={{background:'#f5f5f5', padding:12, borderRadius:8}}>
{`POST /api/v1/published-agent/${apiAgent.agent_id}/chat
Content-Type: application/json

{
  "message": "您的问题",
  "session_id": "可选的会话ID"
}`}
            </pre>
          </div>
        )}
      </Modal>

      {/* 运行时设置弹窗（从AgentNavigationPage复制） */}
      <Modal
        title="运行时设置"
        open={rtOpen}
        onCancel={()=>{setRtOpen(false); setRtAgentId(null);}}
        onOk={async ()=>{
          if(!rtAgentId) return;
          try {
            await userAgentService.updateRuntimeSettings(rtAgentId, {
              default_model: rtModel,
              chat: {
                multi_turn: rtMulti,
                max_rounds: rtMaxRounds,
                context_window: rtContextWin
              }
            });
            message.success('保存成功');
            setRtOpen(false);
          } catch(e:any) {
            message.error(e?.message||'保存失败');
          }
        }}
        confirmLoading={rtLoading}
      >
        <Spin spinning={rtLoading}>
          <div style={{display:'flex', flexDirection:'column', gap:16, marginTop:16}}>
            <div>
              <label style={{display:'block', marginBottom:8}}>默认模型:</label>
              <select
                value={rtModel}
                onChange={e=>setRtModel(e.target.value)}
                style={{width:'100%', padding:8, borderRadius:4, border:'1px solid #d9d9d9'}}
              >
                <option value="">请选择模型</option>
                {rtModels.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'flex', alignItems:'center', gap:8}}>
                <input type="checkbox" checked={rtMulti} onChange={e=>setRtMulti(e.target.checked)} />
                多轮对话
              </label>
            </div>
            <div>
              <label style={{display:'block', marginBottom:8}}>最大轮次:</label>
              <input
                type="number"
                value={rtMaxRounds}
                onChange={e=>setRtMaxRounds(Number(e.target.value))}
                style={{width:'100%', padding:8, borderRadius:4, border:'1px solid #d9d9d9'}}
              />
            </div>
            <div>
              <label style={{display:'block', marginBottom:8}}>上下文窗口:</label>
              <input
                type="number"
                value={rtContextWin}
                onChange={e=>setRtContextWin(Number(e.target.value))}
                style={{width:'100%', padding:8, borderRadius:4, border:'1px solid #d9d9d9'}}
              />
            </div>
          </div>
        </Spin>
      </Modal>
    </div>
  );
};

export default PublishManagementPage;
