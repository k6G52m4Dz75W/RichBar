// surgical: replace the two broken injection lines (idx 3343, 3344)
// with the two correct C++ statements (real tabs via String.fromCharCode)
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
// sanity-check the anchors first
if( lines[ 3343 ].indexOf( 'marked.parse(NormalizeSingleNewlines' ) < 0 ){ console.log( 'line 3344 anchor mismatch' ); process.exit( 1 ); }
if( lines[ 3344 ].indexOf( '__scrollRatio' ) < 0 ){ console.log( 'line 3345 anchor mismatch' ); process.exit( 1 ); }
const T4 = String.fromCharCode( 9 ).repeat( 4 );
const Q = String.fromCharCode( 34 );	// "
const SQ = String.fromCharCode( 39 );	// '
const BS = String.fromCharCode( 92 );	// backslash
lines[ 3343 ] = T4 + 'sHtml += L' + Q + BS + Q + ';document.getElementById(' + SQ + 'content' + SQ + ').innerHTML=marked.parse(NormalizeSingleNewlines(window.__md),{breaks:true,gfm:true});' + Q + ';';
lines[ 3344 ] = T4 + 'sHtml += L' + Q + 'if(typeof window.__scrollRatio===' + SQ + 'number' + SQ + '){var h=document.body.scrollHeight-window.innerHeight;window.scrollTo(0,window.__scrollRatio*h);}' + Q + ';';
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'fixed:', JSON.stringify( lines[ 3343 ].slice( 0, 100 ) ) );
console.log( 'fixed:', JSON.stringify( lines[ 3344 ].slice( 0, 100 ) ) );
