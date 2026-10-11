// 0.50.2 v2: apply both fixes with exact line-index surgery
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );

// A: log after the ratio computation (idx 33 is 1-based 3334)
const iA = lines.findIndex( l => l.indexOf( 'dScrollRatio = (double)ptScroll.y' ) >= 0 );
if( iA < 0 ) { console.log( 'A anchor miss' ); process.exit( 1 ); }
const T5 = '\t'.repeat( 5 );
lines.splice( iA + 1, 0,
	T5 + 'RbLogF( "scroll sync: y=%u lines=%u ratio=%.4f", (unsigned)ptScroll.y, (unsigned)nLines, dScrollRatio );'
);
console.log( 'A applied at line', iA + 2 );

// B: replace the restore statement (now one line later) with load+retry
const iB = lines.findIndex( l => l.indexOf( "if(typeof window.__scrollRatio==='number')" ) >= 0 );
if( iB < 0 ) { console.log( 'B anchor miss' ); process.exit( 1 ); }
const T4 = '\t'.repeat( 4 );
lines.splice( iB, 1,
	T4 + 'sHtml += L"function __rbRestore(){if(typeof window.__scrollRatio===\'number\'){var h=document.body.scrollHeight-window.innerHeight;if(h>0){window.scrollTo(0,window.__scrollRatio*h);}}}";',
	T4 + 'sHtml += L"window.addEventListener(\'load\',function(){__rbRestore();setTimeout(__rbRestore,100);setTimeout(__rbRestore,400);});";',
	T4 + 'sHtml += L"__rbRestore();";'
);
console.log( 'B applied at line', iB + 1 );

fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( '0.50.2 code patches applied' );
