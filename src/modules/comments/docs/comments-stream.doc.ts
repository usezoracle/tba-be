export const COMMENTS_STREAM_DOC = `
Integrate real-time comments using a React hook with native EventSource.

Endpoint
- GET /api/v1/comments/stream/{tokenAddress}
- Query: initial? (1..100, optional)
- Content-Type: text/event-stream
- Events emitted:
  - connection: { type, message, tokenAddress }
  - initialComments: { type, comments: Comment[], total }
  - newComment: { type, comment: Comment }

Hook (React/Vite)
\`\`\`ts
import { useEffect, useRef, useState } from 'react';

type CommentUser = { id: string; walletAddress: string };
type Comment = {
  id: string;
  content: string;
  tokenAddress: string;
  userId: string;
  user?: CommentUser;
  createdAt: string;
};

type Options = {
  initial?: number;   // snapshot size 1..100
  maxItems?: number;  // optional cap, e.g. 200
  baseUrl?: string;   // override API base
};

export function useCommentsStream(tokenAddress: string, options?: Options) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    setError(null);
    setConnected(false);

    const base =
      options?.baseUrl ??
      (import.meta as any).env?.VITE_API_BASE_URL ??
      'http://localhost:3000';

    const params = new URLSearchParams();
    if (options?.initial) {
      const initial = Math.min(Math.max(options.initial, 1), 100);
      params.set('initial', String(initial));
    }

    const url = \`\${base}/api/v1/comments/stream/\${tokenAddress}?\${params.toString()}\`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    // Deduper to avoid duplicates
    const seenIds = new Set<string>();

    const applyInitial = (items: Comment[]) => {
      const list = options?.maxItems ? items.slice(0, options.maxItems) : items;
      setComments(list);
      seenIds.clear();
      for (const c of list) seenIds.add(c.id);
    };

    const onConnection = () => setConnected(true);

    const onInitial = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const items: Comment[] = Array.isArray(data.comments) ? data.comments : [];
        applyInitial(items);
      } catch {}
    };

    const onNew = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const c: Comment | undefined = data.comment;
        if (!c || seenIds.has(c.id)) return;
        seenIds.add(c.id);
        setComments(prev => {
          const next = [c, ...prev];
          return options?.maxItems ? next.slice(0, options.maxItems) : next;
        });
      } catch {}
    };

    es.addEventListener('connection', onConnection);
    es.addEventListener('initialComments', onInitial);
    es.addEventListener('newComment', onNew);
    es.onerror = () => {
      setConnected(false);
      setError('stream_error'); // EventSource will auto-retry
    };

    return () => {
      es.removeEventListener('connection', onConnection);
      es.removeEventListener('initialComments', onInitial);
      es.removeEventListener('newComment', onNew);
      es.close();
      eventSourceRef.current = null;
    };
  }, [tokenAddress, options?.initial, options?.maxItems, options?.baseUrl]);

  return { comments, connected, error };
}

// Usage
// const { comments, connected, error } = useCommentsStream(tokenAddress, { initial: 30, maxItems: 200 });
// Map comments to UI; the newest comment appears instantly at the top.
\`\`\`

Notes
- Ensure CORS allows your frontend origin.
- Server sends an initial snapshot, then pushes each new comment as it arrives.
`;


