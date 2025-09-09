/**
 * 向量化管理页面
 */
import React from 'react';
import { Card, Tabs, Row, Col } from 'antd';
import { DatabaseOutlined, BarChartOutlined, SettingOutlined } from '@ant-design/icons';
import { AtlasVisualization } from '../../components/embedding/AtlasVisualization';

const { TabPane } = Tabs;

const VectorizationPage: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <Tabs defaultActiveKey="atlas" size="large">
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                向量可视化
              </span>
            }
            key="atlas"
          >
            <AtlasVisualization />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <DatabaseOutlined />
                向量管理
              </span>
            }
            key="management"
          >
            <Card>
              <div className="text-center py-8 text-gray-500">
                向量管理功能开发中...
              </div>
            </Card>
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                配置设置
              </span>
            }
            key="settings"
          >
            <Card>
              <div className="text-center py-8 text-gray-500">
                配置设置功能开发中...
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default VectorizationPage;