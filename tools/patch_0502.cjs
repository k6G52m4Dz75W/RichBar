// 0.50.2: make the preview scroll restore actually run + log the ratio inputs
// 1. the scroll restore moves INSIDE a load handler + a 250ms retry:
//    browsers restore/reset scroll at navigation completion which can
//    override a scrollTo issued mid-parse
// 2. RbLogF the ratio inputs (ptScroll.y, nLines, ratio) so the units are
//    verifiable from the log
// - version 0.50.1 -> 0.50.2
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );

// A: log the ratio inputs at computation time
{
	const a = [
		'\t\t\t\tif( nLines > 1 ){',
		'\t\t\t\t\tdScrollRatio = (double)ptScroll.y / (double)( nLines - 1 );',
	].join( '\r\n' );
	if( !s.includes( a ) ) { console.log( 'A anchor miss' ); process.exit( 1 ); }
	const nw = [
		'\t\t\t\tif( nLines > 1 ){',
		'\t\t\t\t\tdScrollRatio = (double)ptScroll.y / (double)( nLines - 1 );',
		'\t\t\t\t\tRbLogF( "scroll sync: y=%u lines=%u ratio=%.4f", (unsigned)ptScroll.y, (unsigned)nLines, dScrollRatio );',
	].join( '\r\n' );
	s = s.replace( a, nw );
}

// B: replace the scroll-restore statement with a load+retry version
const old = '\t\t\tsHtml += L"if(typeof window.__scrollRatio===\'number\'){var h=document.body.scrollHeight-window.innerHeight;window.scrollTo(0,window.__scrollRatio*h);}";';
if( !s.includes( old ) ) { console.log( 'B anchor miss' ); process.exit( 1 ); }
const nw = [
	'\t\t\tsHtml += L"function __rbRestore(){if(typeof window.__scrollRatio===\'number\'){var h=document.body.scrollHeight-window.innerHeight;if(h>0){window.scrollTo(0,window.__scrollRatio*h);}}}";',
	'\t\t\tsHtml += L"window.addEventListener(\'load\',function(){__rbRestore();setTimeout(__rbRestore,100);setTimeout(__rbRestore,400);});";',
	'\t\t\tsHtml += L"__rbRestore();";',
].join( '\r\n' );
s = s.replace( old, nw );

fs.writeFileSync( p, s, 'utf8' );
console.log( '0.50.2 patches applied' );
