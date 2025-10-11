import React, { useState, useEffect } from 'react'
import { InteractiveCarousel } from './InteractiveCarousel'
import { Typography } from 'antd'
import Ballpit from '../Ballpit'
import { SystemStatusModal } from '../common/SystemStatusModal'
import '../../pages/WelcomePage.css'

const { Title, Text } = Typography

export const InteractiveWelcome: React.FC = () => {
  const [systemSettingsVisible, setSystemSettingsVisible] = useState(false)

  // 监听系统设置事件
  useEffect(() => {
    const handleOpenSystemSettings = () => {
      setSystemSettingsVisible(true)
    }

    window.addEventListener('open-system-settings', handleOpenSystemSettings)
    
    return () => {
      window.removeEventListener('open-system-settings', handleOpenSystemSettings)
    }
  }, [])
  return (
    <div className="welcome-page">
      {/* Ballpit 动态背景 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0
      }}>
        <Ballpit
          count={100}
          gravity={0.6}
          friction={0.8}
          wallBounce={0.95}
          followCursor={true}
          colors={[0x6366f1, 0x8b5cf6, 0x06b6d4, 0x10b981]}
          materialParams={{
            metalness: 0.2,
            roughness: 0.3,
            clearcoat: 1,
            clearcoatRoughness: 0.1
          }}
        />
        {/* 微妙的叠加层确保内容可读性 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          pointerEvents: 'none'
        }} />
      </div>
      
      <div className="content-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="header-section">
          <div className="logo-section">
            <Title level={1} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', lineHeight: '1.4', paddingBottom: '8px' }}>
              <span 
                className="font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent"
                style={{
                  fontFamily: '"Inter", "Helvetica Neue", sans-serif',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                NextAgent
              </span>
              <span className="px-3 py-1 text-2xl font-bold bg-blue-500 text-white rounded-lg shadow-md">Lite</span>
            </Title>
            <Text style={{ fontSize: '18px', color: '#6b7280' }}>
              智能体开发平台
            </Text>
          </div>
        </div>

        <InteractiveCarousel />
        
        {/* 底部版权信息 */}
        <div className="footer-section mt-16 pb-8">
          <div className="flex flex-col items-center space-y-2 text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                版本 v1.0.0
              </span>
              <span>•</span>
              <span>© 2025 智政科技</span>
            </div>
            <div className="text-xs text-gray-400">
              NextAgent Lite 智能体开发平台
            </div>
          </div>
        </div>
      </div>

      {/* 系统设置面板 */}
      <SystemStatusModal
        visible={systemSettingsVisible}
        onClose={() => setSystemSettingsVisible(false)}
      />
    </div>
  )
}
