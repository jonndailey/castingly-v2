import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn, getInitials } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
        '2xl': 'h-20 w-20 text-2xl',
        '3xl': 'h-24 w-24 text-3xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    loading="lazy"
    decoding="async"
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100 font-medium text-gray-700',
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: string
  status?: 'online' | 'offline' | 'busy' | 'away'
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, src, alt, fallback, status, ...props }, ref) => {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  }
  
  return (
    <div className="relative inline-block">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        <AvatarImage
          src={src}
          alt={alt}
          // Elevate priority for larger avatars to improve perceived speed
          fetchPriority={size === 'xl' || size === '2xl' || size === '3xl' ? 'high' : 'auto'}
          loading={size === 'xl' || size === '2xl' || size === '3xl' ? 'eager' : 'lazy'}
          decoding="async"
        />
        <AvatarFallback>
          {fallback || getInitials(alt || 'User')}
        </AvatarFallback>
      </AvatarPrimitive.Root>
      
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            statusColors[status],
            size === 'xs' && 'h-2 w-2',
            size === 'sm' && 'h-2.5 w-2.5',
            size === 'md' && 'h-3 w-3',
            size === 'lg' && 'h-3.5 w-3.5',
            size === 'xl' && 'h-4 w-4',
            size === '2xl' && 'h-5 w-5',
            size === '3xl' && 'h-6 w-6'
          )}
        />
      )}
    </div>
  )
})

Avatar.displayName = 'Avatar'

// Avatar group component
interface AvatarGroupProps {
  avatars: Array<{
    src?: string
    alt: string
    fallback?: string
  }>
  max?: number
  size?: VariantProps<typeof avatarVariants>['size']
  className?: string
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 3,
  size = 'md',
  className,
}) => {
  const displayAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max
  
  return (
    <div className={cn('flex -space-x-3', className)}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          alt={avatar.alt}
          fallback={avatar.fallback}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            avatarVariants({ size }),
            'flex items-center justify-center bg-gray-200 text-gray-600 font-medium ring-2 ring-white'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

// Profile avatar with upload capability
interface ProfileAvatarProps extends AvatarProps {
  editable?: boolean
  onUpload?: (file: File) => void
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  editable,
  onUpload,
  ...avatarProps
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  const handleClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onUpload) {
      onUpload(file)
    }
  }
  
  return (
    <div className="relative inline-block">
      <Avatar {...avatarProps} />
      
      {editable && (
        <>
          {/* Camera button positioned just outside the avatar for better presentation */}
          <button
            onClick={handleClick}
            className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white text-primary-600 border border-gray-300 p-0.5 sm:p-1 shadow-none hover:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-0 dark:bg-gray-900 dark:border-gray-700 dark:text-primary-400"
            aria-label="Change avatar"
          >
            <svg
              className="h-[12px] w-[12px] sm:h-[14px] sm:w-[14px]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload avatar"
          />
        </>
      )}
    </div>
  )
}

export { Avatar, AvatarGroup, ProfileAvatar, avatarVariants, AvatarImage, AvatarFallback }
