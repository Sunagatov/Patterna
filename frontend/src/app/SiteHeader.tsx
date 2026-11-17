import { Brand } from "./Brand";
import { Icon } from "../shared/ui/Icon";
import type { Theme } from "./useTheme";

export function SiteHeader({
  theme,
  onToggleTheme,
  onSignOut,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  onSignOut: () => void;
}) {
  const label = `Switch to ${theme === "light" ? "dark" : "light"} theme`;
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
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
          <button className="button sign-out" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
