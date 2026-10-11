// insert the 0.51.0 changelog sections (both languages), find the anchor dynamically
const fs = require( 'fs' );
for( const [ p, entry ] of [
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.md', [
		'## [0.51.0] - 2026-10-01',
		'',
		'### Fixed',
		'',
		'- **Live scroll sync**: scrolling the editor now moves the preview',
		'  (a 300 ms poll pushes the scroll ratio to the preview page via a',
		'  tiny sync script; previously the ratio was only applied at render',
		'  time, and scrolling never re-rendered).',
		'- **Cold-start regression**: a failed `document.Text` macro (the V8',
		'  engine first-burst) aborted the whole render, leaving the pane',
		'  showing the previous session file. It now falls back to the',
		'  clipboard read and schedules one retry.',
		'',
	].join( '\n' ) ],
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.zh.md', [
		'## [0.51.0] - 2026-10-01',
		'',
		'### 修复',
		'',
		'- **实时滚动同步**：滚动编辑器现在会带动预览（300 毫秒轮询把滚动',
		'  比例经一个微型同步脚本推给预览页；旧实现只在渲染时应用比例，而',
		'  滚动从不触发渲染）。',
		'- **冷启动回归**：`document.Text` 宏失败（V8 引擎首波）会中断整个',
		'  渲染，面板停留在上一会话的文件。现回退到剪贴板读取并安排一次',
		'  重试。',
		'',
	].join( '\n' ) ],
] ){
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '## [0.51.0]' ) ){ console.log( 'already:', p ); continue; }
	const lines = s.split( '\n' );
	const i = lines.findIndex( l => l.startsWith( '## [0.50.2]' ) );
	if( i < 0 ){ console.log( 'MISS:', p ); continue; }
	lines.splice( i, 0, entry );
	fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
	console.log( 'inserted:', p );
}
