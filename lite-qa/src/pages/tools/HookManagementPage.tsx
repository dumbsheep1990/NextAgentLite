/**
 * Hooks管理页面
 * 用于管理系统内置和定义好的Hooks工具
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Form,
  Input,
  Select,
  message,
  Drawer,
  Descriptions,
  Statistic,
  Row,
  Col,
  Tabs,
  Empty,
  Alert,
  Switch,
  Spin,
  Badge,
  Timeline,
  Tooltip
} from 'antd';
import {
  ApiOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  BugOutlined,
  OrderedListOutlined,
  FunctionOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { APP_CONFIG } from '../../config/appConfig';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

// 类型定义
interface Hook {
  hook_id: string;
  hook_type: 'pre' | 'post';  // API返回的字段名
  name: string;
  description?: string;
  category?: string;
  priority?: number;
  is_enabled?: boolean;
  config_schema?: any;
  usage_count?: number;
  last_used_at?: string;
  avg_execution_time_ms?: number;
  is_custom?: boolean;  // 是否是自定义hook（可编辑删除）
  // 增强的元数据字段
  features?: string[];
  use_cases?: string[];
  config_example?: Record<string, any>;
  config_params?: Array<{
    name: string;
    label?: string;  // 中文标签
    type: string;
    required: boolean;
    default: any;
    description: string;
  }>;
  output_fields?: string[];
  raises?: string[];
  modifies_input?: boolean;
  execution_time?: string;
  tool_bindings?: Array<{
    tool_id: string;
    tool_type: 'api' | 'mcp';
    tool_name: string;
    purpose: string;
    required: boolean;
    config_key?: string;
    binding_status?: string;
  }>;
}

interface HookStatistics {
  total_hooks: number;
  pre_hooks_count: number;
  post_hooks_count: number;
  enabled_hooks: number;
  total_executions: number;
  avg_execution_time: number;
}

interface HookExecutionRecord {
  id: string;
  hook_id: string;
  execution_status: 'success' | 'error' | 'pending';
  execution_time_ms: number;
  error_message?: string;
  context_data?: any;
  created_at: string;
}

interface AvailableTool {
  tool_id: string;
  tool_type: 'api' | 'mcp';
  tool_name: string;
  server_or_config?: string;
  description?: string;
  input_schema?: any;
}

const HookManagementPage: React.FC = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'pre' | 'post' | 'tools'>('pre');
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [statistics, setStatistics] = useState<HookStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [hooksLoading, setHooksLoading] = useState(false);

  // 工具列表状态
  const [toolsData, setToolsData] = useState<{ api_tools: AvailableTool[]; mcp_tools: AvailableTool[]; total_count: number } | null>(null);
  const [toolsLoading, setToolsLoading] = useState(false);

  // 抽屉和模态框状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [testDrawerVisible, setTestDrawerVisible] = useState(false);
  const [executionDrawerVisible, setExecutionDrawerVisible] = useState(false);
  const [createHookVisible, setCreateHookVisible] = useState(false);
  const [editHookVisible, setEditHookVisible] = useState(false);
  const [configDrawerVisible, setConfigDrawerVisible] = useState(false);
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);
  const [executionHistory, setExecutionHistory] = useState<HookExecutionRecord[]>([]);
  const [executionLoading, setExecutionLoading] = useState(false);

  // 表单
  const [testForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [configForm] = Form.useForm();

  // 测试状态
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // 过滤条件
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

  // 初始化数据
  useEffect(() => {
    loadHooks();
    loadStatistics();
  }, []);

  // 当切换到工具标签时加载工具列表
  useEffect(() => {
    if (activeTab === 'tools' && !toolsData) {
      loadTools();
    }
  }, [activeTab]);

  // 构建API URL的辅助函数
  const buildApiUrl = (path: string): string => {
    const baseUrl = APP_CONFIG.api.baseURL;
    const version = APP_CONFIG.api.version;
    // 移除path开头的斜杠（如果有）
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${baseUrl}/api/${version}/${cleanPath}`;
  };

  // API调用函数
  const api = {
    // 获取Hooks列表
    async getHooks(phase?: 'pre' | 'post') {
      const path = phase
        ? `hook-pipelines/available/hooks?phase=${phase}`
        : 'hook-pipelines/available/hooks';
      const response = await fetch(buildApiUrl(path));
      if (!response.ok) throw new Error('获取Hooks列表失败');
      return response.json();
    },

    // 获取统计信息
    async getStatistics() {
      const response = await fetch(buildApiUrl('hook-pipelines/statistics'));
      if (!response.ok) {
        // 如果API不存在，返回模拟数据
        return {
          total_hooks: 0,
          pre_hooks_count: 0,
          post_hooks_count: 0,
          enabled_hooks: 0,
          total_executions: 0,
          avg_execution_time: 0
        };
      }
      return response.json();
    },

    // 测试Hook
    async testHook(data: any) {
      const response = await fetch(buildApiUrl('hook-pipelines/test-hook'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Hook测试失败');
      return response.json();
    },

    // 获取执行历史
    async getExecutionHistory(hookId: string) {
      const response = await fetch(buildApiUrl(`hook-pipelines/hooks/${hookId}/executions`));
      if (!response.ok) {
        // 如果API不存在，返回空数组
        return [];
      }
      return response.json();
    },

    // 刷新Hooks
    async refreshHooks() {
      const response = await fetch(buildApiUrl('hook-pipelines/refresh'), {
        method: 'POST'
      });
      if (!response.ok) throw new Error('刷新Hooks失败');
      return response.json();
    },

    // 获取所有可用工具
    async getAllTools() {
      const response = await fetch(buildApiUrl('hook-pipelines/tools/all'));
      if (!response.ok) throw new Error('获取工具列表失败');
      return response.json();
    },

    // 创建自定义Hook
    async createCustomHook(data: any) {
      const response = await fetch(buildApiUrl('custom-hooks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('创建Hook失败');
      return response.json();
    },

    // 获取自定义Hooks列表（排除系统Hook配置）
    async getCustomHooks() {
      // include_system=false 避免与系统hooks重复
      const response = await fetch(buildApiUrl('custom-hooks?include_system=false'));
      if (!response.ok) throw new Error('获取自定义Hooks失败');
      return response.json();
    },

    // 删除自定义Hook
    async deleteCustomHook(hookId: string) {
      const response = await fetch(buildApiUrl(`custom-hooks/${hookId}`), {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('删除Hook失败');
      return response.json();
    }
  };

  // 加载Hooks列表
  const loadHooks = async () => {
    try {
      setHooksLoading(true);

      // 同时加载系统hooks和自定义hooks
      const [systemHooks, customHooks] = await Promise.all([
        api.getHooks().catch(() => []),  // 系统hooks，失败返回空数组
        api.getCustomHooks().catch(() => [])  // 自定义hooks，失败返回空数组
      ]);

      // 转换自定义hooks的数据格式以匹配Hook接口
      const formattedCustomHooks = customHooks.map((hook: any) => ({
        hook_id: hook.hook_id,
        hook_type: hook.hook_type,
        name: hook.hook_name,  // hook_name -> name
        description: hook.description,
        category: hook.category,
        priority: hook.priority,
        is_enabled: hook.is_active,  // is_active -> is_enabled
        config_schema: null,
        usage_count: 0,
        last_used_at: hook.updated_at,
        avg_execution_time_ms: 0,
        is_custom: true  // 标记为自定义hook
      }));

      // 合并系统hooks和自定义hooks
      const allHooks = [...(systemHooks || []), ...formattedCustomHooks];
      setHooks(allHooks);
    } catch (error) {
      console.error('加载Hooks列表失败:', error);
      message.error('加载Hooks列表失败');
    } finally {
      setHooksLoading(false);
    }
  };

  // 加载统计信息
  const loadStatistics = async () => {
    try {
      const stats = await api.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('加载统计信息失败:', error);
      // 不显示错误消息，因为可能是API尚未实现
    }
  };

  // 加载工具列表
  const loadTools = async () => {
    try {
      setToolsLoading(true);
      const tools = await api.getAllTools();
      setToolsData(tools);
    } catch (error) {
      console.error('加载工具列表失败:', error);
      message.error('加载工具列表失败');
    } finally {
      setToolsLoading(false);
    }
  };

  // 刷新Hooks
  const handleRefreshHooks = async () => {
    try {
      setLoading(true);
      await api.refreshHooks();
      message.success('Hooks刷新成功');
      loadHooks();
      loadStatistics();
    } catch (error) {
      console.error('刷新Hooks失败:', error);
      // 即使API不存在，也尝试重新加载
      loadHooks();
      loadStatistics();
    } finally {
      setLoading(false);
    }
  };

  // 查看Hook详情
  const handleViewDetail = (hook: Hook) => {
    setSelectedHook(hook);
    setDetailDrawerVisible(true);
  };

  // 测试Hook
  const handleTestHook = (hook: Hook) => {
    setSelectedHook(hook);
    setTestDrawerVisible(true);
    testForm.resetFields();
    setTestResult(null);
  };

  // 执行Hook测试
  const handleExecuteTest = async (values: any) => {
    if (!selectedHook) return;

    try {
      setTestLoading(true);
      const result = await api.testHook({
        hook_id: selectedHook.hook_id,
        context: JSON.parse(values.context || '{}'),
        query: values.query
      });
      setTestResult(result);

      if (result.success) {
        message.success('Hook测试执行成功');
      } else {
        message.error(`Hook测试失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('执行Hook测试失败:', error);
      message.error('执行Hook测试失败');
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setTestLoading(false);
    }
  };

  // 查看执行历史
  const handleViewExecutions = async (hook: Hook) => {
    try {
      setExecutionLoading(true);
      const history = await api.getExecutionHistory(hook.hook_id);
      setExecutionHistory(history || []);
      setSelectedHook(hook);
      setExecutionDrawerVisible(true);
    } catch (error) {
      console.error('加载执行历史失败:', error);
      message.error('加载执行历史失败');
    } finally {
      setExecutionLoading(false);
    }
  };

  // 打开创建Hook对话框
  const handleCreateHook = () => {
    setCreateHookVisible(true);
    createForm.resetFields();
  };

  // 提交创建Hook
  const handleSubmitCreateHook = async (values: any) => {
    try {
      setLoading(true);

      // 构建请求数据
      const hookData = {
        hook_id: values.hook_id,
        hook_name: values.hook_name,
        hook_type: values.hook_type,
        description: values.description,
        category: values.category || 'custom',
        execution_mode: values.execution_mode || 'sequential',
        timeout_ms: values.timeout_ms || 5000,
        max_retries: values.max_retries || 0,
        tool_bindings: []  // 暂时为空，后续通过编辑添加
      };

      await api.createCustomHook(hookData);
      message.success('自定义Hook创建成功');
      setCreateHookVisible(false);
      loadHooks();  // 重新加载列表
    } catch (error) {
      console.error('创建Hook失败:', error);
      message.error('创建Hook失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 删除Hook
  const handleDeleteHook = async (hookId: string) => {
    try {
      await api.deleteCustomHook(hookId);
      message.success('Hook删除成功');
      loadHooks();
    } catch (error) {
      console.error('删除Hook失败:', error);
      message.error('删除Hook失败');
    }
  };

  // 打开编辑Hook对话框
  const handleEditHook = async (hook: Hook) => {
    try {
      setLoading(true);

      // 从API获取完整的hook数据（包括tool_bindings）
      const response = await fetch(buildApiUrl(`custom-hooks/${hook.hook_id}`));
      if (!response.ok) throw new Error('获取Hook详情失败');

      const fullHookData = await response.json();

      setSelectedHook(fullHookData);
      setEditHookVisible(true);

      // 处理tool_bindings，将params对象转换为JSON字符串以便在TextArea中显示
      const processedToolBindings = (fullHookData.tool_bindings || []).map((binding: any) => ({
        ...binding,
        params: typeof binding.params === 'object'
          ? JSON.stringify(binding.params, null, 2)
          : binding.params || '{}'
      }));

      // 填充表单数据
      editForm.setFieldsValue({
        hook_name: fullHookData.hook_name,
        description: fullHookData.description,
        category: fullHookData.category,
        priority: fullHookData.priority,
        execution_mode: fullHookData.execution_mode || 'sequential',
        timeout_ms: fullHookData.timeout_ms || 5000,
        max_retries: fullHookData.max_retries || 0,
        tool_bindings: processedToolBindings
      });
    } catch (error) {
      console.error('获取Hook详情失败:', error);
      message.error('获取Hook详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 提交编辑Hook
  const handleSubmitEditHook = async (values: any) => {
    if (!selectedHook) return;

    try {
      setLoading(true);

      // 处理tool_bindings，确保params是JSON对象而不是字符串
      const processedToolBindings = (values.tool_bindings || []).map((binding: any) => {
        let params = binding.params;

        // 如果params是字符串，尝试解析为JSON对象
        if (typeof params === 'string') {
          try {
            params = JSON.parse(params);
          } catch (e) {
            console.warn('解析params失败，使用空对象:', e);
            params = {};
          }
        }

        return {
          step_id: binding.step_id,
          tool_id: binding.tool_id,
          tool_type: binding.tool_type,
          params: params || {},
          condition: binding.condition || null,
          on_success: binding.on_success || 'continue',
          on_failure: binding.on_failure || 'continue'
        };
      });

      const updateData = {
        hook_name: values.hook_name,
        description: values.description,
        category: values.category,
        priority: values.priority,
        execution_mode: values.execution_mode,
        timeout_ms: values.timeout_ms,
        max_retries: values.max_retries,
        tool_bindings: processedToolBindings
      };

      const response = await fetch(buildApiUrl(`custom-hooks/${selectedHook.hook_id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '更新Hook失败');
      }

      message.success('Hook更新成功');
      setEditHookVisible(false);
      loadHooks();
    } catch (error) {
      console.error('更新Hook失败:', error);
      message.error('更新Hook失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 打开配置Hook对话框
  const handleConfigureHook = async (hook: Hook) => {
    try {
      setSelectedHook(hook);
      setConfigDrawerVisible(true);
      setLoading(true);

      // 从数据库获取已保存的配置
      const response = await fetch(buildApiUrl(`custom-hooks/${hook.hook_id}`));
      const savedConfig = response.ok ? await response.json() : null;

      // 初始化表单
      const initialValues: any = {};

      // 1. 首先使用默认值
      if (hook.config_params) {
        hook.config_params.forEach(param => {
          initialValues[param.name] = param.default;
        });
      }

      // 2. 然后使用config_example的值（如果有）
      if (hook.config_example) {
        Object.assign(initialValues, hook.config_example);
      }

      // 3. 最后使用数据库中已保存的值（优先级最高）
      if (savedConfig && savedConfig.metadata && savedConfig.metadata.config_params) {
        Object.assign(initialValues, savedConfig.metadata.config_params);
      }

      // 加载已保存的tool_bindings
      const savedToolBindings = savedConfig?.tool_bindings || hook.tool_bindings || [];
      if (savedToolBindings.length > 0) {
        // 检查是否是实际绑定（有step_id字段）
        const isActualBinding = savedToolBindings.some((b: any) => b.step_id);
        if (isActualBinding) {
          initialValues.tool_bindings = savedToolBindings.map((binding: any) => ({
            ...binding,
            params: typeof binding.params === 'object'
              ? JSON.stringify(binding.params, null, 2)
              : binding.params || '{}'
          }));
        } else {
          initialValues.tool_bindings = [];
        }
      } else {
        initialValues.tool_bindings = [];
      }

      configForm.setFieldsValue(initialValues);
    } catch (error) {
      console.error('加载Hook配置失败:', error);
      message.error('加载Hook配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 提交Hook配置
  const handleSubmitConfig = async (values: any) => {
    if (!selectedHook) return;

    try {
      setLoading(true);

      // 分离config_params和tool_bindings
      const { tool_bindings, ...config_params } = values;

      // 处理tool_bindings，确保params是JSON对象
      const processedToolBindings = (tool_bindings || []).map((binding: any) => {
        let params = binding.params;

        // 如果params是字符串，尝试解析为JSON对象
        if (typeof params === 'string') {
          try {
            params = JSON.parse(params);
          } catch (e) {
            console.warn('解析params失败，使用空对象:', e);
            params = {};
          }
        }

        return {
          step_id: binding.step_id || `step_${Date.now()}`,
          tool_id: binding.tool_id,
          tool_type: binding.tool_type,
          params: params || {},
          condition: binding.condition || null,
          on_success: binding.on_success || 'continue',
          on_failure: binding.on_failure || 'continue'
        };
      });

      // 调用API保存配置
      const response = await fetch(buildApiUrl('custom-hooks/configure'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook_id: selectedHook.hook_id,
          config_params: config_params,
          tool_bindings: processedToolBindings,
          user_id: null,  // TODO: 从用户会话获取
          agent_id: null   // TODO: 如果在agent上下文中配置，传入agent_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '保存Hook配置失败');
      }

      const result = await response.json();

      message.success('Hook配置已成功保存到数据库');
      setConfigDrawerVisible(false);

      // 重新加载hooks列表以显示最新配置
      loadHooks();

    } catch (error) {
      console.error('保存Hook配置失败:', error);
      message.error('保存Hook配置失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 过滤Hooks
  const getFilteredHooks = () => {
    let filtered = hooks.filter(h => h.hook_type === activeTab);

    if (searchKeyword) {
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        h.hook_id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (h.description && h.description.toLowerCase().includes(searchKeyword.toLowerCase()))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(h => h.category === categoryFilter);
    }

    return filtered;
  };

  // 获取所有分类
  const getAllCategories = () => {
    const categories = new Set(hooks.map(h => h.category).filter(Boolean));
    return Array.from(categories);
  };

  // 拦截器表格列定义
  const hookColumns: ColumnsType<Hook> = [
    {
      title: '拦截器名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <ApiOutlined />
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.hook_id}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => {
        const categoryColors: Record<string, string> = {
          'routing': 'blue',
          'validation': 'green',
          'processing': 'orange',
          'security': 'red',
          'monitoring': 'purple'
        };
        return category ? (
          <Tag color={categoryColors[category] || 'default'}>{category}</Tag>
        ) : (
          <Text type="secondary">未分类</Text>
        );
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text, record) => {
        if (!text && !record.features) {
          return <Text type="secondary">无描述</Text>;
        }

        // 如果有features，显示tooltip
        if (record.features && record.features.length > 0) {
          return (
            <Tooltip
              title={
                <div style={{ maxWidth: 400 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold' }}>功能特性:</div>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {record.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>{feature}</li>
                    ))}
                    {record.features.length > 3 && (
                      <li style={{ color: '#bfbfbf' }}>...还有 {record.features.length - 3} 个特性</li>
                    )}
                  </ul>
                </div>
              }
              placement="topLeft"
            >
              <span style={{ cursor: 'help' }}>
                {text || '查看功能特性'}
                {record.features.length > 0 && (
                  <Tag color="green" style={{ marginLeft: 8 }}>
                    {record.features.length} 个特性
                  </Tag>
                )}
              </span>
            </Tooltip>
          );
        }

        return text;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => (a.priority || 0) - (b.priority || 0),
      render: (priority) => priority ? (
        <Badge
          count={priority}
          style={{ backgroundColor: priority > 50 ? '#52c41a' : '#faad14' }}
        />
      ) : <Text type="secondary">-</Text>
    },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      sorter: (a, b) => (a.usage_count || 0) - (b.usage_count || 0),
      render: (count) => count || 0
    },
    {
      title: '平均耗时',
      dataIndex: 'avg_execution_time_ms',
      key: 'avg_execution_time_ms',
      render: (time) => time ? `${time.toFixed(2)}ms` : <Text type="secondary">-</Text>
    },
    {
      title: '已绑定工具',
      dataIndex: 'tool_bindings',
      key: 'tool_bindings',
      render: (bindings: any[]) => {
        if (!bindings || bindings.length === 0) {
          return <Text type="secondary">未配置</Text>;
        }

        // 检查是否是实际绑定的工具（有step_id字段）还是推荐工具（有purpose字段）
        const isActualBinding = bindings.some(b => b.step_id);

        if (!isActualBinding) {
          // 这是推荐工具列表，显示"未配置"
          return <Text type="secondary">未配置</Text>;
        }

        // 显示已绑定的工具
        return (
          <Space direction="vertical" size={2}>
            {bindings.slice(0, 2).map((binding, idx) => {
              const toolName = binding.tool_id?.split(':').pop() || binding.tool_id || '未知工具';
              return (
                <Tag key={idx} color={binding.tool_type === 'api' ? 'blue' : 'green'}>
                  {toolName}
                </Tag>
              );
            })}
            {bindings.length > 2 && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                +{bindings.length - 2} 个
              </Text>
            )}
          </Space>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled) => (
        <Badge
          status={enabled !== false ? 'success' : 'default'}
          text={enabled !== false ? '启用' : '禁用'}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="配置参数和工具">
            <Button
              icon={<FunctionOutlined />}
              size="small"
              type="primary"
              onClick={() => handleConfigureHook(record)}
            >
              配置
            </Button>
          </Tooltip>
          <Tooltip title="查看详情">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="测试运行">
            <Button
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={() => handleTestHook(record)}
            />
          </Tooltip>
          {record.is_custom && (
            <>
              <Tooltip title="编辑Hook">
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleEditHook(record)}
                />
              </Tooltip>
              <Tooltip title="删除Hook">
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  onClick={() => {
                    if (window.confirm(`确定要删除Hook "${record.name}" 吗？`)) {
                      handleDeleteHook(record.hook_id);
                    }
                  }}
                />
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  // 工具表格列定义
  const toolColumns: ColumnsType<AvailableTool> = [
    {
      title: '工具名称',
      dataIndex: 'tool_name',
      key: 'tool_name',
      render: (text, record) => (
        <Space>
          <ApiOutlined />
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.tool_id}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '工具类型',
      dataIndex: 'tool_type',
      key: 'tool_type',
      filters: [
        { text: 'API工具', value: 'api' },
        { text: 'MCP工具', value: 'mcp' }
      ],
      onFilter: (value, record) => record.tool_type === value,
      render: (type) => (
        <Tag color={type === 'api' ? 'blue' : 'green'}>
          {type === 'api' ? 'API工具' : 'MCP工具'}
        </Tag>
      )
    },
    {
      title: '服务器/配置',
      dataIndex: 'server_or_config',
      key: 'server_or_config',
      render: (text) => text || <Text type="secondary">-</Text>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || <Text type="secondary">无描述</Text>
    },
    {
      title: '输入参数',
      key: 'input_schema',
      render: (_, record) => {
        if (!record.input_schema) {
          return <Text type="secondary">无参数定义</Text>;
        }
        const properties = record.input_schema.properties || {};
        const propCount = Object.keys(properties).length;
        return (
          <Tooltip
            title={
              <pre style={{ margin: 0, fontSize: 12 }}>
                {JSON.stringify(record.input_schema, null, 2)}
              </pre>
            }
          >
            <Tag>{propCount} 个参数</Tag>
          </Tooltip>
        );
      }
    }
  ];

  // 渲染统计卡片
  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总Hook数"
              value={statistics.total_hooks}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pre-Hooks"
              value={statistics.pre_hooks_count}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Post-Hooks"
              value={statistics.post_hooks_count}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总执行次数"
              value={statistics.total_executions}
              prefix={<OrderedListOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <FunctionOutlined style={{ marginRight: 8 }} />
          流程拦截器管理中心
        </Title>
        <Paragraph type="secondary">
          管理系统内置和自定义的流程拦截器，包括前置拦截器（Pre-Hooks）和后置拦截器（Post-Hooks）
        </Paragraph>
      </div>

      {/* 统计概览 */}
      {renderStatistics()}

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateHook}
          >
            创建自定义Hook
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefreshHooks}
            loading={loading}
          >
            刷新拦截器
          </Button>
          <Input.Search
            placeholder="搜索拦截器名称或ID"
            style={{ width: 300 }}
            onChange={(e) => setSearchKeyword(e.target.value)}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="按分类筛选"
            style={{ width: 150 }}
            allowClear
            value={categoryFilter}
            onChange={setCategoryFilter}
          >
            {getAllCategories().map(cat => (
              <Select.Option key={cat} value={cat}>
                {cat}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* 主要内容区域 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as 'pre' | 'post' | 'tools')}>
          <TabPane
            tab={
              <span>
                <ThunderboltOutlined />
                前置拦截器 ({hooks.filter(h => h.hook_type === 'pre').length})
              </span>
            }
            key="pre"
          >
            <Table
              columns={hookColumns}
              dataSource={getFilteredHooks()}
              rowKey="hook_id"
              loading={hooksLoading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个拦截器`
              }}
              locale={{
                emptyText: <Empty description="暂无前置拦截器" />
              }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <CheckCircleOutlined />
                后置拦截器 ({hooks.filter(h => h.hook_type === 'post').length})
              </span>
            }
            key="post"
          >
            <Table
              columns={hookColumns}
              dataSource={getFilteredHooks()}
              rowKey="hook_id"
              loading={hooksLoading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个拦截器`
              }}
              locale={{
                emptyText: <Empty description="暂无后置拦截器" />
              }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <ApiOutlined />
                可用工具 ({toolsData ? toolsData.total_count : 0})
              </span>
            }
            key="tools"
          >
            <Alert
              message="工具说明"
              description="这里显示所有可以在Hook中调用的API工具和MCP工具。Hook可以通过 call_tool() 方法调用这些工具。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Tabs defaultActiveKey="all" type="card">
              <TabPane tab={`全部工具 (${toolsData?.total_count || 0})`} key="all">
                <Table
                  columns={toolColumns}
                  dataSource={[
                    ...(toolsData?.api_tools || []),
                    ...(toolsData?.mcp_tools || [])
                  ]}
                  rowKey="tool_id"
                  loading={toolsLoading}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 个工具`
                  }}
                  locale={{
                    emptyText: <Empty description="暂无可用工具" />
                  }}
                />
              </TabPane>

              <TabPane tab={`API工具 (${toolsData?.api_count || 0})`} key="api">
                <Table
                  columns={toolColumns}
                  dataSource={toolsData?.api_tools || []}
                  rowKey="tool_id"
                  loading={toolsLoading}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 个API工具`
                  }}
                  locale={{
                    emptyText: <Empty description="暂无API工具" />
                  }}
                />
              </TabPane>

              <TabPane tab={`MCP工具 (${toolsData?.mcp_count || 0})`} key="mcp">
                <Table
                  columns={toolColumns}
                  dataSource={toolsData?.mcp_tools || []}
                  rowKey="tool_id"
                  loading={toolsLoading}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 个MCP工具`
                  }}
                  locale={{
                    emptyText: <Empty description="暂无MCP工具" />
                  }}
                />
              </TabPane>
            </Tabs>
          </TabPane>
        </Tabs>
      </Card>

      {/* 拦截器详情抽屉 */}
      <Drawer
        title="拦截器详情"
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={720}
      >
        {selectedHook && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="拦截器名称">{selectedHook.name}</Descriptions.Item>
              <Descriptions.Item label="拦截器ID">{selectedHook.hook_id}</Descriptions.Item>
              <Descriptions.Item label="执行阶段">
                <Tag color={selectedHook.hook_type === 'pre' ? 'blue' : 'green'}>
                  {selectedHook.hook_type === 'pre' ? '前置拦截器' : '后置拦截器'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="分类">{selectedHook.category || '未分类'}</Descriptions.Item>
              <Descriptions.Item label="描述">{selectedHook.description || '无描述'}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Space>
                  {selectedHook.priority || '-'}
                  {selectedHook.execution_time && (
                    <Tag color="orange">
                      <ClockCircleOutlined /> {selectedHook.execution_time}
                    </Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="使用次数">{selectedHook.usage_count || 0}</Descriptions.Item>
              <Descriptions.Item label="平均执行时间">
                {selectedHook.avg_execution_time_ms ? `${selectedHook.avg_execution_time_ms.toFixed(2)}ms` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="最后使用时间">
                {selectedHook.last_used_at ? new Date(selectedHook.last_used_at).toLocaleString() : '从未使用'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Space>
                  <Badge
                    status={selectedHook.is_enabled !== false ? 'success' : 'default'}
                    text={selectedHook.is_enabled !== false ? '启用' : '禁用'}
                  />
                  {selectedHook.modifies_input && (
                    <Tag color="warning">修改输入</Tag>
                  )}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            {/* 功能特性 */}
            {selectedHook.features && selectedHook.features.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  功能特性
                </Title>
                <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {selectedHook.features.map((feature, idx) => (
                      <li key={idx} style={{ marginBottom: 6, color: '#52c41a' }}>
                        <Text>{feature}</Text>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}

            {/* 使用场景 */}
            {selectedHook.use_cases && selectedHook.use_cases.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
                  <BugOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                  使用场景
                </Title>
                <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {selectedHook.use_cases.map((useCase, idx) => (
                      <li key={idx} style={{ marginBottom: 6, color: '#1890ff' }}>
                        <Text>{useCase}</Text>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}

            {/* 输出字段 */}
            {selectedHook.output_fields && selectedHook.output_fields.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
                  <ApiOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                  输出字段
                </Title>
                <Card size="small" style={{ background: '#f9f0ff', borderColor: '#d3adf7' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size={4}>
                    {selectedHook.output_fields.map((field, idx) => (
                      <Tag key={idx} color="purple" style={{ marginBottom: 4 }}>
                        {field}
                      </Tag>
                    ))}
                  </Space>
                </Card>
              </>
            )}

            {/* 异常说明 */}
            {selectedHook.raises && selectedHook.raises.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                  可能抛出的异常
                </Title>
                <Card size="small" style={{ background: '#fff1f0', borderColor: '#ffccc7' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size={4}>
                    {selectedHook.raises.map((raise, idx) => (
                      <Alert
                        key={idx}
                        message={raise}
                        type="error"
                        showIcon
                        style={{ marginBottom: 4 }}
                      />
                    ))}
                  </Space>
                </Card>
              </>
            )}

            {/* 参数配置 */}
            {selectedHook.config_params && selectedHook.config_params.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
                  <FunctionOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                  参数配置
                </Title>
                <Card size="small" style={{ background: '#fff7e6', borderColor: '#ffd591' }}>
                  <Table
                    dataSource={selectedHook.config_params}
                    rowKey="name"
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: '参数名',
                        dataIndex: 'name',
                        key: 'name',
                        width: 150,
                        render: (text, record) => (
                          <div>
                            <Text strong style={{ fontFamily: 'Monaco, monospace', fontSize: 12 }}>{text}</Text>
                            {record.required && (
                              <Tag color="red" size="small" style={{ marginLeft: 8 }}>必需</Tag>
                            )}
                          </div>
                        )
                      },
                      {
                        title: '类型',
                        dataIndex: 'type',
                        key: 'type',
                        width: 100,
                        render: (text) => (
                          <Tag color="geekblue" style={{ fontFamily: 'Monaco, monospace', fontSize: 11 }}>
                            {text}
                          </Tag>
                        )
                      },
                      {
                        title: '默认值',
                        dataIndex: 'default',
                        key: 'default',
                        width: 120,
                        render: (value) => (
                          <Text code style={{ fontSize: 11, maxWidth: 120, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {value === null ? 'None' :
                             typeof value === 'object' ? JSON.stringify(value) :
                             String(value)}
                          </Text>
                        )
                      },
                      {
                        title: '说明',
                        dataIndex: 'description',
                        key: 'description',
                        render: (text) => <Text style={{ fontSize: 12 }}>{text}</Text>
                      }
                    ]}
                    bordered
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </>
            )}

            {/* 配置示例 */}
            {selectedHook.config_example && Object.keys(selectedHook.config_example).length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
                  <FunctionOutlined style={{ color: '#13c2c2', marginRight: 8 }} />
                  配置示例
                </Title>
                <Card size="small" style={{ background: '#e6fffb', borderColor: '#87e8de' }}>
                  <pre style={{
                    background: 'transparent',
                    margin: 0,
                    padding: 0,
                    overflow: 'auto',
                    maxHeight: 300,
                    fontSize: 13,
                    fontFamily: 'Monaco, Menlo, Consolas, monospace',
                    color: '#13c2c2'
                  }}>
                    {JSON.stringify(selectedHook.config_example, null, 2)}
                  </pre>
                </Card>
              </>
            )}

            {selectedHook.config_schema && (
              <>
                <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>配置Schema</Title>
                <pre style={{
                  background: '#f5f5f5',
                  padding: 16,
                  borderRadius: 4,
                  overflow: 'auto',
                  maxHeight: 300
                }}>
                  {JSON.stringify(selectedHook.config_schema, null, 2)}
                </pre>
              </>
            )}

            {/* 推荐的工具绑定 */}
            {selectedHook.tool_bindings && selectedHook.tool_bindings.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
                  <ApiOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                  推荐工具绑定
                </Title>
                <Alert
                  message="工具绑定说明"
                  description="此Hook可以调用以下工具来增强功能。在Agent配置中启用这些工具后，Hook会自动使用它们。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  {selectedHook.tool_bindings.map((binding: any, idx: number) => (
                    <Card
                      key={idx}
                      size="small"
                      style={{
                        background: '#fafafa',
                        borderLeft: `3px solid ${binding.tool_type === 'api' ? '#1890ff' : '#52c41a'}`
                      }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Space>
                            <Tag color={binding.tool_type === 'api' ? 'blue' : 'green'}>
                              {binding.tool_type === 'api' ? 'API工具' : 'MCP工具'}
                            </Tag>
                            <Text strong style={{ fontSize: 14 }}>{binding.tool_name}</Text>
                          </Space>
                          <Tag color={binding.required ? 'red' : 'default'}>
                            {binding.required ? '必需' : '可选'}
                          </Tag>
                        </div>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            工具ID: <Text code style={{ fontSize: 11 }}>{binding.tool_id}</Text>
                          </Text>
                        </div>
                        <div>
                          <Text style={{ fontSize: 13 }}>{binding.purpose}</Text>
                        </div>
                        {binding.config_key && (
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              配置项: <Text code style={{ fontSize: 11 }}>{binding.config_key}</Text>
                            </Text>
                          </div>
                        )}
                      </Space>
                    </Card>
                  ))}
                </Space>
              </>
            )}
          </div>
        )}
      </Drawer>

      {/* 拦截器测试抽屉 */}
      <Drawer
        title={`测试拦截器: ${selectedHook?.name}`}
        placement="right"
        onClose={() => setTestDrawerVisible(false)}
        open={testDrawerVisible}
        width={600}
      >
        <Alert
          message="测试说明"
          description="输入测试查询和上下文数据，执行拦截器并查看结果。上下文需要是有效的JSON格式。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={testForm}
          layout="vertical"
          onFinish={handleExecuteTest}
        >
          <Form.Item
            name="query"
            label="测试查询"
            rules={[{ required: true, message: '请输入测试查询' }]}
          >
            <Input placeholder="例如: 如何使用API查询数据？" />
          </Form.Item>

          <Form.Item
            name="context"
            label="上下文数据 (JSON格式)"
            initialValue="{}"
          >
            <TextArea
              placeholder='{"query_type": "simple", "language": "zh"}'
              rows={6}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={testLoading}>
              执行测试
            </Button>
          </Form.Item>
        </Form>

        {testResult && (
          <div style={{ marginTop: 24 }}>
            <Title level={5}>测试结果</Title>
            <Alert
              type={testResult.success ? 'success' : 'error'}
              message={testResult.success ? '执行成功' : '执行失败'}
              description={
                <pre style={{
                  marginTop: 8,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  maxHeight: 400,
                  overflow: 'auto'
                }}>
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              }
            />
          </div>
        )}
      </Drawer>

      {/* 执行历史抽屉 */}
      <Drawer
        title={`执行历史: ${selectedHook?.name}`}
        placement="right"
        onClose={() => setExecutionDrawerVisible(false)}
        open={executionDrawerVisible}
        width={700}
      >
        <Spin spinning={executionLoading}>
          {executionHistory.length > 0 ? (
            <Timeline mode="left">
              {executionHistory.map((record) => (
                <Timeline.Item
                  key={record.id}
                  color={record.execution_status === 'success' ? 'green' : 'red'}
                  dot={
                    record.execution_status === 'success' ?
                    <CheckCircleOutlined /> :
                    <ExclamationCircleOutlined />
                  }
                >
                  <div>
                    <Space>
                      <Tag color={record.execution_status === 'success' ? 'success' : 'error'}>
                        {record.execution_status}
                      </Tag>
                      <Text type="secondary">{record.execution_time_ms.toFixed(2)}ms</Text>
                    </Space>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(record.created_at).toLocaleString()}
                      </Text>
                    </div>
                    {record.error_message && (
                      <Alert
                        message="错误信息"
                        description={record.error_message}
                        type="error"
                        showIcon
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <Empty description="暂无执行历史" />
          )}
        </Spin>
      </Drawer>

      {/* 创建自定义Hook对话框 */}
      <Drawer
        title="创建自定义Hook"
        placement="right"
        onClose={() => setCreateHookVisible(false)}
        open={createHookVisible}
        width={600}
      >
        <Alert
          message="创建说明"
          description="先创建Hook的基本信息，创建成功后可以进入编辑页面添加工具绑定。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleSubmitCreateHook}
          initialValues={{
            hook_type: 'pre',
            execution_mode: 'sequential',
            timeout_ms: 5000,
            max_retries: 0
          }}
        >
          <Form.Item
            name="hook_id"
            label="Hook ID"
            rules={[
              { required: true, message: '请输入Hook ID' },
              { pattern: /^[a-z_][a-z0-9_]*$/, message: 'Hook ID只能包含小写字母、数字和下划线，且必须以字母或下划线开头' }
            ]}
          >
            <Input placeholder="例如: my_custom_hook" />
          </Form.Item>

          <Form.Item
            name="hook_name"
            label="Hook名称"
            rules={[{ required: true, message: '请输入Hook名称' }]}
          >
            <Input placeholder="例如: 我的自定义Hook" />
          </Form.Item>

          <Form.Item
            name="hook_type"
            label="Hook类型"
            rules={[{ required: true, message: '请选择Hook类型' }]}
          >
            <Select>
              <Select.Option value="pre">Pre-Hook (前置拦截器)</Select.Option>
              <Select.Option value="post">Post-Hook (后置拦截器)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="描述这个Hook的功能..." />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
          >
            <Select placeholder="选择分类" allowClear>
              <Select.Option value="custom">自定义</Select.Option>
              <Select.Option value="validation">验证</Select.Option>
              <Select.Option value="security">安全</Select.Option>
              <Select.Option value="enhancement">增强</Select.Option>
              <Select.Option value="preprocessing">预处理</Select.Option>
              <Select.Option value="routing">路由</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="execution_mode"
            label="执行模式"
          >
            <Select>
              <Select.Option value="sequential">顺序执行 (Sequential)</Select.Option>
              <Select.Option value="parallel">并行执行 (Parallel)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="timeout_ms"
            label="超时时间 (毫秒)"
          >
            <Input type="number" placeholder="5000" />
          </Form.Item>

          <Form.Item
            name="max_retries"
            label="最大重试次数"
          >
            <Input type="number" placeholder="0" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建Hook
              </Button>
              <Button onClick={() => setCreateHookVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 编辑自定义Hook对话框 */}
      <Drawer
        title="编辑Hook"
        placement="right"
        onClose={() => setEditHookVisible(false)}
        open={editHookVisible}
        width={850}
        styles={{
          body: { paddingBottom: 80 }
        }}
      >
        <Alert
          message="编辑说明"
          description="修改Hook的基本信息和配置参数，并添加工具绑定。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleSubmitEditHook}
        >
          <div style={{ marginBottom: 32 }}>
            <Title level={5} style={{ marginBottom: 16, color: '#1890ff' }}>
              <ApiOutlined style={{ marginRight: 8 }} />
              基本信息
            </Title>

            <Form.Item
              name="hook_name"
              label="Hook名称"
              rules={[{ required: true, message: '请输入Hook名称' }]}
              style={{ marginBottom: 16 }}
            >
              <Input
                placeholder="例如: 我的自定义Hook"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
              style={{ marginBottom: 16 }}
            >
              <TextArea
                rows={3}
                placeholder="描述这个Hook的功能..."
                style={{ resize: 'vertical' }}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="分类"
                  style={{ marginBottom: 16 }}
                >
                  <Select placeholder="选择分类" size="large" allowClear>
                    <Select.Option value="custom">自定义</Select.Option>
                    <Select.Option value="validation">验证</Select.Option>
                    <Select.Option value="security">安全</Select.Option>
                    <Select.Option value="enhancement">增强</Select.Option>
                    <Select.Option value="preprocessing">预处理</Select.Option>
                    <Select.Option value="routing">路由</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="priority"
                  label="优先级"
                  style={{ marginBottom: 16 }}
                >
                  <Input
                    type="number"
                    placeholder="50"
                    size="large"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="execution_mode"
                  label="执行模式"
                  style={{ marginBottom: 16 }}
                >
                  <Select size="large">
                    <Select.Option value="sequential">顺序执行 (Sequential)</Select.Option>
                    <Select.Option value="parallel">并行执行 (Parallel)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="timeout_ms"
                  label="超时时间 (毫秒)"
                  style={{ marginBottom: 16 }}
                >
                  <Input
                    type="number"
                    placeholder="5000"
                    size="large"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="max_retries"
              label="最大重试次数"
              style={{ marginBottom: 0 }}
            >
              <Input
                type="number"
                placeholder="0"
                size="large"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16, color: '#52c41a' }}>
              <ThunderboltOutlined style={{ marginRight: 8 }} />
              工具绑定配置
            </Title>
            <Alert
              message="配置Hook调用的工具"
              description="每个工具绑定代表Hook执行过程中调用的一个工具。可以添加多个工具绑定，按顺序或并行执行。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.List name="tool_bindings">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Card
                      key={field.key}
                      size="small"
                      title={
                        <span style={{ fontWeight: 600 }}>
                          工具绑定 #{index + 1}
                        </span>
                      }
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        >
                          删除
                        </Button>
                      }
                      style={{
                        marginBottom: 16,
                        borderLeft: '3px solid #1890ff'
                      }}
                    >
                      <Form.Item
                        {...field}
                        name={[field.name, 'step_id']}
                        label="步骤ID"
                        rules={[{ required: true, message: '请输入步骤ID' }]}
                        style={{ marginBottom: 16 }}
                      >
                        <Input
                          placeholder="例如: step_1"
                          size="large"
                        />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={16}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'tool_id']}
                            label="工具ID"
                            rules={[{ required: true, message: '请选择工具' }]}
                            style={{ marginBottom: 16 }}
                          >
                            <Select
                              placeholder="选择工具"
                              showSearch
                              size="large"
                              optionFilterProp="children"
                              loading={toolsLoading}
                              onDropdownVisibleChange={(open) => {
                                if (open && !toolsData) {
                                  loadTools();
                                }
                              }}
                            >
                              {toolsData && [
                                ...toolsData.api_tools.map(tool => (
                                  <Select.Option key={tool.tool_id} value={tool.tool_id}>
                                    <Tag color="blue">API</Tag> {tool.tool_name}
                                  </Select.Option>
                                )),
                                ...toolsData.mcp_tools.map(tool => (
                                  <Select.Option key={tool.tool_id} value={tool.tool_id}>
                                    <Tag color="green">MCP</Tag> {tool.tool_name}
                                  </Select.Option>
                                ))
                              ]}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'tool_type']}
                            label="工具类型"
                            rules={[{ required: true, message: '请选择工具类型' }]}
                            style={{ marginBottom: 16 }}
                          >
                            <Select placeholder="类型" size="large">
                              <Select.Option value="api">API</Select.Option>
                              <Select.Option value="mcp">MCP</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        {...field}
                        name={[field.name, 'params']}
                        label="工具参数 (JSON格式)"
                        initialValue={{}}
                        style={{ marginBottom: 16 }}
                      >
                        <TextArea
                          rows={4}
                          placeholder='{"param1": "value1", "param2": "value2"}'
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            resize: 'vertical'
                          }}
                        />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'on_success']}
                            label="成功后动作"
                            initialValue="continue"
                            style={{ marginBottom: 0 }}
                          >
                            <Select size="large">
                              <Select.Option value="continue">继续执行</Select.Option>
                              <Select.Option value="stop">停止执行</Select.Option>
                              <Select.Option value="skip_next">跳过下一步</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'on_failure']}
                            label="失败后动作"
                            initialValue="continue"
                            style={{ marginBottom: 0 }}
                          >
                            <Select size="large">
                              <Select.Option value="continue">继续执行</Select.Option>
                              <Select.Option value="stop">停止执行</Select.Option>
                              <Select.Option value="retry">重试</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}

                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    size="large"
                    style={{ marginBottom: 16, height: 48 }}
                  >
                    添加工具绑定
                  </Button>
                </>
              )}
            </Form.List>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: '1px solid #f0f0f0',
              padding: '16px 24px',
              background: '#fff',
              textAlign: 'right'
            }}
          >
            <Space size="middle">
              <Button onClick={() => setEditHookVisible(false)} size="large">
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                保存修改
              </Button>
            </Space>
          </div>
        </Form>
      </Drawer>

      {/* Hook配置抽屉 */}
      <Drawer
        title={`配置Hook: ${selectedHook?.name}`}
        placement="right"
        onClose={() => setConfigDrawerVisible(false)}
        open={configDrawerVisible}
        width={800}
        styles={{
          body: { paddingBottom: 80 }
        }}
      >
        <Alert
          message="Hook配置说明"
          description="配置Hook的参数和绑定的工具。所有配置会保存到数据库中。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleSubmitConfig}
        >
          {/* Hook参数配置 */}
          {selectedHook && selectedHook.config_params && selectedHook.config_params.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <Title level={5} style={{ marginBottom: 16, color: '#1890ff' }}>
                <FunctionOutlined style={{ marginRight: 8 }} />
                Hook参数配置
              </Title>

              {selectedHook.config_params.map((param: any) => (
                <Form.Item
                  key={param.name}
                  name={param.name}
                  label={
                    <span>
                      {param.label || param.name}
                      {param.required && <Tag color="red" style={{ marginLeft: 8 }}>必需</Tag>}
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                        ({param.type})
                      </Text>
                    </span>
                  }
                  rules={param.required ? [{ required: true, message: `请输入${param.label || param.name}` }] : []}
                  tooltip={param.description}
                  style={{ marginBottom: 16 }}
                  valuePropName={param.type === 'bool' ? 'checked' : 'value'}
                >
                  {param.type === 'bool' ? (
                    <Switch />
                  ) : param.type.includes('List') || param.type.includes('list') ? (
                    <Select mode="tags" placeholder={`输入${param.label || param.name}`} />
                  ) : (
                    <Input placeholder={param.description} />
                  )}
                </Form.Item>
              ))}
            </div>
          )}

          {/* 工具绑定配置 */}
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16, color: '#52c41a' }}>
              <ApiOutlined style={{ marginRight: 8 }} />
              工具绑定
            </Title>
            <Alert
              message="绑定外部工具"
              description="为此Hook绑定API工具或MCP工具。绑定的工具可以在Hook执行过程中被调用。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.List name="tool_bindings">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Card
                      key={field.key}
                      size="small"
                      title={`工具 #${index + 1}`}
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        >
                          删除
                        </Button>
                      }
                      style={{
                        marginBottom: 16,
                        borderLeft: '3px solid #52c41a'
                      }}
                    >
                      <Row gutter={16}>
                        <Col span={18}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'tool_id']}
                            label="选择工具"
                            rules={[{ required: true, message: '请选择工具' }]}
                            style={{ marginBottom: 12 }}
                          >
                            <Select
                              placeholder="选择要绑定的工具"
                              showSearch
                              optionFilterProp="children"
                              loading={toolsLoading}
                              onDropdownVisibleChange={(open) => {
                                if (open && !toolsData) {
                                  loadTools();
                                }
                              }}
                            >
                              {toolsData && [
                                ...toolsData.api_tools.map(tool => (
                                  <Select.Option key={tool.tool_id} value={tool.tool_id}>
                                    <Space>
                                      <Tag color="blue">API</Tag>
                                      <span>{tool.tool_name}</span>
                                    </Space>
                                  </Select.Option>
                                )),
                                ...toolsData.mcp_tools.map(tool => (
                                  <Select.Option key={tool.tool_id} value={tool.tool_id}>
                                    <Space>
                                      <Tag color="green">MCP</Tag>
                                      <span>{tool.tool_name}</span>
                                    </Space>
                                  </Select.Option>
                                ))
                              ]}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'tool_type']}
                            label="类型"
                            rules={[{ required: true }]}
                            style={{ marginBottom: 12 }}
                          >
                            <Select placeholder="类型">
                              <Select.Option value="api">API</Select.Option>
                              <Select.Option value="mcp">MCP</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        {...field}
                        name={[field.name, 'params']}
                        label="工具参数 (JSON)"
                        style={{ marginBottom: 0 }}
                      >
                        <TextArea
                          rows={3}
                          placeholder='{"key": "value"}'
                          style={{ fontFamily: 'monospace', fontSize: 12 }}
                        />
                      </Form.Item>
                    </Card>
                  ))}

                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    添加工具绑定
                  </Button>
                </>
              )}
            </Form.List>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: '1px solid #f0f0f0',
              padding: '16px 24px',
              background: '#fff',
              textAlign: 'right'
            }}
          >
            <Space size="middle">
              <Button onClick={() => setConfigDrawerVisible(false)} size="large">
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                保存配置
              </Button>
            </Space>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default HookManagementPage;
