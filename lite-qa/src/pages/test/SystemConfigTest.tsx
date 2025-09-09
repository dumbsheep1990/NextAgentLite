/**
 * 系统配置测试页面
 */
import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Spin, Alert, Descriptions, Tag, Space } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { bffService } from '../../services/bffService';
import type { SystemConfigResponse } from '../../types';

const { Title, Text } = Typography;

export const SystemConfigTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<SystemConfigResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // console.log('🔄 开始获取系统配置...');
      const response = await bffService.getSystemConfig();
      // console.log('✅ 系统配置获取成功:', response);
      
      setConfig(response);
    } catch (err: any) {
      console.error('❌ 获取系统配置失败:', err);
      setError(err.message || '获取系统配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'warning': return 'orange';
      case 'error': return 'red';
      case 'partial': return 'blue';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleOutlined className="text-green-500" />;
      case 'warning': return <ExclamationCircleOutlined className="text-orange-500" />;
      case 'error': return <ExclamationCircleOutlined className="text-red-500" />;
      default: return <ExclamationCircleOutlined className="text-blue-500" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>系统配置测试</Title>
        <Text type="secondary">测试前端BFF层获取系统配置的功能</Text>
      </div>

      <Space direction="vertical" size="large" className="w-full">
        {/* 操作按钮 */}
        <Card size="small">
          <Space>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={fetchSystemConfig}
            >
              重新获取配置
            </Button>
            <Text type="secondary">点击按钮测试API调用</Text>
          </Space>
        </Card>

        {/* 错误信息 */}
        {error && (
          <Alert
            message="获取配置失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        {/* 加载状态 */}
        {loading && (
          <Card>
            <div className="text-center py-8">
              <Spin size="large" />
              <div className="mt-4">
                <Text>正在获取系统配置...</Text>
              </div>
            </div>
          </Card>
        )}

        {/* 配置信息展示 */}
        {config && !loading && (
          <>
            {/* 配置段落 */}
            <Card title="配置段落" size="small">
              <Space direction="vertical" size="middle" className="w-full">
                {config.sections.map((section) => (
                  <Card key={section.name} size="small" className="border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {getStatusIcon(section.status)}
                        <Title level={5} className="mb-0 ml-2">
                          {section.title}
                        </Title>
                      </div>
                      <Tag color={getStatusColor(section.status)}>
                        {section.status}
                      </Tag>
                    </div>
                    
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="名称">{section.name}</Descriptions.Item>
                      <Descriptions.Item label="描述">{section.description}</Descriptions.Item>
                      <Descriptions.Item label="可编辑">
                        {section.editable ? '是' : '否'}
                      </Descriptions.Item>
                      <Descriptions.Item label="需要重启">
                        {section.requires_restart ? '是' : '否'}
                      </Descriptions.Item>
                    </Descriptions>

                    {/* 设置详情 */}
                    <div className="mt-3">
                      <Text strong>设置详情:</Text>
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <pre className="text-xs">
                          {JSON.stringify(section.settings, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
            </Card>

            {/* 服务状态 */}
            <Card title="服务状态" size="small">
              <Space direction="vertical" size="small" className="w-full">
                {config.service_status.map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center">
                      {getStatusIcon(service.status)}
                      <div className="ml-3">
                        <Text strong>{service.name}</Text>
                        <div>
                          <Text type="secondary" className="text-sm">
                            {service.message}
                          </Text>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Tag color={getStatusColor(service.status)}>
                        {service.status}
                      </Tag>
                      {service.has_fallback && (
                        <div className="mt-1">
                          <Tag color={service.fallback_active ? 'orange' : 'default'} size="small">
                            {service.fallback_active ? '降级模式' : '有降级'}
                          </Tag>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Space>
            </Card>

            {/* 降级配置 */}
            {Object.keys(config.fallback_configs).length > 0 && (
              <Card title="降级配置" size="small">
                <div className="p-2 bg-yellow-50 rounded">
                  <pre className="text-xs">
                    {JSON.stringify(config.fallback_configs, null, 2)}
                  </pre>
                </div>
              </Card>
            )}

            {/* 环境变量 */}
            {config.environment_variables.length > 0 && (
              <Card title="环境变量" size="small">
                <Space wrap>
                  {config.environment_variables.map((envVar) => (
                    <Tag key={envVar} color="blue">{envVar}</Tag>
                  ))}
                </Space>
              </Card>
            )}

            {/* 原始数据 */}
            <Card title="原始响应数据" size="small">
              <div className="p-2 bg-gray-50 rounded max-h-64 overflow-y-auto">
                <pre className="text-xs">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </div>
            </Card>
          </>
        )}
      </Space>
    </div>
  );
};