/** Migration evidence for #38: run before replacing the legacy dispatcher. */
import { writeFileSync } from "node:fs";
import { createServer } from "vite";

const inputs = [
  "",
  "Hello, world!",
  "can't John's dogs'",
  "Dr. Smith, MR. Jones and Mrs. Doe.",
  "xdr. dr.foo dr.. Dr. DR.",
  "U.S.A. U.S. e.g. A.B.C",
  "“Hello”—‘world’…",
  "foo/bar foo-bar foo_bar 😀 café",
  "0 13 20 42 100 123 1000 1001 1000000 999999999 1000000000",
  "0th 1st 20th 21st 100th 121st 1000th 1001st",
  "$1 $2 $0 $0.00 $0.01 $1.00 $1.01 $2.1 $1234 $1,234.56 $999999999 $1000000000",
  "00:00 12:00 23:05 1:05 pm 13:30 a.m. 12:30 p.m. 24:00 12:60 1:5",
  "1/2/2020 2020-01-02 13/2/2020 2020-02-31 2020-00-01",
  "1900 1905 1984 2000 2005 0100",
  "0.05 1,234.05 1234.56 1/2 2/2 3/4 1/100 1/101 01/2 1/02 3/4%",
];
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { normalizeText } = await server.ssrLoadModule("/src/tts-frontend.ts");
  const rows = ["qlatt-english", "dectalk-english", "qlatt-beauty"].flatMap((frontend) =>
    inputs.map((input) => ({ frontend, input, expected: normalizeText(input, frontend) })),
  );
  writeFileSync("test/fixtures/normalization-baseline.json", JSON.stringify(rows, null, 2) + "\n");
} finally {
  await server.close();
}
