/**
 * DeepScrape全局配置组件
 * 用于配置LLM智能处理和内容清洗参数
 */
import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Divider,
  InputNumber,
  Space,
  Tabs,
  Alert,
  Card,
  Tag,
  Tooltip,
  message,
  Spin
} from 'antd';
import {
  SettingOutlined,
  RobotOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  ClearOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { deepScrapeConfigService, type ModelOption } from '../../services/deepScrapeConfigService';

const { Option } = Select;
const { TextArea } = Input;

export interface DeepScrapeConfigType {
  // LLM配置
  llm: {
    enabled: boolean;
    provider: 'openai' | 'vllm' | 'ollama' | 'localai' | 'litellm' | 'custom';
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
    maxRetries: number;
    extractionType: 'structured' | 'summary' | 'qa';
    promptFormat: 'zero-shot' | 'few-shot';
  };

  // 内容清洗配置
  cleaning: {
    removeAds: boolean;
    removeTracking: boolean;
    removeScripts: boolean;
    removeHiddenElements: boolean;
    removeSocialButtons: boolean;
    removeComments: boolean;
    removePopups: boolean;
  };

  // 爬取配置
  scraping: {
    timeout: number;
    blockAds: boolean;
    blockResources: boolean;
    userAgent: string;
    javascript: boolean;
    fullPage: boolean;
    extractorFormat: 'html' | 'markdown' | 'text';
  };

  // 批处理配置
  batch: {
    enabled: boolean;
    concurrency: number;
    maxConcurrentJobs: number;
  };
}

interface DeepScrapeConfigDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (config: DeepScrapeConfigType) => void;
  initialConfig?: DeepScrapeConfigType;
}

const defaultConfig: DeepScrapeConfigType = {
  llm: {
    enabled: false,
    provider: 'openai',
    model: '', // 不设置默认值,从9050服务获取
    temperature: 0.2,
    maxTokens: 4000,
    timeout: 120000,
    maxRetries: 3,
    extractionType: 'summary',
    promptFormat: 'zero-shot'
  },
  cleaning: {
    removeAds: true,
    removeTracking: true,
    removeScripts: true,
    removeHiddenElements: true,
    removeSocialButtons: true,
    removeComments: true,
    removePopups: true
  },
  scraping: {
    timeout: 30000,
    blockAds: true,
    blockResources: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    javascript: true,
    fullPage: false,
    extractorFormat: 'markdown'
  },
  batch: {
    enabled: true,
    concurrency: 3,
    maxConcurrentJobs: 5
  }
};

export const DeepScrapeConfigDrawer: React.FC<DeepScrapeConfigDrawerProps> = ({
  visible,
  onClose,
  onSave,
  initialConfig
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('llm');
  const [config, setConfig] = useState<DeepScrapeConfigType>(initialConfig || defaultConfig);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // 加载配置 - 每次打开抽屉时都重新加载最新配置
  useEffect(() => {
    const fetchConfig = async () => {
      if (!visible) return;

      try {
        setLoadingConfig(true);
        setConfigLoaded(false);
        console.log('📥 开始加载配置...');

        // 总是从后端获取最新配置，忽略 initialConfig
        const savedConfig = await deepScrapeConfigService.getConfig();
        console.log('📦 从后端获取的配置:', JSON.stringify(savedConfig, null, 2));

        const flattenedConfig = flattenConfig(savedConfig);
        console.log('🔄 扁平化后的配置:', flattenedConfig);

        setConfig(savedConfig);
        form.setFieldsValue(flattenedConfig);

        console.log('✅ 配置加载完成');
      } catch (error) {
        console.error('❌ 加载配置失败:', error);
        // 如果加载失败，使用默认配置
        const defaultCfg = deepScrapeConfigService.getDefaultConfig();
        setConfig(defaultCfg);
        form.setFieldsValue(flattenConfig(defaultCfg));
      } finally {
        setLoadingConfig(false);
        setConfigLoaded(true);
      }
    };

    fetchConfig();
  }, [visible, form]);

  // 加载可用模型列表 (在配置加载完成后)
  useEffect(() => {
    const fetchModels = async () => {
      if (!configLoaded) return;

      try {
        setLoadingModels(true);
        console.log('🔄 开始从模型网关获取LLM模型列表...');
        const modelsList = await deepScrapeConfigService.getAvailableModels();
        console.log('✅ 成功获取模型列表:', modelsList);
        if (modelsList && modelsList.length > 0) {
          setModels(modelsList);

          // 获取当前表单的model值
          const currentModel = form.getFieldValue('llm_model');
          console.log('📌 当前表单model值:', currentModel);

          // 查找默认模型
          const defaultModel = modelsList.find(m => m.isDefault);
          console.log('🔍 查找默认模型结果:', defaultModel);
          console.log('🔍 所有模型的isDefault状态:', modelsList.map(m => ({ id: m.id, name: m.name, isDefault: m.isDefault })));

          // 检查当前model是否在模型列表中
          const isValidModel = currentModel && modelsList.some(m => m.id === currentModel);
          console.log('🔍 当前model是否有效:', isValidModel);

          if (!isValidModel) {
            // 如果当前model无效或为空，尝试使用默认模型
            if (defaultModel) {
              console.log('🎯 使用默认模型:', defaultModel.name, defaultModel.id);
              form.setFieldValue('llm_model', defaultModel.id);
              message.info(`已自动选择默认模型: ${defaultModel.name}`);
            } else {
              // 如果没有默认模型，使用列表中的第一个模型
              console.log('⚠️ 未找到默认模型标记，使用第一个模型');
              const firstModel = modelsList[0];
              form.setFieldValue('llm_model', firstModel.id);
              message.info(`已自动选择模型: ${firstModel.name}`);
            }
          } else {
            console.log('✅ 当前model有效，保持不变:', currentModel);
          }

          message.success(`成功加载 ${modelsList.length} 个模型`);
        } else {
          console.warn('⚠️ 模型列表为空');
          message.warning('模型列表为空，请检查模型网关服务');
        }
      } catch (error) {
        console.error('❌ 加载模型列表失败:', error);
        message.error(`加载模型列表失败: ${error.message || '未知错误'}`);
      } finally {
        setLoadingModels(false);
      }
    };

    if (visible && configLoaded) {
      fetchModels();
    }
  }, [visible, configLoaded, form]);

  // 扁平化配置用于表单 - 添加前缀避免字段冲突
  const flattenConfig = (cfg: DeepScrapeConfigType) => {
    return {
      // LLM配置
      llm_enabled: cfg.llm.enabled,
      llm_provider: cfg.llm.provider,
      llm_model: cfg.llm.model,
      llm_temperature: cfg.llm.temperature,
      llm_maxTokens: cfg.llm.maxTokens,
      llm_timeout: cfg.llm.timeout,
      llm_maxRetries: cfg.llm.maxRetries,
      llm_extractionType: cfg.llm.extractionType,
      llm_promptFormat: cfg.llm.promptFormat,
      // 清洗配置
      cleaning_removeAds: cfg.cleaning.removeAds,
      cleaning_removeTracking: cfg.cleaning.removeTracking,
      cleaning_removeScripts: cfg.cleaning.removeScripts,
      cleaning_removeHiddenElements: cfg.cleaning.removeHiddenElements,
      cleaning_removeSocialButtons: cfg.cleaning.removeSocialButtons,
      cleaning_removeComments: cfg.cleaning.removeComments,
      cleaning_removePopups: cfg.cleaning.removePopups,
      // 爬取配置
      scraping_timeout: cfg.scraping.timeout,
      scraping_blockAds: cfg.scraping.blockAds,
      scraping_blockResources: cfg.scraping.blockResources,
      scraping_userAgent: cfg.scraping.userAgent,
      scraping_javascript: cfg.scraping.javascript,
      scraping_fullPage: cfg.scraping.fullPage,
      scraping_extractorFormat: cfg.scraping.extractorFormat,
      // 批处理配置
      batch_enabled: cfg.batch.enabled,
      batch_concurrency: cfg.batch.concurrency,
      batch_maxConcurrentJobs: cfg.batch.maxConcurrentJobs
    };
  };

  // 恢复配置结构
  const reconstructConfig = (values: any): DeepScrapeConfigType => {
    return {
      llm: {
        enabled: values.llm_enabled,
        provider: values.llm_provider,
        model: values.llm_model,
        temperature: values.llm_temperature,
        maxTokens: values.llm_maxTokens,
        timeout: values.llm_timeout,
        maxRetries: values.llm_maxRetries,
        extractionType: values.llm_extractionType,
        promptFormat: values.llm_promptFormat
      },
      cleaning: {
        removeAds: values.cleaning_removeAds,
        removeTracking: values.cleaning_removeTracking,
        removeScripts: values.cleaning_removeScripts,
        removeHiddenElements: values.cleaning_removeHiddenElements,
        removeSocialButtons: values.cleaning_removeSocialButtons,
        removeComments: values.cleaning_removeComments,
        removePopups: values.cleaning_removePopups
      },
      scraping: {
        timeout: values.scraping_timeout,
        blockAds: values.scraping_blockAds,
        blockResources: values.scraping_blockResources,
        userAgent: values.scraping_userAgent,
        javascript: values.scraping_javascript,
        fullPage: values.scraping_fullPage,
        extractorFormat: values.scraping_extractorFormat
      },
      batch: {
        enabled: values.batch_enabled,
        concurrency: values.batch_concurrency,
        maxConcurrentJobs: values.batch_maxConcurrentJobs
      }
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();

      // 从选中的模型自动获取provider信息
      const selectedModel = models.find(m => m.id === values.llm_model);
      const provider = selectedModel?.provider || 'custom';

      const newConfig = reconstructConfig({ ...values, llm_provider: provider });

      // 保存到数据库
      const savedConfig = await deepScrapeConfigService.saveConfig({
        ...newConfig,
        configName: 'default',
        isDefault: true
      });

      console.log('✅ 保存成功，返回的配置:', JSON.stringify(savedConfig, null, 2));
      setConfig(savedConfig);
      onSave(savedConfig);

      // 重新设置表单值以显示最新保存的数据
      form.setFieldsValue(flattenConfig(savedConfig));

      message.success('配置已保存到数据库');
      // 不要自动关闭抽屉，让用户自己决定
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error(error instanceof Error ? error.message : '配置保存失败，请检查输入');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    form.setFieldsValue(flattenConfig(defaultConfig));
    message.info('已恢复默认配置');
  };

  return (
    <Drawer
      title={
        <Space>
          <SettingOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          <span style={{ fontSize: '16px', fontWeight: 600 }}>全局配置</span>
        </Space>
      }
      width={750}
      open={visible}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleReset} icon={<ReloadOutlined />} disabled={saving || loadingConfig}>
            恢复默认
          </Button>
          <Space>
            <Button onClick={onClose} disabled={saving}>取消</Button>
            <Button
              type="primary"
              onClick={handleSave}
              icon={<SaveOutlined />}
              loading={saving}
              disabled={loadingConfig}
            >
              保存配置
            </Button>
          </Space>
        </div>
      }
    >
      <Spin spinning={loadingConfig} tip="加载配置中..."  >
      <Form
        form={form}
        layout="vertical"
        initialValues={flattenConfig(config)}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          items={[
            {
              key: 'llm',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ExperimentOutlined style={{ fontSize: '16px' }} />
                  <span>AI智能处理</span>
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <ExperimentOutlined style={{ fontSize: '24px', marginRight: '12px' }} />
                      <span style={{ fontSize: '18px', fontWeight: 600 }}>AI智能处理</span>
                    </div>
                    <p style={{ margin: 0, opacity: 0.95, lineHeight: 1.6 }}>
                      使用大语言模型对抓取内容进行智能提取、摘要生成或问答处理，支持结构化数据提取和语义理解
                    </p>
                  </div>

                  <Form.Item
                    label="启用LLM处理"
                    name="llm_enabled"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="启用"
                      unCheckedChildren="禁用"
                    />
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.llm_enabled !== currentValues.llm_enabled
                    }
                  >
                    {({ getFieldValue }) =>
                      getFieldValue('llm_enabled') ? (
                        <>
                          <Form.Item
                            label="模型名称"
                            name="llm_model"
                            rules={[{ required: true, message: '请选择或输入模型名称' }]}
                            extra={
                              loadingModels
                                ? '正在从模型网关(端口9050)加载模型列表...'
                                : models.length > 0
                                  ? `已加载 ${models.length} 个模型`
                                  : '无可用模型，请检查模型网关服务或手动输入'
                            }
                          >
                            <Select
                              placeholder={models.length > 0 ? "请选择模型" : "请输入模型名称 (例如: gpt-4o)"}
                              loading={loadingModels}
                              showSearch
                              mode={models.length === 0 ? undefined : undefined}
                              allowClear
                              optionFilterProp="children"
                              filterOption={(input, option) =>
                                (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                              }
                              notFoundContent={
                                loadingModels ? <Spin size="small" /> : models.length === 0 ? (
                                  <div style={{ padding: '8px', textAlign: 'center', color: '#999' }}>
                                    未获取到模型列表，请输入模型名称
                                  </div>
                                ) : '无匹配模型'
                              }
                            >
                              {models.map((model) => (
                                <Option key={model.id} value={model.id}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>
                                      <Tag color="blue">{model.provider}</Tag>
                                      {model.name}
                                    </span>
                                    {model.context_length > 0 && (
                                      <span style={{ color: '#999', fontSize: '12px' }}>
                                        {model.context_length} tokens
                                      </span>
                                    )}
                                  </div>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>

                          <Form.Item
                            label="提取模式"
                            name="llm_extractionType"
                          >
                            <Select>
                              <Option value="structured">
                                <Tag color="blue">Structured</Tag> 结构化数据提取
                              </Option>
                              <Option value="summary">
                                <Tag color="green">Summary</Tag> 内容摘要生成
                              </Option>
                              <Option value="qa">
                                <Tag color="purple">QA</Tag> 问答式提取
                              </Option>
                            </Select>
                          </Form.Item>

                          <Form.Item
                            label="Prompt策略"
                            name="llm_promptFormat"
                          >
                            <Select>
                              <Option value="zero-shot">Zero-shot (零样本)</Option>
                              <Option value="few-shot">Few-shot (少样本学习)</Option>
                            </Select>
                          </Form.Item>

                          <Card
                            size="small"
                            title={
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <SettingOutlined style={{ color: '#1890ff' }} />
                                <span>模型参数</span>
                              </span>
                            }
                            style={{
                              marginBottom: 16,
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}
                            headStyle={{
                              background: '#fafafa',
                              borderRadius: '8px 8px 0 0'
                            }}
                          >
                            <Form.Item
                              label={
                                <span>
                                  Temperature
                                  <Tooltip title="控制输出的随机性，越高越随机">
                                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                                  </Tooltip>
                                </span>
                              }
                              name="llm_temperature"
                            >
                              <InputNumber
                                min={0}
                                max={2}
                                step={0.1}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>

                            <Form.Item
                              label="最大Token数"
                              name="llm_maxTokens"
                            >
                              <InputNumber
                                min={100}
                                max={32000}
                                step={100}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>

                            <Form.Item
                              label="超时时间(ms)"
                              name="llm_timeout"
                            >
                              <InputNumber
                                min={10000}
                                max={600000}
                                step={10000}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>

                            <Form.Item
                              label="最大重试次数"
                              name="llm_maxRetries"
                            >
                              <InputNumber
                                min={0}
                                max={10}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          </Card>
                        </>
                      ) : null
                    }
                  </Form.Item>
                </div>
              )
            },
            {
              key: 'cleaning',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClearOutlined style={{ fontSize: '16px' }} />
                  <span>内容清洗</span>
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(17, 153, 142, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <ClearOutlined style={{ fontSize: '24px', marginRight: '12px' }} />
                      <span style={{ fontSize: '18px', fontWeight: 600 }}>内容清洗与过滤</span>
                    </div>
                    <p style={{ margin: 0, opacity: 0.95, lineHeight: 1.6 }}>
                      智能移除广告、跟踪脚本、社交按钮等干扰内容，自动提取页面核心内容，提升数据质量
                    </p>
                  </div>

                  <Card
                    size="small"
                    title={
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FilterOutlined style={{ color: '#52c41a' }} />
                        <span>清洗选项</span>
                      </span>
                    }
                    style={{
                      marginBottom: 16,
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                    headStyle={{
                      background: '#fafafa',
                      borderRadius: '8px 8px 0 0'
                    }}
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <Form.Item
                        label="移除广告"
                        name="cleaning_removeAds"
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>

                      <Form.Item
                        label="移除跟踪器"
                        name="cleaning_removeTracking"
                        valuePropName="checked"
                        extra="移除Google Analytics、Facebook Pixel等跟踪代码"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>

                      <Form.Item
                        label="移除脚本"
                        name="cleaning_removeScripts"
                        valuePropName="checked"
                        extra="移除JavaScript和样式标签"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>

                      <Form.Item
                        label="移除隐藏元素"
                        name="cleaning_removeHiddenElements"
                        valuePropName="checked"
                        extra="移除display:none和visibility:hidden的元素"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>

                      <Form.Item
                        label="移除社交按钮"
                        name="cleaning_removeSocialButtons"
                        valuePropName="checked"
                        extra="移除微信、微博、抖音等社交分享按钮"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>

                      <Form.Item
                        label="移除评论区"
                        name="cleaning_removeComments"
                        valuePropName="checked"
                        extra="移除Disqus、评论区等内容"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>

                      <Form.Item
                        label="移除弹窗"
                        name="cleaning_removePopups"
                        valuePropName="checked"
                        extra="移除Newsletter弹窗、模态框等"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>
                    </Space>
                  </Card>
                </div>
              )
            },
            {
              key: 'scraping',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RocketOutlined style={{ fontSize: '16px' }} />
                  <span>爬取配置</span>
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(240, 147, 251, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <RocketOutlined style={{ fontSize: '24px', marginRight: '12px' }} />
                      <span style={{ fontSize: '18px', fontWeight: 600 }}>爬取行为配置</span>
                    </div>
                    <p style={{ margin: 0, opacity: 0.95, lineHeight: 1.6 }}>
                      精细化控制页面加载行为、资源阻止策略、超时设置等，优化爬取效率和数据质量
                    </p>
                  </div>

                  <Form.Item
                    label="页面超时(ms)"
                    name="scraping_timeout"
                    rules={[{ required: true, message: '请输入超时时间' }]}
                  >
                    <InputNumber
                      min={5000}
                      max={180000}
                      step={1000}
                      style={{ width: '100%' }}
                      addonAfter="毫秒"
                    />
                  </Form.Item>

                  <Form.Item
                    label="阻止广告"
                    name="scraping_blockAds"
                    valuePropName="checked"
                    extra="在页面加载时阻止广告请求"
                  >
                    <Switch
                      checkedChildren="启用"
                      unCheckedChildren="禁用"
                    />
                  </Form.Item>

                  <Form.Item
                    label="阻止资源加载"
                    name="scraping_blockResources"
                    valuePropName="checked"
                    extra="阻止图片、CSS、字体等资源加载，提升速度"
                  >
                    <Switch
                      checkedChildren="启用"
                      unCheckedChildren="禁用"
                    />
                  </Form.Item>

                  <Form.Item
                    label="启用JavaScript"
                    name="scraping_javascript"
                    valuePropName="checked"
                    extra="是否执行页面JavaScript（动态内容需启用）"
                  >
                    <Switch
                      checkedChildren="启用"
                      unCheckedChildren="禁用"
                    />
                  </Form.Item>

                  <Form.Item
                    label="完整页面截图"
                    name="scraping_fullPage"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="启用"
                      unCheckedChildren="禁用"
                    />
                  </Form.Item>

                  <Form.Item
                    label="输出格式"
                    name="scraping_extractorFormat"
                  >
                    <Select>
                      <Option value="html">HTML (原始HTML)</Option>
                      <Option value="markdown">Markdown (推荐)</Option>
                      <Option value="text">Text (纯文本)</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="User Agent"
                    name="scraping_userAgent"
                    extra="自定义浏览器标识"
                  >
                    <TextArea
                      rows={2}
                      placeholder="Mozilla/5.0..."
                    />
                  </Form.Item>

                  <Divider style={{ margin: '32px 0' }} />

                  <Card
                    size="small"
                    title={
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ThunderboltOutlined style={{ color: '#fa8c16' }} />
                        <span>批处理配置</span>
                      </span>
                    }
                    style={{
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                    headStyle={{
                      background: '#fafafa',
                      borderRadius: '8px 8px 0 0'
                    }}
                  >
                    <Form.Item
                      label="批处理并发数"
                      name="batch_concurrency"
                    >
                      <InputNumber
                        min={1}
                        max={20}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>

                    <Form.Item
                      label="最大并发任务数"
                      name="batch_maxConcurrentJobs"
                    >
                      <InputNumber
                        min={1}
                        max={50}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Card>
                </div>
              )
            }
          ]}
        />
      </Form>
      </Spin>
    </Drawer>
  );
};

// 用于读取保存的配置 (异步版本)
export const loadDeepScrapeConfig = async (): Promise<DeepScrapeConfigType> => {
  try {
    const config = await deepScrapeConfigService.getConfig();
    return config;
  } catch (error) {
    console.error('加载配置失败:', error);
    return deepScrapeConfigService.getDefaultConfig();
  }
};

// 用于保存配置 (异步版本)
export const saveDeepScrapeConfig = async (config: DeepScrapeConfigType): Promise<void> => {
  try {
    await deepScrapeConfigService.saveConfig({
      ...config,
      configName: 'default',
      isDefault: true
    });
  } catch (error) {
    console.error('保存配置失败:', error);
    throw error;
  }
};
