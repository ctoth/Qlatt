#!/usr/bin/env node

/**
 * measure-cel-view-cost.ts
 * ========================
 * What it costs cel-js to evaluate an expression over an Item view, by the
 * way the view is made. cel-js reads a value's `constructor` to type it and
 * then the field, on every operator, so every layer between it and the
 * feature is paid several times per expression.
 *
 * Variants (nanoseconds per evaluation of a compiled expression):
 *   two proxies   a Proxy around a Proxy: the rule engine's view before the
 *                 derived names moved into the transaction's proxy
 *   one proxy     hrg/transaction.ts view() today
 *   declared      one proxy, and the variable declared with the view's type
 *   typed fields  a class instance whose type declares every field's type
 *   getters       a class whose prototype has a getter per feature that
 *                 calls a read function (what a view class per Item type
 *                 would be)
 *   plain object  no view at all: the floor
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/measure-cel-view-cost.ts [--count 300000]
 *
 * Do not run it with tsx (see measure-frontend-time.ts).
 */

import { Environment } from "@marcbachmann/cel-js";

const countFlag = process.argv.indexOf("--count");
const COUNT = countFlag >= 0 ? Number(process.argv[countFlag + 1]) : 300000;

class View {}
class TypedView {
  constructor(fields: Record<string, unknown>) {
    Object.assign(this, fields);
  }
}

const FEATURES: Record<string, unknown> = { phoneme: "AE", duration: 120, stress: 1 };
const DERIVED = new Set(["sync_left", "sync_right", "syllable", "word", "parent", "daughters"]);

function oneProxy(): Record<string, unknown> {
  return new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_target, property) =>
        property === "constructor"
          ? View
          : typeof property === "string"
            ? FEATURES[property]
            : undefined,
      has: (_target, property) => typeof property === "string" && property in FEATURES,
      ownKeys: () => Object.keys(FEATURES),
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
    },
  );
}

function twoProxies(): Record<string, unknown> {
  return new Proxy(oneProxy(), {
    get: (target, property, receiver) => {
      if (typeof property === "string" && DERIVED.has(property)) return null;
      return Reflect.get(target, property, receiver);
    },
  });
}

function environment(): Environment {
  const env = new Environment({
    unlistedVariablesAreDyn: true,
    homogeneousAggregateLiterals: false,
    enableOptionalTypes: true,
  });
  env.registerOperator("double + int", (a: number, b: bigint) => a + Number(b));
  env.registerOperator("double * int", (a: number, b: bigint) => a * Number(b));
  env.registerOperator("double == int", (a: number, b: bigint) => a === Number(b));
  env.registerFunction(
    "get(dyn, dyn, dyn): dyn",
    (object: Record<string, unknown> | null, key: string, fallback: unknown) =>
      object?.[key] ?? fallback,
  );
  return env;
}

type Variant = () => { env: Environment; current: unknown };

const VARIANTS: Record<string, Variant> = {
  "two proxies": () => {
    const env = environment();
    env.registerType("ItemView", View);
    return { env, current: twoProxies() };
  },
  "one proxy": () => {
    const env = environment();
    env.registerType("ItemView", View);
    return { env, current: oneProxy() };
  },
  declared: () => {
    const env = environment();
    env.registerType("ItemView", View);
    env.registerVariable("current", "ItemView");
    return { env, current: oneProxy() };
  },
  "typed fields": () => {
    const env = environment();
    env.registerType("Segment", {
      ctor: TypedView,
      fields: { phoneme: "string", duration: "double", stress: "double" },
    });
    env.registerVariable("current", "Segment");
    return { env, current: new TypedView(FEATURES) };
  },
  getters: () => {
    const env = environment();
    const read = (key: string): unknown => FEATURES[key];
    class GetterView {}
    for (const key of Object.keys(FEATURES)) {
      Object.defineProperty(GetterView.prototype, key, {
        get: () => read(key),
        enumerable: true,
      });
    }
    env.registerType("ItemView", GetterView);
    return { env, current: new GetterView() };
  },
  "plain object": () => ({ env: environment(), current: { ...FEATURES } }),
};

const EXPRESSIONS = [
  "current.phoneme == 'AE'",
  "current.phoneme == 'AE' && current.duration > 100.0",
  "current.duration * 1.2 + 5.0",
  "current.duration * params.k",
  "get(current, 'duration', 0.0) > 100.0",
  "current.stress == 1.0 ? current.duration * 1.3 : current.duration",
];

const names = Object.keys(VARIANTS);
console.log(`ns per evaluation, ${COUNT} evaluations each`);
console.log(`${names.map((name) => name.padStart(13)).join("")}  expression`);
for (const expression of EXPRESSIONS) {
  const cells: string[] = [];
  for (const name of names) {
    const { env, current } = (VARIANTS[name] as Variant)();
    const context = { current, params: { k: 1.2 } };
    try {
      const compiled = env.parse(expression);
      for (let index = 0; index < 20000; index += 1) compiled(context);
      const start = performance.now();
      for (let index = 0; index < COUNT; index += 1) compiled(context);
      cells.push((((performance.now() - start) * 1e6) / COUNT).toFixed(0).padStart(13));
    } catch {
      cells.push("error".padStart(13));
    }
  }
  console.log(`${cells.join("")}  ${expression}`);
}
