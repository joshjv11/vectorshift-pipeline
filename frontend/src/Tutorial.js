import { useState, useEffect, useCallback, useRef } from 'react';

const STEPS = [
  {
    id: 'welcome',
    icon: '⚡',
    title: 'Welcome to VectorShift Pipeline Builder',
    subtitle: 'Build powerful AI workflows visually — no code required.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted leading-relaxed">
          VectorShift lets you drag, connect, and run AI nodes to create production-ready
          pipelines. From RAG systems to MCP database bots — build anything in minutes.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[
            { icon: '🧩', label: '10 node types' },
            { icon: '🔗', label: 'Type-safe wiring' },
            { icon: '🚀', label: 'Critical path profiler' },
            { icon: '✨', label: 'AI-powered guide' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-md border border-hairline bg-canvas/60 px-3 py-2">
              <span className="text-base">{icon}</span>
              <span className="text-xs text-ink">{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'nodes',
    icon: '🧩',
    title: 'Adding Nodes to the Canvas',
    subtitle: 'Three ways to create nodes.',
    content: (
      <div className="space-y-3">
        <div className="space-y-2">
          {[
            {
              step: '1',
              heading: 'Drag from the palette',
              desc: 'Find a node chip in the left sidebar and drag it anywhere onto the canvas.',
              color: 'bg-accent/20 border-accent/40',
            },
            {
              step: '2',
              heading: 'Right-click the canvas',
              desc: 'Right-click any empty area on the canvas to open a searchable node picker.',
              color: 'bg-valid/10 border-valid/30',
            },
            {
              step: '3',
              heading: 'Drag off a handle',
              desc: 'Pull a wire off any node\'s output handle and release on empty space — a node chooser appears and auto-connects.',
              color: 'bg-[#f59e0b]/10 border-[#f59e0b]/30',
            },
          ].map(({ step, heading, desc, color }) => (
            <div key={step} className={`flex gap-3 rounded-md border p-3 ${color}`}>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-ink">
                {step}
              </div>
              <div>
                <p className="text-[12px] font-semibold text-ink">{heading}</p>
                <p className="text-[11px] text-muted leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-hairline bg-canvas/40 px-3 py-2">
          <p className="eyebrow mb-1">Available node types</p>
          <p className="text-[11px] text-muted leading-relaxed">
            Input · Output · LLM · Groq LLM · Text · Doc Loader · Vector Store · Prompt · Parser · MCP Server
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'connect',
    icon: '🔗',
    title: 'Connecting Nodes',
    subtitle: 'Build data flows with type-safe edges.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted leading-relaxed">
          Click and drag from any node's <span className="text-ink font-medium">right-side output handle</span> to
          another node's <span className="text-ink font-medium">left-side input handle</span> to create a connection.
        </p>
        <div className="rounded-md border border-hairline bg-canvas/60 p-3 space-y-2">
          <p className="eyebrow">Type compatibility rules</p>
          {[
            { type: 'document', color: '#34d399', note: 'Doc Loader → Vector Store' },
            { type: 'string',   color: '#818cf8', note: 'Text, LLM, Prompt nodes' },
            { type: 'json',     color: '#f59e0b', note: 'Output Parser → downstream' },
            { type: 'any',      color: '#8b8fa8', note: 'Input / Output nodes — accept everything' },
          ].map(({ type, color, note }) => (
            <div key={type} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span className="text-[11px] font-medium text-ink capitalize">{type}</span>
              <span className="text-[11px] text-muted">— {note}</span>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-cycle/30 bg-cycle/10 px-3 py-2">
          <p className="text-[11px] text-cycle font-medium">
            ⚠️ The app prevents cycles, self-loops, duplicate edges, and incompatible type connections automatically.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'run',
    icon: '🚀',
    title: 'Running & Profiling Your Pipeline',
    subtitle: 'Validate DAG correctness and find bottlenecks.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted leading-relaxed">
          Click <span className="text-ink font-semibold">Run Pipeline</span> in the top-right to validate and profile your workflow.
        </p>
        <div className="space-y-2">
          <div className="flex gap-3 rounded-md border border-valid/30 bg-valid/10 p-3">
            <span className="text-base">🟢</span>
            <div>
              <p className="text-[12px] font-semibold text-valid">Act 1 — Execution Simulator</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Nodes light up tier-by-tier in green, showing which can run in parallel.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-md border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-3">
            <span className="text-base">🟡</span>
            <div>
              <p className="text-[12px] font-semibold text-[#f59e0b]">Act 2 — Critical Path Reveal</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                The slowest path through your pipeline glows amber/gold — your true bottleneck.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-md border border-hairline bg-canvas/40 px-3 py-2">
          <p className="text-[11px] text-muted leading-relaxed">
            <span className="text-ink">Tip:</span> Use <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px]">Cmd+Z</kbd> / <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px]">Ctrl+Z</kbd> to undo any canvas action. 50-step history.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'toolbar',
    icon: '🛠️',
    title: 'Workspace Tools & Saving',
    subtitle: 'Everything in the left sidebar.',
    content: (
      <div className="space-y-2">
        {[
          { icon: '💾', label: 'Save Workflow', desc: 'Name and save pipelines to local storage. Load them from the Workflows tab.' },
          { icon: '📁', label: 'Import / Export JSON', desc: 'Back up or share any pipeline as a .json file and re-import it later.' },
          { icon: '📐', label: 'Auto-layout', desc: 'Instantly rearrange all nodes into a clean left-to-right Dagre layout.' },
          { icon: '📚', label: 'Template Library', desc: 'Load pre-built pipelines: Creative Writer, RAG, Data Extractor, MCP Database Bot.' },
          { icon: '🗂️', label: 'Group / Ungroup', desc: 'Select 2+ nodes and click "Group selection" to create a sub-pipeline container.' },
          { icon: '🗑️', label: 'Clear Pipeline', desc: 'Wipe the canvas. Requires a confirmation click to prevent accidents.' },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="flex gap-3 items-start rounded-md border border-hairline bg-canvas/40 px-3 py-2">
            <span className="mt-0.5 text-sm shrink-0">{icon}</span>
            <div>
              <p className="text-[12px] font-semibold text-ink leading-none">{label}</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'chatbot',
    icon: '✨',
    title: 'App Guide — Your AI Assistant',
    subtitle: 'Powered by Gemini. Always available in the bottom-right.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted leading-relaxed">
          Click the <span className="text-ink font-semibold">💬 bubble</span> in the bottom-right corner to open the App Guide.
          It knows everything about this app — and can build entire pipelines for you.
        </p>
        <div className="rounded-md border border-accent/30 bg-accent/10 p-3 space-y-2">
          <p className="eyebrow">Try saying…</p>
          {[
            '"Build a RAG pipeline"',
            '"Create an MCP database bot"',
            '"How do I connect nodes?"',
            '"What does the critical path show?"',
          ].map((q) => (
            <div key={q} className="flex items-center gap-2">
              <span className="text-accent text-[11px]">→</span>
              <span className="text-[11px] text-ink italic">{q}</span>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-valid/30 bg-valid/10 px-3 py-2">
          <p className="text-[11px] text-valid font-medium">
            🟢 When the AI generates a pipeline, an <strong>Apply to Canvas</strong> button appears — one click draws the full graph instantly.
          </p>
        </div>
        <p className="text-center text-[11px] text-muted pt-1">
          You're all set! Start building your first pipeline. 🚀
        </p>
      </div>
    ),
  },
];

export function Tutorial({ onClose }) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('forward');
  const mountedRef = useRef(true);
  const timerRef   = useRef(null);

  // Track mount state so stale setTimeout callbacks don't update unmounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;

  const navigate = useCallback((nextStep, dir) => {
    if (animating || nextStep === step) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setDirection(dir);
    setAnimating(true);
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setStep(nextStep);
      setAnimating(false);
    }, 180);
  }, [animating, step]);

  const goNext = useCallback(() => {
    if (isLast) { onClose(); return; }
    navigate(step + 1, 'forward');
  }, [isLast, step, navigate, onClose]);

  const goPrev = useCallback(() => {
    if (isFirst) return;
    navigate(step - 1, 'back');
  }, [isFirst, step, navigate]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
      if (e.key === 'ArrowLeft')  goPrev();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative mx-4 flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/10 bg-surface shadow-2xl"
        style={{ maxHeight: '90vh' }}
        role="dialog"
        aria-modal="true"
        aria-label={current.title}
      >
        {/* Progress bar */}
        <div className="h-0.5 w-full bg-white/5">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-hairline bg-canvas/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xl border border-accent/20">
              {current.icon}
            </div>
            <div>
              <p className="eyebrow mb-1">Step {step + 1} of {STEPS.length}</p>
              <h2 className="text-[15px] font-semibold text-ink leading-tight">{current.title}</h2>
              <p className="mt-0.5 text-[11px] text-muted">{current.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Skip tutorial"
            className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-white/10 hover:text-ink text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto px-6 py-5"
          style={{
            opacity:    animating ? 0 : 1,
            transform:  animating
              ? direction === 'forward' ? 'translateX(16px)' : 'translateX(-16px)'
              : 'translateX(0)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >
          {current.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-hairline bg-canvas/40 px-6 py-4">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => navigate(i, i > step ? 'forward' : 'back')}
                className={[
                  'rounded-full transition-all duration-200',
                  i === step
                    ? 'h-2 w-5 bg-accent'
                    : i < step
                      ? 'h-2 w-2 bg-accent/40 hover:bg-accent/60'
                      : 'h-2 w-2 bg-white/15 hover:bg-white/25',
                ].join(' ')}
                aria-label={`Go to step ${i + 1}: ${STEPS[i].title}`}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={goPrev}
                className="flex items-center gap-1.5 rounded-md border border-white/15 px-4 py-1.5 text-[12px] font-medium text-muted transition hover:border-white/25 hover:text-ink"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
                Back
              </button>
            )}
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 rounded-md bg-accent px-5 py-1.5 text-[12px] font-bold text-surface transition hover:opacity-90"
            >
              {isLast ? (
                <>
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: 14 }}>rocket_launch</span>
                  Let's Build!
                </>
              ) : (
                <>
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
