const DATAMUSE_BASE = "https://api.datamuse.com";

const wordPoolCache = new Map<number, string[]>();
const validationCache = new Map<string, boolean>();

function isCleanWord(word: string, length: number): boolean {
  return /^[A-Za-z]+$/.test(word) && word.length === length;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function fetchWordPool(length: number): Promise<string[]> {
  if (wordPoolCache.has(length)) {
    return wordPoolCache.get(length)!;
  }

  const pattern = "?".repeat(length);
  const response = await fetch(`${DATAMUSE_BASE}/words?sp=${pattern}&max=2000`);

  if (!response.ok) {
    throw new Error("Failed to fetch words");
  }

  const data: Array<{ word: string }> = await response.json();

  const cleaned = Array.from(
    new Set(
      data
        .map((item) => item.word.toUpperCase())
        .filter((word) => isCleanWord(word, length))
    )
  );

  if (cleaned.length === 0) {
    throw new Error("No words found");
  }

  const shuffled = shuffle(cleaned);
  wordPoolCache.set(length, shuffled);
  return shuffled;
}

export async function fetchRandomAnswer(length: number): Promise<string> {
  const pool = await fetchWordPool(length);
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function isDictionaryWord(
  word: string,
  length: number
): Promise<boolean> {
  const normalized = word.trim().toUpperCase();

  if (!/^[A-Z]+$/.test(normalized)) return false;
  if (normalized.length !== length) return false;

  const cacheKey = `${length}:${normalized}`;
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `${DATAMUSE_BASE}/words?sp=${normalized.toLowerCase()}&max=20`
    );

    if (!response.ok) {
      validationCache.set(cacheKey, false);
      return false;
    }

    const data: Array<{ word: string }> = await response.json();

    const isValid = data.some(
      (item) => item.word.toUpperCase() === normalized
    );

    validationCache.set(cacheKey, isValid);
    return isValid;
  } catch {
    validationCache.set(cacheKey, false);
    return false;
  }
}