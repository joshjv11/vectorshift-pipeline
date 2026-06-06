import { useState, useEffect } from 'react';
import { useStore } from './store';
import { toast } from 'sonner';

// Cost per 1 000 runs (USD) and p50 latency (ms) by Groq model.
// Kept in sync with the model list in groqLlmNode.js / backend/main.py.
const GROQ_MODEL_COSTS = {
  'llama-3.3-70b-versatile': { cost: 0.80, latency: 900  },
  'llama-3.1-8b-instant':    { cost: 0.10, latency: 300  },
  'mixtral-8x7b-32768':      { cost: 0.60, latency: 700  },
  'gemma2-9b-it':            { cost: 0.20, latency: 400  },
};
const FALLBACK_LLM = { cost: 0.80, latency: 900 }; // defaults to llama-3.3-70b

function useMetrics(nodes) {
  const [metrics, setMetrics] = useState({ cost: 0, latency: 0 });

  useEffect(() => {
    let estCost = 0;
    let estLatency = 0;

    nodes.forEach((node) => {
      const isLlm = ['llm', 'groqLlm'].includes(node.type);
      if (isLlm) {
        const entry = GROQ_MODEL_COSTS[node.data?.model] ?? FALLBACK_LLM;
        estCost    += entry.cost;
        estLatency += entry.latency;
      }
      if (node.type === 'vectorStore')    { estCost += 2.00; estLatency += 150; }
      if (node.type === 'mcpConnector')   {                  estLatency += 400; }
      if (node.type === 'documentLoader') { estCost += 0.50; estLatency += 200; }
    });

    setMetrics({ cost: estCost, latency: estLatency });
  }, [nodes]);

  return metrics;
}

export const CostAnalyzerHUD = () => {
  const nodes = useStore((state) => state.nodes);
  const metrics = useMetrics(nodes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sellPrice, setSellPrice] = useState(10.00);

  if (nodes.length === 0) return null;

  const profit = Math.max(0, sellPrice * 0.8 - metrics.cost);
  const isExpensive = metrics.cost > 20;

  return (
    <>
      {/* ── Cost HUD pill ───────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-5 rounded-full border border-hairline bg-surface/90 px-5 py-2 shadow-lg backdrop-blur-md">

        <div className="flex flex-col items-center">
          <span className="eyebrow text-[9px]">Latency</span>
          <span className="font-mono text-xs font-semibold text-ink">{metrics.latency} ms</span>
        </div>

        <div className="h-5 w-px bg-hairline" />

        <div className="flex flex-col items-center">
          <span className="eyebrow text-[9px]">Cost / 1k runs</span>
          <span className={`font-mono text-xs font-semibold ${isExpensive ? 'text-cycle' : 'text-valid'}`}>
            ${metrics.cost.toFixed(2)}
          </span>
        </div>

        <div className="h-5 w-px bg-hairline" />

        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-full bg-accent px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-surface shadow transition hover:opacity-90"
        >
          Monetize
        </button>
      </div>

      {/* ── Deploy modal ────────────────────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-[420px] rounded-lg border border-hairline bg-surface p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between border-b border-hairline pb-4">
              <h2 className="text-sm font-semibold text-ink tracking-tight">Deploy as API</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded text-muted transition hover:text-ink hover:bg-white/5"
              >
                <span className="material-symbols-outlined leading-none" style={{ fontSize: 14 }}>close</span>
              </button>
            </div>

            <div className="mb-5 rounded-lg border border-hairline bg-canvas/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Base Cost</span>
                <span className="font-mono text-xs text-muted">${metrics.cost.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between border-t border-hairline pt-3">
                <span className="eyebrow text-accent">Your Sell Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                  className="w-20 rounded border border-hairline bg-canvas px-2 py-1 text-right font-mono text-xs text-ink outline-none focus:border-accent/50"
                />
              </div>

              <div className="flex items-center justify-between border-t border-hairline pt-3">
                <div>
                  <span className="eyebrow text-valid">Profit</span>
                  <p className="mt-0.5 text-[9px] text-muted">After 20% platform fee</p>
                </div>
                <span className="font-mono text-xs font-bold text-valid">${profit.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsModalOpen(false);
                toast.success('API endpoint is live!', {
                  description: 'Your pipeline API key has been generated.',
                });
              }}
              className="w-full rounded-md border border-hairline bg-white/5 px-4 py-2.5 text-xs font-semibold text-ink transition hover:bg-white/10"
            >
              Generate Live Endpoint
            </button>
          </div>
        </div>
      )}
    </>
  );
};
