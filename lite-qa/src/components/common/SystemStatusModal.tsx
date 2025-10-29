import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Tabs, Table, Button, Tag, Switch, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { routes as appRoutes } from '../../routes';
import { APP_CONFIG, getApiUrl } from '../../config/appConfig';

type Service = {
  key: string;
  name: string;
  port: number;
  host?: string;
};

// 从环境变量获取主机地址
const getServiceHost = (): string => {
  // 从 API Base URL 中提取主机地址
  const apiBaseUrl = APP_CONFIG.api.baseURL;
  try {
    const url = new URL(apiBaseUrl);
    return url.hostname;
  } catch {
    return 'localhost';
  }
};

const SERVICES: Service[] = [
  { key: 'backend', name: '后端服务', port: 8000, host: getServiceHost() },
  { key: 'model-market', name: '模型市场服务', port: 5173, host: getServiceHost() },
  { key: 'unla-api', name: '模型 API 服务', port: 5234, host: getServiceHost() },
  { key: 'mcp-gateway', name: '模型工具网关', port: 5235, host: getServiceHost() },
  { key: 'llm-gateway', name: '模型统一请求服务', port: 9050, host: getServiceHost() },
  { key: 'graph', name: '知识图谱服务', port: 9622, host: getServiceHost() },
  { key: 'crawler', name: '爬虫服务', port: 3001, host: getServiceHost() },
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
      const apiUrl = getApiUrl('system/ports/check');
      console.log('🔍 检查单个服务:', svc.name, '请求URL:', apiUrl);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('📡 服务检查响应:', svc.name, data);

      const s = data?.statuses?.[svc.key];
      setStatus(svc.key, s === 'up' ? 'up' : 'down');
    } catch (error) {
      console.error('❌ 服务检查失败:', svc.name, error);
      setStatus(svc.key, 'down');
    }
  };

  const checkAll = async () => {
    setLoading(true);
    try {
      const payload = { targets: SERVICES.map(s => ({ key: s.key, host: s.host || 'localhost', port: s.port })) };
      const apiUrl = getApiUrl('system/ports/check');
      console.log('🔍 批量检查所有服务，请求URL:', apiUrl);
      console.log('📤 请求payload:', JSON.stringify(payload, null, 2));

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('📡 批量检查响应:', data);

      const statuses = data?.statuses || {};
      setStatusMap(statuses);
    } catch (error) {
      console.error('❌ 批量检查失败，回退到逐个检查:', error);
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
    { title: '主机', dataIndex: 'host', key: 'host', width: 150, render: (v: string) => <span style={{ fontSize: 12, color: '#64748b' }}>{v || getServiceHost()}</span> },
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
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // 从数据库加载菜单配置
  const loadMenuConfigFromDB = async () => {
    try {
      const res = await fetch('/api/v1/user/nav-menu-config?user_id=default');
      const data = await res.json();
      if (data.success && data.data?.hiddenNavKeys) {
        return new Set<string>(data.data.hiddenNavKeys);
      }
    } catch (err) {
      console.warn('从数据库加载菜单配置失败，尝试使用localStorage:', err);
    }
    return null;
  };

  // 从localStorage加载菜单配置（fallback）
  const loadMenuConfigFromLocalStorage = () => {
    try {
      const raw = localStorage.getItem('hiddenNavKeys');
      const arr = raw ? JSON.parse(raw) : [];
      return new Set<string>(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set<string>();
    }
  };

  // 初始化加载配置
  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      try {
        // 优先从数据库加载
        const dbConfig = await loadMenuConfigFromDB();

        if (dbConfig) {
          setHidden(dbConfig);
        } else {
          // 数据库没有配置，尝试从localStorage加载
          const localConfig = loadMenuConfigFromLocalStorage();
          setHidden(localConfig);

          // 如果localStorage有配置，自动同步到数据库
          if (localConfig.size > 0) {
            setSyncing(true);
            try {
              await fetch('/api/v1/user/nav-menu-config?user_id=default', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hiddenNavKeys: Array.from(localConfig) })
              });
              console.log('✅ localStorage配置已自动同步到数据库');
            } catch (err) {
              console.warn('自动同步到数据库失败:', err);
            } finally {
              setSyncing(false);
            }
          }
        }
      } catch (err) {
        console.error('加载菜单配置失败:', err);
        // 最后的fallback
        setHidden(loadMenuConfigFromLocalStorage());
      } finally {
        setLoading(false);
      }
    };

    initLoad();
  }, []);

  const persist = async (next: Set<string>) => {
    const arr = Array.from(next);

    try {
      // 保存到数据库
      const res = await fetch('/api/v1/user/nav-menu-config?user_id=default', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenNavKeys: arr })
      });

      const data = await res.json();

      if (data.success) {
        // 同时保存到localStorage作为备份
        localStorage.setItem('hiddenNavKeys', JSON.stringify(arr));
        window.dispatchEvent(new CustomEvent('nav-menu-updated'));
        setHidden(new Set(arr));
        message.success('菜单可见性已保存到数据库');
      } else {
        throw new Error(data.message || '保存失败');
      }
    } catch (err) {
      console.error('保存到数据库失败，使用localStorage fallback:', err);
      // fallback到localStorage
      localStorage.setItem('hiddenNavKeys', JSON.stringify(arr));
      window.dispatchEvent(new CustomEvent('nav-menu-updated'));
      setHidden(new Set(arr));
      message.warning('已保存到本地，但数据库同步失败');
    }
  };

  const toggle = (path: string, checked: boolean) => {
    const next = new Set(hidden);
    if (!checked) next.add(path); else next.delete(path);
    persist(next);
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>切换菜单在左侧导航的显示/隐藏（数据库持久化）</span>
        {syncing && <Tag color="processing">正在同步到数据库...</Tag>}
      </div>
      <Table
        size="small"
        rowKey="path"
        pagination={false}
        loading={loading}
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
