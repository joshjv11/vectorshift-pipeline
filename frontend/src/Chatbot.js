import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { toast } from 'sonner';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Branding: "App Guide" matches the header label and bubble title attribute.
const INITIAL_MESSAGE = {
  role:    'assistant',
  content: 'Hi! I\'m your App Guide for the VectorShift Pipeline Builder.\n\n✨ I can build pipelines for you — just say:\n• "Build an MCP database bot"\n• "Create a RAG pipeline"\n• "Make a data extraction pipeline"\n\nI\'ll generate the full node graph and you can apply it to the canvas with one click.\n\nOr ask about any feature: "How do I connect nodes?", "What is the MCP Server node?"',
};

function TypingIndicator() {
  return (
    <div className="mb-3 flex justify-start">
      <div className="flex items-center gap-1 rounded-md rounded-bl-none bg-canvas px-4 py-3 border border-hairline">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="block h-1.5 w-1.5 rounded-full bg-muted animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// PipelineBlock renders the "Apply to Canvas" button when the AI returns a
// valid pipeline JSON. Uses useStore.getState() (vanilla Zustand, not a hook)
// to avoid hook-ordering issues with the conditional parse path above.
function PipelineBlock({ jsonString }) {
  let data = null;
  try { data = JSON.parse(jsonString); } catch (_) {}

  if (!data?.nodes || !data?.edges) {
    return (
      <pre className="mt-2 overflow-x-auto rounded border border-hairline bg-canvas p-2 text-[10px] font-mono text-muted">
        {jsonString}
      </pre>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-hairline bg-canvas p-3">
      <p className="mb-2 eyebrow">
        {data.nodes.length} nodes · {data.edges.length} edges
      </p>
      <button
        onClick={() => {
          useStore.getState().loadPipeline(data.nodes, data.edges);
          toast.success('Pipeline deployed to canvas!');
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[11px] font-bold text-surface transition hover:opacity-90"
      >
        <span className="material-symbols-outlined leading-none" style={{ fontSize: 13 }}>bolt</span>
        Apply to Canvas
      </button>
    </div>
  );
}

function renderContent(text) {
  const parts = [];
  const regex = /```json\s*([\s\S]*?)\s*```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'json', content: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.map((part, i) =>
    part.type === 'json'
      ? <PipelineBlock key={i} jsonString={part.content} />
      : <span key={i} className="whitespace-pre-wrap">{part.content}</span>
  );
}

function Message({ msg }) {
  if (!msg.content) return null;
  const isUser = msg.role === 'user';

  return (
    <div className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-surface">
          VS
        </div>
      )}
      <div
        className={[
          'max-w-[80%] rounded-md px-3 py-2 text-xs leading-relaxed',
          isUser
            ? 'rounded-br-none bg-accent text-surface whitespace-pre-wrap'
            : 'rounded-bl-none bg-canvas text-ink border border-hairline',
        ].join(' ')}
      >
        {isUser ? msg.content : renderContent(msg.content)}
      </div>
    </div>
  );
}

export function Chatbot() {
  const { nodes, edges } = useStore(
    (s) => ({ nodes: s.nodes, edges: s.edges }),
    shallow
  );

  const [isOpen,      setIsOpen]      = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages,    setMessages]    = useState([INITIAL_MESSAGE]);
  const [input,       setInput]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [hasUnread,   setHasUnread]   = useState(false);

  const messagesEndRef   = useRef(null);
  const inputRef         = useRef(null);
  const isOpenRef        = useRef(isOpen);
  const abortControllerRef = useRef(null);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, isMinimized]);

  // Single submit path: the <form> onSubmit handles both Enter key and
  // button click. No separate onKeyDown needed for a text <input>.
  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage     = { role: 'user', content: text };
    const historyWithUser = [...messages, userMessage];

    setMessages([...historyWithUser, { role: 'assistant', content: '' }]);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const pipelineContext = {
        node_count: nodes.length,
        edge_count: edges.length,
        node_types: [...new Set(nodes.map((n) => n.type).filter(Boolean))],
      };

      const res = await fetch(`${API_BASE}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: historyWithUser, pipeline: pipelineContext }),
        signal:  controller.signal,
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      if (!res.body) throw new Error('Response body is empty');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';

      const patchLastMessage = (content) =>
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content };
          return updated;
        });

      while (true) {
        const { value, done } = await reader.read(); // eslint-disable-line no-await-in-loop
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        patchLastMessage(accumulated);
      }

      if (!isOpenRef.current) setHasUnread(true);
    } catch (err) {
      // AbortError is thrown when the user clears the chat mid-stream.
      // Silently discard it — the UI is already in the right state.
      if (err?.name === 'AbortError') return;

      const msg = err?.message ?? 'Unknown error';
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role:    'assistant',
          content: msg.includes('body') || msg.includes('fetch')
            ? 'Sorry, I couldn\'t reach the server. Make sure the backend is running.'
            : `Sorry, something went wrong: ${msg}`,
        };
        return updated;
      });
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    // Cancel any in-flight stream so its chunks can't overwrite the reset.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

      {/* ── Chat window ─────────────────────────────────── */}
      {isOpen && (
        <div
          className="mb-4 flex flex-col overflow-hidden rounded-md border border-hairline bg-surface shadow-xl transition-all duration-200"
          style={{ width: 340, height: isMinimized ? 'auto' : 480 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-hairline bg-canvas px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-surface">
                ✨
              </div>
              <div>
                <p className="text-[12px] font-semibold text-ink leading-none">App Guide</p>
                <p className="mt-0.5 eyebrow">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  className="px-2 py-1 text-[11px] text-muted transition-colors hover:text-ink rounded"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsMinimized((v) => !v)}
                title={isMinimized ? 'Restore' : 'Minimise'}
                className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:text-ink hover:bg-white/5"
              >
                {isMinimized ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                title="Close"
                className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:text-ink hover:bg-white/5 text-sm leading-none"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Message list */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto bg-surface px-4 py-4">
                {messages.map((msg, idx) => (
                  <Message key={`${msg.role}-${idx}`} msg={msg} />
                ))}
                {isLoading && messages[messages.length - 1]?.content === '' && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <form
                onSubmit={sendMessage}
                className="flex items-center gap-2 border-t border-hairline bg-surface px-3 py-2.5"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask or say 'Build a RAG pipeline'…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 rounded-sm border border-hairline bg-canvas/60 px-3 py-1.5 text-xs text-ink placeholder:text-muted outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  title="Send"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-surface transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 rotate-90" aria-hidden="true">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* ── Floating bubble ──────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          title="Open App Guide"
          className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-accent text-xl text-surface shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 focus:ring-offset-canvas"
        >
          💬
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cycle text-[9px] font-bold text-surface">
              1
            </span>
          )}
        </button>
      )}
    </div>
  );
}
