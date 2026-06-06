from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

app = FastAPI(title="VectorShift Pipeline API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Node(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    type: str | None = None


class Edge(BaseModel):
    model_config = ConfigDict(extra="allow")

    source: str
    target: str


class PipelineData(BaseModel):
    nodes: list[Node] = Field(default_factory=list)
    edges: list[Edge] = Field(default_factory=list)


class PipelineParseResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool
    cycle_path: list[str] | None = None
    node_type_counts: dict[str, int] = Field(default_factory=dict)
    entry_points: list[str] = Field(default_factory=list)
    exit_points: list[str] = Field(default_factory=list)


def build_adjacency(node_ids: set[str], edges: list[Edge]) -> dict[str, list[str]]:
    """Adjacency list restricted to known nodes; edges to unknown nodes are ignored."""
    adjacency: dict[str, list[str]] = {node_id: [] for node_id in node_ids}

    for edge in edges:
        if edge.source in adjacency and edge.target in adjacency:
            adjacency[edge.source].append(edge.target)

    return adjacency


def find_cycle(adjacency: dict[str, list[str]]) -> list[str] | None:
    """Return one cycle as an ordered list of node ids, or None if acyclic.

    Three-color DFS that also tracks each node's parent on the active path so the
    actual cycle (not just its existence) can be reported back to the client.
    """
    white, gray, black = 0, 1, 2
    color = {node_id: white for node_id in adjacency}
    parent: dict[str, str | None] = {node_id: None for node_id in adjacency}

    def reconstruct(start: str, end: str) -> list[str]:
        # `end -> start` is the back edge. Walk parents from `end` back to
        # `start`, then close the loop by repeating `start`: [start, ..., end, start].
        path = [end]
        cursor = end
        while cursor != start and parent[cursor] is not None:
            cursor = parent[cursor]
            path.append(cursor)
        path.reverse()
        path.append(start)
        return path

    def dfs(node_id: str) -> list[str] | None:
        color[node_id] = gray
        for neighbor in adjacency[node_id]:
            if color[neighbor] == gray:
                return reconstruct(neighbor, node_id)
            if color[neighbor] == white:
                parent[neighbor] = node_id
                cycle = dfs(neighbor)
                if cycle is not None:
                    return cycle
        color[node_id] = black
        return None

    for node_id in adjacency:
        if color[node_id] == white:
            cycle = dfs(node_id)
            if cycle is not None:
                return cycle

    return None


def compute_endpoints(
    node_ids: set[str], edges: list[Edge]
) -> tuple[list[str], list[str]]:
    """Entry points have no incoming edges; exit points have no outgoing edges."""
    has_incoming: set[str] = set()
    has_outgoing: set[str] = set()

    for edge in edges:
        if edge.source in node_ids and edge.target in node_ids:
            has_outgoing.add(edge.source)
            has_incoming.add(edge.target)

    entry_points = sorted(node_ids - has_incoming)
    exit_points = sorted(node_ids - has_outgoing)
    return entry_points, exit_points


def count_node_types(nodes: list[Node]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for node in nodes:
        key = node.type or "unknown"
        counts[key] = counts.get(key, 0) + 1
    return counts


@app.get("/")
def read_root() -> dict[str, str]:
    return {"Ping": "Pong"}


@app.post("/pipelines/parse", response_model=PipelineParseResponse)
def parse_pipeline(pipeline: PipelineData) -> PipelineParseResponse:
    node_ids = {node.id for node in pipeline.nodes}
    adjacency = build_adjacency(node_ids, pipeline.edges)

    cycle_path = find_cycle(adjacency)
    entry_points, exit_points = compute_endpoints(node_ids, pipeline.edges)

    return PipelineParseResponse(
        num_nodes=len(pipeline.nodes),
        num_edges=len(pipeline.edges),
        is_dag=cycle_path is None,
        cycle_path=cycle_path,
        node_type_counts=count_node_types(pipeline.nodes),
        entry_points=entry_points,
        exit_points=exit_points,
    )
