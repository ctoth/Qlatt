import { isPlainObject } from "../yaml-loader";

/**
 * A tiny local declarative combinator core for the *pure-structure* validation
 * of declarative-frontend specs (lowering-spec data tables, string_sets, maps,
 * syllabification). It replaces the hand-rolled `if (!isPlainObject(x)) push...`
 * / nested `for (Object.entries)` scaffolding with composable schema nodes.
 *
 * Design constraint: byte-identical diagnostics. The combinators own only the
 * control flow (type dispatch, descent, iteration, optional/required); every
 * error CODE and MESSAGE is supplied verbatim by the caller (as a literal or a
 * path/key factory). This is deliberately NOT a general validator: the
 * cross-reference / topology / CEL / policy / critical-literal checks stay
 * imperative in validation.ts — that is the bespoke explainability core.
 *
 * No new runtime dependency (no zod): this is ~90 lines of local code.
 */

export type StructDiagnostic = {
  code: string;
  message: string;
  path: string;
  severity: "error" | "warning";
};

export type Sink = StructDiagnostic[];

/** A schema node: validate `value` sitting at `path`, pushing diagnostics. */
export type Schema = (value: unknown, path: string, sink: Sink) => void;

/** Message resolvable from the current path (dynamic record entries need this). */
export type Msg = string | ((path: string) => string);

function resolveMsg(msg: Msg, path: string): string {
  return typeof msg === "function" ? msg(path) : msg;
}

function fail(sink: Sink, code: string, message: string, path: string): void {
  sink.push({ code, message, path, severity: "error" });
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// ---- leaf schemas ---------------------------------------------------------

export function boolean(code: string, message: Msg): Schema {
  return (value, path, sink) => {
    if (typeof value !== "boolean") fail(sink, code, resolveMsg(message, path), path);
  };
}

export function finiteNumber(code: string, message: Msg): Schema {
  return (value, path, sink) => {
    if (!isFiniteNumber(value)) fail(sink, code, resolveMsg(message, path), path);
  };
}

export function nonEmptyString(code: string, message: Msg): Schema {
  return (value, path, sink) => {
    if (typeof value !== "string" || value.length === 0) {
      fail(sink, code, resolveMsg(message, path), path);
    }
  };
}

export function enumOf(values: readonly unknown[], code: string, message: Msg): Schema {
  return (value, path, sink) => {
    if (!values.includes(value)) fail(sink, code, resolveMsg(message, path), path);
  };
}

/**
 * An array whose elements are each validated by `element(index)` at path
 * `${path}[${i}]`. `notArray` fires (with `code`) when the value is not an array.
 */
export function array(opts: {
  code: string;
  notArray: Msg;
  element: (index: number) => Schema;
}): Schema {
  return (value, path, sink) => {
    if (!Array.isArray(value)) {
      fail(sink, opts.code, resolveMsg(opts.notArray, path), path);
      return;
    }
    for (let i = 0; i < value.length; i += 1) {
      opts.element(i)(value[i], `${path}[${i}]`, sink);
    }
  };
}

// ---- composite schemas ----------------------------------------------------

export type Field = {
  key: string;
  schema: Schema;
  /**
   * if true, skip the field entirely when its value is `undefined` (absent or
   * explicitly undefined). Otherwise the field's schema always runs — passing
   * `undefined` for an absent key, so the leaf reports its own "missing" message.
   */
  optional?: boolean;
};

/**
 * An object with a known set of fields. `notObject` fires (with `code`) when the
 * value is not a plain object. `refine` is the `.superRefine`-style hook for
 * checks that span multiple fields (kept minimal, still declarative call-site).
 */
export function object(opts: {
  code: string;
  notObject: Msg;
  fields: Field[];
  refine?: (obj: Record<string, unknown>, path: string, sink: Sink) => void;
}): Schema {
  return (value, path, sink) => {
    if (!isPlainObject(value)) {
      fail(sink, opts.code, resolveMsg(opts.notObject, path), path);
      return;
    }
    const obj = value as Record<string, unknown>;
    for (const field of opts.fields) {
      const fieldValue = obj[field.key];
      if (field.optional && fieldValue === undefined) continue;
      field.schema(fieldValue, `${path}.${field.key}`, sink);
    }
    opts.refine?.(obj, path, sink);
  };
}

/**
 * A homogeneous `Record<string, T>` table. `notObject` fires when the value is
 * not a plain object. Each entry's value is validated by `value(key)` at path
 * `${path}.${key}`; `keyCheck` (optional) validates the key itself in place
 * (e.g. an enum on the key) without stopping value descent.
 */
export function record(opts: {
  code: string;
  notObject: Msg;
  value: (key: string) => Schema;
  /** validate the key in place; return `false` to skip value descent for it */
  keyCheck?: (key: string, keyPath: string, sink: Sink) => boolean | void;
}): Schema {
  return (value, path, sink) => {
    if (!isPlainObject(value)) {
      fail(sink, opts.code, resolveMsg(opts.notObject, path), path);
      return;
    }
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const entryPath = `${path}.${key}`;
      if (opts.keyCheck && opts.keyCheck(key, entryPath, sink) === false) continue;
      opts.value(key)(entry, entryPath, sink);
    }
  };
}

/** Skip when the value is `undefined`; otherwise defer to `inner`. */
export function optional(inner: Schema): Schema {
  return (value, path, sink) => {
    if (value === undefined) return;
    inner(value, path, sink);
  };
}
