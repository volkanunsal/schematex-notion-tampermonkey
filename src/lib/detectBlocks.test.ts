import { describe, expect, test } from "vitest";
import {
  extractCodeBlockText,
  findNotionLanguage,
  findUnprocessedSchematexBlocks,
  parseSchematexFence,
} from "./detectBlocks";

function makeNotionCodeBlock(language: string, lines: string[]): HTMLElement {
  const container = document.createElement("div");
  container.className = "notion-code-block";
  container.setAttribute("data-notion-code-language", language);
  for (const [index, line] of lines.entries()) {
    const lineDiv = document.createElement("div");
    lineDiv.setAttribute("data-line-index", String(index));
    lineDiv.textContent = line;
    container.appendChild(lineDiv);
  }
  return container;
}

describe("findNotionLanguage", () => {
  test("reads the data-notion-code-language attribute", () => {
    const block = makeNotionCodeBlock("Markdown", ["```schematex", "flowchart", "```"]);
    expect(findNotionLanguage(block)).toBe("Markdown");
  });

  test("returns null when the attribute is absent", () => {
    const block = document.createElement("div");
    expect(findNotionLanguage(block)).toBeNull();
  });
});

describe("extractCodeBlockText", () => {
  test("joins per-line divs with newlines", () => {
    const block = makeNotionCodeBlock("Markdown", ["line one", "line two", "line three"]);
    expect(extractCodeBlockText(block)).toBe("line one\nline two\nline three");
  });
});

describe("parseSchematexFence", () => {
  test("strips the fence delimiters from a single schematex fence", () => {
    const raw = "```schematex\nflowchart\nA -> B\n```";
    expect(parseSchematexFence(raw)).toBe("flowchart\nA -> B");
  });

  test("returns null when the first line is not a schematex fence open", () => {
    const raw = "```yaml\nkey: value\n```";
    expect(parseSchematexFence(raw)).toBeNull();
  });

  test("returns null when the last line is not a closing fence", () => {
    const raw = "```schematex\nflowchart\nA -> B";
    expect(parseSchematexFence(raw)).toBeNull();
  });

  test("tolerates leading/trailing blank lines around the fence", () => {
    const raw = "\n```schematex\nflowchart\nA -> B\n```\n";
    expect(parseSchematexFence(raw)).toBe("flowchart\nA -> B");
  });
});

describe("findUnprocessedSchematexBlocks", () => {
  test("finds a Markdown-language block containing a single schematex fence", () => {
    const root = document.createElement("div");
    const block = makeNotionCodeBlock("Markdown", ["```schematex", "flowchart", "A -> B", "```"]);
    root.appendChild(block);

    const results = findUnprocessedSchematexBlocks(root);

    expect(results).toHaveLength(1);
    expect(results[0].element).toBe(block);
    expect(results[0].source).toBe("flowchart\nA -> B");
  });

  test("ignores a non-Markdown-language block even if it contains a schematex fence", () => {
    const root = document.createElement("div");
    root.appendChild(makeNotionCodeBlock("YAML", ["```schematex", "flowchart", "```"]));

    expect(findUnprocessedSchematexBlocks(root)).toHaveLength(0);
  });

  test("ignores a Markdown-language block with no schematex fence", () => {
    const root = document.createElement("div");
    root.appendChild(makeNotionCodeBlock("Markdown", ["# just a heading", "some text"]));

    expect(findUnprocessedSchematexBlocks(root)).toHaveLength(0);
  });
});

describe("findUnprocessedSchematexBlocks re-scan behavior", () => {
  test("does not return a block already marked data-schematex-processed", () => {
    const root = document.createElement("div");
    const block = makeNotionCodeBlock("Markdown", ["```schematex", "flowchart", "```"]);
    block.setAttribute("data-schematex-processed", "true");
    root.appendChild(block);

    expect(findUnprocessedSchematexBlocks(root)).toHaveLength(0);
  });
});
