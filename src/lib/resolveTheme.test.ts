import { afterEach, describe, expect, test } from "vitest";
import { resolveTheme } from "../schematex-notion.user";

function stubMatchMedia(matches: boolean): void {
  window.matchMedia = ((query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia;
}

describe("resolveTheme", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  test("passes light through unchanged", () => {
    expect(resolveTheme("light")).toBe("light");
  });

  test("passes dark through unchanged", () => {
    expect(resolveTheme("dark")).toBe("dark");
  });

  test("resolves auto to dark when the OS prefers dark", () => {
    stubMatchMedia(true);
    expect(resolveTheme("auto")).toBe("dark");
  });

  test("resolves auto to light when the OS does not prefer dark", () => {
    stubMatchMedia(false);
    expect(resolveTheme("auto")).toBe("light");
  });
});
