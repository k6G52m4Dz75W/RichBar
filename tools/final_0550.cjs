// changelog entries for 0.55.0
const fs = require( 'fs' );
const en = [
	'## [0.55.0] - 2026-10-01',
	'',
	'### Changed',
	'',
	'- **Proportional scroll sync, attempt 2 (deadlock cured)**: the',
	'  preview-height probe macro now returns `String(m)` — the 0.54.0',
	'  probe returned a bare number which never populated the macro result',
	'  handle, and because the actual scroll was gated behind the probe the',
	'  preview froze completely. The probe is also limited to 3 attempts',
	'  per render; after that the poll degrades to the proven',
	'  relative-delta mode, so scrolling can never freeze again. When the',
	'  probe succeeds the preview follows the editor to the same fraction',
	'  of its scrollable range (adapts to pane size and docking side).',
	'',
].join( '\n' );
const zh = [
	'## [0.55.0] - 2026-10-01',
	'',
	'### 变更',
	'',
	'- **比例滚动同步第二次实现（治愈死锁）**：预览高度探测宏改为',
	'  返回 `String(m)`——0.54.0 的探测返回裸数字，宏结果句柄永远不被',
	'  填充，而实际滚动又被门控在探测之后，预览因此完全冻结。探测限制',
	'  为每次渲染最多 3 次；超过后轮询自动退化为久经验证的行差模式，滚',
	'  动不再可能冻结。探测成功时，预览跟随编辑器滚动到可滚范围的同一',
	'  百分比（自适应窗格尺寸与停靠方向）。',
	'',
].join( '\n' );
for( const [ p, entry ] of [
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.md', en ],
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.zh.md', zh ],
] ){
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '## [0.55.0]' ) ){ console.log( 'already:', p ); continue; }
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
	'**0.55.0 (2026-10-01, DEPLOYED + pushed — user test pending):** proportional sync attempt 2, 0.54.0 deadlock cured per the documented fix requirements: probe macro ends `return String(m);` (string fills hstrResult), probe limited to m_nProbeFails < 3 per render (reset in StartScrollerPoll), after 3 failures the poll degrades to the 0.53.1 relative-delta fallback (nDelta * m_nPreviewLinePx via scrollBy) — freeze impossible. Probe macro: `WebBar.scrollTo(0,99999999); var m=WebBar.scrollY; WebBar.scrollTo(0, Math.round(ratio*m)); return String(m);` — probe+position+string-return in one macro. After a successful probe m_nLastSentTargetPx is seeded (the macro already positioned). Poll then sends `WebBar.scrollTo(0, target)` when |target-last| >= 1. Ratios: editor = scrollY/(GetLines - PAGE_SIZE.cy) on m_hwndView.',
	'',
].join( '\n' );
m = m.slice( 0, i ) + entry + m.slice( i );
fs.writeFileSync( mp, m, 'utf8' );
console.log( 'memory updated' );
