// insert the 0.53.0 changelog sections + record memory
const fs = require( 'fs' );

// changelogs
for( const [ p, entry ] of [
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.md', [
		'## [0.53.0] - 2026-10-01',
		'',
		'### Changed',
		'',
		'- **Live scroll sync rewritten on the native WebBar.scrollBy**',
		'  (v26.3+): the 300 ms poll now compares the editor scroll line',
		'  (EE_GET_SCROLL_POS on the view) with the previous poll and drives',
		'  the preview with \`WebBar.scrollBy(0, deltaLines × lineHeightPx)\`',
		'  directly — no intermediate file, no page-side polling, no browser',
		'  cache in the loop. The file-based channel (\`RichBarSync.js\`) and',
		'  the page-side poller were removed. The initial position after each',
		'  render still comes from the inline scroll-ratio injection.',
		'',
	].join( '\n' ) ],
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.zh.md', [
		'## [0.53.0] - 2026-10-01',
		'',
		'### 变更',
		'',
		'- **实时滚动同步改用原生 WebBar.scrollBy 重写**（v26.3+）：300 毫秒',
		'  轮询比较编辑器滚动行（视图上的 EE_GET_SCROLL_POS）与上次轮询值，',
		'  变化时直接以 \`WebBar.scrollBy(0, 行差×行高px)\` 驱动预览——不经',
		'  过中间文件、无页面侧轮询、无浏览器缓存环节。文件通道',
		'  （\`RichBarSync.js\`）与页面侧轮询已移除。每次渲染后的初始位置仍',
		'  由内联的滚动比例注入提供。',
		'',
	].join( '\n' ) ],
] ){
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '## [0.53.0]' ) ){ console.log( 'already:', p ); continue; }
	const lines = s.split( '\n' );
	const i = lines.findIndex( l => l.startsWith( '## [0.52.0]' ) );
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
	'**0.53.0 (2026-10-01, DEPLOYED + pushed — user test pending):** live scroll sync REWRITTEN on the NATIVE WebBar.scrollBy (v26.3+, docs: WebBar.scrollTo(x,y)/scrollBy(dx,dy)/scrollX/scrollY — pixel units). The file channel (RichBarSync.js + page-side poller) is REMOVED — browser test proved the page logic fine but file:// delivery never updated in the real bar. NEW FLOW: IDT_SCROLLER_POLL(11) 300ms → OnScrollerPoll reads EE_GET_SCROLL_POS on **m_hwndView** → delta lines vs m_nLastEditorY → macro `WebBar.scrollBy(0, delta*m_nPreviewLinePx)` via plain RunWebBarMacro (dropped frames OK while scrolling). m_nPreviewLinePx = injected font nPx × 1.6 (SetPreviewLinePx called where nPx is computed; default 26). StartScrollerPoll seeds m_nLastEditorY = current y (no jump). Render-time initial restore = inline `window.__scrollRatio=<ratio>;` before the marked.parse call (0.50.1 ordering lesson applied). NOTE: WebBar.scrollBy drives the WHOLE built-in Web bar — if the user has other pages open in it, they get scrolled too (acceptable: the bar is dedicated to our preview).',
	'',
].join( '\n' );
m = m.slice( 0, i ) + entry + m.slice( i );
fs.writeFileSync( mp, m, 'utf8' );
console.log( 'memory updated' );
