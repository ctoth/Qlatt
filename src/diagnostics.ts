export type DiagnosticsLevel = "info" | "warn" | "error";

export interface DiagnosticEntry {
  time: Date;
  level: DiagnosticsLevel;
  message: string;
  code?: string;
  data?: unknown;
}

export type DiagnosticsListener = (
  entry: DiagnosticEntry | null,
  entries: readonly DiagnosticEntry[],
) => void;

export interface Diagnostics {
  info(message: string, data?: unknown, code?: string): void;
  warn(message: string, data?: unknown, code?: string): void;
  error(message: string, data?: unknown, code?: string): void;
  clear(): void;
  getEntries(): DiagnosticEntry[];
  format(): string;
  subscribe(listener: DiagnosticsListener): () => boolean;
}

export interface CreateDiagnosticsOptions {
  maxEntries?: number;
}

export function createDiagnostics({
  maxEntries = 200,
}: CreateDiagnosticsOptions = {}): Diagnostics {
  const entries: DiagnosticEntry[] = [];
  const listeners = new Set<DiagnosticsListener>();

  function push(level: DiagnosticsLevel, message: string, data?: unknown, code?: string): void {
    const entry: DiagnosticEntry = {
      time: new Date(),
      level,
      message,
      code,
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
    const code = entry.code ? ` ${entry.code}` : "";
    const data = entry.data === undefined ? "" : ` ${JSON.stringify(entry.data)}`;
    return `[${time}] ${entry.level}${code}: ${entry.message}${data}`;
  }

  return {
    info(message: string, data?: unknown, code?: string): void {
      push("info", message, data, code);
    },
    warn(message: string, data?: unknown, code?: string): void {
      push("warn", message, data, code);
    },
    error(message: string, data?: unknown, code?: string): void {
      push("error", message, data, code);
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
