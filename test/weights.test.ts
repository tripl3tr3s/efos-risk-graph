import { describe, it, expect } from 'vitest';
import { BASE_WEIGHTS, baseWeightFor, normalizeSituacion } from '../src/index.js';

describe('weights', () => {
  it('assigns the canonical base weights', () => {
    expect(BASE_WEIGHTS.Definitivo).toBe(1.0);
    expect(BASE_WEIGHTS.Presunto).toBe(0.6);
    expect(BASE_WEIGHTS.Desvirtuado).toBe(0.05);
    expect(BASE_WEIGHTS['Sentencia Favorable']).toBe(0);
  });

  it('returns 0 for missing situations', () => {
    expect(baseWeightFor(null)).toBe(0);
    expect(baseWeightFor(undefined)).toBe(0);
  });

  it('normalizes accented and mixed-case CSV values', () => {
    expect(normalizeSituacion('DEFINITIVO')).toBe('Definitivo');
    expect(normalizeSituacion('Presunto')).toBe('Presunto');
    expect(normalizeSituacion('desvirtuado')).toBe('Desvirtuado');
    expect(normalizeSituacion('Sentencia Favorable')).toBe('Sentencia Favorable');
    expect(normalizeSituacion('  definitivos ')).toBe('Definitivo');
  });

  it('returns null for unknown situations', () => {
    expect(normalizeSituacion('cancelado')).toBeNull();
    expect(normalizeSituacion('')).toBeNull();
  });
});
