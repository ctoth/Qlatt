// test/harness/speaker.js — Voice/speaker dropdown populated from a frontend's
// DECLARATIVE speakers registry (frontend.yaml `speakers:` block). The list of
// voices is DATA read from the registry, never a hardcoded array. Frontends
// that declare no `speakers:` block (e.g. qlatt-english) hide/disable the
// dropdown and the speak path passes no `speaker` option (default behavior).

import { loadYamlDocumentOrNull } from "../../src/yaml-loader.ts";

const FRONTEND_SPEC_PATH = (frontendId) => `/rules/frontends/${frontendId}/frontend.yaml`;

function getSelectedFrontendId() {
  const select = document.getElementById("frontendSelect");
  return select ? select.value : "qlatt-english";
}

/**
 * Read the `speakers:` registry from a parsed frontend spec, if present.
 * Mirrors src/dectalk-voice.ts getVoiceRegistry shape generically: any frontend
 * declaring `speakers.dir` + `speakers.default` + `speakers.voices[]` is usable.
 * Returns null when the frontend declares no voice registry.
 */
function readSpeakersRegistry(frontendSpec) {
  const speakers = frontendSpec?.speakers;
  if (!speakers || typeof speakers !== "object") return null;
  const def = speakers.default;
  const voices = Array.isArray(speakers.voices)
    ? speakers.voices.filter((v) => typeof v === "string")
    : [];
  if (typeof def !== "string" || voices.length === 0) return null;
  return { default: def, voices };
}

/**
 * Currently selected voice name, or null when the active frontend has no
 * speakers registry (so the speak path should pass no `speaker` option).
 */
export function getSelectedSpeaker() {
  const label = document.getElementById("speakerLabel");
  const select = document.getElementById("speakerSelect");
  if (!label || !select) return null;
  if (label.style.display === "none" || select.disabled) return null;
  return select.value || null;
}

/**
 * Populate the voice dropdown from the selected frontend's declarative speakers
 * registry. Hides/disables it (and clears the selection) for frontends without
 * one. Defaults the selection to the registry `default` voice.
 */
export async function refreshSpeakerOptions() {
  const label = document.getElementById("speakerLabel");
  const select = document.getElementById("speakerSelect");
  if (!label || !select) return;

  const frontendId = getSelectedFrontendId();
  const spec = await loadYamlDocumentOrNull(FRONTEND_SPEC_PATH(frontendId));
  const registry = readSpeakersRegistry(spec);

  select.innerHTML = "";

  if (!registry) {
    // No declarative speakers registry -> hide + disable the dropdown.
    label.style.display = "none";
    select.disabled = true;
    return;
  }

  for (const voice of registry.voices) {
    const option = document.createElement("option");
    option.value = voice;
    option.textContent = voice;
    select.appendChild(option);
  }
  select.value = registry.default;
  select.disabled = false;
  label.style.display = "";
  console.log("[QLATT] Speaker options loaded:", {
    frontendId,
    default: registry.default,
    voices: registry.voices,
  });
}
