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
import { baseWeightFor, normalizeSituacion } from '../risk/weights.js';
import { normalizeRfc } from '../graph/adjacency.js';

/** Splits one CSV line into fields, honoring double-quoted values. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

/** Accent- and case-insensitive header match. */
function headerMatches(header: string, needle: string): boolean {
  const norm = header
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
  return norm.includes(needle);
}

/**
 * Parses the official 69-B CSV into a `Map<RFC, NodeState>`.
 *
 * Rows whose RFC is empty or whose situation is unrecognized are skipped.
 * When the same RFC appears more than once, the row with the higher base
 * weight wins (a Definitivo entry outranks a stale Presunto one).
 */
export function parseLista69B(csv: string): Map<RFC, NodeState> {
  const lines = csv.split(/\r?\n/);
  const result = new Map<RFC, NodeState>();

  let rfcCol = -1;
  let situacionCol = -1;
  let headerFound = false;

  for (const line of lines) {
    if (line.trim() === '') continue;
    const fields = splitCsvLine(line);

    if (!headerFound) {
      const rfcIdx = fields.findIndex((h) => headerMatches(h, 'rfc'));
      if (rfcIdx !== -1) {
        rfcCol = rfcIdx;
        situacionCol = fields.findIndex((h) => headerMatches(h, 'situaci'));
        headerFound = true;
      }
      continue;
    }

    const rawRfc = fields[rfcCol]?.trim();
    if (!rawRfc) continue;
    const situacion = situacionCol >= 0 ? normalizeSituacion(fields[situacionCol] ?? '') : null;
    if (!situacion) continue;

    const rfc = normalizeRfc(rawRfc);
    const baseWeight = baseWeightFor(situacion);
    const existing = result.get(rfc);
    if (!existing || baseWeight > existing.baseWeight) {
      result.set(rfc, { rfc, situacion, baseWeight });
    }
  }

  return result;
}

/**
 * Convenience: turns a parsed 69-B map into a `WeightResolver` suitable for
 * {@link analyzeProximity}.
 */
export function weightResolverFrom(list: ReadonlyMap<RFC, NodeState>) {
  return (rfc: RFC): number => list.get(normalizeRfc(rfc))?.baseWeight ?? 0;
}
