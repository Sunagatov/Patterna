import { LibraryPage } from "../features/library/LibraryPage";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { useTheme } from "./useTheme";

export function App() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div id="top">
      <a className="skip-link" href="#main">
        Skip to problems
      </a>
      <SiteHeader theme={theme} onToggleTheme={toggleTheme} />
      <LibraryPage />
      <SiteFooter />
    </div>
  );
}
