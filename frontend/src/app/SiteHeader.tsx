import { useLayoutEffect, useRef } from "react";
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
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const header = ref.current;
    if (!header) return;
    const root = document.documentElement;
    const syncHeight = () => {
      root.style.setProperty(
        "--site-header-height",
        `${header.offsetHeight}px`,
      );
    };
    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(header, { box: "border-box" });
    return () => {
      observer.disconnect();
      root.style.removeProperty("--site-header-height");
    };
  }, []);

  return (
    <header ref={ref} className={`site-header ${className}`}>
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
