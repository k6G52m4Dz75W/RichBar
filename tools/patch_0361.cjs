// 0.36.1 patch:
// - font fallback: insert 'Microsoft YaHei' right after the editor font so
//   CJK text renders as YaHei (matching the editor) instead of the system
//   fallback; a user-selected CJK font stays first and unaffected
// - unsaved-document pressed state: persist title keys too (EmEditor
//   restores untitled docs reusing their titles, so the state follows);
//   removes the 0.23.3-era backslash filter from load AND save
// - version 0.36.0 -> 0.36.1
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'Microsoft YaHei' ) )  fail( 'already patched' );

	// A: CJK fallback in the preview font stack
	const aA = 'wsprintf( szCss, _T("body{font-family:\'%s\',Segoe UI,Arial,sans-serif;font-size:%dpx;"), (LPCWSTR)lfView.lfFaceName, (unsigned)nPx );';
	if( !s.includes( aA ) )  fail( 'font wsprintf anchor not found' );
	s = s.replace( aA, 'wsprintf( szCss, _T("body{font-family:\'%s\',\'Microsoft YaHei\',Segoe UI,Arial,sans-serif;font-size:%dpx;"), (LPCWSTR)lfView.lfFaceName, (unsigned)nPx );' );

	// B: LoadProfile — keep title keys as well
	const aB = [
		'\t\t\t\t// per-document preview memory (path keys only - untitled',
		'\t\t\t\t// names are reused across sessions, so they stay',
		'\t\t\t\t// session-scope)',
		'\t\t\t\tTCHAR szDocs[ 4096 ];',
		'\t\t\t\tGetProfileString( _T("PreviewDocs"), szDocs, _countof( szDocs ), _T("") );',
		'\t\t\t\tTCHAR* pszCtx = NULL;',
		'\t\t\t\tTCHAR* pszTok = wcstok_s( szDocs, _T("\\n"), &pszCtx );',
		'\t\t\t\twhile( pszTok ){',
		'\t\t\t\t\tif( wcschr( pszTok, _T(\'\\\\\') ) != NULL ){',
		'\t\t\t\t\t\tm_vPreviewDocs.push_back( pszTok );',
		'\t\t\t\t\t}',
		'\t\t\t\t\tpszTok = wcstok_s( NULL, _T("\\n"), &pszCtx );',
		'\t\t\t\t}',
	].join( '\r\n' );
	if( !s.includes( aB ) )  fail( 'LoadProfile PreviewDocs anchor not found' );
	const nwB = [
		'\t\t\t\t// per-document preview memory (path keys AND untitled title',
		'\t\t\t\t// keys: EmEditor restores untitled docs reusing their titles,',
		'\t\t\t\t// so the pressed state follows them across sessions)',
		'\t\t\t\tTCHAR szDocs[ 4096 ];',
		'\t\t\t\tGetProfileString( _T("PreviewDocs"), szDocs, _countof( szDocs ), _T("") );',
		'\t\t\t\tTCHAR* pszCtx = NULL;',
		'\t\t\t\tTCHAR* pszTok = wcstok_s( szDocs, _T("\\n"), &pszCtx );',
		'\t\t\t\twhile( pszTok ){',
		'\t\t\t\t\tm_vPreviewDocs.push_back( pszTok );',
		'\t\t\t\t\tpszTok = wcstok_s( NULL, _T("\\n"), &pszCtx );',
		'\t\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aB, nwB );

	// C: SaveProfile — persist all keys
	const aC = [
		'\t\t\t// persist the per-document preview memory (path keys only)',
		'\t\t\ttstring sDocs;',
		'\t\t\tfor( size_t i = 0; i < m_vPreviewDocs.size(); i++ ){',
		'\t\t\t\tif( m_vPreviewDocs[ i ].find( _T(\'\\\\\') ) == tstring::npos ){',
		'\t\t\t\t\tcontinue;',
		'\t\t\t\t}',
		'\t\t\t\tif( !sDocs.empty() ){',
		'\t\t\t\t\tsDocs += _T("\\n");',
		'\t\t\t\t}',
		'\t\t\t\tsDocs += m_vPreviewDocs[ i ];',
		'\t\t\t}',
	].join( '\r\n' );
	if( !s.includes( aC ) )  fail( 'SaveProfile PreviewDocs anchor not found' );
	const nwC = [
		'\t\t\t// persist the per-document preview memory (path keys AND',
		'\t\t\t// untitled title keys - see LoadProfile)',
		'\t\t\ttstring sDocs;',
		'\t\t\tfor( size_t i = 0; i < m_vPreviewDocs.size(); i++ ){',
		'\t\t\t\tif( !sDocs.empty() ){',
		'\t\t\t\t\tsDocs += _T("\\n");',
		'\t\t\t\t}',
		'\t\t\t\tsDocs += m_vPreviewDocs[ i ];',
		'\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aC, nwC );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,36,0,0' ) )  fail( 'rc does not read 0,36,0,0' );
	s = s.split( '0,36,0,0' ).join( '0,36,1,0' );
	s = s.split( '0.36.0' ).join( '0.36.1' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.36\.0"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.36.0' );
	s = s.replace( re, 'IDS_VERSION$1"0.36.1"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
