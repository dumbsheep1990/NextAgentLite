/**
 * 智能体创建向导 - 多步骤创建流程
 * 支持模板选择、基础配置、知识库挂载、工具选择、模型配置
 */
import React, { useState, useEffect } from 'react';
import {
  Modal, Steps, Form, Input, Select, Switch, Checkbox, Button, 
  Card, Row, Col, message, Typography, Space, Tag, Tooltip,
  Slider, InputNumber, Divider, Alert, Spin, Tabs, Drawer
} from 'antd';
import {
  RobotOutlined, TeamOutlined, DatabaseOutlined, ToolOutlined,
  SettingOutlined, ExperimentOutlined, ApiOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { userAgentService } from '../../services/userAgentService';
import type { 
  AgentTemplate, AgentTool, KnowledgeCollection, ModelOption,
  CreateUserAgentRequest
} from '../../services/userAgentService';
import './agent-wizard.css';
import { listWorkflowTemplates, runWorkflowStream, runTemplateStream } from '../../services/workflowService';
import RetrievalExecPanel from '../../components/retrieval/RetrievalExecPanel';
import type { RetrievalPath } from '../../services/qaRoutingService';
import { getRetrievalPaths, getKBTemplates, applyTemplateById, updateTemplate } from '../../services/qaRoutingService';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface AgentCreationWizardProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  preselectedTemplate?: AgentTemplate | null;
}

interface FormData {
  // 步骤1: 模板选择和基础信息
  template_id: string;
  agent_name: string;
  description: string;

  // 步骤2: 知识库配置
  collection_id?: string;
  enable_knowledge_search: boolean;
  enable_graph_search: boolean;
  retrieval_mode: 'all' | 'qa_only' | 'papers_only';

  // 步骤3: 工具选择
  selected_tools: string[];
  tool_configs: Record<string, any>;

  // 步骤4: 模型配置
  model_id: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  custom_prompt: string;
  stream?: boolean;
  output_mode?: 'markdown' | 'html' | 'mixed';
}

const AgentCreationWizard: React.FC<AgentCreationWizardProps> = ({
  visible,
  onClose,
  onComplete,
  preselectedTemplate
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // 统一测试（运行）
  const [testOpen, setTestOpen] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [testMode, setTestMode] = useState<'workflow'|'template'>('workflow');
  const [testPrompt, setTestPrompt] = useState('请执行一次统一测试');
  const [templatesForTest, setTemplatesForTest] = useState<{ template_name: string }[]>([]);
  const [testTemplateName, setTestTemplateName] = useState<string>('');
  const [testEvents, setTestEvents] = useState<any[]>([]);
  const [testChatMessages, setTestChatMessages] = useState<Array<{ role:'user'|'assistant'; content:string; streaming?:boolean }>>([]);
  const [showRetrievalPanel, setShowRetrievalPanel] = useState<boolean>(false);
  const testRunHandle = React.useRef<{ abort: () => void } | null>(null);
  
  // 数据状态
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [collections, setCollections] = useState<KnowledgeCollection[]>([]);
  const [tools, setTools] = useState<AgentTool[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  
  // 表单数据
  const [formData, setFormData] = useState<FormData>({
    template_id: '',
    agent_name: '',
    description: '',
    collection_id: undefined,
    enable_knowledge_search: true,
    enable_graph_search: false,
    retrieval_mode: 'all',
    selected_tools: [],
    tool_configs: {},
    output_mode: 'markdown',
    model_id: 'qwen3-30b-a3b-instruct-2507',
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 0.8,
    custom_prompt: '',
    stream: false
  });
  // 当模型列表或所选模型变化时，如果超过该模型的 context_length，则回退到边界
  useEffect(() => {
    const ctx = models.find(m => m.id === formData.model_id)?.context_length || 4000;
    if (formData.max_tokens > ctx) {
      setFormData(prev => ({ ...prev, max_tokens: ctx }));
    }
  }, [formData.model_id, models]);
  
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  // 模板资源需求
  const [requirements, setRequirements] = useState<any[]>([]);
  const [requirementsOk, setRequirementsOk] = useState<boolean>(true);
  // 检索路径（随所选知识库联动）
  const [retrievalPaths, setRetrievalPaths] = useState<RetrievalPath[]>([]);
  const [rpSaving, setRpSaving] = useState<string>('');
  const [kbTemplates, setKbTemplates] = useState<any[]>([]);
  const [activeTplId, setActiveTplId] = useState<string | undefined>(undefined);
  const activeTpl = kbTemplates.find((t:any)=>t.id===activeTplId);

  // 详情/权重
  const [showDetail, setShowDetail] = useState(false);
  const [detailPath, setDetailPath] = useState<any>(null);
  const [showWeights, setShowWeights] = useState(false);
  const [weights, setWeights] = useState<Record<string, number>>({});

  // 加载初始数据
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const tasks = [
        userAgentService.getAgentTemplates(),            // 0: templates
        userAgentService.getKnowledgeCollections(),      // 1: collections
        userAgentService.getAvailableTools(),            // 2: tools
        userAgentService.getAvailableModels()            // 3: models
      ];
      const results = await Promise.allSettled(tasks);

      const [tplRes, colRes, toolRes, modelRes] = results as const;

      if (tplRes.status === 'fulfilled') setTemplates(tplRes.value);
      if (colRes.status === 'fulfilled') setCollections(colRes.value);
      if (toolRes.status === 'fulfilled') setTools(toolRes.value);
      else setTools([]);
      if (modelRes.status === 'fulfilled') setModels(modelRes.value);

      // 汇总错误但不阻断页面，指出具体失败项
      const parts = ['模板', '知识库', '工具', '模型'];
      const failed: string[] = [];
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          failed.push(parts[idx]);
          // 打印详细原因到控制台，便于排查（例如 9050 未启动导致“模型”失败）
          // eslint-disable-next-line no-console
          console.warn(`[AgentCreationWizard] 加载失败: ${parts[idx]}`, r.reason);
        }
      });
      if (failed.length > 0) {
        message.warning(`部分数据加载失败: ${failed.join('、')}（已使用可用数据）`);
      }

      // 如果有预选模板，设置到表单中
      if (preselectedTemplate) {
        setFormData(prev => ({
          ...prev,
          template_id: preselectedTemplate.id
        }));
        setSelectedTemplate(preselectedTemplate);
      }
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadInitialData();
      // 如果有预选模板，跳过模板选择步骤，直接进入基础信息配置
      setCurrentStep(preselectedTemplate ? 0 : 0);
      // 预加载模板列表用于测试运行
      (async () => {
        try {
          const list = await listWorkflowTemplates();
          setTemplatesForTest((list || []).map((x: any) => ({ template_name: x.template_name })));
        } catch {}
      })();
    }
  }, [visible, preselectedTemplate]);

  // 处理表单数据更新
  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // 处理模板选择
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    updateFormData({ template_id: templateId });
    // 拉取模板资源需求
    const code = template?.template_code || template?.template_name || '';
    if (code) {
      userAgentService.getTemplateRequirements(code).then(res => {
        setRequirements(res?.requirements || []);
      }).catch(()=> setRequirements([]));
    } else {
      setRequirements([]);
    }
  };

  // 监听知识库选择，加载检索路径
  useEffect(() => {
    (async () => {
      const kb = formData.collection_id;
      if (!kb) { setRetrievalPaths([]); return; }
      try {
        const list = await getRetrievalPaths(kb);
        setRetrievalPaths(list || []);
        const tpls = await getKBTemplates(kb);
        setKbTemplates(tpls || []);
        const def = (tpls||[]).find((t:any)=>t.is_default) || (tpls||[])[0];
        setActiveTplId(def?.id);
      } catch {
        setRetrievalPaths([]);
        setKbTemplates([]);
        setActiveTplId(undefined);
      }
    })();
  }, [formData.collection_id]);

  // 选择模板后自动应用（并刷新路径）
  useEffect(() => {
    (async () => {
      if (!formData.collection_id || !activeTplId) return;
      try {
        await applyTemplateById(activeTplId);
        const list = await getRetrievalPaths(formData.collection_id);
        setRetrievalPaths(list || []);
      } catch {}
    })();
  }, [activeTplId, formData.collection_id]);

  const onToggleRouteEnabled = async (rp: RetrievalPath, v: boolean) => {
    try {
      setRpSaving(rp.id);
      await updateRetrievalPath(rp.id, { is_enabled: v });
      setRetrievalPaths(prev => prev.map(x => x.id === rp.id ? { ...x, is_enabled: v } : x));
    } catch (e:any) {
      message.warning(e?.response?.data?.detail || '更新失败');
    } finally {
      setRpSaving('');
    }
  };

  const onUpdateRouteField = async (rp: RetrievalPath, patch: Partial<RetrievalPath>) => {
    try {
      setRpSaving(rp.id);
      await updateRetrievalPath(rp.id, patch);
      setRetrievalPaths(prev => prev.map(x => x.id === rp.id ? { ...x, ...patch } : x));
    } catch (e:any) {
      message.warning(e?.response?.data?.detail || '更新失败');
    } finally {
      setRpSaving('');
    }
  };

  // 验证当前步骤
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // 基础信息配置
        // 如果有预选模板，确保template_id已设置
        const templateId = preselectedTemplate ? preselectedTemplate.id : formData.template_id;
        if (!templateId || !formData.agent_name.trim()) {
          message.error('请填写智能体名称');
          return false;
        }
        // 确保表单数据中有template_id
        if (!formData.template_id && preselectedTemplate) {
          updateFormData({ template_id: preselectedTemplate.id });
        }
        // 基于模板资源需求做额外校验（异步不阻塞）
        const code = selectedTemplate?.template_code || selectedTemplate?.template_name;
        if (code) {
          const selections = { collection_id: formData.collection_id, embedding_model_id: formData.embedding_model_id, model_id: formData.model_id };
          userAgentService.validateTemplateResources(code, selections)
            .then(res => setRequirementsOk(res?.ok !== false))
            .catch(()=> setRequirementsOk(true));
        }
        return true;
      case 1: // 知识库配置
        return true; // 知识库配置是可选的
      case 2: // 工具选择
        return true; // 工具选择是可选的
      case 3: // 模型配置
        if (!formData.model_id) {
          message.error('请选择模型');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // 下一步
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  // 提交创建
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setSubmitting(true);
    try {
      const request: CreateUserAgentRequest = {
        template_id: formData.template_id,
        agent_name: formData.agent_name,
        description: formData.description || undefined,
        collection_id: formData.collection_id,
        enable_knowledge_search: formData.enable_knowledge_search,
        enable_graph_search: formData.enable_graph_search,
        retrieval_mode: formData.retrieval_mode,
        selected_tools: formData.selected_tools,
        tool_configs: formData.tool_configs,
        model_config: {
          default_model: formData.model_id,
          temperature: formData.temperature,
          max_tokens: formData.max_tokens,
          top_p: formData.top_p
        },
        custom_config: {
          ...(formData.custom_prompt ? { custom_prompt: formData.custom_prompt } : {}),
          ...(formData.output_mode ? { output_mode: formData.output_mode } : { output_mode: 'markdown' }),
          ...(formData.stream !== undefined ? { stream: formData.stream } : {}),
          resources: {
            ...(formData.collection_id ? { knowledge_collection: { collection_id: formData.collection_id } } : {}),
            ...(requirements?.some((r:any)=>r.type==='graph_service') ? { graph_service: { enabled: true, host: '127.0.0.1', port: 9622 } } : {}),
            ...(formData.embedding_model_id ? { embedding_model: { provider: formData.embedding_provider, model_id: formData.embedding_model_id } } : {})
          }
        }
      };

      await userAgentService.createUserAgent(request);
      message.success('智能体创建成功！');
      onComplete();
    } catch (error: any) {
      message.error(error.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染步骤1: 基础信息配置
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* 如果有预选模板，显示模板信息 */}
      {preselectedTemplate && (
        <div>
          <Title level={4}>已选择模板</Title>
          <Card className="border-blue-500 bg-blue-50">
            <div className="flex items-center space-x-4">
              <div className="text-3xl" style={{ color: preselectedTemplate.color }}>
                {preselectedTemplate.template_type === 'team' ? <TeamOutlined /> : <RobotOutlined />}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Title level={5} className="mb-0">{preselectedTemplate.template_name}</Title>
                  <Tag color={preselectedTemplate.template_type === 'team' ? 'blue' : 'green'}>
                    {preselectedTemplate.template_type === 'team' ? 'Team' : '单体'}
                  </Tag>
                  <Tag color="orange">{preselectedTemplate.category}</Tag>
                </div>
                <Text type="secondary" className="text-sm">
                  {preselectedTemplate.description}
                </Text>
              </div>
              <div>
                <Tooltip title="更换模板">
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => {
                      setSelectedTemplate(null);
                      updateFormData({ template_id: '' });
                    }}
                  >
                    更换
                  </Button>
                </Tooltip>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 如果没有预选模板，显示模板选择 */}
      {!preselectedTemplate && (
        <div>
          <Title level={4}>选择智能体模板</Title>
          <Row gutter={[16, 16]} className="mb-6">
            {templates.map(template => (
              <Col xs={24} sm={12} md={8} key={template.id}>
                <Card
                  hoverable
                  className={`cursor-pointer ${formData.template_id === template.id ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2" style={{ color: template.color }}>
                      {template.template_type === 'team' ? <TeamOutlined /> : <RobotOutlined />}
                    </div>
                    <Title level={5} className="mb-1">{template.template_name}</Title>
                    <Text type="secondary" className="text-xs">{template.category}</Text>
                    <Tag color={template.template_type === 'team' ? 'blue' : 'green'} className="mt-2">
                      {template.template_type === 'team' ? 'Team' : '单体'}
                    </Tag>
                  </div>
                  <Paragraph ellipsis={{ rows: 2 }} className="text-xs mt-2">
                    {template.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      <Divider />

      {/* 模板资源需求与可用性 */}
      {requirements && requirements.length > 0 && (
        <div>
          <Title level={5}>模板资源需求</Title>
          <div className="space-y-2">
            {requirements.map((r:any, idx:number)=>{
              if (r.type === 'knowledge_collection') {
                return (
                  <Alert key={idx} type={r.required ? 'warning' : 'info'} showIcon
                    message={`需要知识库（可用集合：${r.available_collections ?? 0}）${r.required ? '（必需）' : ''}`}
                  />
                );
              }
              if (r.type === 'graph_service') {
                const ok = r.healthy === true;
                return (
                  <Alert key={idx} type={ok ? 'success' : 'error'} showIcon
                    message={`图谱服务 ${r.host || '127.0.0.1'}:${r.port || 9622} ${ok ? '已就绪' : '未就绪'}`}
                  />
                );
              }
              if (r.type === 'mcp_server') {
                const ok = r.present === true;
                return (
                  <Alert key={idx} type={ok ? 'success' : 'error'} showIcon
                    message={`MCP 服务器 ${r.name} ${ok ? '存在' : '缺失'}`}
                  />
                );
              }
              if (r.type === 'embedding_model') {
                const ok = r.available === true;
                return (
                  <Alert key={idx} type={ok ? 'success' : 'error'} showIcon
                    message={`向量模型 provider=${r.provider || '-'} model=${r.model || '-'} ${ok ? '可用' : '不可用'}`}
                  />
                );
              }
              if (r.type === 'api_config') {
                const ok = r.present === true;
                return (
                  <Alert key={idx} type={ok ? 'success' : 'error'} showIcon
                    message={`API 配置 ${r.name} ${ok ? '存在' : '缺失'}`}
                  />
                );
              }
              return (
                <Alert key={idx} type='info' showIcon message={`${r.type}${r.required? '（必需）':''}`} />
              );
            })}
          </div>
        </div>
      )}

      <div>
        <Title level={4}>基础信息</Title>
        <Form layout="vertical">
          <Form.Item label="智能体名称" required>
            <Input
              placeholder="为您的智能体起一个名字"
              value={formData.agent_name}
              onChange={e => updateFormData({ agent_name: e.target.value })}
              maxLength={50}
            />
          </Form.Item>
          <Form.Item label="描述">
            <TextArea
              placeholder="描述这个智能体的功能和用途"
              value={formData.description}
              onChange={e => updateFormData({ description: e.target.value })}
              rows={3}
              maxLength={200}
            />
          </Form.Item>

          <Divider />

          <Form.Item label="输出模式">
            <Select
              value={formData.output_mode || 'markdown'}
              onChange={value => updateFormData({ output_mode: value })}
              style={{ width: '100%' }}
            >
              <Option value="markdown">
                <div>
                  <div style={{ fontWeight: 500 }}>Markdown</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>支持 Markdown 格式，代码高亮、表格等</div>
                </div>
              </Option>
              <Option value="html">
                <div>
                  <div style={{ fontWeight: 500 }}>HTML</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>支持原始 HTML 渲染（自动清理危险标签）</div>
                </div>
              </Option>
              <Option value="mixed">
                <div>
                  <div style={{ fontWeight: 500 }}>混合模式（智能识别）</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>自动检测内容格式，选择最佳渲染方式</div>
                </div>
              </Option>
            </Select>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              选择智能体输出内容的渲染方式，影响消息的显示效果
            </div>
          </Form.Item>

          <Form.Item label="流式输出">
            <Switch
              checked={!!formData.stream}
              onChange={(checked) => updateFormData({ stream: checked })}
              checkedChildren="开启"
              unCheckedChildren="关闭"
            />
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              开启后，模型将按打字机效果逐步返回内容
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );

  // 渲染步骤2: 知识库配置
  const renderStep2 = () => (
    <>
    <div className="space-y-6">
      <div>
        <Title level={4}>
          <DatabaseOutlined className="mr-2" />
          知识库配置
        </Title>
        <Text type="secondary">配置智能体的知识来源和检索方式</Text>
      </div>

      {requirements?.some((r:any)=>r.type==='knowledge_collection' && r.required) && (
        <Alert type="warning" showIcon message="当前模板需要选择一个知识库（必填）" className="mb-3" />
      )}

      <Form layout="vertical">
        <Form.Item label="选择知识库">
          <Select
            placeholder="选择一个知识库（可选）"
            value={formData.collection_id}
            onChange={value => updateFormData({ collection_id: value })}
            allowClear
            optionLabelProp="label"
          >
            {collections.map(c => (
              <Option key={c.id} value={c.id} label={
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <Tag color="geekblue" style={{ marginRight: 8 }}>{c.name}</Tag>
                  <span style={{ display:'inline-flex', gap:8, alignItems:'center' }}>
                    <Tag color="blue">{c.document_count} 文档</Tag>
                    <Tooltip title={c.id}>
                      <Tag>ID: {(() => {
                        const id = c.id || '';
                        const max = 22;
                        if (id.length <= max) return id;
                        const keep = Math.max(4, Math.floor((max - 3) / 2));
                        return id.slice(0, keep) + '...' + id.slice(-keep);
                      })()}</Tag>
                    </Tooltip>
                  </span>
                </div>
              }>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <Tag color="geekblue" style={{ marginRight: 8 }}>{c.name}</Tag>
                  <span style={{ display:'inline-flex', gap:8, alignItems:'center' }}>
                    <Tag color="blue">{c.document_count} 文档</Tag>
                    <Tooltip title={c.id}>
                      <Tag>ID: {(() => {
                        const id = c.id || '';
                        const max = 22;
                        if (id.length <= max) return id;
                        const keep = Math.max(4, Math.floor((max - 3) / 2));
                        return id.slice(0, keep) + '...' + id.slice(-keep);
                      })()}</Tag>
                    </Tooltip>
                  </span>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="启用知识库检索">
              <Switch
                checked={formData.enable_knowledge_search}
                onChange={value => updateFormData({ enable_knowledge_search: value })}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用图谱检索">
              <Switch
                checked={formData.enable_graph_search}
                onChange={value => updateFormData({ enable_graph_search: value })}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="检索模式">
          <Select
            value={formData.retrieval_mode}
            onChange={value => updateFormData({ retrieval_mode: value })}
          >
            <Option value="all">全部内容</Option>
            <Option value="qa_only">仅问答对</Option>
            <Option value="papers_only">仅论文</Option>
          </Select>
        </Form.Item>

        <Divider orientation="left">检索路径（随知识库联动）</Divider>
        {formData.collection_id && (
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom: 8 }}>
            <span style={{fontSize:12,color:'#64748b'}}>路由模板</span>
            <Select size="small" style={{ minWidth: 220 }} value={activeTplId} onChange={setActiveTplId}
              options={(kbTemplates||[]).map((t:any)=>({ value:t.id, label:t.template_name }))} placeholder="选择模板后自动应用" />
            {activeTpl?.mode && (
              <Tag color={String(activeTpl.mode).toLowerCase()==='force' ? 'red' : String(activeTpl.mode).toLowerCase()==='custom' ? 'gold' : 'blue'}>
                模式：{String(activeTpl.mode).toLowerCase()==='force' ? '强制' : String(activeTpl.mode).toLowerCase()==='custom' ? '自定义' : '平衡'}
              </Tag>
            )}
            {activeTpl?.mode === 'custom' && (
              <Button size="small" onClick={()=>{
                const map: Record<string, number> = {};
                retrievalPaths.forEach(p => { map[p.path_name] = weights[p.path_name] ?? 1.0; });
                setWeights(map); setShowWeights(true);
              }}>权重设置</Button>
            )}
            <Button size="small" type="link" onClick={()=>{
              if (!formData.collection_id) return;
              window.open(`/app/knowledge/qa-routing?kb=${encodeURIComponent(formData.collection_id)}`, '_blank');
            }}>前往路由编辑</Button>
          </div>
        )}
        {(!formData.collection_id) && (
          <Alert type="info" showIcon message="请选择知识库后加载其检索路径" />
        )}
        {formData.collection_id && retrievalPaths.length === 0 && (
          <Alert type="warning" showIcon message="当前知识库尚未配置检索路径，系统将使用默认策略" />
        )}
        {formData.collection_id && retrievalPaths.length > 0 && (
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 8 }}>
            {retrievalPaths.map((rp, idx) => (
              <div key={rp.id} style={{ display:'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems:'center', padding: '8px 6px', borderBottom: idx === retrievalPaths.length-1 ? 'none' : '1px dashed #f0f0f0' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{
                    display:'inline-flex', width:22, height:22, borderRadius:11,
                    background:'#eef2ff', color:'#4338ca', fontSize:12, alignItems:'center', justifyContent:'center'
                  }}>{rp.path_order}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{rp.path_name}</div>
                    <div style={{ fontSize:12, color:'#64748b' }}>
                      来源：{rp.source_type === 'qa_routes' ? '问答路由' : rp.source_type === 'qa_datasets' ? 'QA数据集' : '知识文档'}
                    </div>
                  </div>
                </div>
                <div>
                  <Space size={8}>
                    <Tag color={rp.is_enabled ? 'green' : 'red'}>{rp.is_enabled ? '启用' : '停用'}</Tag>
                    <Button size="small" onClick={()=>{ setDetailPath(rp); setShowDetail(true); }}>详情</Button>
                  </Space>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 若模板需要向量模型，提供绑定选择 */}
        {requirements?.some((r:any)=>r.type==='embedding_model') && (
          <>
            <Title level={5}>向量模型绑定</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Provider">
                  <Select
                    placeholder="选择Provider"
                    value={formData.embedding_provider}
                    onChange={(v)=> updateFormData({ embedding_provider: v, embedding_model_id: undefined })}
                    allowClear
                  >
                    {Object.keys(embeddingMap).map(p => (
                      <Option key={p} value={p}>{p}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Model">
                  <Select
                    placeholder="选择向量模型"
                    value={formData.embedding_model_id}
                    onChange={(v)=> updateFormData({ embedding_model_id: v })}
                    allowClear
                    disabled={!formData.embedding_provider}
                    showSearch
                    filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
                  >
                    {(embeddingMap[formData.embedding_provider || ''] || []).map((m:any)=> (
                      <Option key={m.id} value={m.id}>{m.id}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </Form>
    </div>
    {/* 详情 */}
    <Modal open={showDetail} onCancel={()=>setShowDetail(false)} onOk={()=>setShowDetail(false)} title="路径详情" width={680}>
      {detailPath ? (
        <div style={{ lineHeight: 1.9 }}>
          <div>顺序：{detailPath.path_order}</div>
          <div>名称：{detailPath.path_name}</div>
          <div>来源：{detailPath.source_type}</div>
          <div>状态：{detailPath.is_enabled ? '启用' : '停用'}</div>
          <div>最小置信：{detailPath.min_confidence}</div>
          <div>最大结果：{detailPath.max_results}</div>
          <div>失败动作：{detailPath.fallback_action}</div>
          <div style={{ marginTop: 8 }}>执行设计（只读）：</div>
          <pre style={{ background:'#f8fafc', padding:10, borderRadius:6, maxHeight:220, overflow:'auto' }}>{JSON.stringify(detailPath.config, null, 2)}</pre>
          <Alert type="info" showIcon message="如需修改路径或配置，请前往“问答路由”页面进行编辑。" />
        </div>
      ) : null}
    </Modal>

    {/* 权重设置 */}
    <Modal open={showWeights} onCancel={()=>setShowWeights(false)} onOk={async()=>{ if(activeTplId){ await updateTemplate(activeTplId,{ weights }); setShowWeights(false);} }} title="自定义权重设置" width={520} okText="保存">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:12 }}>
        {retrievalPaths.map(p => (
          <React.Fragment key={p.id}>
            <div style={{ display:'flex', flexDirection:'column' }}>
              <span style={{ fontWeight: 600 }}>{p.path_name}</span>
              <span style={{ fontSize:12, color:'#64748b' }}>{p.source_type}</span>
            </div>
            <InputNumber min={0} max={10} step={0.1} value={weights[p.path_name] ?? 1.0} onChange={(v)=>setWeights(prev=>({ ...prev, [p.path_name]: Number(v||0) }))} />
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <Alert type="info" showIcon message="这些权重会保存到当前选中模板（自定义模式）用于结果聚合重排。" />
      </div>
    </Modal>
    </>
  );

  // 渲染步骤3: 工具选择
  const renderStep3 = () => {
    // 分组并去重（以 tool_code）
    const dedup = (arr: AgentTool[]) => {
      const map = new Map<string, AgentTool>();
      arr.forEach(t => { if (!map.has(t.tool_code)) map.set(t.tool_code, t); });
      return Array.from(map.values());
    };
    const builtin = dedup(tools.filter(t => t.tool_type === 'builtin'));
    const mcp = dedup(tools.filter(t => t.tool_type === 'mcp'));
    const api = dedup(tools.filter(t => t.tool_type === 'api'));
    const custom = dedup(tools.filter(t => t.tool_type !== 'builtin' && t.tool_type !== 'mcp' && t.tool_type !== 'api'));

    const ToolList: React.FC<{items: AgentTool[]}> = ({items}) => (
      items.length === 0 ? (
        <Text type="secondary" className="text-xs">暂无</Text>
      ) : (
        <div className="space-y-2">
          {items.map(tool => (
            <Card
              key={tool.tool_code}
              size="small"
              className={`cursor-pointer ${formData.selected_tools.includes(tool.tool_code) ? 'border-blue-500 bg-blue-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={formData.selected_tools.includes(tool.tool_code)}
                    onChange={e => {
                      const selected = e.target.checked
                        ? [...formData.selected_tools, tool.tool_code]
                        : formData.selected_tools.filter(code => code !== tool.tool_code);
                      updateFormData({ selected_tools: selected });
                    }}
                  />
                  <div>
                    <Text strong>{tool.tool_name}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">{tool.description}</Text>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    );

    return (
      <div className="space-y-4">
        <div>
          <Title level={4}><ToolOutlined className="mr-2" />工具选择</Title>
          <Text type="secondary">选择智能体可以使用的工具（内置/MCP/API/自定义）</Text>
        </div>
        <Tabs defaultActiveKey="builtin">
          <Tabs.TabPane tab={<span>内置工具 <Tag color="blue">{builtin.length}</Tag></span>} key="builtin">
            <ToolList items={builtin} />
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span>MCP 服务 <Tag color="blue">{mcp.length}</Tag></span>} key="mcp">
            <ToolList items={mcp} />
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span>API 配置 <Tag color="blue">{api.length}</Tag></span>} key="api">
            <ToolList items={api} />
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span>自定义工具 <Tag color="blue">{custom.length}</Tag></span>} key="custom">
            <ToolList items={custom} />
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  };

  // 渲染步骤4: 模型配置
  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <Title level={4}>
          <SettingOutlined className="mr-2" />
          模型配置
        </Title>
        <Text type="secondary">配置智能体使用的语言模型和参数</Text>
      </div>

      <Form layout="vertical">
        <Form.Item label="选择模型" required>
          <Select
            value={formData.model_id}
            onChange={value => updateFormData({ model_id: value })}
            popupClassName="agent-wizard-select-dropdown"
            optionLabelProp="label"
            dropdownMatchSelectWidth
          >
            {(() => {
              // 按 provider 分组显示
              const groups: Record<string, typeof models> = {};
              models.forEach(m => {
                const key = m.provider || '未分组';
                if (!groups[key]) groups[key] = [] as any;
                groups[key].push(m);
              });
              return Object.entries(groups).map(([prov, items]) => (
                <Select.OptGroup key={prov} label={prov}>
                  {items.map((model) => (
                    <Option key={model.id} value={model.id} label={model.name}>
                      <div>
                        <Text strong>{model.name}</Text>
                        <br />
                        <Text type="secondary" className="text-xs">{model.description}</Text>
                      </div>
                    </Option>
                  ))}
                </Select.OptGroup>
              ));
            })()}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Temperature">
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={formData.temperature}
                onChange={value => updateFormData({ temperature: value })}
              />
              <InputNumber
                min={0}
                max={1}
                step={0.1}
                value={formData.temperature}
                onChange={value => updateFormData({ temperature: value || 0.7 })}
                size="small"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Max Tokens">
              <Slider
                min={100}
                max={(models.find(m => m.id === formData.model_id)?.context_length || 4000)}
                step={50}
                value={formData.max_tokens}
                onChange={value => updateFormData({ max_tokens: value })}
              />
              <InputNumber
                min={100}
                max={(models.find(m => m.id === formData.model_id)?.context_length || 4000)}
                step={50}
                value={formData.max_tokens}
                onChange={value => updateFormData({ max_tokens: value || 2000 })}
                size="small"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Top P">
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={formData.top_p}
                onChange={value => updateFormData({ top_p: value })}
              />
              <InputNumber
                min={0}
                max={1}
                step={0.1}
                value={formData.top_p}
                onChange={value => updateFormData({ top_p: value || 0.8 })}
                size="small"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="自定义系统提示词（可选）">
          <TextArea
            placeholder="输入自定义的系统提示词，将与模板提示词合并使用"
            value={formData.custom_prompt}
            onChange={e => updateFormData({ custom_prompt: e.target.value })}
            rows={4}
          />
        </Form.Item>
      </Form>
    </div>
  );

  const steps = [
    {
      title: preselectedTemplate ? '基础信息' : '选择模板',
      content: renderStep1(),
      icon: <ExperimentOutlined />
    },
    {
      title: '知识库配置',
      content: renderStep2(),
      icon: <DatabaseOutlined />
    },
    {
      title: '工具选择',
      content: renderStep3(),
      icon: <ToolOutlined />
    },
    {
      title: '模型配置',
      content: renderStep4(),
      icon: <SettingOutlined />
    }
  ];

  return (
    <Modal
      title="创建智能体"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Steps current={currentStep} className="mb-6">
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        <div className="mb-6" style={{ minHeight: '400px' }}>
          {steps[currentStep]?.content}
        </div>

        <div className="flex justify-between">
          <Button
            disabled={currentStep === 0}
            onClick={handlePrev}
          >
            上一步
          </Button>
          <Space>
            <Button onClick={onClose}>
              取消
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            ) : (
              <Button 
                type="primary" 
                loading={submitting}
                onClick={async ()=>{
                  if (selectedTemplate?.template_code) {
                    try {
                      const res = await userAgentService.validateTemplateResources(selectedTemplate.template_code, { collection_id: formData.collection_id, model_id: formData.model_id });
                      if (res?.ok === false) {
                        message.error(`资源未满足：${(res.missing||[]).join('、')}`);
                        return;
                      }
                    } catch {}
                  }
                  await handleSubmit();
                }}
                icon={<CheckCircleOutlined />}
              >
                创建智能体
              </Button>
            )}
            {/* 统一测试按钮：不阻断创建，可先行运行 */}
            <Button
              onClick={() => { setTestOpen(true); setTestEvents([]); setTestRunning(false); }}
              type="default"
            >
              测试运行
            </Button>
          </Space>
        </div>
      </Spin>
      {/* 统一测试抽屉 */}
      <Drawer open={testOpen} onClose={() => { setTestOpen(false); try { testRunHandle.current?.abort(); } catch{} setTestRunning(false); }} width={860} title="统一测试运行">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Select value={testMode} onChange={(v)=>setTestMode(v)} style={{ width: 160 }}>
              <Select.Option value="workflow">工作流（当前选择）</Select.Option>
              <Select.Option value="template">模板（DAG）</Select.Option>
            </Select>
            {testMode === 'template' && (
              <Select placeholder="选择模板" value={testTemplateName} onChange={setTestTemplateName} style={{ width: 240 }} allowClear>
                {templatesForTest.map(t => (<Select.Option key={t.template_name} value={t.template_name}>{t.template_name}</Select.Option>))}
              </Select>
            )}
          </Space>
          <Input.TextArea rows={3} placeholder="测试提示词（可选）" value={testPrompt} onChange={e=>setTestPrompt(e.target.value)} />
          <Space>
            {!testRunning ? (
              <Button type="primary" onClick={async ()=>{
                setTestEvents([]);
                setTestChatMessages([]);
                setTestRunning(true);
                try {
                  if (testMode === 'workflow') {
                    // 基于当前向导选择运行一次工作流
                    if (testPrompt && testPrompt.trim()) {
                      setTestChatMessages(prev => [...prev, { role:'user', content: testPrompt.trim() }]);
                    }
                    testRunHandle.current = await runWorkflowStream({
                      agent_name: formData.agent_name || 'workflow_agent',
                      prompt: testPrompt || '统一测试',
                      selected_tools: formData.selected_tools,
                      model: formData.model_id,
                      save_session: true,
                      stream: !!formData.stream,
                      // 将知识库与检索模式透传给后端以获得检索事件
                      ...(formData.collection_id ? { collection_id: formData.collection_id } : {}),
                      retrieval_mode: 'auto'
                    }, (ev)=> {
                      // 仅将 step_event 中的数据部分（含 stage 字段）写入检索面板事件
                      try {
                        if (ev && ev.type === 'step_event' && ev.data && (ev.data.stage === 'retrieve' || ev.data.stage === 'retrieve_graph')) {
                          setTestEvents(prev => [...prev, ev.data]);
                        }
                      } catch {}
                      try {
                        const payload: any = (ev && ev.type === 'step_event' && ev.data) ? ev.data : ev;
                        if (payload?.stage === 'execute') {
                          if (typeof payload.delta === 'string' && payload.delta.length) {
                            const token = payload.delta as string;
                            setTestChatMessages(prev => {
                              const arr = [...prev];
                              if (!arr.length || arr[arr.length-1].role !== 'assistant') {
                                arr.push({ role:'assistant', content: token, streaming: true });
                              } else {
                                const last = { ...arr[arr.length-1] } as any;
                                last.content = (last.content || '') + token;
                                arr[arr.length-1] = last;
                              }
                              return arr;
                            });
                            return;
                          }
                          if (typeof payload.result === 'string' && payload.result.trim().length) {
                            const full = payload.result as string;
                            setTestChatMessages(prev => {
                              if (prev.length && prev[prev.length-1].role === 'assistant') {
                                const arr = [...prev];
                                const last = { ...arr[arr.length-1] } as any;
                                last.content = full; delete last.streaming;
                                arr[arr.length-1] = last; return arr;
                              }
                              return [...prev, { role:'assistant', content: full }];
                            });
                          }
                        }
                        if (payload?.type === 'workflow_end') {
                          setTestChatMessages(prev => {
                            if (prev.length && (prev[prev.length-1] as any).streaming) {
                              const arr = [...prev];
                              const last = { ...arr[arr.length-1] } as any;
                              delete last.streaming; arr[arr.length-1] = last; return arr;
                            }
                            return prev;
                          });
                        }
                      } catch {}
                    });
                  } else {
                    if (!testTemplateName) { message.warning('请选择模板'); setTestRunning(false); return; }
                    testRunHandle.current = await runTemplateStream({
                      template_name: testTemplateName,
                      prompt: testPrompt || '统一测试',
                      overrides: { model_id: formData.model_id }
                    }, (ev)=> {
                      try {
                        if (ev && ev.type === 'step_event' && ev.data && (ev.data.stage === 'retrieve' || ev.data.stage === 'retrieve_graph')) {
                          setTestEvents(prev => [...prev, ev.data]);
                        }
                      } catch {}
                    });
                  }
                } catch (e: any) { message.error(e?.message || '启动失败'); setTestRunning(false); }
              }}>开始</Button>
            ) : (
              <Button danger onClick={()=>{ try { testRunHandle.current?.abort(); } catch{} setTestRunning(false); }}>停止</Button>
            )}
          </Space>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Button size="small" onClick={()=>setShowRetrievalPanel(v=>!v)}>
              {showRetrievalPanel ? '隐藏检索面板' : '检索面板'}
            </Button>
          </div>
          {showRetrievalPanel && (
            <Card size="small" title="检索执行" style={{ marginBottom: 8 }}>
              <RetrievalExecPanel events={testEvents as any} />
            </Card>
          )}
          <Card size="small" title="对话输出（流式）" style={{ marginBottom: 12 }}>
            <div style={{ minHeight: 160, maxHeight: 260, overflow: 'auto', padding: 8, background: '#fff' }}>
              {testChatMessages.length === 0 ? (
                <Text type="secondary">尚无输出</Text>
              ) : (
                testChatMessages.map((m, i) => (
                  <div key={i} style={{ margin: '6px 0' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{m.role === 'user' ? '用户' : '助手'}</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card size="small" title="事件流（调试）">
            <div style={{ height: 420, overflow: 'auto', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {testEvents.length === 0 ? <Text type="secondary">尚无事件</Text> : testEvents.map((e,i)=>(<div key={i}>{JSON.stringify(e, null, 2)}</div>))}
            </div>
          </Card>
        </Space>
      </Drawer>
    </Modal>
  );
};

export default AgentCreationWizard;
