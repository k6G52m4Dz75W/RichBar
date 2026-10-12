// complete the 0.59.0 member + orphan-function cleanup
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
const T1 = '\t';

// 1. remove the orphan SetPreviewLinePx function (comment + fn + body + close + blank)
let iS = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].indexOf( '// remember the preview line height (px) for the scroll sync' ) >= 0 ){ iS = i; break; }
}
if( iS < 0 ) { console.log( 'orphan fn not found' ); process.exit( 1 ); }
// verify the span: comment, fn sig, open, body, close, blank
if( ( lines[ iS + 1 ] || '' ).indexOf( 'SetPreviewLinePx' ) < 0 ) { console.log( 'fn sig not after comment' ); process.exit( 1 ); }
if( ( lines[ iS + 4 ] || '' ).indexOf( '}' ) < 0 ) { console.log( 'close not at +4' ); process.exit( 1 ); }
lines.splice( iS, 5 + 1 );	// + the blank line after
console.log( 'orphan SetPreviewLinePx removed at', iS + 1 );

// 2. members: insert m_nEditorLineCssPx + m_nLastSentTargetPx after m_nPreviewLinePx
let iM = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].indexOf( 'int m_nPreviewLinePx = 26;' ) >= 0 ){ iM = i; break; }
}
if( iM < 0 ) { console.log( 'member not found' ); process.exit( 1 ); }
lines.splice( iM + 1, 0,
	T1 + 'int m_nEditorLineCssPx = 16;\t// editor line height in CSS px (set at render)',
	T1 + 'int m_nLastSentTargetPx = -1;\t// last px target sent to the preview'
);
console.log( 'members inserted at', iM + 2 );

fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'ALL OK' );
