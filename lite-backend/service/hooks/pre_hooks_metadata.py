"""
Pre-Hooks详细元数据定义

为每个Pre-Hook提供详细的功能说明、使用场景、配置示例等信息
用于前端展示和文档生成
"""

PRE_HOOKS_METADATA = {
    'input_validation': {
        'name': '输入验证',
        'category': 'validation',
        'description': '验证输入的格式、长度和内容合规性',
        'features': [
            '空输入检查（可配置是否允许空输入）',
            '长度验证（最小/最大长度限制）',
            '禁止内容检测（基于正则表达式）',
            '自动抛出规范化错误信息'
        ],
        'use_cases': [
            '防止恶意或格式错误的输入',
            '限制输入长度避免系统过载',
            '过滤敏感词汇和不当内容',
            '确保输入符合业务规则'
        ],
        'config_example': {
            'max_length': 4000,
            'min_length': 1,
            'forbidden_patterns': [r'<script>', r'javascript:'],
            'allow_empty': False
        },
        'config_params': [
            {
                'name': 'max_length',
                'label': '最大长度',
                'type': 'int',
                'required': False,
                'default': 4000,
                'description': '允许的最大输入长度（字符数）'
            },
            {
                'name': 'min_length',
                'label': '最小长度',
                'type': 'int',
                'required': False,
                'default': 1,
                'description': '要求的最小输入长度（字符数）'
            },
            {
                'name': 'forbidden_patterns',
                'label': '禁止模式',
                'type': 'List[str]',
                'required': False,
                'default': [],
                'description': '禁止的内容正则表达式列表，匹配任一模式将拒绝输入'
            },
            {
                'name': 'allow_empty',
                'label': '允许空输入',
                'type': 'bool',
                'required': False,
                'default': False,
                'description': '是否允许空输入，False时空输入将被拒绝'
            }
        ],
        'output_fields': [],
        'raises': ['InputCheckError: 输入不符合要求时抛出'],
        'priority': 1,
        'execution_time': '< 1ms',
        'tool_bindings': []  # 纯本地验证，无需外部工具
    },

    'intent_analysis': {
        'name': '意图分析',
        'category': 'analysis',
        'description': '分析用户查询意图，识别查询类型和特征',
        'features': [
            '启发式意图识别（summary/compare/fact/howto/list/entity）',
            '查询复杂度估算（simple/medium/high）',
            '领域检测（policy/academic/enterprise/general）',
            'LLM增强分析（可选，提高准确率）',
            '关键词提取（停用词过滤）'
        ],
        'use_cases': [
            '为检索策略路由提供决策依据',
            '根据意图调整回答风格',
            '识别复杂查询进行特殊处理',
            '提取关键词用于检索优化'
        ],
        'config_example': {
            'llm_gateway_url': 'http://localhost:9050',
            'model_id': 'Qwen/Qwen2.5-7B-Instruct',
            'enable_llm_fallback': True,
            'timeout': 10
        },
        'config_params': [
            {
                'name': 'llm_gateway_url',
                'label': 'LLM网关地址',
                'type': 'str',
                'required': False,
                'default': 'http://localhost:9050',
                'description': 'LLM网关服务地址，用于增强意图分析'
            },
            {
                'name': 'model_id',
                'label': '模型ID',
                'type': 'str',
                'required': False,
                'default': 'Qwen/Qwen2.5-7B-Instruct',
                'description': '使用的LLM模型ID'
            },
            {
                'name': 'enable_llm_fallback',
                'label': '启用LLM备用',
                'type': 'bool',
                'required': False,
                'default': True,
                'description': '启用LLM备用分析，当启发式分析不确定时使用LLM'
            },
            {
                'name': 'timeout',
                'label': '超时时间',
                'type': 'int',
                'required': False,
                'default': 10,
                'description': 'LLM调用超时时间（秒）'
            },
            {
                'name': 'max_keywords',
                'label': '最大关键词数',
                'type': 'int',
                'required': False,
                'default': 5,
                'description': '提取的最大关键词数量'
            }
        ],
        'output_fields': [
            'intent: 意图类型（summary/compare/fact等）',
            'keywords: 关键词列表（最多5个）',
            'query_features.complexity: 复杂度级别',
            'query_features.domain: 领域类型',
            'query_features.length: 查询长度',
            'query_features.word_count: 词数'
        ],
        'priority': 5,
        'execution_time': '5-50ms（启发式）/ 100-500ms（LLM模式）',
        'tool_bindings': [
            {
                'tool_id': 'api:llm_gateway:intent_analysis',
                'tool_type': 'api',
                'tool_name': 'LLM意图分析服务',
                'purpose': 'LLM增强的意图分析，提高复杂查询的识别准确率',
                'required': False,
                'config_key': 'llm_gateway_url',
                'binding_status': 'optional'
            }
        ]
    },

    'retrieval_strategy_router': {
        'name': '检索策略路由',
        'category': 'routing',
        'description': '根据查询特征动态选择最优检索策略',
        'features': [
            '基于规则的策略匹配（intent/complexity/domain）',
            '支持7种检索策略（qa_direct/full_retrieval_with_rerank/graph_enhanced等）',
            '动态配置生成（top_k/rerank/enable_graph等）',
            '预检索执行（可选，提前获取结果）',
            '延迟加载检索服务（hybrid/hirag/qa_routing/graph）'
        ],
        'use_cases': [
            '简单问题直达QA数据集（qa_direct）',
            '复杂查询全量检索+重排（full_retrieval_with_rerank）',
            '实体查询图谱增强（graph_enhanced）',
            '政策查询元数据过滤（policy_enhanced）',
            '学术查询引用分析（academic_enhanced）'
        ],
        'config_example': {
            'default_strategy': 'hybrid_default',
            'pre_retrieve': False,
            'routing_rules': [
                {
                    'name': 'simple_fact_to_qa',
                    'conditions': {
                        'intent': 'fact',
                        'complexity': 'simple'
                    },
                    'strategy': 'qa_direct'
                },
                {
                    'name': 'complex_policy_enhanced',
                    'conditions': {
                        'domain': 'policy',
                        'complexity': ['medium', 'high']
                    },
                    'strategy': 'policy_enhanced'
                }
            ]
        },
        'config_params': [
            {
                'name': 'default_strategy',
                'label': '默认策略',
                'type': 'str',
                'required': False,
                'default': 'hybrid_default',
                'description': '默认检索策略，当没有规则匹配时使用'
            },
            {
                'name': 'pre_retrieve',
                'label': '预检索',
                'type': 'bool',
                'required': False,
                'default': False,
                'description': '是否在路由阶段就执行检索，True时返回retrieval_results'
            },
            {
                'name': 'routing_rules',
                'label': '路由规则',
                'type': 'List[Dict]',
                'required': False,
                'default': [],
                'description': '路由规则列表，每个规则包含name/conditions/strategy字段'
            },
            {
                'name': 'top_k',
                'label': '返回数量',
                'type': 'int',
                'required': False,
                'default': 5,
                'description': '默认检索返回的文档数量'
            }
        ],
        'output_fields': [
            'retrieval_strategy: 选择的检索策略名称',
            'retrieval_config: 检索配置字典（top_k/rerank/source等）',
            'retrieval_results: 预检索结果（pre_retrieve=True时）'
        ],
        'priority': 10,
        'execution_time': '< 1ms（路由）/ 100-1000ms（预检索）',
        'tool_bindings': []  # 路由逻辑，无需外部工具
    },

    'policy_sensitive_word_check': {
        'name': '政策敏感词检测',
        'category': 'security',
        'description': '检测政策查询中的敏感词汇，支持分级检测和多种处理策略',
        'features': [
            '三类敏感词检测（political/legal/ethnic）',
            '三级检测强度（strict/moderate/loose）',
            '本地正则匹配 + 外部API检测（双重保障）',
            '可配置阻断或仅记录',
            '违规日志记录（脱敏处理）',
            '自定义敏感词库支持'
        ],
        'use_cases': [
            '政策问答系统内容审核',
            '敏感查询拦截和记录',
            '合规性检查',
            '安全审计和风险控制'
        ],
        'config_example': {
            'check_level': 'moderate',
            'block_on_detection': True,
            'log_violations': True,
            'categories': ['political', 'legal', 'ethnic'],
            'use_external_api': False,
            'custom_sensitive_words': {
                'political': [r'自定义敏感词'],
                'legal': []
            }
        },
        'config_params': [
            {
                'name': 'check_level',
                'label': '检测级别',
                'type': 'str',
                'required': False,
                'default': 'moderate',
                'description': '检测强度级别：strict(严格)/moderate(中等)/loose(宽松)'
            },
            {
                'name': 'block_on_detection',
                'label': '检测到时阻断',
                'type': 'bool',
                'required': False,
                'default': True,
                'description': '检测到敏感词时是否阻断请求，False时仅记录'
            },
            {
                'name': 'log_violations',
                'label': '记录违规日志',
                'type': 'bool',
                'required': False,
                'default': True,
                'description': '是否记录违规日志（已脱敏处理）'
            },
            {
                'name': 'categories',
                'label': '敏感词分类',
                'type': 'List[str]',
                'required': False,
                'default': ['political', 'legal', 'ethnic'],
                'description': '启用的敏感词分类列表'
            },
            {
                'name': 'use_external_api',
                'label': '使用外部API',
                'type': 'bool',
                'required': False,
                'default': False,
                'description': '是否使用外部API进行检测（双重保障）'
            },
            {
                'name': 'custom_sensitive_words',
                'label': '自定义敏感词',
                'type': 'Dict[str, List[str]]',
                'required': False,
                'default': {},
                'description': '自定义敏感词库，按分类组织的正则表达式'
            }
        ],
        'output_fields': [
            'policy_sensitive_word_check.checked: 是否已检测',
            'policy_sensitive_word_check.detected: 是否检测到敏感词',
            'policy_sensitive_word_check.categories: 检测到的分类列表',
            'policy_sensitive_word_check.action: blocked或passed'
        ],
        'raises': ['InputCheckError: 检测到敏感词且配置阻断时抛出'],
        'priority': 8,
        'execution_time': '< 5ms（本地）/ 50-200ms（外部API）',
        'tool_bindings': [
            {
                'tool_id': 'api:sensitive_word:detection',
                'tool_type': 'api',
                'tool_name': '敏感词检测API',
                'purpose': '外部敏感词检测服务，提供更全面的敏感词库',
                'required': False,
                'config_key': 'external_api_name',
                'binding_status': 'optional'
            }
        ]
    },

    'policy_metadata_extractor': {
        'name': '政策元数据提取',
        'category': 'enhancement',
        'description': '从查询中提取政策文档元数据（编号、日期、机关等）',
        'features': [
            '政策编号提取（国发〔2024〕15号等多种格式）',
            '发文机关识别（国务院、各部委等）',
            '政策级别判断（national/provincial/municipal/county）',
            '日期信息提取（发布日期、生效日期）',
            '多策略提取（regex/nlp/llm/hybrid）',
            '置信度计算和阈值过滤'
        ],
        'use_cases': [
            '政策文档精准检索',
            '元数据过滤和筛选',
            '政策编号标准化',
            '政策信息结构化'
        ],
        'config_example': {
            'required': False,
            'metadata_fields': [
                'policy_number',
                'issue_date',
                'issuing_agency',
                'policy_level',
                'effective_date'
            ],
            'extraction_method': 'hybrid',
            'use_external_tool': False,
            'min_confidence': 0.7
        },
        'config_params': [
            {
                'name': 'required',
                'label': '必须提取',
                'type': 'bool',
                'required': False,
                'default': False,
                'description': '是否要求必须成功提取元数据，True时提取失败会抛出异常'
            },
            {
                'name': 'metadata_fields',
                'label': '元数据字段',
                'type': 'List[str]',
                'required': False,
                'default': ['policy_number', 'issue_date', 'issuing_agency', 'policy_level', 'effective_date'],
                'description': '要提取的元数据字段列表'
            },
            {
                'name': 'extraction_method',
                'label': '提取方法',
                'type': 'str',
                'required': False,
                'default': 'hybrid',
                'description': '提取方法：regex(正则)/nlp(自然语言处理)/llm(大模型)/hybrid(混合)'
            },
            {
                'name': 'use_external_tool',
                'label': '使用外部工具',
                'type': 'bool',
                'required': False,
                'default': False,
                'description': '是否使用外部工具进行提取'
            },
            {
                'name': 'min_confidence',
                'label': '最小置信度',
                'type': 'float',
                'required': False,
                'default': 0.7,
                'description': '最小置信度阈值(0-1)，低于此值的提取结果将被丢弃'
            }
        ],
        'output_fields': [
            'policy_metadata.extracted: 是否成功提取',
            'policy_metadata.method: 提取方法（regex/llm/hybrid）',
            'policy_metadata.data.policy_number: 政策编号',
            'policy_metadata.data.issue_date: 发布日期',
            'policy_metadata.data.issuing_agency: 发文机关',
            'policy_metadata.data.policy_level: 政策级别',
            'policy_metadata.data.effective_date: 生效日期',
            'policy_metadata.confidence: 置信度（0-1）'
        ],
        'priority': 6,
        'execution_time': '< 2ms（regex）/ 100-500ms（LLM）',
        'tool_bindings': [
            {
                'tool_id': 'api:nlp:metadata_extraction',
                'tool_type': 'api',
                'tool_name': 'NLP元数据提取工具',
                'purpose': '基于NLP的政策元数据提取，提高识别准确性',
                'required': False,
                'config_key': 'use_external_tool',
                'binding_status': 'optional'
            },
            {
                'tool_id': 'api:llm:metadata_extraction',
                'tool_type': 'api',
                'tool_name': 'LLM元数据提取工具',
                'purpose': '基于大模型的政策元数据提取，处理复杂格式',
                'required': False,
                'config_key': 'extraction_method',
                'binding_status': 'optional'
            }
        ]
    },

    'policy_query_normalization': {
        'name': '政策查询标准化',
        'category': 'enhancement',
        'description': '标准化政策查询文本，展开缩写，提取关键词',
        'features': [
            '去除冗余词汇（语气词、口语化表达）',
            '展开政策领域缩写（国发→国务院发布的）',
            '标准化政策术语（同义词映射）',
            '关键词提取（停用词过滤）',
            '实体提取（政策编号、机构、日期）',
            '保留原始查询（可选）'
        ],
        'use_cases': [
            '提高检索准确性',
            '统一术语表达',
            '优化查询质量',
            '提取结构化信息'
        ],
        'config_example': {
            'operations': [
                'remove_redundant_words',
                'expand_abbreviations',
                'standardize_terms',
                'extract_keywords'
            ],
            'use_nlp': False,
            'preserve_original': True,
            'custom_abbreviations': {
                '发改委': '国家发展和改革委员会'
            },
            'custom_terms': {
                '文件': '政策文件'
            }
        },
        'config_params': [
            {
                'name': 'operations',
                'label': '标准化操作',
                'type': 'List[str]',
                'required': False,
                'default': ['remove_redundant_words', 'expand_abbreviations', 'standardize_terms', 'extract_keywords'],
                'description': '要执行的标准化操作列表，按顺序执行'
            },
            {
                'name': 'use_nlp',
                'label': '使用NLP',
                'type': 'bool',
                'required': False,
                'default': False,
                'description': '是否使用NLP工具进行更高级的标准化'
            },
            {
                'name': 'preserve_original',
                'label': '保留原始查询',
                'type': 'bool',
                'required': False,
                'default': True,
                'description': '是否在context中保留原始查询'
            },
            {
                'name': 'custom_abbreviations',
                'label': '自定义缩写',
                'type': 'Dict[str, str]',
                'required': False,
                'default': {},
                'description': '自定义缩写展开字典（缩写→全称）'
            },
            {
                'name': 'custom_terms',
                'label': '自定义术语',
                'type': 'Dict[str, str]',
                'required': False,
                'default': {},
                'description': '自定义术语标准化字典（原术语→标准术语）'
            }
        ],
        'output_fields': [
            'query_normalization.normalized: 是否进行了标准化',
            'query_normalization.original_query: 原始查询',
            'query_normalization.normalized_query: 标准化后的查询',
            'query_normalization.normalization_steps: 每步操作详情',
            'query_normalization.keywords: 关键词列表',
            'query_normalization.entities: 实体列表（type/value/start/end）'
        ],
        'modifies_input': True,
        'priority': 3,
        'execution_time': '< 5ms',
        'tool_bindings': [
            {
                'tool_id': 'api:nlp:query_normalization',
                'tool_type': 'api',
                'tool_name': 'NLP查询标准化工具',
                'purpose': 'NLP增强的查询标准化，处理复杂语言结构',
                'required': False,
                'config_key': 'use_nlp',
                'binding_status': 'optional'
            }
        ]
    },

    'data_cleaning': {
        'name': '数据清洗',
        'category': 'preprocessing',
        'description': '对输入数据进行清洗、规范化和标准化处理',
        'features': [
            '去除首尾空白',
            '规范化空白符（多个空格→单个空格）',
            '去除特殊字符（可选）',
            '转小写（可选）',
            '外部清洗工具集成（可选）'
        ],
        'use_cases': [
            '统一输入格式',
            '清理复制粘贴的冗余空白',
            '标准化文本编码',
            '预处理脏数据'
        ],
        'config_example': {
            'cleaning_tool': 'text_cleaning_api',
            'normalize': True,
            'remove_special_chars': False,
            'lowercase': False
        },
        'config_params': [
            {
                'name': 'cleaning_tool',
                'label': '清洗工具',
                'type': 'str',
                'required': False,
                'default': None,
                'description': '外部清洗工具名称，None时使用内置清洗'
            },
            {
                'name': 'normalize',
                'label': '规范化空白',
                'type': 'bool',
                'required': False,
                'default': True,
                'description': '是否规范化空白符（多个空格→单个空格，tab→空格等）'
            },
            {
                'name': 'remove_special_chars',
                'label': '移除特殊字符',
                'type': 'bool',
                'required': False,
                'default': False,
                'description': '是否移除特殊字符（保留字母数字和常用标点）'
            },
            {
                'name': 'lowercase',
                'label': '转小写',
                'type': 'bool',
                'required': False,
                'default': False,
                'description': '是否转换为小写'
            },
            {
                'name': 'trim',
                'label': '去除首尾空白',
                'type': 'bool',
                'required': False,
                'default': True,
                'description': '是否去除首尾空白'
            }
        ],
        'output_fields': [
            'data_cleaning.original_length: 原始长度',
            'data_cleaning.cleaned_length: 清洗后长度',
            'data_cleaning.cleaned: 是否成功清洗',
            'data_cleaning.tool: 使用的清洗工具'
        ],
        'modifies_input': True,
        'priority': 1,
        'execution_time': '< 1ms（本地）/ 10-100ms（外部工具）',
        'tool_bindings': [
            {
                'tool_id': 'api:text:cleaning',
                'tool_type': 'api',
                'tool_name': '文本清洗API',
                'purpose': '高级文本清洗服务，支持多语言和特殊格式',
                'required': False,
                'config_key': 'cleaning_tool',
                'binding_status': 'optional'
            }
        ]
    }
}


def get_hook_metadata(hook_id: str) -> dict:
    """获取Hook的详细元数据

    Args:
        hook_id: Hook ID

    Returns:
        Hook元数据字典
    """
    return PRE_HOOKS_METADATA.get(hook_id, {})


def get_all_hooks_metadata() -> dict:
    """获取所有Pre-Hooks的元数据

    Returns:
        所有Hooks的元数据字典
    """
    return PRE_HOOKS_METADATA
