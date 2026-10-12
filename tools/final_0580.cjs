// changelog entries for 0.58.0
const fs = require( 'fs' );
for( const [ p, entry ] of [
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.md', [
		'## [0.58.0] - 2026-10-01',
		'',
		'### Changed',
		'',
		'- **Scroll sync endpoints are now exact**: when the editor reaches',
		'  its very top or bottom, the preview is pinned to its own top/',
		'  bottom with a single clamped `WebBar.scrollBy` (the only scroll',
		'  primitive confirmed working in the pane). The middle still tracks',
		'  by line delta.',
		'- User-confirmed via diagnostics: `scrollBy` units are pixels, and',
		'  `WebBar.scrollTo` must not be used from macros (a failing scrollTo',
		'  makes EmEditor open the macro source as a document tab).',
		'',
	].join( '\n' ) ],
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.zh.md', [
		'## [0.58.0] - 2026-10-01',
		'',
		'### 变更',
		'',
		'- **滚动同步端点精确化**：编辑器到达最顶/最底时，用一次钳位',
		'  `WebBar.scrollBy`（面板内唯一确认有效的滚动原语）把预览钉到对应',
		'  端点。中段仍按行差跟随。',
		'- 经用户诊断确认：`scrollBy` 的单位是像素；宏中不得使用',
		'  `WebBar.scrollTo`（scrollTo 失败会让 EmEditor 把宏源码作为文档',
		'  标签打开）。',
		'',
	].join( '\n' ) ],
] ){
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '## [0.58.0]' ) ){ console.log( 'already:', p ); continue; }
	const lines = s.split( '\n' );
	const i = lines.findIndex( l => l.startsWith( '## [0.56.1]' ) );
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
	'**0.58.0 (2026-10-01, DEPLOYED + pushed — user test pending):** USER RAN THE DIAGNOSTICS — decisive data: (1) `WebBar.scrollBy(0,50)` VISIBLY moves the preview a little → units = PIXELS, scrollBy WORKS; (2) `WebBar.scrollTo(0,50)` made EmEditor open the macro SOURCE as a document tab ("content flushed with macro text" scare — the real doc is intact in another tab / Ctrl+Z) → **NEVER use WebBar.scrollTo from macros**; (3) diag3: scrollTo(0,300)/scrollTo(300,0) → ScrollY/scrollX read 0,0 (readback useless or no-op); (4) ScrollY/scrollY both READ (return 0 at top — plausibly genuine). 0.58.0 = 0.53.1 delta sync + END ANCHORS: editor y >= scrollable (GetLines − PAGE_SIZE.cy on m_hwndView) → scrollBy(0,+99999999) pins preview bottom; y <= 0 → scrollBy(0,−99999999); middle = relative delta (drift compressed, both ends exact). The 50%-at-bottom drift = preview rendered px per source line ≈ 2x our linePx estimate (wrapping at pane width) — end anchors hide it at the endpoints.',
	'',
].join( '\n' );
m = m.slice( 0, i ) + entry + m.slice( i );
fs.writeFileSync( mp, m, 'utf8' );
console.log( 'memory updated' );
