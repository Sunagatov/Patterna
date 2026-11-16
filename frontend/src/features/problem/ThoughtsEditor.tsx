import { useRef, useState } from "react";
import { FormattedThoughts } from "./FormattedThoughts";

export function ThoughtsEditor({
  text,
  onChange,
}: {
  text: string;
  onChange: (text: string) => void;
}) {
  const [preview, setPreview] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  function format(before: string, after: string, fallback: string) {
    const element = input.current;
    if (!element) return;
    const { selectionStart: start, selectionEnd: end } = element;
    const selected = text.slice(start, end) || fallback;
    onChange(
      text.slice(0, start) + before + selected + after + text.slice(end),
    );
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  }
  return (
    <section className="thoughts-editor" aria-label="Solution thoughts">
      <div className="thoughts-toolbar">
        <strong>Thoughts</strong>
        <div className="editor-view-switch" aria-label="Thoughts view">
          <button aria-pressed={!preview} onClick={() => setPreview(false)}>
            Write
          </button>
          <button aria-pressed={preview} onClick={() => setPreview(true)}>
            Preview
          </button>
        </div>
        {!preview ? (
          <div className="format-tools" aria-label="Text formatting">
            <button
              aria-label="Bold"
              onClick={() => format("**", "**", "bold text")}
            >
              <b>B</b>
            </button>
            <button
              aria-label="Italic"
              onClick={() => format("*", "*", "italic text")}
            >
              <i>I</i>
            </button>
            <button
              aria-label="Inline code"
              onClick={() => format("`", "`", "code")}
            >
              &lt;/&gt;
            </button>
            <button
              aria-label="Bullet list"
              onClick={() =>
                format(
                  text && !text.endsWith("\n") ? "\n- " : "- ",
                  "",
                  "List item",
                )
              }
            >
              List
            </button>
          </div>
        ) : null}
      </div>
      {preview ? (
        <div className="thoughts-preview">
          <FormattedThoughts text={text} />
        </div>
      ) : (
        <textarea
          ref={input}
          aria-label="Solution thoughts"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Explain this approach, what you learned, and what to remember…"
        />
      )}
    </section>
  );
}
