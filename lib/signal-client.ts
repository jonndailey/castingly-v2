export class SignalError extends Error {
  status: number
  response: unknown

  constructor(message: string, status: number, response: unknown) {
    super(message)
    this.name = 'SignalError'
    this.status = status
    this.response = response
  }
}

export interface SignalClientOptions {
  baseUrl?: string
  timeout?: number
  userAgent?: string
}

type RequestOptions = Omit<RequestInit, 'headers' | 'signal'> & {
  headers?: Record<string, string>
}

export default class SignalClient {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly userAgent: string

  constructor(apiKey: string, options: SignalClientOptions = {}) {
    if (!apiKey || !apiKey.startsWith('sk_')) {
      throw new Error('Invalid Signal API key. Expected value starting with sk_')
    }

    this.apiKey = apiKey
    const baseUrl = options.baseUrl || 'https://signal.yourdomain.com'
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.timeout = options.timeout ?? 30000
    this.userAgent = options.userAgent ?? 'signal-js-sdk/1.0.0'
  }

  private async request(endpoint: string, options: RequestOptions = {}) {
    const url = `${this.baseUrl}/api/signal${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'User-Agent': this.userAgent,
          ...options.headers,
        },
      })

      let data: unknown = null
      try {
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          data = await response.json()
        } else {
          const text = await response.text()
          data = text ? { raw: text } : null
        }
      } catch (parseError) {
        data = { parseError }
      }

      if (!response.ok) {
        const errorData = (data ?? {}) as { message?: string; error?: string }
        throw new SignalError(
          errorData.message || errorData.error || `Signal API request failed (${response.status})`,
          response.status,
          data
        )
      }

      return data
    } catch (error) {
      if (error instanceof SignalError) {
        throw error
      }

      const errorObj = error as { name?: string; message?: string }
      const message = errorObj?.name === 'AbortError'
        ? `Signal API request timed out after ${this.timeout}ms`
        : `Signal API network error: ${errorObj?.message || 'Unknown error'}`

      throw new SignalError(message, 0, { originalError: error })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private validateMessageData(messageData: Record<string, unknown>) {
    if (!messageData || typeof messageData !== 'object') {
      throw new Error('Message payload must be an object')
    }

    if (!('to' in messageData)) {
      throw new Error('Message payload requires a "to" field')
    }

    if (typeof messageData.channel !== 'string' || messageData.channel.trim().length === 0) {
      throw new Error('Message payload requires a "channel" field')
    }

    if (typeof messageData.content !== 'string' || messageData.content.trim().length === 0) {
      throw new Error('Message payload requires "content" field')
    }
  }

  async sendMessage(messageData: Record<string, unknown>) {
    this.validateMessageData(messageData)

    return this.request('/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
    })
  }

  async sendBulk(messages: Record<string, unknown>[], batchName: string | null = null) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array')
    }

    if (messages.length > 1000) {
      throw new Error('Maximum 1000 messages per batch')
    }

    messages.forEach((message, index) => {
      try {
        this.validateMessageData(message)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown validation error'
        throw new Error(`Message at index ${index}: ${errorMessage}`)
      }
    })

    return this.request('/send/bulk', {
      method: 'POST',
      body: JSON.stringify({
        messages,
        batch_name: batchName,
      }),
    })
  }

  async getMessages(filters: Record<string, unknown> = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const queryString = params.toString()
    const endpoint = queryString ? `/messages?${queryString}` : '/messages'
    return this.request(endpoint)
  }

  async getMessage(messageId: string | number) {
    return this.request(`/messages/${messageId}`)
  }

  async getStats(period: string = '30d') {
    return this.request(`/stats?period=${period}`)
  }
}
