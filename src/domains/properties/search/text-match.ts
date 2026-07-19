/**
 * Diacritic-tolerant + light typo-tolerant text match for property search UI.
 */

export function foldDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** Simple Levenshtein — fine for short query tokens. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    let prev = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cur =
        a[i] === b[j]
          ? row[j]!
          : 1 + Math.min(row[j]!, row[j + 1]!, prev);
      row[j] = prev;
      prev = cur;
    }
    row[b.length] = prev;
  }
  return row[b.length]!;
}

/**
 * True when haystack fuzzy-matches needle (diacritics folded, small typos OK).
 */
export function fuzzyIncludes(haystack: string, needle: string): boolean {
  const h = foldDiacritics(haystack);
  const n = foldDiacritics(needle).trim();
  if (!n) return true;
  if (h.includes(n)) return true;

  const tokens = n.split(/\s+/).filter(Boolean);
  return tokens.every((token) => {
    if (h.includes(token)) return true;
    if (token.length < 3) return false;
    const words = h.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
    const maxDist = token.length <= 4 ? 1 : 2;
    return words.some((w) => {
      if (Math.abs(w.length - token.length) > maxDist) return false;
      return levenshtein(w, token) <= maxDist;
    });
  });
}
