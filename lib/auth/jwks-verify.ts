import crypto from 'crypto'

type Jwk = {
  kty: 'RSA'
  n: string
  e: string
  alg?: string
  kid?: string
  use?: string
}

type Jwks = { keys: Jwk[] }

const cache: { jwks?: Jwks; fetchedAt?: number } = {}
const DEFAULT_TTL_MS = 60_000

function b64urlToBuffer(input: string): Buffer {
  const pad = input.length % 4 === 2 ? '==' : input.length % 4 === 3 ? '=' : ''
  const str = input.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(str, 'base64')
}

function decodeSegment<T = any>(seg: string): T {
  const json = Buffer.from(seg.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
  return JSON.parse(json)
}

export async function fetchJwks(baseUrl: string, ttlMs: number = DEFAULT_TTL_MS): Promise<Jwks> {
  const now = Date.now()
  if (cache.jwks && cache.fetchedAt && now - cache.fetchedAt < ttlMs) {
    return cache.jwks
  }
  const url = `${baseUrl.replace(/\/$/, '')}/.well-known/jwks.json`
  const res = await fetch(url, { headers: { 'User-Agent': 'Castingly/JWKS' } })
  if (!res.ok) {
    throw new Error(`Failed to fetch JWKS (${res.status})`)
  }
  const jwks = (await res.json()) as Jwks
  cache.jwks = jwks
  cache.fetchedAt = now
  return jwks
}

export async function verifyJwtRS256(token: string, options: {
  jwksBaseUrl: string
  audience?: string
  issuer?: string
  clockToleranceSec?: number
}): Promise<null | { header: any; payload: any } > {
  try {
    const [encodedHeader, encodedPayload, encodedSig] = token.split('.')
    if (!encodedHeader || !encodedPayload || !encodedSig) return null
    const header = decodeSegment<any>(encodedHeader)
    if (header.alg !== 'RS256') return null
    const kid = header.kid
    const jwks = await fetchJwks(options.jwksBaseUrl)
    const jwk = jwks.keys.find(k => k.kid === kid) || jwks.keys[0]
    if (!jwk) return null

    // Import JWK as a public key
    const keyObject = crypto.createPublicKey({ key: jwk as any, format: 'jwk' })
    const verifier = crypto.createVerify('RSA-SHA256')
    verifier.update(`${encodedHeader}.${encodedPayload}`)
    verifier.end()
    const signature = b64urlToBuffer(encodedSig)
    const ok = verifier.verify(keyObject, signature)
    if (!ok) return null

    const payload = decodeSegment<any>(encodedPayload)

    // Basic claims checks
    const nowSec = Math.floor(Date.now() / 1000)
    const tol = options.clockToleranceSec ?? 60
    if (payload.exp && nowSec > payload.exp + tol) return null
    if (payload.nbf && nowSec + tol < payload.nbf) return null
    if (options.issuer && payload.iss && payload.iss !== options.issuer) return null
    if (options.audience && payload.aud && payload.aud !== options.audience) return null

    return { header, payload }
  } catch (err) {
    return null
  }
}

