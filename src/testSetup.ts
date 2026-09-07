// jsdom does not implement matchMedia; resolveTheme() in
// schematex-notion.user.ts calls it to resolve theme: "auto", so tests that
// exercise that path (directly or via processPage) need a stub present.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
