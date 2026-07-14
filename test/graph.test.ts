import { describe, it, expect } from 'vitest';
import { RiskGraph, buildGraph, normalizeRfc } from '../src/index.js';

describe('RiskGraph', () => {
  it('indexes both directions of a billing edge', () => {
    const g = new RiskGraph().addEdge('AAA010101AA1', 'BBB010101BB1');
    expect([...g.receptores('AAA010101AA1')]).toEqual(['BBB010101BB1']);
    expect([...g.proveedores('BBB010101BB1')]).toEqual(['AAA010101AA1']);
    expect(g.proveedores('AAA010101AA1').size).toBe(0);
  });

  it('normalizes RFCs on insertion and lookup', () => {
    const g = new RiskGraph().addEdge(' aaa010101aa1 ', 'bbb010101bb1');
    expect([...g.proveedores('BBB010101BB1')]).toEqual(['AAA010101AA1']);
  });

  it('is idempotent and ignores self-loops', () => {
    const g = new RiskGraph()
      .addEdge('AAA010101AA1', 'BBB010101BB1')
      .addEdge('AAA010101AA1', 'BBB010101BB1')
      .addEdge('CCC010101CC1', 'CCC010101CC1');
    expect(g.edgeCount).toBe(1);
    expect(g.nodeCount).toBe(2);
  });

  it('reports node and edge counts', () => {
    const g = buildGraph([
      { de: 'AAA010101AA1', a: 'BBB010101BB1' },
      { de: 'BBB010101BB1', a: 'CCC010101CC1' },
    ]);
    expect(g.nodeCount).toBe(3);
    expect(g.edgeCount).toBe(2);
  });

  it('normalizeRfc uppercases and trims', () => {
    expect(normalizeRfc(' xax010101000 ')).toBe('XAX010101000');
  });
});
