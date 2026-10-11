// 0.44.0 fixup2: IDC_CSS_EDIT no longer exists (combo replaced it) —
// the Browse/Custom branches must use m_sPreviewCss as the custom-path store
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
const T = n => '\t'.repeat( n );

// A: Browse branch — pre-fill from m_sPreviewCss (custom paths only)
const aA = T( 3 ) + 'TCHAR szCssPath[ MAX_PATH ];\n'
	+ T( 3 ) + 'GetDlgItemText( hDlg, IDC_CSS_EDIT, szCssPath, MAX_PATH );\n'
	+ T( 3 ) + 'OPENFILENAMEW ofn;';
if( !s.includes( aA ) ) { console.log( 'browse prefill anchor not found' ); process.exit( 1 ); }
const nwA = T( 3 ) + 'TCHAR szCssPath[ MAX_PATH ] = { 0 };\n'
	+ T( 3 ) + '// pre-fill with the current custom path, if one is set\n'
	+ T( 3 ) + 'if( !m_sPreviewCss.empty() && m_sPreviewCss.find( L\'\\\\\' ) != tstring::npos ){\n'
	+ T( 4 ) + 'lstrcpyn( szCssPath, m_sPreviewCss.c_str(), MAX_PATH );\n'
	+ T( 3 ) + '}\n'
	+ T( 3 ) + 'OPENFILENAMEW ofn;';
s = s.replace( aA, nwA );

// B: Browse-OK — remember the picked path immediately (OK persists it)
const aB = T( 3 ) + 'if( GetOpenFileNameW( &ofn ) ){\n'
	+ T( 4 ) + 'HWND hwndCss = GetDlgItem( hDlg, IDC_CSS_COMBO );\n'
	+ T( 4 ) + 'int nCustom = (int)m_vPreviewThemes.size() + 1;\n'
	+ T( 4 ) + 'ComboBox_DeleteString( hwndCss, nCustom );\n'
	+ T( 4 ) + 'ComboBox_InsertString( hwndCss, nCustom, szCssPath );\n'
	+ T( 4 ) + 'ComboBox_SetCurSel( hwndCss, nCustom );\n'
	+ T( 3 ) + '}';
if( !s.includes( aB ) ) { console.log( 'browse-ok anchor not found' ); process.exit( 1 ); }
const nwB = T( 3 ) + 'if( GetOpenFileNameW( &ofn ) ){\n'
	+ T( 4 ) + 'm_sPreviewCss = szCssPath;\t// remembered now; OK persists it\n'
	+ T( 4 ) + 'HWND hwndCss = GetDlgItem( hDlg, IDC_CSS_COMBO );\n'
	+ T( 4 ) + 'int nCustom = (int)m_vPreviewThemes.size() + 1;\n'
	+ T( 4 ) + 'ComboBox_DeleteString( hwndCss, nCustom );\n'
	+ T( 4 ) + 'ComboBox_InsertString( hwndCss, nCustom, szCssPath );\n'
	+ T( 4 ) + 'ComboBox_SetCurSel( hwndCss, nCustom );\n'
	+ T( 3 ) + '}';
s = s.replace( aB, nwB );

// C: OK Custom branch — the path is already in m_sPreviewCss
const aC = T( 4 ) + 'else {\n'
	+ T( 5 ) + 'TCHAR szCssPath[ MAX_PATH ];\n'
	+ T( 5 ) + 'GetDlgItemText( hDlg, IDC_CSS_EDIT, szCssPath, MAX_PATH );\n'
	+ T( 5 ) + 'm_sPreviewCss = szCssPath;\t// custom path\n'
	+ T( 4 ) + '}';
if( !s.includes( aC ) ) { console.log( 'ok custom anchor not found' ); process.exit( 1 ); }
s = s.replace( aC, T( 4 ) + 'else {\n'
	+ T( 5 ) + '// custom path: already stored by the Browse handler\n'
	+ T( 4 ) + '}' );

fs.writeFileSync( p, s, 'utf8' );
console.log( 'IDC_CSS_EDIT references eliminated' );
