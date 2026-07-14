# efos-risk-graph

> Fiscal-risk propagation for the Mexican SAT **Art. 69-B** blacklist (EFOS/EDOS), worked out from the math up.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-black.svg)](https://www.typescriptlang.org/)

The SAT publishes a list of ~14,000 taxpayers presumed or confirmed to issue simulated invoices (**EFOS**). Checking whether *your* supplier is on that list is easy - a lookup. The question that actually protects a deduction is harder:

> **How many hops am I from an EFOS?**

Your direct supplier may be clean, but *their* supplier may be a confirmed EFOS. This package answers that by treating invoicing as a directed graph and propagating blacklist risk across it, attenuated by distance.

The goal here is not just the score, but **understanding why it's the score** - so every design choice below is derived, then verified against a graph small enough to check by hand.

## The Idea

- A **node** is an RFC. A directed **edge** `A -> B` means "A billed B" (A is the emisor, B the receptor of a CFDI).
- The 69-B list does not give you edges - it gives a **property of some nodes**: their `situacion` (Presunto / Definitivo / Desvirtuado / Sentencia Favorable), which becomes a base risk weight.
- Risk flows *along* billing edges and **decays by a factor `alpha` per hop**. A confirmed EFOS one hop away is a real problem; five hops away it is noise.

This split is the whole point: **the engine is open source, the edges are private.** The graph engine and 69-B parser here know nothing about where edges come from. Inside a real product the edges are derived from clients' confidential CFDIs and never touch this repository - an open-core model.

## Approach - Solving It by Hand

### 1. Risk as attenuated distance

Give every RFC a base weight `w(rfc) in [0, 1]` from its 69-B situation (Definitivo $=1$, Presunto $=0.6$, Desvirtuado $=0.05$, else $0$). For a client at the root, an EFOS found $d$ hops upstream (through the *supplier* direction) contributes

$$\text{score} = w(\text{rfc}) \cdot \alpha^{\,d}, \qquad 0 < \alpha < 1.$$

The root's overall risk is the **maximum** contribution, not the sum:

$$\text{riesgo}(\text{root}) = \max_{\text{efos } e \text{ reachable}} \; w(e)\cdot \alpha^{\,d(e)}.$$

**Why max, not sum.** A max is a *bottleneck*: the risk is your single worst chain, and it comes with one explaining path - "your exposure is `Cliente -> A -> D (definitivo)`." A sum blends many weak signals into a number nobody can defend to an auditor, and it grows with graph size rather than with actual danger.

### 2. Why the shortest path is the only one that matters

For a fixed EFOS node $e$, its contribution $w(e)\cdot\alpha^{d}$ is **strictly decreasing in $d$** (since $0<\alpha<1$). So among all paths from the root to $e$, the largest score is always achieved on the **shortest** one. Breadth-first search visits every node first via its shortest path - so a plain BFS, recording each node the first time it is seen, is already optimal. No path enumeration, no revisiting. (Full argument: [`docs/math/bfs-correctness.md`](./docs/math/bfs-correctness.md).)

### 3. Why you can stop at 2-3 levels

The worst possible contribution from depth $d$ onward is bounded (with all weights $\le 1$) by the tail of a geometric series:

$$\sum_{k=d+1}^{\infty} \alpha^{k} = \frac{\alpha^{\,d+1}}{1-\alpha}.$$

With $\alpha = 0.5$, everything beyond depth 3 is capped at $\dfrac{0.5^{4}}{0.5} = 0.125$, and beyond depth 4 at $0.0625$. The series **converges**, so distant risk vanishes on its own and truncating the BFS at `maxDepth = 2` or `3` is not a hack - it is a quantified approximation with a known error bound. (Derivation: [`docs/math/geometric-convergence.md`](./docs/math/geometric-convergence.md).)

### 4. Carousels are cycles

A simulated-invoicing *carrusel* - `A -> B -> C -> A` - is exactly a directed cycle in the billing graph. A depth-first search that colours nodes white/grey/black flags a carousel the moment it finds a back-edge to a grey (on-stack) node. See [`src/cycles/carousel.ts`](./src/cycles/carousel.ts).

## Verification with Code

```ts
import { buildGraph, analyzeProximity, detectCarousels } from 'efos-risk-graph';

// edges come from YOUR data (CFDIs); the engine never fetches them
const graph = buildGraph([
  { de: 'EFO010101AA1', a: 'CLI010101AA1' }, // an EFOS billed the client
  { de: 'EFO020202AA1', a: 'MID010101AA1' }, // an EFOS billed a clean intermediary
  { de: 'MID010101AA1', a: 'CLI010101AA1' }, // ...who billed the client
]);

// weightOf is injected: return a base weight in [0,1] for any RFC
const definitivo = new Set(['EFO010101AA1', 'EFO020202AA1']);
const weightOf = (rfc: string) => (definitivo.has(rfc) ? 1.0 : 0);

const r = analyzeProximity(graph, 'CLI010101AA1', weightOf, { alpha: 0.5, maxDepth: 3 });
console.log(r.score);                 // 0.5  (direct EFOS at alpha^1)
console.log(r.contributions[0].camino); // ['CLI010101AA1', 'EFO010101AA1']
console.log(detectCarousels(graph)); // []
```

Run the bundled synthetic network (20 fictional RFCs) and the full suite:

```bash
pnpm install
pnpm test
```

## Sanity Check on the Worked Example

The demo graph ([`src/demo/synthetic.ts`](./src/demo/synthetic.ts)) hides four Definitivo EFOS at increasing depth behind `CLI010101AA1`, plus a Presunto and a Desvirtuado direct supplier. With $\alpha = 0.5$, `maxDepth = 3`, the contributions are pure powers of one half:

| EFOS         | situacion   | $d$ | $w\cdot\alpha^{d}$          | score |
|--------------|-------------|-----|-----------------------------|-------|
| EFO010101AA1 | Definitivo  | 1   | $1.0 \cdot 0.5$             | 0.5   |
| PRE010101AA1 | Presunto    | 1   | $0.6 \cdot 0.5$             | 0.3   |
| EFO020202AA1 | Definitivo  | 2   | $1.0 \cdot 0.5^2$           | 0.25  |
| EFO030303AA1 | Definitivo  | 3   | $1.0 \cdot 0.5^3$           | 0.125 |
| DES010101AA1 | Desvirtuado | 1   | $0.05 \cdot 0.5$            | 0.025 |

So $\text{riesgo}(\text{CLIENTE}) = \max = \boxed{0.5}$, from the direct Definitivo. A fourth Definitivo sits **four** hops away and is correctly excluded by the depth cutoff. The carousel `CAR01 -> CAR02 -> CAR03 -> CAR01` is the single detected cycle. Every one of these numbers is asserted in [`test/propagate.test.ts`](./test/propagate.test.ts).

## Repository Layout

```
src/
  parser/lista-69b.ts   parse the official 69-B CSV -> Map<RFC, NodeState>
  risk/weights.ts       situacion -> base weight (normalized 0..1)
  graph/adjacency.ts    RiskGraph: billing edges, both directions indexed
  risk/propagate.ts     analyzeProximity: attenuated max-path BFS
  cycles/carousel.ts    detectCarousels: DFS cycle detection
  demo/synthetic.ts     20-RFC fictional network + hand-computed truth
docs/math/              the write-ups behind each choice
test/                   the sanity checks as executable assertions
```

## API

- `buildGraph(edges)` / `new RiskGraph().addEdge(de, a)` - build the billing graph.
- `analyzeProximity(graph, rootRfc, weightOf, { alpha?, maxDepth? })` - `{ score, contributions[] }`, each contribution carrying its `distancia`, `score`, and explaining `camino`.
- `detectCarousels(graph)` - the distinct billing cycles.
- `parseLista69B(csv)` + `weightResolverFrom(list)` - build a `weightOf` from the official CSV (for standalone use; a product with its own 69-B store injects `weightOf` directly).

## Notes

- **Complexity** is $O(V + E)$ for both the BFS and the DFS - each node and edge is touched a constant number of times ([`docs/math/complexity.md`](./docs/math/complexity.md)). At ~14,000 listed nodes the list fits in memory with no database.
- The base-weight ratios mirror the `BLACKLIST` band of the composite fiscal-risk engine they feed, so the graph score and the composite score never contradict each other.
- The engine is **edge-agnostic and side-effect free**: no I/O, no network, no knowledge of CFDIs. That is what makes it safe to open source.

## License

MIT.
