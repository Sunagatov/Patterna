import { Brand } from "./Brand";
import { Icon } from "../shared/ui/Icon";

const externalLinkProps = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <Brand />
            <p>
              Your personal space for
              <br />
              algorithm practice.
            </p>
            <a
              className="support-button"
              href="https://buymeacoffee.com/lucky_1uck"
              {...externalLinkProps}
              aria-label="Support this project on Buy Me a Coffee (opens in a new tab)"
            >
              <Icon name="coffee" />
              Support this project
            </a>
            <div className="social-links">
              <a
                href="https://github.com/Sunagatov/Patterna"
                {...externalLinkProps}
                aria-label="Patterna on GitHub"
              >
                <Icon name="github" />
              </a>
              <a
                href="https://t.me/lucky_1uck"
                {...externalLinkProps}
                aria-label="Telegram"
              >
                <Icon name="telegram" />
              </a>
              <a
                href="https://www.linkedin.com/in/zufar-sunagatov/"
                {...externalLinkProps}
                aria-label="LinkedIn"
              >
                <Icon name="linkedin" />
              </a>
            </div>
          </div>
          <div className="footer-column">
            <h2>Practice</h2>
            <nav aria-label="Practice links">
              <a href="/?list=all#library">All problems</a>
              <a href="/?review=true#library">Needs review</a>
              <a href="#top">
                Back to top <Icon name="arrowUp" />
              </a>
            </nav>
          </div>
          <div className="footer-column">
            <h2>Project</h2>
            <nav aria-label="Project links">
              <a
                href="https://github.com/Sunagatov/Patterna"
                {...externalLinkProps}
              >
                GitHub repository <Icon name="arrowUpRight" />
              </a>
              <a
                href="https://neetcode.io/practice/practice/neetcode250"
                {...externalLinkProps}
              >
                NeetCode
              </a>
              <a href="https://leetcode.com/problemset/" {...externalLinkProps}>
                LeetCode
              </a>
              <a
                href="https://www.algoexpert.io/questions"
                {...externalLinkProps}
              >
                AlgoExpert
              </a>
            </nav>
          </div>
          <div className="footer-column footer-contact">
            <h2>Contact</h2>
            <nav aria-label="Contact links">
              <a href="mailto:zufar.sunagatov@gmail.com">
                zufar.sunagatov@gmail.com
              </a>
              <a href="https://t.me/lucky_1uck" {...externalLinkProps}>
                Telegram
              </a>
              <a
                href="https://www.linkedin.com/in/zufar-sunagatov/"
                {...externalLinkProps}
              >
                LinkedIn
              </a>
            </nav>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Patterna</span>
          <span>Made for steady progress.</span>
        </div>
      </div>
    </footer>
  );
}
