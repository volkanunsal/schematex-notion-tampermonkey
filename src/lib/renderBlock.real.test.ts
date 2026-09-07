import { describe, expect, test } from "vitest";
import { renderPreviewToContainer } from "schematex/browser";
import { renderDetectedBlock, type RenderDeps } from "./renderBlock";
import type { DetectedBlock } from "./detectBlocks";

function makeBlock(source: string): DetectedBlock {
  const wrapper = document.createElement("div");
  const element = document.createElement("div");
  element.className = "notion-code-block";
  wrapper.appendChild(element);
  document.body.appendChild(wrapper);
  return { element, source };
}

describe("renderDetectedBlock against the real schematex/browser renderer", () => {
  test("renders a valid genogram source to sanitized, non-empty SVG", () => {
    const block = makeBlock("genogram\n  alice [female]");
    const deps: RenderDeps = { renderPreviewToContainer };

    const { renderedContainer } = renderDetectedBlock(block, deps);

    expect(renderedContainer.querySelector(".schematex-error")).toBeNull();
    const svg = renderedContainer.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.innerHTML.trim().length).toBeGreaterThan(0);
  });
});
