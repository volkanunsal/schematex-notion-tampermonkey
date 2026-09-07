import { describe, expect, test } from "vitest";
import { attachToggle } from "./toggle";

function makePair(): { sourceElement: HTMLElement; renderedContainer: HTMLElement } {
  const sourceElement = document.createElement("div");
  sourceElement.style.display = "none";
  const renderedContainer = document.createElement("div");
  renderedContainer.innerHTML = "<svg></svg>";
  document.body.appendChild(sourceElement);
  document.body.appendChild(renderedContainer);
  return { sourceElement, renderedContainer };
}

describe("attachToggle", () => {
  test("appends a toggle button inside the rendered container", () => {
    const { sourceElement, renderedContainer } = makePair();
    const button = attachToggle(sourceElement, renderedContainer);
    expect(renderedContainer.contains(button)).toBe(true);
  });

  test("clicking the toggle shows source and hides rendered", () => {
    const { sourceElement, renderedContainer } = makePair();
    const button = attachToggle(sourceElement, renderedContainer);

    button.click();

    expect(sourceElement.style.display).toBe("");
    expect(renderedContainer.style.display).toBe("none");
  });

  test("clicking the toggle twice returns to rendered visible, source hidden", () => {
    const { sourceElement, renderedContainer } = makePair();
    const button = attachToggle(sourceElement, renderedContainer);

    button.click();
    button.click();

    expect(sourceElement.style.display).toBe("none");
    expect(renderedContainer.style.display).toBe("");
  });

  test("defaults to the top-right position class", () => {
    const { sourceElement, renderedContainer } = makePair();
    const button = attachToggle(sourceElement, renderedContainer);
    expect(button.classList.contains("schematex-toggle--top-right")).toBe(true);
  });

  test("applies the top-left position class when passed explicitly", () => {
    const { sourceElement, renderedContainer } = makePair();
    const button = attachToggle(sourceElement, renderedContainer, "top-left");
    expect(button.classList.contains("schematex-toggle--top-left")).toBe(true);
  });
});
