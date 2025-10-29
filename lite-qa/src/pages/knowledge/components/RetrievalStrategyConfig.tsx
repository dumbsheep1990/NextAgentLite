/**
 * 检索策略配置器 - 重新设计版本
 * 功能：为知识库配置智能检索流程，支持多层级检索节点和自定义优先级
 */
import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api'; // 修复：使用配置好的api实例
import {
  Modal,
  Input,
  Select,
  Space,
  InputNumber,
  Typography,
  Switch,
  message,
  Alert,
  Card,
  Badge,
  Tooltip,
  Divider,
  Button,
  Tag,
  Radio
} from 'antd';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  DatabaseOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DragOutlined
} from '@ant-design/icons';
import SortableItem from '../../../components/knowledge/SortableItem';

const { Text, Title } = Typography;

type ConfigProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: any) => Promise<void> | void;
  kbId?: string;
};

// 检索节点定义
type RetrievalNode = {
  id: string;
  order: number;
  enabled: boolean;
  title: string;
  sourceType: string;
  icon: React.ReactNode;
  description: string;
  color: string;
};

// 节点配置模板
const NODE_TEMPLATES: Omit<RetrievalNode, 'order' | 'enabled'>[] = [
  {
    id: 'manual_qa',
    title: '自定义问答',
    sourceType: 'qa_datasets',
    icon: <QuestionCircleOutlined />,
    description: '手工创建的精准问答对，优先级最高',
    color: '#1890ff'
  },
  {
    id: 'auto_qa',
    title: 'QA数据集',
    sourceType: 'qa_datasets',
    icon: <QuestionCircleOutlined />,
    description: '自动提取的QA对，适合快速问答',
    color: '#722ed1'
  },
  {
    id: 'documents',
    title: '知识库文档',
    sourceType: 'documents',
    icon: <FileTextOutlined />,
    description: '向量检索知识库文档，支持语义搜索',
    color: '#52c41a'
  },
  {
    id: 'kg',
    title: '知识图谱',
    sourceType: 'documents',
    icon: <ShareAltOutlined />,
    description: '图数据库检索，适合关系查询',
    color: '#fa8c16'
  },
];

const RetrievalStrategyConfig: React.FC<ConfigProps> = ({ open, onClose, onCreate, kbId }) => {
  // 基础配置
  const [strategyName, setStrategyName] = useState('默认检索策略');
  const [mode, setMode] = useState<'force'|'balanced'|'custom'>('balanced');

  // 检索节点列表
  const [retrievalNodes, setRetrievalNodes] = useState<RetrievalNode[]>(
    NODE_TEMPLATES.map((template, index) => ({
      ...template,
      order: index + 1,
      enabled: index === 0 || index === 2, // 默认启用自定义问答和知识库文档
    }))
  );

  // 节点配置
  const [docRerank, setDocRerank] = useState(false);
  const [kgHost, setKgHost] = useState('http://localhost');
  const [kgPort, setKgPort] = useState<number>(9622);
  const [wQADatasets, setWQADatasets] = useState<number>(1);
  const [wDocuments, setWDocuments] = useState<number>(1);
  const [wKG, setWKG] = useState<number>(1);

  // 数据集选择
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedManualDatasets, setSelectedManualDatasets] = useState<string[]>([]);
  const [selectedAutoDatasets, setSelectedAutoDatasets] = useState<string[]>([]);

  // 数据集分类
  const manualDatasets = useMemo(() => (datasets || []).filter((d: any) => {
    const tag = d?.dataset_metadata?.tag || d?.category || '';
    return String(tag).includes('manual') || String(tag).includes('custom') || String(tag) === 'manual_custom';
  }), [datasets]);

  const autoDatasets = useMemo(() => (datasets || []).filter((d: any) => {
    const tag = d?.dataset_metadata?.tag || d?.category || '';
    return String(tag).includes('auto') || String(tag) === 'auto_extracted';
  }), [datasets]);

  // 加载数据集
  useEffect(() => {
    const load = async () => {
      if (!open || !kbId) return;
      try {
        const { data } = await api.get(`/qa-dataset/list?collection_id=${kbId}&limit=100`);
        const list = Array.isArray(data?.datasets) ? data.datasets : [];
        setDatasets(list);
      } catch (e: any) {
        message.error(`加载数据集失败: ${e?.message || '未知错误'}`);
        setDatasets([]);
      }
    };
    load();
  }, [open, kbId]);

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 拖拽处理
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRetrievalNodes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order: index + 1 }));
      });
    }
  };

  // 切换节点启用状态
  const toggleNode = (id: string, checked: boolean) => {
    if (checked) {
      if (id === 'manual_qa' && manualDatasets.length === 0) {
        message.warning('当前知识库暂无"自定义问答"数据集，请先创建。');
        return;
      }
      if (id === 'auto_qa' && autoDatasets.length === 0) {
        message.warning('当前知识库暂无"QA数据集"，请先创建。');
        return;
      }
    }

    setRetrievalNodes((items) =>
      items.map((item) =>
        item.id === id ? { ...item, enabled: checked } : item
      )
    );
  };

  // 生成检索路径配置
  const paths = useMemo(() => {
    return retrievalNodes
      .filter(node => node.enabled)
      .map(node => {
        const baseConfig: any = {
          path_name: node.title,
          path_order: node.order,
          source_type: node.sourceType,
          is_enabled: true,
          fallback_action: 'continue',
          min_confidence: 0,
          max_results: 10,
        };

        switch (node.id) {
          case 'manual_qa':
            baseConfig.config = selectedManualDatasets.length
              ? { dataset_ids: selectedManualDatasets }
              : { dataset_tag: 'manual_custom' };
            break;
          case 'auto_qa':
            baseConfig.config = selectedAutoDatasets.length
              ? { dataset_ids: selectedAutoDatasets }
              : { dataset_tag: 'auto_extracted' };
            break;
          case 'documents':
            baseConfig.config = { search_mode: 'hybrid', top_k: 10, rerank: !!docRerank };
            break;
          case 'kg':
            baseConfig.config = { type: 'kg', host: kgHost, port: kgPort };
            baseConfig.source_type = 'documents';
            break;
        }

        return baseConfig;
      });
  }, [retrievalNodes, docRerank, kgHost, kgPort, selectedManualDatasets, selectedAutoDatasets]);

  // 生成权重配置
  const weights = useMemo(() => {
    if (mode !== 'custom') return undefined;
    const useQADatasets = retrievalNodes.some(n => n.id === 'manual_qa' && n.enabled);
    const useQADatasetsAuto = retrievalNodes.some(n => n.id === 'auto_qa' && n.enabled);
    const useDocuments = retrievalNodes.some(n => n.id === 'documents' && n.enabled);
    const useKG = retrievalNodes.some(n => n.id === 'kg' && n.enabled);

    const m: Record<string, number> = {};
    if (useQADatasets || useQADatasetsAuto) m['qa_datasets'] = wQADatasets;
    if (useDocuments) m['documents'] = wDocuments;
    if (useKG) m['kg'] = wKG;
    return m;
  }, [mode, retrievalNodes, wQADatasets, wDocuments, wKG]);

  const hasEnabledNodes = retrievalNodes.some(node => node.enabled);
  const enabledNodeIds = useMemo(
    () => retrievalNodes.filter(node => node.enabled).map(node => node.id),
    [retrievalNodes]
  );

  // 检索模式说明
  const getModeDescription = () => {
    switch (mode) {
      case 'force':
        return '仅使用第一个启用的检索节点，获得结果后立即返回';
      case 'balanced':
        return '按顺序依次检索每个节点，直到获得满意结果';
      case 'custom':
        return '使用自定义权重并行检索，综合多个节点的结果';
      default:
        return '';
    }
  };

  // 渲染节点配置区域
  const renderNodeConfig = (node: RetrievalNode) => {
    if (!node.enabled) {
      return (
        <div style={{ padding: '8px 12px', color: '#8c8c8c', fontSize: '12px' }}>
          <InfoCircleOutlined style={{ marginRight: '6px' }} />
          启用后可配置此节点的详细参数
        </div>
      );
    }

    switch (node.id) {
      case 'manual_qa':
        return manualDatasets.length > 0 ? (
          <div style={{ padding: '8px 12px' }}>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
              选择自定义问答数据集
            </Text>
            <Select
              mode="multiple"
              placeholder="选择数据集（留空使用全部）"
              style={{ width: '100%' }}
              value={selectedManualDatasets}
              onChange={setSelectedManualDatasets}
              options={manualDatasets.map((d: any) => ({
                value: d.id,
                label: `${d.title || d.file_name || d.id}`,
              }))}
              size="small"
            />
          </div>
        ) : (
          <Alert
            type="warning"
            message="暂无自定义问答数据集"
            description="请先在QA数据集页面创建数据集"
            showIcon
            style={{ margin: '8px 12px', fontSize: '12px' }}
          />
        );

      case 'auto_qa':
        return autoDatasets.length > 0 ? (
          <div style={{ padding: '8px 12px' }}>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
              选择QA数据集
            </Text>
            <Select
              mode="multiple"
              placeholder="选择数据集（留空使用全部）"
              style={{ width: '100%' }}
              value={selectedAutoDatasets}
              onChange={setSelectedAutoDatasets}
              options={autoDatasets.map((d: any) => ({
                value: d.id,
                label: `${d.title || d.file_name || d.id}`,
              }))}
              size="small"
            />
          </div>
        ) : (
          <Alert
            type="warning"
            message="暂无QA数据集"
            description="请先在QA数据集页面创建数据集"
            showIcon
            style={{ margin: '8px 12px', fontSize: '12px' }}
          />
        );

      case 'documents':
        return (
          <div style={{ padding: '8px 12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  文档重排序
                </Text>
                <Switch
                  checked={docRerank}
                  onChange={setDocRerank}
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                  size="small"
                />
              </div>
              <Text type="secondary" style={{ fontSize: '11px', color: '#8c8c8c', display: 'block', marginBottom: '6px' }}>
                默认配置: 检索模式 hybrid | Top K: 10
              </Text>
            </div>
          </div>
        );

      case 'kg':
        return (
          <div style={{ padding: '8px 12px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={6}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  知识图谱服务地址
                </Text>
                <Input
                  placeholder="http://localhost"
                  value={kgHost}
                  onChange={(e) => setKgHost(e.target.value)}
                  size="small"
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  端口号
                </Text>
                <InputNumber
                  placeholder="9622"
                  value={kgPort}
                  onChange={(v) => setKgPort(Number(v || 9622))}
                  style={{ width: '100%' }}
                  size="small"
                />
              </div>
            </Space>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined style={{ color: '#1890ff' }} />
          <span>检索策略配置器</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={async () => {
        await onCreate({ template_name: strategyName, mode, paths, weights });
      }}
      okText="创建策略"
      cancelText="取消"
      okButtonProps={{ disabled: !hasEnabledNodes || !strategyName.trim() }}
      width={1200}
      bodyStyle={{ padding: 0, height: 'calc(100vh - 220px)', maxHeight: '700px' }}
      centered
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {/* 左侧配置区 */}
        <div style={{
          width: '380px',
          borderRight: '1px solid #f0f0f0',
          padding: '20px',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {/* 基础配置 */}
            <div>
              <Title level={5} style={{ margin: '0 0 12px 0' }}>基础配置</Title>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                    策略名称
                  </Text>
                  <Input
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="为这个检索策略命名"
                  />
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                    检索模式
                  </Text>
                  <Radio.Group
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size={4}>
                      <Radio value="force">
                        <Text style={{ fontSize: '13px' }}>强制模式</Text>
                      </Radio>
                      <Radio value="balanced">
                        <Text style={{ fontSize: '13px' }}>平衡模式 (推荐)</Text>
                      </Radio>
                      <Radio value="custom">
                        <Text style={{ fontSize: '13px' }}>自定义权重</Text>
                      </Radio>
                    </Space>
                  </Radio.Group>
                  <Alert
                    type="info"
                    message={getModeDescription()}
                    showIcon
                    style={{ marginTop: '8px', fontSize: '11px' }}
                  />
                </div>
              </Space>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            {/* 节点选择器 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Title level={5} style={{ margin: 0 }}>检索节点</Title>
                <Badge
                  count={retrievalNodes.filter(n => n.enabled).length}
                  style={{ backgroundColor: '#52c41a' }}
                  showZero
                />
              </div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                点击选择要启用的节点
              </Text>
              <Space direction="vertical" style={{ width: '100%' }} size={6}>
                {retrievalNodes.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => toggleNode(node.id, !node.enabled)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      border: `1px solid ${node.enabled ? node.color : '#f0f0f0'}`,
                      background: node.enabled ? `${node.color}08` : '#fafafa',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div style={{ color: node.color, fontSize: '16px' }}>
                      {node.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <Text strong style={{ fontSize: '13px' }}>{node.title}</Text>
                        {node.enabled && (
                          <CheckCircleOutlined style={{ color: node.color, fontSize: '12px' }} />
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {node.description}
                      </Text>
                    </div>
                  </div>
                ))}
              </Space>
            </div>

            {/* 自定义权重 */}
            {mode === 'custom' && hasEnabledNodes && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <div>
                  <Title level={5} style={{ margin: '0 0 12px 0' }}>自定义权重</Title>
                  <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    {retrievalNodes.some(n => (n.id === 'manual_qa' || n.id === 'auto_qa') && n.enabled) && (
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                          QA数据集权重
                        </Text>
                        <InputNumber
                          min={0}
                          max={10}
                          step={0.1}
                          value={wQADatasets}
                          onChange={(v) => setWQADatasets(Number(v || 0))}
                          style={{ width: '100%' }}
                          size="small"
                        />
                      </div>
                    )}
                    {retrievalNodes.some(n => n.id === 'documents' && n.enabled) && (
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                          知识库文档权重
                        </Text>
                        <InputNumber
                          min={0}
                          max={10}
                          step={0.1}
                          value={wDocuments}
                          onChange={(v) => setWDocuments(Number(v || 0))}
                          style={{ width: '100%' }}
                          size="small"
                        />
                      </div>
                    )}
                    {retrievalNodes.some(n => n.id === 'kg' && n.enabled) && (
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                          知识图谱权重
                        </Text>
                        <InputNumber
                          min={0}
                          max={10}
                          step={0.1}
                          value={wKG}
                          onChange={(v) => setWKG(Number(v || 0))}
                          style={{ width: '100%' }}
                          size="small"
                        />
                      </div>
                    )}
                  </Space>
                </div>
              </>
            )}
          </Space>
        </div>

        {/* 右侧流程配置区 */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <Title level={5} style={{ margin: '0 0 8px 0' }}>检索流程配置</Title>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '12px' }}>
            拖拽调整检索顺序和配置节点参数
          </Text>

          {hasEnabledNodes ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={enabledNodeIds}
                strategy={verticalListSortingStrategy}
              >
                <Space direction="vertical" style={{ width: '100%' }} size={6}>
                  {retrievalNodes
                    .filter(node => node.enabled)
                    .map((node, index) => (
                      <SortableItem
                        key={node.id}
                        id={node.id}
                        order={index + 1}
                        title={node.title}
                        enabled={node.enabled}
                      >
                        {renderNodeConfig(node)}
                      </SortableItem>
                    ))}
                </Space>
              </SortableContext>
            </DndContext>
          ) : (
            <Alert
              type="warning"
              message="未选择任何检索节点"
              description="请在左侧选择至少一个检索节点"
              showIcon
              icon={<WarningOutlined />}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RetrievalStrategyConfig;
