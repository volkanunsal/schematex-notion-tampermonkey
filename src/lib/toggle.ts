export type ToggleIconPosition = "top-right" | "top-left";

export function attachToggle(
  sourceElement: HTMLElement,
  renderedContainer: HTMLElement,
  position: ToggleIconPosition = "top-right",
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `schematex-toggle schematex-toggle--${position}`;
  button.textContent = "⇄ source";

  let showingSource = false;

  button.addEventListener("click", () => {
    showingSource = !showingSource;
    sourceElement.style.display = showingSource ? "" : "none";
    renderedContainer.style.display = showingSource ? "none" : "";
  });

  renderedContainer.appendChild(button);
  return button;
}
