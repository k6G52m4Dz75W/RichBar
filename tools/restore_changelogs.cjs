// restore the changelog sections 0.45.0 - 0.53.0 (lost in the rebase)
const fs = require( 'fs' );

const en = [
	[ '0.53.0', 'Changed', [
		'- **Live scroll sync rewritten on the native WebBar.scrollBy**',
		'  (v26.3+): the 300 ms poll compares the editor scroll line',
		'  (EE_GET_SCROLL_POS on the view) with the previous poll and drives',
		'  the preview with `WebBar.scrollBy(0, deltaLines × lineHeightPx)`',
		'  directly — no intermediate file, no page-side polling, no browser',
		'  cache in the loop. The file channel (`RichBarSync.js`) and the',
		'  page-side poller were removed. The initial position after each',
		'  render still comes from the inline scroll-ratio injection.',
	] ],
	[ '0.52.0', 'Fixed', [
		'- **Live scroll sync could never update**: the preview page re-fetched',
		'  the sync file through a script tag **without a cache-buster**, so',
		'  the browser served the first fetch from cache forever. The poll',
		'  URL now carries `?cb=Date.now()`. Verified in a real browser: a',
		'  sync file update moves the preview within one poll cycle.',
	] ],
	[ '0.51.x', 'Fixed', [
		'- **Live scroll sync introduced** (300 ms poll, sync-file channel at',
		'  first) and **the cold-start regression fixed**: a failed',
		'  `document.Text` macro aborted the whole render, leaving the pane',
		'  showing the previous session file. It now falls back to the',
		'  clipboard read and schedules one retry.',
		'- Scroll queries target the view window (`m_hwndView`); the frame',
		'  window holds no view scroll info and returned y = 0 forever.',
	] ],
	[ '0.50.0', 'Added', [
		'- **EmEditor 26.3.0 modernization with full fallback**:',
		'  **clipboard-free buffer reads** via an in-memory macro',
		'  (`return document.Text;` through `EE_RUN_MACRO`) — no SelectAll+Copy,',
		'  no clipboard churn; **huge-file support** (read-only properties work',
		'  in the new Fast View mode); **render-time preview scroll restore**',
		'  from the editor scroll ratio.',
	] ],
	[ '0.47.0', 'Changed', [
		'- **Plain-text files render as Markdown**: `.txt` maps to the',
		'  Markdown mode in `DetectMode` (the previous fallback previewed a',
		'  `.txt` opened from HTML mode as raw HTML).',
	] ],
	[ '0.46.0', 'Changed', [
		'- **marked.js updated to v18.1.0** with a provenance header (raw',
		'  source + CDN URLs and the update recipe) in the shipped file.',
	] ],
	[ '0.45.0', 'Added', [
		'- **pandoc theme** (`themes/pandoc-default.css`): the pandoc default',
		'  stylesheet resolved to standalone CSS — 36em centered academic',
		'  layout with automatic light-dark adaptation. GPL attribution added.',
		'- Source URLs recorded in every shipped third-party theme header',
		'  (pandoc, VS Code) for future upstream updates.',
	] ],
];

for( const [ p, lang ] of [
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.md', 'en' ],
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.zh.md', 'zh' ],
] ){
	let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
	if( lines.some( l => l.startsWith( '## [0.53.0]' ) ) ){ console.log( 'already:', p ); continue; }
	// find the first section heading (## [x.y.z])
	const first = lines.findIndex( l => l.startsWith( '## [' ) );
	if( first < 0 ){ console.log( 'no section heading in', p ); continue; }
	const zh = lang === 'zh';
	const entries = [];
	for( const [ ver, kind, body ] of en ){
		const heading = zh
			? ( kind === 'Changed' ? '### 变更' : ( kind === 'Fixed' ? '### 修复' : '### 新增' ) )
			: ( '### ' + kind );
		entries.push( '## [' + ver + '] - 2026-10-01', '', heading, '' );
		for( const b of body ){ entries.push( b.replace( '`themes/pandoc-default.css`', zh ? '`themes/pandoc-default.css`' : '`themes/pandoc-default.css`' ) ); }
		entries.push( '' );
	}
	lines.splice( first, 0, ...entries );
	fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
	console.log( 'restored', entries.filter( l => l.startsWith( '## [' ) ).length, 'sections into', p );
}
