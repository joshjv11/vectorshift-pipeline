import { useState, useCallback } from 'react';

const STORAGE_KEY = 'vectorshift-saved-workflows';

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Silently ignore quota errors
  }
}

export function relativeTime(timestamp) {
  const diff  = Date.now() - timestamp;
  const mins  = Math.floor(diff / 60_000);
  if (mins  <  1) return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs   < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days  <  7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function useSavedWorkflows() {
  const [workflows, setWorkflows] = useState(readStorage);

  const saveWorkflow = useCallback((name, nodes, edges) => {
    const entry = {
      id:        `wf-${Date.now()}`,
      name:      name.trim() || 'Untitled',
      nodes,
      edges,
      savedAt:   Date.now(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
    };
    const next = [entry, ...readStorage()];
    writeStorage(next);
    setWorkflows(next);
    return entry.id;
  }, []);

  const deleteWorkflow = useCallback((id) => {
    const next = readStorage().filter((wf) => wf.id !== id);
    writeStorage(next);
    setWorkflows(next);
  }, []);

  return { workflows, saveWorkflow, deleteWorkflow };
}
