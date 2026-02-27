/**
 * @marcbachmann/cel-js compatibility patches.
 *
 * This module must be imported (for side effects) before any CEL evaluation.
 * It patches the TypeDeclaration.unify method to allow int/double unification,
 * which is needed because:
 *
 * 1. @marcbachmann/cel-js represents integer literals as BigInt (CEL int)
 * 2. JavaScript numbers from context are CEL double
 * 3. The CEL spec forbids mixing int and double in ternary branches
 * 4. Our expressions freely mix integer literals with number variables
 *    (e.g., `x > 0 ? x : 0` where x is a JS number)
 *
 * Without this patch, every ternary with a literal integer in one branch
 * and a context variable (double) in the other would throw a type error.
 */

import { Environment } from "@marcbachmann/cel-js";

// Obtain the TypeDeclaration prototype by parsing a trivial expression
const _env = new Environment({ unlistedVariablesAreDyn: true });
const _probe = _env.parse("1");
_probe({});
const _intType = (_probe as any).ast?.checkedType;

if (_intType) {
  const proto = Object.getPrototypeOf(_intType);
  const origUnify = proto.unify;

  /**
   * Patched unify: allows int/double/uint numeric type unification.
   * Returns double as the unified type (widest numeric type).
   */
  proto.unify = function (r: any, t2: any) {
    const result = origUnify.call(this, r, t2);
    if (result !== null && result !== undefined) return result;

    const numericNames = new Set(["int", "double", "uint"]);
    if (numericNames.has(this.name) && numericNames.has(t2.name)) {
      // Unify to double (the widest numeric type)
      if (this.name === "double") return this;
      if (t2.name === "double") return t2;
      // int/uint — return the first
      return this;
    }

    return null;
  };
}
