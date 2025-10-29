import React, { useState, useEffect } from 'react';
import { Modal, Table, Switch, Select, Button, Space, message, Tooltip, Tag } from 'antd';
import type { TeamMemberConfig } from './TeamStudioSettingsPanel';
const { Option } = Select;

export interface TeamMemberConfigModalProps {
  open: boolean;
  onClose: () => void;
  members: TeamMemberConfig[];
  onConfirm: (updatedMembers: TeamMemberConfig[]) => void;
  modelOptions: Array<{ value: string; label: string }>;
}

const TeamMemberConfigModal: React.FC<TeamMemberConfigModalProps> = ({
  open,
  onClose,
  members,
  onConfirm,
  modelOptions
}) => {
  // 本地状态：编辑中的成员配置
  const [localMembers, setLocalMembers] = useState<TeamMemberConfig[]>([]);

  // 每次打开时重置为传入的members
  useEffect(() => {
    if (open) {
      setLocalMembers(members.map(m => ({ ...m })));
    }
  }, [open, members]);

  // 更新单个成员
  const updateMember = (id: string, patch: Partial<TeamMemberConfig>) => {
    setLocalMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  };

  // 批量操作：全部启用
  const handleEnableAll = () => {
    setLocalMembers(prev => prev.map(m => ({
      ...m,
      enabled: m.canToggle === false ? true : true // 必启的保持true，可选的设为true
    })));
    message.success('已启用所有可启用的子智能体');
  };

  // 批量操作：全部禁用（除了必启的）
  const handleDisableAllOptional = () => {
    setLocalMembers(prev => prev.map(m => ({
      ...m,
      enabled: m.canToggle === false ? true : false // 必启的保持true，可选的设为false
    })));
    message.success('已禁用所有可选的子智能体');
  };

  // 批量操作：统一设置模型
  const [bulkModel, setBulkModel] = useState<string | undefined>(undefined);
  const handleApplyBulkModel = () => {
    if (!bulkModel) {
      message.warning('请先选择要应用的模型');
      return;
    }
    setLocalMembers(prev => prev.map(m => ({ ...m, model: bulkModel })));
    message.success('已将所有子智能体的模型设置为：' + (modelOptions.find(o => o.value === bulkModel)?.label || bulkModel));
    setBulkModel(undefined);
  };

  // 确认并保存
  const handleOk = () => {
    const enabledCount = localMembers.filter(m => m.enabled).length;
    if (enabledCount === 0) {
      message.error('至少需要启用一个子智能体');
      return;
    }
    onConfirm(localMembers);
    onClose();
  };

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (_: any, record: TeamMemberConfig) => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{record.name}</span>
            {record.canToggle === false && <Tag color="blue" style={{ fontSize: 11 }}>必要</Tag>}
          </div>
          {record.role && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{record.role}</div>
          )}
        </div>
      )
    },
    {
      title: '启用状态',
      key: 'enabled',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: TeamMemberConfig) => (
        <Tooltip title={record.canToggle === false ? '该子智能体为必要智能体，不可关闭' : ''}>
          <Switch
            checked={record.enabled}
            disabled={record.canToggle === false}
            onChange={(v) => {
              if (record.canToggle === false) return;
              updateMember(record.id, { enabled: v });
            }}
          />
        </Tooltip>
      )
    },
    {
      title: '模型配置',
      key: 'model',
      width: 280,
      render: (_: any, record: TeamMemberConfig) => (
        <Select
          value={record.model || undefined}
          onChange={(v) => updateMember(record.id, { model: v as string })}
          allowClear
          placeholder="选择模型（留空使用默认）"
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="children"
        >
          {modelOptions.map(opt => (
            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
          ))}
        </Select>
      )
    }
  ];

  return (
    <Modal
      title="子智能体统一配置"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      width={900}
      bodyStyle={{ paddingTop: 16 }}
      okText="确认应用"
      cancelText="取消"
    >
      {/* 批量操作工具栏 */}
      <div style={{
        marginBottom: 16,
        padding: 12,
        background: '#f8fafc',
        borderRadius: 8,
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ fontWeight: 600, marginBottom: 10, color: '#334155' }}>批量操作</div>
        <Space wrap>
          <Button size="small" onClick={handleEnableAll}>
            全部启用
          </Button>
          <Button size="small" onClick={handleDisableAllOptional}>
            禁用可选项
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>统一模型：</span>
            <Select
              value={bulkModel}
              onChange={setBulkModel}
              allowClear
              placeholder="选择模型"
              style={{ width: 220 }}
              size="small"
              showSearch
              optionFilterProp="children"
            >
              {modelOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
            <Button
              size="small"
              type="primary"
              onClick={handleApplyBulkModel}
              disabled={!bulkModel}
            >
              应用到全部
            </Button>
          </div>
        </Space>
      </div>

      {/* 配置表格 */}
      <Table
        dataSource={localMembers}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
        bordered
        rowClassName={(record) => {
          if (record.canToggle === false) return 'member-row-required';
          return record.enabled ? 'member-row-enabled' : 'member-row-disabled';
        }}
        style={{ marginBottom: 16 }}
      />

      {/* 状态统计 */}
      <div style={{
        padding: 10,
        background: '#fefce8',
        borderRadius: 6,
        fontSize: 13,
        color: '#854d0e',
        border: '1px solid #fde047'
      }}>
        <Space size={20}>
          <span>
            已启用: <strong>{localMembers.filter(m => m.enabled).length}</strong> / {localMembers.length}
          </span>
          <span>
            必要: <strong>{localMembers.filter(m => m.canToggle === false).length}</strong>
          </span>
          <span>
            已配置模型: <strong>{localMembers.filter(m => m.model).length}</strong> / {localMembers.length}
          </span>
        </Space>
      </div>

      {/* 内联样式 */}
      <style>{`
        .member-row-required {
          background: #eff6ff;
        }
        .member-row-enabled {
          background: #f0fdf4;
        }
        .member-row-disabled {
          background: #fafafa;
          opacity: 0.7;
        }
        .member-row-required:hover,
        .member-row-enabled:hover,
        .member-row-disabled:hover {
          opacity: 1;
        }
      `}</style>
    </Modal>
  );
};

export default TeamMemberConfigModal;
