const DATAMUSE_BASE = "https://api.datamuse.com";
const FREE_DICTIONARY_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";

const rawPoolCache = new Map<number, string[]>();
const validatedPoolCache = new Map<number, string[]>();
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

type DictionaryEntry = {
  word?: string;
  meanings?: Array<unknown>;
};

async function validateWithDictionaryApi(word: string): Promise<boolean> {
  const normalized = word.trim().toLowerCase();

  if (!/^[a-z]+$/.test(normalized)) return false;

  const cacheKey = normalized.toUpperCase();
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(`${FREE_DICTIONARY_BASE}/${normalized}`);

    if (!response.ok) {
      validationCache.set(cacheKey, false);
      return false;
    }

    const data = (await response.json()) as DictionaryEntry[];

    const isValid =
      Array.isArray(data) &&
      data.length > 0 &&
      data.some(
        (entry) =>
          typeof entry.word === "string" &&
          entry.word.toLowerCase() === normalized &&
          Array.isArray(entry.meanings) &&
          entry.meanings.length > 0
      );

    validationCache.set(cacheKey, isValid);
    return isValid;
  } catch {
    validationCache.set(cacheKey, false);
    return false;
  }
}

export async function fetchRawWordPool(length: number): Promise<string[]> {
  if (rawPoolCache.has(length)) {
    return rawPoolCache.get(length)!;
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
  rawPoolCache.set(length, shuffled);
  return shuffled;
}

export async function fetchValidatedWordPool(length: number): Promise<string[]> {
  if (validatedPoolCache.has(length)) {
    return validatedPoolCache.get(length)!;
  }

  const rawPool = await fetchRawWordPool(length);
  const validated: string[] = [];

  for (const word of rawPool) {
    const ok = await validateWithDictionaryApi(word);
    if (ok) {
      validated.push(word);
    }
  }

  if (validated.length === 0) {
    throw new Error(`No validated words found for length ${length}`);
  }

  const shuffled = shuffle(validated);
  validatedPoolCache.set(length, shuffled);
  return shuffled;
}

export async function fetchRandomAnswer(length: number): Promise<string> {
  const pool = await fetchValidatedWordPool(length);
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function isDictionaryWord(
  word: string,
  length: number
): Promise<boolean> {
  const normalized = word.trim().toUpperCase();

  if (!/^[A-Z]+$/.test(normalized)) return false;
  if (normalized.length !== length) return false;

  return validateWithDictionaryApi(normalized);
}