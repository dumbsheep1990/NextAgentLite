"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export interface InfoItem {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: string;
}

const OFFSET_FACTOR = 8; // 适中的偏移量
const SCALE_FACTOR = 0.02; // 适中的缩放差异
const OPACITY_FACTOR = 0.08; // 减少透明度差异，让所有卡片更清晰

export function CyclingInfoCards({ items }: { items: InfoItem[] }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const cardCount = items.length;
  const [showCompleted] = React.useState(true);

  // 循环显示逻辑 - 每5秒切换一次
  React.useEffect(() => {
    if (cardCount === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cardCount);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [cardCount]);

  // 重新排序卡片以实现循环效果 - 保持所有卡片显示，只改变顺序
  const orderedItems = cardCount > 0 
    ? [...items.slice(currentIndex), ...items.slice(0, currentIndex)]
    : [];

  return items.length > 0 ? (
    <div
      className="group overflow-visible px-3 pb-3 pt-4 h-full"
      data-active={cardCount !== 0}
    >
      <div className="relative w-full h-full min-h-[220px]">
        {orderedItems.map(({ id, title, description, icon, color }, idx) => (
          <div
            key={`${id}-${currentIndex}`} // 添加currentIndex确保重新渲染
            className={cn(
              "absolute left-0 top-0 size-full scale-[var(--scale)] transition-[opacity,transform] duration-500 ease-out",
              "translate-y-[var(--y)] opacity-[var(--opacity)]" // 所有卡片都显示，不隐藏任何卡片
            )}
            style={{
              "--y": `${(cardCount - 1 - idx) * OFFSET_FACTOR}px`, // 反转：第一张卡片偏移最多，最后一张不偏移
              "--scale": 1 - (cardCount - 1 - idx) * SCALE_FACTOR, // 反转：第一张卡片最大，最后一张最小
              "--opacity": Math.max(0.7, 1 - (cardCount - 1 - idx) * OPACITY_FACTOR), // 反转透明度
              zIndex: idx // 确保正确的层级：第一张卡片在最底层，最后一张在最顶层
            } as React.CSSProperties}
            aria-hidden={idx !== cardCount - 1} // 只有最上面的卡片对屏幕阅读器可见
          >
            <InfoCard
              title={title}
              description={description}
              icon={icon}
              color={color}
              hideContent={idx < cardCount - 2} // 只有最上面的2张卡片显示内容
              active={idx === cardCount - 1} // 最上面的卡片为激活状态
              showButton={idx === cardCount - 1 && cardCount > 1} // 只在最顶层卡片显示按钮
              onNext={() => setCurrentIndex((prev) => (prev + 1) % cardCount)}
            />
          </div>
        ))}
        <div className="pointer-events-none invisible min-h-[160px]" aria-hidden>
          <InfoCard title="Title" description="Description" />
        </div>
        {showCompleted && !cardCount && (
          <div
            className="animate-slide-up-fade absolute inset-0 flex size-full flex-col items-center justify-center gap-3 [animation-duration:1s]"
            style={{ "--offset": "10px" } as React.CSSProperties}
          >
            <div className="animate-fade-in absolute inset-0 rounded-lg border border-neutral-300 [animation-delay:2.3s] [animation-direction:reverse] [animation-duration:0.2s]" />
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="animate-fade-in text-xs font-medium text-muted-foreground [animation-delay:2.3s] [animation-direction:reverse] [animation-duration:0.2s]">
              配置完成！
            </span>
          </div>
        )}
        
      </div>
    </div>
  ) : null;
}

function InfoCard({
  title,
  description,
  icon,
  color,
  hideContent,
  active,
  showButton,
  onNext,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: string;
  hideContent?: boolean;
  active?: boolean;
  showButton?: boolean;
  onNext?: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <Card
      ref={ref}
      className={cn(
        "relative select-none gap-2 p-4 text-sm border min-h-[160px] w-full shadow-md",
        "transition-all duration-300 hover:shadow-lg backdrop-blur-sm",
        // 增强颜色主题，使用更深的背景
        color === 'blue' && "border-blue-300 bg-blue-100/90 hover:bg-blue-200/90",
        color === 'green' && "border-green-300 bg-green-100/90 hover:bg-green-200/90", 
        color === 'orange' && "border-orange-300 bg-orange-100/90 hover:bg-orange-200/90",
        color === 'purple' && "border-purple-300 bg-purple-100/90 hover:bg-purple-200/90",
        !color && "border-gray-300 bg-white/95 hover:bg-gray-50/95",
        // 激活状态
        active && "ring-2 ring-primary/30 shadow-lg"
      )}
    >
      <div className={cn(hideContent && "invisible")}>
        <div className="flex items-start gap-3">
          {icon && (
            <div className={cn(
              "flex-shrink-0 mt-0.5 text-lg",
              color === 'blue' && "text-blue-600",
              color === 'green' && "text-green-600",
              color === 'orange' && "text-orange-600",
              color === 'purple' && "text-purple-600",
              !color && "text-gray-600"
            )}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-bold text-base mb-2 leading-tight",
              color === 'blue' && "text-blue-900",
              color === 'green' && "text-green-900",
              color === 'orange' && "text-orange-900",
              color === 'purple' && "text-purple-900",
              !color && "text-gray-900"
            )}>
              {title}
            </h4>
            <p className={cn(
              "text-sm leading-relaxed line-clamp-4",
              color === 'blue' && "text-blue-800",
              color === 'green' && "text-green-800",
              color === 'orange' && "text-orange-800",
              color === 'purple' && "text-purple-800",
              !color && "text-gray-800"
            )}>
              {description}
            </p>
          </div>
        </div>
        
        {/* 切换按钮 */}
        {showButton && onNext && (
          <button
            className="absolute bottom-1.5 right-1.5 p-1.5 rounded-full bg-white/80 backdrop-blur-sm border shadow-sm hover:bg-white/90 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            title="切换到下一张卡片"
          >
            <svg
              className="w-3 h-3 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* 底部装饰线 */}
        <div className={cn(
          "absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-60",
          color === 'blue' && "bg-blue-400",
          color === 'green' && "bg-green-400",
          color === 'orange' && "bg-orange-400", 
          color === 'purple' && "bg-purple-400",
          !color && "bg-gray-400"
        )} />
      </div>
    </Card>
  );
}

function NextAgentLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground"
      {...props}
    >
      <circle
        cx="16"
        cy="16"
        r="14"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="88"
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dashoffset"
          dur="2500ms"
          values="88;0;0;0;88"
          fill="freeze"
        />
      </circle>
      <path
        d="M12 10L20 16L12 22V10Z"
        fill="currentColor"
        opacity="0"
      >
        <animate
          attributeName="opacity"
          dur="2500ms"
          values="0;0;1;1;0"
          fill="freeze"
        />
      </path>
    </svg>
  );
}
