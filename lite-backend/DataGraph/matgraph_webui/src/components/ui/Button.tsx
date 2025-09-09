import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

// eslint-disable-next-line react-refresh/only-export-components
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-black text-white hover:bg-gray-800',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-gray-300 bg-white text-black hover:bg-gray-50',
        secondary: 'bg-gray-100 text-black hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 hover:text-black',
        link: 'text-black underline-offset-4 hover:underline',
        success: 'bg-black text-white hover:bg-gray-800',
        warning: 'bg-black text-white hover:bg-gray-800'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'size-8'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  side?: 'top' | 'right' | 'bottom' | 'left'
  tooltip?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, tooltip, size, side = 'right', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    if (!tooltip) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }), 'cursor-pointer')}
          ref={ref}
          {...props}
        />
      )
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Comp
              className={cn(buttonVariants({ variant, size, className }), 'cursor-pointer')}
              ref={ref}
              {...props}
            />
          </TooltipTrigger>
          <TooltipContent side={side}>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
)
Button.displayName = 'Button'

export type ButtonVariantType = Exclude<
  NonNullable<Parameters<typeof buttonVariants>[0]>['variant'],
  undefined
>

export default Button
