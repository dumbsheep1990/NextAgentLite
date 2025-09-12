/**
 * 登录页面 - NextAgentLite智能问答系统
 */
import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Progress,
  Typography,
  Space,
  Divider,
  Row,
  Col
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useGlobalResourceStore } from '../../stores/globalResourceStore';
import { useAuthStore } from '../../stores/authStore';
import { getRandomBackground } from '../../utils/backgroundManager';
import { authService, type User, type CaptchaResponse, type LoginRequest } from '../../services/authService';
import { formatVersion } from '../../config/version';
import './LoginPage.css';

const { Title, Text } = Typography;

interface LoginForm {
  username: string;
  password: string;
  captcha: string;
}

interface InitStep {
  key: string;
  name: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  const [isLogging, setIsLogging] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  
  // 验证码相关状态
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImageUrl, setCaptchaImageUrl] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [initSteps, setInitSteps] = useState<InitStep[]>([
    { key: 'auth', name: '用户认证', status: 'pending' },
    { key: 'chunking', name: '切分配置', status: 'pending' },
    { key: 'models', name: '模型配置', status: 'pending' },
    { key: 'system', name: '系统配置', status: 'pending' }
  ]);

  // 动态背景图片选择（使用改进的背景管理器）
  const selectRandomBackground = async () => {
    try {
      console.log('🌅 开始选择背景图片...');
      
      // 使用改进的背景管理器 - 支持多种图片格式和智能检测
      const background = await getRandomBackground({
        basePath: '/background',
        supportedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
        fallbackImage: '/background/default.jpg' // 可选的备用图片
      });
      
      if (background) {
        console.log(`🎆 选择背景图片: ${background}`);
        setBackgroundImage(background);
      } else {
        console.warn('⚠️ 没有可用的背景图片，使用默认背景');
        setBackgroundImage('');
      }
    } catch (error) {
      console.error('❌ 背景图片选择失败:', error);
      setBackgroundImage('');
    }
  };

  // 组件挂载时选择背景图片并预加载认证配置
  React.useEffect(() => {
    console.log('🚀 LoginPage 组件已挂载，开始初始化...');
    
    // 稍微延迟以确保组件完全加载
    const timer = setTimeout(async () => {
      // 并行执行背景选择、认证配置预加载和验证码生成
      await Promise.all([
        selectRandomBackground(),
        loadAvailableUsers(), // 预加载用户列表
        generateCaptcha() // 生成初始验证码
      ]);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 监听backgroundImage状态变化
  React.useEffect(() => {
    console.log('🇺️ backgroundImage 状态更新:', backgroundImage);
  }, [backgroundImage]);
  
  const {
    initializeResources
  } = useGlobalResourceStore();
  
  const { login } = useAuthStore();

  // 加载可用用户列表
  const loadAvailableUsers = async () => {
    try {
      const users = await authService.getUsers();
      setAvailableUsers(users);
      console.log('✅ 加载可用用户列表成功:', users);
    } catch (error) {
      console.error('❌ 加载用户列表失败:', error);
    }
  };

  // 生成验证码
  const generateCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const captchaResponse = await authService.generateCaptcha();
      setCaptchaId(captchaResponse.captcha_id);
      setCaptchaImageUrl(authService.getCaptchaImageUrl(captchaResponse.captcha_id) + '?t=' + Date.now());
      console.log('✅ 验证码生成成功:', captchaResponse.captcha_id);
    } catch (error) {
      console.error('❌ 验证码生成失败:', error);
      message.error('验证码生成失败，请重试');
    } finally {
      setCaptchaLoading(false);
    }
  };

  // 刷新验证码
  const refreshCaptcha = () => {
    generateCaptcha();
  };

  // 验证用户凭据（从后端获取）
  const validateCredentials = async (values: LoginForm): Promise<{ isValid: boolean; user?: any }> => {
    try {
      return await authService.validateCredentials(values.username, values.password);
    } catch (error) {
      console.error('认证验证失败:', error);
      return { isValid: false };
    }
  };

  const updateStepStatus = (stepKey: string, status: InitStep['status'], message?: string) => {
    setInitSteps(prev => prev.map(step => 
      step.key === stepKey 
        ? { ...step, status, message }
        : step
    ));
  };

  const simulateInitialization = async (): Promise<void> => {
    const steps = [
      { key: 'auth', name: '用户认证', delay: 500 },
      { key: 'chunking', name: '切分配置', delay: 800 },
      { key: 'models', name: '模型配置', delay: 1200 },
      { key: 'system', name: '系统配置', delay: 400 }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setCurrentStep(step.name);
      updateStepStatus(step.key, 'loading');
      
      try {
        // 模拟加载延迟
        await new Promise(resolve => setTimeout(resolve, step.delay));
        
        // 对于系统资源初始化步骤，调用实际的初始化逻辑
        if (step.key !== 'auth') {
          await initializeResources();
        }
        
        updateStepStatus(step.key, 'success');
        setInitProgress(((i + 1) / steps.length) * 100);
        
      } catch (error) {
        console.error(`初始化步骤 ${step.name} 失败:`, error);
        updateStepStatus(step.key, 'error', error instanceof Error ? error.message : '初始化失败');
        throw error;
      }
    }
  };

  const handleLogin = async (values: LoginForm) => {
    if (!captchaId) {
      message.error('验证码未生成，请刷新页面');
      return;
    }

    if (!values.captcha) {
      message.error('请输入验证码');
      return;
    }

    setIsLogging(true);
    setIsInitializing(true);

    try {
      // 调用新的登录API，包含验证码验证
      const loginRequest: LoginRequest = {
        username: values.username,
        password: values.password,
        captcha_code: values.captcha,
        captcha_id: captchaId
      };

      const loginResponse = await authService.login(loginRequest);

      if (!loginResponse.success) {
        message.error(loginResponse.message || '登录失败');
        
        // 如果是验证码错误，重新生成验证码
        if (loginResponse.message?.includes('验证码')) {
          refreshCaptcha();
          form.setFieldsValue({ captcha: '' });
        }
        
        setIsInitializing(false);
        return;
      }

      if (!loginResponse.user) {
        message.error('登录响应无效');
        setIsInitializing(false);
        return;
      }

      // 执行系统初始化
      await simulateInitialization();
      
      // 直接使用后端返回的用户ID，无需硬编码映射
      const userId = loginResponse.user.id || 1; // 使用后端返回的真实ID
      
      // 调试：检查用户登录信息
      console.log('[LOGIN_PAGE] 🔍 用户登录信息:', {
        id: loginResponse.user.id,
        username: loginResponse.user.username,
        role: loginResponse.user.role,
        displayName: loginResponse.user.displayName
      });
      
      login(userId, loginResponse.user.username, loginResponse.user.role, loginResponse.user.displayName);
      
      message.success(`登录成功，欢迎 ${loginResponse.user.displayName}！系统初始化完成`);
      
      // 延迟跳转，让用户看到完成状态
      setTimeout(() => {
        navigate('/');
      }, 1000);
      
    } catch (error) {
      console.error('登录或初始化失败:', error);
      message.error('登录失败，请重试');
      // 重新生成验证码
      refreshCaptcha();
      form.setFieldsValue({ captcha: '' });
      setIsInitializing(false);
    } finally {
      setIsLogging(false);
    }
  };

  // 快速选择用户
  const handleUserSelect = (user: User) => {
    form.setFieldsValue({
      username: user.username,
      password: '' // 不自动填入密码，保持安全性
    });
    // 翻转回登录表单
    setIsCardFlipped(false);
    setShowUserSelection(false);
  };

  // 切换到用户选择模式
  const handleShowUserSelection = () => {
    setShowUserSelection(true);
    setIsCardFlipped(true);
  };

  // 返回登录表单
  const handleBackToLogin = () => {
    setIsCardFlipped(false);
    setTimeout(() => setShowUserSelection(false), 300); // 等待动画完成
  };

  const getStepIcon = (status: InitStep['status']) => {
    switch (status) {
      case 'loading':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <div className="step-pending" />;
    }
  };

  return (
    <div 
      className="login-container"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: backgroundImage ? 'transparent' : '#f0f2f5' // 默认背景色
      }}
    >
      <div className="login-content">
        <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
          <Col>
            {/* 3D 翻转容器 */}
            <div 
              style={{
                perspective: '1000px',
                width: '480px',
                height: '650px' // 固定宽高
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '480px',
                  height: '650px',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* 登录表单面 */}
                <Card 
                  className="login-card" 
                  bordered={false}
                  style={{
                    position: 'absolute',
                    width: '480px',
                    height: '650px',
                    backfaceVisibility: 'hidden',
                    background: `
                      linear-gradient(135deg, 
                        rgba(255, 255, 255, 0.95) 0%,
                        rgba(248, 250, 252, 0.90) 20%,
                        rgba(241, 245, 249, 0.85) 40%,
                        rgba(236, 241, 247, 0.88) 60%,
                        rgba(248, 250, 252, 0.92) 80%,
                        rgba(255, 255, 255, 0.96) 100%
                      ),
                      radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.06) 0%, transparent 50%),
                      radial-gradient(circle at 40% 60%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)
                    `,
                    boxShadow: `
                      0 25px 50px -12px rgba(0, 0, 0, 0.25),
                      0 20px 40px -10px rgba(59, 130, 246, 0.15),
                      0 10px 20px -5px rgba(147, 51, 234, 0.1),
                      0 0 0 1px rgba(255, 255, 255, 0.8),
                      0 0 0 2px rgba(59, 130, 246, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.9),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                    `,
                    borderRadius: '28px',
                    border: 'none',
                    backdropFilter: 'blur(30px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                    overflow: 'hidden'
                  }}
                >
              {/* Lite标签 - 右上角 */}
              <span style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                padding: '4px 10px',
                background: 'transparent',
                color: '#6366f1',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '12px',
                border: '1px solid #6366f1',
                letterSpacing: '0.5px',
                zIndex: 10
              }}>
                LITE
              </span>
              
              {/* 现代化光效装饰层 */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.4) 20%, rgba(147, 51, 234, 0.3) 50%, rgba(16, 185, 129, 0.3) 80%, transparent 100%)',
                  borderRadius: '28px 28px 0 0',
                  zIndex: 1
                }}
              />
              <div 
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '2px',
                  bottom: '2px',
                  borderRadius: '26px',
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.4) 0%, 
                      rgba(59, 130, 246, 0.03) 25%,
                      rgba(147, 51, 234, 0.02) 50%,
                      rgba(16, 185, 129, 0.02) 75%,
                      rgba(255, 255, 255, 0.2) 100%
                    )
                  `,
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              />
              {/* 动态光晕效果 */}
              <div 
                style={{
                  position: 'absolute',
                  top: '10%',
                  left: '10%',
                  width: '20px',
                  height: '20px',
                  background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(8px)',
                  animation: 'float 6s ease-in-out infinite',
                  zIndex: 1
                }}
              />
              <div 
                style={{
                  position: 'absolute',
                  bottom: '15%',
                  right: '15%',
                  width: '15px',
                  height: '15px',
                  background: 'radial-gradient(circle, rgba(147, 51, 234, 0.12) 0%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(6px)',
                  animation: 'float 8s ease-in-out infinite reverse',
                  zIndex: 1
                }}
              />
              
              <div className="login-header" style={{ position: 'relative', zIndex: 2 }}>
                <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
                  <div className="logo-section">
                    {/* NextAgentLite智能系统Logo - 与侧边栏一致 */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 12px 40px rgba(0, 201, 255, 0.4)',
                      position: 'relative',
                      overflow: 'hidden',
                      margin: '0 auto'
                    }}>
                      <span style={{
                        color: 'white',
                        fontFamily: 'Arial Black, sans-serif',
                        fontSize: '28px',
                        fontWeight: 900,
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                      }}>Z</span>
                    </div>
                    
                    <Title level={2} style={{ margin: '20px 0 8px 0', color: '#1a365d' }}>
                      NextAgent 智能体应用平台
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      AI Agent Application Platform
                    </Text>
                  </div>
                  
                  <Divider style={{ margin: '16px 0' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      专业的多智能体协作应用平台
                    </Text>
                  </Divider>
                </Space>
              </div>

              {!isInitializing ? (
                // 登录表单
                <div style={{ position: 'relative', zIndex: 2 }}>
                
                {/* 用户选择提示 - 永久显示 */}
                {!isCardFlipped && (
                  <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                    <Button
                      type="link"
                      size="small"
                      onClick={handleShowUserSelection}
                      style={{ fontSize: '12px', padding: 0 }}
                    >
                      查看可用用户账号 ({availableUsers.length || 0})
                    </Button>
                  </div>
                )}


                <Form
                  form={form}
                  name="login"
                  onFinish={handleLogin}
                  size="large"
                  layout="vertical"
                >
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: '#8c8c8c' }} />}
                      placeholder="用户名"
                      autoComplete="username"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#8c8c8c' }} />}
                      placeholder="密码"
                      autoComplete="current-password"
                    />
                  </Form.Item>

                  {/* 验证码输入框 */}
                  <Form.Item
                    name="captcha"
                    rules={[{ required: true, message: '请输入验证码' }]}
                    style={{ marginBottom: '16px' }}
                  >
                    <Row gutter={8}>
                      <Col span={14}>
                        <Input
                          placeholder="请输入验证码"
                          autoComplete="off"
                          style={{ textAlign: 'center' }}
                        />
                      </Col>
                      <Col span={10}>
                        <div
                          onClick={refreshCaptcha}
                          style={{
                            width: '100%',
                            height: '40px', // 与Input组件的large size高度保持一致
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fafafa',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#1890ff';
                            e.currentTarget.style.background = '#f0f9ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#d9d9d9';
                            e.currentTarget.style.background = '#fafafa';
                          }}
                        >
                          {captchaLoading ? (
                            <LoadingOutlined style={{ color: '#1890ff' }} />
                          ) : captchaImageUrl ? (
                            <img
                              src={captchaImageUrl}
                              alt="验证码"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '5px'
                              }}
                              onError={() => {
                                console.error('验证码图片加载失败');
                                message.error('验证码加载失败，请刷新');
                              }}
                            />
                          ) : (
                            <Text 
                              style={{ 
                                fontSize: '10px', 
                                color: '#999',
                                textAlign: 'center',
                                lineHeight: '12px',
                                padding: '2px'
                              }}
                            >
                              点击刷新验证码
                            </Text>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Form.Item>

                  <Form.Item style={{ marginBottom: '12px' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isLogging}
                      block
                      size="large"
                      className="login-button"
                      disabled={!captchaId}
                    >
                      {isLogging ? '登录中...' : '登录'}
                    </Button>
                  </Form.Item>

                </Form>
                </div>
              ) : (
                // 初始化进度 - 紧凑布局
                <div className="initialization-panel" style={{ 
                  position: 'relative', 
                  zIndex: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '30px 20px'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <Title level={4} style={{ color: '#1a365d', marginBottom: '4px', fontSize: '16px' }}>
                      系统配置中
                    </Title>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <Progress
                      percent={Math.round(initProgress)}
                      status={initProgress === 100 ? 'success' : 'active'}
                      strokeColor={{
                        '0%': '#667eea',
                        '50%': '#764ba2',
                        '100%': '#f093fb'
                      }}
                      size="small"
                    />
                  </div>


                  {/* 步骤列表 */}
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginTop: '16px'
                  }}>
                    {initSteps.map((step) => (
                      <div 
                        key={step.key} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.6)',
                          borderRadius: '10px',
                          border: `1px solid ${
                            step.status === 'success' ? 'rgba(82, 196, 26, 0.4)' :
                            step.status === 'loading' ? 'rgba(24, 144, 255, 0.4)' :
                            step.status === 'error' ? 'rgba(255, 77, 79, 0.4)' :
                            'rgba(0, 0, 0, 0.15)'
                          }`,
                          transition: 'all 0.3s ease',
                          minWidth: '100px'
                        }}
                      >
                        <div style={{ marginRight: '6px', fontSize: '14px' }}>
                          {getStepIcon(step.status)}
                        </div>
                        <Text 
                          strong={step.status === 'loading'}
                          style={{ 
                            fontSize: '12px',
                            color: step.status === 'loading' ? '#1890ff' : 
                                   step.status === 'success' ? '#52c41a' : '#1a365d'
                          }}
                        >
                          {step.name}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 版权和版本信息 */}
              <div 
                style={{ 
                  position: 'relative', 
                  zIndex: 2,
                  marginTop: '24px',
                  marginLeft: '0px',
                  marginRight: '0px',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.12) 50%, rgba(219, 234, 254, 0.08) 100%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 12px -4px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  textAlign: 'center' 
                }}>
                  <Text 
                    style={{ 
                      fontSize: '9px', 
                      color: '#94a3b8',
                      letterSpacing: '0.1px'
                    }}
                  >
                    © 2025 NextAgentLite
                  </Text>
                  <Text 
                    style={{ 
                      fontSize: '9px', 
                      color: '#94a3b8',
                      fontFamily: 'Monaco, "SF Mono", Consolas, monospace'
                    }}
                  >
{formatVersion('Version ')}
                  </Text>
                </div>
              </div>
            </Card>
            
            {/* 用户选择面（卡片背面） */}
            <Card 
              className="user-selection-card" 
              bordered={false}
              style={{
                position: 'absolute',
                width: '480px',
                height: '650px',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.95) 0%,
                    rgba(248, 250, 252, 0.90) 20%,
                    rgba(241, 245, 249, 0.85) 40%,
                    rgba(236, 241, 247, 0.88) 60%,
                    rgba(248, 250, 252, 0.92) 80%,
                    rgba(255, 255, 255, 0.96) 100%
                  ),
                  radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.06) 0%, transparent 50%),
                  radial-gradient(circle at 40% 60%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)
                `,
                boxShadow: `
                  0 25px 50px -12px rgba(0, 0, 0, 0.25),
                  0 20px 40px -10px rgba(59, 130, 246, 0.15),
                  0 10px 20px -5px rgba(147, 51, 234, 0.1),
                  0 0 0 1px rgba(255, 255, 255, 0.8),
                  0 0 0 2px rgba(59, 130, 246, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.9),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                `,
                borderRadius: '28px',
                border: 'none',
                backdropFilter: 'blur(30px) saturate(200%)',
                WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                overflow: 'hidden',
                padding: '32px'
              }}
            >
              {/* 用户选择标题 */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Title level={4} style={{ margin: '0 0 6px 0', color: '#1a365d', fontSize: '18px' }}>
                  选择用户账号
                </Title>
                <Text type="secondary" style={{ fontSize: '12px', color: '#64748b' }}>
                  轻触头像快速登录
                </Text>
              </div>

              {/* 用户纵向列表 */}
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {availableUsers.map((user, index) => (
                  <div
                    key={user.id || user.username}
                    onClick={() => handleUserSelect(user)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: `
                        linear-gradient(135deg, 
                          rgba(255, 255, 255, 0.9) 0%, 
                          rgba(248, 250, 252, 0.8) 100%
                        )
                      `,
                      borderRadius: '14px',
                      border: '1px solid rgba(59, 130, 246, 0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: `
                        0 4px 12px rgba(0, 0, 0, 0.04),
                        0 2px 4px rgba(0, 0, 0, 0.02),
                        inset 0 1px 0 rgba(255, 255, 255, 0.6)
                      `,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = `
                        0 8px 25px rgba(59, 130, 246, 0.15),
                        0 4px 12px rgba(0, 0, 0, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.8)
                      `;
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = `
                        0 4px 12px rgba(0, 0, 0, 0.04),
                        0 2px 4px rgba(0, 0, 0, 0.02),
                        inset 0 1px 0 rgba(255, 255, 255, 0.6)
                      `;
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.08)';
                    }}
                  >
                    {/* 用户头像 */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: user.role === 'admin' 
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)' 
                        : user.role === 'user' 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)' 
                        : 'linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #374151 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 700,
                      boxShadow: `
                        0 3px 10px ${
                          user.role === 'admin' ? 'rgba(245, 158, 11, 0.3)' : 
                          user.role === 'user' ? 'rgba(16, 185, 129, 0.3)' : 
                          'rgba(107, 114, 128, 0.3)'
                        },
                        inset 0 1px 0 rgba(255, 255, 255, 0.2)
                      `,
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                      marginRight: '14px',
                      flexShrink: 0
                    }}>
                      {user.displayName?.charAt(0) || user.username?.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* 用户信息 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: '#1a365d', 
                        fontSize: '15px', 
                        marginBottom: '2px',
                        textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
                      }}>
                        {user.displayName}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#64748b',
                        fontWeight: 500
                      }}>
                        @{user.username}
                      </div>
                    </div>
                    
                    {/* 角色标签 */}
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.3px',
                      background: user.role === 'admin' 
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15))' 
                        : user.role === 'user' 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))' 
                        : 'linear-gradient(135deg, rgba(107, 114, 128, 0.15), rgba(75, 85, 99, 0.15))',
                      color: user.role === 'admin' ? '#92400e' : user.role === 'user' ? '#065f46' : '#374151',
                      border: `1px solid ${
                        user.role === 'admin' ? 'rgba(245, 158, 11, 0.2)' : 
                        user.role === 'user' ? 'rgba(16, 185, 129, 0.2)' : 
                        'rgba(107, 114, 128, 0.2)'
                      }`,
                      flexShrink: 0
                    }}>
                      {user.role === 'admin' ? '管理员' : user.role === 'user' ? '用户' : '访客'}
                    </div>
                  </div>
                ))}
              </div>

              {/* 返回按钮 */}
              <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                <Button 
                  type="link" 
                  onClick={handleBackToLogin}
                  style={{ 
                    fontSize: '13px',
                    color: '#64748b',
                    fontWeight: 500,
                    padding: '4px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                    e.currentTarget.style.color = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  ← 返回登录
                </Button>
              </div>
            </Card>
            
              </div>
            </div>
            
            {/* 独立版权信息区域 */}
            <div style={{
              marginTop: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '8px 16px',
                background: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '12px',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  textAlign: 'center'
                }}>
                  © 2025 智政科技
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default LoginPage;