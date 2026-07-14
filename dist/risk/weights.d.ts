/**
 * Base risk weights per SAT Art. 69-B situation.
 *
 * The ratios mirror the `BLACKLIST` band already used by the sat-mcp
 * `RiskEngine` (Definitivo 40 / Presunto 28 / Desvirtuado 4), normalized
 * to the unit interval so the graph score and the composite fiscal score
 * tell the same story:
 *
 *   Definitivo          = 1.00   (confirmed EFOS, deductions rejected)
 *   Presunto            = 0.60   (under investigation)
 *   Desvirtuado         = 0.05   (taxpayer disproved the presumption)
 *   Sentencia Favorable = 0.00   (court cleared the taxpayer)
 *   not listed          = 0.00
 *
 * @module risk/weights
 */
import type { Situacion69B } from '../types.js';
/** Canonical base weight for each 69-B situation. */
export declare const BASE_WEIGHTS: Readonly<Record<Situacion69B, number>>;
/** Base weight for a situation; `0` for a missing/unlisted RFC. */
export declare function baseWeightFor(situacion: Situacion69B | null | undefined): number;
/**
 * Maps a raw situation string from the official CSV (any casing/accents)
 * onto the canonical {@link Situacion69B}, or `null` when unrecognized.
 */
export declare function normalizeSituacion(raw: string): Situacion69B | null;
//# sourceMappingURL=weights.d.ts.map