import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type IconComponent = React.ComponentType<{ className?: string }>

interface EmptyStateProps {
  title: string
  description: string
  icons?: IconComponent[]
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  variant?: 'default' | 'single-agent' | 'team-agent'
}

// 通宽Grid组件 - 专业商务风格
const FullWidthGrid = ({
  size = 20,
}: {
  size?: number;
}) => {
  const patternId = React.useId()

  // 使用单一蓝灰色系，规律分布
  const squares = React.useMemo(() => {
    const positions: Array<{ x: number; y: number; opacity: number }> = []

    // 规律性分布，而非完全随机
    for (let i = 0; i < 8; i++) {
      positions.push({
        x: 5 + i * 7,
        y: 2 + (i % 3) * 4,
        opacity: 0.08 + (i % 3) * 0.04
      })
    }

    return positions
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* 白色遮罩渐变层 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)'
        }}
      />

      {/* 网格和方块 */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern
            id={patternId}
            width={size}
            height={size}
            patternUnits="userSpaceOnUse"
            x="0"
            y="0"
          >
            <path
              d={`M.5 ${size}V.5H${size}`}
              fill="none"
              stroke="rgba(100,116,139,0.08)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />

        {/* 单色系规律方块 */}
        {squares.map(({ x, y, opacity }, i) => (
          <rect
            key={`square-${i}`}
            strokeWidth="0"
            width={size + 1}
            height={size + 1}
            x={x * size}
            y={y * size}
            fill={`rgba(59,130,246,${opacity})`}
          />
        ))}
      </svg>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  icons = [],
  action,
  className,
  variant = 'default'
}: EmptyStateProps) {
  return (
    <div className={cn(
      "relative text-center overflow-hidden",
      "rounded-3xl w-full max-w-[620px] min-h-[320px]",
      "group transition duration-500 hover:duration-200 flex flex-col items-center justify-center",
      className
    )}
    style={{
      background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
      border: '1px solid #d5e4f7',
      boxShadow: '0 2px 12px rgba(30, 64, 175, 0.04)'
    }}>
      {/* Grid背景 - 带遮罩层和多彩方块 */}
      <FullWidthGrid size={20} />

      <div className="relative z-20 px-14 pt-14 pb-8">
        <div className="flex justify-center isolate mb-6">
          {icons.length === 3 ? (
            <>
              <div className="bg-background size-12 grid place-items-center rounded-xl relative left-2.5 top-1.5 -rotate-6 shadow-lg ring-1 ring-border group-hover:-translate-x-5 group-hover:-rotate-12 group-hover:-translate-y-0.5 transition duration-500 group-hover:duration-200">
                {React.createElement(icons[0], {
                  className: "w-6 h-6 text-muted-foreground"
                })}
              </div>
              <div className="bg-background size-12 grid place-items-center rounded-xl relative z-10 shadow-lg ring-1 ring-border group-hover:-translate-y-0.5 transition duration-500 group-hover:duration-200">
                {React.createElement(icons[1], {
                  className: "w-6 h-6 text-muted-foreground"
                })}
              </div>
              <div className="bg-background size-12 grid place-items-center rounded-xl relative right-2.5 top-1.5 rotate-6 shadow-lg ring-1 ring-border group-hover:translate-x-5 group-hover:rotate-12 group-hover:-translate-y-0.5 transition duration-500 group-hover:duration-200">
                {React.createElement(icons[2], {
                  className: "w-6 h-6 text-muted-foreground"
                })}
              </div>
            </>
          ) : (
            <div className="bg-background size-12 grid place-items-center rounded-xl shadow-lg ring-1 ring-border group-hover:-translate-y-0.5 transition duration-500 group-hover:duration-200">
              {icons[0] && React.createElement(icons[0], {
                className: "w-6 h-6 text-muted-foreground"
              })}
            </div>
          )}
        </div>
        <h2 className="text-foreground font-medium text-xl">{title}</h2>
        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line max-w-md mx-auto">{description}</p>
      </div>

      {action && (
        <div className="relative z-20 pb-6">
          <Button
            onClick={action.onClick}
            variant="default"
            className={cn(
              "shadow-lg hover:shadow-xl transition-all duration-200",
              "bg-white hover:bg-gray-50 text-gray-900",
              "border border-gray-200",
              "px-6 py-2 rounded-full font-medium"
            )}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
