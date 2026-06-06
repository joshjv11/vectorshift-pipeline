"""Tests for the pipeline parsing API and graph algorithms."""

from fastapi.testclient import TestClient

from main import (
    Edge,
    app,
    build_adjacency,
    compute_endpoints,
    count_node_types,
    find_cycle,
    Node,
)

client = TestClient(app)


def edges(*pairs: tuple[str, str]) -> list[Edge]:
    return [Edge(source=s, target=t) for s, t in pairs]


# --------------------------------------------------------------------------- #
# find_cycle / DAG detection
# --------------------------------------------------------------------------- #


def test_empty_graph_is_acyclic():
    assert find_cycle(build_adjacency(set(), [])) is None


def test_single_node_is_acyclic():
    assert find_cycle(build_adjacency({"a"}, [])) is None


def test_linear_chain_is_acyclic():
    adj = build_adjacency({"a", "b", "c"}, edges(("a", "b"), ("b", "c")))
    assert find_cycle(adj) is None


def test_diamond_is_acyclic():
    # a -> b, a -> c, b -> d, c -> d  (valid DAG, not a cycle)
    adj = build_adjacency(
        {"a", "b", "c", "d"},
        edges(("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")),
    )
    assert find_cycle(adj) is None


def test_self_loop_is_cycle():
    cycle = find_cycle(build_adjacency({"a"}, edges(("a", "a"))))
    assert cycle is not None
    assert cycle[0] == cycle[-1] == "a"


def test_two_node_cycle():
    cycle = find_cycle(build_adjacency({"a", "b"}, edges(("a", "b"), ("b", "a"))))
    assert cycle is not None
    assert set(cycle) == {"a", "b"}
    assert cycle[0] == cycle[-1]


def test_long_cycle():
    adj = build_adjacency(
        {"a", "b", "c", "d"},
        edges(("a", "b"), ("b", "c"), ("c", "d"), ("d", "a")),
    )
    cycle = find_cycle(adj)
    assert cycle is not None
    assert set(cycle) >= {"a", "b", "c", "d"}


def test_disconnected_components_acyclic():
    adj = build_adjacency({"a", "b", "c", "d"}, edges(("a", "b"), ("c", "d")))
    assert find_cycle(adj) is None


def test_cycle_in_one_component_only():
    # a->b->a is a cycle; c->d is fine. Should still detect the cycle.
    adj = build_adjacency(
        {"a", "b", "c", "d"},
        edges(("a", "b"), ("b", "a"), ("c", "d")),
    )
    assert find_cycle(adj) is not None


def test_duplicate_edges_acyclic():
    adj = build_adjacency({"a", "b"}, edges(("a", "b"), ("a", "b")))
    assert find_cycle(adj) is None


def test_edges_to_unknown_nodes_ignored():
    # edge references node "z" which isn't in the node set -> ignored.
    adj = build_adjacency({"a", "b"}, edges(("a", "b"), ("b", "z")))
    assert adj["b"] == []


# --------------------------------------------------------------------------- #
# endpoints + type counts
# --------------------------------------------------------------------------- #


def test_compute_endpoints():
    entry, exit_ = compute_endpoints(
        {"a", "b", "c"}, edges(("a", "b"), ("b", "c"))
    )
    assert entry == ["a"]
    assert exit_ == ["c"]


def test_isolated_node_is_both_entry_and_exit():
    entry, exit_ = compute_endpoints({"a"}, [])
    assert entry == ["a"]
    assert exit_ == ["a"]


def test_count_node_types():
    nodes = [
        Node(id="customInput-1", type="customInput"),
        Node(id="text-1", type="text"),
        Node(id="text-2", type="text"),
        Node(id="mystery-1"),  # no type -> "unknown"
    ]
    assert count_node_types(nodes) == {"customInput": 1, "text": 2, "unknown": 1}


# --------------------------------------------------------------------------- #
# HTTP endpoints
# --------------------------------------------------------------------------- #


def test_root_ping():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json() == {"Ping": "Pong"}


def test_parse_happy_path():
    payload = {
        "nodes": [
            {"id": "a", "type": "customInput"},
            {"id": "b", "type": "customOutput"},
        ],
        "edges": [{"source": "a", "target": "b"}],
    }
    res = client.post("/pipelines/parse", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["num_nodes"] == 2
    assert body["num_edges"] == 1
    assert body["is_dag"] is True
    assert body["cycle_path"] is None
    assert body["node_type_counts"] == {"customInput": 1, "customOutput": 1}
    assert body["entry_points"] == ["a"]
    assert body["exit_points"] == ["b"]


def test_parse_detects_cycle():
    payload = {
        "nodes": [{"id": "a"}, {"id": "b"}],
        "edges": [
            {"source": "a", "target": "b"},
            {"source": "b", "target": "a"},
        ],
    }
    res = client.post("/pipelines/parse", json=payload)
    body = res.json()
    assert body["is_dag"] is False
    assert body["cycle_path"] is not None
    assert set(body["cycle_path"]) == {"a", "b"}


def test_parse_empty_pipeline():
    res = client.post("/pipelines/parse", json={"nodes": [], "edges": []})
    body = res.json()
    assert body == {
        "num_nodes": 0,
        "num_edges": 0,
        "is_dag": True,
        "cycle_path": None,
        "node_type_counts": {},
        "entry_points": [],
        "exit_points": [],
    }


def test_parse_tolerates_extra_fields():
    payload = {
        "nodes": [{"id": "a", "type": "text", "data": {"text": "hi {{x}}"}}],
        "edges": [
            {"source": "a", "target": "a", "sourceHandle": "a-out", "extra": 1}
        ],
    }
    res = client.post("/pipelines/parse", json=payload)
    assert res.status_code == 200
    assert res.json()["is_dag"] is False  # self-loop
