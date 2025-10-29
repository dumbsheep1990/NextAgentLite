import React from 'react';
import { Select, Input, InputNumber, Typography } from 'antd';
import { NodeIndexOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export interface GraphSettingsProps {
  graphMode: 'auto' | 'fixed';
  setGraphMode: (v: 'auto' | 'fixed') => void;
  graphQueryMode: 'local' | 'global' | 'hybrid' | 'naive' | 'mix' | 'bypass';
  setGraphQueryMode: (v: 'local' | 'global' | 'hybrid' | 'naive' | 'mix' | 'bypass') => void;
  graphFixedQuery: string;
  setGraphFixedQuery: (v: string) => void;
  graphTopK: number;
  setGraphTopK: (v: number) => void;
  graphChunkTopK: number;
  setGraphChunkTopK: (v: number) => void;
}

const GraphSettingsSection: React.FC<GraphSettingsProps> = (props) => {
  const {
    graphMode,
    setGraphMode,
    graphQueryMode,
    setGraphQueryMode,
    graphFixedQuery,
    setGraphFixedQuery,
    graphTopK,
    setGraphTopK,
    graphChunkTopK,
    setGraphChunkTopK,
  } = props;

  return (
    <div>
      <div className="studio-section settings-group-knowledge">
        <div className="section-header graph">
          <NodeIndexOutlined style={{ marginRight: 6 }} />
          <span>图谱检索配置</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <div>
            <span className="setting-label" style={{ fontSize: 12, color: '#64748b' }}>
              检索触发
            </span>
            <Select
              size="large"
              value={graphMode}
              onChange={(v) => setGraphMode(v as any)}
              style={{ width: '100%', marginTop: 6, borderRadius: 8 }}
              options={[
                { value: 'auto', label: '自动（使用对话输入作为检索）' },
                { value: 'fixed', label: '固定（始终使用预设查询）' },
              ]}
            />
          </div>

          <div>
            <span className="setting-label" style={{ fontSize: 12, color: '#64748b' }}>
              检索模式
            </span>
            <Select
              size="large"
              value={graphQueryMode}
              onChange={(v) => setGraphQueryMode(v as any)}
              style={{ width: '100%', marginTop: 6, borderRadius: 8 }}
              options={[
                { value: 'mix', label: 'mix（推荐）' },
                { value: 'local', label: 'local（实体为主）' },
                { value: 'global', label: 'global（关系为主）' },
                { value: 'hybrid', label: 'hybrid' },
                { value: 'naive', label: 'naive' },
                { value: 'bypass', label: 'bypass' },
              ]}
            />
          </div>
        </div>

        {graphMode === 'fixed' && (
          <div className="field-group" style={{ marginTop: 10 }}>
            <span className="setting-label" style={{ fontSize: 12, color: '#64748b' }}>
              固定查询
            </span>
            <TextArea
              rows={2}
              value={graphFixedQuery}
              onChange={(e) => setGraphFixedQuery(e.target.value)}
              placeholder="请输入固定检索的查询文本..."
              className="styled-textarea"
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
          <div>
            <span className="setting-label" style={{ fontSize: 12, color: '#64748b' }}>
              TopK
            </span>
            <InputNumber
              min={1}
              max={200}
              value={graphTopK}
              onChange={(v) => setGraphTopK(Number(v || 0))}
              style={{ width: '100%', marginTop: 6, borderRadius: 8 }}
            />
          </div>

          <div>
            <span className="setting-label" style={{ fontSize: 12, color: '#64748b' }}>
              Chunk TopK
            </span>
            <InputNumber
              min={1}
              max={200}
              value={graphChunkTopK}
              onChange={(v) => setGraphChunkTopK(Number(v || 0))}
              style={{ width: '100%', marginTop: 6, borderRadius: 8 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphSettingsSection;
