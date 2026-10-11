// surgical fix: the C2-injected block has missing \t indents and a
// missing \\" before ; on the scrollRatio/parse lines. Replace the whole
// garbled span (from the injected <script> down to the parse line) with
// clean lines.
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
const lines = s.split( '\n' );

const iStart = lines.findIndex( l => l.indexOf( 'TCHAR szRatio[ 64 ];' ) >= 0 );
const iEnd = lines.findIndex( l => l.indexOf( "marked.parse(NormalizeSingleNewlines" ) >= 0 );
if( iStart < 0 || iEnd < 0 || iEnd <= iStart ) { console.log( 'SPAN MISS', iStart, iEnd ); process.exit( 1 ); }

const T = n => '\t'.repeat( n );
const replacement = [
	T( 4 ) + 'TCHAR szRatio[ 64 ];',
	T( 4 ) + 'StringPrintf( szRatio, _countof( szRatio ), _T("%.4f"), dScrollRatio );',
	T( 4 ) + 'tstring sRatio = szRatio;',
	T( 4 ) + 'sHtml += L"window.__scrollRatio=" + sRatio + L";";',
	T( 4 ) + 'sHtml += L"\\";document.getElementById(\'content\').innerHTML=marked.parse(NormalizeSingleNewlines(window.__md),{breaks:true,gfm:true});"',
	T( 4 ) + 'sHtml += L"if(typeof window.__scrollRatio===\'number\'){var h=document.body.scrollHeight-window.innerHeight;window.scrollTo(0,window.__scrollRatio*h);}";',
].join( '\r\n' );
lines.splice( iStart, iEnd - iStart + 1, replacement );
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'span cleaned:', iStart + 1, '-', iEnd + 1 );
