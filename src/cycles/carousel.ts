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

const WHITE = 0;
const GREY = 1;
const BLACK = 2;

/**
 * Rotates a cycle so it starts at its lexicographically smallest RFC,
 * preserving direction. Makes output deterministic and rotation-invariant
 * regardless of which node the DFS entered the ring from.
 */
function canonicalRotation(cycle: readonly RFC[]): RFC[] {
  let min = 0;
  for (let i = 1; i < cycle.length; i++) {
    if (cycle[i] < cycle[min]) min = i;
  }
  return [...cycle.slice(min), ...cycle.slice(0, min)];
}

/**
 * Returns every distinct billing carousel in the graph. Each cycle is an
 * ordered ring of RFCs `[A, B, C]` meaning `A -> B -> C -> A`.
 */
export function detectCarousels(graph: RiskGraph): RFC[][] {
  const color = new Map<RFC, number>();
  const stack: RFC[] = [];
  const cycles: RFC[][] = [];
  const seen = new Set<string>();

  const visit = (u: RFC): void => {
    color.set(u, GREY);
    stack.push(u);

    for (const v of graph.receptores(u)) {
      const c = color.get(v) ?? WHITE;
      if (c === GREY) {
        const idx = stack.lastIndexOf(v);
        if (idx !== -1) {
          const cycle = canonicalRotation(stack.slice(idx));
          const key = cycle.join('>');
          if (!seen.has(key)) {
            seen.add(key);
            cycles.push(cycle);
          }
        }
      } else if (c === WHITE) {
        visit(v);
      }
    }

    stack.pop();
    color.set(u, BLACK);
  };

  for (const node of graph.nodes()) {
    if ((color.get(node) ?? WHITE) === WHITE) visit(node);
  }

  return cycles;
}
