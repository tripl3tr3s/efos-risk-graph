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
/** Canonical base weight for each 69-B situation. */
export const BASE_WEIGHTS = {
    Definitivo: 1.0,
    Presunto: 0.6,
    Desvirtuado: 0.05,
    'Sentencia Favorable': 0,
};
/** Base weight for a situation; `0` for a missing/unlisted RFC. */
export function baseWeightFor(situacion) {
    if (!situacion)
        return 0;
    return BASE_WEIGHTS[situacion] ?? 0;
}
/**
 * Maps a raw situation string from the official CSV (any casing/accents)
 * onto the canonical {@link Situacion69B}, or `null` when unrecognized.
 */
export function normalizeSituacion(raw) {
    const s = raw
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
        .toLowerCase();
    if (s.startsWith('definitiv'))
        return 'Definitivo';
    if (s.startsWith('presunt'))
        return 'Presunto';
    if (s.startsWith('desvirtu'))
        return 'Desvirtuado';
    if (s.includes('sentencia') && s.includes('favorable'))
        return 'Sentencia Favorable';
    return null;
}
//# sourceMappingURL=weights.js.map