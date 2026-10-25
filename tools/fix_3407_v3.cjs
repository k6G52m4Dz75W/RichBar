// final fix for line 3407: avoid \n entirely (use String.fromCharCode(10))
// and avoid embedded double quotes (use String.fromCharCode(34))
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
const DQ = String.fromCharCode( 34 ), BS = String.fromCharCode( 92 ), SQ = String.fromCharCode( 39 );
const NL10 = 'String.fromCharCode(10)';
const DQ34 = 'String.fromCharCode(34)';

const head = '[' + SQ + 'heading' + SQ + ',' + SQ + 'paragraph' + SQ + ',' + SQ + 'code' + SQ + ',' + SQ + 'blockquote' + SQ + ',' + SQ + 'list' + SQ + ',' + SQ + 'hr' + SQ + ',' + SQ + 'table' + SQ + ']';
const body = '.forEach(function(k){var o=__rd[k].bind(__rd);__rd[k]=function(){var args=[].slice.call(arguments);var tok=null;for(var j=0;j<args.length;j++){var a=args[j];if(a&&typeof a===' + SQ + 'object' + SQ + '&&a.raw!==undefined){tok=a;break;}}var out=o.apply(null,args);var sl=0;if(tok&&tok.raw){var i=__src.indexOf(tok.raw);if(i>=0)sl=__src.slice(0,i).split(' + NL10 + ').length-1;}var m=out.match(/^<([a-z0-9]+)/);if(m){return out.replace(/^<([a-z0-9]+)/,' + SQ + '<' + SQ + '+m[1]+' + SQ + ' data-source-line=' + DQ34 + '+sl+' + DQ34 + '>' + SQ + ');}return out;};});';

const js = head + body;
// sanity: the emitted JS (what the page will run) must be valid
try { new Function( '__rd', '__src', js ); console.log( 'JS VALID' ); }
catch( e ){ console.log( 'JS INVALID:', e.message ); process.exit( 1 ); }

// C++ escaping: only DQ needs escaping in this string now
const cpp = js.split( DQ ).join( BS + DQ );
lines[ 3406 ] = '\t\t\t\tsHtml += L' + DQ + cpp + DQ + ';\r';
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'line rebuilt (no backslash escapes, no embedded quotes)' );
