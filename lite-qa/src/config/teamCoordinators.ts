/**
 * 团队协调器场景配置
 * 根据不同场景(模板类型)自动设置对应的协调器
 */

export type ScenarioType = 'general' | 'policy' | 'academic' | 'enterprise';

export interface CoordinatorConfig {
  id: string;
  name: string;
  description: string;
  instructions: string[];
}

/**
 * 场景协调器映射
 * 每个场景都有固定的协调器配置
 */
export const SCENARIO_COORDINATORS: Record<ScenarioType, CoordinatorConfig> = {
  // 通用问答场景
  general: {
    id: 'qa_coordinator_v2',
    name: '多语言问答协调器',
    description: '协调通用知识问答流程，支持多语言检索和翻译',
    instructions: [
      '协调多语言检索和翻译流程',
      '确保翻译智能体在检索阶段正确工作',
      '监控多语言检索的质量和完整性',
      '处理多语言内容的整合和排序',
      '确保最终回答包含多语言资料的完整信息',
      '处理翻译和检索的异常情况',
      '优化团队协作效率',
    ],
  },

  // 政策问答场景
  policy: {
    id: 'policy_qa_coordinator',
    name: '政策问答协调器',
    description: '协调政策问答流程，确保政策信息准确性和时效性',
    instructions: [
      '【流程协调】管理智能体执行顺序和数据流',
      '【状态监控】跟踪各智能体执行状态和进度',
      '【错误处理】处理执行异常，触发备用策略',
      '【性能优化】根据负载情况调整并发策略',
      '【质量控制】确保最终回答的完整性和准确性',
      '【政策专业性】保证政策术语和表述的准确性',
    ],
  },

  // 学术研究场景
  academic: {
    id: 'academic_research_coordinator',
    name: '学术研究协调器',
    description: '协调学术研究流程，支持文献检索和研究分析',
    instructions: [
      '【研究流程】协调文献检索、分析和总结流程',
      '【学术规范】确保符合学术引用和写作规范',
      '【质量保证】保证研究结果的严谨性和可靠性',
      '【资源整合】整合多源文献和研究资料',
      '【结构化输出】提供结构化的研究分析报告',
    ],
  },

  // 企业应用场景
  enterprise: {
    id: 'enterprise_application_coordinator',
    name: '企业应用协调器',
    description: '协调企业应用流程，支持业务分析和决策支持',
    instructions: [
      '【业务流程】协调企业业务分析和处理流程',
      '【数据集成】整合企业内部多源数据',
      '【决策支持】提供基于数据的决策建议',
      '【效率优先】优化执行流程，提高响应速度',
      '【安全合规】确保数据安全和合规性',
    ],
  },
};

/**
 * 根据场景类型获取协调器配置
 */
export function getCoordinatorByScenario(scenario: ScenarioType): CoordinatorConfig {
  return SCENARIO_COORDINATORS[scenario];
}

/**
 * 获取所有可用场景
 */
export function getAllScenarios(): Array<{ value: ScenarioType; label: string; description: string }> {
  return [
    { value: 'general', label: '通用问答', description: '支持多领域通用知识问答' },
    { value: 'policy', label: '政策问答', description: '专注于政策法规查询和分析' },
    { value: 'academic', label: '学术研究', description: '支持学术文献检索和研究辅助' },
    { value: 'enterprise', label: '企业应用', description: '企业业务分析和决策支持' },
  ];
}

/**
 * 验证场景类型
 */
export function isValidScenario(scenario: string): scenario is ScenarioType {
  return ['general', 'policy', 'academic', 'enterprise'].includes(scenario);
}
