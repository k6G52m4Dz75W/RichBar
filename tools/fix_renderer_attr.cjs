// fix the renderer line: the attribute value must be a real JS expression
// concatenation, not a literal containing function names.
// Use single quotes for the attribute value: data-source-line='12'
// (single quotes are valid HTML attribute delimiters and avoid ALL
// C++/JS double-quote escaping)
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
const DQ = String.fromCharCode( 34 ), SQ = String.fromCharCode( 39 );

// find the forEach line (contains "data-source-line=")
let idx = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].indexOf( 'data-source-line' ) >= 0 && lines[ i ].indexOf( 'forEach' ) >= 0 ){ idx = i; break; }
}
if( idx < 0 ){ console.log( 'forEach line not found' ); process.exit( 1 ); }

const head = '[' + SQ + 'heading' + SQ + ',' + SQ + 'paragraph' + SQ + ',' + SQ + 'code' + SQ + ',' + SQ + 'blockquote' + SQ + ',' + SQ + 'list' + SQ + ',' + SQ + 'hr' + SQ + ',' + SQ + 'table' + SQ + ']';
const body = '.forEach(function(k){var o=__rd[k].bind(__rd);__rd[k]=function(){var args=[].slice.call(arguments);var tok=null;for(var j=0;j<args.length;j++){var a=args[j];if(a&&typeof a===' + SQ + 'object' + SQ + '&&a.raw!==undefined){tok=a;break;}}var out=o.apply(null,args);var sl=0;if(tok&&tok.raw){var i=__src.indexOf(tok.raw);if(i>=0)sl=__src.slice(0,i).split(String.fromCharCode(10)).length-1;}var m=out.match(/^<([a-z0-9]+)/);if(m){return out.replace(/^<([a-z0-9]+)/,' + SQ + '<' + SQ + '+m[1]+' + SQ + ' data-source-line=' + DQ + SQ + '+sl+' + DQ + SQ + '>' + SQ + ');}return out;};});';

// the attribute value in the generated HTML uses DOUBLE quotes (DQ),
// built by JS string concat: ' data-source-line=' + DQ + sl + DQ + '>'
// where DQ is a JS variable holding one double-quote char.
// So we need: var DQ=String.fromCharCode(34); defined before.
const full = 'var DQ=String.fromCharCode(34);' + head + body;
const js = full;
try { new Function( '__rd', '__src', js ); console.log( 'JS VALID' ); }
catch( e ){ console.log( 'JS INVALID:', e.message ); process.exit( 1 ); }

// C++ escape: only the raw double quotes inside get BS-escaped.
// In `full`, actual DQ chars appear ONLY inside ' data-source-line=' +DQ... no —
// we built them as + DQ + (variable refs), so NO raw double quotes exist.
// Verify:
if( js.indexOf( DQ ) >= 0 ){ console.log( 'unexpected raw DQ in js' ); process.exit( 1 ); }
lines[ idx ] = '\t\t\t\tsHtml += L' + DQ + js + DQ + ';\r';
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'renderer line rebuilt at', idx + 1 );
