import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'

// Card container with animation support
const Card = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & { hover?: boolean }
>(({ className, hover = true, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn(
      'rounded-xl bg-white shadow-md overflow-hidden',
      hover && 'transition-shadow hover:shadow-lg',
      className
    )}
    whileHover={hover ? { y: -4 } : undefined}
    transition={{ duration: 0.2 }}
    {...props}
  />
))
Card.displayName = 'Card'

// Card header
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

// Card title
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-heading font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

// Card description
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

// Card content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

// Card footer
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

// Swipeable card for mobile gestures
const SwipeCard = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & {
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    onSwipeUp?: () => void
  }
>(({ className, onSwipeLeft, onSwipeRight, onSwipeUp, children, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative bg-white rounded-xl shadow-lg cursor-grab active:cursor-grabbing',
        className
      )}
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.2}
      onDragEnd={(e, { offset, velocity }) => {
        const swipe = Math.abs(offset.x) * velocity.x
        
        if (swipe < -10000 && onSwipeLeft) {
          onSwipeLeft()
        } else if (swipe > 10000 && onSwipeRight) {
          onSwipeRight()
        } else if (offset.y < -100 && onSwipeUp) {
          onSwipeUp()
        }
      }}
      whileDrag={{ scale: 1.05 }}
      {...props}
    >
      {children}
    </motion.div>
  )
})
SwipeCard.displayName = 'SwipeCard'

// Actor card specifically for casting
interface ActorCardProps extends HTMLMotionProps<'div'> {
  actor: {
    name: string
    image?: string
    location?: string
    union?: string
    archetypes?: string[]
    age?: string
  }
  onView?: () => void
  onCallback?: () => void
  onPass?: () => void
}

const ActorCard: React.FC<ActorCardProps> = ({
  actor,
  onView,
  onCallback,
  onPass,
  className,
  ...props
}) => {
  return (
    <SwipeCard
      className={cn('w-full max-w-sm', className)}
      onSwipeLeft={onPass}
      onSwipeRight={onCallback}
      onSwipeUp={onView}
      {...props}
    >
      <div className="aspect-[3/4] relative">
        {actor.image ? (
          <img
            src={actor.image}
            alt={actor.name}
            className="w-full h-full object-cover rounded-t-xl"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-teal-100 rounded-t-xl flex items-center justify-center">
            <span className="text-6xl font-heading font-bold text-gray-400">
              {actor.name.charAt(0)}
            </span>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white font-heading font-semibold text-lg">
            {actor.name}
          </h3>
          {actor.age && (
            <p className="text-white/90 text-sm">{actor.age} years old</p>
          )}
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {actor.union && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              {actor.union}
            </span>
          )}
          {actor.location && (
            <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
              {actor.location}
            </span>
          )}
        </div>
        
        {actor.archetypes && actor.archetypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {actor.archetypes.map((archetype, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
              >
                {archetype}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <button
            onClick={onPass}
            className="flex-1 py-2 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Pass
          </button>
          <button
            onClick={onCallback}
            className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Callback
          </button>
        </div>
      </div>
    </SwipeCard>
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  SwipeCard,
  ActorCard,
}