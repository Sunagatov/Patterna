import { Brand } from "./Brand";
import { Icon } from "../shared/ui/Icon";
import type { Theme } from "./useTheme";

export function SiteHeader({
  theme,
  onToggleTheme,
}: {
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const label = `Switch to ${theme === "light" ? "dark" : "light"} theme`;
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="header-nav" aria-label="Main navigation">
          <a className="nav-link active" href="/#library" aria-current="page">
            Problems
          </a>
        </nav>
        <div className="header-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={onToggleTheme}
            aria-label={label}
            title={label}
            aria-pressed={theme === "dark"}
          >
            <Icon name={theme === "light" ? "moon" : "sun"} />
          </button>
          <span className="avatar" aria-label="Zufar">
            ZS
          </span>
        </div>
      </div>
    </header>
  );
}
