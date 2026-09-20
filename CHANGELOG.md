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
| `0.9.0` – `0.17.x` | The HTML + Markdown dual-mode toolbar, heading towards `1.0.0`. |

## [0.19.4] - 2026-09-20

### Fixed

- **Dropdown buttons no longer draw their arrow in the normal ink while
  pressed.** `NMCUSTOMDRAW.uItemState` is documented valid only at
  ITEMPREPAINT, and the post-paint stage saw no pressed state, so on dark
  bands the arrow stayed light on the light pressed fill. The arrow color
  is now derived from the control's authoritative button state
  (`TB_GETSTATE` pressed / `TB_GETHOTITEM`).
- The **Icon Color button joined the dropdown family**: it now carries the
  dropdown triangle marker, the widened button, and hover-to-open like
  the other dropdown buttons (its menu moved from the WM_COMMAND path to
  the `TBN_DROPDOWN` path).

## [0.19.3] - 2026-09-20

### Fixed

- **The Icon Color toolbar button did not refresh the bar**: swapping the
  image lists in `RebuildToolbarImages` does not repaint already-visible
  buttons, so the new colors only appeared after some unrelated
  invalidation. The rebuild now finishes with `TB_AUTOSIZE` +
  `InvalidateRect` + `UpdateWindow`, applying the change instantly.

## [0.19.2] - 2026-09-20

### Fixed

- **The toolbar Icon Color button was dead** — its popup menu resource was
  written as a flat menu, but the popup helper resolves the menu's first
  submenu (`GetSubMenu(0)`), which came back NULL and TrackPopupMenu
  silently failed. The menu is now wrapped in a POPUP entry like every
  other popup in this plug-in.
- The button glyph is Remix `color-filter-line` (U+F42E) instead of
  `drop-line` (subset stays 63 glyphs; 9,264 bytes, SHA256
  `d7f5a0690523a6c5e5731834146727b9e9e0d94feb8ed04dc364a8579c644699`).

## [0.19.1] - 2026-09-20

### Added

- **An Icon Color button on the toolbar itself** (both modes, next to
  Customize): clicking pops a small menu — *Automatic* restores the
  band-luminance black/white ink, *Custom Color...* opens the standard
  color dialog; either applies immediately and persists. The button uses
  a new dedicated glyph, Remix `drop-line` (U+EC6A), added to both icon
  pools (Markdown slot 20, HTML slot 48; the subset grows to 63 glyphs,
  9,104 bytes, SHA256
  `90bf417fe74a9d7fd28b3f3218dd3ed0952e3466e7faf6c672fe91b770210cc4`).
- **Migration**: button arrays saved by older versions are spliced with
  the new button on load (inserted before Customize) and persisted.

### Fixed

- Opening Properties on the Icon Color button can no longer convert it
  into another command type; only its title and icon are editable.

## [0.19.0] - 2026-09-20

### Fixed

- **The button-properties icon picker is labeled by the current mode's
  command titles.** The picker labeled every icon slot with the HTML
  default command table (`ID_HEADER + slot`), which read fine in HTML
  mode but paired every Markdown icon with an unrelated HTML command
  name (bold icon next to "Font", bullet list next to "Align Left", …).
  Slots are now labeled with the title of the command that actually uses
  them in the current mode (following renames too); unassigned HTML
  slots keep their default command name as before. The two `[H][M]`
  mode-switch glyphs are no longer offered as assignable icons.

## [0.18.0] - 2026-09-20

### Added

- **Custom icon color** (first feature release of the 0.18 line): the
  plug-in properties dialog gains an *Icon color* row — **Auto** keeps the
  established band-luminance black/white behavior, **Custom** pins the
  glyph ink (and the live-drawn dropdown arrow) to any color picked with
  the standard Windows color dialog. The mode and the color persist with
  the other settings, and confirming the dialog re-renders the bar.
  Hover/pressed ink always stays dark: those fills are the control's
  light system highlight, so custom mode simply always builds the
  dark-glyph copies; the contrast of the custom color against the band
  background is the user's call.

### Changed

- carries the tail of the 0.17.22–0.17.23 arrow-position tuning (no
  functional notes).

## [0.17.20] - 2026-09-19

### Fixed

- **0.17.19 blew up the three dropdown buttons to garbage widths** (the
  reported "half the bar got eaten"): refactoring dropped the
  `m_cxImage` assignment on the bar-creation path, so `AddButtons` set
  the button width from an uninitialized member. The assignment is
  restored and both width members are now initialized in the constructor.
- Custom-draw replies from a dialog proc go through `DWL_MSGRESULT`,
  not the proc's return value — without this the live arrow could never
  have been painted. Plumbing fixed.

## [0.17.19] - 2026-09-19

### Changed

- **The dropdown arrow is no longer baked into the bitmaps at all — it is
  drawn live at paint time, anchored to each button's ACTUAL rect**
  (`NM_CUSTOMDRAW` item-post-paint; the same stage comctl32 itself uses for
  its own arrows). This removes the entire class of failures from
  0.17.9–0.17.18: whatever the control does with image placement, padding
  or per-button width, the arrow is positioned from the real button
  rectangle and can never be shifted or clipped by it.
- The image lists return to one plain cell-width set for every button
  (the dual-list / `MAKELONG` / `CCM_SETVERSION` machinery of
  0.17.15–0.17.18 is removed); dropdown buttons are still widened by the
  strip purely to reserve room for the arrow. The arrow is drawn in the
  band-aware glyph color and switches to dark ink on hover/pressed,
  matching the hot-list behavior.

## [0.17.18] - 2026-09-19

### Changed

- **The marker is right-anchored in the strip and slightly larger.** The
  control's internal image alignment (left vs centered) inside the wider
  button is not externally observable, and the previous centered placement
  left the marker's on-screen position ambiguous. The ink is now pinned to
  the strip's right edge with a fixed margin (`max(3, strip/5)`), making
  the on-screen position identical under either alignment, and the marker
  font grows to 3/2 of the strip (ink = 3/4 strip: at 200% DPI 15 px wide
  in the 20 px strip, ~4 px image margin plus the control's padding to the
  button edge).

## [0.17.17] - 2026-09-19

### Changed

- **The marker strip gets breathing room.** At the old values (6 logical px
  strip, marker font at 5/3 of the strip) the glyph's ink filled ~10 of
  the strip's 12 px at 200% DPI — 1 px margins, visually touching the
  button's right side. The strip is now 10 logical px (`MD_MARKER_STRIP`)
  and the marker font 4/3 of it, so the ink fills two thirds of the strip
  with ~1/6 strip of margin on each side (at 200% DPI: 20 px strip, 13 px
  ink, ~3.5 px margins plus the 7 px control padding to the button edge).
  Dropdown buttons correspondingly measure cell + 20 px + padding.

## [0.17.16] - 2026-09-19

### Fixed

- **The mixed button widths now actually show.** The control pads every
  image button (button width = image width + padding) and clips images to
  that padded content area, so a dropdown button sized to exactly the wide
  image (cell + strip) clipped the strip's right half — the vertical cut
  through the middle of the baked triangle. Dropdown buttons are now sized
  to image + strip + the control's own padding, with the padding measured
  live from a plain button (DPI- and settings-proof): plain buttons stay
  at the control's own width, the three dropdown buttons are genuinely
  wider, and the wide image fits whole. The temporary layout diagnostics
  from the debugging round are removed again.

## [0.17.15] - 2026-09-19

### Changed

- **Buttons no longer share one width: plain buttons are back to one cell,
  only dropdown buttons widen by the marker strip.** The toolbar now uses
  two image lists selected per button with the documented multiple-image-
  list mechanism (`CCM_SETVERSION 5`, `iBitmap = MAKELONG(index, id)`,
  verified against live comctl32 including hot-image-list IDs): list 0
  carries 16 px (cell-wide) images with the glyph centered — exactly what
  plain buttons showed before 0.17.10 — and list 1 carries the wide
  cell + strip images for the heading / font / form buttons, whose width
  is set per button (`TBIF_SIZE`). Dark bands get matching hot lists for
  both sizes, and the pressed-state dark-copy swap stays within list 1.

## [0.17.14] - 2026-09-19

### Fixed

- **Non-dropdown icons sit centered again.** Since 0.17.10 widened every
  image to cell + strip, glyphs drawn in the left cell left-packed every
  button. Non-dropdown (and `[H][M]`) glyphs now center on the full image
  width — the exact button position a plain cell-width image had — at an
  unchanged font size; dropdown glyphs stay in the left cell with the
  marker strip to their right (Word-style). `DrawIconGlyph` /
  `DrawMdIcon` / `DrawHtmlIcon` take an optional wider drawing rect,
  decoupling glyph font size from the canvas width.
- The harness now asserts the centering, that dropdown glyph cells match a
  direct cell-width rendering (color-compared; list slots carry alpha FF
  after the key-out), and that marker ink stays inside the measured strip
  box and actually exists.

## [0.17.13] - 2026-09-19

### Removed

- The theme-state recheck (0.17.11) and the 1 s state poll (0.17.12).
  Field testing confirmed the root cause is upstream and absolute: when
  leaving Very Dark, EmEditor never updates `EI_IS_VERY_DARK` or
  `EI_GET_BAR_BACK_COLOR` before relaunch — the queryable state itself is
  never modified, so no plug-in can detect the switch by any means
  (notification, recheck or polling), and the machinery only added
  overhead. The bar still re-renders on `WM_THEMECHANGED` and on every
  mode/config-driven re-creation; the dark -> light flip takes a relaunch
  until fixed in EmEditor itself.

## [0.17.12] - 2026-09-19

### Fixed

- **The dark -> light workaround no longer depends on any notification.**
  0.17.11's deferred recheck only armed on `WM_THEMECHANGED`, which
  apparently never reaches the bar when leaving Very Dark — so it never
  ran. The bar now keeps a permanent 1 s poll that compares the raw theme
  state (`EI_IS_VERY_DARK` + `EI_GET_BAR_BACK_COLOR`) against a snapshot
  taken when the current image lists were drawn, and re-creates the bar
  when the state diverges *and* the derived glyph color changes with it.
  Any in-session update of the scheme state is now picked up within a
  second; if EmEditor keeps both values pinned until relaunch, nothing
  queryable can detect the switch and the limitation moves upstream.

## [0.17.11] - 2026-09-19

### Fixed

- **Dark -> light theme switch now recolors the bar without a restart** (as
  a plug-in-side workaround). Confirmed systemic upstream behavior: no
  plug-in sees EmEditor's scheme change in time when leaving Very Dark, so
  the bar kept its dark rendering until relaunch. After handling
  `WM_THEMECHANGED` the bar now arms a deferred recheck (1 s; postponed
  while a dropdown menu tracks) that re-evaluates the glyph color and
  re-creates the bar if it no longer matches — the flip shows up about a
  second late instead of never. The bar is also re-created on the theme
  message even while hidden, so showing it afterwards is no longer stale.
- **The dropdown marker now re-syncs immediately after customization**:
  closing the Customize dialog re-renders the image lists against the
  edited command array (customization edits buttons live but never
  rebuilt the lists, so a re-added dropdown button could temporarily lack
  its arrow until the next bar re-creation, and a reassigned icon could
  keep a stale one).

## [0.17.10] - 2026-09-19

### Fixed

- **0.17.9 shipped without a single marker** — the command array is loaded
  *after* the image lists are built in `DisplayBar`, so `IsDropdownIconIndex`
  found nothing at bake time and no bitmap ever got an arrow (the system
  arrow was already gone, hence "no triangle at all"). `LoadCmdArray` now
  runs before the image-list build.
- **The bottom-right corner overlay could not stay legible anyway**: at
  16 px the heading / font / form glyphs' ink reaches into the bottom-right
  corner, and a same-colored marker merges with it (the exact "merged into
  one glyph" failure of 0.17.5, confirmed by pixel-level ink maps). The
  layout is now Word-style split images: every image is one glyph cell plus
  a dedicated 6 px (96 DPI, DPI-scaled) arrow strip on the right, the glyph
  cell is rendered pixel-identical to before, and the `arrow-down-s-fill`
  marker is centered in the strip. Buttons widen accordingly
  (`TB_SETBUTTONSIZE`); bar width follows via `TB_GETMAXSIZE` as before.

### Changed

- `tools/test-icon-rendering.ps1` asserts the stronger guarantees: the
  glyph cell is pixel-identical with and without the marker, the marker
  ink stays confined to the strip (validated against `GGO_METRICS`), and
  only dropdown-command icons carry it.

## [0.17.9] - 2026-09-18

### Fixed

- **The dropdown-arrow color finally follows the band in every theme,
  including Very Dark.** The common control's wholedropdown arrow (fixed
  dark gray, unreachable by any plugin-side mechanism — the withdrawn
  0.17.1–0.17.8 experiments covered button geometry, the
  `DarkMode_Explorer` theme class, forwarding custom draw to EmEditor and
  `TBCDRF_USECDCOLORS`) is gone for good: the three dropdown buttons keep
  `BTNS_DROPDOWN` (the whole button still sends `TBN_DROPDOWN`), but the
  toolbar no longer sets `TBSTYLE_EX_DRAWDDARROWS`, so the control draws
  no arrow at all.
- The arrow is now Remix's `arrow-down-s-fill` glyph (U+EA4D) baked into
  the dropdown buttons' icon bitmaps at the bottom-right corner, drawn
  with the same band-aware glyph color as everything else — mirroring the
  mask-color replacement EmEditor itself performs on plug-in bitmaps
  (per the `EP_GET_MASK` mechanism). The marker rides the normal/hot/
  pressed image-list states, so it recolors and inverts with hover/press
  automatically, and it follows icon customization (resolved per the
  current command array).

### Changed

- The subset font gains the marker glyph: **62 unique icons**, 8,964
  bytes, SHA256
  `ea113337d0b9b4cb0f645f13a2e1333e0fa86884f057bb30903cc0696b3d708a`.
- `tools/test-icon-rendering.ps1` verifies the marker is baked only into
  dropdown-command icons, anchored to the bitmap's bottom-right corner
  (ink-box placement validated against `GGO_METRICS`), and that no other
  pixels change.

## [0.17.5] - 2026-09-19

### Fixed

- **Every 0.17.1-0.17.4 attempt at the dropdown-arrow color was withdrawn**
  (revert commits on master); the toolbar code is restored to the proven
  0.15.7 architecture - `BTNS_WHOLEDROPDOWN` buttons with the control's
  own theme-drawn arrows, the hover hot image list, and the pressed-state
  dark-glyph copies - now pointed at the Remix subset and its codepoints.
- The [H][M] mode switch draws the Remix `html5-fill`/`markdown-fill`
  glyphs; the legacy Markdown letter/shape fallback drawings and the HTML
  `?` marker (which the Remix glyphs made unreachable) are removed, so the
  font path is the single source of artwork. The Remix subset (62 unique
  glyphs, 8,964 bytes, SHA256 ea113337d0b9b4cb0f645f13a2e1333e0fa86884f057bb30903cc0696b3d708a)
  now also contains those two mode glyphs.

### Changed

- `tools/test-icon-rendering.ps1` follows the restored architecture
  (hot list and pressed copies back), with oracle tables and face checks
  updated to `remixicon` codepoints.

## [0.17.0] - 2026-09-18

### Changed

- **The [H][M] mode switch now uses Remix Icon glyphs**, completing the
  single-source icon design: HTML shows `html5-fill` (U+EE40) and Markdown
  shows `markdown-fill` (U+EF1D), both filled variants for legibility at
  toolbar sizes. The former Segoe UI Bold letter drawing (`DrawMdText`,
  `MD_TEXT_HEIGHT`) is removed — every button on the bar now draws from
  the one bundled subset.
- The bundled subset grows to **61 unique icons** (8,712 → **8,924
  bytes**, new SHA256 recorded in `LICENSE.third-party` and
  `docs/remix-icon.md`); the `modes` array in `tools/remix-icons.json`
  feeds the two switch glyphs into the subset.

## [0.16.0] - 2026-09-18

### Changed

- **The bundled icon font switches from Lucide to Remix Icon for both
  button sets.** The embedded `lucide_subset.ttf` is removed and replaced by
  `remixicon_subset.ttf`, a subset of **Remix Icon 4.9.1** (font family
  "remixicon") covering **59 unique icons in 8,712 bytes**. The Markdown and
  HTML sets draw from this single source; H1–H6 use the Remix `h-1`–`h-6`
  designs. `tools/subset-icon-font.cjs` regenerates the subset from the
  Remix Icon fonts directory against the checked-in `tools/remix-icons.json`
  name lists and refuses to run on other upstream versions.
- `LICENSE.third-party` now carries the Remix Icon License v1.0 verbatim
  (the Lucide/Feather notices are gone — no Lucide code remains).
  `docs/remix-icon.md` replaces `docs/lucide-font.md`.

### Removed

- **All fallback artwork.** The legacy Markdown letter/shape drawings and
  the HTML bold `?` marker are deleted: a slot whose glyph cannot resolve
  (font registration failed or glyph unavailable) now stays **blank**. This
  is an explicit simplification — the font ships inside the DLL. The unused
  `DrawMdHeading` / `DrawMdTextAt` helpers and the `MD_CODE_HEIGHT` /
  `MD_SUBSCRIPT_HEIGHT` constants are removed with them.

### Fixed

- The icon regression suite follows the new design: fallback scenarios
  assert that mapped slots stay **blank** (not nonempty). Markdown icon
  coverage compares against direct Remix Icon drawing (280 pixel-exact
  comparisons at 7 sizes × 2 colors); the actual normal and hot image lists
  for both modes, including the H/M slots and the pressed-state dark copies,
  remain covered at 1,464 comparisons per scenario. Font
  registration/release/reinitialization checks are unchanged.

## [0.15.7] - 2026-09-17

### Changed

- **Tooltip-first dropdown sequencing.** Hovering a dropdown button now
  shows the tooltip first; the menu only opens if the mouse keeps resting
  on the button. The hover delay is the system tooltip initial delay
  (`TTM_GETDELAYTIME`, `TTDT_INITIAL`) plus a 500 ms reading margin
  (1 s fallback), and when the menu opens it retires the tooltip with
  `TTM_POP` so the two popups never overlap. Plain hover keeps working
  normally, so tooltips on dropdown buttons are finally visible.

### Fixed

- **Reverted the 0.15.6 empty-tooltip hack.** Supplying empty text from
  `TTN_GETDISPINFO` was a dirty workaround: the tooltip control can still
  surface an empty tip box, whose box next to the button read as a slight
  icon shift, and tooltips on dropdown buttons remained unusable. The
  handler is back to supplying titles untouched.

## [0.15.6] - 2026-09-17

### Fixed

- **Tooltips stopped appearing for good after 0.15.5.** Deactivating the
  tooltip control for a menu's lifetime left it dormant when the mouse
  never left the button: without a fresh tool-enter event its show timer
  never restarted, so tooltips went silent permanently. The menu now
  stands tooltips down without touching the control state: any visible
  tip is hidden with `TTM_POP` when the menu opens, and while a menu
  tracks the `TTN_GETDISPINFO` handler supplies empty text (an empty tip
  is never displayed). The tooltip's own lifecycle stays untouched, so it
  returns reliably on the first mouse move after the menu closes.

## [0.15.5] - 2026-09-17

### Fixed

- **A hover-opened menu covered the button's tooltip.** Menu and tooltip
  are both topmost popups competing for the same spot below the button;
  the standard Windows practice is for the tooltip to stand down while a
  menu tracks (menu bars and Ribbons behave the same). Before showing a
  dropdown the plug-in now hides the toolbar's tooltip control (`TTM_POP`)
  and deactivates it (`TTM_ACTIVATE`), reactivating it when the menu
  closes, so the tooltip returns on the next mouse move without ever
  overlapping the menu.

## [0.15.4] - 2026-09-17

### Fixed

- **The dropdown button's icon shifted slightly when its menu opened.**
  Holding the button in the pressed state (0.15.3's way of keeping the
  highlight) also makes the toolbar draw pressed icons with the classic
  1 px down-right offset. The hover path no longer presses the button:
  the toolbar control is now subclassed and, while a menu tracks, its
  `WM_MOUSELEAVE` is swallowed, so the hot look simply never fades and the
  icon stays exactly where it was. The click path is untouched.
- **After a couple of open/close cycles hover-open stopped working.** The
  0.15.2-0.15.3 logic was driven by `TBN_HOTITEMCHANGE`, whose exact
  notification sequence around a modal menu proved unreliable. The whole
  mechanism now runs on direct mouse events in the subclass:
  `TB_HITTEST` on `WM_MOUSEMOVE` decides when to arm the hover timer, and
  "the mouse has left the last-served button" — the condition for opening
  its menu again — is tracked from mouse-move hit changes and
  `WM_MOUSELEAVE` themselves, so it cannot get lost.

## [0.15.3] - 2026-09-17

### Fixed

- **The hovered button's highlight faded while its menu stayed open.** A
  hover-opened menu left the button unpressed, so once the menu loop
  captured the mouse the toolbar's hot tracking timed out and the button
  fell back to its normal look. The hover path now holds the button in the
  pressed state (with the 0.15.1 dark-glyph swap) until the menu closes,
  exactly like the click path looks.
- **After dismissing a menu on blank space, hovering never reopened it.**
  `TBN_HOTITEMCHANGE` merges the leaving and entering events of one mouse
  move into a single notification, and the handler returned after the
  leaving half, swallowing every later hover; the same-button suppression
  also relied solely on a leaving event that could be missed. The leaving
  and entering halves are now handled independently, and the suppression
  additionally expires after a double-click time, so recovery can never
  stick. A tracking menu now also ignores hover churn and pending timers,
  preventing re-entrant double menus.

## [0.15.2] - 2026-09-17

### Added

- **Dropdown menus open on hover.** Moving the mouse onto the heading, font
  or form button now shows its menu after the system menu delay
  (`SPI_GETMENUSHOWDELAY`), like a menu bar — no click and no pressed-state
  repaint needed. Moving onto a plain button cancels a pending hover-open;
  keyboard hot-item navigation never auto-opens. A button whose menu just
  closed stays quiet until the mouse leaves it, so dismissing a menu does
  not instantly reopen it. Clicking a dropdown button still works: that
  path keeps the 0.15.1 pressed-state dark-glyph swap. The three dropdown
  handlers were factored into one `ShowDropdownMenu` used by both paths.

## [0.15.1] - 2026-09-17

### Fixed

- **The Font ("T") button's hover inversion was broken on dark bands.** The
  font button used the split `BTNS_DROPDOWN` style: hovering its small arrow
  region triggered pressed-state drawing, which always renders from the
  normal image list — light glyphs on the light hover fill — so the icon
  appeared not to invert while every other button did. The font button is
  now a whole-button dropdown (like the heading and form buttons); its menu
  still contains the `Font...` entry that opens the font dialog.
- **Dropdown buttons kept the wrong color while their menu was open.** A
  pressed button always draws from the normal image list, so on a dark band
  the pressed form/heading/font button showed light glyphs on the light
  pressed fill. The normal list now carries dark copies of every image
  (mirroring the hot list), and while a dropdown menu tracks, just that
  button is pointed at its dark copy via `TB_SETBUTTONINFO`, then restored
  when the menu closes. Other buttons keep their normal glyphs; on a light
  bar nothing changes (dark glyphs are readable on the pressed fill). The
  icon picker in the Customize dialog enumerates the light icons only, so
  saved icon slots are unaffected.

## [0.15.0] - 2026-09-17

### Changed

- **The HTML toolbar's legacy colored BMP icons are replaced with the same
  bundled Lucide design as the Markdown set.** All 48 persisted HTML slots
  (the 25 default buttons plus the 23 customization-only commands such as
  form controls and media glyphs) now draw runtime monochrome Lucide icons
  through the same shared glyph path, so both modes share one stroke
  language, follow the bar background luminance / Very Dark mode, and stay
  crisp at any DPI. Stored icon slots, saved customizations and command
  behavior are unchanged — only the artwork differs.
- The bundled font subset grows from 20 to **58 unique Lucide icons**
  (7,780 → **21,564 bytes**) to cover the HTML set. The subset is now
  reproducible: `tools/subset-lucide.cjs` regenerates it from the
  `lucide-static` font directory against the checked-in
  `tools/lucide-icons.json` name list, and refuses to run against an
  unexpected upstream font version. `LICENSE.third-party` and
  `docs/lucide-font.md` record the new artifact (including SHA256).
- **Hover recoloring now covers the HTML mode too.** Because both sets are
  monochrome, the hot image list rebuilds every HTML button with dark glyphs
  on the light hover fill (previously the colored BMPs were duplicated
  unchanged). The plug-in entry icon in the Plug-ins list keeps its bitmap.
- If an HTML slot's glyph is unavailable (font registration failed), the
  button draws a bold `?` marker instead of a wrong icon; Markdown keeps its
  legacy letter/shape fallback. The 0.14-era diagnostic that disabled all
  Markdown fallbacks was reverted before this release.

## [0.14.0] - 2026-09-17

### Changed

- Replace the current Segoe icon-font mapping with a bundled Lucide subset
  from `lucide-static` 1.47.0 for all 20 Markdown command icons (indices
  0–19), including H1–H6, the code block, numbered list and horizontal rule.
  The complete names/codepoints are listed in the READMEs and
  `docs/lucide-font.md`.
- Embed the 7,780-byte `lucide_subset.ttf` as an RCDATA resource and load it
  directly into process-private memory with `AddFontMemResourceEx`: no system
  font installation, no temporary font files and no installed Segoe icon-font
  dependency. Legacy letter/shape rendering remains the font-load fallback.
- Keep normal/large icon canvases at 16/24 px at 96 DPI, scaled with display
  DPI, without extra enlargement. H/M remains Segoe UI Bold at 14/21 px at
  96 DPI; the HTML toolbar's legacy colored BMP assets are unchanged.
- Retain `docs/glyph-reference.html` only as a historical Segoe reference;
  its highlighted mappings no longer describe the current toolbar.
- Clarify build/deployment separation: `tools/build-loc-2052.ps1` now lives
  inside the repository and builds only. Deployment to sibling `../dist/` is
  manual and includes the main DLL, both `1033`/`2052` satellites and
  `LICENSE.third-party` alongside the main DLL.

### Added

- `LICENSE.third-party` preserves the complete verbatim local upstream
  license: the 2026 Lucide ISC license, the Feather-derived icon list and
  Cole Bemis MIT attribution/license. `docs/lucide-font.md` records package
  provenance, subset names/mapping, byte size and SHA256; it does not claim
  that a reproducible subset-generation script is included.
- `tools/test-icon-rendering.ps1` now covers all 20 Lucide icons across
  multiple sizes and colors (280 pixel-exact comparisons against direct
  Lucide drawing), plus simulated unavailable-font and missing-glyph
  fallback subprocesses, and font registration/release/reinitialization
  checks. This is offscreen coverage, not an EmEditor UI verification.

### Fixed

- The per-icon Lucide path validates the resolved face name and glyph index
  before each draw, falling back to the letter/shape drawings when either
  fails. A failed font registration is not cached and is retried. The
  registration is released on the plug-in's normal `EVENT_CLOSE` shutdown
  (never in `DllMain`), and re-registered lazily if icons are drawn again.

## [0.13.4] - 2026-09-17

### Changed

- Runtime-drawn Markdown icons no longer apply the 135% enlargement. At
  96 DPI they render at the icon canvas size: 16 px normal, 24 px large,
  scaled with display DPI. Text buttons use Segoe UI Bold at fixed pixel
  heights referenced to a 16-pixel canvas: H/M letters 14/21 px (normal/
  large), heading digits 8/12 px in the lower right of the H, code-block
  text 12/18 px. Heading buttons draw H and the digit separately and center
  the combined ink bounds; they no longer use one uniform font for "H1".

### Fixed

- Initialize the Markdown icon font selector to its actual "none" state so
  font probing runs. Previously its initial value was -1 while the probe loop
  required 0, so all mapped icons used legacy drawing, including Link (E71B).
  Earlier claims that the toolbar was already rendering these font mappings
  were incorrect. The codepoint mappings themselves are unchanged.
- Add `tools/test-icon-rendering.ps1`: compile the drawing methods extracted
  from RichBar.h and compare Link pixels with Fluent E71B and the legacy
  fallback at 16/24/32 pixels in both foreground colors. This is an offscreen
  regression test, not an EmEditor UI test.

## [0.13.3] - 2026-09-17

### Added

- **Interactive glyph reference**: `docs/glyph-reference.html` — every glyph
  both system icon fonts expose (2033 Fluent / 1833 MDL2, discovered via GDI
  probing — more than the official pages document), rendered live from the
  installed fonts with Light/Dark scheme and font toggles, filtering, and
  blue borders on the glyphs RichBar maps. Regenerate with
  `tools/generate-glyph-reference.ps1`.

### Fixed

- **The Table button now draws a real grid** (U+F232 GridViewSmall from
  Segoe Fluent Icons) instead of a CircleRing. Found by enumerating the
  fonts locally — parsing the cmap tables of SegoeIcons.ttf (1213 mapped
  codepoints) and SegMDL2.ttf (1103) revealed the full glyph set including
  undocumented entries; EA3A is officially CircleRing (not Table) and EA1C
  does not exist. U+F232 is absent from Windows 10's MDL2 Assets, where the
  button automatically falls back to the shape-drawn grid.

## [0.13.2] - 2026-09-17

### Fixed

- **Wrong glyph mappings found by auditing the official Fluent/MDL2 glyph
  tables.** `EA3A` is `CircleRing`, not a table (the Table button drew a
  ring), and `EA1C` does not exist in either font. The Table and Numbered
  list buttons now always use their original shape drawings (grid / digits);
  the remaining ten font glyphs were verified against the official
  Microsoft Learn glyph tables, and the READMEs gained a full icon
  reference table (with per-font preview images) plus an English/Chinese
  language pair (README.md / README.zh.md).

## [0.13.1] - 2026-09-17

### Changed

- **Glyph size knob raised from 115% to 135%** — the letter-based icons
  (H1–H6, B/I/S, the `[H][M]` switch) still read too small next to the
  official toolbar.

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
