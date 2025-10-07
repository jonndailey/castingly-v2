import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  helper?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, helper, ...props }, ref) => {
    const id = props.id || props.name
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              'w-full px-4 py-3 rounded-lg border transition-all duration-200',
              'text-base bg-white', // 16px to prevent iOS zoom
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              icon && 'pl-11',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-primary-500',
              className
            )}
            ref={ref}
            id={id}
            {...props}
          />
        </div>
        
        {(error || helper) && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-1 text-sm',
              error ? 'text-red-600' : 'text-gray-500'
            )}
          >
            {error || helper}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea component
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helper, ...props }, ref) => {
    const id = props.id || props.name
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <textarea
          className={cn(
            'w-full px-4 py-3 rounded-lg border transition-all duration-200',
            'text-base bg-white resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-gray-300 focus:border-primary-500',
            className
          )}
          ref={ref}
          id={id}
          {...props}
        />
        
        {(error || helper) && (
          <p
            className={cn(
              'mt-1 text-sm',
              error ? 'text-red-600' : 'text-gray-500'
            )}
          >
            {error || helper}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Search input with mobile optimization
interface SearchInputProps extends Omit<InputProps, 'type'> {
  onClear?: () => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, ...props }, ref) => {
    const [value, setValue] = React.useState(props.value || '')
    
    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        
        <input
          ref={ref}
          type="search"
          className={cn(
            'w-full pl-11 pr-10 py-3 rounded-lg border border-gray-300',
            'text-base bg-white',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
            className
          )}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            props.onChange?.(e)
          }}
          {...props}
        />
        
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('')
              onClear?.()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'

export { Input, Textarea, SearchInput }