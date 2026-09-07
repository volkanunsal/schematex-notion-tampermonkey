import DOMPurify from "dompurify";
import type { DetectedBlock } from "./detectBlocks";

export interface RenderDeps {
  renderPreviewToContainer: (
    source: string,
    container: Element,
    config?: Record<string, unknown>,
  ) => void;
}

function showErrorCard(container: HTMLElement, message: string): void {
  container.innerHTML = "";
  const errorCard = document.createElement("div");
  errorCard.className = "schematex-error";
  errorCard.textContent = `SchemaTex error: ${message}`;
  container.appendChild(errorCard);
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function renderDetectedBlock(
  block: DetectedBlock,
  deps: RenderDeps,
  config?: Record<string, unknown>,
): { renderedContainer: HTMLElement } {
  const renderedContainer = document.createElement("div");
  renderedContainer.className = "schematex-rendered";

  block.element.insertAdjacentElement("afterend", renderedContainer);

  try {
    const scratch = document.createElement("div");
    deps.renderPreviewToContainer(block.source, scratch, config);
    renderedContainer.innerHTML = DOMPurify.sanitize(scratch.innerHTML, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
  } catch (error) {
    showErrorCard(renderedContainer, messageFromError(error));
  }

  block.element.style.display = "none";
  block.element.setAttribute("data-schematex-processed", "true");

  return { renderedContainer };
}
