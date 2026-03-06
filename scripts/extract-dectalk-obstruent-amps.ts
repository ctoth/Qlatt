import fs from 'node:fs';
import path from 'node:path';

type FollowingClass =
  | 'front_vowel'
  | 'back_unrounded_vowel'
  | 'back_rounded_vowel'
  | 'obstruent'
  | 'legacy_unused';

type AmpProfile = {
  A2: number;
  A3: number;
  A4: number;
  A5: number;
  A6: number;
  AB: number;
};

type PhonemeAmpEntry = {
  code: number;
  ptram: number;
  begtyp: number;
  endtyp: number;
  profiles: Record<FollowingClass, AmpProfile>;
};

const US_PHONEME_NAMES = [
  'SIL',
  'IY', 'IH', 'EY', 'EH', 'AE',
  'AA', 'AY', 'AW', 'AH', 'AO',
  'OW', 'OY', 'UH', 'UW', 'RR',
  'YU', 'AX', 'IX', 'IR', 'ER',
  'AR', 'OR', 'UR', 'W', 'Y',
  'R', 'LL', 'HX', 'RX', 'LX',
  'M', 'N', 'NX', 'EL', 'DZ',
  'EN', 'F', 'V', 'TH', 'DH',
  'S', 'Z', 'SH', 'ZH', 'P',
  'B', 'T', 'D', 'K', 'G',
  'DX', 'TX', 'Q', 'CH', 'JH',
  'DF', 'TZ', 'CZ',
] as const;

const FOLLOWING_CLASSES: FollowingClass[] = [
  'front_vowel',
  'back_unrounded_vowel',
  'back_rounded_vowel',
  'obstruent',
  'legacy_unused',
] as const;

const AMP_FIELDS = ['A2', 'A3', 'A4', 'A5', 'A6', 'AB'] as const;

function parseShortArray(source: string, arrayName: string): number[] {
  const pattern = new RegExp(
    `const\\s+short\\s+${arrayName}\\s*\\[\\]\\s*=\\s*\\{([\\s\\S]*?)\\}\\s*;`,
  );
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Array not found: ${arrayName}`);
  }
  return Array.from(match[1].matchAll(/-?\d+/g), (value) => Number(value[0]));
}

function readRomFile(srcDir: string): string {
  const romPath = path.join(srcDir, 'PH', 'p_us_rom.h');
  return fs.readFileSync(romPath, 'latin1');
}

function extractObstruentAmps(srcDir: string): Record<string, PhonemeAmpEntry> {
  const source = readRomFile(srcDir);
  const ptram = parseShortArray(source, 'us_ptram');
  const begtyp = parseShortArray(source, 'us_begtyp');
  const endtyp = parseShortArray(source, 'us_endtyp');
  const malamp = parseShortArray(source, 'us_malamp');

  if (ptram.length !== US_PHONEME_NAMES.length) {
    throw new Error(`Expected ${US_PHONEME_NAMES.length} us_ptram entries, got ${ptram.length}`);
  }
  if (begtyp.length !== US_PHONEME_NAMES.length) {
    throw new Error(`Expected ${US_PHONEME_NAMES.length} us_begtyp entries, got ${begtyp.length}`);
  }
  if (endtyp.length !== US_PHONEME_NAMES.length) {
    throw new Error(`Expected ${US_PHONEME_NAMES.length} us_endtyp entries, got ${endtyp.length}`);
  }

  const result: Record<string, PhonemeAmpEntry> = {};

  for (let code = 0; code < US_PHONEME_NAMES.length; code += 1) {
    const pointer = ptram[code];
    if (pointer <= 0) {
      continue;
    }

    const profiles = {} as Record<FollowingClass, AmpProfile>;
    for (let classIndex = 0; classIndex < FOLLOWING_CLASSES.length; classIndex += 1) {
      const start = pointer + classIndex * AMP_FIELDS.length;
      const profile = {} as AmpProfile;
      for (let fieldIndex = 0; fieldIndex < AMP_FIELDS.length; fieldIndex += 1) {
        const field = AMP_FIELDS[fieldIndex];
        profile[field] = malamp[start + fieldIndex] ?? 0;
      }
      profiles[FOLLOWING_CLASSES[classIndex]] = profile;
    }

    result[US_PHONEME_NAMES[code]] = {
      code,
      ptram: pointer,
      begtyp: begtyp[code],
      endtyp: endtyp[code],
      profiles,
    };
  }

  return result;
}

function main(): void {
  const srcDir = process.argv[2];
  if (!srcDir) {
    console.error('Usage: node --loader ts-node/esm --experimental-specifier-resolution=node scripts/extract-dectalk-obstruent-amps.ts <dapi/src dir> [phoneme...]');
    process.exit(1);
  }

  const extracted = extractObstruentAmps(srcDir);
  const requested = process.argv.slice(3);

  if (requested.length > 0) {
    const filtered: Record<string, PhonemeAmpEntry> = {};
    for (const phoneme of requested) {
      if (!(phoneme in extracted)) {
        console.error(`Unknown or non-obstruent phoneme: ${phoneme}`);
        process.exitCode = 2;
        continue;
      }
      filtered[phoneme] = extracted[phoneme];
    }
    process.stdout.write(`${JSON.stringify(filtered, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(extracted, null, 2)}\n`);
}

main();
