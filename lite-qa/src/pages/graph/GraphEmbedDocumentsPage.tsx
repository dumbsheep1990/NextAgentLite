import React, { useState, useEffect } from 'react';
import { Button, Spin } from 'antd';
import { ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getMatGraphHealthUrl, getMatGraphWebUIUrl } from '../../config/appConfig';

const GraphEmbedDocumentsPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const check = async () => {
    try {
      const resp = await fetch(getMatGraphHealthUrl());
      return resp.ok;
    } catch {
      return true; // let iframe try
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(false);
      const ok = await check();
      if (ok) {
        setTimeout(() => setLoading(false), 600);
      } else {
        setLoading(false);
        setError(true);
      }
    })();
  }, [refreshKey, retryCount]);

  const handleRetry = () => { setRetryCount(v => v + 1); setRefreshKey(Date.now()); };
  const onLoad = () => { setLoading(false); setError(false); };
  const onError = () => { setLoading(false); setError(true); };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {error && (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center bg-white p-8 rounded-xl border shadow-sm">
            <ExclamationCircleOutlined className="text-red-500 text-3xl" />
            <div className="mt-3 font-medium">知识图谱服务不可达</div>
            <div className="text-gray-500 text-sm mb-4">请确认 9622 端口已启动</div>
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleRetry}>重试</Button>
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
          const src = getMatGraphWebUIUrl({ tab: 'documents', embed: 1, t: refreshKey, r: Math.random() });
          console.log('[GraphEmbedDocuments] iframe src =', src);
          return (
        <iframe
          key={refreshKey}
          src={src}
          className="w-full h-full border-0"
          title="DataGraph Documents"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock allow-fullscreen allow-presentation"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none', display: loading ? 'none' : 'block' }}
          onLoad={onLoad}
          onError={onError}
        />)
        })()
      )}
    </div>
  );
};

export default GraphEmbedDocumentsPage;
