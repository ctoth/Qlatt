import type { BaconGraph, Registry } from "../../src/klatt-runtime";
import type { SemanticsDocument } from "../../src/semantics/types";

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
  newRuntimeGraph: BaconGraph | null;
  newRuntimeSemantics: SemanticsDocument | null;
  newRuntimeRegistry: Registry | null;
};
