/**
 * 多模态聊天输入组件测试页面
 */
import React from 'react';
import { Layout, Typography, Card } from 'antd';
import { MultimodalInputDemo } from '../../components/ui/multimodal-input-demo';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

export default function MultimodalInputTest() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2}>多模态AI聊天输入组件测试</Title>
          <Paragraph>
            这是一个现代化的多模态聊天输入组件，支持文本输入、文件附件、语音输入等功能。
          </Paragraph>
          
          <Card title="组件演示" style={{ marginTop: 24 }}>
            <div style={{ 
              height: '600px', 
              display: 'flex', 
              flexDirection: 'column',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {/* 模拟聊天区域 */}
              <div style={{ 
                flex: 1, 
                padding: '16px', 
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p>聊天消息将显示在这里</p>
                  <p style={{ fontSize: '12px', color: '#999' }}>
                    在下方输入框中输入消息并发送，可以看到控制台日志
                  </p>
                </div>
              </div>
              
              {/* 多模态输入组件 */}
              <div style={{ borderTop: '1px solid #d9d9d9' }}>
                <MultimodalInputDemo />
              </div>
            </div>
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
