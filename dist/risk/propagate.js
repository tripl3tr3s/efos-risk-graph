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
import { z } from 'zod';
import { normalizeRfc } from '../graph/adjacency.js';
const OptionsSchema = z.object({
    alpha: z.number().gt(0).lt(1).default(0.5),
    maxDepth: z.number().int().min(1).default(3),
});
/**
 * Propagates EFOS/EDOS risk to `rootRfc` across the graph's supplier
 * relationships, attenuating by `alpha` per level up to `maxDepth`.
 *
 * @param graph     billing graph (edges = emisor -> receptor)
 * @param rootRfc   the client under analysis
 * @param weightOf  base weight in [0, 1] for any RFC (0 if unlisted)
 * @param options   `{ alpha = 0.5, maxDepth = 3 }`
 */
export function analyzeProximity(graph, rootRfc, weightOf, options = {}) {
    const { alpha, maxDepth } = OptionsSchema.parse(options);
    const root = normalizeRfc(rootRfc);
    const visited = new Set([root]);
    const queue = [{ rfc: root, dist: 0, camino: [root] }];
    const contributions = [];
    for (let head = 0; head < queue.length; head++) {
        const node = queue[head];
        if (node.dist >= maxDepth)
            continue;
        for (const proveedor of graph.proveedores(node.rfc)) {
            if (visited.has(proveedor))
                continue; // BFS => first visit is the shortest path
            visited.add(proveedor);
            const dist = node.dist + 1;
            const camino = [...node.camino, proveedor];
            const weight = weightOf(proveedor);
            if (weight > 0) {
                contributions.push({
                    rfc: proveedor,
                    distancia: dist,
                    score: weight * alpha ** dist,
                    camino,
                });
            }
            queue.push({ rfc: proveedor, dist, camino });
        }
    }
    contributions.sort((a, b) => b.score - a.score);
    return {
        rfc: root,
        score: contributions.length > 0 ? contributions[0].score : 0,
        contributions,
    };
}
//# sourceMappingURL=propagate.js.map