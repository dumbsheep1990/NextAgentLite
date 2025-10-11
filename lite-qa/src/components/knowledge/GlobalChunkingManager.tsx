/**
 * 全局切分规则管理组件
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Tooltip,
  Popconfirm,
  Typography,
  Alert,
  Divider,
  Badge
} from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  ExperimentOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import CreateChunkingConfigModal from './CreateChunkingConfigModal';
import { chunkingConfigService } from '../../services/chunkingConfigService';
import { collectionService } from '../../services/collectionService';
import type { ChunkingConfig } from '../../services/chunkingConfigService';

const { Title, Text } = Typography;

interface GlobalChunkingManagerProps {
  onClose?: () => void;
}

const GlobalChunkingManager: React.FC<GlobalChunkingManagerProps> = ({ onClose }) => {
  const [configs, setConfigs] = useState<ChunkingConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // 初始化默认配置
  const handleInitializeDefaults = async () => {
    try {
      setLoading(true);
      await chunkingConfigService.initializeDefaults({ force: true, normalize: true });
      message.success('默认配置初始化成功');
      await fetchConfigs();
    } catch (error) {
      console.error('初始化默认切分配置失败:', error);
      message.error('初始化失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取切分配置列表
  const fetchConfigs = async () => {
    try {
      setLoading(true);
      
      // 直接使用chunking config service作为主要方法
      try {
        const response = await chunkingConfigService.getAllConfigs();
        
        if (Array.isArray(response)) {
          setConfigs(response);
          console.log('✅ 成功获取切分配置:', response.length, '个');
          return;
        }
      } catch (primaryError) {
        console.warn('从chunking config service获取配置失败，尝试备用方法:', primaryError);
        
        // 提供一个临时的默认配置列表，以便界面可以正常显示
        const defaultConfigs = [
          {
            id: 'default-semantic',
            name: '语义切分 (默认)',
            description: '基于语义理解进行智能切分',
            strategy: 'semantic',
            chunk_token_num: 400,
            max_token_num: 512,
            chunk_overlap: 50,
            delimiter: '.!?',
            tokenizer_type: 'simple',
            preserve_structure: true,
            semantic_threshold: 30,
            supported_formats: ['txt', 'md', 'pdf', 'docx'],
            is_default: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'sliding-window',
            name: '滑动窗口',
            description: '固定窗口大小滑动切分',
            strategy: 'sliding_window',
            chunk_token_num: 600,
            max_token_num: 768,
            chunk_overlap: 80,
            delimiter: '.!?',
            tokenizer_type: 'simple',
            preserve_structure: true,
            semantic_threshold: 25,
            supported_formats: ['txt', 'md', 'pdf', 'docx'],
            is_default: false,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setConfigs(defaultConfigs);
        message.warning('无法连接到后端服务，显示默认配置');
        return;
      }
      
    } catch (error) {
      console.error('获取切分配置失败:', error);
      message.error('获取切分配置失败，请检查网络连接');
      setConfigs([]); // 设置为空数组
    } finally {
      setLoading(false);
    }
  };

  // 设置默认配置
  const handleSetDefault = async (configId: string) => {
    try {
      await chunkingConfigService.setDefaultConfig(configId);
      message.success('设置默认配置成功');
      
      // 只更新状态，不重新获取数据，避免重排序
      setConfigs(prevConfigs => 
        prevConfigs.map(config => ({
          ...config,
          is_default: config.id === configId
        }))
      );
    } catch (error) {
      console.error('设置默认配置失败:', error);
      message.error('设置默认配置失败');
    }
  };

  // 删除配置
  const handleDeleteConfig = async (configId: string) => {
    try {
      await chunkingConfigService.deleteConfig(configId);
      message.success('删除配置成功');
      fetchConfigs(); // 刷新列表
    } catch (error) {
      console.error('删除配置失败:', error);
      message.error('删除配置失败');
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

  // 表格列配置
  const columns: ColumnsType<ChunkingConfig> = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ChunkingConfig) => (
        <Space>
          {record.is_default && (
            <StarFilled style={{ color: '#faad14', fontSize: '16px' }} />
          )}
          <span style={{ fontWeight: record.is_default ? '600' : 'normal' }}>
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: '切分策略',
      dataIndex: 'strategy',
      key: 'strategy',
      render: (strategy: string) => (
        <Tag
          icon={getStrategyIcon(strategy)}
          color={getStrategyColor(strategy)}
        >
          {strategy}
        </Tag>
      ),
    },
    {
      title: '块大小',
      dataIndex: 'chunk_token_num',
      key: 'chunk_token_num',
      render: (size: number) => `${size} tokens`,
    },
    {
      title: '重叠度',
      dataIndex: 'chunk_overlap',
      key: 'chunk_overlap',
      render: (overlap: number) => `${overlap} tokens`,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag
          icon={<CheckCircleOutlined />}
          color={isActive ? 'success' : 'default'}
        >
          {isActive ? '激活' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: ChunkingConfig) => (
        <Space size="middle">
          {!record.is_default && (
            <Tooltip title="设为默认">
              <Button
                type="text"
                size="small"
                icon={<StarOutlined />}
                onClick={() => handleSetDefault(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                // TODO: 实现编辑功能
                message.info('编辑功能开发中');
              }}
            />
          </Tooltip>
          {!record.is_default && (
            <Popconfirm
              title="确定删除此配置？"
              onConfirm={() => handleDeleteConfig(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchConfigs();
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 头部信息 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              全局切分规则库
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              管理系统全局的文档切分规则配置
            </Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchConfigs}
            >
              刷新
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={handleInitializeDefaults}
            >
              初始化默认配置
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              新建配置
            </Button>
          </Space>
        </div>
        
        <Alert
          message="每个知识库可以选择使用不同的切分规则，默认配置会应用于新创建的知识库"
          type="info"
          showIcon
          style={{ 
            marginTop: '16px',
            borderRadius: '6px',
            backgroundColor: '#f8faff',
            borderColor: '#d6e4ff'
          }}
        />
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* 配置列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条配置`,
          }}
          size="middle"
          tableLayout="fixed"
          rowClassName={(record) => record.is_default ? 'default-config-row' : ''}
          style={{ 
            textAlign: 'justify',
            textJustify: 'inter-ideograph'
          }}
        />
      </div>
      
      {/* 添加样式 */}
      <style>{`
        .default-config-row {
          background-color: #fff7e6 !important;
        }
        .default-config-row:hover td {
          background-color: #fff7e6 !important;
        }
        .default-config-row td {
          font-weight: 500;
        }
      `}</style>

      {/* 新建切分配置Modal */}
      <CreateChunkingConfigModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          fetchConfigs(); // 刷新列表
        }}
      />
    </div>
  );
};

export default GlobalChunkingManager;
