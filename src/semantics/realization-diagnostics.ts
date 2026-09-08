import type { Diagnostics } from "../diagnostics";

interface AffectedRealization {
  rule?: string;
  nodeId?: string;
  paramName?: string;
  error: string;
  count: number;
  first: Record<string, unknown>;
  last: Record<string, unknown>;
}

/** One diagnostic per runtime lifetime or track compilation, with counts and
 * first/latest observations per affected rule/binding. The existing Diagnostics
 * buffer owns the report; repeated frames do not consume additional entries.
 */
export function createRealizationDiagnostics(diagnostics: Diagnostics, code: string) {
  const data = { count: 0, affected: [] as AffectedRealization[] };
  const affected = new Map<string, AffectedRealization>();
  return {
    record(
      target: { rule?: string; nodeId?: string; paramName?: string; error: string },
      observation: Record<string, unknown>,
    ): void {
      // Error text and frame values may change each iteration; identity must not.
      const key = JSON.stringify([target.rule, target.nodeId, target.paramName]);
      let item = affected.get(key);
      if (!item) {
        item = { ...target, count: 0, first: observation, last: observation };
        affected.set(key, item);
        data.affected.push(item);
      }
      item.count++;
      item.last = { ...observation, error: target.error };
      data.count++;
    },
    flush(): void {
      if (data.count && !diagnostics.getEntries().some((entry) => entry.data === data)) {
        diagnostics.warn(
          "Realization or frame compilation degraded; see affected outputs",
          data,
          code,
        );
      }
    },
  };
}
