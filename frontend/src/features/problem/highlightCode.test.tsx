import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { codeLanguages } from "./CodeEditor";
import { highlightCode } from "./highlightCode";

const examples: Record<string, string> = {
  java: "class Solution {}",
  kotlin: "fun solve() = true",
  python: "def solve(): return True",
  javascript: "const solve = () => true;",
  typescript: "let result: boolean = true;",
  cpp: "bool solve() { return true; }",
  c: "int solve(void) { return 1; }",
  csharp: "bool Solve() => true;",
  go: "func solve() bool { return true }",
  rust: "fn solve() -> bool { true }",
  swift: "func solve() -> Bool { true }",
  ruby: "def solve; true; end",
  sql: "SELECT 1;",
};

it("highlights each selectable programming language", () => {
  for (const syntax of codeLanguages.values()) {
    if (!syntax) continue;
    const markup = renderToStaticMarkup(
      <>{highlightCode(examples[syntax], syntax)}</>,
    );
    expect(markup).toContain('class="token ');
  }
});

it("renders code containing HTML characters as text", () => {
  const code = 'print("<script> & </script>")';
  const markup = renderToStaticMarkup(<>{highlightCode(code, "python")}</>);
  expect(markup).toContain("&lt;script&gt; &amp; &lt;/script&gt;");
  expect(markup).not.toContain("<script>");
});
