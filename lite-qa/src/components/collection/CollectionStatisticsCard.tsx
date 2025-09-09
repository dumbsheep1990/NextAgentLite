/**
 * 知识库统计卡片组件
 */
import React from 'react';
import {
  Card,
  Statistic,
  Progress,
  Row,
  Col,
  Typography,
  Tag,
  Tooltip,
  Space
} from 'antd';
import {
  FileTextOutlined,
  CloudServerOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import type { CollectionStatistics } from '../../services/collectionService';

const { Text } = Typography;

interface CollectionStatisticsCardProps {
  statistics: CollectionStatistics;
  loading?: boolean;
  showDetails?: boolean;
}

const CollectionStatisticsCard: React.FC<CollectionStatisticsCardProps> = ({
  statistics,
  loading = false,
  showDetails = true
}) => {
  
  // 计算向量化率
  const vectorizationRate = statistics.document_count > 0 
    ? (statistics.vectorized_count / statistics.document_count * 100) 
    : 0;

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // 格式化处理时间
  const formatProcessingTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}min`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  return (
    <Card 
      size="small" 
      loading={loading}
      className="w-full"
    >
      {/* 主要统计指标 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} sm={6}>
          <Statistic
            title="文档总数"
            value={statistics.document_count}
            prefix={<FileTextOutlined className="text-blue-500" />}
            valueStyle={{ fontSize: '16px' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="已向量化"
            value={statistics.vectorized_count}
            prefix={<CloudServerOutlined className="text-green-500" />}
            valueStyle={{ fontSize: '16px' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="存储大小"
            value={formatFileSize(statistics.total_size)}
            prefix={<DatabaseOutlined className="text-purple-500" />}
            valueStyle={{ fontSize: '16px' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="平均处理时间"
            value={formatProcessingTime(statistics.avg_processing_time)}
            prefix={<ClockCircleOutlined className="text-orange-500" />}
            valueStyle={{ fontSize: '16px' }}
          />
        </Col>
      </Row>

      {/* 向量化进度 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <Text strong>向量化进度</Text>
          <Text className="text-gray-500">
            {vectorizationRate.toFixed(1)}% 
            ({statistics.vectorized_count}/{statistics.document_count})
          </Text>
        </div>
        <Progress
          percent={vectorizationRate}
          strokeColor={{
            '0%': '#ff7875',
            '50%': '#ffa940',
            '100%': '#73d13d',
          }}
          trailColor="#f0f0f0"
        />
      </div>

      {showDetails && (
        <>
          {/* 状态分布 */}
          {statistics.status_distribution && Object.keys(statistics.status_distribution).length > 0 && (
            <div className="mb-4">
              <Text strong className="block mb-2">文档状态分布</Text>
              <Space wrap>
                {Object.entries(statistics.status_distribution).map(([status, count]) => {
                  const getStatusConfig = (status: string) => {
                    switch (status) {
                      case 'vectorized':
                        return { color: 'green', icon: <CheckCircleOutlined />, text: '已完成' };
                      case 'processing':
                        return { color: 'blue', icon: <LoadingOutlined />, text: '处理中' };
                      case 'pending':
                        return { color: 'orange', icon: <ClockCircleOutlined />, text: '等待中' };
                      case 'failed':
                        return { color: 'red', icon: <ExclamationCircleOutlined />, text: '失败' };
                      default:
                        return { color: 'default', icon: <FileTextOutlined />, text: status };
                    }
                  };
                  
                  const config = getStatusConfig(status);
                  return (
                    <Tooltip key={status} title={`${config.text}: ${count} 个文档`}>
                      <Tag color={config.color} className="cursor-default">
                        {config.icon} {config.text} ({count as number})
                      </Tag>
                    </Tooltip>
                  );
                })}
              </Space>
            </div>
          )}

          {/* 元数据分布 */}
          {statistics.metadata_distribution && Object.keys(statistics.metadata_distribution).length > 0 && (
            <div>
              <Text strong className="block mb-2">元数据字段分布</Text>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(statistics.metadata_distribution).slice(0, 8).map(([field, count]) => (
                  <div key={field} className="flex justify-between items-center text-sm">
                    <Text className="text-gray-600">{field}:</Text>
                    <Tag size="small">{count as number}</Tag>
                  </div>
                ))}
              </div>
              {Object.keys(statistics.metadata_distribution).length > 8 && (
                <Text className="text-gray-500 text-xs block mt-2">
                  还有 {Object.keys(statistics.metadata_distribution).length - 8} 个字段...
                </Text>
              )}
            </div>
          )}

          {/* 最后活动时间 */}
          {statistics.last_activity && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <Text className="text-gray-500 text-xs">
                最后活动: {new Date(statistics.last_activity).toLocaleString('zh-CN')}
              </Text>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default CollectionStatisticsCard;