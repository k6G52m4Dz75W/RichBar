// insert the 0.50.1 changelog sections (both languages)
const fs = require( 'fs' );
const en = [
	'## [0.50.1] - 2026-10-01',
	'',
	'### Fixed',
	'',
	'- **Preview scroll sync never ran**: the injected',
	'  \`window.__scrollRatio=…\` statement landed INSIDE the still-open',
	'  \`window.__md\` string literal (it became markdown text), so the',
	'  variable was never a number. The emission order is fixed: close',
	'  \`__md\`, then set the ratio, then render, then restore the scroll.',
	'',
].join( '\n' );
const zh = [
	'## [0.50.1] - 2026-10-01',
	'',
	'### 修复',
	'',
	'- **预览滚动同步从未执行**：注入的 \`window.__scrollRatio=…\` 语句落',
	'  在了尚未闭合的 \`window.__md\` 字符串字面量里（成了 Markdown 正文），',
	'  同步变量因此永远不是数字。已修正注入顺序：先闭合 \`__md\`，再设比',
	'  例，然后渲染，最后恢复滚动。',
	'',
].join( '\n' );
for( const [ p, entry ] of [
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.md', en ],
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.zh.md', zh ],
] ){
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '## [0.50.1]' ) ){ console.log( 'already:', p ); continue; }
	const anchor = '## [0.50.0] - 2026-10-01';
	const i = s.indexOf( anchor );
	if( i < 0 ){ console.log( 'MISS:', p ); continue; }
	s = s.slice( 0, i ) + entry + '\n' + s.slice( i );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'inserted:', p );
}
