import { describe, expect, it } from "vitest";
import { normalizeText, textToKlattTrack, transcribeText } from "../src/tts-frontend";
import {
  getTrackWordOccurrence,
  getTranscriptionWordOccurrence,
} from "./utils/phonology-conformance";

describe("spelling mode", () => {
  it("spells single-letter runs with letter-name pronunciations", () => {
    const normalized = normalizeText("B A N A N A S!");
    const transcription = transcribeText(normalized);

    expect(getTranscriptionWordOccurrence(transcription, "b", 0)).toEqual(["B", "IY"]);
    expect(getTranscriptionWordOccurrence(transcription, "a", 0)).toEqual(["EY"]);
    expect(getTranscriptionWordOccurrence(transcription, "n", 0)).toEqual(["EH", "N"]);
    expect(getTranscriptionWordOccurrence(transcription, "s", 0)).toEqual(["EH", "S"]);

    const track = textToKlattTrack("B A N A N A S!", 110);
    const aTrack = getTrackWordOccurrence(track, "a", 0);
    expect(aTrack).toContain("EH1");
    expect(aTrack).toContain("Y");
    expect(aTrack).not.toContain("AH");
  });

  it("keeps ordinary article a out of spelling mode", () => {
    const normalized = normalizeText("a banana");
    const transcription = transcribeText(normalized);

    expect(getTranscriptionWordOccurrence(transcription, "a", 0)).toEqual(["AH"]);

    const track = textToKlattTrack("a banana", 110);
    const aTrack = getTrackWordOccurrence(track, "a", 0);
    expect(aTrack).toContain("AH");
    expect(aTrack).not.toContain("EH1");
    expect(aTrack).not.toContain("Y");
  });

  it("spells dotted initialisms letter by letter", () => {
    const normalized = normalizeText("U.S.A. today");
    const transcription = transcribeText(normalized);

    expect(getTranscriptionWordOccurrence(transcription, "u", 0)).toEqual(["Y", "UW"]);
    expect(getTranscriptionWordOccurrence(transcription, "s", 0)).toEqual(["EH", "S"]);
    expect(getTranscriptionWordOccurrence(transcription, "a", 0)).toEqual(["EY"]);
  });
});
