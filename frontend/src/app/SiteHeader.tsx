import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { Icon } from "../shared/ui/Icon";
import type { Theme } from "./useTheme";

export function SiteHeader({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`site-header ${className}`}>
      <div className="header-inner">
        <Brand />
        {children}
      </div>
    </header>
  );
}

export function LibraryHeader({
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
    <SiteHeader>
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
    </SiteHeader>
  );
}
