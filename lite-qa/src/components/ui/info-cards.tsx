"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export interface InfoItem {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: string;
}

const OFFSET_FACTOR = 12;
const SCALE_FACTOR = 0.01;
const OPACITY_FACTOR = 0.05;

export function InfoCards({ items }: { items: InfoItem[] }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const cardCount = items.length;
  const [showCompleted] = React.useState(true);

  // 循环显示逻辑
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cardCount);
    }, 5000); // 每5秒切换一次
    return () => clearInterval(interval);
  }, [cardCount]);

  // 重新排序卡片以实现循环效果
  const orderedItems = [...items.slice(currentIndex), ...items.slice(0, currentIndex)];

  return items.length > 0 ? (
    <div
      className="group overflow-hidden px-3 pb-3 pt-4 h-full"
      data-active={cardCount !== 0}
    >
      <div className="relative w-full h-full min-h-[240px]">
        {orderedItems.map(({ id, title, description, icon, color }, idx) => (
          <div
            key={id}
            className={cn(
              "absolute left-0 top-0 size-full scale-[var(--scale)] transition-[opacity,transform] duration-200",
              cardCount - idx > 3
                ? [
                    "opacity-0 sm:group-hover:translate-y-[var(--y)] sm:group-hover:opacity-[var(--opacity)]",
                    "sm:group-has-[*[data-dragging=true]]:translate-y-[var(--y)] sm:group-has-[*[data-dragging=true]]:opacity-[var(--opacity)]",
                  ]
                : "translate-y-[var(--y)] opacity-[var(--opacity)]"
            )}
            style={
              {
                "--y": `-${(cardCount - (idx + 1)) * OFFSET_FACTOR}%`,
                "--scale": 1 - (cardCount - (idx + 1)) * SCALE_FACTOR,
                "--opacity":
                  cardCount - (idx + 1) >= 6
                    ? 0
                    : 1 - (cardCount - (idx + 1)) * OPACITY_FACTOR,
              } as React.CSSProperties
            }
            aria-hidden={idx !== cardCount - 1}
          >
            <InfoCard
              title={title}
              description={description}
              icon={icon}
              color={color}
              hideContent={cardCount - idx > 2}
              active={idx === cardCount - 1}
            />
          </div>
        ))}
        <div className="pointer-events-none invisible min-h-[140px]" aria-hidden>
          <InfoCard title="Title" description="Description" />
        </div>
        {showCompleted && !cardCount && (
          <div
            className="animate-slide-up-fade absolute inset-0 flex size-full flex-col items-center justify-center gap-3 [animation-duration:1s]"
            style={{ "--offset": "10px" } as React.CSSProperties}
          >
            <div className="animate-fade-in absolute inset-0 rounded-lg border border-neutral-300 [animation-delay:2.3s] [animation-direction:reverse] [animation-duration:0.2s]" />
            <NextAgentLogo className="w-1/3" />
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
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: string;
  hideContent?: boolean;
  active?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <Card
      ref={ref}
      className={cn(
        "relative select-none gap-2 p-4 text-sm border min-h-[160px] w-full shadow-sm",
        "transition-shadow hover:shadow-md",
        color === 'blue' && "border-blue-200 bg-blue-50",
        color === 'green' && "border-green-200 bg-green-50", 
        color === 'orange' && "border-orange-200 bg-orange-50",
        color === 'purple' && "border-purple-200 bg-purple-50",
        !color && "border-gray-200 bg-gray-50"
      )}
    >
      <div className={cn(hideContent && "invisible")}>
        <div className="flex items-start gap-3">
          {icon && (
            <div className={cn(
              "flex-shrink-0 mt-0.5",
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
              "font-medium text-sm mb-1",
              color === 'blue' && "text-blue-900",
              color === 'green' && "text-green-900",
              color === 'orange' && "text-orange-900",
              color === 'purple' && "text-purple-900",
              !color && "text-gray-900"
            )}>
              {title}
            </h4>
            <p className={cn(
              "text-xs leading-relaxed",
              color === 'blue' && "text-blue-700",
              color === 'green' && "text-green-700",
              color === 'orange' && "text-orange-700",
              color === 'purple' && "text-purple-700",
              !color && "text-gray-700"
            )}>
              {description}
            </p>
          </div>
        </div>
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