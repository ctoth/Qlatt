// dt-1b proof: the NO-speaker default resolves to the registry default voice
// for a frontend WITH a speakers registry (dectalk-english -> Paul, base_f0
// 122), and stays on the generic profile for a frontend WITHOUT a registry
// (qlatt-english). Uses textToKlattTrackDetailed to read resolvedSpeaker.
import { textToKlattTrackDetailed } from "../src/tts-frontend";

function probe(label: string, frontendId: string, speaker?: string) {
  const d = textToKlattTrackDetailed("hello", 110, 30, { frontendId, speaker });
  const rs = d.resolvedSpeaker;
  const sp = (d.speakerParams ?? {}) as Record<string, number>;
  console.log(
    JSON.stringify(
      {
        label,
        frontendId,
        speaker: speaker ?? "(none)",
        resolved_base_f0_hz: rs.base_f0_hz,
        resolved_formant_scale: rs.formant_scale,
        speakerParams_f0_minimum: sp.f0_minimum,
        speakerParams_f0_scale_factor: sp.f0_scale_factor,
        voiceSex: d.voiceSex,
      },
      null,
      0,
    ),
  );
}

probe("dectalk default (no speaker)", "dectalk-english");
probe("dectalk explicit paul", "dectalk-english", "paul");
probe("dectalk explicit betty", "dectalk-english", "betty");
probe("qlatt-english default (no registry)", "qlatt-english");
