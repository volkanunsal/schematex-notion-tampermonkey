# SchemaTex for Notion

<div align="center">

<img src="media/logo.svg" alt="SchemaTex for Notion logo" width="120" height="120" />

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-compatible-brightgreen)](https://www.tampermonkey.net/)

[![Install with Tampermonkey](https://img.shields.io/badge/Install-Tampermonkey-orange?style=for-the-badge)](https://raw.githubusercontent.com/volkanunsal/schematex-notion-tampermonkey/main/out/schematex-notion.user.js)

</div>

Renders [SchemaTex](https://schematex.js.org) diagram fences inline inside Notion pages.

## Install

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension, if you don't already have it.
2. Click the install button above, or open this URL directly:

   `https://raw.githubusercontent.com/volkanunsal/schematex-notion-tampermonkey/main/out/schematex-notion.user.js`

3. Tampermonkey shows an install prompt with the script's source. Click **Install**.

The script keeps `@updateURL`/`@downloadURL` pointed at the same raw GitHub URL, so Tampermonkey checks that URL for updates and you don't need to reinstall manually when it changes.

## Use

1. In a Notion page, add a code block.
2. Set the code block's language to **Markdown** using Notion's own language picker.
3. Inside that code block, put a fenced `schematex` block:

   ````
   ```schematex
   genogram
     alice [female]
   ```
   ````

   Only blank lines are allowed before or after the fence — the code block's content must otherwise be exactly the fence.

4. The script detects the block and replaces its display with the rendered diagram. The original Markdown code block is not deleted; it's hidden (`display: none`) underneath the rendered output.
5. Click the **⇄ source** button on the rendered diagram to toggle back to the raw code block, and click it again to return to the diagram.

Notion is a single-page app that re-renders parts of the DOM as you type or navigate, so the script re-scans the page on a short debounce after each mutation. A block is only ever rendered once — already-processed blocks are skipped on subsequent scans.

If auto-render is turned off (see Configure, below), step 4 doesn't happen automatically: a **Render diagram** button appears next to the code block instead, and the diagram renders only when you click it.

## Configure

Open Tampermonkey's menu (the extension icon in your browser toolbar) and choose **SchemaTex Settings** under this script's entry. This opens an in-page modal with three settings:

| Setting | Options | Default |
| --- | --- | --- |
| Theme | `light`, `dark`, `auto` | `auto` |
| Auto-render | on / off | on |
| Toggle icon position | `top-right`, `top-left` | `top-right` |

Settings are saved to Tampermonkey's own storage (`GM_setValue`) and are read the next time a block is processed for the first time — a changed setting has no effect on a block already rendered on the page (its `data-schematex-processed` marker is already set) until you reload the page and the block is detected fresh.

## Why "Markdown" code blocks

Notion's code-block language picker has a fixed list of languages, and there's no "SchemaTex" or generic diagram entry in it, nor a public Notion API hook this script could use to add one. Rather than requiring a Notion integration or API access, the script piggybacks on an existing language in that list: **Markdown**.

A block only gets processed when both conditions hold: Notion's own language picker is set to `Markdown` for that block, and its content is a single ` ```schematex ` fence. Requiring both avoids false positives on unrelated Markdown or code blocks that don't contain diagram source, at the cost of an extra manual step — every diagram's code block has to be explicitly labeled `Markdown` in Notion before the script will touch it.

The diagram source inside the fence is plain [SchemaTex](https://schematex.js.org) syntax; this project only detects and renders it; it doesn't define or extend the SchemaTex language itself.

## License

[AGPL-3.0-only](LICENSE)
