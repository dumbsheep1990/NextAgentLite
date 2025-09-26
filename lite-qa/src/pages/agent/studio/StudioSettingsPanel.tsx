import React from 'react';
import { Tabs, Space, Button, Dropdown } from 'antd';
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
  // 草稿管理
  drafts?: Array<{ id: string; name: string; createdAt: number }>;
  onLoadDraft?: (id: string) => void;
  onDeleteDraft?: (id: string) => void;
  onSaveDraftAs?: () => void;
  basic: BasicSettingsProps;
  model: ModelSettingsProps;
  tools: ToolsSettingsProps;
  advanced: import('./AdvancedSettingsSection').AdvancedSettingsProps;
}

const StudioSettingsPanel: React.FC<StudioSettingsPanelProps> = ({ configTab, setConfigTab, onCancel, onSave, onExport, showAdvanced = true, drafts, onLoadDraft, onDeleteDraft, onSaveDraftAs, basic, model, tools, advanced }) => {
  const draftMenuItems = [
    { key: 'save', label: '保存草稿（快速）' },
    { key: 'saveas', label: '另存为草稿' },
    { type: 'divider' as const },
    ...(drafts && drafts.length ? [{ key: 'load_header', label: '加载草稿', type: 'group' as const, children: drafts.slice(0,10).map(d => ({ key: `load:${d.id}`, label: `${d.name}` })) }] : []),
    ...(drafts && drafts.length ? [{ key: 'del_header', label: '删除草稿', type: 'group' as const, children: drafts.slice(0,10).map(d => ({ key: `del:${d.id}`, label: `${d.name}` })) }] : []),
  ];
  const onDraftClick = (info: any) => {
    const k: string = info?.key || '';
    if (k === 'save') { onSave && onSave(); return; }
    if (k === 'saveas') { onSaveDraftAs && onSaveDraftAs(); return; }
    if (k.startsWith('load:')) { const id = k.slice(5); onLoadDraft && onLoadDraft(id); return; }
    if (k.startsWith('del:')) { const id = k.slice(4); onDeleteDraft && onDeleteDraft(id); return; }
  };
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
          <Dropdown menu={{ items: draftMenuItems as any, onClick: onDraftClick }} placement="topRight">
            <Button>草稿</Button>
          </Dropdown>
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
