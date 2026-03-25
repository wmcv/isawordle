export type LetterState = "correct" | "present" | "absent" | "empty";
export type GameStatus = "playing" | "won" | "lost";

export type TileData = {
  letter: string;
  state: LetterState;
};

export type GameSettings = {
  wordLength: number;
  maxGuesses: number;
};