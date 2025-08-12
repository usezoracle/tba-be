### React/Vite hook: Zero-latency real-time comments with SSE

- Backend base path: default `'/api/v1'` (adjust if different)
- Endpoints used:
  - SSE: `GET {BASE}/comments/stream/:tokenAddress` (real-time stream)
  - POST: `POST {BASE}/comments` (non-blocking comment creation)

#### Vite setup (choose one)
- Proxy (dev): in `vite.config.ts`
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Nest port
        changeOrigin: true,
      },
    },
  },
})
```
- Or env base URL: `.env`
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

#### Hook: `src/hooks/useComments.ts`
```ts
import { useCallback, useEffect, useRef, useState } from 'react'

export type CommentData = {
  id: string
  content: string
  tokenAddress: string
  userId: string
  user: {
    id: string
    walletAddress: string
  }
  createdAt: string
}

type UseCommentsOptions = {
  tokenAddress: string // required
  baseUrl?: string // e.g., '/api/v1' when using proxy, or 'https://api.example.com/api/v1'
  onNewComment?: (comment: CommentData) => void // optional callback for new comments
}

export function useComments({
  tokenAddress,
  baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1',
  onNewComment,
}: UseCommentsOptions) {
  const [comments, setComments] = useState<CommentData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [optimisticComments, setOptimisticComments] = useState<CommentData[]>([])

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const backoffRef = useRef(1000) // ms, exponential backoff
  const commentSetRef = useRef<Set<string>>(new Set()) // track by id
  const pendingCommentsRef = useRef<Set<string>>(new Set()) // track optimistic comments

  // Sorting utilities to guarantee newest-first
  const toMs = (d: string) => new Date(d).getTime()
  const compareCreatedDesc = (a: CommentData, b: CommentData) => toMs(b.createdAt) - toMs(a.createdAt)

  const mergeNewestFirst = useCallback((incoming: CommentData[]) => {
    if (!incoming?.length) return
    setComments(prev => {
      // Remove any optimistic comments that were confirmed
      setOptimisticComments(opt => 
        opt.filter(c => !incoming.some(ic => 
          ic.content === c.content && 
          ic.user.walletAddress === c.user.walletAddress
        ))
      )

      // Deduplicate by id, prefer the first occurrence
      const map = new Map<string, CommentData>()
      for (const c of prev) map.set(c.id, c)
      for (const c of incoming) {
        if (!map.has(c.id)) {
          map.set(c.id, c)
          // Notify on new comments that weren't optimistic
          if (!pendingCommentsRef.current.has(c.id)) {
            onNewComment?.(c)
          }
        }
        // Clear from pending set if it was there
        pendingCommentsRef.current.delete(c.id)
      }
      const next = Array.from(map.values())
      next.sort(compareCreatedDesc)
      commentSetRef.current = new Set(next.map(c => c.id))
      return next
    })
  }, [onNewComment])

  const prependComment = useCallback((comment: CommentData) => {
    if (commentSetRef.current.has(comment.id)) return
    commentSetRef.current.add(comment.id)
    
    setComments(prev => {
      // Remove matching optimistic comment if any
      setOptimisticComments(opt => 
        opt.filter(c => 
          !(c.content === comment.content && 
            c.user.walletAddress === comment.user.walletAddress)
        )
      )
      
      const next = [comment, ...prev]
      // Keep only latest 30 in memory
      if (next.length > 30) next.length = 30
      
      // Notify if it wasn't pending
      if (!pendingCommentsRef.current.has(comment.id)) {
        onNewComment?.(comment)
      }
      pendingCommentsRef.current.delete(comment.id)
      
      return next
    })
  }, [onNewComment])

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) return
    
    const url = `${baseUrl}/comments/stream/${tokenAddress}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        switch (data.type) {
          case 'connection':
            setConnected(true)
            break
          case 'initialComments':
            if (Array.isArray(data.comments)) {
              mergeNewestFirst(data.comments)
            }
            break
          case 'newComment':
            if (data.comment) {
              prependComment(data.comment)
            }
            break
          case 'error':
            setError(data.message || 'Stream error')
            break
        }
      } catch (err: any) {
        // ignore malformed
      }
    }

    es.onerror = () => {
      setConnected(false)
      es.close()
      eventSourceRef.current = null
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
  }, [baseUrl, tokenAddress, mergeNewestFirst, prependComment])

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

  // Post a new comment with optimistic update
  const postComment = useCallback(async (content: string, walletAddress: string) => {
    // Create optimistic comment
    const optimisticComment: CommentData = {
      id: `optimistic_${Date.now()}`,
      content,
      tokenAddress,
      userId: 'pending',
      user: {
        id: 'pending',
        walletAddress,
      },
      createdAt: new Date().toISOString(),
    }

    // Add to optimistic state
    setOptimisticComments(prev => [optimisticComment, ...prev])

    try {
      const res = await fetch(`${baseUrl}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress,
          walletAddress,
          content,
        }),
      })
      if (!res.ok) throw new Error('Failed to post comment')
      const data = await res.json()
      
      // Track the pending comment
      pendingCommentsRef.current.add(data.data.id)
      
      return data.data // { id, content, status: 'processing', ... }
    } catch (err: any) {
      // Remove optimistic comment on error
      setOptimisticComments(prev => 
        prev.filter(c => c.id !== optimisticComment.id)
      )
      setError(err.message || 'Failed to post comment')
      throw err
    }
  }, [baseUrl, tokenAddress])

  useEffect(() => {
    connectSSE()
    return () => {
      disconnectSSE()
    }
  }, [connectSSE, disconnectSSE])

  // Combine real and optimistic comments
  const allComments = [...optimisticComments, ...comments].slice(0, 30)

  return {
    comments: allComments, // includes optimistic updates
    error,
    connected,
    postComment,
    disconnectSSE,
    reconnectSSE: connectSSE,
  }
}
```

#### Usage in a component with real-time feedback
```tsx
import { useState, useCallback } from 'react'
import { useComments } from '../hooks/useComments'

export default function TokenComments({ 
  tokenAddress, 
  userWallet,
  onNewComment, // optional notification callback
}: { 
  tokenAddress: string
  userWallet: string
  onNewComment?: (comment: CommentData) => void
}) {
  const {
    comments,
    error,
    connected,
    postComment,
  } = useComments({ 
    tokenAddress,
    onNewComment, // pass through
  })

  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || posting) return

    setPosting(true)
    try {
      await postComment(content.trim(), userWallet)
      setContent('') // clear on success
    } catch (err) {
      // error already set in hook
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="comments-container">
      {!connected && (
        <div className="connection-status">
          <span className="dot disconnected"></span> Connecting...
        </div>
      )}
      {connected && (
        <div className="connection-status">
          <span className="dot connected"></span> Live
        </div>
      )}
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write a comment..."
          disabled={posting || !connected}
          maxLength={500}
        />
        <div className="form-footer">
          <span className="char-count">
            {content.length}/500
          </span>
          <button 
            type="submit" 
            disabled={posting || !connected || !content.trim()}
          >
            {posting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      <ul className="comments-list">
        {comments.map(comment => (
          <li 
            key={comment.id} 
            className={`comment ${comment.id.startsWith('optimistic_') ? 'optimistic' : ''}`}
          >
            <div className="comment-header">
              <span className="wallet">
                {comment.user.walletAddress.slice(0, 6)}...
                {comment.user.walletAddress.slice(-4)}
              </span>
              <span className="time">
                {new Date(comment.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="content">{comment.content}</div>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="no-comments">
            No comments yet. Be the first to comment!
          </li>
        )}
      </ul>
    </div>
  )
}
```

#### Enhanced CSS with animations
```css
.comments-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #666;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.connected {
  background: #22c55e;
  box-shadow: 0 0 0 rgba(34, 197, 94, 0.4);
  animation: pulse 2s infinite;
}

.dot.disconnected {
  background: #ef4444;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

.comment-form {
  margin-bottom: 2rem;
}

textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  resize: vertical;
  font-size: 0.875rem;
  transition: border-color 0.15s ease;
}

textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 0.75rem;
  color: #6b7280;
}

button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

button:hover:not(:disabled) {
  background: #2563eb;
}

button:disabled {
  background: #e5e7eb;
  cursor: not-allowed;
}

.comments-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.comment {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  animation: fadeIn 0.3s ease;
}

.comment.optimistic {
  opacity: 0.7;
  background: #f9fafb;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
}

.wallet {
  font-family: ui-monospace, monospace;
  color: #4b5563;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.time {
  color: #9ca3af;
}

.content {
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: #1f2937;
}

.error {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #b91c1c;
  font-size: 0.875rem;
}

.no-comments {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 0.875rem;
}
```

### Real-time Enhancements:

1. **Optimistic Updates**
   - Comments appear instantly in the UI
   - Smooth transition when confirmed
   - Graceful error handling/rollback

2. **Visual Feedback**
   - Live connection indicator
   - Comment animations
   - Optimistic comment styling
   - Character counter
   - Wallet address formatting

3. **Performance**
   - No initial fetch, pure SSE
   - Deduplication by content/wallet for optimistic updates
   - Memory-efficient (30 comments max)
   - Smart reconnection with backoff

4. **UX Improvements**
   - Connection status indicator
   - Proper error states
   - Loading states
   - Empty state
   - Responsive textarea
   - Character limit
   - Disabled states when offline

5. **Notifications**
   - Optional `onNewComment` callback
   - Distinguishes between optimistic and real updates
   - Connection state tracking

The implementation now provides instant feedback while maintaining data consistency and a great user experience. Comments appear immediately (optimistically) and smoothly transition to their confirmed state when the backend processes them. 🚀