import { describe, expect, test, vi } from "vitest";
import {
  DEFAULT_SETTINGS,
  attachManualTrigger,
  loadSettings,
  openSettingsModal,
  saveSettings,
  type GMStorage,
  type Settings,
} from "./settings";

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

describe("loadSettings", () => {
  test("returns DEFAULT_SETTINGS when storage is empty", () => {
    const storage = makeFakeStorage();
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  test("returns stored values when present", () => {
    const storage = makeFakeStorage({
      "schematex.theme": "dark",
      "schematex.autoRender": false,
      "schematex.toggleIconPosition": "top-left",
    });
    const settings = loadSettings(storage);
    expect(settings).toEqual({
      theme: "dark",
      autoRender: false,
      toggleIconPosition: "top-left",
    });
  });
});

describe("saveSettings", () => {
  test("round-trips through storage", () => {
    const storage = makeFakeStorage();
    const settings: Settings = {
      theme: "dark",
      autoRender: false,
      toggleIconPosition: "top-left",
    };

    saveSettings(storage, settings);

    expect(loadSettings(storage)).toEqual(settings);
  });
});

describe("openSettingsModal", () => {
  test("appends a modal to document.body", () => {
    const storage = makeFakeStorage();
    const modal = openSettingsModal(storage);
    expect(document.body.contains(modal)).toBe(true);
  });

  test("saving persists a changed toggle-icon position", () => {
    const storage = makeFakeStorage({ "schematex.toggleIconPosition": "top-right" });
    const modal = openSettingsModal(storage);

    const positionSelect = modal.querySelector(
      "select[name='toggleIconPosition']",
    ) as HTMLSelectElement;
    positionSelect.value = "top-left";

    const saveButton = modal.querySelector(".schematex-settings-save") as HTMLButtonElement;
    saveButton.click();

    expect(loadSettings(storage).toggleIconPosition).toBe("top-left");
  });

  test("cancel closes the modal without persisting changes", () => {
    const storage = makeFakeStorage({ "schematex.autoRender": true });
    const modal = openSettingsModal(storage);

    const autoRenderCheckbox = modal.querySelector(
      "input[type='checkbox']",
    ) as HTMLInputElement;
    autoRenderCheckbox.checked = false;

    const cancelButton = modal.querySelector(".schematex-settings-cancel") as HTMLButtonElement;
    cancelButton.click();

    expect(document.body.contains(modal)).toBe(false);
    expect(loadSettings(storage).autoRender).toBe(true);
  });
});

describe("attachManualTrigger", () => {
  test("invokes the callback when the trigger button is clicked", () => {
    const container = document.createElement("div");
    const onTrigger = vi.fn();

    const button = attachManualTrigger(container, onTrigger);
    button.click();

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});

describe("loadSettings autoRender flag", () => {
  test("autoRender true means DEFAULT_SETTINGS.autoRender is true", () => {
    expect(DEFAULT_SETTINGS.autoRender).toBe(true);
  });

  test("autoRender can be read back as false", () => {
    const storage = makeFakeStorage({ "schematex.autoRender": false });
    expect(loadSettings(storage).autoRender).toBe(false);
  });
});
