import { describe, expect, test, vi } from "vitest";
import { processPage } from "./schematex-notion.user";
import type { RenderDeps } from "./lib/renderBlock";
import type { GMStorage } from "./lib/settings";

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

function makeFakeStorage(initial: Record<string, unknown> = {}): GMStorage {
  const store = new Map<string, unknown>(Object.entries(initial));
  return {
    getValue: <T>(key: string, defaultValue: T): T =>
      (store.has(key) ? (store.get(key) as T) : defaultValue),
    setValue: (key: string, value: unknown) => {
      store.set(key, value);
    },
  };
}

describe("processPage", () => {
  test("auto-render on: detects, renders, hides source, and the toggle works", () => {
    const root = document.createElement("div");
    const block = makeNotionCodeBlock("Markdown", ["```schematex", "flowchart", "A -> B", "```"]);
    root.appendChild(block);
    document.body.appendChild(root);

    const deps: RenderDeps = {
      renderPreviewToContainer: (_source, container) => {
        container.innerHTML = "<svg></svg>";
      },
    };
    const storage = makeFakeStorage({ "schematex.autoRender": true });

    processPage(root, deps, storage);

    expect(block.style.display).toBe("none");
    const renderedContainer = block.nextElementSibling as HTMLElement;
    expect(renderedContainer.querySelector("svg")).not.toBeNull();

    const toggleButton = renderedContainer.querySelector(
      ".schematex-toggle",
    ) as HTMLButtonElement;
    expect(toggleButton).not.toBeNull();
    toggleButton.click();
    expect(block.style.display).toBe("");
    expect(renderedContainer.style.display).toBe("none");
  });

  test("auto-render off: block is not rendered until the manual trigger fires", () => {
    const root = document.createElement("div");
    const block = makeNotionCodeBlock("Markdown", ["```schematex", "flowchart", "A -> B", "```"]);
    root.appendChild(block);
    document.body.appendChild(root);

    const renderPreviewToContainer = vi.fn((_source, container: Element) => {
      container.innerHTML = "<svg></svg>";
    });
    const deps: RenderDeps = { renderPreviewToContainer };
    const storage = makeFakeStorage({ "schematex.autoRender": false });

    processPage(root, deps, storage);

    expect(renderPreviewToContainer).not.toHaveBeenCalled();
    expect(block.style.display).not.toBe("none");
    // The trigger lives in its own sibling container, never inside a node
    // Notion still owns (block.element or its parent) — see D3.
    expect(
      block.nextElementSibling?.classList.contains("schematex-manual-trigger-container"),
    ).toBe(true);

    const manualTrigger = root.querySelector(
      ".schematex-manual-trigger",
    ) as HTMLButtonElement;
    expect(manualTrigger).not.toBeNull();
    manualTrigger.click();

    expect(renderPreviewToContainer).toHaveBeenCalledTimes(1);
    expect(block.style.display).toBe("none");
  });

  test("passes a non-default theme setting through to the renderer's config", () => {
    const root = document.createElement("div");
    const block = makeNotionCodeBlock("Markdown", ["```schematex", "flowchart", "A -> B", "```"]);
    root.appendChild(block);
    document.body.appendChild(root);

    const renderPreviewToContainer = vi.fn((_source, container: Element) => {
      container.innerHTML = "<svg></svg>";
    });
    const deps: RenderDeps = { renderPreviewToContainer };
    const storage = makeFakeStorage({
      "schematex.autoRender": true,
      "schematex.theme": "dark",
    });

    processPage(root, deps, storage);

    expect(renderPreviewToContainer).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(HTMLElement),
      expect.objectContaining({ theme: "dark" }),
    );
  });

  test("passes a non-default toggle icon position through to the rendered toggle button", () => {
    const root = document.createElement("div");
    const block = makeNotionCodeBlock("Markdown", ["```schematex", "flowchart", "A -> B", "```"]);
    root.appendChild(block);
    document.body.appendChild(root);

    const deps: RenderDeps = {
      renderPreviewToContainer: (_source, container) => {
        container.innerHTML = "<svg></svg>";
      },
    };
    const storage = makeFakeStorage({
      "schematex.autoRender": true,
      "schematex.toggleIconPosition": "top-left",
    });

    processPage(root, deps, storage);

    const renderedContainer = block.nextElementSibling as HTMLElement;
    const toggleButton = renderedContainer.querySelector(".schematex-toggle") as HTMLButtonElement;
    expect(toggleButton.classList.contains("schematex-toggle--top-left")).toBe(true);
  });

  test("auto-render off: repeated MutationObserver-style re-scans before the trigger fires do not add duplicate trigger buttons", () => {
    const root = document.createElement("div");
    const block = makeNotionCodeBlock("Markdown", ["```schematex", "flowchart", "A -> B", "```"]);
    root.appendChild(block);
    document.body.appendChild(root);

    const deps: RenderDeps = {
      renderPreviewToContainer: (_source, container) => {
        container.innerHTML = "<svg></svg>";
      },
    };
    const storage = makeFakeStorage({ "schematex.autoRender": false });

    // Simulates the MutationObserver firing repeatedly on unrelated page
    // edits while the user hasn't clicked the trigger yet.
    processPage(root, deps, storage);
    processPage(root, deps, storage);
    processPage(root, deps, storage);

    const triggers = root.querySelectorAll(".schematex-manual-trigger");
    expect(triggers).toHaveLength(1);
  });

  test("re-running processPage on an already-processed block does not re-render", () => {
    const root = document.createElement("div");
    const block = makeNotionCodeBlock("Markdown", ["```schematex", "flowchart", "A -> B", "```"]);
    root.appendChild(block);
    document.body.appendChild(root);

    const renderPreviewToContainer = vi.fn((_source, container: Element) => {
      container.innerHTML = "<svg></svg>";
    });
    const deps: RenderDeps = { renderPreviewToContainer };
    const storage = makeFakeStorage({ "schematex.autoRender": true });

    processPage(root, deps, storage);
    processPage(root, deps, storage);

    expect(renderPreviewToContainer).toHaveBeenCalledTimes(1);
  });

  test("skips a block whose data-schematex-processed marker was lost but which already has a live rendered sibling", () => {
    const root = document.createElement("div");
    const block = makeNotionCodeBlock("Markdown", ["```schematex", "flowchart", "A -> B", "```"]);
    root.appendChild(block);
    // Simulate Notion recreating the code-block element: a rendered
    // container already sits next to it, but the marker attribute is gone.
    const existingRendered = document.createElement("div");
    existingRendered.className = "schematex-rendered";
    existingRendered.innerHTML = "<svg></svg>";
    block.insertAdjacentElement("afterend", existingRendered);
    document.body.appendChild(root);

    const renderPreviewToContainer = vi.fn((_source, container: Element) => {
      container.innerHTML = "<svg></svg>";
    });
    const deps: RenderDeps = { renderPreviewToContainer };
    const storage = makeFakeStorage({ "schematex.autoRender": true });

    processPage(root, deps, storage);

    expect(renderPreviewToContainer).not.toHaveBeenCalled();
    expect(root.querySelectorAll(".schematex-rendered")).toHaveLength(1);
    expect(block.getAttribute("data-schematex-processed")).toBe("true");
  });

  test("skips a block whose marker was lost but which already has a live manual-trigger sibling", () => {
    const root = document.createElement("div");
    const block = makeNotionCodeBlock("Markdown", ["```schematex", "flowchart", "A -> B", "```"]);
    root.appendChild(block);
    const existingTrigger = document.createElement("div");
    existingTrigger.className = "schematex-manual-trigger-container";
    block.insertAdjacentElement("afterend", existingTrigger);
    document.body.appendChild(root);

    const renderPreviewToContainer = vi.fn((_source, container: Element) => {
      container.innerHTML = "<svg></svg>";
    });
    const deps: RenderDeps = { renderPreviewToContainer };
    const storage = makeFakeStorage({ "schematex.autoRender": false });

    processPage(root, deps, storage);

    expect(renderPreviewToContainer).not.toHaveBeenCalled();
    expect(root.querySelectorAll(".schematex-manual-trigger-container")).toHaveLength(1);
    expect(root.querySelectorAll(".schematex-manual-trigger")).toHaveLength(0);
  });
});
