import type { ReactNode } from "react";

export function formatInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

// Deliberately render text through React; saved thoughts never become raw HTML.
export function FormattedThoughts({ text }: { text: string }) {
  const lines = text.split(/\r\n?|\n/);
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const key = index;
    const line = lines[index];
    if (!line.trim()) {
      index++;
      continue;
    }
    if (line.startsWith("```")) {
      const code: string[] = [];
      index++;
      while (index < lines.length && !lines[index].startsWith("```"))
        code.push(lines[index++]);
      index++;
      blocks.push(
        <pre key={key}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
    } else if (/^#{1,3} /.test(line)) {
      blocks.push(
        <h3 key={key}>{formatInline(line.replace(/^#{1,3} /, ""))}</h3>,
      );
      index++;
    } else if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const pattern = ordered ? /^\d+\. / : /^[-*] /;
      const start = Number.parseInt(line, 10);
      const items: ReactNode[] = [];
      while (index < lines.length && pattern.test(lines[index])) {
        items.push(
          <li key={index}>
            {formatInline(lines[index++].replace(pattern, ""))}
          </li>,
        );
      }
      blocks.push(
        ordered ? (
          <ol key={key} start={Number.isSafeInteger(start) ? start : undefined}>
            {items}
          </ol>
        ) : (
          <ul key={key}>{items}</ul>
        ),
      );
    } else {
      const paragraph: string[] = [line];
      index++;
      while (
        index < lines.length &&
        lines[index].trim() &&
        !/^(#{1,3} |[-*] |\d+\. |```)/.test(lines[index])
      )
        paragraph.push(lines[index++]);
      blocks.push(<p key={key}>{formatInline(paragraph.join("\n"))}</p>);
    }
  }
  return (
    <div className="formatted-thoughts">
      {blocks.length ? (
        blocks
      ) : (
        <p className="detail-muted">No thoughts added to this solution yet.</p>
      )}
    </div>
  );
}
