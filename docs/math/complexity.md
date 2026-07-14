# Complexity

Let $V$ be the number of RFCs (nodes) reachable within the depth budget and $E$ the number of billing edges among them.

## Proximity BFS - $O(V + E)$ time, $O(V)$ space

- Each node is enqueued **at most once**: it is added to `visited` on first discovery and never re-added. That is $\le V$ enqueues, so $\le V$ dequeues.
- When a node is dequeued we scan its supplier set once. Across the whole run every edge is examined a constant number of times (once, from its receptor side), for $O(E)$ total neighbor work.
- `visited`, the queue, and the contribution list each hold $O(V)$ entries. The final sort of contributions is $O(k \log k)$ where $k \le V$ is the number of EFOS found - dominated by $O(V)$ in practice since $k$ is small.

Total: $O(V + E)$ time, $O(V)$ space. The depth cutoff only shrinks $V$ and $E$ to the reachable sub-graph.

## Carousel DFS - $O(V + E)$ time, $O(V)$ space

Standard white/grey/black DFS: each node is coloured grey once and black once, each edge is followed once. The recursion stack and colour map are $O(V)$. Reporting a cycle slices the active path, whose length is $\le V$.

## Data footprint

The official 69-B list is ~14,000 rows. As a `Map<RFC, NodeState>` that is a few megabytes - it lives entirely in memory, no database required. Parsing is a single linear pass over the CSV, $O(\text{rows})$.

## Practical note

Because both traversals are linear and the graphs in question (one client's supplier neighbourhood, 2-3 hops deep) are small, the real cost is building the edge list upstream, not running the engine. The engine itself is effectively free.
