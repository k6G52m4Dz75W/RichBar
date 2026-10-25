// rebuild the two broken emission lines (file-based, no shell escaping)
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
const BS = String.fromCharCode( 92 );
const SQ = String.fromCharCode( 39 );
const DQ = String.fromCharCode( 34 );

// 1) line 3141 (idx 3140): the backslash literal
lines[ 3140 ] = '\t\t\tif( *q == L' + SQ + BS + BS + SQ + ' )  *q = L' + SQ + '/' + SQ + ';\r';

// 2) line 3407 (idx 3406): the forEach renderer wrapper — build from parts
// JS (logical): ...forEach(function(k){ ... out.replace(re,'<'+m[1]+' data-source-line="'+sl+'">') ...})
// C++ literal: " -> \" and JS string \n inside split('\n') -> needs \\n in JS -> \\\\n in C++
const jsParts = [
	SQ + 'heading' + SQ + ',' + SQ + 'paragraph' + SQ + ',' + SQ + 'code' + SQ + ',',
	SQ + 'blockquote' + SQ + ',' + SQ + 'list' + SQ + ',' + SQ + 'hr' + SQ + ',' + SQ + 'table' + SQ,
];
const jsBody = '.forEach(function(k){var o=__rd[k].bind(__rd);__rd[k]=function(){var args=[].slice.call(arguments);var tok=null;for(var j=0;j<args.length;j++){var a=args[j];if(a&&typeof a===' + SQ + 'object' + SQ + '&&a.raw!==undefined){tok=a;break;}}var out=o.apply(null,args);var sl=0;if(tok&&tok.raw){var i=__src.indexOf(tok.raw);if(i>=0)sl=__src.slice(0,i).split(' + SQ + BS + 'n' + SQ + ').length-1;}var m=out.match(/^<([a-z0-9]+)/);if(m){return out.replace(/^<([a-z0-9]+)/,' + SQ + '<' + SQ + '+m[1]+' + SQ + ' data-source-line=' + BS + DQ + SQ + '+sl+' + BS + DQ + SQ + '>' + SQ + ');}return out;};});';
// JS escape of DQ inside the SQ strings: ' data-source-line=\"' needs the backslash in JS => BS+DQ
// (already encoded above). Now C++ escape: DQ -> BS+DQ; BS already single from BS var stays BS+BS
let cpp = ( '[' + jsParts.join( '' ) + jsBody )
	.split( DQ ).join( BS + DQ )           // every raw " becomes \"
	.split( BS + DQ + SQ ).join( BS + BS + DQ + SQ ) // the \\' sequences need \\"
	.split( BS + 'n' + SQ ).join( BS + BS + 'n' + SQ ); // \n' -> \\n' (JS \n in split)
lines[ 3406 ] = '\t\t\t\tsHtml += L' + DQ + cpp + DQ + ';\r';
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'rebuilt:' );
console.log( JSON.stringify( lines[ 3140 ].slice( 0, 70 ) ) );
console.log( JSON.stringify( lines[ 3406 ].slice( 0, 150 ) ) );
console.log( 'tail:', JSON.stringify( lines[ 3406 ].slice( -80 ) ) );
