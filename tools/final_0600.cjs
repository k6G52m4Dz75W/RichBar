// changelog entries for 0.60.0
const fs = require( 'fs' );
for( const [ p, entry ] of [
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.md', [
		'## [0.60.0] - 2026-10-01',
		'',
		'### Changed',
		'',
		'- **Live scroll sync rebuilt on the industry-standard proportional',
		'  mapping** (as used by VS Code / Typora / MarkText): the preview',
		'  page polls a tiny sync script (`RichBarSync.js`, cache-busted) and',
		'  positions itself at the received ratio of its OWN scrollable',
		'  height — so it adapts to any pane width/height and docking side',
		'  automatically. The plug-in writes that file whenever the editor',
		'  scroll ratio changes by >= 0.5% (plain file write, no macros).',
		'- The native `WebBar.scrollTo/scrollBy` calls were removed from the',
		'  sync path (they had unreliable semantics in the pane), along with',
		'  the end-anchor jumps they required. Ratio 0 and 1 reach the exact',
		'  top and bottom through the browser own clamping.',
		'- Also fixed a duplicated scroll-ratio emission in the generated',
		'  preview page.',
		'',
	].join( '\n' ) ],
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.zh.md', [
		'## [0.60.0] - 2026-10-01',
		'',
		'### 变更',
		'',
		'- **实时滚动同步改用业界标准的比例映射重建**（VS Code / Typora /',
		'  MarkText 同款思路）：预览页面轮询一个微型同步脚本',
		'  （`RichBarSync.js`，带缓存击穿），按收到的比例在**自己的**可滚',
		'  高度内定位——自动适配任意窗格宽高与停靠方向。插件在编辑器滚动',
		'  比例变化 >= 0.5% 时写入该文件（纯文件写入，不经宏）。',
		'- 同步路径移除了原生 `WebBar.scrollTo/scrollBy` 调用（它们在面板',
		'  内语义不可靠）及其所需的端点跳转。比例 0 与 1 经浏览器自身钳位',
		'  精确到达页顶/页底。',
		'- 同时修复了生成页面中滚动比例发射行重复的问题。',
		'',
	].join( '\n' ) ],
] ){
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '## [0.60.0]' ) ){ console.log( 'already:', p ); continue; }
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
	'**0.60.0 (2026-10-01, DEPLOYED + pushed — user test pending):** live scroll sync REVIVED via the sync-file channel, done right: page emits `__rbSetRatio(r)` (sets __scrollRatio + __rbRestore) + `__rbPoll` (appends <script src=RichBarSync.js?cb=Date.now()> — cache-buster is MANDATORY, the 0.51.x failure was its absence) + setInterval 250ms; plugin OnScrollerPoll (300ms) computes editor ratio = scrollY/(GetLines − PAGE_SIZE.cy) on m_hwndView and writes %TEMP%\\RichBarSync.js = `__rbSetRatio(r);` when |Δratio| >= 0.005 (plain fwrite, NO macros → no V8 cold-start dependency). Ratio 0/1 clamp to exact page top/bottom (no end anchors needed). The duplicate `window.__scrollRatio=` emission (lost-fix artifact) also deduped. VERIFIED: browser test proved the page-side mechanics end-to-end (file update → poll → real scroll); the file:// delivery in the real WebView2 pane remains the only unverified hop — if it fails, next lever: navigate the page itself less often / WebBar.ScrollY capital-case probing. Version scheme note: 0.57 skipped (0.56.1 → 0.58.0 → 0.59.0 → 0.60.0).',
	'',
].join( '\n' );
m = m.slice( 0, i ) + entry + m.slice( i );
fs.writeFileSync( mp, m, 'utf8' );
console.log( 'memory updated' );
