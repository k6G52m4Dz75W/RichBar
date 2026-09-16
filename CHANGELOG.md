# Changelog

All notable changes to the **RichBar** plug-in (an enhanced HTML + Markdown
toolbar for EmEditor, based on the original Emurasoft HTMLBar) are documented
in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Version numbers follow a project-specific scheme inherited from the history of
this code base:

| Version range | Meaning |
|---------------|---------|
| `0.1.0`       | The original upstream HTMLBar source as forked (Emurasoft `19.5.0`), unmodified. |
| `0.4.x`       | Compatibility fixes that make the original plug-in build and load correctly on modern EmEditor (v26). |
| `0.9.0` – `0.13.x` | The HTML + Markdown dual-mode toolbar, heading towards `1.0.0`. |

## [0.13.0] - 2026-09-16

### Added

- **The Markdown pictogram icons now draw from the system icon font**
  (Segoe Fluent Icons on Windows 11, Segoe MDL2 Assets on Windows 10):
  bold, italic, strikethrough, inline code, quote, bulleted/numbered/task
  lists, link, image, table and the gear are real icon designs instead of
  letter/shape approximations. Each glyph is availability-checked per
  machine once; icons without a font glyph keep the previous letter/shape
  drawings (headings H1–H6, the code block, the horizontal rule and the
  `[H][M]` switch are letter/shape-based by design), and machines without
  these system fonts fall back entirely. No font files ship with the
  plug-in.

## [0.12.2] - 2026-09-16

### Changed

- **Runtime-drawn glyphs are 15% larger** (uniform `GLYPH_SIZE_SCALE` knob,
  tunable) to better match the official toolbar's icon size.

## [0.12.1] - 2026-09-16

### Fixed

- **Hovering a toolbar button in dark-band modes washed the glyph out.**
  On hover the toolbar control fills the button with the light system
  highlight but keeps drawing the same image, so light-on-dark glyphs turned
  into light-on-light. While the band is dark the toolbar now also receives
  a hot image list (`TB_SETHOTIMAGELIST`) — a mirror of the normal list with
  dark glyphs — so hovered buttons render dark-on-light.

## [0.12.0] - 2026-09-16

### Added

- **Very Dark mode adaptation.** EmEditor's Very Dark theme paints the whole
  bar area black, but its own toolbar icons do not flip to a contrasting
  color there. RichBar now uses the official Very Dark plug-in API (constants
  from the v20.5 SDK): `EI_IS_VERY_DARK` switches the runtime-drawn glyphs to
  light while Very Dark is active, `EI_WM_CTLCOLOR` blends the bar's dialog
  background into the black band using EmEditor's own brush, and
  `EI_WM_THEMECHANGED` re-renders the icons when the theme switches. Older
  EmEditor versions without these messages fall back to the 0.11.2
  background-luminance logic.

## [0.11.3] - 2026-09-16

### Fixed

- **The toolbar had no name in View > Toolbars.** That menu entry reuses the
  custom bar's band title, which 0.11.1 had emptied to save space. The band
  title is now the constant "RichBar" — it no longer changes with the mode
  (the `[H][M]` switch shows that), so the toolbar is identifiable in the
  menu while the on-screen label stays non-redundant.

## [0.11.2] - 2026-09-16

### Fixed

- **Toolbar glyphs (the Markdown icon set and the `[H][M]` switch) were too
  faint.** Glyph colors now follow the bar area's real background: EmEditor
  is queried for the bar background color and its luminance decides between
  dark glyphs on a light bar (`#303030`) and light glyphs on a dark one
  (`#E0E0E0`); an unknown color falls back to the light assumption, since
  EmEditor's dark themes currently leave the bar area light. Previously the
  glyphs followed the reported bar *text* color, which is designed for dark
  bars and washed out on the light bar area.
- The toolbar is re-created when the detected glyph color changes (theme or
  configuration switch), so the drawn icons follow color scheme changes
  without a restart.

## [0.11.1] - 2026-09-16

### Changed

- **Removed the "HTML"/"Markdown" text from the bar.** The `[H][M]` switch on
  the toolbar already shows the active mode, so the band title text was
  redundant; the whole bar width now goes to the buttons. (The title was
  reintroduced as a mode indicator in 0.10.3 and is superseded by the switch
  added in 0.11.0.)

## [0.11.0] - 2026-09-16

### Added

- **Manual mode switch: `[H][M]` segments at the left edge of the toolbar.**
  The leftmost two buttons form a standard grouped toggle — the pressed side
  is the active mode (H = HTML, M = Markdown). Clicking a side switches the
  button set, the bar title and the checked state immediately. This covers
  new, unsaved documents where auto detection has neither a file name nor a
  matching configuration to go by. The manual override lasts while the
  document state stays unchanged; any document or configuration change
  returns the bar to auto detection, which remains the default behavior.

## [0.10.3] - 2026-09-16

### Fixed

- **Restored the mode indicator in the custom bar title.** The bar title once
  again shows "HTML" or "Markdown" depending on the active mode (switching
  documents or configurations updates it together with the button set), which
  had been lost when the bar title was unified to "RichBar" during the rename.
  The title strings now come from the satellite (`IDS_TITLE` / new
  `IDS_TITLE_MD`) instead of a hard-coded literal. RichBar branding remains in
  the plug-in name.

## [0.10.2] - 2026-09-16

### Fixed

- **The plug-in version column showed the stale string "14".** EmEditor's
  version column comes from the plug-in's `EP_GET_VERSION` string
  (`IDS_VERSION` in the satellite), not from the file's VERSIONINFO resource,
  and the string had been carried over untouched from the original HTMLBar
  fork. It now tracks the release version. While the satellite could not be
  loaded (see 0.10.1) this was masked, because EmEditor silently fell back to
  reading the VERSIONINFO resource.

## [0.10.1] - 2026-09-16

### Fixed

- **The plug-in name showed up blank in the Customize Plug-ins list.**
  Two independent causes, both fixed:
  - etlframe resolved plug-in strings through a satellite instance that was
    only initialized when the first frame was created (`EVENT_CREATE_FRAME`),
    so name queries issued during the plug-in scan — before any frame exists —
    fell back to the main DLL, which carries no strings.
    `EEGetLocaleInstanceHandle` now loads the satellite on demand (the loaded
    instance is cached in `m_hinstLoc` and freed by the normal close flow),
    so the plug-in name resolves at scan time.
  - EmEditor matches satellite resources by exact UI-language resource tag:
    the file in `mui\2052` must be tagged `LANG_CHINESE` (0x804) rather than
    being a byte-for-byte copy of the English-tagged (0x409) binary. The
    satellite resource script now selects its resource language through a
    `LOC_LANG_2052` preprocessor define, and `tools/build-loc-2052.ps1`
    builds the `mui\2052` copy.

## [0.10.0] - 2026-09-16

### Changed

- **The plug-in is now called RichBar everywhere.** All project files
  (`RichBar.sln`, `RichBar.vcxproj`, `RichBar.cpp/.h/.rc/.def`), the satellite
  resource project (`mui/RichBar_loce`, producing `RichBar_loc.dll`), the
  plug-in name and status text shown in EmEditor, the custom bar title, and
  the properties dialog caption were renamed from HTMLBar to RichBar.
- **Settings storage is fully independent.** The plug-in profile key is
  derived from the plug-in DLL file name, so the rename moves the settings
  from `EmEditorPlugIns\HTMLBar` to a fresh `EmEditorPlugIns\RichBar` key.
  The new key cannot collide with the original HTMLBar plug-in or any other
  same-named plug-in, while still going through the official
  `EE_REG_SET_VALUE`/`EE_REG_QUERY_VALUE` channel (registry, or `eePlugins.ini`
  automatically in INI mode).
- The custom bar title is now "RichBar" in both modes (the active button set
  itself shows which mode is in effect); previously it read "HTML"/"Markdown".
- The version numbering moved from the initially planned 0.9.1 to 0.10.0 —
  the rename is a larger change than a patch release implies.

### Removed

- The migration that imported single-array button data saved by the old
  HTMLBar layout (`CmdArray`) — RichBar is a new plug-in and starts fresh.
- The legacy MSI uninstall integration inherited from the original HTMLBar
  installer (the `HKLM\...\EmEditorPlugIns\HTMLBar` ProductCode lookup);
  uninstalling now uses the standard confirm-and-delete-profile flow.

## [0.9.0] - 2026-09-16

### Added

- **Markdown mode.** The toolbar now carries two complete command sets
  (HTML and Markdown) and switches between them automatically:
  the mode is detected from the current configuration name
  (Markdown / HTML lists are separate and persist across sessions)
  with a file-extension fallback (`.md` `.markdown` `.mdown` `.mkd` vs.
  `.htm` `.html` `.xhtml` `.shtml`). Switching documents or configurations
  rebuilds the custom bar with the matching button set.
- **Markdown button set** (25 flat buttons): H1–H6 headings, bold, italic,
  strikethrough, inline code, fenced code block, block quote, bullet list,
  numbered list (auto numbering), task list, horizontal rule, link,
  image (with file picker), Markdown table (re-using the row/column table
  dialog), and the customize button.
- New `CMD_LINE_PREFIX` command type: toggles a per-line prefix
  (headings, quote, lists) over the selection, strips conflicting
  Markdown prefixes when switching styles, and auto-numbers ordered lists.
  Repeating the same prefix removes it.
- Toggle semantics for wrapping commands: applying Bold (and every other
  `CMD_TAGS` command) to text that is already wrapped removes the markers
  instead of nesting them.
- **Runtime-drawn Markdown icons**: Segoe UI glyphs rendered directly at the
  current button size on transparent backgrounds, colored after the editor's
  bar text color (`EI_GET_BAR_TEXT_COLOR`). They stay crisp at any DPI and
  blend with dark and light themes.
- The custom bar title now reflects the active mode ("HTML" / "Markdown").

### Changed

- Command sets are persisted per mode (`CmdArray0` / `CmdArray1` in the
  plug-in profile); existing single-array data written by earlier versions
  migrates automatically to the HTML set.

## [0.4.0] - 2026-09-15

### Fixed

- **Toolbar mounted with zero width on modern EmEditor.** The toolbar control
  carries `CCS_NORESIZE`, so it never resized its own window away from the
  initial 0 px width; EmEditor v26 measures the client window once at mount
  time and sized the custom bar to the title only, which rendered an empty
  band (the "HTML" caption with no buttons). The window is now sized
  explicitly via `TB_GETMAXSIZE` + `MoveWindow` before `Editor_ToolbarOpen`,
  and the ideal width is sent instead of restoring a stale saved band width.
- **Blank version in the plug-in list.** The project never embedded a
  `VERSIONINFO` resource; one has been added, so the plug-in now reports its
  version like any other plug-in.
- **MUI resource DLL failed to build** (`fatal error RC1015: cannot open
  include file 'afxres.h'`): the resource script now includes `winres.h`,
  removing the hidden MFC dependency.

## [0.1.0] - 2019-12-19

### Baseline

- The original HTMLBar plug-in source as forked from Emurasoft
  (merge of the `19.5.0` release), unmodified. This is the reference point
  all later versions are measured against.
