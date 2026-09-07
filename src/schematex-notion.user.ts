// ==UserScript==
// @name         SchemaTex for Notion
// @namespace    https://github.com/volkanunsal/schematex-notion-tampermonkey
// @version      0.1.0
// @description  Renders SchemaTex diagram fences inline inside Notion pages
// @author       Volkan Unsal
// @match        https://www.notion.so/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @updateURL    https://raw.githubusercontent.com/volkanunsal/schematex-notion-tampermonkey/main/out/schematex-notion.user.js
// @downloadURL  https://raw.githubusercontent.com/volkanunsal/schematex-notion-tampermonkey/main/out/schematex-notion.user.js
// ==/UserScript==

import { renderPreviewToContainer } from "schematex/browser";
import { findUnprocessedSchematexBlocks } from "./lib/detectBlocks";
import { renderDetectedBlock, type RenderDeps } from "./lib/renderBlock";
import { attachToggle } from "./lib/toggle";
import {
  attachManualTrigger,
  loadSettings,
  openSettingsModal,
  type GMStorage,
} from "./lib/settings";

export function processPage(root: ParentNode, deps: RenderDeps, storage: GMStorage): void {
  const settings = loadSettings(storage);
  const detectedBlocks = findUnprocessedSchematexBlocks(root);

  for (const block of detectedBlocks) {
    // Mark processed at detection time, not only after rendering — otherwise
    // an un-clicked manual-mode block is re-detected on every subsequent
    // MutationObserver firing and gets a duplicate trigger button each time.
    block.element.setAttribute("data-schematex-processed", "true");

    const runRender = () => {
      const { renderedContainer } = renderDetectedBlock(block, deps, {
        theme: settings.theme,
      });
      attachToggle(block.element, renderedContainer, settings.toggleIconPosition);
    };

    if (settings.autoRender) {
      runRender();
    } else {
      // Insert a dedicated sibling container rather than appending into
      // block.element or its parent — both are nodes Notion's own React
      // tree still owns and reconciles (the same reasoning D3 applies to
      // the code block itself).
      const triggerContainer = document.createElement("div");
      triggerContainer.className = "schematex-manual-trigger-container";
      block.element.insertAdjacentElement("afterend", triggerContainer);
      attachManualTrigger(triggerContainer, () => {
        triggerContainer.remove();
        runRender();
      });
    }
  }
}

// @types/tampermonkey (declared in tsconfig.json's "types" array) already
// provides ambient global declarations for GM_getValue/GM_setValue/
// GM_registerMenuCommand — redeclaring them here would collide under
// `strict` mode, so main() below uses the ambient globals directly.

function main(): void {
  const storage: GMStorage = { getValue: GM_getValue, setValue: GM_setValue };
  const deps: RenderDeps = { renderPreviewToContainer };

  GM_registerMenuCommand("SchemaTex Settings", () => {
    openSettingsModal(storage);
  });

  processPage(document, deps, storage);

  // Debounced: Notion's own re-renders fire this on every keystroke-driven
  // mutation across the whole page body, and processPage's own idempotency
  // (data-schematex-processed) doesn't help until it's actually run once.
  let scheduled: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    if (scheduled !== undefined) {
      clearTimeout(scheduled);
    }
    scheduled = setTimeout(() => {
      processPage(document, deps, storage);
    }, 250);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Guarded on GM_getValue rather than just `document`: a real Tampermonkey
// context always injects the granted GM_* globals, but jsdom-based tests
// (which import processPage from this same module) define `document`
// without them — checking document alone would run main() during import
// and crash on the missing global.
if (typeof document !== "undefined" && typeof GM_getValue === "function") {
  main();
}
