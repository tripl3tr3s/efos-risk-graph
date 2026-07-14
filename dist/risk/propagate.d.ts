/**
 * Attenuated risk propagation via breadth-first search.
 *
 * From a root RFC we walk the supplier direction (who billed whom) level
 * by level. A listed RFC found `d` hops away contributes
 *
 *     score = baseWeight(rfc) * alpha^d
 *
 * and the root's overall risk is the *maximum* such contribution
 * (a bottleneck / max-plus reading, not a sum): the single worst chain,
 * which stays explainable to an auditor.
 *
 * Because `alpha^d` is strictly decreasing in `d`, an EFOS node's best
 * (largest) contribution is always via its *shortest* path from the root,
 * which is exactly what BFS discovers first - so a plain BFS is optimal.
 *
 * @module risk/propagate
 */
import type { ProximityResult, PropagateOptions, RFC, WeightResolver } from '../types.js';
import { type RiskGraph } from '../graph/adjacency.js';
/**
 * Propagates EFOS/EDOS risk to `rootRfc` across the graph's supplier
 * relationships, attenuating by `alpha` per level up to `maxDepth`.
 *
 * @param graph     billing graph (edges = emisor -> receptor)
 * @param rootRfc   the client under analysis
 * @param weightOf  base weight in [0, 1] for any RFC (0 if unlisted)
 * @param options   `{ alpha = 0.5, maxDepth = 3 }`
 */
export declare function analyzeProximity(graph: RiskGraph, rootRfc: RFC, weightOf: WeightResolver, options?: PropagateOptions): ProximityResult;
//# sourceMappingURL=propagate.d.ts.map