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
| `0.9.0` – `0.10.x` | The HTML + Markdown dual-mode toolbar, heading towards `1.0.0`. |

## [0.10.1] - 2026-09-16

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
- Version 0.10.1 (the plug-in rename and the plug-in-name fix ship together
  in this version; the previously planned 0.9.1/0.10.0 numbering is superseded).
- The custom bar title is now "RichBar" in both modes (the active button set
  itself shows which mode is in effect); previously it read "HTML"/"Markdown".

### Removed

- The migration that imported single-array button data saved by the old
  HTMLBar layout (`CmdArray`) — RichBar is a new plug-in and starts fresh.
- The legacy MSI uninstall integration inherited from the original HTMLBar
  installer (the `HKLM\...\EmEditorPlugIns\HTMLBar` ProductCode lookup);
  uninstalling now uses the standard confirm-and-delete-profile flow.

### Fixed

- **The plug-in name showed up blank in the Customize Plug-ins list** on
  systems whose UI language is not English. EmEditor resolves plug-in
  strings from the `mui\<LCID>` satellite DLL using an exact UI-language
  resource-tag match, and the file shipped in `mui\2052` was a byte-for-byte
  copy of the English-tagged (0x409) satellite. The satellite resource
  script now selects its resource language through a `LOC_LANG_2052`
  preprocessor define, and `tools/build-loc-2052.ps1` builds the `mui\2052`
  copy with Simplified Chinese (0x804) resource tags.

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
