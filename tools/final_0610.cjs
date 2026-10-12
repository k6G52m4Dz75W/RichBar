// changelog entries for 0.61.0
const fs = require( 'fs' );
for( const [ p, entry ] of [
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.md', [
		'## [0.61.0] - 2026-10-01',
		'',
		'### Changed',
		'',
		'- **Live scroll sync simplified to direct px deltas with the pane',
		'  width ratio** (user model): the 300 ms poll converts the editor',
		'  scroll delta (lines) to preview px (preview font CSS px x 1.6',
		'  line-height) and feeds it straight to `WebBar.scrollBy`, scaled by',
		'  editor-pane-width / preview-pane-width — the same content wraps',
		'  more in a narrower pane, so the narrower side scrolls',
		'  proportionally more. The sync-file channel (page poller) is',
		'  removed; user-confirmed diagnostics: `scrollBy` units are pixels',
		'  and it is the only scroll primitive that moves the preview.',
		'',
	].join( '\n' ) ],
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.zh.md', [
		'## [0.61.0] - 2026-10-01',
		'',
		'### 变更',
		'',
		'- **实时滚动同步简化为直接像素差 + 窗格宽度比例**（用户模型）：',
		'  300 毫秒轮询把编辑器滚动行差换算为预览像素（预览字体 CSS 像素 ×',
		'  1.6 行高），按 编辑器窗格宽 ÷ 预览窗格宽 缩放后直接喂给',
		'  `WebBar.scrollBy`——同一内容在窄窗格里换行更多，窄侧按比例多滚。',
		'  同步文件通道（页面轮询）已移除；用户诊断确认：`scrollBy` 单位为',
		'  像素，且是唯一能真正移动预览的滚动原语。',
		'',
	].join( '\n' ) ],
] ){
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '## [0.61.0]' ) ){ console.log( 'already:', p ); continue; }
	const lines = s.split( '\n' );
	const i = lines.findIndex( l => l.startsWith( '## [0.60.0]' ) );
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
	'**0.61.0 (2026-10-01, DEPLOYED + pushed - user test pending):** live scroll sync SIMPLIFIED per user direction (the sync-file channel never delivered in the real file:// bar - dead end confirmed): OnScrollerPoll = pure direct-px-delta model: read editor scroll lines (m_hwndView), nDelta vs m_nLastEditorY, preview px = nDelta * m_nPreviewLineCssPx * 1.6 * dScale where dScale = editorW/previewW from GetClientRect(m_hwndView)/GetClientRect(m_hwndPreviewHost), macro `WebBar.scrollBy(0, nPx)` via plain RunWebBarMacro. Members: m_dLastSentRatio REPLACED by m_nPreviewLineCssPx (=16, set at render = the injected font CSS px). The page-side poller/__rbSetRatio/ratio-injection are all gone from the page emission. scrollBy = the ONLY proven working scroll primitive (user-confirmed px units).',
	'',
].join( '\n' );
m = m.slice( 0, i ) + entry + m.slice( i );
fs.writeFileSync( mp, m, 'utf8' );
console.log( 'memory updated' );
