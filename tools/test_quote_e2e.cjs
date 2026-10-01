// AUTHORITATIVE end-to-end: exact injected JS + real shipped marked
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
const mmark = require( 'E:/Projects/RichBar/RichBar/third_party/marked/marked.umd.min.js' );
const marked = mmark.marked || mmark;
const sandboxNL = String.fromCharCode( 10 );
eval( decls.split( 'NL' ).join( 'ZNL' ) );
eval( fn.split( 'NL' ).join( 'ZNL' ) );
const test = [
	'> 这是引用行',
	'这是引用后的普通段落',
	'又一个段落',
	'',
	'> 引用一',
	'> 引用二',
	'> 引用三',
	'',
	'- 列表',
	'  延续',
	'',
	'正文段落',
].join( sandboxNL );
const html = marked.parse( NormalizeSingleNewlines( test ), { breaks: true, gfm: true } );
console.log( html );
console.log( '--- quote1 contains para text (BUG):', /<blockquote>[^]*?这是引用后的普通段落[^]*?<\/blockquote>/.test( html ) && /这是引用后的普通段落/.test( html.match( /<blockquote>[\s\S]*?<\/blockquote>/ )[ 0 ] ) );
const firstQuote = html.match( /<blockquote>[\s\S]*?<\/blockquote>/ )[ 0 ];
console.log( '--- first quote holds ONLY the quote line:', firstQuote.includes( '这是引用行' ) && !firstQuote.includes( '这是引用后的普通段落' ) && !firstQuote.includes( '又一个段落' ) );
console.log( '--- second quote intact (3 lines, breaks):', ( html.match( /<blockquote>[\s\S]*?<\/blockquote>/g ) || [] ).length === 2 && /引用一<br>引用二<br>引用三/.test( html ) );
console.log( '--- list intact:', ( html.match( /<ul>/g ) || [] ).length === 1 && html.includes( '列表<br>延续' ) );
console.log( '--- para free:', html.includes( '<p>这是引用后的普通段落</p>' ) && html.includes( '<p>又一个段落</p>' ) );
