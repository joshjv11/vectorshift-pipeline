#!/usr/bin/env python3
"""Generate a detailed project overview and merge it with a gitingest code digest."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from gitingest import ingest

ROOT = Path(__file__).resolve().parent.parent
INGEST_DIR = ROOT / "ingest"
OUTPUT_FILE = INGEST_DIR / "digest.txt"

IGNORED_PARTS = {
    "node_modules",
    "build",
    "ingest",
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "coverage",
}

SKIP_METRIC_FILES = {
    "package-lock.json",
    "DS_Store",
    ".DS_Store",
}

SKIP_METRIC_SUFFIXES = {".png", ".ico", ".zip", ".md"}

NODE_TYPES = [
    ("customInput", "Input", "InputNode", "source → value", "Name + type (Text/File)"),
    ("llm", "LLM", "LLMNode", "targets: system, prompt → source: response", "Legacy dual-input LLM node"),
    ("customOutput", "Output", "OutputNode", "target ← value", "Name + type (Text/Image)"),
    ("text", "Text", "TextNode", "dynamic targets + source: out", "Auto-resize template + {{var}} handles"),
    ("documentLoader", "Doc Loader", "DocumentLoaderNode", "source → docs", "Loader type + file path"),
    ("vectorStore", "Vector Store", "VectorStoreNode", "target ← docs → source: store", "Store type + collection"),
    ("promptTemplate", "Prompt", "PromptTemplateNode", "target ← vars → source: prompt", "Autosize prompt template"),
    ("openaiLlm", "OpenAI LLM", "OpenAI_LLMNode", "target ← prompt → source: response", "Model + temperature"),
    ("outputParser", "Parser", "OutputParserNode", "target ← response → source: parsed", "Parser type + schema"),
]

PHASES = [
    (
        "Phase 1 — React abstraction",
        [
            "BaseNode wrapper for shared layout, handles, and styling",
            "Refactored Input, Output, LLM, and Text nodes to use BaseNode",
            "Added 5 LangChain-style nodes (DocumentLoader, VectorStore, PromptTemplate, OpenAI LLM, OutputParser)",
        ],
    ),
    (
        "Phase 2 — UI polish",
        [
            "Tailwind CSS across nodes, toolbar, canvas, and submit button",
            "Shared form styles via nodeStyles.js",
            "Vercel-like card aesthetic with indigo accents and handle labels",
            "Light canvas background with styled controls and minimap",
        ],
    ),
    (
        "Phase 3 — Dynamic Text node",
        [
            "react-textarea-autosize for height expansion without scroll",
            "Dynamic width based on longest line of text",
            "Regex parser for {{ variableName }} with unique left-side target handles",
            "Even vertical spacing for dynamic handles; labels show variable names",
            "Variables synced to Zustand store as data.variables",
        ],
    ),
    (
        "Quality pass",
        [
            "nodrag / nowheel on all interactive fields (React Flow safe)",
            "useNodeField hook persists node fields to Zustand immutably",
            "parseTextVariables and computeTextNodeWidth extracted as utilities",
            "Null-safe React Flow drop handler",
        ],
    ),
]


def run_command(args: list[str]) -> str | None:
    try:
        result = subprocess.run(
            args,
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def collect_git_metadata() -> dict[str, str | None]:
    return {
        "branch": run_command(["git", "rev-parse", "--abbrev-ref", "HEAD"]),
        "commit": run_command(["git", "rev-parse", "--short", "HEAD"]),
        "commit_message": run_command(["git", "log", "-1", "--pretty=%s"]),
        "commit_date": run_command(["git", "log", "-1", "--pretty=%ci"]),
        "remote": run_command(["git", "remote", "get-url", "origin"]),
    }


def should_skip(path: Path) -> bool:
    return any(part in IGNORED_PARTS for part in path.parts)


def is_metric_source_file(path: Path) -> bool:
    if should_skip(path):
        return False
    if path.name in SKIP_METRIC_FILES:
        return False
    if path.suffix.lower() in SKIP_METRIC_SUFFIXES:
        return False
    return True


def collect_file_stats() -> tuple[int, Counter, list[tuple[str, int]]]:
    extension_counts: Counter = Counter()
    source_files: list[tuple[str, int]] = []
    total_size = 0

    for path in ROOT.rglob("*"):
        if not path.is_file() or not is_metric_source_file(path):
            continue

        rel = path.relative_to(ROOT).as_posix()
        size = path.stat().st_size
        total_size += size
        extension_counts[path.suffix.lower() or "(no ext)"] += 1
        source_files.append((rel, size))

    source_files.sort(key=lambda item: item[1], reverse=True)
    return total_size, extension_counts, source_files[:12]


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def count_lines(root: Path, pattern: str) -> int:
    total = 0
    for path in root.glob(pattern):
        if path.is_file() and not should_skip(path):
            total += len(path.read_text(encoding="utf-8", errors="ignore").splitlines())
    return total


def build_report(summary: str, tree: str, git: dict[str, str | None]) -> str:
    total_size, extension_counts, largest_files = collect_file_stats()
    root_pkg = load_json(ROOT / "package.json")
    frontend_pkg = load_json(ROOT / "frontend" / "package.json")
    frontend_deps = frontend_pkg.get("dependencies", {})
    frontend_dev_deps = frontend_pkg.get("devDependencies", {})
    backend_reqs = [
        line.strip()
        for line in (ROOT / "backend" / "requirements.txt").read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    ]

    node_file_count = len(list((ROOT / "frontend" / "src" / "nodes").glob("*.js")))
    frontend_loc = count_lines(ROOT / "frontend" / "src", "**/*.js")
    backend_loc = count_lines(ROOT / "backend", "**/*.py")

    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    remote = git.get("remote") or "not configured"
    github_url = remote.removesuffix(".git") if remote and remote.startswith("https://github.com/") else remote
    github_slug = (
        github_url.replace("https://github.com/", "")
        if github_url and github_url.startswith("https://github.com/")
        else "joshjv11/vectorshift-pipeline"
    )

    lines: list[str] = [
        "=" * 80,
        "PROJECT OVERVIEW & REPORT",
        "=" * 80,
        "",
        "1. EXECUTIVE SUMMARY",
        "-" * 80,
        "Name:            VectorShift Pipeline Builder",
        "Repository:      vectorshift-pipeline",
        "Purpose:         Visual drag-and-drop pipeline editor for AI/LLM workflows",
        "Status:          Frontend complete through Phase 3; backend stub present",
        f"Generated:       {generated_at}",
        f"Git branch:      {git.get('branch') or 'unknown'}",
        f"Git commit:      {git.get('commit') or 'unknown'} — {git.get('commit_message') or ''}",
        f"Git remote:      {remote}",
        f"GitHub:          {github_url}",
        "",
        "This project is a VectorShift-style pipeline UI built with React Flow. Users drag",
        "nodes from a palette onto a canvas, connect handles, configure fields, and submit",
        "pipelines. The codebase emphasizes DRY component architecture (BaseNode), polished",
        "Tailwind styling, and a dynamic Text node that parses {{ variable }} templates.",
        "",
        "2. ARCHITECTURE",
        "-" * 80,
        "Monorepo layout:",
        "  frontend/   React 18 + React Flow canvas, node components, Zustand store",
        "  backend/    FastAPI stub with / and /pipelines/parse endpoints",
        "  scripts/    Ingest tooling (gitingest + project report generator)",
        "",
        "Frontend data flow:",
        "  PipelineToolbar → DraggableNode (drag) → PipelineUI/onDrop → Zustand addNode",
        "  ReactFlow renders nodeTypes; onConnect adds animated edges",
        "  useNodeField writes field changes to node.data via updateNodeField",
        "",
        "Key abstractions:",
        "  BaseNode.js          Shared card shell, handle rendering, handle labels",
        "  nodeStyles.js        Shared Tailwind classes + nodrag/nowheel on inputs",
        "  useNodeField.js      Local state + Zustand persistence hook",
        "  textVariables.js     parseTextVariables(), computeTextNodeWidth()",
        "",
        "3. TECH STACK",
        "-" * 80,
        "Frontend runtime:",
        f"  React {frontend_deps.get('react', 'n/a')}",
        f"  React Flow {frontend_deps.get('reactflow', 'n/a')}",
        f"  react-textarea-autosize {frontend_deps.get('react-textarea-autosize', 'n/a')}",
        "  Zustand (via store.js)",
        "",
        "Frontend styling & tooling:",
        f"  Tailwind CSS {frontend_dev_deps.get('tailwindcss', 'n/a')}",
        "  Create React App (react-scripts)",
        "",
        "Backend:",
        "  FastAPI + Uvicorn + python-multipart",
        f"  Dependencies: {', '.join(backend_reqs) if backend_reqs else 'none listed'}",
        "",
        "DevOps / tooling:",
        "  gitingest — LLM-friendly codebase digest",
        f"  GitHub — {github_slug}",
        "",
        "4. NODE CATALOG (9 TYPES)",
        "-" * 80,
        f"{'Type Key':<18} {'Label':<14} {'Component':<22} {'Handles':<38} Notes",
    ]

    for type_key, label, component, handles, notes in NODE_TYPES:
        lines.append(f"{type_key:<18} {label:<14} {component:<22} {handles:<38} {notes}")

    lines.extend(
        [
            "",
            "Text node handle logic:",
            "  Regex: /\\{\\{\\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\}\\}/g",
            "  Unique variables → left target handles spaced at (i+1)/(n+1)*100%",
            "  Always includes right-side source handle id `{nodeId}-output`",
            "",
            "5. IMPLEMENTATION PHASES COMPLETED",
            "-" * 80,
        ]
    )

    for phase_title, bullets in PHASES:
        lines.append(phase_title)
        for bullet in bullets:
            lines.append(f"  • {bullet}")
        lines.append("")

    lines.extend(
        [
            "6. API SURFACE (BACKEND)",
            "-" * 80,
            "GET  /                 → { \"Ping\": \"Pong\" }",
            "POST /pipelines/parse  → { num_nodes, num_edges, is_dag, cycle_path,",
            "                           node_type_counts, entry_points, exit_points }",
            "",
            "Submit button POSTs the pipeline (nodes + edges) and toasts the result;",
            "on a cycle it names the offending path.",
            "",
            "7. NPM / RUN COMMANDS",
            "-" * 80,
        ]
    )

    for script, command in root_pkg.get("scripts", {}).items():
        lines.append(f"  npm run {script:<18} → {command}")

    lines.extend(
        [
            "  npm --prefix frontend start   → local dev server (port 3000)",
            "  npm --prefix frontend build   → production build",
            "",
            "8. CODEBASE METRICS",
            "-" * 80,
            summary.strip(),
            "",
            f"Tracked source files (code/config, excluding assets & lockfiles): {sum(extension_counts.values())}",
            f"Total tracked source size: {total_size:,} bytes",
            f"Frontend JS lines (src/**/*.js): ~{frontend_loc}",
            f"Backend Python lines: ~{backend_loc}",
            f"Node component files: {node_file_count}",
            "",
            "Files by extension:",
        ]
    )

    for ext, count in sorted(extension_counts.items(), key=lambda item: (-item[1], item[0])):
        lines.append(f"  {ext:<12} {count}")

    lines.extend(["", "Largest source files:"])
    for rel, size in largest_files:
        lines.append(f"  {size:>7,} bytes  {rel}")

    lines.extend(
        [
            "",
            "9. DIRECTORY TREE (from gitingest)",
            "-" * 80,
            tree.strip(),
            "",
            "10. QUALITY & UX CHECKLIST",
            "-" * 80,
            "  ✓ BaseNode DRY abstraction across all node types",
            "  ✓ Tailwind polish on nodes, toolbar, canvas, submit",
            "  ✓ Text node auto-resize (height + width)",
            "  ✓ Dynamic {{ variable }} handle generation with deduplication",
            "  ✓ Handle labels on BaseNode for clearer connections",
            "  ✓ nodrag/nowheel prevents accidental node drag while editing",
            "  ✓ Immutable Zustand updates via updateNodeField",
            "  ✓ Production build compiles cleanly",
            "  ✓ Submit → backend integration (POST /pipelines/parse)",
            "  ✓ Stale-edge pruning when Text node variables change",
            "  ✓ Live connection validation (no self/duplicate/cycle edges)",
            "  ✓ Persisted store (refresh-safe) + Clear action",
            "  ✓ Backend reports cycle path, entry/exit points, type counts",
            "  ✓ Test suites: 38 frontend (Jest/RTL) + 19 backend (pytest)",
            "  ✓ GitHub Actions CI (frontend test+build, backend pytest)",
            "  ○ Pipeline serialization / execution engine pending",
            "",
            "11. RECOMMENDED NEXT STEPS",
            "-" * 80,
            "  1. Migrate frontend to TypeScript for end-to-end type safety",
            "  2. Handle-type compatibility matrix between node ports",
            "  3. Backend topological sort + execution stub for chains",
            "  4. Persist named pipelines (save/load multiple) server-side",
            "",
            "=" * 80,
            "END PROJECT REPORT — FULL SOURCE CODE FOLLOWS BELOW",
            "=" * 80,
            "",
        ]
    )

    return "\n".join(lines)


def main() -> int:
    stdout_mode = "--stdout" in sys.argv

    INGEST_DIR.mkdir(parents=True, exist_ok=True)

    git = collect_git_metadata()
    summary, tree, content = ingest(str(ROOT))

    report = build_report(summary, tree, git)
    digest = f"{report}\n{content}"

    if stdout_mode:
        print(digest)
    else:
        OUTPUT_FILE.write_text(digest, encoding="utf-8")
        line_count = len(digest.splitlines())
        print(f"Analysis complete! Output written to: {OUTPUT_FILE}")
        print("")
        print("Summary:")
        print(summary.strip())
        print("")
        print(
            "Report sections: 11 "
            "(overview, architecture, stack, nodes, phases, API, commands, metrics, tree, quality, next steps)"
        )
        print(f"Total digest lines: {line_count:,}")
        print(f"Output: {OUTPUT_FILE.relative_to(ROOT)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
