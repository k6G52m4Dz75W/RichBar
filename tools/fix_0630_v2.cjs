// 0.63.0 fix v2: replace the middle delta block by content-matched bounds
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
let iStart = -1, iEnd = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].indexOf( 'if( nDelta == 0 )  return;' ) >= 0 ){ iStart = i; }
	if( iStart >= 0 && lines[ i ].indexOf( 'dropped frames are fine while scrolling' ) >= 0 ){ iEnd = i; break; }
}
if( iStart < 0 || iEnd < 0 ){ console.log( 'bounds miss', iStart, iEnd ); process.exit( 1 ); }
console.log( 'block: lines', iStart + 1, '-', iEnd + 1 );
const T3 = '\t\t\t';
lines.splice( iStart, iEnd - iStart + 1,
	T3 + 'if( nDelta == 0 )  return;',
	T3 + 'int nPxPerLine = m_nPreviewLinePx;',
	T3 + 'const int nPageMax = GetPreviewMaxFromTitle();',
	T3 + 'if( nPageMax > 0 && nScrollable > 0 ){',
	T3 + '\tnPxPerLine = nPageMax / nScrollable;',
	T3 + '}',
	T3 + 'const int nPx = nDelta * nPxPerLine;',
	T3 + 'wsprintf( szMacro, L"WebBar.scrollBy( 0, %d );", nPx );',
	T3 + 'RunWebBarMacro( szMacro );'
);
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'middle block replaced' );
