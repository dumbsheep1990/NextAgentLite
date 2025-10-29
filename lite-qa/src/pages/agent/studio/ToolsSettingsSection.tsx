import React, { useEffect, useState } from 'react';
import { Collapse, Segmented, Space, Switch, Tag, Typography, Select, Divider } from 'antd';
import type { AgentTool } from '../../../services/userAgentService';
import api from '../../../services/api';  // 🔥 修复：使用配置好的api实例

const { Text } = Typography;

export interface ToolsSettingsProps {
  availableTools: AgentTool[];
  selectedTools: string[];
  setSelectedTools: (updater: (prev: string[]) => string[]) => void;
  toolTab: 'builtin'|'mcp'|'api'|'custom_crawler';
  setToolTab: (v: 'builtin'|'mcp'|'api'|'custom_crawler') => void;
  activeTool?: string;
  setActiveTool: (code?: string) => void;
  filteredTools: AgentTool[];
  renderToolForm: (tool: AgentTool) => React.ReactNode;
  // Hook配置（只支持直接选择Hooks，不使用Pipeline）
  selectedPreHooks?: string[];
  setSelectedPreHooks?: (v: string[]) => void;
  selectedPostHooks?: string[];
  setSelectedPostHooks?: (v: string[]) => void;
}

const ToolsSettingsSection: React.FC<ToolsSettingsProps> = (p) => {
  // 加载可用的Hooks列表
  const [availablePreHooks, setAvailablePreHooks] = useState<any[]>([]);
  const [availablePostHooks, setAvailablePostHooks] = useState<any[]>([]);
  const [loadingHooks, setLoadingHooks] = useState(false);

  useEffect(() => {
    const loadHooks = async () => {
      try {
        setLoadingHooks(true);
        console.log('[ToolsSettings] 开始加载Hooks...');
        const { data } = await api.get('/hook-pipelines/available/hooks');  // 🔥 修复：使用api实例，baseURL已包含/api/v1
        console.log('[ToolsSettings] API返回数据:', data);
        console.log('[ToolsSettings] data类型:', typeof data, 'isArray:', Array.isArray(data));

        // 🔥 修复：data已经是数组，直接使用，确保是数组类型
        const hooks = Array.isArray(data) ? data : [];
        console.log('[ToolsSettings] hooks数组长度:', hooks.length);

        // 分离Pre-hooks和Post-hooks
        const preHooks = hooks.filter((h: any) => h.hook_type === 'pre');
        const postHooks = hooks.filter((h: any) => h.hook_type === 'post');

        console.log('[ToolsSettings] Pre-hooks数量:', preHooks.length);
        console.log('[ToolsSettings] Post-hooks数量:', postHooks.length);

        setAvailablePreHooks(preHooks);
        setAvailablePostHooks(postHooks);
      } catch (error) {
        console.error('[ToolsSettings] 加载可用Hooks失败:', error);
        setAvailablePreHooks([]);
        setAvailablePostHooks([]);
      } finally {
        setLoadingHooks(false);
      }
    };
    loadHooks();
  }, []);

  // 调试日志
  console.log('[ToolsSettings] Render - Props检查:', {
    hasSetSelectedPreHooks: !!p.setSelectedPreHooks,
    hasSetSelectedPostHooks: !!p.setSelectedPostHooks,
    availablePreHooksCount: availablePreHooks.length,
    availablePostHooksCount: availablePostHooks.length,
    selectedPreHooks: p.selectedPreHooks,
    selectedPostHooks: p.selectedPostHooks
  });

  return (
    <div>
      {/* Hook配置区域 */}
      {p.setSelectedPreHooks && p.setSelectedPostHooks && (
        <>
          <div className="studio-section settings-group-knowledge">
            <div className="section-header">
              <span>流程拦截器配置</span>
              <span className="req-pill hollow">Hooks</span>
            </div>

            {/* Hooks选择界面 */}
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {/* Pre-Hooks选择 */}
              <div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Pre-Hooks</Text>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    在问答处理前执行
                  </Text>
                </div>
                <Select
                  mode="multiple"
                  placeholder="选择Pre-Hooks（可选）"
                  allowClear
                  loading={loadingHooks}
                  value={p.selectedPreHooks || []}
                  onChange={(v) => p.setSelectedPreHooks?.(v)}
                  style={{ width: '100%' }}
                  options={availablePreHooks.map(hook => ({
                    value: hook.hook_id,
                    label: (
                      <Space>
                        <span>{hook.name || hook.hook_id}</span>
                        {hook.category && (
                          <Tag size="small" color="blue">{hook.category}</Tag>
                        )}
                      </Space>
                    )
                  }))}
                  optionFilterProp="children"
                />
                {(p.selectedPreHooks || []).length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      已选择 {(p.selectedPreHooks || []).length} 个Pre-Hook
                    </Text>
                  </div>
                )}
              </div>

              {/* Post-Hooks选择 */}
              <div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Post-Hooks</Text>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    在问答生成后执行
                  </Text>
                </div>
                <Select
                  mode="multiple"
                  placeholder="选择Post-Hooks（可选）"
                  allowClear
                  loading={loadingHooks}
                  value={p.selectedPostHooks || []}
                  onChange={(v) => p.setSelectedPostHooks?.(v)}
                  style={{ width: '100%' }}
                  options={availablePostHooks.map(hook => ({
                    value: hook.hook_id,
                    label: (
                      <Space>
                        <span>{hook.name || hook.hook_id}</span>
                        {hook.category && (
                          <Tag size="small" color="green">{hook.category}</Tag>
                        )}
                      </Space>
                    )
                  }))}
                  optionFilterProp="children"
                />
                {(p.selectedPostHooks || []).length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      已选择 {(p.selectedPostHooks || []).length} 个Post-Hook
                    </Text>
                  </div>
                )}
              </div>

              {/* Hooks详情展示 */}
              {((p.selectedPreHooks || []).length > 0 || (p.selectedPostHooks || []).length > 0) && (
                <Collapse
                  bordered={false}
                  size="small"
                  items={[{
                    key: 'hook-details',
                    label: 'Hook详情',
                    children: (
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        {(p.selectedPreHooks || []).length > 0 && (
                          <div>
                            <Text strong>Pre-Hooks ({(p.selectedPreHooks || []).length}):</Text>
                            <div style={{ marginTop: 4 }}>
                              {(p.selectedPreHooks || []).map(hookId => {
                                const hook = availablePreHooks.find(h => h.hook_id === hookId);
                                return (
                                  <div key={hookId} style={{ marginLeft: 12, marginBottom: 4 }}>
                                    <Text type="secondary">• {hook?.name || hookId}</Text>
                                    {hook?.description && (
                                      <div style={{ marginLeft: 20, fontSize: 12, color: '#8c8c8c' }}>
                                        {hook.description}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {(p.selectedPostHooks || []).length > 0 && (
                          <div>
                            <Text strong>Post-Hooks ({(p.selectedPostHooks || []).length}):</Text>
                            <div style={{ marginTop: 4 }}>
                              {(p.selectedPostHooks || []).map(hookId => {
                                const hook = availablePostHooks.find(h => h.hook_id === hookId);
                                return (
                                  <div key={hookId} style={{ marginLeft: 12, marginBottom: 4 }}>
                                    <Text type="secondary">• {hook?.name || hookId}</Text>
                                    {hook?.description && (
                                      <div style={{ marginLeft: 20, fontSize: 12, color: '#8c8c8c' }}>
                                        {hook.description}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </Space>
                    )
                  }]}
                />
              )}
            </Space>
          </div>
          <Divider style={{ margin: '16px 0' }} />
        </>
      )}

      {/* 工具选择区域 */}
      <div className="studio-section settings-group-basic">
        <div className="section-header">
          <span>已选择工具</span>
          {p.selectedTools.length > 0 && (
            <span className="req-pill hollow">{p.selectedTools.length} 个</span>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          {p.selectedTools.length > 0 ? (
            <Space wrap size={[8, 8]}>
              {p.selectedTools.map(code => {
                const t = p.availableTools.find(x=>x.tool_code===code);
                if (!t) return null;
                const isActive = p.activeTool === code;
                return (
                  <Tag
                    key={code}
                    color={isActive ? 'blue' : 'default'}
                    closable
                    onClose={(e)=>{
                      e.preventDefault();
                      p.setSelectedTools(prev=>prev.filter(x=>x!==code));
                      if (isActive) p.setActiveTool(undefined);
                    }}
                    onClick={()=>p.setActiveTool(code)}
                    style={{
                      cursor: 'pointer',
                      padding: '4px 12px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: isActive ? '1px solid #1677ff' : '1px solid #e8ecf3',
                      background: isActive ? '#e6f4ff' : '#f8fafc',
                      color: isActive ? '#1677ff' : '#475569',
                      fontWeight: isActive ? 500 : 400,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {t.tool_name}
                  </Tag>
                );
              })}
            </Space>
          ) : (
            <div style={{
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #e2e8f0',
              color: '#64748b',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              未选择工具，请从下方列表中选择
            </div>
          )}
        </div>

        <div style={{ marginBottom: 10 }}>
          <Text type="secondary" style={{ fontSize: '13px', fontWeight: 500 }}>
            工具类型
          </Text>
        </div>
        <div className="tool-filter" style={{ marginBottom: 16 }}>
          {/* 自定义按钮组替代Segmented */}
          <div style={{
            display: 'flex',
            width: '100%',
            padding: '2px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            gap: '3px'
          }}>
            {[
              { label: '内置', value: 'builtin', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', dotColor: '#c4b5fd' },
              { label: 'MCP', value: 'mcp', gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', dotColor: '#fbcfe8' },
              { label: 'API', value: 'api', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)', dotColor: '#a5f3fc' },
              { label: '自定义', value: 'custom_crawler', gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', dotColor: '#a7f3d0' }
            ].map((item) => {
              const isSelected = p.toolTab === item.value;
              return (
                <div
                  key={item.value}
                  onClick={() => p.setToolTab(item.value as any)}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    minHeight: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    background: isSelected ? item.gradient : 'transparent',
                    color: isSelected ? '#ffffff' : '#6b7280',
                    boxShadow: isSelected ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }
                  }}
                >
                  {isSelected && (
                    <span style={{
                      position: 'absolute',
                      left: '10px',
                      fontSize: '7px',
                      color: item.dotColor
                    }}>●</span>
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="tool-list-stack">
          <Collapse
            bordered={false}
            accordion
            activeKey={p.activeTool}
            onChange={(k)=>p.setActiveTool(Array.isArray(k)? (k[0] as string) : (k as string))}
            style={{
              background: 'transparent'
            }}
          >
            {p.filteredTools.map(t => {
              const selected = p.selectedTools.includes(t.tool_code);
              const header = (
                <div
                  className="tool-panel-header"
                  onClick={(e)=>{ e.stopPropagation(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    width: '100%'
                  }}
                >
                  <div
                    className="left"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 0,
                      overflow: 'hidden',
                      maxWidth: 'calc(100% - 120px)'
                    }}
                  >
                    <span
                      className="name"
                      style={{
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '200px'
                      }}
                    >
                      {t.tool_name}
                    </span>
                    <span
                      className={`type-badge ${t.tool_type}`}
                      style={{
                        fontSize: '11px',
                        flexShrink: 0
                      }}
                    >
                      {t.tool_type}
                    </span>
                  </div>
                  <div
                    className="right"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0,
                      minWidth: '100px'
                    }}
                  >
                    <Switch size="small" checked={selected} onChange={(v)=>{ v ? p.setSelectedTools(prev=>[...prev, t.tool_code]) : p.setSelectedTools(prev=>prev.filter(x=>x!==t.tool_code)); }} onClick={(e)=>e.stopPropagation()} />
                    <span
                      className="select-text"
                      style={{
                        fontSize: '12px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {selected ? '已启用' : '未启用'}
                    </span>
                  </div>
                </div>
              );
              return (
                <Collapse.Panel
                  header={header}
                  key={t.tool_code}
                  style={{
                    marginBottom: '8px',
                    border: selected ? '1px solid #d6e4ff' : '1px solid #e8ecf3',
                    borderRadius: '8px',
                    background: selected ? '#f0f7ff' : '#fff',
                    overflow: 'hidden'
                  }}
                >
                  {p.renderToolForm(t)}
                </Collapse.Panel>
              );
            })}
          </Collapse>
          {p.filteredTools.length === 0 && (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '13px'
            }}>
              该类型下暂无可用工具
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolsSettingsSection;

