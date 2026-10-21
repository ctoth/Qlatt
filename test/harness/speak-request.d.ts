type ControlDocument = {
  getElementById(id: string): { value: string } | null;
};

export function readBaseF0(doc: ControlDocument): number | undefined;

export function readSpeakRequest(
  doc: ControlDocument,
  speaker: string | null,
): {
  phrase: string;
  baseF0: number | undefined;
  options: { rate: number; frontendId: string; speaker?: string };
};
