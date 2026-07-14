/**
 * Parser for the official SAT Art. 69-B list ("Listado Completo 69-B").
 *
 * The published CSV carries a short preamble before the real header row,
 * uses accented Spanish column names, and quotes fields that contain
 * commas. This parser is tolerant: it locates the header by looking for
 * an `RFC` column, then reads the RFC and situation of every data row and
 * assigns each a normalized base weight.
 *
 * NOTE: this parser exists for open-source, standalone consumers. Inside
 * DISAI's sat-mcp the 69-B data already lives in an auto-refreshed SQLite
 * store, so that server injects weights directly and never calls this.
 *
 * @module parser/lista-69b
 */
import type { NodeState, RFC } from '../types.js';
/**
 * Parses the official 69-B CSV into a `Map<RFC, NodeState>`.
 *
 * Rows whose RFC is empty or whose situation is unrecognized are skipped.
 * When the same RFC appears more than once, the row with the higher base
 * weight wins (a Definitivo entry outranks a stale Presunto one).
 */
export declare function parseLista69B(csv: string): Map<RFC, NodeState>;
/**
 * Convenience: turns a parsed 69-B map into a `WeightResolver` suitable for
 * {@link analyzeProximity}.
 */
export declare function weightResolverFrom(list: ReadonlyMap<RFC, NodeState>): (rfc: RFC) => number;
//# sourceMappingURL=lista-69b.d.ts.map