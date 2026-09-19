# RichBar

English | [简体中文](README.zh.md)

**RichBar** is an EmEditor plug-in providing an enhanced HTML + Markdown
toolbar, forked from the official Emurasoft HTMLBar plug-in source
(`19.5.0`). It is meant to replace the HTML/Markdown toolbar built into
EmEditor v26 (closed source, with most tags hidden inside dropdown menus).

Current release: **0.17.18 — 2026-09-19**.

## Features

- **Dual-mode auto switching**: the button set follows the current
  configuration (independent, persistent HTML / Markdown name lists) with a
  file-extension fallback (`.md` `.markdown` `.mdown` `.mkd` ↔ `.htm` `.html`
  `.xhtml` `.shtml`). Switching documents or configurations rebuilds the bar.
- **Manual mode switch `[H][M]`**: the leftmost two grouped toolbar buttons —
  the pressed side is the active mode. Covers new, unsaved documents where
  auto detection has nothing to go by; any document or configuration change
  returns the bar to auto detection.
- **Markdown button set**: 20 command icons plus five separators — H1–H6,
  bold, italic, strikethrough, inline code, fenced code block, block quote,
  bullet / numbered (auto numbering) / task lists, horizontal rule, link,
  image (file picker), table, customize. Wrapping commands toggle off when
  applied twice.
- **Runtime-drawn, theme-adaptive icons**: the bundled Remix Icon font
  subset supplies all 20 Markdown icons, all 48 HTML slots and the two
  [H][M] switch glyphs, rendered directly at the current button size and
  DPI — the whole bar shares one stroke language. Background luminance
  selects dark glyphs on light bars or light glyphs on dark bars, and on
  dark bars the control switches to the system dark toolbar theme
  (`DarkMode_Explorer`) so its own hover and pressed fills match the band.
  Theme and configuration changes re-render automatically.
- **MUI**: satellite resource DLLs (`mui\1033` English, `mui\2052` Simplified
  Chinese).
- **Settings via the official channel**: `EE_REG_SET_VALUE` /
  `EE_REG_QUERY_VALUE` (the `EmEditorPlugIns\RichBar` key; `eePlugins.ini`
  automatically in INI mode) — fully isolated from the original HTMLBar
  plug-in's settings.

## Toolbar icon reference

Since 0.16.0 both button sets draw from the bundled **Remix Icon** subset of
[Remix Icon](https://github.com/Remix-Design/RemixIcon) **4.9.1** — all 48
HTML slots (25 default buttons plus 23 customization-only commands) and all
20 Markdown icons — instead of the legacy colored HTML bitmaps and Segoe
Fluent Icons / Segoe MDL2 Assets. Persisted icon slots, saved customizations
and command behavior are unchanged; only the artwork and its color/DPI
adaptivity changed. The 59 unique names and codepoints are mapped in
[`docs/remix-icon.md`](docs/remix-icon.md); the Markdown set is:

| Icon index | Toolbar button | Remix Icon name | Codepoint |
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

### Rendering and font packaging

- `remixicon_subset.ttf` (61 unique icons, **8,924 bytes**) is embedded in
  `RichBar.dll` as an `RCDATA` resource (`IDR_ICON_FONT`). It is loaded
  directly into process-private memory with `AddFontMemResourceEx`: **no
  system font installation and no temporary font files**. Users do not need
  Remix Icon or the Segoe icon fonts installed. Regenerate it with
  `node tools/subset-icon-font.cjs <Remix Icon fonts directory>` (see
  [`docs/remix-icon.md`](docs/remix-icon.md)).
- Normal/large icon canvases are **16/24 px at 96 DPI**, scaled with display
  DPI (for example, 24/36 px at 150%). There is no extra 135% enlargement.
- The **H/M mode switch is icon-font glyphs too** (since 0.17.0): the Remix
  `html5-fill` (U+EE40) and `markdown-fill` (U+EF1D) pictograms replace the
  former Segoe UI Bold letters, so every button on the bar draws from the
  one bundled subset.
- **No fallback artwork**: since 0.16.0 the legacy Markdown letter/shape
  drawings and the HTML `?` marker are removed. A slot whose glyph cannot
  resolve (font registration failed or glyph unavailable) stays blank — an
  explicit simplification, since the font ships inside the DLL.
- **Dropdown affordance is baked in, Word-style**: the toolbar keeps two
  image lists — plain cell-width images for every button, and wide
  cell + strip images used only by the three in-bar dropdown buttons
  (heading, font, form), which widen by the strip and carry a small filled
  triangle centered in it, drawn with the same foreground color as
  everything else. The glyph cell itself is untouched, and plain buttons
  keep their exact pre-strip look and width. The dropdown buttons keep
  the `BTNS_DROPDOWN` style while the toolbar omits
  `TBSTYLE_EX_DRAWDDARROWS`, so the control draws no arrow of its own and
  no foreign colors can appear; clicking the whole button delivers
  `TBN_DROPDOWN` and opens the menu, and hovering opens it too.
- The **legacy colored HTML BMPs are no longer loaded** (their resources
  remain in the DLL, and the plug-in entry icon still uses its own bitmap).
  Because both modes draw monochrome glyphs, the **hover (hot) image list
  recolors every button in both modes**.
- Font provenance, SHA256, the complete subset mapping and license details
  are recorded in [docs/remix-icon.md](docs/remix-icon.md).

### Icon regression tests

On Windows with the Visual C++ build tools, the test command is:

```powershell
powershell -File tools/test-icon-rendering.ps1
```

The 0.17.x test script covers **all 20 Markdown icons plus the H/M glyphs
across 7 sizes and 2 foreground colors** (280 pixel-exact comparisons
against direct Remix Icon drawing for the 20 command icons), the **actual
image lists** for both modes including the H/M slots (732 comparisons per
scenario), **fallback subprocesses that assert every slot stays blank**,
and font registration/release/reinitialization checks. This is
offscreen regression coverage, not a claim that an EmEditor visual check
has passed.

### Historical Segoe reference only

[docs/glyph-reference.html](docs/glyph-reference.html) is retained as a
**historical** interactive catalog of Segoe Fluent Icons / Segoe MDL2 Assets.
Its highlighted mappings describe the pre-0.14.0 implementation, **not the
current toolbar**. It renders from installed Windows fonts and is not a
Remix Icon preview or a source for the current mapping. Download and open the
HTML file locally; GitHub displays its source by default.

## Build & install

Run the build commands from the repository root.

- Visual Studio (project toolset v142; override with
  `-p:PlatformToolset=v145` on newer Build Tools):

  ```
  MSBuild RichBar.sln -p:Configuration=Release -p:Platform=x64 -p:PlatformToolset=v145
  ```

  This builds the main DLL and English (`1033`) satellite under
  `x64\Release\PlugIns\`.

- The Simplified Chinese (`2052`) satellite needs a separate build step.
  `tools/build-loc-2052.ps1` lives **inside this repository**; it is
  **build-only**, not a deployment script:

  ```powershell
  powershell -File tools\build-loc-2052.ps1
  ```

- **Deploy manually** to the sibling **`../dist/`** directory, not a `dist/`
  directory inside this repository. Copy the newly built main DLL and both
  satellites, preserving the following layout, and copy `LICENSE.third-party`
  from the repository root alongside the main DLL:

  ```text
  ../dist/
    RichBar.dll
    LICENSE.third-party
    mui/
      1033/RichBar_loc.dll
      2052/RichBar_loc.dll
  ```

  Add `..\dist\RichBar.dll` via Customize Plug-ins, or point EmEditor's
  plug-ins folder at `..\dist\`. The font is already embedded in the main
  DLL; no separate font installation or loose TTF deployment is needed.

## Usage tips (tested)

- **Hide the on-screen "RichBar" title text**: EmEditor's customization has a
  toolbar-title display option — turn it off there. Do **not** empty the band
  title passed by the plug-in (0.11.1 tried): the View > Toolbars menu uses
  that title as the toolbar's name and toggle. Since 0.11.3 the title is the
  constant "RichBar"; let EmEditor's display option control the on-screen
  part.
- **Dark toolbar**: Tools > Customize > View > "custom bar colors" — uncheck
  "use system color", set a dark background (e.g. `#1E1E1E`) and light text
  (e.g. `#D0D0D0`). Icons flip to light glyphs automatically and flip back on
  light backgrounds. `.eetheme` theme files only affect the editor text area,
  not the bars.
- **Very Dark mode**: since 0.12.0 the official API is used
  (`EI_IS_VERY_DARK` / `EI_WM_CTLCOLOR` / `EI_WM_THEMECHANGED`) — the bar
  blends into the black band and icons switch to light glyphs, live on theme
  changes; older EmEditor versions are unaffected.
- **High-resolution displays**: the customization (same place as the toolbar
  title option) can enable large toolbar icons. Both icon sets re-draw at
  the new size and DPI.
- **HTML mode button style**: both the HTML and Markdown sets are
  runtime-drawn from the bundled Remix Icon subset and theme-adaptive; the
  HTML set no longer uses the original colored BMP toolbar assets. The
  plug-in's own entry icon in the Plug-ins list is unchanged.

## Version scheme

| Range | Meaning |
|-------|---------|
| `0.1.0` | The original upstream HTMLBar source as forked, unmodified. |
| `0.4.x` | Compatibility fixes to build and load on modern EmEditor (v26). |
| `0.9.0` – `0.17.x` | The HTML + Markdown dual-mode toolbar, heading towards `1.0.0`. |

See [CHANGELOG.md](CHANGELOG.md) (English) /
[CHANGELOG.zh.md](CHANGELOG.zh.md) (Chinese) for details.

## License

See [LICENSE](LICENSE). Original code copyright Emurasoft.
The bundled Remix Icon subset has a separate third-party notice in
[LICENSE.third-party](LICENSE.third-party): the complete Remix Icon License
v1.0 (Copyright (c) 2017–2026 Remix Design), reproduced verbatim from the
[Remix Icon](https://github.com/Remix-Design/RemixIcon) 4.9.1 release.
Redistributions must retain this notice.
