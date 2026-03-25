import { CircleHelp, Settings } from "lucide-react";

type HeaderProps = {
  onHelp: () => void;
  onSettings: () => void;
};

export default function Header({ onHelp, onSettings }: HeaderProps) {
  return (
    <header className="header">
      <button
        className="icon-button"
        onClick={onHelp}
        type="button"
        aria-label="help"
      >
        <CircleHelp size={28} strokeWidth={2.2} />
      </button>

      <h1 className="title">IsaWordle</h1>

      <div className="header-right">
        <button
          className="icon-button"
          type="button"
          aria-label="settings"
          onClick={onSettings}
        >
          <Settings size={28} strokeWidth={2.2} />
        </button>
      </div>
    </header>
  );
}
