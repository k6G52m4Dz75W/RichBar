// final fix: the replace must consume the tag-closing '>' too
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
const DQ = String.fromCharCode( 34 ), SQ = String.fromCharCode( 39 );

const parts = [
	'var Q=String.fromCharCode(34);',
	'[',
	SQ, 'heading', SQ, ',',
	SQ, 'paragraph', SQ, ',',
	SQ, 'code', SQ, ',',
	SQ, 'blockquote', SQ, ',',
	SQ, 'list', SQ, ',',
	SQ, 'hr', SQ, ',',
	SQ, 'table', SQ,
	']',
	'.forEach(function(k){',
	'var o=__rd[k].bind(__rd);',
	'__rd[k]=function(){',
	'var args=[].slice.call(arguments);',
	'var tok=null;',
	'for(var j=0;j<args.length;j++){var a=args[j];if(a&&typeof a===', SQ, 'object', SQ, '&&a.raw!==undefined){tok=a;break;}}',
	'var out=o.apply(null,args);',
	'var sl=0;',
	'if(tok&&tok.raw){var i=__src.indexOf(tok.raw);if(i>=0)sl=__src.slice(0,i).split(String.fromCharCode(10)).length-1;}',
	'var m=out.match(/^<([a-z0-9]+)>/);',
	'if(m){return out.replace(/^<([a-z0-9]+)>/,', SQ, '<', SQ, '+m[1]+', SQ, ' data-source-line=', SQ, '+Q+sl+Q+', SQ, '>', SQ, ');}',
	'return out;',
	'};});',
];
const js = parts.join( '' );
try { new Function( '__rd', '__src', js ); console.log( 'JS VALID' ); }
catch( e ){ console.log( 'JS INVALID:', e.message ); process.exit( 1 ); }
if( js.indexOf( DQ ) >= 0 ){ console.log( 'raw DQ leaked' ); process.exit( 1 ); }
const idx = lines.findIndex( l => l.includes( 'data-source-line' ) && l.includes( 'forEach' ) );
lines[ idx ] = '\t\t\t\tsHtml += L' + DQ + js + DQ + ';\r';
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'line', idx + 1, 'rebuilt (closing gt consumed)' );

// end-to-end simulation with the EXACT emitted code
const m = require( 'E:/Projects/RichBar/dist/marked.umd.min.js' );
const marked = m.marked || m;
const src = '# t\n\npara one\n\n## h2\n\n- a\n- b\n\nend';
const tokens = marked.lexer( src );
var __rd = new marked.Renderer();
var __src = src;
const fn = new Function( '__rd', '__src', js + '; return __rd;' )( __rd, __src );
const html = marked.parser( tokens, { renderer: fn, gfm: true, breaks: true } );
console.log( '--- simulated page output ---' );
console.log( html.split( '\n' ).filter( l => l.includes( 'data-source-line' ) ).join( '\n' ) );
