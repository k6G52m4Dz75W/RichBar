# Remix Icon font subset

Provenance, mapping and validation record for the toolbar icon font. The
READMEs mirror the summary; this page is the authoritative reference. It
replaces `docs/lucide-font.md` (the Lucide subset was removed in 0.16.0).

## Provenance and artifact identity

- Upstream: [Remix Icon](https://github.com/Remix-Design/RemixIcon)
  **4.9.1**, release asset `RemixIcon_Fonts_v4.9.1.zip`. Font family name:
  **"remixicon"**.
- The release's `remixicon.ttf` is **613,136 bytes**, SHA256
  `cdff268662c834fbe023a8d34f77e2842c50025b093bc827c9b71adefc81b256`.
- Bundled artifact: `remixicon_subset.ttf` at the repository root —
  **8,964 bytes**, **62 unique icons** (plus `.notdef`), SHA256
  `ea113337d0b9b4cb0f645f13a2e1333e0fa86884f057bb30903cc0696b3d708a`.

Verify the bundled subset at any time:

```powershell
Get-Item .\remixicon_subset.ttf | Select-Object Length    # 8964
Get-FileHash .\remixicon_subset.ttf -Algorithm SHA256
# ea113337d0b9b4cb0f645f13a2e1333e0fa86884f057bb30903cc0696b3d708a
```

## Regenerating the subset

```powershell
node tools/subset-icon-font.cjs <RemixIcon fonts directory>
```

- Requires the `subset-font` npm package to be resolvable.
- The script validates the input `remixicon.ttf` SHA256 against the pinned
  4.9.1 hash and refuses to run on other upstream versions.
- The authoritative name lists (slot order) are in
  [`tools/remix-icons.json`](../tools/remix-icons.json): the `markdown`
  array fills the Markdown slots 0–19, the `html` array fills the HTML
  slots 0–47, the `modes` array supplies the two `[H][M]` switch
  glyphs, and the `marker` array supplies the dropdown-arrow marker.
- Codepoints are read from the release's `remixicon.css`.

## Markdown mapping (slots 0–19)

| Icon index | Toolbar command | Remix Icon name | Codepoint |
|---|---|---|---|
| 0 | Heading H1 | `h-1` | U+EDE6 |
| 1 | Heading H2 | `h-2` | U+EDE7 |
| 2 | Heading H3 | `h-3` | U+EDE8 |
| 3 | Heading H4 | `h-4` | U+EDE9 |
| 4 | Heading H5 | `h-5` | U+EDEA |
| 5 | Heading H6 | `h-6` | U+EDEB |
| 6 | Bold | `bold` | U+EAD1 |
| 7 | Italic | `italic` | U+EE6B |
| 8 | Strikethrough | `strikethrough` | U+F1AB |
| 9 | Inline code | `code-s-slash-line` | U+EBAD |
| 10 | Fenced code block | `code-box-line` | U+EBA7 |
| 11 | Block quote | `double-quotes-l` | U+EC51 |
| 12 | Bullet list | `list-unordered` | U+EEBE |
| 13 | Numbered list | `list-ordered` | U+EEBB |
| 14 | Task list | `list-check-2` | U+EEB9 |
| 15 | Horizontal rule | `subtract-line` | U+F1AF |
| 16 | Link | `link` | U+EEB2 |
| 17 | Image | `image-line` | U+EE4B |
| 18 | Table | `table-line` | U+F1DE |
| 19 | Customize | `settings-line` | U+F0EE |

## HTML mapping (slots 0–47)

Slots 0–24 are the default toolbar buttons; slots 25–47 are commands that
appear only through the Customize dialog (form controls, media, message
icons).

| Slot | Command | Remix Icon name | Codepoint |
|---|---|---|---|
| 0 | Heading dropdown | `heading` | U+EE03 |
| 1 | Paragraph `<p>` | `paragraph` | U+EFC8 |
| 2 | Line break `<br>` | `text-wrap` | U+F200 |
| 3 | Bold | `bold` | U+EAD1 |
| 4 | Italic | `italic` | U+EE6B |
| 5 | Underline | `underline` | U+F244 |
| 6 | Font | `font-size-2` | U+ED8C |
| 7 | Color | `palette-line` | U+EFC5 |
| 8 | Image | `image-line` | U+EE4B |
| 9 | Hyperlink | `link` | U+EEB2 |
| 10 | Table | `table-line` | U+F1DE |
| 11 | Horizontal rule | `subtract-line` | U+F1AF |
| 12 | Comment `<!-- -->` | `brackets-line` | U+EAEB |
| 13 | Align left | `align-left` | U+EA27 |
| 14 | Center | `align-center` | U+EA25 |
| 15 | Align right | `align-right` | U+EA28 |
| 16 | Justify | `align-justify` | U+EA26 |
| 17 | Numbering `<ol>` | `list-ordered` | U+EEBB |
| 18 | Bullets `<ul>` | `list-unordered` | U+EEBE |
| 19 | Unindent | `indent-decrease` | U+EE54 |
| 20 | Indent / blockquote | `indent-increase` | U+EE55 |
| 21 | Highlight | `mark-pen-line` | U+EF1C |
| 22 | Font color | `paint-fill` | U+EFC2 |
| 23 | Form dropdown | `file-list-3-line` | U+ECEF |
| 24 | Customize | `settings-line` | U+F0EE |
| 25 | Form `<form>` | `file-list-2-line` | U+ECED |
| 26 | Textbox | `input-cursor-move` | U+EE5E |
| 27 | Password | `lock-password-line` | U+EED0 |
| 28 | Textarea | `file-edit-line` | U+ECDB |
| 29 | Checkbox | `checkbox-line` | U+EB85 |
| 30 | Radio button | `radio-button-line` | U+F050 |
| 31 | Group box | `artboard-2-line` | U+EA7A |
| 32 | Dropdown select | `expand-up-down-line` | U+F327 |
| 33 | List box | `list-radio` | U+F39A |
| 34 | Push button | `cursor-line` | U+EC0A |
| 35 | Advanced button | `braces-line` | U+EAE9 |
| 36 | Hidden input | `eye-off-line` | U+ECB7 |
| 37 | Object | `box-3-line` | U+F2F5 |
| 38 | Camera | `camera-line` | U+EB31 |
| 39 | CD | `disc-line` | U+EC36 |
| 40 | Scanner | `scan-2-line` | U+F0BB |
| 41 | Printer | `printer-line` | U+F029 |
| 42 | Function | `function-line` | U+ED9E |
| 43 | Critical error | `close-circle-line` | U+EB97 |
| 44 | Warning | `alert-line` | U+EA21 |
| 45 | Information | `information-line` | U+EE59 |
| 46 | Blue flag | `flag-line` | U+ED3B |
| 47 | Background sound | `music-2-line` | U+EF83 |

## Mode switch glyphs ([H][M])

Since 0.17.0 the leftmost mode-switch pair also draws from this subset
(filled variants, most legible at toolbar sizes):

| Slot | Command | Remix Icon name | Codepoint |
|---|---|---|---|
| 20 | Mode switch: HTML | `html5-fill` | U+EE40 |
| 21 | Mode switch: Markdown | `markdown-fill` | U+EF1D |

## Dropdown arrow marker (since 0.17.9; live-drawn since 0.17.19)

| Purpose | Remix Icon name | Codepoint |
|---|---|---|
| Dropdown arrows on the heading / font / form buttons | `arrow-down-s-fill` | U+EA4D |

The toolbar sets no `TBSTYLE_EX_DRAWDDARROWS`, so the common control draws
no dropdown arrows of its own. Since 0.17.19 the arrow is not baked into
the bitmaps: `DrawDropdownArrow` paints it live in `NM_CUSTOMDRAW`'s
item-post-paint stage, right-anchored inside each dropdown button's real
rect (`GGO_METRICS` gives the exact ink box), in the band-aware glyph
color — dark ink on hover/pressed, matching the hot image list. Dropdown
buttons are widened by a strip (`MD_MARKER_STRIP`, 8 logical px) purely
to reserve the arrow room, and the image lists stay one plain cell-width
set for every button.

## Runtime notes

- The subset is embedded in `RichBar.dll` as an `RCDATA` resource
  (`IDR_ICON_FONT`, resource ID 200) and loaded into process-private memory
  with `AddFontMemResourceEx`: **no system font installation and no
  temporary font files**. Users do not need Remix Icon or the Segoe icon
  fonts installed.
- Normal/large icons render on **16/24 px canvases at 96 DPI**, scaled with
  the display DPI.
- **No fallback artwork by design**: a slot whose glyph cannot resolve
  (font registration failed or glyph unavailable) stays blank. The legacy
  Markdown letter/shape drawings and the HTML `?` marker were removed in
  0.16.0 — an explicit simplification, since the font ships inside the DLL.
- **Every button on the bar draws from this subset**, including the [H][M]
  mode switch (since 0.17.0): `html5-fill` for HTML, `markdown-fill` for
  Markdown.
- The legacy colored HTML BMPs remain unused, and the plug-in entry icon in
  the Plug-ins list keeps its own bitmap.

## Validation scope

`tools/test-icon-rendering.ps1` provides offscreen regression coverage
only; it makes no claim about EmEditor UI verification.

- All 20 Markdown icons: **280 pixel-exact comparisons** against direct
  Remix Icon drawing at **7 sizes × 2 colors**.
- The **actual image lists** for both modes, including the
  H/M slots: **732 comparisons per
  scenario**.
- Fallback scenarios assert that mapped slots stay **blank** (not
  nonempty).
- Font registration/release/reinitialization checks are unchanged.

## License and distribution

Remix Icon is distributed under the **Remix Icon License v1.0**, carried
verbatim in [LICENSE.third-party](../LICENSE.third-party) together with the
provenance header for the bundled subset.

Deployment to the sibling `../dist/` directory is manual; the font is
already embedded in the main DLL, so no separate font installation or loose
TTF deployment is needed:

```text
../dist/
  RichBar.dll
  LICENSE.third-party
  mui/
    1033/RichBar_loc.dll
    2052/RichBar_loc.dll
```
