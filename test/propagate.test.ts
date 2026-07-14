import { describe, it, expect } from 'vitest';
import { analyzeProximity, buildGraph } from '../src/index.js';
import {
  buildDemoGraph,
  demoWeightOf,
  DEMO_ROOT,
  DEMO_EXPECTED,
} from '../src/demo/synthetic.js';

describe('analyzeProximity - synthetic sanity check', () => {
  const result = analyzeProximity(buildDemoGraph(), DEMO_ROOT, demoWeightOf, {
    alpha: DEMO_EXPECTED.alpha,
    maxDepth: DEMO_EXPECTED.maxDepth,
  });

  it("matches the hand-computed root score (direct Definitivo at alpha^1)", () => {
    expect(result.score).toBe(DEMO_EXPECTED.score);
  });

  it('produces exactly the expected contributions, sorted by score', () => {
    const got = result.contributions.map((c) => ({
      rfc: c.rfc,
      distancia: c.distancia,
      score: c.score,
    }));
    expect(got).toEqual(DEMO_EXPECTED.contributions);
  });

  it('explains each contribution with a shortest chain from the root', () => {
    const efo03 = result.contributions.find((c) => c.rfc === 'EFO030303AA1');
    expect(efo03?.camino).toEqual([
      'CLI010101AA1',
      'EFO010101AA1',
      'FAR010101AA1',
      'EFO030303AA1',
    ]);
  });

  it('excludes EFOS beyond maxDepth (the 4-hop Definitivo)', () => {
    expect(result.contributions.some((c) => c.rfc === 'EFO040404AA1')).toBe(false);
  });
});

describe('analyzeProximity - attenuation math', () => {
  const graph = buildGraph([
    { de: 'EFO010101AA1', a: 'CLI010101AA1' }, // dist 1
    { de: 'EFO020202AA1', a: 'EFO010101AA1' }, // dist 2
  ]);
  const allDefinitivo = () => 1.0;

  it('gives alpha at distance 1 and alpha^2 at distance 2', () => {
    const r = analyzeProximity(graph, 'CLI010101AA1', allDefinitivo, {
      alpha: 0.5,
      maxDepth: 3,
    });
    expect(r.contributions.find((c) => c.rfc === 'EFO010101AA1')?.score).toBe(0.5);
    expect(r.contributions.find((c) => c.rfc === 'EFO020202AA1')?.score).toBe(0.25);
  });

  it('returns a zero score with no contributions when nothing is listed', () => {
    const r = analyzeProximity(graph, 'CLI010101AA1', () => 0);
    expect(r.score).toBe(0);
    expect(r.contributions).toHaveLength(0);
  });

  it('applies defaults alpha=0.5 maxDepth=3 when options omitted', () => {
    const r = analyzeProximity(graph, 'CLI010101AA1', allDefinitivo);
    expect(r.score).toBe(0.5);
  });

  it('rejects an out-of-range alpha', () => {
    expect(() =>
      analyzeProximity(graph, 'CLI010101AA1', allDefinitivo, { alpha: 1.5 }),
    ).toThrow();
  });
});
