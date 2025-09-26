/**
 * 检索测试组件 - 测试知识库检索效果
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  List,
  Progress,
  Space,
  Tag,
  Typography,
  Divider,
  Empty,
  Spin,
  Alert,
  Slider,
  Form,
  Select,
  Switch,
  message
} from 'antd';
import {
  SearchOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  FileOutlined,
  MessageOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import type { RetrievalResult } from '../../types';
import { qaDatasetService } from '../../services/qaDatasetService';
import { knowledgeService } from '../../services/knowledgeService';

const { Text, Paragraph } = Typography;
const { Option } = Select;

interface QuickTestQuestion {
  question: string;
  source: 'api' | 'imported' | 'default';
  sourceInfo?: string;
  id?: string;
}

interface RetrievalTestProps {
  query: string;
  results: RetrievalResult[];
  loading: boolean;
  onQueryChange: (query: string) => void;
  onTest: (query: string, params?: {
    topK?: number;
    threshold?: number;
    useRerank?: boolean;
    dataSource?: 'all' | 'documents' | 'qa';
    enableTranslation?: boolean;
    collectionId?: string;
  }) => void;
  collectionId?: string; // 可选：当前选择的知识库ID
}

export const RetrievalTest: React.FC<RetrievalTestProps> = ({
  query,
  results,
  loading,
  onQueryChange,
  onTest,
  collectionId
}) => {
  const [testQuery, setTestQuery] = useState(query);
  const [searchParams, setSearchParams] = useState({
    topK: 10,
    threshold: 0.1,
    useRerank: false, // 暂时禁用重排序功能
    includeMetadata: true,
    dataSource: 'all' as 'all' | 'documents' | 'qa',
    enableTranslation: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<QuickTestQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [esIndexing, setEsIndexing] = useState(false);
  const [esDims, setEsDims] = useState<number>(1024);
  const [esForce, setEsForce] = useState<boolean>(false);
  const [onlyCurrentCollection, setOnlyCurrentCollection] = useState<boolean>(false);

  // 加载快速测试问题
  useEffect(() => {
    loadQuickQuestions();
  }, []);

  // 监听导入测试问题事件
  useEffect(() => {
    const handleAddQuickTestQuestion = (event: CustomEvent) => {
      const { question, sourceInfo } = event.detail;
      addImportedQuestion(question, sourceInfo);
    };

    window.addEventListener('addQuickTestQuestion', handleAddQuickTestQuestion as EventListener);
    
    return () => {
      window.removeEventListener('addQuickTestQuestion', handleAddQuickTestQuestion as EventListener);
    };
  }, []);

  const loadQuickQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const questions = await qaDatasetService.getQuickTestQuestions(5);
      const formattedQuestions: QuickTestQuestion[] = questions.map(q => ({
        question: q,
        source: 'api'
      }));
      // 保留现有的导入问题，只更新API问题
      setQuickQuestions(prev => [
        ...prev.filter(q => q.source === 'imported'),
        ...formattedQuestions
      ]);
    } catch (error) {
      console.error('加载快速测试问题失败:', error);
      // 使用默认问题
      const defaultQuestions: QuickTestQuestion[] = [
        { question: '产品的技术特性如何？', source: 'default' },
        { question: '技术参数对性能有什么影响？', source: 'default' },
        { question: '系统架构的特点', source: 'default' },
        { question: '环境变化对系统的影响', source: 'default' },
        { question: '核心参数的最佳范围', source: 'default' }
      ];
      setQuickQuestions(prev => [
        ...prev.filter(q => q.source === 'imported'),
        ...defaultQuestions
      ]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // 添加导入的问题
  const addImportedQuestion = (question: string, sourceInfo?: string) => {
    const newQuestion: QuickTestQuestion = {
      question,
      source: 'imported',
      sourceInfo,
      id: Date.now().toString()
    };

    setQuickQuestions(prev => {
      // 避免重复添加相同问题
      const exists = prev.find(q => q.question === question);
      if (exists) {
        message.info('该问题已存在于快速测试列表中');
        return prev;
      }
      
      // 添加到列表顶部，并限制总数量
      const updated = [newQuestion, ...prev.slice(0, 9)]; // 最多保留10个问题
      message.success('问题已添加到快速测试列表');
      return updated;
    });
  };

  // 删除导入的问题
  const removeImportedQuestion = (id: string) => {
    setQuickQuestions(prev => prev.filter(q => q.id !== id));
    message.success('问题已从快速测试列表中移除');
  };

  // 处理测试
  const handleTest = () => {
    if (!testQuery.trim()) {
      return;
    }
    onQueryChange(testQuery);
    onTest(testQuery, {
      topK: searchParams.topK,
      threshold: searchParams.threshold,
      useRerank: searchParams.useRerank,
      dataSource: searchParams.dataSource,
      enableTranslation: searchParams.enableTranslation,
      collectionId: onlyCurrentCollection ? collectionId : undefined
    });
  };

  // 使用快速问题
  const useQuickQuestion = (question: string) => {
    setTestQuery(question);
    onQueryChange(question);
    onTest(question, {
      topK: searchParams.topK,
      threshold: searchParams.threshold,
      useRerank: searchParams.useRerank,
      dataSource: searchParams.dataSource,
      enableTranslation: searchParams.enableTranslation,
      collectionId: onlyCurrentCollection ? collectionId : undefined
    });
  };

  // 获取来源标签
  const getSourceTag = (questionItem: QuickTestQuestion) => {
    switch (questionItem.source) {
      case 'imported':
        return (
          <Tag color="green" size="small" style={{ fontSize: '10px', marginLeft: '6px' }}>
            <BookOutlined style={{ fontSize: '10px', marginRight: '2px' }} />
            {questionItem.sourceInfo || 'QA数据集'}
          </Tag>
        );
      case 'api':
        return (
          <Tag color="orange" size="small" style={{ fontSize: '10px', marginLeft: '6px' }}>
            <BulbOutlined style={{ fontSize: '10px', marginRight: '2px' }} />
            热门
          </Tag>
        );
      default:
        return null;
    }
  };

  // 获取信心度颜色
  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'success';
    if (score >= 0.7) return 'warning';
    return 'error';
  };

  // 获取信心度文本
  const getConfidenceText = (score: number) => {
    if (score >= 0.9) return '高相关';
    if (score >= 0.7) return '中等相关';
    return '低相关';
  };

  return (
    <div style={{ height: '100%', display: 'flex', gap: '16px' }}>
      {/* 左侧：查询配置区域 */}
      <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        {/* 查询输入卡片 */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SearchOutlined style={{ color: '#1890ff' }} />
              <span>查询输入</span>
            </div>
          }
          size="small"
          style={{
            borderRadius: '12px',
            border: '1px solid #e8f4ff',
            background: 'linear-gradient(135deg, #f6fbff 0%, #e8f4ff 100%)',
            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.1)'
          }}
          headStyle={{
            borderBottom: '1px solid #e8f4ff',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="输入要测试的查询问题..."
              style={{
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
                fontSize: '14px',
                height: '40px'
              }}
              onPressEnter={(e) => {
                e.preventDefault();
                handleTest();
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                onClick={handleTest}
                loading={loading}
                disabled={!testQuery.trim()}
                style={{
                  borderRadius: '8px',
                  height: '36px',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                开始检索
              </Button>
              
              <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>
                按 Enter 开始检索
              </Text>
            </div>

            {/* ES 索引初始化 */}
            <Card size="small" style={{ borderRadius: 8, background: '#fff', border: '1px dashed #e6f7ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Space size={8} align="center">
                  <DatabaseOutlined style={{ color: '#1890ff' }} />
                  <span style={{ fontSize: 13, color: '#595959' }}>初始化检索索引</span>
                </Space>
                <Space size={8} align="center">
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>向量维度</span>
                  <Input
                    size="small"
                    placeholder="1024"
                    value={esDims}
                    onChange={(e) => setEsDims(Number(e.target.value) || 1024)}
                    style={{ width: 80 }}
                  />
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>强制重建</span>
                  <Switch size="small" checked={esForce} onChange={setEsForce} />
                  <Button
                    size="small"
                    onClick={async () => {
                      try {
                        setEsIndexing(true);
                        const res = await knowledgeService.initSearchIndex(esForce, esDims);
                        message.success(`索引${res.result?.created ? '已创建' : '已存在'}（${res.result?.index || 'mat_qa_chunks'}）`);
                      } catch (e: any) {
                        message.error(`初始化索引失败：${e?.message || '未知错误'}`);
                      } finally {
                        setEsIndexing(false);
                      }
                    }}
                    loading={esIndexing}
                  >
                    初始化
                  </Button>
                </Space>
              </div>
            </Card>

            {/* 范围：仅检索当前知识库 */}
            <Card size="small" style={{ borderRadius: 8, background: '#fff', border: '1px dashed #e6f7ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#595959' }}>仅检索当前知识库</span>
                <Switch
                  checked={onlyCurrentCollection}
                  onChange={setOnlyCurrentCollection}
                  disabled={!collectionId}
                />
              </div>
              {!collectionId && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>未选择知识库，无法限定范围</div>
              )}
            </Card>
          </div>
        </Card>

        {/* 参数设置卡片 */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SettingOutlined style={{ color: '#722ed1' }} />
              <span>检索参数</span>
            </div>
          }
          size="small"
          style={{
            borderRadius: '12px',
            border: '1px solid #f3e8ff',
            background: 'linear-gradient(135deg, #fafbff 0%, #f3e8ff 100%)',
            boxShadow: '0 2px 8px rgba(114, 46, 209, 0.1)'
          }}
          headStyle={{
            borderBottom: '1px solid #f3e8ff',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Alert
              type="info"
              showIcon
              message={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>检索范围</span>
                  {onlyCurrentCollection && collectionId ? (
                    <Tag color="blue">当前知识库：{collectionName || collectionId}</Tag>
                  ) : (
                    <Tag>全局</Tag>
                  )}
                </div>
              }
            />
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#595959' }}>
                返回结果数: {searchParams.topK}
              </label>
              <Slider
                min={1}
                max={20}
                value={searchParams.topK}
                onChange={(value) => setSearchParams(prev => ({ ...prev, topK: value }))}
                tooltip={{ formatter: (value) => `${value} 条` }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#595959' }}>
                相似度阈值: {searchParams.threshold}
              </label>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={searchParams.threshold}
                onChange={(value) => setSearchParams(prev => ({ ...prev, threshold: value }))}
                tooltip={{ formatter: (value) => `${value}` }}
              />
            </div>
            
            {/* 数据源选择 */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#595959' }}>
                <DatabaseOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                检索数据源
              </label>
              <Select
                value={searchParams.dataSource}
                onChange={(value) => setSearchParams(prev => ({ ...prev, dataSource: value }))}
                style={{ width: '100%' }}
                size="small"
              >
                <Option value="all">
                  <Space>
                    <DatabaseOutlined style={{ color: '#722ed1' }} />
                    全部检索（文档+QA）
                  </Space>
                </Option>
                <Option value="documents">
                  <Space>
                    <FileOutlined style={{ color: '#1890ff' }} />
                    仅检索文档库
                  </Space>
                </Option>
                <Option value="qa">
                  <Space>
                    <MessageOutlined style={{ color: '#fa8c16' }} />
                    仅检索QA数据集
                  </Space>
                </Option>
              </Select>
            </div>

            {/* 重排序开关 */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#595959' }}>
                结果重排序（Rerank）
              </label>
              <Switch
                checked={searchParams.useRerank}
                onChange={(checked) => setSearchParams(prev => ({ ...prev, useRerank: checked }))}
              />
            </div>
            
            {/* 翻译开关（仅在文档检索时显示） */}
            {(searchParams.dataSource === 'all' || searchParams.dataSource === 'documents') && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#595959' }}>
                  <GlobalOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                  文档检索翻译
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Switch
                    checked={searchParams.enableTranslation}
                    onChange={(checked) => setSearchParams(prev => ({ ...prev, enableTranslation: checked }))}
                    size="small"
                  />
                  <Text style={{ fontSize: '12px', color: '#666' }}>
                    {searchParams.enableTranslation ? '启用中英文翻译检索' : '仅使用原始查询'}
                  </Text>
                </div>
                <Text style={{ fontSize: '11px', color: '#999', lineHeight: '1.4', display: 'block', marginTop: '4px' }}>
                  开启后将对中文查询进行英文翻译，提高英文文档的匹配准确性
                </Text>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Switch
                  size="small"
                  checked={searchParams.useRerank}
                  onChange={(checked) => setSearchParams(prev => ({ ...prev, useRerank: checked }))}
                  disabled={true} // 暂时禁用
                />
                <span style={{ fontSize: '13px', color: '#8c8c8c' }}>使用重排序 (暂时禁用)</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Switch
                  size="small"
                  checked={searchParams.includeMetadata}
                  onChange={(checked) => setSearchParams(prev => ({ ...prev, includeMetadata: checked }))}
                />
                <span style={{ fontSize: '13px', color: '#595959' }}>显示元数据</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 快速测试卡片 */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BulbOutlined style={{ color: '#fa8c16' }} />
                <span>快速测试</span>
                {quickQuestions.filter(q => q.source === 'imported').length > 0 && (
                  <Tag color="green" size="small">
                    {quickQuestions.filter(q => q.source === 'imported').length} 个导入
                  </Tag>
                )}
              </div>
              <Button
                size="small"
                type="text"
                icon={<SearchOutlined />}
                onClick={loadQuickQuestions}
                loading={loadingQuestions}
                style={{
                  color: '#fa8c16',
                  fontSize: '12px'
                }}
                title="刷新问题列表"
              >
                刷新
              </Button>
            </div>
          }
          size="small"
          style={{
            borderRadius: '12px',
            border: '1px solid #fff7e6',
            background: 'linear-gradient(135deg, #fffbf0 0%, #fff7e6 100%)',
            boxShadow: '0 2px 8px rgba(250, 140, 22, 0.1)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            height: 0
          }}
          headStyle={{
            borderBottom: '1px solid #fff7e6',
            borderRadius: '12px 12px 0 0'
          }}
          styles={{
            body: {
              padding: '16px',
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }
          }}
        >
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            maxHeight: '100%'
          }}>
            {loadingQuestions ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100px',
                color: '#fa8c16'
              }}>
                <Spin size="small" />
                <span style={{ marginLeft: '8px', fontSize: '12px' }}>加载问题中...</span>
              </div>
            ) : quickQuestions.length > 0 ? (
              quickQuestions.map((questionItem, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <Button
                    size="small"
                    type="text"
                    onClick={() => useQuickQuestion(questionItem.question)}
                    style={{
                      textAlign: 'left',
                      height: 'auto',
                      padding: '8px 12px',
                      paddingRight: questionItem.source === 'imported' ? '32px' : '12px',
                      borderRadius: '6px',
                      border: questionItem.source === 'imported' 
                        ? '1px solid #b7eb8f' 
                        : '1px solid #ffe58f',
                      background: questionItem.source === 'imported' 
                        ? '#f6ffed' 
                        : '#fffbe6',
                      fontSize: '12px',
                      whiteSpace: 'normal',
                      lineHeight: '1.4',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start'
                    }}
                  >
                    <span>{questionItem.question}</span>
                    {getSourceTag(questionItem)}
                  </Button>
                  
                  {/* 删除按钮 - 仅对导入的问题显示 */}
                  {questionItem.source === 'imported' && questionItem.id && (
                    <Button
                      size="small"
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImportedQuestion(questionItem.id!);
                      }}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        top: '4px',
                        width: '20px',
                        height: '20px',
                        padding: 0,
                        color: '#ff4d4f',
                        background: 'rgba(255, 255, 255, 0.9)'
                      }}
                      title="移除问题"
                    />
                  )}
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#8c8c8c', 
                fontSize: '12px',
                padding: '20px 0'
              }}>
                暂无快速测试问题
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 右侧：检索结果区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <BarChartOutlined style={{ color: '#52c41a' }} />
              <span>检索结果</span>
              
              {/* 检索模式显示 */}
              <Tag 
                color={searchParams.dataSource === 'all' ? 'purple' : searchParams.dataSource === 'documents' ? 'blue' : 'orange'}
                style={{ fontSize: '11px' }}
              >
                {searchParams.dataSource === 'all' && <DatabaseOutlined style={{ marginRight: '2px' }} />}
                {searchParams.dataSource === 'documents' && <FileOutlined style={{ marginRight: '2px' }} />}
                {searchParams.dataSource === 'qa' && <MessageOutlined style={{ marginRight: '2px' }} />}
                {
                  searchParams.dataSource === 'all' ? '全部检索' :
                  searchParams.dataSource === 'documents' ? '文档检索' : 'QA检索'
                }
              </Tag>
              
              {/* 翻译状态显示 */}
              {(searchParams.dataSource === 'all' || searchParams.dataSource === 'documents') && searchParams.enableTranslation && (
                <Tag color="green" style={{ fontSize: '11px' }}>
                  <GlobalOutlined style={{ marginRight: '2px' }} />
                  翻译检索
                </Tag>
              )}
              
              {results.length > 0 && (
                <Tag color="green" style={{ marginLeft: '8px' }}>
                  {results.length} 条结果
                </Tag>
              )}
            </div>
          }
          style={{
            height: '100%',
            borderRadius: '12px',
            border: '1px solid #e8e8e8',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}
          headStyle={{
            borderBottom: '1px solid #e8e8e8',
            borderRadius: '12px 12px 0 0'
          }}
          styles={{
            body: {
              padding: '16px',
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          {loading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#8c8c8c'
            }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px', fontSize: '14px' }}>
                正在检索相关文档...
              </div>
            </div>
          ) : results.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%'
            }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: '#8c8c8c', fontSize: '14px' }}>
                    输入查询问题开始检索测试
                  </span>
                }
              />
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 结果统计 - 区分文档和QA数据集 */}
              <div style={{
                padding: '8px 12px',
                background: '#f0f9ff',
                border: '1px solid #91d5ff',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#1890ff',
                marginBottom: '8px'
              }}>
                {(() => {
                  const docResults = results.filter(r => r.source_type !== 'qa_dataset');
                  const qaResults = results.filter(r => r.source_type === 'qa_dataset');
                  return (
                    <>
                      检索完成，找到 {results.length} 条相关结果 
                      {docResults.length > 0 && ` | 文档: ${docResults.length} 条`}
                      {qaResults.length > 0 && ` | QA: ${qaResults.length} 条`}
                      {' | '}
                      平均相似度: {(results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(3)} | 
                      最高: {Math.max(...results.map(r => r.score)).toFixed(3)} | 
                      最低: {Math.min(...results.map(r => r.score)).toFixed(3)}
                    </>
                  );
                })()}
              </div>

              {/* 召回统计详情 */}
              <Card size="small" style={{ borderRadius: 8 }}>
                <Space size={[8, 8]} wrap>
                  {(() => {
                    const byType: Record<string, number> = {};
                    results.forEach(r => {
                      const t = (r as any).source_type || 'document';
                      byType[t] = (byType[t] || 0) + 1;
                    });
                    return Object.entries(byType).map(([t, c]) => (
                      <Tag key={t} color={t === 'qa_dataset' ? 'orange' : 'blue'}>
                        {t === 'qa_dataset' ? 'QA数据集' : '文档'}：{c} 条
                      </Tag>
                    ));
                  })()}
                </Space>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ fontSize: 12, color: '#595959' }}>Top 3 高分结果：</div>
                <ol style={{ paddingLeft: 16, marginTop: 6 }}>
                  {results
                    .slice(0, 3)
                    .map((r: any, i: number) => (
                      <li key={i} style={{ fontSize: 12, color: '#262626' }}>
                        <Space size={6}>
                          <Tag color={r.source_type === 'qa_dataset' ? 'orange' : 'blue'} style={{ marginRight: 4 }}>
                            {r.source_type === 'qa_dataset' ? 'QA' : 'DOC'}
                          </Tag>
                          <span>{r.title || r.source || '未命名'}</span>
                          <Tag color={r.score >= 0.9 ? 'green' : r.score >= 0.7 ? 'gold' : 'red'}>
                            {Number(r.score || 0).toFixed(3)}
                          </Tag>
                        </Space>
                      </li>
                    ))}
                </ol>
              </Card>

              {/* 结果列表 */}
              <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                <List
                  dataSource={results}
                  split={false}
                  style={{ height: '100%' }}
                  renderItem={(result, index) => (
                    <List.Item
                      style={{
                        marginBottom: '12px',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0',
                        background: '#ffffff',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            {/* 数据源类型标识 */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: result.source_type === 'qa_dataset' 
                                  ? 'linear-gradient(135deg, #ffa940, #fa8c16)' 
                                  : 'linear-gradient(135deg, #40a9ff, #1890ff)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 600,
                                flexShrink: 0
                              }}>
                              {index + 1}
                            </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <Text strong style={{ fontSize: '14px', color: '#262626' }}>
                                {result.title}
                              </Text>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <Tag 
                                  color={getConfidenceColor(result.score)}
                                  style={{ fontSize: '11px', padding: '2px 6px' }}
                                >
                                  {getConfidenceText(result.score)} {result.score.toFixed(3)}
                                </Tag>
                                
                                {/* 源类型标识 */}
                                {result.source_type === 'qa_dataset' ? (
                                  <Tag color="orange" style={{ fontSize: '11px', padding: '2px 6px' }}>
                                    <QuestionCircleOutlined style={{ marginRight: '2px' }} />
                                    QA数据集
                                  </Tag>
                                ) : (
                                  <Tag color="blue" style={{ fontSize: '11px', padding: '2px 6px' }}>
                                    <BookOutlined style={{ marginRight: '2px' }} />
                                    文档
                                  </Tag>
                                )}
                                
                                {result.source && (
                                  <Tag color="default" style={{ fontSize: '11px', padding: '2px 6px' }}>
                                    <FileTextOutlined style={{ marginRight: '2px' }} />
                                    {result.source}
                                  </Tag>
                                )}
                                
                                {(result as any).page && (
                                  <Tag color="default" style={{ fontSize: '11px', padding: '2px 6px' }}>
                                    第 {(result as any).page} 页
                                  </Tag>
                                )}
                              </div>
                            </div>
                          </div>

                          <Progress
                            type="circle"
                            percent={Math.round(result.score * 100)}
                            width={40}
                            strokeWidth={8}
                            strokeColor={
                              result.score >= 0.9 ? '#52c41a' :
                              result.score >= 0.7 ? '#faad14' : '#ff4d4f'
                            }
                            format={(percent) => (
                              <span style={{ fontSize: '10px', fontWeight: 600 }}>
                                {percent}%
                              </span>
                            )}
                          />
                        </div>

                        <div style={{ marginLeft: '36px' }}>
                          {/* QA数据集的特殊显示格式 */}
                          {result.source_type === 'qa_dataset' && result.question && result.answer ? (
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{
                                background: '#fff7e6',
                                border: '1px solid #ffd591',
                                borderRadius: '6px',
                                padding: '8px',
                                marginBottom: '6px'
                              }}>
                                <Text strong style={{ color: '#d46b08', fontSize: '12px' }}>问题：</Text>
                                <div style={{ color: '#595959', fontSize: '13px', lineHeight: '1.4', marginTop: '2px' }}>
                                  {result.question}
                                </div>
                              </div>
                              <div style={{
                                background: '#f6ffed',
                                border: '1px solid #b7eb8f',
                                borderRadius: '6px',
                                padding: '8px'
                              }}>
                                <Text strong style={{ color: '#389e0d', fontSize: '12px' }}>答案：</Text>
                                <Paragraph 
                                  style={{ 
                                    color: '#595959', 
                                    fontSize: '13px',
                                    lineHeight: '1.4',
                                    marginTop: '2px',
                                    marginBottom: 0
                                  }}
                                  ellipsis={{ 
                                    rows: 3, 
                                    expandable: true, 
                                    symbol: '展开'
                                  }}
                                >
                                  {result.answer}
                                </Paragraph>
                              </div>
                            </div>
                          ) : (
                            /* 文档的常规显示格式 */
                            <Paragraph 
                              style={{ 
                                color: '#595959', 
                                fontSize: '13px',
                                lineHeight: '1.5',
                                marginBottom: '8px'
                              }}
                              ellipsis={{ 
                                rows: 2, 
                                expandable: true, 
                                symbol: '展开',
                                onExpand: () => {}
                              }}
                            >
                              {result.content}
                            </Paragraph>
                          )}

                          {result.metadata && searchParams.includeMetadata && (
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#8c8c8c',
                              display: 'flex',
                              gap: '12px',
                              flexWrap: 'wrap'
                            }}>
                              {Object.entries(result.metadata).map(([key, value]) => (
                                <span key={key}>
                                  <strong>{key}:</strong> {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}; 
