export function isHttpUrl(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false
  return /^https?:\/\//i.test(value.trim())
}

export function isSafeRelativeImagePath(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false
  const v = value.trim()
  // Only allow known public-relative folders
  return (
    v.startsWith('/api/media/proxy?') || v.startsWith('api/media/proxy?') ||
    v.startsWith('/downloaded_images/') || v.startsWith('downloaded_images/') ||
    v.startsWith('/images/') || v.startsWith('images/') ||
    v.startsWith('/img/') || v.startsWith('img/') ||
    v.startsWith('/media/') || v.startsWith('media/')
  )
}

export function uiAvatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=9C27B0&color=fff`
}

/**
 * Returns a web-safe image URL (http(s) or approved site-relative path).
 * Falls back to a generated avatar when unsafe or empty.
 */
export function resolveWebAvatarUrl(
  value: string | null | undefined,
  nameForFallback?: string
): string | null {
  if (typeof value === 'string') {
    const v = value.trim()
    if (v) {
      if (isHttpUrl(v)) return v
      if (isSafeRelativeImagePath(v)) return v
    }
  }
  if (nameForFallback && typeof nameForFallback === 'string' && nameForFallback.trim()) {
    return uiAvatar(nameForFallback)
  }
  return null
}
