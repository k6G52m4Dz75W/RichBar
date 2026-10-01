// FINAL quote-bleed verification: extract the injected JS EXACTLY as the
// C++ compiler assembles it, then run it.
const fs = require( 'fs' );
let src = fs.readFileSync( 'E:/Projects/RichBar/RichBar/RichBar.h', 'utf8' );
const k = src.indexOf( 'sHtml += L"<div id=\\"content\\">' );
const m = src.indexOf( 'marked.parse(NormalizeSingleNewlines', k );
let seg = src.slice( k, m + 500 );
const re = /sHtml \+= L"((?:[^"\\]|\\.)*)"/g;
let g, decls = '', fn = '';
while( ( g = re.exec( seg ) ) !== null ){
	let t = g[ 1 ].split( '\\"' ).join( '"' );
	t = t.split( '\\\\' ).join( '\\' );
	if( t.startsWith( 'var ' ) )  decls += t + '\n';
	if( t.startsWith( 'function NormalizeSingleNewlines' ) )  fn = t;
}
const NLQ = String.fromCharCode( 10 );
eval( decls.replace( 'NL', 'NLQ' ).replace( 'NL', 'NLQ' ).replace( 'NL', 'NLQ' ).replace( 'NL', 'NLQ' ).replace( 'NL', 'NLQ' ) );
eval( fn.replace( /NL/g, 'NLQ' ) );
const test = [
	'> 这是引用行',
	'这是引用后的普通段落',
	'又一个段落',
	'',
	'> 引用一',
	'> 引用二',
	'> 引用三',
	'',
	'| a | b |',
	'|---|---|',
	'| 1 | 2 |',
	'',
	'- 列表',
	'  延续',
].join( NLQ );
const out = NormalizeSingleNewlines( test );
console.log( out );
console.log( '--- quote interior intact:', out.includes( '> 引用一\n> 引用二\n> 引用三' ) );
console.log( '--- paragraph freed:', out.includes( '> 这是引用行\n\n这是引用后的普通段落' ) );
console.log( '--- table intact:', out.includes( '| a | b |\n|---|---|' ) );
console.log( '--- list intact:', out.includes( '- 列表\n  延续' ) );
