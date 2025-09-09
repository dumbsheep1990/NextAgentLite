/**
 * 认证服务 - 从后端获取认证配置
 */

interface User {
  id?: number;
  username: string;
  password?: string;
  role: string;
  displayName: string;
}

interface AuthConfig {
  users: User[];
}

interface CaptchaResponse {
  captcha_id: string;
  success: boolean;
  message?: string;
}

interface LoginRequest {
  username: string;
  password: string;
  captcha_code: string;
  captcha_id: string;
}

interface LoginResponse {
  success: boolean;
  user?: User;
  message: string;
}

class AuthService {
  private static instance: AuthService;
  private baseUrl: string = '/api/v1';
  private cachedConfig: AuthConfig | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * 从后端获取认证配置
   */
  async getAuthConfig(): Promise<AuthConfig> {
    try {
      // 如果已有缓存，直接返回
      if (this.cachedConfig) {
        return this.cachedConfig;
      }

      console.log('🔐 从后端获取认证配置...');
      
      const response = await fetch(`${this.baseUrl}/auth/auth-credentials`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`获取认证配置失败: ${response.status} ${response.statusText}`);
      }

      const config = await response.json();
      
      // 缓存配置
      this.cachedConfig = {
        users: config.users || []
      };

      console.log(`✅ 认证配置获取成功 - 用户数量: ${this.cachedConfig.users.length}`);
      
      return this.cachedConfig;
    } catch (error) {
      console.error('❌ 获取认证配置失败:', error);
      
      // 降级到默认配置（与数据库用户保持一致）
      const fallbackConfig: AuthConfig = {
        users: [
          {
            id: 1,
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            displayName: '管理员'
          },
          {
            id: 2,
            username: 'user1',
            password: 'user123',
            role: 'user',
            displayName: '用户1'
          },
          {
            id: 3,
            username: 'user2',
            password: 'user123',
            role: 'user',
            displayName: '用户2'
          },
          {
            id: 4,
            username: 'guest',
            password: 'guest123',
            role: 'guest',
            displayName: '访客'
          }
        ]
      };
      
      console.warn('⚠️ 使用降级认证配置');
      return fallbackConfig;
    }
  }

  /**
   * 生成验证码
   */
  async generateCaptcha(): Promise<CaptchaResponse> {
    try {
      console.log('🔐 生成验证码...');
      
      const response = await fetch(`${this.baseUrl}/auth/captcha/generate`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`生成验证码失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ 验证码生成成功: ${result.captcha_id}`);
      
      return result;
    } catch (error) {
      console.error('❌ 生成验证码失败:', error);
      throw error;
    }
  }

  /**
   * 获取验证码图片URL
   */
  getCaptchaImageUrl(captchaId: string): string {
    return `${this.baseUrl}/auth/captcha/image/${captchaId}`;
  }

  /**
   * 用户登录（包含验证码验证）
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔐 用户登录...');
      
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        throw new Error(`登录失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ 用户登录成功: ${result.user?.displayName}`);
      } else {
        console.warn('❌ 用户登录失败:', result.message);
      }
      
      return result;
    } catch (error) {
      console.error('❌ 登录过程出错:', error);
      return {
        success: false,
        message: '登录请求失败，请检查网络连接'
      };
    }
  }

  /**
   * 验证用户凭据（兼容旧接口）
   */
  async validateCredentials(username: string, password: string): Promise<{ isValid: boolean; user?: User }> {
    try {
      const config = await this.getAuthConfig();
      
      const user = config.users.find(u => u.username === username && u.password === password);
      const isValid = !!user;
      
      if (isValid && user) {
        console.log(`✅ 用户认证成功: ${user.displayName} (${user.role})`);
        return { isValid: true, user };
      } else {
        console.warn('❌ 用户认证失败');
        return { isValid: false };
      }
    } catch (error) {
      console.error('❌ 认证验证过程出错:', error);
      return { isValid: false };
    }
  }

  /**
   * 获取所有用户列表（不包含密码） - 从后端数据库获取
   */
  async getUsers(): Promise<User[]> {
    try {
      console.log('🔐 从后端获取用户列表...');
      
      // 先清除缓存，确保获取最新数据
      this.clearCache();
      
      const response = await fetch(`${this.baseUrl}/auth/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`获取用户列表失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ 用户列表获取成功，用户数量: ${result.users?.length || 0}`);
      console.log('📋 用户列表详情:', result.users);
      
      return result.users || [];
    } catch (error) {
      console.error('❌ 获取用户列表失败:', error);
      // 返回空数组而不是降级配置，强制使用数据库数据
      return [];
    }
  }

  /**
   * 清除缓存的配置（用于刷新配置）
   */
  clearCache(): void {
    this.cachedConfig = null;
    console.log('🔄 认证配置缓存已清除');
  }

  /**
   * 获取缓存的配置（不进行网络请求）
   */
  getCachedConfig(): AuthConfig | null {
    return this.cachedConfig;
  }
}

// 导出单例实例
export const authService = AuthService.getInstance();

export default authService;

// 导出类型
export type { User, AuthConfig, CaptchaResponse, LoginRequest, LoginResponse };