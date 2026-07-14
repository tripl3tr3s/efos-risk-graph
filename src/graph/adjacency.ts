/**
 * Directed graph of billing relationships, stored as adjacency sets.
 *
 * Edge direction is the billing direction: `A -> B` means "A billed B"
 * (A emisor, B receptor). Risk therefore flows *along* edges (from a
 * listed emisor down to whoever deducted its invoices), so proximity
 * analysis for a client walks the *reverse* direction - its suppliers.
 *
 * Both directions are indexed so neither traversal costs more than O(1)
 * per neighbor lookup.
 *
 * @module graph/adjacency
 */

import type { RFC } from '../types.js';

/** Uppercases and trims an RFC so `abc010101aa1` and `ABC010101AA1 ` unify. */
export function normalizeRfc(rfc: RFC): RFC {
  return rfc.trim().toUpperCase();
}

const EMPTY: ReadonlySet<RFC> = new Set<RFC>();

export class RiskGraph {
  /** from -> receptors it billed. */
  private readonly outEdges = new Map<RFC, Set<RFC>>();
  /** to -> emisores that billed it (the supplier direction). */
  private readonly inEdges = new Map<RFC, Set<RFC>>();

  /** Adds a directed billing edge `de -> a` (emisor -> receptor). Idempotent. */
  addEdge(de: RFC, a: RFC): this {
    const from = normalizeRfc(de);
    const to = normalizeRfc(a);
    if (from === to) return this; // ignore self-loops at the storage layer
    this.link(this.outEdges, from, to);
    this.link(this.inEdges, to, from);
    return this;
  }

  /** Bulk-loads billing edges. */
  addEdges(edges: Iterable<{ de: RFC; a: RFC }>): this {
    for (const { de, a } of edges) this.addEdge(de, a);
    return this;
  }

  /** Receptors that `rfc` billed (out-neighbors). */
  receptores(rfc: RFC): ReadonlySet<RFC> {
    return this.outEdges.get(normalizeRfc(rfc)) ?? EMPTY;
  }

  /** Emisores that billed `rfc` (in-neighbors; the supplier direction). */
  proveedores(rfc: RFC): ReadonlySet<RFC> {
    return this.inEdges.get(normalizeRfc(rfc)) ?? EMPTY;
  }

  /** Every node that appears as an emisor or receptor. */
  nodes(): ReadonlySet<RFC> {
    const all = new Set<RFC>();
    for (const k of this.outEdges.keys()) all.add(k);
    for (const k of this.inEdges.keys()) all.add(k);
    return all;
  }

  /** Number of distinct nodes. */
  get nodeCount(): number {
    return this.nodes().size;
  }

  /** Number of directed edges. */
  get edgeCount(): number {
    let n = 0;
    for (const set of this.outEdges.values()) n += set.size;
    return n;
  }

  private link(index: Map<RFC, Set<RFC>>, key: RFC, value: RFC): void {
    const set = index.get(key);
    if (set) set.add(value);
    else index.set(key, new Set([value]));
  }
}

/** Builds a {@link RiskGraph} from a list of billing edges. */
export function buildGraph(edges: Iterable<{ de: RFC; a: RFC }>): RiskGraph {
  return new RiskGraph().addEdges(edges);
}
