// 0.65.2: fix the anchor line-number coordinate system.
// Root cause of "editor ~50% -> preview at bottom": the anchors were
// numbered in NORMALIZED-text lines (blank lines added between every
// paragraph), while the editor sends ORIGINAL-text line numbers. The
// normalized line count is ~2x the original -> the page reached its last
// anchor at editor-line ~50%.
// Fix: NormalizeSingleNewlines now also builds window.__rbLineMap
// (normLine -> origLine); the renderer converts its normalized start
// line through the map, so data-source-line is in ORIGINAL coordinates.
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
const DQ = String.fromCharCode( 34 ), SQ = String.fromCharCode( 39 );
const Q = 'Q';
const NL10 = 'String.fromCharCode(10)';

// 1) find and replace the NormalizeSingleNewlines definition line
let iN = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].indexOf( 'function NormalizeSingleNewlines' ) >= 0 ){ iN = i; break; }
}
if( iN < 0 ){ console.log( 'normalize def not found' ); process.exit( 1 ); }
// build the new normalize (with map) — no double quotes anywhere
const normParts = [
	'function NormalizeSingleNewlines(s){',
	'window.__rbLineMap=[0];',
	'var L=s.split(NL),o=[],cur=0;',
	'for(var i=0;i<L.length;i++){',
	'var t=L[i],keep=false;',
	'if(i>0){var pr=L[i-1];',
	'if(isQuote.test(t)||isTable.test(t)||isHr.test(t)||isHead.test(t)||isCode.test(t)||isList.test(t)||isCode.test(pr)||isList.test(pr)||isTable.test(pr)||isHr.test(pr)||isSetextH.test(pr)){keep=true;}}',
	'if(!keep){o.push(NL);window.__rbLineMap.push(i);}',   // blank line maps to orig line i (next content line index)
	'o.push(t);window.__rbLineMap.push(i);',
	'}',
	'return o.join(NL);}',
];
const normJs = normParts.join( '' );
try { new Function( 'isQuote', 'isTable', 'isHr', 'isHead', 'isCode', 'isList', 'isSetextH', 'NL', 'window', normJs ); }
catch( e ){ console.log( 'norm JS INVALID:', e.message ); process.exit( 1 ); }
if( normJs.indexOf( DQ ) >= 0 ){ console.log( 'norm raw DQ leaked' ); process.exit( 1 ); }
lines[ iN ] = '\t\t\t\tsHtml += L' + DQ + normJs + DQ + ';\r';
console.log( 'normalize rebuilt at', iN + 1 );

// 2) the renderer line: convert normalized line -> original line via the map
let iR = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].indexOf( 'data-source-line' ) >= 0 && lines[ i ].indexOf( 'forEach' ) >= 0 ){ iR = i; break; }
}
if( iR < 0 ){ console.log( 'renderer line not found' ); process.exit( 1 ); }
const rendererParts = [
	'var Q=String.fromCharCode(34);',
	'[',
	SQ, 'heading', SQ, ',', SQ, 'paragraph', SQ, ',', SQ, 'code', SQ, ',', SQ, 'blockquote', SQ, ',',
	SQ, 'list', SQ, ',', SQ, 'hr', SQ, ',', SQ, 'table', SQ,
	']',
	'.forEach(function(k){',
	'var o=__rd[k].bind(__rd);',
	'__rd[k]=function(){',
	'var args=[].slice.call(arguments);',
	'var tok=null;',
	'for(var j=0;j<args.length;j++){var a=args[j];if(a&&typeof a===', SQ, 'object', SQ, '&&a.raw!==undefined){tok=a;break;}}',
	'var out=o.apply(null,args);',
	'var sl=0;',
	'if(tok&&tok.raw){var i=__src.indexOf(tok.raw);',
	'if(i>=0){var nl=__src.slice(0,i).split(String.fromCharCode(10)).length-1;',
	'sl=window.__rbLineMap&&window.__rbLineMap[nl]!==undefined?window.__rbLineMap[nl]:nl;}}',
	'var m=out.match(/^<([a-z0-9]+)>/);',
	'if(m){return out.replace(/^<([a-z0-9]+)>/,', SQ, '<', SQ, '+m[1]+', SQ, ' data-source-line=', SQ, '+Q+sl+Q+', SQ, '>', SQ, ');}',
	'return out;',
	'};});',
];
const rendJs = rendererParts.join( '' );
try { new Function( '__rd', '__src', rendJs ); console.log( 'renderer JS VALID' ); }
catch( e ){ console.log( 'renderer JS INVALID:', e.message ); process.exit( 1 ); }
if( rendJs.indexOf( DQ ) >= 0 ){ console.log( 'renderer raw DQ leaked' ); process.exit( 1 ); }
lines[ iR ] = '\t\t\t\tsHtml += L' + DQ + rendJs + DQ + ';\r';
console.log( 'renderer rebuilt at', iR + 1 );

fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );

// 3) end-to-end simulation with the exact emitted code
const mk = require( 'E:/Projects/RichBar/dist/marked.umd.min.js' );
const marked = mk.marked || m0(); function m0(){ return mk; }
const orig = '# t\npara1\npara2\npara3\n# end';
const NL = '\n';
const isQuote=/^\s{0,3}>(\s|$)/, isTable=/\|/, isHr=/^\s{0,3}([-*_])(\s*\1){2,}\s*$/, isHead=/^\s{0,3}#{1,6}\s/, isCode=/^(\s{4,}|\t)/, isList=/^\s{0,3}([*+-]\s|\d{1,9}[.)]\s)/, isSetextH=/^={2,}\s*$|^-{2,}\s*$/;
var window = { __rbLineMap: null };
const normFn = new Function( 'isQuote','isTable','isHr','isHead','isCode','isList','isSetextH','NL','window', normJs + '; return NormalizeSingleNewlines;' )( isQuote, isTable, isHr, isHead, isCode, isList, isSetextH, NL, window );
const norm = normFn( orig );
console.log( 'orig lines:', orig.split( '\n' ).length, '| norm lines:', norm.split( '\n' ).length, '| map len:', window.__rbLineMap.length );
var __src = norm;
var __rd = new marked.Renderer();
const rd = new Function( '__rd', '__src', rendJs + '; return __rd;' )( __rd, __src );
const html = marked.parser( marked.lexer( norm ), { renderer: rd, gfm: true, breaks: true } );
console.log( '--- simulated anchors (orig coords) ---' );
console.log( html.split( '\n' ).filter( l => l.includes( 'data-source-line' ) ).join( '\n' ) );
