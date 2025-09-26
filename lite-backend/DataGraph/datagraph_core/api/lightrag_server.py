"""
LightRAG FastAPI Server
"""

from fastapi import FastAPI, Depends, HTTPException, status
import asyncio
import os
import logging
import logging.config
import signal
import sys
import uvicorn
import pipmaster as pm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pathlib import Path
import configparser
from ascii_colors import ASCIIColors
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from .utils_api import (
    get_combined_auth_dependency,
    display_splash_screen,
    check_env_file,
)
from .config import (
    global_args,
    update_uvicorn_mode_config,
    get_default_host,
)
from ..utils import get_env_value
from ..lightrag import LightRAG
from .. import __version__ as core_version
from . import __api_version__
from ..types import GPTKeywordExtractionFormat
from ..utils import EmbeddingFunc
from ..constants import (
    DEFAULT_LOG_MAX_BYTES,
    DEFAULT_LOG_BACKUP_COUNT,
    DEFAULT_LOG_FILENAME,
)
from .routers.document_routes import (
    DocumentManager,
    create_document_routes,
    run_scanning_process,
)
from .routers.query_routes import create_query_routes
from .routers.graph_routes import create_graph_routes
from .routers.ollama_api import OllamaAPI

from ..utils import logger, set_verbose_debug
from ..kg.shared_storage import (
    get_namespace_data,
    get_pipeline_status_lock,
    initialize_pipeline_status,
    cleanup_keyed_lock,
    finalize_share_data,
)
from fastapi.security import OAuth2PasswordRequestForm
from .auth import auth_handler

# 使用统一的环境配置加载器，支持从父目录继承配置
from ..env_loader import load_matgraph_env
load_matgraph_env()


webui_title = os.getenv("WEBUI_TITLE")
webui_description = os.getenv("WEBUI_DESCRIPTION")

# Initialize config parser
config = configparser.ConfigParser()
config.read("config.ini")

# Global authentication configuration
auth_configured = bool(auth_handler.accounts)


def _inject_models_from_gateway(args):
    """Best-effort: pull default models from 9050 gateway and inject into args.

    Rules:
    - Only update chat LLM model and rerank model/host/key.
    - Do NOT change embedding model/dimension to avoid dim mismatch across existing data.
    - If gateway unreachable or malformed, keep existing configuration.
    """
    try:
        import httpx
    except Exception:
        return  # httpx missing; skip silently

    base = os.getenv("MODELS_GATEWAY_BASE_URL", "http://localhost:9050")
    url = base.rstrip("/") + "/v1/models/enabled"

    try:
        with httpx.Client(timeout=3.0) as client:
            resp = client.get(url)
            if resp.status_code != 200:
                logger.warning(f"[GatewayInject] GET {url} -> {resp.status_code}")
                return
            data = resp.json()
    except Exception as e:
        logger.warning(f"[GatewayInject] fetch models failed: {e}")
        return

    providers = data.get("providers") or []
    # Filter out known bogus entries (e.g., id==2, name=='string')
    providers = [
        p for p in providers
        if str(p.get("name", "")).lower() != "string" and str(p.get("id", "")) != "2"
    ]

    chat_model = None
    rerank_model = None

    for p in providers:
        for m in p.get("models", []) or []:
            mtype = str(m.get("model_type", "")).lower()
            if mtype == "chat":
                # prefer default flag if present
                if m.get("default") is True and chat_model is None:
                    chat_model = m.get("model_id") or m.get("id")
                if chat_model is None:
                    chat_model = m.get("model_id") or m.get("id")
            elif mtype == "rerank":
                if m.get("default") is True and rerank_model is None:
                    rerank_model = m.get("model_id") or m.get("id")
                if rerank_model is None:
                    rerank_model = m.get("model_id") or m.get("id")

    updated = []
    gw_base_v1 = base.rstrip("/") + "/v1"

    if chat_model:
        # Force openai-compatible binding to the gateway
        args.llm_binding = "openai"
        args.llm_binding_host = gw_base_v1
        # api_key may be empty if gateway has no auth; pass empty string to avoid env KeyError
        args.llm_binding_api_key = os.getenv("ONE_API_KEY", "")
        args.llm_model = chat_model
        updated.append(f"chat={chat_model}")

    if rerank_model:
        args.rerank_model = rerank_model
        args.rerank_binding_host = gw_base_v1
        args.rerank_binding_api_key = os.getenv("ONE_API_KEY", "")
        updated.append(f"rerank={rerank_model}")

    if updated:
        logger.info("[GatewayInject] Applied models from gateway: " + ", ".join(updated) +
                    " (embedding unchanged to avoid dim mismatch)")


def setup_signal_handlers():
    """Setup signal handlers for graceful shutdown"""

    def signal_handler(sig, frame):
        print(f"\n\nReceived signal {sig}, shutting down gracefully...")
        print(f"Process ID: {os.getpid()}")

        # Release shared resources
        finalize_share_data()

        # Exit with success status
        sys.exit(0)

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)  # Ctrl+C
    signal.signal(signal.SIGTERM, signal_handler)  # kill command


def create_app(args):
    # Setup logging
    logger.setLevel(args.log_level)
    set_verbose_debug(args.verbose)

    # Verify that bindings are correctly setup
    if args.llm_binding not in [
        "lollms",
        "ollama",
        "openai",
        "openai-ollama",
        "azure_openai",
    ]:
        raise Exception("llm binding not supported")

    if args.embedding_binding not in [
        "lollms",
        "ollama",
        "openai",
        "azure_openai",
        "jina",
    ]:
        raise Exception("embedding binding not supported")

    # Try injecting default models from gateway (only chat & rerank)
    try:
        _inject_models_from_gateway(args)
    except Exception as e:
        logger.warning(f"[GatewayInject] skip due to error: {e}")

    # Set default hosts if not provided
    if args.llm_binding_host is None:
        args.llm_binding_host = get_default_host(args.llm_binding)

    if args.embedding_binding_host is None:
        args.embedding_binding_host = get_default_host(args.embedding_binding)

    # Add SSL validation
    if args.ssl:
        if not args.ssl_certfile or not args.ssl_keyfile:
            raise Exception(
                "SSL certificate and key files must be provided when SSL is enabled"
            )
        if not os.path.exists(args.ssl_certfile):
            raise Exception(f"SSL certificate file not found: {args.ssl_certfile}")
        if not os.path.exists(args.ssl_keyfile):
            raise Exception(f"SSL key file not found: {args.ssl_keyfile}")

    # Check if API key is provided either through env var or args
    api_key = os.getenv("LIGHTRAG_API_KEY") or args.key

    # Initialize document manager with workspace support for data isolation
    doc_manager = DocumentManager(args.input_dir, workspace=args.workspace)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        """Lifespan context manager for startup and shutdown events"""
        # Store background tasks
        app.state.background_tasks = set()

        try:
            # Initialize database connections
            await rag.initialize_storages()

            await initialize_pipeline_status()
            pipeline_status = await get_namespace_data("pipeline_status")

            should_start_autoscan = False
            async with get_pipeline_status_lock():
                # Auto scan documents if enabled
                if args.auto_scan_at_startup:
                    if not pipeline_status.get("autoscanned", False):
                        pipeline_status["autoscanned"] = True
                        should_start_autoscan = True

            # Only run auto scan when no other process started it first
            if should_start_autoscan:
                # Create background task
                task = asyncio.create_task(run_scanning_process(rag, doc_manager))
                app.state.background_tasks.add(task)
                task.add_done_callback(app.state.background_tasks.discard)
                logger.info(f"Process {os.getpid()} auto scan task started at startup.")

            ASCIIColors.green("\nServer is ready to accept connections! 🚀\n")

            yield

        finally:
            # Clean up database connections
            await rag.finalize_storages()

            # Clean up shared data
            finalize_share_data()

    # Initialize FastAPI
    app_kwargs = {
        "title": "DataGraph Server API",
        "description": "Providing API for LightRAG core, Web UI and Ollama Model Emulation"
        + "(With authentication)"
        if api_key
        else "",
        "version": __api_version__,
        "openapi_url": "/openapi.json",  # Explicitly set OpenAPI schema URL
        "docs_url": "/docs",  # Explicitly set docs URL
        "redoc_url": "/redoc",  # Explicitly set redoc URL
        "lifespan": lifespan,
    }

    # Configure Swagger UI parameters
    # Enable persistAuthorization and tryItOutEnabled for better user experience
    app_kwargs["swagger_ui_parameters"] = {
        "persistAuthorization": True,
        "tryItOutEnabled": True,
    }

    app = FastAPI(**app_kwargs)

    def get_cors_origins():
        """Get allowed origins from global_args
        Returns a list of allowed origins, defaults to ["*"] if not set
        """
        origins_str = global_args.cors_origins
        if origins_str == "*":
            return ["*"]
        return [origin.strip() for origin in origins_str.split(",")]

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Create combined auth dependency for all endpoints
    combined_auth = get_combined_auth_dependency(api_key)

    # Create working directory if it doesn't exist
    Path(args.working_dir).mkdir(parents=True, exist_ok=True)
    if args.llm_binding == "lollms" or args.embedding_binding == "lollms":
        from ..llm.lollms import lollms_model_complete, lollms_embed
    if args.llm_binding == "ollama" or args.embedding_binding == "ollama":
        from ..llm.ollama import ollama_model_complete, ollama_embed
        from ..llm.binding_options import OllamaLLMOptions
    if args.llm_binding == "openai" or args.embedding_binding == "openai":
        from ..llm.openai import openai_complete_if_cache, openai_embed
    if args.llm_binding == "azure_openai" or args.embedding_binding == "azure_openai":
        from ..llm.azure_openai import (
            azure_openai_complete_if_cache,
            azure_openai_embed,
        )
    if args.llm_binding_host == "openai-ollama" or args.embedding_binding == "ollama":
        from ..llm.openai import openai_complete_if_cache
        from ..llm.ollama import ollama_embed
        from ..llm.binding_options import OllamaEmbeddingOptions
    if args.embedding_binding == "jina":
        from ..llm.jina import jina_embed

    async def openai_alike_model_complete(
        prompt,
        system_prompt=None,
        history_messages=None,
        keyword_extraction=False,
        **kwargs,
    ) -> str:
        keyword_extraction = kwargs.pop("keyword_extraction", None)
        if keyword_extraction:
            kwargs["response_format"] = GPTKeywordExtractionFormat
        if history_messages is None:
            history_messages = []
        kwargs["temperature"] = args.temperature
        return await openai_complete_if_cache(
            args.llm_model,
            prompt,
            system_prompt=system_prompt,
            history_messages=history_messages,
            base_url=args.llm_binding_host,
            api_key=args.llm_binding_api_key,
            **kwargs,
        )

    async def azure_openai_model_complete(
        prompt,
        system_prompt=None,
        history_messages=None,
        keyword_extraction=False,
        **kwargs,
    ) -> str:
        keyword_extraction = kwargs.pop("keyword_extraction", None)
        if keyword_extraction:
            kwargs["response_format"] = GPTKeywordExtractionFormat
        if history_messages is None:
            history_messages = []
        kwargs["temperature"] = args.temperature
        return await azure_openai_complete_if_cache(
            args.llm_model,
            prompt,
            system_prompt=system_prompt,
            history_messages=history_messages,
            base_url=args.llm_binding_host,
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview"),
            **kwargs,
        )

    embedding_func = EmbeddingFunc(
        embedding_dim=args.embedding_dim,
        func=lambda texts: lollms_embed(
            texts,
            embed_model=args.embedding_model,
            host=args.embedding_binding_host,
            api_key=args.embedding_binding_api_key,
        )
        if args.embedding_binding == "lollms"
        else ollama_embed(
            texts,
            embed_model=args.embedding_model,
            host=args.embedding_binding_host,
            api_key=args.embedding_binding_api_key,
            options=OllamaEmbeddingOptions.options_dict(args),
        )
        if args.embedding_binding == "ollama"
        else azure_openai_embed(
            texts,
            model=args.embedding_model,  # no host is used for openai,
            api_key=args.embedding_binding_api_key,
        )
        if args.embedding_binding == "azure_openai"
        else jina_embed(
            texts,
            dimensions=args.embedding_dim,
            base_url=args.embedding_binding_host,
            api_key=args.embedding_binding_api_key,
        )
        if args.embedding_binding == "jina"
        else openai_embed(
            texts,
            model=args.embedding_model,
            base_url=args.embedding_binding_host,
            api_key=args.embedding_binding_api_key,
        ),
    )

    # Configure rerank function (runtime updatable)
    def _make_rerank_func():
        if args.rerank_binding_api_key and args.rerank_binding_host and args.rerank_model:
            from ..rerank import custom_rerank

            async def server_rerank_func(query: str, documents: list, top_n: int = None, **kwargs):
                return await custom_rerank(
                    query=query,
                    documents=documents,
                    model=args.rerank_model,
                    base_url=args.rerank_binding_host,
                    api_key=args.rerank_binding_api_key,
                    top_n=top_n,
                    **kwargs,
                )

            return server_rerank_func
        return None

    app.state.rerank_model_func = _make_rerank_func()
    # Maintain a local variable for downstream usage where a variable named
    # `rerank_model_func` is expected (e.g., LightRAG ctor kwargs or health).
    rerank_model_func = app.state.rerank_model_func
    if app.state.rerank_model_func is None:
        logger.info("Rerank model not configured. Set RERANK_BINDING_API_KEY and RERANK_BINDING_HOST to enable reranking.")
    else:
        logger.info(f"Rerank model configured: {args.rerank_model} (can be enabled per query)")

    # Create ollama_server_infos from command line arguments
    from .config import OllamaServerInfos

    ollama_server_infos = OllamaServerInfos(
        name=args.simulated_model_name, tag=args.simulated_model_tag
    )

    # Initialize RAG
    if args.llm_binding in ["lollms", "ollama", "openai"]:
        rag = LightRAG(
            working_dir=args.working_dir,
            workspace=args.workspace,
            llm_model_func=lollms_model_complete
            if args.llm_binding == "lollms"
            else ollama_model_complete
            if args.llm_binding == "ollama"
            else openai_alike_model_complete,
            llm_model_name=args.llm_model,
            llm_model_max_async=args.max_async,
            summary_max_tokens=args.max_tokens,
            chunk_token_size=int(args.chunk_size),
            chunk_overlap_token_size=int(args.chunk_overlap_size),
            llm_model_kwargs={
                "host": args.llm_binding_host,
                "timeout": args.timeout,
                "options": OllamaLLMOptions.options_dict(args),
                "api_key": args.llm_binding_api_key,
            }
            if args.llm_binding == "lollms" or args.llm_binding == "ollama"
            else {},
            embedding_func=embedding_func,
            kv_storage=args.kv_storage,
            graph_storage=args.graph_storage,
            vector_storage=args.vector_storage,
            doc_status_storage=args.doc_status_storage,
            vector_db_storage_cls_kwargs={
                "cosine_better_than_threshold": args.cosine_threshold
            },
            enable_llm_cache_for_entity_extract=args.enable_llm_cache_for_extract,
            enable_llm_cache=args.enable_llm_cache,
            rerank_model_func=rerank_model_func,
            auto_manage_storages_states=False,
            max_parallel_insert=args.max_parallel_insert,
            max_graph_nodes=args.max_graph_nodes,
            addon_params={"language": args.summary_language},
            ollama_server_infos=ollama_server_infos,
        )
    else:  # azure_openai
        rag = LightRAG(
            working_dir=args.working_dir,
            workspace=args.workspace,
            llm_model_func=azure_openai_model_complete,
            chunk_token_size=int(args.chunk_size),
            chunk_overlap_token_size=int(args.chunk_overlap_size),
            llm_model_kwargs={
                "timeout": args.timeout,
            },
            llm_model_name=args.llm_model,
            llm_model_max_async=args.max_async,
            summary_max_tokens=args.max_tokens,
            embedding_func=embedding_func,
            kv_storage=args.kv_storage,
            graph_storage=args.graph_storage,
            vector_storage=args.vector_storage,
            doc_status_storage=args.doc_status_storage,
            vector_db_storage_cls_kwargs={
                "cosine_better_than_threshold": args.cosine_threshold
            },
            enable_llm_cache_for_entity_extract=args.enable_llm_cache_for_extract,
            enable_llm_cache=args.enable_llm_cache,
            rerank_model_func=rerank_model_func,
            auto_manage_storages_states=False,
            max_parallel_insert=args.max_parallel_insert,
            max_graph_nodes=args.max_graph_nodes,
            addon_params={"language": args.summary_language},
            ollama_server_infos=ollama_server_infos,
        )

    # Add routes
    app.include_router(
        create_document_routes(
            rag,
            doc_manager,
            api_key,
        )
    )
    app.include_router(create_query_routes(rag, api_key, args.top_k))
    app.include_router(create_graph_routes(rag, api_key))

    # Add Ollama API routes
    ollama_api = OllamaAPI(rag, top_k=args.top_k, api_key=api_key)
    app.include_router(ollama_api.router, prefix="/api")

    @app.get("/")
    async def redirect_to_webui():
        """Redirect root path to /webui"""
        return RedirectResponse(url="/webui")

    @app.get("/auth-status")
    async def get_auth_status():
        """Get authentication status and guest token if auth is not configured"""

        if not auth_handler.accounts:
            # Authentication not configured, return guest token
            guest_token = auth_handler.create_token(
                username="guest", role="guest", metadata={"auth_mode": "disabled"}
            )
            return {
                "auth_configured": False,
                "access_token": guest_token,
                "token_type": "bearer",
                "auth_mode": "disabled",
                "message": "Authentication is disabled. Using guest access.",
                "core_version": core_version,
                "api_version": __api_version__,
                "webui_title": webui_title,
                "webui_description": webui_description,
            }

        return {
            "auth_configured": True,
            "auth_mode": "enabled",
            "core_version": core_version,
            "api_version": __api_version__,
            "webui_title": webui_title,
            "webui_description": webui_description,
        }

    @app.post("/login")
    async def login(form_data: OAuth2PasswordRequestForm = Depends()):
        if not auth_handler.accounts:
            # Authentication not configured, return guest token
            guest_token = auth_handler.create_token(
                username="guest", role="guest", metadata={"auth_mode": "disabled"}
            )
            return {
                "access_token": guest_token,
                "token_type": "bearer",
                "auth_mode": "disabled",
                "message": "Authentication is disabled. Using guest access.",
                "core_version": core_version,
                "api_version": __api_version__,
                "webui_title": webui_title,
                "webui_description": webui_description,
            }
        username = form_data.username
        if auth_handler.accounts.get(username) != form_data.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials"
            )

        # Regular user login
        user_token = auth_handler.create_token(
            username=username, role="user", metadata={"auth_mode": "enabled"}
        )
        return {
            "access_token": user_token,
            "token_type": "bearer",
            "auth_mode": "enabled",
            "core_version": core_version,
            "api_version": __api_version__,
            "webui_title": webui_title,
            "webui_description": webui_description,
        }

    @app.get("/health", dependencies=[Depends(combined_auth)])
    async def get_status():
        """Get current system status"""
        try:
            pipeline_status = await get_namespace_data("pipeline_status")

            if not auth_configured:
                auth_mode = "disabled"
            else:
                auth_mode = "enabled"

            # Cleanup expired keyed locks and get status
            keyed_lock_info = cleanup_keyed_lock()

            return {
                "status": "healthy",
                "working_directory": str(args.working_dir),
                "input_directory": str(args.input_dir),
                "configuration": {
                    # LLM configuration binding/host address (if applicable)/model (if applicable)
                    "llm_binding": args.llm_binding,
                    "llm_binding_host": args.llm_binding_host,
                    "llm_model": args.llm_model,
                    # embedding model configuration binding/host address (if applicable)/model (if applicable)
                    "embedding_binding": args.embedding_binding,
                    "embedding_binding_host": args.embedding_binding_host,
                    "embedding_model": args.embedding_model,
                    "max_tokens": args.max_tokens,
                    "kv_storage": args.kv_storage,
                    "doc_status_storage": args.doc_status_storage,
                    "graph_storage": args.graph_storage,
                    "vector_storage": args.vector_storage,
                    "enable_llm_cache_for_extract": args.enable_llm_cache_for_extract,
                    "enable_llm_cache": args.enable_llm_cache,
                    "workspace": args.workspace,
                    "max_graph_nodes": args.max_graph_nodes,
                    # Rerank configuration (runtime)
                    "enable_rerank": app.state.rerank_model_func is not None,
                    "rerank_model": args.rerank_model if app.state.rerank_model_func is not None else None,
                    "rerank_binding_host": args.rerank_binding_host if app.state.rerank_model_func is not None else None,
                    # Environment variable status (requested configuration)
                    "summary_language": args.summary_language,
                    "force_llm_summary_on_merge": args.force_llm_summary_on_merge,
                    "max_parallel_insert": args.max_parallel_insert,
                    "cosine_threshold": args.cosine_threshold,
                    "min_rerank_score": args.min_rerank_score,
                    "related_chunk_number": args.related_chunk_number,
                    "max_async": args.max_async,
                    "embedding_func_max_async": args.embedding_func_max_async,
                    "embedding_batch_num": args.embedding_batch_num,
                },
                "auth_mode": auth_mode,
                "pipeline_busy": pipeline_status.get("busy", False),
                "keyed_locks": keyed_lock_info,
                "core_version": core_version,
                "api_version": __api_version__,
                "webui_title": webui_title,
                "webui_description": webui_description,
            }
        except Exception as e:
            logger.error(f"Error getting health status: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    # Custom StaticFiles class for smart caching
    class SmartStaticFiles(StaticFiles):  # Renamed from NoCacheStaticFiles
        async def get_response(self, path: str, scope):
            response = await super().get_response(path, scope)

            if path.endswith(".html"):
                response.headers["Cache-Control"] = (
                    "no-cache, no-store, must-revalidate"
                )
                response.headers["Pragma"] = "no-cache"
                response.headers["Expires"] = "0"
            elif (
                "/assets/" in path
            ):  # Assets (JS, CSS, images, fonts) generated by Vite with hash in filename
                response.headers["Cache-Control"] = (
                    "public, max-age=31536000, immutable"
                )
            # Add other rules here if needed for non-HTML, non-asset files

            # Ensure correct Content-Type
            if path.endswith(".js"):
                response.headers["Content-Type"] = "application/javascript"
            elif path.endswith(".css"):
                response.headers["Content-Type"] = "text/css"

            return response

    # WebUI static directory resolution (no fallback):
    # 1) If MATGRAPH_WEBUI_DIR is set, use it
    # 2) Else use DataGraph/lightrag/api/webui
    # If directory not found, raise error to avoid loading stale assets
    env_dir = os.getenv("MATGRAPH_WEBUI_DIR")
    if env_dir:
        static_dir = Path(env_dir)
    else:
        datagraph_root = Path(__file__).resolve().parents[2]
        static_dir = datagraph_root / "lightrag" / "api" / "webui"

    if not static_dir.is_dir():
        raise RuntimeError(
            f"WebUI directory not found: {static_dir}. Set MATGRAPH_WEBUI_DIR to a valid path or build assets to DataGraph/lightrag/api/webui."
        )
    logger.info(f"Serving WebUI static from (strict): {static_dir}")
    app.mount(
        "/webui",
        SmartStaticFiles(directory=static_dir, html=True, check_dir=True),
        name="webui",
    )

    @app.get("/config/models/enabled", dependencies=[Depends(combined_auth)])
    async def list_enabled_models():
        base = os.getenv("MODELS_GATEWAY_BASE_URL", "http://localhost:9050").rstrip("/")
        url = base + "/v1/models/enabled"
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(url)
                r.raise_for_status()
                payload = r.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"gateway error: {e}")

        providers = payload.get("providers") or []
        providers = [p for p in providers if str(p.get("name", "")).lower() != "string" and str(p.get("id", "")) != "2"]
        chat, rerank = [], []
        for p in providers:
            for m in (p.get("models") or []):
                mt = str(m.get("model_type", "")).lower()
                # Normalize default flags from upstream (default_chat/default_rerank/default_embedding)
                is_default = bool(
                    m.get("default")
                    or (mt == "chat" and m.get("default_chat"))
                    or (mt == "rerank" and m.get("default_rerank"))
                    or (mt == "embedding" and m.get("default_embedding"))
                )
                entry = {
                    "provider": p.get("name"),
                    "model_id": m.get("model_id") or m.get("id"),
                    "display_name": m.get("display_name") or m.get("model_id") or m.get("id"),
                    "default": is_default,
                }
                if mt == "chat":
                    chat.append(entry)
                elif mt == "rerank":
                    rerank.append(entry)
        return {"chat": chat, "rerank": rerank, "gateway": base + "/v1"}

    @app.post("/config/models/apply", dependencies=[Depends(combined_auth)])
    async def apply_models(payload: dict):
        llm_model = payload.get("llm_model")
        rerank_model = payload.get("rerank_model")
        use_gateway = payload.get("use_gateway", True)

        gw_v1 = os.getenv("MODELS_GATEWAY_BASE_URL", "http://localhost:9050").rstrip("/") + "/v1"
        gw_key = os.getenv("ONE_API_KEY", "")

        changed = {}
        if llm_model:
            args.llm_model = llm_model
            if use_gateway:
                args.llm_binding = "openai"
                args.llm_binding_host = gw_v1
                args.llm_binding_api_key = gw_key
            changed["llm_model"] = llm_model
        if rerank_model:
            args.rerank_model = rerank_model
            if use_gateway:
                args.rerank_binding_host = gw_v1
                args.rerank_binding_api_key = gw_key
            app.state.rerank_model_func = _make_rerank_func()
            changed["rerank_model"] = rerank_model
        if not changed:
            return {"updated": False, "message": "no changes"}
        logger.info(f"[RuntimeConfig] updated: {changed}")
        return {"updated": True, "changed": changed}

    return app


def get_application(args=None):
    """Factory function for creating the FastAPI application"""
    if args is None:
        args = global_args
    return create_app(args)


def configure_logging():
    """Configure logging for uvicorn startup"""

    # Reset any existing handlers to ensure clean configuration
    for logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error", "lightrag"]:
        logger = logging.getLogger(logger_name)
        logger.handlers = []
        logger.filters = []

    # Get log directory path from environment variable
    log_dir = os.getenv("LOG_DIR", os.getcwd())
    log_file_path = os.path.abspath(os.path.join(log_dir, DEFAULT_LOG_FILENAME))

    print(f"\nDataGraph log file: {log_file_path}\n")
    os.makedirs(os.path.dirname(log_dir), exist_ok=True)

    # Get log file max size and backup count from environment variables
    log_max_bytes = get_env_value("LOG_MAX_BYTES", DEFAULT_LOG_MAX_BYTES, int)
    log_backup_count = get_env_value("LOG_BACKUP_COUNT", DEFAULT_LOG_BACKUP_COUNT, int)

    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(levelname)s: %(message)s",
                },
                "detailed": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "console": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stderr",
                },
                "file": {
                    "formatter": "detailed",
                    "class": "logging.handlers.RotatingFileHandler",
                    "filename": log_file_path,
                    "maxBytes": log_max_bytes,
                    "backupCount": log_backup_count,
                    "encoding": "utf-8",
                },
            },
            "loggers": {
                # Configure all uvicorn related loggers
                "uvicorn": {
                    "handlers": ["console", "file"],
                    "level": "INFO",
                    "propagate": False,
                },
                "uvicorn.access": {
                    "handlers": ["console", "file"],
                    "level": "INFO",
                    "propagate": False,
                    "filters": ["path_filter"],
                },
                "uvicorn.error": {
                    "handlers": ["console", "file"],
                    "level": "INFO",
                    "propagate": False,
                },
                "lightrag": {
                    "handlers": ["console", "file"],
                    "level": "INFO",
                    "propagate": False,
                    "filters": ["path_filter"],
                },
            },
            "filters": {
                "path_filter": {
                    "()": "datagraph_core.utils.LightragPathFilter",
                },
            },
        }
    )


def check_and_install_dependencies():
    """Check and install required dependencies"""
    required_packages = [
        "uvicorn",
        "tiktoken",
        "fastapi",
        # Add other required packages here
    ]

    for package in required_packages:
        if not pm.is_installed(package):
            print(f"Installing {package}...")
            pm.install(package)
            print(f"{package} installed successfully")


def main():
    # Check if running under Gunicorn
    if "GUNICORN_CMD_ARGS" in os.environ:
        # If started with Gunicorn, return directly as Gunicorn will call get_application
        print("Running under Gunicorn - worker management handled by Gunicorn")
        return

    # Check .env file
    if not check_env_file():
        sys.exit(1)

    # Check and install dependencies
    check_and_install_dependencies()

    from multiprocessing import freeze_support

    freeze_support()

    # Configure logging before parsing args
    configure_logging()
    update_uvicorn_mode_config()
    display_splash_screen(global_args)

    # Setup signal handlers for graceful shutdown
    setup_signal_handlers()

    # Create application instance directly instead of using factory function
    app = create_app(global_args)

    # Start Uvicorn in single process mode
    uvicorn_config = {
        "app": app,  # Pass application instance directly instead of string path
        "host": global_args.host,
        "port": global_args.port,
        "log_config": None,  # Disable default config
    }

    if global_args.ssl:
        uvicorn_config.update(
            {
                "ssl_certfile": global_args.ssl_certfile,
                "ssl_keyfile": global_args.ssl_keyfile,
            }
        )

    print(
        f"Starting Uvicorn server in single-process mode on {global_args.host}:{global_args.port}"
    )
    uvicorn.run(**uvicorn_config)


if __name__ == "__main__":
    main()
