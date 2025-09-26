import React from 'react';
import { Select, Slider, InputNumber, Typography, Tag } from 'antd';

const { Text } = Typography;
const { Option } = Select;

export interface ModelSettingsProps {
  chatModel: string;
  setChatModel: (v: string) => void;
  chatModelOptions: Array<{ value: string; label: string }>;
  showEmbedding: boolean;
  requirements: any[];
  providerOptions: string[];
  embedProvider?: string;
  setEmbedProvider: (v?: string) => void;
  embedModelId?: string;
  setEmbedModelId: (v?: string) => void;
  embeddingMap: Record<string, any[]>;
  rerankModel?: string;
  setRerankModel: (v?: string) => void;
  rerankOptions?: Array<{ value: string; label: string }>;
  hideRerank?: boolean;
  temperature: number;
  setTemperature: (v: number) => void;
  topP: number;
  setTopP: (v: number) => void;
  maxTokens: number;
  setMaxTokens: (v: number) => void;
  models: Array<{ id: string; context_length?: number; name?: string }>;
}

const ModelSettingsSection: React.FC<ModelSettingsProps> = (p) => {
  return (
    <div>
      <div className="studio-section settings-group-model">
        <Text type="secondary" className="setting-label">对话模型</Text>
        <Select
          showSearch
          style={{ width:'100%', marginTop: 8 }}
          value={p.chatModel}
          onChange={p.setChatModel}
          options={p.chatModelOptions}
          placeholder="选择对话模型"
          optionFilterProp="label"
        />
      </div>

      {p.showEmbedding && (
        <div className="studio-section settings-group-model">
          <div className="section-header">
            <span>向量模型（Provider → Model）</span>
            <span className="req-pill hollow">{p.requirements.some(r=>r.type==='embedding_model' && r.required) ? '必需' : '可选'}</span>
          </div>
          <Select 
            value={p.embedProvider}
            onChange={(v)=>{ p.setEmbedProvider(v); p.setEmbedModelId(undefined); }}
            allowClear
            placeholder="Provider"
            style={{ width: '100%', marginTop: 8 }}
          >
            {p.providerOptions.map(x => (<Option key={x} value={x}>{x}</Option>))}
          </Select>
          <Select 
            value={p.embedModelId}
            onChange={p.setEmbedModelId}
            allowClear
            placeholder="Model"
            style={{ width: '100%', marginTop: 12 }}
            disabled={!p.embedProvider}
            showSearch
            optionFilterProp="children"
          >
            {(p.embeddingMap[p.embedProvider || ''] || []).map((m:any) => (
              <Option key={m.id} value={m.id}>
                <span>{m.id}{m.default ? <Tag color="gold" style={{ marginLeft: 6 }}>默认</Tag> : null}</span>
              </Option>
            ))}
          </Select>
        </div>
      )}

      {!p.hideRerank && (
        <div className="studio-section settings-group-model">
          <Text type="secondary" className="setting-label">Rerank模型</Text>
          <Select 
            placeholder="选择Rerank模型（来自9050网关）"
            allowClear
            style={{ width: '100%', borderRadius: 8 }}
            value={p.rerankModel}
            onChange={p.setRerankModel}
            options={p.rerankOptions || []}
            showSearch
            optionFilterProp="label"
          />
        </div>
      )}

      <div className="studio-section settings-group-model">
        <Text type="secondary" className="setting-label">温度</Text>
        <Slider min={0} max={1} step={0.05} value={p.temperature} onChange={p.setTemperature} style={{ marginTop: 8 }} />
        <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', marginTop: 4 }}>{p.temperature}</div>
      </div>

      <div className="studio-section settings-group-model">
        <Text type="secondary" className="setting-label">Top P</Text>
        <Slider min={0} max={1} step={0.05} value={p.topP} onChange={p.setTopP} style={{ marginTop: 8 }} />
        <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', marginTop: 4 }}>{p.topP}</div>
      </div>

      <div className="studio-section settings-group-model">
        <Text type="secondary" className="setting-label">最大 Token</Text>
        <InputNumber
          min={100}
          max={p.models.find(m=>m.id===p.chatModel)?.context_length || 4000}
          step={50}
          value={p.maxTokens}
          onChange={(v)=>p.setMaxTokens(Number(v)||2000)}
          style={{ width: '100%', marginTop: 8, borderRadius: 6 }}
          size="large"
        />
      </div>
    </div>
  );
};

export default ModelSettingsSection;
