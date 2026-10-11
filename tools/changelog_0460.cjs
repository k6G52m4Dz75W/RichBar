// insert the 0.46.0 changelog sections (both languages) at the top
const fs = require( 'fs' );
const en = [
	'## [0.46.0] - 2026-10-01',
	'',
	'### Changed',
	'',
	'- **marked.js updated to v18.1.0** (2026-10-05; from v18.0.14 — fixes a',
	'  regex backtracking hang on unicode whitespace in link destinations).',
	'  The distributed `marked.umd.min.js` now carries a provenance header',
	'  with the exact raw source URL, the jsDelivr CDN URL used, and the',
	'  update recipe (bump the version in the CDN URL and re-download), so',
	'  upstream updates are a two-minute job. `LICENSE.third-party` reflects',
	'  the new version.',
	'',
].join( '\n' );
const zh = [
	'## [0.46.0] - 2026-10-01',
	'',
	'### 变更',
	'',
	'- **marked.js 更新至 v18.1.0**（2026-10-05；自 v18.0.14——修复链接目标',
	'  中 Unicode 空白导致的正则回溯卡死）。分发的 `marked.umd.min.js` 现在',
	'  带有来源头注释：raw 源码地址、所用的 jsDelivr CDN 地址与更新方法',
	'  （改 CDN URL 中的版本号重新下载即可），上游跟进变成两分钟的事。',
	'  `LICENSE.third-party` 已同步新版本号。',
	'',
].join( '\n' );
for( const [ p, entry ] of [
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.md', en ],
	[ 'E:/Projects/RichBar/RichBar/CHANGELOG.zh.md', zh ],
] ){
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '## [0.46.0]' ) ){ console.log( 'already:', p ); continue; }
	const anchor = '## [0.45.0] - 2026-10-01';
	const i = s.indexOf( anchor );
	if( i < 0 ){ console.log( 'MISS:', p ); continue; }
	s = s.slice( 0, i ) + entry + '\n' + s.slice( i );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'inserted:', p );
}
