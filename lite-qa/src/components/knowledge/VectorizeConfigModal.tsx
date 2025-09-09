/**
 * 文档向量化配置Modal组件
 */
import React, { useEffect } from 'react';
import { 
  Modal, 
  Form, 
  InputNumber, 
  Select, 
  Switch,
  Divider,
  Alert,
  Typography
} from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import type { KnowledgeDocument } from '../../types';
import { useGlobalResourceStore } from '../../stores/globalResourceStore';

const { Option } = Select;
const { Text } = Typography;

interface VectorizeConfigModalProps {
  visible: boolean;
  document: KnowledgeDocument | null;
  onCancel: () => void;
  onConfirm: (documentId: string, config: VectorizeConfig) => void;
  defaultConfig?: VectorizeConfig;
}

export interface VectorizeConfig {
  chunkSize: number;
  chunkOverlap: number;
  chunkingStrategy: 'semantic' | 'fixed' | 'sentence' | 'paragraph';
  useDefault: boolean;
  configId?: string; // 关联的配置ID
  isCustom?: boolean; // 是否为自定义配置
  configName?: string; // 配置名称，用于显示
}

export const VectorizeConfigModal: React.FC<VectorizeConfigModalProps> = ({
  visible,
  document,
  onCancel,
  onConfirm,
  defaultConfig = {
    chunkSize: 512,
    chunkOverlap: 50,
    chunkingStrategy: 'semantic',
    useDefault: true
  }
}) => {
  const [form] = Form.useForm();
  const [useDefault, setUseDefault] = React.useState(true);
  const [selectedConfigId, setSelectedConfigId] = React.useState<string>('');
  const [isCustomConfig, setIsCustomConfig] = React.useState(false);
  const [hasConfigChanged, setHasConfigChanged] = React.useState(false);
  const [initialValues, setInitialValues] = React.useState<any>(null);
  
  // 从全局资源store获取切分配置
  const { 
    chunkingConfigs, 
    defaultChunkingConfig, 
    getDefaultChunkingConfig,
    isInitialized,
    initializeResources,
    getChunkingConfigById
  } = useGlobalResourceStore();
  
  // 确保全局资源已初始化
  useEffect(() => {
    if (!isInitialized) {
      initializeResources();
    }
  }, [isInitialized, initializeResources]);

  useEffect(() => {
    if (visible && document) {
      const isDocumentVectorized = document.vectorized || document.status === 'vectorized';
      
      // 获取文档当前使用的配置或系统默认配置
      let currentConfig;
      let currentConfigId = '';
      
      if (isDocumentVectorized && document.vectorConfig) {
        // 如果文档已向量化，使用文档的配置
        currentConfig = document.vectorConfig;
        currentConfigId = document.vectorConfig.configId || '';
        setIsCustomConfig(document.vectorConfig.isCustom || false);
      } else {
        // 未向量化，使用系统默认配置
        const systemDefaultConfig = getDefaultChunkingConfig();
        if (systemDefaultConfig) {
          currentConfig = systemDefaultConfig;
          currentConfigId = systemDefaultConfig.id;
        } else {
          // 如果没有默认配置，使用第一个可用配置
          const firstConfig = chunkingConfigs[0];
          if (firstConfig) {
            currentConfig = firstConfig;
            currentConfigId = firstConfig.id;
          } else {
            currentConfig = defaultConfig;
            currentConfigId = '';
          }
        }
        setIsCustomConfig(false);
      }
      
      
      // 设置初始状态
      setUseDefault(!isDocumentVectorized); // 已向量化的文档默认不使用"默认配置"模式
      setSelectedConfigId(currentConfigId);
      setHasConfigChanged(false);
      
      const initialFormValues = {
        chunkSize: currentConfig?.chunkSize || currentConfig?.chunk_token_num || defaultConfig.chunkSize,
        chunkOverlap: currentConfig?.chunkOverlap || currentConfig?.chunk_overlap || defaultConfig.chunkOverlap,
        selectedConfigId: currentConfigId
      };
      
      console.log('🔧 VectorizeConfigModal 初始化:', {
        document: document?.id,
        currentConfig,
        currentConfigId,
        initialFormValues,
        isDocumentVectorized,
        useDefault: !isDocumentVectorized
      });
      
      setInitialValues(initialFormValues);
      form.resetFields();
      form.setFieldsValue(initialFormValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, document, defaultChunkingConfig]);

  const handleSubmit = async () => {
    
    try {
      const values = await form.validateFields();
      
      if (document) {
        // 获取配置名称
        let configName = '';
        let finalConfigId = values.selectedConfigId || selectedConfigId;
        
        console.log('🔧 获取配置名称:', {
          isCustomConfig,
          finalConfigId,
          selectedConfigId,
          useDefault,
          formValues: values
        });
        
        if (isCustomConfig) {
          configName = '自定义配置';
        } else if (finalConfigId) {
          const selectedConfig = getChunkingConfigById(finalConfigId);
          configName = selectedConfig?.name || '预设配置';
          console.log('📋 使用选择的配置:', { finalConfigId, selectedConfig, configName });
        } else if (useDefault) {
          const defaultConfig = getDefaultChunkingConfig();
          configName = defaultConfig?.name || '默认配置';
          console.log('📋 使用默认配置:', { defaultConfig, configName });
        } else {
          // 如果没有配置ID，强制使用默认配置
          const defaultConfig = getDefaultChunkingConfig();
          if (defaultConfig) {
            configName = defaultConfig.name;
            finalConfigId = defaultConfig.id;
            console.log('🔧 强制使用默认配置:', { defaultConfig, configName });
          } else {
            configName = '预设配置';
            console.log('⚠️ 没有找到合适的配置');
          }
        }
        
        // 获取实际的配置信息  
        const actualConfigId = finalConfigId; // 使用前面处理过的finalConfigId
        const selectedConfig = getChunkingConfigById(actualConfigId);
        
        console.log('🚀 VectorizeConfigModal 提交配置:', {
          document: document?.id,
          values,
          selectedConfigId,
          actualConfigId,
          selectedConfig,
          configName,
          isCustomConfig,
          useDefault
        });
        
        // 构建配置对象
        const config: VectorizeConfig = {
          chunkSize: values.chunkSize,
          chunkOverlap: values.chunkOverlap,
          chunkingStrategy: selectedConfig?.strategy || 'semantic',
          useDefault: useDefault,
          configId: isCustomConfig ? undefined : actualConfigId,
          isCustom: isCustomConfig,
          configName: configName
        };
        
        // 确保配置名称正确设置
        if (!config.configName) {
          if (isCustomConfig) {
            config.configName = '自定义配置';
          } else if (selectedConfig) {
            config.configName = selectedConfig.name;
          } else {
            config.configName = '默认配置';
          }
        }
        
        console.log('📋 最终构建的config对象:', config);
        
        onConfirm(document.id, config);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleUseDefaultChange = (checked: boolean) => {
    setUseDefault(checked);
    if (checked) {
      // 当启用默认配置时，使用全局配置的默认值
      const systemDefaultConfig = getDefaultChunkingConfig();
      const newValues = {
        chunkSize: systemDefaultConfig?.chunkSize || systemDefaultConfig?.chunk_token_num || defaultConfig.chunkSize,
        chunkOverlap: systemDefaultConfig?.chunkOverlap || systemDefaultConfig?.chunk_overlap || defaultConfig.chunkOverlap,
        selectedConfigId: systemDefaultConfig?.id || ''
      };
      form.setFieldsValue(newValues);
      setSelectedConfigId(systemDefaultConfig?.id || '');
      setIsCustomConfig(false);
      checkIfConfigChanged(newValues);
    }
  };

  // 处理分块策略选择变化
  const handleStrategyChange = (configId: string) => {
    const selectedConfig = getChunkingConfigById(configId);
    if (selectedConfig) {
      const newValues = {
        chunkSize: selectedConfig.chunkSize || selectedConfig.chunk_token_num,
        chunkOverlap: selectedConfig.chunkOverlap || selectedConfig.chunk_overlap,
        selectedConfigId: configId
      };
      form.setFieldsValue(newValues);
      setSelectedConfigId(configId);
      setIsCustomConfig(false);
      setUseDefault(false); // 选择具体配置时，退出默认模式
      checkIfConfigChanged(newValues);
    }
  };

  // 处理手动参数变化
  const handleManualChange = () => {
    const currentValues = form.getFieldsValue();
    setIsCustomConfig(true);
    checkIfConfigChanged(currentValues);
  };

  // 检查配置是否发生变化
  const checkIfConfigChanged = (currentValues: any) => {
    if (!initialValues) return;
    
    const hasChanged = 
      currentValues.chunkSize !== initialValues.chunkSize ||
      currentValues.chunkOverlap !== initialValues.chunkOverlap ||
      currentValues.chunkingStrategy !== initialValues.chunkingStrategy;
    
    setHasConfigChanged(hasChanged);
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <ExperimentOutlined className="mr-2" />
          向量化配置 - {document?.title}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={
        document?.vectorized || document?.status === 'vectorized' 
          ? "重新向量化"
          : "开始向量化"
      }
      okButtonProps={{
        disabled: document?.status === 'processing'  // 只在处理中时禁用
      }}
      cancelText="取消"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          chunkSize: defaultConfig.chunkSize,
          chunkOverlap: defaultConfig.chunkOverlap,
          selectedConfigId: ''
        }}
      >
        <Alert
          message="配置说明"
          description="您可以使用系统默认配置，或为此文档自定义向量化参数。自定义参数仅对当前文档生效。"
          type="info"
          showIcon
          className="mb-4"
        />

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>配置模式：</span>
            <Switch
              checked={useDefault}
              checkedChildren="默认"
              unCheckedChildren="自定义"
              onChange={(checked) => {
                handleUseDefaultChange(checked);
              }}
            />
            <span style={{ color: '#666', fontSize: 12 }}>
              {useDefault ? '使用系统默认配置' : '使用自定义配置'}
            </span>
          </div>
        </div>

        <Divider />

        <div className={useDefault ? 'opacity-50 pointer-events-none' : ''}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="chunkSize"
              label="文本块大小"
              rules={[{ required: true, message: '请输入文本块大小' }]}
              extra="每个文本块的最大字符数"
            >
              <InputNumber
                min={128}
                max={2048}
                step={128}
                className="w-full"
                disabled={useDefault}
                onChange={handleManualChange}
              />
            </Form.Item>

            <Form.Item
              name="chunkOverlap"
              label="重叠字符数"
              rules={[{ required: true, message: '请输入重叠字符数' }]}
              extra="相邻文本块之间的重叠字符数"
            >
              <InputNumber
                min={0}
                max={200}
                step={10}
                className="w-full"
                disabled={useDefault}
                onChange={handleManualChange}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="selectedConfigId"
            label="分块策略"
            rules={[{ required: true, message: '请选择分块策略' }]}
            extra="选择最适合文档内容的分块方式"
          >
            <Select
              placeholder="选择分块策略"
              disabled={useDefault}
              value={selectedConfigId}
              onChange={handleStrategyChange}
            >
              {chunkingConfigs.map(config => (
                <Option key={config.id} value={config.id}>
                  {config.name}
                  {config.isDefault && <span style={{ color: '#1890ff', marginLeft: 4 }}>(默认)</span>}
                </Option>
              ))}
              {/* 如果没有加载到配置，显示后备选项 */}
              {chunkingConfigs.length === 0 && (
                <>
                  <Option value="default-semantic">语义分块</Option>
                  <Option value="fixed-size">固定长度</Option>
                  <Option value="sentence-based">句子边界</Option>
                  <Option value="paragraph-based">段落边界</Option>
                </>
              )}
            </Select>
          </Form.Item>
        </div>

        {!useDefault && (
          <Alert
            message="使用自定义配置"
            description="当前使用的是自定义配置，这些参数仅对本文档生效。"
            type="warning"
            showIcon
            className="mt-4"
          />
        )}
      </Form>
    </Modal>
  );
}; 