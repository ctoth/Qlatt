export function createDiagnostics({ maxEntries = 200 } = {}) {
  const entries = [];
  const listeners = new Set();

  function push(level, message, data) {
    const entry = {
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

  function formatEntry(entry) {
    const time = entry.time.toLocaleTimeString();
    const data = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
    return `[${time}] ${entry.level}: ${entry.message}${data}`;
  }

  return {
    info(message, data) {
      push("info", message, data);
    },
    warn(message, data) {
      push("warn", message, data);
    },
    error(message, data) {
      push("error", message, data);
    },
    clear() {
      entries.length = 0;
      for (const listener of listeners) {
        listener(null, entries);
      }
    },
    getEntries() {
      return [...entries];
    },
    format() {
      return entries.map(formatEntry).join("\n");
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
