import type { TileData } from "../types";

type TileProps = {
  tile: TileData;
  showBack?: boolean;
  animateFlip?: boolean;
};

export default function Tile({
  tile,
  showBack = false,
  animateFlip = false,
}: TileProps) {
  const stateClass =
    tile.state === "correct"
      ? "tile-correct"
      : tile.state === "present"
      ? "tile-present"
      : tile.state === "absent"
      ? "tile-absent"
      : tile.letter
      ? "tile-filled"
      : "tile-empty";

  const wrapperClass = [
    "tile-wrapper",
    showBack ? "tile-show-back" : "",
    animateFlip ? "tile-flip" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass}>
      <div className="tile-flip-inner">
        <div
          className={`tile tile-front ${
            tile.letter ? "tile-filled" : "tile-empty"
          }`}
        >
          {tile.letter}
        </div>
        <div className={`tile tile-back ${stateClass}`}>{tile.letter}</div>
      </div>
    </div>
  );
}
