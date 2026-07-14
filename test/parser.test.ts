import { describe, it, expect } from 'vitest';
import { parseLista69B, weightResolverFrom } from '../src/index.js';

// A miniature stand-in for the official CSV: a preamble line, a header with
// accented Spanish names, quoted fields, and one row per situation.
const CSV = [
  'Listado Completo de contribuyentes Art. 69-B CFF',
  '"No.","RFC","Nombre del Contribuyente","Situación del contribuyente"',
  '"1","EFO010101AA1","FARMACEUTICA MEDINA, S.A. DE C.V.","Definitivo"',
  '"2","PRE010101AA1","DISTRIBUIDORA SANITARIA","Presunto"',
  '"3","DES010101AA1","COMERCIALIZADORA XY","Desvirtuado"',
  '"4","SEN010101AA1","SERVICIOS GAMMA","Sentencia Favorable"',
  '"5","","SIN RFC","Definitivo"',
].join('\n');

describe('parseLista69B', () => {
  const list = parseLista69B(CSV);

  it('skips the preamble and reads every valid row', () => {
    expect(list.size).toBe(4); // the empty-RFC row is skipped
  });

  it('classifies situations and assigns base weights', () => {
    expect(list.get('EFO010101AA1')).toMatchObject({
      situacion: 'Definitivo',
      baseWeight: 1.0,
    });
    expect(list.get('PRE010101AA1')?.baseWeight).toBe(0.6);
    expect(list.get('DES010101AA1')?.baseWeight).toBe(0.05);
    expect(list.get('SEN010101AA1')?.baseWeight).toBe(0);
  });

  it('keeps the higher-weight record on duplicate RFCs', () => {
    const dup = parseLista69B(
      [
        '"No.","RFC","Situación del contribuyente"',
        '"1","EFO010101AA1","Presunto"',
        '"2","EFO010101AA1","Definitivo"',
      ].join('\n'),
    );
    expect(dup.get('EFO010101AA1')?.situacion).toBe('Definitivo');
  });

  it('produces a working weight resolver', () => {
    const weightOf = weightResolverFrom(list);
    expect(weightOf('efo010101aa1')).toBe(1.0);
    expect(weightOf('UNLISTED0001')).toBe(0);
  });
});
