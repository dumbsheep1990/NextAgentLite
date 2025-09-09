import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, DocumentTextIcon, TagIcon, ClockIcon, EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

// 添加CSS类支持
const styles = `
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-4 {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

interface DocumentSource {
  type: string;
  answer?: string;
  category?: string;
  question?: string;
  dataset_id?: string;
  qa_pair_id?: string;
}

interface Document {
  score: number;
  title: string;
  source: DocumentSource;
  content: string;
  language?: string;
  metadata?: {
    type: string;
  };
  source_type: string;
}

interface DocumentRetrievalResultProps {
  documents: Document[];
  agentName?: string;
  totalCount?: number;
  searchSummary?: string;
}

const DocumentRetrievalResult: React.FC<DocumentRetrievalResultProps> = ({
  documents,
  agentName = '知识检索',
  totalCount,
  searchSummary
}) => {
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDocForModal, setSelectedDocForModal] = useState<(Document & { documentType: string }) | null>(null);
  const itemsPerPage = 5;

  // 按文档类型分组
  const groupedDocuments = React.useMemo(() => {
    const groups = documents.reduce((acc, doc) => {
      const type = doc.source?.type || doc.source_type || 'unknown';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);

    return groups;
  }, [documents]);

  // 分页计算
  const paginatedDocuments = React.useMemo(() => {
    const allDocs = Object.entries(groupedDocuments).reduce((acc, [type, docs]) => {
      return acc.concat(docs.map(doc => ({ ...doc, documentType: type })));
    }, [] as Array<Document & { documentType: string }>);
    
    const totalPages = Math.ceil(allDocs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDocs = allDocs.slice(startIndex, endIndex);
    
    return {
      docs: currentDocs,
      totalPages,
      totalDocs: allDocs.length
    };
  }, [groupedDocuments, currentPage, itemsPerPage]);

  // 获取文档类型的显示名称
  const getTypeDisplayName = (type: string) => {
    const typeMapping: Record<string, string> = {
      'qa_dataset': 'Q&A数据集',
      'paper': '学术论文',
      'knowledge_base': '知识库',
      'manual': '手册文档',
      'unknown': '其他文档'
    };
    return typeMapping[type] || type;
  };

  // 获取文档类型的颜色 - 使用温暖的色调，避免蓝紫色
  const getTypeColor = (type: string) => {
    const colorMapping: Record<string, string> = {
      'qa_dataset': 'bg-amber-50 text-amber-800',
      'paper': 'bg-emerald-50 text-emerald-800',
      'knowledge_base': 'bg-orange-50 text-orange-800',
      'manual': 'bg-rose-50 text-rose-800',
      'unknown': 'bg-gray-50 text-gray-800'
    };
    return colorMapping[type] || colorMapping['unknown'];
  };

  // 切换文档展开状态
  const toggleDocExpansion = (docId: string) => {
    setExpandedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  // 切换答案展开状态
  const toggleAnswerExpansion = (docId: string) => {
    setExpandedAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  // 获取文档唯一标识
  const getDocumentId = (doc: Document, index: number) => {
    return doc.source?.qa_pair_id || doc.source?.dataset_id || `doc-${index}`;
  };

  // 截断文本
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 解析Q&A文档内容
  const parseQAContent = (content: string) => {
    const questionMatch = content.match(/问题[:：]\s*(.+?)(?=\n答案|$)/s);
    const answerMatch = content.match(/答案[:：]\s*(.+)$/s);
    
    return {
      question: questionMatch?.[1]?.trim() || '',
      answer: answerMatch?.[1]?.trim() || content
    };
  };

  // 添加样式到页面
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);


  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
              <DocumentTextIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {agentName}检索结果
              </h3>
              <p className="text-sm text-gray-600">
                显示 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, paginatedDocuments.totalDocs)} / 共 {paginatedDocuments.totalDocs} 个文档
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1 px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors bg-transparent border-0"
              style={{ backgroundColor: 'transparent', border: 'none' }}
            >
              {isCollapsed ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
              {isCollapsed ? '展开' : '收起'}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
              className="px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors bg-transparent border-0"
              style={{ backgroundColor: 'transparent', border: 'none' }}
            >
              {viewMode === 'compact' ? '详细视图' : '紧凑视图'}
            </button>
          </div>
        </div>
        
        {searchSummary && (
          <div className="text-sm text-gray-700 bg-white/80 rounded-lg p-3">
            <ClockIcon className="w-4 h-4 inline mr-2 text-gray-500" />
            {searchSummary}
          </div>
        )}
      </div>

      {/* 文档内容 - 支持整体折叠 */}
      {!isCollapsed && (
        <div className="space-y-6">
          {/* 文档列表 - 分页显示 */}
          <div className="space-y-4">
            {paginatedDocuments.docs.map((doc, index) => {
              const docId = getDocumentId(doc, index);
              const isExpanded = expandedDocs.has(docId);
              const parsedContent = doc.documentType === 'qa_dataset' ? parseQAContent(doc.content) : null;
              const isAnswerExpanded = expandedAnswers.has(docId);

              return (
                <div key={docId} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-gray-300 ${
                  viewMode === 'compact' ? 'p-4' : 'p-6'
                }`}>
                  <div className={viewMode === 'compact' ? 'space-y-2' : 'space-y-4'}>
                    {/* 文档信息标签 - 顶部显示所有关键信息 */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(doc.documentType)}`}>
                        {getTypeDisplayName(doc.documentType)}
                      </span>
                      {doc.source?.dataset_id && (
                        <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded-full">
                          数据集: {doc.source.dataset_id.substring(0, 8)}...
                        </span>
                      )}
                      {doc.source?.qa_pair_id && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          QA: {doc.source.qa_pair_id.substring(0, 8)}...
                        </span>
                      )}
                      {doc.score && (
                        <span className={`bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium ${
                          viewMode === 'compact' ? 'text-xs' : 'text-xs'
                        }`}>
                          {viewMode === 'compact' ? `${(doc.score * 100).toFixed(0)}%` : `匹配度 ${(doc.score * 100).toFixed(0)}%`}
                        </span>
                      )}
                      {doc.source?.category && (
                        <span className={`px-2 py-1 bg-amber-100 text-amber-700 rounded-full ${
                          viewMode === 'compact' ? 'text-xs' : 'text-xs'
                        }`}>
                          {doc.source.category}
                        </span>
                      )}
                      {doc.language && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {doc.language}
                        </span>
                      )}
                    </div>

                    {/* 文档标题和操作 */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-gray-900 leading-relaxed ${
                          viewMode === 'compact' ? 'text-sm' : 'text-base'
                        }`}>
                          {viewMode === 'compact' ? 
                            truncateText(doc.title, 80) : 
                            doc.title
                          }
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* 查看完整内容按钮 */}
                        <button
                          onClick={() => setSelectedDocForModal(doc)}
                          className="px-3 py-1 text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors bg-transparent border-0"
                          style={{ backgroundColor: '#fed7aa', border: 'none' }}
                        >
                          查看详情
                        </button>
                        {/* 详细模式才显示展开按钮 */}
                        {viewMode === 'detailed' && (
                          <button
                            onClick={() => toggleDocExpansion(docId)}
                            className="p-2 hover:bg-amber-50 rounded-lg transition-colors flex-shrink-0 bg-transparent border-0"
                            style={{ backgroundColor: 'transparent', border: 'none' }}
                            aria-label={isExpanded ? '收起' : '展开'}
                          >
                            {isExpanded ? (
                              <ChevronUpIcon className="w-5 h-5 text-amber-600 hover:text-amber-700" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5 text-amber-600 hover:text-amber-700" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 详细视图 - QA数据特殊处理 */}
                    {viewMode === 'detailed' && doc.documentType === 'qa_dataset' && parsedContent && (
                          <div className="space-y-4">
                            {/* 问题 */}
                            <div>
                              <div className="text-sm font-medium text-amber-700 mb-2">问题</div>
                              <div className="bg-amber-50 rounded-lg p-4 text-sm text-gray-800 leading-relaxed">
                                {isExpanded ? parsedContent.question : truncateText(parsedContent.question, 150)}
                              </div>
                            </div>

                            {/* 答案 */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-emerald-700">答案</div>
                                {parsedContent.answer.length > 200 && (
                                  <button
                                    onClick={() => toggleAnswerExpansion(docId)}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:bg-emerald-50 px-2 py-1 rounded transition-colors bg-transparent border-0"
                                    style={{ backgroundColor: 'transparent', border: 'none' }}
                                  >
                                    {isAnswerExpanded ? '收起' : '展开完整答案'}
                                    {isAnswerExpanded ? 
                                      <ChevronUpIcon className="w-3 h-3" /> : 
                                      <ChevronDownIcon className="w-3 h-3" />
                                    }
                                  </button>
                                )}
                              </div>
                              <div className="bg-emerald-50 rounded-lg p-4">
                                <div className={`text-sm text-gray-800 leading-relaxed ${
                                  !isAnswerExpanded && parsedContent.answer.length > 200 
                                    ? 'line-clamp-4' 
                                    : ''
                                }`}>
                                  {isAnswerExpanded || parsedContent.answer.length <= 200
                                    ? parsedContent.answer 
                                    : truncateText(parsedContent.answer, 200)
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                    {/* 紧凑视图 - QA数据列表样式 */}
                    {viewMode === 'compact' && doc.documentType === 'qa_dataset' && parsedContent && (
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="text-xs text-amber-600 font-medium flex-shrink-0 mt-0.5">Q:</div>
                              <div className="text-sm text-gray-800 leading-relaxed line-clamp-2">
                                {parsedContent.question}
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="text-xs text-emerald-600 font-medium flex-shrink-0 mt-0.5">A:</div>
                              <div className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                                {parsedContent.answer}
                              </div>
                            </div>
                          </div>
                        )}

                    {/* 详细视图 - 非QA数据的内容展示 */}
                    {viewMode === 'detailed' && doc.documentType !== 'qa_dataset' && !isExpanded && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                              {doc.content}
                            </div>
                          </div>
                        )}

                    {viewMode === 'detailed' && doc.documentType !== 'qa_dataset' && isExpanded && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {doc.content}
                            </div>
                          </div>
                        )}

                    {/* 紧凑视图 - 非QA数据的内容展示 */}
                    {viewMode === 'compact' && doc.documentType !== 'qa_dataset' && (
                          <div className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                            {doc.content}
                          </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>

          {/* 分页导航 */}
          {paginatedDocuments.totalPages > 1 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200"
                >
                  上一页
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: paginatedDocuments.totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 text-sm rounded-lg transition-colors border ${
                        currentPage === pageNum
                          ? 'bg-orange-100 text-orange-700 font-bold border-orange-200'
                          : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginatedDocuments.totalPages))}
                  disabled={currentPage === paginatedDocuments.totalPages}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200"
                >
                  下一页
                </button>
              </div>
              
              <div className="text-xs text-center text-gray-500 mt-3">
                第 {currentPage} 页 / 共 {paginatedDocuments.totalPages} 页 · 共 {paginatedDocuments.totalDocs} 个文档
              </div>
            </div>
          )}
        </div>
      )}

      {/* 汇总信息 */}
      {totalCount && totalCount > paginatedDocuments.totalDocs && !isCollapsed && (
        <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-xl">
          显示了 {paginatedDocuments.totalDocs} 个文档，共 {totalCount} 个相关文档
        </div>
      )}

      {/* Modal弹框 - 显示完整QA数据 */}
      {selectedDocForModal && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSelectedDocForModal(null)}
          />
          
          {/* Modal内容 */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden">
            {/* Modal头部 */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-8 py-6 border-b border-gray-200">
              <div className="flex justify-between gap-6">
                <div className="flex-1 min-w-0 space-y-4">
                  {/* 完整标签区域 - 包含所有文档信息 */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap ${getTypeColor(selectedDocForModal.documentType)}`}>
                      {getTypeDisplayName(selectedDocForModal.documentType)}
                    </span>
                    {selectedDocForModal.source?.dataset_id && (
                      <span className="px-4 py-2 bg-rose-100 text-rose-800 text-sm font-medium rounded-xl whitespace-nowrap">
                        数据集ID: {selectedDocForModal.source.dataset_id}
                      </span>
                    )}
                    {selectedDocForModal.source?.qa_pair_id && (
                      <span className="px-4 py-2 bg-orange-100 text-orange-800 text-sm font-medium rounded-xl whitespace-nowrap">
                        QA ID: {selectedDocForModal.source.qa_pair_id}
                      </span>
                    )}
                    {selectedDocForModal.score && (
                      <span className="px-4 py-2 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-xl whitespace-nowrap">
                        匹配度: {(selectedDocForModal.score * 100).toFixed(1)}%
                      </span>
                    )}
                    {selectedDocForModal.source?.category && (
                      <span className="px-4 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-xl whitespace-nowrap">
                        {selectedDocForModal.source.category}
                      </span>
                    )}
                    {selectedDocForModal.language && (
                      <span className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl whitespace-nowrap">
                        {selectedDocForModal.language}
                      </span>
                    )}
                  </div>
                  
                  {/* 标题区域 */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight break-words">
                      {selectedDocForModal.title}
                    </h3>
                  </div>
                </div>
                
                {/* 关闭按钮 - 固定在右上角 */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setSelectedDocForModal(null)}
                    className="p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all bg-transparent border-0"
                    style={{ backgroundColor: 'transparent', border: 'none' }}
                  >
                    <XMarkIcon className="w-7 h-7 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Modal内容区域 */}
            <div className="px-8 py-6 overflow-y-auto max-h-[calc(92vh-200px)]">
              {(() => {
                const parsedContent = selectedDocForModal.documentType === 'qa_dataset' ? 
                  parseQAContent(selectedDocForModal.content) : null;
                
                if (parsedContent) {
                  return (
                    <div className="space-y-8">
                      {/* 问题 */}
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                          <h4 className="text-xl font-bold text-amber-800">问题</h4>
                        </div>
                        <div className="bg-amber-50 rounded-2xl p-8 border border-amber-100">
                          <div className="text-gray-800 text-lg leading-relaxed font-medium">
                            {parsedContent.question}
                          </div>
                        </div>
                      </div>
                      
                      {/* 答案 */}
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                          <h4 className="text-xl font-bold text-emerald-800">答案</h4>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-100">
                          <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                            {parsedContent.answer}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                      <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                        {selectedDocForModal.content}
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DocumentRetrievalResult;