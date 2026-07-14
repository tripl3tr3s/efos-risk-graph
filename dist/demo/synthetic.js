/**
 * A fictional 20-RFC supply network for demos, tests, and the README
 * sanity check. Every RFC here is invented; no real taxpayer data is used.
 *
 * The graph is built so its risk numbers are computable by hand with
 * `alpha = 0.5`, `maxDepth = 3` (see README "Sanity Check"):
 *
 *   CLIENTE's suppliers and their upstreams hide four EFOS. Attenuated
 *   by half per hop, the direct Definitivo dominates at 0.5, and an EFOS
 *   sitting four hops away falls outside the depth cutoff entirely.
 *
 * @module demo/synthetic
 */
import { baseWeightFor } from '../risk/weights.js';
import { buildGraph, normalizeRfc } from '../graph/adjacency.js';
/** The client under analysis. */
export const DEMO_ROOT = 'CLI010101AA1';
/** Only the listed RFCs; everything else is unlisted (weight 0). */
export const DEMO_SITUATIONS = {
    EFO010101AA1: 'Definitivo', // direct supplier of CLIENTE      -> dist 1
    EFO020202AA1: 'Definitivo', // supplier of MID                 -> dist 2
    EFO030303AA1: 'Definitivo', // supplier of FAR                 -> dist 3
    EFO040404AA1: 'Definitivo', // supplier of EFO03               -> dist 4 (cut off)
    PRE010101AA1: 'Presunto', //   direct supplier of CLIENTE      -> dist 1
    DES010101AA1: 'Desvirtuado', // direct supplier of CLIENTE     -> dist 1
};
/** Directed billing edges: `de` (emisor) billed `a` (receptor). */
export const DEMO_EDGES = [
    // suppliers of the client
    { de: 'EFO010101AA1', a: 'CLI010101AA1' },
    { de: 'PRE010101AA1', a: 'CLI010101AA1' },
    { de: 'DES010101AA1', a: 'CLI010101AA1' },
    { de: 'MID010101AA1', a: 'CLI010101AA1' },
    // second level, through the clean intermediary MID
    { de: 'EFO020202AA1', a: 'MID010101AA1' },
    { de: 'LIM010101AA1', a: 'MID010101AA1' },
    // deeper chain behind the direct Definitivo
    { de: 'FAR010101AA1', a: 'EFO010101AA1' },
    { de: 'EFO030303AA1', a: 'FAR010101AA1' },
    { de: 'EFO040404AA1', a: 'EFO030303AA1' }, // dist 4 from the client
    // the client's own customers (downstream; ignored by supplier-direction BFS)
    { de: 'CLI010101AA1', a: 'CUST010101AA1' },
    { de: 'CLI010101AA1', a: 'CUST020202AA1' },
    // clean filler relationships
    { de: 'PRO010101AA1', a: 'CUST010101AA1' },
    { de: 'PRO020202AA1', a: 'LIM010101AA1' },
    { de: 'PRO030303AA1', a: 'FAR010101AA1' },
    { de: 'SER010101AA1', a: 'CUST020202AA1' },
    // an invoicing carousel, disconnected from the client
    { de: 'CAR010101AA1', a: 'CAR020202AA1' },
    { de: 'CAR020202AA1', a: 'CAR030303AA1' },
    { de: 'CAR030303AA1', a: 'CAR010101AA1' },
    { de: 'LOG010101AA1', a: 'CAR010101AA1' },
];
/** Weight resolver backed by {@link DEMO_SITUATIONS}. */
export const demoWeightOf = (rfc) => baseWeightFor(DEMO_SITUATIONS[normalizeRfc(rfc)] ?? null);
/** Builds the demo graph. */
export function buildDemoGraph() {
    return buildGraph(DEMO_EDGES);
}
/**
 * The expected `analyzeProximity(root, alpha=0.5, maxDepth=3)` output,
 * computed by hand - the ground truth for the README sanity check.
 */
export const DEMO_EXPECTED = {
    alpha: 0.5,
    maxDepth: 3,
    score: 0.5,
    contributions: [
        { rfc: 'EFO010101AA1', distancia: 1, score: 0.5 },
        { rfc: 'PRE010101AA1', distancia: 1, score: 0.3 },
        { rfc: 'EFO020202AA1', distancia: 2, score: 0.25 },
        { rfc: 'EFO030303AA1', distancia: 3, score: 0.125 },
        { rfc: 'DES010101AA1', distancia: 1, score: 0.025 },
    ],
    carousels: [['CAR010101AA1', 'CAR020202AA1', 'CAR030303AA1']],
};
//# sourceMappingURL=synthetic.js.map