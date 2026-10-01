// FINAL validation: extract the injected JS EXACTLY as the C++ compiler
// will assemble it (C++ string-literal semantics: \" -> ", \\ -> \, \x
// unknown escapes stay as-is per MSVC with a warning) and run it.
const fs = require( 'fs' );
let src = fs.readFileSync( 'E:/Projects/RichBar/RichBar/RichBar.h', 'utf8' );

// collect every sHtml += L"..." segment between the content div and the
// closing script line
const k = src.indexOf( 'sHtml += L"<div id=\\"content\\">' );
const m = src.indexOf( 'marked.parse(NormalizeSingleNewlines', k );
let seg = src.slice( k, m + 400 );
const re = /sHtml \+= L"((?:[^"\\]|\\.)*)"/g;
let g, js = '';
while( ( g = re.exec( seg ) ) !== null ){
	// C++ unescape (the escapes we actually use): \" -> " and \\ -> \
	let t = g[ 1 ].split( '\\"' ).join( '"' );
	t = t.split( '\\\\' ).join( '\\' );
	js += t + '\n';
}
// strip the two embedded-JS segments (script src line stays literal)
console.log( '--- assembled JS ---' );
console.log( js );
// execute: emulate the browser pieces (rename our helper to avoid the
// injected NL constant)
const NLX = String.fromCharCode( 10 );
eval( js.split( '\n' ).filter( l => l.startsWith( 'var ' ) || l.startsWith( 'function ' ) ).join( '\n' ) );
const test = [
	'第一段第一行',
	'第一段第二行',
	'第二段开始了',
	'',
	'- 列表一',
	'- 列表二',
	'  列表二的延续行',
	'',
	'> 引用第一行',
	'> 引用第二行',
	'引用后的段落',
	'',
	'| 表头 | 列 |',
	'|------|----|',
	'| a | b |',
	'',
	'### 标题行',
	'标题后的正文',
	'',
	'---',
	'分隔线后的段落',
	'结束段落一',
	'结束段落二',
].join( NLX );
const out = NormalizeSingleNewlines( test );
console.log( '--- normalized output ---' );
console.log( out );
console.log( '=== insertions:', ( out.match( /\n\n/g ) || [] ).length );
console.log( 'list block intact:', out.includes( '- 列表二\n  列表二的延续行' ) );
console.log( 'quote block intact:', out.includes( '> 引用第一行\n> 引用第二行' ) );
console.log( 'table intact:', out.includes( '| 表头 | 列 |\n|------|----|' ) );
console.log( 'title+body separated:', out.includes( '### 标题行\n\n标题后的正文' ) );
console.log( 'hr preceded by break:', out.includes( '\n\n---' ) );
