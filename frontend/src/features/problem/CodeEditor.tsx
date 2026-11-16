import { useRef } from "react";

export function CodeEditor({
  code,
  onChange,
}: {
  code: string;
  onChange: (code: string) => void;
}) {
  const gutter = useRef<HTMLPreElement>(null);
  return (
    <div className="code-editor">
      <pre className="line-numbers" aria-hidden="true" ref={gutter}>
        {Array.from(
          { length: code.split("\n").length },
          (_, index) => index + 1,
        ).join("\n")}
      </pre>
      <textarea
        aria-label="Solution code"
        value={code}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        placeholder="// Write or paste your solution here…"
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (gutter.current)
            gutter.current.scrollTop = event.currentTarget.scrollTop;
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab" || event.shiftKey) return;
          event.preventDefault();
          const input = event.currentTarget;
          const start = input.selectionStart;
          onChange(
            code.slice(0, start) + "  " + code.slice(input.selectionEnd),
          );
          requestAnimationFrame(() =>
            input.setSelectionRange(start + 2, start + 2),
          );
        }}
      />
    </div>
  );
}
