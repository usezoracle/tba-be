export const EMOJI_STREAM_DOC = `
example:How to use the emoji stream on frontend

Events
- connection → EmojiConnectionEventDto
- initialEmojiCounts → EmojiInitialCountsEventDto
- emojiCountUpdate → EmojiCountUpdateEventDto

Hook (React/Vite)
\`\`\`ts
import { useEffect, useRef, useState } from 'react';

type EmojiCounts = { like: number; love: number; laugh: number; wow: number; sad: number };

export function useEmojiStream(tokenAddress: string) {
  const [counts, setCounts] = useState<EmojiCounts>({ like: 0, love: 0, laugh: 0, wow: 0, sad: 0 });
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;
    const base = (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:3000';
    const url = \`\${base}/api/v1/emoji/stream/\${tokenAddress}\`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    const parseCounts = (c: any): EmojiCounts => ({
      like: Number(c?.like ?? 0),
      love: Number(c?.love ?? 0),
      laugh: Number(c?.laugh ?? 0),
      wow: Number(c?.wow ?? 0),
      sad: Number(c?.sad ?? 0),
    });

    const onConnection = () => setConnected(true);
    const onInitial = (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setCounts(parseCounts(data.counts));
    };
    const onUpdate = (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data?.counts) setCounts(parseCounts(data.counts));
    };

    es.addEventListener('connection', onConnection);
    es.addEventListener('initialEmojiCounts', onInitial);
    es.addEventListener('emojiCountUpdate', onUpdate);
    es.onerror = () => {};

    return () => {
      es.removeEventListener('connection', onConnection);
      es.removeEventListener('initialEmojiCounts', onInitial);
      es.removeEventListener('emojiCountUpdate', onUpdate);
      es.close();
      eventSourceRef.current = null;
    };
  }, [tokenAddress]);

  return { counts, connected };
}
\`\`\`

Notes
- Ensure CORS allows your frontend origin.
- Server sends an initial snapshot, then live updates per reaction.
`;

