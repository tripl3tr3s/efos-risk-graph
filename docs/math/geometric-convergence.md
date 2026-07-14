# Geometric convergence and the depth cutoff

Truncating the BFS at 2 or 3 levels is often treated as a performance hack. It is not: with attenuation it is a quantified approximation whose discarded mass is bounded by the tail of a geometric series.

## The bound

Every base weight satisfies $w(e) \le 1$, so an EFOS at depth $k$ contributes at most $\alpha^{k}$. The worst-case total risk hidden beyond depth $D$ - even if *every* deeper node were a confirmed Definitivo - is bounded by

$$T(D) = \sum_{k=D+1}^{\infty} \alpha^{k} = \alpha^{D+1}\sum_{j=0}^{\infty}\alpha^{j} = \frac{\alpha^{\,D+1}}{1-\alpha}.$$

The sum converges precisely because $0 < \alpha < 1$. Since the engine reports a **max**, the true omission is even smaller than $T(D)$ (a single term, not the sum) - $T(D)$ is a generous upper bound.

## Numbers for $\alpha = 0.5$

$$T(1) = \frac{0.5^{2}}{0.5} = 0.5,\quad T(2) = \frac{0.5^{3}}{0.5} = 0.25,\quad T(3) = \frac{0.5^{4}}{0.5} = 0.125,\quad T(4) = 0.0625.$$

| cutoff $D$ | max score still reachable at $D{+}1$ | tail bound $T(D)$ |
|-----------|--------------------------------------|-------------------|
| 1         | $0.25$                               | $0.5$             |
| 2         | $0.125$                              | $0.25$            |
| 3         | $0.0625$                             | $0.125$           |

A confirmed EFOS four hops away can move the score by at most $0.0625$ - below any reasonable alert threshold. So `maxDepth = 2` or `3` captures essentially all of the risk mass, and the choice of $\alpha$ directly sets how fast that tail collapses.

## Choosing alpha from a target horizon

If you want distance $H$ to be the point where a lone Definitivo drops below a threshold $\tau$, solve $\alpha^{H} \le \tau$:

$$\alpha \le \tau^{1/H}.$$

For $\tau = 0.1$ at $H = 3$: $\alpha \le 0.1^{1/3} \approx 0.464$. That is the formal justification for defaulting to $\alpha = 0.5$ with a depth of 2-3.
