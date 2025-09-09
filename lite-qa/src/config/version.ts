/**
 * 应用版本配置
 * 统一管理应用版本信息，支持环境变量注入
 */

// 从环境变量获取配置，提供默认值作为后备
const getEnvValue = (key: string, defaultValue: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};

// 应用版本信息
export const APP_VERSION = {
  // 主版本号
  version: getEnvValue('VITE_APP_VERSION', '1.2.0'),
  
  // 应用名称
  name: getEnvValue('VITE_APP_NAME', '地聚物材料智能问答系统'),
  
  // 版本名称（可选）
  versionName: getEnvValue('VITE_APP_NAME', '智能材料问答系统'),
  
  // 构建时间（可以在构建时自动更新）
  buildTime: new Date().toISOString().split('T')[0],
  
  // 发布日期
  releaseDate: new Date().toISOString().split('T')[0],
  
  // 版本描述
  description: getEnvValue('VITE_APP_DESCRIPTION', '地聚物材料智能问答系统 - 支持多智能体协作、实时翻译、知识图谱等功能'),
  
  // 作者信息
  author: getEnvValue('VITE_APP_AUTHOR', 'GAC Team')
} as const;

// 格式化版本号的工具函数
export const formatVersion = (prefix = '') => {
  return `${prefix}${APP_VERSION.version}`;
};

// 获取完整版本信息
export const getFullVersionInfo = () => {
  return `${APP_VERSION.versionName} v${APP_VERSION.version} (${APP_VERSION.buildTime})`;
};

// 获取简短版本信息  
export const getShortVersionInfo = () => {
  return `v${APP_VERSION.version}`;
};

// 默认导出版本号
export default APP_VERSION.version;