import { useEffect, useState } from "react";
import type { GameSettings } from "../types";

type SettingsModalProps = {
  open: boolean;
  currentSettings: GameSettings;
  onClose: () => void;
  onApply: (settings: GameSettings) => void;
};

export default function SettingsModal({
  open,
  currentSettings,
  onClose,
  onApply,
}: SettingsModalProps) {
  const [wordLength, setWordLength] = useState(currentSettings.wordLength);
  const [maxGuesses, setMaxGuesses] = useState(currentSettings.maxGuesses);

  useEffect(() => {
    setWordLength(currentSettings.wordLength);
    setMaxGuesses(currentSettings.maxGuesses);
  }, [currentSettings]);

  if (!open) return null;

  function apply() {
    onApply({
      wordLength: Math.max(2, Math.min(7, wordLength)),
      maxGuesses: Math.max(1, Math.min(10, maxGuesses)),
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">SETTINGS</h2>

        <div className="settings-group">
          <label className="settings-label">Word length (3–7)</label>
          <input
            className="settings-input"
            type="number"
            min={3}
            max={7}
            value={wordLength}
            onChange={(e) => setWordLength(Number(e.target.value))}
          />
        </div>

        <div className="settings-group">
          <label className="settings-label">Guesses (1–10)</label>
          <input
            className="settings-input"
            type="number"
            min={1}
            max={10}
            value={maxGuesses}
            onChange={(e) => setMaxGuesses(Number(e.target.value))}
          />
        </div>

        <div className="settings-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            CANCEL
          </button>
          <button className="play-again-button" onClick={apply} type="button">
            APPLY
          </button>
        </div>
      </div>
    </div>
  );
}
