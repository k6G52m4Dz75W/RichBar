// robust: locate the delta block by CONTENT (after OnScrollerPoll), splice
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
const DQ = String.fromCharCode( 34 );
const T2 = '\t\t';
const T3 = '\t\t\t';
const T4 = '\t\t\t\t';

// 1. find the OnScrollerPoll function start
let iFn = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].indexOf( 'void OnScrollerPoll' ) >= 0 ){ iFn = i; break; }
}
if( iFn < 0 ) { console.log( 'fn not found' ); process.exit( 1 ); }

// 2. find the delta block within the next 40 lines
let iStart = -1, iEnd = -1;
for( let i = iFn; i < iFn + 40 && i < lines.length; i++ ){
	if( iStart < 0 && lines[ i ].indexOf( 'if( nDelta == 0 )  return;' ) >= 0 )  iStart = i;
	if( iStart >= 0 && lines[ i ].indexOf( 'RunWebBarMacro( szMacro );' ) >= 0 ){ iEnd = i; break; }
}
if( iStart < 0 || iEnd < 0 ) { console.log( 'delta block not found', iStart, iEnd ); process.exit( 1 ); }
console.log( 'delta block: lines', iStart + 1, '-', iEnd + 1 );
console.log( 'first:', JSON.stringify( lines[ iStart ].slice( 0, 80 ) ) );
console.log( 'last:', JSON.stringify( lines[ iEnd ].slice( 0, 80 ) ) );

const repl = [
	T3 + 'RECT rcView = { 0, 0, 0, 0 }, rcPrev = { 0, 0, 0, 0 };',
	T3 + 'GetClientRect( m_hwndView, &rcView );',
	T3 + 'int nWe = rcView.right - rcView.left;',
	T3 + 'int nWp = 0;',
	T3 + 'if( m_hwndPreviewHost && IsWindow( m_hwndPreviewHost ) ){',
	T4 + 'GetClientRect( m_hwndPreviewHost, &rcPrev );',
	T4 + 'nWp = rcPrev.right - rcPrev.left;',
	T3 + '}',
	T3 + 'double dScale = ( nWe > 0 && nWp > 0 ) ? (double)nWe / (double)nWp : 1.0;',
	T3 + 'const int nTarget = (int)( nY * m_nEditorLineCssPx * dScale );',
	T3 + 'if( nTarget == m_nLastSentTargetPx )  return;',
	T3 + 'm_nLastSentTargetPx = nTarget;',
	T3 + 'wsprintf( szMacro, L' + DQ + 'WebBar.scrollTo( 0, %d );' + DQ + ', nTarget );',
	T3 + 'RunWebBarMacro( szMacro );'
];
lines.splice( iStart, iEnd - iStart + 1, ...repl );
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'spliced OK' );
