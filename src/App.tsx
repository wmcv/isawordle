import { useEffect, useMemo, useRef, useState } from "react";
import "./styles/game.css";

import Header from "./components/Header";
import Board from "./components/Board";
import Keyboard from "./components/Keyboard";
import GameOverModal from "./components/GameOverModal";
import HelpModal from "./components/HelpModal";
import SettingsModal from "./components/SettingsModal";

import type { GameSettings, GameStatus, LetterState } from "./types";
import {
  DEFAULT_MAX_GUESSES,
  DEFAULT_WORD_LENGTH,
  buildBoard,
  clampMaxGuesses,
  clampWordLength,
  evaluateGuess,
  getKeyboardStates,
} from "./utils/gameLogic";
import { fetchRandomAnswer, isDictionaryWord } from "./utils/dictionaryApi";

const STORAGE_KEY = "wordle-unlimited-clean-v2";
const REVEAL_STEP_MS = 220;
const TILE_FLIP_DURATION_MS = 550;

type SavedGame = {
  answer: string;
  guesses: string[];
  currentGuess: string;
  status: GameStatus;
  settings: GameSettings;
};

type RevealState = {
  rowIndex: number;
  revealedCount: number;
  evaluatedRow: { letter: string; state: LetterState }[];
} | null;

function defaultSettings(): GameSettings {
  return {
    wordLength: DEFAULT_WORD_LENGTH,
    maxGuesses: DEFAULT_MAX_GUESSES,
  };
}

function loadGame(): SavedGame {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        answer: "",
        guesses: [],
        currentGuess: "",
        status: "playing",
        settings: defaultSettings(),
      };
    }

    const parsed = JSON.parse(raw) as SavedGame;

    return {
      answer: parsed.answer ?? "",
      guesses: Array.isArray(parsed.guesses) ? parsed.guesses : [],
      currentGuess: parsed.currentGuess ?? "",
      status: parsed.status ?? "playing",
      settings: {
        wordLength: clampWordLength(
          parsed.settings?.wordLength ?? DEFAULT_WORD_LENGTH
        ),
        maxGuesses: clampMaxGuesses(
          parsed.settings?.maxGuesses ?? DEFAULT_MAX_GUESSES
        ),
      },
    };
  } catch {
    return {
      answer: "",
      guesses: [],
      currentGuess: "",
      status: "playing",
      settings: defaultSettings(),
    };
  }
}

function mergeKeyStates(
  current: Record<string, LetterState>,
  tiles: { letter: string; state: LetterState }[]
): Record<string, LetterState> {
  const priority: Record<LetterState, number> = {
    empty: 0,
    absent: 1,
    present: 2,
    correct: 3,
  };

  const next = { ...current };

  for (const tile of tiles) {
    const existing = next[tile.letter] ?? "empty";
    if (priority[tile.state] > priority[existing]) {
      next[tile.letter] = tile.state;
    }
  }

  return next;
}

export default function App() {
  const initialGame = useMemo(() => loadGame(), []);

  const [settings, setSettings] = useState<GameSettings>(initialGame.settings);
  const [answer, setAnswer] = useState(initialGame.answer);
  const [guesses, setGuesses] = useState<string[]>(initialGame.guesses);
  const [currentGuess, setCurrentGuess] = useState(initialGame.currentGuess);
  const [status, setStatus] = useState<GameStatus>(initialGame.status);

  const [toast, setToast] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadingWord, setLoadingWord] = useState(false);
  const [revealState, setRevealState] = useState<RevealState>(null);
  const [displayedKeyStates, setDisplayedKeyStates] = useState<
    Record<string, LetterState>
  >({});

  const toastTimeoutRef = useRef<number | null>(null);
  const revealTimeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    const gameState: SavedGame = {
      answer,
      guesses,
      currentGuess,
      status,
      settings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [answer, guesses, currentGuess, status, settings]);

  useEffect(() => {
    return () => {
      revealTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function clearRevealTimers() {
    revealTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    revealTimeoutsRef.current = [];
  }

  function showToast(message: string) {
    setToast(message);

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setToast("");
    }, 1500);
  }

  async function startNewGame(nextSettings?: GameSettings) {
    const activeSettings = nextSettings ?? settings;

    clearRevealTimers();
    setRevealState(null);
    setDisplayedKeyStates({});
    setLoadingWord(true);
    setToast("");

    try {
      const newAnswer = await fetchRandomAnswer(activeSettings.wordLength);

      setSettings(activeSettings);
      setAnswer(newAnswer);
      setGuesses([]);
      setCurrentGuess("");
      setStatus("playing");
    } catch {
      showToast("Could not load a word");
    } finally {
      setLoadingWord(false);
    }
  }

  useEffect(() => {
    if (!answer) {
      void startNewGame(settings);
    } else {
      setDisplayedKeyStates(getKeyboardStates(guesses, answer));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finishReveal(submittedGuess: string, nextGuesses: string[]) {
    setDisplayedKeyStates(getKeyboardStates(nextGuesses, answer));
    setRevealState(null);

    if (submittedGuess === answer) {
      setStatus("won");
      return;
    }

    if (nextGuesses.length >= settings.maxGuesses) {
      setStatus("lost");
    }
  }

  function animateReveal(
    rowIndex: number,
    evaluatedGuess: { letter: string; state: LetterState }[],
    submittedGuess: string,
    nextGuesses: string[]
  ) {
    clearRevealTimers();

    setRevealState({
      rowIndex,
      revealedCount: 0,
      evaluatedRow: evaluatedGuess,
    });

    const baseKeyStates = getKeyboardStates(guesses, answer);

    for (let i = 1; i <= evaluatedGuess.length; i += 1) {
      const timeoutId = window.setTimeout(() => {
        setRevealState((prev) =>
          prev
            ? {
                ...prev,
                revealedCount: i,
              }
            : prev
        );

        setDisplayedKeyStates(
          mergeKeyStates(baseKeyStates, evaluatedGuess.slice(0, i))
        );
      }, (i - 1) * REVEAL_STEP_MS);

      revealTimeoutsRef.current.push(timeoutId);
    }

    const finishTimeoutId = window.setTimeout(() => {
      finishReveal(submittedGuess, nextGuesses);
    }, (evaluatedGuess.length - 1) * REVEAL_STEP_MS + TILE_FLIP_DURATION_MS);

    revealTimeoutsRef.current.push(finishTimeoutId);
  }

  async function submitGuess() {
    if (status !== "playing" || loadingWord || revealState) return;

    const submittedGuess = currentGuess.trim().toUpperCase();

    if (submittedGuess.length !== settings.wordLength) {
      showToast("Not enough letters");
      return;
    }

    const valid = await isDictionaryWord(submittedGuess, settings.wordLength);
    if (!valid) {
      showToast("Not in word list");
      return;
    }

    const nextGuesses = [...guesses, submittedGuess];
    const rowIndex = guesses.length;
    const evaluatedGuess = evaluateGuess(submittedGuess, answer);

    setGuesses(nextGuesses);
    setCurrentGuess("");
    animateReveal(rowIndex, evaluatedGuess, submittedGuess, nextGuesses);
  }

  function handleKeyPress(value: string) {
    if (status !== "playing" || loadingWord || revealState) return;

    if (value === "ENTER") {
      void submitGuess();
      return;
    }

    if (value === "BACKSPACE") {
      setCurrentGuess((prev) => prev.slice(0, -1));
      return;
    }

    if (/^[A-Z]$/.test(value)) {
      setCurrentGuess((prev) =>
        prev.length < settings.wordLength ? prev + value : prev
      );
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();

      const isFormField =
        tagName === "input" ||
        tagName === "textarea" ||
        target?.isContentEditable;

      if (isFormField) {
        return;
      }

      const key = event.key.toUpperCase();

      if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
        event.preventDefault();
        handleKeyPress(key);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    status,
    loadingWord,
    revealState,
    settings.wordLength,
    currentGuess,
    guesses,
    answer,
  ]);

  const board = useMemo(
    () =>
      buildBoard(
        guesses,
        currentGuess,
        answer || "?".repeat(settings.wordLength),
        settings.maxGuesses
      ),
    [guesses, currentGuess, answer, settings]
  );

  const animatedBoard = useMemo(() => {
    if (!revealState) return board;

    return board.map((row, rowIndex) => {
      if (rowIndex !== revealState.rowIndex) return row;

      return row.map((_, tileIndex) => {
        if (tileIndex < revealState.revealedCount) {
          return revealState.evaluatedRow[tileIndex];
        }

        return {
          letter: revealState.evaluatedRow[tileIndex].letter,
          state: "empty" as const,
        };
      });
    });
  }, [board, revealState]);

  const settledRowCount = revealState ? guesses.length - 1 : guesses.length;

  function applySettings(nextSettings: GameSettings) {
    setSettingsOpen(false);
    void startNewGame({
      wordLength: clampWordLength(nextSettings.wordLength),
      maxGuesses: clampMaxGuesses(nextSettings.maxGuesses),
    });
  }

  return (
    <div className="app">
      <div className="game-shell">
        <Header
          onHelp={() => setHelpOpen(true)}
          onSettings={() => setSettingsOpen(true)}
        />

        {toast && <div className="toast">{toast}</div>}

        <main className="main-content">
          <Board
            board={animatedBoard}
            revealState={revealState}
            settledRowCount={settledRowCount}
          />
        </main>

        <div className="status-line">
          {loadingWord
            ? "Loading word..."
            : revealState
            ? "Revealing..."
            : `${settings.wordLength} letters • ${settings.maxGuesses} guesses`}
        </div>

        <Keyboard keyStates={displayedKeyStates} onKeyPress={handleKeyPress} />
      </div>

      <GameOverModal
        status={status}
        answer={answer}
        onPlayAgain={() => void startNewGame()}
      />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <SettingsModal
        open={settingsOpen}
        currentSettings={settings}
        onClose={() => setSettingsOpen(false)}
        onApply={applySettings}
      />
    </div>
  );
}
