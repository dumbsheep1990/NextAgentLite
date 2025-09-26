"""
datagraph_core compatibility package

This package provides a stable import path `datagraph_core` by delegating to
the existing `matgraph_core` implementation. It allows progressive migration
away from `matgraph_core` without breaking callers.
"""
from __future__ import annotations
import importlib
import sys

# Map top-level module
_m = importlib.import_module('matgraph_core')
sys.modules[__name__] = _m

# Expose well-known subpackages and modules under datagraph_core.*
_aliases = [
    'api',
    'kg',
    'llm',
]
_modules = [
    'base', 'constants', 'env_loader', 'exceptions', 'lightrag', 'llm',
    'namespace', 'operate', 'prompt', 'rerank', 'tools', 'types', 'utils', 'utils_graph'
]

for name in _aliases:
    sys.modules[f'{__name__}.{name}'] = importlib.import_module(f'matgraph_core.{name}')

for name in _modules:
    try:
        sys.modules[f'{__name__}.{name}'] = importlib.import_module(f'matgraph_core.{name}')
    except ModuleNotFoundError:
        pass

