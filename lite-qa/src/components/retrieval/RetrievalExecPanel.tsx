import React from 'react';

export interface RetrievalEvent {
  stage?: string;
  collections?: string[];
  top_n?: number;
  mode?: string;
  query?: string;
  hits?: number;
  context_preview?: string;
  sample_ids?: string[];
  filters?: any;
  warning?: string;
}

export interface Props {
  events: RetrievalEvent[];
}

const Section: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ fontWeight: 600, fontSize: 12, color: '#555', marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{children}</div>
  </div>
);

const Box: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafafa' }}>{children}</div>
);

const RetrievalExecPanel: React.FC<Props> = ({ events }) => {
  const retrieveEvents = (events || []).filter(e => e && e.stage === 'retrieve');
  if (!retrieveEvents.length) return null;
  const first = retrieveEvents[0] || {} as RetrievalEvent;
  const last = retrieveEvents[retrieveEvents.length - 1] || {} as RetrievalEvent;

  return (
    <Box>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontWeight: 700 }}>检索执行</span>
        {last.mode ? <span style={{ fontSize: 12, color: '#666' }}>模式: {last.mode}</span> : null}
      </div>
      {first.warning && (
        <div style={{ color: '#b45309', background: '#fffbeb', border: '1px solid #f59e0b', padding: 8, borderRadius: 6, marginBottom: 8 }}>
          ⚠️ {first.warning}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Section title="集合">
          {(first.collections || []).join(', ') || '未指定'}
        </Section>
        <Section title="TopN">
          {first.top_n ?? '-'}
        </Section>
        <Section title="命中数">
          {last.hits ?? 0}
        </Section>
        <Section title="示例IDs">
          {(last.sample_ids || []).join(', ')}
        </Section>
      </div>
      {first.query ? (
        <Section title="查询">{first.query}</Section>
      ) : null}
      {last.filters ? (
        <Section title="过滤器">{JSON.stringify(last.filters, null, 2)}</Section>
      ) : null}
      {last.context_preview ? (
        <Section title="上下文预览">{last.context_preview}</Section>
      ) : null}
    </Box>
  );
};

export default RetrievalExecPanel;

