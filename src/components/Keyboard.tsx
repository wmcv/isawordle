import KeyButton from "./KeyButton";
import type { LetterState } from "../types";

const KEY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

type KeyboardProps = {
  keyStates: Record<string, LetterState>;
  onKeyPress: (value: string) => void;
};

export default function Keyboard({ keyStates, onKeyPress }: KeyboardProps) {
  return (
    <div className="keyboard">
      {KEY_ROWS.map((row, rowIndex) => (
        <div className="keyboard-row" key={rowIndex}>
          {row.map((key) => (
            <KeyButton
              key={key}
              label={key}
              state={key.length === 1 ? keyStates[key] : undefined}
              onClick={onKeyPress}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
