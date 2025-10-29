"""
Post-Hooks详细元数据定义

为每个Post-Hook提供详细的功能说明、使用场景、配置示例等信息
用于前端展示和文档生成
"""

POST_HOOKS_METADATA = {
    'output_validation': {
        'name': '输出验证',
        'category': 'validation',
        'description': '验证输出的格式、长度和内容合规性',
        'features': [
            '空输出检查',
            '长度验证',
            '格式验证',
            '内容质量检查'
        ],
        'use_cases': [
            '确保输出符合业务规则',
            '防止低质量输出',
            '保证输出格式正确'
        ],
        'config_example': {
            'min_length': 10,
            'max_length': 5000
        },
        'config_params': [
            {
                'name': 'min_length',
                'label': '最小长度',
                'type': 'int',
                'required': False,
                'default': 10,
                'description': '输出最小长度（字符数）'
            },
            {
                'name': 'max_length',
                'label': '最大长度',
                'type': 'int',
                'required': False,
                'default': 5000,
                'description': '输出最大长度（字符数）'
            }
        ],
        'priority': 50,
        'execution_time': '< 1ms'
    },

    'desensitization': {
        'name': '输出脱敏',
        'category': 'security',
        'description': '对输出中的敏感信息进行脱敏处理',
        'features': [
            '手机号脱敏',
            '身份证号脱敏',
            '邮箱脱敏',
            '自定义敏感词脱敏'
        ],
        'use_cases': [
            '保护用户隐私',
            '合规性要求',
            '安全审计'
        ],
        'config_example': {
            'mask_phone': True,
            'mask_id_card': True,
            'mask_email': True
        },
        'config_params': [
            {
                'name': 'mask_phone',
                'label': '脱敏手机号',
                'type': 'bool',
                'required': False,
                'default': True,
                'description': '是否脱敏手机号'
            },
            {
                'name': 'mask_id_card',
                'label': '脱敏身份证号',
                'type': 'bool',
                'required': False,
                'default': True,
                'description': '是否脱敏身份证号'
            },
            {
                'name': 'mask_email',
                'label': '脱敏邮箱',
                'type': 'bool',
                'required': False,
                'default': True,
                'description': '是否脱敏邮箱地址'
            }
        ],
        'priority': 45,
        'execution_time': '< 5ms'
    },

    'policy_citation_enhancement': {
        'name': '政策引用增强',
        'category': 'enhancement',
        'description': '增强政策文档的引用格式和链接',
        'features': [
            '政策编号识别',
            '政策链接生成',
            '引用格式规范化',
            '政策元数据补充'
        ],
        'use_cases': [
            '提升政策问答专业性',
            '提供可验证的政策来源',
            '增强用户体验'
        ],
        'config_example': {
            'add_links': True,
            'format_citations': True
        },
        'config_params': [
            {
                'name': 'add_links',
                'label': '添加链接',
                'type': 'bool',
                'required': False,
                'default': True,
                'description': '是否为政策添加链接'
            },
            {
                'name': 'format_citations',
                'label': '格式化引用',
                'type': 'bool',
                'required': False,
                'default': True,
                'description': '是否格式化引用格式'
            }
        ],
        'priority': 40,
        'execution_time': '< 10ms'
    },

    'policy_metadata_renderer': {
        'name': '政策元数据表格渲染',
        'category': 'enhancement',
        'description': '在回答前渲染检索到的政策文档元数据（markdown表格）',
        'features': [
            '自动提取文档元数据（索引号、文号、发布机构、发布日期等）',
            'Markdown表格格式化',
            '支持多个文档渲染',
            '空字段智能处理',
            '爬虫元数据自动识别'
        ],
        'use_cases': [
            '政策问答场景，在回答前展示政策文档关键信息',
            '政策检索结果元数据可视化',
            '提供政策文档完整上下文',
            '便于用户快速了解政策文档基本信息'
        ],
        'config_example': {
            'enabled': True,
            'max_documents': 5,
            'show_empty_fields': False,
            'table_style': 'compact'
        },
        'config_params': [
            {
                'name': 'enabled',
                'label': '启用渲染',
                'type': 'bool',
                'required': False,
                'default': True,
                'description': '是否启用元数据渲染功能'
            },
            {
                'name': 'max_documents',
                'label': '最大文档数',
                'type': 'int',
                'required': False,
                'default': 5,
                'description': '最多渲染几个文档的元数据'
            },
            {
                'name': 'show_empty_fields',
                'label': '显示空字段',
                'type': 'bool',
                'required': False,
                'default': False,
                'description': '是否显示值为空的字段'
            },
            {
                'name': 'table_style',
                'label': '表格样式',
                'type': 'str',
                'required': False,
                'default': 'compact',
                'description': '表格样式：compact(紧凑型两列表格) / full(展开型每行一个字段)'
            }
        ],
        'output_fields': [
            'metadata_rendered: 是否成功渲染元数据表格'
        ],
        'priority': 35,
        'execution_time': '< 5ms',
        'metadata_fields': [
            '索引号 (index_number)',
            '信息分类 (category)',
            '发布机构 (issuing_agency)',
            '生成日期 (issue_date)',
            '文号 (document_number)',
            '是否有效 (is_valid)',
            '政策名称 (title/policy_name)'
        ],
        'tool_bindings': []
    }
}


def get_post_hook_metadata(hook_id: str) -> dict:
    """获取Post-Hook的详细元数据

    Args:
        hook_id: Hook ID

    Returns:
        Hook元数据字典
    """
    return POST_HOOKS_METADATA.get(hook_id, {})


def get_all_post_hooks_metadata() -> dict:
    """获取所有Post-Hooks的元数据

    Returns:
        所有Post-Hooks的元数据字典
    """
    return POST_HOOKS_METADATA
