/**
 * 创建知识库弹窗组件
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Alert,
  Descriptions,
  Card,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Tag,
  ConfigProvider,
  theme
} from 'antd';
import { 
  FolderOutlined, 
  InfoCircleOutlined,
  TagOutlined,
  FileTextOutlined,
  BookOutlined,
  BankOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useCollectionStore } from '../../stores/collectionStore';
import type { CollectionCreateRequest } from '../../services/collectionService';

// 添加内联样式覆盖选项背景 - 参考chunking config的解决方案
const selectStyles = `
  /* 强制设置下拉框背景为白色 */
  .ant-select-dropdown {
    background-color: #ffffff !important;
  }
  .ant-select-item {
    background-color: #ffffff !important;
    color: #000000 !important;
  }
  .ant-select-item-option-content {
    background-color: transparent !important;
    color: #000000 !important;
  }
  .ant-select-item:hover {
    background-color: #f5f5f5 !important;
    color: #000000 !important;
  }
  .ant-select-item-option-selected {
    background-color: #e6f4ff !important;
    color: #000000 !important;
  }
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

  // 加载模版类型数据（不需要完整的模版列表）
  useEffect(() => {
    if (visible) {
      console.log('🔄 加载模版类型中...');
      loadTemplateTypes(); // 只加载模版类型，不加载完整模版列表
      clearError();
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
          template_selection_reason: values.template_reason || 'user_selected'
        }
      };

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
      width={720}
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
        <div className="mb-6">
          <Title level={5}>基础信息</Title>
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

        <Divider />

        {/* 元数据模版选择 */}
        <div className="mb-6">
          <Title level={5}>
            <span className="flex items-center space-x-2">
              <InfoCircleOutlined />
              <span>选择元数据模版</span>
            </span>
          </Title>
          <Text type="secondary" className="block mb-4">
            不同的模版针对不同类型的文档进行了优化，选择最适合您文档类型的模版
          </Text>

          <Form.Item
            name="metadata_template"
            rules={[{ required: true, message: '请选择元数据模版' }]}
          >
            <Select
              placeholder="请选择元数据模版类型"
              onChange={handleTemplateChange}
              loading={loading.templates}
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

          {/* 模版详情卡片 */}
          {renderTemplateCard()}
        </div>

        {/* 高级选项 */}
        <div className="mb-4">
          <Title level={5}>高级选项</Title>
          <Alert
            message="提示"
            description="创建后可以在知识库设置中修改配置和上传文档"
            type="info"
            showIcon
            className="text-sm"
          />
        </div>
      </Form>
      </Modal>
    </>
  );
};

export default CollectionCreateModal;