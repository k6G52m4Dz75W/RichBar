// rebuild line 3407 (idx 3406): the forEach renderer wrapper — final
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
const DQ = String.fromCharCode( 34 ), BS = String.fromCharCode( 92 ), SQ = String.fromCharCode( 39 );

const head = '[' + SQ + 'heading' + SQ + ',' + SQ + 'paragraph' + SQ + ',' + SQ + 'code' + SQ + ',' + SQ + 'blockquote' + SQ + ',' + SQ + 'list' + SQ + ',' + SQ + 'hr' + SQ + ',' + SQ + 'table' + SQ + ']';
const body = '.forEach(function(k){var o=__rd[k].bind(__rd);__rd[k]=function(){var args=[].slice.call(arguments);var tok=null;for(var j=0;j<args.length;j++){var a=args[j];if(a&&typeof a===' + SQ + 'object' + SQ + '&&a.raw!==undefined){tok=a;break;}}var out=o.apply(null,args);var sl=0;if(tok&&tok.raw){var i=__src.indexOf(tok.raw);if(i>=0)sl=__src.slice(0,i).split(' + SQ + BS + 'n' + SQ + ').length-1;}var m=out.match(/^<([a-z0-9]+)/);if(m){return out.replace(/^<([a-z0-9]+)/,' + SQ + '<' + SQ + '+m[1]+' + SQ + ' data-source-line=' + BS + DQ + SQ + '+sl+' + BS + DQ + SQ + '>' + SQ + ');}return out;};});';

// C++ escaping: JS \" (BS+DQ) -> C++ \\" (BS+BS+DQ); bare DQ -> BS+DQ
let cpp = ( head + body )
	.split( BS + DQ ).join( BS + BS + DQ )
	.split( DQ ).join( BS + DQ );
lines[ 3406 ] = '\t\t\t\tsHtml += L' + DQ + cpp + DQ + ';\r';
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );

// validate the unescaped JS
let js = cpp.split( BS + DQ ).join( DQ ).split( BS + BS ).join( BS );
try { new Function( '__rd', '__src', js ); console.log( 'JS VALID' ); }
catch( e ) { console.log( 'JS INVALID:', e.message ); console.log( 'HEAD:', js.slice( 0, 150 ) ); console.log( 'TAIL:', js.slice( -180 ) ); }
