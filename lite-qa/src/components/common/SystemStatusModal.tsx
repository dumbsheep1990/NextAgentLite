import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Tabs, Table, Button, Tag, Switch, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { routes as appRoutes } from '../../routes';

type Service = {
  key: string;
  name: string;
  port: number;
  host?: string;
};

const SERVICES: Service[] = [
  { key: 'backend', name: '后端服务', port: 8000 },
  { key: 'model-market', name: '模型市场服务', port: 5173 },
  { key: 'unla-api', name: '模型 API 服务', port: 5234 },
  { key: 'mcp-gateway', name: '模型工具网关', port: 5235 },
  { key: 'llm-gateway', name: '模型统一请求服务', port: 9050 },
  { key: 'graph', name: '知识图谱服务', port: 9622 },
  { key: 'crawler', name: '爬虫服务', port: 3001 },
];

type Status = 'unknown' | 'up' | 'down' | 'cors';

const ServiceStatusPanel: React.FC = () => {
  const [statusMap, setStatusMap] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);

  const setStatus = (key: string, status: Status) =>
    setStatusMap(prev => ({ ...prev, [key]: status }));

  const checkOne = async (svc: Service) => {
    try {
      const payload = { targets: [{ key: svc.key, host: svc.host || 'localhost', port: svc.port }] };
      const res = await fetch('/api/v1/system/ports/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const s = data?.statuses?.[svc.key];
      setStatus(svc.key, s === 'up' ? 'up' : 'down');
    } catch (_) {
      setStatus(svc.key, 'down');
    }
  };

  const checkAll = async () => {
    setLoading(true);
    try {
      const payload = { targets: SERVICES.map(s => ({ key: s.key, host: s.host || 'localhost', port: s.port })) };
      const res = await fetch('/api/v1/system/ports/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const statuses = data?.statuses || {};
      setStatusMap(statuses);
    } catch (_) {
      // 回退逐个检查
      await Promise.all(SERVICES.map(checkOne));
    }
    setLoading(false);
  };

  // 自动探测：初次进入即探测，每 15 秒自动刷新一次
  useEffect(() => {
    checkAll();
    const timer = setInterval(checkAll, 15000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnsType<Service> = [
    { title: '服务', dataIndex: 'name', key: 'name' },
    { title: '端口', dataIndex: 'port', key: 'port', width: 100 },
    { title: '主机', dataIndex: 'host', key: 'host', width: 120, render: (v: string) => <span style={{ fontSize: 12, color: '#64748b' }}>{v || 'localhost'}</span> },
    {
      title: '状态', key: 'status', width: 140,
      render: (_, r) => {
        const s = statusMap[r.key] || 'unknown';
        if (s === 'up') return <Tag color="green">运行中</Tag>;
        if (s === 'down') return <Tag color="red">不可达</Tag>;
        if (s === 'cors') return <Tag color="orange">受限/CORS</Tag>;
        return <Tag>未检查</Tag>;
      }
    },
    {
      title: '操作', key: 'op', width: 120,
      render: (_, r) => <Button size="small" onClick={() => checkOne(r)}>检查</Button>
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Space>
          <Button onClick={() => setStatusMap({})}>重置</Button>
          <Button type="primary" loading={loading} onClick={checkAll}>检查全部</Button>
        </Space>
      </div>
      <Table<Service>
        rowKey="key"
        size="small"
        columns={columns}
        dataSource={SERVICES}
        pagination={false}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
        注：跨域限制时可能显示“受限/CORS”，不代表服务异常。
      </div>
    </div>
  );
};

const flattenRoutes = (list: any[]) => {
  const out: { path: string; name: string }[] = [];
  list.forEach(r => {
    if (r.children) r.children.forEach((c: any) => out.push({ path: c.path, name: c.name }));
    out.push({ path: r.path, name: r.name });
  });
  return out;
};

const MenuManagePanel: React.FC = () => {
  const allItems = useMemo(() => flattenRoutes(appRoutes), []);
  const [hidden, setHidden] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('hiddenNavKeys');
      const arr = raw ? JSON.parse(raw) : [];
      return new Set<string>(Array.isArray(arr) ? arr : []);
    } catch { return new Set<string>(); }
  });

  const persist = (next: Set<string>) => {
    const arr = Array.from(next);
    localStorage.setItem('hiddenNavKeys', JSON.stringify(arr));
    window.dispatchEvent(new CustomEvent('nav-menu-updated'));
    setHidden(new Set(arr));
    message.success('菜单可见性已更新');
  };

  const toggle = (path: string, checked: boolean) => {
    const next = new Set(hidden);
    if (!checked) next.add(path); else next.delete(path);
    persist(next);
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>切换菜单在左侧导航的显示/隐藏</div>
      <Table
        size="small"
        rowKey="path"
        pagination={false}
        columns={[
          { title: '菜单', dataIndex: 'name', key: 'name' },
          { title: '路径', dataIndex: 'path', key: 'path', render: (v: string) => <span style={{ fontSize: 12, color: '#64748b' }}>{v}</span> },
          {
            title: '显示', key: 'show', width: 120,
            render: (_: any, r: any) => (
              <Switch
                checked={!hidden.has(r.path)}
                onChange={(checked) => toggle(r.path, checked)}
              />
            )
          }
        ]}
        dataSource={allItems}
      />
    </div>
  );
};

export const SystemStatusModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  return (
    <Modal
      title={<div style={{ fontWeight: 600 }}>系统状态</div>}
      open={visible}
      onCancel={onClose}
      zIndex={3000}
      footer={[<Button key="close" type="primary" onClick={onClose}>关闭</Button>]}
      width={900}
      destroyOnClose
      centered
    >
      <Tabs
        items={[
          { key: 'services', label: '服务状态', children: <ServiceStatusPanel /> },
          { key: 'menu', label: '菜单管理', children: <MenuManagePanel /> },
        ]}
      />
    </Modal>
  );
};

export default SystemStatusModal;
