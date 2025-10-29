import React, { useState, useEffect } from 'react';
import { Modal, Input, InputNumber, Switch, Select, Space, Divider, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { TeamMemberConfig } from './TeamStudioSettingsPanel';

const { TextArea } = Input;
const { Option } = Select;

export interface SubAgentDetailModalProps {
  open: boolean;
  onClose: () => void;
  agent: TeamMemberConfig | null;
  onConfirm: (updatedAgent: TeamMemberConfig) => void;
  modelOptions: Array<{ value: string; label: string }>;
}

const SubAgentDetailModal: React.FC<SubAgentDetailModalProps> = ({
  open,
  onClose,
  agent,
  onConfirm,
  modelOptions
}) => {
  const [localAgent, setLocalAgent] = useState<TeamMemberConfig | null>(null);

  useEffect(() => {
    if (open && agent) {
      setLocalAgent({ ...agent });
    }
  }, [open, agent]);

  if (!localAgent) return null;

  const handleOk = () => {
    onConfirm(localAgent);
    onClose();
  };

  const updateField = <K extends keyof TeamMemberConfig>(
    field: K,
    value: TeamMemberConfig[K]
  ) => {
    setLocalAgent(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>子智能体配置 · {localAgent.name}</span>
          {localAgent.canToggle === false && <Tag color="blue">必要</Tag>}
          {localAgent.enabled ? (
            <Tag color="success">已启用</Tag>
          ) : (
            <Tag color="default">未启用</Tag>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      width={1000}
      bodyStyle={{ paddingTop: 16 }}
      okText="确认应用"
      cancelText="取消"
    >
      {/* 左右两栏布局 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* 左栏：基础信息和提示词 */}
        <div>
          {/* 基础信息 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#334155' }}>基础信息</div>

            {/* 启用状态 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Space>
                  <span style={{ fontSize: 13, color: '#64748b' }}>启用状态</span>
                  {localAgent.canToggle === false && (
                    <Tooltip title="该子智能体为必要智能体，不可关闭">
                      <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                    </Tooltip>
                  )}
                </Space>
                <Switch
                  checked={localAgent.enabled}
                  disabled={localAgent.canToggle === false}
                  onChange={(v) => updateField('enabled', v)}
                />
              </div>
            </div>

            {/* 角色 */}
            {localAgent.role && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>角色</div>
                <div style={{ fontSize: 14, color: '#334155' }}>{localAgent.role}</div>
              </div>
            )}

            {/* 模型配置 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>模型配置</div>
              <Select
                value={localAgent.model || undefined}
                onChange={(v) => updateField('model', v as string)}
                allowClear
                placeholder="选择模型（留空使用默认）"
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="children"
                disabled={!localAgent.enabled}
              >
                {modelOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* 系统提示词 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#334155' }}>
              系统提示词 <span style={{ color: '#f59e0b' }}>✱</span>
            </div>
            <TextArea
              value={localAgent.prompt}
              onChange={(e) => updateField('prompt', e.target.value)}
              rows={16}
              placeholder="为该子智能体设置系统提示词（instructions）"
              style={{
                fontFamily: 'monospace',
                fontSize: 13,
                minHeight: 320
              }}
              disabled={!localAgent.enabled}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              提示词定义了子智能体的行为模式和约束规则
            </div>
          </div>
        </div>

        {/* 右栏：模型参数和行为设置 */}
        <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 20 }}>
          {/* 模型参数 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#334155' }}>模型参数</div>

            {/* Temperature */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Space>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Temperature</span>
                  <Tooltip title="控制输出随机性，0 表示确定性输出，2 表示高创造性">
                    <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                  </Tooltip>
                </Space>
                <InputNumber
                  min={0}
                  max={2}
                  step={0.1}
                  value={localAgent.temperature ?? 0.1}
                  onChange={(v) => updateField('temperature', v ?? 0.1)}
                  style={{ width: 100 }}
                  disabled={!localAgent.enabled}
                />
              </div>
            </div>

            {/* Max Tokens */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Space>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Max Tokens</span>
                  <Tooltip title="最大输出 token 数量">
                    <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                  </Tooltip>
                </Space>
                <InputNumber
                  min={256}
                  max={8192}
                  step={256}
                  value={localAgent.maxTokens ?? 4096}
                  onChange={(v) => updateField('maxTokens', v ?? 4096)}
                  style={{ width: 100 }}
                  disabled={!localAgent.enabled}
                />
              </div>
            </div>

            {/* Top P */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Space>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Top P</span>
                  <Tooltip title="核采样参数，通常设为 1.0">
                    <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                  </Tooltip>
                </Space>
                <InputNumber
                  min={0}
                  max={1}
                  step={0.1}
                  value={localAgent.topP ?? 1.0}
                  onChange={(v) => updateField('topP', v ?? 1.0)}
                  style={{ width: 100 }}
                  disabled={!localAgent.enabled}
                />
              </div>
            </div>

            {/* Frequency Penalty */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Space>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Frequency Penalty</span>
                  <Tooltip title="降低重复词汇的频率，范围 -2.0 到 2.0">
                    <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                  </Tooltip>
                </Space>
                <InputNumber
                  min={-2}
                  max={2}
                  step={0.1}
                  value={localAgent.frequencyPenalty ?? 0.0}
                  onChange={(v) => updateField('frequencyPenalty', v ?? 0.0)}
                  style={{ width: 100 }}
                  disabled={!localAgent.enabled}
                />
              </div>
            </div>

            {/* Presence Penalty */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Space>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Presence Penalty</span>
                  <Tooltip title="鼓励模型谈论新话题，范围 -2.0 到 2.0">
                    <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                  </Tooltip>
                </Space>
                <InputNumber
                  min={-2}
                  max={2}
                  step={0.1}
                  value={localAgent.presencePenalty ?? 0.0}
                  onChange={(v) => updateField('presencePenalty', v ?? 0.0)}
                  style={{ width: 100 }}
                  disabled={!localAgent.enabled}
                />
              </div>
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* 行为开关 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#334155' }}>行为设置</div>

            {/* Show Tool Calls */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space>
                  <span style={{ fontSize: 13, color: '#64748b' }}>显示工具调用</span>
                  <Tooltip title="是否在输出中显示工具调用的详细信息">
                    <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                  </Tooltip>
                </Space>
                <Switch
                  checked={localAgent.showToolCalls ?? true}
                  onChange={(v) => updateField('showToolCalls', v)}
                  disabled={!localAgent.enabled}
                />
              </div>
            </div>

            {/* Markdown Output */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Markdown 输出</span>
                  <Tooltip title="是否使用 Markdown 格式输出">
                    <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                  </Tooltip>
                </Space>
                <Switch
                  checked={localAgent.markdown ?? true}
                  onChange={(v) => updateField('markdown', v)}
                  disabled={!localAgent.enabled}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      <div style={{
        padding: 10,
        background: '#fefce8',
        borderRadius: 6,
        fontSize: 12,
        color: '#854d0e',
        border: '1px solid #fde047',
        marginTop: 16
      }}>
        配置修改后，点击"确认应用"生效。取消则放弃修改。
      </div>
    </Modal>
  );
};

export default SubAgentDetailModal;
