import { useState, useRef, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { toast } from 'sonner';
import { useReactFlow } from 'reactflow';
import { useStore, useTemporalStore } from './store';
import { TEMPLATES } from './demoData';
import { DraggableNode } from './draggableNode';
import { NODE_META } from './nodes/nodeColors';
import { useSavedWorkflows, relativeTime } from './hooks/useSavedWorkflows';

// ─── Template Library modal ──────────────────────────────────────────────────
const TemplateModal = ({ templates, onSelect, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-panel w-[520px] rounded-xl border border-hairline bg-surface/95 backdrop-blur-md p-6 shadow-[0_8px_48px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="text-[13px] font-semibold text-ink tracking-tight">Template Library</h2>
            <p className="mt-0.5 text-[11px] text-muted">Select a pre-built architecture to get started.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-white/5 hover:text-ink focus:outline-none"
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined leading-none" style={{ fontSize: 15 }}>close</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className="flex items-start gap-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5 text-left transition hover:border-accent/40 hover:bg-accent/5 focus:outline-none focus:ring-1 focus:ring-accent/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-lg">
                {template.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-ink">{template.name}</p>
                <p className="mt-0.5 text-[11px] text-muted leading-relaxed">{template.description}</p>
                <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-accent/60">
                  {template.nodes.length} Nodes · {template.edges.length} Edges
                </p>
              </div>
              <span className="material-symbols-outlined leading-none text-muted/50 self-center shrink-0" style={{ fontSize: 15 }}>
                chevron_right
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Save Workflow modal ──────────────────────────────────────────────────────
const SaveWorkflowModal = ({ nodeCount, edgeCount, onSave, onClose }) => {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(name);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[400px] rounded-xl border border-hairline bg-surface/95 backdrop-blur-md p-6 shadow-[0_8px_48px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="text-[13px] font-semibold text-ink tracking-tight">Save Workflow</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              {nodeCount} node{nodeCount !== 1 ? 's' : ''} · {edgeCount} edge{edgeCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-white/5 hover:text-ink focus:outline-none"
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined leading-none" style={{ fontSize: 15 }}>close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted">
              Workflow Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. RAG Pipeline v2"
              maxLength={60}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-1 focus:ring-accent/20"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-surface shadow transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <span className="material-symbols-outlined leading-none" style={{ fontSize: 14 }}>bookmark_add</span>
            Save Workflow
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Dashboard Modal ─────────────────────────────────────────────────────────
const DashboardModal = ({ workflows, onLoad, onDelete, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const nodeTypes = (wf) => {
    const counts = {};
    (wf.nodes || []).forEach((n) => { counts[n.type] = (counts[n.type] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => NODE_META[type]?.icon || '🔷')
      .join(' ');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm pt-16"
      onClick={onClose}
    >
      <div
        className="modal-panel w-[720px] max-h-[76vh] flex flex-col rounded-2xl border border-hairline bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-[15px] font-bold text-white flex items-center gap-2.5">
              <span className="material-symbols-outlined text-accent leading-none" style={{ fontSize: 18 }}>dashboard</span>
              My Workflows
            </h2>
            <p className="text-[11px] text-white/40 mt-0.5">
              {workflows.length} saved automation{workflows.length !== 1 ? 's' : ''} · stored in browser memory
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition"
          >
            <span className="material-symbols-outlined leading-none" style={{ fontSize: 14 }}>close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="material-symbols-outlined text-white/20" style={{ fontSize: 48 }}>folder_open</span>
              <p className="text-[13px] font-semibold text-white/30">No saved workflows yet</p>
              <p className="text-[11px] text-white/20">Build a pipeline and click Save to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="group flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 transition hover:border-accent/30 hover:bg-accent/[0.04]"
                >
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-[13px] font-bold text-white truncate">{wf.name}</h3>
                      <span className="shrink-0 text-[9px] font-semibold uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded-md border border-white/[0.06]">
                        {relativeTime(wf.savedAt)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1 text-[11px] text-white/40">
                        <span className="material-symbols-outlined leading-none" style={{ fontSize: 12 }}>hub</span>
                        {wf.nodeCount} node{wf.nodeCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-white/40">
                        <span className="material-symbols-outlined leading-none" style={{ fontSize: 12 }}>account_tree</span>
                        {wf.edgeCount} connection{wf.edgeCount !== 1 ? 's' : ''}
                      </span>
                      {nodeTypes(wf) && (
                        <span className="text-[11px] text-white/30 font-mono tracking-wider">{nodeTypes(wf)}</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      type="button"
                      onClick={() => onLoad(wf)}
                      className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[11px] font-bold text-white transition hover:opacity-90 shadow-sm shadow-accent/30"
                    >
                      <span className="material-symbols-outlined leading-none" style={{ fontSize: 12 }}>file_open</span>
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(wf)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] font-semibold text-red-400/70 transition hover:bg-red-500/15 hover:text-red-400"
                    >
                      <span className="material-symbols-outlined leading-none" style={{ fontSize: 12 }}>delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-6 py-3 flex items-center justify-between">
          <p className="text-[10px] text-white/25">
            Stored in browser localStorage · no server required
          </p>
          <p className="text-[10px] text-accent/50 font-semibold">
            {workflows.reduce((a, wf) => a + wf.nodeCount, 0)} total nodes across all workflows
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Store selector ──────────────────────────────────────────────────────────
const selector = (state) => ({
  nodes:                state.nodes,
  edges:                state.edges,
  clearPipeline:        state.clearPipeline,
  loadPipeline:         state.loadPipeline,
  applyNodeLayout:      state.applyNodeLayout,
  groupSelectedNodes:   state.groupSelectedNodes,
  ungroupSelectedNodes: state.ungroupSelectedNodes,
});

const Divider = () => <div className="h-px w-full bg-white/[0.06]" />;

const ActionBtn = ({ onClick, disabled, danger, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={[
      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-[11px] font-medium transition-all',
      'focus:outline-none focus:ring-1 focus:ring-white/10',
      'disabled:pointer-events-none disabled:opacity-35',
      danger
        ? 'text-red-400/80 hover:bg-red-500/10 border border-transparent hover:border-red-500/20'
        : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent hover:border-white/10',
    ].join(' ')}
  >
    {children}
  </button>
);

const PALETTE = [
  { type: 'customInput',    label: 'Input',        icon: NODE_META.customInput.icon    },
  { type: 'llm',            label: 'LLM',          icon: NODE_META.llm.icon            },
  { type: 'customOutput',   label: 'Output',       icon: NODE_META.customOutput.icon   },
  { type: 'text',           label: 'Text',         icon: NODE_META.text.icon           },
  { type: 'documentLoader', label: 'Doc Loader',   icon: NODE_META.documentLoader.icon },
  { type: 'vectorStore',    label: 'Vector Store', icon: NODE_META.vectorStore.icon    },
  { type: 'promptTemplate', label: 'Prompt',       icon: NODE_META.promptTemplate.icon },
  { type: 'groqLlm',        label: 'Groq LLM',     icon: NODE_META.groqLlm.icon        },
  { type: 'outputParser',   label: 'Parser',       icon: NODE_META.outputParser.icon   },
  { type: 'mcpConnector',   label: 'MCP Server',   icon: NODE_META.mcpConnector.icon   },
];

export const PipelineToolbar = () => {
  const {
    nodes,
    edges,
    clearPipeline,
    loadPipeline,
    applyNodeLayout,
    groupSelectedNodes,
    ungroupSelectedNodes,
  } = useStore(selector, shallow);

  const { undo, redo, pastStates, futureStates } = useTemporalStore(
    (s) => ({ undo: s.undo, redo: s.redo, pastStates: s.pastStates, futureStates: s.futureStates }),
    shallow
  );

  const { workflows, saveWorkflow, deleteWorkflow } = useSavedWorkflows();

  // ── State & refs declared first so effects below can reference the setters ──
  const [confirmClear,        setConfirmClear]        = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSaveModalOpen,     setIsSaveModalOpen]     = useState(false);
  const [isDashboardOpen,     setIsDashboardOpen]     = useState(false);
  const fileInputRef = useRef(null);
  const { fitView } = useReactFlow();

  // Keyboard undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Listen for the header "Save" button dispatching this event so we don't
  // need prop drilling through App → ReactFlowProvider → PipelineToolbar.
  useEffect(() => {
    const handler = () => {
      if (nodes.length === 0) {
        toast.error('Nothing to save — add some nodes first.');
        return;
      }
      setIsSaveModalOpen(true);
    };
    window.addEventListener('open-save-workflow', handler);
    return () => window.removeEventListener('open-save-workflow', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]);

  // Listen for the "Workflows" nav link or any other trigger to open Dashboard.
  useEffect(() => {
    const handler = () => setIsDashboardOpen(true);
    window.addEventListener('open-dashboard', handler);
    return () => window.removeEventListener('open-dashboard', handler);
  }, []);

  const nodeCount     = nodes.length;
  const edgeCount     = edges.length;
  const selectedNodes = nodes.filter((n) => n.selected);
  const canGroup      = selectedNodes.length >= 2 && !selectedNodes.some((n) => n.parentId);
  const canUngroup    = selectedNodes.some((n) => n.type === 'groupNode');

  const handleExport = () => {
    if (nodes.length === 0) return toast.error('Nothing to export.');
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pipeline_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Pipeline exported.');
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.nodes && parsed.edges) {
          loadPipeline(parsed.nodes, parsed.edges);
          toast.success('Pipeline imported.');
        } else {
          toast.error('Invalid file — missing nodes or edges.');
        }
      } catch {
        toast.error('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleTidy = () => {
    applyNodeLayout();
    window.requestAnimationFrame(() => fitView({ padding: 0.2, duration: 800 }));
    toast.success('Graph tidied.');
  };

  const handleLoadTemplate = (template) => {
    loadPipeline(template.nodes, template.edges);
    setIsTemplateModalOpen(false);
    setTimeout(() => {
      applyNodeLayout();
      window.requestAnimationFrame(() => fitView({ padding: 0.2, duration: 800 }));
    }, 50);
    toast.success(`${template.name} loaded!`, { description: template.description });
  };

  const handleSaveWorkflow = (name) => {
    saveWorkflow(name, nodes, edges);
    setIsSaveModalOpen(false);
    toast.success('Workflow saved!', { description: name.trim() || 'Untitled' });
  };

  const handleLoadWorkflow = (wf) => {
    loadPipeline(wf.nodes, wf.edges);
    setIsDashboardOpen(false);
    setTimeout(() => {
      applyNodeLayout();
      window.requestAnimationFrame(() => fitView({ padding: 0.2, duration: 800 }));
    }, 50);
    toast.success(`"${wf.name}" loaded.`);
  };

  const handleDeleteWorkflow = (wf) => {
    deleteWorkflow(wf.id);
    toast.success(`"${wf.name}" deleted.`);
  };

  const handleClear = () => {
    clearPipeline();
    setConfirmClear(false);
    toast.success('Pipeline cleared.');
  };

  return (
    <>
    <aside className="flex h-full w-60 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-canvas/80 backdrop-blur-md">

      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <h2 className="text-base font-bold text-white tracking-tight">Node Palette</h2>
        <p className="mt-1 text-[11px] text-indigo-300/50">Drag to canvas</p>
      </div>

      <Divider />

      {/* Draggable node chips */}
      <div className="flex flex-col gap-0.5 px-2 py-2">
        {PALETTE.map(({ type, label, icon }) => (
          <DraggableNode key={type} type={type} label={label} icon={icon} />
        ))}
      </div>

      <Divider />

      {/* Group / Ungroup */}
      {(canGroup || canUngroup) && (
        <>
          <div className="flex flex-col gap-0.5 px-2 py-2">
            {canGroup && (
              <ActionBtn onClick={() => { groupSelectedNodes(); toast.success('Nodes grouped.'); }}>
                <span className="material-symbols-outlined leading-none text-sm" style={{ fontSize: 14 }}>group_work</span>
                Group selection
              </ActionBtn>
            )}
            {canUngroup && (
              <ActionBtn onClick={() => { ungroupSelectedNodes(); toast.success('Group dissolved.'); }}>
                <span className="material-symbols-outlined leading-none text-sm" style={{ fontSize: 14 }}>ungroup</span>
                Ungroup
              </ActionBtn>
            )}
          </div>
          <Divider />
        </>
      )}

      {/* Workspace actions */}
      <div className="flex flex-col gap-0.5 px-2 py-2">
        <p className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-widest text-white/25">Workspace</p>

        <ActionBtn onClick={() => fileInputRef.current.click()}>
          <span className="material-symbols-outlined leading-none" style={{ fontSize: 14 }}>folder_open</span>
          Import JSON
        </ActionBtn>

        <ActionBtn onClick={handleExport} disabled={nodeCount === 0}>
          <span className="material-symbols-outlined leading-none" style={{ fontSize: 14 }}>download</span>
          Export JSON
        </ActionBtn>

        <ActionBtn onClick={handleTidy} disabled={nodeCount === 0}>
          <span className="material-symbols-outlined leading-none" style={{ fontSize: 14 }}>auto_fix_high</span>
          Auto-layout
        </ActionBtn>

        <button
          type="button"
          onClick={() => setIsTemplateModalOpen(true)}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[11px] font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-indigo-400/40 text-indigo-300 hover:text-indigo-100 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-400/40"
        >
          <span className="material-symbols-outlined leading-none" style={{ fontSize: 14 }}>auto_stories</span>
          Template Library
        </button>

        <button
          type="button"
          onClick={() => setIsDashboardOpen(true)}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[11px] font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-accent/40 text-accent hover:text-accent/80 bg-accent/10 hover:bg-accent/20 border border-accent/20 hover:border-accent/40"
        >
          <span className="material-symbols-outlined leading-none" style={{ fontSize: 14 }}>dashboard</span>
          My Dashboard
          {workflows.length > 0 && (
            <span className="ml-auto flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent/20 px-1.5 text-[9px] font-bold text-accent">
              {workflows.length}
            </span>
          )}
        </button>
      </div>

      <Divider />

      {/* Undo / Redo */}
      <div className="flex flex-col gap-0.5 px-2 py-2">
        <p className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-widest text-white/25">History</p>
        <div className="flex gap-1 px-1">
          <button
            type="button"
            onClick={() => undo()}
            disabled={pastStates.length === 0}
            title="Undo (Cmd+Z)"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-medium text-white/50 transition-all hover:bg-white/10 hover:text-white/80 disabled:pointer-events-none disabled:opacity-30"
          >
            <span className="material-symbols-outlined leading-none" style={{ fontSize: 13 }}>undo</span>
            Undo
          </button>
          <button
            type="button"
            onClick={() => redo()}
            disabled={futureStates.length === 0}
            title="Redo (Cmd+Shift+Z)"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-medium text-white/50 transition-all hover:bg-white/10 hover:text-white/80 disabled:pointer-events-none disabled:opacity-30"
          >
            <span className="material-symbols-outlined leading-none" style={{ fontSize: 13 }}>redo</span>
            Redo
          </button>
        </div>
        {(pastStates.length > 0 || futureStates.length > 0) && (
          <p className="px-3 pt-1 text-[9px] text-white/20">
            {pastStates.length} step{pastStates.length !== 1 ? 's' : ''} back · {futureStates.length} forward
          </p>
        )}
      </div>

      <Divider />

      {/* ── Saved Workflows ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 px-2 py-2">
        <div className="flex items-center justify-between px-3 pb-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Saved</p>
          <button
            type="button"
            onClick={() => {
              if (nodeCount === 0) {
                toast.error('Nothing to save — add some nodes first.');
                return;
              }
              setIsSaveModalOpen(true);
            }}
            title="Save current workflow"
            className="flex items-center gap-1 rounded text-[9px] font-semibold uppercase tracking-widest text-accent/70 transition hover:text-accent focus:outline-none"
          >
            <span className="material-symbols-outlined leading-none" style={{ fontSize: 11 }}>add</span>
            Save
          </button>
        </div>

        {workflows.length === 0 ? (
          <p className="px-3 py-2 text-[10px] text-muted/60">No saved workflows yet.</p>
        ) : (
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="group rounded-md border border-transparent bg-white/[0.02] px-3 py-2 transition hover:border-hairline hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="flex-1 truncate text-[11px] font-semibold text-ink/80 leading-tight">
                    {wf.name}
                  </p>
                  <span className="shrink-0 text-[9px] text-muted/60 leading-tight">
                    {relativeTime(wf.savedAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-[9px] text-muted/50">
                  {wf.nodeCount} node{wf.nodeCount !== 1 ? 's' : ''} · {wf.edgeCount} edge{wf.edgeCount !== 1 ? 's' : ''}
                </p>
                <div className="mt-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleLoadWorkflow(wf)}
                    className="flex-1 rounded border border-accent/20 bg-accent/10 px-2 py-1 text-[9px] font-semibold text-accent transition hover:bg-accent/20"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteWorkflow(wf)}
                    className="rounded border border-red-500/20 bg-red-500/5 px-2 py-1 text-[9px] font-semibold text-red-400/70 transition hover:bg-red-500/15 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Danger zone */}
      <div className="px-2 py-2">
        {confirmClear ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <p className="mb-2 text-[11px] text-red-400">Clear entire pipeline?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 rounded-md bg-red-500/80 px-2 py-1.5 text-[11px] font-semibold text-white transition hover:bg-red-500"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white/50 transition hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <ActionBtn danger onClick={() => nodeCount > 0 && setConfirmClear(true)} disabled={nodeCount === 0}>
            <span className="material-symbols-outlined leading-none" style={{ fontSize: 14 }}>delete</span>
            Clear pipeline
          </ActionBtn>
        )}
      </div>

      {/* Pipeline stats footer */}
      <div className="mt-auto border-t border-white/[0.06] px-4 py-3">
        <p className="text-[10px] text-white/25">
          {nodeCount === 0
            ? 'Empty pipeline'
            : `${nodeCount} node${nodeCount !== 1 ? 's' : ''} · ${edgeCount} edge${edgeCount !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Hidden file input */}
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
    </aside>

    {/* Template Library Modal */}
    {isTemplateModalOpen && (
      <TemplateModal
        templates={TEMPLATES}
        onSelect={handleLoadTemplate}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    )}

    {/* Save Workflow Modal */}
    {isSaveModalOpen && (
      <SaveWorkflowModal
        nodeCount={nodeCount}
        edgeCount={edgeCount}
        onSave={handleSaveWorkflow}
        onClose={() => setIsSaveModalOpen(false)}
      />
    )}

    {/* My Projects Dashboard Modal */}
    {isDashboardOpen && (
      <DashboardModal
        workflows={workflows}
        onLoad={handleLoadWorkflow}
        onDelete={handleDeleteWorkflow}
        onClose={() => setIsDashboardOpen(false)}
      />
    )}
    </>
  );
};
