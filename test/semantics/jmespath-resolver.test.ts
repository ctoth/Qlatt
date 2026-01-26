import { describe, it, expect } from 'vitest';
import { createJmespathResolver } from '../../src/semantics/jmespath-resolver.js';

describe('JMESPath Resolver', () => {
  it('resolves simple path', () => {
    const resolver = createJmespathResolver();
    expect(resolver.resolve('params.x', { params: { x: 42 }, constants: {} })).toBe(42);
  });

  it('resolves nested path', () => {
    const resolver = createJmespathResolver();
    const context = { params: {}, constants: { ndb: { A1: -58, A2: -65 } } };
    expect(resolver.resolve('constants.ndb.A1', context)).toBe(-58);
  });
});
