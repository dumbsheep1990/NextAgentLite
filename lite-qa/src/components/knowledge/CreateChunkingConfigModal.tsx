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
  Alert,
  Button,
  Tooltip,
  Drawer,
  Typography,
  Card,
  Collapse
} from 'antd';
import {
  ExperimentOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { chunkingConfigService } from '../../services/chunkingConfigService';
import { collectionService } from '../../services/collectionService';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

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
  const [chunkSize, setChunkSize] = useState(400); // 用于动态计算重叠限制
  const [helpDrawerVisible, setHelpDrawerVisible] = useState(false); // 参数说明抽屉
  
  // 判断是否为编辑模式
  const isEditMode = !!initialValues;
  
  // 监听基础块大小变化，动态调整其他字段的限制
  const handleChunkSizeChange = (value: number | null) => {
    if (value) {
      setChunkSize(value);
      
      // 获取当前的重叠大小
      const currentOverlap = form.getFieldValue('chunk_overlap');
      const maxOverlap = Math.floor(value * 0.3);
      
      // 如果当前重叠大小超过新的限制，自动调整
      if (currentOverlap > maxOverlap) {
        form.setFieldValue('chunk_overlap', maxOverlap);
        message.warning(`重叠大小已自动调整为最大值 ${maxOverlap}`);
      }
      
      // 获取当前的最大块大小
      const currentMaxSize = form.getFieldValue('max_token_num');
      
      // 如果当前最大块大小小于基础块大小，自动调整
      if (currentMaxSize < value) {
        const suggestedMaxSize = Math.floor(value * 1.3); // 建议值为基础大小的130%
        form.setFieldValue('max_token_num', suggestedMaxSize);
        message.warning(`最大块大小已自动调整为 ${suggestedMaxSize}`);
      }
    }
  };

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
      // 同时更新chunkSize状态
      setChunkSize(initialValues.chunk_token_num || 400);
    }
  }, [visible, isEditMode, initialValues, form]);
  
  // 在打开Modal时，如果不是编辑模式，重置chunkSize为默认值
  useEffect(() => {
    if (visible && !isEditMode) {
      setChunkSize(400);
    }
  }, [visible, isEditMode]);

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
    <>
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            {isEditMode 
              ? `编辑切分配置` 
              : collectionId 
                ? `为知识库"${collectionName}"创建专属配置` 
                : "新建切分配置"}
          </span>
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            onClick={() => setHelpDrawerVisible(true)}
            style={{ color: '#1890ff' }}
          >
            参数说明
          </Button>
        </div>
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
            label={
              <Space>
                <span>基础块大小 (tokens)</span>
                <Tooltip title="每个文档块的目标Token数量。短文本100-200，一般文档300-500，长篇文档600-1000">
                  <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
                </Tooltip>
              </Space>
            }
            name="chunk_token_num"
            rules={[
              { required: true, message: '请设置基础块大小' },
              { type: 'number', min: 50, message: '基础块大小不能小于50' },
              { type: 'number', max: 2000, message: '基础块大小不能大于2000' }
            ]}
          >
            <InputNumber
              min={50}
              max={2000}
              step={50}
              placeholder="推荐 200-800"
              style={{ width: '100%' }}
              onChange={handleChunkSizeChange}
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <span>重叠大小 (tokens)</span>
                <Tooltip title="相邻块之间的重叠Token数，保持上下文连续性。推荐为基础块大小的10-20%，最大30%">
                  <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
                </Tooltip>
              </Space>
            }
            name="chunk_overlap"
            dependencies={['chunk_token_num']}
            rules={[
              { required: true, message: '请设置重叠大小' },
              { type: 'number', min: 0, message: '重叠大小不能为负数' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const chunkSize = getFieldValue('chunk_token_num');
                  if (!value || !chunkSize) {
                    return Promise.resolve();
                  }
                  const maxOverlap = Math.floor(chunkSize * 0.3);
                  if (value > maxOverlap) {
                    return Promise.reject(new Error(`重叠大小不能超过基础块大小的30% (最大值: ${maxOverlap})`));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              min={0}
              max={Math.floor(chunkSize * 0.3)}
              step={10}
              placeholder={`推荐 ${Math.floor(chunkSize * 0.1)}-${Math.floor(chunkSize * 0.2)}`}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="最大块大小 (tokens)"
            name="max_token_num"
            dependencies={['chunk_token_num']}
            rules={[
              { required: true, message: '请设置最大块大小' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const chunkSize = getFieldValue('chunk_token_num');
                  if (!value || !chunkSize) {
                    return Promise.resolve();
                  }
                  if (value < chunkSize) {
                    return Promise.reject(new Error(`最大块大小不能小于基础块大小 (${chunkSize})`));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            tooltip="允许的最大块大小，必须大于或等于基础块大小"
          >
            <InputNumber
              min={chunkSize}
              max={4000}
              step={50}
              placeholder={`建议 ${Math.floor(chunkSize * 1.2)}-${Math.floor(chunkSize * 1.3)}`}
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
            label={
              <Space>
                <span>保持结构</span>
                <Tooltip title="启用：严格保持文档结构（标题层级、页面边界）。禁用：允许跨结构合并，更灵活">
                  <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
                </Tooltip>
              </Space>
            }
            name="preserve_structure"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <span>语义阈值 (%)</span>
                <Tooltip title="控制语义相似度判断的严格程度。0-20宽松，20-40适中，40-60严格，60-100非常严格。仅在语义切分策略下生效">
                  <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
                </Tooltip>
              </Space>
            }
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
    
    {/* 参数说明抽屉 */}
    <Drawer
      title={
        <Space>
          <BookOutlined style={{ color: '#1890ff' }} />
          <span>切分参数详细说明</span>
        </Space>
      }
      placement="right"
      width={600}
      open={helpDrawerVisible}
      onClose={() => setHelpDrawerVisible(false)}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ maxHeight: '100%', overflowY: 'auto' }}>
        {/* 概述 */}
        <Card 
          title={<Space><BulbOutlined style={{ color: '#faad14' }} />概述</Space>}
          style={{ marginBottom: '16px' }}
          size="small"
        >
          <Paragraph>
            文档切分是将长文档拆分成更小、更易管理的片段的过程。合理的切分策略可以提高检索精度和语义理解效果。
          </Paragraph>
        </Card>

        {/* 参数详解 */}
        <Collapse defaultActiveKey={['strategy']} style={{ marginBottom: '16px' }}>
          <Panel 
            header={<Space><SettingOutlined />切分策略 (Strategy)</Space>} 
            key="strategy"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Tag color="blue">语义切分 (semantic)</Tag>
                <Text type="secondary">基于内容的语义相关性进行智能合并，适合需要保持语义完整性的文档。</Text>
              </div>
              <div>
                <Tag color="green">滑动窗口 (sliding_window)</Tag>
                <Text type="secondary">使用固定大小的窗口滑动切分，保持内容连贯性，适合连续性强的文本。</Text>
              </div>
              <div>
                <Tag color="orange">句子切分 (sentence)</Tag>
                <Text type="secondary">按句子边界进行切分，保持语法完整性，适合短文本或对话场景。</Text>
              </div>
              <div>
                <Tag color="purple">段落切分 (paragraph)</Tag>
                <Text type="secondary">按段落进行切分，保持段落完整性，适合结构清晰的文档。</Text>
              </div>
              <div>
                <Tag color="cyan">递归切分 (recursive)</Tag>
                <Text type="secondary">递归式智能切分，自适应文档结构，适合复杂格式文档。</Text>
              </div>
            </Space>
          </Panel>

          <Panel 
            header={<Space><ThunderboltOutlined />Token参数</Space>} 
            key="token"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>基础块大小 (chunk_token_num)</Text>
                <Paragraph type="secondary">
                  每个文档块的目标Token数量。推荐值：
                  <ul>
                    <li>短文本/对话：100-200 tokens</li>
                    <li>一般文档：300-500 tokens</li>
                    <li>长篇文档：600-1000 tokens</li>
                  </ul>
                </Paragraph>
              </div>
              
              <div>
                <Text strong>最大块大小 (max_token_num)</Text>
                <Paragraph type="secondary">
                  允许的最大Token数量，防止单个块过大。通常设置为基础块大小的1.2-1.5倍。
                  超过此大小的内容会被强制分割。
                </Paragraph>
              </div>

              <div>
                <Text strong>重叠大小 (chunk_overlap)</Text>
                <Paragraph type="secondary">
                  相邻块之间的重叠Token数，用于保持上下文连续性。推荐值：
                  <ul>
                    <li>无重叠：0 tokens（独立性强的内容）</li>
                    <li>轻度重叠：基础块大小的10-15%</li>
                    <li>中度重叠：基础块大小的20-25%</li>
                    <li>最大不超过基础块大小的30%</li>
                  </ul>
                </Paragraph>
              </div>
            </Space>
          </Panel>

          <Panel 
            header={<Space><ExperimentOutlined />高级参数</Space>} 
            key="advanced"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>分隔符 (delimiter)</Text>
                <Paragraph type="secondary">
                  用于识别自然断句点的字符。
                  <ul>
                    <li>中文文档：。！？</li>
                    <li>英文文档：.!?</li>
                    <li>混合文档：.!?。！？</li>
                  </ul>
                </Paragraph>
              </div>

              <div>
                <Text strong>分词器类型 (tokenizer_type)</Text>
                <Paragraph type="secondary">
                  <ul>
                    <li><Tag>simple</Tag> 基础分词，速度快，适合一般场景</li>
                    <li><Tag>advanced</Tag> 高级分词，支持中英文混合、词干提取、细粒度分割</li>
                  </ul>
                </Paragraph>
              </div>

              <div>
                <Text strong>保持结构 (preserve_structure)</Text>
                <Paragraph type="secondary">
                  <ul>
                    <li><Tag color="success">启用</Tag> 严格保持文档原有结构（标题层级、页面边界），适合格式化文档</li>
                    <li><Tag color="default">禁用</Tag> 允许跨结构合并，更灵活，适合连续性文本</li>
                  </ul>
                  启用时的行为：
                  <ul>
                    <li>相同标题下的内容优先合并</li>
                    <li>不同标题的内容不会合并</li>
                    <li>保持页码边界，不跨页合并</li>
                  </ul>
                </Paragraph>
              </div>

              <div>
                <Text strong>语义阈值 (semantic_threshold)</Text>
                <Paragraph type="secondary">
                  控制语义相似度判断的严格程度（0-100）：
                  <ul>
                    <li><Tag>0-20</Tag> 宽松：容易合并，适合高内聚文档</li>
                    <li><Tag>20-40</Tag> 适中：平衡合并，推荐默认值</li>
                    <li><Tag>40-60</Tag> 严格：谨慎合并，适合主题多样的文档</li>
                    <li><Tag>60-100</Tag> 非常严格：只合并高度相关内容</li>
                  </ul>
                  注意：此参数仅在语义切分策略下生效。
                </Paragraph>
              </div>
            </Space>
          </Panel>

          <Panel 
            header={<Space><BranchesOutlined />最佳实践</Space>} 
            key="bestpractice"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="学术论文"
                description="策略：语义切分 | 块大小：400-600 | 重叠：50-80 | 保持结构：是 | 语义阈值：40"
                type="info"
                showIcon
              />
              <Alert
                message="技术文档"
                description="策略：段落切分 | 块大小：300-500 | 重叠：30-50 | 保持结构：是 | 语义阈值：30"
                type="info"
                showIcon
              />
              <Alert
                message="对话记录"
                description="策略：句子切分 | 块大小：100-200 | 重叠：10-20 | 保持结构：否 | 语义阈值：20"
                type="info"
                showIcon
              />
              <Alert
                message="新闻文章"
                description="策略：滑动窗口 | 块大小：200-400 | 重叠：20-40 | 保持结构：否 | 语义阈值：25"
                type="info"
                showIcon
              />
            </Space>
          </Panel>
        </Collapse>

        {/* 提示信息 */}
        <Alert
          message="智能建议"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>初次使用建议从预设模板开始，然后根据效果微调参数</li>
              <li>块大小过小会增加检索次数，过大会降低精度</li>
              <li>重叠度有助于保持上下文，但会增加存储成本</li>
              <li>不同类型的文档需要不同的切分策略，建议先小批量测试</li>
            </ul>
          }
          type="success"
          showIcon
          icon={<BulbOutlined />}
        />
      </div>
    </Drawer>
    </>
  );
};

export default CreateChunkingConfigModal;