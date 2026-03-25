import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSearchContext {
  cancer_type?: string;
  postcode?: string;
  results?: Record<string, unknown>[];
}

interface UseChatReturn {
  messages: ChatMessage[];
  streaming: boolean;
  error: string | null;
  send: (text: string) => void;
  clearError: () => void;
}

export function useChat(context?: ChatSearchContext): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      const userMsg: ChatMessage = { role: 'user', content: text.trim() };
      const allMessages = [...messages, userMsg];
      setMessages(allMessages);
      setError(null);
      setStreaming(true);

      // Add placeholder assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
            context: context || undefined,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                setError(parsed.error);
                break;
              }
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                const text = accumulated;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: text };
                  return updated;
                });
              }
            } catch {
              // skip malformed JSON lines
            }
          }
        }

        // If assistant message is still empty, show error
        if (!accumulated) {
          setMessages((prev) => prev.slice(0, -1));
          setError('No response received, try again');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const message =
          err instanceof Error ? err.message : 'Connection error';
        // Preserve partial response if we have one
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
        setError(message);
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming, context],
  );

  return { messages, streaming, error, send, clearError };
}
