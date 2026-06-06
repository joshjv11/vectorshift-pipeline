import { useState } from 'react';
import { Toaster } from 'sonner';
import { ReactFlowProvider } from 'reactflow';
import { useStore } from './store';
import { Chatbot } from './Chatbot';
import { CostAnalyzerHUD } from './CostAnalyzer';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';

const NAV_LINKS = [
  { label: 'Workflows',   active: true,  action: () => window.dispatchEvent(new CustomEvent('open-dashboard')) },
  { label: 'Knowledge',   active: false, action: null },
  { label: 'Automations', active: false, action: null },
  { label: 'Deploy',      active: false, action: null },
];

function App() {
  const [navOpen, setNavOpen] = useState(false);
  const hasNodes = useStore((s) => s.nodes.length > 0);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas text-ink">

      {/* ── Top Navigation Bar ──────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-canvas/80 backdrop-blur-md px-8 h-16 z-20">

        {/* Brand + Nav */}
        <div className="flex items-center gap-8">
          <span className="font-serif italic text-xl font-medium text-white select-none drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]">
            VectorShift
          </span>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6 h-full" aria-label="Primary navigation">
            {NAV_LINKS.map(({ label, active, action }) => (
              <button
                key={label}
                type="button"
                onClick={action ?? undefined}
                className={[
                  'text-sm transition-colors pb-0.5',
                  active
                    ? 'text-white border-b border-white font-medium'
                    : 'text-white/50 hover:text-white border-b border-transparent',
                  action ? 'cursor-pointer' : 'cursor-default',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!hasNodes}
            onClick={() => window.dispatchEvent(new CustomEvent('open-save-workflow'))}
            title={hasNodes ? 'Save current workflow' : 'Add nodes to save'}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest border border-white/20 text-white hover:bg-white/5 transition-colors rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined leading-none" style={{ fontSize: 13 }}>bookmark</span>
            Save
          </button>
          <SubmitButton />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden ml-2 p-2 text-white/50 hover:text-white"
          aria-label="Toggle navigation menu"
          onClick={() => setNavOpen((v) => !v)}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {navOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />}
          </svg>
        </button>
      </header>

      {/* Mobile nav drawer */}
      {navOpen && (
        <div className="md:hidden border-b border-white/10 bg-canvas/95 backdrop-blur-md px-8 py-3 flex flex-col gap-3 z-10">
          {NAV_LINKS.map(({ label, action }) => (
            <button
              key={label}
              type="button"
              onClick={() => { action?.(); setNavOpen(false); }}
              className="text-sm text-white/50 hover:text-white text-left"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <ReactFlowProvider>
        <div className="flex flex-1 overflow-hidden">

          {/* Left sidebar */}
          <PipelineToolbar />

          {/* Main canvas */}
          <main className="relative flex-1 overflow-hidden">
            <PipelineUI />
            <CostAnalyzerHUD />
          </main>

        </div>
      </ReactFlowProvider>

      <Chatbot />
      <Toaster position="bottom-center" richColors closeButton />
    </div>
  );
}

export default App;
