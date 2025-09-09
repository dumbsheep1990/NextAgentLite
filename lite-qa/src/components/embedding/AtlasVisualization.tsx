/**
 * Embedding Atlas 可视化组件
 * 集成Apple Embedding Atlas到NextAgentLite系统
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  Card, 
  Spin, 
  Alert, 
  Space, 
  Select, 
  Statistic, 
  Row, 
  Col,
  message,
  Modal,
  Tooltip,
  Tag,
  Progress
} from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined, 
  EyeOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { atlasService } from '../../services/atlasService';
import type { AtlasDataStats, AtlasStatus } from '../../services/atlasService';
import { useKnowledgeStore } from '../../stores/knowledgeStore';

interface AtlasVisualizationProps {
  className?: string;
}

export const AtlasVisualization: React.FC<AtlasVisualizationProps> = ({ 
  className = '' 
}) => {
  // 状态管理
  const [atlasStatus, setAtlasStatus] = useState<AtlasStatus>({ 
    running: false, 
    services: [], 
    count: 0 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataStats, setDataStats] = useState<AtlasDataStats | null>(null);
  const [dataScope, setDataScope] = useState<'all' | 'selected'>('all');
  const [port, setPort] = useState(8081);
  const [showDetails, setShowDetails] = useState(false);

  // 从知识库store获取状态
  const { documents, selectedDocuments } = useKnowledgeStore();

  // 检查Atlas服务状态
  const checkAtlasStatus = useCallback(async () => {
    try {
      const response = await atlasService.getStatus();
      if (response.success) {
        setAtlasStatus(response.data);
      }
    } catch (err) {
      console.error('检查Atlas状态失败:', err);
    }
  }, []);

  // 获取数据统计
  const fetchDataStats = useCallback(async () => {
    try {
      const response = await atlasService.getDataStatistics();
      if (response.success) {
        setDataStats(response.data);
      }
    } catch (err) {
      console.error('获取数据统计失败:', err);
    }
  }, []);

  // 初始化和定时检查
  useEffect(() => {
    checkAtlasStatus();
    fetchDataStats();
    
    const interval = setInterval(() => {
      checkAtlasStatus();
    }, 5000); // 每5秒检查一次状态

    return () => clearInterval(interval);
  }, [checkAtlasStatus, fetchDataStats]);

  // 启动Atlas服务
  const handleStartAtlas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const documentIds = dataScope === 'selected' ? selectedDocuments : undefined;
      
      // 验证数据
      if (dataScope === 'selected' && (!selectedDocuments || selectedDocuments.length === 0)) {
        message.warning('请先选择要可视化的文档');
        setLoading(false);
        return;
      }

      const result = await atlasService.startService({
        document_ids: documentIds,
        port: port,
        limit: 10000
      });
      
      if (result.success) {
        message.success('Atlas服务启动成功！');
        await checkAtlasStatus(); // 立即更新状态
      } else {
        setError(result.message || 'Atlas服务启动失败');
        message.error(result.message || 'Atlas服务启动失败');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Atlas服务启动失败';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 停止Atlas服务
  const handleStopAtlas = async () => {
    setLoading(true);
    
    try {
      const result = await atlasService.stopService(port);
      
      if (result.success) {
        message.success('Atlas服务已停止');
        await checkAtlasStatus(); // 立即更新状态
      } else {
        message.error(result.message || 'Atlas服务停止失败');
      }
    } catch (err: any) {
      message.error(err.message || 'Atlas服务停止失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开Atlas界面
  const handleOpenAtlas = (serviceUrl: string) => {
    window.open(serviceUrl, '_blank', 'noopener,noreferrer');
  };

  // 渲染服务状态
  const renderServiceStatus = () => {
    if (atlasStatus.running && atlasStatus.services.length > 0) {
      return (
        <Alert
          message="Atlas可视化服务正在运行"
          description={
            <div>
              {atlasStatus.services.map((service, index) => (
                <div key={index} className="mb-2">
                  <Tag color="green">端口 {service.port}</Tag>
                  <Tag>PID {service.pid}</Tag>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenAtlas(service.url);
                    }}
                    className="ml-2"
                  >
                    <LinkOutlined /> {service.url}
                  </a>
                </div>
              ))}
            </div>
          }
          type="success"
          showIcon
          action={
            <Space>
              {atlasStatus.services.length > 0 && (
                <Button 
                  size="small" 
                  icon={<EyeOutlined />}
                  onClick={() => handleOpenAtlas(atlasStatus.services[0].url)}
                >
                  打开可视化
                </Button>
              )}
              <Button 
                size="small" 
                danger 
                icon={<StopOutlined />}
                onClick={handleStopAtlas}
                loading={loading}
              >
                停止服务
              </Button>
            </Space>
          }
        />
      );
    } else {
      return (
        <Alert
          message="Atlas可视化服务未启动"
          description="配置参数后点击启动按钮开始向量可视化分析"
          type="info"
          showIcon
        />
      );
    }
  };

  // 渲染数据统计
  const renderDataStats = () => {
    if (!dataStats) return null;

    return (
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Statistic
            title="总文档数"
            value={dataStats.total_documents}
            prefix={<DatabaseOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="文档块数"
            value={dataStats.total_chunks}
            prefix={<BarChartOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="已向量化"
            value={dataStats.vectorized_chunks}
            suffix={`/ ${dataStats.total_chunks}`}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="向量化率"
            value={dataStats.vectorization_rate}
            precision={1}
            suffix="%"
          />
          <Progress 
            percent={dataStats.vectorization_rate} 
            size="small" 
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </Col>
      </Row>
    );
  };

  return (
    <div className={`atlas-visualization ${className}`}>
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            Embedding Atlas 向量可视化
            <Tooltip title="基于Apple开源的高性能向量可视化工具">
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                checkAtlasStatus();
                fetchDataStats();
              }}
              size="small"
            >
              刷新状态
            </Button>
            <Button 
              type="link" 
              onClick={() => setShowDetails(true)}
              size="small"
            >
              查看详情
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" className="w-full" size="large">
          
          {/* 数据统计 */}
          {renderDataStats()}
          
          {/* 配置选项 */}
          <Card size="small" title="配置选项">
            <Row gutter={16} align="middle">
              <Col span={8}>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">可视化范围:</label>
                  <Select 
                    value={dataScope} 
                    onChange={setDataScope}
                    style={{ width: '100%' }}
                    disabled={atlasStatus.running}
                  >
                    <Select.Option value="all">
                      所有文档 ({dataStats?.total_documents || 0})
                    </Select.Option>
                    <Select.Option value="selected">
                      选中文档 ({selectedDocuments.length})
                    </Select.Option>
                  </Select>
                </div>
              </Col>
              <Col span={8}>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">服务端口:</label>
                  <Select 
                    value={port}
                    onChange={setPort}
                    style={{ width: '100%' }}
                    disabled={atlasStatus.running}
                  >
                    <Select.Option value={8081}>8081 (默认)</Select.Option>
                    <Select.Option value={8082}>8082</Select.Option>
                    <Select.Option value={8083}>8083</Select.Option>
                  </Select>
                </div>
              </Col>
              <Col span={8}>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">状态:</label>
                  <div>
                    {atlasStatus.running ? (
                      <Tag color="green">运行中 ({atlasStatus.count} 个服务)</Tag>
                    ) : (
                      <Tag color="default">未启动</Tag>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 服务状态 */}
          {renderServiceStatus()}

          {/* 错误信息 */}
          {error && (
            <Alert
              message="错误"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}

          {/* 控制按钮 */}
          <div className="flex justify-center">
            {!atlasStatus.running || atlasStatus.services.length === 0 ? (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                loading={loading}
                onClick={handleStartAtlas}
                size="large"
                disabled={dataScope === 'selected' && selectedDocuments.length === 0}
              >
                启动可视化服务
              </Button>
            ) : (
              <Space size="large">
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => handleOpenAtlas(atlasStatus.services[0].url)}
                  size="large"
                  type="primary"
                >
                  打开可视化界面
                </Button>
                <Button
                  danger
                  icon={<StopOutlined />}
                  loading={loading}
                  onClick={handleStopAtlas}
                  size="large"
                >
                  停止服务
                </Button>
              </Space>
            )}
          </div>

          {/* 使用说明 */}
          <Card size="small" className="bg-gray-50">
            <div className="text-sm">
              <h4 className="font-medium mb-3 flex items-center">
                <InfoCircleOutlined className="mr-2" />
                使用说明
              </h4>
              <div className="space-y-2 text-gray-600">
                <div>• <strong>启动服务</strong>: 系统将自动处理向量数据并启动Atlas可视化服务</div>
                <div>• <strong>打开界面</strong>: 在新窗口中打开交互式可视化界面，支持缩放、搜索等操作</div>
                <div>• <strong>数据范围</strong>: 可选择可视化所有文档或仅选中的文档</div>
                <div>• <strong>性能提示</strong>: 大量数据可能需要较长加载时间，建议先选择部分文档测试</div>
                <div>• <strong>端口管理</strong>: 可在不同端口启动多个Atlas实例进行对比分析</div>
              </div>
            </div>
          </Card>
        </Space>
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="Atlas服务详情"
        open={showDetails}
        onCancel={() => setShowDetails(false)}
        footer={[
          <Button key="close" onClick={() => setShowDetails(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <Space direction="vertical" className="w-full">
          <Card size="small" title="数据统计">
            <pre className="text-xs bg-gray-50 p-3 rounded">
              {JSON.stringify(dataStats, null, 2)}
            </pre>
          </Card>
          
          <Card size="small" title="服务状态">
            <pre className="text-xs bg-gray-50 p-3 rounded">
              {JSON.stringify(atlasStatus, null, 2)}
            </pre>
          </Card>
        </Space>
      </Modal>
    </div>
  );
};