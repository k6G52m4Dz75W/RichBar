# Bundled Lucide font

Applies to **RichBar 0.14.0 — 2026-09-17**.

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
- Bundled size: **7,780 bytes**.
- Bundled font SHA256:

  ```text
  f6ac3f5e1d41ee8f816824f21e737f177dd713ec4deb234f032fb888ee2e11f5
  ```

This records the supplied artifact and its provenance, not a reproducible
build recipe. No reproducible subset-generation script is included or claimed
here. The local source paths above are provenance records, not build-time
requirements for users of this repository. Replacing the font requires
rechecking its mapping, size, hash, rendering and accompanying license.

To verify the bundled artifact from the repository root in PowerShell:

```powershell
(Get-Item .\lucide_subset.ttf).Length
Get-FileHash .\lucide_subset.ttf -Algorithm SHA256
```

## Complete subset names and mapping

The following 20 entries match `c_aIconGlyphs` in
[`RichBar.h`](../RichBar.h), in Markdown image-list index order. These PUA
codepoints belong to the Lucide font, not the historical Segoe icon fonts.

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

Normal/large Markdown icons use **16/24 px canvases at 96 DPI**, scaled with
display DPI (24/36 px at 150%), without the former 135% enlargement. The
existing light/dark foreground colors and dark-band hot image list continue
to apply.

The **H/M mode switch remains Segoe UI Bold at 14/21 px at 96 DPI**, scaled
with the canvas. These are pixel character heights, not points. H/M occupies
indices 20/21 and is not part of this 20-icon subset. Headings H1–H6 and the
code block now use Lucide normally, rather than separately drawn text.
Legacy letter/shape drawing remains available when font loading fails.
The **HTML toolbar's legacy colored BMP assets remain unchanged**, as does
EmEditor's toolbar title.

## Validation scope

`tools/test-icon-rendering.ps1` covers all 20 icons at seven sizes and two
foreground colors: 280 pixel-exact comparisons against direct Lucide drawing.
The tests also cover H/M rendering, simulated unavailable-font and missing-glyph
fallback, shared registration, release and lazy reinitialization. All three
subprocess scenarios passed for this release. These are offscreen regression
checks; in-editor visual verification remains separate.

[`glyph-reference.html`](glyph-reference.html) is retained **only as a
historical Segoe reference**. Its highlighted mappings describe older
releases, not the current Lucide mapping or font coverage.

## License and distribution

[`LICENSE.third-party`](../LICENSE.third-party) has a short provenance header
followed by the **complete verbatim** contents of the local package's
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
