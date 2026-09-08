/** Hayes (1982), pp. 237–274: cyclic feet, peripheral invisibility and word prominence. */
import { evaluateExpression } from "../declarative-frontend/cel-expressions";
import type {
  LexicalStressResult,
  StressDecision,
  StressDomain,
  StressFoot,
  StressSyllable,
} from "./lexical-stress-types";
import type { StressPolicy, StressRule } from "./stress-policy";

export function assignMetricalStress(
  syllables: readonly StressSyllable[],
  domains: readonly StressDomain[],
  policy: StressPolicy,
): LexicalStressResult {
  if (!syllables.length) return { stress: [], feet: [], decisions: [] };
  if (
    new Set(syllables.map((syllable) => syllable.id)).size !== syllables.length ||
    syllables.some(
      (syllable) =>
        !syllable.id ||
        typeof syllable.long !== "boolean" ||
        !Array.isArray(syllable.coda) ||
        syllable.coda.some((phone) => typeof phone !== "string" || !phone),
    )
  ) {
    throw new Error("E_STRESS_INPUT: invalid syllable identity or rhyme");
  }
  if (
    !domains.length ||
    domains.at(-1)?.end !== syllables.length ||
    (domains.at(-1)?.start ?? 0) !== 0
  )
    throw new Error("E_STRESS_DOMAIN: incomplete word");
  let previousEnd = 0;
  let previousStart = syllables.length;
  const domainIds = new Set<string>();
  for (const domain of domains) {
    const start = domain.start ?? 0;
    if (
      !Number.isInteger(domain.end) ||
      !Number.isInteger(start) ||
      start < 0 ||
      start >= domain.end ||
      domain.end > syllables.length ||
      domain.end < previousEnd ||
      start > previousStart ||
      domainIds.has(domain.id)
    ) {
      throw new Error("E_STRESS_DOMAIN: cycles must have unique IDs and increasing boundaries");
    }
    previousEnd = domain.end;
    previousStart = start;
    domainIds.add(domain.id);
    if (
      domain.suffixStart !== undefined &&
      (!Number.isInteger(domain.suffixStart) ||
        domain.suffixStart < start ||
        domain.suffixStart > domain.end ||
        (domain.extrametricalSuffix && domain.suffixStart === domain.end))
    ) {
      throw new Error("E_STRESS_DOMAIN: suffix boundary outside cycle");
    }
    if (domain.checkpoint) {
      const members = domain.checkpoint.feet.flatMap((foot) => foot.members);
      if (
        domain !== domains[0] ||
        !domain.checkpoint.citations.length ||
        !members.length ||
        new Set(members).size !== members.length ||
        members.some((index) => !Number.isInteger(index) || index < start || index >= domain.end) ||
        domain.checkpoint.feet.some((foot) => !foot.members.includes(foot.head)) ||
        (domain.checkpoint.excludedFrom !== undefined &&
          (!Number.isInteger(domain.checkpoint.excludedFrom) ||
            domain.checkpoint.excludedFrom <= start ||
            domain.checkpoint.excludedFrom >= domain.end))
      ) {
        throw new Error("E_STRESS_DOMAIN: invalid cited metrical checkpoint");
      }
    }
  }
  let feet: StressFoot[] = [];
  const excluded = new Set<number>();
  let excludedOwners: { owner: string; start: number; end: number }[] = [];
  const protectedHeads = new Set<number>();
  let primaryHead: number | undefined;
  const decisions: StressDecision[] = [];
  const record = (
    domain: StressDomain,
    rule: string,
    reason: string,
    citations: string[],
    tag: string,
  ) => {
    decisions.push({
      id: `${domain.id}:stress:${decisions.length}`,
      rule,
      domain: domain.id,
      reason,
      citations,
      tag,
      parents: decisions.length ? [decisions[decisions.length - 1].id] : [],
      feet: feet.map((foot) => ({ ...foot, members: [...foot.members] })),
      excluded: [...excluded],
      excludedOwners: excludedOwners.map((owner) => ({ ...owner })),
    });
  };
  const addFoot = (members: number[], domain: StressDomain) => {
    // Only this operation redraws intersecting feet; retraction never calls it on attached material.
    feet = feet.filter((foot) => {
      if (!foot.members.some((index) => members.includes(index))) return true;
      protectedHeads.delete(foot.head);
      return false;
    });
    feet.push({ head: members[0], members, domain: domain.id });
    feet.sort((left, right) => left.head - right.head);
  };
  const attached = (index: number) => feet.some((foot) => foot.members.includes(index));
  const strongest = () =>
    feet.filter((foot) => !foot.members.every((index) => excluded.has(index))).at(-1);
  const exclude = (start: number, domain: StressDomain) => {
    if (start <= (domain.start ?? 0)) return;
    excludedOwners.push({ owner: domain.id, start, end: domain.end });
    for (let index = start; index < domain.end; index++) excluded.add(index);
  };
  let finalConsonantExcluded = false;
  const matches = (
    rule: StressRule,
    index: number,
    domain: StressDomain,
    foot?: StressFoot,
  ): boolean => {
    const syllable = syllables[index];
    const previous = feet.filter((item) => item.head < index).at(-1);
    const value = evaluateExpression(rule.when, {
      longVowel: syllable.long,
      codaCount: Math.max(
        0,
        syllable.coda.length - (finalConsonantExcluded && index === domain.end - 1 ? 1 : 0),
      ),
      category: domain.category === "unknown" ? policy.defaultCategory : domain.category,
      adjectivalSuffix: domain.extrametricalSuffix,
      verbalSuffix: domain.affix === "verbal",
      index: index - (domain.start ?? 0),
      count: domain.end - (domain.start ?? 0),
      singleton: foot?.members.length === 1,
      open: syllable.coda.length === 0,
      initial: index === (domain.start ?? 0),
      sonorantCoda: syllable.coda.length === 1 && policy.sonorants.includes(syllable.coda[0]),
      precededBySingleton: previous?.members.length === 1 && previous.head + 1 === index,
    });
    if (typeof value !== "boolean")
      throw new Error(`E_STRESS_CONDITION: ${rule.id} must return bool`);
    return value;
  };
  const execute = (rule: StressRule, domain: StressDomain) => {
    const last = domain.end - 1;
    const before = JSON.stringify([feet, [...excluded], finalConsonantExcluded]);
    switch (rule.operation) {
      case "consonant_extrametricality":
        if (matches(rule, last, domain)) finalConsonantExcluded = true;
        break;
      case "long_vowel_stressing":
        if (matches(rule, last, domain)) addFoot([last], domain);
        break;
      case "rhyme_extrametricality":
        if (matches(rule, last, domain))
          exclude(domain.extrametricalSuffix ? (domain.suffixStart ?? last) : last, domain);
        break;
      case "english_stress_rule": {
        let right = last;
        while (excluded.has(right)) right--;
        const members =
          right > (domain.start ?? 0) && matches(rule, right, domain)
            ? [right - 1, right]
            : [right];
        addFoot(members, domain);
        break;
      }
      case "strong_retraction":
        for (let right = last; right >= (domain.start ?? 0); right--) {
          if (excluded.has(right) || attached(right) || !matches(rule, right, domain)) continue;
          const left = right - 1;
          const members =
            left >= (domain.start ?? 0) && !attached(left) && !excluded.has(left)
              ? [left, right]
              : [right];
          addFoot(members, domain);
        }
        break;
      case "prestress_destressing":
      case "sonorant_destressing":
      case "arab_destressing":
      case "poststress_destressing": {
        const strong = strongest();
        for (const foot of [...feet]) {
          if (
            foot === strong ||
            protectedHeads.has(foot.head) ||
            !matches(rule, foot.head, domain, foot)
          )
            continue;
          const following = feet.find((other) => other.head > foot.head);
          const beforeStress = following?.head === foot.head + foot.members.length;
          if (rule.operation === "prestress_destressing" && !beforeStress) continue;
          if (rule.operation === "sonorant_destressing" && (!following || foot.head === 0))
            continue;
          if (rule.operation === "arab_destressing" && foot.head !== last) continue;
          // Stray Syllable Adjunction preserves membership while removing this weak head.
          const previous = feet.filter((other) => other.head < foot.head).at(-1);
          const owner = previous ?? following;
          if (!owner) continue;
          owner.members = [...owner.members, ...foot.members].sort((left, right) => left - right);
          feet = feet.filter((other) => other !== foot);
        }
        break;
      }
      case "late_extrametricality": {
        const final = feet.find((foot) => foot.head === last && foot.members.length === 1);
        const previous = feet.filter((foot) => foot.head < last).at(-1);
        if (
          final &&
          previous &&
          previous.members.length > 1 &&
          previous.members.at(-1) === last - 1 &&
          matches(rule, last, domain, final)
        ) {
          exclude(last, domain);
        }
        break;
      }
    }
    const changed = before !== JSON.stringify([feet, [...excluded], finalConsonantExcluded]);
    record(
      domain,
      rule.id,
      changed ? "metrical state changed" : "condition or structural precondition did not apply",
      rule.citations,
      rule.tag,
    );
  };
  const lastActive = domains.findLast((domain) => domain.affix !== "neutral");
  for (const domain of domains) {
    if (domain.affix !== "neutral") {
      excludedOwners = excludedOwners.filter((owner) => owner.end === domain.end);
      excluded.clear();
      for (const owner of excludedOwners)
        for (let index = owner.start; index < owner.end; index++) excluded.add(index);
    }
    finalConsonantExcluded = false;
    record(
      domain,
      "cycle_peripherality",
      `Only the right-peripheral owner remains extrametrical; input=${JSON.stringify(domain)}`,
      ["Hayes (1982), pp. 270–271, rule (103)"],
      "stress_domain",
    );
    if (domain.category === "unknown") {
      record(
        domain,
        "category_assumption",
        `Unknown category treated as ${policy.defaultCategory}`,
        [policy.assumptionCitation],
        "stress_input_fallback",
      );
    }
    const inherited = syllables
      .slice(domain.start ?? 0, domain.end)
      .some((syllable) => syllable.inherited === "primary" || syllable.inherited === "secondary");
    if (domain.checkpoint) {
      feet = domain.checkpoint.feet.map((foot) => ({
        ...foot,
        members: [...foot.members],
        domain: domain.id,
      }));
      feet.sort((left, right) => left.head - right.head);
      if (domain.checkpoint.excludedFrom !== undefined)
        exclude(domain.checkpoint.excludedFrom, domain);
      record(
        domain,
        "supplied_metrical_checkpoint",
        "Cited postcyclic feet supplied explicitly; no surface-to-underlying inference",
        domain.checkpoint.citations,
        "stress_inherited",
      );
    } else if (domain.affix === "root" && inherited) {
      for (let index = domain.start ?? 0; index < domain.end; index++) {
        if (syllables[index].inherited === "primary" || syllables[index].inherited === "secondary")
          addFoot([index], domain);
        if (syllables[index].inherited === "primary") {
          protectedHeads.add(index);
          primaryHead = index;
        }
      }
      record(
        domain,
        "inherited_feet",
        "Stress-bearing lexical syllables seed singleton feet; dictionary digits do not encode foot boundaries",
        [policy.assumptionCitation],
        "stress_inherited",
      );
    } else if (domain.affix !== "neutral") {
      for (const rule of policy.cycle) execute(rule, domain);
      if (domain.stressTarget) {
        const distance = { final: 1, penult: 2, antepenult: 3 }[domain.stressTarget];
        const target = Math.max(domain.start ?? 0, domain.end - distance);
        addFoot([target], domain);
        protectedHeads.add(target);
        primaryHead = target;
        record(
          domain,
          "declared_affix_exception",
          `Morphology declares ${domain.stressTarget} stress`,
          domain.citations ?? [policy.assumptionCitation],
          "stress_exception",
        );
      } else primaryHead = strongest()?.head;
    } else {
      for (let index = domain.start ?? 0; index < domain.end; index++) {
        if (
          !attached(index) &&
          (syllables[index].inherited === "primary" || syllables[index].inherited === "secondary")
        )
          addFoot([index], domain);
      }
      record(
        domain,
        "neutral_cycle",
        "Neutral affix preserves inherited stress",
        ["Hayes (1982), pp. 248–251"],
        "stress_inherited",
      );
    }
    // Word-level operations finish the last stress-bearing domain before neutral
    // material extends it. A supplied lexical root is already a completed word.
    const inheritedRoot = domain.affix === "root" && inherited && !domain.checkpoint;
    if (domain === lastActive && !inheritedRoot) {
      for (const rule of policy.word) execute(rule, domain);
      if (!domain.stressTarget) primaryHead = strongest()?.head;
    }
  }
  const word = domains[domains.length - 1];
  const lexicalRoot = domains.length === 1 && protectedHeads.size > 0;
  const preservePrimary =
    word.affix === "neutral" || lexicalRoot || word.stressTarget !== undefined;
  const primary =
    preservePrimary && primaryHead !== undefined
      ? feet.find((foot) => foot.head === primaryHead)
      : strongest();
  if (!primary) throw new Error("E_STRESS_FEET: no visible foot");
  const stress = syllables.map((_, index) =>
    index === primary.head
      ? ("primary" as const)
      : feet.some((foot) => foot.head === index)
        ? ("secondary" as const)
        : ("unstressed" as const),
  );
  record(
    word,
    "word_prominence",
    preservePrimary
      ? "Preserved lexical or declared primary; other foot heads retain secondary prominence"
      : "Rightmost visible foot is strongest; other foot heads retain secondary prominence",
    ["Hayes (1982), pp. 271–274"],
    "stress_projection",
  );
  return { stress, feet, decisions };
}
