/**
 * 检索测试页面 - 从知识库页面拆分出的独立子页面
 */
import React from 'react';
import { Card } from 'antd';
import { 
  ExperimentOutlined
} from '@ant-design/icons';
import { RetrievalTest } from '../../components/knowledge';
import { useKnowledgeStore } from '../../stores/knowledgeStore';

const RetrievalTestPage: React.FC = () => {
  const {
    retrievalQuery,
    retrievalResults,
    retrievalLoading,
    setRetrievalQuery,
    testRetrieval
  } = useKnowledgeStore();

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        padding: '0',
        backgroundColor: '#fafafa',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 主要内容区域 */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Card 
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          bodyStyle={{
            padding: '24px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ flex: 1, overflow: 'hidden', height: '100%' }}>
            <RetrievalTest
              query={retrievalQuery}
              results={retrievalResults}
              loading={retrievalLoading}
              onQueryChange={setRetrievalQuery}
              onTest={(query, params) => testRetrieval(query, params)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RetrievalTestPage;