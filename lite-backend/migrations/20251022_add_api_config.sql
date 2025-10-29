-- 添加API配置字段到custom_crawler_tools表

-- 1. 添加api_config字段
ALTER TABLE custom_crawler_tools
ADD COLUMN IF NOT EXISTS api_config JSONB DEFAULT NULL;

-- 2. 添加use_api字段标记是否使用API方式
ALTER TABLE custom_crawler_tools
ADD COLUMN IF NOT EXISTS use_api BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN custom_crawler_tools.api_config IS 'API配置（当use_api=true时使用）';
COMMENT ON COLUMN custom_crawler_tools.use_api IS '是否使用API调用方式而非HTML爬取';

-- 示例：更新六盘水工具配置为使用API方式
UPDATE custom_crawler_tools
SET
    use_api = TRUE,
    api_config = jsonb_build_object(
        'api_url', 'https://www.gzlps.gov.cn/irs/front/search',
        'method', 'POST',
        'params_template', jsonb_build_object(
            'tenantId', '{tenantId}',
            'dataTypeId', '{dataTypeId}',
            'searchWord', '{keyword}',
            'orderBy', '{orderBy}',
            'searchBy', '{searchBy}',
            'configTenantId', '',
            'tenantIds', '',
            'appendixType', '',
            'granularity', 'ALL',
            'beginDateTime', '',
            'endDateTime', '',
            'isSearchForced', 0,
            'filters', '[]'::jsonb,
            'pageNo', 1,
            'pageSize', 20
        ),
        'response_path', jsonb_build_object(
            'success_field', 'success',
            'data_field', 'data.middle.list',
            'total_field', 'data.pager.total',
            'mapping', jsonb_build_object(
                'title', 'title_no_tag',
                'link', 'url',
                'content', 'content',
                'date', 'time',
                'source', 'source'
            )
        )
    ),
    parse_config = jsonb_set(
        parse_config,
        '{use_js_render}',
        'false'::jsonb
    )
WHERE name = '六盘水政府政策搜索';
