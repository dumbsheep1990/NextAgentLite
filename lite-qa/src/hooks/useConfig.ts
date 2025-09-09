/**
 * 配置管理相关Hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { message } from 'antd';
import { useConfigStore, useConfigValidation, useConfigChanges, useConfigSync } from '../stores/configStore';
import { configAdapter, type FrontendConfig } from '../services/configAdapter';
import { configValidationService, type ValidationResult } from '../services/configValidation';

/**
 * 主要配置管理Hook
 */
export const useConfig = () => {
  const store = useConfigStore();
  const { hasUnsavedChanges, updateConfig, saveConfig } = useConfigChanges();
  const { loading, saving, loadConfig } = useConfigSync();
  const { validationReport, configScore, configHealth } = useConfigValidation();

  // 获取特定段落的配置
  const getSectionConfig = useCallback((section: string) => {
    const currentConfig = store.currentConfig;
    switch (section) {
      case 'models':
        return {
          chatModel: currentConfig.chatModel,
          temperature: currentConfig.temperature,
          maxTokens: currentConfig.maxTokens,
          generalModel: currentConfig.generalModel,
          domainModel: currentConfig.domainModel,
          enableReranking: currentConfig.enableReranking,
          rerankModel: currentConfig.rerankModel
        };
      case 'database':
        return {
          esHost: currentConfig.esHost,
          esIndex: currentConfig.esIndex,
          pgHost: currentConfig.pgHost,
          pgDatabase: currentConfig.pgDatabase,
          arangoHost: currentConfig.arangoHost,
          arangoDatabase: currentConfig.arangoDatabase
        };
      case 'vectorization':
        return {
          enableDualVector: currentConfig.enableDualVector,
          retrievalMode: currentConfig.retrievalMode,
          generalWeight: currentConfig.generalWeight,
          domainWeight: currentConfig.domainWeight,
          topK: currentConfig.topK,
          similarityThreshold: currentConfig.similarityThreshold
        };
      default:
        return currentConfig;
    }
  }, [store.currentConfig]);

  // 更新特定段落的配置
  const updateSectionConfig = useCallback((section: string, updates: Record<string, any>) => {
    Object.entries(updates).forEach(([field, value]) => {
      updateConfig(field, value, section);
    });
  }, [updateConfig]);

  // 保存特定段落的配置
  const saveSectionConfig = useCallback(async (section: string) => {
    try {
      const success = await saveConfig([section]);
      if (success) {
        message.success(`${section} 配置保存成功`);
      }
      return success;
    } catch (error) {
      message.error(`保存 ${section} 配置失败: ${error.message}`);
      return false;
    }
  }, [saveConfig]);

  return {
    // 状态
    currentConfig: store.currentConfig,
    hasUnsavedChanges,
    loading,
    saving,
    configScore,
    configHealth,
    validationReport,
    
    // 操作
    loadConfig,
    updateConfig,
    saveConfig,
    getSectionConfig,
    updateSectionConfig,
    saveSectionConfig,
    
    // 实用工具
    exportConfig: store.exportConfig,
    importConfig: store.importConfig,
    resetConfig: store.resetConfig
  };
};

/**
 * 配置验证Hook
 */
export const useConfigValidation = () => {
  const { validationReport, validationInProgress, validateConfig } = useConfigValidation();
  const [sectionValidation, setSectionValidation] = useState<Record<string, ValidationResult[]>>({});

  // 获取特定段落的验证结果
  const getSectionValidation = useCallback((section: string): ValidationResult[] => {
    if (!validationReport) return [];
    
    return validationReport.results.filter(result => {
      // 根据字段名判断所属段落
      const fieldSectionMap: Record<string, string> = {
        chatModel: 'models', temperature: 'models', maxTokens: 'models',
        generalModel: 'models', domainModel: 'models', enableReranking: 'models',
        esHost: 'database', esIndex: 'database', pgHost: 'database',
        enableDualVector: 'vectorization', retrievalMode: 'vectorization',
        storageType: 'storage', enableCache: 'system',
        enableKnowledgeGraph: 'knowledge_graph'
      };
      
      return fieldSectionMap[result.field] === section;
    });
  }, [validationReport]);

  // 获取段落验证状态
  const getSectionValidationStatus = useCallback((section: string) => {
    const sectionResults = getSectionValidation(section);
    const errorCount = sectionResults.filter(r => r.severity === 'error').length;
    const warningCount = sectionResults.filter(r => r.severity === 'warning').length;
    
    return {
      valid: errorCount === 0,
      hasErrors: errorCount > 0,
      hasWarnings: warningCount > 0,
      errorCount,
      warningCount,
      results: sectionResults
    };
  }, [getSectionValidation]);

  // 验证特定字段
  const validateField = useCallback((fieldName: string, value: any, config: FrontendConfig) => {
    return configValidationService.validateField(fieldName, value, config);
  }, []);

  return {
    validationReport,
    validationInProgress,
    validateConfig,
    getSectionValidation,
    getSectionValidationStatus,
    validateField
  };
};

/**
 * 配置字段Hook - 用于单个字段的管理
 */
export const useConfigField = <T = any>(fieldName: string, defaultValue?: T) => {
  const { currentConfig, updateConfig } = useConfig();
  const { validateField } = useConfigValidation();
  
  const value = useMemo(() => {
    return (currentConfig as any)[fieldName] ?? defaultValue;
  }, [currentConfig, fieldName, defaultValue]);

  const [localValue, setLocalValue] = useState<T>(value);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // 同步外部值变化
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // 更新字段值
  const setValue = useCallback(async (newValue: T, immediate = false) => {
    setLocalValue(newValue);
    
    if (immediate) {
      updateConfig(fieldName, newValue);
    }

    // 实时验证
    setIsValidating(true);
    try {
      const result = validateField(fieldName, newValue, currentConfig);
      setValidation(result);
    } catch (error) {
      // Field validation failed
    } finally {
      setIsValidating(false);
    }
  }, [fieldName, updateConfig, validateField, currentConfig]);

  // 提交更改
  const commit = useCallback(() => {
    updateConfig(fieldName, localValue);
  }, [fieldName, localValue, updateConfig]);

  // 重置到原始值
  const reset = useCallback(() => {
    setLocalValue(value);
    setValidation(null);
  }, [value]);

  return {
    value: localValue,
    originalValue: value,
    hasChanged: localValue !== value,
    validation,
    isValidating,
    setValue,
    commit,
    reset
  };
};

/**
 * 配置段落Hook - 用于管理配置段落
 */
export const useConfigSection = (sectionName: string) => {
  const { getSectionConfig, updateSectionConfig, saveSectionConfig } = useConfig();
  const { getSectionValidation, getSectionValidationStatus } = useConfigValidation();
  
  const sectionConfig = useMemo(() => getSectionConfig(sectionName), [getSectionConfig, sectionName]);
  const validation = useMemo(() => getSectionValidation(sectionName), [getSectionValidation, sectionName]);
  const validationStatus = useMemo(() => getSectionValidationStatus(sectionName), [getSectionValidationStatus, sectionName]);

  const [localConfig, setLocalConfig] = useState(sectionConfig);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // 同步外部配置变化
  useEffect(() => {
    setLocalConfig(sectionConfig);
    setHasLocalChanges(false);
  }, [sectionConfig]);

  // 更新本地配置
  const updateLocalConfig = useCallback((field: string, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
    setHasLocalChanges(true);
  }, []);

  // 批量更新本地配置
  const updateLocalConfigBatch = useCallback((updates: Record<string, any>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
    setHasLocalChanges(true);
  }, []);

  // 提交本地更改
  const commitChanges = useCallback(() => {
    updateSectionConfig(sectionName, localConfig);
    setHasLocalChanges(false);
  }, [sectionName, localConfig, updateSectionConfig]);

  // 保存段落配置
  const saveSection = useCallback(async () => {
    if (hasLocalChanges) {
      commitChanges();
    }
    return await saveSectionConfig(sectionName);
  }, [hasLocalChanges, commitChanges, saveSectionConfig, sectionName]);

  // 重置本地更改
  const resetLocalChanges = useCallback(() => {
    setLocalConfig(sectionConfig);
    setHasLocalChanges(false);
  }, [sectionConfig]);

  return {
    // 配置数据
    config: localConfig,
    originalConfig: sectionConfig,
    
    // 状态
    hasLocalChanges,
    validation,
    validationStatus,
    
    // 操作
    updateField: updateLocalConfig,
    updateBatch: updateLocalConfigBatch,
    commitChanges,
    saveSection,
    resetLocalChanges
  };
};

/**
 * 配置比较Hook - 用于比较不同配置版本
 */
export const useConfigComparison = (targetConfig?: FrontendConfig) => {
  const { currentConfig } = useConfig();
  const store = useConfigStore();

  const differences = useMemo(() => {
    if (!targetConfig) return [];
    return store.getConfigDiff(targetConfig);
  }, [currentConfig, targetConfig, store]);

  const hasDifferences = differences.length > 0;

  const getDifferencesBySection = useCallback((section: string) => {
    const sectionFields = {
      models: ['chatModel', 'temperature', 'maxTokens', 'generalModel', 'domainModel'],
      database: ['esHost', 'esIndex', 'pgHost', 'pgDatabase'],
      vectorization: ['enableDualVector', 'retrievalMode', 'generalWeight', 'domainWeight'],
      storage: ['storageType', 'minioEndpoint'],
      system: ['enableCache', 'logLevel'],
      knowledge_graph: ['enableKnowledgeGraph', 'extractionMode']
    };

    const fields = (sectionFields as any)[section] || [];
    return differences.filter(diff => fields.includes(diff.field));
  }, [differences]);

  return {
    differences,
    hasDifferences,
    getDifferencesBySection
  };
};

/**
 * 配置模板Hook
 */
export const useConfigTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const store = useConfigStore();

  // 加载模板
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      await store.getAvailableTemplates();
      // 这里需要从store或service获取模板数据
    } catch (error) {
      message.error('加载配置模板失败');
    } finally {
      setLoading(false);
    }
  }, [store]);

  // 应用模板
  const applyTemplate = useCallback(async (templateName: string, customizations?: Record<string, any>) => {
    try {
      const success = await store.applyTemplate(templateName, customizations);
      if (success) {
        message.success('配置模板应用成功');
      }
      return success;
    } catch (error) {
      message.error('应用配置模板失败');
      return false;
    }
  }, [store]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    loadTemplates,
    applyTemplate
  };
};