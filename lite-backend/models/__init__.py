"""
Database models for the Material QA System.
"""

# Import all models to ensure they are registered with SQLAlchemy
from .agent_config import AgentConfig
from .knowledge import KnowledgeDocument, DocumentChunk, VectorConfig, ModelConfig, RetrievalResult
from .knowledge_collection import KnowledgeCollection, MetadataTemplate
from .folder import KnowledgeFolder
from .paper import Paper
from .conversation import Conversation, ConversationMessage
from .user import User
from .chunking_config import ChunkingConfig
from .graph import GraphNode, GraphEdge, GraphLayout, GraphFilter, GraphStats, GraphSnapshot
from .mcp_models import (
    MCPServer, MCPTool, MCPResource, MCPPrompt, MCPToolCall, MCPGatewayConfig,
    UnlaRouterMap,
)
from .qa_dataset import QADataset, QAPair, QACategory

__all__ = [
    'AgentConfig',
    'KnowledgeDocument', 
    'DocumentChunk',
    'VectorConfig',
    'ModelConfig',
    'RetrievalResult',
    'KnowledgeCollection',
    'MetadataTemplate',
    'KnowledgeFolder',
    'Paper',
    'User',
    'Conversation', 
    'ConversationMessage',
    'ChunkingConfig',
    'GraphNode',
    'GraphEdge', 
    'GraphLayout',
    'GraphFilter',
    'GraphStats',
    'GraphSnapshot',
    'QADataset',
    'QAPair',
    'QACategory',
    'MCPServer', 'MCPTool', 'MCPResource', 'MCPPrompt', 'MCPToolCall', 'MCPGatewayConfig',
    'UnlaRouterMap',
]
