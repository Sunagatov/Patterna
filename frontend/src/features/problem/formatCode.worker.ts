import type { CodeLanguage } from "./CodeEditor";

export type FormatRequest = { code: string; language: CodeLanguage };
export type FormatResult = { code: string } | { error: true };

const clangFilenames = {
  c: "solution.c",
  cpp: "solution.cpp",
  csharp: "solution.cs",
  java: "Solution.java",
};

async function loadWasm(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load formatter.");

  const bytes = new Uint8Array(await response.arrayBuffer());
  // Some servers serve .br assets with Content-Encoding, which fetch decodes.
  if (bytes[0] === 0 && bytes[1] === 97 && bytes[2] === 115 && bytes[3] === 109)
    return bytes;

  const { decompress } = await (await import("brotli-dec-wasm")).default;
  return decompress(bytes);
}

async function formatCode({ code, language }: FormatRequest): Promise<string> {
  switch (language) {
    case "javascript":
    case "typescript": {
      const [prettier, estree, parser] = await Promise.all([
        import("prettier/standalone"),
        import("prettier/plugins/estree"),
        language === "javascript"
          ? import("prettier/plugins/babel")
          : import("prettier/plugins/typescript"),
      ]);
      return prettier.format(code, {
        parser: language === "javascript" ? "babel" : "typescript",
        plugins: [parser.default, estree.default],
      });
    }
    case "c":
    case "cpp":
    case "csharp":
    case "java": {
      const { default: init, format } =
        await import("@wasm-fmt/clang-format/vite");
      await init();
      return format(
        code,
        clangFilenames[language],
        "{BasedOnStyle: LLVM, SortIncludes: Never, SortUsingDeclarations: Never}",
      );
    }
    case "python": {
      const { default: init, format } = await import("@wasm-fmt/ruff_fmt/vite");
      await init();
      return format(code, "solution.py");
    }
    case "go": {
      const { default: init, format } = await import("@wasm-fmt/gofmt/vite");
      await init();
      return format(code);
    }
    case "sql": {
      const { default: init, format } = await import("@wasm-fmt/sql_fmt/vite");
      await init();
      return format(code, { uppercase: true });
    }
    case "kotlin": {
      const [{ format, init }, { default: url }] = await Promise.all([
        import("@scalar/kotlin-fmt"),
        import("@scalar/kotlin-fmt/wasm?url"),
      ]);
      await init({ bytes: await loadWasm(url) });
      return format(code, { style: "kotlinlang", removeUnusedImports: false });
    }
    case "rust": {
      const [{ format, init }, { default: url }] = await Promise.all([
        import("@scalar/rust-fmt"),
        import("@scalar/rust-fmt/wasm?url"),
      ]);
      await init({ bytes: await loadWasm(url) });
      return format(code);
    }
    case "swift": {
      const [{ format, init }, { default: url }] = await Promise.all([
        import("@scalar/swift-fmt"),
        import("@scalar/swift-fmt/wasm?url"),
      ]);
      await init({ bytes: await loadWasm(url) });
      return format(code);
    }
    case "ruby": {
      const [{ format, init }, { default: url }] = await Promise.all([
        import("@scalar/ruby-fmt"),
        import("@scalar/ruby-fmt/wasm?url"),
      ]);
      await init({ bytes: await loadWasm(url) });
      return format(code);
    }
  }
}

self.onmessage = async ({ data }: MessageEvent<FormatRequest>) => {
  let result: FormatResult;
  try {
    const code = await formatCode(data);
    result = code.trim() ? { code } : { error: true };
  } catch {
    result = { error: true };
  }
  self.postMessage(result);
};
