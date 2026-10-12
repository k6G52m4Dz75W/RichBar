// 0.59.0 final fix: replace the middle delta block (lines are \r-terminated;
// splice by exact line index) with the width-ratio px model
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
const DQ = String.fromCharCode( 34 );
const T2 = '\t\t';
const T3 = '\t\t\t';
// verify anchors: idx 3154 (1-based 3155) = the nDelta==0 check, idx 3158 (1-based 3159) = RunWebBarMacro
if( lines[ 3154 ].indexOf( 'nDelta == 0' ) < 0 ) { console.log( 'anchor 3155 miss' ); process.exit( 1 ); }
if( lines[ 3158 ].indexOf( 'RunWebBarMacro' ) < 0 ) { console.log( 'anchor 3159 miss' ); process.exit( 1 ); }
const repl = [
	T3 + 'RECT rcView = { 0, 0, 0, 0 }, rcPrev = { 0, 0, 0, 0 };',
	T3 + 'GetClientRect( m_hwndView, &rcView );',
	T3 + 'int nWe = rcView.right - rcView.left;',
	T3 + 'int nWp = 0;',
	T3 + 'if( m_hwndPreviewHost && IsWindow( m_hwndPreviewHost ) ){',
	'\t\t\t\tGetClientRect( m_hwndPreviewHost, &rcPrev );',
	'\t\t\t\tnWp = rcPrev.right - rcPrev.left;',
	T3 + '}',
	T3 + 'double dScale = ( nWe > 0 && nWp > 0 ) ? (double)nWe / (double)nWp : 1.0;',
	T3 + 'const int nTarget = (int)( nY * m_nEditorLineCssPx * dScale );',
	T3 + 'if( nTarget == m_nLastSentTargetPx )  return;',
	T3 + 'm_nLastSentTargetPx = nTarget;',
	T3 + 'wsprintf( szMacro, L' + DQ + 'WebBar.scrollTo( 0, %d );' + DQ + ', nTarget );',
	T3 + 'RunWebBarMacro( szMacro );'
];
// replace idx 3155..3158 (1-based 3156-3159: the 4 delta lines) with repl
lines.splice( 3155, 4, ...repl );
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
const chk = fs.readFileSync( p, 'utf8' ).split( '\n' );
for( let n = 3152; n <= 3166; n++ ){ console.log( n + ': ' + ( chk[ n - 1 ] || 'EOF' ).replace( /\r$/, '' ).slice( 0, 110 ) ); }
