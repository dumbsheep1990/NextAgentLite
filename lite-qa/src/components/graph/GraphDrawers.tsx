/**
 * 知识图谱抽屉组件 - 节点详情和文件管理
 */
import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  Button, 
  Space, 
  Typography, 
  Descriptions, 
  Tag, 
  List, 
  Divider, 
  Tabs, 
  Badge,
  Card,
  Progress,
  Tooltip
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
  UploadOutlined,
  CloseOutlined,
  RightOutlined,
  LeftOutlined
} from '@ant-design/icons';
import type { GraphNode, GraphEdge } from '../../types';
import { GraphDocumentManager } from './GraphDocumentManager';

const { Text, Paragraph, Title } = Typography;

interface GraphDrawersProps {
  // 节点详情相关
  selectedNode: GraphNode | null;
  connectedNodes: GraphNode[];
  connectedEdges: GraphEdge[];
  onEditNode?: (node: GraphNode) => void;
  onDeleteNode?: (nodeId: string) => void;
  onExpandNode?: (nodeId: string) => void;
  onCollapseNode?: (nodeId: string) => void;
  onNavigateToNode?: (nodeId: string) => void;
  
  // 文件管理相关
  onGraphRefresh?: () => void;
  onUploadFiles?: () => void;
  refreshKey?: number; // 用于触发文件管理刷新
  forceCloseDrawers?: boolean; // 外部控制强制关闭所有抽屉
}

export const GraphDrawers: React.FC<GraphDrawersProps> = ({
  selectedNode,
  connectedNodes,
  connectedEdges,
  onEditNode,
  onDeleteNode,
  onExpandNode,
  onCollapseNode,
  onNavigateToNode,
  onGraphRefresh,
  onUploadFiles,
  refreshKey,
  forceCloseDrawers
}) => {
  // 抽屉状态
  const [nodeDetailOpen, setNodeDetailOpen] = useState(false);
  const [fileManagerOpen, setFileManagerOpen] = useState(false);

  // 当选中节点时自动打开节点详情抽屉
  useEffect(() => {
    if (selectedNode) {
      setNodeDetailOpen(true);
    }
  }, [selectedNode]);

  // 监听外部强制关闭请求
  useEffect(() => {
    if (forceCloseDrawers) {
      setNodeDetailOpen(false);
      setFileManagerOpen(false);
    }
  }, [forceCloseDrawers]);

  // 节点类型标签颜色
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      concept: 'blue',
      property: 'green', 
      material: 'orange',
      process: 'purple',
      entity: 'cyan'
    };
    return colors[type] || 'default';
  };

  // 边类型统计
  const edgeTypeStats = selectedNode ? connectedEdges.reduce((acc, edge) => {
    acc[edge.type] = (acc[edge.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  // 浮动按钮组件
  const FloatingButtons = () => (
    <div 
      style={{
        position: 'fixed',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* 节点详情按钮 */}
      <Tooltip title="节点详情" placement="left">
        <Button
          type={nodeDetailOpen ? 'primary' : 'default'}
          shape="circle"
          size="large"
          icon={<NodeIndexOutlined />}
          onClick={() => setNodeDetailOpen(!nodeDetailOpen)}
          style={{
            width: '52px',
            height: '52px',
            boxShadow: nodeDetailOpen 
              ? '0 6px 16px rgba(82, 196, 26, 0.4)' 
              : '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: 'none',
            background: nodeDetailOpen 
              ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
              : 'rgba(255, 255, 255, 0.95)',
            color: nodeDetailOpen ? '#fff' : '#595959',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            fontSize: '18px'
          }}
        />
      </Tooltip>
      
      {/* 文件管理按钮 */}
      <Tooltip title="文件管理" placement="left">
        <Button
          type={fileManagerOpen ? 'primary' : 'default'}
          shape="circle"
          size="large"
          icon={<FolderOpenOutlined />}
          onClick={() => setFileManagerOpen(!fileManagerOpen)}
          style={{
            width: '52px',
            height: '52px',
            boxShadow: fileManagerOpen 
              ? '0 6px 16px rgba(250, 140, 22, 0.4)' 
              : '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: 'none',
            background: fileManagerOpen 
              ? 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)'
              : 'rgba(255, 255, 255, 0.95)',
            color: fileManagerOpen ? '#fff' : '#595959',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            fontSize: '18px'
          }}
        />
      </Tooltip>
    </div>
  );

  // 节点详情内容
  const NodeDetailContent = () => {
    if (!selectedNode) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '300px',
          color: '#999'
        }}>
          <NodeIndexOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <Text type="secondary">请选择一个节点查看详情</Text>
        </div>
      );
    }

    return (
      <div style={{ padding: '0 4px' }}>
        {/* 节点基本信息 */}
        <Card 
          size="small" 
          style={{ marginBottom: '16px' }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>节点信息</span>
              <Space>
                <Button 
                  type="text" 
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEditNode?.(selectedNode)}
                />
                <Button 
                  type="text" 
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => onDeleteNode?.(selectedNode.id)}
                />
              </Space>
            </div>
          }
        >
          <Descriptions column={1} size="small">
            <Descriptions.Item label="名称">
              <Text strong>{selectedNode.label}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              <Tag color={getTypeColor(selectedNode.type)}>{selectedNode.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="ID">
              <Text code>{selectedNode.id}</Text>
            </Descriptions.Item>
            {selectedNode.properties?.description && (
              <Descriptions.Item label="描述">
                <Paragraph 
                  ellipsis={{ rows: 3, expandable: true }}
                  style={{ margin: 0 }}
                >
                  {selectedNode.properties.description}
                </Paragraph>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* 连接统计 */}
        <Card size="small" style={{ marginBottom: '16px' }} title="连接统计">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>连接节点</Text>
              <Badge count={connectedNodes.length} style={{ backgroundColor: '#52c41a' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>关系边</Text>
              <Badge count={connectedEdges.length} style={{ backgroundColor: '#1890ff' }} />
            </div>
          </Space>
        </Card>

        {/* 关系类型统计 */}
        {Object.keys(edgeTypeStats).length > 0 && (
          <Card size="small" style={{ marginBottom: '16px' }} title="关系类型">
            <Space wrap>
              {Object.entries(edgeTypeStats).map(([type, count]) => (
                <Tag key={type} color="processing">
                  {type} ({count})
                </Tag>
              ))}
            </Space>
          </Card>
        )}

        {/* 连接的节点列表 */}
        {connectedNodes.length > 0 && (
          <Card size="small" style={{ marginBottom: '16px' }} title="相邻节点">
            <List
              size="small"
              dataSource={connectedNodes.slice(0, 10)}
              renderItem={(connectedNode) => (
                <List.Item
                  style={{ padding: '8px 0', cursor: 'pointer' }}
                  onClick={() => onNavigateToNode?.(connectedNode.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <Text strong>{connectedNode.label}</Text>
                      <br />
                      <Tag size="small" color={getTypeColor(connectedNode.type)}>
                        {connectedNode.type}
                      </Tag>
                    </div>
                    <RightOutlined style={{ color: '#999' }} />
                  </div>
                </List.Item>
              )}
            />
            {connectedNodes.length > 10 && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                显示前10个，共{connectedNodes.length}个节点
              </Text>
            )}
          </Card>
        )}

        {/* 节点操作 */}
        <Card size="small" title="节点操作">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              block
              icon={<ExpandAltOutlined />}
              onClick={() => onExpandNode?.(selectedNode.id)}
            >
              展开节点
            </Button>
            <Button 
              block
              icon={<ShrinkOutlined />}
              onClick={() => onCollapseNode?.(selectedNode.id)}
            >
              收起节点
            </Button>
          </Space>
        </Card>
      </div>
    );
  };

  return (
    <>
      {/* 浮动按钮 */}
      <FloatingButtons />

      {/* 节点详情抽屉 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NodeIndexOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
            <span style={{ fontWeight: 600, color: '#262626' }}>
              {selectedNode ? `节点详情 - ${selectedNode.label}` : '节点详情'}
            </span>
          </div>
        }
        placement="right"
        open={nodeDetailOpen}
        onClose={() => setNodeDetailOpen(false)}
        width={400}
        mask={true}
        maskClosable={true}
        style={{ zIndex: 999 }}
        extra={null}
        bodyStyle={{ 
          padding: '20px', 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%)',
          height: 'calc(100vh - 64px)',
          overflow: 'auto'
        }}
        headerStyle={{ 
          background: '#ffffff',
          borderBottom: '1px solid #e8e8e8',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}
      >
        <NodeDetailContent />
      </Drawer>

      {/* 文件管理抽屉 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FolderOpenOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
              <span style={{ fontWeight: 600, color: '#262626' }}>文件管理</span>
            </div>
            <Button 
              type="primary" 
              size="small"
              icon={<UploadOutlined />}
              onClick={onUploadFiles}
              style={{
                background: '#1890ff',
                borderColor: '#1890ff',
                borderRadius: '6px',
                fontWeight: 500
              }}
            >
              上传文件
            </Button>
          </div>
        }
        placement="right"
        open={fileManagerOpen}
        onClose={() => setFileManagerOpen(false)}
        width={500}
        mask={true}
        maskClosable={true}
        style={{ zIndex: 998 }}
        extra={null}
        bodyStyle={{ 
          padding: '0', 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%)',
          height: 'calc(100vh - 64px)',
          overflow: 'hidden'
        }}
        headerStyle={{ 
          background: '#ffffff',
          borderBottom: '1px solid #e8e8e8',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}
      >
        <div style={{ 
          padding: '16px 20px 0 20px', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <GraphDocumentManager
            onRefresh={onGraphRefresh}
            compact={false}
            drawerMode={true}
            refreshKey={refreshKey}
          />
        </div>
      </Drawer>

      {/* 抽屉样式 */}
      <style>{`
        
        .ant-card {
          border: 1px solid #e8e8e8;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        
        .ant-card:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
          transform: translateY(-1px);
        }
        
        .ant-card-head {
          background: rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid #f0f0f0;
          border-radius: 12px 12px 0 0;
          padding: 12px 16px;
        }
        
        .ant-card-head-title {
          font-weight: 600;
          color: #262626;
          font-size: 14px;
        }
        
        .ant-card-body {
          padding: 16px;
        }
        
        .ant-list-item {
          border-bottom: 1px solid #f5f5f5;
          transition: all 0.2s ease;
        }
        
        .ant-list-item:hover {
          background: rgba(82, 196, 26, 0.06);
          border-radius: 8px;
          transform: translateX(4px);
        }
        
        .ant-descriptions-item-label {
          font-weight: 600;
          color: #595959;
          font-size: 13px;
        }
        
        .ant-descriptions-item-content {
          color: #262626;
          font-size: 13px;
        }
        
        .ant-tag {
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          border: none;
        }
        
        .ant-badge {
          font-weight: 600;
        }
        
        .ant-table {
          height: 100%;
        }
        
        .ant-table-container {
          height: 100%;
        }
        
        .ant-table-body {
          overflow-y: auto !important;
          max-height: calc(100vh - 200px) !important;
        }
        
        .ant-table-thead > tr > th {
          background: rgba(255, 255, 255, 0.8);
          border-bottom: 2px solid #f0f0f0;
          font-weight: 600;
          color: #262626;
          padding: 12px 8px;
        }
        
        .ant-table-tbody > tr > td {
          padding: 12px 8px;
          border-bottom: 1px solid #f5f5f5;
        }
        
        .ant-table-tbody > tr:hover > td {
          background: rgba(82, 196, 26, 0.04);
        }
        
        .ant-pagination {
          border-top: 1px solid #e8e8e8;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
        }
      `}</style>
    </>
  );
};

export default GraphDrawers;