// test/harness/speak-request.js — what a Speak click asks the frontend for

/**
 * The "Base F0" box as a request: a number only when the user has entered
 * one. Empty (the box's starting state) is no request, so the frontend uses
 * the selected voice's own base F0 (its speaker policy and voice registry);
 * a number here replaces it for every voice.
 */
export function readBaseF0(doc) {
  const raw = String(doc.getElementById("baseF0")?.value ?? "").trim();
  if (raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * The arguments of textToKlattTrack() for the page's controls. `speaker` is
 * the selected voice's name, or null when the frontend has no voice registry.
 */
export function readSpeakRequest(doc, speaker) {
  const options = {
    // A multiplier of the frontend's own speaking rate; 1 leaves it alone.
    rate: Number(doc.getElementById("rate").value) || 1.0,
    frontendId: doc.getElementById("frontendSelect")?.value || "qlatt-english",
  };
  if (speaker) options.speaker = speaker;
  return {
    phrase: doc.getElementById("phrase").value.trim(),
    baseF0: readBaseF0(doc),
    options,
  };
}
