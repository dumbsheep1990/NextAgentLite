/**
 * 任务管理Modal - 展示知识库文档处理流程进度
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Card,
  Progress,
  Timeline,
  Typography,
  Spin,
  Row,
  Col,
  Statistic,
  Divider,
  Empty,
  Button,
  message,
  Space,
  Tag
} from 'antd';
import {
  CheckCircleOutlined,
  LoadingOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  DatabaseOutlined,
  SyncOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface TaskManagementModalProps {
  visible: boolean;
  onCancel: () => void;
  collectionId: string;
  collectionName: string;
}

interface ProcessingStats {
  total_documents: number;
  vectorized_count: number;
  vectorization_progress: number;
  qa_extraction_enabled: boolean;
  qa_pairs_extracted: number;
  qa_extraction_progress: number;
  processing_documents: string[];
  last_updated?: string;
}

const TaskManagementModal: React.FC<TaskManagementModalProps> = ({
  visible,
  onCancel,
  collectionId,
  collectionName
}) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 加载统计数据
  const loadStats = async () => {
    if (!collectionId) return;
    
    try {
      setLoading(true);
      
      // 获取知识库统计信息
      const response = await fetch(`/api/v1/collections/${collectionId}/statistics`);
      if (response.ok) {
        const data = await response.json();
        
        // 获取QA提取状态
        const qaResponse = await fetch(`/api/v1/collections/${collectionId}/qa-extraction/status`);
        const qaData = qaResponse.ok ? await qaResponse.json() : { enabled: false, total_pairs: 0 };
        
        // 组装统计数据
        const processStats: ProcessingStats = {
          total_documents: data.document_count || 0,
          vectorized_count: data.vectorized_count || 0,
          vectorization_progress: data.document_count > 0 
            ? Math.round((data.vectorized_count / data.document_count) * 100)
            : 0,
          qa_extraction_enabled: qaData.enabled || false,
          qa_pairs_extracted: qaData.total_pairs || 0,
          qa_extraction_progress: qaData.extraction_progress || 0,
          processing_documents: [],
          last_updated: data.last_updated
        };
        
        setStats(processStats);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 设置默认空数据
      setStats({
        total_documents: 0,
        vectorized_count: 0,
        vectorization_progress: 0,
        qa_extraction_enabled: false,
        qa_pairs_extracted: 0,
        qa_extraction_progress: 0,
        processing_documents: []
      });
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
    message.success('数据已刷新');
  };

  // 监听visible变化加载数据
  useEffect(() => {
    if (visible) {
      loadStats();
    }
  }, [visible, collectionId]);

  // 获取进度状态颜色
  const getProgressStatus = (progress: number) => {
    if (progress === 100) return 'success';
    if (progress > 0) return 'active';
    return 'normal';
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <InboxOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
      <div style={{ color: '#999', fontSize: 16 }}>
        <div>暂无处理任务</div>
        <div style={{ marginTop: 8, fontSize: 14 }}>上传文档后将自动开始处理流程</div>
      </div>
    </div>
  );

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlayCircleOutlined />
            <span>处理流程</span>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              - {collectionName}
            </Text>
          </div>
          <Button
            size="small"
            icon={<SyncOutlined spin={refreshing} />}
            onClick={handleRefresh}
            loading={refreshing}
            style={{ marginRight: 24 }}
          >
            刷新
          </Button>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      className="task-management-modal"
    >
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      ) : !stats || stats.total_documents === 0 ? (
        renderEmptyState()
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 总体进度统计 */}
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card size="small">
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text strong>文档向量化</Text>
                    <Tag color="blue" icon={<DatabaseOutlined />}>
                      {stats.vectorized_count} / {stats.total_documents}
                    </Tag>
                  </div>
                  <Progress
                    percent={stats.vectorization_progress}
                    status={getProgressStatus(stats.vectorization_progress)}
                    strokeColor="#1890ff"
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    已完成 {stats.vectorized_count} 个文档的向量化处理
                  </Text>
                </div>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card size="small">
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text strong>QA对提取</Text>
                    <Tag color={stats.qa_extraction_enabled ? 'green' : 'default'}>
                      {stats.qa_extraction_enabled ? '已启用' : '未启用'}
                    </Tag>
                  </div>
                  {stats.qa_extraction_enabled ? (
                    <>
                      <Progress
                        percent={stats.qa_extraction_progress}
                        status={getProgressStatus(stats.qa_extraction_progress)}
                        strokeColor="#52c41a"
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        已提取 {stats.qa_pairs_extracted} 个QA对
                      </Text>
                    </>
                  ) : (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        该知识库未启用QA自动提取功能
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0' }} />

          {/* Pipeline处理流程 */}
          <Card size="small" title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlayCircleOutlined />
              <span>文档处理流程</span>
            </div>
          }>
            <Timeline
              items={[
                {
                  color: stats.total_documents > 0 ? 'green' : 'gray',
                  dot: stats.total_documents > 0 ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
                  children: (
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>
                        文档上传
                        {stats.total_documents > 0 && (
                          <Tag color="green" style={{ marginLeft: 8 }}>已完成</Tag>
                        )}
                      </div>
                      <div style={{ color: '#666', fontSize: '13px' }}>
                        {stats.total_documents > 0 
                          ? `已上传 ${stats.total_documents} 个文档到知识库`
                          : '等待文档上传'}
                      </div>
                    </div>
                  )
                },
                {
                  color: stats.vectorization_progress === 100 ? 'green' : 
                         stats.vectorization_progress > 0 ? 'blue' : 'gray',
                  dot: stats.vectorization_progress === 100 ? <CheckCircleOutlined /> :
                       stats.vectorization_progress > 0 ? <LoadingOutlined /> : <ClockCircleOutlined />,
                  children: (
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>
                        文档分块与向量化
                        {stats.vectorization_progress === 100 && (
                          <Tag color="green" style={{ marginLeft: 8 }}>已完成</Tag>
                        )}
                        {stats.vectorization_progress > 0 && stats.vectorization_progress < 100 && (
                          <Tag color="blue" style={{ marginLeft: 8 }}>处理中 {stats.vectorization_progress}%</Tag>
                        )}
                      </div>
                      <div style={{ color: '#666', fontSize: '13px' }}>
                        {stats.vectorization_progress > 0
                          ? `已完成 ${stats.vectorized_count} / ${stats.total_documents} 个文档的向量化`
                          : '等待向量化处理'}
                      </div>
                      {stats.vectorization_progress > 0 && stats.vectorization_progress < 100 && (
                        <Progress 
                          percent={stats.vectorization_progress} 
                          size="small" 
                          showInfo={false}
                          style={{ marginTop: 8, marginBottom: 0 }}
                        />
                      )}
                    </div>
                  )
                },
                {
                  color: !stats.qa_extraction_enabled ? 'gray' :
                         stats.qa_extraction_progress === 100 ? 'green' :
                         stats.qa_extraction_progress > 0 ? 'orange' : 'gray',
                  dot: !stats.qa_extraction_enabled ? <ClockCircleOutlined /> :
                       stats.qa_extraction_progress === 100 ? <CheckCircleOutlined /> :
                       stats.qa_extraction_progress > 0 ? <LoadingOutlined /> : <QuestionCircleOutlined />,
                  children: (
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>
                        QA对提取
                        {!stats.qa_extraction_enabled && (
                          <Tag style={{ marginLeft: 8 }}>未启用</Tag>
                        )}
                        {stats.qa_extraction_enabled && stats.qa_extraction_progress === 100 && (
                          <Tag color="green" style={{ marginLeft: 8 }}>已完成</Tag>
                        )}
                        {stats.qa_extraction_enabled && stats.qa_extraction_progress > 0 && stats.qa_extraction_progress < 100 && (
                          <Tag color="orange" style={{ marginLeft: 8 }}>提取中 {stats.qa_extraction_progress}%</Tag>
                        )}
                      </div>
                      <div style={{ color: '#666', fontSize: '13px' }}>
                        {!stats.qa_extraction_enabled 
                          ? '此知识库未启用自动QA提取功能'
                          : stats.qa_pairs_extracted > 0
                            ? `已提取 ${stats.qa_pairs_extracted} 个QA对`
                            : '等待QA提取处理'}
                      </div>
                      {stats.qa_extraction_enabled && stats.qa_extraction_progress > 0 && stats.qa_extraction_progress < 100 && (
                        <Progress 
                          percent={stats.qa_extraction_progress} 
                          size="small" 
                          showInfo={false}
                          style={{ marginTop: 8, marginBottom: 0 }}
                        />
                      )}
                    </div>
                  )
                },
                {
                  color: (stats.vectorization_progress === 100 || 
                         (stats.qa_extraction_enabled && stats.qa_extraction_progress === 100)) ? 'green' : 'gray',
                  dot: (stats.vectorization_progress === 100 || 
                       (stats.qa_extraction_enabled && stats.qa_extraction_progress === 100)) ? 
                       <CheckCircleOutlined /> : <SyncOutlined />,
                  children: (
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>
                        处理完成
                        {(stats.vectorization_progress === 100 || 
                         (stats.qa_extraction_enabled && stats.qa_extraction_progress === 100)) && (
                          <Tag color="green" style={{ marginLeft: 8 }}>已完成</Tag>
                        )}
                      </div>
                      <div style={{ color: '#666', fontSize: '13px' }}>
                        {stats.vectorization_progress === 100
                          ? '所有文档已完成处理，可以开始检索使用'
                          : '等待所有任务完成'}
                      </div>
                    </div>
                  )
                }
              ]}
            />
          </Card>

          {/* 最后更新时间 */}
          {stats.last_updated && (
            <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
              最后更新: {new Date(stats.last_updated).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default TaskManagementModal;
