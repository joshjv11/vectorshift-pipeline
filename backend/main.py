from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

app = FastAPI()

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


def build_adjacency(node_ids: set[str], edges: list[Edge]) -> dict[str, list[str]]:
    adjacency: dict[str, list[str]] = {node_id: [] for node_id in node_ids}

    for edge in edges:
        if edge.source in adjacency and edge.target in adjacency:
            adjacency[edge.source].append(edge.target)

    return adjacency


def has_cycle(adjacency: dict[str, list[str]]) -> bool:
    white, gray, black = 0, 1, 2
    color = {node_id: white for node_id in adjacency}

    def dfs(node_id: str) -> bool:
        color[node_id] = gray
        for neighbor in adjacency[node_id]:
            if color[neighbor] == gray:
                return True
            if color[neighbor] == white and dfs(neighbor):
                return True
        color[node_id] = black
        return False

    for node_id in adjacency:
        if color[node_id] == white and dfs(node_id):
            return True

    return False


def is_directed_acyclic_graph(node_ids: set[str], edges: list[Edge]) -> bool:
    if not edges:
        return True

    adjacency = build_adjacency(node_ids, edges)
    return not has_cycle(adjacency)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"Ping": "Pong"}


@app.post("/pipelines/parse", response_model=PipelineParseResponse)
def parse_pipeline(pipeline: PipelineData) -> PipelineParseResponse:
    node_ids = {node.id for node in pipeline.nodes}

    return PipelineParseResponse(
        num_nodes=len(pipeline.nodes),
        num_edges=len(pipeline.edges),
        is_dag=is_directed_acyclic_graph(node_ids, pipeline.edges),
    )
