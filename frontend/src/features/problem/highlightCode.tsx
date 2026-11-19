import type { ReactNode } from "react";
import c from "refractor/c";
import cpp from "refractor/cpp";
import csharp from "refractor/csharp";
import { refractor } from "refractor/core";
import go from "refractor/go";
import java from "refractor/java";
import javascript from "refractor/javascript";
import kotlin from "refractor/kotlin";
import python from "refractor/python";
import ruby from "refractor/ruby";
import rust from "refractor/rust";
import sql from "refractor/sql";
import swift from "refractor/swift";
import typescript from "refractor/typescript";

for (const grammar of [
  c,
  cpp,
  csharp,
  go,
  java,
  javascript,
  kotlin,
  python,
  ruby,
  rust,
  sql,
  swift,
  typescript,
]) {
  refractor.register(grammar);
}

type HighlightNodes = ReturnType<typeof refractor.highlight>["children"];

function renderTokens(nodes: HighlightNodes): ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === "text") return node.value;
    if (node.type !== "element") return null;
    const classes = node.properties.className;
    return (
      <span
        key={index}
        className={Array.isArray(classes) ? classes.join(" ") : undefined}
      >
        {renderTokens(node.children)}
      </span>
    );
  });
}

export function highlightCode(code: string, language: string): ReactNode[] {
  return renderTokens(refractor.highlight(code, language).children);
}
