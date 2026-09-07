export interface DetectedBlock {
  element: HTMLElement;
  source: string;
}

export function findNotionLanguage(codeBlockElement: HTMLElement): string | null {
  return codeBlockElement.getAttribute("data-notion-code-language");
}

export function extractCodeBlockText(codeBlockElement: HTMLElement): string {
  const lineElements = Array.from(
    codeBlockElement.querySelectorAll<HTMLElement>("[data-line-index]"),
  );
  return lineElements.map((lineElement) => lineElement.textContent ?? "").join("\n");
}

export function parseSchematexFence(rawText: string): string | null {
  const lines = rawText.split("\n");

  let start = 0;
  while (start < lines.length && lines[start].trim() === "") {
    start += 1;
  }

  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim() === "") {
    end -= 1;
  }

  if (start > end) {
    return null;
  }
  if (lines[start].trim() !== "```schematex") {
    return null;
  }
  if (lines[end].trim() !== "```") {
    return null;
  }
  // start === end is already excluded: a single line can't equal both
  // "```schematex" and "```" at once, so both checks above already
  // require start < end.

  return lines.slice(start + 1, end).join("\n");
}

export function findUnprocessedSchematexBlocks(root: ParentNode): DetectedBlock[] {
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(
      '.notion-code-block:not([data-schematex-processed="true"])',
    ),
  );

  const results: DetectedBlock[] = [];
  for (const element of candidates) {
    if (findNotionLanguage(element) !== "Markdown") {
      continue;
    }
    const rawText = extractCodeBlockText(element);
    const source = parseSchematexFence(rawText);
    if (source !== null) {
      results.push({ element, source });
    }
  }
  return results;
}
