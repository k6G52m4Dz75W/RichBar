// changelog entries for 0.54.0 (both languages)
const fs = require( 'fs' );
const en = [
	'## [0.54.0] - 2026-10-01',
	'',
	'### Changed',
	'',
	'- **Proportional live scroll sync**: the preview follows the editor to',
	'  the same FRACTION of its scrollable range — the editor ratio is',
	'  \`scrollY / (totalLines − visibleLines)\` (all three queried from the',
	'  view), and the preview is driven to \`ratio × previewMax\` with the',
	'  native \`WebBar.scrollTo\`. The preview scrollable height is probed',
	'  once per render inside the same macro (probe + reposition, no',
	'  flicker), so it adapts to any docking side and pane size. The',
	'  previous line-delta approximation (which drifted) is removed.',
	'',
].join( '\n' );
const zh = [
	'## [0.54.0] - 2026-10-01',
	'',
	'### 变更',
	'',
	'- **实时滚动同步改为比例式**：预览跟随编辑器滚动到**总可滚范围的同',
	'  一百分比**——编辑器比例 = \`滚动行 / (总行数 − 可视行数)\`（三者均',
	'  从视图查询），预览被驱动到 \`比例 × 预览最大可滚像素\`，使用原生',
	'  \`WebBar.scrollTo\`。预览的可滚高度在每次渲染后随同一宏探测一次',
	'  （探测+定位一体、无闪烁），因此自适应任意停靠方向与窗格尺寸。',
	'  旧的行差近似（会漂移）已移除。',
	'',
].join( '\n' );
for( const [ p, entry ] of [
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.md', en ],
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.zh.md', zh ],
] ){
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '## [0.54.0]' ) ){ console.log( 'already:', p ); continue; }
	const lines = s.split( '\n' );
	const i = lines.findIndex( l => l.startsWith( '## [0.53.0]' ) );
	if( i < 0 ){ console.log( 'MISS:', p ); continue; }
	lines.splice( i, 0, entry );
	fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
	console.log( 'inserted:', p );
}

// memory
const mp = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let m = fs.readFileSync( mp, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = m.indexOf( anchor );
if( i < 0 ){ console.log( 'MEM ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.54.0 (2026-10-01, built OK — dist deploy pending user exit):** PROPORTIONAL scroll sync (user: sync progress mismatched — panes have different sizes, line-delta drifted). Model: BOTH sides to the same fraction of their scrollable range. Editor ratio = EE_GET_SCROLL_POS y / (EE_GET_LINES − EE_GET_PAGE_SIZE.cy) all on m_hwndView (EE_GET_PAGE_SIZE = EE_FIRST+8, SIZE_PTR cx=cols cy=visible lines — in the vendored plugin.h). Preview max probed ONCE per render via native macro `WebBar.scrollTo(0, 99999999); var m = WebBar.scrollY; WebBar.scrollTo(0, Math.round(ratio*m)); return m;` — hstrResult (proven) returns the probed max; probe+reposition in ONE macro (no bottom-flicker). Poll: target = ratio*max, skip if |target − last| < 4px, macro `WebBar.scrollTo(0, target)`. m_nPreviewMaxPx reset to 0 in StartScrollerPoll (re-probe after every open/render). SetPreviewLinePx/m_nPreviewLinePx/m_nLastEditorY removed. C++ GOTCHA: `L"..." + szProbe` = pointer+pointer C2110 — use std::wstring(L"...") + szProbe. NOTE: 0.52.0 reverted 0.51.2 m_hwndView? NO — rebase auto-merge KEPT m_hwndView in 0.52.0 (user reported pressed-state break on 0.51.2; if it recurs, revert queries to m_hWnd).',
	'',
].join( '\n' );
m = m.slice( 0, i ) + entry + m.slice( i );
fs.writeFileSync( mp, m, 'utf8' );
console.log( 'memory updated' );
