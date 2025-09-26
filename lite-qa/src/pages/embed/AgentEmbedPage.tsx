import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Input, Spin, message, Tag, Tooltip } from 'antd';

const { TextArea } = Input;

const AgentEmbedPage: React.FC = () => {
  const { agentId } = useParams();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; ts?: number }>>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ agent_name?: string; description?: string; color?: string; service_name?: string; publish_mode?: string } | null>(null);
  const [greeted, setGreeted] = useState(false);

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      if (!agentId) return;
      try {
        const r = await fetch(`/api/v1/user-agents/${encodeURIComponent(agentId)}/basic`, { credentials: 'include' });
        if (!r.ok) return;
        const j = await r.json();
        if (!aborted) setMeta(j || {});
      } catch { /* ignore */ }
    };
    load();
    return () => { aborted = true; };
  }, [agentId]);

  const headerName = useMemo(() => meta?.service_name || meta?.agent_name || '智能体对话', [meta]);
  const headerDesc = useMemo(() => meta?.description || '独立嵌入对话页面', [meta]);
  const brandColor = useMemo(() => (meta?.color && /^#/.test(meta.color) ? meta.color : '#2563eb'), [meta]);

  useEffect(() => {
    if (!greeted) {
      const name = headerName || '智能体';
      const desc = headerDesc || '';
      const greet = desc ? `你好！我是「${name}」。${desc}` : `你好！我是「${name}」。请直接输入你的问题。`;
      setMessages([{ role: 'assistant', content: greet, ts: Date.now() }]);
      setGreeted(true);
    }
  }, [headerName, headerDesc, greeted]);

  const send = async () => {
    const t = (text || '').trim();
    if (!t || !agentId) return;
    setText('');
    setMessages(prev => [...prev, { role: 'user', content: t, ts: Date.now() }]);
    try {
      setLoading(true);
      // 优先尝试流式
      try {
        const res = await fetch(`/api/v1/user-agents/${encodeURIComponent(agentId)}/invoke-stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            prompt: t,
            messages: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
          })
        });
        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let assistant = '';
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buffer.indexOf('\n\n')) !== -1) {
              const chunk = buffer.slice(0, idx);
              buffer = buffer.slice(idx + 2);
              if (!chunk.startsWith('data:')) continue;
              const json = chunk.slice(5).trim();
              if (!json) continue;
              try {
                const ev = JSON.parse(json);
                if (ev?.stage === 'execute' && typeof ev.result === 'string') {
                  assistant = ev.result;
                }
                if (ev?.type === 'workflow_end' && typeof ev.result === 'string') {
                  assistant = ev.result;
                }
              } catch { /* ignore */ }
            }
          }
          if (assistant) {
            setMessages(prev => [...prev, { role: 'assistant', content: assistant, ts: Date.now() }]);
            return;
          }
          // 若流式未产出结果，回退一次普通调用
        }
      } catch {
        // ignore and fallback
      }
      // 回退非流式
      {
        const res2 = await fetch(`/api/v1/user-agents/${encodeURIComponent(agentId)}/invoke`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({
            prompt: t,
            messages: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
          })
        });
        if (!res2.ok) throw new Error(await res2.text());
        const data = await res2.json();
        const ans = data?.result || '（无响应内容）';
        setMessages(prev => [...prev, { role: 'assistant', content: ans, ts: Date.now() }]);
      }
    } catch (e: any) {
      message.error(e?.message || '调用失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部栏 */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffffaa', backdropFilter: 'saturate(120%) blur(4px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: brandColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {(headerName || '智')?.slice(0,1)}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{headerName}</div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{headerDesc}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {meta?.publish_mode && (
            <Tag color="blue" style={{ marginRight: 0 }}>{meta.publish_mode === 'embed' ? '嵌入模式' : 'API 模式'}</Tag>
          )}
        </div>
      </div>

      {/* 主体 */}
      <div style={{ flex: '1 1 auto', minHeight: 0, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 980, width: '100%', margin: '0 auto' }}>
        <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, background: '#fff' }}>
          <Spin spinning={loading && messages.length === 0}>
            {messages.map((m, i) => {
              const isUser = m.role === 'user';
              const timeStr = m.ts ? new Date(m.ts).toLocaleTimeString('zh-CN', { hour12:false, hour:'2-digit', minute:'2-digit' }) : '';
              return (
                <div key={i} style={{ display: 'flex', marginBottom: 14, alignItems: 'flex-end', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 10 }}>
                  {!isUser && (
                    <div title={headerName} style={{ width: 36, height: 36, borderRadius: '50%', background: brandColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {(headerName || '助')?.slice(0,1)}
                    </div>
                  )}
                  <div style={{ maxWidth: '76%' }}>
                    <div style={{ background: isUser ? brandColor : '#f8fafc', color: isUser ? '#fff' : '#111827', padding: '10px 12px', borderRadius: 16, borderTopLeftRadius: isUser ? 16 : 6, borderTopRightRadius: isUser ? 6 : 16, lineHeight: 1.65, boxShadow: isUser ? 'none' : '0 1px 0 rgba(0,0,0,0.03)' }}>
                      {m.content}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>{timeStr}</div>
                  </div>
                  {isUser && (
                    <div title="我" style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      我
                    </div>
                  )}
                </div>
              );
            })}
          </Spin>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 8 }}>
            <TextArea value={text} disabled={loading} onChange={e => setText(e.target.value)} onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); send(); } }} placeholder="输入问题...（Shift+Enter 换行）" autoSize={{ minRows: 2, maxRows: 4 }} style={{ border: 'none', boxShadow: 'none', background: 'transparent' }} />
          </div>
          <Tooltip title="发送">
            <Button type="primary" onClick={send} loading={loading} style={{ padding: '0 18px', height: 40, background: brandColor, borderColor: brandColor }}>发送</Button>
          </Tooltip>
        </div>
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, paddingTop: 2 }}>Powered by NextAgentLite</div>
      </div>
    </div>
  );
};

export default AgentEmbedPage;
