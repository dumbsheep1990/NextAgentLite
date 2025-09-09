/**
 * 团队协调与性能分析组件 - 展示团队执行的性能指标和统计数据
 */
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Typography, Spin, Alert, Button, Drawer } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  BarChartOutlined,
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { teamService } from '../../services/teamService';

const { Text } = Typography;

interface TeamPerformanceAnalyzerProps {
  executionId: string;
}

interface PerformanceData {
  execution_id: string;
  team_name: string;
  status: string;
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  success_rate: number;
  efficiency_rate: number;
  total_duration_ms: number;
  avg_step_duration_ms: number;
  coordinator_id: string;
  coordination_mode: string;
  member_calls: Array<{
    member_id: string;
    member_name: string;
    status: string;
    duration_ms: number;
    confidence: number;
    error_message?: string;
  }>;
}

const TeamPerformanceAnalyzer: React.FC<TeamPerformanceAnalyzerProps> = ({ executionId }) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取性能数据
  useEffect(() => {
    if (!executionId) return;

    const fetchPerformanceData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('[PERFORMANCE] 开始获取执行性能数据:', executionId);
        const data = await teamService.getExecutionPerformance(executionId);
        console.log('[PERFORMANCE] 获取到性能数据:', data);
        setPerformanceData(data);
      } catch (err) {
        console.error('[PERFORMANCE] 获取性能数据失败:', err);
        setError('获取性能数据失败');
      } finally {
        setLoading(false);
      }
    };

    // 延迟1秒后获取数据，确保对话已经保存到数据库
    const timer = setTimeout(fetchPerformanceData, 1000);
    return () => clearTimeout(timer);
  }, [executionId]);

  // 格式化时间显示
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (!executionId) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TeamOutlined style={{ color: '#f97316' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>团队协调与性能分析</span>
            <Tag 
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '10px'
              }}
            >
              实时监控
            </Tag>
          </div>
        }
        style={{
          background: 'linear-gradient(135deg, rgba(255, 247, 237, 0.8) 0%, rgba(254, 243, 199, 0.9) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          boxShadow: '0 2px 8px rgba(249, 115, 22, 0.08)'
        }}
        headStyle={{
          background: 'transparent',
          borderBottom: '1px solid rgba(249, 115, 22, 0.1)'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '12px', color: '#6b7280' }}>
              正在加载性能数据...
            </div>
          </div>
        ) : error ? (
          <Alert
            message="数据加载失败"
            description={error}
            type="warning"
            showIcon
            style={{ margin: '8px 0' }}
          />
        ) : performanceData ? (
          <>
            {/* 顶部统计卡片 */}
            <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
              <Col xs={12} sm={6}>
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                    {performanceData.total_steps}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    总执行步骤
                  </div>
                </div>
              </Col>
              
              <Col xs={12} sm={6}>
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%)',
                  borderRadius: '8px',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>
                    {performanceData.completed_steps}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    成功完成
                  </div>
                </div>
              </Col>
              
              <Col xs={12} sm={6}>
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
                  borderRadius: '8px',
                  border: '1px solid rgba(249, 115, 22, 0.2)'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#f97316' }}>
                    {performanceData.total_duration_ms ? formatDuration(performanceData.total_duration_ms) : 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    总执行时间
                  </div>
                </div>
              </Col>
              
              <Col xs={12} sm={6}>
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
                  borderRadius: '8px',
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
                    {performanceData.coordinator_id}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    协调器ID
                  </div>
                </div>
              </Col>
            </Row>
            
            {/* 底部性能指标 */}
            <Row gutter={[16, 16]}>
              {/* 执行成功率 */}
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                    执行成功率
                  </div>
                  <Progress
                    type="circle"
                    percent={performanceData.success_rate}
                    size={80}
                    strokeColor="#22c55e"
                    trailColor="rgba(34, 197, 94, 0.1)"
                    format={(percent) => (
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#22c55e' }}>
                        {percent}%
                      </span>
                    )}
                  />
                </div>
              </Col>
              
              {/* 执行效率 */}
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                    执行效率
                  </div>
                  <Progress
                    type="circle"
                    percent={performanceData.efficiency_rate}
                    size={80}
                    strokeColor="#f97316"
                    trailColor="rgba(249, 115, 22, 0.1)"
                    format={(percent) => (
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#f97316' }}>
                        {percent}%
                      </span>
                    )}
                  />
                </div>
              </Col>
              
              {/* 协调模式 */}
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                    协调模式
                  </div>
                  <Tag 
                    style={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '12px',
                      padding: '4px 12px',
                      marginBottom: '8px'
                    }}
                  >
                    {performanceData.coordination_mode}
                  </Tag>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    <div>平均步骤时间</div>
                    <div style={{ fontWeight: 600, color: '#f97316' }}>
                      {performanceData.avg_step_duration_ms ? formatDuration(performanceData.avg_step_duration_ms) : 'N/A'}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    <div>失败步骤</div>
                    <div style={{ fontWeight: 600, color: performanceData.failed_steps > 0 ? '#ef4444' : '#22c55e' }}>
                      {performanceData.failed_steps}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
            暂无性能数据
          </div>
        )}
      </Card>
      
      {/* Team溯源按钮 */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <TeamSourceButton 
          executionId={executionId} 
          memberCount={performanceData?.member_calls?.length || 6}
        />
      </div>
    </div>
  );
};

// Team溯源按钮组件
interface TeamSourceButtonProps {
  executionId: string;
  memberCount: number;
}

const TeamSourceButton: React.FC<TeamSourceButtonProps> = ({ executionId, memberCount }) => {
  const [sourceDrawerVisible, setSourceDrawerVisible] = useState(false);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleShowSource = async () => {
    setSourceDrawerVisible(true);
    setLoading(true);
    
    try {
      // 获取团队执行的详细信息作为溯源数据
      console.log('[TEAM_SOURCE] 获取团队溯源数据:', executionId);
      const performanceData = await teamService.getExecutionPerformance(executionId);
      
      // 转换为溯源数据格式
      const sources = performanceData.member_calls?.map((call: any, index: number) => ({
        id: call.member_id,
        title: call.member_name,
        type: 'agent_execution',
        content: `执行状态: ${call.status}, 耗时: ${call.duration_ms}ms, 置信度: ${(call.confidence * 100).toFixed(1)}%`,
        source: call.member_id,
        score: call.confidence,
        metadata: {
          duration: call.duration_ms,
          status: call.status,
          error: call.error_message
        }
      })) || [];
      
      setSourceData(sources);
    } catch (error) {
      console.error('[TEAM_SOURCE] 获取溯源数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="default"
        icon={<SearchOutlined />}
        onClick={handleShowSource}
        style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '20px',
          color: '#f97316',
          fontWeight: 500,
          padding: '4px 16px',
          height: '32px'
        }}
      >
        Team溯源 ({memberCount}个Agent)
      </Button>
      
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TeamOutlined style={{ color: '#f97316' }} />
            <span>Team执行溯源</span>
            <Tag style={{ background: '#f97316', color: 'white', border: 'none' }}>
              {memberCount}个Agent
            </Tag>
          </div>
        }
        placement="right"
        width={480}
        onClose={() => setSourceDrawerVisible(false)}
        open={sourceDrawerVisible}
        destroyOnClose
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#6b7280' }}>
              正在加载溯源数据...
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
              显示团队执行过程中各个Agent的详细信息和执行状态
            </div>
            
            {sourceData.map((source, index) => (
              <Card 
                key={source.id}
                size="small"
                style={{ 
                  marginBottom: '12px',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '8px'
                }}
                bodyStyle={{ padding: '12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: source.metadata.status === 'completed' 
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {source.metadata.status === 'completed' ? '✓' : '✗'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#1f2937' }}>
                      {source.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      {source.source}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#4b5563',
                  background: 'rgba(249, 250, 251, 0.8)',
                  padding: '8px',
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}>
                  {source.content}
                </div>
                
                {source.metadata.error && (
                  <div style={{
                    fontSize: '11px',
                    color: '#ef4444',
                    background: 'rgba(254, 242, 242, 0.8)',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(248, 113, 113, 0.3)'
                  }}>
                    错误: {source.metadata.error}
                  </div>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '8px'
                }}>
                  <Tag 
                    color={source.metadata.status === 'completed' ? 'success' : 'error'}
                    style={{ fontSize: '10px' }}
                  >
                    {source.metadata.status.toUpperCase()}
                  </Tag>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                    {source.metadata.duration}ms
                  </div>
                </div>
              </Card>
            ))}
            
            {sourceData.length === 0 && !loading && (
              <div style={{ 
                textAlign: 'center', 
                color: '#9ca3af', 
                fontSize: '14px',
                padding: '40px 20px'
              }}>
                <EyeOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                <div>暂无溯源数据</div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
};

export default TeamPerformanceAnalyzer;