"""
知识图谱模型 - 用于存储节点、边和图谱配置
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class GraphNode(Base):
    """知识图谱节点数据模型"""
    
    __tablename__ = "graph_nodes"
    
    id = Column(String(50), primary_key=True, index=True)  # UUID
    label = Column(String(500), nullable=False, index=True)
    type = Column(String(100), nullable=False, index=True)
    
    # 节点属性
    properties = Column(JSON, nullable=True)
    
    # 位置信息
    x = Column(Float, nullable=True)
    y = Column(Float, nullable=True)
    
    # 视觉属性
    color = Column(String(20), nullable=True)
    size = Column(Float, nullable=True)
    
    # 兼容属性
    connections = Column(Integer, default=0)  # 连接数
    level = Column(Integer, nullable=True)    # 层级
    
    # 源数据关联
    source_document_id = Column(String(50), nullable=True)
    source_chunk_id = Column(String(50), nullable=True)
    
    # 权重和置信度
    weight = Column(Float, default=1.0)
    confidence = Column(Float, default=0.0)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系映射
    outgoing_edges = relationship("GraphEdge", foreign_keys="GraphEdge.from_node_id", back_populates="from_node")
    incoming_edges = relationship("GraphEdge", foreign_keys="GraphEdge.to_node_id", back_populates="to_node")
    
    def __repr__(self):
        return f"<GraphNode(id='{self.id}', label='{self.label}', type='{self.type}')>"


class GraphEdge(Base):
    """知识图谱边数据模型"""
    
    __tablename__ = "graph_edges"
    
    id = Column(String(50), primary_key=True, index=True)  # UUID
    from_node_id = Column(String(50), ForeignKey("graph_nodes.id"), nullable=False)
    to_node_id = Column(String(50), ForeignKey("graph_nodes.id"), nullable=False)
    
    label = Column(String(200), nullable=False, index=True)
    type = Column(String(100), nullable=False, index=True)
    
    # 边属性
    properties = Column(JSON, nullable=True)
    
    # 权重和置信度
    weight = Column(Float, default=1.0)
    confidence = Column(Float, default=0.0)
    
    # 视觉属性
    color = Column(String(20), nullable=True)
    
    # 源数据关联
    source_document_id = Column(String(50), nullable=True)
    source_chunk_id = Column(String(50), nullable=True)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系映射
    from_node = relationship("GraphNode", foreign_keys=[from_node_id], back_populates="outgoing_edges")
    to_node = relationship("GraphNode", foreign_keys=[to_node_id], back_populates="incoming_edges")
    
    def __repr__(self):
        return f"<GraphEdge(id='{self.id}', from='{self.from_node_id}', to='{self.to_node_id}', label='{self.label}')>"


class GraphLayout(Base):
    """知识图谱布局配置数据模型"""
    
    __tablename__ = "graph_layouts"
    
    id = Column(String(50), primary_key=True, index=True)  # UUID
    name = Column(String(200), nullable=False, index=True)
    algorithm = Column(String(50), nullable=False)  # spring, hierarchical, random
    
    # 物理配置
    physics_config = Column(JSON, nullable=True)
    
    # 节点配置
    node_config = Column(JSON, nullable=True)
    
    # 边配置
    edge_config = Column(JSON, nullable=True)
    
    # 是否为默认布局
    is_default = Column(Boolean, default=False)
    
    # 适用的图谱类型
    graph_types = Column(JSON, nullable=True)  # 存储适用的图谱类型数组
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<GraphLayout(id='{self.id}', name='{self.name}', algorithm='{self.algorithm}')>"


class GraphFilter(Base):
    """知识图谱过滤器数据模型"""
    
    __tablename__ = "graph_filters"
    
    id = Column(String(50), primary_key=True, index=True)  # UUID
    name = Column(String(200), nullable=False, index=True)
    
    # 过滤条件
    node_types = Column(JSON, nullable=True)  # 节点类型过滤
    edge_types = Column(JSON, nullable=True)  # 边类型过滤
    search_text = Column(String(1000), nullable=True)
    view_mode = Column(String(50), nullable=False, default="overview")  # overview, focus, cluster
    
    # 高级过滤条件
    min_connections = Column(Integer, nullable=True)
    max_connections = Column(Integer, nullable=True)
    confidence_threshold = Column(Float, nullable=True)
    
    # 用户关联
    user_id = Column(String(50), nullable=True)  # 如果为null则为公共过滤器
    
    # 是否为默认过滤器
    is_default = Column(Boolean, default=False)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<GraphFilter(id='{self.id}', name='{self.name}', view_mode='{self.view_mode}')>"


class GraphStats(Base):
    """知识图谱统计数据模型"""
    
    __tablename__ = "graph_stats"
    
    id = Column(String(50), primary_key=True, index=True)  # UUID
    
    # 基本统计
    node_count = Column(Integer, nullable=False, default=0)
    edge_count = Column(Integer, nullable=False, default=0)
    avg_connections = Column(Float, nullable=False, default=0.0)
    
    # 类型分布
    type_distribution = Column(JSON, nullable=True)  # 节点和边的类型分布
    
    # 更新时间
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联的图谱版本或快照
    graph_version = Column(String(50), nullable=True)
    
    def __repr__(self):
        return f"<GraphStats(id='{self.id}', nodes={self.node_count}, edges={self.edge_count})>"


class GraphSnapshot(Base):
    """知识图谱快照数据模型 - 用于版本控制和历史记录"""
    
    __tablename__ = "graph_snapshots"
    
    id = Column(String(50), primary_key=True, index=True)  # UUID
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # 快照数据
    nodes_data = Column(JSON, nullable=False)  # 节点数据快照
    edges_data = Column(JSON, nullable=False)  # 边数据快照
    layout_data = Column(JSON, nullable=True)  # 布局数据快照
    
    # 元数据
    node_count = Column(Integer, nullable=False)
    edge_count = Column(Integer, nullable=False)
    created_by = Column(String(50), nullable=True)  # 创建者ID
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<GraphSnapshot(id='{self.id}', name='{self.name}', nodes={self.node_count})>"