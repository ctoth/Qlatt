import { evaluate } from "cel-js";

type Token = {
  id: string;
  name: string;
  f: Record<string, string>;
  s: Record<string, number>;
  parent?: Token | null;
  assoc?: Record<string, Token[]>;
  _index: number;
};

const stream: Token[] = [];
const mk = (id: string, name: string, manner: string, backness: string): Token => {
  const token: Token = {
    id,
    name,
    f: { manner, backness },
    s: {},
    assoc: {},
    _index: stream.length,
  };
  stream.push(token);
  return token;
};

const kcl = mk("t1", "K_CL", "stop", "back");
const rel = mk("t2", "K_REL", "release", "back");
const vowel = mk("t3", "AE", "vowel", "front");

const syll = mk("s1", "syll", "span", "");
vowel.parent = syll;

const tone = mk("tone1", "H", "tone", "");
vowel.assoc = { tone: [tone] };

const parent = (token: Token, _stream: string): Token | null => token.parent ?? null;
const following = (token: Token, kind: string): Token | null => {
  for (let i = token._index + 1; i < stream.length; i += 1) {
    const next = stream[i];
    if (next.f.manner === kind) return next;
  }
  return null;
};
const assoc = (token: Token, name: string): Token[] => token.assoc?.[name] ?? [];

const env = {
  current: kcl,
};

const functions = {
  parent,
  following,
  assoc,
};

const receiverExpressions = [
  `current.following("vowel").f.backness`,
  `current.following("vowel") == null ? false : current.following("vowel").f.manner == "vowel"`,
  `size(current.following("vowel").assoc("tone"))`,
];

const globalExpressions = [
  `following(current, "vowel").f.backness`,
  `following(current, "vowel") == null ? false : following(current, "vowel").f.manner == "vowel"`,
  `size(assoc(following(current, "vowel"), "tone"))`,
];

for (const src of receiverExpressions) {
  try {
    const result = evaluate(src, env, functions);
    console.log(`[receiver] ${src} =>`, result);
  } catch (err) {
    console.log(`[receiver] ${src} => error`, err);
  }
}

for (const src of globalExpressions) {
  try {
    const result = evaluate(src, env, functions);
    console.log(`[global]   ${src} =>`, result);
  } catch (err) {
    console.log(`[global]   ${src} => error`, err);
  }
}

try {
  const result = evaluate(
    `cel.bind(f2, following(current, "vowel").f.backness == "front" ? 1200 : 1900, f2)`,
    env,
    functions
  );
  console.log("[bind] cel.bind =>", result);
} catch (err) {
  console.log("[bind] cel.bind => error", err);
}

const orphan = rel;
try {
  const result = evaluate(
    `parent(current, "syllable") == null ? "none" : parent(current, "syllable").f.stress`,
    { current: orphan },
    functions
  );
  console.log("orphan parent =>", result);
} catch (err) {
  console.log("orphan parent => error", err);
}
