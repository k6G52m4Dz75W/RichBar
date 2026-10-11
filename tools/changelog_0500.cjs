// insert the 0.50.0 changelog sections (both languages)
const fs = require( 'fs' );
const en = [
	'## [0.50.0] - 2026-10-01',
	'',
	'### Added',
	'',
	'- **EmEditor 26.3.0 modernization with full fallback** (older versions',
	'  keep every existing behavior):',
	'  - **Clipboard-free buffer reads**: on 26.3+ the buffer is fetched via',
	'    an in-memory macro (\`return document.Text;\` through',
	'    \`EE_RUN_MACRO\`) — no more SelectAll+Copy, no clipboard churn, no',
	'    selection flicker. The clipboard-based path remains as the',
	'    fallback for older versions (and if the macro fails).',
	'  - **Huge-file support**: read-only properties work in the new Fast',
	'    View mode, so the preview can render documents that are not fully',
	'    loaded.',
	'  - **Preview scroll sync**: every render injects the editor scroll',
	'    position (line / total lines via \`EE_GET_SCROLL_POS\` +',
	'    \`EE_GET_LINES\`) and the preview restores it after render — the',
	'    right pane follows where you are in the text.',
	'',
].join( '\n' );
const zh = [
	'## [0.50.0] - 2026-10-01',
	'',
	'### 新增',
	'',
	'- **EmEditor 26.3.0 现代化，完整回退**（旧版本保持全部既有行为）：',
	'  - **免剪贴板缓冲区读取**：26.3+ 上通过内存宏（\`EE_RUN_MACRO\` 执行',
	'    \`return document.Text;\`）获取全文——不再全选+复制、不碰剪贴板、',
	'    无选区闪烁。剪贴板路径保留为旧版本回退（宏失败时亦然）。',
	'  - **巨文件支持**：只读属性在新的 Fast View 模式下可用，预览可以',
	'    渲染未完整加载的文档。',
	'  - **预览滚动同步**：每次渲染注入编辑器滚动位置（经',
	'    \`EE_GET_SCROLL_POS\` + \`EE_GET_LINES\` 计算行占比），预览渲染后',
	'    恢复到同一比例——右侧窗格跟随左侧的阅读位置。',
	'',
].join( '\n' );
for( const [ p, entry ] of [
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.md', en ],
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.zh.md', zh ],
] ){
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '## [0.50.0]' ) ){ console.log( 'already:', p ); continue; }
	const anchor = '## [0.47.0] - 2026-10-01';
	const i = s.indexOf( anchor );
	if( i < 0 ){ console.log( 'MISS:', p ); continue; }
	s = s.slice( 0, i ) + entry + '\n' + s.slice( i );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'inserted:', p );
}
