import React, { useEffect, useMemo, useState } from 'react';
import { Card, Input, Button, Space, Select, List, Tag, Divider, Typography, message } from 'antd';
import { SearchOutlined, NodeIndexOutlined, BranchesOutlined, AimOutlined, ReloadOutlined } from '@ant-design/icons';
import { graphService } from '../../services/graphService';

const { Title, Text } = Typography;
const { Option } = Select;

const GraphRetrievalPage: React.FC = () => {
  const [q, setQ] = useState('');
  const [nodeType, setNodeType] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [nodeTypes, setNodeTypes] = useState<string[]>([]);

  // shortest path
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [pathLoading, setPathLoading] = useState(false);
  const [pathResult, setPathResult] = useState<{ path: any[]; edges: any[]; length: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const types = await graphService.getNodeTypes();
        setNodeTypes(types || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const doSearch = async () => {
    try {
      setLoading(true);
      const res = await graphService.searchNodes(q, 30, nodeType);
      setResults(res || []);
    } catch (e:any) {
      message.error(e?.message || '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const doShortestPath = async () => {
    if (!sourceId || !targetId) {
      message.warning('请填写源节点ID与目标节点ID');
      return;
    }
    try {
      setPathLoading(true);
      const res = await graphService.getShortestPath(sourceId, targetId);
      setPathResult({ path: res.path || [], edges: res.edges || [], length: res.length ?? -1 });
    } catch (e:any) {
      message.error(e?.message || '查询最短路径失败');
    } finally {
      setPathLoading(false);
    }
  };

  const ResultItem = ({ item }: { item: any }) => (
    <List.Item>
      <List.Item.Meta
        title={
          <Space size={8}>
            <NodeIndexOutlined />
            <Text strong>{item.label || item.id}</Text>
            <Tag>{item.type || 'entity'}</Tag>
          </Space>
        }
        description={
          <div style={{ fontSize: 12, color: '#666' }}>
            <div>ID: {item.id}</div>
            {item.properties && <div>属性: {JSON.stringify(item.properties)}</div>}
          </div>
        }
      />
    </List.Item>
  );

  return (
    <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card size="small" bodyStyle={{ padding: 12 }}>
        <Space size={8} wrap>
          <Input 
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索节点（关键词）"
            style={{ width: 280 }}
            value={q}
            onChange={e => setQ(e.target.value)}
            onPressEnter={doSearch}
          />
          <Select 
            placeholder="节点类型"
            allowClear
            value={nodeType}
            onChange={setNodeType as any}
            style={{ width: 180 }}
          >
            {nodeTypes.map(t => <Option key={t} value={t}>{t}</Option>)}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} loading={loading} onClick={doSearch}>搜索</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setQ(''); setNodeType(undefined); setResults([]); }}>重置</Button>
        </Space>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
        <Card title={<Space><SearchOutlined /> 节点检索结果</Space>} size="small" bodyStyle={{ padding: 0 }} style={{ overflow: 'hidden' }}>
          <List
            loading={loading}
            dataSource={results}
            renderItem={(item) => <ResultItem item={item} />}
            style={{ height: '100%', overflow: 'auto', padding: 12 }}
          />
        </Card>

        <Card title={<Space><BranchesOutlined /> 最短路径测试</Space>} size="small" bodyStyle={{ padding: 12 }}>
          <Space size={8} style={{ marginBottom: 8 }} wrap>
            <Input placeholder="源节点ID" value={sourceId} onChange={e => setSourceId(e.target.value)} style={{ width: 220 }} />
            <Input placeholder="目标节点ID" value={targetId} onChange={e => setTargetId(e.target.value)} style={{ width: 220 }} />
            <Button type="primary" icon={<AimOutlined />} loading={pathLoading} onClick={doShortestPath}>查询</Button>
          </Space>
          <Divider style={{ margin: '8px 0' }} />
          {pathResult ? (
            <div style={{ fontSize: 12 }}>
              <div style={{ marginBottom: 6 }}>路径长度: <Text strong>{pathResult.length}</Text></div>
              <div style={{ marginBottom: 6 }}>
                节点序列: {pathResult.path && pathResult.path.length 
                  ? (pathResult.path as any[]).map((n:any) => (n.label || n.id || '')).join(' → ') 
                  : '无'}
              </div>
              <div>边数量: {pathResult.edges?.length || 0}</div>
            </div>
          ) : (
            <Text type="secondary">请输入源节点和目标节点ID进行路径测试</Text>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GraphRetrievalPage;
