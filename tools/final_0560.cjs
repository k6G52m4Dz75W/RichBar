// changelog + memory for 0.56.0
const fs = require( 'fs' );
for( const [ p, entry ] of [
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.md', [
		'## [0.56.0] - 2026-10-01',
		'',
		'### Fixed',
		'',
		'- **The scroll probe read a non-existent property** and **jumped the',
		'  preview to the bottom without ever reading the height back**: the',
		'  property is `WebBar.ScrollY` (capital S — the docs navigation had',
		'  it right; the probe used `scrollY`, so `m` was undefined and the',
		'  final reposition was a no-op, leaving the preview stuck at the',
		'  bottom of the jump). With `ScrollY`, the probe macro measures the',
		'  real scrollable height, positions the preview at the editor ratio',
		'  and returns the max as a string. Probing is disabled for the whole',
		'  session after 9 total failures (3 per render), degrading to the',
		'  relative-delta fallback.',
		'',
	].join( '\n' ) ],
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.zh.md', [
		'## [0.56.0] - 2026-10-01',
		'',
		'### 修复',
		'',
		'- **滚动探测读取了不存在的属性**且**把预览直接跳到底部却读不回高',
		'  度**：属性名是 `WebBar.ScrollY`（大写 S——官方文档导航是对的，探',
		'  测用了小写 `scrollY`，导致 `m` 为 undefined、最终定位变成空操作，',
		'  预览卡在跳转后的底部）。修正后探测宏测量真实可滚高度、按编辑器',
		'  比例定位并以字符串返回最大值。整个会话累计 9 次探测失败（每次',
		'  渲染 3 次）后永久禁用探测，退化为行差模式。',
		'',
	].join( '\n' ) ],
] ){
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '## [0.56.0]' ) ){ console.log( 'already:', p ); continue; }
	const lines = s.split( '\n' );
	const i = lines.findIndex( l => l.startsWith( '## [0.53.1]' ) );
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
	'**0.56.0 (2026-10-01, DEPLOYED + pushed — user test pending):** 0.55.0 probe post-mortem from the log: probe 1 = hr 0x2000000B (cold start), probes 2-3 = hr S_OK but hstrResult NULL — and the USER SAW the preview jump to the bottom: the macro RAN (scrollTo 99999999 executed), but `WebBar.scrollY` (lowercase) is NOT a property → m = undefined → Math.round(ratio*undefined) = NaN → reposition no-op → preview stuck at bottom = the "content displaced" report. FIX: property is **WebBar.ScrollY** (capital S — per the docs navigation; macros properties are capitalized: ScrollX/ScrollY). Probe macro: `WebBar.scrollTo(0, 99999999); var m = WebBar.ScrollY; WebBar.scrollTo(0, Math.round(ratio*m)); return String(m);`. Plus a session-wide probe disable: static counter, >= 9 total failures → m_nProbeFails forced to 3 every render (delta fallback forever). ALSO CONFIRMED FROM LOG: **EE_RUN_MACRO hstrResult NEVER fills from in-memory macros** — document.Text with hr=S_OK still had hstrResult NULL (16:28:38 "failed hr=0x00000000") — the whole document.Text fast-path is dead weight; the clipboard fallback always runs. If a future EmEditor build fixes string returns, document.Text + probe-max-read both revive.',
	'',
].join( '\n' );
m = m.slice( 0, i ) + entry + m.slice( i );
fs.writeFileSync( mp, m, 'utf8' );
console.log( 'memory updated' );
