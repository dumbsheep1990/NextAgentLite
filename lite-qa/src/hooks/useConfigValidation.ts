/**
 * 配置验证相关Hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Form } from 'antd';
import { configValidationService, type ValidationResult, type ConfigValidationReport } from '../services/configValidation';
import { type FrontendConfig } from '../services/configAdapter';

/**
 * 实时配置验证Hook
 */
export const useRealtimeValidation = (config: FrontendConfig) => {
  const [validationReport, setValidationReport] = useState<ConfigValidationReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<string | null>(null);

  // 执行验证
  const validate = useCallback(async (configToValidate?: FrontendConfig) => {
    setIsValidating(true);
    try {
      const targetConfig = configToValidate || config;
      const report = configValidationService.validateConfiguration(targetConfig);
      setValidationReport(report);
      setLastValidated(new Date().toISOString());
      return report;
    } catch (error) {
      // Configuration validation failed
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [config]);

  // 防抖验证
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  const debouncedValidate = useCallback((configToValidate?: FrontendConfig, delay = 500) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      validate(configToValidate);
    }, delay);
    
    setDebounceTimer(timer);
  }, [validate, debounceTimer]);

  // 配置变化时自动验证
  useEffect(() => {
    debouncedValidate(config, 300);
    
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [config, debouncedValidate]);

  // 获取特定段落的验证结果
  const getSectionResults = useCallback((section: string) => {
    if (!validationReport) return [];
    
    const sectionFieldMap: Record<string, string[]> = {
      models: ['chatModel', 'temperature', 'maxTokens', 'generalModel', 'domainModel', 'enableReranking', 'rerankModel'],
      database: ['esHost', 'esIndex', 'esAuthType', 'esUsername', 'esPassword', 'esToken', 'pgHost', 'pgDatabase', 'arangoHost'],
      vectorization: ['enableDualVector', 'retrievalMode', 'generalWeight', 'domainWeight', 'topK', 'similarityThreshold'],
      system: ['enableCache', 'cacheExpiration', 'logLevel'],
      storage: ['storageType', 'minioEndpoint', 'minioAccessKey', 'minioSecretKey'],
      knowledge_graph: ['enableKnowledgeGraph', 'extractionMode', 'minConfidence', 'batchSize', 'arangodbHost']
    };

    const sectionFields = sectionFieldMap[section] || [];
    return validationReport.results.filter(result => sectionFields.includes(result.field));
  }, [validationReport]);

  // 获取段落验证状态
  const getSectionStatus = useCallback((section: string) => {
    const results = getSectionResults(section);
    const errors = results.filter(r => r.severity === 'error');
    const warnings = results.filter(r => r.severity === 'warning');
    
    return {
      isValid: errors.length === 0,
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      score: validationReport?.sections[section]?.score || 100,
      results
    };
  }, [getSectionResults, validationReport]);

  return {
    validationReport,
    isValidating,
    lastValidated,
    validate,
    debouncedValidate,
    getSectionResults,
    getSectionStatus
  };
};

/**
 * 表单字段验证Hook
 */
export const useFieldValidation = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, ValidationResult | null>>({});
  
  // 验证单个字段
  const validateField = useCallback((
    fieldName: string, 
    value: any, 
    config: FrontendConfig
  ): ValidationResult | null => {
    try {
      const result = configValidationService.validateField(fieldName, value, config);
      
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: result
      }));
      
      return result;
    } catch (error) {
      // Field validation failed
      return null;
    }
  }, []);

  // 清除字段错误
  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // 获取字段错误
  const getFieldError = useCallback((fieldName: string) => {
    return fieldErrors[fieldName] || null;
  }, [fieldErrors]);

  // 检查字段是否有错误
  const hasFieldError = useCallback((fieldName: string) => {
    const error = fieldErrors[fieldName];
    return error && error.severity === 'error';
  }, [fieldErrors]);

  // 获取字段状态
  const getFieldStatus = useCallback((fieldName: string) => {
    const error = fieldErrors[fieldName];
    if (!error) return 'success';
    
    switch (error.severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'success';
    }
  }, [fieldErrors]);

  return {
    fieldErrors,
    validateField,
    clearFieldError,
    getFieldError,
    hasFieldError,
    getFieldStatus
  };
};

/**
 * Ant Design Form集成验证Hook
 */
export const useFormValidation = (form: any, config: FrontendConfig) => {
  const { validateField } = useFieldValidation();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // 自定义验证规则生成器
  const createValidationRule = useCallback((fieldName: string) => {
    return {
      validator: async (_: any, value: any) => {
        const result = validateField(fieldName, value, config);
        
        if (result && result.severity === 'error') {
          throw new Error(result.message);
        }
        
        return Promise.resolve();
      }
    };
  }, [validateField, config]);

  // 批量设置表单验证规则
  const setFormValidationRules = useCallback((fieldRules: Record<string, any[]>) => {
    const enhancedRules: Record<string, any[]> = {};
    
    Object.entries(fieldRules).forEach(([fieldName, rules]) => {
      enhancedRules[fieldName] = [
        ...rules,
        createValidationRule(fieldName)
      ];
    });

    return enhancedRules;
  }, [createValidationRule]);

  // 验证整个表单
  const validateForm = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const currentConfig = { ...config, ...values };
      const report = configValidationService.validateConfiguration(currentConfig);
      
      // 设置表单错误状态
      const errors: Record<string, string[]> = {};
      report.results.forEach(result => {
        if (result.severity === 'error') {
          if (!errors[result.field]) {
            errors[result.field] = [];
          }
          errors[result.field].push(result.message);
        }
      });
      
      setFormErrors(errors);
      
      // 设置表单字段错误
      form.setFields(
        Object.entries(errors).map(([field, messages]) => ({
          name: field,
          errors: messages
        }))
      );
      
      return {
        valid: Object.keys(errors).length === 0,
        errors: report.results
      };
    } catch (error) {
      // Form validation failed
      return {
        valid: false,
        errors: []
      };
    }
  }, [form, config]);

  return {
    formErrors,
    createValidationRule,
    setFormValidationRules,
    validateForm
  };
};

/**
 * 配置兼容性检查Hook
 */
export const useConfigCompatibility = (config: FrontendConfig) => {
  const [compatibilityIssues, setCompatibilityIssues] = useState<any[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<any[]>([]);

  // 检查配置兼容性
  const checkCompatibility = useCallback(() => {
    const issues = configValidationService.checkCompatibility(config);
    setCompatibilityIssues(issues);
    return issues;
  }, [config]);

  // 获取优化建议
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions = configValidationService.getOptimizationSuggestions(config);
    setOptimizationSuggestions(suggestions);
    return suggestions;
  }, [config]);

  // 配置变化时自动检查
  useEffect(() => {
    checkCompatibility();
    getOptimizationSuggestions();
  }, [config, checkCompatibility, getOptimizationSuggestions]);

  // 获取高优先级问题
  const getCriticalIssues = useCallback(() => {
    return compatibilityIssues.filter(issue => issue.severity === 'error');
  }, [compatibilityIssues]);

  // 获取性能优化建议
  const getPerformanceSuggestions = useCallback(() => {
    return optimizationSuggestions.filter(suggestion => suggestion.category === 'performance');
  }, [optimizationSuggestions]);

  // 获取安全性建议
  const getSecuritySuggestions = useCallback(() => {
    return optimizationSuggestions.filter(suggestion => suggestion.category === 'security');
  }, [optimizationSuggestions]);

  return {
    compatibilityIssues,
    optimizationSuggestions,
    checkCompatibility,
    getOptimizationSuggestions,
    getCriticalIssues,
    getPerformanceSuggestions,
    getSecuritySuggestions
  };
};

/**
 * 配置质量评分Hook
 */
export const useConfigScore = (config: FrontendConfig) => {
  const [score, setScore] = useState(0);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [grade, setGrade] = useState<'A' | 'B' | 'C' | 'D' | 'F'>('A');

  // 计算配置质量分数
  const calculateScore = useCallback(() => {
    const report = configValidationService.validateConfiguration(config);
    const newScore = report.score;
    
    // 计算各段落分数
    const sectionBreakdown: Record<string, number> = {};
    Object.entries(report.sections).forEach(([section, sectionData]) => {
      sectionBreakdown[section] = sectionData.score;
    });
    
    // 确定等级
    let newGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (newScore >= 90) newGrade = 'A';
    else if (newScore >= 80) newGrade = 'B';
    else if (newScore >= 70) newGrade = 'C';
    else if (newScore >= 60) newGrade = 'D';
    
    setScore(newScore);
    setBreakdown(sectionBreakdown);
    setGrade(newGrade);
    
    return {
      score: newScore,
      grade: newGrade,
      breakdown: sectionBreakdown
    };
  }, [config]);

  // 配置变化时重新计算
  useEffect(() => {
    calculateScore();
  }, [config, calculateScore]);

  // 获取分数颜色
  const getScoreColor = useCallback(() => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'orange';
    return 'red';
  }, [score]);

  // 获取等级描述
  const getGradeDescription = useCallback(() => {
    switch (grade) {
      case 'A': return '优秀 - 配置质量很高';
      case 'B': return '良好 - 配置基本合理';
      case 'C': return '一般 - 需要一些优化';
      case 'D': return '较差 - 存在较多问题';
      case 'F': return '不合格 - 存在严重问题';
      default: return '未知';
    }
  }, [grade]);

  return {
    score,
    grade,
    breakdown,
    calculateScore,
    getScoreColor,
    getGradeDescription
  };
};

/**
 * 配置监控Hook - 用于监控配置变化和性能
 */
export const useConfigMonitoring = () => {
  const [metrics, setMetrics] = useState({
    validationCount: 0,
    averageValidationTime: 0,
    errorRate: 0,
    lastUpdate: null as string | null
  });

  const [validationHistory, setValidationHistory] = useState<Array<{
    timestamp: string;
    duration: number;
    errorCount: number;
    warningCount: number;
    score: number;
  }>>([]);

  // 记录验证
  const recordValidation = useCallback((
    duration: number,
    errorCount: number,
    warningCount: number,
    score: number
  ) => {
    const record = {
      timestamp: new Date().toISOString(),
      duration,
      errorCount,
      warningCount,
      score
    };

    setValidationHistory(prev => [...prev.slice(-49), record]); // 保留最近50条记录
    
    setMetrics(prev => ({
      validationCount: prev.validationCount + 1,
      averageValidationTime: (prev.averageValidationTime * prev.validationCount + duration) / (prev.validationCount + 1),
      errorRate: errorCount > 0 ? ((prev.errorRate * prev.validationCount + 1) / (prev.validationCount + 1)) : (prev.errorRate * prev.validationCount / (prev.validationCount + 1)),
      lastUpdate: record.timestamp
    }));
  }, []);

  // 获取验证统计
  const getValidationStats = useCallback(() => {
    if (validationHistory.length === 0) return null;

    const recentValidations = validationHistory.slice(-10);
    const avgScore = recentValidations.reduce((sum, v) => sum + v.score, 0) / recentValidations.length;
    const avgErrors = recentValidations.reduce((sum, v) => sum + v.errorCount, 0) / recentValidations.length;
    const avgWarnings = recentValidations.reduce((sum, v) => sum + v.warningCount, 0) / recentValidations.length;

    return {
      averageScore: Math.round(avgScore),
      averageErrors: Math.round(avgErrors * 10) / 10,
      averageWarnings: Math.round(avgWarnings * 10) / 10,
      totalValidations: validationHistory.length
    };
  }, [validationHistory]);

  return {
    metrics,
    validationHistory,
    recordValidation,
    getValidationStats
  };
};