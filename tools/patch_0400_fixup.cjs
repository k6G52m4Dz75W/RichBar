// 0.40.0 fixup: replace NormalizeSingleNewlines with a structural-protection
// version (list continuation lines, quote lines, table rows and pre-hr text
// lines were wrongly split in the first cut)
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );

const i = s.indexOf( 'sHtml += L"<script>";' );
const j = s.indexOf( 'sHtml += L"window.__md=', i );
if( i < 0 || j < 0 ) { console.log( 'ANCHOR NOT FOUND' ); process.exit( 1 ); }

// The JS lands inside a C++ L"..." literal: for the C++ compiler, \" = quote
// and \\ = one backslash; the regexes below are written accordingly.
// JS (logical): 
//   isList=/^\s{0,3}([*+-]\s|\d{1,9}[.)]\s)/
//   isQuote=/^\s{0,3}>(\s|$)/
//   isTable=/\|/
//   isHr=/^\s{0,3}([-*_])(\s*\1){2,}\s*$/
//   isHead=/^\s{0,3}#{1,6}\s/
//   isCode=/^(\s{4,}|\t)/
//   isSetextH=/^={2,}\s*$|^-{2,}\s*$/
const line = 'sHtml += L"function NormalizeSingleNewlines(s){'
	+ 'var isList=/^\\s{0,3}([*+\\-]\\s|\\d{1,9}[.)]\\s)/,'
	+ 'isQuote=/^\\s{0,3}>(\\s|$)/,'
	+ 'isTable=/\\|/,'
	+ 'isHr=/^\\s{0,3}([-*_])(\\s*\\1){2,}\\s*$/,'
	+ 'isHead=/^\\s{0,3}#{1,6}\\s/,'
	+ 'isCode=/^(\\s{4,}|\\t)/,'
	+ 'isSetextH=/^={2,}\\s*$|^-{2,}\\s*$/;'
	+ 'for(var i=0;i<L.length;i++){var t=L[i],keep=false;'
	+ 'if(i>0){var pr=L[i-1];'
	+ 'if(isList(t)||isQuote(t)||isTable(t)||isHr(t)||isHead(t)||isCode(t)'
	+ '||isCode(pr)||isList(pr)||isQuote(pr)||isTable(pr)||isHr(pr)||isSetextH(pr)){keep=true;}}'
	+ 'if(!keep)o.push(String.fromCharCode(10));'
	+ 'o.push(t);}return o.join(String.fromCharCode(10));}"';
// var L declaration lives in the previous L" segment (kept): re-add it
const jsLine = 'sHtml += L"var L=s.split(String.fromCharCode(10)),o=[];"' ;

const nw = [
	'sHtml += L"<script>";',
	jsLine,
	line,
	'sHtml += L"window.__md=\\"";',
].join( '\r\n' );
s = s.slice( 0, i ) + nw + s.slice( j );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'normalize function replaced OK' );
