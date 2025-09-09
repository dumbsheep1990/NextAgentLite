/**
 * 知识图谱可视化组件 - 使用vis-network
 */
import React, { useEffect, useRef, useState } from 'react';
import { Card, Button, Space, Spin, message } from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  FullscreenOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Network } from 'vis-network/standalone/esm/vis-network';
import { DataSet } from 'vis-data/esnext';
import type { GraphNode, GraphEdge, GraphLayout } from '../../types';

interface GraphVisualizationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  layout: GraphLayout;
  loading?: boolean;
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  onSelectionChange?: (nodes: string[], edges: string[]) => void;
  onStabilized?: () => void;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  nodes,
  edges,
  selectedNodes,
  selectedEdges,
  layout,
  loading = false,
  onNodeClick,
  onNodeDoubleClick,
  onEdgeClick,
  onSelectionChange,
  onStabilized
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 节点类型中文映射
  const nodeTypeLabels: Record<string, string> = {
    // 地聚物相关
    geopolymerproduct: '地聚物产品',
    geopolymercomposite: '地聚物复合材料',
    
    // 前体材料
    precursor: '前体材料',
    wastematerial: '废料',
    
    // 工艺参数
    parameter: '工艺参数',
    curingprocess: '固化工艺',
    curing: '固化',
    processingequipment: '加工设备',
    processing: '处理工艺',
    processingparameter: '处理参数',
    
    // 材料性能
    property: '性能属性',
    strength: '强度',
    durability: '耐久性',
    durabilityproperty: '耐久性性能',
    toughness: '韧性',
    modulus: '模量',
    hardness: '硬度',
    density: '密度',
    voidcontent: '空隙率',
    
    // 化学成分
    chemical_compound: '化学成分',
    chemicalcompound: '化学成分',
    chemicalproperty: '化学性能',
    activator: '激发剂',
    admixture: '外加剂',
    additive: '添加剂',
    binder: '粘结剂',
    
    // 微观结构
    structure: '微观结构',
    microstructure: '微观结构',
    particle: '颗粒',
    matrix: '基体',
    phase: '相',
    
    // 测试和表征
    test_method: '测试方法',
    testing: '测试',
    testingequipment: '测试设备',
    testingstandard: '测试标准',
    'testing equipment': '测试设备',
    'testing standard': '测试标准',
    characterizationmethod: '表征方法',
    'characterization method': '表征方法',
    standard: '标准',
    
    // 研究相关
    researcher: '研究人员',
    author: '作者',
    institution: '机构',
    journal: '期刊',
    location: '位置信息',
    
    // 材料类型
    material: '材料',
    hybridmaterial: '混合材料',
    cementcomposite: '水泥复合材料',
    abrasivematerial: '磨料',
    aggregate: '骨料',
    
    // 工艺和应用
    process: '制备工艺',
    application: '应用',
    industry: '工业',
    
    // 环境相关
    environmentalparameter: '环境参数',
    environmentalcondition: '环境条件',
    environmentalimpact: '环境影响',
    
    // 表面和特征
    surfacefeature: '表面特征',
    surfacetreatment: '表面处理',
    fracture: '断裂',
    phenomenon: '现象特征',
    
    // 设备和工具
    mold: '模具',
    
    // 统计参数
    statisticalparameter: '统计参数',
    
    // 通用类型
    entity: '实体',
    concept: '概念',
    unknown: '未知类型'
  };

  // 🎯 清理节点类型（移除引号）的工具函数
  const cleanNodeType = (type: string): string => {
    if (!type) return 'unknown';
    // 移除前后的引号和多余空格
    return type.replace(/^["']|["']$/g, '').trim().toLowerCase();
  };

  // 🎨 优化的节点类型颜色映射 - 使用更丰富和区分度更高的配色方案
  const nodeColors: Record<string, string> = {
    // 地聚物相关 - 蓝色系
    geopolymerproduct: '#1677ff',      // 主产品 - 鲜艳蓝
    geopolymercomposite: '#40a9ff',    // 复合材料 - 中蓝
    
    // 前体材料 - 绿色系  
    precursor: '#52c41a',              // 前体 - 翠绿
    'fly ash': '#73d13d',              // 粉煤灰 - 亮绿
    slag: '#389e0d',                   // 矿渣 - 深绿
    metakaolin: '#95de64',             // 偏高岭土 - 浅绿
    wastematerial: '#b7eb8f',          // 废料 - 淡绿
    
    // 工艺参数 - 橙色系
    parameter: '#fa8c16',              // 参数 - 橙色
    curingprocess: '#ff7a45',          // 固化工艺 - 橙红
    curing: '#ff7a45',                 // 固化 - 橙红
    processingequipment: '#ff9c6e',    // 设备 - 浅橙
    processing: '#ffbb96',             // 处理 - 淡橙
    processingparameter: '#ffd591',    // 处理参数 - 极淡橙
    
    // 材料性能 - 紫色系
    property: '#722ed1',               // 性能 - 紫色
    strength: '#9254de',               // 强度 - 中紫
    'compressive strength': '#b37feb', // 抗压强度 - 浅紫
    durability: '#d3adf7',             // 耐久性 - 淡紫
    durabilityproperty: '#d3adf7',     // 耐久性性能 - 淡紫
    toughness: '#efdbff',              // 韧性 - 极淡紫
    modulus: '#f9f0ff',                // 模量 - 浅紫
    hardness: '#d3adf7',               // 硬度 - 淡紫
    
    // 化学成分 - 青色系
    chemical_compound: '#13c2c2',      // 化学成分 - 青色
    chemicalcompound: '#13c2c2',       // 化学成分 - 青色
    chemicalproperty: '#36cfc9',       // 化学性能 - 亮青
    activator: '#36cfc9',              // 激发剂 - 亮青
    admixture: '#5cdbd3',              // 外加剂 - 中青
    additive: '#87e8de',               // 添加剂 - 淡青
    binder: '#b5f5ec',                 // 粘结剂 - 极淡青
    
    // 微观结构 - 粉色系
    structure: '#eb2f96',              // 结构 - 粉红
    microstructure: '#eb2f96',         // 微观结构 - 粉红
    particle: '#f759ab',               // 颗粒 - 亮粉
    matrix: '#ffadd6',                 // 基体 - 浅粉
    phase: '#ffc0cb',                  // 相 - 淡粉
    density: '#ffccc7',                // 密度 - 极淡粉
    voidcontent: '#fff0f6',            // 空隙率 - 浅粉
    
    // 测试和表征 - 黄色系
    test_method: '#fadb14',            // 测试方法 - 黄色
    testing: '#fadb14',                // 测试 - 黄色
    testingequipment: '#fff566',       // 测试设备 - 亮黄
    testingstandard: '#fffb8f',        // 测试标准 - 浅黄
    'testing equipment': '#fff566',    // 测试设备 - 亮黄
    'testing standard': '#fffb8f',     // 测试标准 - 浅黄
    characterizationmethod: '#ffec3d', // 表征方法 - 中黄
    'characterization method': '#ffec3d', // 表征方法 - 中黄
    standard: '#fffbe6',               // 标准 - 极淡黄
    
    // 研究相关 - 棕色系
    researcher: '#8c6239',             // 研究者 - 棕色
    author: '#8c6239',                 // 作者 - 棕色
    institution: '#ad7a47',            // 机构 - 中棕
    journal: '#d48806',                // 期刊 - 浅棕
    location: '#e6bf83',               // 位置 - 淡棕
    
    // 材料类型 - 土色系
    material: '#8c4c2b',               // 材料 - 深土色
    hybridmaterial: '#a0522d',         // 混合材料 - 中土色
    cementcomposite: '#cd853f',        // 水泥复合材料 - 浅土色
    abrasivematerial: '#daa520',       // 磨料 - 金色
    aggregate: '#f4a460',              // 骨料 - 沙色
    
    // 工艺和应用 - 绿蓝系
    process: '#20b2aa',                // 工艺 - 浅海绿
    application: '#48cae4',            // 应用 - 天蓝
    industry: '#90e0ef',               // 工业 - 淡蓝
    
    // 环境相关 - 橄榄绿系
    environmentalparameter: '#6b8e23', // 环境参数 - 橄榄绿
    environmentalcondition: '#8fbc8f', // 环境条件 - 深海绿
    environmentalimpact: '#98fb98',    // 环境影响 - 淡绿
    
    // 表面和特征 - 灰蓝系
    surfacefeature: '#708090',         // 表面特征 - 石板灰
    surfacetreatment: '#778899',       // 表面处理 - 浅石板灰
    fracture: '#b0c4de',               // 断裂 - 淡钢蓝
    
    // 设备和工具 - 银色系
    mold: '#c0c0c0',                   // 模具 - 银色
    
    // 统计参数 - 灰紫系
    statisticalparameter: '#9370db',   // 统计参数 - 中紫罗兰
    
    // 通用类型 - 灰色系
    entity: '#808080',                 // 实体 - 灰色
    concept: '#a9a9a9',                // 概念 - 深灰
    unknown: '#d3d3d3'                 // 未知 - 淡灰
  };

  // 工具函数：截断长文本
  const truncateText = (text: string, maxLength: number = 20): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 工具函数：格式化节点标题（纯文本）
  const formatNodeTitle = (node: GraphNode): string => {
    const typeLabel = nodeTypeLabels[node.type] || node.type;
    const properties = node.properties || {};
    
    let title = `${node.label}\n`;
    title += `类型: ${typeLabel}\n`;
    
    if (properties.description) {
      // 截断描述文本，避免过长
      const description = properties.description.length > 100 
        ? properties.description.substring(0, 100) + '...' 
        : properties.description;
      title += `描述: ${description}\n`;
    }
    
    if (properties.confidence) {
      title += `置信度: ${(properties.confidence * 100).toFixed(1)}%`;
    }
    
    return title;
  };

  // 🔗 优化的边类型颜色映射 - 语义化配色
  const edgeColors: Record<string, string> = {
    // 组成关系 - 蓝色系
    COMPOSED_OF: '#1677ff',         // 组成 - 蓝色
    INCORPORATES: '#40a9ff',        // 包含 - 中蓝
    CONTAINS: '#69b1ff',            // 含有 - 浅蓝
    component_of: '#91caff',        // 组件 - 淡蓝
    
    // 激活关系 - 绿色系
    ACTIVATED_BY: '#52c41a',        // 激活 - 绿色
    ENHANCED_BY: '#73d13d',         // 增强 - 亮绿
    CATALYZED_BY: '#95de64',        // 催化 - 浅绿
    
    // 影响关系 - 橙红系
    AFFECTS: '#fa541c',             // 影响 - 橙红
    INFLUENCES: '#ff7a45',          // 影响 - 橙色
    DETERMINES: '#ff9c6e',          // 决定 - 浅橙
    influence: '#ffbb96',           // 影响 - 淡橙
    
    // 实现关系 - 紫色系
    ACHIEVES: '#722ed1',            // 实现 - 紫色
    RESULTS_IN: '#9254de',          // 导致 - 中紫
    PRODUCES: '#b37feb',            // 产生 - 浅紫
    
    // 性能关系 - 青色系
    has_property: '#13c2c2',        // 具有性能 - 青色
    EXHIBITS: '#36cfc9',            // 表现 - 亮青
    DEMONSTRATES: '#5cdbd3',        // 显示 - 中青
    property: '#87e8de',            // 性能 - 浅青
    
    // 处理关系 - 黄色系
    PROCESSED_BY: '#fadb14',        // 处理 - 黄色
    TREATED_WITH: '#fff566',        // 处理 - 亮黄
    MODIFIED_BY: '#fffb8f',         // 修改 - 浅黄
    
    // 测试关系 - 棕色系
    TESTED_BY: '#8c6239',           // 测试 - 棕色
    MEASURED_BY: '#ad7a47',         // 测量 - 中棕
    EVALUATED_BY: '#d48806',        // 评估 - 浅棕
    
    // 通用关系 - 灰色系
    relationship: '#8c8c8c',        // 关系 - 中灰
    relation: '#bfbfbf',            // 关联 - 浅灰
    RELATED_TO: '#d9d9d9',          // 相关 - 淡灰
    
    // 默认
    unknown: '#f0f0f0'              // 未知 - 极淡灰
  };

  // 🎯 转换节点数据 - 优化视觉效果和性能
  const visNodes = new DataSet(
    nodes.map(node => {
      const cleanType = cleanNodeType(node.type);
      const baseColor = nodeColors[cleanType] || '#8c8c8c';
      const isSelected = selectedNodes.includes(node.id);
      
      return {
        id: node.id,
        label: truncateText(node.label, 12), // 缩短标签以减少重叠
        title: formatNodeTitle(node),
        color: {
          background: baseColor,
          border: isSelected ? '#ff4d4f' : '#ffffff', // 白色边框更清晰
          highlight: {
            background: baseColor,
            border: '#ff4d4f'
          },
          hover: {
            background: baseColor,
            border: '#1890ff'
          }
        },
        // 🎨 节点大小基于连接数，但限制范围避免过大节点影响性能
        size: Math.max(20, Math.min(45, 20 + (node.connections || 1) * 2)),
        font: {
          size: Math.max(10, Math.min(14, 12)), // 自适应字体大小
          color: '#ffffff',
          strokeWidth: 1.5,
          strokeColor: '#000000',
          vadjust: 0 // 垂直对齐
        },
        borderWidth: isSelected ? 3 : 2,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 6,
          x: 2,
          y: 2
        },
        // 💫 保持所有节点为圆形，但通过颜色区分类型
        shape: 'dot',
        x: node.position?.x,
        y: node.position?.y,
        // 🎭 根据节点重要性调整透明度
        opacity: node.connections && node.connections > 5 ? 1.0 : 0.9
      };
    })
  );

  // 🔗 转换边数据 - 优化连线美观性和性能
  const visEdges = new DataSet(
    edges.map(edge => {
      const cleanType = cleanNodeType(edge.type);
      const baseColor = edgeColors[cleanType] || '#8c8c8c';
      const isSelected = selectedEdges.includes(edge.id);
      const weight = edge.weight || 0.5;
      
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.label && edge.label.length > 0 ? truncateText(edge.label, 8) : '', // 缩短边标签
        title: `关系类型: ${edge.type}\n权重: ${weight.toFixed(2)}\n${edge.label ? `标签: ${edge.label}` : ''}`,
        color: {
          color: baseColor,
          highlight: '#ff4d4f',
          hover: '#1890ff',
          opacity: 0.8 // 设置透明度避免过于突出
        },
        // 🎨 边宽度基于权重，但限制范围
        width: Math.max(1, Math.min(6, weight * 8 + 1)),
        arrows: {
          to: {
            enabled: true,
            scaleFactor: Math.max(0.8, Math.min(1.2, weight + 0.3)), // 箭头大小随权重变化
            type: 'arrow'
          }
        },
        smooth: {
          enabled: true,
          type: 'curvedCW', // 使用弯曲样式，更美观
          roundness: weight * 0.3 + 0.1 // 弯曲程度基于权重
        },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.1)',
          size: 3,
          x: 1,
          y: 1
        },
        // 🎭 动态透明度
        opacity: isSelected ? 1.0 : 0.7,
        // 边的选择状态
        selected: isSelected,
        // 🚀 性能优化：减少不必要的动画
        physics: weight > 0.7, // 只对重要的边启用物理模拟
        font: {
          size: 10,
          color: baseColor,
          strokeWidth: 1,
          strokeColor: '#ffffff'
        }
      };
    })
  );

  // ⚙️ 优化的网络配置 - 平衡性能和美观性
  const options = {
    nodes: {
      shape: 'dot', // 统一使用圆形
      font: {
        size: 12,
        color: '#ffffff',
        strokeWidth: 1.5,
        strokeColor: '#000000',
        face: 'Tahoma, Arial, sans-serif'
      },
      borderWidth: 2,
      shadow: {
        enabled: true,
        color: 'rgba(0,0,0,0.2)',
        size: 6,
        x: 2,
        y: 2
      },
      labelHighlightBold: false,
      chosen: {
        node: (values: any, id: string, selected: boolean, hovering: boolean) => {
          values.borderWidth = selected ? 4 : hovering ? 3 : 2;
          values.borderColor = selected ? '#ff4d4f' : hovering ? '#1890ff' : '#ffffff';
          values.shadow = selected || hovering;
        }
      },
      scaling: {
        min: 15,
        max: 50,
        label: {
          enabled: true,
          min: 10,
          max: 16,
          maxVisible: 30,
          drawThreshold: 8
        }
      }
    },
    edges: {
      smooth: {
        enabled: true,
        type: 'curvedCW',
        roundness: 0.2
      },
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 1,
          type: 'arrow'
        }
      },
      shadow: {
        enabled: true,
        color: 'rgba(0,0,0,0.1)',
        size: 3,
        x: 1,
        y: 1
      },
      font: {
        size: 10,
        strokeWidth: 1,
        strokeColor: '#ffffff'
      },
      labelHighlightBold: false,
      selectionWidth: 3,
      hoverWidth: 2
    },
    physics: {
      enabled: layout.physics?.enabled !== false,
      solver: 'barnesHut',
      barnesHut: {
        // 🚀 性能优化：减少计算复杂度但保持良好布局
        gravitationalConstant: -8000,   // 适中的引力
        centralGravity: 0.05,           // 减少中心引力
        springLength: 120,              // 合适的弹簧长度
        springConstant: 0.04,           // 增加弹簧常数提高稳定性
        damping: 0.2,                   // 增加阻尼快速稳定
        avoidOverlap: 0.8               // 适度避免重叠
      },
      stabilization: {
        // 🎯 快速稳定化配置
        iterations: Math.min(150, nodes.length * 2), // 根据节点数动态调整
        updateInterval: 50,
        fit: true
      },
      adaptiveTimestep: true,
      timestep: 0.5,
      maxVelocity: 50,
      minVelocity: 0.75
    },
    interaction: {
      hover: true,
      hoverConnectedEdges: true,
      selectConnectedEdges: false,
      tooltipDelay: 300,
      zoomView: true,
      dragView: true,
      navigationButtons: false, // 关闭导航按钮减少UI复杂度
      keyboard: {
        enabled: true,
        speed: { x: 10, y: 10, zoom: 0.02 }
      },
      zoomSpeed: 1.2
    },
    layout: {
      improvedLayout: true,
      clusterThreshold: 100,
      hierarchical: false
    },
    // 🎨 全局样式配置
    configure: {
      enabled: false
    },
    // 🚀 性能优化配置
    groups: {},
    manipulation: {
      enabled: false
    }
  };

  // 🚀 优化的网络初始化
  useEffect(() => {
    if (containerRef.current && !loading) {
      try {
        const startTime = performance.now();
        
        // 📊 性能监控和调试信息
        console.log(`🎨 渲染知识图谱: ${visNodes.length} 个节点, ${visEdges.length} 条边`);
        
        // 🎯 大数据集性能优化
        if (visNodes.length > 200) {
          console.log('🚀 检测到大数据集，启用性能优化模式');
          // 对大数据集禁用一些视觉效果以提升性能
          options.nodes.shadow.enabled = false;
          options.edges.shadow.enabled = false;
          options.physics.stabilization.iterations = Math.min(100, visNodes.length);
        }
        
        // 创建网络实例
        const network = new Network(
          containerRef.current,
          { nodes: visNodes, edges: visEdges },
          options
        );

        networkRef.current = network;
        
        // 📈 性能监控
        network.on('stabilized', () => {
          const endTime = performance.now();
          console.log(`⚡ 图谱渲染完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
          onStabilized?.();
        });

        // 事件监听
        network.on('click', (params) => {
          if (params.nodes.length > 0) {
            onNodeClick?.(params.nodes[0]);
          } else if (params.edges.length > 0) {
            onEdgeClick?.(params.edges[0]);
          }
        });

        network.on('doubleClick', (params) => {
          if (params.nodes.length > 0) {
            onNodeDoubleClick?.(params.nodes[0]);
          }
        });

        network.on('select', (params) => {
          onSelectionChange?.(params.nodes, params.edges);
        });

        network.on('stabilized', () => {
          onStabilized?.();
        });

        // 自适应布局
        network.fit();

        return () => {
          network.destroy();
        };
      } catch (error) {
        console.error('Failed to initialize network:', error);
        message.error('图谱初始化失败');
      }
    }
  }, [nodes, edges, layout, loading]);

  // 更新选中状态
  useEffect(() => {
    if (networkRef.current) {
      networkRef.current.setSelection({
        nodes: selectedNodes,
        edges: selectedEdges
      });
    }
  }, [selectedNodes, selectedEdges]);

  // 控制操作
  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale() * 1.2;
      networkRef.current.moveTo({ scale });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale() * 0.8;
      networkRef.current.moveTo({ scale });
    }
  };

  const handleFit = () => {
    if (networkRef.current) {
      networkRef.current.fit({
        animation: {
          duration: 1000,
          easingFunction: 'easeInOutQuad'
        }
      });
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleRestart = () => {
    if (networkRef.current) {
      networkRef.current.stabilize();
    }
  };

  return (
    <Card 
      className="h-full"
      bodyStyle={{ padding: 0, height: '100%' }}
      headStyle={{ 
        padding: '0 16px', 
        margin: 0, 
        minHeight: '46px',
        height: '46px',
        borderBottom: '1px solid #f0f0f0'
      }}
      style={{ 
        border: 'none',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      title={
        <div className="flex items-center justify-between h-full">
          <span>知识图谱</span>
          <Space>
            <Button 
              type="text" 
              size="small"
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
              title="放大"
            />
            <Button 
              type="text" 
              size="small"
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
              title="缩小"
            />
            <Button 
              type="text" 
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleRestart}
              title="重新布局"
            />
            <Button 
              type="text" 
              size="small"
              icon={<FullscreenOutlined />}
              onClick={handleFullscreen}
              title="全屏"
            />
          </Space>
        </div>
      }
    >
      <div className="relative h-full">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <Spin size="large" />
          </div>
        )}
        
        <div 
          ref={containerRef} 
          className="w-full h-full min-h-[500px]"
          style={{ 
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: isFullscreen ? 0 : '0 0 8px 8px'
          }}
        />

        {/* 🎨 优化的图例 - 显示实际存在的节点类型 */}
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 rounded-lg p-4 shadow-lg border border-gray-200 max-h-80 overflow-y-auto" style={{ zIndex: 10, minWidth: '180px' }}>
          <div className="text-sm font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">
            🎯 节点类型 ({Array.from(new Set(nodes.map(n => cleanNodeType(n.type)))).length} 种)
          </div>
          <div className="space-y-2">
            {Array.from(new Set(nodes.map(n => cleanNodeType(n.type)))).sort().map(type => {
              const color = nodeColors[type] || '#8c8c8c';
              const count = nodes.filter(n => cleanNodeType(n.type) === type).length;
              const label = nodeTypeLabels[type] || type;
              
              return (
                <div key={type} className="flex items-center justify-between text-xs hover:bg-gray-50 p-1 rounded">
                  <div className="flex items-center flex-1">
                    <div 
                      className="w-4 h-4 rounded-full mr-2 shadow-sm border border-white" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-gray-700 font-medium truncate" title={label}>
                      {label}
                    </span>
                  </div>
                  <span className="text-gray-500 ml-2 font-mono text-xs">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* 边类型图例 */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-sm font-semibold mb-2 text-gray-800">
              🔗 关系类型 ({Array.from(new Set(edges.map(e => cleanNodeType(e.type)))).length} 种)
            </div>
            <div className="space-y-1">
              {Array.from(new Set(edges.map(e => cleanNodeType(e.type)))).sort().slice(0, 6).map(type => {
                const color = edgeColors[type] || '#8c8c8c';
                const count = edges.filter(e => cleanNodeType(e.type) === type).length;
                
                return (
                  <div key={type} className="flex items-center justify-between text-xs hover:bg-gray-50 p-1 rounded">
                    <div className="flex items-center flex-1">
                      <div 
                        className="w-3 h-1 mr-2 rounded-full" 
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-gray-700 truncate text-xs" title={type}>
                        {type.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                    <span className="text-gray-500 ml-1 font-mono text-xs">
                      {count}
                    </span>
                  </div>
                );
              })}
              {Array.from(new Set(edges.map(e => cleanNodeType(e.type)))).length > 6 && (
                <div className="text-xs text-gray-400 text-center pt-1">
                  ...还有 {Array.from(new Set(edges.map(e => cleanNodeType(e.type)))).length - 6} 种类型
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📊 优化的统计信息面板 */}
        <div className="absolute bottom-12 left-4 bg-white bg-opacity-95 rounded-lg p-3 shadow-lg border border-gray-200" style={{ zIndex: 10, minWidth: '140px' }}>
          <div className="text-sm font-semibold mb-2 text-gray-800 border-b border-gray-200 pb-1">
            📊 图谱概览
          </div>
          <div className="text-xs text-gray-600 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                节点
              </span>
              <span className="font-mono font-semibold text-blue-600">{nodes.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <span className="w-2 h-0.5 bg-green-500 rounded mr-2"></span>
                关系
              </span>
              <span className="font-mono font-semibold text-green-600">{edges.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                选中
              </span>
              <span className="font-mono font-semibold text-orange-600">{selectedNodes.length + selectedEdges.length}</span>
            </div>
            {/* 🎯 显示图谱密度 */}
            <div className="flex justify-between items-center pt-1 border-t border-gray-100">
              <span className="text-gray-500">密度</span>
              <span className="font-mono text-xs text-gray-500">
                {nodes.length > 0 ? (edges.length / nodes.length).toFixed(1) : '0.0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 