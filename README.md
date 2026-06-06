# VectorShift Pipeline Builder

[![CI](https://github.com/joshjv11/vectorshift-pipeline/actions/workflows/ci.yml/badge.svg)](https://github.com/joshjv11/vectorshift-pipeline/actions/workflows/ci.yml)

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
`/pipelines/parse`. The FastAPI backend returns `num_nodes`, `num_edges`,
`is_dag`, and — when the graph isn't acyclic — the actual `cycle_path`, plus
`node_type_counts`, `entry_points`, and `exit_points`. Results are shown to the
user as a toast (the cycle is named on failure).

## Beyond the brief

These are the parts that take it from "assignment complete" to production-minded:

- **Proactive connection validation** (`graph.js`, wired via React Flow's
  `isValidConnection`): self-connections, already-occupied target handles, and
  any edge that would introduce a cycle are rejected live with red-line feedback —
  the canvas can only ever build a DAG. The store re-checks on `onConnect` as
  defense-in-depth.
- **Persistence**: the Zustand store uses the `persist` middleware, so a page
  refresh restores your pipeline. A **Clear** button (with confirm) resets it.
- **Tests + CI**: 38 frontend tests (Jest + RTL) and 19 backend tests (pytest)
  cover the graph algorithms, store actions (incl. edge pruning), node rendering,
  and the API. GitHub Actions runs both suites plus the production build on every
  push.
- **UX details**: empty-state hint, live node/edge counts, keyboard-deletable
  selections, and ARIA labels on interactive controls.

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

## Testing

```bash
# Frontend (Jest + React Testing Library)
cd frontend && npm test            # watch mode
cd frontend && npm run test:ci     # single run (used in CI)

# Backend (pytest)
cd backend && pip install -r requirements-dev.txt && pytest
```

## Project structure

```
backend/
  main.py             FastAPI app: DAG check + cycle path + graph stats
  test_main.py        pytest suite (graph algorithms + endpoints)
frontend/src/
  nodes/              BaseNode + 9 node components + shared styles
  hooks/              useNodeField (local state ↔ Zustand)
  graph.js            pure connection-validation helpers (DAG-safe)
  store.js            Zustand store (persisted; nodes, edges, IDs, pruning)
  ui.js               React Flow canvas, drop + connection validation
  submit.js           POST to /pipelines/parse
  *.test.js           Jest test suites
.github/workflows/    CI (frontend + backend)
scripts/              dev runner + repo digest generator
```

## Design notes

- **DAG-by-construction:** `graph.js` validation prevents cycles on the client;
  the backend independently confirms with three-color DFS and returns the cycle
  path, so the two layers cross-check each other.
- **Edge integrity:** `setTextNodeVariables` removes orphaned edges when a Text
  node's variables change, keeping store state and the submitted payload consistent.
- **DRY nodes:** adding a node = one component returning `<BaseNode>` with a
  `handles` array; no layout/handle code is repeated.

## Future work

- Migrate the frontend to TypeScript for end-to-end type safety.
- Handle-type compatibility matrix (e.g. only allow `documents → vector store`).
- Backend pipeline execution engine for LangChain-style chains.
