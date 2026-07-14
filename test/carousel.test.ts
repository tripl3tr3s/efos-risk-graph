import { describe, it, expect } from 'vitest';
import { detectCarousels, buildGraph } from '../src/index.js';
import { buildDemoGraph, DEMO_EXPECTED } from '../src/demo/synthetic.js';

describe('detectCarousels', () => {
  it('finds the single carousel in the demo graph, rotated to canonical form', () => {
    expect(detectCarousels(buildDemoGraph())).toEqual(DEMO_EXPECTED.carousels);
  });

  it('reports a ring once regardless of entry node', () => {
    const g = buildGraph([
      { de: 'BBB010101BB1', a: 'CCC010101CC1' },
      { de: 'CCC010101CC1', a: 'AAA010101AA1' },
      { de: 'AAA010101AA1', a: 'BBB010101BB1' },
    ]);
    expect(detectCarousels(g)).toEqual([
      ['AAA010101AA1', 'BBB010101BB1', 'CCC010101CC1'],
    ]);
  });

  it('returns no cycles for an acyclic graph', () => {
    const g = buildGraph([
      { de: 'AAA010101AA1', a: 'BBB010101BB1' },
      { de: 'BBB010101BB1', a: 'CCC010101CC1' },
    ]);
    expect(detectCarousels(g)).toEqual([]);
  });
});
