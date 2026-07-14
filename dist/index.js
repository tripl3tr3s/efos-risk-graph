/**
 * efos-risk-graph - open-source fiscal-risk propagation for SAT Art. 69-B.
 *
 * The engine has no opinion about where billing edges come from: you build
 * a {@link RiskGraph}, hand it a {@link WeightResolver}, and it propagates
 * blacklist risk with per-level attenuation and finds invoicing carousels.
 * That separation is the open-core seam - public engine, private edges.
 *
 * @module efos-risk-graph
 */
export { BASE_WEIGHTS, baseWeightFor, normalizeSituacion } from './risk/weights.js';
export { RiskGraph, buildGraph, normalizeRfc } from './graph/adjacency.js';
export { analyzeProximity } from './risk/propagate.js';
export { detectCarousels } from './cycles/carousel.js';
export { parseLista69B, weightResolverFrom } from './parser/lista-69b.js';
//# sourceMappingURL=index.js.map