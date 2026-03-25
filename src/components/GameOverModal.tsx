import type { GameStatus } from "../types";

type GameOverModalProps = {
  status: GameStatus;
  answer: string;
  winCompliment: string;
  onPlayAgain: () => void;
};

export default function GameOverModal({
  status,
  answer,
  winCompliment,
  onPlayAgain,
}: GameOverModalProps) {
  if (status === "playing") return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">
          {status === "won" ? "YOU GOT IT" : "GAME OVER"}
        </h2>

        <p className="modal-text">
          The word was <strong>{answer}</strong>.
        </p>

        {status === "won" && winCompliment && (
          <p className="modal-compliment">{winCompliment}</p>
        )}

        <button
          className="play-again-button"
          onClick={onPlayAgain}
          type="button"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
