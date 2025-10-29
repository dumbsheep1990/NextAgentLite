/**
 * 自定义问答相关类型定义
 */

export interface EnhancedQAFormData {
  question: string;
  answer: string;
  keywords: string[];
  category: string;

  // KB路由配置
  enable_kb_routing: boolean;
  route_to_kb_ids: string[];

  // 工具调用配置
  enable_tool_call: boolean;
  tool_names: string[];
}
