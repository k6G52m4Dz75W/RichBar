// 0.66.1: GitHub theme + the theme-embed fix. Versions, changelogs, readmes.
// Re-runnable: every step checks whether it already applied.
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar/';

function read( f ) { return fs.readFileSync( ROOT + f, 'utf8' ); }
function write( f, t ) { fs.writeFileSync( ROOT + f, t, 'utf8' ); }
function rep( f, t, from, to ) {
	if ( !t.includes( from ) ) { console.error( 'ANCHOR MISSING in ' + f + ': ' + JSON.stringify( from.slice( 0, 60 ) ) ); process.exit( 1 ); }
	return t.split( from ).join( to );
}

let rc = read( 'RichBar.rc' );
if ( rc.includes( '0,66,0,0' ) ) {
	rc = rep( 'RichBar.rc', rc, '0,66,0,0', '0,66,1,0' );
	rc = rep( 'RichBar.rc', rc, '"0.66.0"', '"0.66.1"' );
	write( 'RichBar.rc', rc );
	console.log( 'RichBar.rc -> 0.66.1' );
} else { console.log( 'RichBar.rc already 0.66.1' ); }

const locPath = ROOT + 'mui/RichBar_loce/richbar_loce.rc';
let loc = fs.readFileSync( locPath ).toString( 'utf16le' );
if ( loc.includes( '"0.66.0"' ) ) {
	loc = loc.split( '"0.66.0"' ).join( '"0.66.1"' );
	fs.writeFileSync( locPath, Buffer.from( loc, 'utf16le' ) );
	console.log( 'loce -> 0.66.1' );
} else { console.log( 'loce already 0.66.1' ); }

const enText = [
	'## [0.66.1] - 2026-10-25',
	'',
	'### Added',
	'- **GitHub preview theme** (`themes/github.css`): the authentic github.com',
	'  markdown look, auto-generated from GitHub\'s live styles',
	'  (sindresorhus/github-markdown-css v5, MIT — GitHub itself publishes no',
	'  standalone theme file). The editor theme picks the palette: light editor',
	'  gets GitHub light, dark gets GitHub dark (`data-color-mode` stamped on',
	'  the page at render time; provenance recorded in the CSS header).',
	'',
	'### Fixed',
	'- **The shipped preview themes were silently inert since 0.44.0**: the',
	'  properties dialog resolved the selected theme file but only the default',
	'  `preview.css` was ever read and embedded — choosing vscode-markdown /',
	'  paper-serif / pandoc changed nothing (verified: a live page carried no',
	'  theme styles with PreviewCss=vscode-markdown in the registry). The',
	'  resolved file is now embedded through the same path for every selection,',
	'  read whole (fixed 8 KB cap, no UTF-8 sequence can be split by chunking).',
	'',
	'',
].join( '\n' );

if ( read( 'CHANGELOG.md' ).includes( '[0.66.1]' ) ) { console.log( 'CHANGELOG.md already patched' ); }
else {
	let en = read( 'CHANGELOG.md' );
	en = rep( 'CHANGELOG.md', en, '## [0.66.0] - 2026-10-25', enText + '## [0.66.0] - 2026-10-25' );
	write( 'CHANGELOG.md', en );
	console.log( 'CHANGELOG.md: 0.66.1 added' );
}

const zhText = [
	'## [0.66.1] - 2026-10-25',
	'',
	'### 新增',
	'- **GitHub 预览主题**（发行包 themes 目录的 `github.css`）：原汁原味的',
	'  github.com Markdown 外观，由 GitHub 线上样式自动生成',
	'  （sindresorhus/github-markdown-css v5，MIT 协议——GitHub 官方并不发布',
	'  独立主题文件）。编辑器主题决定配色：浅色编辑器配 GitHub 浅色，深色',
	'  配 GitHub 深色（渲染时在页面上写入 `data-color-mode`；来源与许可',
	'  记录在 CSS 文件头注释中）。',
	'',
	'### 修复',
	'- **发行包内的预览主题自 0.44.0 起一直静默失效**：属性对话框解析了所选',
	'  主题文件，但实际读取嵌入的只有默认 `preview.css`——选择',
	'  vscode-markdown / paper-serif / pandoc 毫无效果（实证：注册表',
	'  PreviewCss=vscode-markdown 时，实际页面中没有任何主题样式）。现在',
	'  所有选择都经同一路径嵌入，且整文件读取（修掉 8 KB 上限，分块读取',
	'  不会再截断 UTF-8 序列）。',
	'',
	'',
].join( '\n' );

if ( read( 'CHANGELOG.zh.md' ).includes( '[0.66.1]' ) ) { console.log( 'CHANGELOG.zh.md already patched' ); }
else {
	let zh = read( 'CHANGELOG.zh.md' );
	zh = rep( 'CHANGELOG.zh.md', zh, '## [0.66.0] - 2026-10-25', zhText + '## [0.66.0] - 2026-10-25' );
	write( 'CHANGELOG.zh.md', zh );
	console.log( 'CHANGELOG.zh.md: 0.66.1 added' );
}

// README theme lists: add github.css to the built-in theme enumerations
let rd = read( 'README.md' );
if ( rd.includes( 'github.css' ) ) { console.log( 'README.md already patched' ); }
else {
	rd = rep( 'README.md', rd,
		'- **marked.js v18** — the same rendering engine the official preview',
		[
			'- **GitHub theme** — `github.css` — auto-generated from github.com\'s',
			'  live styles: the light palette on a light editor, dark on dark',
			'  (sindresorhus/github-markdown-css, MIT; provenance in the CSS header).',
			'- **marked.js v18** — the same rendering engine the official preview',
		].join( '\n' ) );
	write( 'README.md', rd );
	console.log( 'README.md: github theme bullet' );
}

let rz = read( 'README.zh.md' );
if ( rz.includes( 'github.css' ) ) { console.log( 'README.zh.md already patched' ); }
else {
	rz = rep( 'README.zh.md', rz,
		'- **marked.js v18**——与官方预览同一渲染引擎、最新版本：完整 GFM',
		[
			'- **GitHub 主题**（`github.css`）：由 github.com 线上样式自动生成的',
			'  原版外观（sindresorhus/github-markdown-css，MIT；来源见 CSS 文件头）——',
			'  浅色编辑器配 GitHub 浅色、深色配深色。',
			'- **marked.js v18**——与官方预览同一渲染引擎、最新版本：完整 GFM',
		].join( '\n' ) );
	write( 'README.zh.md', rz );
	console.log( 'README.zh.md: github theme bullet' );
}

// verify
const checks = [ [ 'RichBar.rc', '0,66,1,0' ], [ 'CHANGELOG.md', '[0.66.1]' ],
	[ 'CHANGELOG.zh.md', '[0.66.1]' ], [ 'README.md', 'github.css' ], [ 'README.zh.md', 'github.css' ] ];
for ( const [ f, s ] of checks ) {
	if ( !read( f ).includes( s ) ) { console.error( 'VERIFY FAILED: ' + f ); process.exit( 1 ); }
}
console.log( 'ALL VERIFIED' );
