// 0.61.1: diagnostics for the proportional sync — log the exact editor
// scroll inputs on every sync write so the unit semantics (logical vs
// display lines for pt.y / GetLines / PAGE_SIZE.cy) can be verified from
// one scroll-to-bottom pass
// - version 0.61.0 -> 0.61.1
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'scroll sync inputs' ) ) { console.log( 'already patched' ); process.exit( 1 ); }

// add the log line before the sync file write
{
	const a = '\t\tRbLogF( ' + Q + 'scroll sync: ratio=%.4f' + Q + ', dRatio );';
	if( !s.includes( a ) ){ console.log( 'anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, '\t\tRbLogF( ' + Q + 'scroll sync inputs: y=%d lines=%u page=%d ratio=%.4f' + Q + ', nY, (unsigned)nLines, (int)sizePage.cy, dRatio );\r\n' + a );
}

// version 0.61.0 -> 0.61.1
{
	const rc = 'E:/Projects/RichBar/RichBar/RichBar.rc';
	let r = fs.readFileSync( rc, 'utf8' );
	if( !r.includes( '0,60,0,0' ) ){ console.log( 'rc miss' ); process.exit( 1 ); }
	r = r.split( '0,60,0,0' ).join( '0,61,1,0' );
	r = r.split( '0.61.0' ).join( '0.61.1' );
	fs.writeFileSync( rc, r, 'utf8' );
	const loc = 'E:/Projects/RichBar/RichBar/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( loc );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE ){ console.log( 'BOM miss' ); process.exit( 1 ); }
	let t = buf.toString( 'utf16le' );
	t = t.replace( /IDS_VERSION(\s+)"0\.61\.0"/, ( m, sp ) => 'IDS_VERSION' + sp + '"0.61.1"' );
	fs.writeFileSync( loc, Buffer.from( t, 'utf16le' ) );
	console.log( 'versioned 0.61.1' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
