export interface HarnessDiagnosticsEngine {
  destroy(): void;
}

export interface HarnessRuntime {
  disconnect(): void;
}

export const state: {
  currentExperimentId: string | null;
  diagEngine: HarnessDiagnosticsEngine | null;
  newRuntime: HarnessRuntime | null;
};
