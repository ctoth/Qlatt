import { textToKlattTrack } from '../src/tts-frontend';

const testWords = [
  "hello", "world", "the", "cat", "sat", "dog",
  "she", "fish", "think", "this", "church", "judge",
  "man", "king", "sing", "happy", "about", "water"
];

const expected: Record<string, string> = {
  "hello": "HH EH L OW",
  "world": "W ER L D",
  "the": "DH AH",
  "cat": "K AE T",
  "sat": "S AE T",
  "dog": "D AO G",
  "she": "SH IY",
  "fish": "F IH SH",
  "think": "TH IH NG K",
  "this": "DH IH S",
  "church": "CH ER CH",
  "judge": "JH AH JH",
  "man": "M AE N",
  "king": "K IH NG",
  "sing": "S IH NG",
  "happy": "HH AE P IY",
  "about": "AH B AW T",
  "water": "W AO T ER"
};

let correct = 0;
let total = testWords.length;

for (const word of testWords) {
  const frames = textToKlattTrack(word + ".", 110, 30, { frontendId: "dectalk-english" });
  const phonemes: string[] = [];
  let lastPhoneme = "";
  for (const frame of frames) {
    const ph = (frame as any).phoneme;
    if (ph && ph !== lastPhoneme && ph !== "SIL") {
      // Strip stress digits for comparison
      phonemes.push(ph.replace(/[012]$/, ""));
      lastPhoneme = ph;
    }
  }
  const actual = phonemes.join(" ");
  const exp = expected[word] || "?";
  const match = actual === exp ? "OK" : "WRONG";
  if (match === "OK") correct++;
  console.log(`${word}: ${actual} (expected: ${exp}) ${match}`);
}

console.log(`\n${correct}/${total} correct`);
