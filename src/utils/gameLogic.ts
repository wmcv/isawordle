import type { LetterState, TileData } from "../types";

export const DEFAULT_WORD_LENGTH = 5;
export const DEFAULT_MAX_GUESSES = 6;

export function clampWordLength(value: number): number {
  return Math.max(3, Math.min(7, value));
}

export function clampMaxGuesses(value: number): number {
  return Math.max(1, Math.min(10, value));
}

export function evaluateGuess(guess: string, answer: string): TileData[] {
  const length = answer.length;

  const result: TileData[] = guess.split("").map((letter) => ({
    letter,
    state: "absent",
  }));

  const used = Array(length).fill(false);

  for (let i = 0; i < length; i += 1) {
    if (guess[i] === answer[i]) {
      result[i].state = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < length; i += 1) {
    if (result[i].state === "correct") continue;

    for (let j = 0; j < length; j += 1) {
      if (!used[j] && guess[i] === answer[j]) {
        result[i].state = "present";
        used[j] = true;
        break;
      }
    }
  }

  return result;
}

export function getKeyboardStates(
  guesses: string[],
  answer: string
): Record<string, LetterState> {
  const priority: Record<LetterState, number> = {
    empty: 0,
    absent: 1,
    present: 2,
    correct: 3,
  };

  const stateMap: Record<string, LetterState> = {};

  for (const guess of guesses) {
    const evaluated = evaluateGuess(guess, answer);
    for (const tile of evaluated) {
      const current = stateMap[tile.letter] ?? "empty";
      if (priority[tile.state] > priority[current]) {
        stateMap[tile.letter] = tile.state;
      }
    }
  }

  return stateMap;
}

export function buildBoard(
  guesses: string[],
  currentGuess: string,
  answer: string,
  maxGuesses: number
): TileData[][] {
  const rows: TileData[][] = guesses.map((guess) => evaluateGuess(guess, answer));

  if (rows.length < maxGuesses) {
    rows.push(
      Array.from({ length: answer.length }, (_, index) => ({
        letter: currentGuess[index] ?? "",
        state: "empty" as const,
      }))
    );
  }

  while (rows.length < maxGuesses) {
    rows.push(
      Array.from({ length: answer.length }, () => ({
        letter: "",
        state: "empty" as const,
      }))
    );
  }

  return rows;
}