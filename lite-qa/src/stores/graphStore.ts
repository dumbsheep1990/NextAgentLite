/**
 * 知识图谱状态管理 - 使用zustand
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { graphService } from '../services/graphService';
import type { GraphNode, GraphEdge, GraphLayout, GraphFilter } from '../types';

interface GraphState {
  // 图谱数据
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  
  // 布局配置
  layout: GraphLayout;
  
  // 筛选条件
  filter: GraphFilter;
  
  // UI状态
  isLoading: boolean;
  addNodeModalVisible: boolean;
  addEdgeModalVisible: boolean;
  editModalVisible: boolean;
  editingNode: GraphNode | null;
  
  // 视图状态
  viewMode: 'overview' | 'focus' | 'cluster';
  focusNodeId: string | null;
  zoomLevel: number;
  
  // 算法结果
  algorithmResults: {
    pagerank?: Array<{ node_id: string; score: number; rank: number }>;
    communities?: { clusters: Record<string, string[]>; modularity: number };
    centrality?: Array<{ node_id: string; score: number; rank: number }>;
  };
  
  // Actions - 数据管理
  setNodes: (nodes: GraphNode[]) => void;
  setEdges: (edges: GraphEdge[]) => void;
  addNode: (node: GraphNode) => Promise<void>;
  updateNode: (id: string, updates: Partial<GraphNode>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  addEdge: (edge: GraphEdge) => Promise<void>;
  updateEdge: (id: string, updates: Partial<GraphEdge>) => Promise<void>;
  deleteEdge: (id: string) => Promise<void>;
  
  // Actions - 选择
  setSelectedNodes: (ids: string[]) => void;
  setSelectedEdges: (ids: string[]) => void;
  clearSelection: () => void;
  
  // Actions - 布局
  setLayout: (layout: Partial<GraphLayout>) => void;
  
  // Actions - 筛选
  setFilter: (filter: Partial<GraphFilter>) => void;
  
  // Actions - UI状态
  setLoading: (loading: boolean) => void;
  setAddNodeModalVisible: (visible: boolean) => void;
  setAddEdgeModalVisible: (visible: boolean) => void;
  setEditModalVisible: (visible: boolean) => void;
  setEditingNode: (node: GraphNode | null) => void;
  
  // Actions - 视图
  setViewMode: (mode: 'overview' | 'focus' | 'cluster') => void;
  setFocusNode: (nodeId: string | null) => void;
  setZoomLevel: (level: number) => void;
  
  // Actions - 算法
  setAlgorithmResults: (results: any) => void;
  
  // 复合操作
  loadGraphData: () => Promise<void>;
  refreshData: () => Promise<void>;
  focusOnNode: (nodeId: string) => void;
  expandNode: (nodeId: string) => Promise<void>;
  collapseNode: (nodeId: string) => void;
  searchNodes: (query: string) => Promise<GraphNode[]>;
  exportGraph: (format: 'json' | 'csv' | 'gml') => Promise<void>;
  importGraph: (file: File) => Promise<void>;
  
  // NetworkX算法操作
  calculatePageRank: (params?: { damping?: number; iterations?: number }) => Promise<void>;
  detectCommunities: (algorithm?: 'louvain' | 'leiden') => Promise<void>;
  calculateCentrality: (type?: 'degree' | 'betweenness' | 'closeness' | 'pagerank') => Promise<void>;
  findShortestPath: (sourceId: string, targetId: string) => Promise<{
    path: GraphNode[];
    edges: GraphEdge[];
    length: number;
  }>;
  getSimilarNodes: (nodeId: string, limit?: number) => Promise<{
    nodes: GraphNode[];
    similarities: number[];
  }>;
}

// 默认布局配置
const defaultLayout: GraphLayout = {
  algorithm: 'spring',
  physics: {
    enabled: true,
    stabilization: { iterations: 100 },
    barnesHut: {
      gravitationalConstant: -8000,
      centralGravity: 0.3,
      springLength: 95,
      springConstant: 0.04,
      damping: 0.09
    }
  },
  nodes: {
    shape: 'dot',
    size: 20,
    font: { size: 14 },
    borderWidth: 2
  },
  edges: {
    width: 2,
    smooth: { type: 'continuous' },
    arrows: { to: { enabled: true } }
  }
};

// 默认筛选条件
const defaultFilter: GraphFilter = {
  nodeTypes: [],
  edgeTypes: [],
  searchText: '',
  viewMode: 'overview'
};

export const useGraphStore = create<GraphState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      layout: defaultLayout,
      filter: defaultFilter,
      isLoading: false,
      addNodeModalVisible: false,
      addEdgeModalVisible: false,
      editModalVisible: false,
      editingNode: null,
      viewMode: 'overview',
      focusNodeId: null,
      zoomLevel: 1,
      algorithmResults: {},

      // 数据管理
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      
      addNode: async (node) => {
        try {
          set({ isLoading: true });
          const createdNode = await graphService.createNode(node);
          set((state) => ({
            nodes: [...state.nodes, createdNode],
            isLoading: false
          }));
        } catch (error) {
          // Failed to add node
          set({ isLoading: false });
          throw error;
        }
      },
      
      updateNode: async (id, updates) => {
        try {
          const updatedNode = await graphService.updateNode(id, updates);
          set((state) => ({
            nodes: state.nodes.map(node => 
              node.id === id ? updatedNode : node
            )
          }));
        } catch (error) {
          // Failed to update node
          throw error;
        }
      },
      
      deleteNode: async (id) => {
        try {
          await graphService.deleteNode(id);
          set((state) => ({
            nodes: state.nodes.filter(node => node.id !== id),
            edges: state.edges.filter(edge => edge.from !== id && edge.to !== id),
            selectedNodes: state.selectedNodes.filter(nodeId => nodeId !== id)
          }));
        } catch (error) {
          // Failed to delete node
          throw error;
        }
      },
      
      addEdge: async (edge) => {
        try {
          set({ isLoading: true });
          const createdEdge = await graphService.createEdge(edge);
          set((state) => ({
            edges: [...state.edges, createdEdge],
            isLoading: false
          }));
        } catch (error) {
          // Failed to add edge
          set({ isLoading: false });
          throw error;
        }
      },
      
      updateEdge: async (id, updates) => {
        try {
          const updatedEdge = await graphService.updateEdge(id, updates);
          set((state) => ({
            edges: state.edges.map(edge => 
              edge.id === id ? updatedEdge : edge
            )
          }));
        } catch (error) {
          // Failed to update edge
          throw error;
        }
      },
      
      deleteEdge: async (id) => {
        try {
          await graphService.deleteEdge(id);
          set((state) => ({
            edges: state.edges.filter(edge => edge.id !== id),
            selectedEdges: state.selectedEdges.filter(edgeId => edgeId !== id)
          }));
        } catch (error) {
          // Failed to delete edge
          throw error;
        }
      },

      // 选择
      setSelectedNodes: (ids) => set({ selectedNodes: ids }),
      setSelectedEdges: (ids) => set({ selectedEdges: ids }),
      clearSelection: () => set({ selectedNodes: [], selectedEdges: [] }),

      // 布局
      setLayout: (layout) => set((state) => ({
        layout: { ...state.layout, ...layout }
      })),

      // 筛选
      setFilter: (filter) => set((state) => ({
        filter: { ...state.filter, ...filter }
      })),

      // UI状态
      setLoading: (loading) => set({ isLoading: loading }),
      setAddNodeModalVisible: (visible) => set({ addNodeModalVisible: visible }),
      setAddEdgeModalVisible: (visible) => set({ addEdgeModalVisible: visible }),
      setEditModalVisible: (visible) => set({ editModalVisible: visible }),
      setEditingNode: (node) => set({ editingNode: node }),

      // 视图
      setViewMode: (mode) => set({ viewMode: mode }),
      setFocusNode: (nodeId) => set({ focusNodeId: nodeId }),
      setZoomLevel: (level) => set({ zoomLevel: level }),
      
      // 算法结果
      setAlgorithmResults: (results) => set((state) => ({
        algorithmResults: { ...state.algorithmResults, ...results }
      })),

      // 复合操作
      loadGraphData: async () => {
        set({ isLoading: true });
        try {
          const state = get();
          const { nodes, edges } = await graphService.getGraphData(state.filter);
          set({ 
            nodes, 
            edges, 
            isLoading: false 
          });
        } catch (error) {
          // Failed to load graph data
          set({ isLoading: false });
        }
      },

      refreshData: async () => {
        const { loadGraphData } = get();
        await loadGraphData();
      },

      focusOnNode: (nodeId) => {
        set({ 
          viewMode: 'focus', 
          focusNodeId: nodeId,
          selectedNodes: [nodeId]
        });
      },

      expandNode: async (nodeId) => {
        try {
          const nodeDetails = await graphService.getNodeDetails(nodeId);
          const connectedNodeIds = nodeDetails.relatedNodes.map(node => node.id);
          
          set((state) => ({
            selectedNodes: [...new Set([nodeId, ...connectedNodeIds])]
          }));
        } catch (error) {
          // Failed to expand node
        }
      },

      collapseNode: (nodeId) => {
        set((state) => ({
          selectedNodes: state.selectedNodes.filter(id => id !== nodeId)
        }));
      },

      searchNodes: async (query) => {
        try {
          const state = get();
          return await graphService.searchNodes(query, state.filter);
        } catch (error) {
          // Node search failed
          return [];
        }
      },

      exportGraph: async (format) => {
        try {
          await graphService.exportGraph(format);
        } catch (error) {
          // Graph export failed
          throw error;
        }
      },

      importGraph: async (file) => {
        set({ isLoading: true });
        try {
          await graphService.importGraph(file);
          // 重新加载数据
          const { loadGraphData } = get();
          await loadGraphData();
        } catch (error) {
          // Graph import failed
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // NetworkX算法操作
      calculatePageRank: async (params) => {
        try {
          set({ isLoading: true });
          const result = await graphService.calculatePageRank(params);
          set((state) => ({
            algorithmResults: {
              ...state.algorithmResults,
              pagerank: result.rankings
            },
            isLoading: false
          }));
        } catch (error) {
          // PageRank calculation failed
          set({ isLoading: false });
          throw error;
        }
      },

      detectCommunities: async (algorithm = 'louvain') => {
        try {
          set({ isLoading: true });
          const result = await graphService.detectCommunities(algorithm);
          set((state) => ({
            algorithmResults: {
              ...state.algorithmResults,
              communities: result
            },
            isLoading: false
          }));
        } catch (error) {
          // Community detection failed
          set({ isLoading: false });
          throw error;
        }
      },

      calculateCentrality: async (type = 'pagerank') => {
        try {
          set({ isLoading: true });
          const result = await graphService.getNodeCentrality(type);
          set((state) => ({
            algorithmResults: {
              ...state.algorithmResults,
              centrality: result.rankings
            },
            isLoading: false
          }));
        } catch (error) {
          // Centrality calculation failed
          set({ isLoading: false });
          throw error;
        }
      },

      findShortestPath: async (sourceId, targetId) => {
        try {
          return await graphService.getShortestPath(sourceId, targetId);
        } catch (error) {
          // Shortest path search failed
          return { path: [], edges: [], length: 0 };
        }
      },

      getSimilarNodes: async (nodeId, limit = 10) => {
        try {
          return await graphService.getSimilarNodes(nodeId, limit);
        } catch (error) {
          // Failed to get similar nodes
          return { nodes: [], similarities: [] };
        }
      }
    }),
    { name: 'graph-store' }
  )
); 