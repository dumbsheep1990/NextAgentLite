/**
 * 配置管理面板组件 - 向量化配置
 */
import React from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Divider,
  Space,
  Alert,
  message,
  Typography
} from 'antd';
import {
  SettingOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import type { VectorConfig } from '../../types';

const { Option } = Select;
const { Text } = Typography;

interface ConfigPanelProps {
  vectorConfig: VectorConfig;
  onVectorConfigChange: (config: Partial<VectorConfig>) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  vectorConfig,
  onVectorConfigChange
}) => {
  const [vectorForm] = Form.useForm();

  // 处理向量化配置提交
  const handleVectorConfigSubmit = (values: any) => {
    onVectorConfigChange(values);
    message.success('向量化配置已保存');
  };

  return (
    <Card
      title={
        <Space>
          <ExperimentOutlined />
          向量化配置
        </Space>
      }
    >
      <Form
        form={vectorForm}
        layout="vertical"
        initialValues={vectorConfig}
        onFinish={handleVectorConfigSubmit}
      >
        <Alert
          message="向量化参数说明"
          description="这些参数将影响文档的向量化质量和检索效果，建议根据具体场景调整。"
          type="info"
          className="mb-4"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label="向量模型"
            name="model"
            rules={[{ required: true, message: '请选择向量模型' }]}
          >
            <Select placeholder="选择向量模型">
              <Option value="text-embedding-v4">Ali Text Embedding V4</Option>
              <Option value="matbert">MatBERT</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="向量维度"
            name="dimension"
            rules={[{ required: true, message: '请输入向量维度' }]}
          >
            <InputNumber min={128} max={4096} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="文本块大小"
            name="chunkSize"
            rules={[{ required: true, message: '请输入文本块大小' }]}
            extra="每个文本块的最大字符数"
          >
            <InputNumber min={128} max={2048} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="重叠字符数"
            name="overlap"
            rules={[{ required: true, message: '请输入重叠字符数' }]}
            extra="相邻文本块之间的重叠字符数"
          >
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="分块策略"
            name="strategy"
            rules={[{ required: true, message: '请选择分块策略' }]}
          >
            <Select placeholder="选择分块策略">
              <Option value="semantic">语义分块</Option>
              <Option value="fixed">固定长度</Option>
              <Option value="sentence">句子边界</Option>
              <Option value="paragraph">段落边界</Option>
            </Select>
          </Form.Item>
        </div>

        <Divider />

        <div className="flex justify-end">
          <Button type="primary" htmlType="submit">
            保存配置
          </Button>
        </div>
      </Form>
    </Card>
  );
}; 