type HelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">HOW TO PLAY</h2>
        <p className="modal-text">Guess the 5-letter word in 6 tries.</p>
        <p className="modal-text">Green = correct letter, correct position.</p>
        <p className="modal-text">Yellow = in the word, wrong position.</p>
        <p className="modal-text">Dark gray = not in the word.</p>

        <button className="play-again-button" onClick={onClose} type="button">
          CLOSE
        </button>
      </div>
    </div>
  );
}
