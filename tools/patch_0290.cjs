// 0.29.0 patch: refresh preview via EE_RUN_MACRO + WebBar.Open
// - WritePreviewHtml: stable %TEMP%\RichBarPreview.html (no EEW*.htm scan)
// - CMD_REFRESH_PREVIEW: in-memory JScript WebBar.Open(file:///...?t=<tick>)
// - versions: RichBar.rc 0.28.4 -> 0.29.0, locale IDS_VERSION 0.25.0 -> 0.29.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h (utf8, CRLF) ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'WebBar.Open' ) )  fail( 'RichBar.h already patched' );

	// --- WritePreviewHtml tail: EEW overwrite -> stable file ---
	const a1 = '\t\t// write over the NEWEST EEW*.htm (the pane is showing it)';
	const i1 = s.indexOf( a1 );
	if( i1 < 0 )  fail( 'WritePreviewHtml EEW anchor not found' );
	const e1Anchor = '\t\tRbLogF( "feed: wrote %u bytes html", cbW );\r\n';
	const i1e = s.indexOf( e1Anchor, i1 );
	if( i1e < 0 )  fail( 'WritePreviewHtml end anchor not found' );
	const newTail = [
		'\t\t// write to a STABLE temp file: every refresh rewrites it and',
		'\t\t// re-navigates the built-in Web bar to it (WebBar.Open) - the',
		'\t\t// path never changes, only the content does',
		'\t\tTCHAR szPath[ MAX_PATH ];',
		'\t\tGetTempPath( MAX_PATH, szPath );',
		'\t\tStringCat( szPath, MAX_PATH, _T("RichBarPreview.html") );',
		'\t\tint cb = WideCharToMultiByte( CP_UTF8, 0, sHtml.c_str(), (int)sHtml.size(), NULL, 0, NULL, NULL );',
		'\t\tHANDLE hFile = CreateFile( szPath, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, 0, NULL );',
		'\t\tif( hFile == INVALID_HANDLE_VALUE ){',
		'\t\t\tRbLogF( "preview write FAILED (%s)", szPath );',
		'\t\t\treturn;',
		'\t\t}',
		'\t\tDWORD cbW = 0;',
		'\t\tconst BYTE bom[3] = { 0xEF, 0xBB, 0xBF };',
		'\t\tWriteFile( hFile, bom, 3, &cbW, NULL );',
		'\t\tif( cb > 0 ){',
		'\t\t\tCHAR* psz = (CHAR*)malloc( cb );',
		'\t\t\tif( psz ){',
		'\t\t\t\tWideCharToMultiByte( CP_UTF8, 0, sHtml.c_str(), (int)sHtml.size(), psz, cb, NULL, NULL );',
		'\t\t\t\tWriteFile( hFile, psz, cb, &cbW, NULL );',
		'\t\t\t\tfree( psz );',
		'\t\t\t}',
		'\t\t}',
		'\t\tCloseHandle( hFile );',
		'\t\tRbLogF( "preview write: %u bytes -> %s", (unsigned)cbW, szPath );\r\n',
	].join( '\r\n' );
	s = s.slice( 0, i1 ) + newTail + s.slice( i1e + e1Anchor.length );

	// --- CMD_REFRESH_PREVIEW branch: EE_RUN_MACRO + WebBar.Open ---
	const a2 = '\t\t\t\telse if( cmd.m_iCmd == CMD_REFRESH_PREVIEW ){';
	const i2 = s.indexOf( a2 );
	if( i2 < 0 )  fail( 'refresh branch anchor not found' );
	const SET = 'SetTimer( m_hDlg, IDT_WEB_NAVIGATE, 300, NULL );';
	const i2t = s.indexOf( SET, i2 );
	if( i2t < 0 )  fail( 'SetTimer anchor not found' );
	const tail2 = '\r\n\t\t\t\t}\r\n\t\t\t}';
	if( s.slice( i2t + SET.length, i2t + SET.length + tail2.length ) !== tail2 ) {
		fail( 'refresh branch end structure unexpected' );
	}
	const newBranch = [
		'\t\t\t\telse if( cmd.m_iCmd == CMD_REFRESH_PREVIEW ){',
		'\t\t\t\t\t// render the CURRENT buffer into the stable preview file and',
		'\t\t\t\t\t// re-navigate the built-in Web bar to it through the WebBar',
		'\t\t\t\t\t// macro object (EE_RUN_MACRO, in-memory JScript): Open()',
		'\t\t\t\t\t// re-navigates on every click and the ?t= stamp makes each',
		'\t\t\t\t\t// URL unique so the browser never shows a cached page',
		'\t\t\t\t\tWritePreviewHtml();',
		'\t\t\t\t\tTCHAR szPath[ MAX_PATH ];',
		'\t\t\t\t\tGetTempPath( MAX_PATH, szPath );',
		'\t\t\t\t\tStringCat( szPath, MAX_PATH, _T("RichBarPreview.html") );',
		'\t\t\t\t\tfor( LPTSTR p = szPath; *p; p++ ){',
		'\t\t\t\t\t\tif( *p == _T(\'\\\\\') )  *p = _T(\'/\');',
		'\t\t\t\t\t}',
		'\t\t\t\t\ttstring sUrl = _T("file:///");',
		'\t\t\t\t\tUrlAppendEncoded( sUrl, szPath, true );',
		'\t\t\t\t\tTCHAR szTick[ 32 ];',
		'\t\t\t\t\twsprintf( szTick, _T("?t=%u"), GetTickCount() );',
		'\t\t\t\t\tsUrl += szTick;',
		'\t\t\t\t\ttstring sMacro = _T("WebBar.Visible = true; WebBar.Open( \\"");',
		'\t\t\t\t\tsMacro += sUrl;',
		'\t\t\t\t\tsMacro += _T("\\" );");',
		'\t\t\t\t\tRUN_MACRO_INFO rmi;',
		'\t\t\t\t\tZeroMemory( &rmi, sizeof( rmi ) );',
		'\t\t\t\t\trmi.cbSize = sizeof( rmi );',
		'\t\t\t\t\trmi.pszText = sMacro.c_str();',
		'\t\t\t\t\trmi.nDefMacroLang = MACRO_LANG_JSCRIPT;',
		'\t\t\t\t\tHRESULT hrMacro = (HRESULT)SendMessage( m_hWnd, EE_RUN_MACRO, 0, (LPARAM)&rmi );',
		'\t\t\t\t\tRbLogF( "webbar open hr=0x%08X: %s", (unsigned)hrMacro, sUrl.c_str() );',
		'\t\t\t\t}\r\n\t\t\t}',
	].join( '\r\n' );
	s = s.slice( 0, i2 ) + newBranch + s.slice( i2t + SET.length + tail2.length );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,28,4,0' ) )  fail( 'rc does not read 0,28,4,0' );
	s = s.split( '0,28,4,0' ).join( '0,29,0,0' );
	s = s.split( '0.28.4' ).join( '0.29.0' );
	if( s.includes( '0.28.4' ) || s.includes( '0,28,4' ) )  fail( 'rc still has old version' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE, keep BOM) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.25\.0"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at expected 0.25.0' );
	s = s.replace( re, 'IDS_VERSION$1"0.29.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
