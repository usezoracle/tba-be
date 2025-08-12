### React/Vite hook: Real-time New Tokens with SSE (snapshot + live)

- Backend base path: default `'/api/v1'` (adjust if different)
- Endpoints used:
  - SSE: `GET {BASE}/new-tokens/tokens/stream?initial=100`
  - Optional REST: `GET {BASE}/new-tokens/tokens?offset=<n>&limit=<m>`

#### Hook: `src/hooks/useNewTokens.ts`
```ts
import { useCallback, useEffect, useRef, useState } from 'react'

export type TokenData = {
  name: string
  symbol: string
  address: string
  network: string
  protocol: string
  networkId: number
  createdAt: string
  priceUSD?: number
  marketCap?: number
  volume24?: number
  holders?: number
  imageLargeUrl?: string
  graduationPercent?: number
  launchpadProtocol?: string
  timestamp: string
}

type UseNewTokensOptions = {
  initial?: number // initial snapshot size, default 100
  baseUrl?: string // '/api/v1' for proxy, or full API base
}

export function useNewTokens({
  initial = 100,
  baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1',
}: UseNewTokensOptions = {}) {
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const backoffRef = useRef(1000) // ms, exponential backoff
  const addressSetRef = useRef<Set<string>>(new Set())

  // Sorting utilities to guarantee newest-first regardless of arrival order
  const toMs = (d: string) => new Date(d).getTime()
  const compareCreatedDesc = (a: TokenData, b: TokenData) => toMs(b.createdAt) - toMs(a.createdAt)
  const insertSortedByCreatedDesc = (arr: TokenData[], t: TokenData) => {
    const tMs = toMs(t.createdAt)
    let lo = 0
    let hi = arr.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (toMs(arr[mid].createdAt) < tMs) hi = mid
      else lo = mid + 1
    }
    arr.splice(lo, 0, t)
  }

  const mergeNewestFirst = useCallback((incoming: TokenData[]) => {
    if (!incoming?.length) return
    setTokens(prev => {
      // Deduplicate by address, prefer the first occurrence
      const map = new Map<string, TokenData>()
      for (const t of prev) map.set(t.address, t)
      for (const t of incoming) if (!map.has(t.address)) map.set(t.address, t)
      const next = Array.from(map.values())
      next.sort(compareCreatedDesc)
      addressSetRef.current = new Set(next.map(t => t.address))
      return next
    })
  }, [])

  const prependLive = useCallback((t: TokenData) => {
    if (addressSetRef.current.has(t.address)) return
    addressSetRef.current.add(t.address)
    setTokens(prev => {
      const next = [...prev]
      insertSortedByCreatedDesc(next, t)
      // cap to 200 retained by backend to match server
      if (next.length > 200) next.length = 200
      return next
    })
  }, [])

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) return
    const url = `${baseUrl}/new-tokens/tokens/stream?initial=${Math.min(Math.max(initial, 1), 100)}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'connection') return
        if (data.type === 'snapshot' && Array.isArray(data.items)) {
          mergeNewestFirst(data.items as TokenData[])
          return
        }
        // Single live token object
        prependLive(data as TokenData)
      } catch (err: any) {
        // ignore malformed
      }
    }

    es.onerror = () => {
      es.close()
      eventSourceRef.current = null
      setConnected(false)
      // reconnect with backoff
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = window.setTimeout(() => {
        backoffRef.current = Math.min(backoffRef.current * 2, 15000)
        connectSSE()
      }, backoffRef.current) as unknown as number
    }

    es.onopen = () => {
      backoffRef.current = 1000
      setConnected(true)
      setError(null)
    }
  }, [baseUrl, initial, mergeNewestFirst, prependLive])

  const disconnectSSE = useCallback(() => {
    setConnected(false)
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  useEffect(() => {
    connectSSE()
    return () => {
      disconnectSSE()
    }
  }, [connectSSE, disconnectSSE])

  return {
    tokens,          // newest-first
    connected,
    error,
    disconnectSSE,
    reconnectSSE: connectSSE,
  }
}
```

#### Usage in a component
```tsx
import { useNewTokens } from '../hooks/useNewTokens'

export default function NewTokensPage() {
  const { tokens, connected, error } = useNewTokens({ initial: 100 })

  return (
    <div>
      {!connected && <div>Connecting…</div>}
      {error && <div>{error}</div>}
      <ul>
        {tokens.map(t => (
          <li key={t.address}>
            {t.name} ({t.symbol}) — {t.network}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Notes:
- Snapshot arrives instantly via SSE, then single-token live updates.
- Dedup by `address`; order is newest-first; capped at 200 to match backend retention.
- Robust reconnection with exponential backoff.
- Works with proxy (`/api/v1`) or absolute base URL via `VITE_API_BASE_URL`.
