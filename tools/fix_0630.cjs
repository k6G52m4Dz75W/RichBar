// 0.63.0 fix: replace the middle delta block by exact line index
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
// idx 3155-3158 (0-based): the 4 delta lines
if( ( lines[ 3155 ] || '' ).indexOf( 'if( nDelta == 0 )  return;' ) < 0 ){ console.log( 'anchor 3156 miss: ' + JSON.stringify( ( lines[ 3155 ] || '' ).slice( 0, 80 ) ) ); process.exit( 1 ); }
if( ( lines[ 3158 ] || '' ).indexOf( 'dropped frames' ) < 0 ){ console.log( 'anchor 3159 miss' ); process.exit( 1 ); }
const T3 = '\t\t\t';
lines.splice( 3155, 4,
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
for( let n = 3153; n <= 3166; n++ ){ console.log( n + ': ' + ( lines[ n - 1 ] || 'EOF' ).replace( /\r$/, '' ).slice( 0, 100 ) ); }
