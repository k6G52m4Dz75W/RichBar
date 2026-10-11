// 0.44.0 patch: theme PICKER for the Markdown preview
// - built-in themes are DISCOVERED: every *.css in the DLL's themes\
//   subfolder is listed by its basename (paper-serif, vscode-markdown, ...)
// - the properties dialog gets a DROPDOWN (combo) "Markdown Preview CSS:"
//   listing: (Built-in theme), every discovered theme, "Custom CSS..."
//   Choosing Custom opens the file browser; the resolved absolute path is
//   remembered; choosing a built-in theme remembers its NAME
// - WritePreviewHtml resolves the selection: "name" -> themes\<name>.css
//   beside the DLL; absolute/custom path -> as-is; empty -> default
//   %APPDATA% preview.css; missing file -> built-in theme
// - persisted: PreviewCss keeps storing either a bare theme name or an
//   absolute custom path (one registry value, both formats readable)
// - label renamed "Markdown &Preview CSS:" (HTML preview has its own styles)
// - version 0.43.1 -> 0.44.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }
function patchUtf16( path, fn ) {
	const buf = fs.readFileSync( path );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE )  fail( 'BOM missing: ' + path );
	let s = buf.toString( 'utf16le' );
	const out = fn( s );
	if( out === null )  fail( 'patch refused: ' + path );
	fs.writeFileSync( path, Buffer.from( out, 'utf16le' ) );
}

// ---------- resource.h ----------
patchUtf16( ROOT + '/mui/RichBar_loce/resource.h', s => {
	if( s.includes( 'IDC_CSS_COMBO' ) ){ console.log( 'resource.h already patched - skip' ); return s; }
	const a = '#define IDC_CSS_EDIT                     1051';
	if( !s.includes( a ) )  return null;
	return s.replace( a, '#define IDC_CSS_COMBO                    1051\r\n#define IDC_CSS_BROWSE                   1052\r\n#define IDC_CSS_DEFAULT                  1053' );
} );
console.log( 'resource.h ok' );

// ---------- richbar_loce.rc ----------
patchUtf16( ROOT + '/mui/RichBar_loce/richbar_loce.rc', s => {
	if( s.includes( 'IDC_CSS_COMBO' ) )  fail( 'loce rc already patched' );
	const re1 = /LTEXT {11}"Preview &CSS:",IDC_STATIC,8,159,50,9/;
	if( !re1.test( s ) )  return null;
	s = s.replace( re1, 'LTEXT           "Markdown Preview &CSS:",IDC_STATIC,8,159,86,9' );
	const re2 = /EDITTEXT {8}IDC_CSS_EDIT,60,156,118,13,ES_AUTOHSCROLL \| WS_TABSTOP/;
	if( !re2.test( s ) )  return null;
	s = s.replace( re2, 'COMBOBOX        IDC_CSS_COMBO,60,156,118,120,CBS_DROPDOWNLIST | WS_TABSTOP' );
	return s;
} );
console.log( 'richbar_loce.rc patched (label + combo)' );

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'LoadPreviewThemes' ) )  fail( 'RichBar.h already patched' );

	// A: member — theme list + selected index for the combo
	const aA = '\tvector<tstring> m_vPreviewOffDocs;\t// documents whose preview the user explicitly turned OFF';
	if( !s.includes( aA ) )  fail( 'member anchor not found' );
	s = s.replace( aA, aA + '\r\n\tvector<tstring> m_vPreviewThemes;\t// discovered built-in themes (basenames, no extension)' );

	// B: discovery + path resolution helpers (before WritePreviewHtml)
	const aB = '\t// JSON/JS string escape for embedding the markdown source into the';
	if( !s.includes( aB ) )  fail( 'JsEscape anchor not found' );
	const nwB = [
		'\t// the DLL folder + subpath helper (themes\\xxx.css lives beside us)',
		'\tbool MakeThemePath( const tstring& sName, tstring& sPath )',
		'\t{',
		'\t\tTCHAR szDll[ MAX_PATH ];',
		'\t\tif( GetModuleFileName( EEGetInstanceHandle(), szDll, MAX_PATH ) == 0 ){',
		'\t\t\treturn false;',
		'\t\t}',
		'\t\tLPTSTR pEnd = szDll + lstrlen( szDll );',
		'\t\twhile( pEnd > szDll && pEnd[-1] != _T(\'\\\\\') )  pEnd--;',
		'\t\t*pEnd = 0;',
		'\t\tStringCat( szDll, MAX_PATH, _T("themes\\\\") );',
		'\t\tStringCat( szDll, MAX_PATH, sName.c_str() );',
		'\t\tStringCat( szDll, MAX_PATH, _T(".css") );',
		'\t\tif( GetFileAttributes( szDll ) == INVALID_FILE_ATTRIBUTES ){',
		'\t\t\treturn false;',
		'\t\t}',
		'\t\tsPath = szDll;',
		'\t\treturn true;',
		'\t}',
		'',
		'\t// discover the built-in themes: basenames of themes\\*.css',
		'\tvoid LoadPreviewThemes()',
		'\t{',
		'\t\tm_vPreviewThemes.clear();',
		'\t\tTCHAR szDll[ MAX_PATH ];',
		'\t\tif( GetModuleFileName( EEGetInstanceHandle(), szDll, MAX_PATH ) == 0 ){',
		'\t\t\treturn;',
		'\t\t}',
		'\t\tLPTSTR pEnd = szDll + lstrlen( szDll );',
		'\t\twhile( pEnd > szDll && pEnd[-1] != _T(\'\\\\\') )  pEnd--;',
		'\t\t*pEnd = 0;',
		'\t\tStringCat( szDll, MAX_PATH, _T("themes\\\\*.css") );',
		'\t\tWIN32_FIND_DATA wfd;',
		'\t\tHANDLE hFind = FindFirstFile( szDll, &wfd );',
		'\t\tif( hFind == INVALID_HANDLE_VALUE ){',
		'\t\t\treturn;',
		'\t\t}',
		'\t\tdo {',
		'\t\t\tif( ( wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY ) == 0 && wfd.cFileName[ 0 ] ){',
		'\t\t\t\ttstring sName( wfd.cFileName );',
		'\t\t\t\ttstring sExt = _T(".css");',
		'\t\t\t\tif( sName.size() > sExt.size() && sName.compare( sName.size() - sExt.size(), sExt.size(), sExt ) == 0 ){',
		'\t\t\t\t\tsName.erase( sName.size() - sExt.size() );',
		'\t\t\t\t\tm_vPreviewThemes.push_back( sName );',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t} while( FindNextFile( hFind, &wfd ) );',
		'\t\tFindClose( hFind );',
		'\t}',
		'',
		'\t// JSON/JS string escape for embedding the markdown source into the',
	].join( '\r\n' );
	s = s.replace( aB, nwB );

	// C: WritePreviewHtml — resolve the selection
	const aC = '\t\t\t\tif( !m_sPreviewCss.empty() ){';
	if( !s.includes( aC ) )  fail( 'css-path resolve anchor not found' );
	const nwC = [
		'\t\t\t\t// resolve the selection: bare NAME -> themes\\<name>.css;',
		'\t\t\t\t// absolute path -> as-is; empty -> the default preview.css',
		'\t\t\t\tif( !m_sPreviewCss.empty() ){',
		'\t\t\t\t\tif( m_sPreviewCss.find( _T(\'\\\\\') ) == tstring::npos && m_sPreviewCss.find( _T(\':\') ) == tstring::npos ){',
		'\t\t\t\t\t\ttstring sThemePath;',
		'\t\t\t\t\t\tif( MakeThemePath( m_sPreviewCss, sThemePath ) ){',
		'\t\t\t\t\t\t\tlstrcpyn( szCss, sThemePath.c_str(), MAX_PATH );',
		'\t\t\t\t\t\t}',
		'\t\t\t\t\t\telse {',
		'\t\t\t\t\t\t\tszCss[ 0 ] = 0;\t// theme vanished: no override',
		'\t\t\t\t\t\t}',
		'\t\t\t\t\t}',
		'\t\t\t\t\telse {',
		'\t\t\t\t\t\tlstrcpyn( szCss, m_sPreviewCss.c_str(), MAX_PATH );',
		'\t\t\t\t\t}',
		'\t\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aC, nwC );

	// D: property init — fill the combo
	const aD = '\t\tSetDlgItemText( hDlg, IDC_CSS_EDIT, m_sPreviewCss.c_str() );';
	if( !s.includes( aD ) )  fail( 'prop init combo anchor not found' );
	const nwD = [
		'\t\tLoadPreviewThemes();',
		'\t\tHWND hwndCss = GetDlgItem( hDlg, IDC_CSS_COMBO );',
		'\t\tComboBox_ResetContent( hwndCss );',
		'\t\tComboBox_AddString( hwndCss, _T("(Built-in theme)") );',
		'\t\tfor( size_t i = 0; i < m_vPreviewThemes.size(); i++ ){',
		'\t\t\tComboBox_AddString( hwndCss, m_vPreviewThemes[ i ].c_str() );',
		'\t\t}',
		'\t\tComboBox_AddString( hwndCss, _T("Custom CSS...") );',
		'\t\t// select the current entry',
		'\t\tint nSel = 0;',
		'\t\tif( m_sPreviewCss.empty() ){',
		'\t\t\tnSel = 0;',
		'\t\t}',
		'\t\telse if( m_sPreviewCss.find( _T(\'\\\\\') ) == tstring::npos && m_sPreviewCss.find( _T(\':\') ) == tstring::npos ){',
		'\t\t\tfor( size_t i = 0; i < m_vPreviewThemes.size(); i++ ){',
		'\t\t\t\tif( m_vPreviewThemes[ i ] == m_sPreviewCss ){ nSel = (int)i + 1; break; }',
		'\t\t\t}',
		'\t\t}',
		'\t\telse {',
		'\t\t\tnSel = (int)m_vPreviewThemes.size() + 1;\t// Custom CSS...',
		'\t\t}',
		'\t\tComboBox_SetCurSel( hwndCss, nSel );',
	].join( '\r\n' );
	s = s.replace( aD, nwD );

	// E: OK handler — read the combo selection
	const aE = [
		'\t\t\t{',
		'\t\t\t\tTCHAR szCssPath[ MAX_PATH ];',
		'\t\t\t\tGetDlgItemText( hDlg, IDC_CSS_EDIT, szCssPath, MAX_PATH );',
	].join( '\r\n' );
	if( !s.includes( aE ) )  fail( 'OK handler css anchor not found' );
	const nwE = [
		'\t\t\t{',
		'\t\t\t\tint nSel = (int)SendMessage( GetDlgItem( hDlg, IDC_CSS_COMBO ), CB_GETCURSEL, 0, 0 );',
		'\t\t\t\tif( nSel <= 0 ){',
		'\t\t\t\t\tm_sPreviewCss.clear();\t// built-in theme',
		'\t\t\t\t}',
		'\t\t\t\telse if( nSel <= (int)m_vPreviewThemes.size() ){',
		'\t\t\t\t\tm_sPreviewCss = m_vPreviewThemes[ nSel - 1 ];\t// bare theme name',
		'\t\t\t\t}',
		'\t\t\t\telse {',
		'\t\t\t\t\tTCHAR szCssPath[ MAX_PATH ];',
		'\t\t\t\t\tGetDlgItemText( hDlg, IDC_CSS_EDIT, szCssPath, MAX_PATH );',
		'\t\t\t\t\tm_sPreviewCss = szCssPath;\t// custom path',
		'\t\t\t\t}',
		'\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aE, nwE );

	// F: Browse — open on Custom selection (reads the custom path if any)
	const aF = '\t\t\tGetDlgItemText( hDlg, IDC_CSS_EDIT, szCssPath, MAX_PATH );\r\n\t\t\tOPENFILENAMEW ofn;';
	if( !s.includes( aF ) )  fail( 'Browse anchor not found' );
	const nwF = [
		'\t\t\tTCHAR szCssPath[ MAX_PATH ];',
		'\t\t\tGetDlgItemText( hDlg, IDC_CSS_EDIT, szCssPath, MAX_PATH );',
		'\t\t\tOPENFILENAMEW ofn;',
	].join( '\r\n' );
	s = s.replace( aF, nwF );

	// G: Browse OK writes back into the combo's Custom item + selects it
	const aG = '\t\t\tif( GetOpenFileNameW( &ofn ) ){\r\n\t\t\t\tSetDlgItemText( hDlg, IDC_CSS_EDIT, szCssPath );\r\n\t\t\t}';
	if( !s.includes( aG ) )  fail( 'Browse-OK anchor not found' );
	const nwG = [
		'\t\t\tif( GetOpenFileNameW( &ofn ) ){',
		'\t\t\t\tHWND hwndCss = GetDlgItem( hDlg, IDC_CSS_COMBO );',
		'\t\t\t\tint nCustom = (int)m_vPreviewThemes.size() + 1;',
		'\t\t\t\tComboBox_DeleteString( hwndCss, nCustom );',
		'\t\t\t\tComboBox_InsertString( hwndCss, nCustom, szCssPath );',
		'\t\t\t\tComboBox_SetCurSel( hwndCss, nCustom );',
		'\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aG, nwG );

	// H: Default button — select (Built-in theme)
	const aH = '\t\telse if( wParam == IDC_CSS_DEFAULT ){\r\n\t\t\tSetDlgItemText( hDlg, IDC_CSS_EDIT, _T("") );\r\n\t\t}';
	if( !s.includes( aH ) )  fail( 'Default anchor not found' );
	const nwH = '\t\telse if( wParam == IDC_CSS_DEFAULT ){\r\n\t\t\tComboBox_SetCurSel( GetDlgItem( hDlg, IDC_CSS_COMBO ), 0 );\r\n\t\t}';
	s = s.replace( aH, nwH );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,43,1,0' ) )  fail( 'rc does not read 0,43,1,0' );
	s = s.split( '0,43,1,0' ).join( '0,44,0,0' );
	s = s.split( '0.43.1' ).join( '0.44.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc version ----------
patchUtf16( ROOT + '/mui/RichBar_loce/richbar_loce.rc', s => {
	const re = /IDS_VERSION(\s+)"0\.43\.1"/;
	if( !re.test( s ) )  return null;
	return s.replace( re, 'IDS_VERSION$1"0.44.0"' );
} );
console.log( 'locale IDS_VERSION bumped' );

console.log( 'ALL PATCHES OK' );
