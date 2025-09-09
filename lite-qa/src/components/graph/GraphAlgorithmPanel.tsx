/**
 * 图谱算法控制面板 - NetworkX集成
 */
import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Select, 
  InputNumber, 
  Table, 
  Tag, 
  Tabs, 
  Spin,
  message,
  Tooltip,
  Progress
} from 'antd';
import { 
  ThunderboltOutlined,
  ClusterOutlined,
  NodeIndexOutlined,
  AimOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useGraphStore } from '../../stores/graphStore';

const { Option } = Select;
const { TabPane } = Tabs;

interface GraphAlgorithmPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const GraphAlgorithmPanel: React.FC<GraphAlgorithmPanelProps> = ({
  visible,
  onClose
}) => {
  const {
    nodes,
    edges,
    isLoading,
    algorithmResults,
    calculatePageRank,
    detectCommunities,
    calculateCentrality,
    findShortestPath,
    getSimilarNodes,
    focusOnNode
  } = useGraphStore();

  const [activeAlgorithm, setActiveAlgorithm] = useState<string>('pagerank');
  const [algorithmParams, setAlgorithmParams] = useState<any>({
    pagerank: { damping: 0.85, iterations: 100 },
    centrality: { type: 'pagerank', limit: 20 },
    communities: { algorithm: 'louvain' },
    path: { source: '', target: '' },
    similarity: { nodeId: '', limit: 10 }
  });

  // PageRank计算
  const handlePageRank = async () => {
    try {
      await calculatePageRank(algorithmParams.pagerank);
      message.success('PageRank计算完成');
    } catch (error) {
      message.error('PageRank计算失败');
    }
  };

  // 社区检测
  const handleCommunityDetection = async () => {
    try {
      await detectCommunities(algorithmParams.communities.algorithm);
      message.success('社区检测完成');
    } catch (error) {
      message.error('社区检测失败');
    }
  };

  // 中心性计算
  const handleCentralityCalculation = async () => {
    try {
      await calculateCentrality(algorithmParams.centrality.type);
      message.success('中心性计算完成');
    } catch (error) {
      message.error('中心性计算失败');
    }
  };

  // 最短路径查找
  const handleShortestPath = async () => {
    const { source, target } = algorithmParams.path;
    if (!source || !target) {
      message.warning('请选择源节点和目标节点');
      return;
    }

    try {
      const result = await findShortestPath(source, target);
      if (result.length > 0) {
        message.success(`找到路径，长度: ${result.length}`);
        // 高亮显示路径
        const pathNodeIds = result.path.map(node => node.id);
        focusOnNode(pathNodeIds[0]);
      } else {
        message.info('未找到路径');
      }
    } catch (error) {
      message.error('路径查找失败');
    }
  };

  // 参数更新
  const updateAlgorithmParam = (algorithm: string, key: string, value: any) => {
    setAlgorithmParams((prev: any) => ({
      ...prev,
      [algorithm]: {
        ...prev[algorithm],
        [key]: value
      }
    }));
  };

  // PageRank结果表格列
  const pageRankColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank: number) => (
        <Tag color={rank <= 3 ? 'gold' : rank <= 10 ? 'blue' : 'default'}>
          {rank}
        </Tag>
      )
    },
    {
      title: '节点',
      dataIndex: 'node_id',
      key: 'node_id',
      render: (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        return (
          <div>
            <div style={{ fontWeight: 'bold' }}>{node?.label || nodeId}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {node?.type}
            </div>
          </div>
        );
      }
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score: number) => (
        <div>
          <div>{score.toFixed(4)}</div>
          <Progress 
            percent={score * 100} 
            size="small" 
            showInfo={false}
            strokeColor={score > 0.01 ? '#52c41a' : '#1890ff'}
          />
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (record: any) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => focusOnNode(record.node_id)}
        >
          定位
        </Button>
      )
    }
  ];

  // 中心性结果表格列
  const centralityColumns = pageRankColumns; // 使用相同的列定义

  // 社区结果渲染
  const renderCommunities = () => {
    const communities = algorithmResults.communities;
    if (!communities) return null;

    const colors = ['red', 'blue', 'green', 'orange', 'purple', 'cyan', 'magenta'];
    
    return (
      <div>
        <div style={{ marginBottom: '16px' }}>
          <span>模块度: </span>
          <Tag color="blue">{communities.modularity.toFixed(3)}</Tag>
          <span style={{ marginLeft: '16px' }}>社区数量: </span>
          <Tag color="green">{Object.keys(communities.clusters).length}</Tag>
        </div>
        
        {Object.entries(communities.clusters).map(([clusterId, nodeIds], index) => (
          <Card 
            key={clusterId}
            size="small" 
            title={`社区 ${clusterId}`}
            style={{ marginBottom: '8px' }}
            headStyle={{ backgroundColor: colors[index % colors.length] + '22' }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {nodeIds.map((nodeId: string) => {
                const node = nodes.find(n => n.id === nodeId);
                return (
                  <Tag 
                    key={nodeId}
                    color={colors[index % colors.length]}
                    style={{ cursor: 'pointer' }}
                    onClick={() => focusOnNode(nodeId)}
                  >
                    {node?.label || nodeId}
                  </Tag>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  if (!visible) return null;

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ThunderboltOutlined style={{ marginRight: '8px' }} />
          图谱算法分析
        </div>
      }
      extra={
        <Button type="text" onClick={onClose}>
          关闭
        </Button>
      }
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '480px',
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: 1000,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
      }}
    >
      <Spin spinning={isLoading}>
        <Tabs activeKey={activeAlgorithm} onChange={setActiveAlgorithm}>
          {/* PageRank标签页 */}
          <TabPane 
            tab={
              <span>
                <StarOutlined />
                PageRank
              </span>
            } 
            key="pagerank"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <span>阻尼因子: </span>
                <InputNumber
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={algorithmParams.pagerank.damping}
                  onChange={(value) => updateAlgorithmParam('pagerank', 'damping', value)}
                />
              </div>
              <div>
                <span>迭代次数: </span>
                <InputNumber
                  min={10}
                  max={1000}
                  value={algorithmParams.pagerank.iterations}
                  onChange={(value) => updateAlgorithmParam('pagerank', 'iterations', value)}
                />
              </div>
              <Button 
                type="primary" 
                icon={<ThunderboltOutlined />}
                onClick={handlePageRank}
                block
              >
                计算PageRank
              </Button>
              
              {algorithmResults.pagerank && (
                <Table
                  dataSource={algorithmResults.pagerank}
                  columns={pageRankColumns}
                  size="small"
                  pagination={{ pageSize: 10 }}
                  rowKey="node_id"
                />
              )}
            </Space>
          </TabPane>

          {/* 中心性标签页 */}
          <TabPane 
            tab={
              <span>
                <NodeIndexOutlined />
                中心性
              </span>
            } 
            key="centrality"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <span>中心性类型: </span>
                <Select
                  value={algorithmParams.centrality.type}
                  onChange={(value) => updateAlgorithmParam('centrality', 'type', value)}
                  style={{ width: '150px' }}
                >
                  <Option value="degree">度中心性</Option>
                  <Option value="betweenness">介数中心性</Option>
                  <Option value="closeness">接近中心性</Option>
                  <Option value="pagerank">PageRank</Option>
                </Select>
              </div>
              <Button 
                type="primary" 
                icon={<NodeIndexOutlined />}
                onClick={handleCentralityCalculation}
                block
              >
                计算中心性
              </Button>
              
              {algorithmResults.centrality && (
                <Table
                  dataSource={algorithmResults.centrality}
                  columns={centralityColumns}
                  size="small"
                  pagination={{ pageSize: 10 }}
                  rowKey="node_id"
                />
              )}
            </Space>
          </TabPane>

          {/* 社区检测标签页 */}
          <TabPane 
            tab={
              <span>
                <ClusterOutlined />
                社区
              </span>
            } 
            key="communities"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <span>算法: </span>
                <Select
                  value={algorithmParams.communities.algorithm}
                  onChange={(value) => updateAlgorithmParam('communities', 'algorithm', value)}
                  style={{ width: '120px' }}
                >
                  <Option value="louvain">Louvain</Option>
                  <Option value="leiden">Leiden</Option>
                </Select>
              </div>
              <Button 
                type="primary" 
                icon={<ClusterOutlined />}
                onClick={handleCommunityDetection}
                block
              >
                检测社区
              </Button>
              
              {algorithmResults.communities && renderCommunities()}
            </Space>
          </TabPane>

          {/* 路径分析标签页 */}
          <TabPane 
            tab={
              <span>
                <AimOutlined />
                路径
              </span>
            } 
            key="path"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <span>源节点: </span>
                <Select
                  placeholder="选择源节点"
                  style={{ width: '100%' }}
                  showSearch
                  value={algorithmParams.path.source}
                  onChange={(value) => updateAlgorithmParam('path', 'source', value)}
                  optionFilterProp="children"
                >
                  {nodes.map(node => (
                    <Option key={node.id} value={node.id}>
                      {node.label} ({node.type})
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <span>目标节点: </span>
                <Select
                  placeholder="选择目标节点"
                  style={{ width: '100%' }}
                  showSearch
                  value={algorithmParams.path.target}
                  onChange={(value) => updateAlgorithmParam('path', 'target', value)}
                  optionFilterProp="children"
                >
                  {nodes.map(node => (
                    <Option key={node.id} value={node.id}>
                      {node.label} ({node.type})
                    </Option>
                  ))}
                </Select>
              </div>
              <Button 
                type="primary" 
                icon={<AimOutlined />}
                onClick={handleShortestPath}
                block
              >
                查找最短路径
              </Button>
            </Space>
          </TabPane>
        </Tabs>
      </Spin>
    </Card>
  );
}; 