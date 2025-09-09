-- 初始化系统内置元数据模版
-- 迁移日期: 2025-08-21
-- 功能: 创建四种元数据模版（通用、政策、学术、企业）

BEGIN;

-- 1. 通用场景元数据模版 (General Template)
INSERT INTO metadata_templates (
    id,
    name,
    template_type,
    version,
    description,
    schema_definition,
    extraction_config,
    validation_rules,
    display_config,
    search_config,
    is_system,
    is_active
) VALUES (
    'general_v1',
    '通用文档模版',
    'general',
    '1.0',
    '适用于一般文档的元数据模版，包含基础文档属性、内容分类、质量评估等字段',
    '{
        "basic_info": {
            "title": {"type": "string", "required": true, "description": "文档标题"},
            "author": {"type": "string", "required": false, "description": "作者"},
            "language": {"type": "string", "enum": ["zh", "en", "mixed"], "default": "zh", "description": "文档语言"},
            "content_type": {"type": "string", "enum": ["text", "pdf", "docx", "md"], "required": true, "description": "内容类型"}
        },
        "classification": {
            "category": {"type": "string", "required": false, "description": "分类"},
            "tags": {"type": "array", "items": {"type": "string"}, "description": "标签"},
            "keywords": {"type": "array", "items": {"type": "string"}, "description": "关键词"},
            "subject": {"type": "string", "required": false, "description": "主题"}
        },
        "quality_metrics": {
            "credibility": {"type": "number", "minimum": 0, "maximum": 1, "description": "可信度"},
            "timeliness": {"type": "string", "enum": ["current", "recent", "outdated"], "description": "时效性"},
            "completeness": {"type": "number", "minimum": 0, "maximum": 1, "description": "完整性"}
        },
        "usage_stats": {
            "access_count": {"type": "integer", "default": 0, "description": "访问次数"},
            "reference_count": {"type": "integer", "default": 0, "description": "引用次数"},
            "last_accessed": {"type": "string", "format": "date-time", "description": "最后访问时间"}
        }
    }',
    '{
        "auto_extract": ["title", "language", "content_type", "keywords"],
        "llm_extract": ["category", "subject", "tags"],
        "manual_required": ["credibility", "timeliness"]
    }',
    '{
        "required_fields": ["title", "content_type"],
        "field_validations": {
            "credibility": {"min": 0, "max": 1},
            "completeness": {"min": 0, "max": 1}
        }
    }',
    '{
        "priority_fields": ["title", "category", "tags"],
        "hidden_fields": ["access_count"],
        "readonly_fields": ["last_accessed"]
    }',
    '{
        "searchable_fields": ["title", "category", "tags", "keywords"],
        "facet_fields": ["category", "language", "timeliness"]
    }',
    true,
    true
) ON CONFLICT (id) DO NOTHING;

-- 2. 政策问答场景元数据模版 (Policy Template)
INSERT INTO metadata_templates (
    id,
    name,
    template_type,
    version,
    description,
    schema_definition,
    extraction_config,
    validation_rules,
    display_config,
    search_config,
    is_system,
    is_active
) VALUES (
    'policy_v1',
    '政策文档模版',
    'policy',
    '1.0',
    '专门用于政策文档的元数据模版，包含政策编号、发文机关、时效信息等专业字段',
    '{
        "policy_basic": {
            "policy_title": {"type": "string", "required": true, "description": "政策标题"},
            "policy_number": {"type": "string", "required": false, "description": "政策编号"},
            "issuing_authority": {"type": "string", "required": true, "description": "发文机关"},
            "authority_level": {"type": "string", "enum": ["国家级", "省级", "市级", "区县级"], "required": true, "description": "机关层级"}
        },
        "time_info": {
            "publish_date": {"type": "string", "format": "date", "required": true, "description": "发布日期"},
            "effective_date": {"type": "string", "format": "date", "required": true, "description": "生效日期"},
            "expiry_date": {"type": "string", "format": "date", "required": false, "description": "失效日期"},
            "version": {"type": "string", "default": "1.0", "description": "版本号"}
        },
        "scope_info": {
            "geographic_scope": {"type": "array", "items": {"type": "string"}, "description": "适用地区"},
            "applicable_groups": {"type": "array", "items": {"type": "string"}, "description": "适用人群"},
            "industry_scope": {"type": "array", "items": {"type": "string"}, "description": "适用行业"},
            "policy_category": {"type": "string", "enum": ["税收", "社保", "企业", "劳动", "住房", "其他"], "required": true, "description": "政策分类"}
        },
        "relationships": {
            "parent_policies": {"type": "array", "items": {"type": "string"}, "description": "上位政策"},
            "child_policies": {"type": "array", "items": {"type": "string"}, "description": "下位政策"},
            "related_policies": {"type": "array", "items": {"type": "string"}, "description": "相关政策"},
            "superseded_policies": {"type": "array", "items": {"type": "string"}, "description": "被废止政策"}
        },
        "content_structure": {
            "key_points": {"type": "array", "items": {"type": "string"}, "description": "关键要点"},
            "application_conditions": {"type": "array", "items": {"type": "string"}, "description": "适用条件"},
            "procedures": {"type": "array", "items": {"type": "string"}, "description": "办理流程"},
            "required_materials": {"type": "array", "items": {"type": "string"}, "description": "所需材料"}
        }
    }',
    '{
        "auto_extract": ["policy_title", "publish_date"],
        "llm_extract": ["issuing_authority", "policy_category", "key_points", "application_conditions"],
        "manual_required": ["effective_date", "authority_level"],
        "relationship_detection": true
    }',
    '{
        "required_fields": ["policy_title", "issuing_authority", "publish_date", "effective_date", "authority_level", "policy_category"],
        "date_validations": {
            "effective_date_after_publish": true,
            "expiry_date_after_effective": true
        }
    }',
    '{
        "priority_fields": ["policy_title", "policy_number", "issuing_authority", "policy_category"],
        "group_fields": {
            "基本信息": ["policy_title", "policy_number", "issuing_authority"],
            "时间信息": ["publish_date", "effective_date", "expiry_date"],
            "适用范围": ["geographic_scope", "applicable_groups", "industry_scope"]
        }
    }',
    '{
        "searchable_fields": ["policy_title", "policy_number", "issuing_authority", "policy_category"],
        "facet_fields": ["authority_level", "policy_category", "geographic_scope"],
        "time_range_fields": ["publish_date", "effective_date", "expiry_date"]
    }',
    true,
    true
) ON CONFLICT (id) DO NOTHING;

-- 3. 学术领域元数据模版 (Academic Template)
INSERT INTO metadata_templates (
    id,
    name,
    template_type,
    version,
    description,
    schema_definition,
    extraction_config,
    validation_rules,
    display_config,
    search_config,
    is_system,
    is_active
) VALUES (
    'academic_v1',
    '学术论文模版',
    'academic',
    '1.0',
    '专门用于学术论文的元数据模版，包含期刊信息、影响因子、引用关系等学术字段',
    '{
        "publication_info": {
            "paper_title": {"type": "string", "required": true, "description": "论文标题"},
            "authors": {"type": "array", "items": {"type": "string"}, "required": true, "description": "作者列表"},
            "publication_venue": {"type": "string", "required": false, "description": "发表期刊/会议"},
            "publication_type": {"type": "string", "enum": ["journal", "conference", "preprint", "thesis"], "description": "发表类型"},
            "publication_date": {"type": "string", "format": "date", "description": "发表日期"}
        },
        "academic_metrics": {
            "impact_factor": {"type": "number", "minimum": 0, "description": "影响因子"},
            "citation_count": {"type": "integer", "default": 0, "description": "引用次数"},
            "h_index": {"type": "number", "minimum": 0, "description": "H指数"},
            "peer_review_status": {"type": "string", "enum": ["peer-reviewed", "not-peer-reviewed", "unknown"], "description": "同行评议状态"}
        },
        "research_info": {
            "research_field": {"type": "array", "items": {"type": "string"}, "description": "研究领域"},
            "methodology": {"type": "array", "items": {"type": "string"}, "description": "研究方法"},
            "keywords": {"type": "array", "items": {"type": "string"}, "description": "关键词"},
            "abstract": {"type": "string", "description": "摘要"},
            "research_type": {"type": "string", "enum": ["theoretical", "experimental", "survey", "review"], "description": "研究类型"}
        },
        "references": {
            "reference_count": {"type": "integer", "default": 0, "description": "参考文献数量"},
            "key_references": {"type": "array", "items": {"type": "string"}, "description": "重要参考文献"},
            "cited_by": {"type": "array", "items": {"type": "string"}, "description": "被引用列表"}
        },
        "content_analysis": {
            "novelty_score": {"type": "number", "minimum": 0, "maximum": 1, "description": "新颖性评分"},
            "technical_depth": {"type": "string", "enum": ["basic", "intermediate", "advanced"], "description": "技术深度"},
            "practical_applicability": {"type": "number", "minimum": 0, "maximum": 1, "description": "实用性"}
        }
    }',
    '{
        "auto_extract": ["paper_title", "authors", "publication_date", "keywords", "abstract"],
        "llm_extract": ["research_field", "methodology", "research_type", "technical_depth"],
        "external_api": ["citation_count", "impact_factor"],
        "manual_required": ["peer_review_status", "novelty_score"]
    }',
    '{
        "required_fields": ["paper_title", "authors"],
        "field_validations": {
            "novelty_score": {"min": 0, "max": 1},
            "practical_applicability": {"min": 0, "max": 1},
            "citation_count": {"min": 0}
        }
    }',
    '{
        "priority_fields": ["paper_title", "authors", "publication_venue", "research_field"],
        "group_fields": {
            "发表信息": ["paper_title", "authors", "publication_venue", "publication_date"],
            "学术指标": ["impact_factor", "citation_count", "h_index"],
            "研究信息": ["research_field", "methodology", "research_type"]
        }
    }',
    '{
        "searchable_fields": ["paper_title", "authors", "research_field", "keywords"],
        "facet_fields": ["publication_type", "research_type", "technical_depth"],
        "numeric_range_fields": ["impact_factor", "citation_count"]
    }',
    true,
    true
) ON CONFLICT (id) DO NOTHING;

-- 4. 企业场景元数据模版 (Enterprise Template)
INSERT INTO metadata_templates (
    id,
    name,
    template_type,
    version,
    description,
    schema_definition,
    extraction_config,
    validation_rules,
    display_config,
    search_config,
    is_system,
    is_active
) VALUES (
    'enterprise_v1',
    '企业文档模版',
    'enterprise',
    '1.0',
    '专门用于企业内部文档的元数据模版，包含部门信息、权限控制、版本管理等企业字段',
    '{
        "business_info": {
            "document_title": {"type": "string", "required": true, "description": "文档标题"},
            "department": {"type": "string", "required": true, "description": "所属部门"},
            "business_line": {"type": "string", "required": false, "description": "业务线"},
            "project_code": {"type": "string", "required": false, "description": "项目编码"},
            "document_type": {"type": "string", "enum": ["policy", "procedure", "report", "manual", "specification"], "description": "文档类型"}
        },
        "access_control": {
            "confidentiality_level": {"type": "string", "enum": ["public", "internal", "confidential", "secret"], "required": true, "description": "保密级别"},
            "access_permissions": {"type": "array", "items": {"type": "string"}, "description": "访问权限"},
            "approval_status": {"type": "string", "enum": ["draft", "review", "approved", "archived"], "default": "draft", "description": "审批状态"},
            "data_classification": {"type": "string", "enum": ["general", "sensitive", "restricted"], "description": "数据分类"}
        },
        "version_control": {
            "version_number": {"type": "string", "required": true, "description": "版本号"},
            "revision_history": {"type": "array", "items": {"type": "object"}, "description": "修订历史"},
            "responsible_person": {"type": "string", "required": true, "description": "负责人"},
            "reviewer": {"type": "string", "required": false, "description": "审核人"},
            "approver": {"type": "string", "required": false, "description": "批准人"}
        },
        "business_context": {
            "process_stage": {"type": "string", "required": false, "description": "流程阶段"},
            "kpi_relevance": {"type": "array", "items": {"type": "string"}, "description": "关联KPI"},
            "compliance_requirements": {"type": "array", "items": {"type": "string"}, "description": "合规要求"},
            "business_impact": {"type": "string", "enum": ["low", "medium", "high", "critical"], "description": "业务影响"}
        },
        "lifecycle_management": {
            "review_cycle": {"type": "string", "enum": ["monthly", "quarterly", "annually"], "description": "审查周期"},
            "next_review_date": {"type": "string", "format": "date", "description": "下次审查日期"},
            "retention_period": {"type": "string", "description": "保存期限"},
            "disposal_method": {"type": "string", "enum": ["archive", "delete", "transfer"], "description": "处置方式"}
        }
    }',
    '{
        "auto_extract": ["document_title", "version_number"],
        "user_input": ["department", "confidentiality_level", "responsible_person"],
        "llm_extract": ["document_type", "business_impact", "compliance_requirements"],
        "workflow_integration": ["approval_status", "reviewer", "approver"],
        "manual_required": ["access_permissions", "review_cycle"]
    }',
    '{
        "required_fields": ["document_title", "department", "confidentiality_level", "version_number", "responsible_person"],
        "workflow_validations": {
            "approval_required_for_confidential": true,
            "reviewer_required_for_approved": true
        }
    }',
    '{
        "priority_fields": ["document_title", "department", "confidentiality_level", "approval_status"],
        "group_fields": {
            "基本信息": ["document_title", "department", "business_line", "document_type"],
            "权限控制": ["confidentiality_level", "access_permissions", "approval_status"],
            "版本管理": ["version_number", "responsible_person", "reviewer", "approver"]
        },
        "conditional_fields": {
            "confidential_show": ["access_permissions"],
            "approved_show": ["reviewer", "approver"]
        }
    }',
    '{
        "searchable_fields": ["document_title", "department", "business_line", "responsible_person"],
        "facet_fields": ["department", "confidentiality_level", "approval_status", "document_type"],
        "permission_filtered": true
    }',
    true,
    true
) ON CONFLICT (id) DO NOTHING;

COMMIT;

-- 初始化完成日志
-- 本迁移完成了以下功能:
-- 1. 创建了四种系统内置元数据模版
-- 2. 每种模版包含完整的JSON Schema定义
-- 3. 配置了自动提取、验证规则、显示配置等
-- 4. 所有模版都标记为系统模版且默认激活