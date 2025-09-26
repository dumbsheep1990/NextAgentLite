/**
 * 创建知识库弹窗组件
 */
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Typography, Divider, Tag, Alert } from 'antd';
import { FolderOutlined, InfoCircleOutlined, TagOutlined, FileTextOutlined, BookOutlined, BankOutlined, SettingOutlined } from '@ant-design/icons';
import { useCollectionStore } from '../../stores/collectionStore';
import type { CollectionCreateRequest } from '../../services/collectionService';
import { CollectionService } from '../../services/collectionService';

// 轻量样式微调
const selectStyles = `
  /* 通用下拉：背景白色 */
  .ant-select-dropdown { background: #fff; }
  /* 指定白色下拉的样式，更明确 */
  .white-dropdown { background: #fff !important; }
  .white-dropdown .ant-select-item { background: #fff !important; color: #000 !important; }
  .white-dropdown .ant-select-item-option-selected { background: #e6f4ff !important; color: #000 !important; }
`;

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

interface CollectionCreateModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}


const CollectionCreateModal: React.FC<CollectionCreateModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  const {
    templateTypes,
    metadataTemplates,
    loading,
    error,
    createCollection,
    loadMetadataTemplates,
    loadTemplateTypes,
    clearError
  } = useCollectionStore();

  // Embedding 模型（创建用）
  const [embedLoading, setEmbedLoading] = useState(false);
  const [defaultEmbedding, setDefaultEmbedding] = useState<{ model_id: string; provider: string }>({ model_id: '', provider: '' });
  const [embeddingModels, setEmbeddingModels] = useState<Array<{ model_id: string; display_name: string; provider_name: string }>>([]);
  const [selectedEmbedding, setSelectedEmbedding] = useState<string>('__default__');
  // 索引方式（与设置页一致）
  const [selectedIndexType, setSelectedIndexType] = useState<string>('hnsw');
  const INDEX_TYPES = [
    { value: 'none', label: '无索引', desc: '顺序扫描，小数据集（<1000）' },
    { value: 'ivfflat', label: 'IVF-Flat', desc: '倒排文件索引，平衡速度和精度' },
    { value: 'hnsw', label: 'HNSW', desc: '高精度快速检索，构建慢、内存占用高' },
  ];

  // 模版详情映射
  const templateDetails = {
    general: {
      icon: <FileTextOutlined />,
      color: 'blue',
      description: '适用于一般文档的通用元数据提取，包含标题、摘要、作者、关键词等基础信息',
      features: ['基础文档信息', '通用分类标签', '内容摘要提取', '标准检索优化'],
      scenarios: ['技术文档', '操作手册', '通用报告', '知识库文章']
    },
    policy: {
      icon: <BankOutlined />,
      color: 'red',
      description: '专门针对政策法规文档，支持发文机关、文件编号、生效时间、时效性管理',
      features: ['发文机关识别', '文件编号提取', '时效性管理', '政策层级分类'],
      scenarios: ['政策法规', '规章制度', '通知公告', '法律条文']
    },
    academic: {
      icon: <BookOutlined />,
      color: 'green',
      description: '学术论文和研究文档的专业元数据，包含作者、期刊、引用、研究领域等',
      features: ['作者机构识别', '期刊会议信息', '引用统计', '研究领域分类'],
      scenarios: ['学术论文', '研究报告', '会议论文', '技术白皮书']
    },
    enterprise: {
      icon: <SettingOutlined />,
      color: 'orange',
      description: '企业内部文档管理，支持部门、权限、版本、审批流程等企业级功能',
      features: ['部门权限控制', '版本管理', '审批流程', '保密等级'],
      scenarios: ['内部制度', '技术规范', '项目文档', '管理制度']
    }
  };

  // 加载模版类型数据与默认 Embedding 模型
  useEffect(() => {
    if (visible) {
      console.log('🔄 加载模版类型中...');
      loadTemplateTypes(); // 只加载模版类型，不加载完整模版列表
      clearError();
      // 加载默认 Embedding 模型 + 启用模型列表
      (async () => {
        try {
          setEmbedLoading(true);
          const svc = new CollectionService();
          const { default: def, models } = await svc.getEmbeddingDefaultsAndModels();
          setDefaultEmbedding(def);
          setEmbeddingModels(models);
          setSelectedEmbedding('__default__');
        } catch (e) {
          console.error('加载Embedding模型失败', e);
        } finally {
          setEmbedLoading(false);
        }
      })();
    }
  }, [visible, loadTemplateTypes, clearError]);

  // 调试：打印templateTypes数据
  useEffect(() => {
    console.log('📋 当前templateTypes:', templateTypes);
    console.log('📋 templateTypes长度:', templateTypes?.length || 0);
  }, [templateTypes]);

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const request: CollectionCreateRequest = {
        name: values.name,
        description: values.description || '',
        metadata_template: values.metadata_template,
        extra_metadata: {
          created_via: 'web_interface',
          template_selection_reason: values.template_reason || 'user_selected',
          // 记录索引方式，后续可在设置页切换
          vector_index: { type: selectedIndexType }
        }
      };

      // 注入Embedding模型（默认或用户选择）
      if (selectedEmbedding === '__default__') {
        request.embeddings = { model_id: defaultEmbedding.model_id, provider: defaultEmbedding.provider };
      } else if (selectedEmbedding) {
        const [prov, mid] = selectedEmbedding.split('::');
        request.embeddings = { model_id: mid, provider: prov };
      }

      await createCollection(request);
      
      form.resetFields();
      setSelectedTemplate('');
      onSuccess();
    } catch (error) {
      console.error('创建知识库失败:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setSelectedTemplate('');
    clearError();
    onCancel();
  };

  // 模版选择处理
  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
  };

  // 获取模版详情
  const getTemplateDetail = (templateId: string) => {
    return templateDetails[templateId as keyof typeof templateDetails] || templateDetails.general;
  };

  // 渲染模版选择卡片
  const renderTemplateCard = () => {
    if (!selectedTemplate) return null;

    const detail = getTemplateDetail(selectedTemplate);
    const templateType = templateTypes.find(t => t.id === selectedTemplate);

    return (
      <Card 
        size="small" 
        className="mt-4 border-l-4"
        style={{ borderLeftColor: detail.color === 'blue' ? '#1890ff' : 
                 detail.color === 'red' ? '#ff4d4f' : 
                 detail.color === 'green' ? '#52c41a' : '#faad14' }}
      >
        <div className="flex items-start space-x-3">
          <div className={`text-2xl text-${detail.color}-500`}>
            {detail.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Text strong>{templateType?.name}</Text>
              <Tag color={detail.color}>{selectedTemplate}</Tag>
            </div>
            <Paragraph className="text-gray-600 text-sm mb-3">
              {detail.description}
            </Paragraph>
            
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text className="text-xs text-gray-500">核心功能：</Text>
                <ul className="text-xs mt-1 ml-4">
                  {detail.features.map((feature, index) => (
                    <li key={index} className="mb-1">{feature}</li>
                  ))}
                </ul>
              </Col>
              <Col span={12}>
                <Text className="text-xs text-gray-500">适用场景：</Text>
                <div className="mt-1 space-x-1">
                  {detail.scenarios.map((scenario, index) => (
                    <Tag key={index} size="small" color="default">
                      {scenario}
                    </Tag>
                  ))}
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <>
      <style>{selectStyles}</style>
      <Modal
      title={
        <div className="flex items-center space-x-2">
          <FolderOutlined />
          <span>创建新知识库</span>
        </div>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading.creating}
      width={640}
      okText="创建知识库"
      cancelText="取消"
      destroyOnClose
    >
      {error && (
        <Alert
          message="创建失败"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="mb-4"
        />
      )}

      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        {/* 基础信息 */}
        <div className="mb-4">
          <div style={{ marginBottom: 8 }}>
            <Tag color="blue" bordered={false}>基础信息</Tag>
          </div>
          <Form.Item
            name="name"
            label="知识库名称"
            rules={[
              { required: true, message: '请输入知识库名称' },
              { min: 2, max: 100, message: '名称长度为2-100个字符' }
            ]}
          >
            <Input
              placeholder="请输入知识库名称，如：政策法规库"
              prefix={<TagOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="知识库描述"
            extra="可选，建议说明知识库的用途和内容范围"
          >
            <TextArea
              rows={3}
              placeholder="请描述该知识库的用途和包含的内容类型..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 元数据模版选择（简洁版） */}
        <div className="mb-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Tag color="processing" bordered={false}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <InfoCircleOutlined /> 选择元数据模版
              </span>
            </Tag>
          </div>
          <Text type="secondary" className="block mb-2">为文档选择最合适的提取模版</Text>

          <Form.Item
            name="metadata_template"
            rules={[{ required: true, message: '请选择元数据模版' }]}
          >
            <Select
              placeholder="请选择元数据模版类型"
              onChange={handleTemplateChange}
              loading={loading.templates}
              popupClassName="white-dropdown"
            >
              {templateTypes.map(type => {
                const detail = getTemplateDetail(type.id);
                return (
                  <Option key={type.id} value={type.id}>
                    <div className="flex items-center space-x-2">
                      <span className={`text-${detail.color}-500`}>
                        {detail.icon}
                      </span>
                      <span>{type.name}</span>
                      <Text type="secondary" className="text-xs">
                        - {type.description}
                      </Text>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          {/* 说明卡片已移除，保持界面简洁 */}
        </div>

        {/* 向量模型与索引方式（精简展示） */}
        <Divider style={{ margin: '12px 0' }} />
        <div className="mb-2">
          <div style={{ marginBottom: 8 }}>
            <Tag color="purple" bordered={false}>Embedding 向量模型</Tag>
          </div>
          <div className="text-xs text-gray-500 mb-2">默认：{defaultEmbedding.provider || '-'} / {defaultEmbedding.model_id || '-'}</div>
          <Form.Item label="选择Embedding模型" required style={{ marginBottom: 12 }}>
            <Select
              loading={embedLoading}
              value={selectedEmbedding}
              onChange={setSelectedEmbedding as any}
              popupClassName="white-dropdown"
            >
              <Option key="__default__" value="__default__">使用默认（{defaultEmbedding.provider}/{defaultEmbedding.model_id}）</Option>
              {embeddingModels.map(m => (
                <Option key={`${m.provider_name}::${m.model_id}`} value={`${m.provider_name}::${m.model_id}`}>
                  {m.provider_name}/{m.model_id} - {m.display_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className="mb-2">
          <div style={{ marginBottom: 8 }}>
            <Tag color="green" bordered={false}>向量索引方式</Tag>
          </div>
          <div className="text-xs text-gray-500 mb-2">选择用于本知识库的向量索引构建方式（可在设置中切换）。</div>
          <Form.Item label="索引类型" required style={{ marginBottom: 0 }}>
            <Select 
              value={selectedIndexType} 
              onChange={setSelectedIndexType as any} 
              style={{ width: 360 }}
              popupClassName="white-dropdown"
            >
              {INDEX_TYPES.map(t => (
                <Option key={t.value} value={t.value}>{t.label}（{t.desc}）</Option>
              ))}
            </Select>
          </Form.Item>
        </div>
      </Form>
      </Modal>
    </>
  );
};

export default CollectionCreateModal;
