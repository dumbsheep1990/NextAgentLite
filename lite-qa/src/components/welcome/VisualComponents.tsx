import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// Visual Component Props
interface VisualProps {
  mainColor?: string
  secondaryColor?: string
  gridColor?: string
}

// Shared Components
const EllipseGradient: React.FC<{ color: string }> = ({ color }) => {
  return (
    <div className="absolute inset-0 z-[5] flex h-full w-full items-center justify-center">
      <svg
        width="380"
        height="200"
        viewBox="0 0 380 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="380" height="200" fill="url(#paint0_radial)" />
        <defs>
          <radialGradient
            id="paint0_radial"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(190 100) rotate(90) scale(100 190)"
          >
            <stop stopColor={color} stopOpacity="0.3" />
            <stop offset="0.4" stopColor={color} stopOpacity="0.2" />
            <stop offset="1" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}

const GridLayer: React.FC<{ color: string }> = ({ color }) => {
  return (
    <div
      style={{ "--grid-color": color } as React.CSSProperties}
      className="pointer-events-none absolute inset-0 z-[4] h-full w-full bg-transparent bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] bg-[size:24px_24px] bg-center opacity-60"
    />
  )
}

// Visual 1: Analytics Card (专家问答模式)
export const AnalyticsVisual: React.FC<VisualProps & { hovered?: boolean }> = ({
  mainColor = "#8b5cf6",
  secondaryColor = "#fbbf24",
  gridColor = "#80808020",
  hovered: externalHovered
}) => {
  const [localHovered, setLocalHovered] = useState(false)
  const [mainProgress, setMainProgress] = useState(15)
  const [secondaryProgress, setSecondaryProgress] = useState(0)

  const isHovered = externalHovered !== undefined ? externalHovered : localHovered;

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isHovered) {
      timeout = setTimeout(() => {
        setMainProgress(75)
        setSecondaryProgress(100)
      }, 300)
    } else {
      setMainProgress(15)
      setSecondaryProgress(0)
    }

    return () => clearTimeout(timeout)
  }, [isHovered])

  const radius = 35
  const circumference = 2 * Math.PI * radius
  const mainDashoffset = circumference - (mainProgress / 100) * circumference
  const secondaryDashoffset = circumference - (secondaryProgress / 100) * circumference

  const techItems = [
    { id: 1, translateX: "120", translateY: "60", text: "AI Agent", icon: () => (
      <div className="w-4 h-4 rounded bg-blue-500 relative">
        <div className="absolute inset-1 rounded bg-white"></div>
      </div>
    )},
    { id: 2, translateX: "120", translateY: "-60", text: "快速响应", icon: () => (
      <div className="w-4 h-4 relative">
        <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-yellow-500"></div>
        <div className="absolute top-2 w-4 h-0.5 bg-yellow-500"></div>
      </div>
    )},
    { id: 3, translateX: "140", translateY: "0", text: "语义理解", icon: () => (
      <div className="w-4 h-4 rounded-full border-2 border-purple-500 relative">
        <div className="absolute inset-1 rounded-full bg-purple-500"></div>
      </div>
    )},
    { id: 4, translateX: "-140", translateY: "0", text: "知识库", icon: () => (
      <div className="flex flex-col gap-0.5">
        <div className="w-4 h-1 bg-green-500 rounded-sm"></div>
        <div className="w-4 h-1 bg-green-500 rounded-sm"></div>
        <div className="w-4 h-1 bg-green-500 rounded-sm"></div>
      </div>
    )},
    { id: 5, translateX: "-120", translateY: "60", text: "流式对话", icon: () => (
      <div className="flex gap-0.5 items-center">
        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
      </div>
    )},
    { id: 6, translateX: "-120", translateY: "-60", text: "精准匹配", icon: () => (
      <div className="w-4 h-4 border border-red-500 relative">
        <div className="absolute inset-1 border border-red-500"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-0.5 h-0.5 bg-red-500 rounded-full"></div>
        </div>
      </div>
    )},
  ]

  return (
    <div 
      className="relative h-[200px] w-[380px] overflow-hidden rounded-t-2xl"
      onMouseEnter={() => externalHovered === undefined && setLocalHovered(true)}
      onMouseLeave={() => externalHovered === undefined && setLocalHovered(false)}
    >
      {/* Main Chart */}
      <div className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] absolute top-0 left-0 z-[7] flex h-[200px] w-[380px] transform items-center justify-center transition-transform duration-700 group-hover/animated-card:-translate-y-[20px] group-hover/animated-card:scale-105">
        <div className="relative flex h-[100px] w-[100px] items-center justify-center">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              opacity={0.1}
              className="text-zinc-400"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={secondaryColor}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={secondaryDashoffset}
              transform="rotate(-90 50 50)"
              style={{
                transition: "stroke-dashoffset 0.7s cubic-bezier(0.6, 0.6, 0, 1)",
              }}
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={mainColor}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={mainDashoffset}
              transform="rotate(-90 50 50)"
              style={{
                transition: "stroke-dashoffset 0.7s cubic-bezier(0.6, 0.6, 0, 1)",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-800 transition-all duration-300">
              {isHovered ? (secondaryProgress > 75 ? secondaryProgress : mainProgress) : mainProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* Tech Stack Items */}
      <div className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] absolute inset-0 z-[7] flex items-center justify-center opacity-0 transition-opacity duration-700 group-hover/animated-card:opacity-100">
        {techItems.map((item, index) => (
          <div
            key={item.id}
            className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] absolute flex items-center justify-center gap-2 rounded-full border border-zinc-200/60 bg-white/90 px-3 py-1.5 backdrop-blur-md transition-all duration-700"
            style={{
              transform: `translate(${item.translateX}px, ${item.translateY}px)`,
              transitionDelay: `${index * 100}ms`,
            }}
          >
            <item.icon />
            <span className="text-xs font-medium text-gray-700">
              {item.text}
            </span>
          </div>
        ))}
      </div>

      <EllipseGradient color={mainColor} />
      <GridLayer color={gridColor} />
    </div>
  )
}

// Visual 2: Wave Animation Card (团队协作模式)
export const WaveVisual: React.FC<VisualProps> = ({
  mainColor = "#3b82f6",
  secondaryColor = "#1d4ed8", 
  gridColor = "#80808020",
}) => {
  const agentIcons = [
    // 搜索
    () => <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center"><div className="w-3 h-3 rounded-full border border-white relative"><div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-white rounded transform rotate-45"></div></div></div>,
    // 分析
    () => <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center"><div className="flex gap-0.5 items-end"><div className="w-0.5 h-2 bg-white"></div><div className="w-0.5 h-3 bg-white"></div><div className="w-0.5 h-1.5 bg-white"></div></div></div>,
    // 格式化
    () => <div className="w-6 h-6 bg-yellow-500 flex items-center justify-center"><div className="flex flex-col gap-0.5"><div className="w-3 h-0.5 bg-white"></div><div className="w-2 h-0.5 bg-white"></div><div className="w-3 h-0.5 bg-white"></div></div></div>,
    // 检索
    () => <div className="w-6 h-6 bg-green-500 flex items-center justify-center"><div className="w-3 h-3 bg-white rounded-sm relative"><div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-green-500 rounded-full"></div></div></div>,
    // 验证
    () => <div className="w-6 h-6 bg-cyan-500 flex items-center justify-center"><div className="w-3 h-3 border border-white rounded-sm flex items-center justify-center"><div className="w-1 h-1.5 border-l border-b border-white transform -rotate-45"></div></div></div>,
    // 总结
    () => <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"><div className="flex flex-col gap-0.5"><div className="w-3 h-0.5 bg-white rounded"></div><div className="w-2 h-0.5 bg-white rounded"></div><div className="w-1 h-0.5 bg-white rounded"></div></div></div>
  ];

  return (
    <div className="relative h-[200px] w-[380px] overflow-hidden rounded-t-2xl">
      {/* Dynamic Wave Background */}
      <div className="absolute inset-0 z-[6]">
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 380 200"
          fill="none"
        >
          <path
            d="M0,160 Q95,120 190,140 T380,130 L380,200 L0,200 Z"
            fill="url(#waveGradient1)"
            className="transition-all duration-1000 ease-in-out translate-y-8 group-hover/animated-card:translate-y-0"
          />
          <path
            d="M0,170 Q95,130 190,150 T380,140 L380,200 L0,200 Z"
            fill="url(#waveGradient2)"
            className="transition-all duration-1000 ease-in-out translate-y-6 group-hover/animated-card:translate-y-0"
            style={{ transitionDelay: "200ms" }}
          />
          <defs>
            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`${mainColor}60`} />
              <stop offset="100%" stopColor={`${mainColor}30`} />
            </linearGradient>
            <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`${secondaryColor}40`} />
              <stop offset="100%" stopColor={`${secondaryColor}20`} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Agent Network Visualization */}
      <div className="absolute inset-0 z-[7]">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute transition-all duration-1000 ease-in-out opacity-0 group-hover/animated-card:opacity-100"
            style={{
              left: `${60 + (i % 3) * 90}px`,
              top: `${60 + Math.floor(i / 3) * 60}px`,
              transitionDelay: `${i * 150}ms`,
            }}
          >
            <div className="relative">
              {/* Connection Lines */}
              {i < 5 && (
                <svg className="absolute top-6 left-6 w-20 h-8 opacity-40">
                  <line
                    x1="0" y1="0" x2="60" y2={i % 2 === 0 ? "-10" : "25"}
                    stroke={mainColor}
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    className="animate-pulse"
                  />
                </svg>
              )}
              
              {/* Agent Node */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 backdrop-blur-sm shadow-lg border-2 transition-all duration-500 group-hover/animated-card:scale-110 group-hover/animated-card:shadow-xl"
                style={{ borderColor: mainColor }}>
                {React.createElement(agentIcons[i])}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Central Hub */}
      <div className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] absolute inset-0 z-[8] flex items-center justify-center transition-all duration-700 group-hover/animated-card:scale-110">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 backdrop-blur-sm shadow-2xl border-4 transition-all duration-500"
          style={{ borderColor: mainColor }}>
          <div className="w-8 h-8 relative">
            <div className="absolute inset-0 rounded-full bg-blue-500"></div>
            <div className="absolute inset-1 rounded-full bg-white"></div>
            <div className="absolute inset-2 rounded-full bg-blue-500"></div>
          </div>
        </div>
      </div>

      {/* Connecting Circles Animation */}
      <div className="absolute inset-0 z-[5] flex items-center justify-center">
        <div className="h-32 w-32 rounded-full border opacity-20 transition-all duration-1000 group-hover/animated-card:scale-150 group-hover/animated-card:opacity-40"
          style={{ borderColor: mainColor }} />
        <div className="absolute h-48 w-48 rounded-full border opacity-10 transition-all duration-1200 group-hover/animated-card:scale-125 group-hover/animated-card:opacity-30"
          style={{ borderColor: secondaryColor }} />
      </div>

      <GridLayer color={gridColor} />
    </div>
  )
}

// Visual 3: Geometric Morphing Card (知识库管理)
export const GeometricVisual: React.FC<VisualProps> = ({
  mainColor = "#10b981",
  secondaryColor = "#059669",
  gridColor = "#80808020",
}) => {
  const storageItems = [
    { 
      icon: () => <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center"><div className="w-3 h-1 bg-white rounded-full"></div></div>, 
      label: "存储块" 
    },
    { 
      icon: () => <div className="w-6 h-6 bg-green-500 flex items-center justify-center"><div className="flex flex-col gap-0.5"><div className="w-3 h-0.5 bg-white"></div><div className="w-2 h-0.5 bg-white"></div></div></div>, 
      label: "索引" 
    },
    { 
      icon: () => <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center"><div className="w-2.5 h-2.5 border border-white rounded"></div></div>, 
      label: "缓存" 
    },
    { 
      icon: () => <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>, 
      label: "备份" 
    }
  ];

  return (
    <div className="relative h-[200px] w-[380px] overflow-hidden rounded-t-2xl">
      {/* Main Folder Icon */}
      <div className="absolute inset-0 z-[6] flex items-center justify-center">
        <div className="relative">
          {/* Main Folder */}
          <div className="relative transition-all duration-700 group-hover/animated-card:scale-110 group-hover/animated-card:rotate-2">
            <div className="w-16 h-12 bg-blue-500 rounded-sm shadow-lg relative">
              <div className="absolute -top-2 left-0 w-6 h-2 bg-blue-500 rounded-t-sm"></div>
              <div className="absolute inset-1 bg-blue-400/30 rounded-sm"></div>
            </div>
          </div>
          
          {/* Floating Storage Items */}
          {storageItems.map((storageItem, i) => (
            <div
              key={i}
              className="absolute transition-all duration-1000 ease-in-out opacity-0 group-hover/animated-card:opacity-100"
              style={{
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateX(0px) rotate(-${i * 90}deg)`,
                transitionDelay: `${i * 150}ms`,
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/95 shadow-lg border-2 transition-all duration-500 group-hover/animated-card:scale-110"
                style={{ 
                  borderColor: mainColor,
                  transform: `rotate(${i * 90}deg) translateX(70px) rotate(-${i * 90}deg)`
                }}
              >
                <storageItem.icon />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sync Progress Indicator */}
      <div className="absolute bottom-4 left-4 right-4 z-[7] opacity-0 transition-all duration-700 group-hover/animated-card:opacity-100">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 group-hover/animated-card:w-full"
            style={{ width: "0%" }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-600">
          <span>数据同步中...</span>
          <span>100%</span>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 z-[5]">
        <svg width="380" height="200" className="opacity-10">
          <defs>
            <pattern id="dataPattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="8" r="6" fill="none" stroke={mainColor} strokeWidth="1"/>
              <circle cx="12" cy="16" r="6" fill="none" stroke={mainColor} strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dataPattern)" />
        </svg>
      </div>

      <GridLayer color={gridColor} />
    </div>
  )
}

// Visual 4: Network Graph Card (知识图谱)
export const NetworkVisual: React.FC<VisualProps> = ({
  mainColor = "#06b6d4",
  secondaryColor = "#0891b2",
  gridColor = "#80808020",
}) => {
  const nodes = [
    { id: 1, x: 190, y: 100, size: 8 },
    { id: 2, x: 120, y: 60, size: 6 },
    { id: 3, x: 260, y: 80, size: 6 },
    { id: 4, x: 100, y: 140, size: 5 },
    { id: 5, x: 280, y: 140, size: 5 },
    { id: 6, x: 190, y: 40, size: 4 },
    { id: 7, x: 190, y: 160, size: 4 },
  ]

  return (
    <div className="relative h-[200px] w-[380px] overflow-hidden rounded-t-2xl">
      {/* Network Lines */}
      <svg className="absolute inset-0 z-[6] h-full w-full">
        {nodes.map((node, i) =>
          nodes.slice(i + 1).map((targetNode, j) => (
            <line
              key={`${i}-${j}`}
              x1={node.x}
              y1={node.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke={secondaryColor}
              strokeWidth="1"
              opacity="0.4"
              className="transition-all duration-500 ease-in-out group-hover/animated-card:stroke-2 group-hover/animated-card:opacity-80"
              style={{ 
                transitionDelay: `${(i + j) * 50}ms`,
                stroke: mainColor 
              }}
            />
          ))
        )}
      </svg>

      {/* Network Nodes */}
      <div className="absolute inset-0 z-[7]">
        {nodes.map((node, i) => (
          <div
            key={node.id}
            className="absolute rounded-full transition-all duration-500 ease-in-out group-hover/animated-card:animate-pulse group-hover/animated-card:scale-150"
            style={{
              left: node.x - node.size / 2,
              top: node.y - node.size / 2,
              width: node.size,
              height: node.size,
              backgroundColor: i === 0 ? mainColor : secondaryColor,
              transitionDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>

      <EllipseGradient color={mainColor} />
      <GridLayer color={gridColor} />
    </div>
  )
}

// Visual 5: Tools Integration (工具集成)
export const ToolsIntegrationVisual: React.FC<VisualProps> = ({
  mainColor = "#6366f1",
  secondaryColor = "#4f46e5", 
  gridColor = "#80808020",
}) => {
  const toolCategories = [
    { 
      icon: () => <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center"><div className="w-3 h-3 border-2 border-white rounded-sm relative"><div className="absolute inset-0.5 bg-blue-300 rounded-sm"></div></div></div>, 
      label: "系统工具",
      color: "#3b82f6" 
    },
    { 
      icon: () => <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"><div className="flex gap-0.5"><div className="w-1 h-3 bg-white rounded"></div><div className="w-1 h-2 bg-white rounded"></div><div className="w-1 h-1 bg-white rounded"></div></div></div>, 
      label: "MCP工具",
      color: "#10b981" 
    },
    { 
      icon: () => <div className="w-6 h-6 bg-purple-500 flex items-center justify-center"><div className="w-3 h-3 relative"><div className="absolute inset-0 border border-white rounded-full"></div><div className="absolute inset-1 bg-white rounded-full"></div></div></div>, 
      label: "API接口",
      color: "#8b5cf6" 
    },
    { 
      icon: () => <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center"><div className="flex flex-col gap-0.5"><div className="w-3 h-0.5 bg-white rounded"></div><div className="w-2 h-0.5 bg-white rounded"></div><div className="w-3 h-0.5 bg-white rounded"></div></div></div>, 
      label: "外部服务",
      color: "#f59e0b" 
    }
  ];

  return (
    <div className="relative h-[200px] w-[380px] overflow-hidden rounded-t-2xl">
      {/* Central Hub Icon */}
      <div className="absolute inset-0 z-[7] flex items-center justify-center transition-all duration-700 group-hover/animated-card:scale-90">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 backdrop-blur-sm shadow-xl border-4 transition-all duration-500"
          style={{ borderColor: mainColor }}>
          <div className="w-8 h-8 relative flex items-center justify-center">
            {/* SVG扳手图标 */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" fill="#6366f1"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Floating Tool Categories */}
      {toolCategories.map((tool, i) => (
        <div
          key={i}
          className="absolute transition-all duration-1000 ease-in-out opacity-0 group-hover/animated-card:opacity-100"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateX(0px) rotate(-${i * 90}deg)`,
            transitionDelay: `${i * 150}ms`,
          }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/95 shadow-lg border-2 transition-all duration-500 group-hover/animated-card:scale-110"
            style={{ 
              borderColor: tool.color,
              transform: `rotate(${i * 90}deg) translateX(80px) rotate(-${i * 90}deg)`
            }}
          >
            <tool.icon />
          </div>
          
          {/* Tool label */}
          <div 
            className="absolute top-16 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 bg-white/90 px-2 py-1 rounded-md shadow-sm whitespace-nowrap transition-all duration-500 opacity-0 group-hover/animated-card:opacity-100"
            style={{
              transform: `rotate(${i * 90}deg) translateX(80px) rotate(-${i * 90}deg) translateX(-50%)`,
              transitionDelay: `${i * 150 + 200}ms`
            }}
          >
            {tool.label}
          </div>
        </div>
      ))}

      {/* Connection Lines */}
      <div className="absolute inset-0 z-[6] flex items-center justify-center">
        <svg width="200" height="200" className="transition-all duration-1000 opacity-0 group-hover/animated-card:opacity-40">
          {toolCategories.map((_, i) => {
            const angle = (i * Math.PI) / 2;
            const x1 = 100;
            const y1 = 100;
            const x2 = 100 + Math.cos(angle) * 80;
            const y2 = 100 + Math.sin(angle) * 80;
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={mainColor}
                strokeWidth="2"
                strokeDasharray="6,3"
                className="transition-all duration-700"
                style={{ transitionDelay: `${i * 100}ms` }}
              />
            );
          })}
        </svg>
      </div>

      {/* Integration Status Indicators */}
      <div className="absolute top-4 left-4 z-[8] flex gap-2 opacity-0 transition-all duration-700 group-hover/animated-card:opacity-100">
        {[
          { color: "#10b981", label: "在线", count: 12 },
          { color: "#f59e0b", label: "待用", count: 5 },
          { color: "#ef4444", label: "异常", count: 2 }
        ].map((status, i) => (
          <div
            key={i}
            className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded-md text-xs transition-all duration-500"
            style={{
              transitionDelay: `${i * 200}ms`,
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            <span className="font-medium text-gray-700">{status.count}</span>
          </div>
        ))}
      </div>

      {/* Data Flow Animation */}
      <div className="absolute inset-0 z-[5]">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-indigo-400 rounded-full transition-all duration-2000 opacity-0 group-hover/animated-card:opacity-60"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateX(60px)`,
              animation: `float-${i} 3s infinite linear`,
              transitionDelay: `${i * 250}ms`,
            }}
          />
        ))}
      </div>

      <EllipseGradient color={mainColor} />
      <GridLayer color={gridColor} />

      {/* CSS animations for floating particles */}
      <style jsx>{`
        @keyframes float-0 { 0%, 100% { transform: translate(-50%, -50%) rotate(0deg) translateX(60px); } 50% { transform: translate(-50%, -50%) rotate(180deg) translateX(60px); } }
        @keyframes float-1 { 0%, 100% { transform: translate(-50%, -50%) rotate(45deg) translateX(60px); } 50% { transform: translate(-50%, -50%) rotate(225deg) translateX(60px); } }
        @keyframes float-2 { 0%, 100% { transform: translate(-50%, -50%) rotate(90deg) translateX(60px); } 50% { transform: translate(-50%, -50%) rotate(270deg) translateX(60px); } }
        @keyframes float-3 { 0%, 100% { transform: translate(-50%, -50%) rotate(135deg) translateX(60px); } 50% { transform: translate(-50%, -50%) rotate(315deg) translateX(60px); } }
        @keyframes float-4 { 0%, 100% { transform: translate(-50%, -50%) rotate(180deg) translateX(60px); } 50% { transform: translate(-50%, -50%) rotate(360deg) translateX(60px); } }
        @keyframes float-5 { 0%, 100% { transform: translate(-50%, -50%) rotate(225deg) translateX(60px); } 50% { transform: translate(-50%, -50%) rotate(405deg) translateX(60px); } }
        @keyframes float-6 { 0%, 100% { transform: translate(-50%, -50%) rotate(270deg) translateX(60px); } 50% { transform: translate(-50%, -50%) rotate(450deg) translateX(60px); } }
        @keyframes float-7 { 0%, 100% { transform: translate(-50%, -50%) rotate(315deg) translateX(60px); } 50% { transform: translate(-50%, -50%) rotate(495deg) translateX(60px); } }
      `}</style>
    </div>
  )
}

// Visual 6: Atlas Visualization (Atlas向量空间)
export const AtlasVisual: React.FC<VisualProps> = ({
  mainColor = "#c084fc",
  secondaryColor = "#a855f7",
  gridColor = "#80808020",
}) => {
  const clusters = [
    { x: 120, y: 80, points: 6, color: mainColor },
    { x: 280, y: 120, points: 8, color: secondaryColor },
    { x: 190, y: 50, points: 5, color: "#8b5cf6" },
    { x: 200, y: 150, points: 7, color: "#06b6d4" }
  ];

  return (
    <div className="relative h-[200px] w-[380px] overflow-hidden rounded-t-2xl">
      {/* Vector Clusters */}
      <div className="absolute inset-0 z-[6]">
        {clusters.map((cluster, clusterIndex) => (
          <div
            key={clusterIndex}
            className="absolute transition-all duration-1000 ease-in-out opacity-0 group-hover/animated-card:opacity-100"
            style={{
              left: cluster.x,
              top: cluster.y,
              transitionDelay: `${clusterIndex * 200}ms`,
            }}
          >
            {/* Cluster center */}
            <div 
              className="absolute w-4 h-4 rounded-full transition-all duration-500 group-hover/animated-card:scale-125"
              style={{ 
                backgroundColor: cluster.color,
                left: '-8px',
                top: '-8px'
              }} 
            />
            
            {/* Surrounding points */}
            {Array.from({ length: cluster.points }).map((_, i) => {
              const angle = (i * 2 * Math.PI) / cluster.points;
              const radius = 25 + Math.random() * 15;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full transition-all duration-700 group-hover/animated-card:scale-110"
                  style={{
                    left: x - 4,
                    top: y - 4,
                    backgroundColor: cluster.color,
                    opacity: 0.7,
                    transitionDelay: `${clusterIndex * 200 + i * 100}ms`,
                  }}
                />
              );
            })}
            
            {/* Cluster connections */}
            <svg className="absolute -inset-8 w-16 h-16 opacity-30">
              {Array.from({ length: cluster.points }).map((_, i) => {
                const angle = (i * 2 * Math.PI) / cluster.points;
                const radius = 25 + Math.random() * 15;
                const x = Math.cos(angle) * radius + 32;
                const y = Math.sin(angle) * radius + 32;
                
                return (
                  <line
                    key={i}
                    x1="32"
                    y1="32"
                    x2={x}
                    y2={y}
                    stroke={cluster.color}
                    strokeWidth="1"
                    className="transition-all duration-700"
                  />
                );
              })}
            </svg>
          </div>
        ))}
      </div>

      {/* Central Axis */}
      <div className="absolute inset-0 z-[5] flex items-center justify-center">
        <svg width="380" height="200" className="opacity-20">
          <line x1="0" y1="100" x2="380" y2="100" stroke={mainColor} strokeWidth="1" strokeDasharray="4,4" />
          <line x1="190" y1="0" x2="190" y2="200" stroke={mainColor} strokeWidth="1" strokeDasharray="4,4" />
        </svg>
      </div>

      {/* Central Icon */}
      <div className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] absolute inset-0 z-[7] flex items-center justify-center transition-all duration-700 group-hover/animated-card:scale-75 group-hover/animated-card:opacity-50">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border-2 transition-all duration-500"
          style={{ borderColor: mainColor }}>
          <div className="w-8 h-8 relative">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500"></div>
            <div className="absolute inset-2 rounded-full border border-purple-400"></div>
            <div className="absolute inset-3 rounded-full bg-purple-500"></div>
          </div>
        </div>
      </div>

      <EllipseGradient color={mainColor} />
      <GridLayer color={gridColor} />
    </div>
  )
}