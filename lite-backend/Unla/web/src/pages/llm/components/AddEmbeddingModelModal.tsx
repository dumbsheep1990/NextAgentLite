import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from '@heroui/react';

interface AddEmbeddingModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { modelId: string; displayName?: string; baseURL?: string; apiKey?: string; dimension: number; contextWindow?: number }) => Promise<void> | void;
}

const AddEmbeddingModelModal: React.FC<AddEmbeddingModelModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [modelId, setModelId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | { ok: boolean; msg: string }>(null);
  const [dimension, setDimension] = useState<string>('');
  const [contextWindow, setContextWindow] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setModelId('');
      setDisplayName('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!modelId.trim()) return;
    try {
      setSubmitting(true);
      await onSubmit({ modelId: modelId.trim(), displayName: displayName.trim() || undefined });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleTest = async () => {
    if (!baseURL.trim() || !modelId.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const url = `${baseURL.replace(/\/$/, '')}/embeddings`;
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (apiKey.trim()) headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: modelId.trim(), input: 'hello' })
      });
      if (resp.ok) {
        setTestResult({ ok: true, msg: '测试成功' });
      } else {
        const text = await resp.text();
        setTestResult({ ok: false, msg: `HTTP ${resp.status}: ${text}` });
      }
    } catch (e: any) {
      setTestResult({ ok: false, msg: e?.message || '请求失败' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>添加自定义向量模型</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="模型ID"
              placeholder="如 text-embedding-3-large"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              isRequired
            />
            <Input
              label="API Base"
              placeholder="如 https://api.openai.com/v1"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              isRequired
            />
            <Input
              label="API Key"
              placeholder="可选"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="向量维度"
                placeholder="例如 1536"
                value={dimension}
                onChange={(e) => setDimension(e.target.value)}
                isRequired
                type="number"
              />
              <Input
                label="Context窗口（可选）"
                placeholder="例如 8192"
                value={contextWindow}
                onChange={(e) => setContextWindow(e.target.value)}
                type="number"
              />
            </div>
            <Input
              label="显示名称（可选）"
              placeholder="展示名"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="flat" onPress={handleTest} isLoading={testing} isDisabled={!baseURL.trim() || !modelId.trim()}>
                测试
              </Button>
              {testResult && (
                <span className={`text-xs ${testResult.ok ? 'text-success' : 'text-danger'}`}>{testResult.msg}</span>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={submitting}>取消</Button>
          <Button color="primary" onPress={async ()=>{
            await onSubmit({ modelId, displayName, baseURL, apiKey, dimension: parseInt(dimension) || 0, contextWindow: contextWindow? (parseInt(contextWindow)||0): undefined });
          }} isLoading={submitting} isDisabled={!modelId.trim() || !baseURL.trim() || !dimension.trim()}>保存</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddEmbeddingModelModal;
