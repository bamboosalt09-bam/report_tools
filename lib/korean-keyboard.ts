const INITIALS = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;

const MEDIALS = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
] as const;

const FINALS = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;

const englishToJamo: Record<string, string> = {
  q: "ㅂ",
  w: "ㅈ",
  e: "ㄷ",
  r: "ㄱ",
  t: "ㅅ",
  y: "ㅛ",
  u: "ㅕ",
  i: "ㅑ",
  o: "ㅐ",
  p: "ㅔ",
  a: "ㅁ",
  s: "ㄴ",
  d: "ㅇ",
  f: "ㄹ",
  g: "ㅎ",
  h: "ㅗ",
  j: "ㅓ",
  k: "ㅏ",
  l: "ㅣ",
  z: "ㅋ",
  x: "ㅌ",
  c: "ㅊ",
  v: "ㅍ",
  b: "ㅠ",
  n: "ㅜ",
  m: "ㅡ",
  Q: "ㅃ",
  W: "ㅉ",
  E: "ㄸ",
  R: "ㄲ",
  T: "ㅆ",
  O: "ㅒ",
  P: "ㅖ",
};

const jamoToEnglish = new Map(
  Object.entries(englishToJamo).map(([key, value]) => [value, key])
);

const vowelPairs = new Map([
  ["ㅗㅏ", "ㅘ"],
  ["ㅗㅐ", "ㅙ"],
  ["ㅗㅣ", "ㅚ"],
  ["ㅜㅓ", "ㅝ"],
  ["ㅜㅔ", "ㅞ"],
  ["ㅜㅣ", "ㅟ"],
  ["ㅡㅣ", "ㅢ"],
]);

const vowelSplits = new Map([
  ["ㅘ", ["ㅗ", "ㅏ"]],
  ["ㅙ", ["ㅗ", "ㅐ"]],
  ["ㅚ", ["ㅗ", "ㅣ"]],
  ["ㅝ", ["ㅜ", "ㅓ"]],
  ["ㅞ", ["ㅜ", "ㅔ"]],
  ["ㅟ", ["ㅜ", "ㅣ"]],
  ["ㅢ", ["ㅡ", "ㅣ"]],
]);

const finalPairs = new Map([
  ["ㄱㅅ", "ㄳ"],
  ["ㄴㅈ", "ㄵ"],
  ["ㄴㅎ", "ㄶ"],
  ["ㄹㄱ", "ㄺ"],
  ["ㄹㅁ", "ㄻ"],
  ["ㄹㅂ", "ㄼ"],
  ["ㄹㅅ", "ㄽ"],
  ["ㄹㅌ", "ㄾ"],
  ["ㄹㅍ", "ㄿ"],
  ["ㄹㅎ", "ㅀ"],
  ["ㅂㅅ", "ㅄ"],
]);

const finalSplits = new Map([
  ["ㄳ", ["ㄱ", "ㅅ"]],
  ["ㄵ", ["ㄴ", "ㅈ"]],
  ["ㄶ", ["ㄴ", "ㅎ"]],
  ["ㄺ", ["ㄹ", "ㄱ"]],
  ["ㄻ", ["ㄹ", "ㅁ"]],
  ["ㄼ", ["ㄹ", "ㅂ"]],
  ["ㄽ", ["ㄹ", "ㅅ"]],
  ["ㄾ", ["ㄹ", "ㅌ"]],
  ["ㄿ", ["ㄹ", "ㅍ"]],
  ["ㅀ", ["ㄹ", "ㅎ"]],
  ["ㅄ", ["ㅂ", "ㅅ"]],
]);

const initialSet = new Set(INITIALS);
const medialSet = new Set(MEDIALS);
const finalSet = new Set(FINALS.filter(Boolean));

function isConsonant(value: string): boolean {
  return initialSet.has(value as (typeof INITIALS)[number]);
}

function isVowel(value: string): boolean {
  return medialSet.has(value as (typeof MEDIALS)[number]);
}

function canBeFinal(value: string): boolean {
  return finalSet.has(value as (typeof FINALS)[number]);
}

function combineVowel(left: string, right: string): string | null {
  return vowelPairs.get(`${left}${right}`) ?? null;
}

function combineFinal(left: string, right: string): string | null {
  return finalPairs.get(`${left}${right}`) ?? null;
}

function composeSyllable(
  initial: string,
  medial: string,
  final: string | null
): string {
  const initialIndex = INITIALS.indexOf(initial as (typeof INITIALS)[number]);
  const medialIndex = MEDIALS.indexOf(medial as (typeof MEDIALS)[number]);
  const finalIndex = FINALS.indexOf((final ?? "") as (typeof FINALS)[number]);

  if (initialIndex < 0 || medialIndex < 0 || finalIndex < 0) {
    return [initial, medial, final].filter(Boolean).join("");
  }

  return String.fromCharCode(
    0xac00 + (initialIndex * 21 + medialIndex) * 28 + finalIndex
  );
}

function englishCharToJamo(char: string): string {
  return englishToJamo[char] ?? englishToJamo[char.toLowerCase()] ?? char;
}

export function convertEnglishKeysToKorean(input: string): string {
  let output = "";
  let initial: string | null = null;
  let medial: string | null = null;
  let final: string | null = null;

  const flush = () => {
    if (initial && medial) {
      output += composeSyllable(initial, medial, final);
    } else {
      output += [initial, medial, final].filter(Boolean).join("");
    }

    initial = null;
    medial = null;
    final = null;
  };

  for (const char of input) {
    const jamo = englishCharToJamo(char);

    if (!isConsonant(jamo) && !isVowel(jamo)) {
      flush();
      output += char;
      continue;
    }

    if (isVowel(jamo)) {
      if (!initial) {
        if (!medial) {
          medial = jamo;
          continue;
        }

        const combined = combineVowel(medial, jamo);
        if (combined) {
          medial = combined;
        } else {
          flush();
          medial = jamo;
        }
        continue;
      }

      if (!medial) {
        medial = jamo;
        continue;
      }

      if (final) {
        const split = finalSplits.get(final);

        if (split) {
          output += composeSyllable(initial, medial, split[0]);
          initial = split[1];
        } else {
          output += composeSyllable(initial, medial, null);
          initial = final;
        }

        medial = jamo;
        final = null;
        continue;
      }

      const combined = combineVowel(medial, jamo);
      if (combined) {
        medial = combined;
      } else {
        flush();
        medial = jamo;
      }
      continue;
    }

    if (!initial) {
      initial = jamo;
      continue;
    }

    if (!medial) {
      flush();
      initial = jamo;
      continue;
    }

    if (!final) {
      if (canBeFinal(jamo)) {
        final = jamo;
      } else {
        flush();
        initial = jamo;
      }
      continue;
    }

    const combined = combineFinal(final, jamo);
    if (combined) {
      final = combined;
    } else {
      flush();
      initial = jamo;
    }
  }

  flush();
  return output;
}

function splitJamo(value: string): string[] {
  if (vowelSplits.has(value)) return vowelSplits.get(value) ?? [value];
  if (finalSplits.has(value)) return finalSplits.get(value) ?? [value];
  return [value];
}

function jamoToKey(value: string): string {
  return jamoToEnglish.get(value) ?? value;
}

export function convertKoreanToEnglishKeys(input: string): string {
  let output = "";

  for (const char of input) {
    const code = char.charCodeAt(0);

    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const initial = INITIALS[Math.floor(offset / 588)];
      const medial = MEDIALS[Math.floor((offset % 588) / 28)];
      const final = FINALS[offset % 28];
      const jamos = [
        initial,
        ...splitJamo(medial),
        ...(final ? splitJamo(final) : []),
      ];

      output += jamos.map(jamoToKey).join("");
      continue;
    }

    output += splitJamo(char).map(jamoToKey).join("");
  }

  return output;
}

export function guessKeyboardConversion(input: string): "to-korean" | "to-english" {
  const latinCount = Array.from(input.matchAll(/[A-Za-z]/g)).length;
  const hangulCount = Array.from(input.matchAll(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g)).length;

  return latinCount >= hangulCount ? "to-korean" : "to-english";
}
