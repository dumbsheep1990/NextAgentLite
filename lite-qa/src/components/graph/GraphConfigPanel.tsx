/**
 * 知识图谱配置面板
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Tabs,
  Form,
  Select,
  Input,
  Slider,
  Switch,
  Button,
  Card,
  Space,
  message,
  Collapse,
  Typography,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;
const { Text, Title } = Typography;

// 导入配置服务
import { graphConfigService } from '../../services/graphConfigService';

interface GraphConfigPanelProps {
  visible: boolean;
  onClose: () => void;
  onConfigUpdate: (config: any) => void;
}

interface GraphConfig {
  // 模型配置
  model: {
    extractionModel: string;
    temperature: number;
    maxTokens: number;
  };
  // 提取参数
  extraction: {
    chunkSize: number;
    chunkOverlap: number;
    minEntityConfidence: number;
    minRelationConfidence: number;
    enableContinueExtraction: boolean;
    maxRetries: number;
  };
  // 实体类型配置
  entityTypes: {
    [category: string]: string[];
  };
  // 关系类型配置
  relationshipTypes: string[];
  // 提示词配置
  prompts: {
    entityExtraction: string;
    continueExtraction: string;
    keywordExtraction: string;
  };
}

interface PromptTemplate {
  name: string;
  template: string;
  description: string;
  variables: string[];
}

const GraphConfigPanel: React.FC<GraphConfigPanelProps> = ({
  visible,
  onClose,
  onConfigUpdate
}) => {
  const [form] = Form.useForm();
  const [config, setConfig] = useState<GraphConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('model');
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [originalPrompts, setOriginalPrompts] = useState<{[key: string]: string}>({});
  const [promptModalVisible, setPromptModalVisible] = useState(false);
  const [currentPromptKey, setCurrentPromptKey] = useState<string>('');
  const [currentPromptContent, setCurrentPromptContent] = useState<string>('');
  
  // 可用模型列表
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // 提示词模板
  const [promptTemplates, setPromptTemplates] = useState<{[key: string]: PromptTemplate}>({});

  // 加载配置
  const loadConfig = async () => {
    setLoading(true);
    try {
      // 加载当前配置
      const configResponse = await fetch('/api/v1/graph/extraction-config');
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfig(configData.data);
        form.setFieldsValue(configData.data);
        
        // 保存原始提示词用于回退
        if (configData.data.prompts) {
          setOriginalPrompts({...configData.data.prompts});
        }
      }
      
      // 加载可用模型 - 使用graphConfigService
      try {
        const models = await graphConfigService.getAvailableModels();
        setAvailableModels(models);
      } catch (error) {
        console.error('加载可用模型失败:', error);
        // 使用默认模型列表作为fallback
        setAvailableModels([
          'qwen3-235b-a22b-instruct-2507',
          'gpt-4o-mini',
          'gemini-2.5-flash-preview-nothinking',
          'gemini-2.5-flash-preview-thinking',
          'claude-3-5-sonnet-20241022'
        ]);
      }
      
      // 加载提示词模板
      const promptsResponse = await fetch('/api/v1/graph/prompts');
      if (promptsResponse.ok) {
        const promptsData = await promptsResponse.json();
        setPromptTemplates(promptsData.data || {});
      }
    } catch (error) {
      message.error('加载配置失败');
      console.error('Load config error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      // 使用graphConfigService保存配置
      const updatedConfig = await graphConfigService.updateConfig(values);
      
      message.success('配置保存成功，新配置将在下次提取时生效');
      setConfig(updatedConfig);
      onConfigUpdate(updatedConfig);
      // 更新原始提示词
      if (updatedConfig.prompts) {
        setOriginalPrompts({...updatedConfig.prompts});
      }
    } catch (error) {
      message.error('保存配置失败');
      console.error('Save config error:', error);
    } finally {
      setSaving(false);
    }
  };

  // 重置配置
  const resetConfig = () => {
    if (config) {
      form.setFieldsValue(config);
      message.success('配置已重置');
    }
  };

  // 回退提示词
  const revertPrompt = (promptKey: string) => {
    if (originalPrompts[promptKey]) {
      form.setFieldValue(['prompts', promptKey], originalPrompts[promptKey]);
      message.success('提示词已回退到原始版本');
    } else {
      message.warning('无法找到原始提示词');
    }
  };

  // 打开提示词编辑弹窗
  const openPromptModal = (promptKey: string) => {
    const currentContent = form.getFieldValue(['prompts', promptKey]) || promptTemplates[promptKey]?.template || '';
    setCurrentPromptKey(promptKey);
    setCurrentPromptContent(currentContent);
    setPromptModalVisible(true);
  };

  // 保存提示词编辑
  const savePromptModal = () => {
    form.setFieldValue(['prompts', currentPromptKey], currentPromptContent);
    setPromptModalVisible(false);
    message.success('提示词已更新');
  };

  // 取消提示词编辑
  const cancelPromptModal = () => {
    setPromptModalVisible(false);
    setCurrentPromptKey('');
    setCurrentPromptContent('');
  };

  // 使用模板
  const useTemplate = (promptKey: string, templateKey: string) => {
    const template = promptTemplates[templateKey];
    if (template) {
      form.setFieldValue(['prompts', promptKey], template.template);
      message.success(`已应用模板: ${template.name}`);
    }
  };

  useEffect(() => {
    if (visible) {
      loadConfig();
    }
  }, [visible]);

  const renderModelConfig = () => (
    <Card title="模型配置" size="small">
      <Form.Item
        name={['model', 'extractionModel']}
        label="三元组提取模型"
        tooltip="用于从文档中提取实体和关系的LLM模型"
        rules={[{ required: true, message: '请选择提取模型' }]}
      >
        <Select 
          placeholder="选择模型"
          style={{
            color: '#000000'
          }}
          dropdownStyle={{
            color: '#000000'
          }}
        >
          {availableModels.map(model => (
            <Option key={model} value={model}>{model}</Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item
        name={['model', 'temperature']}
        label="温度"
        tooltip="控制生成结果的随机性，0-1之间，越低越确定"
      >
        <Form.Item noStyle shouldUpdate>
          {() => {
            const value = form.getFieldValue(['model', 'temperature']) || 0;
            return (
              <div>
                <Slider 
                  min={0} 
                  max={1} 
                  step={0.1} 
                  marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
                  tooltip={{ formatter: null }}
                  value={value}
                  onChange={(val) => form.setFieldValue(['model', 'temperature'], val)}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  当前值: {value}
                </div>
              </div>
            );
          }}
        </Form.Item>
      </Form.Item>
      
      <Form.Item
        name={['model', 'maxTokens']}
        label="最大令牌数"
        tooltip="单次请求的最大token数量"
      >
        <Form.Item noStyle shouldUpdate>
          {() => {
            const value = form.getFieldValue(['model', 'maxTokens']) || 4000;
            return (
              <div>
                <Slider 
                  min={1000} 
                  max={8000} 
                  step={500} 
                  marks={{ 1000: '1K', 4000: '4K', 8000: '8K' }}
                  tooltip={{ formatter: null }}
                  value={value}
                  onChange={(val) => form.setFieldValue(['model', 'maxTokens'], val)}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  当前值: {value}
                </div>
              </div>
            );
          }}
        </Form.Item>
      </Form.Item>
    </Card>
  );

  const renderExtractionConfig = () => (
    <Card title="提取参数" size="small">
      <Form.Item
        name={['extraction', 'chunkSize']}
        label="文档分块大小"
        tooltip="将长文档分割成小块处理，字符数"
      >
        <Form.Item noStyle shouldUpdate>
          {() => {
            const value = form.getFieldValue(['extraction', 'chunkSize']) || 4000;
            return (
              <div>
                <Slider 
                  min={1000} 
                  max={8000} 
                  step={500} 
                  marks={{ 1000: '1K', 4000: '4K', 8000: '8K' }}
                  tooltip={{ formatter: null }}
                  value={value}
                  onChange={(val) => form.setFieldValue(['extraction', 'chunkSize'], val)}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  当前值: {value}
                </div>
              </div>
            );
          }}
        </Form.Item>
      </Form.Item>
      
      <Form.Item
        name={['extraction', 'chunkOverlap']}
        label="分块重叠"
        tooltip="相邻分块的重叠字符数，保证信息连续性"
      >
        <Form.Item noStyle shouldUpdate>
          {() => {
            const value = form.getFieldValue(['extraction', 'chunkOverlap']) || 200;
            return (
              <div>
                <Slider 
                  min={0} 
                  max={500} 
                  step={50} 
                  marks={{ 0: '0', 250: '250', 500: '500' }}
                  tooltip={{ formatter: null }}
                  value={value}
                  onChange={(val) => form.setFieldValue(['extraction', 'chunkOverlap'], val)}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  当前值: {value}
                </div>
              </div>
            );
          }}
        </Form.Item>
      </Form.Item>
      
      <Form.Item
        name={['extraction', 'minEntityConfidence']}
        label="实体最小置信度"
        tooltip="实体提取的最小置信度阈值"
      >
        <Form.Item noStyle shouldUpdate>
          {() => {
            const value = form.getFieldValue(['extraction', 'minEntityConfidence']) || 0.8;
            return (
              <div>
                <Slider 
                  min={0} 
                  max={1} 
                  step={0.1} 
                  marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
                  tooltip={{ formatter: null }}
                  value={value}
                  onChange={(val) => form.setFieldValue(['extraction', 'minEntityConfidence'], val)}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  当前值: {value}
                </div>
              </div>
            );
          }}
        </Form.Item>
      </Form.Item>
      
      <Form.Item
        name={['extraction', 'minRelationConfidence']}
        label="关系最小置信度"
        tooltip="关系提取的最小置信度阈值"
      >
        <Form.Item noStyle shouldUpdate>
          {() => {
            const value = form.getFieldValue(['extraction', 'minRelationConfidence']) || 0.8;
            return (
              <div>
                <Slider 
                  min={0} 
                  max={1} 
                  step={0.1} 
                  marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
                  tooltip={{ formatter: null }}
                  value={value}
                  onChange={(val) => form.setFieldValue(['extraction', 'minRelationConfidence'], val)}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  当前值: {value}
                </div>
              </div>
            );
          }}
        </Form.Item>
      </Form.Item>
      
      <Form.Item
        name={['extraction', 'enableContinueExtraction']}
        label="启用继续提取"
        tooltip="当提取结果较少时，是否进行二次提取"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      
      <Form.Item
        name={['extraction', 'maxRetries']}
        label="最大重试次数"
        tooltip="提取失败时的最大重试次数"
      >
        <Form.Item noStyle shouldUpdate>
          {() => {
            const value = form.getFieldValue(['extraction', 'maxRetries']) || 2;
            return (
              <div>
                <Slider 
                  min={1} 
                  max={5} 
                  marks={{ 1: '1', 3: '3', 5: '5' }}
                  tooltip={{ formatter: null }}
                  value={value}
                  onChange={(val) => form.setFieldValue(['extraction', 'maxRetries'], val)}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  当前值: {value}
                </div>
              </div>
            );
          }}
        </Form.Item>
      </Form.Item>
    </Card>
  );

  const renderEntityTypesConfig = () => (
    <Card title="实体类型配置" size="small">
      <Collapse>
        {config?.entityTypes && Object.entries(config.entityTypes).map(([category, types]) => (
          <Panel header={category} key={category}>
            <Form.Item name={['entityTypes', category]}>
              <Select mode="tags" placeholder={`添加${category}类型`}>
                {types.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Form.Item>
          </Panel>
        ))}
      </Collapse>
    </Card>
  );

  const renderPromptsConfig = () => (
    <Card title="提示词配置" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        {promptTemplates && Object.entries(promptTemplates).map(([key, template]) => (
          <Card
            key={key}
            type="inner"
            size="small"
            title={
              <Space>
                <span>{template.name}</span>
                <Tooltip title={template.description}>
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            extra={
              <Space>
                <Tooltip title="查看模板变量">
                  <Button 
                    size="small" 
                    icon={<InfoCircleOutlined />}
                    onClick={() => {
                      Modal.info({
                        title: `${template.name} - 可用变量`,
                        content: (
                          <div>
                            <p>{template.description}</p>
                            <p><strong>可用变量:</strong></p>
                            <ul>
                              {template.variables.map(variable => (
                                <li key={variable}><code>{`{${variable}}`}</code></li>
                              ))}
                            </ul>
                          </div>
                        ),
                      });
                    }}
                  />
                </Tooltip>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openPromptModal(key)}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定要回退到原始提示词吗？"
                  onConfirm={() => revertPrompt(key)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button size="small" icon={<ReloadOutlined />}>
                    回退
                  </Button>
                </Popconfirm>
              </Space>
            }
          >
            <Form.Item name={['prompts', key]} style={{ marginBottom: 0 }}>
              <div
                style={{
                  maxHeight: '200px',
                  overflow: 'auto',
                  background: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  cursor: 'pointer'
                }}
                onClick={() => openPromptModal(key)}
                title="点击编辑提示词"
              >
                {config?.prompts[key] || template.template}
              </div>
            </Form.Item>
          </Card>
        ))}
      </Space>
    </Card>
  );

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          知识图谱配置
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={
        <Space>
          <Button onClick={resetConfig} icon={<ReloadOutlined />}>
            重置
          </Button>
          <Button onClick={onClose}>
            取消
          </Button>
          <Button
            type="primary"
            loading={saving}
            onClick={saveConfig}
            icon={<SaveOutlined />}
          >
            保存配置
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          model: {
            extractionModel: 'qwen3-235b-a22b-instruct-2507',
            temperature: 0.1,
            maxTokens: 4000
          },
          extraction: {
            chunkSize: 4000,
            chunkOverlap: 200,
            minEntityConfidence: 0.7,
            minRelationConfidence: 0.6,
            enableContinueExtraction: true,
            maxRetries: 2
          }
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="模型配置" key="model">
            {renderModelConfig()}
          </TabPane>
          
          <TabPane tab="提取参数" key="extraction">
            {renderExtractionConfig()}
          </TabPane>
          
          <TabPane tab="实体类型" key="entityTypes">
            {renderEntityTypesConfig()}
          </TabPane>
          
          <TabPane tab="提示词" key="prompts">
            {renderPromptsConfig()}
          </TabPane>
        </Tabs>
      </Form>
      
      {/* 修复Select文本颜色样式 */}
      <style>{`
        .ant-modal .ant-select-selection-item {
          color: #000000 !important;
        }
        
        .ant-modal .ant-select-single .ant-select-selector {
          color: #000000 !important;
        }
        
        .ant-modal .ant-select-selection-placeholder {
          color: #999999 !important;
        }
        
        .ant-modal .ant-select-dropdown .ant-select-item-option {
          color: #000000 !important;
        }
        
        .ant-modal .ant-select-dropdown .ant-select-item-option-content {
          color: #000000 !important;
        }
        
        .ant-modal .ant-select-dropdown {
          background: #ffffff !important;
        }
        
        .ant-modal .ant-select-item-option-selected {
          background-color: #e6f7ff !important;
          color: #1890ff !important;
        }
        
        .ant-modal .ant-select-item-option:hover {
          background-color: #f5f5f5 !important;
        }
      `}</style>
      
      {/* 提示词编辑弹窗 */}
      <Modal
        title={`编辑提示词: ${promptTemplates[currentPromptKey]?.name || currentPromptKey}`}
        open={promptModalVisible}
        onCancel={cancelPromptModal}
        width={800}
        footer={
          <Space>
            <Button onClick={cancelPromptModal}>
              取消
            </Button>
            <Button type="primary" onClick={savePromptModal}>
              保存
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            {promptTemplates[currentPromptKey]?.description}
          </Text>
        </div>
        <TextArea
          value={currentPromptContent}
          onChange={(e) => setCurrentPromptContent(e.target.value)}
          rows={20}
          placeholder="输入提示词内容..."
          autoSize={false}
          style={{ 
            fontFamily: 'monospace', 
            fontSize: '13px',
            lineHeight: '1.5',
            minHeight: '400px',
            resize: 'vertical'
          }}
        />
        {promptTemplates[currentPromptKey]?.variables?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>可用变量:</Text>
            <div style={{ marginTop: 8 }}>
              {promptTemplates[currentPromptKey].variables.map(variable => (
                <Button
                  key={variable}
                  size="small"
                  style={{ margin: '2px 4px 2px 0' }}
                  onClick={() => {
                    const textarea = document.querySelector('.ant-modal .ant-input') as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const newContent = currentPromptContent.substring(0, start) + 
                        `{${variable}}` + 
                        currentPromptContent.substring(end);
                      setCurrentPromptContent(newContent);
                      // 设置光标位置
                      setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = start + variable.length + 2;
                        textarea.focus();
                      }, 0);
                    }
                  }}
                >
                  {`{${variable}}`}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </Modal>
  );
};

export default GraphConfigPanel;