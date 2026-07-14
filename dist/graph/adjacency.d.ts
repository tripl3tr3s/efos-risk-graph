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
export declare function normalizeRfc(rfc: RFC): RFC;
export declare class RiskGraph {
    /** from -> receptors it billed. */
    private readonly outEdges;
    /** to -> emisores that billed it (the supplier direction). */
    private readonly inEdges;
    /** Adds a directed billing edge `de -> a` (emisor -> receptor). Idempotent. */
    addEdge(de: RFC, a: RFC): this;
    /** Bulk-loads billing edges. */
    addEdges(edges: Iterable<{
        de: RFC;
        a: RFC;
    }>): this;
    /** Receptors that `rfc` billed (out-neighbors). */
    receptores(rfc: RFC): ReadonlySet<RFC>;
    /** Emisores that billed `rfc` (in-neighbors; the supplier direction). */
    proveedores(rfc: RFC): ReadonlySet<RFC>;
    /** Every node that appears as an emisor or receptor. */
    nodes(): ReadonlySet<RFC>;
    /** Number of distinct nodes. */
    get nodeCount(): number;
    /** Number of directed edges. */
    get edgeCount(): number;
    private link;
}
/** Builds a {@link RiskGraph} from a list of billing edges. */
export declare function buildGraph(edges: Iterable<{
    de: RFC;
    a: RFC;
}>): RiskGraph;
//# sourceMappingURL=adjacency.d.ts.map