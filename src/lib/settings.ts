export type Theme = "light" | "dark" | "auto";
export type ToggleIconPosition = "top-right" | "top-left";

export interface Settings {
  theme: Theme;
  autoRender: boolean;
  toggleIconPosition: ToggleIconPosition;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "auto",
  autoRender: true,
  toggleIconPosition: "top-right",
};

export interface GMStorage {
  getValue: <T>(key: string, defaultValue: T) => T;
  setValue: (key: string, value: unknown) => void;
}

const KEYS = {
  theme: "schematex.theme",
  autoRender: "schematex.autoRender",
  toggleIconPosition: "schematex.toggleIconPosition",
} as const;

export function loadSettings(storage: GMStorage): Settings {
  return {
    theme: storage.getValue(KEYS.theme, DEFAULT_SETTINGS.theme),
    autoRender: storage.getValue(KEYS.autoRender, DEFAULT_SETTINGS.autoRender),
    toggleIconPosition: storage.getValue(
      KEYS.toggleIconPosition,
      DEFAULT_SETTINGS.toggleIconPosition,
    ),
  };
}

export function saveSettings(storage: GMStorage, settings: Settings): void {
  storage.setValue(KEYS.theme, settings.theme);
  storage.setValue(KEYS.autoRender, settings.autoRender);
  storage.setValue(KEYS.toggleIconPosition, settings.toggleIconPosition);
}

export function openSettingsModal(storage: GMStorage): HTMLElement {
  const settings = loadSettings(storage);

  const modal = document.createElement("div");
  modal.className = "schematex-settings-modal";

  const themeLabel = document.createElement("label");
  themeLabel.textContent = "Theme: ";
  const themeSelect = document.createElement("select");
  for (const value of ["light", "dark", "auto"] as const) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = value === settings.theme;
    themeSelect.appendChild(option);
  }
  themeLabel.appendChild(themeSelect);

  const autoRenderLabel = document.createElement("label");
  const autoRenderCheckbox = document.createElement("input");
  autoRenderCheckbox.type = "checkbox";
  autoRenderCheckbox.checked = settings.autoRender;
  autoRenderLabel.appendChild(autoRenderCheckbox);
  autoRenderLabel.append(" Auto-render");

  const positionLabel = document.createElement("label");
  positionLabel.textContent = "Toggle icon position: ";
  const positionSelect = document.createElement("select");
  positionSelect.name = "toggleIconPosition";
  for (const value of ["top-right", "top-left"] as const) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = value === settings.toggleIconPosition;
    positionSelect.appendChild(option);
  }
  positionLabel.appendChild(positionSelect);

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "schematex-settings-save";
  saveButton.textContent = "Save";
  saveButton.addEventListener("click", () => {
    saveSettings(storage, {
      theme: themeSelect.value as Theme,
      autoRender: autoRenderCheckbox.checked,
      toggleIconPosition: positionSelect.value as ToggleIconPosition,
    });
    modal.remove();
  });

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "schematex-settings-cancel";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => {
    modal.remove();
  });

  modal.appendChild(themeLabel);
  modal.appendChild(autoRenderLabel);
  modal.appendChild(positionLabel);
  modal.appendChild(saveButton);
  modal.appendChild(cancelButton);
  document.body.appendChild(modal);

  return modal;
}

export function attachManualTrigger(
  container: HTMLElement,
  onTrigger: () => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "schematex-manual-trigger";
  button.textContent = "Render diagram";
  button.addEventListener("click", onTrigger);
  container.appendChild(button);
  return button;
}
