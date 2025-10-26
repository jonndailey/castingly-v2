export type AppEnv = 'development' | 'staging' | 'production'

export function getAppEnv(): AppEnv {
  const val = (process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || '').toLowerCase()
  if (val === 'production' || val === 'prod') return 'production'
  if (val === 'staging' || val === 'stage' || val === 'dev') return 'staging'
  // Default: treat as development
  if (process.env.NODE_ENV === 'production') {
    // If node is prod but no APP_ENV set, assume staging when running locally
    return 'staging'
  }
  return 'development'
}

export function isProduction(): boolean {
  return getAppEnv() === 'production'
}

export function isStaging(): boolean {
  return getAppEnv() === 'staging'
}

export function isDevelopment(): boolean {
  return getAppEnv() === 'development'
}

export function isNonProduction(): boolean {
  return !isProduction()
}

