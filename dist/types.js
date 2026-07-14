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
export {};
//# sourceMappingURL=types.js.map