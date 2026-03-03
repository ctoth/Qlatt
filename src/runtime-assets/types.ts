export interface RuntimeAssetLoader {
  resolveWorkletModule(moduleName: string): string;
  loadWasmModule(wasmName: string): Promise<ArrayBuffer>;
  dispose?(): Promise<void> | void;
}
