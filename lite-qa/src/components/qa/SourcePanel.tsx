/**
 * QA来源溯源面板组件
 */
import React, { useState } from 'react';
import { Typography, Divider, Tag, Progress, Button, Collapse, Card, Tooltip, Empty } from 'antd';
import { 
  FileTextOutlined, 
  LinkOutlined, 
  InfoCircleOutlined,
  HighlightOutlined,
  ExportOutlined,
  SearchOutlined
} from '@ant-design/icons';
import type { SourceData, HighlightData, Message } from '../../types';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

interface SourcePanelProps {
  currentMessage?: Message;
  allSources?: SourceData[];
  onSourceClick?: (source: SourceData) => void;
  className?: string;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
  currentMessage,
  allSources = [],
  onSourceClick,
  className = ''
}) => {
  const [expandedHighlights, setExpandedHighlights] = useState<string[]>([]);

  // 🔥 修复：读取真实的知识库检索数据 knowledgeSources，并转换为 SourceData 格式
  const rawKnowledgeSources = currentMessage?.knowledgeSources || [];
  const messageSources = rawKnowledgeSources.map((ks: any) => ({
    id: ks.id || String(Math.random()),
    title: ks.title || (ks.source_type === 'qa_dataset' ? `Q: ${ks.question?.slice(0, 50)}...` : '未知标题'),
    authors: ks.metadata?.authors || '未知作者',
    journal: ks.metadata?.journal || '知识库',
    year: ks.metadata?.year || new Date().getFullYear(),
    pages: ks.metadata?.pages,
    doi: ks.metadata?.doi,
    url: ks.metadata?.url || '#',
    confidence: Math.round(ks.score * 10) / 10 || 0,
    content: ks.content || '',
    source_type: ks.source_type,
    question: ks.question,
    answer: ks.answer
  }));
  
  const messageHighlights = currentMessage?.highlights || [];
  const confidence = currentMessage?.confidence;
  
  console.log('🔍 [SourcePanel] 接收到的溯源数据:', {
    hasCurrentMessage: !!currentMessage,
    messageId: currentMessage?.id,
    rawKnowledgeSources: rawKnowledgeSources.length,
    convertedSources: messageSources.length,
    oldSources: currentMessage?.sources?.length || 0,
    highlights: messageHighlights.length,
    rawKnowledgeSourcesData: rawKnowledgeSources.slice(0, 2) // 显示前2个源的详情
  });
  
  // 如果有知识源数据，显示详细信息
  if (rawKnowledgeSources.length > 0) {
    console.log('✅ [SourcePanel] 知识源详细数据:', {
      firstSource: rawKnowledgeSources[0],
      sourceTypes: rawKnowledgeSources.map(s => s.source_type),
      scores: rawKnowledgeSources.map(s => s.score)
    });
  } else {
    console.log('❌ [SourcePanel] 没有知识源数据');
  }

  const handleSourceClick = (source: SourceData) => {
    onSourceClick?.(source);
  };

  const renderSourceItem = (source: any, index: number) => {
    const isQADataset = source.source_type === 'qa_dataset';
    
    // 相似度颜色和级别
    const getConfidenceColor = (confidence: number) => {
      if (confidence >= 0.8) return 'green';
      if (confidence >= 0.6) return 'orange';
      return 'red';
    };
    
    const getConfidenceLevel = (confidence: number) => {
      if (confidence >= 0.8) return '高匹配';
      if (confidence >= 0.6) return '中匹配';
      return '低匹配';
    };
    
    return (
      <Card 
        key={index}
        size="small" 
        className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4"
        style={{ 
          borderLeftColor: isQADataset ? '#fa8c16' : '#1890ff',
          backgroundColor: isQADataset ? '#fff7e6' : '#f6ffed'
        }}
        onClick={() => handleSourceClick(source)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-2">
              {isQADataset ? (
                <SearchOutlined className="text-orange-500 mr-2 flex-shrink-0" />
              ) : (
                <FileTextOutlined className="text-blue-500 mr-2 flex-shrink-0" />
              )}
              <Tag color={getConfidenceColor(source.confidence)} className="text-xs">
                {getConfidenceLevel(source.confidence)}
              </Tag>
              <Text className="text-xs text-gray-500 ml-2">
                相似度: {source.confidence}
              </Text>
              {isQADataset && (
                <Tag color="orange" size="small" className="ml-2">
                  中文
                </Tag>
              )}
              {!isQADataset && (
                <Tag color="blue" size="small" className="ml-2">
                  英文
                </Tag>
              )}
            </div>
            
            {isQADataset ? (
              <div className="space-y-2">
                <div>
                  <Text strong className="text-sm text-gray-800 block">
                    📝 问题: {source.question}
                  </Text>
                </div>
                <div className="bg-orange-50 p-2 rounded border-l-2 border-orange-200">
                  <Text className="text-xs text-gray-700 block">
                    💬 答案: {source.answer?.slice(0, 120)}{source.answer?.length > 120 ? '...' : ''}
                  </Text>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Text strong className="text-sm text-gray-800 block">
                  📄 [{index + 1}] {source.title}
                </Text>
                <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                  <Text className="text-xs text-gray-700 block">
                    📝 内容: {source.content?.slice(0, 120)}{source.content?.length > 120 ? '...' : ''}
                  </Text>
                </div>
                {source.metadata && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {source.metadata.journal && (
                      <Tag size="small" color="blue">{source.metadata.journal}</Tag>
                    )}
                    {source.metadata.year && (
                      <Tag size="small" color="cyan">{source.metadata.year}</Tag>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end ml-3">
            <div className="text-right mb-2">
              <Progress
                percent={Math.round(source.confidence * 100)}
                size="small"
                strokeColor={isQADataset ? '#fa8c16' : '#1890ff'}
                className="w-16"
              />
            </div>
            {source.url && source.url !== '#' && (
              <Button 
                type="text" 
                size="small" 
                icon={<ExportOutlined />}
                className="text-gray-400 hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(source.url, '_blank');
                }}
              />
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderHighlightItem = (highlight: HighlightData, index: number) => {
    const sourceRef = (typeof highlight.source === 'number') ? messageSources[highlight.source] : undefined;
    
    return (
      <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r mb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <HighlightOutlined className="text-yellow-600 mr-2" />
            <Text className="text-xs font-medium text-gray-700">
              引用片段 {index + 1}
            </Text>
          </div>
          {highlight.confidence && (
            <Tooltip title={`引用置信度: ${highlight.confidence}%`}>
              <Progress
                percent={highlight.confidence}
                size="small"
                strokeColor="#faad14"
                showInfo={false}
                className="w-16"
              />
            </Tooltip>
          )}
        </div>
        
        <Paragraph className="text-sm text-gray-800 mb-2 italic">
          "{highlight.text}"
        </Paragraph>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            来源: {sourceRef?.title?.slice(0, 30) || '未知来源'}...
          </div>
          <div>
            第 {highlight.page} 页
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gray-50 h-full flex flex-col ${className}`}>
      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 检索统计信息 */}
        {(() => {
          const documentCount = rawKnowledgeSources.filter(s => s.source_type !== 'qa_dataset').length;
          const qaCount = rawKnowledgeSources.filter(s => s.source_type === 'qa_dataset').length;
          const totalCount = rawKnowledgeSources.length;
          const avgScore = totalCount > 0 ? 
            rawKnowledgeSources.reduce((sum, s) => sum + (s.score || 0), 0) / totalCount : 0;
          
          return (
            <div className="mb-4 p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-2">
                <Text className="text-sm font-medium text-gray-800">检索结果统计</Text>
                <Tag color="blue" className="text-xs">
                  总计 {totalCount} 条
                </Tag>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-blue-50 rounded p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileTextOutlined className="text-blue-500 mr-1" />
                      <Text className="text-xs text-gray-600">文档库</Text>
                    </div>
                    <Text className="text-sm font-medium text-blue-600">{documentCount}</Text>
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <SearchOutlined className="text-orange-500 mr-1" />
                      <Text className="text-xs text-gray-600">QA数据</Text>
                    </div>
                    <Text className="text-sm font-medium text-orange-600">{qaCount}</Text>
                  </div>
                </div>
              </div>
              
              {totalCount > 0 && (
                <div className="flex items-center justify-between">
                  <Text className="text-xs text-gray-600">平均相似度</Text>
                  <div className="flex items-center">
                    <Progress
                      percent={Math.round(avgScore * 100)}
                      size="small"
                      strokeColor={avgScore > 0.8 ? '#52c41a' : avgScore > 0.6 ? '#faad14' : '#f5222d'}
                      className="w-16 mr-2"
                    />
                    <Text className="text-xs text-gray-500">{(avgScore * 100).toFixed(1)}%</Text>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        
        {/* 回答置信度 */}
        {confidence && (
          <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
            <div className="flex items-center justify-between">
              <Text className="text-sm text-green-700 font-medium">回答置信度</Text>
              <div className="flex items-center">
                <Progress
                  percent={confidence}
                  size="small"
                  strokeColor={confidence > 80 ? '#52c41a' : confidence > 60 ? '#faad14' : '#f5222d'}
                  className="w-20 mr-2"
                />
                <Text className="text-xs text-green-600">{confidence}%</Text>
              </div>
            </div>
          </div>
        )}
        {!currentMessage ? (
          <Empty 
            description="选择一条AI回复查看溯源信息" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="mt-8"
          />
        ) : messageSources.length === 0 && messageHighlights.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-blue-50 border border-dashed border-blue-300 rounded-lg p-6">
              <InfoCircleOutlined className="text-blue-400 text-2xl mb-3" />
              <Text className="text-blue-600 text-base block mb-2">
                暂无检索结果
              </Text>
              <Text className="text-blue-400 text-sm block">
                AI回复可能基于预训练知识生成，未使用知识库检索
              </Text>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 引用高亮 */}
            {messageHighlights.length > 0 && (
              <div>
                <div className="flex items-center mb-3">
                  <HighlightOutlined className="text-yellow-600 mr-2" />
                  <Text className="font-medium text-gray-800">
                    引用高亮 ({messageHighlights.length})
                  </Text>
                </div>
                
                <Collapse 
                  ghost
                  expandIconPosition="end"
                  className="bg-white rounded border"
                  defaultActiveKey={messageHighlights.length <= 3 ? messageHighlights.map((_, i) => i.toString()) : ['0']}
                >
                  {messageHighlights.map((highlight, index) => (
                    <Panel 
                      key={index}
                      header={
                        <div className="flex items-center">
                          <Text className="text-sm">
                            引用片段 {index + 1}
                          </Text>
                          {highlight.confidence && (
                            <Tag color="orange" className="ml-2 text-xs">
                              {highlight.confidence}%
                            </Tag>
                          )}
                        </div>
                      }
                    >
                      {renderHighlightItem(highlight, index)}
                    </Panel>
                  ))}
                </Collapse>
              </div>
            )}

            <Divider />

            {/* 按数据源类型分组显示 */}
            {(() => {
              // 分组数据
              const documentSources = messageSources.filter(s => s.source_type !== 'qa_dataset');
              const qaSources = messageSources.filter(s => s.source_type === 'qa_dataset');
              
              return (
                <div className="space-y-6">
                  {/* 文档检索结果 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FileTextOutlined className="text-blue-500 mr-2" />
                        <Text className="font-medium text-gray-800">
                          文档检索结果 ({documentSources.length})
                        </Text>
                        {documentSources.length > 0 && (
                          <Tag color="blue" className="ml-2 text-xs">
                            英文文档库
                          </Tag>
                        )}
                      </div>
                      {documentSources.length > 0 && (
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<SearchOutlined />}
                          className="text-gray-500 hover:text-blue-500"
                        >
                          查看全部
                        </Button>
                      )}
                    </div>
                    
                    {documentSources.length === 0 ? (
                      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <FileTextOutlined className="text-gray-400 text-lg mb-2" />
                        <Text className="text-gray-500 text-sm block">
                          未找到相关文档
                        </Text>
                        <Text className="text-gray-400 text-xs block mt-1">
                          可能是查询内容与文档库中的英文文档相关性较低
                        </Text>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documentSources.map((source, index) => renderSourceItem(source, index))}
                      </div>
                    )}
                  </div>

                  {/* QA数据集检索结果 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <SearchOutlined className="text-orange-500 mr-2" />
                        <Text className="font-medium text-gray-800">
                          QA数据集检索结果 ({qaSources.length})
                        </Text>
                        {qaSources.length > 0 && (
                          <Tag color="orange" className="ml-2 text-xs">
                            中文问答对
                          </Tag>
                        )}
                      </div>
                      {qaSources.length > 0 && (
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<SearchOutlined />}
                          className="text-gray-500 hover:text-orange-500"
                        >
                          查看全部
                        </Button>
                      )}
                    </div>
                    
                    {qaSources.length === 0 ? (
                      <div className="bg-orange-50 border border-dashed border-orange-300 rounded-lg p-4 text-center">
                        <SearchOutlined className="text-orange-400 text-lg mb-2" />
                        <Text className="text-orange-600 text-sm block">
                          未找到相关QA数据
                        </Text>
                        <Text className="text-orange-400 text-xs block mt-1">
                          可能是查询内容与QA数据集中的问答对相关性较低
                        </Text>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {qaSources.map((source, index) => renderSourceItem(source, index + documentSources.length))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 相关推荐 */}
            {allSources.length > messageSources.length && (
              <>
                <Divider />
                <div>
                  <div className="flex items-center mb-3">
                    <LinkOutlined className="text-green-500 mr-2" />
                    <Text className="font-medium text-gray-800">
                      相关文献推荐
                    </Text>
                  </div>
                  
                  <div className="space-y-2">
                    {allSources
                      .filter(source => !messageSources.some(ms => ms.title === source.title))
                      .slice(0, 3)
                      .map((source, index) => (
                        <Card 
                          key={index}
                          size="small" 
                          className="cursor-pointer hover:shadow-sm transition-shadow bg-gray-50"
                          onClick={() => handleSourceClick(source)}
                        >
                          <div className="flex items-center">
                            <FileTextOutlined className="text-gray-400 mr-2" />
                            <div className="flex-1 min-w-0">
                              <Text className="text-sm text-gray-700 block truncate">
                                {source.title}
                              </Text>
                              <Text className="text-xs text-gray-500">
                                {source.authors} · {source.year}
                              </Text>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex justify-between text-xs text-gray-500">
          <span>文献: {messageSources.length}篇</span>
          <span>引用: {messageHighlights.length}处</span>
        </div>
      </div>
    </div>
  );
}; 