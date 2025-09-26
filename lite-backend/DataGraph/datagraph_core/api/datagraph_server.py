"""
Compatibility wrapper for DataGraph server entry.

This module re-exports factory and entry functions from lightrag_server, so
callers can import `matgraph_core.api.datagraph_server` without changing the
core implementation immediately.
"""
from .lightrag_server import (
    create_app,
    get_application,
    configure_logging,
    check_and_install_dependencies,
    main,
)

__all__ = [
    "create_app",
    "get_application",
    "configure_logging",
    "check_and_install_dependencies",
    "main",
]

