// rewrite the CBN_SELCHANGE handler cleanly (deterministic, char-code escapes)
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
const start = s.indexOf( '\t\telse if( wParam == IDC_CSS_COMBO && HIWORD( wParam ) == CBN_SELCHANGE ){' );
const end = s.indexOf( '\t\telse if( wParam == IDC_CSS_DEFAULT ){' );
if( start < 0 || end < 0 || end <= start ) { console.log( 'SPAN MISS', start, end ); process.exit( 1 ); }
const T = n => String.fromCharCode( 9 ).repeat( n );
const Q = String.fromCharCode( 39 );      // '
const BS = String.fromCharCode( 92 );     // backslash
const lines = [
	T( 2 ) + 'else if( wParam == IDC_CSS_COMBO && HIWORD( wParam ) == CBN_SELCHANGE ){',
	T( 3 ) + 'int nSel = (int)SendMessage( GetDlgItem( hDlg, IDC_CSS_COMBO ), CB_GETCURSEL, 0, 0 );',
	T( 3 ) + 'const int nCustom = (int)m_vPreviewThemes.size() + 1;',
	T( 3 ) + 'if( nSel == nCustom ){',
	T( 4 ) + '// Custom picked: open the file browser immediately',
	T( 4 ) + 'TCHAR szCssPath[ MAX_PATH ] = { 0 };',
	T( 4 ) + 'if( !m_sPreviewCss.empty() && m_sPreviewCss.find( L' + Q + BS + BS + Q + ' ) != tstring::npos ){',
	T( 5 ) + 'lstrcpyn( szCssPath, m_sPreviewCss.c_str(), MAX_PATH );',
	T( 4 ) + '}',
	T( 4 ) + 'OPENFILENAMEW ofn;',
	T( 4 ) + 'ZeroMemory( &ofn, sizeof( ofn ) );',
	T( 4 ) + 'ofn.lStructSize = sizeof( ofn );',
	T( 4 ) + 'ofn.hwndOwner = hDlg;',
	T( 4 ) + 'ofn.lpstrFilter = L' + Q + 'CSS files (*.css)' + BS + '0*.css' + BS + '0All files (*.*)' + BS + '0*.*' + BS + '0' + Q + ';',
	T( 4 ) + 'ofn.lpstrFile = szCssPath;',
	T( 4 ) + 'ofn.nMaxFile = MAX_PATH;',
	T( 4 ) + 'ofn.Flags = OFN_FILEMUSTEXIST | OFN_HIDEREADONLY;',
	T( 4 ) + 'ofn.lpstrDefExt = L' + Q + 'css' + Q + ';',
	T( 4 ) + 'if( GetOpenFileNameW( &ofn ) ){',
	T( 5 ) + 'm_sPreviewCss = szCssPath;' + '\t' + '// remembered now; OK persists it',
	T( 5 ) + 'HWND hwndCss = GetDlgItem( hDlg, IDC_CSS_COMBO );',
	T( 5 ) + 'ComboBox_DeleteString( hwndCss, nCustom );',
	T( 5 ) + 'ComboBox_InsertString( hwndCss, nCustom, szCssPath );',
	T( 5 ) + 'ComboBox_SetCurSel( hwndCss, nCustom );',
	T( 4 ) + '}',
	T( 4 ) + 'else {',
	T( 5 ) + '// canceled: restore the selection the current setting implies',
	T( 5 ) + 'int nBack = 0;',
	T( 5 ) + 'if( !m_sPreviewCss.empty() ){',
	T( 6 ) + 'nBack = (int)m_vPreviewThemes.size() + 1;',
	T( 6 ) + 'for( size_t i = 0; i < m_vPreviewThemes.size(); i++ ){',
	T( 7 ) + 'if( m_vPreviewThemes[ i ] == m_sPreviewCss ){ nBack = (int)i + 1; break; }',
	T( 6 ) + '}',
	T( 5 ) + '}',
	T( 5 ) + 'ComboBox_SetCurSel( GetDlgItem( hDlg, IDC_CSS_COMBO ), nBack );',
	T( 4 ) + '}',
	T( 3 ) + '}',
	T( 2 ) + '}',
];
fs.writeFileSync( p, s.slice( 0, start ) + lines.join( '\r\n' ) + '\r\n' + s.slice( end ), 'utf8' );
console.log( 'SELCHANGE handler rewritten cleanly (' + lines.length + ' lines)' );
