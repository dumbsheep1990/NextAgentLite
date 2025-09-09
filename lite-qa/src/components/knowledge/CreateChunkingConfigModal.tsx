/**
 * 新建切分配置Modal
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Space,
  Tag,
  Divider,
  Alert
} from 'antd';
import {
  ExperimentOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { chunkingConfigService } from '../../services/chunkingConfigService';
import { collectionService } from '../../services/collectionService';

const { Option } = Select;
const { TextArea } = Input;

interface CreateChunkingConfigModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (newConfig?: any) => void;
  collectionId?: string;
  collectionName?: string;
  initialValues?: any; // 编辑模式的初始值
}

const CreateChunkingConfigModal: React.FC<CreateChunkingConfigModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  collectionId,
  collectionName,
  initialValues
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // 判断是否为编辑模式
  const isEditMode = !!initialValues;

  // 在编辑模式下设置表单初始值
  useEffect(() => {
    if (visible && isEditMode && initialValues) {
      form.setFieldsValue({
        name: initialValues.name,
        description: initialValues.description,
        strategy: initialValues.strategy,
        chunk_token_num: initialValues.chunk_token_num,
        chunk_overlap: initialValues.chunk_overlap,
        max_token_num: initialValues.max_token_num,
        delimiter: initialValues.delimiter,
        tokenizer_type: initialValues.tokenizer_type,
        preserve_structure: initialValues.preserve_structure,
        semantic_threshold: initialValues.semantic_threshold
      });
    }
  }, [visible, isEditMode, initialValues, form]);

  // 策略选项
  const strategyOptions = [
    {
      value: 'semantic',
      label: '语义切分',
      icon: <BranchesOutlined />,
      color: 'blue',
      description: '基于语义理解进行智能切分，适合长文档'
    },
    {
      value: 'sliding_window', 
      label: '滑动窗口',
      icon: <ThunderboltOutlined />,
      color: 'green',
      description: '固定窗口大小滑动切分，保持连贯性'
    },
    {
      value: 'sentence',
      label: '句子切分',
      icon: <ExperimentOutlined />,
      color: 'orange',
      description: '按句子边界进行切分，保持语法完整'
    },
    {
      value: 'paragraph',
      label: '段落切分',
      icon: <SettingOutlined />,
      color: 'purple',
      description: '按段落进行切分，适合结构化文档'
    },
    {
      value: 'recursive',
      label: '递归切分',
      icon: <SettingOutlined />,
      color: 'cyan',
      description: '递归式智能切分，自适应文档结构'
    }
  ];

  // 预设模板
  const presetTemplates = [
    {
      name: '通用文档 (推荐)',
      strategy: 'semantic',
      chunk_token_num: 400,
      chunk_overlap: 50,
      max_token_num: 512,
      preserve_structure: true,
      semantic_threshold: 30
    },
    {
      name: '长文档优化',
      strategy: 'sliding_window',
      chunk_token_num: 800,
      chunk_overlap: 100,
      max_token_num: 1024,
      preserve_structure: true,
      semantic_threshold: 40
    },
    {
      name: '精确切分',
      strategy: 'sentence',
      chunk_token_num: 200,
      chunk_overlap: 20,
      max_token_num: 256,
      preserve_structure: true,
      semantic_threshold: 20
    },
    {
      name: '结构化文档',
      strategy: 'paragraph',
      chunk_token_num: 600,
      chunk_overlap: 80,
      max_token_num: 768,
      preserve_structure: true,
      semantic_threshold: 35
    }
  ];

  // 应用预设模板
  const applyPreset = (preset: any) => {
    form.setFieldsValue({
      strategy: preset.strategy,
      chunk_token_num: preset.chunk_token_num,
      chunk_overlap: preset.chunk_overlap,
      max_token_num: preset.max_token_num,
      preserve_structure: preset.preserve_structure,
      semantic_threshold: preset.semantic_threshold
    });
  };

  // 提交创建
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const configData = {
        ...values,
        delimiter: values.delimiter || '.!?',
        tokenizer_type: values.tokenizer_type || 'simple',
        supported_formats: ['txt', 'md', 'pdf', 'docx'],
        // 根据是否有 collectionId 设置作用域
        scope: collectionId ? 'collection_specific' : 'global',
        collection_id: collectionId || null
      };

      let response;
      if (isEditMode) {
        // 编辑模式 - 更新现有配置
        console.log('✏️ 编辑切分配置:', initialValues.id, configData);
        
        try {
          const updateResponse = await fetch(`http://localhost:8000/api/v1/knowledge/chunking-configs/${initialValues.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(configData),
          });
          
          if (updateResponse.ok) {
            const result = await updateResponse.json();
            message.success('配置更新成功');
            form.resetFields();
            onSuccess(result.config || result);
          } else {
            message.error('更新配置失败');
          }
        } catch (error) {
          console.error('更新配置失败:', error);
          message.error('更新配置失败');
        }
      } else if (collectionId) {
        // 创建知识库专属配置
        console.log('🎯 创建知识库专属配置:', collectionId, configData);
        
        // 直接创建专属配置
        const createResponse = await chunkingConfigService.createConfig(configData);
        
        if (createResponse && createResponse.config) {
          const newConfig = createResponse.config;
          // 设置该配置为知识库的默认配置
          const setResponse = await collectionService.setCollectionChunkingConfig(
            collectionId,
            {
              chunking_config_id: newConfig.id,
              custom_config: {
                inherit_from_global: false,
                custom_rules: configData,
                override_settings: {}
              }
            }
          );
          
          if (setResponse && setResponse.success) {
            message.success(`为知识库"${collectionName}"创建专属配置成功`);
            form.resetFields();
            onSuccess(newConfig);
          } else {
            message.error('设置知识库专属配置失败');
          }
        } else {
          message.error('创建切分配置失败');
        }
      } else {
        // 创建全局配置
        const createResponse = await chunkingConfigService.createConfig(configData);
        
        if (createResponse && createResponse.config) {
          message.success('创建全局切分配置成功');
          form.resetFields();
          onSuccess(createResponse.config);
        } else {
          message.error('创建切分配置失败');
        }
      }
    } catch (error) {
      console.error('创建切分配置失败:', error);
      message.error('创建切分配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        isEditMode 
          ? `编辑切分配置` 
          : collectionId 
            ? `为知识库"${collectionName}"创建专属配置` 
            : "新建切分配置"
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {collectionId && !isEditMode && (
          <Alert
            message="知识库专属配置"
            description={`此配置将专门应用于知识库"${collectionName}"，不会影响其他知识库的切分规则。`}
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
        
        {isEditMode && (
          <Alert
            message="编辑配置"
            description="修改现有的切分配置，更改将立即生效。"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
        
        {/* 预设模板选择 */}
        <Alert
          message="快速开始"
          description="选择一个预设模板，然后根据需要调整参数"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>预设模板：</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {presetTemplates.map((preset, index) => (
              <Tag
                key={index}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  height: 'auto'
                }}
                onClick={() => applyPreset(preset)}
              >
                {preset.name}
              </Tag>
            ))}
          </div>
        </div>

        <Divider />

        {/* 配置表单 */}
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            strategy: 'semantic',
            chunk_token_num: 400,
            chunk_overlap: 50,
            max_token_num: 512,
            delimiter: '.!?',
            tokenizer_type: 'simple',
            preserve_structure: true,
            semantic_threshold: 30
          }}
        >
          <Form.Item
            label="配置名称"
            name="name"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="请输入切分配置名称" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea placeholder="请输入配置描述（可选）" rows={2} />
          </Form.Item>

          <Form.Item
            label="切分策略"
            name="strategy"
            rules={[{ required: true, message: '请选择切分策略' }]}
          >
            <Select placeholder="请选择切分策略">
              {strategyOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <Space>
                    <Tag icon={option.icon} color={option.color}>
                      {option.label}
                    </Tag>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {option.description}
                    </span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="块大小 (tokens)"
            name="chunk_token_num"
            rules={[{ required: true, message: '请设置块大小' }]}
          >
            <InputNumber
              min={50}
              max={2000}
              step={50}
              placeholder="推荐 200-800"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="重叠大小 (tokens)"
            name="chunk_overlap"
            rules={[{ required: true, message: '请设置重叠大小' }]}
          >
            <InputNumber
              min={0}
              max={500}
              step={10}
              placeholder="推荐为块大小的10-20%"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="最大块大小 (tokens)"
            name="max_token_num"
            rules={[{ required: true, message: '请设置最大块大小' }]}
          >
            <InputNumber
              min={100}
              max={4000}
              step={50}
              placeholder="通常比块大小大20-30%"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="分隔符"
            name="delimiter"
          >
            <Input placeholder="默认: .!?" />
          </Form.Item>

          <Form.Item
            label="分词器类型"
            name="tokenizer_type"
          >
            <Select placeholder="选择分词器类型">
              <Option value="simple">简单分词器</Option>
              <Option value="advanced">高级分词器</Option>
              <Option value="custom">自定义分词器</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="保持结构"
            name="preserve_structure"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="语义阈值"
            name="semantic_threshold"
          >
            <InputNumber
              min={0}
              max={100}
              step={5}
              placeholder="语义相似度阈值"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default CreateChunkingConfigModal;