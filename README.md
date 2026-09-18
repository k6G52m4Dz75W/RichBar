# RichBar

English | [简体中文](README.zh.md)

**RichBar** is an EmEditor plug-in providing an enhanced HTML + Markdown
toolbar, forked from the official Emurasoft HTMLBar plug-in source
(`19.5.0`). It is meant to replace the HTML/Markdown toolbar built into
EmEditor v26 (closed source, with most tags hidden inside dropdown menus).

Current release: **0.15.6 — 2026-09-17**.

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
- **Runtime-drawn, theme-adaptive icons**: the bundled Lucide font subset
  supplies all 20 Markdown icons and all 48 HTML slots, rendered directly at
  the current button size and DPI — both modes share one stroke language.
  Background luminance selects dark glyphs on light bars or light glyphs on
  dark bars; a hot image list keeps hovered buttons readable in dark-band
  modes. Theme and configuration changes re-render automatically.
- **MUI**: satellite resource DLLs (`mui\1033` English, `mui\2052` Simplified
  Chinese).
- **Settings via the official channel**: `EE_REG_SET_VALUE` /
  `EE_REG_QUERY_VALUE` (the `EmEditorPlugIns\RichBar` key; `eePlugins.ini`
  automatically in INI mode) — fully isolated from the original HTMLBar
  plug-in's settings.

## Toolbar icon reference

Since 0.15.0 both button sets draw from the bundled **Lucide** subset of
`lucide-static` **1.47.0** — all 48 HTML slots (25 default buttons plus 23
customization-only commands) and all 20 Markdown icons — instead of the
legacy colored HTML bitmaps and Segoe Fluent Icons / Segoe MDL2 Assets.
Persisted icon slots, saved customizations and command behavior are
unchanged; only the artwork and its color/DPI adaptivity changed. The 58
unique names and codepoints are mapped in [`docs/lucide-font.md`](docs/lucide-font.md);
the Markdown set is:

| Icon index | Toolbar button | Lucide subset name | Codepoint |
|---|---|---|---|
| 0 | Heading H1 | `heading-1` | U+E385 |
| 1 | Heading H2 | `heading-2` | U+E386 |
| 2 | Heading H3 | `heading-3` | U+E387 |
| 3 | Heading H4 | `heading-4` | U+E388 |
| 4 | Heading H5 | `heading-5` | U+E389 |
| 5 | Heading H6 | `heading-6` | U+E38A |
| 6 | Bold | `bold` | U+E05D |
| 7 | Italic | `italic` | U+E0FB |
| 8 | Strikethrough | `strikethrough` | U+E177 |
| 9 | Inline code | `code` | U+E093 |
| 10 | Fenced code block | `code-xml` | U+E206 |
| 11 | Block quote | `quote` | U+E239 |
| 12 | Bullet list | `list` | U+E106 |
| 13 | Numbered list | `list-ordered` | U+E1D1 |
| 14 | Task list | `list-todo` | U+E4C3 |
| 15 | Horizontal rule | `minus` | U+E11C |
| 16 | Link | `link` | U+E102 |
| 17 | Image | `image` | U+E0F6 |
| 18 | Table | `table` | U+E17D |
| 19 | Customize | `settings` | U+E154 |

### Rendering and font packaging

- `lucide_subset.ttf` (58 unique icons, **21,564 bytes**) is embedded in
  `RichBar.dll` as an `RCDATA` resource. It is loaded directly into
  process-private memory with `AddFontMemResourceEx`: **no system font
  installation and no temporary font files**. Users do not need Lucide or
  the Segoe icon fonts installed. Regenerate it with
  `node tools/subset-lucide.cjs <lucide-static font directory>` (see
  [`docs/lucide-font.md`](docs/lucide-font.md)).
- Normal/large icon canvases are **16/24 px at 96 DPI**, scaled with display
  DPI (for example, 24/36 px at 150%). There is no extra 135% enlargement.
- The **H/M mode switch is unchanged**: Segoe UI Bold text, **14/21 px at
  96 DPI** for normal/large icons, scaled with the canvas. These are pixel
  character heights, not points. H/M is not part of the Lucide subset.
- **Markdown fallback**: if the bundled font cannot be loaded, the Markdown
  set falls back to the legacy letter/shape drawings. An HTML slot whose
  glyph is unavailable draws a bold `?` marker instead of a wrong icon.
- The **legacy colored HTML BMPs are no longer loaded** (their resources
  remain in the DLL, and the plug-in entry icon still uses its own bitmap).
  Because both modes now draw monochrome glyphs, the **hover (hot) image
  list recolors every button in both modes**, not just the Markdown one.
- Font provenance, SHA256, the complete subset mapping and license details
  are recorded in [docs/lucide-font.md](docs/lucide-font.md).

### Icon regression tests

On Windows with the Visual C++ build tools, the test command is:

```powershell
powershell -File tools/test-icon-rendering.ps1
```

The 0.15.0 test script covers **all 20 Markdown and all 48 HTML icons across
multiple sizes and foreground colors** (pixel-compared against direct Lucide
drawing), the **actual normal and hot image lists** for both modes including
the H/M slots (1,464 comparisons per scenario), plus **simulated
unavailable-font and missing-glyph fallback** subprocesses, and font
registration/release/reinitialization checks. This is offscreen
regression coverage, not a claim that an EmEditor visual check has passed.

### Historical Segoe reference only

[docs/glyph-reference.html](docs/glyph-reference.html) is retained as a
**historical** interactive catalog of Segoe Fluent Icons / Segoe MDL2 Assets.
Its highlighted mappings describe the pre-0.14.0 implementation, **not the
current toolbar**. It renders from installed Windows fonts and is not a
Lucide preview or a source for the current mapping. Download and open the
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
  runtime-drawn from the bundled Lucide subset and theme-adaptive; the HTML
  set no longer uses the original colored BMP toolbar assets. The
  plug-in's own entry icon in the Plug-ins list is unchanged.

## Version scheme

| Range | Meaning |
|-------|---------|
| `0.1.0` | The original upstream HTMLBar source as forked, unmodified. |
| `0.4.x` | Compatibility fixes to build and load on modern EmEditor (v26). |
| `0.9.0` – `0.15.x` | The HTML + Markdown dual-mode toolbar, heading towards `1.0.0`. |

See [CHANGELOG.md](CHANGELOG.md) (English) /
[CHANGELOG.zh.md](CHANGELOG.zh.md) (Chinese) for details.

## License

See [LICENSE](LICENSE). Original code copyright Emurasoft.
The bundled Lucide subset has separate third-party notices in
[LICENSE.third-party](LICENSE.third-party): the complete upstream ISC license
(Copyright 2026 Lucide Icons and Contributors), including Feather-derived icon
attribution and the MIT license (Copyright 2013-present Cole Bemis).
Redistributions must retain these notices.
