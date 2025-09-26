import React, { useState, useEffect } from 'react';
import { Button, Spin } from 'antd';
import { ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getMatGraphHealthUrl, getMatGraphWebUIUrl } from '../../config/appConfig';

const GraphEmbedRetrievalPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ok = await fetch(getMatGraphHealthUrl()).then(r => r.ok).catch(() => true);
        setTimeout(() => { setLoading(false); setError(!ok); }, 600);
      } catch { setLoading(false); }
    })();
  }, [refreshKey]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {error && (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center bg-white p-8 rounded-xl border shadow-sm">
            <ExclamationCircleOutlined className="text-red-500 text-3xl" />
            <div className="mt-3 font-medium">知识图谱服务不可达</div>
            <div className="text-gray-500 text-sm mb-4">请确认 9622 端口已启动</div>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => setRefreshKey(Date.now())}>重试</Button>
          </div>
        </div>
      )}
      {loading && !error && (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <Spin size="large" />
        </div>
      )}
      {!error && (
        (() => {
          const src = getMatGraphWebUIUrl({ tab: 'retrieval', embed: 1, t: refreshKey, r: Math.random() });
          console.log('[GraphEmbedRetrieval] iframe src =', src);
          return (
        <iframe
          key={refreshKey}
          src={src}
          className="w-full h-full border-0"
          title="DataGraph Retrieval"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock allow-fullscreen allow-presentation"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none', display: loading ? 'none' : 'block' }}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
        />)
        })()
      )}
    </div>
  );
};

export default GraphEmbedRetrievalPage;
