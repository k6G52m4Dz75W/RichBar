// 0.65.12 changelog entries (EN + zh), file-based per the escaping rule.
const fs = require( 'fs' );

const en = `## [0.65.12] - 2026-10-25

### Fixed
- **One visible extra refresh still remained right after the preview
  loaded**: the poll's catch-up send raced the staged open retry (log:
  a fragment send against the first, failed attempt's URL, then the retry's
  own navigation). The pane now opens DIRECTLY at the editor's position —
  the open URL carries the current \`#L<line*1000+permille>\` fragment, the
  page positions itself before first paint (no post-load jump), and the
  poll is seeded with the same value so its first tick sends nothing.
  Opening a preview is now exactly one navigation.

`;
const zh = `## [0.65.12] - 2026-10-25

### 修复
- **预览载入完成后仍有一次可见的额外刷新**：轮询的补位发送与打开重试在赛跑
  （日志：对着第一次失败尝试的 URL 发了一次片段导航，随后重试又导航一次）。
  现在打开 URL 直接携带当前 \`#L<行号*1000+千分比>\` 片段——页面在首帧前完成
  定位（无载入后跳移），轮询种子也设为同一值、首个 tick 无事可发。
  打开预览现在只有一次导航。

`;

function patch( file, anchor, insert ) {
	const t = fs.readFileSync( file, 'utf8' );
	if ( !t.includes( anchor ) ) { console.error( 'ANCHOR MISSING in ' + file ); process.exit( 1 ); }
	if ( t.includes( '[0.65.12]' ) ) { console.log( file + ': already patched' ); return; }
	fs.writeFileSync( file, t.replace( anchor, insert + anchor ), 'utf8' );
	console.log( file + ': 0.65.12 added' );
}
patch( 'CHANGELOG.md', '## [0.65.11] - 2026-10-25', en );
patch( 'CHANGELOG.zh.md', '## [0.65.11] - 2026-10-25', zh );
