// 0.65.9 changelog entries (EN + zh), content-anchored, hard-fail if missing.
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar/';

const en = `## [0.65.9] - 2026-10-25

### Fixed
- **Preview snapped back to the top when the editor reached the bottom** — the
  bottom endpoint was sent as a raw line number while the page decodes
  \`#L<n>\` hashes as \`line*1000 + permille\`; a raw N+1 decoded to line 0.
  The endpoint now carries the same encoding (\`(N+1)*1000\`).
- Removed the legacy \`__rbRestore\` ratio restore (0.58-era): its timers
  re-fired 100/400 ms after load and overrode the hash positioning, and its
  ratio mixed display rows with logical lines.
- The scrollmap now skips non-monotonic \`data-source-line\` anchors so the
  binary search stays valid.
- The first poll always sends the live position after the preview opens.
- Verified against a real 200-line CJK novel: 183 anchors (0→198), editor
  mid-range maps to the matching preview position (L100 → ~46%), ends clamp
  correctly.

`;
const zh = `## [0.65.9] - 2026-10-25

### 修复
- **编辑器滚到底时预览跳回页首**：底端发送的是原始行号，而页面把 \`#L<n>\`
  哈希按 \`行号*1000+千分比\` 解码，N+1 被解成第 0 行。端点现在使用同样的编码。
- 移除 0.58 时代的 \`__rbRestore\` 比例复位：其定时器会在页面载入后 100/400ms
  覆盖哈希定位，且比例混用了显示行与逻辑行。
- 滚动映射跳过非单调的锚点，保证二分查找有效。
- 预览打开后首次轮询必定发送当前实际位置。
- 已用真实 200 行中文小说验证：183 个锚点（0→198），中段映射正确，端点正确。

`;

function patch( file, anchor, insert ) {
	const p = ROOT + file;
	const t = fs.readFileSync( p, 'utf8' );
	if ( !t.includes( anchor ) ) { console.error( 'ANCHOR MISSING in ' + file ); process.exit( 1 ); }
	if ( t.includes( '[0.65.9]' ) ) { console.log( file + ': already patched' ); return; }
	fs.writeFileSync( p, t.replace( anchor, insert + anchor ), 'utf8' );
	console.log( file + ': 0.65.9 added' );
}

patch( 'CHANGELOG.md', '## [0.55.0] - 2026-10-01', en );
const zhHead = fs.readFileSync( ROOT + 'CHANGELOG.zh.md', 'utf8' ).match( /^##\s+\[[^\]]+\]/m );
if ( !zhHead ) { console.error( 'zh: no section head found' ); process.exit( 1 ); }
patch( 'CHANGELOG.zh.md', zhHead[0], zh );
