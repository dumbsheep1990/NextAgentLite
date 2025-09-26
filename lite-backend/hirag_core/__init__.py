"""
Project-local HiRAG facade.

To simplify management and decouple external layout, import HiRAG core
from the vendored source under `lite-backend/hirag/hirag` and re-export
the public API via `hirag_core`.

If we later relocate or customize the core, only this facade needs updates.
"""

from .hirag import HiRAG, QueryParam

__all__ = ["HiRAG", "QueryParam"]
