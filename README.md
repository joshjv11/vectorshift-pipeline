# VectorShift Pipeline Builder

A visual, drag-and-drop editor for building AI/LLM pipelines, built for the
VectorShift frontend technical assessment. Drag nodes from the palette onto the
canvas, wire their handles together, configure each node, and submit the
pipeline for validation.

## Assessment parts

**Part 1 — Node Abstraction.** `nodes/BaseNode.js` is a shared shell that renders
the card, handles, and handle labels from a declarative `handles` array. New
nodes are a few lines of config rather than copy-paste. Field state is handled by
the `useNodeField` hook, and shared Tailwind classes live in `nodeStyles.js`.
Nine node types ship out of the box, including five LangChain-style nodes
(Document Loader, Vector Store, Prompt Template, OpenAI LLM, Output Parser).

**Part 2 — Styling.** Unified Tailwind design: card nodes with indigo accents,
labeled handles, a light grid canvas, and styled controls/minimap. Submit results
surface as toasts via `sonner`.

**Part 3 — Text Node Logic.** The Text node auto-resizes in both width (longest
line) and height (`react-textarea-autosize`). Any `{{ variable }}` in the template
is parsed (`textVariables.js`) into a left-side target handle, deduplicated and
evenly spaced. Removing a variable prunes any edges that were attached to its
handle, so serialized output never references dead handles.

**Part 4 — Backend Integration.** `submit.js` POSTs `{ nodes, edges }` to
`/pipelines/parse`. The FastAPI backend returns `num_nodes`, `num_edges`, and
`is_dag` (cycle detection via three-color DFS), shown to the user as a toast.

## Tech stack

- **Frontend:** React 18, React Flow, Zustand, Tailwind CSS, react-textarea-autosize, sonner
- **Backend:** FastAPI + Uvicorn (Pydantic models, CORS scoped to localhost)

## Running locally

One command runs both servers (auto-selects free ports):

```bash
npm install
npm run dev
```

Or run each side separately:

```bash
# Backend → http://localhost:8000
cd backend && uvicorn main:app --reload

# Frontend → http://localhost:3000
cd frontend && npm install && npm start
```

The frontend reads `REACT_APP_API_URL` (defaults to `http://localhost:8000`).

## Project structure

```
backend/          FastAPI app + DAG check
frontend/src/
  nodes/          BaseNode + 9 node components + shared styles
  hooks/          useNodeField (local state ↔ Zustand)
  store.js        Zustand store (nodes, edges, IDs, edge pruning)
  ui.js           React Flow canvas + drop handling
  submit.js       POST to /pipelines/parse
scripts/          dev runner + repo digest generator
```

## Design notes

- **Edge integrity:** `setTextNodeVariables` removes orphaned edges when a Text node's variables change, keeping store state and the submitted payload consistent.
- **DRY nodes:** adding a node = one component returning `<BaseNode>` with a `handles` array; no layout/handle code is repeated.
- **DAG check:** three-color DFS distinguishes a back edge (cycle) from a cross/forward edge, so disconnected components and self-loops are handled correctly.
