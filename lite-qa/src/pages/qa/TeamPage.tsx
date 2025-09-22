/**
 * Team页面 - 提供Agno Team的查询、监控和管理功能
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Tabs,
  Table,
  Tag,
  Progress,
  Row,
  Col,
  Statistic,
  Alert,
  Modal,
  Descriptions,
  Divider,
  Badge,
  Tooltip,
  Select,
  Switch,
  Radio,
  message
} from 'antd';
import {
  TeamOutlined,
  SendOutlined,
  BarChartOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  StopOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  UserOutlined,
  DatabaseOutlined,
  LineChartOutlined,
  SearchOutlined,
  BookOutlined,
  FileTextOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import TeamMessageRenderer from '../../components/qa/TeamMessageRenderer';
import SimpleTestRenderer from '../../components/qa/SimpleTestRenderer';
import { teamService } from '../../services/teamService';
import { qaService } from '../../services/qaService';
import type { TeamMessage, TeamMemberCall, TeamStructuredOutput, TeamCoordinationInfo } from '../../types';
import { useAuthStore } from '../../stores/authStore';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface TeamPageProps {
  // 可以添加props用于数据获取
}

const TeamPage: React.FC<TeamPageProps> = () => {
  const { user } = useAuthStore(); // 🔥 获取当前用户信息
  const [query, setQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('general_qa_team_v2');
  const [teamDefaultConfig, setTeamDefaultConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [executionDetails, setExecutionDetails] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [searchKnowledge, setSearchKnowledge] = useState(true);  // 知识库检索开关
  const [searchGraph, setSearchGraph] = useState(false);  // 知识图谱检索开关
  const [retrievalMode, setRetrievalMode] = useState<'all' | 'qa_only' | 'papers_only'>('all');  // 检索模式
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);  // 当前执行ID
  const [useSimpleTestMode, setUseSimpleTestMode] = useState(false);  // 🔥 简化测试模式开关
  const [teamConversations, setTeamConversations] = useState<any[]>([]);  // 🔥 Team对话历史
  const [conversationsLoading, setConversationsLoading] = useState(false);  // 🔥 历史加载状态
  const [currentSessionId, setCurrentSessionId] = useState<string>('');  // 🔥 当前会话ID - 持续保持

  // 初始化session_id
  useEffect(() => {
    if (user?.id && !currentSessionId) {
      const sessionId = `team_${user.id}_${Date.now()}`;
      setCurrentSessionId(sessionId);
      console.log('[TEAM_PAGE] 🔍 初始化session_id:', sessionId);
    }
  }, [user?.id, currentSessionId]);

  // 加载可用团队列表
  useEffect(() => {
    loadAvailableTeams();
    loadTeamStats();
  }, []);

  // 🔥 加载team对话历史
  useEffect(() => {
    if (user?.id) {
      loadTeamConversations();
    }
  }, [user?.id]);

  const loadAvailableTeams = async () => {
    try {
      const teams = await teamService.getAvailableTeams();
      setAvailableTeams(teams);
      
      // 获取Team默认配置
      try {
        const defaultsResponse = await fetch('/api/v1/api/qa/defaults');
        if (defaultsResponse.ok) {
          const defaultsData = await defaultsResponse.json();
          if (defaultsData.success && defaultsData.data) {
            setTeamDefaultConfig(defaultsData.data);
            // 设置Team模式的默认选择
            if (defaultsData.data.team?.default_name) {
              setSelectedTeam(defaultsData.data.team.default_name);
            }
            console.log('TeamPage获取到默认配置:', defaultsData.data);
          }
        }
      } catch (configError) {
        console.error('获取默认配置失败:', configError);
      }
    } catch (error) {
      console.error('加载团队列表失败:', error);
      message.error('加载团队列表失败');
    }
  };

  const loadTeamStats = async () => {
    try {
      const stats = await teamService.getTeamStats();
      setTeamStats(stats);
    } catch (error) {
      console.error('加载团队统计失败:', error);
    }
  };

  // 🔥 加载Team对话历史
  const loadTeamConversations = async () => {
    if (!user?.id) {
      console.log('[TEAM_PAGE] 用户未登录，跳过加载Team对话历史');
      return;
    }

    try {
      setConversationsLoading(true);
      console.log('[TEAM_PAGE] 🔍 开始加载Team对话历史, userId:', user.id, 'userType:', typeof user.id);
      
      const response = await qaService.getConversationHistory(user.id, 1, 20, 'team');
      setTeamConversations(response.conversations);
      
      console.log('[TEAM_PAGE] 🔍 Team对话历史加载成功:', response.conversations.length, '个对话');
      console.log('[TEAM_PAGE] 🔍 对话详情:', response.conversations.map(c => ({ id: c.id, session_id: c.session_id, title: c.title })));
    } catch (error) {
      console.error('[TEAM_PAGE] 加载Team对话历史失败:', error);
      message.error('加载对话历史失败');
    } finally {
      setConversationsLoading(false);
    }
  };

  const handleTeamQuery = async () => {
    if (!query.trim()) {
      message.warning('请输入查询内容');
      return;
    }

    setLoading(true);
    setCurrentExecutionId(null); // 重置执行ID

    try {
      // 🔥 调试：检查用户信息
      console.log('[TEAM_PAGE] 🔍 调试用户信息:', {
        user,
        userId: user?.id,
        userType: typeof user?.id,
        currentSessionId
      });
      
      // 执行Team查询
      const response = await teamService.executeTeamQuery({
        team_name: selectedTeam,
        query: query.trim(),
        session_id: currentSessionId,  // 🔥 使用持续的session_id
        stream: false,
        enable_monitoring: true,
        knowledge_retrieval_mode: searchKnowledge ? retrievalMode : undefined,  // 只有在知识库检索开启时才传递检索模式
        knowledge_retrieval_enabled: searchKnowledge,  // 知识库检索开关
        knowledge_graph_enabled: searchGraph,  // 知识图谱检索开关
        user_id: user?.id  // 🔥 传递用户ID
      });

      // 设置当前执行ID
      setCurrentExecutionId(response.execution_id);
      
      // 创建Team消息
      const teamMessage = teamService.createTeamMessage(
        response.content,
        {
          teamId: selectedTeam,
          teamName: response.team_name,
          teamMode: 'coordinate',
          executionId: response.execution_id,
          memberCalls: response.member_calls || [],
          structuredOutput: response.structured_output,
          coordinationInfo: response.coordination_info
        }
      );

      setTeamMessages(prev => [...prev, teamMessage]);
      setQuery('');
      message.success('Team查询完成');
    } catch (error) {
      console.error('Team查询失败:', error);
      message.error('Team查询失败');
    } finally {
      setLoading(false);
      setCurrentExecutionId(null); // 清除执行ID
      // 🔥 刷新Team对话历史
      if (user?.id) {
        loadTeamConversations();
      }
    }
  };

  const handleStreamingQuery = async () => {
    if (!query.trim()) {
      message.warning('请输入查询内容');
      return;
    }

    console.log('🚀 [TEAM_PAGE] 开始流式查询, query:', query.trim());
    setStreaming(true);
    setCurrentExecutionId(null); // 重置执行ID
    let currentMessage: TeamMessage | null = null;

    try {
      // 🔥 调试：检查用户信息
      console.log('[TEAM_PAGE] 🔍 流式查询调试用户信息:', {
        user,
        userId: user?.id,
        userType: typeof user?.id,
        currentSessionId
      });
      
      await teamService.executeTeamQueryStream(
        {
          team_name: selectedTeam,
          query: query.trim(),
          session_id: currentSessionId,  // 🔥 使用持续的session_id
          stream: true,
          enable_monitoring: true,
          knowledge_retrieval_mode: searchKnowledge ? retrievalMode : undefined,  // 只有在知识库检索开启时才传递检索模式
          knowledge_retrieval_enabled: searchKnowledge,  // 知识库检索开关
          knowledge_graph_enabled: searchGraph,  // 知识图谱检索开关
          user_id: user?.id  // 🔥 传递用户ID
        },
        (event) => {
          try {
            // 🔥 调试：打印原始事件
            console.log('[TEAM_PAGE] 🔍 原始SSE事件:', event.type, event);
            
            const parsedEvent = teamService.parseTeamStreamEvent(event);
            console.log('[TEAM_PAGE] 📝 解析后SSE事件:', parsedEvent.type, parsedEvent.data);
            
            // 🔥 特别监控完成事件
            if (['complete', 'done', 'stream_complete', 'team_complete'].includes(event.type)) {
              console.log('[TEAM_PAGE] 🎯 检测到完成事件类型:', event.type);
              console.log('[TEAM_PAGE] 🎯 解析后类型:', parsedEvent.type);
            }
            
            // 特别关注可能有问题的事件
            if (parsedEvent.type === 'member_call' && parsedEvent.data?.memberId?.includes('question_decomposition')) {
              console.log('[TEAM_PAGE] 🔍 检测到问题分解智能体事件:', parsedEvent);
            }
            
            if (parsedEvent.type === 'team_start') {
            // 设置当前执行ID
            setCurrentExecutionId(parsedEvent.data.execution_id);
            
            // 创建初始消息 - 🔥 关键修复：设置loading状态
            currentMessage = {
              ...teamService.createTeamMessage(
                '正在处理中...',
                {
                  teamId: selectedTeam,
                  teamName: selectedTeam,
                  teamMode: 'coordinate',
                  executionId: parsedEvent.data.execution_id,
                  memberCalls: [],
                  structuredOutput: undefined,
                  coordinationInfo: undefined
                }
              ),
              loading: true  // 🔥 设置初始loading状态为true
            };
            setTeamMessages(prev => [...prev, currentMessage!]);
          } else if (parsedEvent.type === 'content_chunk' && currentMessage) {
            // 更新消息内容 - 批量更新优化，减少渲染频率
            const chunkLength = parsedEvent.data.chunk?.length || 0;
            // 只有在chunk足够大或者每隔一定数量才更新UI，减少渲染压力
            if (chunkLength > 50 || Math.random() < 0.3) {
              setTeamMessages(prev => 
                prev.map(msg => 
                  msg.id === currentMessage!.id 
                    ? { ...msg, content: msg.content + parsedEvent.data.chunk }
                    : msg
                )
              );
            }
            // 在内存中累积内容，但不总是触发渲染
            if (currentMessage) {
              currentMessage.content += parsedEvent.data.chunk;
            }
          } else if (parsedEvent.type === 'member_call' && currentMessage) {
            // 更新成员调用信息
            console.log('[TEAM_PAGE] 正在更新member_call:', parsedEvent.data?.memberId || 'unknown');
            setTeamMessages(prev => {
              const updated = prev.map(msg => 
                msg.id === currentMessage!.id 
                  ? {
                      ...msg,
                      teamInfo: {
                        ...msg.teamInfo,
                        memberCalls: [...(msg.teamInfo.memberCalls || []), parsedEvent.data]
                      }
                    }
                  : msg
              );
              console.log('[TEAM_PAGE] member_call更新完成，当前memberCalls数量:', 
                updated.find(msg => msg.id === currentMessage!.id)?.teamInfo?.memberCalls?.length || 0);
              return updated;
            });
          // 🔥 新增：Agent切换事件处理
          } else if (parsedEvent.type === 'agent_start' && currentMessage) {
            console.log('[AGENT_START] 前端收到Agent开始事件:', parsedEvent.data);
            // Agent开始执行，更新当前执行状态
            setTeamMessages(prev => 
              prev.map(msg => 
                msg.id === currentMessage!.id 
                  ? {
                      ...msg,
                      teamInfo: {
                        ...msg.teamInfo,
                        currentAgent: {
                          id: parsedEvent.data.agent_id,
                          name: parsedEvent.data.agent_name,
                          role: parsedEvent.data.role,
                          action: parsedEvent.data.action,
                          step: parsedEvent.data.step,
                          icon: parsedEvent.data.icon,
                          status: 'running',
                          startTime: parsedEvent.data.timestamp
                        },
                        agentProgress: {
                          currentStep: parsedEvent.data.step,
                          totalSteps: parsedEvent.data.total_steps
                        }
                      }
                    }
                  : msg
              )
            );
          } else if (parsedEvent.type === 'agent_complete' && currentMessage) {
            console.log('[AGENT_COMPLETE] 前端收到Agent完成事件:', parsedEvent.data);
            // Agent完成执行，更新状态
            setTeamMessages(prev => 
              prev.map(msg => 
                msg.id === currentMessage!.id 
                  ? {
                      ...msg,
                      teamInfo: {
                        ...msg.teamInfo,
                        currentAgent: msg.teamInfo.currentAgent ? {
                          ...msg.teamInfo.currentAgent,
                          status: 'completed',
                          endTime: parsedEvent.data.timestamp,
                          contentGenerated: parsedEvent.data.content_generated
                        } : undefined
                      }
                    }
                  : msg
              )
            );
          } else if (parsedEvent.type === 'team_complete' && currentMessage) {
            // 🔥 修复：完成消息处理，支持多种完成事件格式
            console.log('[TEAM_COMPLETE] 🎉 收到Team完成事件:', parsedEvent);
            console.log('[TEAM_COMPLETE] 🎉 当前消息ID:', currentMessage.id);
            console.log('[TEAM_COMPLETE] 🎉 准备更新消息状态为完成');
            
            setTeamMessages(prev => 
              prev.map(msg => 
                msg.id === currentMessage!.id 
                  ? {
                      ...msg,
                      // 只有当完成事件包含新内容时才更新内容
                      content: parsedEvent.data.content || msg.content,
                      // 🔥 关键修复：设置loading为false，表示消息加载完成
                      loading: false,
                      teamInfo: {
                        ...msg.teamInfo,
                        // 更新团队信息，如果完成事件包含这些数据
                        memberCalls: parsedEvent.data.member_calls || msg.teamInfo.memberCalls || [],
                        structuredOutput: parsedEvent.data.structured_output || msg.teamInfo.structuredOutput,
                        coordinationInfo: parsedEvent.data.coordination_info || msg.teamInfo.coordinationInfo,
                        // 标记为完成状态
                        isCompleted: true,
                        completedAt: parsedEvent.data.timestamp || Date.now(),
                        eventCount: parsedEvent.data.event_count,
                        executionId: parsedEvent.data.execution_id || msg.teamInfo.executionId
                      }
                    }
                  : msg
              )
            );
            
            // 🔥 关键修复：立即标记流式处理完成，结束SSE连接
            console.log('[TEAM_COMPLETE] 🎉 Team流式查询完成，立即更新状态');
            
            // 🔥 立即更新状态，不再延迟，确保UI响应及时
            setStreaming(false);
            setCurrentExecutionId(null);
            
            message.success(`Team流式查询完成${parsedEvent.data.event_count ? ` (处理了${parsedEvent.data.event_count}个事件)` : ''}`);
            
            // 🔥 刷新Team对话历史
            if (user?.id) {
              loadTeamConversations();
            }
          }
          } catch (eventError) {
            console.error('[TEAM_PAGE] SSE事件处理错误:', eventError);
            console.error('[TEAM_PAGE] 错误事件数据:', event);
            // 不重新抛出错误，避免中断SSE连接
          }
        }
      );
    } catch (error) {
      console.error('Team流式查询失败:', error);
      message.error('Team流式查询失败');
      
      // 🔥 错误情况下也要更新消息loading状态
      if (currentMessage) {
        setTeamMessages(prev => 
          prev.map(msg => 
            msg.id === currentMessage!.id 
              ? { ...msg, loading: false }
              : msg
          )
        );
      }
    } finally {
      setStreaming(false);
      setCurrentExecutionId(null); // 清除执行ID
      setQuery('');
    }
  };

  const handleCancelExecution = async () => {
    if (!currentExecutionId) {
      message.warning('没有正在执行的任务');
      return;
    }

    try {
      const success = await teamService.cancelExecution(currentExecutionId);
      if (success) {
        message.success('任务已取消');
        setCurrentExecutionId(null);
        setLoading(false);
        setStreaming(false);
        
        // 🔥 取消时也要更新消息loading状态
        setTeamMessages(prev => 
          prev.map(msg => 
            msg.teamInfo?.executionId === currentExecutionId
              ? { ...msg, loading: false, content: msg.content + '\n\n[任务已取消]' }
              : msg
          )
        );
      } else {
        message.error('取消任务失败');
      }
    } catch (error) {
      console.error('取消任务失败:', error);
      message.error('取消任务失败');
    }
  };

  const handleViewDetails = async (executionId: string) => {
    try {
      const details = await teamService.getExecutionStatus(executionId);
      setExecutionDetails(details);
      setSelectedExecutionId(executionId);
      setDetailsModalVisible(true);
    } catch (error) {
      console.error('获取执行详情失败:', error);
      message.error('获取执行详情失败');
    }
  };

  const handleViewMetrics = async (executionId: string) => {
    try {
      const metrics = await teamService.getExecutionMetrics(executionId);
      setExecutionDetails(metrics);
      setSelectedExecutionId(executionId);
      setDetailsModalVisible(true);
    } catch (error) {
      console.error('获取执行指标失败:', error);
      message.error('获取执行指标失败');
    }
  };

  const handleTestTeam = async () => {
    try {
      const result = await teamService.testTeamFunctionality();
      message.success('Team功能测试成功');
      console.log('测试结果:', result);
    } catch (error) {
      console.error('Team功能测试失败:', error);
      message.error('Team功能测试失败');
    }
  };

  const columns = [
    {
      title: '执行ID',
      dataIndex: 'executionId',
      key: 'executionId',
      render: (id: string) => (
        <Text code>{id.substring(0, 8)}...</Text>
      )
    },
    {
      title: '团队名称',
      dataIndex: 'teamName',
      key: 'teamName',
      render: (name: string) => (
        <Space>
          <TeamOutlined />
          <Text strong>{name}</Text>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          completed: { color: 'success', icon: <CheckCircleOutlined /> },
          running: { color: 'processing', icon: <LoadingOutlined /> },
          error: { color: 'error', icon: <ExclamationCircleOutlined /> },
          pending: { color: 'warning', icon: <ClockCircleOutlined /> }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return (
          <Tag color={config.color} icon={config.icon}>
            {status}
          </Tag>
        );
      }
    },
    {
      title: '处理时间',
      dataIndex: 'processingTime',
      key: 'processingTime',
      render: (time: number) => teamService.formatExecutionTime(time)
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record.executionId)}
          >
            详情
          </Button>
          <Button
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => handleViewMetrics(record.executionId)}
          >
            指标
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="team-page p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2}>
            <TeamOutlined className="mr-2" />
            Agno Team 智能问答
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <Text type="secondary">
              基于Agno框架的多智能体协作问答系统，支持多语言智能问答
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Text>简化测试模式：</Text>
              <Switch
                checked={useSimpleTestMode}
                onChange={setUseSimpleTestMode}
                checkedChildren="简化"
                unCheckedChildren="完整"
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {useSimpleTestMode ? '🧪 纯SSE测试' : '📊 完整功能'}
              </Text>
            </div>
          </div>
        </div>

        {/* 🔥 根据模式选择渲染不同的组件 */}
        {useSimpleTestMode ? (
          <SimpleTestRenderer teamName={selectedTeam} />
        ) : (
          <Row gutter={24}>
            {/* 左侧：查询区域 */}
            <Col span={16}>
            <Card title="Team查询" className="mb-6">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* 团队选择 */}
                <div>
                  <Text strong>选择团队：</Text>
                  <Select
                    value={selectedTeam}
                    onChange={setSelectedTeam}
                    style={{ width: 300, marginLeft: 8 }}
                  >
                    {availableTeams.map(team => (
                      <Option key={team.name} value={team.name}>
                        <Space>
                          <TeamOutlined />
                          {team.display_name}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </div>

                {/* 查询输入 */}
                <div>
                  <Text strong>查询内容：</Text>
                  <TextArea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="请输入您的问题，例如：有什么需要帮助的吗？"
                    rows={4}
                    style={{ marginTop: 8 }}
                  />
                </div>

                {/* 知识检索设置 */}
                <div>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SearchOutlined style={{ color: '#1890ff' }} />
                      <Text strong>知识库检索：</Text>
                      <Switch
                        checked={searchKnowledge}
                        onChange={setSearchKnowledge}
                        size="small"
                      />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {searchKnowledge ? '已启用' : '已关闭'}
                      </Text>
                    </div>
                    
                    {searchKnowledge && (
                      <div style={{ paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div>
                          <Text strong style={{ fontSize: '13px' }}>检索范围：</Text>
                          <Radio.Group
                            value={retrievalMode}
                            onChange={(e) => setRetrievalMode(e.target.value)}
                            size="small"
                            style={{ marginLeft: '8px' }}
                          >
                            <Radio.Button value="all" style={{ fontSize: '12px' }}>
                              <DatabaseOutlined style={{ marginRight: '4px' }} />
                              全部检索
                            </Radio.Button>
                            <Radio.Button value="qa_only" style={{ fontSize: '12px' }}>
                              <BookOutlined style={{ marginRight: '4px' }} />
                              QA数据集
                            </Radio.Button>
                            <Radio.Button value="papers_only" style={{ fontSize: '12px' }}>
                              <FileTextOutlined style={{ marginRight: '4px' }} />
                              论文知识库
                            </Radio.Button>
                          </Radio.Group>
                        </div>
                        
                        {/* 知识图谱检索开关 - 放在检索范围选择的后面 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ApartmentOutlined style={{ color: searchGraph ? '#1890ff' : '#d9d9d9' }} />
                          <Text strong style={{ fontSize: '13px' }}>知识图谱：</Text>
                          <Switch
                            checked={searchGraph}
                            onChange={setSearchGraph}
                            size="small"
                          />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {searchGraph ? '已启用' : '已关闭'}
                          </Text>
                        </div>
                      </div>
                    )}
                    
                    {/* 当知识库检索关闭时，独立显示知识图谱开关 */}
                    {!searchKnowledge && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ApartmentOutlined style={{ color: searchGraph ? '#1890ff' : '#d9d9d9' }} />
                        <Text strong>知识图谱：</Text>
                        <Switch
                          checked={searchGraph}
                          onChange={setSearchGraph}
                          size="small"
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {searchGraph ? '已启用' : '已关闭'}
                        </Text>
                      </div>
                    )}
                  </Space>
                </div>

                {/* 操作按钮 */}
                <Space>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={loading}
                    onClick={handleTeamQuery}
                    disabled={streaming}
                  >
                    执行查询
                  </Button>
                  <Button
                    icon={<PlayCircleOutlined />}
                    loading={streaming}
                    onClick={handleStreamingQuery}
                    disabled={loading}
                  >
                    流式查询
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleTestTeam}
                  >
                    测试功能
                  </Button>
                  {/* 中断按钮 */}
                  {(loading || streaming) && currentExecutionId && (
                    <Button
                      danger
                      icon={<StopOutlined />}
                      onClick={handleCancelExecution}
                    >
                      中断执行
                    </Button>
                  )}
                </Space>
              </Space>
            </Card>

            {/* 查询结果 */}
            <Card title="查询结果" className="mb-6">
              {teamMessages.length === 0 ? (
                <div className="text-center py-12">
                  <TeamOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                  <div className="mt-4 text-gray-500">
                    暂无查询结果，请开始您的第一个Team查询
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMessages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <TeamMessageRenderer
                        message={message}
                        onViewDetails={(memberCall) => {
                          console.log('查看成员调用详情:', memberCall);
                        }}
                        onViewMetrics={(executionId) => {
                          handleViewMetrics(executionId);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>

          {/* 右侧：统计和监控 */}
          <Col span={8}>
            <Card title="团队统计" className="mb-6">
              {teamStats ? (
                <div className="space-y-4">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="总执行次数"
                        value={teamStats.overall_stats?.total_executions || 0}
                        prefix={<DatabaseOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="成功率"
                        value={teamStats.overall_stats?.successful_executions || 0}
                        suffix={`/ ${teamStats.overall_stats?.total_executions || 0}`}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="平均耗时"
                        value={teamStats.overall_stats?.average_duration || 0}
                        suffix="ms"
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="活跃团队"
                        value={teamStats.team_stats?.length || 0}
                        prefix={<TeamOutlined />}
                      />
                    </Col>
                  </Row>
                </div>
              ) : (
                <div className="text-center py-8">
                  <LoadingOutlined style={{ fontSize: 24 }} />
                  <div className="mt-2 text-gray-500">加载统计中...</div>
                </div>
              )}
            </Card>

            <Card title="快速操作">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
                  icon={<BarChartOutlined />}
                  onClick={() => window.open('/langdb-monitor', '_blank')}
                >
                  打开监控面板
                </Button>
                <Button
                  block
                  icon={<ReloadOutlined />}
                  onClick={loadTeamStats}
                >
                  刷新统计
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
        )}
      </div>

      {/* 执行详情模态框 */}
      <Modal
        title="执行详情"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={800}
      >
        {executionDetails && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="执行ID">
              <Text code>{selectedExecutionId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color="blue">{executionDetails.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="团队名称">
              {executionDetails.team_name}
            </Descriptions.Item>
            <Descriptions.Item label="处理时间">
              {executionDetails.processing_time ? 
                teamService.formatExecutionTime(executionDetails.processing_time) : 
                'N/A'
              }
            </Descriptions.Item>
            <Descriptions.Item label="查询内容" span={2}>
              <Text>{executionDetails.query}</Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default TeamPage; 