/**
 * 系统设置组件 - 管理全局配置 (性能优化版本)
 */
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  Modal, 
  Tabs, 
  Form, 
  Select, 
  Switch, 
  Input, 
  Button, 
  Card,
  Typography,
  Tag,
  Divider,
  message,
  Tooltip,
  InputNumber
} from 'antd';
import { 
  SettingOutlined, 
  ApiOutlined, 
  DatabaseOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  CloudServerOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  ClusterOutlined,
  DeploymentUnitOutlined
} from '@ant-design/icons';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { useAppStore, type DatabaseConfig, type ModelConfig, type VectorizationConfig, type AgentConfig } from '../../stores/appStore';
// import { bffService } from '../../services/bffService'; // TODO: 重新实现配置保存
import { systemConfigService } from '../../services/systemConfigService';
import type { ValidationResult } from '../../services/configValidation';
import type { SystemConfigResponse, ServiceConfigStatus } from '../../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface SystemSettingsProps {
  visible: boolean;
  onClose: () => void;
}

const SystemSettingsComponent: React.FC<SystemSettingsProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState('models');
  const [saving, setSaving] = useState(false);
  
  // 在Modal打开时添加全局样式类和禁止滚动
  useEffect(() => {
    if (visible) {
      document.body.classList.add('clean-modal-active');
      document.body.style.overflow = 'hidden'; // 禁止页面滚动
    } else {
      document.body.classList.remove('clean-modal-active');
      document.body.style.overflow = 'unset'; // 恢复页面滚动
    }
    
    // 清理函数
    return () => {
      document.body.classList.remove('clean-modal-active');
      document.body.style.overflow = 'unset';
    };
  }, [visible]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfigResponse | null>(null); // 系统配置状态
  const [serviceStatus, setServiceStatus] = useState<ServiceConfigStatus[]>([]); // 服务状态
  
  // 性能优化：延迟加载重内容
  const [contentLoaded, setContentLoaded] = useState(false);
  
  // 新增验证相关状态
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [configScore, setConfigScore] = useState<number>(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 本地状态变量
  const [enableDualVector, setEnableDualVector] = useState(true);
  const [enableKnowledgeGraph, setEnableKnowledgeGraph] = useState(false);
  const [esAuthType, setEsAuthType] = useState<'userpass' | 'token'>('userpass');
  
  // 使用全局状态管理所有配置
  const {
    storageConfig,
    storageStatus,
    databaseConfig,
    modelConfig,
    vectorizationConfig,
    agentConfig,
    setStorageConfig,
    setDatabaseConfig,
    setModelConfig,
    setVectorizationConfig,
    setAgentConfig,
    checkStorageHealth
  } = useAppStore();
  
  const {
    chatModels,
    embeddingModels,
    selectedChatModel,
    refreshModelsFromAPI
  } = useKnowledgeStore();

  // 创建表单实例
  const [form] = Form.useForm();
  const [databaseForm] = Form.useForm();
  const [systemForm] = Form.useForm();

  // 同步modelConfig到表单
  useEffect(() => {
    // 延迟设置表单值，确保Form组件已完全渲染
    setTimeout(() => {
      form.setFieldsValue({
        chatModel: modelConfig.llm.chatModel,
        temperature: modelConfig.llm.temperature,
        maxTokens: modelConfig.llm.maxTokens,
        chatEndpoint: modelConfig.llm.chatEndpoint,
        chatApiKey: modelConfig.llm.chatApiKey,
        enableStreaming: modelConfig.llm.enableStreaming,
        generalModel: modelConfig.embedding.generalModel,
        generalEndpoint: modelConfig.embedding.generalEndpoint,
        generalApiKey: modelConfig.embedding.generalApiKey,
        domainModel: modelConfig.embedding.domainModel,
        domainEndpoint: modelConfig.embedding.domainEndpoint,
        domainApiKey: modelConfig.embedding.domainApiKey,
      });
    }, 0);
  }, [modelConfig, form]);

  // 同步databaseConfig到数据库表单
  useEffect(() => {
    setTimeout(() => {
      databaseForm.setFieldsValue({
      // PostgreSQL配置
      pgHost: databaseConfig.postgresql.host,
      pgPort: databaseConfig.postgresql.port,
      pgDatabase: databaseConfig.postgresql.database,
      pgUsername: databaseConfig.postgresql.username,
      pgPassword: databaseConfig.postgresql.password,
      pgMaxConnections: databaseConfig.postgresql.maxConnections,
      pgConnectionTimeout: databaseConfig.postgresql.connectionTimeout,
      
      // ElasticSearch配置
      esHost: databaseConfig.elasticsearch.host,
      esIndex: databaseConfig.elasticsearch.index,
      esAuthType: databaseConfig.elasticsearch.authType,
      esUsername: databaseConfig.elasticsearch.username,
      esPassword: databaseConfig.elasticsearch.password,
      esToken: databaseConfig.elasticsearch.token,
      
      // ArangoDB已移除
      });
    }, 0);
  }, [databaseConfig, databaseForm]);

  // 同步vectorizationConfig和agentConfig到系统表单
  useEffect(() => {
    setTimeout(() => {
      systemForm.setFieldsValue({
      // 向量化配置
      enableDualVector: vectorizationConfig.enableDualVector,
      retrievalMode: vectorizationConfig.retrievalMode,
      vectorTopK: vectorizationConfig.vectorSearch.topK,
      vectorThreshold: vectorizationConfig.vectorSearch.threshold,
      keywordLimit: vectorizationConfig.keywordSearch.limit,
      keywordFuzzyMatch: vectorizationConfig.keywordSearch.fuzzyMatch,
      vectorWeight: vectorizationConfig.hybridSearch.vectorWeight,
      keywordWeight: vectorizationConfig.hybridSearch.keywordWeight,
      enableRerank: vectorizationConfig.hybridSearch.enableRerank,
      rerankTopK: vectorizationConfig.rerank.topK,
      rerankThreshold: vectorizationConfig.rerank.threshold,
      
      // 智能体配置
      enableKnowledgeGraph: agentConfig.enableKnowledgeGraph,
      extractionMode: agentConfig.extractionMode,
      minConfidence: agentConfig.extractionConfig.minConfidence,
      batchSize: agentConfig.extractionConfig.batchSize,
      maxConcurrency: agentConfig.extractionConfig.maxConcurrency,
      retryAttempts: agentConfig.extractionConfig.retryAttempts,
      timeoutMs: agentConfig.extractionConfig.timeoutMs,
      });
      
      // 同步本地状态
      setEnableDualVector(vectorizationConfig.enableDualVector);
      setEnableKnowledgeGraph(agentConfig.enableKnowledgeGraph);
    }, 0);
  }, [vectorizationConfig, agentConfig, systemForm]);

  // 配置同步函数：将后端配置同步到全局状态
  const syncConfigToGlobalState = (config: SystemConfigResponse) => {
    console.log('🔄 开始同步配置到全局状态...');
    console.log('📊 完整配置对象:', config);
    
    if (!config.sections || config.sections.length === 0) {
      console.warn('⚠️ 后端配置中没有sections数据');
      return;
    }
    
    console.log('📝 配置段落列表:', config.sections.map(s => ({ name: s.name, title: s.title })));
    
    config.sections.forEach(section => {
      const settings = section.settings;
      console.log(`🔍 处理段落 [${section.name}]:`, settings);
      
      switch (section.name) {
        case 'llm':
          // LLM配置 - 同步到模型配置状态
          console.log('🔄 同步LLM配置...');
          const llmUpdates: Partial<ModelConfig> = {};
          
          // 提取One-API网关配置
          if (settings.providers?.one_api) {
            const oneApiConfig = settings.providers.one_api;
            const defaultModel = oneApiConfig.default_model || 'Qwen/Qwen3-30B-A3B-Thinking-2507';
            
            llmUpdates.llm = {
              ...modelConfig.llm,
              chatModel: defaultModel,
              chatEndpoint: oneApiConfig.base_url || 'https://api.siliconflow.cn/v1',
              chatApiKey: '', // API Key通常不显示
              temperature: 0.7,
              maxTokens: 32768,
              enableStreaming: true,
            };
            
            console.log('✅ 使用One-API配置:', defaultModel, oneApiConfig.base_url);
          }
          
          if (Object.keys(llmUpdates).length > 0) {
            setModelConfig(llmUpdates);
            console.log('✅ LLM配置已同步:', llmUpdates);
          }
          break;
          
        case 'embeddings':
          // 向量模型配置 - 同步到模型配置状态
          console.log('🔄 同步Embedding配置...');
          const embeddingUpdates: Partial<ModelConfig> = {};
          
          // 提取One-API网关的embedding配置
          if (settings.providers?.one_api) {
            const oneApiConfig = settings.providers.one_api;
            const defaultEmbeddingModel = 'Qwen/Qwen3-Embedding-4B';
            
            embeddingUpdates.embedding = {
              ...modelConfig.embedding,
              generalModel: defaultEmbeddingModel,
              generalEndpoint: oneApiConfig.base_url || 'https://api.siliconflow.cn/v1',
              generalApiKey: '', // API Key通常不显示
              generalDimension: 2048, // Qwen3-Embedding-4B的维度
            };
            
            console.log('✅ 使用One-API Embedding配置:', defaultEmbeddingModel);
          }
          
          if (Object.keys(embeddingUpdates).length > 0) {
            setModelConfig(embeddingUpdates);
            console.log('✅ Embedding配置已同步:', embeddingUpdates);
          }
          break;
          
        case 'database':
          // 数据库配置 - 同步到数据库配置状态
          console.log('🔄 同步数据库配置...');
          const databaseUpdates: Partial<DatabaseConfig> = {};
          
          // PostgreSQL配置：从 postgresql.host, postgresql.port, postgresql.database 提取
          if (settings.postgresql) {
            console.log('📊 PostgreSQL配置:', settings.postgresql);
            databaseUpdates.postgresql = {
              ...databaseConfig.postgresql,
              host: settings.postgresql.host,
              port: settings.postgresql.port,
              database: settings.postgresql.database,
              username: settings.postgresql.username,
              maxConnections: settings.postgresql.pool_size || 20,
              connectionTimeout: 30, // 默认值
            };
            console.log('✅ PostgreSQL配置已准备:', databaseUpdates.postgresql);
          } else {
            console.log('⚠️ 没有找到postgresql配置');
          }
          
          // Elasticsearch配置：从 elasticsearch.hosts 提取
          if (settings.elasticsearch) {
            console.log('📊 Elasticsearch配置:', settings.elasticsearch);
            let esHost = 'localhost:9200';
            // elasticsearch.hosts是数组，取第一个
            if (settings.elasticsearch.hosts && settings.elasticsearch.hosts.length > 0) {
              esHost = settings.elasticsearch.hosts[0];
              console.log('✅ ES Host设置为:', esHost);
            } else {
              console.log('⚠️ 没有找到elasticsearch.hosts');
            }
            
            databaseUpdates.elasticsearch = {
              ...databaseConfig.elasticsearch,
              host: esHost,
              username: settings.elasticsearch.username || '',
              index: settings.elasticsearch.index_prefix || 'mat_qa',
              authType: 'userpass', // 默认认证方式
            };
            console.log('✅ Elasticsearch配置已准备:', databaseUpdates.elasticsearch);
          } else {
            console.log('⚠️ 没有找到elasticsearch配置');
          }
          
          // ArangoDB配置：从 arangodb.url 提取
          if (settings.arangodb) {
            console.log('📊 ArangoDB配置:', settings.arangodb);
            // ArangoDB已移除
            console.log('✅ ArangoDB配置已准备:', databaseUpdates.arangodb);
          } else {
            console.log('⚠️ 没有找到arangodb配置');
          }
          
          // 应用数据库配置更新
          if (Object.keys(databaseUpdates).length > 0) {
            setDatabaseConfig(databaseUpdates);
            console.log('✅ 数据库配置已同步:', databaseUpdates);
          }
          break;
          
        case 'vectorization':
          // 向量化配置 - 同步到向量化配置状态
          console.log('🔄 同步向量化配置...');
          const vectorizationUpdates: Partial<VectorizationConfig> = {};
          
          // 双向量开关
          vectorizationUpdates.enableDualVector = settings.enable_dual_vector ?? true;
          
          // 向量检索配置
          if (settings.vector_search) {
            vectorizationUpdates.vectorSearch = {
              ...vectorizationConfig.vectorSearch,
              topK: settings.vector_search.default_top_k || 10,
              threshold: settings.vector_search.default_threshold || 0.7,
            };
          }
          
          // 关键词检索配置
          if (settings.keyword_search) {
            vectorizationUpdates.keywordSearch = {
              ...vectorizationConfig.keywordSearch,
              limit: settings.keyword_search.default_limit || 20,
              fuzzyMatch: settings.keyword_search.fuzzy_matching ?? true,
            };
          }
          
          // 混合检索配置
          if (settings.hybrid_search) {
            vectorizationUpdates.hybridSearch = {
              ...vectorizationConfig.hybridSearch,
              vectorWeight: settings.hybrid_search.vector_weight || 0.7,
              keywordWeight: settings.hybrid_search.keyword_weight || 0.3,
              enableRerank: settings.hybrid_search.rerank_enabled ?? true,
            };
          }
          
          // 默认嵌入模型配置
          if (settings.default_embedding) {
            // 可以根据默认模型设置检索模式
            // 默认使用dual向量检索模式
            vectorizationUpdates.retrievalMode = 'dual';
          }
          
          // 应用向量化配置更新
          if (Object.keys(vectorizationUpdates).length > 0) {
            setVectorizationConfig(vectorizationUpdates);
            console.log('✅ 向量化配置已同步:', vectorizationUpdates);
          }
          break;
          
        case 'storage':
          // 存储配置已经在updateConfigStates函数中处理，这里跳过
          console.log('⏭️ 存储配置在updateConfigStates中处理');
          break;
          
        case 'agents':
          // 智能体配置 - 同步到智能体配置状态
          console.log('🔄 同步智能体配置...');
          const agentUpdates: Partial<AgentConfig> = {};
          
          // 从智能体配置推断知识图谱是否启用
          agentUpdates.enableKnowledgeGraph = !!(settings.qa_agent || settings.doc_analyzer);
          
          // 从主要的QA智能体获取配置信息
          if (settings.qa_agent) {
            agentUpdates.extractionMode = 'auto'; // 基于智能体的自动提取
            
            // 提取配置参数
            agentUpdates.extractionConfig = {
              ...agentConfig.extractionConfig,
              minConfidence: 0.7,
              batchSize: 10,
              maxConcurrency: 3,
              retryAttempts: 2,
              timeoutMs: 30000,
            };
          }
          
          // 应用智能体配置更新
          if (Object.keys(agentUpdates).length > 0) {
            setAgentConfig(agentUpdates);
          }
          break;
      }
    });
    
    console.log('✅ 所有配置同步完成');
  };

  // 更新配置相关状态
  const updateConfigStates = (config: SystemConfigResponse) => {
    // 更新双向量开关状态
    const vectorSection = config.sections.find(s => s.name === 'vectorization');
    if (vectorSection) {
      setEnableDualVector(vectorSection.settings.enable_dual_vector ?? true);
    }
    
    // 更新知识图谱开关状态  
    const agentsSection = config.sections.find(s => s.name === 'agents');
    if (agentsSection) {
      // 从智能体配置推断知识图谱状态
      const hasAgents = !!(agentsSection.settings.qa_agent || agentsSection.settings.doc_analyzer);
      setEnableKnowledgeGraph(hasAgents);
    }
    
    // 更新ES认证方式
    const dbSection = config.sections.find(s => s.name === 'database');
    if (dbSection) {
      setEsAuthType('userpass'); // 默认认证方式
    }
    
    // 更新存储配置状态
    const storageSection = config.sections.find(s => s.name === 'storage');
    if (storageSection && storageSection.settings.minio) {
      const minioSettings = storageSection.settings.minio;
      setStorageConfig({
        type: 'minio',
        minio: {
          ...storageConfig.minio,
          enabled: minioSettings.enabled ?? false,
          endpoint: minioSettings.endpoint || 'localhost:9000',
          accessKey: minioSettings.access_key || 'admin',
          publicEndpoint: `http://${minioSettings.endpoint || 'localhost:9000'}`,
          documentsBucket: minioSettings.documents_bucket || 'mat-qa-documents',
          mediaBucket: minioSettings.media_bucket || 'mat-qa-media',
          thumbnailsBucket: minioSettings.thumbnails_bucket || 'mat-qa-thumbnails',
          autoCreateBuckets: minioSettings.auto_create_buckets ?? true
        }
      });
      console.log('✅ 存储配置状态已更新:', {
        accessKey: minioSettings.access_key,
        endpoint: minioSettings.endpoint
      });
    }
  };

  // 加载默认配置作为后备
  const loadDefaultConfig = () => {
    console.log('📋 加载默认配置...');
    
    // 使用appStore中的默认值
    console.log('✅ 使用全局状态中的默认配置');
  };



  // 优化的配置同步函数
  const optimizedSyncConfig = useCallback((config: SystemConfigResponse) => {
    syncConfigToGlobalState(config);
    updateConfigStates(config);
  }, []);

  // 优化的字段变化处理
  const handleFieldChangeOptimized = useCallback((changedFields: any[], allFields: any[]) => {
    setHasUnsavedChanges(true);
  }, []);

  // 优化的保存配置
  const handleSaveConfigOptimized = useCallback(async () => {
    if (saving) return;
    
    setSaving(true);
    try {
      const formValues = form.getFieldsValue();
      const databaseValues = databaseForm.getFieldsValue();
      const systemValues = systemForm.getFieldsValue();
      
      await saveConfigSections({
        ...formValues,
        ...databaseValues,
        ...systemValues
      });
      
      setHasUnsavedChanges(false);
      message.success('配置保存成功');
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  }, [saving, form, databaseForm, systemForm]);

  // 性能优化：当Modal打开时延迟加载内容
  useEffect(() => {
    if (visible && !contentLoaded) {
      // 使用setTimeout避免阻塞Modal打开动画
      const timer = setTimeout(() => {
        setContentLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, contentLoaded]);

  // 从后端加载当前配置
  useEffect(() => {
    const loadSystemConfig = async () => {
      if (!visible) {
        console.log('⏭️ 配置面板未显示，跳过加载');
        return;
      }
      
      try {
        setLoading(true);
        console.log('🚀 配置面板已打开，开始加载配置...');
        
        // 使用后端API获取配置
        const config = await systemConfigService.getSystemConfig();
        console.log('✅ API请求完成，返回结果:', config);
        console.log('📊 返回数据类型:', typeof config);
        console.log('📝 是否有sections:', !!config.sections);
        console.log('📝 sections数组长度:', config.sections?.length);
        
        if (config.sections) {
          config.sections.forEach((section, index) => {
            console.log(`📁 段落 ${index + 1} [${section.name}]:`, section.settings);
          });
        }
        
        // 保存原始配置数据
        setSystemConfig(config);
        setServiceStatus(config.service_status || []);
        
        // 将后端配置同步到全局状态
        console.log('🔄 步骤2: 开始同步配置到全局状态...');
        syncConfigToGlobalState(config);
        
        console.log('✅ 配置同步到全局状态完成');
        
        // 更新相关状态
        console.log('🔄 步骤4: 更新相关状态...');
        updateConfigStates(config);
        console.log('✅ 状态更新完成');
        
        console.log('🎉 配置加载流程完成!');
        
      } catch (error) {
        console.error('❌ 获取后端配置失败:', error);
        console.error('错误类型:', error?.constructor?.name);
        console.error('错误消息:', error?.message);
        console.error('错误详情:', error);
        
        message.error(`获取配置失败: ${error?.message || '网络错误'}`);
        
        // 错误时使用你提供的真实数据进行测试
        console.log('🧪 使用真实后端数据进行测试...');
        // testWithRealData(); // 已移除，使用全局状态管理
        
        // 最后降级到默认配置
        console.log('📋 加载默认配置作为后备...');
        loadDefaultConfig();
      } finally {
        setLoading(false);
      }
    };

    loadSystemConfig();
  }, [visible]);

  // 不再自动验证，只在用户手动触发时验证

  // 手动配置验证 - 简化版本
  const validateCurrentConfig = async () => {
    try {
      setValidating(true);
      console.log('🔍 手动验证配置:', { modelConfig, databaseConfig });
      
      // 基本字段验证
      const results: ValidationResult[] = [];
      
      // 检查必填字段
      if (!modelConfig.llm.chatModel) {
        results.push({ field: 'chatModel', message: '请选择对话模型', severity: 'error' as const });
      }
      
      if (!modelConfig.embedding.generalModel) {
        results.push({ field: 'generalModel', message: '请选择通用向量模型', severity: 'error' as const });
      }
      
      if (!modelConfig.embedding.domainModel) {
        results.push({ field: 'domainModel', message: '请选择领域向量模型', severity: 'error' as const });
      }
      
      setValidationResults(results);
      
      // 简单的评分逻辑
      const errorCount = results.filter(r => r.severity === 'error').length;
      const score = Math.max(0, 100 - (errorCount * 20));
      setConfigScore(score);
      
      console.log('✅ 验证完成:', { errors: errorCount, score });
      
    } catch (error) {
      console.error('配置验证失败:', error);
    } finally {
      setValidating(false);
    }
  };

  // 监听表单字段变化，实时更新appStore
  const handleFieldChange = (changedFields: any[], allFields: any[]) => {
    setHasUnsavedChanges(true);
    
    // 获取表单的所有值
    const formValues = form.getFieldsValue();
    
    // 更新modelConfig
    const modelUpdates: Partial<ModelConfig> = {};
    
    // LLM配置更新
    if (formValues.chatModel !== undefined || 
        formValues.temperature !== undefined || 
        formValues.maxTokens !== undefined ||
        formValues.chatEndpoint !== undefined ||
        formValues.chatApiKey !== undefined ||
        formValues.enableStreaming !== undefined) {
      modelUpdates.llm = {
        ...modelConfig.llm,
        chatModel: formValues.chatModel || modelConfig.llm.chatModel,
        temperature: formValues.temperature !== undefined ? formValues.temperature : modelConfig.llm.temperature,
        maxTokens: formValues.maxTokens !== undefined ? formValues.maxTokens : modelConfig.llm.maxTokens,
        chatEndpoint: formValues.chatEndpoint || modelConfig.llm.chatEndpoint,
        chatApiKey: formValues.chatApiKey || modelConfig.llm.chatApiKey,
        enableStreaming: formValues.enableStreaming !== undefined ? formValues.enableStreaming : modelConfig.llm.enableStreaming
      };
    }
    
    // Embedding配置更新  
    if (formValues.generalModel !== undefined ||
        formValues.generalEndpoint !== undefined ||
        formValues.generalApiKey !== undefined ||
        formValues.domainModel !== undefined ||
        formValues.domainEndpoint !== undefined ||
        formValues.domainApiKey !== undefined) {
      modelUpdates.embedding = {
        ...modelConfig.embedding,
        generalModel: formValues.generalModel || modelConfig.embedding.generalModel,
        generalEndpoint: formValues.generalEndpoint || modelConfig.embedding.generalEndpoint,
        generalApiKey: formValues.generalApiKey || modelConfig.embedding.generalApiKey,
        domainModel: formValues.domainModel || modelConfig.embedding.domainModel,
        domainEndpoint: formValues.domainEndpoint || modelConfig.embedding.domainEndpoint,
        domainApiKey: formValues.domainApiKey || modelConfig.embedding.domainApiKey
      };
    }
    
    // 如果有更新，应用到全局状态
    if (Object.keys(modelUpdates).length > 0) {
      setModelConfig(modelUpdates);
      console.log('🔄 模型配置已更新:', modelUpdates);
    }
  };

  // 保存配置到后端
  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      // 从全局状态获取当前配置值
      const values = {
        database: databaseConfig,
        model: modelConfig,
        vectorization: vectorizationConfig,
        agent: agentConfig,
        storage: storageConfig
      };
      
      console.log('💾 准备保存配置:', values);
      
      // 将表单值转换为后端API格式并保存到对应的配置段落
      await saveConfigSections(values);
      
      message.success('配置保存成功');
      setHasUnsavedChanges(false);
      
      // 重新加载最新配置
      setTimeout(() => {
        window.location.reload(); // 简单粗暴的刷新，确保显示最新配置
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ 保存配置失败:', error);
      message.error(`保存配置失败: ${error?.message || '未知错误'}`);
    } finally {
      setSaving(false);
    }
  };

  // 保存配置段落
  const saveConfigSections = async (values: any) => {
    // TODO: 实现配置保存逻辑
    console.log('🔄 准备保存配置段落:', values);
    console.log('💾 当前配置值:', {
      database: databaseConfig,
      model: modelConfig,
      vectorization: vectorizationConfig,
      agent: agentConfig,
      storage: storageConfig
    });
    
    // 模拟配置保存
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ 配置保存完成（模拟）');
  };


  // 重置设置
  const handleReset = () => {
    // 重置到默认值
    setDatabaseConfig({
      postgresql: {
        host: '8.153.90.125',
        port: 5432,
        database: 'mat_demo',
        username: 'mat_demo',
        password: 'NfWNH0mypEtjKETrsVqQg==',
        maxConnections: 20,
        connectionTimeout: 30
      },
      elasticsearch: {
        host: 'https://8.153.90.125:9200',
        index: 'mat_qa',
        authType: 'userpass',
        username: 'elastic',
        password: 'MQxFuWBuooxLY2c2a8YE',
        token: 'LS1nMGdwY0JqZ21fdkZpWXhIQnM6MzZ4Q3lWRUdSTmZOUEViV1BhSmF4QQ=='
      },
      arangodb: {
        host: 'http://8.153.90.125:8529',
        database: 'mat_qa_graph',
        username: 'root',
        password: '2O5zBrPQrNfVkhn1gXY'
      }
    });
    setModelConfig({
      llm: {
        chatModel: 'Qwen/Qwen3-30B-A3B-Thinking-2507',
        temperature: 0.7,
        maxTokens: 32768,
        chatEndpoint: 'https://api.siliconflow.cn/v1',
        chatApiKey: '',
        enableStreaming: true
      },
      embedding: {
        generalModel: 'Qwen/Qwen3-Embedding-4B',
        generalEndpoint: 'https://api.siliconflow.cn/v1',
        generalApiKey: '',
        generalDimension: 2048
      }
    });
    
    // 重置向量化配置
    setVectorizationConfig({
      enableDualVector: true,
      retrievalMode: 'dual',
      vectorSearch: {
        topK: 10,
        threshold: 0.7
      },
      keywordSearch: {
        limit: 20,
        fuzzyMatch: true
      },
      hybridSearch: {
        vectorWeight: 0.7,
        keywordWeight: 0.3,
        enableRerank: true
      },
      rerank: {
        topK: 10,
        threshold: 0.5
      }
    });
    
    // 重置智能体配置
    setAgentConfig({
      enableKnowledgeGraph: false,
      extractionMode: 'auto',
      extractionConfig: {
        minConfidence: 0.7,
        batchSize: 10,
        maxConcurrency: 3,
        retryAttempts: 2,
        timeoutMs: 30000
      }
    });
    
    message.info('设置已重置');
  };

  // 更新存储配置
  const handleStorageConfigChange = (field: string, value: unknown) => {
    if (field.startsWith('minio.')) {
      const minioField = field.replace('minio.', '');
      setStorageConfig({
        minio: {
          ...storageConfig.minio,
          [minioField]: value
        }
      });
    } else {
      setStorageConfig({
        [field]: value
      });
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center" style={{ padding: '4px 0' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2" style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            border: 'none'
          }}>
            <SettingOutlined style={{ fontSize: '12px', color: '#ffffff' }} />
          </div>
          <div>
            <div style={{ color: '#1f2937', fontSize: '15px', fontWeight: '600' }}>系统设置</div>
            <div style={{ color: '#6b7280', fontSize: '11px' }}>管理全局配置参数</div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1100}
      centered
      destroyOnClose
      maskClosable={false}
      className="clean-modal"
      style={{ 
        maxHeight: '90vh',
        height: 'auto'
      }}
      styles={{
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        },
        body: {
          maxHeight: 'calc(90vh - 120px)',
          overflowY: 'auto',
          padding: 0
        }
      }}
      footer={[
        // 配置验证状态显示
        <div key="validation-status" className="flex-1 flex items-center">
          {validating && (
            <div className="flex items-center text-blue-600">
              <span className="loading loading-spinner loading-sm mr-2"></span>
              <Text type="secondary" className="text-sm">验证配置中...</Text>
            </div>
          )}
          {!validating && validationResults.length > 0 && (
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <Text className="text-sm mr-2">配置质量:</Text>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  configScore >= 90 ? 'bg-green-100 text-green-700' :
                  configScore >= 70 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {configScore}分
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {validationResults.filter(r => r.severity === 'error').length > 0 && (
                  <Tag color="red" className="text-xs">
                    {validationResults.filter(r => r.severity === 'error').length} 错误
                  </Tag>
                )}
                {validationResults.filter(r => r.severity === 'warning').length > 0 && (
                  <Tag color="orange" className="text-xs">
                    {validationResults.filter(r => r.severity === 'warning').length} 警告
                  </Tag>
                )}
              </div>
            </div>
          )}
          {hasUnsavedChanges && (
            <Tag color="blue" className="ml-2 text-xs">未保存更改</Tag>
          )}
        </div>,
        
        <Button key="reset" onClick={handleReset} icon={<ReloadOutlined />}>
          重置
        </Button>,
        <Button 
          key="refresh-models" 
          onClick={async () => {
            setLoading(true);
            try {
              await refreshModelsFromAPI();
              message.success('模型配置已刷新');
            } catch (error) {
              console.error('刷新模型配置失败:', error);
              message.error('刷新模型配置失败');
            } finally {
              setLoading(false);
            }
          }} 
          icon={<ReloadOutlined />}
          type="default"
          loading={loading}
        >
          刷新模型
        </Button>,
        <Button 
          key="validate" 
          loading={validating}
          onClick={() => validateCurrentConfig()}
          icon={<CheckCircleOutlined />}
          type="default"
        >
          验证配置
        </Button>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          loading={saving} 
          onClick={handleSaveConfig}
          disabled={validationResults.filter(r => r.severity === 'error').length > 0}
          icon={<SaveOutlined />}
        >
          {hasUnsavedChanges ? '保存更改' : '保存设置'}
        </Button>
      ]}
    >
      {/* 配置验证结果面板 */}
      {validationResults.length > 0 && (
        <div className="mb-4">
          <Card 
            size="small" 
            title={
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <CheckCircleOutlined className="mr-2" />
                  配置验证结果
                </span>
                <div className="flex items-center space-x-2">
                  <Tag color={configScore >= 90 ? 'green' : configScore >= 70 ? 'orange' : 'red'}>
                    质量分数: {configScore}
                  </Tag>
                  {hasUnsavedChanges && <Tag color="blue">未保存更改</Tag>}
                </div>
              </div>
            }
            className={`border ${
              validationResults.filter(r => r.severity === 'error').length > 0 
                ? 'border-red-200 bg-red-50' 
                : validationResults.filter(r => r.severity === 'warning').length > 0
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-green-200 bg-green-50'
            }`}
          >
            {validationResults.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {validationResults.map((result, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      result.severity === 'error' ? 'bg-red-500' :
                      result.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <Text className={`${
                        result.severity === 'error' ? 'text-red-700' :
                        result.severity === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                      }`}>
                        <strong>{result.field}:</strong> {result.message}
                      </Text>
                      {result.suggestion && (
                        <div className="text-xs text-gray-500 mt-1">
                          💡 {result.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2">
                <CheckCircleOutlined className="text-green-500 mr-2" />
                <Text type="secondary">配置验证通过，无问题发现</Text>
              </div>
            )}
          </Card>
        </div>
      )}
      
      {/* 性能优化：显示加载骨架屏或延迟加载内容 */}
      {!contentLoaded ? (
        <div className="space-y-4">
          {/* 加载骨架屏 */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 模型配置标签 */}
        <TabPane 
          tab={
            <span>
              <ThunderboltOutlined />
              模型配置
            </span>
          } 
          key="models"
        >
          <Form 
            form={form} 
            layout="vertical" 
            onFieldsChange={handleFieldChange}
            initialValues={{
              chatModel: modelConfig.llm.chatModel,
              temperature: modelConfig.llm.temperature,
              maxTokens: modelConfig.llm.maxTokens,
              chatEndpoint: modelConfig.llm.chatEndpoint,
              chatApiKey: modelConfig.llm.chatApiKey,
              enableStreaming: modelConfig.llm.enableStreaming,
              generalModel: modelConfig.embedding.generalModel,
              generalEndpoint: modelConfig.embedding.generalEndpoint,
              generalApiKey: modelConfig.embedding.generalApiKey,
              domainModel: modelConfig.embedding.domainModel,
              domainEndpoint: modelConfig.embedding.domainEndpoint,
              domainApiKey: modelConfig.embedding.domainApiKey,
              enableReranking: true
            }}
          >
            <Card 
              title={
                <div className="flex items-center">
                  <ThunderboltOutlined className="mr-2" />
                  <div>
                    <div>模型配置</div>
                    <Text type="secondary" className="text-xs font-normal">
                      配置对话和重排序模型
                    </Text>
                  </div>
                </div>
              }
            >
              <Tabs 
                type="card" 
                size="small"
                items={[
                  {
                    key: 'chat-model',
                    label: (
                      <span>
                        <ApiOutlined className="mr-1" />
                        对话模型
                      </span>
                    ),
                    children: (
                      <div className="p-2">
              <Form.Item
                name="chatModel"
                label="选择对话模型"
                rules={[{ required: true, message: '请选择对话模型' }]}
              >
                <Select placeholder="选择对话模型" className="w-full">
                  {chatModels.map(model => (
                    <Option key={model.id} value={model.id}>
                      {model.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="temperature"
                  label={
                    <span>
                      温度参数
                      <Tooltip title="控制生成文本的随机性，值越高越随机">
                        <InfoCircleOutlined className="ml-1 text-gray-400" />
                      </Tooltip>
                    </span>
                  }
                >
                  <InputNumber 
                    min={0} 
                    max={2} 
                    step={0.1}
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="maxTokens"
                  label="最大Token数"
                >
                  <InputNumber 
                    min={256} 
                    max={8192} 
                    step={256}
                    className="w-full"
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="chatEndpoint"
                label={
                  <span>
                    API端点
                    <Tooltip title="对话模型的API服务端点地址">
                      <InfoCircleOutlined className="ml-1 text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Input placeholder="输入API端点URL" />
              </Form.Item>

              <Form.Item
                name="chatApiKey"
                label={
                  <span>
                    API密钥
                    <Tooltip title="用于调用对话模型的API密钥">
                      <InfoCircleOutlined className="ml-1 text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Input.Password placeholder="输入API密钥" />
              </Form.Item>

                        <Form.Item
                          name="enableStreaming"
                          label="启用流式输出"
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                        </Form.Item>
                      </div>
                    )
                  },
                  {
                    key: 'general-embedding',
                    label: (
                      <span>
                        <Tag color="blue" className="mr-1">通用</Tag>
                        Qwen Embedding
                      </span>
                    ),
                    children: (
                      <div className="p-2">
                        <div className="grid grid-cols-2 gap-4">
                          <Form.Item
                            name="generalModel"
                            label="模型名称"
                          >
                            <Select placeholder="选择通用向量模型">
                              {embeddingModels.filter(model => model.provider !== 'custom').map(model => (
                                <Option key={model.id} value={model.id}>
                                  {model.name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>

                          <Form.Item
                            name="generalDimension"
                            label="向量维度"
                            initialValue={1024}
                          >
                            <InputNumber className="w-full" disabled />
                          </Form.Item>

                          <Form.Item
                            name="generalBatchSize"
                            label="批处理大小"
                            initialValue={32}
                            extra="向量化时的批处理大小"
                          >
                            <InputNumber min={1} max={128} className="w-full" />
                          </Form.Item>

                          <Form.Item
                            name="generalTimeout"
                            label="处理超时(秒)"
                            initialValue={300}
                          >
                            <InputNumber min={60} max={1800} className="w-full" />
                          </Form.Item>
                        </div>

                        <Form.Item
                          name="generalEndpoint"
                          label="API端点"
                          extra="Qwen Embedding模型的API服务端点地址"
                        >
                          <Input placeholder="输入Qwen Embedding API端点" />
                        </Form.Item>

                        <Form.Item
                          name="generalApiKey"
                          label="API密钥"
                          extra="用于调用Qwen Embedding API的密钥"
                        >
                          <Input.Password placeholder="输入Qwen API密钥" />
                        </Form.Item>
                      </div>
                    )
                  },
                  {
                    key: 'rerank-model',
                    label: (
                      <span>
                        <ExperimentOutlined className="mr-1" />
                        重排模型
                      </span>
                    ),
                    children: (
                      <div className="p-2">
                        {/* 重排序开关 */}
                        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center">
                            <ExperimentOutlined className="text-gray-600 mr-2" />
                            <div>
                              <div className="font-medium">启用重排序</div>
                              <Text type="secondary" className="text-xs">
                                开启后对检索结果进行重新排序，提高检索精度
                              </Text>
                            </div>
                          </div>
                          <Form.Item
                            name="enableReranking"
                            valuePropName="checked"
                            className="mb-0"
                          >
                            <Switch 
                              checkedChildren="已启用" 
                              unCheckedChildren="已禁用"
                            />
                          </Form.Item>
                        </div>

                        {/* 重排模型配置 - 根据开关状态动态显示 */}
                        <Form.Item 
                          noStyle 
                          shouldUpdate={(prevValues, currentValues) => 
                            prevValues.enableReranking !== currentValues.enableReranking
                          }
                        >
                          {({ getFieldValue }) => {
                            const enableReranking = getFieldValue('enableReranking');
                            
                            if (!enableReranking) {
                              return (
                                <div className="p-4 bg-gray-50 rounded-lg border text-center">
                                  <Text type="secondary">重排序功能已禁用，请先启用重排序开关</Text>
                                </div>
                              );
                            }
                            
                            return (
                              <>
                                <div className="grid grid-cols-2 gap-4">
                          <Form.Item
                            name="rerankModel"
                            label="重排模型"
                            initialValue="bge-reranker-v2-m3"
                          >
                            <Select placeholder="选择重排模型" className="w-full">
                              <Option value="bge-reranker-v2-m3">bge-reranker-v2-m3</Option>
                              <Option value="bge-reranker-large">bge-reranker-large</Option>
                              <Option value="cohere-rerank-v3">cohere-rerank-v3</Option>
                            </Select>
                          </Form.Item>

                          <Form.Item
                            name="rerankTopK"
                            label="重排数量"
                            initialValue={10}
                            extra="参与重排的文档数量"
                          >
                            <InputNumber min={1} max={50} className="w-full" />
                          </Form.Item>

                          <Form.Item
                            name="rerankThreshold"
                            label="重排阈值"
                            initialValue={0.5}
                            extra="重排分数的最低阈值"
                          >
                            <InputNumber 
                              min={0} 
                              max={1} 
                              step={0.1}
                              className="w-full"
                            />
                          </Form.Item>

                          <Form.Item
                            name="rerankTimeout"
                            label="重排超时(秒)"
                            initialValue={30}
                          >
                            <InputNumber min={5} max={300} className="w-full" />
                          </Form.Item>
                        </div>

                        <Form.Item
                          name="rerankEndpoint"
                          label="API端点"
                          extra="重排模型的API服务端点地址"
                          initialValue="https://api.cohere.ai/v1/rerank"
                        >
                          <Input placeholder="输入重排API端点" />
                        </Form.Item>

                        <Form.Item
                          name="rerankApiKey"
                          label="API密钥"
                          extra="用于调用重排模型的API密钥"
                        >
                          <Input.Password placeholder="输入重排API密钥" />
                        </Form.Item>

                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg" style={{ color: '#000000 !important' }}>
                                  <div className="flex items-start">
                                    <InfoCircleOutlined className="text-yellow-600 mr-2 mt-0.5" />
                                    <div className="text-sm" style={{ color: '#000000 !important' }}>
                                      <Text strong style={{ color: '#000000 !important' }}>说明：</Text>
                                      <span style={{ color: '#000000 !important' }}>
                                        重排序模型用于对初步检索结果进行重新排序，可以显著提高检索精度。启用重排序后，系统将先使用向量检索获取候选文档，然后使用重排模型进行精排。
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          }}
                        </Form.Item>
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          </Form>
        </TabPane>

        {/* 数据库配置标签 */}
        <TabPane 
          tab={
            <span>
              <ClusterOutlined />
              数据库配置
            </span>
          } 
          key="database"
        >
          <Form 
            layout="vertical" 
            form={databaseForm}
            onFieldsChange={(changedFields, allFields) => {
              setHasUnsavedChanges(true);
              
              // 获取表单的所有值
              const formValues = databaseForm.getFieldsValue();
              
              // 更新databaseConfig
              const databaseUpdates: Partial<DatabaseConfig> = {};
              
              // PostgreSQL配置更新
              if (formValues.pgHost !== undefined || 
                  formValues.pgPort !== undefined || 
                  formValues.pgDatabase !== undefined ||
                  formValues.pgUsername !== undefined ||
                  formValues.pgPassword !== undefined ||
                  formValues.pgMaxConnections !== undefined ||
                  formValues.pgConnectionTimeout !== undefined) {
                databaseUpdates.postgresql = {
                  ...databaseConfig.postgresql,
                  host: formValues.pgHost || databaseConfig.postgresql.host,
                  port: formValues.pgPort !== undefined ? formValues.pgPort : databaseConfig.postgresql.port,
                  database: formValues.pgDatabase || databaseConfig.postgresql.database,
                  username: formValues.pgUsername || databaseConfig.postgresql.username,
                  password: formValues.pgPassword || databaseConfig.postgresql.password,
                  maxConnections: formValues.pgMaxConnections !== undefined ? formValues.pgMaxConnections : databaseConfig.postgresql.maxConnections,
                  connectionTimeout: formValues.pgConnectionTimeout !== undefined ? formValues.pgConnectionTimeout : databaseConfig.postgresql.connectionTimeout
                };
              }
              
              // ElasticSearch配置更新
              if (formValues.esHost !== undefined ||
                  formValues.esIndex !== undefined ||
                  formValues.esAuthType !== undefined ||
                  formValues.esUsername !== undefined ||
                  formValues.esPassword !== undefined ||
                  formValues.esToken !== undefined) {
                databaseUpdates.elasticsearch = {
                  ...databaseConfig.elasticsearch,
                  host: formValues.esHost || databaseConfig.elasticsearch.host,
                  index: formValues.esIndex || databaseConfig.elasticsearch.index,
                  authType: formValues.esAuthType || databaseConfig.elasticsearch.authType,
                  username: formValues.esUsername || databaseConfig.elasticsearch.username,
                  password: formValues.esPassword || databaseConfig.elasticsearch.password,
                  token: formValues.esToken || databaseConfig.elasticsearch.token
                };
                
                // 同步认证方式到本地状态
                if (formValues.esAuthType) {
                  setEsAuthType(formValues.esAuthType);
                }
              }
              
              // ArangoDB配置更新
              if (formValues.arangoHost !== undefined ||
                  formValues.arangoDatabase !== undefined ||
                  formValues.arangoUsername !== undefined ||
                  formValues.arangoPassword !== undefined) {
                // ArangoDB配置已移除
              }
              
              // 如果有更新，应用到全局状态
              if (Object.keys(databaseUpdates).length > 0) {
                setDatabaseConfig(databaseUpdates);
                console.log('🔄 数据库配置已更新:', databaseUpdates);
              }
            }}
          >
            <Card 
              title={
                <div className="flex items-center">
                  <ClusterOutlined className="mr-2" />
                  <div>
                    <div>数据库连接配置</div>
                    <Text type="secondary" className="text-xs font-normal">
                      配置ElasticSearch、PostgreSQL和ArangoDB连接参数
                    </Text>
                  </div>
                </div>
              }
            >
              <Tabs 
                type="card" 
                size="small"
                items={[
                  {
                    key: 'elasticsearch',
                    label: (
                      <span>
                        <DatabaseOutlined className="mr-1" />
                        ElasticSearch
                      </span>
                    ),
                    children: (
                      <div className="p-2">
                        <div className="grid grid-cols-2 gap-4">
                          <Form.Item
                            name="esHost"
                            label="主机地址"
                          >
                            <Input placeholder="例如: localhost:9200" />
                          </Form.Item>

                          <Form.Item
                            name="esIndex"
                            label="索引名称"
                          >
                            <Input placeholder="索引名称" />
                          </Form.Item>
                        </div>

                        {/* 认证方式选择 */}
                        <Form.Item
                          name="esAuthType"
                          label="认证方式"
                          extra="选择ElasticSearch的认证方式"
                        >
                          <Select 
                            value={esAuthType}
                            onChange={setEsAuthType}
                            className="w-full"
                          >
                            <Option value="userpass">用户名密码</Option>
                            <Option value="token">API Token</Option>
                          </Select>
                        </Form.Item>

                        {/* 动态认证配置 */}
                        {esAuthType === 'userpass' ? (
                          <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                              name="esUsername"
                              label="用户名"
                              rules={[{ required: true, message: '请输入用户名' }]}
                            >
                              <Input 
                                placeholder="ElasticSearch用户名" 
                                size="middle"
                                style={{ height: '32px' }}
                              />
                            </Form.Item>

                            <Form.Item
                              name="esPassword"
                              label="密码"
                              rules={[{ required: true, message: '请输入密码' }]}
                            >
                              <Input.Password 
                                placeholder="ElasticSearch密码" 
                                size="middle"
                                style={{ height: '32px' }}
                              />
                            </Form.Item>
                          </div>
                        ) : (
                          <Form.Item
                            name="esToken"
                            label="API Token"
                            rules={[{ required: true, message: '请输入API Token' }]}
                            extra="ElasticSearch API Token，通常以'ApiKey '开头"
                          >
                            <Input.Password 
                              placeholder="输入ElasticSearch API Token" 
                              className="w-full"
                            />
                          </Form.Item>
                        )}

                        {/* 连接测试按钮 */}
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <Text strong className="text-sm">连接测试</Text>
                              <div className="text-xs text-gray-500 mt-1">
                                测试ElasticSearch连接和认证是否正常
                              </div>
                            </div>
                            <Button 
                              type="default" 
                              size="small"
                              // onClick={testEsConnection}
                            >
                              测试连接
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'postgresql',
                    label: (
                      <span>
                        <DatabaseOutlined className="mr-1" />
                        PostgreSQL
                      </span>
                    ),
                    children: (
                      <div className="p-2">
                        <div className="grid grid-cols-3 gap-4">
                          <Form.Item
                            name="pgHost"
                            label="主机地址"
                          >
                            <Input placeholder="例如: localhost" />
                          </Form.Item>

                          <Form.Item
                            name="pgPort"
                            label="端口"
                          >
                            <InputNumber placeholder="5432" min={1} max={65535} className="w-full" />
                          </Form.Item>

                          <Form.Item
                            name="pgDatabase"
                            label="数据库名称"
                          >
                            <Input placeholder="数据库名称" />
                          </Form.Item>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Form.Item
                            name="pgUsername"
                            label="用户名"
                          >
                            <Input 
                              placeholder="PostgreSQL用户名" 
                              size="middle"
                              style={{ height: '32px' }}
                            />
                          </Form.Item>

                          <Form.Item
                            name="pgPassword"
                            label="密码"
                          >
                            <Input.Password 
                              placeholder="PostgreSQL密码" 
                              size="middle"
                              style={{ height: '32px' }}
                            />
                          </Form.Item>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Form.Item
                            name="pgMaxConnections"
                            label="最大连接数"
                          >
                            <InputNumber min={1} max={100} className="w-full" />
                          </Form.Item>

                          <Form.Item
                            name="pgConnectionTimeout"
                            label="连接超时(秒)"
                          >
                            <InputNumber min={5} max={300} className="w-full" />
                          </Form.Item>
                        </div>

                        {/* 连接测试按钮 */}
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <Text strong className="text-sm">连接测试</Text>
                              <div className="text-xs text-gray-500 mt-1">
                                测试PostgreSQL数据库连接是否正常
                              </div>
                            </div>
                            <Button 
                              type="default" 
                              size="small"
                              // onClick={testPgConnection}
                            >
                              测试连接
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'arangodb',
                    label: (
                      <span>
                        <DatabaseOutlined className="mr-1" />
                        ArangoDB
                      </span>
                    ),
                    children: (
                      <div className="p-2">
                        <div className="grid grid-cols-2 gap-4">
                          <Form.Item
                            name="arangoHost"
                            label="主机地址"
                          >
                            <Input placeholder="例如: localhost:8529" />
                          </Form.Item>

                          <Form.Item
                            name="arangoDatabase"
                            label="数据库名称"
                          >
                            <Input placeholder="数据库名称" />
                          </Form.Item>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Form.Item
                            name="arangoUsername"
                            label="用户名"
                            initialValue="root"
                          >
                            <Input 
                              placeholder="ArangoDB用户名" 
                              size="middle"
                              style={{ height: '32px' }}
                            />
                          </Form.Item>

                          <Form.Item
                            name="arangoPassword"
                            label="密码"
                          >
                            <Input.Password 
                              placeholder="ArangoDB密码" 
                              size="middle"
                              style={{ height: '32px' }}
                            />
                          </Form.Item>
                        </div>

                        {/* 连接测试按钮 */}
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <Text strong className="text-sm">连接测试</Text>
                              <div className="text-xs text-gray-500 mt-1">
                                测试ArangoDB图数据库连接是否正常
                              </div>
                            </div>
                            <Button 
                              type="default" 
                              size="small"
                              // onClick={testArangoConnection}
                            >
                              测试连接
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          </Form>
        </TabPane>


        {/* 系统参数标签 */}
        <TabPane 
          tab={
            <span>
              <SettingOutlined />
              系统参数
            </span>
          } 
          key="system"
        >
          <Form 
            layout="vertical" 
            form={systemForm}
            onFieldsChange={(changedFields, allFields) => {
              setHasUnsavedChanges(true);
              
              // 获取表单的所有值
              const formValues = systemForm.getFieldsValue();
              
              // 更新vectorizationConfig
              const vectorizationUpdates: Partial<VectorizationConfig> = {};
              
              if (formValues.enableDualVector !== undefined ||
                  formValues.retrievalMode !== undefined ||
                  formValues.vectorTopK !== undefined ||
                  formValues.vectorThreshold !== undefined ||
                  formValues.keywordLimit !== undefined ||
                  formValues.keywordFuzzyMatch !== undefined ||
                  formValues.vectorWeight !== undefined ||
                  formValues.keywordWeight !== undefined ||
                  formValues.enableRerank !== undefined ||
                  formValues.rerankTopK !== undefined ||
                  formValues.rerankThreshold !== undefined) {
                
                vectorizationUpdates.enableDualVector = formValues.enableDualVector !== undefined ? formValues.enableDualVector : vectorizationConfig.enableDualVector;
                vectorizationUpdates.retrievalMode = formValues.retrievalMode || vectorizationConfig.retrievalMode;
                
                if (formValues.vectorTopK !== undefined || formValues.vectorThreshold !== undefined) {
                  vectorizationUpdates.vectorSearch = {
                    ...vectorizationConfig.vectorSearch,
                    topK: formValues.vectorTopK !== undefined ? formValues.vectorTopK : vectorizationConfig.vectorSearch.topK,
                    threshold: formValues.vectorThreshold !== undefined ? formValues.vectorThreshold : vectorizationConfig.vectorSearch.threshold
                  };
                }
                
                if (formValues.keywordLimit !== undefined || formValues.keywordFuzzyMatch !== undefined) {
                  vectorizationUpdates.keywordSearch = {
                    ...vectorizationConfig.keywordSearch,
                    limit: formValues.keywordLimit !== undefined ? formValues.keywordLimit : vectorizationConfig.keywordSearch.limit,
                    fuzzyMatch: formValues.keywordFuzzyMatch !== undefined ? formValues.keywordFuzzyMatch : vectorizationConfig.keywordSearch.fuzzyMatch
                  };
                }
                
                if (formValues.vectorWeight !== undefined || formValues.keywordWeight !== undefined || formValues.enableRerank !== undefined) {
                  vectorizationUpdates.hybridSearch = {
                    ...vectorizationConfig.hybridSearch,
                    vectorWeight: formValues.vectorWeight !== undefined ? formValues.vectorWeight : vectorizationConfig.hybridSearch.vectorWeight,
                    keywordWeight: formValues.keywordWeight !== undefined ? formValues.keywordWeight : vectorizationConfig.hybridSearch.keywordWeight,
                    enableRerank: formValues.enableRerank !== undefined ? formValues.enableRerank : vectorizationConfig.hybridSearch.enableRerank
                  };
                }
                
                if (formValues.rerankTopK !== undefined || formValues.rerankThreshold !== undefined) {
                  vectorizationUpdates.rerank = {
                    ...vectorizationConfig.rerank,
                    topK: formValues.rerankTopK !== undefined ? formValues.rerankTopK : vectorizationConfig.rerank.topK,
                    threshold: formValues.rerankThreshold !== undefined ? formValues.rerankThreshold : vectorizationConfig.rerank.threshold
                  };
                }
              }
              
              // 更新agentConfig
              const agentUpdates: Partial<AgentConfig> = {};
              
              if (formValues.enableKnowledgeGraph !== undefined ||
                  formValues.extractionMode !== undefined ||
                  formValues.minConfidence !== undefined ||
                  formValues.batchSize !== undefined ||
                  formValues.maxConcurrency !== undefined ||
                  formValues.retryAttempts !== undefined ||
                  formValues.timeoutMs !== undefined) {
                
                agentUpdates.enableKnowledgeGraph = formValues.enableKnowledgeGraph !== undefined ? formValues.enableKnowledgeGraph : agentConfig.enableKnowledgeGraph;
                agentUpdates.extractionMode = formValues.extractionMode || agentConfig.extractionMode;
                
                agentUpdates.extractionConfig = {
                  ...agentConfig.extractionConfig,
                  minConfidence: formValues.minConfidence !== undefined ? formValues.minConfidence : agentConfig.extractionConfig.minConfidence,
                  batchSize: formValues.batchSize !== undefined ? formValues.batchSize : agentConfig.extractionConfig.batchSize,
                  maxConcurrency: formValues.maxConcurrency !== undefined ? formValues.maxConcurrency : agentConfig.extractionConfig.maxConcurrency,
                  retryAttempts: formValues.retryAttempts !== undefined ? formValues.retryAttempts : agentConfig.extractionConfig.retryAttempts,
                  timeoutMs: formValues.timeoutMs !== undefined ? formValues.timeoutMs : agentConfig.extractionConfig.timeoutMs
                };
              }
              
              // 应用更新到全局状态
              if (Object.keys(vectorizationUpdates).length > 0) {
                setVectorizationConfig(vectorizationUpdates);
                console.log('🔄 向量化配置已更新:', vectorizationUpdates);
              }
              
              if (Object.keys(agentUpdates).length > 0) {
                setAgentConfig(agentUpdates);
              }
              
              // 同步本地状态
              if (formValues.enableDualVector !== undefined) {
                setEnableDualVector(formValues.enableDualVector);
              }
              if (formValues.enableKnowledgeGraph !== undefined) {
                setEnableKnowledgeGraph(formValues.enableKnowledgeGraph);
              }
            }}
          >
            <Card 
              title={
                <div className="flex items-center">
                  <SettingOutlined className="mr-2" />
                  <div>
                    <div>系统参数配置</div>
                    <Text type="secondary" className="text-xs font-normal">
                      配置双向量系统、检索参数、系统优化和存储设置
                    </Text>
                  </div>
                </div>
              }
              className="mb-4"
            >
              <Tabs 
                type="card" 
                size="small"
                items={[
                  {
                    key: 'dual-vector',
                    label: (
                      <span>
                        <ExperimentOutlined className="mr-1" />
                        双向量配置
                      </span>
                    ),
                    children: (
                      <div className="p-2">
                        {/* 双向量系统开关 */}
                        <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center">
                            <ExperimentOutlined className="text-slate-600 mr-2" />
                            <div>
                              <div className="font-medium">双向量化系统</div>
                              <Text type="secondary" className="text-xs">
                                开启后，所有上传的文档将同时生成通用向量和领域向量
                              </Text>
                            </div>
                          </div>
                          <Form.Item
                            name="enableDualVector"
                            valuePropName="checked"
                            className="mb-0"
                          >
                            <Switch 
                              checked={enableDualVector}
                              onChange={setEnableDualVector}
                              checkedChildren="已启用" 
                              unCheckedChildren="已禁用"
                            />
                          </Form.Item>
                        </div>

                        {/* 检索模式配置 */}
                        <Form.Item
                          name="retrievalMode"
                          label="检索模式"
                          extra="选择检索时使用的向量策略"
                        >
                          <Select 
                            className="w-full"
                            optionLabelProp="label"
                          >
                            <Option 
                              value="dual" 
                              label="双向量检索"
                            >
                              <div className="flex items-center">
                                <Tag color="purple" className="mr-2">双检索</Tag>
                                <div>
                                  <Text strong>双向量检索</Text>
                                  <div className="text-xs text-gray-500">
                                    同时使用通用向量和领域向量进行检索，获得最佳效果
                                  </div>
                                </div>
                              </div>
                            </Option>
                            <Option 
                              value="general" 
                              label="仅通用向量检索"
                            >
                              <div className="flex items-center">
                                <Tag color="blue" className="mr-2">通用</Tag>
                                <div>
                                  <Text strong>仅通用向量检索</Text>
                                  <div className="text-xs text-gray-500">
                                    仅使用Qwen通用向量进行检索
                                  </div>
                                </div>
                              </div>
                            </Option>
                            <Option 
                              value="domain" 
                              label="仅领域向量检索"
                            >
                              <div className="flex items-center">
                                <Tag color="green" className="mr-2">领域</Tag>
                                <div>
                                  <Text strong>仅领域向量检索</Text>
                                  <div className="text-xs text-gray-500">
                                    仅使用领域向量进行检索
                                  </div>
                                </div>
                              </div>
                            </Option>
                          </Select>
                        </Form.Item>

                        {/* 双向量权重配置 - 根据检索模式动态显示 */}
                        <Form.Item 
                          noStyle 
                          shouldUpdate={(prevValues, currentValues) => 
                            prevValues.retrievalMode !== currentValues.retrievalMode
                          }
                        >
                          {({ getFieldValue }) => {
                            const retrievalMode = getFieldValue('retrievalMode');
                            
                            return (
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <Form.Item
                                  name="generalWeight"
                                  label="通用向量权重"
                                  extra="通用向量在双检索中的权重比例"
                                  initialValue={0.4}
                                >
                                  <InputNumber 
                                    min={0} 
                                    max={1} 
                                    step={0.1}
                                    formatter={value => `${(value * 100).toFixed(0)}%`}
                                    parser={value => value.replace('%', '') / 100}
                                    className="w-full"
                                    disabled={retrievalMode === 'domain'}
                                    style={{
                                      opacity: retrievalMode === 'domain' ? 0.5 : 1
                                    }}
                                  />
                                </Form.Item>

                                <Form.Item
                                  name="domainWeight"
                                  label="领域向量权重"
                                  extra="领域向量在双检索中的权重比例"
                                  initialValue={0.6}
                                >
                                  <InputNumber 
                                    min={0} 
                                    max={1} 
                                    step={0.1}
                                    formatter={value => `${(value * 100).toFixed(0)}%`}
                                    parser={value => value.replace('%', '') / 100}
                                    className="w-full"
                                    disabled={retrievalMode === 'general'}
                                    style={{
                                      opacity: retrievalMode === 'general' ? 0.5 : 1
                                    }}
                                  />
                                </Form.Item>
                              </div>
                            );
                          }}
                        </Form.Item>

                        {/* 权重说明 */}
                        <Form.Item 
                          noStyle 
                          shouldUpdate={(prevValues, currentValues) => 
                            prevValues.retrievalMode !== currentValues.retrievalMode
                          }
                        >
                          {({ getFieldValue }) => {
                            const retrievalMode = getFieldValue('retrievalMode');
                            let description = '';
                            
                            switch(retrievalMode) {
                              case 'dual':
                                description = '双向量检索模式：可调整通用向量和领域向量的权重比例';
                                break;
                              case 'general':
                                description = '仅通用向量检索模式：只使用通用向量，领域向量权重设置无效';
                                break;
                              case 'domain':
                                description = '仅领域向量检索模式：只使用领域向量，通用向量权重设置无效';
                                break;
                              default:
                                description = '请选择检索模式';
                            }
                            
                            return (
                              <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                                <Text className="text-sm text-gray-600">{description}</Text>
                              </div>
                            );
                          }}
                        </Form.Item>
                      </div>
                    )
                  },
                  {
                    key: 'retrieval',
                    label: (
                      <span>
                        <DatabaseOutlined className="mr-1" />
                        检索参数
                      </span>
                    ),
                    children: (
                      <div className="p-2">
                        <div className="grid grid-cols-2 gap-4">
                          <Form.Item
                            name="topK"
                            label="检索文档数量"
                            extra="每次检索返回的最大文档数量"
                            initialValue={10}
                          >
                            <InputNumber min={1} max={50} className="w-full" />
                          </Form.Item>

                          <Form.Item
                            name="similarityThreshold"
                            label="相似度阈值"
                            extra="文档相似度的最低阈值"
                          >
                            <InputNumber 
                              min={0} 
                              max={1} 
                              step={0.05}
                              formatter={value => `${(value * 100).toFixed(0)}%`}
                              parser={value => value.replace('%', '') / 100}
                              className="w-full"
                            />
                          </Form.Item>
                        </div>

                        <Form.Item
                          name="useHybridSearch"
                          label="启用混合检索"
                          valuePropName="checked"
                          extra="开启后将结合关键词检索和向量检索的结果"
                        >
                          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                        </Form.Item>

                        {/* 混合检索权重配置 - 根据混合检索开关动态显示 */}
                        <Form.Item 
                          noStyle 
                          shouldUpdate={(prevValues, currentValues) => 
                            prevValues.useHybridSearch !== currentValues.useHybridSearch
                          }
                        >
                          {({ getFieldValue }) => {
                            const useHybridSearch = getFieldValue('useHybridSearch');
                            
                            if (!useHybridSearch) return null;
                            
                            return (
                              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="mb-3">
                                  <Text strong className="text-sm">混合检索权重配置</Text>
                                  <div className="text-xs text-gray-500 mt-1">
                                    调整关键词检索和向量检索在最终结果中的权重比例
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <Form.Item
                                    name="keywordSearchWeight"
                                    label="关键词检索权重"
                                    extra="基于关键词匹配的检索权重"
                                    initialValue={0.3}
                                  >
                                    <InputNumber 
                                      min={0} 
                                      max={1} 
                                      step={0.1}
                                      formatter={value => `${(value * 100).toFixed(0)}%`}
                                      parser={value => value.replace('%', '') / 100}
                                      className="w-full"
                                    />
                                  </Form.Item>

                                  <Form.Item
                                    name="vectorSearchWeight"
                                    label="向量检索权重"
                                    extra="基于语义相似度的检索权重"
                                          >
                                    <InputNumber 
                                      min={0} 
                                      max={1} 
                                      step={0.1}
                                      formatter={value => `${(value * 100).toFixed(0)}%`}
                                      parser={value => value.replace('%', '') / 100}
                                      className="w-full"
                                    />
                                  </Form.Item>
                                </div>

                                <div className="mt-3 p-2 bg-white rounded border">
                                  <Text className="text-xs text-gray-600">
                                    💡 <strong>建议配置：</strong>关键词检索权重30%，向量检索权重70%。
                                    关键词检索适合精确匹配，向量检索适合语义理解。
                                  </Text>
                                </div>
                              </div>
                            );
                          }}
                        </Form.Item>
                      </div>
                    )
                  },
                  {
                    key: 'optimization',
                    label: (
                      <span>
                        <ExperimentOutlined className="mr-1" />
                        系统优化
                      </span>
                    ),
                    children: (
                      <div className="p-2">
                        <Form.Item
                          name="enableCache"
                          label="启用缓存"
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                        </Form.Item>

                        <div className="grid grid-cols-2 gap-4">
                          <Form.Item
                            name="cacheExpiration"
                            label="缓存过期时间（分钟）"
                            initialValue={60}
                          >
                            <InputNumber 
                              min={5} 
                              max={1440} 
                              className="w-full"
                            />
                          </Form.Item>

                          <Form.Item
                            name="logLevel"
                            label="日志级别"
                            initialValue="info"
                          >
                            <Select>
                              <Option value="debug">调试 (Debug)</Option>
                              <Option value="info">信息 (Info)</Option>
                              <Option value="warning">警告 (Warning)</Option>
                              <Option value="error">错误 (Error)</Option>
                            </Select>
                          </Form.Item>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'storage',
                    label: (
                      <span>
                        <CloudServerOutlined className="mr-1" />
                        存储配置
                      </span>
                    ),
                    children: (
                      <div className="p-2">

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <CloudServerOutlined className="mr-2" />
                            存储健康状态
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="small" 
                              onClick={checkStorageHealth}
                              loading={storageStatus === 'checking'}
                            >
                              健康检查
                            </Button>
                            {storageStatus === 'healthy' && (
                              <CheckCircleOutlined className="text-green-500" />
                            )}
                            {storageStatus === 'error' && (
                              <ExclamationCircleOutlined className="text-red-500" />
                            )}
                          </div>
                        </div>
              {/* 存储类型选择 */}
              <Form.Item
                label="存储类型"
                extra="选择文件存储方式"
              >
                <Select 
                  value={storageConfig.type}
                  onChange={(value) => handleStorageConfigChange('type', value)}
                  className="w-full"
                >
                  <Option value="minio">
                    <div className="flex items-center">
                      <CloudServerOutlined className="mr-2" />
                      MinIO 对象存储
                      <Text className="ml-2 text-xs text-gray-500">
                        (分布式、高可用)
                      </Text>
                    </div>
                  </Option>
                  <Option value="local">
                    <div className="flex items-center">
                      <FolderOutlined className="mr-2" />
                      本地文件系统
                      <Text className="ml-2 text-xs text-gray-500">
                        (简单部署)
                      </Text>
                    </div>
                  </Option>
                </Select>
              </Form.Item>

              {/* MinIO配置 */}
              {storageConfig.type === 'minio' && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <Title level={5} className="mb-4">MinIO 配置</Title>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label="服务端点"
                      extra="MinIO服务器地址"
                    >
                      <Input
                        value={storageConfig.minio.endpoint}
                        onChange={(e) => handleStorageConfigChange('minio.endpoint', e.target.value)}
                        placeholder="localhost:9000"
                      />
                    </Form.Item>

                    <Form.Item
                      label="公共端点"
                      extra="外部访问地址"
                    >
                      <Input
                        value={storageConfig.minio.publicEndpoint}
                        onChange={(e) => handleStorageConfigChange('minio.publicEndpoint', e.target.value)}
                        placeholder="http://localhost:9000"
                      />
                    </Form.Item>

                    <Form.Item
                      label="访问密钥"
                      extra="MinIO Access Key"
                    >
                      <Input
                        value={storageConfig.minio.accessKey}
                        onChange={(e) => handleStorageConfigChange('minio.accessKey', e.target.value)}
                        placeholder="minioadmin"
                      />
                    </Form.Item>

                    <Form.Item
                      label="秘密密钥"
                      extra="MinIO Secret Key"
                    >
                      <Input.Password
                        value={storageConfig.minio.secretKey}
                        onChange={(e) => handleStorageConfigChange('minio.secretKey', e.target.value)}
                        placeholder="输入秘密密钥"
                      />
                    </Form.Item>
                  </div>

                  <Divider />

                  <Title level={5} className="mb-4">存储桶配置</Title>
                  <div className="grid grid-cols-3 gap-4">
                    <Form.Item
                      label="文档存储桶"
                      extra="存储上传的文档"
                    >
                      <Input
                        value={storageConfig.minio.documentsBucket}
                        onChange={(e) => handleStorageConfigChange('minio.documentsBucket', e.target.value)}
                        placeholder="mat-qa-documents"
                      />
                    </Form.Item>

                    <Form.Item
                      label="媒体存储桶"
                      extra="存储图片、视频等"
                    >
                      <Input
                        value={storageConfig.minio.mediaBucket}
                        onChange={(e) => handleStorageConfigChange('minio.mediaBucket', e.target.value)}
                        placeholder="mat-qa-media"
                      />
                    </Form.Item>

                    <Form.Item
                      label="缩略图存储桶"
                      extra="存储生成的缩略图"
                    >
                      <Input
                        value={storageConfig.minio.thumbnailsBucket}
                        onChange={(e) => handleStorageConfigChange('minio.thumbnailsBucket', e.target.value)}
                        placeholder="mat-qa-thumbnails"
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    label="自动创建存储桶"
                    extra="系统启动时自动创建不存在的存储桶"
                  >
                    <Switch
                      checked={storageConfig.minio.autoCreateBuckets}
                      onChange={(checked) => handleStorageConfigChange('minio.autoCreateBuckets', checked)}
                      checkedChildren="开启"
                      unCheckedChildren="关闭"
                    />
                  </Form.Item>
                </div>
              )}

              {/* 本地存储配置 */}
              {storageConfig.type === 'local' && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <Title level={5} className="mb-2">本地存储配置</Title>
                  <Paragraph className="text-sm text-gray-600 mb-4">
                    文件将存储在服务器的 <code>uploads/</code> 目录下，适合单机部署和开发环境。
                  </Paragraph>
                  
                  <div className="space-y-2 text-sm">
                    <div><Text strong>文档目录:</Text> uploads/documents/</div>
                    <div><Text strong>媒体目录:</Text> uploads/media/</div>
                    <div><Text strong>缩略图目录:</Text> uploads/thumbnails/</div>
                  </div>
                </div>
              )}
                      </div>
                    )
                  },
                  {
                    key: 'knowledge-graph',
                    label: (
                      <span>
                        <ClusterOutlined className="mr-1" />
                        知识图谱
                      </span>
                    ),
                    children: (
                      <div className="p-2">
                        {/* 知识图谱系统主开关 */}
                        <div className="flex items-center justify-between mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
                          <div className="flex items-center">
                            <ClusterOutlined className="text-stone-600 mr-3" />
                            <div>
                              <div className="font-medium text-base">知识图谱系统</div>
                              <Text type="secondary" className="text-sm">
                                开启后，所有上传的文档将自动进行三元组提取，构建材料科学知识图谱
                              </Text>
                            </div>
                          </div>
                          <Form.Item
                            name="enableKnowledgeGraph"
                            valuePropName="checked"
                            className="mb-0"
                            initialValue={enableKnowledgeGraph}
                          >
                            <Switch 
                              size="default"
                              checked={enableKnowledgeGraph}
                              onChange={setEnableKnowledgeGraph}
                              checkedChildren="已启用" 
                              unCheckedChildren="已禁用"
                            />
                          </Form.Item>
                        </div>

                        {/* 知识图谱详细配置 - 仅在启用时显示 */}
                        {enableKnowledgeGraph && (
                          <>
                            {/* 提取模式配置 */}
                            <Form.Item
                              name="extractionMode"
                              label="提取模式"
                              extra="选择三元组提取的执行策略"
                              initialValue="auto"
                            >
                              <Select 
                                className="w-full"
                                optionLabelProp="label"
                              >
                                <Option value="auto" label="自动模式">
                                  <div className="flex items-center">
                                    <Tag color="green" className="mr-2">推荐</Tag>
                                    <div>
                                      <Text strong>自动模式</Text>
                                      <div className="text-xs text-gray-500">
                                        文档上传时自动进行三元组提取
                                      </div>
                                    </div>
                                  </div>
                                </Option>
                                <Option value="manual" label="手动模式">
                                  <div className="flex items-center">
                                    <Tag color="blue" className="mr-2">手动</Tag>
                                    <div>
                                      <Text strong>手动模式</Text>
                                      <div className="text-xs text-gray-500">
                                        需要手动触发三元组提取
                                      </div>
                                    </div>
                                  </div>
                                </Option>
                              </Select>
                            </Form.Item>

                            {/* 提取参数配置 */}
                            <div className="grid grid-cols-2 gap-4">
                              <Form.Item
                                name="minConfidence"
                                label="最小置信度"
                                extra="三元组提取的最低置信度阈值"
                                  >
                                <InputNumber 
                                  min={0} 
                                  max={1} 
                                  step={0.05}
                                  formatter={value => `${(value * 100).toFixed(0)}%`}
                                  parser={value => value.replace('%', '') / 100}
                                  className="w-full"
                                />
                              </Form.Item>

                              <Form.Item
                                name="batchSize"
                                label="批处理大小"
                                extra="每批处理的文档数量"
                                initialValue={10}
                              >
                                <InputNumber 
                                  min={1} 
                                  max={50} 
                                  className="w-full"
                                />
                              </Form.Item>
                            </div>

                            {/* ArangoDB配置 */}
                            <Divider orientation="left">
                              <DatabaseOutlined className="mr-2" />
                              ArangoDB配置
                            </Divider>

                            <div className="grid grid-cols-2 gap-4">
                              <Form.Item
                                name="arangodbHost"
                                label="数据库地址"
                                extra="ArangoDB服务器地址"
                                initialValue="localhost:8529"
                              >
                                <Input 
                                  placeholder="localhost:8529"
                                />
                              </Form.Item>

                              <Form.Item
                                name="arangodbDatabase"
                                label="数据库名称"
                                extra="存储知识图谱的数据库"
                                initialValue="mat_qa_graph"
                              >
                                <Input 
                                  placeholder="mat_qa_graph"
                                />
                              </Form.Item>
                            </div>

                            {/* 处理配置 */}
                            <Divider orientation="left">
                              <ExperimentOutlined className="mr-2" />
                              处理配置
                            </Divider>

                            <div className="grid grid-cols-3 gap-4">
                              <Form.Item
                                name="maxConcurrency"
                                label="最大并发数"
                                extra="同时处理的任务数"
                                initialValue={3}
                              >
                                <InputNumber 
                                  min={1} 
                                  max={10} 
                                  className="w-full"
                                />
                              </Form.Item>

                              <Form.Item
                                name="retryAttempts"
                                label="重试次数"
                                extra="失败时的重试次数"
                                initialValue={2}
                              >
                                <InputNumber 
                                  min={0} 
                                  max={5} 
                                  className="w-full"
                                />
                              </Form.Item>

                              <Form.Item
                                name="timeoutMs"
                                label="超时时间(秒)"
                                extra="单个任务的超时时间"
                              >
                                <InputNumber 
                                  min={10} 
                                  max={300} 
                                  className="w-full"
                                />
                              </Form.Item>
                            </div>
                          </>
                        )}


                        {/* 知识图谱状态说明 */}
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-start">
                            <InfoCircleOutlined className="text-gray-500 mr-3 mt-1 flex-shrink-0" />
                            <div>
                              <Text strong>知识图谱系统说明</Text>
                              <ul className="mt-2 text-xs text-gray-600 space-y-1">
                                {enableKnowledgeGraph ? (
                                  <>
                                    <li>✅ 知识图谱系统已启用，上传的文档将自动进行三元组提取</li>
                                    <li>📊 提取的实体和关系将存储在ArangoDB数据库中</li>
                                    <li>🔍 支持材料、化学成分、性能、工艺等12种实体类型</li>
                                    <li>🚀 可通过知识图谱页面查看和管理提取结果</li>
                                  </>
                                ) : (
                                  <>
                                    <li>❌ 知识图谱系统已禁用，不会进行三元组提取</li>
                                    <li>💡 开启后可以从文档中自动提取实体和关系</li>
                                    <li>🔧 需要确保ArangoDB服务正在运行</li>
                                  </>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          </Form>
        </TabPane>

        {/* 服务状态标签 */}
        <TabPane 
          tab={
            <span>
              <DeploymentUnitOutlined />
              服务状态
            </span>
          } 
          key="service-status"
        >
          <Card 
            title={
              <div className="flex items-center">
                <DeploymentUnitOutlined className="mr-2" />
                <div>
                  <div>服务状态监控</div>
                  <Text type="secondary" className="text-xs font-normal">
                    实时显示系统各服务的运行状态和健康信息
                  </Text>
                </div>
              </div>
            }
            loading={loading}
          >
            {serviceStatus.length > 0 ? (
              <div className="space-y-4">
                {serviceStatus
                  .filter((service) => {
                    const serviceName = service.name.toLowerCase();
                    // 过滤掉所有LLM相关服务，包括One-API
                    const isLLMService = serviceName.includes('llm-') || 
                                       serviceName.includes('llm_') ||
                                       serviceName.includes('one-api') ||
                                       (serviceName.includes('llm') && serviceName.includes('openai')) ||
                                       (serviceName.includes('llm') && serviceName.includes('alibaba')) ||
                                       (serviceName.includes('llm') && serviceName.includes('google')) ||
                                       (serviceName.includes('llm') && serviceName.includes('custom'));
                    
                    // 只保留数据库、存储等核心基础服务
                    return !isLLMService;
                  })
                  .map((service) => (
                  <div 
                    key={service.name} 
                    className={`p-4 rounded-lg border ${
                      service.status === 'healthy' ? 'bg-green-50 border-green-200' :
                      service.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {service.status === 'healthy' ? (
                          <CheckCircleOutlined className="text-green-500 text-xl mr-3" />
                        ) : service.status === 'warning' ? (
                          <ExclamationCircleOutlined className="text-yellow-500 text-xl mr-3" />
                        ) : (
                          <ExclamationCircleOutlined className="text-red-500 text-xl mr-3" />
                        )}
                        <div>
                          <Title level={5} className="mb-0">{service.name}</Title>
                          <Text type="secondary" className="text-sm">
                            {service.message}
                          </Text>
                        </div>
                      </div>
                      <div className="text-right">
                        <Tag 
                          color={
                            service.status === 'healthy' ? 'green' :
                            service.status === 'warning' ? 'orange' : 'red'
                          }
                          className="mb-2"
                        >
                          {service.status}
                        </Tag>
                        {service.has_fallback && (
                          <div>
                            <Tag 
                              color={service.fallback_active ? 'orange' : 'blue'} 
                              size="small"
                            >
                              {service.fallback_active ? '降级模式' : '有降级'}
                            </Tag>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 服务详情 - 简化显示 */}
                    {Object.keys(service.details).length > 0 && (
                      <div className="mt-3 p-2 bg-white rounded border">
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(service.details)
                            .filter(([key, value]) => 
                              // 只显示重要的配置信息，过滤掉冗余的详情
                              !['internal_config', 'raw_config', 'debug_info'].includes(key) && 
                              String(value).length < 100
                            )
                            .map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <Text type="secondary" className="font-medium">{key}: </Text>
                              <Text>{String(value)}</Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DeploymentUnitOutlined className="text-gray-400 text-4xl mb-4" />
                <Text type="secondary">核心服务运行正常</Text>
                <div className="mt-2">
                  <Text type="secondary" className="text-xs">
                    数据库、存储等基础服务状态良好
                  </Text>
                </div>
              </div>
            )}


          </Card>
        </TabPane>

      </Tabs>
      )}
      
      {/* 干净简洁的Modal样式 */}
      <style>{`
        /* 防止页面滚动 */
        body.clean-modal-active {
          overflow: hidden !important;
        }
        
        /* Modal 整体样式 */
        .clean-modal .ant-modal-content {
          background: #ffffff !important;
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          overflow: hidden !important;
          padding: 0 !important;
        }
        
        /* Header 样式 */
        .clean-modal .ant-modal-header {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
          border-bottom: 1px solid #f1f5f9 !important;
          border-radius: 20px 20px 0 0 !important;
          padding: 8px 32px 8px 32px !important;
          margin: 0 !important;
          min-height: auto !important;
        }
        
        /* Body 样式 */
        .clean-modal .ant-modal-body {
          background: #ffffff !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        /* Footer 样式 */
        .clean-modal .ant-modal-footer {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
          border-top: 1px solid #f1f5f9 !important;
          border-radius: 0 0 20px 20px !important;
          padding: 16px 32px 20px 32px !important;
          margin: 0 !important;
        }
        
        /* 标签页样式 - 无边框设计 */
        .clean-modal .ant-tabs {
          background: #ffffff !important;
          margin: 0 !important;
        }
        
        .clean-modal .ant-tabs-nav {
          background: #ffffff !important;
          border-bottom: 1px solid #f1f5f9 !important;
          margin: 0 !important;
          padding: 0 32px !important;
        }
        
        .clean-modal .ant-tabs-nav::before {
          display: none !important;
        }
        
        .clean-modal .ant-tabs-tab {
          background: transparent !important;
          border: none !important;
          color: #6b7280 !important;
          font-weight: 500 !important;
          margin: 0 !important;
          padding: 16px 24px !important;
          border-radius: 0 !important;
          position: relative !important;
          transition: all 0.3s ease !important;
        }
        
        .clean-modal .ant-tabs-tab:hover {
          color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.05) !important;
        }
        
        .clean-modal .ant-tabs-tab-active {
          color: #3b82f6 !important;
          background: #ffffff !important;
          font-weight: 600 !important;
        }
        
        .clean-modal .ant-tabs-tab-active::after {
          content: '' !important;
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 3px !important;
          background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%) !important;
          border-radius: 2px 2px 0 0 !important;
        }
        
        .clean-modal .ant-tabs-ink-bar {
          display: none !important;
        }
        
        .clean-modal .ant-tabs-content-holder {
          background: #ffffff !important;
        }
        
        .clean-modal .ant-tabs-tabpane {
          background: #ffffff !important;
          padding: 32px !important;
        }
        
        /* 表单样式 */
        .clean-modal .ant-form-item {
          margin-bottom: 24px !important;
        }
        
        .clean-modal .ant-form-item-label > label {
          color: #1f2937 !important;
          font-weight: 600 !important;
          font-size: 14px !important;
        }
        
        .clean-modal .ant-input,
        .clean-modal .ant-input-number,
        .clean-modal .ant-select-selector {
          background: #ffffff !important;
          border: 2px solid #f1f5f9 !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
          transition: all 0.3s ease !important;
        }
        
        .clean-modal .ant-input:focus,
        .clean-modal .ant-input-number:focus,
        .clean-modal .ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
        }
        
        .clean-modal .ant-input:hover,
        .clean-modal .ant-input-number:hover,
        .clean-modal .ant-select:hover .ant-select-selector {
          border-color: #d1d5db !important;
        }
        
        /* 按钮样式 */
        .clean-modal .ant-btn {
          border-radius: 12px !important;
          font-weight: 600 !important;
          padding: 12px 24px !important;
          height: auto !important;
          transition: all 0.3s ease !important;
        }
        
        .clean-modal .ant-btn-default {
          background: #ffffff !important;
          border: 2px solid #f1f5f9 !important;
          color: #6b7280 !important;
        }
        
        .clean-modal .ant-btn-default:hover {
          background: #f8fafc !important;
          border-color: #e5e7eb !important;
          color: #374151 !important;
          transform: translateY(-1px) !important;
        }
        
        .clean-modal .ant-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          border: none !important;
          color: #ffffff !important;
        }
        
        .clean-modal .ant-btn-primary:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3) !important;
        }
        
        /* 卡片和容器样式 */
        .clean-modal .ant-card {
          background: #ffffff !important;
          border: 2px solid #f8fafc !important;
          border-radius: 16px !important;
          box-shadow: none !important;
          margin-bottom: 20px !important;
        }
        
        .clean-modal .ant-card-head {
          background: #f8fafc !important;
          border-bottom: 1px solid #f1f5f9 !important;
          border-radius: 16px 16px 0 0 !important;
          padding: 16px 20px !important;
        }
        
        .clean-modal .ant-card-head-title {
          color: #1f2937 !important;
          font-weight: 700 !important;
        }
        
        /* 标签样式 */
        .clean-modal .ant-tag {
          background: #f3f4f6 !important;
          color: #6b7280 !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          padding: 4px 12px !important;
          font-weight: 500 !important;
        }
        
        /* 开关样式 */
        .clean-modal .ant-switch {
          background: #d1d5db !important;
          border-radius: 20px !important;
        }
        
        .clean-modal .ant-switch-checked {
          background: #3b82f6 !important;
        }
        
        /* 折叠面板样式 */
        .clean-modal .ant-collapse {
          background: transparent !important;
          border: 2px solid #f8fafc !important;
          border-radius: 16px !important;
          margin-bottom: 20px !important;
        }
        
        .clean-modal .ant-collapse-item {
          border-bottom: 1px solid #f1f5f9 !important;
          background: #ffffff !important;
        }
        
        .clean-modal .ant-collapse-header {
          background: #f8fafc !important;
          color: #1f2937 !important;
          font-weight: 700 !important;
          padding: 16px 24px !important;
        }
        
        .clean-modal .ant-collapse-content {
          background: #ffffff !important;
        }
        
        /* 选择器下拉样式 */
        .clean-modal .ant-select-dropdown {
          background: #ffffff !important;
          border: 2px solid #f1f5f9 !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
        }
        
        .clean-modal .ant-select-item {
          color: #374151 !important;
          border-radius: 8px !important;
          margin: 4px 8px !important;
        }
        
        .clean-modal .ant-select-item-option-selected {
          background: #eff6ff !important;
          color: #1d4ed8 !important;
          font-weight: 600 !important;
        }
        
        .clean-modal .ant-select-item-option-active {
          background: #f8fafc !important;
        }
        
        /* 特殊区域样式 */
        .clean-modal .bg-slate-50 {
          background: #f8fafc !important;
          border: 2px solid #f1f5f9 !important;
          border-radius: 12px !important;
          padding: 20px !important;
        }
      `}</style>
    </Modal>
  );
};

// 使用React.memo优化性能，避免不必要的重渲染
export const SystemSettings = memo(SystemSettingsComponent, (prevProps, nextProps) => {
  // 仅在visible状态变化时重新渲染
  return prevProps.visible === nextProps.visible;
}); 