// dt-1 voice probe: runs the DECtalk TTS pipeline for "hello" with different
// voices and prints the resolved speaker parameters. Demonstrates that voice
// selection by name populates the speaker policy with that voice's values.
//
// Uses textToKlattTrackDetailed (same pipeline as textToKlattTrack; the
// detailed variant additionally surfaces the resolved speaker profile and the
// F0 speaker-policy params so the probe can print them).
//
// Usage:
//   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/dt1-voice-probe.ts
//   ... scripts/dt1-voice-probe.ts paul betty harry   (custom voice list)
import { textToKlattTrack, textToKlattTrackDetailed } from "../src/tts-frontend";

const args = process.argv.slice(2);
const probeVoices = args.length > 0 ? args : ["paul", "betty"];

for (const voice of probeVoices) {
  // Exercise the public track entrypoint too, to prove the name path works there.
  const track = textToKlattTrack("hello", undefined, 30, {
    frontendId: "dectalk-english",
    speaker: voice,
  });

  const detailed = textToKlattTrackDetailed("hello", undefined, 30, {
    frontendId: "dectalk-english",
    speaker: voice,
  });
  const sp = detailed.speakerParams ?? {};
  const rs = detailed.resolvedSpeaker;

  console.log(
    JSON.stringify(
      {
        voice,
        trackFrames: track.length,
        resolved_base_f0_hz: rs.base_f0_hz,
        resolved_formant_scale: rs.formant_scale,
        resolved_rd_default: rs.rd_default,
        resolved_spectral_tilt_offset_db: rs.spectral_tilt_offset_db,
        speakerParams_base_f0_hz: sp.base_f0_hz,
        speakerParams_formant_scale: sp.formant_scale,
        speakerParams_f0_minimum: sp.f0_minimum,
        speakerParams_f0_scale_factor: sp.f0_scale_factor,
        speakerParams_f0_lp_filter: sp.f0_lp_filter,
      },
      null,
      2,
    ),
  );
}
