/**
 * The scopes DECtalk's commands inside a text make (src/text-scopes.ts).
 *
 * A voice command, a rate command, a pause command and a change of the
 * speaker definition hold for the text after them (PH/ph_task.c:665-676 ends
 * the clause before a control item; 710-750 RATE, CPAUSE, PPAUSE,
 * NEW_SPEAKER, NEW_PARAM). The text parser reports each with its place
 * (frontend.ts `changes`); here they are folded into the state at each
 * place:
 *   - a voice command loads the voice's own definition: the changes made to
 *     the definition before it are gone (PH/ph_vset.c:433-448 usevoice);
 *   - a voice command and a change of the definition each send a speaker
 *     definition (PH/ph_vset.c setspdef);
 *   - a rule field the new voice does not give keeps what the voice before
 *     it in the text gave: DECtalk's per-voice values are set by one case a
 *     voice, and a case that leaves a value alone leaves the last voice's
 *     (VTM/vtmiont.c:2899-3430 changeSpeakerValues). Measured on say.exe:
 *     after Dennis, Frank's clause ends with Dennis's glottal spread;
 *   - commands at one place make one scope, and a scope depends on the
 *     decisions of the commands whose values are in force in it.
 */

import type { ResolvedVoice } from "../dectalk-voice";
import type { TextScope, TextScopeSource } from "../text-scopes";
import type { TextParserChange } from "./frontend";

const CITATIONS = [
  "DECtalk 4.63 CMD/cm_cmd.c:766-790 (a command in the text is carried out where it stands)",
  "DECtalk 4.63 PH/ph_task.c:665-676 (the clause before a control item is ended), 710-750 (RATE, CPAUSE, PPAUSE, NEW_SPEAKER, NEW_PARAM hold for what follows)",
];

/** The scope source of a text whose parser reported `changes`. */
export function commandScopes(changes: readonly TextParserChange[]): TextScopeSource {
  return (start, tools) => {
    const scopes: TextScope[] = [];
    let voiceName = start.voice.name;
    let definition = [...start.definition];
    let scopeRate = start.wordsPerMinute;
    let pauses = start.pauses;
    let definitionsSent = 0;
    let carriedRuleFields = start.voice.ruleFields;
    // The parser's decision for the command each part of the state is from.
    const inForce: {
      voice?: string;
      definition: string[];
      rate?: string;
      comma?: string;
      period?: string;
    } = { definition: [] };
    for (const change of changes) {
      let sends = false;
      if (change.voice !== undefined) {
        if (tools.voices.length === 0 || tools.voices.includes(change.voice)) {
          voiceName = change.voice;
          definition = [];
          sends = true;
          inForce.voice = change.decisionId;
          inForce.definition = [];
        } else {
          tools.warn(
            `The text asks for the voice '${change.voice}', which this frontend does not have; the voice stays`,
            { voice: change.voice, available: tools.voices },
            "W_TEXT_COMMAND_VOICE_UNKNOWN",
          );
        }
      }
      if (change.definition) {
        definition = [...definition, change.definition];
        sends = true;
        inForce.definition.push(change.decisionId);
      }
      if (change.rate !== undefined && tools.wordsPerMinute) {
        inForce.rate = change.decisionId;
        scopeRate = tools.wordsPerMinute(change.rate) ?? scopeRate;
      }
      if (change.pauseAddedMs) {
        if (change.pauseAddedMs.comma !== undefined) inForce.comma = change.decisionId;
        if (change.pauseAddedMs.period !== undefined) inForce.period = change.decisionId;
        pauses = {
          comma: change.pauseAddedMs.comma ?? pauses?.comma ?? 0,
          period: change.pauseAddedMs.period ?? pauses?.period ?? 0,
        };
      }
      if (sends) definitionsSent += 1;
      const resolved = tools.resolveVoice(voiceName, definition);
      const voice: ResolvedVoice = {
        ...resolved,
        ruleFields: Object.fromEntries(
          Object.entries(resolved.ruleFields).map(([name, value]) => [
            name,
            value ?? carriedRuleFields[name] ?? null,
          ]),
        ),
      };
      carriedRuleFields = voice.ruleFields;
      const state = {
        voice,
        wordsPerMinute: scopeRate,
        pauses,
        definitionsSent,
        decisionIds: [
          ...new Set(
            [
              inForce.voice,
              ...inForce.definition,
              inForce.rate,
              inForce.comma,
              inForce.period,
            ].filter((id): id is string => id !== undefined),
          ),
        ],
        summary:
          `the commands inside the text have left: voice ${voice.name}` +
          (scopeRate === undefined ? "" : `, ${scopeRate.toString()} words per minute`) +
          (pauses
            ? `, ${pauses.comma.toString()} ms more at a comma and ${pauses.period.toString()} ms more at a sentence end`
            : ""),
        citations: CITATIONS,
      };
      const last = scopes.at(-1);
      if (last && last.offset === change.offset) Object.assign(last, state);
      else {
        scopes.push({
          name: `command_${(scopes.length + 1).toString()}`,
          offset: change.offset,
          ...state,
        });
      }
    }
    return scopes;
  };
}
