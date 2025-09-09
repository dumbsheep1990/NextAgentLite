/**
 * 知识图谱服务 - BFF层接口封装
 */
import { apiService } from './api';
import type { 
  GraphNode, 
  GraphEdge, 
  GraphLayout, 
  GraphFilter, 
  GraphStats,
  ApiResponse 
} from '../types';

// 知识图谱配置类型（简化版本）
export interface KnowledgeGraphConfig {
  enableKnowledgeGraph: boolean;
  autoExtraction: boolean; // 与主开关联动
  extractionMode: 'auto' | 'manual' | 'disabled';
  extractionConfig: {
    enabledEntityTypes: string[];
    minConfidence: number;
    batchSize: number;
    enableValidation: boolean; // 固定启用
  };
  arangodbConfig: {
    enabled: boolean; // 与主开关联动
    host: string;
    database: string;
    collections: {
      entities: string;
      relationships: string;
      documents: string;
    };
  };
  processingConfig: {
    maxConcurrency: number;
    retryAttempts: number;
    timeoutMs: number;
  };
}

// 三元组提取结果类型
export interface TripleExtractionResult {
  documentId: string;
  status: 'processing' | 'completed' | 'failed';
  extractedTriples: {
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
    context: string;
  }[];
  entityCount: number;
  relationshipCount: number;
  processingTime: number;
  error?: string;
}

export class GraphService {
  
  // 数据转换辅助函数
  private formatNodeData(node: any): GraphNode {
    return {
      id: node.id,
      label: node.label || node.name || '',
      type: node.type || 'entity',
      properties: node.properties || {},
      x: node.x || node.position?.x,
      y: node.y || node.position?.y,
      color: node.color,
      size: node.size || 20,
      connections: node.connections || 0,
      level: node.level || 1,
      position: {
        x: node.x || node.position?.x || 0,
        y: node.y || node.position?.y || 0
      }
    };
  }

  private formatEdgeData(edge: any): GraphEdge {
    return {
      id: edge.id,
      from: edge.from || edge.from_node,
      to: edge.to || edge.to_node,
      label: edge.label || '',
      type: edge.type || 'relationship',
      properties: edge.properties || {},
      weight: edge.weight || 1.0,
      color: edge.color
    };
  }

  // 获取图谱数据
  async getGraphData(filters?: Partial<GraphFilter>): Promise<{
    nodes: GraphNode[];
    edges: GraphEdge[];
    stats: GraphStats;
  }> {
    try {
      // 构建查询参数
      const params: Record<string, any> = {};
      
      if (filters?.nodeTypes && filters.nodeTypes.length > 0) {
        params.node_types = filters.nodeTypes.join(',');
      }
      if (filters?.edgeTypes && filters.edgeTypes.length > 0) {
        params.edge_types = filters.edgeTypes.join(',');
      }
      if (filters?.searchText) {
        params.search = filters.searchText;
      }
      
      const response = await apiService.get<{
        nodes: any[];
        edges: any[];
        stats: any;
      }>('/graph/data', { params });
      
      // 转换数据格式
      const nodes = response.nodes?.map(node => this.formatNodeData(node)) || [];
      const edges = response.edges?.map(edge => this.formatEdgeData(edge)) || [];
      
      const stats: GraphStats = {
        nodeCount: response.stats?.nodeCount || nodes.length,
        edgeCount: response.stats?.edgeCount || edges.length,
        typeDistribution: response.stats?.typeDistribution || {},
        avgConnections: response.stats?.avgConnections || 0
      };
      
      return { nodes, edges, stats };
      
    } catch (error) {
      // Failed to get graph data
      // 返回默认数据结构避免前端崩溃
      return {
        nodes: [],
        edges: [],
        stats: {
          nodeCount: 0,
          edgeCount: 0,
          typeDistribution: {},
          avgConnections: 0
        }
      };
    }
  }

  // 搜索节点
  async searchNodes(query: string, filters?: Partial<GraphFilter>): Promise<GraphNode[]> {
    try {
      const params: Record<string, any> = { q: query };
      
      if (filters?.nodeTypes && filters.nodeTypes.length > 0) {
        params.node_type = filters.nodeTypes[0]; // API只支持单个类型
      }
      
      const response = await apiService.get<any[]>('/graph/nodes/search', { params });
      
      return response?.map(node => this.formatNodeData(node)) || [];
      
    } catch (error) {
      // Node search failed
      return [];
    }
  }

  // 获取节点详细信息
  async getNodeDetails(nodeId: string): Promise<GraphNode & {
    connections: GraphEdge[];
    relatedNodes: GraphNode[];
  }> {
    try {
      const response = await apiService.get<{
        node: any;
        connections?: any[];
        relatedNodes?: any[];
      }>(`/graph/nodes/${nodeId}?include_neighbors=true&neighbor_depth=1`);
      
      const node = this.formatNodeData(response.node);
      const connections = response.connections?.map(edge => this.formatEdgeData(edge)) || [];
      const relatedNodes = response.relatedNodes?.map(node => this.formatNodeData(node)) || [];
      
      return {
        ...node,
        connections: connections,
        relatedNodes: relatedNodes
      } as GraphNode & {
        connections: GraphEdge[];
        relatedNodes: GraphNode[];
      };
      
    } catch (error) {
      // Failed to get node details
      throw error;
    }
  }

  // 创建新节点
  async createNode(nodeData: Omit<GraphNode, 'id'>): Promise<GraphNode> {
    try {
      const response = await apiService.post<any>('/graph/nodes', {
        label: nodeData.label,
        type: nodeData.type,
        properties: nodeData.properties || {},
        x: nodeData.x || nodeData.position?.x,
        y: nodeData.y || nodeData.position?.y,
        color: nodeData.color,
        size: nodeData.size
      });
      
      return this.formatNodeData(response);
      
    } catch (error) {
      // Node creation failed
      throw error;
    }
  }

  // 更新节点
  async updateNode(nodeId: string, updates: Partial<GraphNode>): Promise<GraphNode> {
    try {
      const response = await apiService.put<any>(`/graph/nodes/${nodeId}`, updates);
      return this.formatNodeData(response);
    } catch (error) {
      // Node update failed
      throw error;
    }
  }

  // 删除节点
  async deleteNode(nodeId: string): Promise<void> {
    try {
      await apiService.delete(`/graph/nodes/${nodeId}`);
    } catch (error) {
      // Node deletion failed
      throw error;
    }
  }

  // 创建关系
  async createEdge(edgeData: Omit<GraphEdge, 'id'>): Promise<GraphEdge> {
    try {
      const response = await apiService.post<any>('/graph/edges', {
        from: edgeData.from,
        to: edgeData.to,
        label: edgeData.label,
        type: edgeData.type,
        properties: edgeData.properties || {},
        weight: edgeData.weight
      });
      
      return this.formatEdgeData(response);
      
    } catch (error) {
      // Relationship creation failed
      throw error;
    }
  }

  // 更新关系
  async updateEdge(edgeId: string, updates: Partial<GraphEdge>): Promise<GraphEdge> {
    try {
      const response = await apiService.put<any>(`/graph/edges/${edgeId}`, updates);
      return this.formatEdgeData(response);
    } catch (error) {
      // Relationship update failed
      throw error;
    }
  }

  // 删除关系
  async deleteEdge(edgeId: string): Promise<void> {
    try {
      await apiService.delete(`/graph/edges/${edgeId}`);
    } catch (error) {
      // Relationship deletion failed
      throw error;
    }
  }

  // 获取节点类型列表
  async getNodeTypes(): Promise<string[]> {
    try {
      const response = await apiService.get<{ types: string[] }>('/graph/types/nodes');
      return response.types || [];
    } catch (error) {
      // Failed to get node types
      return ['entity', 'concept', 'material', 'paper']; // 默认类型
    }
  }

  // 获取关系类型列表
  async getEdgeTypes(): Promise<string[]> {
    try {
      const response = await apiService.get<{ types: string[] }>('/graph/types/edges');
      return response.types || [];
    } catch (error) {
      // Failed to get relationship types
      return ['relationship', 'citation', 'contains']; // 默认类型
    }
  }

  // 获取图谱统计信息
  async getGraphStats(): Promise<GraphStats> {
    try {
      const response = await apiService.get<any>('/graph/stats');
      
      return {
        nodeCount: response.nodeCount || 0,
        edgeCount: response.edgeCount || 0,
        typeDistribution: response.typeDistribution || {},
        avgConnections: response.avgConnections || 0
      };
      
    } catch (error) {
      // Failed to get graph statistics
      return {
        nodeCount: 0,
        edgeCount: 0,
        typeDistribution: {},
        avgConnections: 0
      };
    }
  }

  // 执行图谱算法（NetworkX计算）
  async runGraphAlgorithm(
    algorithm: string, 
    params?: Record<string, any>
  ): Promise<{
    result: any;
    execution_time: number;
  }> {
    try {
      const response = await apiService.post<{
        result: any;
        execution_time: number;
      }>('/graph/algorithms/run', {
        algorithm,
        params: params || {}
      });
      
      return response;
      
    } catch (error) {
      // Graph algorithm execution failed
      throw error;
    }
  }

  // 页面排名算法（PageRank）
  async calculatePageRank(params?: { damping?: number; iterations?: number }): Promise<{
    rankings: Array<{ node_id: string; score: number; rank: number }>;
  }> {
    try {
      const result = await this.runGraphAlgorithm('pagerank', params);
      return { rankings: result.result || [] };
    } catch (error) {
      // PageRank calculation failed
      return { rankings: [] };
    }
  }

  // 社区检测
  async detectCommunities(algorithm: 'louvain' | 'leiden' = 'louvain'): Promise<{
    clusters: Record<string, string[]>;
    modularity: number;
  }> {
    try {
      const result = await this.runGraphAlgorithm('community_detection', { algorithm });
      return {
        clusters: result.result?.clusters || {},
        modularity: result.result?.modularity || 0
      };
    } catch (error) {
      // Community detection failed
      return { clusters: {}, modularity: 0 };
    }
  }

  // 导出图谱数据
  async exportGraph(format: 'json' | 'csv' | 'gml' = 'json'): Promise<void> {
    try {
      await apiService.download(
        `/graph/export?format=${format}`,
        `graph_export.${format}`
      );
    } catch (error) {
      // Graph export failed
      throw error;
    }
  }

  // 导入图谱数据
  async importGraph(file: File): Promise<{
    imported_nodes: number;
    imported_edges: number;
    message: string;
  }> {
    try {
      const response = await apiService.upload<{
        imported_nodes: number;
        imported_edges: number;
        message: string;
      }>('/graph/import', file);
      return response;
    } catch (error) {
      // Graph import failed
      throw error;
    }
  }

  // 获取最短路径
  async getShortestPath(sourceId: string, targetId: string): Promise<{
    path: GraphNode[];
    edges: GraphEdge[];
    length: number;
  }> {
    try {
      const response = await apiService.get<{
        path: any[];
        edges: any[];
        length: number;
      }>('/graph/path/shortest', {
        params: { source: sourceId, target: targetId }
      });
      
      return {
        path: response.path?.map(node => this.formatNodeData(node)) || [],
        edges: response.edges?.map(edge => this.formatEdgeData(edge)) || [],
        length: response.length || 0
      };
      
    } catch (error) {
      // Failed to get shortest path
      return { path: [], edges: [], length: 0 };
    }
  }

  // 获取相似节点
  async getSimilarNodes(nodeId: string, limit: number = 10): Promise<{
    nodes: GraphNode[];
    similarities: number[];
  }> {
    try {
      const response = await apiService.get<{
        nodes: any[];
        similarities: number[];
      }>(`/graph/nodes/${nodeId}/similar`, {
        params: { limit }
      });
      
      return {
        nodes: response.nodes?.map(node => this.formatNodeData(node)) || [],
        similarities: response.similarities || []
      };
      
    } catch (error) {
      // Failed to get similar nodes
      return { nodes: [], similarities: [] };
    }
  }

  // 图谱聚类分析
  async performClustering(algorithm: 'louvain' | 'leiden' | 'kmeans' = 'louvain'): Promise<{
    clusters: Record<string, string[]>;
    modularity: number;
  }> {
    try {
      const response = await apiService.post<{
        clusters: Record<string, string[]>;
        modularity: number;
      }>('/graph/clustering', { algorithm });
      return response;
    } catch (error) {
      // Graph clustering failed
      return { clusters: {}, modularity: 0 };
    }
  }

  // 获取节点重要性排名
  async getNodeCentrality(
    centrality_type: 'degree' | 'betweenness' | 'closeness' | 'pagerank' = 'pagerank',
    limit: number = 20
  ): Promise<{
    rankings: Array<{
      node_id: string;
      score: number;
      rank: number;
    }>;
  }> {
    try {
      const response = await apiService.get<{
        rankings: Array<{
          node_id: string;
          score: number;
          rank: number;
        }>;
      }>('/graph/centrality', {
        params: { type: centrality_type, limit }
      });
      
      return { rankings: response.rankings || [] };
      
    } catch (error) {
      // Failed to get node importance
      return { rankings: [] };
    }
  }

  // 三元组提取相关功能
  async extractTripletsFromDocument(
    documentId: string,
    useStreaming: boolean = true
  ): Promise<{
    document_id: string;
    entities: any[];
    relationships: any[];
    keywords: string[];
    graph_data: any;
  }> {
    try {
      const response = await apiService.post<any>('/graph/extract/triplets', {
        document_id: documentId,
        use_streaming: useStreaming
      });
      
      return response;
      
    } catch (error) {
      // Triple extraction failed
      throw error;
    }
  }

  // 关键词提取
  async extractKeywords(query: string, history: string = ''): Promise<{
    HIGH_LEVEL_KEYWORDS: string[];
    LOW_LEVEL_KEYWORDS: string[];
    DOMAIN_KEYWORDS: string[];
    OUTPUT_LANGUAGE: string;
  }> {
    try {
      const response = await apiService.post<any>('/graph/extract/keywords', null, {
        params: { query, history }
      });
      
      return response;
      
    } catch (error) {
      // Keyword extraction failed
      return {
        HIGH_LEVEL_KEYWORDS: [],
        LOW_LEVEL_KEYWORDS: [],
        DOMAIN_KEYWORDS: [],
        OUTPUT_LANGUAGE: 'zh'
      };
    }
  }

  // ============ 知识图谱配置管理 ============

  // 获取知识图谱配置
  async getKnowledgeGraphConfig(): Promise<KnowledgeGraphConfig> {
    try {
      // 优先尝试新的系统配置API
      try {
        const systemConfigResponse = await apiService.get<{
          success: boolean;
          data: {
            service_status: Array<{
              name: string;
              status: string;
              has_fallback: boolean;
              fallback_active: boolean;
            }>;
          };
        }>('/config');
        
        if (systemConfigResponse.success) {
          // 检查ArangoDB状态
          const arangoStatus = systemConfigResponse.data.service_status.find(
            service => service.name.toLowerCase().includes('arangodb')
          );
          
          return {
            enableKnowledgeGraph: arangoStatus?.status === 'healthy',
            autoExtraction: arangoStatus?.status === 'healthy',
            extractionMode: arangoStatus?.status === 'healthy' ? 'auto' : 'disabled',
            extractionConfig: {
              enabledEntityTypes: ['material', 'chemical_compound', 'property', 'process', 'structure', 'test_method'],
              minConfidence: 0.7,
              batchSize: 10,
              enableValidation: true
            },
            arangodbConfig: {
              enabled: arangoStatus?.status === 'healthy',
              host: 'localhost:8529',
              database: 'mat_qa_graph',
              collections: {
                entities: 'entities',
                relationships: 'relationships',
                documents: 'documents'
              }
            },
            processingConfig: {
              maxConcurrency: 3,
              retryAttempts: 2,
              timeoutMs: 30000
            }
          };
        }
      } catch (configError) {
        // System config API unavailable, using graph config API
      }

      // 降级到图谱配置API
      const response = await apiService.get<KnowledgeGraphConfig>('/graph/config');
      return response;
    } catch (error) {
      // Failed to get knowledge graph config
      // 返回默认配置（简化）
      return {
        enableKnowledgeGraph: false,
        autoExtraction: false, // 与主开关联动
        extractionMode: 'manual',
        extractionConfig: {
          enabledEntityTypes: ['material', 'chemical_compound', 'property', 'process', 'structure', 'test_method'],
          minConfidence: 0.7,
          batchSize: 10,
          enableValidation: true // 固定启用
        },
        arangodbConfig: {
          enabled: false, // 与主开关联动
          host: 'localhost:8529',
          database: 'mat_qa_graph',
          collections: {
            entities: 'entities',
            relationships: 'relationships',
            documents: 'documents'
          }
        },
        processingConfig: {
          maxConcurrency: 3,
          retryAttempts: 2,
          timeoutMs: 30000
        }
      };
    }
  }

  // 更新知识图谱配置
  async updateKnowledgeGraphConfig(config: Partial<KnowledgeGraphConfig>): Promise<{
    message: string;
    config: KnowledgeGraphConfig;
  }> {
    try {
      const response = await apiService.put<{
        message: string;
        config: KnowledgeGraphConfig;
      }>('/graph/config', config);
      return response;
    } catch (error) {
      // Failed to update knowledge graph config
      throw error;
    }
  }

  // 切换知识图谱开关
  async toggleKnowledgeGraph(enabled: boolean): Promise<{
    message: string;
    enabled: boolean;
  }> {
    try {
      const response = await apiService.post<{
        message: string;
        enabled: boolean;
      }>(`/graph/config/toggle?enabled=${enabled}`);
      return response;
    } catch (error) {
      // Failed to toggle knowledge graph switch
      throw error;
    }
  }

  // ============ 三元组提取管理 ============

  // 从文档提取三元组
  async extractTriplesFromDocuments(
    documentIds: string[],
    options?: {
      extractionMode?: 'auto' | 'manual';
      entityTypes?: string[];
      minConfidence?: number;
    }
  ): Promise<{
    message: string;
    taskId: string;
    documentsCount: number;
  }> {
    try {
      const response = await apiService.post<{
        message: string;
        taskId: string;
        documentsCount: number;
      }>('/graph/extract/triplets', {
        document_ids: documentIds,
        extraction_mode: options?.extractionMode || 'auto',
        entity_types: options?.entityTypes,
        min_confidence: options?.minConfidence || 0.7
      });
      return response;
    } catch (error) {
      // Triple extraction failed
      throw error;
    }
  }

  // 获取三元组提取状态
  async getExtractionStatus(taskId: string): Promise<{
    taskId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    results: TripleExtractionResult[];
    completedDocuments: number;
    totalDocuments: number;
    errors?: string[];
  }> {
    try {
      const response = await apiService.get<{
        taskId: string;
        status: 'pending' | 'processing' | 'completed' | 'failed';
        progress: number;
        results: any[];
        completedDocuments: number;
        totalDocuments: number;
        errors?: string[];
      }>(`/graph/extraction/status/${taskId}`);
      
      return {
        ...response,
        results: response.results?.map(result => ({
          documentId: result.document_id,
          status: result.status,
          extractedTriples: result.triplets?.map((t: any) => ({
            subject: t.subject,
            predicate: t.predicate,
            object: t.object,
            confidence: t.confidence,
            context: t.context || ''
          })) || [],
          entityCount: result.entity_count || 0,
          relationshipCount: result.relationship_count || 0,
          processingTime: result.processing_time || 0,
          error: result.error
        })) || []
      };
    } catch (error) {
      // Failed to get extraction status
      throw error;
    }
  }

  // 获取支持的实体类型
  async getEntityTypes(): Promise<{
    types: Array<{
      name: string;
      label: string;
      description: string;
      color: string;
    }>;
  }> {
    try {
      const response = await apiService.get<{
        types: Array<{
          name: string;
          label: string;
          description: string;
          color: string;
        }>;
      }>('/graph/entity-types');
      return response;
    } catch (error) {
      // Failed to get entity types
      return {
        types: [
          { name: 'material', label: '材料', description: '知识材料', color: '#1890ff' },
          { name: 'chemical_compound', label: '化学成分', description: '化学化合物', color: '#52c41a' },
          { name: 'property', label: '性能', description: '材料性能', color: '#faad14' },
          { name: 'process', label: '工艺', description: '制备工艺', color: '#f5222d' },
          { name: 'structure', label: '结构', description: '微观结构', color: '#722ed1' },
          { name: 'test_method', label: '测试方法', description: '检测方法', color: '#13c2c2' }
        ]
      };
    }
  }

  // 批量构建知识图谱
  async buildGraphFromDocuments(
    documentIds: string[],
    options?: {
      overwrite?: boolean;
      enableValidation?: boolean;
      extractionMode?: 'auto' | 'manual';
    }
  ): Promise<{
    message: string;
    taskId: string;
    estimatedTime: number;
  }> {
    try {
      const response = await apiService.post<{
        message: string;
        taskId: string;
        estimatedTime: number;
      }>('/graph/build/from-documents', {
        document_ids: documentIds,
        overwrite: options?.overwrite || false,
        enable_validation: options?.enableValidation || true,
        extraction_mode: options?.extractionMode || 'auto'
      });
      return response;
    } catch (error) {
      // Knowledge graph construction failed
      throw error;
    }
  }

  // 获取知识图谱状态
  async getGraphStatus(): Promise<{
    enabled: boolean;
    arangodbConnected: boolean;
    totalEntities: number;
    totalRelationships: number;
    lastUpdateTime: string;
    status: 'healthy' | 'warning' | 'error';
  }> {
    try {
      const response = await apiService.get<{
        enabled: boolean;
        arangodbConnected: boolean;
        totalEntities: number;
        totalRelationships: number;
        lastUpdateTime: string;
        status: 'healthy' | 'warning' | 'error';
      }>('/graph/status');
      return response;
    } catch (error) {
      // Failed to get knowledge graph status
      return {
        enabled: false,
        arangodbConnected: false,
        totalEntities: 0,
        totalRelationships: 0,
        lastUpdateTime: '',
        status: 'error'
      };
    }
  }

  /**
   * 获取知识图谱文档列表
   */
  async getKnowledgeGraphDocuments(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }): Promise<{
    documents: Array<{
      id: string;
      filename: string;
      title: string;
      status: string;
      uploadedAt: string;
      fileSize: number;
      tripleCount: number;
      entityCount: number;
      error?: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const response = await apiService.get<{
        documents: any[];
        total: number;
        page: number;
        page_size: number;
      }>('/graph/documents', { params });
      
      return {
        documents: response.documents || [],
        total: response.total || 0,
        page: response.page || 1,
        pageSize: response.page_size || 10
      };
    } catch (error) {
      console.error('Failed to get knowledge graph documents:', error);
      return {
        documents: [],
        total: 0,
        page: 1,
        pageSize: 10
      };
    }
  }

  /**
   * 删除知识图谱文档
   */
  async deleteKnowledgeGraphDocument(documentId: string): Promise<{
    message: string;
    deletedTriples: number;
    deletedEntities: number;
  }> {
    try {
      const response = await apiService.delete<{
        message: string;
        deleted_triples: number;
        deleted_entities: number;
      }>(`/graph/documents/${documentId}`);
      
      return {
        message: response.message,
        deletedTriples: response.deleted_triples || 0,
        deletedEntities: response.deleted_entities || 0
      };
    } catch (error) {
      console.error('Failed to delete knowledge graph document:', error);
      throw error;
    }
  }
}

// 导出图谱服务实例
export const graphService = new GraphService();