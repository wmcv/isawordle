import Tile from "./Tile";
import type { LetterState, TileData } from "../types";

type RevealState = {
  rowIndex: number;
  revealedCount: number;
  evaluatedRow: { letter: string; state: LetterState }[];
} | null;

type BoardProps = {
  board: TileData[][];
  revealState?: RevealState;
  settledRowCount: number;
};

export default function Board({
  board,
  revealState = null,
  settledRowCount,
}: BoardProps) {
  return (
    <div className="board">
      {board.map((row, rowIndex) => (
        <div
          className="board-row"
          key={rowIndex}
          style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}
        >
          {row.map((tile, tileIndex) => {
            const isSettledRow = rowIndex < settledRowCount;
            const isRevealRow = revealState?.rowIndex === rowIndex;
            const isRevealedTile =
              isRevealRow && tileIndex < revealState.revealedCount;
            const shouldShowBack = isSettledRow || isRevealedTile;
            const shouldAnimate = isRevealRow && isRevealedTile;

            return (
              <Tile
                key={`${rowIndex}-${tileIndex}`}
                tile={tile}
                showBack={shouldShowBack}
                animateFlip={shouldAnimate}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
