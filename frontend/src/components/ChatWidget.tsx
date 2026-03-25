import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import type { ChatSearchContext } from '../hooks/useChat';

interface ChatWidgetProps {
  context?: ChatSearchContext;
}

export function ChatWidget({ context }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const { messages, streaming, error, send, clearError } = useChat(context);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setHasBeenOpened(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    send(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat panel */}
      <div
        className={`absolute bottom-20 right-4 z-[1000] w-[360px] bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col chat-panel ${open ? 'chat-panel-open' : 'chat-panel-closed'}`}
        style={{ height: open ? 460 : 0, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4a8c7f]" />
            <span className="text-sm font-semibold text-gray-800">Inform Assistant</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close chat"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-xs mt-8 px-4">
              Ask about NHS cancer wait times, what the numbers mean, or which hospital might be best for you.
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#4a8c7f] text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {msg.content || (
                  <span className="typing-dots">
                    <span /><span /><span />
                  </span>
                )}
              </div>
            </div>
          ))}
          {error && (
            <div className="flex justify-start">
              <div className="max-w-[85%] px-3 py-2 rounded-lg text-[13px] bg-red-50 text-red-600 border border-red-100">
                {error}
                <button
                  onClick={clearError}
                  className="ml-2 underline text-red-500 hover:text-red-700"
                >
                  dismiss
                </button>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about wait times..."
              className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#4a8c7f] focus:ring-1 focus:ring-[#4a8c7f]/20 transition-colors"
              disabled={streaming}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[#4a8c7f] text-white hover:bg-[#3d7568] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h10M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`absolute bottom-4 right-4 z-[1000] w-12 h-12 rounded-full bg-[#4a8c7f] text-white shadow-lg hover:bg-[#3d7568] transition-all flex items-center justify-center ${!hasBeenOpened ? 'chat-bubble-pulse' : ''}`}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 6h12M4 10h8M4 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </>
  );
}
