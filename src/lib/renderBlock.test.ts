import { describe, expect, test, vi } from "vitest";
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

describe("renderDetectedBlock", () => {
  test("inserts a rendered sibling container immediately after the block", () => {
    const block = makeBlock("flowchart\nA -> B");
    const renderPreviewToContainer = vi.fn((_source, container: Element) => {
      container.innerHTML = "<svg></svg>";
    });
    const deps: RenderDeps = { renderPreviewToContainer };

    const { renderedContainer } = renderDetectedBlock(block, deps);

    // The renderer is called with a detached scratch container (not
    // renderedContainer itself) so its output can be sanitized before
    // reaching the visible container — see the DOMPurify step below.
    expect(renderPreviewToContainer).toHaveBeenCalledWith(
      "flowchart\nA -> B",
      expect.any(HTMLElement),
      undefined,
    );
    expect(block.element.nextElementSibling).toBe(renderedContainer);
    expect(renderedContainer.querySelector("svg")).not.toBeNull();
  });

  test("hides the original block via display:none without removing it", () => {
    const block = makeBlock("flowchart\nA -> B");
    const deps: RenderDeps = {
      renderPreviewToContainer: (_source, container) => {
        container.innerHTML = "<svg></svg>";
      },
    };

    renderDetectedBlock(block, deps);

    expect(block.element.style.display).toBe("none");
    expect(block.element.isConnected).toBe(true);
  });

  test("marks the block as processed", () => {
    const block = makeBlock("flowchart\nA -> B");
    const deps: RenderDeps = {
      renderPreviewToContainer: (_source, container) => {
        container.innerHTML = "<svg></svg>";
      },
    };

    renderDetectedBlock(block, deps);

    expect(block.element.getAttribute("data-schematex-processed")).toBe("true");
  });

  test("shows an inline error card when rendering throws", () => {
    const block = makeBlock("not valid schematex");
    const deps: RenderDeps = {
      renderPreviewToContainer: () => {
        throw new Error("boom: unknown diagram type");
      },
    };

    const { renderedContainer } = renderDetectedBlock(block, deps);

    const errorCard = renderedContainer.querySelector(".schematex-error");
    expect(errorCard).not.toBeNull();
    expect(errorCard?.textContent).toContain("boom: unknown diagram type");
    expect(block.element.getAttribute("data-schematex-processed")).toBe("true");
  });

  test("passes the config object through to the renderer", () => {
    const block = makeBlock("flowchart\nA -> B");
    const renderPreviewToContainer = vi.fn((_source, container: Element) => {
      container.innerHTML = "<svg></svg>";
    });
    const deps: RenderDeps = { renderPreviewToContainer };

    renderDetectedBlock(block, deps, { theme: "dark" });

    expect(renderPreviewToContainer).toHaveBeenCalledWith(
      "flowchart\nA -> B",
      expect.any(HTMLElement),
      { theme: "dark" },
    );
  });

  test("strips a script tag out of the renderer's output before insertion", () => {
    const block = makeBlock("flowchart\nA -> B");
    const deps: RenderDeps = {
      renderPreviewToContainer: (_source, container) => {
        container.innerHTML =
          '<svg><script>window.__pwned = true;</script><circle r="4"/></svg>';
      },
    };

    const { renderedContainer } = renderDetectedBlock(block, deps);

    expect(renderedContainer.querySelector("script")).toBeNull();
    expect(renderedContainer.querySelector("circle")).not.toBeNull();
  });

  test("strips an onload attribute out of the renderer's output before insertion", () => {
    const block = makeBlock("flowchart\nA -> B");
    const deps: RenderDeps = {
      renderPreviewToContainer: (_source, container) => {
        container.innerHTML =
          '<svg onload="window.__pwned = true"><rect width="1" height="1"/></svg>';
      },
    };

    const { renderedContainer } = renderDetectedBlock(block, deps);

    const svg = renderedContainer.querySelector("svg");
    expect(svg?.getAttribute("onload")).toBeNull();
  });
});
