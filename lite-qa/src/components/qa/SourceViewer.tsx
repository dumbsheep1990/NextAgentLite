/**
 * 溯源信息查看器 - 强交互设计替代侧栏
 */
import React, { useState } from 'react';
import { Card, Tag, Button, Tooltip, Drawer, Modal, Timeline, Avatar, Divider, Typography, Badge, Space, List, message as antdMessage } from 'antd';
import { 
  FileTextOutlined,
  CloseOutlined,
  ExpandOutlined,
  LinkOutlined,
  BookOutlined,
  CalendarOutlined,
  UserOutlined,
  AimOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  NodeIndexOutlined,
  PartitionOutlined
} from '@ant-design/icons';
import type { Message } from '../../types';
import { copyToClipboard } from '../../utils/clipboardUtils';

const { Text, Title, Paragraph } = Typography;

interface SourceViewerProps {
  message?: Message;
  sources?: any[];
  onClose?: () => void;
  viewMode?: 'floating' | 'modal' | 'drawer';
  mode?: 'embedded' | 'standalone';
  position?: { x: number; y: number };
  title?: string;
  showStats?: boolean;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  message,
  sources,
  onClose,
  viewMode = 'modal',
  mode = 'standalone',
  position,
  title = '溯源信息',
  showStats = false
}) => {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'knowledgeSources' | 'sources' | 'graphSources' | 'related'>('knowledgeSources');
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 检查是否有溯源数据 - 支持直接传入sources或从message获取
  const knowledgeSources = sources || message?.knowledgeSources || [];
  const hasKnowledgeSources = knowledgeSources.length > 0;
  const hasSources = message?.sources && message.sources.length > 0;
  const hasGraphSources = message?.graphSources && (
    message.graphSources.success || 
    message.graphSources.response || 
    (message.graphSources.sources && message.graphSources.sources.length > 0)
  );
  
  // 状态日志
  console.log('🔍 [SourceViewer] 渲染状态:', {
    hasMessage: !!message,
    messageId: message?.id,
    hasKnowledgeSources,
    knowledgeSourcesLength: message?.knowledgeSources?.length || 0,
    hasSources,
    sourcesLength: message?.sources?.length || 0,
    hasGraphSources,
    graphSourcesSuccess: message?.graphSources?.success,
    viewMode
  });
  
  if (!message || (!hasKnowledgeSources && !hasSources && !hasGraphSources)) {
    console.log('❌ [SourceViewer] 没有可显示的溯源数据，返回null');
    return null;
  }

  // 渲染溯源内容
  const renderSourceContent = () => (
    <div className="space-y-6">

      {/* 标签页切换 */}
      <div className="flex space-x-1 bg-gradient-to-r from-gray-100 to-gray-50 p-1.5 rounded-xl shadow-inner border border-gray-200">
        {[
          ...(hasKnowledgeSources ? [{ key: 'knowledgeSources', label: '知识库溯源', icon: <BookOutlined /> }] : []),
          ...(hasSources ? [{ key: 'sources', label: '参考文献', icon: <FileTextOutlined /> }] : []),
          ...(hasGraphSources ? [{ key: 'graphSources', label: '知识图谱', icon: <PartitionOutlined /> }] : []),
          { key: 'related', label: '相关推荐', icon: <LinkOutlined /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-lg shadow-blue-100 border border-blue-100'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white hover:shadow-sm bg-transparent'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 知识库溯源列表 */}
      {activeTab === 'knowledgeSources' && hasKnowledgeSources && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Title level={5} className="mb-0">知识库溯源</Title>
            </div>
            <div className="flex space-x-2">
              <Tooltip title="导出溯源数据">
                <Button size="small" icon={<DownloadOutlined />} />
              </Tooltip>
              <Tooltip title="分享溯源信息">
                <Button size="small" icon={<ShareAltOutlined />} />
              </Tooltip>
            </div>
          </div>

          {/* 统计信息：简化版检索结果统计 */}
          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            {message.knowledgeStats ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {message.knowledgeStats.total_sources}
                    </div>
                    <div className="text-xs text-gray-500">检索结果</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {message.knowledgeSources?.filter(s => s.adopted).length || 0}
                    </div>
                    <div className="text-xs text-gray-500">已采用</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  {Object.entries(message.knowledgeStats.source_types || {}).map(([type, count]) => (
                    <div key={type} className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${type === 'document' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      <span className="text-gray-600">
                        {type === 'document' ? '文档' : 'QA'}: {count as number}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm">暂无统计信息</div>
            )}
          </div>

          <List
            dataSource={message.knowledgeSources?.sort((a, b) => (b.score || 0) - (a.score || 0))}
            renderItem={(knowledgeSource, index) => {
              // 输出knowledge source的详细信息
              console.log(`🔍 [SourceViewer] 渲染第${index}个knowledge source:`, {
                ...knowledgeSource,
                hasAdopted: 'adopted' in knowledgeSource,
                adoptedValue: knowledgeSource.adopted
              });
              
              return (
                <List.Item
                  key={`${index}-${knowledgeSource.source_type}-${knowledgeSource.id || (knowledgeSource as any).qa_pair_id || (knowledgeSource as any).document_id || 'unknown'}-${JSON.stringify(knowledgeSource).slice(0,50).replace(/[^a-zA-Z0-9]/g, '')}`}
                className="border border-gray-200 rounded-xl mb-4 hover:shadow-xl hover:shadow-blue-100 transition-all duration-300 bg-white cursor-pointer transform hover:-translate-y-1 hover:border-blue-200"
                onClick={() => {
                  console.log('🖱️ [SourceViewer] 卡片被点击:', knowledgeSource);
                  console.log('🔍 [SourceViewer] 当前渲染的knowledgeSource详情:', {
                    source_type: knowledgeSource.source_type,
                    score: knowledgeSource.score,
                    title: knowledgeSource.title,
                    question: knowledgeSource.question,
                    hasContent: !!knowledgeSource.content,
                    hasAnswer: !!knowledgeSource.answer
                  });
                  setSelectedSource(knowledgeSource);
                  setDetailModalVisible(true);
                }}
              >
                <div className="w-full p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="mb-2">
                        <Text strong className="text-base">
                          {knowledgeSource.source_type === 'qa_dataset' ? 
                            `Q: ${knowledgeSource.question || 
                                  (knowledgeSource.content && knowledgeSource.content.match(/问题:\s*(.+?)(?:\n|$)/)?.[1]) || 
                                  knowledgeSource.title || 
                                  '问题'}` : 
                            knowledgeSource.title || '文档标题'
                          }
                        </Text>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Tag 
                          color={knowledgeSource.source_type === 'document' ? 'green' : 'blue'} 
                          className="text-xs"
                        >
                          {knowledgeSource.source_type === 'document' ? '文档' : 'QA问答'}
                        </Tag>
                        <Tag 
                          color={knowledgeSource.adopted ? 'orange' : 'default'}
                          className="text-xs"
                        >
                          排名 #{index + 1} (分数: {(knowledgeSource.score * 100).toFixed(1)}%)
                        </Tag>
                        {knowledgeSource.adopted && (
                          <Tag color="green" className="text-xs">
                            已采用
                          </Tag>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2 space-y-1">
                        {knowledgeSource.source && (
                          <div className="flex items-center space-x-1">
                            <LinkOutlined className="text-gray-400" />
                            <span>来源: {knowledgeSource.source}</span>
                          </div>
                        )}
                        {knowledgeSource.score && (
                          <div className="flex items-center space-x-2">
                            <AimOutlined className="text-orange-400" />
                            <span>相关度: {(knowledgeSource.score * 100).toFixed(1)}%</span>
                            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-300"
                                style={{ width: `${Math.min(knowledgeSource.score * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 内容预览 */}
                      <div className="mb-3">
                        {knowledgeSource.source_type === 'qa_dataset' ? (
                          <div className="space-y-2">
                            <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                              <div className="text-xs text-blue-600 font-medium mb-1">问题</div>
                              <Text className="text-sm text-gray-800">
                                {knowledgeSource.question || 
                                 (knowledgeSource.content && knowledgeSource.content.match(/问题:\s*(.+?)(?:\n|$)/)?.[1]) || 
                                 knowledgeSource.title || 
                                 '未找到问题内容'}
                              </Text>
                            </div>
                            <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                              <div className="text-xs text-green-600 font-medium mb-1">答案</div>
                              <Text className="text-sm text-gray-700">
                                {expandedSource === knowledgeSource.id 
                                  ? (knowledgeSource.answer || 
                                     (knowledgeSource.content && knowledgeSource.content.match(/答案:\s*(.+)/s)?.[1]) || 
                                     '未找到答案内容')
                                  : `${(knowledgeSource.answer || 
                                      (knowledgeSource.content && knowledgeSource.content.match(/答案:\s*(.+)/s)?.[1]) || 
                                      '未找到答案内容').slice(0, 150)}...`
                                }
                              </Text>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-blue-50 p-4 rounded border border-blue-100">
                            <div className="text-xs text-gray-600 font-medium mb-1">文档内容</div>
                            <Text className="text-sm text-gray-700">
                              {expandedSource === knowledgeSource.id 
                                ? (knowledgeSource.content || '暂无内容')
                                : `${(knowledgeSource.content || '暂无内容').slice(0, 150)}...`
                              }
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex space-x-3">
                      <Button 
                        size="small" 
                        type="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSource(
                            expandedSource === knowledgeSource.id ? null : knowledgeSource.id
                          );
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all duration-200"
                      >
                        {expandedSource === knowledgeSource.id ? '收起内容' : '展开内容'}
                      </Button>
                      <Button 
                        size="small" 
                        type="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSource(knowledgeSource);
                          setDetailModalVisible(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-all duration-200"
                      >
                        查看详情
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Tooltip title="标记为有用">
                        <Button 
                          size="small" 
                          icon={<CheckCircleOutlined />}
                          className="text-green-600 hover:text-green-800 hover:bg-green-50 border-green-200 hover:border-green-300 rounded-lg transition-all duration-200"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Tooltip>
                      <Tooltip title="复制内容">
                        <Button 
                          size="small" 
                          icon={<ShareAltOutlined />}
                          className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const text = knowledgeSource.content || knowledgeSource.answer || '';
                            const success = await copyToClipboard(text);
                            if (success) {
                              antdMessage.success('内容已复制到剪贴板');
                            } else {
                              antdMessage.error('复制失败，请手动复制');
                            }
                          }}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </List.Item>
              );
            }}
          />
        </div>
      )}

      {/* 参考文献列表 */}
      {activeTab === 'sources' && hasSources && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Title level={5} className="mb-0">参考文献</Title>
            </div>
            <div className="flex space-x-2">
              <Tooltip title="导出文献列表">
                <Button size="small" icon={<DownloadOutlined />} />
              </Tooltip>
              <Tooltip title="分享文献">
                <Button size="small" icon={<ShareAltOutlined />} />
              </Tooltip>
            </div>
          </div>

          <List
            dataSource={message.sources}
            renderItem={(source, index) => (
              <List.Item
                key={index}
                className="border border-gray-200 rounded-lg mb-3 p-4 hover:shadow-md transition-all duration-200 bg-white"
              >
                <div className="w-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar 
                          size="small" 
                          style={{ backgroundColor: '#1890ff' }}
                          icon={<FileTextOutlined />}
                        />
                        <Text strong className="text-base">{source.title}</Text>
                        <Tag color="blue" className="text-xs">#{index + 1}</Tag>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2 space-y-1">
                        {(source as any).author && (
                          <div className="flex items-center space-x-1">
                            <UserOutlined className="text-gray-400" />
                            <span>{(source as any).author}</span>
                          </div>
                        )}
                        {(source as any).publishDate && (
                          <div className="flex items-center space-x-1">
                            <CalendarOutlined className="text-gray-400" />
                            <span>{(source as any).publishDate}</span>
                          </div>
                        )}
                        {(source as any).confidence && (
                          <div className="flex items-center space-x-2">
                            <AimOutlined className="text-orange-400" />
                            <span>相关度: {(source as any).confidence}%</span>
                            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-400 to-red-400 transition-all duration-300"
                                style={{ width: `${(source as any).confidence || 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 摘要预览 */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <Text className="text-sm text-gray-700">
                          {expandedSource === (source as any).id 
                            ? source.content 
                            : `${source.content?.slice(0, 200)}...`
                          }
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button 
                        size="small" 
                        type="link"
                        onClick={() => setExpandedSource(
                          expandedSource === (source as any).id ? null : (source as any).id
                        )}
                        className="text-blue-600 hover:text-blue-800 p-0"
                      >
                        {expandedSource === (source as any).id ? '收起' : '展开'}
                      </Button>
                      {(source as any).url && (
                        <Button 
                          size="small" 
                          type="link"
                          icon={<LinkOutlined />}
                          href={(source as any).url}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-800 p-0"
                        >
                          查看原文
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Tooltip title="标记为有用">
                        <Button 
                          size="small" 
                          icon={<CheckCircleOutlined />}
                          className="text-green-600 hover:text-green-800 border-green-200 hover:border-green-300"
                        />
                      </Tooltip>
                      <Tooltip title="查看详情">
                        <Button 
                          size="small" 
                          icon={<EyeOutlined />}
                          className="text-gray-600 hover:text-gray-800"
                        />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* 知识图谱溯源列表 */}
      {activeTab === 'graphSources' && (hasGraphSources || message?.graphSources) && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Title level={5} className="mb-0">知识图谱检索结果</Title>
            </div>
            <div className="flex space-x-2">
              <Tooltip title="导出图谱数据">
                <Button size="small" icon={<DownloadOutlined />} />
              </Tooltip>
              <Tooltip title="分享图谱信息">
                <Button size="small" icon={<ShareAltOutlined />} />
              </Tooltip>
            </div>
          </div>

          {/* 知识图谱统计信息 */}
          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {message.graphSources?.entities?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">实体</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {message.graphSources?.relationships?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">关系</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {message.graphSources?.sources?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">来源</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">模式: {message.graphSources?.mode || 'mix'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">查询时间: {message.graphSources?.query_time?.toFixed(2) || 0}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* 图谱响应内容 */}
          {message.graphSources?.response && (
            <div className="mb-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 font-medium mb-2">图谱分析结果</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {expandedSource === 'graph_response' 
                    ? message.graphSources.response 
                    : `${message.graphSources.response.slice(0, 300)}...`
                  }
                </div>
                <Button 
                  size="small" 
                  type="text"
                  onClick={() => setExpandedSource(
                    expandedSource === 'graph_response' ? null : 'graph_response'
                  )}
                  className="text-blue-600 hover:text-blue-800 mt-2 p-0"
                >
                  {expandedSource === 'graph_response' ? '收起内容' : '展开内容'}
                </Button>
              </div>
            </div>
          )}

          {/* 实体列表 */}
          {message.graphSources?.entities && message.graphSources.entities.length > 0 && (
            <div className="mb-4">
              <Title level={5} className="text-blue-600 mb-3">识别实体</Title>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {message.graphSources.entities.slice(0, expandedSource === 'entities' ? undefined : 6).map((entity, index) => (
                  <Card key={entity.id || index} size="small" className="border-blue-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <NodeIndexOutlined className="text-blue-500" />
                          <Text strong className="text-sm">{entity.name}</Text>
                          <Tag color="blue" size="small">{entity.type}</Tag>
                        </div>
                        {entity.description && (
                          <Text className="text-xs text-gray-600">{entity.description}</Text>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {message.graphSources.entities.length > 6 && (
                <Button 
                  size="small" 
                  type="text"
                  onClick={() => setExpandedSource(
                    expandedSource === 'entities' ? null : 'entities'
                  )}
                  className="text-blue-600 hover:text-blue-800 mt-3"
                >
                  {expandedSource === 'entities' ? '收起实体' : `显示全部 ${message.graphSources.entities.length} 个实体`}
                </Button>
              )}
            </div>
          )}

          {/* 关系列表 */}
          {message.graphSources?.relationships && message.graphSources.relationships.length > 0 && (
            <div className="mb-4">
              <Title level={5} className="text-orange-600 mb-3">关系网络</Title>
              <div className="space-y-2">
                {message.graphSources.relationships.slice(0, expandedSource === 'relationships' ? undefined : 5).map((rel, index) => (
                  <div key={rel.id || index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-800">{rel.source}</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-0.5 bg-orange-400"></div>
                        <Tag color="orange" size="small" className="text-xs">{rel.type}</Tag>
                        <div className="w-4 h-0.5 bg-orange-400"></div>
                        <span className="text-xs">→</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">{rel.target}</span>
                    </div>
                  </div>
                ))}
              </div>
              {message.graphSources.relationships.length > 5 && (
                <Button 
                  size="small" 
                  type="text"
                  onClick={() => setExpandedSource(
                    expandedSource === 'relationships' ? null : 'relationships'
                  )}
                  className="text-orange-600 hover:text-orange-800 mt-3"
                >
                  {expandedSource === 'relationships' ? '收起关系' : `显示全部 ${message.graphSources.relationships.length} 个关系`}
                </Button>
              )}
            </div>
          )}

          {/* 图谱来源列表 */}
          {message.graphSources?.sources && message.graphSources.sources.length > 0 && (
            <div>
              <Title level={5} className="text-green-600 mb-3">图谱来源</Title>
              <List
                dataSource={message.graphSources.sources}
                renderItem={(source, index) => (
                  <List.Item
                    key={index}
                    className="border border-green-200 rounded-lg mb-3 p-3 hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <div className="w-full">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge count={`#${index + 1}`} style={{ backgroundColor: '#52c41a' }} />
                          <Text strong className="text-sm">{source.source || '图谱来源'}</Text>
                          {source.score && (
                            <Tag color="green" size="small">
                              相关度: {(source.score * 100).toFixed(1)}%
                            </Tag>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-3">
                        <Text className="text-sm text-gray-700">
                          {expandedSource === `graph_source_${index}` 
                            ? source.content 
                            : `${source.content?.slice(0, 150)}...`
                          }
                        </Text>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <Button 
                          size="small" 
                          type="text"
                          onClick={() => setExpandedSource(
                            expandedSource === `graph_source_${index}` ? null : `graph_source_${index}`
                          )}
                          className="text-green-600 hover:text-green-800"
                        >
                          {expandedSource === `graph_source_${index}` ? '收起内容' : '展开内容'}
                        </Button>
                        
                        <Tooltip title="复制内容">
                          <Button 
                            size="small" 
                            icon={<ShareAltOutlined />}
                            className="text-gray-600 hover:text-gray-800"
                            onClick={async () => {
                              const success = await copyToClipboard(source.content || '');
                              if (success) {
                                antdMessage.success('内容已复制到剪贴板');
                              } else {
                                antdMessage.error('复制失败，请手动复制');
                              }
                            }}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* 引用关系 */}
      {activeTab === 'references' && (
        <div className="space-y-4">
          <Title level={5}>引用关系图</Title>
          <Timeline
            items={message.sources.map((source, index) => ({
              dot: <Avatar size="small" icon={<FileTextOutlined />} />,
              children: (
                <div>
                  <Text strong>{source.title}</Text>
                  <div className="text-sm text-gray-500 mt-1">
                    被引用 {Math.floor(Math.random() * 50 + 10)} 次
                  </div>
                </div>
              )
            }))}
          />
        </div>
      )}

      {/* 相关材料 */}
      {activeTab === 'related' && (
        <div className="space-y-4">
          <Title level={5}>相关材料推荐</Title>
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map(i => (
              <Card 
                key={i}
                size="small" 
                className="hover:shadow-md transition-shadow cursor-pointer"
                bodyStyle={{ padding: '12px' }}
              >
                <div className="flex items-center space-x-3">
                  <Avatar icon={<BookOutlined />} size="small" />
                  <div className="flex-1">
                    <Text className="text-sm font-medium">相关研究 {i}</Text>
                    <div className="text-xs text-gray-500">相似度: 85%</div>
                  </div>
                  <Button size="small" type="link">查看</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // 渲染详情弹窗
  const renderDetailModal = () => (
    <Modal
      title={
        <div className="flex items-center space-x-3">
          <div>
            <div className="font-semibold text-base">
              {selectedSource?.title || selectedSource?.question || '知识条目详情'}
            </div>
            <div className="text-sm text-gray-500 font-normal">
              {selectedSource?.source_type === 'document' ? '文档内容' : 'QA问答'}
            </div>
          </div>
        </div>
      }
      open={detailModalVisible}
      onCancel={() => {
        setDetailModalVisible(false);
        setSelectedSource(null);
      }}
      footer={[
        <Button 
          key="copy" 
          type="primary"
          icon={<ShareAltOutlined />}
          onClick={async () => {
            const text = selectedSource?.content || selectedSource?.answer || '';
            const success = await copyToClipboard(text);
            if (success) {
              antdMessage.success('内容已复制到剪贴板');
            } else {
              antdMessage.error('复制失败，请手动复制');
            }
          }}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 border-none"
        >
          复制内容
        </Button>,
        <Button 
          key="close" 
          onClick={() => {
            setDetailModalVisible(false);
            setSelectedSource(null);
          }}
          className="border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800"
        >
          关闭
        </Button>
      ]}
      width={700}
      className="source-detail-modal"
    >
      {selectedSource && (
        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">来源类型:</span>
                <Tag color={selectedSource.source_type === 'document' ? 'green' : 'blue'} className="ml-2">
                  {selectedSource.source_type === 'document' ? '文档' : 'QA问答'}
                </Tag>
              </div>
              <div>
                <span className="text-gray-500">相关度:</span>
                <span className="ml-2 font-medium">
                  {selectedSource.score ? `${(selectedSource.score * 100).toFixed(1)}%` : '未知'}
                </span>
              </div>
              {selectedSource.source && (
                <div>
                  <span className="text-gray-500">数据源:</span>
                  <span className="ml-2">{selectedSource.source}</span>
                </div>
              )}
              {selectedSource.id && (
                <div>
                  <span className="text-gray-500">ID:</span>
                  <span className="ml-2 font-mono text-xs">{selectedSource.id}</span>
                </div>
              )}
            </div>
          </div>

          {/* 问题(如果是QA类型) */}
          {selectedSource.source_type === 'qa_dataset' && selectedSource.question && (
            <div>
              <Title level={5} className="text-blue-600 mb-2">问题</Title>
              <div className="bg-blue-50 rounded-lg p-3">
                <Text className="text-gray-800">{selectedSource.question}</Text>
              </div>
            </div>
          )}

          {/* 标题(如果是文档类型) */}
          {selectedSource.source_type === 'document' && selectedSource.title && (
            <div>
              <Title level={5} className="text-green-600 mb-2">文档标题</Title>
              <div className="bg-green-50 rounded-lg p-3">
                <Text className="text-gray-800 font-medium">{selectedSource.title}</Text>
              </div>
            </div>
          )}

          {/* 完整内容 */}
          <div>
            <Title level={5} className="text-gray-700 mb-2">
              {selectedSource.source_type === 'qa_dataset' ? '答案内容' : '文档内容'}
            </Title>
            <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto">
              <Paragraph className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {selectedSource.content || selectedSource.answer || '暂无内容'}
              </Paragraph>
            </div>
          </div>

          {/* 高亮词汇(如果有) */}
          {selectedSource.highlights && selectedSource.highlights.length > 0 && (
            <div>
              <Title level={5} className="text-orange-600 mb-2">关键词高亮</Title>
              <div className="flex flex-wrap gap-2">
                {selectedSource.highlights.map((highlight: string, index: number) => (
                  <Tag key={index} color="orange" className="text-xs">
                    {highlight}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {/* 元数据(如果有) */}
          {selectedSource.metadata && Object.keys(selectedSource.metadata).length > 0 && (
            <div>
              <Title level={5} className="text-gray-600 mb-2">元数据</Title>
              <div className="bg-gray-50 rounded-lg p-3">
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(selectedSource.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );

  // 浮动卡片模式
  if (viewMode === 'floating' && position) {
    return (
      <div
        className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-96"
        style={{
          left: Math.min(position.x, window.innerWidth - 400),
          top: Math.min(position.y, window.innerHeight - 600),
          maxHeight: '500px'
        }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg flex items-center justify-center">
              <FileTextOutlined className="text-blue-600" />
            </div>
            <Title level={5} className="mb-0">溯源信息</Title>
          </div>
          <div className="flex space-x-1">
            <Tooltip title="放大到弹窗">
              <Button 
                size="small" 
                icon={<ExpandOutlined />}
                onClick={() => {/* 切换到modal模式 */}}
              />
            </Tooltip>
            <Tooltip title="关闭">
              <Button 
                size="small" 
                icon={<CloseOutlined />}
                onClick={onClose}
              />
            </Tooltip>
          </div>
        </div>
        
        {/* 内容 */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {renderSourceContent()}
        </div>
        {renderDetailModal()}
      </div>
    );
  }

  // 弹窗模式
  if (viewMode === 'modal') {
    return (
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg flex items-center justify-center">
              <FileTextOutlined className="text-blue-600" />
            </div>
            <span>溯源信息详情</span>
          </div>
        }
        open={true}
        onCancel={onClose}
        footer={null}
        width={800}
        className="source-viewer-modal"
      >
        {renderSourceContent()}
        {renderDetailModal()}
      </Modal>
    );
  }

  // 抽屉模式
  if (viewMode === 'drawer') {
    return (
      <Drawer
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                <FileTextOutlined className="text-blue-600 text-lg" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">知识溯源</div>
                <div className="text-xs text-gray-500">
                  {hasKnowledgeSources ? `${message.knowledgeSources?.length || 0} 条知识库记录` : '查看引用来源'}
                </div>
              </div>
            </div>
          </div>
        }
        placement="right"
        onClose={onClose}
        open={true}
        width={520}
        className="source-viewer-drawer"
        styles={{
          header: {
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderBottom: '1px solid #e2e8f0',
            padding: '16px 24px'
          },
          body: {
            background: '#fafbfc',
            padding: '0'
          }
        }}
      >
        <div className="p-6">
          {renderSourceContent()}
        </div>
        {renderDetailModal()}
      </Drawer>
    );
  }

  // 嵌入模式 - 用于Team溯源面板
  if (mode === 'embedded') {
    return (
      <div className="source-viewer-embedded">
        {/* 知识源列表 */}
        {hasKnowledgeSources && (
          <div className="space-y-3">
            {knowledgeSources.map((source: any, index: number) => (
              <Card key={source.id || index} size="small" className="source-item">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 文档信息 */}
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge 
                        count={`#${index + 1}`} 
                        style={{ backgroundColor: '#1890ff' }} 
                      />
                      <Text strong className="text-sm">{source.title || source.source_title || '未知文档'}</Text>
                      <Tag 
                        color={source.source_type === 'document' ? 'blue' : 'green'} 
                        size="small"
                      >
                        {source.source_type === 'document' ? '论文' : 'QA'}
                      </Tag>
                      <Tag color="orange" size="small">
                        相关度: {((source.score || 0) * 100).toFixed(1)}%
                      </Tag>
                    </div>

                    {/* 文档摘要 */}
                    <div className="bg-gray-50 rounded p-2 mb-2">
                      <Text className="text-xs text-gray-600">
                        {source.content?.slice(0, 150)}...
                      </Text>
                    </div>

                    {/* 元数据 */}
                    {(source.authors || source.publication_date) && (
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        {source.authors && (
                          <span>
                            <UserOutlined className="mr-1" />
                            {source.authors}
                          </span>
                        )}
                        {source.publication_date && (
                          <span>
                            <CalendarOutlined className="mr-1" />
                            {source.publication_date}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col space-y-1">
                    <Button 
                      size="small" 
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setSelectedSource(source);
                        setDetailModalVisible(true);
                      }}
                    >
                      详情
                    </Button>
                    {source.url && (
                      <Button 
                        size="small" 
                        type="text"
                        icon={<LinkOutlined />}
                        href={source.url}
                        target="_blank"
                      >
                        原文
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 详情弹窗 */}
        {renderDetailModal()}
      </div>
    );
  }

  return null;
};