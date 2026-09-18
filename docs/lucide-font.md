# Bundled Lucide font

Applies to **RichBar 0.15.0 — 2026-09-17**.

## Provenance and artifact identity

- Upstream: [Lucide](https://lucide.dev),
  [lucide-icons/lucide](https://github.com/lucide-icons/lucide).
- Local source package: **`lucide-static` 1.47.0**, verified from
  `E:\Projects\RichBar\mock_a\node_modules\lucide-static\package.json`.
  The package supplies `font/lucide.ttf` and its icon-name/codepoint metadata.
- The prepared local subset was supplied as
  `E:\Projects\RichBar\mock_a\lucide_subset.ttf`, with the selected names
  recorded in `E:\Projects\RichBar\mock_a\lucide_subset_names.txt`.
  The bundled repository artifact is [`../lucide_subset.ttf`](../lucide_subset.ttf).
- Bundled size: **21,564 bytes**.
- Bundled font SHA256:

  ```text
  9c353554868b67563ed906dc24cdf089f7ce62687da63cfdf1a406ebb4b6d32b
  ```

The subset is reproducible from this repository:
[`tools/subset-lucide.cjs`](../tools/subset-lucide.cjs) regenerates
`lucide_subset.ttf` from the `lucide-static` font directory and
[`tools/lucide-icons.json`](../tools/lucide-icons.json), which records the
exact names whose codepoints enter the subset. It validates the full
`lucide.ttf` SHA256 before subsetting, so the run fails loudly if the upstream
font changes. Regenerate with:

```text
node tools/subset-lucide.cjs <lucide-static font directory>
```

Run it with `subset-font` resolvable (a local `node_modules` with
`subset-font` on the `NODE_PATH`, or installed next to the tools directory);
the exact `subset-font` version does not need to match — the 2.7.0 version
used for the current artifact is recorded in the local
`node_modules/subset-font/package.json`. Replacing the font requires
rechecking its mapping, size, hash, rendering and accompanying license.

To verify the bundled artifact from the repository root in PowerShell:

```powershell
(Get-Item .\lucide_subset.ttf).Length
Get-FileHash .\lucide_subset.ttf -Algorithm SHA256
```

## Complete subset names and mapping

[`tools/lucide-icons.json`](../tools/lucide-icons.json) is the authoritative
name list, and its order is the mapping order below. All **48 HTML toolbar
slots** (indices 0–47, including customization-only commands) and all
**20 Markdown image-list slots** draw from the same bundled subset — **58
unique Lucide names** in total — through the shared `DrawLucideGlyph` path in
[`RichBar.h`](../RichBar.h). These PUA codepoints belong to the Lucide font,
not the historical Segoe icon fonts.

### HTML toolbar slots (0–47)

In persisted-slot order, matching the `glyphs` table in `RichBar.h` and the
`html` array in `tools/lucide-icons.json`:

| Slot | HTML command | Subset name | Codepoint |
|---|---|---|---|
| 0 | Heading | `heading` | U+E384 |
| 1 | Paragraph | `pilcrow` | U+E3A3 |
| 2 | Line break | `corner-down-left` | U+E0A1 |
| 3 | Bold | `bold` | U+E05D |
| 4 | Italic | `italic` | U+E0FB |
| 5 | Underline | `underline` | U+E19A |
| 6 | Font | `type` | U+E198 |
| 7 | Color | `palette` | U+E1DD |
| 8 | Image | `image` | U+E0F6 |
| 9 | Link | `link` | U+E102 |
| 10 | Table | `table` | U+E17D |
| 11 | Rule | `minus` | U+E11C |
| 12 | Comment | `message-square-code` | U+E56C |
| 13 | Align left | `text-align-start` | U+E185 |
| 14 | Align center | `text-align-center` | U+E182 |
| 15 | Align right | `text-align-end` | U+E183 |
| 16 | Align justify | `text-align-justify` | U+E184 |
| 17 | Ordered list | `list-ordered` | U+E1D1 |
| 18 | List | `list` | U+E106 |
| 19 | Unindent | `list-indent-decrease` | U+E107 |
| 20 | Quote | `quote` | U+E239 |
| 21 | Highlight | `highlighter` | U+E0F4 |
| 22 | Font color | `baseline` | U+E285 |
| 23 | Form | `panels-top-left` | U+E12C |
| 24 | Customize | `settings` | U+E154 |
| 25 | Form element | `clipboard-list` | U+E086 |
| 26 | Text | `text-cursor-input` | U+E265 |
| 27 | Password | `key-round` | U+E4A3 |
| 28 | Textarea | `text-select` | U+E6EA |
| 29 | Checkbox | `square-check` | U+E559 |
| 30 | Radio | `circle-dot` | U+E345 |
| 31 | Group | `group` | U+E464 |
| 32 | Select | `panel-top-open` | U+E438 |
| 33 | Listbox | `list-collapse` | U+E59B |
| 34 | Buttons | `rectangle-ellipsis` | U+E21F |
| 35 | Hidden | `square-mouse-pointer` | U+E202 |
| 36 | Object | `eye-off` | U+E0BB |
| 37 | Camera | `box` | U+E061 |
| 38 | Disc | `camera` | U+E064 |
| 39 | Scanner | `disc` | U+E0AF |
| 40 | Printer | `scan-line` | U+E258 |
| 41 | Function | `printer` | U+E141 |
| 42 | Error | `square-function` | U+E22D |
| 43 | Warning | `circle-x` | U+E084 |
| 44 | Info | `triangle-alert` | U+E193 |
| 45 | Flag | `info` | U+E0F9 |
| 46 | Sound | `flag` | U+E0D1 |
| 47 | (slot 47) | `volume-2` | U+E1AB |

### Markdown image-list slots (0–19)

The following 20 entries match `c_aIconGlyphs` in
[`RichBar.h`](../RichBar.h), in Markdown image-list index order:

| Icon index | Toolbar command | Subset name | Codepoint |
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

## Runtime use and unchanged assets

`RichBar.rc` embeds the subset as `IDR_LUCIDE_FONT`, an `RCDATA` resource in
the main DLL. `RichBar.h` loads the resource directly with
`AddFontMemResourceEx`, making the font private to the process. **No system
font installation, temporary font file, or loose TTF deployment is needed.**
The renderer selects the `Lucide` family explicitly and validates the resolved
face and glyph index before drawing; installed Segoe Fluent Icons / Segoe MDL2
Assets are not prerequisites. Failed registration is retried on a later draw.
The shared registration is released on normal plug-in `EVENT_CLOSE`, after
frame teardown, not on individual frame closure or inside `DllMain`. A later
draw registers the font again lazily.

Normal/large icon canvases are **16/24 px at 96 DPI**, scaled with display DPI
(24/36 px at 150%), without extra enlargement. The theme/dark/light/hot logic
is unchanged: background luminance and Very Dark mode select dark or light
foregrounds, a hot image list keeps hovered buttons readable in dark-band
modes, and theme or configuration changes re-render automatically. Both the
normal and hot image lists are built by the same shared
`BuildToolbarImageList` path used for Markdown.

The **H/M mode switch remains Segoe UI Bold at 14/21 px at 96 DPI**, scaled
with the canvas. These are pixel character heights, not points. H/M occupies
indices 20/21 of the Markdown image list and is not part of the Lucide
subset. Headings H1–H6 and the code block use Lucide normally, rather than
separately drawn text. Legacy letter/shape drawing remains the fallback for
Markdown when font loading fails.

The **HTML toolbar's legacy colored BMP assets are no longer loaded**; the
resources remain in the DLL, but every HTML slot draws Lucide at runtime. An
HTML draw falls back to a bold `?` marker when the bundled font cannot be
used for that slot. As before, EmEditor's toolbar title is unchanged.

## Validation scope

`tools/test-icon-rendering.ps1` covers all 20 Markdown icons at seven sizes
and two foreground colors (280 pixel-exact comparisons against direct Lucide
drawing), all 48 HTML slot glyphs, the actual normal and hot image lists for
both modes (50 images per HTML list, 22 per Markdown list, each including the
two H/M switches; 1,464 pixel comparisons per scenario across three sizes,
two colors and an HTML→Markdown→HTML rebuild), simulated unavailable-font and
missing-glyph fallback, and shared registration, release and lazy
reinitialization. These are offscreen regression checks; in-editor visual
verification remains separate.

[`glyph-reference.html`](glyph-reference.html) is retained **only as a
historical Segoe reference**. Its highlighted mappings describe older
releases, not the current Lucide mapping or font coverage.

## License and distribution

[`LICENSE.third-party`](../LICENSE.third-party) has a provenance header —
updated for the current 58-name subset — followed by the **complete verbatim**
contents of the local package's
`E:\Projects\RichBar\mock_a\node_modules\lucide-static\LICENSE`:

- ISC License, Copyright (c) **2026 Lucide Icons and Contributors**.
- The complete list of Lucide icons derived from Feather.
- The MIT License for those icons, Copyright (c) **2013-present Cole Bemis**,
  including all permission, condition and warranty/liability text.

The upstream license is not reduced to the package's `ISC` metadata field
or trimmed to just the selected icons. RichBar's own
[`LICENSE`](../LICENSE) remains separate and unchanged.

Deployment is manual to sibling `../dist/`: distribute `RichBar.dll`,
`mui/1033/RichBar_loc.dll`, `mui/2052/RichBar_loc.dll`, and
`LICENSE.third-party` alongside the main DLL. The repository-local
`tools/build-loc-2052.ps1` is a build-only script, not a
deployment step. See the [README](../README.md#build--install).
