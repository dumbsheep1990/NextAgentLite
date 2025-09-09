/**
 * 节点详情面板组件
 */
import React, { useState } from 'react';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  List,
  Divider,
  Progress,
  Badge,
  Tabs
} from 'antd';
import { 
  NodeIndexOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
  LinkOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  UploadOutlined
} from '@ant-design/icons';
import type { GraphNode, GraphEdge } from '../../types';
import { GraphDocumentManager } from './GraphDocumentManager';

const { Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface NodeDetailPanelProps {
  node: GraphNode | null;
  connectedNodes: GraphNode[];
  connectedEdges: GraphEdge[];
  onEdit?: (node: GraphNode) => void;
  onDelete?: (nodeId: string) => void;
  onExpand?: (nodeId: string) => void;
  onCollapse?: (nodeId: string) => void;
  onNavigateToNode?: (nodeId: string) => void;
  onGraphRefresh?: () => void;
  onUploadFiles?: () => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  connectedNodes,
  connectedEdges,
  onEdit,
  onDelete,
  onExpand,
  onCollapse,
  onNavigateToNode,
  onGraphRefresh,
  onUploadFiles
}) => {
  const [activeTab, setActiveTab] = useState('nodeDetail');

  // 节点类型中文映射
  const nodeTypeLabels: Record<string, string> = {
    geopolymerproduct: '地聚物产品',
    precursor: '前体材料',
    parameter: '工艺参数',
    curingprocess: '固化工艺',
    processingequipment: '加工设备',
    researcher: '研究人员',
    location: '位置信息',
    phenomenon: '现象特征',
    admixture: '外加剂',
    polymermatrix: '聚合物基体',
    inorganicfiber: '无机纤维',
    material: '材料',
    chemical_compound: '化学成分',
    property: '性能属性',
    process: '制备工艺',
    structure: '微观结构',
    test_method: '测试方法',
    entity: '实体',
    concept: '概念',
    unknown: '未知类型'
  };

  // 节点类型标签颜色
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      geopolymerproduct: 'blue',
      precursor: 'green',
      parameter: 'orange',
      curingprocess: 'red',
      processingequipment: 'purple',
      researcher: 'cyan',
      location: 'magenta',
      phenomenon: 'lime',
      admixture: 'gold',
      polymermatrix: 'geekblue',
      inorganicfiber: 'volcano',
      material: 'blue',
      chemical_compound: 'green',
      property: 'orange',
      process: 'red',
      structure: 'purple',
      test_method: 'cyan',
      entity: 'default',
      concept: 'blue',
      unknown: 'default'
    };
    return colors[type] || 'default';
  };

  // 边类型统计
  const edgeTypeStats = node ? connectedEdges.reduce((acc, edge) => {
    acc[edge.type] = (acc[edge.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  // 节点详情内容组件
  const NodeDetailContent = () => {
    if (!node) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 py-16">
          <NodeIndexOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <Text>请选择一个节点查看详情</Text>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 节点操作按钮 */}
        <div className="flex justify-end">
          <Space>
            <Button 
              type="text" 
              size="small"
              icon={<ExpandAltOutlined />}
              onClick={() => onExpand?.(node.id)}
              title="展开连接"
            />
            <Button 
              type="text" 
              size="small"
              icon={<ShrinkOutlined />}
              onClick={() => onCollapse?.(node.id)}
              title="收起连接"
            />
            <Button 
              type="text" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit?.(node)}
              title="编辑"
            />
            <Button 
              type="text" 
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onDelete?.(node.id)}
              danger
              title="删除"
            />
          </Space>
        </div>

        {/* 基本信息 */}
        <div>
          <div className="flex items-center mb-3">
            <Text strong className="text-lg" style={{ color: '#1890ff' }}>
              {node.label}
            </Text>
            <Tag color={getTypeColor(node.type)} className="ml-2">
              {nodeTypeLabels[node.type] || node.type}
            </Tag>
          </div>
          
          {node.properties?.description && (
            <Paragraph className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {node.properties.description}
            </Paragraph>
          )}
        </div>

        {/* 详细属性 */}
        <div>
          <Text strong style={{ fontSize: '16px', color: '#333' }}>基本属性</Text>
          <Descriptions size="small" column={1} className="mt-2" bordered>
            <Descriptions.Item label="节点标识" labelStyle={{ width: '80px' }}>
              <Text copyable={{ text: node.id }} style={{ fontSize: '12px', color: '#666' }}>
                {node.id.substring(0, 8)}...
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="节点类型">
              <Tag color={getTypeColor(node.type)}>
                {nodeTypeLabels[node.type] || node.type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="连接数">
              <Badge count={node.connections || 0} showZero style={{ backgroundColor: '#52c41a' }} />
            </Descriptions.Item>
            {node.level && (
              <Descriptions.Item label="层级">
                <Text>{node.level}</Text>
              </Descriptions.Item>
            )}
            {node.properties?.confidence && (
              <Descriptions.Item label="置信度">
                <Progress 
                  percent={Math.round((node.properties.confidence as number) * 100)} 
                  size="small" 
                  status={node.properties.confidence > 0.8 ? 'success' : 'normal'}
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>

        {/* 自定义属性 */}
        {node.properties && Object.keys(node.properties).length > 1 && (
          <div>
            <Text strong style={{ fontSize: '16px', color: '#333' }}>扩展属性</Text>
            <Descriptions size="small" column={1} className="mt-2" bordered>
              {Object.entries(node.properties)
                .filter(([key]) => !['description', 'confidence'].includes(key))
                .map(([key, value]) => (
                  <Descriptions.Item key={key} label={key} labelStyle={{ width: '80px' }}>
                    {typeof value === 'number' ? (
                      <Badge count={value} showZero style={{ backgroundColor: '#1890ff' }} />
                    ) : Array.isArray(value) ? (
                      <div>
                        {value.slice(0, 3).map((item, index) => (
                          <Tag key={index} size="small" style={{ marginBottom: '2px' }}>
                            {String(item)}
                          </Tag>
                        ))}
                        {value.length > 3 && (
                          <Tag size="small" color="default">+{value.length - 3} 更多</Tag>
                        )}
                      </div>
                    ) : (
                      <Text style={{ fontSize: '13px' }}>{String(value)}</Text>
                    )}
                  </Descriptions.Item>
                ))}
            </Descriptions>
          </div>
        )}

        <Divider />

        {/* 连接统计 */}
        <div>
          <Text strong>连接统计</Text>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <Text>直接连接节点</Text>
              <Badge count={connectedNodes.length} />
            </div>
            <div className="flex justify-between">
              <Text>关联边</Text>
              <Badge count={connectedEdges.length} />
            </div>
          </div>

          {/* 边类型分布 */}
          {Object.keys(edgeTypeStats).length > 0 && (
            <div className="mt-4">
              <Text className="text-sm text-gray-600">边类型分布</Text>
              <div className="mt-2 space-y-1">
                {Object.entries(edgeTypeStats).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <Text className="text-sm">{type}</Text>
                    <div className="flex items-center">
                      <Progress 
                        percent={Math.round((count / connectedEdges.length) * 100)} 
                        size="small" 
                        className="w-16 mr-2"
                        showInfo={false}
                      />
                      <Badge count={count} size="small" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* 连接的节点列表 */}
        <div>
          <Text strong>连接的节点 ({connectedNodes.length})</Text>
          <List
            className="mt-2"
            size="small"
            dataSource={connectedNodes.slice(0, 10)}
            renderItem={(connectedNode) => (
              <List.Item
                actions={[
                  <Button 
                    type="text" 
                    size="small"
                    icon={<LinkOutlined />}
                    onClick={() => onNavigateToNode?.(connectedNode.id)}
                  />
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center">
                      <Text className="text-sm">{connectedNode.label}</Text>
                      <Tag 
                        color={getTypeColor(connectedNode.type)}
                        className="ml-2"
                      >
                        {connectedNode.type}
                      </Tag>
                    </div>
                  }
                  description={
                    connectedNode.properties?.description ? (
                      <Text 
                        className="text-xs text-gray-500"
                        ellipsis
                      >
                        {connectedNode.properties.description.length > 50 
                          ? connectedNode.properties.description.substring(0, 50) + '...'
                          : connectedNode.properties.description}
                      </Text>
                    ) : null
                  }
                />
              </List.Item>
            )}
          />
          
          {connectedNodes.length > 10 && (
            <div className="text-center mt-2">
              <Text className="text-sm text-gray-500">
                还有 {connectedNodes.length - 10} 个节点...
              </Text>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card
      className="h-full"
      bodyStyle={{ padding: 0 }}
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="h-full"
        tabBarStyle={{ padding: '0 16px', margin: 0 }}
        tabBarExtraContent={{
          right: activeTab === 'fileManagement' && onUploadFiles ? (
            <Button
              type="primary"
              size="small"
              icon={<UploadOutlined />}
              onClick={onUploadFiles}
              style={{
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                fontWeight: 500,
                height: '28px',
                fontSize: '12px',
                boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)',
                marginRight: '8px'
              }}
            >
              上传文件
            </Button>
          ) : null
        }}
      >
        <TabPane 
          tab={
            <span>
              <NodeIndexOutlined />
              节点详情
            </span>
          } 
          key="nodeDetail"
        >
          <div className="p-4">
            <NodeDetailContent />
          </div>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <FileTextOutlined />
              文件管理
            </span>
          } 
          key="fileManagement"
        >
          <div className="p-4">
            <GraphDocumentManager onRefresh={onGraphRefresh} />
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );
}; 