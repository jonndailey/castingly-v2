import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-700 hover:bg-primary-200',
        secondary: 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200',
        success: 'bg-green-100 text-green-700 hover:bg-green-200',
        warning: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
        error: 'bg-red-100 text-red-700 hover:bg-red-200',
        outline: 'border border-gray-300 text-gray-700',
        ghost: 'text-gray-700 hover:bg-gray-100',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  removable?: boolean
  onRemove?: () => void
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, removable, onRemove, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {children}
        {removable && (
          <button
            onClick={onRemove}
            className="ml-1 hover:text-gray-900 focus:outline-none"
            aria-label="Remove"
          >
            <svg
              className="h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

// Status badge with dot indicator
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'online' | 'offline' | 'busy' | 'away'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, ...props }) => {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  }
  
  const statusVariants = {
    online: 'success',
    offline: 'outline',
    busy: 'error',
    away: 'warning',
  } as const
  
  return (
    <Badge variant={statusVariants[status]} {...props}>
      <span className={cn('w-2 h-2 rounded-full mr-1.5', statusColors[status])} />
      {children}
    </Badge>
  )
}

// Archetype badge with icon
interface ArchetypeBadgeProps {
  archetype: {
    id: string
    name: string
    icon: string
    color: string
  }
  size?: 'sm' | 'md' | 'lg'
  removable?: boolean
  onRemove?: () => void
}

const ArchetypeBadge: React.FC<ArchetypeBadgeProps> = ({
  archetype,
  size = 'md',
  removable,
  onRemove,
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-sm',
        size === 'lg' && 'px-3 py-1.5 text-base'
      )}
      style={{
        backgroundColor: `${archetype.color}20`,
        color: archetype.color,
      }}
    >
      <span className="mr-1">{archetype.icon}</span>
      {archetype.name}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1.5 hover:opacity-70 focus:outline-none"
          aria-label={`Remove ${archetype.name}`}
        >
          <svg
            className="h-3 w-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

export { Badge, StatusBadge, ArchetypeBadge, badgeVariants }