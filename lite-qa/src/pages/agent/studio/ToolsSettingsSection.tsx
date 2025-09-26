import React from 'react';
import { Collapse, Segmented, Space, Switch, Tag, Typography } from 'antd';
import type { AgentTool } from '../../services/userAgentService';

const { Text } = Typography;

export interface ToolsSettingsProps {
  availableTools: AgentTool[];
  selectedTools: string[];
  setSelectedTools: (updater: (prev: string[]) => string[]) => void;
  toolTab: 'builtin'|'mcp'|'api';
  setToolTab: (v: 'builtin'|'mcp'|'api') => void;
  activeTool?: string;
  setActiveTool: (code?: string) => void;
  filteredTools: AgentTool[];
  renderToolForm: (tool: AgentTool) => React.ReactNode;
}

const ToolsSettingsSection: React.FC<ToolsSettingsProps> = (p) => {
  return (
    <div>
      <div className="studio-section settings-group-basic">
        <Text type="secondary" className="setting-label">工具选择</Text>

        <div style={{ marginBottom: 10 }}>
          <Space wrap>
            {p.selectedTools.map(code => {
              const t = p.availableTools.find(x=>x.tool_code===code);
              if (!t) return null;
              return (
                <Tag key={code} color={p.activeTool===code? 'blue':'default'} closable onClose={(e)=>{e.preventDefault(); p.setSelectedTools(prev=>prev.filter(x=>x!==code));}} onClick={()=>p.setActiveTool(code)}>
                  {t.tool_name}
                </Tag>
              );
            })}
            {p.selectedTools.length === 0 && <span style={{ color:'#64748b' }}>未选择工具</span>}
          </Space>
        </div>

        <div className="tool-filter" style={{ marginBottom: 10 }}>
          <Segmented
            size="small"
            value={p.toolTab}
            onChange={(v)=>p.setToolTab(v as any)}
            options={[{label:'内置', value:'builtin'},{label:'MCP', value:'mcp'},{label:'API', value:'api'}]}
          />
        </div>

        <div className="tool-list-stack">
          <Collapse bordered={false} accordion activeKey={p.activeTool} onChange={(k)=>p.setActiveTool(Array.isArray(k)? (k[0] as string) : (k as string))}>
            {p.filteredTools.map(t => {
              const selected = p.selectedTools.includes(t.tool_code);
              const header = (
                <div className="tool-panel-header" onClick={(e)=>{ e.stopPropagation(); }}>
                  <div className="left">
                    <span className="name">{t.tool_name}</span>
                    <span className={`type-badge ${t.tool_type}`}>{t.tool_type}</span>
                  </div>
                  <div className="right">
                    <Switch size="small" checked={selected} onChange={(v)=>{ v ? p.setSelectedTools(prev=>[...prev, t.tool_code]) : p.setSelectedTools(prev=>prev.filter(x=>x!==t.tool_code)); }} onClick={(e)=>e.stopPropagation()} />
                    <span className="select-text">{selected ? '已启用' : '未启用'}</span>
                  </div>
                </div>
              );
              return (
                <Collapse.Panel header={header} key={t.tool_code}>
                  {p.renderToolForm(t)}
                </Collapse.Panel>
              );
            })}
          </Collapse>
          {p.filteredTools.length === 0 && <div className="empty">无匹配工具</div>}
        </div>
      </div>
    </div>
  );
};

export default ToolsSettingsSection;

