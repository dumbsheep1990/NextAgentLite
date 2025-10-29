/**
 * 知识库切分配置面板 - 显示和管理当前知识库的切分规则
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  message,
  Select,
  Typography,
  Alert,
  Divider,
  Descriptions,
  Spin,
  Switch,
  Dropdown,
  Popconfirm
} from 'antd';
import {
  SettingOutlined,
  EditOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
  SaveOutlined,
  SyncOutlined,
  DeleteOutlined,
  MoreOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { collectionService } from '../../services/collectionService';
import { chunkingConfigService } from '../../services/chunkingConfigService';
import { useCollectionContext } from '../../pages/knowledge/KnowledgePageClean';
import CreateChunkingConfigModal from './CreateChunkingConfigModal';

const { Title, Text } = Typography;
const { Option } = Select;

interface CollectionChunkingPanelProps {
  onConfigChange?: (config: any) => void;
}

interface ChunkingConfigData {
  collection_id: string;
  collection_name: string;
  default_chunking_config_id: string;
  custom_chunking_config: any;
  chunking_config: {
    id: string;
    name: string;
    description: string;
    strategy: string;
    chunk_token_num: number;
    max_token_num: number;
    chunk_overlap: number;
    delimiter: string;
    tokenizer_type: string;
    preserve_structure: boolean;
    semantic_threshold: number;
    supported_formats: string[];
    is_active: boolean;
  };
}

const CollectionChunkingPanel: React.FC<CollectionChunkingPanelProps> = ({ onConfigChange }) => {
  const { selectedCollectionId, selectedCollectionInfo } = useCollectionContext();
  
  const [chunkingConfig, setChunkingConfig] = useState<ChunkingConfigData | null>(null);
  const [systemConfigs, setSystemConfigs] = useState<any[]>([]); // 系统默认配置
  const [customConfigs, setCustomConfigs] = useState<any[]>([]);  // 用户自定义配置
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null); // 当前激活的配置ID
  const [activeConfigType, setActiveConfigType] = useState<'system' | 'custom' | null>(null); // 激活配置类型
  const [systemToggleEnabled, setSystemToggleEnabled] = useState(false); // 系统规则是否启用
  const [editModalVisible, setEditModalVisible] = useState(false); // 编辑模态框
  const [editingConfig, setEditingConfig] = useState<any>(null); // 当前编辑的配置

  // 获取知识库的切分配置
  const fetchCollectionChunkingConfig = async () => {
    if (!selectedCollectionId) {
      console.warn('🚫 未选择知识库，无法获取切分配置');
      return;
    }

    try {
      setLoading(true);
      console.log('📡 获取知识库切分配置:', selectedCollectionId);
      
      const response = await collectionService.getCollectionChunkingConfig(selectedCollectionId);
      
      // 修复响应判断逻辑：直接返回的数据对象也是有效的
      if (response && (response.success || response.collection_id)) {
        const configData = response.success ? response.data : response;
        
        // 如果知识库没有特定配置，使用全局默认配置
        if (!configData.default_chunking_config_id || !configData.chunking_config) {
          console.log('🔄 知识库无特定配置，获取默认配置');
          try {
            const defaultConfig = await chunkingConfigService.getDefaultConfig();
            if (defaultConfig) {
              configData.chunking_config = defaultConfig;
              configData.default_chunking_config_id = defaultConfig.id;
            }
          } catch (error) {
            console.warn('获取默认配置失败:', error);
          }
        }
        
        setChunkingConfig(configData);
        
        // 更新激活状态
        if (configData.chunking_config) {
          setActiveConfigId(configData.chunking_config.id);
          
          // 🔧 修复：判断知识库是否启用了自定义配置
          const customConfig = configData.custom_chunking_config;
          const inheritFromGlobal = customConfig?.inherit_from_global !== false;
          
          console.log('🔍 切分配置状态分析:');
          console.log('  - 配置ID:', configData.chunking_config.id);
          console.log('  - 配置名称:', configData.chunking_config.name);
          console.log('  - 配置作用域:', configData.chunking_config.scope);
          console.log('  - 自定义配置:', customConfig);
          console.log('  - 继承全局配置:', inheritFromGlobal);
          
          // 判断逻辑：如果inherit_from_global为true（或未设置），则使用系统配置
          if (inheritFromGlobal) {
            setActiveConfigType('system');
            setSystemToggleEnabled(true);
            console.log('✅ 知识库使用系统配置模式');
          } else {
            setActiveConfigType('custom');
            setSystemToggleEnabled(false);
            console.log('✅ 知识库启用自定义配置模式');
          }
        } else {
          // 没有配置时重置状态
          setActiveConfigId(null);
          setActiveConfigType(null);
          setSystemToggleEnabled(false);
          console.log('🔄 重置所有配置状态');
        }
        
        console.log('✅ 获取切分配置成功:', configData);
        onConfigChange?.(configData);
      } else {
        console.warn('⚠️ 获取切分配置响应异常:', response);
        message.error(response?.message || '获取切分配置失败');
      }
    } catch (error) {
      console.error('❌ 获取知识库切分配置失败:', error);
      message.error('获取切分配置失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 获取系统默认配置
  const fetchSystemConfigs = async () => {
    try {
      console.log('📡 获取系统默认切分配置...');
      
      // 获取全局作用域的配置作为系统配置
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/api/v1/knowledge/chunking-configs?scope=global`);
      if (response.ok) {
        const data = await response.json();
        const configs = data.configs || [];
        setSystemConfigs(configs);
        console.log('✅ 成功获取系统配置:', configs.length, '个');
      } else {
        throw new Error('获取系统配置失败');
      }
    } catch (error) {
      console.error('❌ 获取系统配置失败:', error);
      // 使用fallback系统配置
      setSystemConfigs([
        {
          id: 'default-fallback',
          name: '默认切分',
          description: '系统默认切分配置',
          strategy: 'semantic',
          chunk_token_num: 400,
          scope: 'global',
          is_default: true
        }
      ]);
    }
  };

  // 获取用户自定义配置
  const fetchCustomConfigs = async () => {
    if (!selectedCollectionId) return;
    
    try {
      console.log('📡 获取用户自定义切分配置...');

      // 获取当前知识库的专属配置
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/api/v1/knowledge/chunking-configs?scope=collection_specific&collection_id=${selectedCollectionId}`);
      if (response.ok) {
        const data = await response.json();
        const configs = data.configs || [];
        setCustomConfigs(configs);
        console.log('✅ 成功获取自定义配置:', configs.length, '个');
      } else {
        throw new Error('获取自定义配置失败');
      }
    } catch (error) {
      console.error('❌ 获取自定义配置失败:', error);
      setCustomConfigs([]);
    }
  };

  // 处理系统配置toggle
  const handleSystemToggle = async (enabled: boolean) => {
    if (!enabled) {
      // 关闭系统配置 - 切换到自定义配置模式
      console.log('🔄 切换到自定义配置模式');
      
      try {
        setSaveLoading(true);
        
        // 设置为自定义配置模式（不继承全局配置）
        const response = await collectionService.setCollectionChunkingConfig(
          selectedCollectionId!,
          {
            chunking_config_id: activeConfigId || systemConfigs[0]?.id,
            custom_config: {
              inherit_from_global: false, // 🔧 关键修复：设置为false表示启用自定义配置
              custom_rules: {},
              override_settings: {}
            }
          }
        );
        
        if (response && response.success) {
          setSystemToggleEnabled(false);
          setActiveConfigType('custom');
          message.success('已启用自定义配置模式');
          console.log('✅ 成功切换到自定义配置模式');
          // 刷新配置
          await fetchCollectionChunkingConfig();
        } else {
          throw new Error(response?.message || '切换配置失败');
        }
      } catch (error) {
        console.error('❌ 切换到自定义配置失败:', error);
        message.error('切换配置失败');
      } finally {
        setSaveLoading(false);
      }
      return;
    }
    
    // 启用系统配置时，如果没有选择具体配置，默认选择第一个或默认配置
    const defaultSystemConfig = systemConfigs.find(c => c.is_default) || systemConfigs[0];
    if (defaultSystemConfig) {
      setSystemToggleEnabled(true);
      await handleSystemConfigSelect(defaultSystemConfig.id);
    } else {
      message.error('没有可用的系统配置');
    }
  };

  // 处理系统配置选择
  const handleSystemConfigSelect = async (configId: string) => {
    if (!selectedCollectionId || !configId) return;

    try {
      setSaveLoading(true);
      console.log('🔄 选择系统配置:', configId);
      
      const response = await collectionService.setCollectionChunkingConfig(
        selectedCollectionId,
        {
          chunking_config_id: configId,
          custom_config: {
            inherit_from_global: true,
            custom_rules: {},
            override_settings: {}
          }
        }
      );
      
      if (response && response.success) {
        // 更新激活状态
        setActiveConfigId(configId);
        setActiveConfigType('system');
        setSystemToggleEnabled(true);
        
        // 找到对应的系统配置对象并更新显示
        const selectedSystemConfig = systemConfigs.find(c => c.id === configId);
        if (selectedSystemConfig) {
          setChunkingConfig({
            collection_id: selectedCollectionId,
            chunking_config: selectedSystemConfig,
            default_chunking_config_id: configId
          });
        }
        
        message.success('系统配置已激活');
        console.log('✅ 系统配置激活成功，状态已更新');
      } else {
        message.error('激活系统配置失败');
      }
    } catch (error) {
      console.error('❌ 激活系统配置失败:', error);
      message.error('激活系统配置失败');
    } finally {
      setSaveLoading(false);
    }
  };

  // 处理自定义配置切换
  const handleCustomConfigToggle = async (config: any, enabled: boolean) => {
    if (!selectedCollectionId) return;

    try {
      setSaveLoading(true);
      console.log('🔄 切换自定义配置:', config.id, enabled ? '激活' : '关闭');
      
      if (enabled) {
        // 激活这个自定义配置
        const response = await collectionService.setCollectionChunkingConfig(
          selectedCollectionId,
          {
            chunking_config_id: config.id,
            custom_config: {
              inherit_from_global: false,
              custom_rules: {},
              override_settings: {}
            }
          }
        );
        
        if (response && response.success) {
          setActiveConfigId(config.id);
          setActiveConfigType('custom');
          setSystemToggleEnabled(false); // 激活自定义配置时关闭系统toggle
          
          // 更新当前显示的配置信息
          setChunkingConfig({
            collection_id: selectedCollectionId,
            chunking_config: config,
            default_chunking_config_id: config.id
          });
          
          message.success(`自定义配置 "${config.name}" 已激活`);
          console.log('✅ 自定义配置激活成功，状态已更新');
        } else {
          message.error('激活自定义配置失败');
        }
      } else {
        // 关闭自定义配置时不做任何操作
        // 因为用户可能是在切换到另一个配置，避免干扰
        console.log('🔄 自定义配置关闭:', config.name, '等待用户选择其他配置');
        return; // 直接返回，不做任何状态更新
      }
    } catch (error) {
      console.error('❌ 切换自定义配置失败:', error);
      message.error('切换配置失败');
    } finally {
      setSaveLoading(false);
    }
  };

  // 设置知识库的切分配置（保留原有方法作为兼容）
  const handleSetChunkingConfig = async (configId: string) => {
    if (!selectedCollectionId) {
      console.warn('🚫 无法设置配置：未选择知识库');
      return;
    }

    try {
      setSaveLoading(true);
      console.log('🔄 开始设置切分配置:', {
        collectionId: selectedCollectionId,
        configId: configId
      });
      
      const response = await collectionService.setCollectionChunkingConfig(
        selectedCollectionId,
        {
          chunking_config_id: configId,
          custom_config: {
            inherit_from_global: true,
            custom_rules: {},
            override_settings: {}
          }
        }
      );
      
      console.log('📡 API响应:', response);
      
      if (response && response.success) {
        message.success('切分配置更新成功');
        console.log('✅ 配置更新成功，开始刷新');
        await fetchCollectionChunkingConfig(); // 刷新配置
        onConfigChange?.(response.data);
      } else {
        console.error('❌ API返回失败:', response);
        message.error(response?.message || '设置切分配置失败');
      }
    } catch (error) {
      console.error('❌ 设置切分配置失败:', error);
      message.error('设置切分配置失败: ' + (error.message || '未知错误'));
    } finally {
      setSaveLoading(false);
    }
  };

  // 删除自定义配置
  const handleDeleteCustomConfig = async (config: any) => {
    try {
      setSaveLoading(true);
      console.log('🗑️ 删除自定义配置:', config.id);

      // 调用删除API
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/api/v1/knowledge/chunking-configs/${config.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        message.success(`自定义配置 "${config.name}" 已删除`);
        
        // 如果删除的是当前激活的配置，需要切换到系统默认配置
        if (activeConfigId === config.id) {
          const defaultSystemConfig = systemConfigs.find(c => c.is_default) || systemConfigs[0];
          if (defaultSystemConfig) {
            await handleSystemConfigSelect(defaultSystemConfig.id);
          }
        }
        
        // 刷新配置列表
        await fetchCustomConfigs();
      } else {
        message.error('删除配置失败');
      }
    } catch (error) {
      console.error('❌ 删除配置失败:', error);
      message.error('删除配置失败');
    } finally {
      setSaveLoading(false);
    }
  };

  // 编辑自定义配置
  const handleEditCustomConfig = (config: any) => {
    setEditingConfig(config);
    setEditModalVisible(true);
  };

  // 编辑配置成功后的回调
  const handleEditConfigSuccess = async (updatedConfig: any) => {
    try {
      setEditModalVisible(false);
      setEditingConfig(null);
      message.success('配置更新成功');
      
      // 刷新配置列表
      await Promise.all([
        fetchCustomConfigs(),
        fetchCollectionChunkingConfig()
      ]);
    } catch (error) {
      console.error('❌ 处理编辑配置回调失败:', error);
      message.error('处理配置更新失败');
    }
  };

  // 创建知识库专属配置成功后的回调
  const handleCreateCollectionConfig = async (newConfig: any) => {
    try {
      setCreateModalVisible(false);
      message.success('创建知识库专属配置成功');
      
      // 刷新配置列表和当前配置
      await Promise.all([
        fetchSystemConfigs(),
        fetchCustomConfigs(),
        fetchCollectionChunkingConfig()
      ]);
      
      console.log('✅ 新建知识库专属配置成功:', newConfig);
    } catch (error) {
      console.error('❌ 处理新建配置回调失败:', error);
      message.error('处理配置更新失败');
    }
  };

  // 获取策略标签颜色
  const getStrategyColor = (strategy: string): string => {
    switch (strategy) {
      case 'semantic': return 'blue';
      case 'sliding_window': return 'green';
      case 'sentence': return 'orange';
      case 'paragraph': return 'purple';
      case 'recursive': return 'cyan';
      default: return 'default';
    }
  };

  // 获取策略图标
  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'semantic': return <BranchesOutlined />;
      case 'sliding_window': return <ThunderboltOutlined />;
      case 'sentence': return <ExperimentOutlined />;
      default: return <SettingOutlined />;
    }
  };


  useEffect(() => {
    if (selectedCollectionId) {
      fetchCollectionChunkingConfig();
      fetchSystemConfigs();
      fetchCustomConfigs();
    }
  }, [selectedCollectionId]);

  // 设置全局触发器，供顶部tab调用
  useEffect(() => {
    (window as any).triggerChunkingCreateForCollection = () => {
      setCreateModalVisible(true);
    };

    (window as any).triggerChunkingRefresh = () => {
      fetchCollectionChunkingConfig();
      fetchSystemConfigs();
      fetchCustomConfigs();
    };

    // 清理函数
    return () => {
      delete (window as any).triggerChunkingCreateForCollection;
      delete (window as any).triggerChunkingRefresh;
    };
  }, []);

  if (!selectedCollectionId) {
    return (
      <Alert
        message="请先选择一个知识库"
        type="info"
        showIcon
      />
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Spin spinning={loading}>
        <div style={{ height: '100%', overflowY: 'auto', padding: '0 4px' }}>
        {/* 头部信息 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {selectedCollectionInfo?.name || selectedCollectionInfo?.collection_name} - 切分配置
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                管理当前知识库的文档切分规则，系统默认规则和自定义规则互斥激活
              </Text>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchCollectionChunkingConfig();
                  fetchSystemConfigs();
                  fetchCustomConfigs();
                }}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </div>
        </div>

        {/* 系统默认配置选择 */}
        <Card 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <SettingOutlined style={{ color: '#1890ff' }} />
                系统默认切分规则
                {systemToggleEnabled && <Tag color="success" size="small">已启用</Tag>}
              </Space>
              <Switch
                checked={systemToggleEnabled}
                loading={saveLoading}
                onChange={handleSystemToggle}
                checkedChildren="启用"
                unCheckedChildren="禁用"
              />
            </div>
          }
          style={{ marginBottom: '20px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">
              选择系统内置的切分规则，适用于大多数场景
            </Text>
            <Select
              style={{ width: '100%', maxWidth: 400 }}
              placeholder="请先启用系统规则，然后选择具体配置"
              value={systemToggleEnabled && activeConfigType === 'system' ? activeConfigId : undefined}
              onChange={handleSystemConfigSelect}
              loading={saveLoading}
              disabled={!systemToggleEnabled}
              dropdownStyle={{ backgroundColor: '#ffffff' }}
              popupClassName="white-select-dropdown"
            >
              {systemConfigs.map((config: any) => (
                <Option key={config.id} value={config.id}>
                  <Space>
                    <span>{config.name}</span>
                    {config.is_default ? <Tag size="small" color="gold">默认</Tag> : null}
                    <Text type="secondary">- {config.description}</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Space>
        </Card>
        {/* 强制将 Select 下拉与选择器背景设为白色，避免暗色主题影响 */}
        <style>{`
          .white-select-dropdown,
          .white-select-dropdown .ant-select-item {
            background: #ffffff !important;
            color: #111827 !important; /* gray-900 */
          }
          .white-select-dropdown .ant-select-item-option-active {
            background: #f5f5f5 !important;
          }
          .white-select-dropdown .ant-select-item-option-selected {
            background: #e6f7ff !important;
            color: #111827 !important;
          }
          /* 选择器本体背景 */
          .ant-select-single .ant-select-selector {
            background: #ffffff !important;
            color: #111827 !important;
          }
          .ant-select-selection-placeholder {
            color: #6b7280 !important; /* gray-500 */
          }
        `}</style>

        {/* 自定义配置列表 */}
        <Card 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <ExperimentOutlined style={{ color: '#52c41a' }} />
                自定义切分规则
                <Tag color="cyan">{customConfigs.length}</Tag>
              </Space>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                创建自定义规则
              </Button>
            </div>
          }
          style={{ marginBottom: '20px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">
              您为此知识库创建的专属切分规则
            </Text>
            
            {customConfigs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {customConfigs.map((config: any) => {
                  const isActive = activeConfigType === 'custom' && activeConfigId === config.id;
                  
                  return (
                    <Card 
                      key={config.id}
                      size="small"
                      style={{ 
                        border: isActive ? '2px solid #52c41a' : '1px solid #d9d9d9',
                        backgroundColor: isActive ? '#f6ffed' : undefined 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Text strong>{config.name}</Text>
                            {isActive && <Tag color="success" size="small">激活</Tag>}
                            <Tag color="processing" size="small">{config.strategy}</Tag>
                          </div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {config.description || '暂无描述'} • {config.chunk_token_num} tokens • 重叠 {config.chunk_overlap}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Space size="small">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditCustomConfig(config)}
                              title="编辑配置"
                            />
                            <Popconfirm
                              title="确认删除"
                              description={`确定要删除配置 "${config.name}" 吗？此操作不可撤销。`}
                              onConfirm={() => handleDeleteCustomConfig(config)}
                              okText="删除"
                              cancelText="取消"
                              okButtonProps={{ danger: true }}
                            >
                              <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                danger
                                title="删除配置"
                              />
                            </Popconfirm>
                          </Space>
                          <Switch
                            checked={isActive}
                            loading={saveLoading}
                            onChange={(checked) => handleCustomConfigToggle(config, checked)}
                            checkedChildren="启用"
                            unCheckedChildren="禁用"
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text type="secondary">
                  暂无自定义配置，点击右上角"新建配置"创建专属规则
                </Text>
              </div>
            )}
          </Space>
        </Card>

        <Divider style={{ margin: '20px 0' }} />

        {/* 当前激活配置详情 */}
        {chunkingConfig?.chunking_config ? (
          <Card
            title={
              <Space>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                当前使用的切分配置
              </Space>
            }
            extra={
              <Tag
                icon={getStrategyIcon(chunkingConfig.chunking_config.strategy)}
                color={getStrategyColor(chunkingConfig.chunking_config.strategy)}
              >
                {chunkingConfig.chunking_config.strategy}
              </Tag>
            }
            style={{ marginBottom: '16px' }}
          >
            <Descriptions column={2} size="small">
              <Descriptions.Item label="配置名称">
                <Space>
                  <span style={{ fontWeight: 'bold' }}>
                    {chunkingConfig.chunking_config.name}
                  </span>
                  {chunkingConfig.chunking_config.is_active && (
                    <Tag icon={<CheckCircleOutlined />} color="success" size="small">
                      激活
                    </Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="配置描述">
                {chunkingConfig.chunking_config.description || '无描述'}
              </Descriptions.Item>
              <Descriptions.Item label="块大小">
                {chunkingConfig.chunking_config.chunk_token_num} tokens
              </Descriptions.Item>
              <Descriptions.Item label="最大大小">
                {chunkingConfig.chunking_config.max_token_num} tokens
              </Descriptions.Item>
              <Descriptions.Item label="重叠度">
                {chunkingConfig.chunking_config.chunk_overlap} tokens
              </Descriptions.Item>
              <Descriptions.Item label="分隔符">
                <code>{chunkingConfig.chunking_config.delimiter}</code>
              </Descriptions.Item>
              <Descriptions.Item label="分词器类型">
                {chunkingConfig.chunking_config.tokenizer_type}
              </Descriptions.Item>
              <Descriptions.Item label="保持结构">
                <Tag color={chunkingConfig.chunking_config.preserve_structure ? 'success' : 'default'}>
                  {chunkingConfig.chunking_config.preserve_structure ? '是' : '否'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        ) : (
          <Alert
            message="未找到切分配置"
            description="当前知识库还没有配置切分规则，请先设置一个切分配置。"
            type="warning"
            showIcon
            action={
              <Button size="small" type="primary" onClick={() => setEditModalVisible(true)}>
                设置配置
              </Button>
            }
          />
        )}
        </div>
      </Spin>


      {/* 新增知识库专属配置模态框 */}
      <CreateChunkingConfigModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateCollectionConfig}
        collectionId={selectedCollectionId}
        collectionName={selectedCollectionInfo?.name || selectedCollectionInfo?.collection_name}
      />

      {/* 编辑配置模态框 */}
      {editingConfig && (
        <CreateChunkingConfigModal
          visible={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingConfig(null);
          }}
          onSuccess={handleEditConfigSuccess}
          collectionId={selectedCollectionId}
          collectionName={selectedCollectionInfo?.name || selectedCollectionInfo?.collection_name}
          initialValues={editingConfig} // 传递初始值用于编辑
        />
      )}
    </div>
  );
};

export default CollectionChunkingPanel;
