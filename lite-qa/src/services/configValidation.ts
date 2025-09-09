/**
 * 配置验证服务 - 提供配置项验证和错误检测
 */

import type { FrontendConfig } from './configAdapter';

export interface ValidationRule {
  field: string;
  type: 'required' | 'range' | 'format' | 'dependency' | 'custom';
  message: string;
  severity: 'error' | 'warning' | 'info';
  condition?: (value: any, config: FrontendConfig) => boolean;
  validate?: (value: any, config: FrontendConfig) => boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  dependencies?: string[];
}

export interface ValidationResult {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  value?: any;
  suggestion?: string;
}

export interface ConfigValidationReport {
  valid: boolean;
  score: number; // 0-100 配置质量分数
  results: ValidationResult[];
  sections: Record<string, {
    valid: boolean;
    score: number;
    issues: ValidationResult[];
  }>;
  recommendations: Array<{
    type: 'performance' | 'security' | 'reliability' | 'usability';
    priority: 'high' | 'medium' | 'low';
    message: string;
    action: string;
  }>;
}

export class ConfigValidationService {
  private static validationRules: ValidationRule[] = [
    // 模型配置验证规则
    {
      field: 'chatModel',
      type: 'required',
      message: '必须选择对话模型',
      severity: 'error'
    },
    {
      field: 'temperature',
      type: 'range',
      message: '温度参数必须在0-2之间',
      severity: 'error',
      min: 0,
      max: 2
    },
    {
      field: 'maxTokens',
      type: 'range',
      message: '最大Token数必须在256-8192之间',
      severity: 'error',
      min: 256,
      max: 8192
    },
    {
      field: 'chatEndpoint',
      type: 'format',
      message: 'API端点必须是有效的URL',
      severity: 'error',
      pattern: /^https?:\/\/.+/
    },
    {
      field: 'chatApiKey',
      type: 'required',
      message: '对话模型API密钥不能为空',
      severity: 'warning',
      condition: (value, config) => !!config.chatEndpoint
    },

    // 向量模型配置验证规则
    {
      field: 'generalModel',
      type: 'required',
      message: '必须选择通用向量模型',
      severity: 'error'
    },
    // 已移除双向量相关验证
    {
      field: 'generalBatchSize',
      type: 'range',
      message: '通用模型批处理大小必须在1-128之间',
      severity: 'warning',
      min: 1,
      max: 128
    },
    {
      field: 'domainBatchSize',
      type: 'range',
      message: '领域模型批处理大小必须在1-64之间',
      severity: 'warning',
      min: 1,
      max: 64
    },

    // 重排模型配置验证规则
    {
      field: 'rerankModel',
      type: 'required',
      message: '启用重排序时必须选择重排模型',
      severity: 'error',
      condition: (value, config) => config.enableReranking === true
    },
    {
      field: 'rerankThreshold',
      type: 'range',
      message: '重排阈值必须在0-1之间',
      severity: 'warning',
      min: 0,
      max: 1
    },

    // 数据库配置验证规则
    {
      field: 'esHost',
      type: 'format',
      message: 'ElasticSearch主机地址格式不正确 (host:port)',
      severity: 'error',
      pattern: /^[a-zA-Z0-9.-]+:\d+$/
    },
    {
      field: 'esUsername',
      type: 'required',
      message: '使用用户名密码认证时必须提供用户名',
      severity: 'error',
      condition: (value, config) => config.esAuthType === 'userpass'
    },
    {
      field: 'esPassword',
      type: 'required',
      message: '使用用户名密码认证时必须提供密码',
      severity: 'error',
      condition: (value, config) => config.esAuthType === 'userpass'
    },
    {
      field: 'esToken',
      type: 'required',
      message: '使用Token认证时必须提供API Token',
      severity: 'error',
      condition: (value, config) => config.esAuthType === 'token'
    },
    {
      field: 'pgHost',
      type: 'format',
      message: 'PostgreSQL主机地址格式不正确 (host:port)',
      severity: 'error',
      pattern: /^[a-zA-Z0-9.-]+:\d+$/
    },
    {
      field: 'pgMaxConnections',
      type: 'range',
      message: 'PostgreSQL最大连接数必须在1-100之间',
      severity: 'warning',
      min: 1,
      max: 100
    },

    // 检索配置验证规则
    {
      field: 'retrievalMode',
      type: 'required',
      message: '检索模式不能为空',
      severity: 'error'
    },
    {
      field: 'generalWeight',
      type: 'range',
      message: '通用向量权重必须在0-1之间',
      severity: 'error',
      min: 0,
      max: 1
    },
    // 已移除双向量权重验证
    // 已移除双向量权重验证
    {
      field: 'topK',
      type: 'range',
      message: '检索文档数量必须在1-50之间',
      severity: 'warning',
      min: 1,
      max: 50
    },
    {
      field: 'similarityThreshold',
      type: 'range',
      message: '相似度阈值必须在0-1之间',
      severity: 'error',
      min: 0,
      max: 1
    },

    // 存储配置验证规则
    {
      field: 'minioEndpoint',
      type: 'required',
      message: '使用MinIO存储时必须配置端点地址',
      severity: 'error',
      condition: (value, config) => config.storageType === 'minio'
    },
    {
      field: 'minioAccessKey',
      type: 'required',
      message: '使用MinIO存储时必须配置访问密钥',
      severity: 'error',
      condition: (value, config) => config.storageType === 'minio'
    },
    {
      field: 'minioSecretKey',
      type: 'required',
      message: '使用MinIO存储时必须配置秘密密钥',
      severity: 'error',
      condition: (value, config) => config.storageType === 'minio'
    },

    // 知识图谱配置验证规则
    {
      field: 'extractionMode',
      type: 'required',
      message: '启用知识图谱时必须选择提取模式',
      severity: 'error',
      condition: (value, config) => config.enableKnowledgeGraph === true
    },
    {
      field: 'minConfidence',
      type: 'range',
      message: '最小置信度必须在0-1之间',
      severity: 'warning',
      min: 0,
      max: 1
    },
    {
      field: 'maxConcurrency',
      type: 'range',
      message: '最大并发数必须在1-10之间',
      severity: 'warning',
      min: 1,
      max: 10
    },
    {
      field: 'arangodbHost',
      type: 'required',
      message: '启用知识图谱时必须配置ArangoDB地址',
      severity: 'error',
      condition: (value, config) => config.enableKnowledgeGraph === true
    }
  ];

  /**
   * 验证完整配置
   */
  static validateConfiguration(config: FrontendConfig): ConfigValidationReport {
    const results: ValidationResult[] = [];
    
    // 运行所有验证规则
    for (const rule of this.validationRules) {
      const result = this.validateRule(rule, config);
      if (result) {
        results.push(result);
      }
    }

    // 按配置段落分组
    const sections = this.groupResultsBySection(results);
    
    // 计算配置质量分数
    const score = this.calculateConfigScore(results, config);
    
    // 生成推荐建议
    const recommendations = this.generateRecommendations(config, results);

    return {
      valid: results.filter(r => r.severity === 'error').length === 0,
      score,
      results,
      sections,
      recommendations
    };
  }

  /**
   * 验证特定配置段落
   */
  static validateSection(sectionName: string, config: FrontendConfig): ValidationResult[] {
    const sectionFields = this.getSectionFields(sectionName);
    const relevantRules = this.validationRules.filter(rule => 
      sectionFields.includes(rule.field)
    );

    const results: ValidationResult[] = [];
    for (const rule of relevantRules) {
      const result = this.validateRule(rule, config);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * 实时验证单个字段
   */
  static validateField(fieldName: string, value: any, config: FrontendConfig): ValidationResult | null {
    const rule = this.validationRules.find(r => r.field === fieldName);
    if (!rule) return null;

    const tempConfig = { ...config, [fieldName]: value };
    return this.validateRule(rule, tempConfig);
  }

  /**
   * 检查配置兼容性
   */
  static checkCompatibility(config: FrontendConfig): Array<{
    issue: string;
    fields: string[];
    severity: 'error' | 'warning';
    suggestion: string;
  }> {
    const issues = [];

    // 检查向量配置兼容性
    if (config.enableDualVector) {
      issues.push({
        issue: '双向量功能已禁用，请使用单一向量模型',
        fields: ['enableDualVector'],
        severity: 'warning' as const,
        suggestion: '建议关闭双向量选项，使用单一向量模型'
      });
    }

    // 检查重排序配置兼容性
    if (config.enableReranking && !config.rerankModel) {
      issues.push({
        issue: '启用重排序但未选择重排模型',
        fields: ['enableReranking', 'rerankModel'],
        severity: 'error' as const,
        suggestion: '请选择一个重排模型或禁用重排序功能'
      });
    }

    // 检查存储配置兼容性
    if (config.storageType === 'minio' && (!config.minioEndpoint || !config.minioAccessKey)) {
      issues.push({
        issue: 'MinIO存储配置不完整',
        fields: ['minioEndpoint', 'minioAccessKey', 'minioSecretKey'],
        severity: 'error' as const,
        suggestion: '请完整配置MinIO端点和访问凭据'
      });
    }

    // 检查知识图谱配置兼容性
    if (config.enableKnowledgeGraph && !config.arangodbHost) {
      issues.push({
        issue: '启用知识图谱但未配置ArangoDB',
        fields: ['enableKnowledgeGraph', 'arangodbHost'],
        severity: 'error' as const,
        suggestion: '请配置ArangoDB连接信息或禁用知识图谱功能'
      });
    }

    return issues;
  }

  /**
   * 获取配置优化建议
   */
  static getOptimizationSuggestions(config: FrontendConfig): Array<{
    category: 'performance' | 'security' | 'reliability';
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
    fields: string[];
  }> {
    const suggestions = [];

    // 性能优化建议
    if (config.generalBatchSize && config.generalBatchSize < 16) {
      suggestions.push({
        category: 'performance' as const,
        suggestion: '增加通用模型批处理大小可以提高向量化性能',
        impact: 'medium' as const,
        fields: ['generalBatchSize']
      });
    }

    if (config.enableCache === false) {
      suggestions.push({
        category: 'performance' as const,
        suggestion: '启用缓存可以显著提高响应速度',
        impact: 'high' as const,
        fields: ['enableCache']
      });
    }

    // 安全性建议
    if (config.esAuthType === 'userpass' && !config.esPassword) {
      suggestions.push({
        category: 'security' as const,
        suggestion: 'ElasticSearch密码不应为空',
        impact: 'high' as const,
        fields: ['esPassword']
      });
    }

    if (config.minioSecure === false) {
      suggestions.push({
        category: 'security' as const,
        suggestion: '生产环境建议启用MinIO SSL连接',
        impact: 'medium' as const,
        fields: ['minioSecure']
      });
    }

    // 可靠性建议
    if (config.pgMaxConnections && config.pgMaxConnections > 50) {
      suggestions.push({
        category: 'reliability' as const,
        suggestion: '过高的数据库连接数可能影响系统稳定性',
        impact: 'medium' as const,
        fields: ['pgMaxConnections']
      });
    }

    if (config.retryAttempts === 0) {
      suggestions.push({
        category: 'reliability' as const,
        suggestion: '设置重试次数可以提高系统容错性',
        impact: 'medium' as const,
        fields: ['retryAttempts']
      });
    }

    return suggestions;
  }

  // 私有辅助方法
  private static validateRule(rule: ValidationRule, config: FrontendConfig): ValidationResult | null {
    const value = (config as any)[rule.field];

    // 检查条件是否满足
    if (rule.condition && !rule.condition(value, config)) {
      return null;
    }

    // 执行验证
    let isValid = true;
    let suggestion = '';

    switch (rule.type) {
      case 'required':
        isValid = value !== undefined && value !== null && value !== '';
        suggestion = isValid ? '' : '请提供此配置项的值';
        break;

      case 'range':
        if (value !== undefined && value !== null) {
          isValid = (!rule.min || value >= rule.min) && (!rule.max || value <= rule.max);
          suggestion = isValid ? '' : `建议值范围: ${rule.min || 'N/A'} - ${rule.max || 'N/A'}`;
        }
        break;

      case 'format':
        if (value && rule.pattern) {
          isValid = rule.pattern.test(value);
          suggestion = isValid ? '' : '请检查格式是否正确';
        }
        break;

      case 'dependency':
        if (rule.dependencies) {
          const hasRequiredDeps = rule.dependencies.every(dep => (config as any)[dep]);
          isValid = !hasRequiredDeps || (value !== undefined && value !== null);
          suggestion = isValid ? '' : '此配置项依赖其他配置项';
        }
        break;

      case 'custom':
        if (rule.validate) {
          isValid = rule.validate(value, config);
          suggestion = isValid ? '' : '请检查配置值的有效性';
        }
        break;
    }

    if (!isValid) {
      return {
        field: rule.field,
        message: rule.message,
        severity: rule.severity,
        value,
        suggestion
      };
    }

    return null;
  }

  private static groupResultsBySection(results: ValidationResult[]): Record<string, {
    valid: boolean;
    score: number;
    issues: ValidationResult[];
  }> {
    const sections: Record<string, ValidationResult[]> = {
      models: [],
      database: [],
      vectorization: [],
      system: [],
      storage: [],
      knowledge_graph: []
    };

    // 按段落分组
    for (const result of results) {
      const section = this.getFieldSection(result.field);
      if (sections[section]) {
        sections[section].push(result);
      }
    }

    // 计算每个段落的分数和状态
    const sectionResults: Record<string, any> = {};
    for (const [section, issues] of Object.entries(sections)) {
      const errorCount = issues.filter(i => i.severity === 'error').length;
      const warningCount = issues.filter(i => i.severity === 'warning').length;
      
      sectionResults[section] = {
        valid: errorCount === 0,
        score: Math.max(0, 100 - errorCount * 20 - warningCount * 5),
        issues
      };
    }

    return sectionResults;
  }

  private static calculateConfigScore(results: ValidationResult[], config: FrontendConfig): number {
    const errorCount = results.filter(r => r.severity === 'error').length;
    const warningCount = results.filter(r => r.severity === 'warning').length;
    
    let baseScore = 100 - errorCount * 15 - warningCount * 5;
    
    // 功能完整性加分
    if (config.enableDualVector) baseScore += 5;
    if (config.enableReranking) baseScore += 3;
    if (config.enableKnowledgeGraph) baseScore += 5;
    if (config.enableCache) baseScore += 2;
    
    return Math.max(0, Math.min(100, baseScore));
  }

  private static generateRecommendations(config: FrontendConfig, results: ValidationResult[]): Array<{
    type: 'performance' | 'security' | 'reliability' | 'usability';
    priority: 'high' | 'medium' | 'low';
    message: string;
    action: string;
  }> {
    const recommendations = [];
    
    const errorCount = results.filter(r => r.severity === 'error').length;
    const warningCount = results.filter(r => r.severity === 'warning').length;

    if (errorCount > 0) {
      recommendations.push({
        type: 'reliability' as const,
        priority: 'high' as const,
        message: `配置中有 ${errorCount} 个错误需要修复`,
        action: '请修复所有错误配置项以确保系统正常运行'
      });
    }

    if (warningCount > 3) {
      recommendations.push({
        type: 'usability' as const,
        priority: 'medium' as const,
        message: `建议优化 ${warningCount} 个配置警告`,
        action: '优化这些配置可以提升系统性能和稳定性'
      });
    }

    if (config.enableDualVector) {
      recommendations.push({
        type: 'performance' as const,
        priority: 'medium' as const,
        message: '系统已优化为单一向量模型，性能更稳定',
        action: '建议使用单一向量模型以获得最佳性能'
      });
    }

    if (!config.enableCache) {
      recommendations.push({
        type: 'performance' as const,
        priority: 'medium' as const,
        message: '启用缓存可以显著提高响应速度',
        action: '建议启用系统缓存以提升用户体验'
      });
    }

    return recommendations;
  }

  private static getSectionFields(sectionName: string): string[] {
    const sectionFieldMap: Record<string, string[]> = {
      models: ['chatModel', 'temperature', 'maxTokens', 'chatEndpoint', 'chatApiKey', 'enableStreaming', 
               'generalModel', 'domainModel', 'enableReranking', 'rerankModel'],
      database: ['esHost', 'esIndex', 'esAuthType', 'esUsername', 'esPassword', 'esToken',
                 'pgHost', 'pgDatabase', 'pgUsername', 'pgPassword', 'pgMaxConnections',
                 'arangoHost', 'arangoDatabase'],
      vectorization: ['enableDualVector', 'retrievalMode', 'generalWeight', 'domainWeight', 
                      'topK', 'similarityThreshold', 'useHybridSearch'],
      system: ['enableCache', 'cacheExpiration', 'logLevel'],
      storage: ['storageType', 'minioEndpoint', 'minioAccessKey', 'minioSecretKey', 'minioSecure'],
      knowledge_graph: ['enableKnowledgeGraph', 'extractionMode', 'minConfidence', 'batchSize',
                        'maxConcurrency', 'retryAttempts', 'arangodbHost']
    };

    return sectionFieldMap[sectionName] || [];
  }

  private static getFieldSection(fieldName: string): string {
    const fieldSectionMap: Record<string, string> = {
      // 模型相关字段
      chatModel: 'models', temperature: 'models', maxTokens: 'models',
      chatEndpoint: 'models', chatApiKey: 'models', enableStreaming: 'models',
      generalModel: 'models', domainModel: 'models',
      enableReranking: 'models', rerankModel: 'models',
      
      // 数据库相关字段
      esHost: 'database', esIndex: 'database', esAuthType: 'database',
      esUsername: 'database', esPassword: 'database', esToken: 'database',
      pgHost: 'database', pgDatabase: 'database', pgUsername: 'database',
      pgPassword: 'database', pgMaxConnections: 'database',
      arangoHost: 'database', arangoDatabase: 'database',
      
      // 向量化相关字段
      enableDualVector: 'vectorization', retrievalMode: 'vectorization',
      generalWeight: 'vectorization',
      topK: 'vectorization', similarityThreshold: 'vectorization',
      weights: 'vectorization', useHybridSearch: 'vectorization',
      
      // 系统相关字段
      enableCache: 'system', cacheExpiration: 'system', logLevel: 'system',
      
      // 存储相关字段
      storageType: 'storage', minioEndpoint: 'storage',
      minioAccessKey: 'storage', minioSecretKey: 'storage', minioSecure: 'storage',
      
      // 知识图谱相关字段
      enableKnowledgeGraph: 'knowledge_graph', extractionMode: 'knowledge_graph',
      minConfidence: 'knowledge_graph', batchSize: 'knowledge_graph',
      maxConcurrency: 'knowledge_graph', retryAttempts: 'knowledge_graph',
      arangodbHost: 'knowledge_graph'
    };

    return fieldSectionMap[fieldName] || 'system';
  }
}

// 导出配置验证服务实例
export const configValidationService = ConfigValidationService;