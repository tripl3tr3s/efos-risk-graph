# Correctness of the BFS propagation

We claim that a single breadth-first search, recording each node the first time it is discovered, computes the exact maximum-attenuated risk for every reachable EFOS.

## Setup

Let the root be $r$. Walk the **supplier** direction: `proveedores(u)` is the set of RFCs that billed $u$. For a node $e$ let $d(e)$ be its shortest-path distance from $r$ in that direction, and $w(e) \in [0,1]$ its base weight. Fix $\alpha \in (0,1)$. Define the contribution of an EFOS $e$ reached along a path of length $\ell$ as

$$c(e, \ell) = w(e)\cdot \alpha^{\ell}.$$

The engine reports, per EFOS, the single value $w(e)\cdot\alpha^{d(e)}$, and for the root $\max_e w(e)\cdot\alpha^{d(e)}$.

## Claim 1 - the best path is the shortest path

For a fixed $e$, $c(e,\ell) = w(e)\cdot\alpha^{\ell}$ is strictly decreasing in $\ell$ because $0<\alpha<1$ and $w(e)\ge 0$. Hence

$$\max_{\ell \,:\, \exists \text{ path of length } \ell} c(e,\ell) = c\big(e, d(e)\big),$$

the shortest path. So it suffices to know $d(e)$ - no other path can beat it.

## Claim 2 - BFS computes $d(e)$, by induction on levels

Let $L_k = \{ u : d(u) = k \}$. BFS with a FIFO queue and "mark on first discovery" enqueues nodes in nondecreasing distance order.

- **Base.** $L_0 = \{r\}$; the queue starts as $[r]$ at distance $0$.
- **Step.** Assume every node of $L_0,\dots,L_k$ has been enqueued exactly once with its correct distance, all before any node of $L_{k+1}$. Take $v \in L_{k+1}$. By definition of shortest distance there is $u \in L_k$ with $v \in \text{proveedores}(u)$. When $u$ (distance $k$) is processed, $v$ is either already marked - only possible from another distance-$k$ predecessor, i.e. still distance $k+1$ - or is marked now at distance $k+1$. Either way $v$ is recorded with distance $k+1$, and it cannot have been marked earlier, since that would require a predecessor at distance $< k$, contradicting $d(v)=k+1$.

By induction every reachable node is recorded once with distance $d(\cdot)$.

## Depth cutoff preserves correctness up to the bound

Stopping expansion at `maxDepth = D` (not expanding nodes already at distance $D$) omits exactly the EFOS with $d(e) > D$. By Claim 1 each omitted contribution is at most $\alpha^{D+1}$, and the geometric-tail bound ([geometric-convergence.md](./geometric-convergence.md)) caps their total. Within depth $D$ the result is exact.

## Consequence

Because each EFOS's reported score equals its true maximum over all paths, the root's `max` over those scores equals the true maximum-attenuated risk over all root-to-EFOS paths within the depth budget. $\blacksquare$
