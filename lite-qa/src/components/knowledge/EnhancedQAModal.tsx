/**
 * 增强版自定义问答编辑Modal
 * 支持：基础问答、知识库路由、工具调用配置
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Input,
  Select,
  Switch,
  Space,
  Typography,
  Tag,
  message,
  Alert,
  Tooltip
} from 'antd';
import {
  QuestionCircleOutlined,
  DatabaseOutlined,
  ToolOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api'; // 修复：使用配置好的api实例
import type { EnhancedQAFormData } from '../../types/customQA';

const { TextArea } = Input;
const { Text } = Typography;

// Modal组件属性接口
interface EnhancedQAModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EnhancedQAFormData) => Promise<void>;
  currentKbId: string;
  mode?: 'add' | 'edit';
  initialData?: Partial<EnhancedQAFormData>;
}

interface KBOption {
  id: string;
  name: string;
  description?: string;
}

interface ToolOption {
  tool_code: string;
  tool_name: string;
  tool_type: 'builtin' | 'mcp' | 'api' | 'custom_crawler';
  description?: string;
}

const EnhancedQAModal: React.FC<EnhancedQAModalProps> = ({
  open,
  onClose,
  onSubmit,
  currentKbId,
  mode = 'add',
  initialData
}) => {
  // 基础表单数据
  const [formData, setFormData] = useState<EnhancedQAFormData>({
    question: '',
    answer: '',
    keywords: [],
    category: '自定义问答',
    enable_kb_routing: false,
    route_to_kb_ids: [],
    enable_tool_call: false,
    tool_names: []
  });

  // 关键词输入框的临时值
  const [keywordInput, setKeywordInput] = useState('');

  // 可用的知识库列表
  const [availableKBs, setAvailableKBs] = useState<KBOption[]>([]);
  const [kbsLoading, setKbsLoading] = useState(false);

  // 可用的工具列表
  const [availableTools, setAvailableTools] = useState<ToolOption[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (initialData) {
      setFormData({
        question: initialData.question || '',
        answer: initialData.answer || '',
        keywords: initialData.keywords || [],
        category: initialData.category || '自定义问答',
        enable_kb_routing: initialData.enable_kb_routing || false,
        route_to_kb_ids: initialData.route_to_kb_ids || [],
        enable_tool_call: initialData.enable_tool_call || false,
        tool_names: initialData.tool_names || []
      });
      setKeywordInput((initialData.keywords || []).join(', '));
    } else {
      // 重置表单
      setFormData({
        question: '',
        answer: '',
        keywords: [],
        category: '自定义问答',
        enable_kb_routing: false,
        route_to_kb_ids: [],
        enable_tool_call: false,
        tool_names: []
      });
      setKeywordInput('');
    }
  }, [initialData, open]);

  // 🔥 修复：使用useRef追踪是否已加载，避免重复触发
  const kbsLoadedRef = React.useRef(false);
  const toolsLoadedRef = React.useRef(false);

  // 加载可用知识库列表
  useEffect(() => {
    if (open && formData.enable_kb_routing && !kbsLoadedRef.current) {
      kbsLoadedRef.current = true;
      loadAvailableKBs();
    }
    if (!open) {
      kbsLoadedRef.current = false;
    }
  }, [open, formData.enable_kb_routing]); // 保持依赖不变，但通过ref防止重复加载

  // 加载可用工具列表
  useEffect(() => {
    if (open && formData.enable_tool_call && !toolsLoadedRef.current) {
      toolsLoadedRef.current = true;
      loadAvailableTools();
    }
    if (!open) {
      toolsLoadedRef.current = false;
    }
  }, [open, formData.enable_tool_call]); // 保持依赖不变，但通过ref防止重复加载

  const loadAvailableKBs = async () => {
    setKbsLoading(true);
    try {
      const res = await api.get('/collections', { params: { page: 1, size: 100 } });
      const kbs = (res.data?.collections || []).map((kb: any) => ({
        id: kb.id,
        name: kb.name,
        description: kb.description
      }));
      setAvailableKBs(kbs);
    } catch (error: any) {
      console.error('加载知识库列表失败:', error);
      message.error('加载知识库列表失败');
    } finally {
      setKbsLoading(false);
    }
  };

  const loadAvailableTools = async () => {
    setToolsLoading(true);
    try {
      // 从系统API获取所有可用工具（内置、MCP、API、自定义工具）
      const res = await api.get('/user-agents/tools');
      const tools = (res.data || []).map((tool: any) => ({
        tool_code: tool.tool_code,
        tool_name: tool.tool_name,
        tool_type: tool.tool_type,
        description: tool.description || ''
      }));
      setAvailableTools(tools);
    } catch (error: any) {
      console.error('加载工具列表失败:', error);
      message.error('加载工具列表失败');
      setAvailableTools([]);
    } finally {
      setToolsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // 表单验证
    if (!formData.question.trim()) {
      message.warning('请输入问题内容');
      return;
    }

    // 如果启用了知识库路由或工具调用，答案可以为空
    const needAnswer = !formData.enable_kb_routing && !formData.enable_tool_call;
    if (needAnswer && !formData.answer.trim()) {
      message.warning('请输入答案内容');
      return;
    }

    if (formData.enable_kb_routing && formData.route_to_kb_ids.length === 0) {
      message.warning('启用知识库路由时，请至少选择一个目标知识库');
      return;
    }

    if (formData.enable_tool_call && formData.tool_names.length === 0) {
      message.warning('启用工具调用时，请至少选择一个工具');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      console.error('提交失败:', error);
      message.error(error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeywordInputChange = (value: string) => {
    setKeywordInput(value);
    const keywords = value.split(',').map(k => k.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, keywords }));
  };

  return (
    <>
      <style>{`
        /* 强制覆盖下拉框背景色 */
        .enhanced-qa-select-dropdown,
        .enhanced-qa-select-dropdown.ant-select-dropdown,
        div.enhanced-qa-select-dropdown {
          background-color: #ffffff !important;
        }

        /* 选项背景色 */
        .enhanced-qa-select-dropdown .ant-select-item,
        .enhanced-qa-select-dropdown .ant-select-item-option {
          background-color: #ffffff !important;
          color: #262626 !important;
        }

        /* 已选中选项 */
        .enhanced-qa-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled),
        .enhanced-qa-select-dropdown .ant-select-item-option-selected {
          background-color: #e6f4ff !important;
          color: #1890ff !important;
        }

        /* 悬停选项 */
        .enhanced-qa-select-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled),
        .enhanced-qa-select-dropdown .ant-select-item:hover {
          background-color: #f5f5f5 !important;
          color: #262626 !important;
        }

        /* 分组标题 */
        .enhanced-qa-select-dropdown .ant-select-item-group {
          background-color: #fafafa !important;
          color: #262626 !important;
          font-weight: 600 !important;
        }

        /* 禁用选项 */
        .enhanced-qa-select-dropdown .ant-select-item-option-disabled {
          background-color: #f5f5f5 !important;
          color: #bfbfbf !important;
        }

        /* 下拉容器 */
        .enhanced-qa-select-dropdown .rc-virtual-list,
        .enhanced-qa-select-dropdown .rc-virtual-list-holder,
        .enhanced-qa-select-dropdown .rc-virtual-list-holder-inner {
          background-color: #ffffff !important;
        }
      `}</style>
      <Modal
        open={open}
        title={
          <Space>
            <QuestionCircleOutlined />
            <span>{mode === 'add' ? '添加自定义问答' : '编辑自定义问答'}</span>
          </Space>
        }
        onCancel={onClose}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={1100}
        cancelText="取消"
        okText={mode === 'add' ? '添加' : '保存'}
        destroyOnClose
        centered
        bodyStyle={{ padding: 0, height: 'calc(100vh - 220px)', maxHeight: '650px' }}
      >
        <div style={{ display: 'flex', height: '100%' }}>

        {/* 左侧面板 - 基础问答配置 */}
        <div style={{ width: '460px', borderRight: '1px solid #f0f0f0', padding: '20px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 12 }}>
              <QuestionCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} />
              <Text strong style={{ fontSize: 15 }}>基础问答配置</Text>
            </Space>
          </div>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text style={{ fontSize: 13, color: '#595959' }}>分类</Text>
              <Input
                placeholder="默认：自定义问答"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                style={{ marginTop: 6 }}
              />
            </div>

            <div>
              <Text style={{ fontSize: 13, color: '#595959' }}>
                问题 <span style={{ color: '#ff4d4f' }}>*</span>
              </Text>
              <Input
                placeholder="请输入问题内容"
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                style={{ marginTop: 6 }}
              />
            </div>

            <div>
              <Text style={{ fontSize: 13, color: '#595959' }}>
                答案 <span style={{ color: '#ff4d4f' }}>*</span>
              </Text>
              <TextArea
                rows={6}
                placeholder="请输入答案内容"
                value={formData.answer}
                onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                showCount
                maxLength={2000}
                style={{ marginTop: 6 }}
              />
            </div>

            <div>
              <Text style={{ fontSize: 13, color: '#595959' }}>关键词</Text>
              <Input
                placeholder="多个关键词请用逗号分隔，如：用户,数据,查询"
                value={keywordInput}
                onChange={(e) => handleKeywordInputChange(e.target.value)}
                style={{ marginTop: 6 }}
              />
              {formData.keywords.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Space wrap>
                    {formData.keywords.map((kw, idx) => (
                      <Tag key={idx} color="blue" style={{ fontSize: 12 }}>{kw}</Tag>
                    ))}
                  </Space>
                </div>
              )}
            </div>
          </Space>
        </div>

        {/* 右侧面板 - 增强功能配置 */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 12 }}>
              <ToolOutlined style={{ color: '#fa8c16', fontSize: 16 }} />
              <Text strong style={{ fontSize: 15 }}>增强功能配置</Text>
            </Space>
          </div>

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>

            {/* 知识库路由配置 */}
            <div style={{
              border: '1px solid #e8e8e8',
              borderRadius: 6,
              padding: 16,
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Space>
                  <DatabaseOutlined style={{ color: '#52c41a', fontSize: 15 }} />
                  <Text strong style={{ fontSize: 14 }}>知识库路由</Text>
                  <Tooltip title="启用后，当匹配到该问题时，可以指定从特定知识库中检索相关信息">
                    <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
                  </Tooltip>
                </Space>
                <Switch
                  checked={formData.enable_kb_routing}
                  onChange={(checked) => setFormData(prev => ({ ...prev, enable_kb_routing: checked }))}
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                  size="small"
                />
              </div>

              {formData.enable_kb_routing ? (
                <div>
                  <Alert
                    message="该问题将从指定的知识库中检索相关内容"
                    type="info"
                    showIcon
                    style={{ fontSize: 12, marginBottom: 12 }}
                  />
                  <div>
                    <Text style={{ fontSize: 13, color: '#595959' }}>
                      目标知识库 <span style={{ color: '#ff4d4f' }}>*</span>
                    </Text>
                    <Select
                      mode="multiple"
                      placeholder="选择一个或多个知识库"
                      value={formData.route_to_kb_ids}
                      onChange={(values) => setFormData(prev => ({ ...prev, route_to_kb_ids: values }))}
                      loading={kbsLoading}
                      style={{ width: '100%', marginTop: 6 }}
                      optionFilterProp="label"
                      popupClassName="enhanced-qa-select-dropdown"
                      dropdownStyle={{ backgroundColor: '#ffffff' }}
                      showSearch
                      filterOption={(input, option) => {
                        const label = option?.label?.toString().toLowerCase() || '';
                        return label.includes(input.toLowerCase());
                      }}
                    >
                      {availableKBs.map(kb => (
                        <Select.Option
                          key={kb.id}
                          value={kb.id}
                          label={kb.name}
                          disabled={kb.id === currentKbId}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13 }}>{kb.name}</span>
                            {kb.id === currentKbId && (
                              <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                                当前知识库
                              </Tag>
                            )}
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                    <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                      当前知识库会自动包含在检索范围内
                    </Text>
                  </div>
                </div>
              ) : (
                <Text type="secondary" style={{ fontSize: 13 }}>未启用，将直接返回固定答案</Text>
              )}
            </div>

            {/* 工具调用配置 */}
            <div style={{
              border: '1px solid #e8e8e8',
              borderRadius: 6,
              padding: 16,
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Space>
                  <ToolOutlined style={{ color: '#fa8c16', fontSize: 15 }} />
                  <Text strong style={{ fontSize: 14 }}>工具调用</Text>
                  <Tooltip title="启用后，回答该问题时可以调用指定的工具获取实时数据">
                    <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
                  </Tooltip>
                </Space>
                <Switch
                  checked={formData.enable_tool_call}
                  onChange={(checked) => setFormData(prev => ({ ...prev, enable_tool_call: checked }))}
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                  size="small"
                />
              </div>

              {formData.enable_tool_call ? (
                <div>
                  <Alert
                    message="系统会在回答该问题时调用指定工具"
                    type="info"
                    showIcon
                    style={{ fontSize: 12, marginBottom: 12 }}
                  />
                  <div>
                    <Text style={{ fontSize: 13, color: '#595959' }}>
                      可用工具 <span style={{ color: '#ff4d4f' }}>*</span>
                    </Text>
                    <Select
                      mode="multiple"
                      placeholder="选择一个或多个工具"
                      value={formData.tool_names}
                      onChange={(values) => setFormData(prev => ({ ...prev, tool_names: values }))}
                      loading={toolsLoading}
                      style={{ width: '100%', marginTop: 6 }}
                      optionFilterProp="label"
                      popupClassName="enhanced-qa-select-dropdown"
                      dropdownStyle={{ backgroundColor: '#ffffff' }}
                      showSearch
                      filterOption={(input, option) => {
                        const label = option?.label?.toString().toLowerCase() || '';
                        return label.includes(input.toLowerCase());
                      }}
                    >
                      {/* 按工具类型分组 */}
                      {['builtin', 'mcp', 'api', 'custom_crawler'].map(type => {
                        const toolsOfType = availableTools.filter(t => t.tool_type === type);
                        if (toolsOfType.length === 0) return null;

                        const typeLabels: Record<string, string> = {
                          builtin: '内置工具',
                          mcp: 'MCP工具',
                          api: 'API工具',
                          custom_crawler: '自定义工具'
                        };

                        const typeColors: Record<string, string> = {
                          builtin: '#667eea',
                          mcp: '#f093fb',
                          api: '#4facfe',
                          custom_crawler: '#43e97b'
                        };

                        return (
                          <Select.OptGroup key={type} label={typeLabels[type]}>
                            {toolsOfType.map(tool => (
                              <Select.Option
                                key={tool.tool_code}
                                value={tool.tool_code}
                                label={tool.tool_name}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
                                  <Tag
                                    color={typeColors[type]}
                                    style={{ margin: 0, fontSize: 11, minWidth: 60, textAlign: 'center' }}
                                  >
                                    {typeLabels[type]}
                                  </Tag>
                                  <span style={{ fontSize: 13, fontWeight: 500 }}>{tool.tool_name}</span>
                                  {tool.description && (
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      - {tool.description}
                                    </Text>
                                  )}
                                </div>
                              </Select.Option>
                            ))}
                          </Select.OptGroup>
                        );
                      })}
                    </Select>
                  </div>
                </div>
              ) : (
                <Text type="secondary" style={{ fontSize: 13 }}>未启用工具调用</Text>
              )}
            </div>

          </Space>
        </div>

      </div>
    </Modal>
    </>
  );
};

export default EnhancedQAModal;
