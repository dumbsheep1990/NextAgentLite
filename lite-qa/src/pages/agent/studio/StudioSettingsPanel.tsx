import React from 'react';
import { Tabs, Space, Button } from 'antd';
import BasicSettingsSection from './BasicSettingsSection';
import PromptSettingsSection from './PromptSettingsSection';
import type { RenderPreviewRequest } from '../../../services/promptService';
import ModelSettingsSection from './ModelSettingsSection';
import ToolsSettingsSection from './ToolsSettingsSection';
import AdvancedSettingsSection from './AdvancedSettingsSection';
import type { BasicSettingsProps } from './BasicSettingsSection';
import type { ModelSettingsProps } from './ModelSettingsSection';
import type { ToolsSettingsProps } from './ToolsSettingsSection';

export interface StudioSettingsPanelProps {
  configTab: 'basic'|'model'|'tools'|'advanced';
  setConfigTab: (k: 'basic'|'model'|'tools'|'advanced') => void;
  onCancel: () => void;
  onSave: () => void;
  onExport?: () => void;
  showAdvanced?: boolean;
  // 草稿管理（此版本仅保留“保存草稿”快速按钮）
  drafts?: Array<{ id: string; name: string; createdAt: number }>;
  onLoadDraft?: (id: string) => void;
  onDeleteDraft?: (id: string) => void;
  onSaveDraftAs?: () => void; // 暂不使用
  basic: BasicSettingsProps;
  model: ModelSettingsProps;
  tools: ToolsSettingsProps;
  advanced: import('./AdvancedSettingsSection').AdvancedSettingsProps;
}

const StudioSettingsPanel: React.FC<StudioSettingsPanelProps> = ({ configTab, setConfigTab, onCancel, onSave, onExport, showAdvanced = true, drafts, onLoadDraft, onDeleteDraft, onSaveDraftAs, basic, model, tools, advanced }) => {
  return (
    <div className="studio-settings-panel">
      <div className="settings-header">
        <Tabs
          size="small"
          activeKey={configTab}
          onChange={(k)=>setConfigTab(k as any)}
          items={[
            {key:'basic', label:'基础配置'},
            {key:'model', label:'模型配置'},
            {key:'tools', label:'工具配置'},
            ...(showAdvanced ? [{key:'advanced', label:'高级配置'} as const] : [])
          ]}
        />
      </div>
      <div className="settings-scroll">
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {configTab === 'basic' ? (
            <BasicSettingsSection {...basic} />
          ) : (configTab === 'model') ? (
            <ModelSettingsSection {...model} />
          ) : (configTab === 'tools') ? (
            <ToolsSettingsSection {...tools} />
          ) : showAdvanced ? (
            <AdvancedSettingsSection {...advanced} />
          ) : null}
        </Space>
      </div>
      <div className="studio-actions fixed" style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:8 }}>
        <Button
          onClick={onCancel}
          type="default"
          style={{
            background: '#f8fafc',
            borderColor: '#e2e8f0',
            color: '#334155'
          }}
        >
          取消
        </Button>
        <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
          <Button onClick={onSave}>保存草稿</Button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {/* 保留导出，保存草稿收纳至“草稿”菜单 */}
          <Button onClick={onExport} disabled={!onExport} style={{ background:'#22c55e', borderColor:'#22c55e', color:'#fff' }}>导出</Button>
        </div>
      </div>
    </div>
  );
};

export default StudioSettingsPanel;
