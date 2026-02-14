export type DiagnosticsLevel = "info" | "warn" | "error";

export interface DiagnosticEntry {
  time: Date;
  level: DiagnosticsLevel;
  message: string;
  data?: unknown;
}

export type DiagnosticsListener = (
  entry: DiagnosticEntry | null,
  entries: readonly DiagnosticEntry[],
) => void;

export interface Diagnostics {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  clear(): void;
  getEntries(): DiagnosticEntry[];
  format(): string;
  subscribe(listener: DiagnosticsListener): () => boolean;
}

export interface CreateDiagnosticsOptions {
  maxEntries?: number;
}

export function createDiagnostics(
  { maxEntries = 200 }: CreateDiagnosticsOptions = {},
): Diagnostics {
  const entries: DiagnosticEntry[] = [];
  const listeners = new Set<DiagnosticsListener>();

  function push(level: DiagnosticsLevel, message: string, data?: unknown): void {
    const entry: DiagnosticEntry = {
      time: new Date(),
      level,
      message,
      data,
    };
    entries.push(entry);
    if (entries.length > maxEntries) {
      entries.shift();
    }
    for (const listener of listeners) {
      listener(entry, entries);
    }
  }

  function formatEntry(entry: DiagnosticEntry): string {
    const time = entry.time.toLocaleTimeString();
    const data = entry.data === undefined ? "" : ` ${JSON.stringify(entry.data)}`;
    return `[${time}] ${entry.level}: ${entry.message}${data}`;
  }

  return {
    info(message: string, data?: unknown): void {
      push("info", message, data);
    },
    warn(message: string, data?: unknown): void {
      push("warn", message, data);
    },
    error(message: string, data?: unknown): void {
      push("error", message, data);
    },
    clear(): void {
      entries.length = 0;
      for (const listener of listeners) {
        listener(null, entries);
      }
    },
    getEntries(): DiagnosticEntry[] {
      return [...entries];
    },
    format(): string {
      return entries.map(formatEntry).join("\n");
    },
    subscribe(listener: DiagnosticsListener): () => boolean {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
