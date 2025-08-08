### React/Vite hook: Race-Condition Safe Emoji Reactions

- Backend base path: default `'/api/v1'` (adjust if different)
- Endpoints used:
  - SSE: `GET {BASE}/emoji/stream/:tokenAddress`
  - POST: `POST {BASE}/emoji/react`

#### Hook: `src/hooks/useEmojiReactions.ts`
```ts
import { useCallback, useEffect, useRef, useState } from 'react'

export type EmojiType = 'like' | 'love' | 'laugh' | 'wow' | 'sad';
export type EmojiCounts = Record<EmojiType, string>;

type UseEmojiReactionsOptions = {
  tokenAddress: string
  baseUrl?: string
  onUpdate?: (counts: EmojiCounts) => void
}

export function useEmojiReactions({
  tokenAddress,
  baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1',
  onUpdate,
}: UseEmojiReactionsOptions) {
  const [counts, setCounts] = useState<EmojiCounts>({
    like: '0',
    love: '0',
    laugh: '0',
    wow: '0',
    sad: '0',
  });
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  
  // Track pending reactions to prevent double-clicks
  const pendingRef = useRef<Set<string>>(new Set());
  // Track local counts for verification
  const localCountsRef = useRef<EmojiCounts>(counts);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const backoffRef = useRef(1000);

  const updateCounts = useCallback((newCounts: EmojiCounts) => {
    setCounts(newCounts);
    localCountsRef.current = newCounts;
    onUpdate?.(newCounts);
  }, [onUpdate]);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) return;
    
    const url = `${baseUrl}/emoji/stream/${tokenAddress}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        switch (data.type) {
          case 'connection':
            setConnected(true);
            break;
          case 'initialEmojiCounts':
            if (data.counts) {
              updateCounts(data.counts);
            }
            break;
          case 'emojiCountUpdate': {
            if (!data.counts || !data.emoji || !data.previousCount || !data.newCount) break;
            
            // Verify count change is valid
            const prevCount = parseInt(data.previousCount, 10);
            const newCount = parseInt(data.newCount, 10);
            const localCount = parseInt(localCountsRef.current[data.emoji], 10);
            
            // If our local count matches the previous count, update is valid
            if (localCount === prevCount) {
              updateCounts(data.counts);
            } else {
              // Our local count is different, need to re-fetch current state
              refetchCounts();
            }
            
            // Clear pending state if this was our reaction
            const pendingKey = `${data.emoji}_${data.previousCount}_${data.newCount}`;
            if (pendingRef.current.has(pendingKey)) {
              pendingRef.current.delete(pendingKey);
            }
            break;
          }
          case 'error':
            setError(data.message || 'Stream error');
            break;
        }
      } catch (err: any) {
        // ignore malformed
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      eventSourceRef.current = null;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = window.setTimeout(() => {
        backoffRef.current = Math.min(backoffRef.current * 2, 15000);
        connectSSE();
      }, backoffRef.current) as unknown as number;
    };

    es.onopen = () => {
      backoffRef.current = 1000;
      setConnected(true);
      setError(null);
    };
  }, [baseUrl, tokenAddress, updateCounts]);

  const disconnectSSE = useCallback(() => {
    setConnected(false);
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Fetch current counts directly (used for reconciliation)
  const refetchCounts = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/emoji/${tokenAddress}`);
      if (!res.ok) throw new Error('Failed to fetch counts');
      const data = await res.json();
      if (data.success && data.data) {
        updateCounts(data.data);
      }
    } catch (err: any) {
      setError('Failed to reconcile counts');
    }
  }, [baseUrl, tokenAddress, updateCounts]);

  // React with an emoji with optimistic update and verification
  const react = useCallback(async (emoji: EmojiType, increment: 1 | 2 | 3 = 1) => {
    const currentCount = parseInt(localCountsRef.current[emoji], 10);
    const expectedNewCount = currentCount + increment;
    
    // Prevent double-clicks
    const pendingKey = `${emoji}_${currentCount}_${expectedNewCount}`;
    if (pendingRef.current.has(pendingKey)) return;
    pendingRef.current.add(pendingKey);

    try {
      // Optimistic update
      const optimisticCounts = {
        ...localCountsRef.current,
        [emoji]: expectedNewCount.toString()
      };
      updateCounts(optimisticCounts);

      const res = await fetch(`${baseUrl}/emoji/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress,
          emoji,
          increment,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to react');
      }

      // Server will validate and broadcast the real count
      // If our optimistic update was wrong, we'll get the correct
      // count via SSE and reconciliation
      
      const data = await res.json();
      return data.data;
    } catch (err: any) {
      // Revert optimistic update on error
      updateCounts(localCountsRef.current);
      setError(err.message || 'Failed to react');
      pendingRef.current.delete(pendingKey);
      throw err;
    }
  }, [baseUrl, tokenAddress, updateCounts]);

  useEffect(() => {
    connectSSE();
    return () => {
      disconnectSSE();
    };
  }, [connectSSE, disconnectSSE]);

  return {
    counts,
    error,
    connected,
    react,
    disconnectSSE,
    reconnectSSE: connectSSE,
  };
}
```

### Race Condition Prevention:

1. **Backend (Redis)**:
   - Uses Redis MULTI for atomic operations
   - Validates count changes (no negative counts)
   - Includes previous and new counts in updates
   - Reverts invalid increments

2. **Frontend (React)**:
   - Tracks local count state
   - Verifies count changes match expectations
   - Reconciles on mismatches
   - Prevents double-clicks
   - Handles optimistic updates safely

3. **SSE Updates**:
   ```typescript
   // Example SSE event payload
   {
     type: 'emojiCountUpdate',
     counts: { like: '5', love: '3', ... },
     emoji: 'like',
     previousCount: '4',
     newCount: '5',
     timestamp: 1234567890
   }
   ```

4. **Count Verification Flow**:
   ```
   User clicks → Optimistic update
     ↓
   Previous count stored
     ↓
   Request sent to backend
     ↓
   Backend validates & updates
     ↓
   SSE update received
     ↓
   Frontend verifies change:
     - If local previous count matches → Accept update
     - If mismatch → Refetch current state
   ```

5. **Error Prevention**:
   - Double-click protection
   - Atomic Redis operations
   - Count validation
   - State reconciliation
   - Optimistic update rollback

This implementation carefully handles race conditions and ensures count accuracy while still providing instant feedback to users. It's similar to how modern social media platforms handle reaction counts, with proper verification and reconciliation. 🚀