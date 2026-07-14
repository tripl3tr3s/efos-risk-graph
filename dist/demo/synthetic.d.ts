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
import type { RFC, Situacion69B, WeightResolver } from '../types.js';
import { type RiskGraph } from '../graph/adjacency.js';
/** The client under analysis. */
export declare const DEMO_ROOT: RFC;
/** Only the listed RFCs; everything else is unlisted (weight 0). */
export declare const DEMO_SITUATIONS: Readonly<Record<RFC, Situacion69B>>;
/** Directed billing edges: `de` (emisor) billed `a` (receptor). */
export declare const DEMO_EDGES: ReadonlyArray<{
    de: RFC;
    a: RFC;
}>;
/** Weight resolver backed by {@link DEMO_SITUATIONS}. */
export declare const demoWeightOf: WeightResolver;
/** Builds the demo graph. */
export declare function buildDemoGraph(): RiskGraph;
/**
 * The expected `analyzeProximity(root, alpha=0.5, maxDepth=3)` output,
 * computed by hand - the ground truth for the README sanity check.
 */
export declare const DEMO_EXPECTED: {
    readonly alpha: 0.5;
    readonly maxDepth: 3;
    readonly score: 0.5;
    readonly contributions: readonly [{
        readonly rfc: "EFO010101AA1";
        readonly distancia: 1;
        readonly score: 0.5;
    }, {
        readonly rfc: "PRE010101AA1";
        readonly distancia: 1;
        readonly score: 0.3;
    }, {
        readonly rfc: "EFO020202AA1";
        readonly distancia: 2;
        readonly score: 0.25;
    }, {
        readonly rfc: "EFO030303AA1";
        readonly distancia: 3;
        readonly score: 0.125;
    }, {
        readonly rfc: "DES010101AA1";
        readonly distancia: 1;
        readonly score: 0.025;
    }];
    readonly carousels: readonly [readonly ["CAR010101AA1", "CAR020202AA1", "CAR030303AA1"]];
};
//# sourceMappingURL=synthetic.d.ts.map