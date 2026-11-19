import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const languageOptions = [
  ["Plain text", null],
  ["Java", "java"],
  ["Kotlin", "kotlin"],
  ["Python", "python"],
  ["JavaScript", "javascript"],
  ["TypeScript", "typescript"],
  ["C++", "cpp"],
  ["C", "c"],
  ["C#", "csharp"],
  ["Go", "go"],
  ["Rust", "rust"],
  ["Swift", "swift"],
  ["Ruby", "ruby"],
  ["SQL", "sql"],
] as const;

export type CodeLanguage = NonNullable<(typeof languageOptions)[number][1]>;
export const codeLanguages = new Map<string, CodeLanguage | null>(
  languageOptions,
);

const maxHighlightLength = 50_000;
type HighlightCode = typeof import("./highlightCode").highlightCode;

export function CodeEditor({
  code,
  language,
  readOnly,
  onChange,
}: {
  code: string;
  language: string;
  readOnly: boolean;
  onChange: (code: string) => void;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const [highlight, setHighlight] = useState<HighlightCode>();
  const text = code.replace(/\r\n?/g, "\n");
  const syntax =
    text.length <= maxHighlightLength && text
      ? codeLanguages.get(language)
      : null;
  const needsHighlighting = Boolean(syntax);

  useEffect(() => {
    if (!needsHighlighting || highlight) return;
    let active = true;
    import("./highlightCode")
      .then(({ highlightCode }) => {
        if (active) setHighlight(() => highlightCode);
      })
      .catch(() => {
        // The textarea still displays plain text when the highlighter fails to load.
      });
    return () => {
      active = false;
    };
  }, [needsHighlighting, highlight]);

  const tokens = useMemo(() => {
    if (!highlight || !syntax) return null;
    try {
      return highlight(text, syntax);
    } catch {
      return null;
    }
  }, [highlight, syntax, text]);

  function syncScroll({ scrollLeft, scrollTop }: HTMLTextAreaElement) {
    editor.current?.style.setProperty("--code-scroll-x", `${-scrollLeft}px`);
    editor.current?.style.setProperty("--code-scroll-y", `${-scrollTop}px`);
  }

  useLayoutEffect(() => {
    if (input.current) syncScroll(input.current);
  }, [text]);

  const lineNumbers = useMemo(
    () =>
      text
        .split("\n")
        .map((_, index) => index + 1)
        .join("\n"),
    [text],
  );

  return (
    <div className="code-editor" ref={editor}>
      <pre className="line-numbers" aria-hidden="true">
        <span>{lineNumbers}</span>
      </pre>
      <div className="code-input">
        {tokens ? (
          <div className="code-highlight" aria-hidden="true">
            <pre>{tokens}</pre>
          </div>
        ) : null}
        <textarea
          ref={input}
          aria-label="Solution code"
          data-highlighted={tokens ? "" : undefined}
          value={code}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          placeholder="// Write or paste your solution here…"
          onChange={(event) => onChange(event.target.value)}
          onScroll={(event) => syncScroll(event.currentTarget)}
          onKeyDown={(event) => {
            if (readOnly || event.key !== "Tab" || event.shiftKey) return;
            event.preventDefault();
            const field = event.currentTarget;
            const { value, selectionStart: start, selectionEnd: end } = field;
            onChange(value.slice(0, start) + "  " + value.slice(end));
            requestAnimationFrame(() =>
              field.setSelectionRange(start + 2, start + 2),
            );
          }}
        />
      </div>
    </div>
  );
}
