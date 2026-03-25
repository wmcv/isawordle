import type { LetterState } from "../types";

type KeyButtonProps = {
  label: string;
  state?: LetterState;
  onClick: (value: string) => void;
};

export default function KeyButton({ label, state, onClick }: KeyButtonProps) {
  const stateClass =
    state === "correct"
      ? "key-correct"
      : state === "present"
      ? "key-present"
      : state === "absent"
      ? "key-absent"
      : "key-default";

  const wide = label === "ENTER" || label === "BACKSPACE";

  return (
    <button
      className={`key ${stateClass} ${wide ? "key-wide" : ""}`}
      onClick={() => onClick(label)}
      type="button"
    >
      {label === "BACKSPACE" ? "⌫" : label}
    </button>
  );
}
