// 0.42.0 patch: Preview CSS file selectable in the plug-in properties
// - dialog: "Preview CSS:" label + edit box + "Browse..." + "Default"
//   (empty = the built-in default location), dialog grows 177 -> 199 dlu
// - persisted as PreviewCss (registry string)
// - WritePreviewHtml: user path when set, else the default
//   %APPDATA%\...\preview.css
// - version 0.41.0 -> 0.42.0
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

// ---------- resource.h (UTF-16LE) ----------
patchUtf16( ROOT + '/mui/RichBar_loce/resource.h', s => {
	if( s.includes( 'IDC_CSS_EDIT' ) )  fail( 'resource.h already patched' );
	const a = '#define IDC_BTN_ICON_COLOR               1050';
	if( !s.includes( a ) )  return null;
	return s.replace( a, a + '\r\n#define IDC_CSS_EDIT                     1051\r\n#define IDC_CSS_BROWSE                   1052\r\n#define IDC_CSS_DEFAULT                  1053' );
} );
console.log( 'resource.h patched' );

// ---------- richbar_loce.rc (UTF-16LE dialog template) ----------
patchUtf16( ROOT + '/mui/RichBar_loce/richbar_loce.rc', s => {
	if( s.includes( 'IDC_CSS_EDIT' ) )  fail( 'loce rc already patched' );
	const re = /IDD_PROP DIALOGEX 0, 0, 248, 177/;
	if( !re.test( s ) )  return null;
	s = s.replace( re, 'IDD_PROP DIALOGEX 0, 0, 248, 199' );
	const aBtn = 'PUSHBUTTON      "&Customize Buttons...",IDC_CUSTOMIZE,28,156,98,14';
	if( !s.includes( aBtn ) )  return null;
	const reBtn = /PUSHBUTTON {6}"&Customize Buttons\.\.\.",IDC_CUSTOMIZE,28,156,98,14/;
	if( !reBtn.test( s ) )  return null;
	// move the bottom row down 22 dlu and insert the CSS row above it
	s = s.replace( reBtn, 'PUSHBUTTON      "&Customize Buttons...",IDC_CUSTOMIZE,28,178,98,14' );
	s = s.replace( /DEFPUSHBUTTON {3}"OK",IDOK,132,156,50,14/, 'DEFPUSHBUTTON   "OK",IDOK,132,178,50,14' );
	s = s.replace( /PUSHBUTTON {6}"Cancel",IDCANCEL,188,156,50,14/, 'PUSHBUTTON      "Cancel",IDCANCEL,188,178,50,14' );
	const insert = [
		'LTEXT           "Preview &CSS:",IDC_STATIC,8,159,50,9',
		'EDITTEXT        IDC_CSS_EDIT,60,156,118,13,ES_AUTOHSCROLL | WS_TABSTOP',
		'PUSHBUTTON      "&Browse...",IDC_CSS_BROWSE,180,156,60,13',
		'PUSHBUTTON      "D&efault",IDC_CSS_DEFAULT,60,178,50,14',
	].join( '\r\n' );
	s = s.replace( 'PUSHBUTTON      "&Customize Buttons...",IDC_CUSTOMIZE,28,178,98,14', insert + '\r\n        PUSHBUTTON      "&Customize Buttons...",IDC_CUSTOMIZE,28,178,98,14' );
	return s;
} );
console.log( 'richbar_loce.rc patched' );

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'm_sPreviewCss' ) )  fail( 'RichBar.h already patched' );

	// A: member
	const aA = '\ttstring m_sPreviewUrl;\t\t// staged preview URL';
	if( !s.includes( aA ) )  fail( 'member anchor not found' );
	s = s.replace( aA, aA + '\r\n\ttstring m_sPreviewCss;\t\t// user-selected preview CSS file (empty = default location)' );

	// B: LoadProfile / SaveProfile
	const aB = '\t\t\tm_bPreviewOn = !!GetProfileInt( _T("PreviewOn"), FALSE );';
	if( !s.includes( aB ) )  fail( 'LoadProfile anchor not found' );
	s = s.replace( aB, aB + '\r\n\t\t\t{' + [
		'\t\t\t\tTCHAR szCssPath[ MAX_PATH ];',
		'\t\t\t\tGetProfileString( _T("PreviewCss"), szCssPath, _countof( szCssPath ), _T("") );',
		'\t\t\t\tm_sPreviewCss = szCssPath;',
	'\t\t\t}',
	].join( '\r\n' ) );
	const aC = "\t\t\tWriteProfileString( _T(\"PreviewDocsOff\"), sOff.c_str() );";
	if( !s.includes( aC ) )  fail( 'SaveProfile anchor not found' );
	s = s.replace( aC, aC + '\r\n\t\t\tWriteProfileString( _T("PreviewCss"), m_sPreviewCss.c_str() );' );

	// D: WritePreviewHtml — user path first, default second
	const aD = '\t\t\t// USER THEME: %APPDATA%';
	const iD = s.indexOf( aD );
	if( iD < 0 )  fail( 'USER THEME comment anchor not found' );
	const nwD = [
		'\t\t\t// USER THEME: the configured preview CSS file (properties dialog)',
		'\t\t\t// or, when empty, %APPDATA%\\Emurasoft\\EmEditor\\RichBar\\preview.css',
	].join( '\r\n' );
	s = s.slice( 0, iD ) + nwD + s.slice( iD + aD.length );

	const aE = [
		'\t\t\t{',
		'\t\t\t\tTCHAR szCss[ MAX_PATH ];',
		'\t\t\t\tif( SUCCEEDED( SHGetFolderPathW( NULL, CSIDL_APPDATA, NULL, 0, szCss ) ) ){',
		'\t\t\t\t\twcscat_s( szCss, MAX_PATH, L"\\\\Emurasoft\\\\EmEditor\\\\RichBar" );',
		'\t\t\t\t\tSHCreateDirectoryExW( NULL, szCss, NULL );\t// no-op if exists',
		'\t\t\t\t\twcscat_s( szCss, MAX_PATH, L"\\\\preview.css" );',
	].join( '\r\n' );
	if( !s.includes( aE ) )  fail( 'css-path block anchor not found' );
	const nwE = [
		'\t\t\t{',
		'\t\t\t\tTCHAR szCss[ MAX_PATH ];',
		'\t\t\t\tif( !m_sPreviewCss.empty() ){',
		'\t\t\t\t\tlstrcpyn( szCss, m_sPreviewCss.c_str(), MAX_PATH );',
		'\t\t\t\t}',
		'\t\t\t\telse if( SUCCEEDED( SHGetFolderPathW( NULL, CSIDL_APPDATA, NULL, 0, szCss ) ) ){',
		'\t\t\t\t\twcscat_s( szCss, MAX_PATH, L"\\\\Emurasoft\\\\EmEditor\\\\RichBar" );',
		'\t\t\t\t\tSHCreateDirectoryExW( NULL, szCss, NULL );\t// no-op if exists',
		'\t\t\t\t\twcscat_s( szCss, MAX_PATH, L"\\\\preview.css" );',
	].join( '\r\n' );
	s = s.replace( aE, nwE );

	// E: property dialog init — fill the edit box
	const aF = '\t\tTCHAR szText[40];\r\n\t\tLoadString( EEGetLocaleInstanceHandle(), IDS_CONFIGS, szText, _countof( szText ) );';
	if( !s.includes( aF ) )  fail( 'prop init anchor not found' );
	s = s.replace( aF, '\t\tSetDlgItemText( hDlg, IDC_CSS_EDIT, m_sPreviewCss.c_str() );\r\n' + aF );

	// F: OK handler — persist the edit box
	const aG = '\t\t\tm_bCustomIconColor = IsDlgButtonChecked( hDlg, IDC_RADIO_ICON_CUSTOM ) ? true : false;\r\n\r\n\t\t\tm_AutoConfigArray.clear();';
	if( !s.includes( aG ) )  fail( 'OK handler anchor not found' );
	const nwG = [
		'\t\t\tm_bCustomIconColor = IsDlgButtonChecked( hDlg, IDC_RADIO_ICON_CUSTOM ) ? true : false;',
		'\t\t\t{',
		'\t\t\t\tTCHAR szCssPath[ MAX_PATH ];',
		'\t\t\t\tGetDlgItemText( hDlg, IDC_CSS_EDIT, szCssPath, MAX_PATH );',
		'\t\t\t\t// trim quotes (Explorer "Copy as path") and spaces',
		'\t\t\t\tTCHAR* a = szCssPath;',
		'\t\t\t\twhile( *a == _T(\' \') || *a == _T(\'"\') )  a++;',
		'\t\t\t\tTCHAR* b = a + lstrlen( a );',
		'\t\t\t\twhile( b > a && ( b[-1] == _T(\' \') || b[-1] == _T(\'"\') ) )  b--;',
		'\t\t\t\t*b = 0;',
		'\t\t\t\tm_sPreviewCss = a;',
		'\t\t\t}',
		'',
		'\t\t\tm_AutoConfigArray.clear();',
	].join( '\r\n' );
	s = s.replace( aG, nwG );

	// G: Browse/Default commands in OnPropCommand
	const aH = '\t\telse if( wParam == IDCANCEL ){\r\n\t\t\tEndDialog( hDlg, IDCANCEL );\r\n\t\t}';
	if( !s.includes( aH ) )  fail( 'IDCANCEL anchor not found' );
	const nwH = [
		'\t\telse if( wParam == IDC_CSS_BROWSE ){',
		'\t\t\tTCHAR szCssPath[ MAX_PATH ];',
		'\t\t\tGetDlgItemText( hDlg, IDC_CSS_EDIT, szCssPath, MAX_PATH );',
		'\t\t\tOPENFILENAMEW ofn;',
		'\t\t\tZeroMemory( &ofn, sizeof( ofn ) );',
		'\t\t\tofn.lStructSize = sizeof( ofn );',
		'\t\t\tofn.hwndOwner = hDlg;',
		'\t\t\tofn.lpstrFilter = L"CSS files (*.css)\\0*.css\\0All files (*.*)\\0*.*\\0";',
		'\t\t\tofn.lpstrFile = szCssPath;',
		'\t\t\tofn.nMaxFile = MAX_PATH;',
		'\t\t\tofn.Flags = OFN_FILEMUSTEXIST | OFN_HIDEREADONLY;',
		'\t\t\tofn.lpstrDefExt = L"css";',
		'\t\t\tif( GetOpenFileNameW( &ofn ) ){',
		'\t\t\t\tSetDlgItemText( hDlg, IDC_CSS_EDIT, szCssPath );',
		'\t\t\t}',
		'\t\t}',
		'\t\telse if( wParam == IDC_CSS_DEFAULT ){',
		'\t\t\tSetDlgItemText( hDlg, IDC_CSS_EDIT, _T("") );',
		'\t\t}',
		'\t\telse if( wParam == IDCANCEL ){',
		'\t\t\tEndDialog( hDlg, IDCANCEL );',
		'\t\t}',
	].join( '\r\n' );
	s = s.replace( aH, nwH );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,41,0,0' ) )  fail( 'rc does not read 0,41,0,0' );
	s = s.split( '0,41,0,0' ).join( '0,42,0,0' );
	s = s.split( '0.41.0' ).join( '0.42.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc version (UTF-16LE) ----------
patchUtf16( ROOT + '/mui/RichBar_loce/richbar_loce.rc', s => {
	const re = /IDS_VERSION(\s+)"0\.41\.0"/;
	if( !re.test( s ) )  return null;
	return s.replace( re, 'IDS_VERSION$1"0.42.0"' );
} );
console.log( 'locale IDS_VERSION bumped' );

console.log( 'ALL PATCHES OK' );
