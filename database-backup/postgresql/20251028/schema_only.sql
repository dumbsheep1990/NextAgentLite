--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Postgres.app)
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: generate_qa_dataset_filename(text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_qa_dataset_filename(document_filename text, extraction_time timestamp with time zone DEFAULT now()) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
    base_name TEXT;
    extension TEXT;
BEGIN
    -- 提取文件名和扩展名
    base_name := regexp_replace(COALESCE(document_filename, 'unknown'), '\.[^.]*$', '');
    extension := '.json'; -- 自动提取的QA数据集使用JSON格式
    
    RETURN CONCAT(
        base_name,
        '_',
        TO_CHAR(extraction_time, 'YYYYMMDD_HH24MISS'),
        '_qa',
        extension
    );
END;
$_$;


--
-- Name: generate_qa_dataset_title(text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_qa_dataset_title(document_title text, extraction_time timestamp with time zone DEFAULT now()) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN CONCAT(
        COALESCE(document_title, 'unknown_document'),
        '_',
        TO_CHAR(extraction_time, 'YYYYMMDD_HH24MISS'),
        '_qa'
    );
END;
$$;


--
-- Name: update_custom_crawler_tools_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_custom_crawler_tools_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_custom_hooks_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_custom_hooks_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_deepscrape_configs_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_deepscrape_configs_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_hook_pipelines_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_hook_pipelines_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_qa_generation_configs_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_qa_generation_configs_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_unla_router_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_unla_router_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agent_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_configs (
    id character varying(36) NOT NULL,
    agent_name character varying(100) NOT NULL,
    team_name character varying(100),
    model_provider character varying(50),
    model_id character varying(100),
    temperature double precision,
    max_tokens integer,
    top_p double precision,
    frequency_penalty double precision,
    presence_penalty double precision,
    extra_config text,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: agent_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid,
    session_id character varying(100),
    query text NOT NULL,
    response text,
    status character varying(20) DEFAULT 'running'::character varying,
    execution_time_ms integer,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp with time zone,
    created_by integer,
    CONSTRAINT agent_executions_status_check CHECK (((status)::text = ANY ((ARRAY['running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: agent_template_tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_template_tools (
    id character varying(36) DEFAULT (gen_random_uuid())::character varying NOT NULL,
    template_id character varying(36) NOT NULL,
    tool_id character varying(36) NOT NULL,
    is_required boolean DEFAULT false,
    default_config jsonb
);


--
-- Name: agent_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_templates (
    id character varying(36) DEFAULT (gen_random_uuid())::character varying NOT NULL,
    template_code character varying(100) NOT NULL,
    template_name character varying(200) NOT NULL,
    template_type character varying(20) NOT NULL,
    category character varying(50),
    description text,
    icon character varying(50) DEFAULT 'RobotOutlined'::character varying,
    color character varying(20) DEFAULT '#1890ff'::character varying,
    base_config jsonb NOT NULL,
    model_config jsonb,
    tools_config jsonb DEFAULT '{}'::jsonb,
    team_members jsonb,
    team_mode character varying(50),
    is_system boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying GENERATED ALWAYS AS (template_name) STORED,
    kind character varying GENERATED ALWAYS AS (template_type) STORED,
    CONSTRAINT agent_templates_template_type_check CHECK (((template_type)::text = ANY ((ARRAY['single'::character varying, 'team'::character varying])::text[])))
);


--
-- Name: agent_tool_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_tool_runs (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    agent_name text,
    mode text,
    prompt text,
    selected_tools jsonb,
    model_id text,
    model_provider text,
    status text,
    output text,
    error text,
    debug_logs text,
    manual_run jsonb
);


--
-- Name: agent_tool_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_tool_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_tool_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_tool_runs_id_seq OWNED BY public.agent_tool_runs.id;


--
-- Name: agent_tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_tools (
    id character varying(36) DEFAULT (gen_random_uuid())::character varying NOT NULL,
    tool_code character varying(100) NOT NULL,
    tool_name character varying(200) NOT NULL,
    tool_type character varying(50) NOT NULL,
    description text,
    config_schema jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: api_tool_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_tool_catalog (
    id bigint NOT NULL,
    config_name character varying(128),
    name character varying(256),
    method character varying(16),
    endpoint character varying(512),
    headers text,
    updated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: api_tool_catalog_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_tool_catalog_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_tool_catalog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_tool_catalog_id_seq OWNED BY public.api_tool_catalog.id;


--
-- Name: cache_tool; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_tool (
    id integer NOT NULL,
    function character varying,
    args character varying,
    kwargs character varying,
    result json,
    cache_key character varying,
    "timestamp" double precision,
    datetime character varying,
    execution_time double precision
);


--
-- Name: cache_tool_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cache_tool_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cache_tool_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cache_tool_id_seq OWNED BY public.cache_tool.id;


--
-- Name: chunking_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chunking_configs (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    chunk_overlap integer DEFAULT 200 NOT NULL,
    strategy character varying(50) DEFAULT 'semantic'::character varying NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    chunk_token_num integer DEFAULT 400 NOT NULL,
    max_token_num integer DEFAULT 512 NOT NULL,
    delimiter character varying(50) DEFAULT '!?。！？'::character varying NOT NULL,
    tokenizer_type character varying(20) DEFAULT 'simple'::character varying NOT NULL,
    preserve_structure boolean DEFAULT true NOT NULL,
    semantic_threshold integer DEFAULT 30 NOT NULL,
    supported_formats jsonb,
    is_active boolean DEFAULT true NOT NULL,
    scope character varying(20) DEFAULT 'global'::character varying,
    collection_id character varying(50)
);


--
-- Name: conversation_message_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_message_reactions (
    id integer NOT NULL,
    session_id character varying(100) NOT NULL,
    conversation_id integer,
    message_id integer,
    message_type character varying(10),
    content text NOT NULL,
    mark character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: conversation_message_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversation_message_reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_message_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversation_message_reactions_id_seq OWNED BY public.conversation_message_reactions.id;


--
-- Name: conversation_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_messages (
    id integer NOT NULL,
    conversation_id integer,
    message_type character varying(10) NOT NULL,
    content text NOT NULL,
    confidence real,
    sources jsonb,
    images jsonb,
    tables jsonb,
    highlights jsonb,
    processing_time real,
    model_used character varying(100),
    tokens_used integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    agent_id character varying(100),
    agent_name character varying(200),
    thinking json,
    knowledge_sources json,
    is_team_message boolean DEFAULT false,
    team_info jsonb,
    thinking_process jsonb,
    graph_sources jsonb
);


--
-- Name: conversation_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversation_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversation_messages_id_seq OWNED BY public.conversation_messages.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    session_id character varying(100) NOT NULL,
    title character varying(200),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    conversation_type character varying(10) DEFAULT 'single'::character varying,
    team_name character varying(100),
    team_mode character varying(20),
    user_id integer
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: crawl_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crawl_results (
    id integer NOT NULL,
    task_id character varying(50) NOT NULL,
    url text NOT NULL,
    status character varying(20) NOT NULL,
    title text,
    content text,
    summary text,
    extracted_metadata jsonb,
    content_hash character varying(64),
    file_path text,
    file_size integer,
    document_id character varying(50),
    success boolean DEFAULT true NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: crawl_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crawl_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: crawl_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crawl_results_id_seq OWNED BY public.crawl_results.id;


--
-- Name: crawl_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crawl_tasks (
    id integer NOT NULL,
    task_id character varying(50) NOT NULL,
    urls text[] NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    engine character varying(20) DEFAULT 'deepscrape'::character varying NOT NULL,
    options jsonb,
    progress integer DEFAULT 0,
    total_urls integer NOT NULL,
    successful_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    error_message text
);


--
-- Name: crawl_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crawl_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: crawl_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crawl_tasks_id_seq OWNED BY public.crawl_tasks.id;


--
-- Name: custom_crawler_tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_crawler_tools (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    base_url text NOT NULL,
    url_template text NOT NULL,
    method character varying(10) DEFAULT 'GET'::character varying,
    headers jsonb DEFAULT '{}'::jsonb,
    params_mapping jsonb NOT NULL,
    selector_config jsonb NOT NULL,
    parse_config jsonb DEFAULT '{}'::jsonb,
    enabled boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    api_config jsonb,
    use_api boolean DEFAULT false,
    CONSTRAINT chk_method CHECK (((method)::text = ANY ((ARRAY['GET'::character varying, 'POST'::character varying])::text[])))
);


--
-- Name: TABLE custom_crawler_tools; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.custom_crawler_tools IS '自定义爬虫工具配置表';


--
-- Name: COLUMN custom_crawler_tools.params_mapping; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.custom_crawler_tools.params_mapping IS 'URL参数映射配置，定义如何将用户输入映射到URL参数';


--
-- Name: COLUMN custom_crawler_tools.selector_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.custom_crawler_tools.selector_config IS 'CSS选择器配置，用于提取网页内容';


--
-- Name: COLUMN custom_crawler_tools.parse_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.custom_crawler_tools.parse_config IS '解析配置，控制爬取行为和内容提取策略';


--
-- Name: custom_crawler_tools_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.custom_crawler_tools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: custom_crawler_tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.custom_crawler_tools_id_seq OWNED BY public.custom_crawler_tools.id;


--
-- Name: custom_hook_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_hook_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hook_id character varying(100) NOT NULL,
    execution_id uuid NOT NULL,
    pipeline_id uuid,
    agent_id uuid,
    user_id uuid,
    session_id character varying(200),
    status character varying(20) NOT NULL,
    execution_order integer,
    tool_calls jsonb DEFAULT '[]'::jsonb,
    execution_time_ms integer,
    total_tool_calls integer DEFAULT 0,
    successful_tool_calls integer DEFAULT 0,
    failed_tool_calls integer DEFAULT 0,
    error_message text,
    error_stack text,
    input_snapshot jsonb,
    output_snapshot jsonb,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE custom_hook_executions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.custom_hook_executions IS 'Hook执行日志表';


--
-- Name: custom_hook_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_hook_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hook_id character varying(100) NOT NULL,
    version integer NOT NULL,
    config_snapshot jsonb NOT NULL,
    version_description text,
    is_published boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE custom_hook_versions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.custom_hook_versions IS 'Hook版本管理表';


--
-- Name: custom_hooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_hooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hook_id character varying(100) NOT NULL,
    hook_name character varying(200) NOT NULL,
    hook_type character varying(10) NOT NULL,
    description text,
    category character varying(50),
    created_by uuid,
    organization_id uuid,
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 0,
    execution_mode character varying(20) DEFAULT 'sequential'::character varying,
    timeout_ms integer DEFAULT 5000,
    max_retries integer DEFAULT 0,
    tool_bindings jsonb DEFAULT '[]'::jsonb,
    input_schema jsonb,
    output_schema jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    tags text[],
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT custom_hooks_hook_id_check CHECK ((char_length((hook_id)::text) >= 3)),
    CONSTRAINT custom_hooks_hook_type_check CHECK (((hook_type)::text = ANY ((ARRAY['pre'::character varying, 'post'::character varying])::text[])))
);


--
-- Name: TABLE custom_hooks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.custom_hooks IS '自定义Hook定义表';


--
-- Name: COLUMN custom_hooks.hook_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.custom_hooks.hook_id IS 'Hook唯一标识';


--
-- Name: COLUMN custom_hooks.execution_mode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.custom_hooks.execution_mode IS '执行模式：sequential(顺序)/parallel(并行)';


--
-- Name: COLUMN custom_hooks.tool_bindings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.custom_hooks.tool_bindings IS '工具绑定配置（JSON数组）';


--
-- Name: custom_tool_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_tool_executions (
    id integer NOT NULL,
    tool_id integer NOT NULL,
    user_id integer,
    query_keyword character varying(500) NOT NULL,
    execution_status character varying(50) DEFAULT 'pending'::character varying,
    results_count integer DEFAULT 0,
    results jsonb,
    error_message text,
    execution_time double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    CONSTRAINT chk_status CHECK (((execution_status)::text = ANY ((ARRAY['pending'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: TABLE custom_tool_executions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.custom_tool_executions IS '自定义工具执行历史记录表';


--
-- Name: custom_tool_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.custom_tool_executions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: custom_tool_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.custom_tool_executions_id_seq OWNED BY public.custom_tool_executions.id;


--
-- Name: data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data (
    id integer NOT NULL,
    dataset character varying NOT NULL,
    index integer,
    source character varying NOT NULL,
    source_index integer,
    question character varying NOT NULL,
    answer character varying,
    topic character varying,
    level integer,
    file_name character varying,
    meta json
);


--
-- Name: data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.data_id_seq OWNED BY public.data.id;


--
-- Name: deepscrape_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deepscrape_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    config_name character varying(200) DEFAULT 'default'::character varying,
    llm_enabled boolean DEFAULT false,
    llm_provider character varying(50) DEFAULT 'openai'::character varying,
    llm_model character varying(200),
    llm_temperature numeric(3,2) DEFAULT 0.2,
    llm_max_tokens integer DEFAULT 4000,
    llm_timeout integer DEFAULT 120000,
    llm_max_retries integer DEFAULT 3,
    llm_extraction_type character varying(50) DEFAULT 'summary'::character varying,
    llm_prompt_format character varying(50) DEFAULT 'zero-shot'::character varying,
    cleaning_remove_ads boolean DEFAULT true,
    cleaning_remove_tracking boolean DEFAULT true,
    cleaning_remove_scripts boolean DEFAULT true,
    cleaning_remove_hidden_elements boolean DEFAULT true,
    cleaning_remove_social_buttons boolean DEFAULT true,
    cleaning_remove_comments boolean DEFAULT true,
    cleaning_remove_popups boolean DEFAULT true,
    scraping_timeout integer DEFAULT 30000,
    scraping_block_ads boolean DEFAULT true,
    scraping_block_resources boolean DEFAULT true,
    scraping_user_agent text,
    scraping_javascript boolean DEFAULT true,
    scraping_full_page boolean DEFAULT false,
    scraping_extractor_format character varying(20) DEFAULT 'markdown'::character varying,
    batch_enabled boolean DEFAULT true,
    batch_concurrency integer DEFAULT 3,
    batch_max_concurrent_jobs integer DEFAULT 5,
    extended_config jsonb DEFAULT '{}'::jsonb,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_temperature CHECK (((llm_temperature >= (0)::numeric) AND (llm_temperature <= (2)::numeric)))
);


--
-- Name: TABLE deepscrape_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.deepscrape_configs IS 'DeepScrape爬虫服务全局配置表';


--
-- Name: COLUMN deepscrape_configs.llm_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deepscrape_configs.llm_enabled IS '是否启用LLM智能处理';


--
-- Name: COLUMN deepscrape_configs.llm_provider; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deepscrape_configs.llm_provider IS 'LLM提供商：openai, vllm, ollama, localai, litellm, custom';


--
-- Name: COLUMN deepscrape_configs.llm_extraction_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deepscrape_configs.llm_extraction_type IS '提取模式：structured, summary, qa';


--
-- Name: COLUMN deepscrape_configs.scraping_extractor_format; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deepscrape_configs.scraping_extractor_format IS '输出格式：html, markdown, text';


--
-- Name: COLUMN deepscrape_configs.extended_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deepscrape_configs.extended_config IS '扩展配置JSON，用于存储其他自定义配置';


--
-- Name: COLUMN deepscrape_configs.is_default; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deepscrape_configs.is_default IS '是否为用户的默认配置';


--
-- Name: document_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_categories (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(200),
    description text,
    parent_id character varying(50),
    level integer,
    path character varying(500),
    storage_prefix character varying(200),
    retention_policy jsonb,
    importance_level character varying(20),
    is_active boolean DEFAULT true,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


--
-- Name: document_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_chunks (
    id character varying(50) NOT NULL,
    document_id character varying(50),
    content text NOT NULL,
    chunk_index integer NOT NULL,
    embedding jsonb,
    embedding_model character varying(100),
    chunk_metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    general_embedding json,
    domain_embedding json,
    general_model character varying(100),
    domain_model character varying(100),
    vectorization_strategy character varying(20),
    general_embedding_vec public.vector(1024)
);


--
-- Name: knowledge_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_documents (
    id character varying(50) NOT NULL,
    title character varying(500) NOT NULL,
    filename character varying(500) NOT NULL,
    file_type character varying(50) NOT NULL,
    file_size integer NOT NULL,
    status character varying(20) DEFAULT 'uploaded'::character varying NOT NULL,
    tags jsonb,
    document_metadata jsonb,
    vector_status jsonb,
    file_path character varying(1000),
    upload_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    collection_id character varying(255),
    metadata_template_id character varying(50),
    structured_metadata jsonb,
    metadata_extraction_status character varying(20) DEFAULT 'pending'::character varying,
    metadata_extraction_log jsonb,
    document_category character varying(100),
    domain_type character varying(50),
    effective_date timestamp with time zone,
    expiry_date timestamp with time zone,
    folder_id character varying(255),
    folder_path text,
    auto_qa_extraction_enabled boolean DEFAULT false,
    qa_extraction_status character varying(20) DEFAULT 'pending'::character varying,
    qa_extraction_task_id character varying(50),
    qa_dataset_id character varying(50),
    qa_extraction_config jsonb,
    qa_extraction_started_at timestamp with time zone,
    qa_extraction_completed_at timestamp with time zone,
    qa_extraction_error_message text,
    source_url character varying(2000),
    scrape_method character varying(50),
    scrape_metadata jsonb,
    content_hash character varying(64),
    CONSTRAINT chk_url_document_has_source CHECK (((((file_type)::text = 'url'::text) AND (source_url IS NOT NULL)) OR ((file_type)::text <> 'url'::text)))
);


--
-- Name: qa_datasets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_datasets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    file_path character varying(500),
    file_name character varying(255),
    file_size integer,
    file_hash character varying(64),
    status character varying(20) DEFAULT 'pending'::character varying,
    total_qa_pairs integer DEFAULT 0,
    processed_qa_pairs integer DEFAULT 0,
    categories_count integer DEFAULT 0,
    vectorization_status character varying(20) DEFAULT 'pending'::character varying,
    vector_model character varying(100),
    dataset_metadata jsonb,
    processing_logs jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp with time zone,
    collection_id character varying,
    data_source_type character varying(20) DEFAULT 'manual_upload'::character varying,
    source_document_id character varying(50),
    extraction_task_id uuid,
    extraction_config jsonb,
    extraction_method character varying(50) DEFAULT 'GC-QA-RAG'::character varying,
    extraction_model character varying(100),
    extraction_started_at timestamp with time zone,
    extraction_completed_at timestamp with time zone,
    extraction_duration_seconds integer,
    extraction_error_message text,
    CONSTRAINT qa_datasets_data_source_type_check CHECK (((data_source_type)::text = ANY ((ARRAY['manual_upload'::character varying, 'auto_extraction'::character varying])::text[])))
);


--
-- Name: qa_extraction_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_extraction_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    priority integer DEFAULT 5,
    config jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    error_message text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    worker_id uuid,
    auto_create_dataset boolean DEFAULT true,
    dataset_naming_pattern character varying(255),
    target_dataset_id uuid,
    qa_pairs_extracted integer DEFAULT 0,
    extraction_method character varying(50) DEFAULT 'GC-QA-RAG'::character varying,
    extraction_model character varying(100)
);


--
-- Name: enhanced_qa_datasets_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.enhanced_qa_datasets_view AS
 SELECT qd.id,
    qd.title,
    qd.description,
    qd.category,
    qd.file_name,
    qd.file_path,
    qd.file_size,
    qd.status,
    qd.vectorization_status,
    qd.total_qa_pairs,
    qd.processed_qa_pairs,
    qd.categories_count,
    qd.vector_model,
    qd.dataset_metadata,
    qd.processing_logs,
    qd.collection_id,
    qd.created_at,
    qd.updated_at,
    qd.processed_at,
    qd.data_source_type,
    qd.source_document_id,
    qd.extraction_task_id,
    qd.extraction_config,
    qd.extraction_method,
    qd.extraction_model,
    qd.extraction_started_at,
    qd.extraction_completed_at,
    qd.extraction_duration_seconds,
    qd.extraction_error_message,
    kd.title AS source_document_title,
    kd.filename AS source_document_filename,
    kd.file_type AS source_document_type,
    qeq.status AS extraction_task_status,
    qeq.priority AS extraction_priority,
    qeq.retry_count AS extraction_retry_count,
        CASE
            WHEN ((qd.extraction_started_at IS NOT NULL) AND (qd.extraction_completed_at IS NOT NULL)) THEN (EXTRACT(epoch FROM (qd.extraction_completed_at - qd.extraction_started_at)))::integer
            ELSE qd.extraction_duration_seconds
        END AS calculated_duration_seconds,
        CASE
            WHEN ((qd.data_source_type)::text = 'auto_extraction'::text) THEN COALESCE(qd.title, (concat(kd.title, '_', to_char(qd.created_at, 'YYYYMMDD_HH24MISS'::text), '_qa'))::character varying)
            ELSE qd.title
        END AS display_title
   FROM ((public.qa_datasets qd
     LEFT JOIN public.knowledge_documents kd ON (((qd.source_document_id)::text = (kd.id)::text)))
     LEFT JOIN public.qa_extraction_queue qeq ON ((qd.extraction_task_id = qeq.id)))
  ORDER BY qd.created_at DESC;


--
-- Name: qa_pairs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_pairs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dataset_id uuid NOT NULL,
    category_id uuid,
    question text NOT NULL,
    answer text NOT NULL,
    question_hash character varying(64),
    answer_hash character varying(64),
    metadata jsonb,
    tags text[],
    confidence_score real,
    difficulty_level character varying(20),
    source_line_number integer,
    qa_type character varying(50) DEFAULT 'general'::character varying,
    language character varying(10) DEFAULT 'zh'::character varying,
    vectorized boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    category character varying(100),
    row_number integer,
    source_sheet character varying(100),
    question_vector_id character varying(255),
    vector_status character varying(20) DEFAULT 'pending'::character varying,
    quality_score integer,
    is_validated boolean DEFAULT false,
    validation_notes text,
    usage_count integer DEFAULT 0,
    last_used_at timestamp with time zone,
    qa_metadata jsonb,
    data_source_type character varying(20) DEFAULT 'manual_upload'::character varying,
    source_document_id character varying(50),
    extraction_task_id uuid,
    source_chunk text,
    summary text,
    chunk_index integer,
    extraction_confidence real,
    extraction_method character varying(50) DEFAULT 'GC-QA-RAG'::character varying,
    CONSTRAINT qa_pairs_data_source_type_check CHECK (((data_source_type)::text = ANY ((ARRAY['manual_upload'::character varying, 'auto_extraction'::character varying])::text[])))
);


--
-- Name: enhanced_qa_pairs_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.enhanced_qa_pairs_view AS
 SELECT qp.id,
    qp.dataset_id,
    qp.category_id,
    qp.question,
    qp.answer,
    qp.question_hash,
    qp.answer_hash,
    qp.metadata,
    qp.tags,
    qp.confidence_score,
    qp.difficulty_level,
    qp.source_line_number,
    qp.qa_type,
    qp.language,
    qp.vectorized,
    qp.vector_status,
    qp.quality_score,
    qp.is_validated,
    qp.validation_notes,
    qp.usage_count,
    qp.last_used_at,
    qp.qa_metadata,
    qp.created_at,
    qp.updated_at,
    qp.data_source_type,
    qp.source_document_id,
    qp.extraction_task_id,
    qp.source_chunk,
    qp.summary,
    qp.chunk_index,
    qp.extraction_confidence,
    qp.extraction_method,
    qd.title AS dataset_title,
    qd.data_source_type AS dataset_source_type,
    kd.title AS source_document_title,
    kd.filename AS source_document_filename
   FROM ((public.qa_pairs qp
     LEFT JOIN public.qa_datasets qd ON ((qp.dataset_id = qd.id)))
     LEFT JOIN public.knowledge_documents kd ON (((qp.source_document_id)::text = (kd.id)::text)))
  ORDER BY qp.created_at DESC;


--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    level character varying(20) DEFAULT 'error'::character varying NOT NULL,
    message text NOT NULL,
    task_id uuid,
    stack_trace text,
    context jsonb DEFAULT '{}'::jsonb,
    resolved boolean DEFAULT false,
    resolved_at timestamp with time zone,
    resolved_by uuid
);


--
-- Name: evaluation_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_data (
    id integer NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    dataset character varying NOT NULL,
    dataset_index integer,
    source character varying NOT NULL,
    raw_question character varying NOT NULL,
    level integer,
    augmented_question character varying,
    correct_answer character varying,
    file_name character varying,
    meta json,
    trace_id character varying,
    trace_url character varying,
    response character varying,
    time_cost double precision,
    trajectory character varying,
    trajectories character varying,
    extracted_final_answer character varying,
    judged_response character varying,
    reasoning character varying,
    correct boolean,
    confidence integer,
    exp_id character varying NOT NULL,
    stage character varying NOT NULL
);


--
-- Name: evaluation_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_data_id_seq OWNED BY public.evaluation_data.id;


--
-- Name: generated_qa_pairs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_qa_pairs (
    id integer NOT NULL,
    task_id integer,
    question text NOT NULL,
    answer text NOT NULL,
    summary text,
    source_chunk text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    question_embedding public.vector(1024),
    answer_embedding public.vector(1024)
);


--
-- Name: generated_qa_pairs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.generated_qa_pairs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: generated_qa_pairs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.generated_qa_pairs_id_seq OWNED BY public.generated_qa_pairs.id;


--
-- Name: graph_edges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graph_edges (
    id character varying(50) NOT NULL,
    from_node_id character varying(50),
    to_node_id character varying(50),
    label character varying(200) NOT NULL,
    type character varying(100) NOT NULL,
    properties jsonb,
    weight real DEFAULT 1.0,
    confidence real DEFAULT 0.0,
    color character varying(20),
    source_document_id character varying(50),
    source_chunk_id character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


--
-- Name: graph_filters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graph_filters (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    node_types json,
    edge_types json,
    search_text character varying(1000),
    view_mode character varying(50) NOT NULL,
    min_connections integer,
    max_connections integer,
    confidence_threshold double precision,
    user_id character varying(50),
    is_default boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: graph_layouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graph_layouts (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    algorithm character varying(50) NOT NULL,
    physics_config json,
    node_config json,
    edge_config json,
    is_default boolean,
    graph_types json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: graph_nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graph_nodes (
    id character varying(50) NOT NULL,
    label character varying(500) NOT NULL,
    type character varying(100) NOT NULL,
    properties jsonb,
    x real,
    y real,
    color character varying(20),
    size real,
    connections integer DEFAULT 0,
    level integer,
    source_document_id character varying(50),
    source_chunk_id character varying(50),
    weight real DEFAULT 1.0,
    confidence real DEFAULT 0.0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


--
-- Name: graph_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graph_snapshots (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    nodes_data json NOT NULL,
    edges_data json NOT NULL,
    layout_data json,
    node_count integer NOT NULL,
    edge_count integer NOT NULL,
    created_by character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: graph_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graph_stats (
    id character varying(50) NOT NULL,
    node_count integer DEFAULT 0 NOT NULL,
    edge_count integer DEFAULT 0 NOT NULL,
    avg_connections real DEFAULT 0.0 NOT NULL,
    type_distribution jsonb,
    last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    graph_version character varying(50)
);


--
-- Name: hirag_community_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hirag_community_reports (
    id integer NOT NULL,
    community_id character varying(100) NOT NULL,
    collection_id character varying(50),
    level integer DEFAULT 1 NOT NULL,
    parent_community_id character varying(100),
    title character varying(500),
    summary text,
    impact_rating real,
    rating_explanation text,
    detailed_findings jsonb,
    entities jsonb,
    entity_count integer,
    relationship_count integer,
    generation_model character varying(100),
    generation_prompt text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: hirag_community_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hirag_community_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hirag_community_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hirag_community_reports_id_seq OWNED BY public.hirag_community_reports.id;


--
-- Name: hirag_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hirag_configs (
    id integer NOT NULL,
    collection_id character varying(50),
    config_type character varying(50),
    config_data jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: hirag_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hirag_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hirag_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hirag_configs_id_seq OWNED BY public.hirag_configs.id;


--
-- Name: hook_execution_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hook_execution_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pipeline_id uuid,
    agent_id character varying(100),
    user_id uuid,
    hook_id character varying(100) NOT NULL,
    hook_type character varying(20) NOT NULL,
    execution_order integer NOT NULL,
    input_snapshot jsonb,
    output_snapshot jsonb,
    status character varying(20) NOT NULL,
    error_message text,
    execution_time_ms integer,
    routing_decision jsonb,
    executed_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE hook_execution_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.hook_execution_logs IS 'Hook执行日志表 - 记录每个hook的执行情况';


--
-- Name: COLUMN hook_execution_logs.routing_decision; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hook_execution_logs.routing_decision IS '路由hook的决策记录（策略选择、配置参数等）';


--
-- Name: hook_pipelines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hook_pipelines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pipeline_name character varying(100) NOT NULL,
    description text,
    scenario character varying(50),
    is_active boolean DEFAULT true,
    pre_hooks_config jsonb DEFAULT '[]'::jsonb,
    post_hooks_config jsonb DEFAULT '[]'::jsonb,
    routing_rules jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT pipeline_name_length CHECK ((char_length((pipeline_name)::text) >= 3))
);


--
-- Name: TABLE hook_pipelines; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.hook_pipelines IS 'Hook Pipeline配置表 - 定义pre-hooks和post-hooks执行链';


--
-- Name: COLUMN hook_pipelines.pre_hooks_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hook_pipelines.pre_hooks_config IS 'Pre-hooks配置数组，每个元素包含hook_id、class、config等';


--
-- Name: COLUMN hook_pipelines.post_hooks_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hook_pipelines.post_hooks_config IS 'Post-hooks配置数组';


--
-- Name: COLUMN hook_pipelines.routing_rules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hook_pipelines.routing_rules IS '检索策略路由规则数组';


--
-- Name: hook_tool_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hook_tool_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id character varying(100) NOT NULL,
    template_name character varying(200) NOT NULL,
    description text,
    template_type character varying(50),
    hook_type character varying(10),
    tool_bindings_template jsonb NOT NULL,
    param_schema jsonb,
    tags text[],
    category character varying(50),
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hook_tool_templates_hook_type_check CHECK (((hook_type)::text = ANY ((ARRAY['pre'::character varying, 'post'::character varying])::text[])))
);


--
-- Name: TABLE hook_tool_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.hook_tool_templates IS 'Hook工具模板库';


--
-- Name: hybrid_agent_strategies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hybrid_agent_strategies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    strategy_type character varying(100) NOT NULL,
    agno_config jsonb DEFAULT '{}'::jsonb,
    youtu_config jsonb DEFAULT '{}'::jsonb,
    routing_rules jsonb DEFAULT '[]'::jsonb,
    condition_logic jsonb DEFAULT '{}'::jsonb,
    performance_metrics jsonb DEFAULT '{}'::jsonb,
    is_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: knowledge_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_collections (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    icon character varying(100),
    color character varying(20),
    is_default boolean,
    is_public boolean,
    is_active boolean,
    metadata_template character varying(50) NOT NULL,
    template_version character varying(20),
    document_count integer,
    total_size bigint,
    last_updated timestamp with time zone,
    config json,
    extra_metadata json,
    template_config json,
    extraction_rules json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    default_chunking_config_id character varying(50),
    chunking_config jsonb,
    auto_qa_extraction_enabled boolean DEFAULT false,
    qa_extraction_config jsonb,
    qa_extraction_last_run timestamp without time zone,
    qa_extraction_total_pairs integer DEFAULT 0,
    vectorized_count integer DEFAULT 0
);


--
-- Name: knowledge_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_folders (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    parent_folder_id character varying(50),
    collection_id character varying(50) NOT NULL,
    folder_path text NOT NULL,
    depth_level integer NOT NULL,
    sort_order integer,
    is_active boolean,
    folder_metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by character varying(50),
    CONSTRAINT check_folder_depth_consistency CHECK ((((depth_level = 0) AND (parent_folder_id IS NULL)) OR ((depth_level = 1) AND (parent_folder_id IS NOT NULL)))),
    CONSTRAINT check_folder_depth_max CHECK ((depth_level <= 1))
);


--
-- Name: COLUMN knowledge_folders.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_folders.name IS '文件夹名称';


--
-- Name: COLUMN knowledge_folders.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_folders.description IS '文件夹描述';


--
-- Name: COLUMN knowledge_folders.parent_folder_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_folders.parent_folder_id IS '父文件夹ID';


--
-- Name: COLUMN knowledge_folders.collection_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_folders.collection_id IS '所属知识库ID';


--
-- Name: COLUMN knowledge_folders.folder_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_folders.folder_path IS '完整文件夹路径';


--
-- Name: COLUMN knowledge_folders.depth_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_folders.depth_level IS '文件夹深度层级';


--
-- Name: COLUMN knowledge_folders.sort_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_folders.sort_order IS '排序顺序';


--
-- Name: COLUMN knowledge_folders.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_folders.is_active IS '是否启用';


--
-- Name: COLUMN knowledge_folders.folder_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_folders.folder_metadata IS '文件夹元数据';


--
-- Name: COLUMN knowledge_folders.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_folders.created_at IS '创建时间';


--
-- Name: COLUMN knowledge_folders.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_folders.updated_at IS '更新时间';


--
-- Name: COLUMN knowledge_folders.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_folders.created_by IS '创建者';


--
-- Name: llm_aliases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_aliases (
    id bigint NOT NULL,
    alias character varying(128),
    target_id bigint,
    tenant character varying(128),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: llm_aliases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.llm_aliases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: llm_aliases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.llm_aliases_id_seq OWNED BY public.llm_aliases.id;


--
-- Name: llm_defaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_defaults (
    id bigint NOT NULL,
    default_model character varying(256),
    default_embedding character varying(256),
    updated_at timestamp with time zone,
    default_rerank character varying(256)
);


--
-- Name: llm_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.llm_defaults_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: llm_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.llm_defaults_id_seq OWNED BY public.llm_defaults.id;


--
-- Name: llm_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_models (
    id bigint NOT NULL,
    provider_id bigint,
    model_id character varying(256),
    display_name character varying(256),
    context_length bigint,
    capabilities text,
    pricing text,
    model_type character varying(16) DEFAULT 'chat'::character varying,
    status character varying(16),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: llm_models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.llm_models_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: llm_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.llm_models_id_seq OWNED BY public.llm_models.id;


--
-- Name: llm_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_providers (
    id bigint NOT NULL,
    name character varying(128),
    type character varying(32),
    base_url character varying(512),
    api_key_enc character varying(4096),
    extra_hdrs text,
    status character varying(16),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: llm_providers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.llm_providers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: llm_providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.llm_providers_id_seq OWNED BY public.llm_providers.id;


--
-- Name: mcp_gateway_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcp_gateway_config (
    id uuid NOT NULL,
    config_name character varying(100) NOT NULL,
    config_type character varying(50) NOT NULL,
    config_value json NOT NULL,
    is_active boolean,
    description text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: mcp_instances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcp_instances (
    id integer NOT NULL,
    tenant character varying(64) DEFAULT 'default'::character varying,
    name character varying(128) NOT NULL,
    server_name character varying(128),
    transport character varying(32),
    endpoint character varying(512),
    prefix character varying(128),
    status character varying(32),
    tools_json text,
    metadata_json text,
    last_heartbeat timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: mcp_instances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mcp_instances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mcp_instances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mcp_instances_id_seq OWNED BY public.mcp_instances.id;


--
-- Name: mcp_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcp_prompts (
    id uuid NOT NULL,
    server_id uuid NOT NULL,
    prompt_name character varying(100) NOT NULL,
    display_name character varying(200) NOT NULL,
    description text,
    prompt_template text NOT NULL,
    prompt_schema json,
    category character varying(50),
    tags character varying[],
    is_enabled boolean,
    usage_count integer,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: mcp_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcp_resources (
    id uuid NOT NULL,
    server_id uuid NOT NULL,
    resource_uri character varying(500) NOT NULL,
    resource_name character varying(200) NOT NULL,
    resource_type character varying(50),
    description text,
    mime_type character varying(100),
    resource_schema json,
    is_enabled boolean,
    access_count integer,
    last_accessed_at timestamp with time zone,
    resource_metadata json,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: mcp_servers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcp_servers (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(200) NOT NULL,
    description text,
    server_type character varying(50) NOT NULL,
    connection_config json NOT NULL,
    transport_type character varying(20) NOT NULL,
    is_enabled boolean,
    health_status character varying(20),
    last_health_check timestamp with time zone,
    server_metadata json,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: mcp_tool_calls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcp_tool_calls (
    id uuid NOT NULL,
    tool_id uuid NOT NULL,
    session_id character varying(100),
    user_id integer,
    call_request json NOT NULL,
    call_response json,
    call_status character varying(20) NOT NULL,
    error_message text,
    duration_ms integer,
    created_at timestamp with time zone,
    completed_at timestamp with time zone
);


--
-- Name: mcp_tool_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcp_tool_stats (
    id bigint NOT NULL,
    server character varying(128),
    tool character varying(256),
    call_count bigint DEFAULT 0,
    last_called_at timestamp with time zone,
    last_error text,
    active boolean DEFAULT true,
    updated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: mcp_tool_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mcp_tool_stats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mcp_tool_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mcp_tool_stats_id_seq OWNED BY public.mcp_tool_stats.id;


--
-- Name: mcp_tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcp_tools (
    id uuid NOT NULL,
    server_id uuid NOT NULL,
    tool_name character varying(100) NOT NULL,
    display_name character varying(200) NOT NULL,
    description text,
    tool_schema json NOT NULL,
    category character varying(50),
    tags character varying[],
    is_enabled boolean,
    usage_count integer,
    last_used_at timestamp with time zone,
    performance_metrics json,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id character varying(64) NOT NULL,
    session_id character varying(64),
    content text,
    reasoning_content text,
    sender character varying(50),
    "timestamp" timestamp with time zone,
    tool_calls text,
    tool_result text
);


--
-- Name: meta_agent_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meta_agent_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_name character varying(255),
    user_id uuid,
    initial_description text NOT NULL,
    domain character varying(100),
    conversation_history jsonb DEFAULT '[]'::jsonb,
    generated_config_id uuid,
    generation_status character varying(50) DEFAULT 'in_progress'::character varying,
    context_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: metadata_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metadata_templates (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    version character varying(20),
    template_schema jsonb,
    ui_schema jsonb,
    validation_rules jsonb,
    is_active boolean DEFAULT true,
    is_system boolean DEFAULT false,
    category character varying(100),
    tags jsonb,
    usage_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    created_by integer,
    template_type character varying(50),
    schema_definition jsonb,
    extraction_config jsonb,
    display_config jsonb,
    search_config jsonb
);


--
-- Name: model_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_configs (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    type character varying(50) NOT NULL,
    provider character varying(100) NOT NULL,
    model character varying(200) NOT NULL,
    api_key character varying(500),
    base_url character varying(500),
    parameters jsonb,
    is_active boolean DEFAULT true,
    max_tokens integer,
    temperature real,
    dimension integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


--
-- Name: papers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.papers (
    id integer NOT NULL,
    title character varying(500) NOT NULL,
    authors character varying(1000) NOT NULL,
    journal character varying(200),
    year integer,
    pages character varying(50),
    doi character varying(100),
    url character varying(500),
    abstract text,
    content text,
    keywords json,
    title_embedding json,
    abstract_embedding json,
    content_embedding json,
    file_path character varying(500),
    file_size integer,
    processed character varying(20),
    confidence_score double precision,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: papers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.papers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: papers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.papers_id_seq OWNED BY public.papers.id;


--
-- Name: qa_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_categories (
    id uuid NOT NULL,
    dataset_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    qa_count integer,
    category_metadata json,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: COLUMN qa_categories.dataset_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_categories.dataset_id IS '所属数据集ID';


--
-- Name: COLUMN qa_categories.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_categories.name IS '分类名称';


--
-- Name: COLUMN qa_categories.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_categories.description IS '分类描述';


--
-- Name: COLUMN qa_categories.qa_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_categories.qa_count IS '该分类下的问答对数量';


--
-- Name: COLUMN qa_categories.category_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_categories.category_metadata IS '分类元数据';


--
-- Name: COLUMN qa_categories.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_categories.created_at IS '创建时间';


--
-- Name: COLUMN qa_categories.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_categories.updated_at IS '更新时间';


--
-- Name: qa_extraction_workers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_extraction_workers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    worker_name character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'idle'::character varying NOT NULL,
    current_task_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    processed_tasks integer DEFAULT 0,
    failed_tasks integer DEFAULT 0,
    config jsonb
);


--
-- Name: qa_generation_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_generation_configs (
    id integer NOT NULL,
    user_id character varying(255),
    collection_id character varying(255),
    chunk_size integer DEFAULT 1200 NOT NULL,
    chunk_overlap integer DEFAULT 100 NOT NULL,
    qa_count_per_chunk integer DEFAULT 3 NOT NULL,
    language character varying(10) DEFAULT 'zh'::character varying NOT NULL,
    quality_threshold numeric(3,2) DEFAULT 0.7 NOT NULL,
    include_summary boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255),
    CONSTRAINT qa_config_chunk_overlap_range CHECK (((chunk_overlap >= 0) AND (chunk_overlap <= 200))),
    CONSTRAINT qa_config_chunk_size_range CHECK (((chunk_size >= 800) AND (chunk_size <= 1600))),
    CONSTRAINT qa_config_language_check CHECK (((language)::text = ANY ((ARRAY['zh'::character varying, 'en'::character varying])::text[]))),
    CONSTRAINT qa_config_qa_count_range CHECK (((qa_count_per_chunk >= 1) AND (qa_count_per_chunk <= 8))),
    CONSTRAINT qa_config_quality_threshold_range CHECK (((quality_threshold >= 0.5) AND (quality_threshold <= 0.9)))
);


--
-- Name: TABLE qa_generation_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.qa_generation_configs IS 'QA生成配置表，支持用户级别和知识库级别的配置';


--
-- Name: COLUMN qa_generation_configs.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_generation_configs.user_id IS '用户ID，NULL表示全局默认配置';


--
-- Name: COLUMN qa_generation_configs.collection_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_generation_configs.collection_id IS '知识库ID，NULL表示全局配置';


--
-- Name: COLUMN qa_generation_configs.chunk_size; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_generation_configs.chunk_size IS '文档分块大小，范围800-1600字符';


--
-- Name: COLUMN qa_generation_configs.chunk_overlap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_generation_configs.chunk_overlap IS '分块重叠字符数，范围0-200字符';


--
-- Name: COLUMN qa_generation_configs.qa_count_per_chunk; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_generation_configs.qa_count_per_chunk IS '每块生成QA数量，范围1-8';


--
-- Name: COLUMN qa_generation_configs.quality_threshold; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_generation_configs.quality_threshold IS '质量过滤阈值，范围0.5-0.9';


--
-- Name: COLUMN qa_generation_configs.is_default; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_generation_configs.is_default IS '是否为系统默认配置';


--
-- Name: qa_generation_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.qa_generation_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: qa_generation_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.qa_generation_configs_id_seq OWNED BY public.qa_generation_configs.id;


--
-- Name: qa_generation_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_generation_tasks (
    id integer NOT NULL,
    document_id character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying,
    qa_pairs_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    error_message text
);


--
-- Name: qa_generation_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.qa_generation_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: qa_generation_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.qa_generation_tasks_id_seq OWNED BY public.qa_generation_tasks.id;


--
-- Name: qa_pair_hits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_pair_hits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    qa_pair_id uuid NOT NULL,
    query text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: qa_route_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_route_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    knowledge_base_id character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(50),
    display_order integer DEFAULT 0,
    parent_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE qa_route_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.qa_route_categories IS 'QA路由分类管理表';


--
-- Name: qa_route_import_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_route_import_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    knowledge_base_id character varying(255) NOT NULL,
    qa_dataset_id uuid,
    import_type character varying(50) NOT NULL,
    total_items integer NOT NULL,
    imported_items integer NOT NULL,
    failed_items integer DEFAULT 0,
    import_config jsonb DEFAULT '{}'::jsonb,
    error_details jsonb DEFAULT '[]'::jsonb,
    status character varying(50) DEFAULT 'pending'::character varying,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE qa_route_import_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.qa_route_import_history IS 'QA路由导入历史记录表';


--
-- Name: qa_route_match_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_route_match_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    qa_route_id uuid,
    knowledge_base_id character varying(255),
    user_query text NOT NULL,
    match_score double precision,
    match_method character varying(50),
    response_time_ms integer,
    is_helpful boolean,
    session_id character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer
);


--
-- Name: TABLE qa_route_match_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.qa_route_match_logs IS 'QA路由匹配日志，用于分析和优化';


--
-- Name: COLUMN qa_route_match_logs.match_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_route_match_logs.match_method IS '匹配方法：exact精确匹配，keyword关键词匹配，semantic语义匹配';


--
-- Name: qa_routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_routes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    knowledge_base_id character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    keywords text[],
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    source_type character varying(50) DEFAULT 'manual'::character varying,
    source_ref character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_by integer,
    question_embedding public.vector(1024)
);


--
-- Name: TABLE qa_routes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.qa_routes IS '知识库问答路由表，存储预定义的问答对';


--
-- Name: COLUMN qa_routes.priority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.qa_routes.priority IS '优先级：当多个路由匹配时，优先返回高优先级的答案';


--
-- Name: retrieval_path_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.retrieval_path_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    knowledge_base_id character varying(255) NOT NULL,
    path_name character varying(100) NOT NULL,
    path_order integer NOT NULL,
    source_type character varying(50) NOT NULL,
    is_enabled boolean DEFAULT true,
    config jsonb DEFAULT '{}'::jsonb,
    fallback_action character varying(50) DEFAULT 'continue'::character varying,
    min_confidence double precision DEFAULT 0.7,
    max_results integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE retrieval_path_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.retrieval_path_configs IS '检索路径配置表，定义多层检索策略';


--
-- Name: COLUMN retrieval_path_configs.fallback_action; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.retrieval_path_configs.fallback_action IS '失败动作：continue继续下一层，stop停止检索';


--
-- Name: retrieval_path_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.retrieval_path_templates (
    id uuid NOT NULL,
    knowledge_base_id uuid NOT NULL,
    template_name text NOT NULL,
    mode text DEFAULT 'balanced'::text NOT NULL,
    paths_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    weights_json jsonb,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: retrieval_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.retrieval_results (
    id character varying(50) NOT NULL,
    query text NOT NULL,
    query_hash character varying(100) NOT NULL,
    results json NOT NULL,
    top_k integer NOT NULL,
    threshold double precision,
    rerank boolean,
    model_used character varying(200),
    retrieval_time double precision,
    total_matches integer,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: retrieval_strategies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.retrieval_strategies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    strategy_name character varying(100) NOT NULL,
    description text,
    strategy_type character varying(50) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    applicable_intents text[] DEFAULT '{}'::text[],
    applicable_domains text[] DEFAULT '{}'::text[],
    applicable_complexities text[] DEFAULT '{}'::text[],
    avg_execution_time_ms integer,
    success_rate double precision,
    last_used_at timestamp with time zone,
    usage_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE retrieval_strategies; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.retrieval_strategies IS '检索策略配置表 - 定义各种检索策略的参数和适用场景';


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    id integer NOT NULL,
    version character varying(50) NOT NULL,
    description text,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    checksum character varying(100)
);


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schema_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schema_migrations_id_seq OWNED BY public.schema_migrations.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(64) NOT NULL,
    created_at timestamp with time zone,
    title character varying(255)
);


--
-- Name: system_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_configs (
    id character varying(50) NOT NULL,
    category character varying(100) NOT NULL,
    key character varying(200) NOT NULL,
    value jsonb NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


--
-- Name: system_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    cpu_usage numeric(5,2),
    memory_usage numeric(5,2),
    disk_usage numeric(5,2),
    active_connections integer,
    api_calls_per_minute integer,
    queue_size integer,
    cache_hit_rate numeric(5,2),
    network_io_bytes_sent bigint,
    network_io_bytes_recv bigint,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: task_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_type character varying(100) NOT NULL,
    task_name character varying(200),
    task_data jsonb NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    priority integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    retry_count integer DEFAULT 0,
    worker_id character varying(100),
    scheduled_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    error_message text,
    result_data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: team_execution_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_execution_steps (
    id integer NOT NULL,
    execution_id integer NOT NULL,
    step_number integer NOT NULL,
    agent_name character varying(100) NOT NULL,
    step_type character varying(50) DEFAULT 'action'::character varying,
    input_data jsonb,
    output_data jsonb,
    status character varying(20) DEFAULT 'pending'::character varying,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    error_message text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: team_execution_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.team_execution_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: team_execution_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.team_execution_steps_id_seq OWNED BY public.team_execution_steps.id;


--
-- Name: team_execution_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_execution_templates (
    id uuid NOT NULL,
    template_name character varying(200) NOT NULL,
    description text,
    team_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    execution_flow jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: team_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_executions (
    id integer NOT NULL,
    session_id character varying(100) NOT NULL,
    execution_id character varying(100) NOT NULL,
    team_name character varying(200) NOT NULL,
    query text NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    start_time timestamp with time zone DEFAULT now(),
    end_time timestamp with time zone,
    duration_ms integer,
    result_content text,
    error_message text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    conversation_id integer,
    message_id integer,
    total_duration_ms integer,
    structured_output jsonb,
    coordination_info jsonb,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    team_mode character varying(50) DEFAULT 'coordinate'::character varying,
    execution_mode character varying(20) DEFAULT 'sequential'::character varying,
    performance_metrics jsonb DEFAULT '{}'::jsonb
);


--
-- Name: team_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.team_executions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: team_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.team_executions_id_seq OWNED BY public.team_executions.id;


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id integer NOT NULL,
    team_name character varying(200) NOT NULL,
    member_id character varying(100) NOT NULL,
    member_name character varying(200) NOT NULL,
    role character varying(200) NOT NULL,
    model_provider character varying(100),
    model_id character varying(100),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: team_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.team_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: team_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.team_members_id_seq OWNED BY public.team_members.id;


--
-- Name: team_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_sessions (
    id integer NOT NULL,
    session_name character varying(255) NOT NULL,
    team_config jsonb NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


--
-- Name: team_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.team_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: team_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.team_sessions_id_seq OWNED BY public.team_sessions.id;


--
-- Name: tool_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tool_catalog (
    id bigint NOT NULL,
    name character varying(256),
    title character varying(256),
    description text,
    transport character varying(16),
    runtime_ref character varying(256),
    parameters_json text,
    enabled boolean DEFAULT true,
    updated_at timestamp with time zone,
    created_at timestamp with time zone
);


--
-- Name: tool_catalog_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tool_catalog_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tool_catalog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tool_catalog_id_seq OWNED BY public.tool_catalog.id;


--
-- Name: tracing_generation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tracing_generation (
    id integer NOT NULL,
    trace_id character varying NOT NULL,
    span_id character varying NOT NULL,
    type character varying,
    input json,
    output json,
    model character varying,
    model_configs json,
    usage json,
    response_id character varying
);


--
-- Name: tracing_generation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tracing_generation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tracing_generation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tracing_generation_id_seq OWNED BY public.tracing_generation.id;


--
-- Name: tracing_tool; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tracing_tool (
    id integer NOT NULL,
    trace_id character varying NOT NULL,
    span_id character varying NOT NULL,
    name character varying NOT NULL,
    input json,
    output json,
    mcp_data json
);


--
-- Name: tracing_tool_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tracing_tool_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tracing_tool_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tracing_tool_id_seq OWNED BY public.tracing_tool.id;


--
-- Name: unified_agents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unified_agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(200) NOT NULL,
    description text,
    framework character varying(20) NOT NULL,
    type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'inactive'::character varying,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    knowledge_binding jsonb DEFAULT '{"collections": [], "customFilters": [], "retrievalMode": "all"}'::jsonb,
    performance_stats jsonb DEFAULT '{"successRate": 0, "avgResponseTime": 0, "totalExecutions": 0}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    tags text[] DEFAULT '{}'::text[],
    CONSTRAINT unified_agents_framework_check CHECK (((framework)::text = ANY ((ARRAY['agno'::character varying, 'youtu'::character varying, 'hybrid'::character varying])::text[]))),
    CONSTRAINT unified_agents_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'configuring'::character varying, 'error'::character varying])::text[]))),
    CONSTRAINT unified_agents_type_check CHECK (((type)::text = ANY ((ARRAY['team'::character varying, 'simple'::character varying, 'orchestra'::character varying, 'hybrid'::character varying])::text[])))
);


--
-- Name: unla_active_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_active_versions (
    id bigint NOT NULL,
    tenant character varying(50) NOT NULL,
    name character varying(50) NOT NULL,
    version bigint NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: unla_active_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unla_active_versions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unla_active_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unla_active_versions_id_seq OWNED BY public.unla_active_versions.id;


--
-- Name: unla_chat_model_meta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_chat_model_meta (
    id bigint NOT NULL,
    provider character varying(64),
    model_id character varying(256),
    supports_tools boolean,
    last_test_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: unla_chat_model_meta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unla_chat_model_meta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unla_chat_model_meta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unla_chat_model_meta_id_seq OWNED BY public.unla_chat_model_meta.id;


--
-- Name: unla_embedding_defaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_embedding_defaults (
    id bigint NOT NULL,
    default_embedding character varying(256),
    updated_at timestamp with time zone
);


--
-- Name: unla_embedding_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unla_embedding_defaults_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unla_embedding_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unla_embedding_defaults_id_seq OWNED BY public.unla_embedding_defaults.id;


--
-- Name: unla_embedding_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_embedding_models (
    id bigint NOT NULL,
    provider character varying(64),
    model_id character varying(256),
    display_name character varying(256),
    status character varying(16) DEFAULT 'active'::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    base_url character varying(512),
    api_key_enc text,
    dimension bigint,
    context_window bigint
);


--
-- Name: unla_embedding_models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unla_embedding_models_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unla_embedding_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unla_embedding_models_id_seq OWNED BY public.unla_embedding_models.id;


--
-- Name: unla_mcp_config_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_mcp_config_versions (
    id bigint NOT NULL,
    name character varying(50),
    tenant character varying(50),
    version bigint,
    action_type text NOT NULL,
    created_by text,
    created_at timestamp with time zone,
    routers text,
    servers text,
    tools text,
    prompts text,
    mcp_servers text,
    hash text NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: unla_mcp_config_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unla_mcp_config_versions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unla_mcp_config_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unla_mcp_config_versions_id_seq OWNED BY public.unla_mcp_config_versions.id;


--
-- Name: unla_mcp_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_mcp_configs (
    id bigint NOT NULL,
    name character varying(50),
    tenant character varying(50) DEFAULT ''::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    routers text,
    servers text,
    tools text,
    prompts text,
    mcp_servers text,
    deleted_at timestamp with time zone
);


--
-- Name: unla_mcp_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unla_mcp_configs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unla_mcp_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unla_mcp_configs_id_seq OWNED BY public.unla_mcp_configs.id;


--
-- Name: unla_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_messages (
    id character varying(64) NOT NULL,
    session_id character varying(64),
    content text,
    reasoning_content text,
    sender character varying(50),
    "timestamp" timestamp with time zone,
    tool_calls text,
    tool_result text
);


--
-- Name: unla_rerank_defaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_rerank_defaults (
    id bigint NOT NULL,
    default_rerank character varying(256),
    updated_at timestamp with time zone
);


--
-- Name: unla_rerank_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unla_rerank_defaults_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unla_rerank_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unla_rerank_defaults_id_seq OWNED BY public.unla_rerank_defaults.id;


--
-- Name: unla_rerank_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_rerank_models (
    id bigint NOT NULL,
    provider character varying(64),
    model_id character varying(256),
    display_name character varying(256),
    base_url character varying(512),
    api_key_enc text,
    status character varying(16) DEFAULT 'active'::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: unla_rerank_models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unla_rerank_models_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unla_rerank_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unla_rerank_models_id_seq OWNED BY public.unla_rerank_models.id;


--
-- Name: unla_router_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_router_map (
    id uuid NOT NULL,
    tenant character varying(100) NOT NULL,
    server_name character varying(200) NOT NULL,
    router_prefix character varying(300) NOT NULL,
    proto_type character varying(32) NOT NULL,
    mcp_endpoint character varying(512) NOT NULL,
    sse_endpoint character varying(512) NOT NULL,
    is_active boolean,
    version character varying(50),
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: unla_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_sessions (
    id character varying(64) NOT NULL,
    created_at timestamp with time zone,
    title character varying(255)
);


--
-- Name: unla_system_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_system_prompts (
    user_id bigint NOT NULL,
    prompt text NOT NULL,
    updated_at timestamp with time zone
);


--
-- Name: unla_system_prompts_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unla_system_prompts_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unla_system_prompts_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unla_system_prompts_user_id_seq OWNED BY public.unla_system_prompts.user_id;


--
-- Name: unla_tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_tenants (
    id bigint NOT NULL,
    name character varying(50),
    prefix character varying(50),
    description character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: unla_tenants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unla_tenants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unla_tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unla_tenants_id_seq OWNED BY public.unla_tenants.id;


--
-- Name: unla_user_tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_user_tenants (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: unla_user_tenants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unla_user_tenants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unla_user_tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unla_user_tenants_id_seq OWNED BY public.unla_user_tenants.id;


--
-- Name: unla_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unla_users (
    id bigint NOT NULL,
    username character varying(50),
    password text NOT NULL,
    role text DEFAULT 'normal'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: unla_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unla_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unla_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unla_users_id_seq OWNED BY public.unla_users.id;


--
-- Name: user_agent_pipelines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_agent_pipelines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id character varying(100) NOT NULL,
    pipeline_id uuid,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 0,
    override_config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE user_agent_pipelines; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_agent_pipelines IS '用户智能体与Hook Pipeline关联表';


--
-- Name: COLUMN user_agent_pipelines.override_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_agent_pipelines.override_config IS 'Agent级别的配置覆盖（覆盖pipeline默认配置）';


--
-- Name: user_agent_publish_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_agent_publish_status (
    agent_id character varying(100) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_agent_releases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_agent_releases (
    id integer NOT NULL,
    agent_id character varying(100) NOT NULL,
    user_id integer,
    version integer NOT NULL,
    snapshot jsonb,
    notes text,
    published_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_agent_releases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_agent_releases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_agent_releases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_agent_releases_id_seq OWNED BY public.user_agent_releases.id;


--
-- Name: user_agent_tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_agent_tools (
    id character varying(36) DEFAULT (gen_random_uuid())::character varying NOT NULL,
    agent_id character varying(36) NOT NULL,
    tool_id character varying(36) NOT NULL,
    enabled boolean DEFAULT true,
    custom_config jsonb
);


--
-- Name: user_agents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_agents (
    id character varying(36) DEFAULT (gen_random_uuid())::character varying NOT NULL,
    user_id integer NOT NULL,
    template_id character varying(36),
    agent_code character varying(100) NOT NULL,
    agent_name character varying(200) NOT NULL,
    agent_type character varying(20) NOT NULL,
    description text,
    collection_id character varying(36),
    enable_knowledge_search boolean DEFAULT true,
    enable_graph_search boolean DEFAULT false,
    retrieval_mode character varying(20) DEFAULT 'all'::character varying,
    custom_config jsonb,
    model_config jsonb,
    tools_config jsonb,
    team_members jsonb,
    team_mode character varying(50),
    icon character varying(50),
    color character varying(20),
    status character varying(20) DEFAULT 'active'::character varying,
    usage_count integer DEFAULT 0,
    last_used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    selected_tools jsonb DEFAULT '[]'::jsonb,
    default_pipeline_id uuid,
    enable_pre_hooks boolean DEFAULT false,
    enable_post_hooks boolean DEFAULT false,
    CONSTRAINT user_agents_agent_type_check CHECK (((agent_type)::text = ANY ((ARRAY['single'::character varying, 'team'::character varying])::text[]))),
    CONSTRAINT user_agents_retrieval_mode_check CHECK (((retrieval_mode)::text = ANY ((ARRAY['all'::character varying, 'qa_only'::character varying, 'papers_only'::character varying])::text[]))),
    CONSTRAINT user_agents_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'deleted'::character varying, 'draft'::character varying])::text[])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(100),
    is_active boolean DEFAULT true,
    is_superuser boolean DEFAULT false,
    organization character varying(200),
    role character varying(50),
    research_interests character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    last_login timestamp with time zone,
    password_hash character varying(255) NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: v_active_custom_hooks; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_active_custom_hooks AS
 SELECT id,
    hook_id,
    hook_name,
    hook_type,
    description,
    category,
    priority,
    is_system,
    jsonb_array_length(tool_bindings) AS tool_count,
    created_at,
    updated_at,
    ( SELECT count(*) AS count
           FROM public.custom_hook_executions e
          WHERE ((e.hook_id)::text = (h.hook_id)::text)) AS total_executions,
    ( SELECT count(*) AS count
           FROM public.custom_hook_executions e
          WHERE (((e.hook_id)::text = (h.hook_id)::text) AND ((e.status)::text = 'success'::text))) AS successful_executions
   FROM public.custom_hooks h
  WHERE (is_active = true);


--
-- Name: VIEW v_active_custom_hooks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_active_custom_hooks IS '活跃的自定义Hooks视图';


--
-- Name: v_hook_execution_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_hook_execution_stats AS
 SELECT hook_id,
    count(*) AS total_executions,
    count(*) FILTER (WHERE ((status)::text = 'success'::text)) AS successful_executions,
    count(*) FILTER (WHERE ((status)::text = 'failure'::text)) AS failed_executions,
    avg(execution_time_ms) AS avg_execution_time_ms,
    max(execution_time_ms) AS max_execution_time_ms,
    min(execution_time_ms) AS min_execution_time_ms,
    avg(total_tool_calls) AS avg_tool_calls,
    max(created_at) AS last_execution_at
   FROM public.custom_hook_executions
  GROUP BY hook_id;


--
-- Name: VIEW v_hook_execution_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_hook_execution_stats IS 'Hook执行统计视图';


--
-- Name: vector_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vector_configs (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    model_name character varying(200) NOT NULL,
    model_provider character varying(100) NOT NULL,
    dimension integer NOT NULL,
    normalization_type character varying(20),
    distance_metric character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


--
-- Name: workflow_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_sessions (
    id uuid NOT NULL,
    agent_name character varying(200) NOT NULL,
    status character varying(32) DEFAULT 'running'::character varying NOT NULL,
    inputs jsonb DEFAULT '{}'::jsonb NOT NULL,
    vars jsonb DEFAULT '{}'::jsonb NOT NULL,
    outputs jsonb DEFAULT '{}'::jsonb NOT NULL,
    step_index character varying(32) DEFAULT '0'::character varying,
    step_name character varying(200) DEFAULT ''::character varying,
    cancel_flag character varying(8) DEFAULT '0'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: youtu_agent_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.youtu_agent_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255),
    agent_type character varying(50) DEFAULT 'SimpleAgent'::character varying NOT NULL,
    description text,
    instructions jsonb DEFAULT '[]'::jsonb,
    model_config jsonb DEFAULT '{}'::jsonb,
    tools jsonb DEFAULT '[]'::jsonb,
    environments jsonb DEFAULT '[]'::jsonb,
    meta_config jsonb DEFAULT '{}'::jsonb,
    agno_compatible_config jsonb DEFAULT '{}'::jsonb,
    status character varying(50) DEFAULT 'active'::character varying,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: youtu_agent_environments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.youtu_agent_environments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    env_type character varying(100) NOT NULL,
    config_schema jsonb DEFAULT '{}'::jsonb,
    default_config jsonb DEFAULT '{}'::jsonb,
    is_enabled boolean DEFAULT true,
    security_level character varying(50) DEFAULT 'medium'::character varying,
    resource_limits jsonb DEFAULT '{}'::jsonb,
    implementation_class character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: youtu_agent_execution_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.youtu_agent_execution_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    execution_id uuid,
    step_order integer NOT NULL,
    step_type character varying(100) NOT NULL,
    step_name character varying(255) NOT NULL,
    step_description text,
    step_status character varying(50) DEFAULT 'pending'::character varying,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    duration_seconds numeric(10,3),
    input_data jsonb DEFAULT '{}'::jsonb,
    output_data jsonb DEFAULT '{}'::jsonb,
    error_details jsonb DEFAULT '{}'::jsonb,
    agent_response text,
    tool_calls jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: youtu_agent_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.youtu_agent_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id character varying(255),
    agent_config_id uuid,
    execution_mode character varying(50) DEFAULT 'auto'::character varying NOT NULL,
    query_text text NOT NULL,
    query_context jsonb DEFAULT '{}'::jsonb,
    execution_status character varying(50) DEFAULT 'running'::character varying,
    start_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    end_time timestamp with time zone,
    duration_seconds numeric(10,3),
    error_message text,
    execution_metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: youtu_agent_toolkits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.youtu_agent_toolkits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    toolkit_type character varying(100) NOT NULL,
    config_schema jsonb DEFAULT '{}'::jsonb,
    default_config jsonb DEFAULT '{}'::jsonb,
    is_enabled boolean DEFAULT true,
    requires_auth boolean DEFAULT false,
    auth_config jsonb DEFAULT '{}'::jsonb,
    implementation_class character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: agent_tool_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_tool_runs ALTER COLUMN id SET DEFAULT nextval('public.agent_tool_runs_id_seq'::regclass);


--
-- Name: api_tool_catalog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_tool_catalog ALTER COLUMN id SET DEFAULT nextval('public.api_tool_catalog_id_seq'::regclass);


--
-- Name: cache_tool id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_tool ALTER COLUMN id SET DEFAULT nextval('public.cache_tool_id_seq'::regclass);


--
-- Name: conversation_message_reactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_message_reactions ALTER COLUMN id SET DEFAULT nextval('public.conversation_message_reactions_id_seq'::regclass);


--
-- Name: conversation_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages ALTER COLUMN id SET DEFAULT nextval('public.conversation_messages_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: crawl_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crawl_results ALTER COLUMN id SET DEFAULT nextval('public.crawl_results_id_seq'::regclass);


--
-- Name: crawl_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crawl_tasks ALTER COLUMN id SET DEFAULT nextval('public.crawl_tasks_id_seq'::regclass);


--
-- Name: custom_crawler_tools id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_crawler_tools ALTER COLUMN id SET DEFAULT nextval('public.custom_crawler_tools_id_seq'::regclass);


--
-- Name: custom_tool_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_tool_executions ALTER COLUMN id SET DEFAULT nextval('public.custom_tool_executions_id_seq'::regclass);


--
-- Name: data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data ALTER COLUMN id SET DEFAULT nextval('public.data_id_seq'::regclass);


--
-- Name: evaluation_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_data ALTER COLUMN id SET DEFAULT nextval('public.evaluation_data_id_seq'::regclass);


--
-- Name: generated_qa_pairs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_qa_pairs ALTER COLUMN id SET DEFAULT nextval('public.generated_qa_pairs_id_seq'::regclass);


--
-- Name: hirag_community_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hirag_community_reports ALTER COLUMN id SET DEFAULT nextval('public.hirag_community_reports_id_seq'::regclass);


--
-- Name: hirag_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hirag_configs ALTER COLUMN id SET DEFAULT nextval('public.hirag_configs_id_seq'::regclass);


--
-- Name: llm_aliases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_aliases ALTER COLUMN id SET DEFAULT nextval('public.llm_aliases_id_seq'::regclass);


--
-- Name: llm_defaults id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_defaults ALTER COLUMN id SET DEFAULT nextval('public.llm_defaults_id_seq'::regclass);


--
-- Name: llm_models id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_models ALTER COLUMN id SET DEFAULT nextval('public.llm_models_id_seq'::regclass);


--
-- Name: llm_providers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_providers ALTER COLUMN id SET DEFAULT nextval('public.llm_providers_id_seq'::regclass);


--
-- Name: mcp_instances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_instances ALTER COLUMN id SET DEFAULT nextval('public.mcp_instances_id_seq'::regclass);


--
-- Name: mcp_tool_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_tool_stats ALTER COLUMN id SET DEFAULT nextval('public.mcp_tool_stats_id_seq'::regclass);


--
-- Name: papers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.papers ALTER COLUMN id SET DEFAULT nextval('public.papers_id_seq'::regclass);


--
-- Name: qa_generation_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_generation_configs ALTER COLUMN id SET DEFAULT nextval('public.qa_generation_configs_id_seq'::regclass);


--
-- Name: qa_generation_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_generation_tasks ALTER COLUMN id SET DEFAULT nextval('public.qa_generation_tasks_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: team_execution_steps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_execution_steps ALTER COLUMN id SET DEFAULT nextval('public.team_execution_steps_id_seq'::regclass);


--
-- Name: team_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_executions ALTER COLUMN id SET DEFAULT nextval('public.team_executions_id_seq'::regclass);


--
-- Name: team_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members ALTER COLUMN id SET DEFAULT nextval('public.team_members_id_seq'::regclass);


--
-- Name: team_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_sessions ALTER COLUMN id SET DEFAULT nextval('public.team_sessions_id_seq'::regclass);


--
-- Name: tool_catalog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_catalog ALTER COLUMN id SET DEFAULT nextval('public.tool_catalog_id_seq'::regclass);


--
-- Name: tracing_generation id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracing_generation ALTER COLUMN id SET DEFAULT nextval('public.tracing_generation_id_seq'::regclass);


--
-- Name: tracing_tool id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracing_tool ALTER COLUMN id SET DEFAULT nextval('public.tracing_tool_id_seq'::regclass);


--
-- Name: unla_active_versions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_active_versions ALTER COLUMN id SET DEFAULT nextval('public.unla_active_versions_id_seq'::regclass);


--
-- Name: unla_chat_model_meta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_chat_model_meta ALTER COLUMN id SET DEFAULT nextval('public.unla_chat_model_meta_id_seq'::regclass);


--
-- Name: unla_embedding_defaults id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_embedding_defaults ALTER COLUMN id SET DEFAULT nextval('public.unla_embedding_defaults_id_seq'::regclass);


--
-- Name: unla_embedding_models id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_embedding_models ALTER COLUMN id SET DEFAULT nextval('public.unla_embedding_models_id_seq'::regclass);


--
-- Name: unla_mcp_config_versions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_mcp_config_versions ALTER COLUMN id SET DEFAULT nextval('public.unla_mcp_config_versions_id_seq'::regclass);


--
-- Name: unla_mcp_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_mcp_configs ALTER COLUMN id SET DEFAULT nextval('public.unla_mcp_configs_id_seq'::regclass);


--
-- Name: unla_rerank_defaults id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_rerank_defaults ALTER COLUMN id SET DEFAULT nextval('public.unla_rerank_defaults_id_seq'::regclass);


--
-- Name: unla_rerank_models id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_rerank_models ALTER COLUMN id SET DEFAULT nextval('public.unla_rerank_models_id_seq'::regclass);


--
-- Name: unla_system_prompts user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_system_prompts ALTER COLUMN user_id SET DEFAULT nextval('public.unla_system_prompts_user_id_seq'::regclass);


--
-- Name: unla_tenants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_tenants ALTER COLUMN id SET DEFAULT nextval('public.unla_tenants_id_seq'::regclass);


--
-- Name: unla_user_tenants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_user_tenants ALTER COLUMN id SET DEFAULT nextval('public.unla_user_tenants_id_seq'::regclass);


--
-- Name: unla_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_users ALTER COLUMN id SET DEFAULT nextval('public.unla_users_id_seq'::regclass);


--
-- Name: user_agent_releases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agent_releases ALTER COLUMN id SET DEFAULT nextval('public.user_agent_releases_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: agent_executions agent_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_executions
    ADD CONSTRAINT agent_executions_pkey PRIMARY KEY (id);


--
-- Name: agent_template_tools agent_template_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_template_tools
    ADD CONSTRAINT agent_template_tools_pkey PRIMARY KEY (id);


--
-- Name: agent_template_tools agent_template_tools_template_id_tool_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_template_tools
    ADD CONSTRAINT agent_template_tools_template_id_tool_id_key UNIQUE (template_id, tool_id);


--
-- Name: agent_templates agent_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_templates
    ADD CONSTRAINT agent_templates_pkey PRIMARY KEY (id);


--
-- Name: agent_templates agent_templates_template_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_templates
    ADD CONSTRAINT agent_templates_template_code_key UNIQUE (template_code);


--
-- Name: agent_tool_runs agent_tool_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_tool_runs
    ADD CONSTRAINT agent_tool_runs_pkey PRIMARY KEY (id);


--
-- Name: agent_tools agent_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_tools
    ADD CONSTRAINT agent_tools_pkey PRIMARY KEY (id);


--
-- Name: agent_tools agent_tools_tool_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_tools
    ADD CONSTRAINT agent_tools_tool_code_key UNIQUE (tool_code);


--
-- Name: api_tool_catalog api_tool_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_tool_catalog
    ADD CONSTRAINT api_tool_catalog_pkey PRIMARY KEY (id);


--
-- Name: cache_tool cache_tool_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_tool
    ADD CONSTRAINT cache_tool_pkey PRIMARY KEY (id);


--
-- Name: chunking_configs chunking_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chunking_configs
    ADD CONSTRAINT chunking_configs_pkey PRIMARY KEY (id);


--
-- Name: conversation_message_reactions conversation_message_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_message_reactions
    ADD CONSTRAINT conversation_message_reactions_pkey PRIMARY KEY (id);


--
-- Name: conversation_messages conversation_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT conversation_messages_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: crawl_results crawl_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crawl_results
    ADD CONSTRAINT crawl_results_pkey PRIMARY KEY (id);


--
-- Name: crawl_tasks crawl_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crawl_tasks
    ADD CONSTRAINT crawl_tasks_pkey PRIMARY KEY (id);


--
-- Name: crawl_tasks crawl_tasks_task_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crawl_tasks
    ADD CONSTRAINT crawl_tasks_task_id_key UNIQUE (task_id);


--
-- Name: custom_crawler_tools custom_crawler_tools_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_crawler_tools
    ADD CONSTRAINT custom_crawler_tools_name_key UNIQUE (name);


--
-- Name: custom_crawler_tools custom_crawler_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_crawler_tools
    ADD CONSTRAINT custom_crawler_tools_pkey PRIMARY KEY (id);


--
-- Name: custom_hook_executions custom_hook_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_hook_executions
    ADD CONSTRAINT custom_hook_executions_pkey PRIMARY KEY (id);


--
-- Name: custom_hook_versions custom_hook_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_hook_versions
    ADD CONSTRAINT custom_hook_versions_pkey PRIMARY KEY (id);


--
-- Name: custom_hook_versions custom_hook_versions_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_hook_versions
    ADD CONSTRAINT custom_hook_versions_unique UNIQUE (hook_id, version);


--
-- Name: custom_hooks custom_hooks_hook_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_hooks
    ADD CONSTRAINT custom_hooks_hook_id_key UNIQUE (hook_id);


--
-- Name: custom_hooks custom_hooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_hooks
    ADD CONSTRAINT custom_hooks_pkey PRIMARY KEY (id);


--
-- Name: custom_tool_executions custom_tool_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_tool_executions
    ADD CONSTRAINT custom_tool_executions_pkey PRIMARY KEY (id);


--
-- Name: data data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data
    ADD CONSTRAINT data_pkey PRIMARY KEY (id);


--
-- Name: deepscrape_configs deepscrape_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deepscrape_configs
    ADD CONSTRAINT deepscrape_configs_pkey PRIMARY KEY (id);


--
-- Name: deepscrape_configs deepscrape_configs_user_id_config_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deepscrape_configs
    ADD CONSTRAINT deepscrape_configs_user_id_config_name_key UNIQUE (user_id, config_name);


--
-- Name: document_categories document_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_categories
    ADD CONSTRAINT document_categories_pkey PRIMARY KEY (id);


--
-- Name: document_chunks document_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_pkey PRIMARY KEY (id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: evaluation_data evaluation_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_data
    ADD CONSTRAINT evaluation_data_pkey PRIMARY KEY (id);


--
-- Name: generated_qa_pairs generated_qa_pairs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_qa_pairs
    ADD CONSTRAINT generated_qa_pairs_pkey PRIMARY KEY (id);


--
-- Name: graph_edges graph_edges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_edges
    ADD CONSTRAINT graph_edges_pkey PRIMARY KEY (id);


--
-- Name: graph_filters graph_filters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_filters
    ADD CONSTRAINT graph_filters_pkey PRIMARY KEY (id);


--
-- Name: graph_layouts graph_layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_layouts
    ADD CONSTRAINT graph_layouts_pkey PRIMARY KEY (id);


--
-- Name: graph_nodes graph_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_nodes
    ADD CONSTRAINT graph_nodes_pkey PRIMARY KEY (id);


--
-- Name: graph_snapshots graph_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_snapshots
    ADD CONSTRAINT graph_snapshots_pkey PRIMARY KEY (id);


--
-- Name: graph_stats graph_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_stats
    ADD CONSTRAINT graph_stats_pkey PRIMARY KEY (id);


--
-- Name: hirag_community_reports hirag_community_reports_community_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hirag_community_reports
    ADD CONSTRAINT hirag_community_reports_community_id_key UNIQUE (community_id);


--
-- Name: hirag_community_reports hirag_community_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hirag_community_reports
    ADD CONSTRAINT hirag_community_reports_pkey PRIMARY KEY (id);


--
-- Name: hirag_configs hirag_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hirag_configs
    ADD CONSTRAINT hirag_configs_pkey PRIMARY KEY (id);


--
-- Name: hook_execution_logs hook_execution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hook_execution_logs
    ADD CONSTRAINT hook_execution_logs_pkey PRIMARY KEY (id);


--
-- Name: hook_pipelines hook_pipelines_pipeline_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hook_pipelines
    ADD CONSTRAINT hook_pipelines_pipeline_name_key UNIQUE (pipeline_name);


--
-- Name: hook_pipelines hook_pipelines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hook_pipelines
    ADD CONSTRAINT hook_pipelines_pkey PRIMARY KEY (id);


--
-- Name: hook_tool_templates hook_tool_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hook_tool_templates
    ADD CONSTRAINT hook_tool_templates_pkey PRIMARY KEY (id);


--
-- Name: hook_tool_templates hook_tool_templates_template_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hook_tool_templates
    ADD CONSTRAINT hook_tool_templates_template_id_key UNIQUE (template_id);


--
-- Name: hybrid_agent_strategies hybrid_agent_strategies_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hybrid_agent_strategies
    ADD CONSTRAINT hybrid_agent_strategies_name_key UNIQUE (name);


--
-- Name: hybrid_agent_strategies hybrid_agent_strategies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hybrid_agent_strategies
    ADD CONSTRAINT hybrid_agent_strategies_pkey PRIMARY KEY (id);


--
-- Name: knowledge_collections knowledge_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_collections
    ADD CONSTRAINT knowledge_collections_pkey PRIMARY KEY (id);


--
-- Name: knowledge_documents knowledge_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_documents
    ADD CONSTRAINT knowledge_documents_pkey PRIMARY KEY (id);


--
-- Name: knowledge_folders knowledge_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_folders
    ADD CONSTRAINT knowledge_folders_pkey PRIMARY KEY (id);


--
-- Name: llm_aliases llm_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_aliases
    ADD CONSTRAINT llm_aliases_pkey PRIMARY KEY (id);


--
-- Name: llm_defaults llm_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_defaults
    ADD CONSTRAINT llm_defaults_pkey PRIMARY KEY (id);


--
-- Name: llm_models llm_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_models
    ADD CONSTRAINT llm_models_pkey PRIMARY KEY (id);


--
-- Name: llm_providers llm_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_providers
    ADD CONSTRAINT llm_providers_pkey PRIMARY KEY (id);


--
-- Name: mcp_gateway_config mcp_gateway_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_gateway_config
    ADD CONSTRAINT mcp_gateway_config_pkey PRIMARY KEY (id);


--
-- Name: mcp_instances mcp_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_instances
    ADD CONSTRAINT mcp_instances_pkey PRIMARY KEY (id);


--
-- Name: mcp_instances mcp_instances_tenant_name_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_instances
    ADD CONSTRAINT mcp_instances_tenant_name_uniq UNIQUE (tenant, name);


--
-- Name: mcp_prompts mcp_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_prompts
    ADD CONSTRAINT mcp_prompts_pkey PRIMARY KEY (id);


--
-- Name: mcp_resources mcp_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_resources
    ADD CONSTRAINT mcp_resources_pkey PRIMARY KEY (id);


--
-- Name: mcp_servers mcp_servers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_servers
    ADD CONSTRAINT mcp_servers_pkey PRIMARY KEY (id);


--
-- Name: mcp_tool_calls mcp_tool_calls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_tool_calls
    ADD CONSTRAINT mcp_tool_calls_pkey PRIMARY KEY (id);


--
-- Name: mcp_tool_stats mcp_tool_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_tool_stats
    ADD CONSTRAINT mcp_tool_stats_pkey PRIMARY KEY (id);


--
-- Name: mcp_tools mcp_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_tools
    ADD CONSTRAINT mcp_tools_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: meta_agent_sessions meta_agent_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_agent_sessions
    ADD CONSTRAINT meta_agent_sessions_pkey PRIMARY KEY (id);


--
-- Name: metadata_templates metadata_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_templates
    ADD CONSTRAINT metadata_templates_pkey PRIMARY KEY (id);


--
-- Name: model_configs model_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_configs
    ADD CONSTRAINT model_configs_pkey PRIMARY KEY (id);


--
-- Name: papers papers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.papers
    ADD CONSTRAINT papers_pkey PRIMARY KEY (id);


--
-- Name: qa_categories qa_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_categories
    ADD CONSTRAINT qa_categories_pkey PRIMARY KEY (id);


--
-- Name: qa_generation_configs qa_config_unique_user_collection; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_generation_configs
    ADD CONSTRAINT qa_config_unique_user_collection UNIQUE (user_id, collection_id);


--
-- Name: qa_datasets qa_datasets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_datasets
    ADD CONSTRAINT qa_datasets_pkey PRIMARY KEY (id);


--
-- Name: qa_extraction_queue qa_extraction_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_extraction_queue
    ADD CONSTRAINT qa_extraction_queue_pkey PRIMARY KEY (id);


--
-- Name: qa_extraction_workers qa_extraction_workers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_extraction_workers
    ADD CONSTRAINT qa_extraction_workers_pkey PRIMARY KEY (id);


--
-- Name: qa_generation_configs qa_generation_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_generation_configs
    ADD CONSTRAINT qa_generation_configs_pkey PRIMARY KEY (id);


--
-- Name: qa_generation_tasks qa_generation_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_generation_tasks
    ADD CONSTRAINT qa_generation_tasks_pkey PRIMARY KEY (id);


--
-- Name: qa_pair_hits qa_pair_hits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_pair_hits
    ADD CONSTRAINT qa_pair_hits_pkey PRIMARY KEY (id);


--
-- Name: qa_pairs qa_pairs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_pairs
    ADD CONSTRAINT qa_pairs_pkey PRIMARY KEY (id);


--
-- Name: qa_route_categories qa_route_categories_knowledge_base_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_route_categories
    ADD CONSTRAINT qa_route_categories_knowledge_base_id_name_key UNIQUE (knowledge_base_id, name);


--
-- Name: qa_route_categories qa_route_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_route_categories
    ADD CONSTRAINT qa_route_categories_pkey PRIMARY KEY (id);


--
-- Name: qa_route_import_history qa_route_import_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_route_import_history
    ADD CONSTRAINT qa_route_import_history_pkey PRIMARY KEY (id);


--
-- Name: qa_route_match_logs qa_route_match_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_route_match_logs
    ADD CONSTRAINT qa_route_match_logs_pkey PRIMARY KEY (id);


--
-- Name: qa_routes qa_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_routes
    ADD CONSTRAINT qa_routes_pkey PRIMARY KEY (id);


--
-- Name: retrieval_path_configs retrieval_path_configs_knowledge_base_id_path_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_path_configs
    ADD CONSTRAINT retrieval_path_configs_knowledge_base_id_path_order_key UNIQUE (knowledge_base_id, path_order);


--
-- Name: retrieval_path_configs retrieval_path_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_path_configs
    ADD CONSTRAINT retrieval_path_configs_pkey PRIMARY KEY (id);


--
-- Name: retrieval_path_templates retrieval_path_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_path_templates
    ADD CONSTRAINT retrieval_path_templates_pkey PRIMARY KEY (id);


--
-- Name: retrieval_results retrieval_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_results
    ADD CONSTRAINT retrieval_results_pkey PRIMARY KEY (id);


--
-- Name: retrieval_strategies retrieval_strategies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_strategies
    ADD CONSTRAINT retrieval_strategies_pkey PRIMARY KEY (id);


--
-- Name: retrieval_strategies retrieval_strategies_strategy_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_strategies
    ADD CONSTRAINT retrieval_strategies_strategy_name_key UNIQUE (strategy_name);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: system_configs system_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_pkey PRIMARY KEY (id);


--
-- Name: system_metrics system_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_metrics
    ADD CONSTRAINT system_metrics_pkey PRIMARY KEY (id);


--
-- Name: task_queue task_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_queue
    ADD CONSTRAINT task_queue_pkey PRIMARY KEY (id);


--
-- Name: team_execution_steps team_execution_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_execution_steps
    ADD CONSTRAINT team_execution_steps_pkey PRIMARY KEY (id);


--
-- Name: team_execution_templates team_execution_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_execution_templates
    ADD CONSTRAINT team_execution_templates_pkey PRIMARY KEY (id);


--
-- Name: team_execution_templates team_execution_templates_template_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_execution_templates
    ADD CONSTRAINT team_execution_templates_template_name_key UNIQUE (template_name);


--
-- Name: team_executions team_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_executions
    ADD CONSTRAINT team_executions_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: team_sessions team_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_sessions
    ADD CONSTRAINT team_sessions_pkey PRIMARY KEY (id);


--
-- Name: tool_catalog tool_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_catalog
    ADD CONSTRAINT tool_catalog_pkey PRIMARY KEY (id);


--
-- Name: tracing_generation tracing_generation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracing_generation
    ADD CONSTRAINT tracing_generation_pkey PRIMARY KEY (id);


--
-- Name: tracing_tool tracing_tool_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracing_tool
    ADD CONSTRAINT tracing_tool_pkey PRIMARY KEY (id);


--
-- Name: unified_agents unified_agents_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_agents
    ADD CONSTRAINT unified_agents_name_key UNIQUE (name);


--
-- Name: unified_agents unified_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_agents
    ADD CONSTRAINT unified_agents_pkey PRIMARY KEY (id);


--
-- Name: knowledge_folders unique_folder_name_in_parent; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_folders
    ADD CONSTRAINT unique_folder_name_in_parent UNIQUE (collection_id, parent_folder_id, name);


--
-- Name: unla_active_versions unla_active_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_active_versions
    ADD CONSTRAINT unla_active_versions_pkey PRIMARY KEY (id);


--
-- Name: unla_chat_model_meta unla_chat_model_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_chat_model_meta
    ADD CONSTRAINT unla_chat_model_meta_pkey PRIMARY KEY (id);


--
-- Name: unla_embedding_defaults unla_embedding_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_embedding_defaults
    ADD CONSTRAINT unla_embedding_defaults_pkey PRIMARY KEY (id);


--
-- Name: unla_embedding_models unla_embedding_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_embedding_models
    ADD CONSTRAINT unla_embedding_models_pkey PRIMARY KEY (id);


--
-- Name: unla_mcp_config_versions unla_mcp_config_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_mcp_config_versions
    ADD CONSTRAINT unla_mcp_config_versions_pkey PRIMARY KEY (id);


--
-- Name: unla_mcp_configs unla_mcp_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_mcp_configs
    ADD CONSTRAINT unla_mcp_configs_pkey PRIMARY KEY (id);


--
-- Name: unla_messages unla_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_messages
    ADD CONSTRAINT unla_messages_pkey PRIMARY KEY (id);


--
-- Name: unla_rerank_defaults unla_rerank_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_rerank_defaults
    ADD CONSTRAINT unla_rerank_defaults_pkey PRIMARY KEY (id);


--
-- Name: unla_rerank_models unla_rerank_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_rerank_models
    ADD CONSTRAINT unla_rerank_models_pkey PRIMARY KEY (id);


--
-- Name: unla_router_map unla_router_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_router_map
    ADD CONSTRAINT unla_router_map_pkey PRIMARY KEY (id);


--
-- Name: unla_router_map unla_router_map_tenant_router_prefix_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_router_map
    ADD CONSTRAINT unla_router_map_tenant_router_prefix_key UNIQUE (tenant, router_prefix);


--
-- Name: unla_sessions unla_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_sessions
    ADD CONSTRAINT unla_sessions_pkey PRIMARY KEY (id);


--
-- Name: unla_system_prompts unla_system_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_system_prompts
    ADD CONSTRAINT unla_system_prompts_pkey PRIMARY KEY (user_id);


--
-- Name: unla_tenants unla_tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_tenants
    ADD CONSTRAINT unla_tenants_pkey PRIMARY KEY (id);


--
-- Name: unla_user_tenants unla_user_tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_user_tenants
    ADD CONSTRAINT unla_user_tenants_pkey PRIMARY KEY (id);


--
-- Name: unla_users unla_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unla_users
    ADD CONSTRAINT unla_users_pkey PRIMARY KEY (id);


--
-- Name: user_agent_pipelines user_agent_pipelines_agent_id_pipeline_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agent_pipelines
    ADD CONSTRAINT user_agent_pipelines_agent_id_pipeline_id_key UNIQUE (agent_id, pipeline_id);


--
-- Name: user_agent_pipelines user_agent_pipelines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agent_pipelines
    ADD CONSTRAINT user_agent_pipelines_pkey PRIMARY KEY (id);


--
-- Name: user_agent_publish_status user_agent_publish_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agent_publish_status
    ADD CONSTRAINT user_agent_publish_status_pkey PRIMARY KEY (agent_id);


--
-- Name: user_agent_releases user_agent_releases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agent_releases
    ADD CONSTRAINT user_agent_releases_pkey PRIMARY KEY (id);


--
-- Name: user_agent_tools user_agent_tools_agent_id_tool_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agent_tools
    ADD CONSTRAINT user_agent_tools_agent_id_tool_id_key UNIQUE (agent_id, tool_id);


--
-- Name: user_agent_tools user_agent_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agent_tools
    ADD CONSTRAINT user_agent_tools_pkey PRIMARY KEY (id);


--
-- Name: user_agents user_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agents
    ADD CONSTRAINT user_agents_pkey PRIMARY KEY (id);


--
-- Name: user_agents user_agents_user_id_agent_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agents
    ADD CONSTRAINT user_agents_user_id_agent_code_key UNIQUE (user_id, agent_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vector_configs vector_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vector_configs
    ADD CONSTRAINT vector_configs_pkey PRIMARY KEY (id);


--
-- Name: workflow_sessions workflow_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_sessions
    ADD CONSTRAINT workflow_sessions_pkey PRIMARY KEY (id);


--
-- Name: youtu_agent_configs youtu_agent_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtu_agent_configs
    ADD CONSTRAINT youtu_agent_configs_pkey PRIMARY KEY (id);


--
-- Name: youtu_agent_environments youtu_agent_environments_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtu_agent_environments
    ADD CONSTRAINT youtu_agent_environments_name_key UNIQUE (name);


--
-- Name: youtu_agent_environments youtu_agent_environments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtu_agent_environments
    ADD CONSTRAINT youtu_agent_environments_pkey PRIMARY KEY (id);


--
-- Name: youtu_agent_execution_steps youtu_agent_execution_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtu_agent_execution_steps
    ADD CONSTRAINT youtu_agent_execution_steps_pkey PRIMARY KEY (id);


--
-- Name: youtu_agent_executions youtu_agent_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtu_agent_executions
    ADD CONSTRAINT youtu_agent_executions_pkey PRIMARY KEY (id);


--
-- Name: youtu_agent_toolkits youtu_agent_toolkits_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtu_agent_toolkits
    ADD CONSTRAINT youtu_agent_toolkits_name_key UNIQUE (name);


--
-- Name: youtu_agent_toolkits youtu_agent_toolkits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtu_agent_toolkits
    ADD CONSTRAINT youtu_agent_toolkits_pkey PRIMARY KEY (id);


--
-- Name: idx_agent_executions_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_executions_agent_id ON public.agent_executions USING btree (agent_id);


--
-- Name: idx_agent_executions_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_executions_started_at ON public.agent_executions USING btree (started_at);


--
-- Name: idx_agent_executions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_executions_status ON public.agent_executions USING btree (status);


--
-- Name: idx_agent_pipelines_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_pipelines_active ON public.user_agent_pipelines USING btree (is_active);


--
-- Name: idx_agent_pipelines_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_pipelines_agent ON public.user_agent_pipelines USING btree (agent_id);


--
-- Name: idx_agent_pipelines_pipeline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_pipelines_pipeline ON public.user_agent_pipelines USING btree (pipeline_id);


--
-- Name: idx_agent_templates_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_templates_active ON public.agent_templates USING btree (is_active);


--
-- Name: idx_agent_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_templates_category ON public.agent_templates USING btree (category);


--
-- Name: idx_agent_templates_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_templates_type ON public.agent_templates USING btree (template_type);


--
-- Name: idx_agent_tool_runs_agent_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_tool_runs_agent_name ON public.agent_tool_runs USING btree (agent_name);


--
-- Name: idx_agent_tool_runs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_tool_runs_created_at ON public.agent_tool_runs USING btree (created_at DESC);


--
-- Name: idx_agent_tool_runs_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_tool_runs_mode ON public.agent_tool_runs USING btree (mode);


--
-- Name: idx_api_cfg_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_cfg_name ON public.api_tool_catalog USING btree (config_name, name);


--
-- Name: idx_api_tool_catalog_cfg_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_tool_catalog_cfg_name ON public.api_tool_catalog USING btree (config_name);


--
-- Name: idx_api_tool_catalog_cfg_name2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_tool_catalog_cfg_name2 ON public.api_tool_catalog USING btree (config_name, name);


--
-- Name: idx_cmr_mark; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cmr_mark ON public.conversation_message_reactions USING btree (mark);


--
-- Name: idx_cmr_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cmr_session_id ON public.conversation_message_reactions USING btree (session_id);


--
-- Name: idx_collections_vectorized_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_collections_vectorized_count ON public.knowledge_collections USING btree (vectorized_count);


--
-- Name: idx_conversation_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_messages_conversation_id ON public.conversation_messages USING btree (conversation_id);


--
-- Name: idx_conversations_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_session_id ON public.conversations USING btree (session_id);


--
-- Name: idx_crawl_results_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crawl_results_task_id ON public.crawl_results USING btree (task_id);


--
-- Name: idx_crawl_tasks_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crawl_tasks_task_id ON public.crawl_tasks USING btree (task_id);


--
-- Name: idx_custom_crawler_tools_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_crawler_tools_created_by ON public.custom_crawler_tools USING btree (created_by);


--
-- Name: idx_custom_crawler_tools_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_crawler_tools_enabled ON public.custom_crawler_tools USING btree (enabled);


--
-- Name: idx_custom_crawler_tools_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_crawler_tools_name ON public.custom_crawler_tools USING btree (name);


--
-- Name: idx_custom_hook_executions_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_hook_executions_agent_id ON public.custom_hook_executions USING btree (agent_id);


--
-- Name: idx_custom_hook_executions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_hook_executions_created_at ON public.custom_hook_executions USING btree (created_at DESC);


--
-- Name: idx_custom_hook_executions_hook_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_hook_executions_hook_id ON public.custom_hook_executions USING btree (hook_id);


--
-- Name: idx_custom_hook_executions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_hook_executions_status ON public.custom_hook_executions USING btree (status);


--
-- Name: idx_custom_hook_executions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_hook_executions_user_id ON public.custom_hook_executions USING btree (user_id);


--
-- Name: idx_custom_hook_versions_hook_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_hook_versions_hook_id ON public.custom_hook_versions USING btree (hook_id);


--
-- Name: idx_custom_hook_versions_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_hook_versions_published ON public.custom_hook_versions USING btree (is_published);


--
-- Name: idx_custom_hooks_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_hooks_category ON public.custom_hooks USING btree (category);


--
-- Name: idx_custom_hooks_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_hooks_created_by ON public.custom_hooks USING btree (created_by);


--
-- Name: idx_custom_hooks_hook_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_hooks_hook_type ON public.custom_hooks USING btree (hook_type);


--
-- Name: idx_custom_hooks_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_hooks_is_active ON public.custom_hooks USING btree (is_active);


--
-- Name: idx_custom_hooks_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_hooks_tags ON public.custom_hooks USING gin (tags);


--
-- Name: idx_custom_tool_executions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_tool_executions_created_at ON public.custom_tool_executions USING btree (created_at DESC);


--
-- Name: idx_custom_tool_executions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_tool_executions_status ON public.custom_tool_executions USING btree (execution_status);


--
-- Name: idx_custom_tool_executions_tool_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_tool_executions_tool_id ON public.custom_tool_executions USING btree (tool_id);


--
-- Name: idx_custom_tool_executions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_tool_executions_user_id ON public.custom_tool_executions USING btree (user_id);


--
-- Name: idx_dc_genvec_ivfflat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dc_genvec_ivfflat ON public.document_chunks USING ivfflat (general_embedding_vec public.vector_cosine_ops) WITH (lists='100');


--
-- Name: idx_deepscrape_configs_is_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deepscrape_configs_is_default ON public.deepscrape_configs USING btree (user_id, is_default) WHERE (is_default = true);


--
-- Name: idx_deepscrape_configs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deepscrape_configs_user_id ON public.deepscrape_configs USING btree (user_id);


--
-- Name: idx_document_chunks_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_chunks_document_id ON public.document_chunks USING btree (document_id);


--
-- Name: idx_hirag_community_collection; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hirag_community_collection ON public.hirag_community_reports USING btree (collection_id);


--
-- Name: idx_hirag_community_entities; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hirag_community_entities ON public.hirag_community_reports USING gin (entities);


--
-- Name: idx_hirag_community_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hirag_community_level ON public.hirag_community_reports USING btree (level);


--
-- Name: idx_hirag_configs_collection_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hirag_configs_collection_type ON public.hirag_configs USING btree (collection_id, config_type);


--
-- Name: idx_hook_logs_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hook_logs_agent ON public.hook_execution_logs USING btree (agent_id);


--
-- Name: idx_hook_logs_executed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hook_logs_executed_at ON public.hook_execution_logs USING btree (executed_at DESC);


--
-- Name: idx_hook_logs_hook_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hook_logs_hook_id ON public.hook_execution_logs USING btree (hook_id);


--
-- Name: idx_hook_logs_pipeline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hook_logs_pipeline ON public.hook_execution_logs USING btree (pipeline_id);


--
-- Name: idx_hook_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hook_logs_status ON public.hook_execution_logs USING btree (status);


--
-- Name: idx_hook_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hook_logs_user ON public.hook_execution_logs USING btree (user_id);


--
-- Name: idx_hook_pipelines_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hook_pipelines_active ON public.hook_pipelines USING btree (is_active);


--
-- Name: idx_hook_pipelines_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hook_pipelines_name ON public.hook_pipelines USING btree (pipeline_name);


--
-- Name: idx_hook_pipelines_scenario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hook_pipelines_scenario ON public.hook_pipelines USING btree (scenario);


--
-- Name: idx_hook_tool_templates_hook_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hook_tool_templates_hook_type ON public.hook_tool_templates USING btree (hook_type);


--
-- Name: idx_hook_tool_templates_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hook_tool_templates_type ON public.hook_tool_templates USING btree (template_type);


--
-- Name: idx_hybrid_strategies_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hybrid_strategies_enabled ON public.hybrid_agent_strategies USING btree (is_enabled);


--
-- Name: idx_hybrid_strategies_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hybrid_strategies_name ON public.hybrid_agent_strategies USING btree (name);


--
-- Name: idx_hybrid_strategies_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hybrid_strategies_type ON public.hybrid_agent_strategies USING btree (strategy_type);


--
-- Name: idx_knowledge_collections_qa_extraction_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_collections_qa_extraction_enabled ON public.knowledge_collections USING btree (auto_qa_extraction_enabled) WHERE (auto_qa_extraction_enabled = true);


--
-- Name: idx_knowledge_documents_auto_qa_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_documents_auto_qa_enabled ON public.knowledge_documents USING btree (auto_qa_extraction_enabled) WHERE (auto_qa_extraction_enabled = true);


--
-- Name: idx_knowledge_documents_collection_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_documents_collection_id ON public.knowledge_documents USING btree (collection_id);


--
-- Name: idx_knowledge_documents_content_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_documents_content_hash ON public.knowledge_documents USING btree (content_hash);


--
-- Name: idx_knowledge_documents_file_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_documents_file_type ON public.knowledge_documents USING btree (file_type);


--
-- Name: idx_knowledge_documents_qa_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_documents_qa_status ON public.knowledge_documents USING btree (qa_extraction_status);


--
-- Name: idx_knowledge_documents_scrape_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_documents_scrape_method ON public.knowledge_documents USING btree (scrape_method);


--
-- Name: idx_knowledge_documents_source_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_documents_source_url ON public.knowledge_documents USING btree (source_url);


--
-- Name: idx_knowledge_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_documents_status ON public.knowledge_documents USING btree (status);


--
-- Name: idx_llm_aliases_alias; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_llm_aliases_alias ON public.llm_aliases USING btree (alias);


--
-- Name: idx_llm_aliases_target_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_aliases_target_id ON public.llm_aliases USING btree (target_id);


--
-- Name: idx_llm_models_model_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_models_model_id ON public.llm_models USING btree (model_id);


--
-- Name: idx_llm_models_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_models_provider_id ON public.llm_models USING btree (provider_id);


--
-- Name: idx_llm_providers_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_llm_providers_name ON public.llm_providers USING btree (name);


--
-- Name: idx_mcp_instances_server_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mcp_instances_server_name ON public.mcp_instances USING btree (server_name);


--
-- Name: idx_mcp_tenant_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_mcp_tenant_name ON public.mcp_instances USING btree (tenant, name);


--
-- Name: idx_mcp_tool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mcp_tool ON public.mcp_tool_stats USING btree (server, tool);


--
-- Name: idx_mcp_tool_stats_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mcp_tool_stats_key ON public.mcp_tool_stats USING btree (server, tool);


--
-- Name: idx_messages_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_messages_id ON public.messages USING btree (id);


--
-- Name: idx_messages_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_session_id ON public.messages USING btree (session_id);


--
-- Name: idx_messages_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_timestamp ON public.messages USING btree ("timestamp");


--
-- Name: idx_meta_agent_sessions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meta_agent_sessions_created_at ON public.meta_agent_sessions USING btree (created_at);


--
-- Name: idx_meta_agent_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meta_agent_sessions_status ON public.meta_agent_sessions USING btree (generation_status);


--
-- Name: idx_meta_agent_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meta_agent_sessions_user_id ON public.meta_agent_sessions USING btree (user_id);


--
-- Name: idx_name_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_name_tenant ON public.unla_mcp_configs USING btree (tenant, name);


--
-- Name: idx_name_tenant_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_name_tenant_version ON public.unla_mcp_config_versions USING btree (name, tenant, version);


--
-- Name: idx_provider_model; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_provider_model ON public.unla_chat_model_meta USING btree (provider, model_id);


--
-- Name: idx_qa_datasets_data_source_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_datasets_data_source_type ON public.qa_datasets USING btree (data_source_type);


--
-- Name: idx_qa_datasets_extraction_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_datasets_extraction_task_id ON public.qa_datasets USING btree (extraction_task_id);


--
-- Name: idx_qa_datasets_source_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_datasets_source_document_id ON public.qa_datasets USING btree (source_document_id);


--
-- Name: idx_qa_extraction_queue_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_extraction_queue_document_id ON public.qa_extraction_queue USING btree (document_id);


--
-- Name: idx_qa_extraction_queue_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_extraction_queue_priority ON public.qa_extraction_queue USING btree (priority);


--
-- Name: idx_qa_extraction_queue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_extraction_queue_status ON public.qa_extraction_queue USING btree (status);


--
-- Name: idx_qa_extraction_queue_target_dataset_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_extraction_queue_target_dataset_id ON public.qa_extraction_queue USING btree (target_dataset_id);


--
-- Name: idx_qa_extraction_workers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_extraction_workers_status ON public.qa_extraction_workers USING btree (status);


--
-- Name: idx_qa_generation_configs_collection_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_generation_configs_collection_id ON public.qa_generation_configs USING btree (collection_id);


--
-- Name: idx_qa_generation_configs_is_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_generation_configs_is_default ON public.qa_generation_configs USING btree (is_default);


--
-- Name: idx_qa_generation_configs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_generation_configs_user_id ON public.qa_generation_configs USING btree (user_id);


--
-- Name: idx_qa_pair_hits_pair_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_pair_hits_pair_time ON public.qa_pair_hits USING btree (qa_pair_id, created_at DESC);


--
-- Name: idx_qa_pairs_data_source_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_pairs_data_source_type ON public.qa_pairs USING btree (data_source_type);


--
-- Name: idx_qa_pairs_extraction_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_pairs_extraction_task_id ON public.qa_pairs USING btree (extraction_task_id);


--
-- Name: idx_qa_pairs_source_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_pairs_source_document_id ON public.qa_pairs USING btree (source_document_id);


--
-- Name: idx_qa_pairs_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_pairs_task_id ON public.generated_qa_pairs USING btree (task_id);


--
-- Name: idx_qa_routes_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_routes_active ON public.qa_routes USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_qa_routes_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_routes_category ON public.qa_routes USING btree (category);


--
-- Name: idx_qa_routes_kb_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_routes_kb_id ON public.qa_routes USING btree (knowledge_base_id);


--
-- Name: idx_qa_routes_keywords; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_routes_keywords ON public.qa_routes USING gin (keywords);


--
-- Name: idx_qa_routes_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_routes_priority ON public.qa_routes USING btree (priority DESC);


--
-- Name: idx_qa_routes_question_embedding; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_routes_question_embedding ON public.qa_routes USING ivfflat (question_embedding public.vector_cosine_ops);


--
-- Name: idx_qa_tasks_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_tasks_document_id ON public.qa_generation_tasks USING btree (document_id);


--
-- Name: idx_qa_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_tasks_status ON public.qa_generation_tasks USING btree (status);


--
-- Name: idx_retrieval_paths_kb_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_retrieval_paths_kb_id ON public.retrieval_path_configs USING btree (knowledge_base_id);


--
-- Name: idx_retrieval_paths_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_retrieval_paths_order ON public.retrieval_path_configs USING btree (knowledge_base_id, path_order);


--
-- Name: idx_retrieval_strategies_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_retrieval_strategies_active ON public.retrieval_strategies USING btree (is_active);


--
-- Name: idx_retrieval_strategies_domains; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_retrieval_strategies_domains ON public.retrieval_strategies USING gin (applicable_domains);


--
-- Name: idx_retrieval_strategies_intents; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_retrieval_strategies_intents ON public.retrieval_strategies USING gin (applicable_intents);


--
-- Name: idx_retrieval_strategies_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_retrieval_strategies_type ON public.retrieval_strategies USING btree (strategy_type);


--
-- Name: idx_route_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_route_logs_created ON public.qa_route_match_logs USING btree (created_at DESC);


--
-- Name: idx_route_logs_kb_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_route_logs_kb_id ON public.qa_route_match_logs USING btree (knowledge_base_id);


--
-- Name: idx_route_logs_route_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_route_logs_route_id ON public.qa_route_match_logs USING btree (qa_route_id);


--
-- Name: idx_rpc_kb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rpc_kb ON public.retrieval_path_configs USING btree (knowledge_base_id);


--
-- Name: idx_rpc_kb_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rpc_kb_order ON public.retrieval_path_configs USING btree (knowledge_base_id, path_order);


--
-- Name: idx_rpt_kb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rpt_kb ON public.retrieval_path_templates USING btree (knowledge_base_id);


--
-- Name: idx_sessions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_sessions_id ON public.sessions USING btree (id);


--
-- Name: idx_team_execution_templates_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_execution_templates_default ON public.team_execution_templates USING btree (is_default);


--
-- Name: idx_team_execution_templates_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_execution_templates_name ON public.team_execution_templates USING btree (template_name);


--
-- Name: idx_team_executions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_executions_status ON public.team_executions USING btree (status);


--
-- Name: idx_team_executions_team_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_executions_team_name ON public.team_executions USING btree (team_name);


--
-- Name: idx_tenant_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_tenant_name ON public.unla_active_versions USING btree (tenant, name);


--
-- Name: idx_tool_catalog_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_tool_catalog_name ON public.tool_catalog USING btree (name);


--
-- Name: idx_uar_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uar_agent ON public.user_agent_releases USING btree (agent_id);


--
-- Name: idx_uar_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uar_published_at ON public.user_agent_releases USING btree (published_at DESC);


--
-- Name: idx_uar_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uar_user ON public.user_agent_releases USING btree (user_id);


--
-- Name: idx_unified_agents_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_agents_created_at ON public.unified_agents USING btree (created_at);


--
-- Name: idx_unified_agents_framework; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_agents_framework ON public.unified_agents USING btree (framework);


--
-- Name: idx_unified_agents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_agents_status ON public.unified_agents USING btree (status);


--
-- Name: idx_unified_agents_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_agents_type ON public.unified_agents USING btree (type);


--
-- Name: idx_unla_active_versions_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unla_active_versions_deleted_at ON public.unla_active_versions USING btree (deleted_at);


--
-- Name: idx_unla_embedding_models_model_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unla_embedding_models_model_id ON public.unla_embedding_models USING btree (model_id);


--
-- Name: idx_unla_embedding_models_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unla_embedding_models_provider ON public.unla_embedding_models USING btree (provider);


--
-- Name: idx_unla_mcp_config_versions_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unla_mcp_config_versions_deleted_at ON public.unla_mcp_config_versions USING btree (deleted_at);


--
-- Name: idx_unla_mcp_configs_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unla_mcp_configs_deleted_at ON public.unla_mcp_configs USING btree (deleted_at);


--
-- Name: idx_unla_messages_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unla_messages_id ON public.unla_messages USING btree (id);


--
-- Name: idx_unla_messages_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unla_messages_session_id ON public.unla_messages USING btree (session_id);


--
-- Name: idx_unla_messages_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unla_messages_timestamp ON public.unla_messages USING btree ("timestamp");


--
-- Name: idx_unla_rerank_models_model_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unla_rerank_models_model_id ON public.unla_rerank_models USING btree (model_id);


--
-- Name: idx_unla_rerank_models_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unla_rerank_models_provider ON public.unla_rerank_models USING btree (provider);


--
-- Name: idx_unla_sessions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unla_sessions_id ON public.unla_sessions USING btree (id);


--
-- Name: idx_unla_system_prompts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unla_system_prompts_user_id ON public.unla_system_prompts USING btree (user_id);


--
-- Name: idx_unla_tenants_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unla_tenants_name ON public.unla_tenants USING btree (name);


--
-- Name: idx_unla_tenants_prefix; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unla_tenants_prefix ON public.unla_tenants USING btree (prefix);


--
-- Name: idx_unla_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unla_users_username ON public.unla_users USING btree (username);


--
-- Name: idx_user_agents_pipeline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_agents_pipeline ON public.user_agents USING btree (default_pipeline_id);


--
-- Name: idx_user_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_tenant ON public.unla_user_tenants USING btree (user_id, tenant_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: idx_workflow_sessions_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_sessions_agent ON public.workflow_sessions USING btree (agent_name);


--
-- Name: idx_workflow_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_sessions_status ON public.workflow_sessions USING btree (status);


--
-- Name: idx_youtu_agent_configs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_agent_configs_created_at ON public.youtu_agent_configs USING btree (created_at);


--
-- Name: idx_youtu_agent_configs_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_agent_configs_name ON public.youtu_agent_configs USING btree (name);


--
-- Name: idx_youtu_agent_configs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_agent_configs_status ON public.youtu_agent_configs USING btree (status);


--
-- Name: idx_youtu_agent_configs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_agent_configs_type ON public.youtu_agent_configs USING btree (agent_type);


--
-- Name: idx_youtu_environments_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_environments_enabled ON public.youtu_agent_environments USING btree (is_enabled);


--
-- Name: idx_youtu_environments_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_environments_name ON public.youtu_agent_environments USING btree (name);


--
-- Name: idx_youtu_environments_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_environments_type ON public.youtu_agent_environments USING btree (env_type);


--
-- Name: idx_youtu_execution_steps_execution_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_execution_steps_execution_id ON public.youtu_agent_execution_steps USING btree (execution_id);


--
-- Name: idx_youtu_execution_steps_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_execution_steps_status ON public.youtu_agent_execution_steps USING btree (step_status);


--
-- Name: idx_youtu_execution_steps_step_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_execution_steps_step_order ON public.youtu_agent_execution_steps USING btree (execution_id, step_order);


--
-- Name: idx_youtu_executions_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_executions_mode ON public.youtu_agent_executions USING btree (execution_mode);


--
-- Name: idx_youtu_executions_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_executions_session_id ON public.youtu_agent_executions USING btree (session_id);


--
-- Name: idx_youtu_executions_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_executions_start_time ON public.youtu_agent_executions USING btree (start_time);


--
-- Name: idx_youtu_executions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_executions_status ON public.youtu_agent_executions USING btree (execution_status);


--
-- Name: idx_youtu_toolkits_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_toolkits_enabled ON public.youtu_agent_toolkits USING btree (is_enabled);


--
-- Name: idx_youtu_toolkits_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_toolkits_name ON public.youtu_agent_toolkits USING btree (name);


--
-- Name: idx_youtu_toolkits_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_youtu_toolkits_type ON public.youtu_agent_toolkits USING btree (toolkit_type);


--
-- Name: ix_graph_filters_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_graph_filters_id ON public.graph_filters USING btree (id);


--
-- Name: ix_graph_filters_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_graph_filters_name ON public.graph_filters USING btree (name);


--
-- Name: ix_graph_layouts_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_graph_layouts_id ON public.graph_layouts USING btree (id);


--
-- Name: ix_graph_layouts_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_graph_layouts_name ON public.graph_layouts USING btree (name);


--
-- Name: ix_graph_snapshots_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_graph_snapshots_id ON public.graph_snapshots USING btree (id);


--
-- Name: ix_mcp_gateway_config_config_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_mcp_gateway_config_config_name ON public.mcp_gateway_config USING btree (config_name);


--
-- Name: ix_mcp_gateway_config_config_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_gateway_config_config_type ON public.mcp_gateway_config USING btree (config_type);


--
-- Name: ix_mcp_gateway_config_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_gateway_config_is_active ON public.mcp_gateway_config USING btree (is_active);


--
-- Name: ix_mcp_prompts_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_prompts_category ON public.mcp_prompts USING btree (category);


--
-- Name: ix_mcp_prompts_is_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_prompts_is_enabled ON public.mcp_prompts USING btree (is_enabled);


--
-- Name: ix_mcp_prompts_prompt_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_prompts_prompt_name ON public.mcp_prompts USING btree (prompt_name);


--
-- Name: ix_mcp_prompts_server_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_prompts_server_id ON public.mcp_prompts USING btree (server_id);


--
-- Name: ix_mcp_resources_is_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_resources_is_enabled ON public.mcp_resources USING btree (is_enabled);


--
-- Name: ix_mcp_resources_resource_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_resources_resource_type ON public.mcp_resources USING btree (resource_type);


--
-- Name: ix_mcp_resources_resource_uri; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_resources_resource_uri ON public.mcp_resources USING btree (resource_uri);


--
-- Name: ix_mcp_resources_server_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_resources_server_id ON public.mcp_resources USING btree (server_id);


--
-- Name: ix_mcp_servers_health_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_servers_health_status ON public.mcp_servers USING btree (health_status);


--
-- Name: ix_mcp_servers_is_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_servers_is_enabled ON public.mcp_servers USING btree (is_enabled);


--
-- Name: ix_mcp_servers_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_mcp_servers_name ON public.mcp_servers USING btree (name);


--
-- Name: ix_mcp_servers_server_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_servers_server_type ON public.mcp_servers USING btree (server_type);


--
-- Name: ix_mcp_tool_calls_call_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_tool_calls_call_status ON public.mcp_tool_calls USING btree (call_status);


--
-- Name: ix_mcp_tool_calls_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_tool_calls_created_at ON public.mcp_tool_calls USING btree (created_at);


--
-- Name: ix_mcp_tool_calls_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_tool_calls_session_id ON public.mcp_tool_calls USING btree (session_id);


--
-- Name: ix_mcp_tool_calls_tool_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_tool_calls_tool_id ON public.mcp_tool_calls USING btree (tool_id);


--
-- Name: ix_mcp_tool_calls_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_tool_calls_user_id ON public.mcp_tool_calls USING btree (user_id);


--
-- Name: ix_mcp_tools_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_tools_category ON public.mcp_tools USING btree (category);


--
-- Name: ix_mcp_tools_is_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_tools_is_enabled ON public.mcp_tools USING btree (is_enabled);


--
-- Name: ix_mcp_tools_server_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_tools_server_id ON public.mcp_tools USING btree (server_id);


--
-- Name: ix_mcp_tools_tool_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_tools_tool_name ON public.mcp_tools USING btree (tool_name);


--
-- Name: ix_papers_doi; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_papers_doi ON public.papers USING btree (doi);


--
-- Name: ix_papers_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_papers_id ON public.papers USING btree (id);


--
-- Name: ix_papers_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_papers_title ON public.papers USING btree (title);


--
-- Name: ix_retrieval_results_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_retrieval_results_id ON public.retrieval_results USING btree (id);


--
-- Name: ix_retrieval_results_query; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_retrieval_results_query ON public.retrieval_results USING btree (query);


--
-- Name: ix_retrieval_results_query_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_retrieval_results_query_hash ON public.retrieval_results USING btree (query_hash);


--
-- Name: ix_unla_router_map_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_unla_router_map_is_active ON public.unla_router_map USING btree (is_active);


--
-- Name: ix_unla_router_map_proto_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_unla_router_map_proto_type ON public.unla_router_map USING btree (proto_type);


--
-- Name: ix_unla_router_map_router_prefix; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_unla_router_map_router_prefix ON public.unla_router_map USING btree (router_prefix);


--
-- Name: ix_unla_router_map_server_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_unla_router_map_server_name ON public.unla_router_map USING btree (server_name);


--
-- Name: ix_unla_router_map_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_unla_router_map_tenant ON public.unla_router_map USING btree (tenant);


--
-- Name: custom_hooks trigger_custom_hooks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_custom_hooks_updated_at BEFORE UPDATE ON public.custom_hooks FOR EACH ROW EXECUTE FUNCTION public.update_custom_hooks_updated_at();


--
-- Name: qa_generation_configs trigger_qa_generation_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_qa_generation_configs_updated_at BEFORE UPDATE ON public.qa_generation_configs FOR EACH ROW EXECUTE FUNCTION public.update_qa_generation_configs_updated_at();


--
-- Name: custom_crawler_tools trigger_update_custom_crawler_tools_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_custom_crawler_tools_updated_at BEFORE UPDATE ON public.custom_crawler_tools FOR EACH ROW EXECUTE FUNCTION public.update_custom_crawler_tools_updated_at();


--
-- Name: deepscrape_configs trigger_update_deepscrape_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_deepscrape_configs_updated_at BEFORE UPDATE ON public.deepscrape_configs FOR EACH ROW EXECUTE FUNCTION public.update_deepscrape_configs_updated_at();


--
-- Name: hook_pipelines trigger_update_hook_pipelines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_hook_pipelines_updated_at BEFORE UPDATE ON public.hook_pipelines FOR EACH ROW EXECUTE FUNCTION public.update_hook_pipelines_updated_at();


--
-- Name: user_agent_pipelines trigger_update_user_agent_pipelines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_user_agent_pipelines_updated_at BEFORE UPDATE ON public.user_agent_pipelines FOR EACH ROW EXECUTE FUNCTION public.update_hook_pipelines_updated_at();


--
-- Name: hook_pipelines update_hook_pipelines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_hook_pipelines_updated_at BEFORE UPDATE ON public.hook_pipelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hybrid_agent_strategies update_hybrid_agent_strategies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_hybrid_agent_strategies_updated_at BEFORE UPDATE ON public.hybrid_agent_strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: meta_agent_sessions update_meta_agent_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_meta_agent_sessions_updated_at BEFORE UPDATE ON public.meta_agent_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: qa_route_categories update_qa_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_qa_categories_updated_at BEFORE UPDATE ON public.qa_route_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: qa_routes update_qa_routes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_qa_routes_updated_at BEFORE UPDATE ON public.qa_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: retrieval_path_configs update_retrieval_paths_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_retrieval_paths_updated_at BEFORE UPDATE ON public.retrieval_path_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: unla_router_map update_unla_router_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_unla_router_updated_at BEFORE UPDATE ON public.unla_router_map FOR EACH ROW EXECUTE FUNCTION public.update_unla_router_updated_at_column();


--
-- Name: user_agent_pipelines update_user_agent_pipelines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_agent_pipelines_updated_at BEFORE UPDATE ON public.user_agent_pipelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: youtu_agent_configs update_youtu_agent_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_youtu_agent_configs_updated_at BEFORE UPDATE ON public.youtu_agent_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: youtu_agent_environments update_youtu_agent_environments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_youtu_agent_environments_updated_at BEFORE UPDATE ON public.youtu_agent_environments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: youtu_agent_toolkits update_youtu_agent_toolkits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_youtu_agent_toolkits_updated_at BEFORE UPDATE ON public.youtu_agent_toolkits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: agent_executions agent_executions_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_executions
    ADD CONSTRAINT agent_executions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.unified_agents(id) ON DELETE CASCADE;


--
-- Name: agent_executions agent_executions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_executions
    ADD CONSTRAINT agent_executions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: agent_template_tools agent_template_tools_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_template_tools
    ADD CONSTRAINT agent_template_tools_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.agent_templates(id) ON DELETE CASCADE;


--
-- Name: agent_template_tools agent_template_tools_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_template_tools
    ADD CONSTRAINT agent_template_tools_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.agent_tools(id) ON DELETE CASCADE;


--
-- Name: conversation_message_reactions conversation_message_reactions_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_message_reactions
    ADD CONSTRAINT conversation_message_reactions_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE SET NULL;


--
-- Name: conversation_message_reactions conversation_message_reactions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_message_reactions
    ADD CONSTRAINT conversation_message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.conversation_messages(id) ON DELETE SET NULL;


--
-- Name: crawl_results crawl_results_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crawl_results
    ADD CONSTRAINT crawl_results_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.crawl_tasks(task_id) ON DELETE CASCADE;


--
-- Name: custom_crawler_tools custom_crawler_tools_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_crawler_tools
    ADD CONSTRAINT custom_crawler_tools_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: custom_hook_executions custom_hook_executions_hook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_hook_executions
    ADD CONSTRAINT custom_hook_executions_hook_id_fkey FOREIGN KEY (hook_id) REFERENCES public.custom_hooks(hook_id) ON DELETE CASCADE;


--
-- Name: custom_hook_versions custom_hook_versions_hook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_hook_versions
    ADD CONSTRAINT custom_hook_versions_hook_id_fkey FOREIGN KEY (hook_id) REFERENCES public.custom_hooks(hook_id) ON DELETE CASCADE;


--
-- Name: custom_tool_executions custom_tool_executions_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_tool_executions
    ADD CONSTRAINT custom_tool_executions_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.custom_crawler_tools(id) ON DELETE CASCADE;


--
-- Name: custom_tool_executions custom_tool_executions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_tool_executions
    ADD CONSTRAINT custom_tool_executions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: deepscrape_configs deepscrape_configs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deepscrape_configs
    ADD CONSTRAINT deepscrape_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: error_logs error_logs_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.youtu_agent_executions(id);


--
-- Name: conversations fk_conversations_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: document_chunks fk_document_chunks_document; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT fk_document_chunks_document FOREIGN KEY (document_id) REFERENCES public.knowledge_documents(id);


--
-- Name: knowledge_documents fk_knowledge_documents_collection; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_documents
    ADD CONSTRAINT fk_knowledge_documents_collection FOREIGN KEY (collection_id) REFERENCES public.knowledge_collections(id);


--
-- Name: qa_datasets fk_qa_datasets_extraction_task; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_datasets
    ADD CONSTRAINT fk_qa_datasets_extraction_task FOREIGN KEY (extraction_task_id) REFERENCES public.qa_extraction_queue(id);


--
-- Name: qa_datasets fk_qa_datasets_source_document; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_datasets
    ADD CONSTRAINT fk_qa_datasets_source_document FOREIGN KEY (source_document_id) REFERENCES public.knowledge_documents(id);


--
-- Name: qa_extraction_queue fk_qa_extraction_queue_target_dataset; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_extraction_queue
    ADD CONSTRAINT fk_qa_extraction_queue_target_dataset FOREIGN KEY (target_dataset_id) REFERENCES public.qa_datasets(id);


--
-- Name: qa_pairs fk_qa_pairs_extraction_task; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_pairs
    ADD CONSTRAINT fk_qa_pairs_extraction_task FOREIGN KEY (extraction_task_id) REFERENCES public.qa_extraction_queue(id);


--
-- Name: qa_pairs fk_qa_pairs_source_document; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_pairs
    ADD CONSTRAINT fk_qa_pairs_source_document FOREIGN KEY (source_document_id) REFERENCES public.knowledge_documents(id);


--
-- Name: team_execution_steps fk_team_execution_steps_execution; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_execution_steps
    ADD CONSTRAINT fk_team_execution_steps_execution FOREIGN KEY (execution_id) REFERENCES public.team_executions(id);


--
-- Name: generated_qa_pairs generated_qa_pairs_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_qa_pairs
    ADD CONSTRAINT generated_qa_pairs_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.qa_generation_tasks(id) ON DELETE CASCADE;


--
-- Name: hirag_community_reports hirag_community_reports_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hirag_community_reports
    ADD CONSTRAINT hirag_community_reports_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.knowledge_collections(id) ON DELETE SET NULL;


--
-- Name: hirag_configs hirag_configs_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hirag_configs
    ADD CONSTRAINT hirag_configs_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.knowledge_collections(id) ON DELETE SET NULL;


--
-- Name: hook_execution_logs hook_execution_logs_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hook_execution_logs
    ADD CONSTRAINT hook_execution_logs_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.hook_pipelines(id) ON DELETE CASCADE;


--
-- Name: knowledge_folders knowledge_folders_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_folders
    ADD CONSTRAINT knowledge_folders_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.knowledge_collections(id) ON DELETE CASCADE;


--
-- Name: knowledge_folders knowledge_folders_parent_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_folders
    ADD CONSTRAINT knowledge_folders_parent_folder_id_fkey FOREIGN KEY (parent_folder_id) REFERENCES public.knowledge_folders(id) ON DELETE CASCADE;


--
-- Name: mcp_prompts mcp_prompts_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_prompts
    ADD CONSTRAINT mcp_prompts_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.mcp_servers(id) ON DELETE CASCADE;


--
-- Name: mcp_resources mcp_resources_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_resources
    ADD CONSTRAINT mcp_resources_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.mcp_servers(id) ON DELETE CASCADE;


--
-- Name: mcp_tool_calls mcp_tool_calls_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_tool_calls
    ADD CONSTRAINT mcp_tool_calls_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.mcp_tools(id) ON DELETE CASCADE;


--
-- Name: mcp_tool_calls mcp_tool_calls_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_tool_calls
    ADD CONSTRAINT mcp_tool_calls_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: mcp_tools mcp_tools_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_tools
    ADD CONSTRAINT mcp_tools_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.mcp_servers(id) ON DELETE CASCADE;


--
-- Name: meta_agent_sessions meta_agent_sessions_generated_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_agent_sessions
    ADD CONSTRAINT meta_agent_sessions_generated_config_id_fkey FOREIGN KEY (generated_config_id) REFERENCES public.youtu_agent_configs(id);


--
-- Name: qa_categories qa_categories_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_categories
    ADD CONSTRAINT qa_categories_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.qa_datasets(id) ON DELETE CASCADE;


--
-- Name: qa_datasets qa_datasets_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_datasets
    ADD CONSTRAINT qa_datasets_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.knowledge_collections(id) ON DELETE CASCADE;


--
-- Name: qa_extraction_queue qa_extraction_queue_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_extraction_queue
    ADD CONSTRAINT qa_extraction_queue_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.knowledge_documents(id) ON DELETE CASCADE;


--
-- Name: qa_extraction_workers qa_extraction_workers_current_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_extraction_workers
    ADD CONSTRAINT qa_extraction_workers_current_task_id_fkey FOREIGN KEY (current_task_id) REFERENCES public.qa_extraction_queue(id);


--
-- Name: qa_pair_hits qa_pair_hits_qa_pair_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_pair_hits
    ADD CONSTRAINT qa_pair_hits_qa_pair_id_fkey FOREIGN KEY (qa_pair_id) REFERENCES public.qa_pairs(id) ON DELETE CASCADE;


--
-- Name: qa_pairs qa_pairs_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_pairs
    ADD CONSTRAINT qa_pairs_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.qa_datasets(id) ON DELETE CASCADE;


--
-- Name: qa_route_categories qa_route_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_route_categories
    ADD CONSTRAINT qa_route_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.qa_route_categories(id) ON DELETE CASCADE;


--
-- Name: qa_route_import_history qa_route_import_history_qa_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_route_import_history
    ADD CONSTRAINT qa_route_import_history_qa_dataset_id_fkey FOREIGN KEY (qa_dataset_id) REFERENCES public.qa_datasets(id) ON DELETE SET NULL;


--
-- Name: qa_route_match_logs qa_route_match_logs_qa_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_route_match_logs
    ADD CONSTRAINT qa_route_match_logs_qa_route_id_fkey FOREIGN KEY (qa_route_id) REFERENCES public.qa_routes(id) ON DELETE SET NULL;


--
-- Name: unified_agents unified_agents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_agents
    ADD CONSTRAINT unified_agents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: user_agent_pipelines user_agent_pipelines_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agent_pipelines
    ADD CONSTRAINT user_agent_pipelines_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.hook_pipelines(id) ON DELETE CASCADE;


--
-- Name: user_agent_tools user_agent_tools_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agent_tools
    ADD CONSTRAINT user_agent_tools_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.user_agents(id) ON DELETE CASCADE;


--
-- Name: user_agent_tools user_agent_tools_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agent_tools
    ADD CONSTRAINT user_agent_tools_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.agent_tools(id) ON DELETE CASCADE;


--
-- Name: user_agents user_agents_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agents
    ADD CONSTRAINT user_agents_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.knowledge_collections(id) ON DELETE SET NULL;


--
-- Name: user_agents user_agents_default_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agents
    ADD CONSTRAINT user_agents_default_pipeline_id_fkey FOREIGN KEY (default_pipeline_id) REFERENCES public.hook_pipelines(id) ON DELETE SET NULL;


--
-- Name: user_agents user_agents_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agents
    ADD CONSTRAINT user_agents_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.agent_templates(id) ON DELETE SET NULL;


--
-- Name: user_agents user_agents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_agents
    ADD CONSTRAINT user_agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: youtu_agent_execution_steps youtu_agent_execution_steps_execution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtu_agent_execution_steps
    ADD CONSTRAINT youtu_agent_execution_steps_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.youtu_agent_executions(id) ON DELETE CASCADE;


--
-- Name: youtu_agent_executions youtu_agent_executions_agent_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtu_agent_executions
    ADD CONSTRAINT youtu_agent_executions_agent_config_id_fkey FOREIGN KEY (agent_config_id) REFERENCES public.youtu_agent_configs(id);


--
-- PostgreSQL database dump complete
--

