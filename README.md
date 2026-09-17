# RichBar

English | [简体中文](README.zh.md)

**RichBar** is an EmEditor plug-in providing an enhanced HTML + Markdown
toolbar, forked from the official Emurasoft HTMLBar plug-in source
(`19.5.0`). It is meant to replace the HTML/Markdown toolbar built into
EmEditor v26 (closed source, with most tags hidden inside dropdown menus).

## Features

- **Dual-mode auto switching**: the button set follows the current
  configuration (independent, persistent HTML / Markdown name lists) with a
  file-extension fallback (`.md` `.markdown` `.mdown` `.mkd` ↔ `.htm` `.html`
  `.xhtml` `.shtml`). Switching documents or configurations rebuilds the bar.
- **Manual mode switch `[H][M]`**: the leftmost two grouped toolbar buttons —
  the pressed side is the active mode. Covers new, unsaved documents where
  auto detection has nothing to go by; any document or configuration change
  returns the bar to auto detection.
- **Markdown button set** (25): H1–H6, bold, italic, strikethrough, inline
  code, fenced code block, block quote, bullet / numbered (auto numbering) /
  task lists, horizontal rule, link, image (file picker), table, customize.
  Wrapping commands toggle off when applied twice.
- **Runtime-drawn, theme-adaptive icons**: rendered directly at the current
  button size (crisp at any DPI), colored by the bar background luminance
  (dark glyphs on light bars, light glyphs on dark bars), with a hot image
  list so hovered buttons stay readable in dark-band modes. Pictograms draw
  from the system icon font (see below); light/dark theme and configuration
  changes re-render automatically.
- **MUI**: satellite resource DLLs (`mui\1033` English, `mui\2052` Simplified
  Chinese).
- **Settings via the official channel**: `EE_REG_SET_VALUE` /
  `EE_REG_QUERY_VALUE` (the `EmEditorPlugIns\RichBar` key; `eePlugins.ini`
  automatically in INI mode) — fully isolated from the original HTMLBar
  plug-in's settings.

## Toolbar icon reference

The Markdown set's pictograms draw from the system icon fonts —
**Segoe Fluent Icons** (Windows 11) and **Segoe MDL2 Assets** (Windows 10).
The two fonts share the same codepoints but the artwork differs slightly
(most visibly on Strikethrough), hence the two preview columns. Preview
images are hot-linked from the official Microsoft Learn glyph tables.

| Toolbar button | Codepoint | Segoe Fluent Icons (Win 11) | Segoe MDL2 Assets (Win 10) |
|---|---|---|---|
| Bold | U+E8DD | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e8dd.png" width="20" alt="Bold (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e8dd.png" width="20" alt="Bold (MDL2)"> |
| Italic | U+E8DB | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e8db.png" width="20" alt="Italic (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e8db.png" width="20" alt="Italic (MDL2)"> |
| Strikethrough | U+EDE0 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/ede0.png" width="20" alt="Strikethrough (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/ede0.png" width="20" alt="Strikethrough (MDL2)"> |
| Inline code | U+E943 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e943.png" width="20" alt="Code (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e943.png" width="20" alt="Code (MDL2)"> |
| Block quote | U+E848 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e848.png" width="20" alt="LeftQuote (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e848.png" width="20" alt="LeftQuote (MDL2)"> |
| Bullet list | U+E8FD | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e8fd.png" width="20" alt="BulletedList (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e8fd.png" width="20" alt="BulletedList (MDL2)"> |
| Task list | U+E9D5 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e9d5.png" width="20" alt="CheckList (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e9d5.png" width="20" alt="CheckList (MDL2)"> |
| Link | U+E71B | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e71b.png" width="20" alt="Link (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e71b.png" width="20" alt="Link (MDL2)"> |
| Image | U+E8B9 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e8b9.png" width="20" alt="Picture (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e8b9.png" width="20" alt="Picture (MDL2)"> |
| Customize (gear) | U+E713 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e713.png" width="20" alt="Settings (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e713.png" width="20" alt="Settings (MDL2)"> |
| Headings H1–H6 | — | letter-drawn | letter-drawn |
| Numbered list | — | shape-drawn (no official glyph) | shape-drawn (no official glyph) |
| Table | — | shape-drawn (no official glyph) | shape-drawn (no official glyph) |
| Code block | — | letter-drawn `{ }` | letter-drawn `{ }` |
| Horizontal rule | — | line-drawn | line-drawn |
| Mode switch H / M | — | letter-drawn | letter-drawn |

### Best-practice notes (per the official guidance)

- Icon-font glyphs live in the Unicode Private Use Area, so the family name
  is always set explicitly — Fluent Icons on Windows 11, MDL2 Assets on
  Windows 10 (the equivalent of XAML's `SymbolThemeFontFamily`), and every
  glyph is probed with `GetGlyphIndices` (`GGI_MARK_NONEXISTING_GLYPHS`)
  before use. Icons whose glyph is missing on a given machine fall back to
  the letter/shape drawings — never a missing-character box.
- Glyphs in the deprecated `E0xx`–`E5xx` range are not used.
- The fonts recommend sizes 16/20/24/32/40/48/64 for hinted rendering;
  RichBar renders anti-aliased at arbitrary sizes (tunable via
  `GLYPH_SIZE_SCALE` in `RichBar.h`) so the icons scale freely with the
  button size.
- No font files are redistributed — the fonts are part of Windows and are
  referenced by family name only.

## Build & install

- Visual Studio (project toolset v142; override with
  `-p:PlatformToolset=v145` on newer Build Tools):

  ```
  MSBuild RichBar.sln -p:Configuration=Release -p:Platform=x64 -p:PlatformToolset=v145
  ```

- The Simplified Chinese satellite needs its own build step (only this
  script produces it):

  ```
  powershell -File tools\build-loc-2052.ps1
  ```

- Deploy the `dist\` folder (`RichBar.dll` + `mui\1033\RichBar_loc.dll` +
  `mui\2052\RichBar_loc.dll`), add `dist\RichBar.dll` via Customize
  Plug-ins, or point EmEditor's plug-ins folder at `dist\`.

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
| `0.9.0` – `0.13.x` | The HTML + Markdown dual-mode toolbar, heading towards `1.0.0`. |

See [CHANGELOG.md](CHANGELOG.md) (English) /
[CHANGELOG.zh.md](CHANGELOG.zh.md) (Chinese) for details.

## License

See [LICENSE](LICENSE). Original code copyright Emurasoft.
