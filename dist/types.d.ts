/**
 * Core types for the EFOS/EDOS fiscal-risk graph engine.
 *
 * A node is an RFC. A directed edge `A -> B` means "A billed B"
 * (A is the emisor, B is the receptor of a CFDI). The four SAT
 * Art. 69-B situations are the only node property the public engine
 * knows about; the edges themselves are supplied by the caller and
 * never live inside this package.
 *
 * @module types
 */
/** A Mexican tax id. Persona moral = 12 chars, persona fisica = 13. */
export type RFC = string;
/**
 * The four states a taxpayer can hold on the SAT Art. 69-B list.
 * `Presunto` and `Definitivo` are active risk; `Desvirtuado` and
 * `Sentencia Favorable` are cleared/historical.
 */
export type Situacion69B = 'Presunto' | 'Definitivo' | 'Desvirtuado' | 'Sentencia Favorable';
/** A parsed 69-B record: the RFC, its situation, and its normalized base weight. */
export interface NodeState {
    readonly rfc: RFC;
    readonly situacion: Situacion69B;
    /** Base risk weight in [0, 1], derived from `situacion`. */
    readonly baseWeight: number;
}
/**
 * Resolves the base risk weight of any RFC. Injected by the caller so
 * the engine never has to own the 69-B data. Returns a value in [0, 1];
 * `0` for RFCs that are not on the list.
 */
export type WeightResolver = (rfc: RFC) => number;
/** One EFOS node reachable from the root, with the chain that explains it. */
export interface RiskContribution {
    /** The listed RFC that is the source of this risk. */
    readonly rfc: RFC;
    /** Hops from the root along the supplier direction. */
    readonly distancia: number;
    /** `baseWeight(rfc) * alpha^distancia`. */
    readonly score: number;
    /** The shortest chain `[root, ..., rfc]` that carries the risk. */
    readonly camino: readonly RFC[];
}
/** Result of propagating risk to a single root RFC. */
export interface ProximityResult {
    /** The analyzed root RFC. */
    readonly rfc: RFC;
    /** The root's overall risk: the maximum contribution score (0 if none). */
    readonly score: number;
    /** Every reachable EFOS contribution, sorted by score descending. */
    readonly contributions: readonly RiskContribution[];
}
/** Tuning for {@link analyzeProximity}. */
export interface PropagateOptions {
    /** Per-level attenuation factor in (0, 1). Default `0.5`. */
    readonly alpha?: number;
    /** BFS depth cutoff (see the geometric-convergence note). Default `3`. */
    readonly maxDepth?: number;
}
//# sourceMappingURL=types.d.ts.map