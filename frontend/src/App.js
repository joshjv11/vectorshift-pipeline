import { Toaster } from 'sonner';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';

function App() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900">
      {/* ── Header ────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold tracking-tight shadow">
            VS
          </div>
          <span className="text-sm font-semibold tracking-tight text-gray-900">
            VectorShift <span className="font-normal text-gray-400">Pipeline Builder</span>
          </span>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-600">
          Beta
        </span>
      </header>

      {/* ── Node palette ──────────────────────────────────── */}
      <PipelineToolbar />

      {/* ── Canvas (fills remaining space) ───────────────── */}
      <PipelineUI />

      {/* ── Submit bar ───────────────────────────────────── */}
      <SubmitButton />

      <Toaster position="bottom-center" richColors closeButton />
    </div>
  );
}

export default App;
