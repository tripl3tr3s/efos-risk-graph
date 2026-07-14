/**
 * Carousel (invoicing-cycle) detection via depth-first search.
 *
 * A billing cycle `A -> B -> C -> A` is the classic simulated-invoicing
 * carousel: value circulates and returns to its origin. We colour nodes
 * white/grey/black during DFS over the billing direction; a back-edge to
 * a grey node closes a cycle, which we slice off the active path.
 *
 * Cycles are de-duplicated by rotation (the same ring reached from a
 * different start is reported once).
 *
 * @module cycles/carousel
 */
import type { RFC } from '../types.js';
import type { RiskGraph } from '../graph/adjacency.js';
/**
 * Returns every distinct billing carousel in the graph. Each cycle is an
 * ordered ring of RFCs `[A, B, C]` meaning `A -> B -> C -> A`.
 */
export declare function detectCarousels(graph: RiskGraph): RFC[][];
//# sourceMappingURL=carousel.d.ts.map