# RichBar

English | [简体中文](README.zh.md)

**RichBar** is an EmEditor plug-in providing an enhanced HTML + Markdown
toolbar, forked from the official Emurasoft HTMLBar plug-in source
(`19.5.0`). It is meant to replace the HTML/Markdown toolbar built into
EmEditor v26 (closed source, with most tags hidden inside dropdown menus).

Current release: **0.14.0 — 2026-09-17**.

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
  supplies all 20 Markdown icons, rendered directly at the current button
  size and DPI. Background luminance selects dark glyphs on light bars or
  light glyphs on dark bars; a hot image list keeps hovered buttons readable
  in dark-band modes. Theme and configuration changes re-render automatically.
- **MUI**: satellite resource DLLs (`mui\1033` English, `mui\2052` Simplified
  Chinese).
- **Settings via the official channel**: `EE_REG_SET_VALUE` /
  `EE_REG_QUERY_VALUE` (the `EmEditorPlugIns\RichBar` key; `eePlugins.ini`
  automatically in INI mode) — fully isolated from the original HTMLBar
  plug-in's settings.

## Toolbar icon reference

Since 0.14.0, all 20 Markdown command icons use the bundled **Lucide** subset
from `lucide-static` **1.47.0**, rather than Segoe Fluent Icons / Segoe MDL2
Assets. These are the exact indices, subset names and codepoints mapped in
`RichBar.h`.

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

- `lucide_subset.ttf` is **7,780 bytes**, embedded in `RichBar.dll` as an
  `RCDATA` resource. It is loaded directly into process-private memory with
  `AddFontMemResourceEx`: **no system font installation and no temporary font
  files**. Users do not need Lucide or the Segoe icon fonts installed.
- Normal/large icon canvases are **16/24 px at 96 DPI**, scaled with display
  DPI (for example, 24/36 px at 150%). There is no extra 135% enlargement.
- The **H/M mode switch is unchanged**: Segoe UI Bold text, **14/21 px at
  96 DPI** for normal/large icons, scaled with the canvas. These are pixel
  character heights, not points. H/M is not part of the Lucide subset;
  headings H1–H6 and the code block now use Lucide in normal operation.
- Legacy letter/shape drawing remains the fallback when the bundled font
  cannot be loaded. HTML command icons retain the **original colored BMP
  assets**, unchanged and not theme-adaptive. EmEditor's toolbar title is
  unchanged.
- Font provenance, SHA256, the complete subset mapping and license details
  are recorded in [docs/lucide-font.md](docs/lucide-font.md).

### Icon regression tests

On Windows with the Visual C++ build tools, the test command is:

```powershell
powershell -File tools/test-icon-rendering.ps1
```

The 0.14.0 test script covers **all 20 Lucide icons across multiple sizes
and foreground colors** (pixel-compared against direct Lucide drawing), plus
**simulated unavailable-font and missing-glyph fallback** subprocesses, and
font registration/release/reinitialization checks. This is offscreen
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
  title option) can enable large toolbar icons. The HTML bitmaps scale and
  the Markdown icons / `[H][M]` switch re-draw at the new size.
- **HTML mode button style**: the HTML set still uses the original BMP color
  assets (not themeable); the Markdown set and the `[H][M]` switch are
  runtime-drawn and theme-adaptive.

## Version scheme

| Range | Meaning |
|-------|---------|
| `0.1.0` | The original upstream HTMLBar source as forked, unmodified. |
| `0.4.x` | Compatibility fixes to build and load on modern EmEditor (v26). |
| `0.9.0` – `0.14.x` | The HTML + Markdown dual-mode toolbar, heading towards `1.0.0`. |

See [CHANGELOG.md](CHANGELOG.md) (English) /
[CHANGELOG.zh.md](CHANGELOG.zh.md) (Chinese) for details.

## License

See [LICENSE](LICENSE). Original code copyright Emurasoft.
The bundled Lucide subset has separate third-party notices in
[LICENSE.third-party](LICENSE.third-party): the complete upstream ISC license
(Copyright 2026 Lucide Icons and Contributors), including Feather-derived icon
attribution and the MIT license (Copyright 2013-present Cole Bemis).
Redistributions must retain these notices.
