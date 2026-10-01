// 0.33.3 patch: GetDocTextAll must not render clipboard content as the
// document (observed at startup: empty untitled doc -> Copy is a no-op ->
// the clipboard kept the user's copied text and the preview rendered it)
// - verify the Copy actually happened via GetClipboardSequenceNumber()
// - no-op Copy + empty document -> feed an empty page, clipboard untouched
// - clipboard text restore only when our Copy really replaced it
// - version 0.33.2 -> 0.33.3
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'GetClipboardSequenceNumber' ) )  fail( 'already patched' );

	const aA = 'bool GetDocTextAll( tstring& sText )\r\n\t{';
	const iA = s.indexOf( aA );
	if( iA < 0 )  fail( 'GetDocTextAll head anchor not found' );
	const aAend = '\tvoid ServeBufferResponse';
	const iAend = s.indexOf( aAend, iA );
	if( iAend < 0 )  fail( 'GetDocTextAll end anchor not found' );

	const nwA = [
		'bool GetDocTextAll( tstring& sText )\r\n\t{',
		'\t\t// whole-document read via SelectAll + Copy (single-shot; the per-line',
		'\t\t// EE_GET_LINE loop proved display-indexed in wrapped documents).',
		'\t\t// The user\'s selection/caret is saved first and restored at the end.',
		'\t\t// The CLIPBOARD text is saved too and restored at the end: the',
		'\t\t// SelectAll+Copy below clobbers it, and auto-refresh fires while',
		'\t\t// the user is editing (other clipboard formats are lost either',
		'\t\t// way - Copy replaces everything - but the text comes back)',
		'\t\ttstring sClipSave;',
		'\t\tif( OpenClipboard( m_hWnd ) ){',
		'\t\t\tHANDLE hClip = GetClipboardData( CF_UNICODETEXT );',
		'\t\t\tif( hClip ){',
		'\t\t\t\tLPCWSTR pClip = (LPCWSTR)GlobalLock( hClip );',
		'\t\t\t\tif( pClip ){',
		'\t\t\t\t\tsClipSave = pClip;',
		'\t\t\t\t\tGlobalUnlock( hClip );',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t\tCloseClipboard();',
		'\t\t}',
		'\t\tPOINT_PTR ptSaveA = { -1, -1 }, ptSaveB = { -1, -1 };',
		'\t\tPOINT_PTR ptA, ptB;',
		'\t\tEditor_GetSelStart( m_hWnd, POS_LOGICAL_W, &ptA );',
		'\t\tEditor_GetSelEnd( m_hWnd, POS_LOGICAL_W, &ptB );',
		'\t\tif( Editor_GetSelTypeEx( m_hWnd, TRUE ) & SEL_TYPE_SELECTED ){',
		'\t\t\tptSaveA = ptA;',
		'\t\t\tptSaveB = ptB;',
		'\t\t}',
		'\t\telse {',
		'\t\t\tEditor_GetCaretPos( m_hWnd, POS_LOGICAL_W, &ptSaveA );',
		'\t\t\tptSaveB = ptSaveA;',
		'\t\t}',
		'\t\t// if the Copy is a no-op (EMPTY document - nothing selected) the',
		'\t\t// clipboard keeps WHATEVER the user had there; trusting it would',
		'\t\t// render clipboard content as the document (observed at startup:',
		'\t\t// the preview showed the user\'s copied text with no file open)',
		'\t\tDWORD nSeqBefore = GetClipboardSequenceNumber();',
		'\t\tSendMessage( m_hWnd, WM_COMMAND, MAKEWPARAM( EEID_EDIT_SELECT_ALL, 0 ), 0 );',
		'\t\tSendMessage( m_hWnd, WM_COMMAND, MAKEWPARAM( EEID_EDIT_COPY, 0 ), 0 );',
		'\t\tconst bool bCopied = GetClipboardSequenceNumber() != nSeqBefore;',
		'\t\tbool bOK = false;',
		'\t\tif( bCopied && OpenClipboard( m_hWnd ) ){',
		'\t\t\tHANDLE h = GetClipboardData( CF_UNICODETEXT );',
		'\t\t\tif( h ){',
		'\t\t\t\tLPCWSTR psz = (LPCWSTR)GlobalLock( h );',
		'\t\t\t\tif( psz ){',
		'\t\t\t\t\tsText = psz;',
		'\t\t\t\t\tbOK = true;',
		'\t\t\t\t\tGlobalUnlock( h );',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t\tCloseClipboard();',
		'\t\t}',
		'\t\t// restore the user\'s selection/caret (select-all left it expanded)',
		'\t\tEditor_SetCaretPosEx( m_hWnd, POS_LOGICAL_W, &ptSaveA, FALSE );',
		'\t\tEditor_SetCaretPosEx( m_hWnd, POS_LOGICAL_W, &ptSaveB, ( ptSaveB.x != ptSaveA.x || ptSaveB.y != ptSaveA.y ) ? TRUE : FALSE );',
		'\t\tif( !bCopied ){',
		'\t\t\t// empty document: feed an empty page so the preview clears',
		'\t\t\t// instead of showing stale or clipboard content',
		'\t\t\tsText.clear();',
		'\t\t\tbOK = true;',
		'\t\t\tRbLogF( "doc empty: preview cleared" );',
		'\t\t}',
		'\t\telse if( !sClipSave.empty() && OpenClipboard( m_hWnd ) ){',
		'\t\t\t// restore the user\'s clipboard text (we are the owner now; other',
		'\t\t\t// formats were already destroyed by the Copy above)',
		'\t\t\tEmptyClipboard();',
		'\t\t\tHGLOBAL hClipNew = GlobalAlloc( GMEM_MOVEABLE, ( sClipSave.size() + 1 ) * sizeof( WCHAR ) );',
		'\t\t\tif( hClipNew ){',
		'\t\t\t\tLPVOID pClipNew = GlobalLock( hClipNew );',
		'\t\t\t\tif( pClipNew ){',
		'\t\t\t\t\tCopyMemory( pClipNew, sClipSave.c_str(), ( sClipSave.size() + 1 ) * sizeof( WCHAR ) );',
		'\t\t\t\t\tGlobalUnlock( hClipNew );',
		'\t\t\t\t\tSetClipboardData( CF_UNICODETEXT, hClipNew );\t// system owns it on success',
		'\t\t\t\t}',
		'\t\t\t\telse {',
		'\t\t\t\t\tGlobalFree( hClipNew );',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t\tCloseClipboard();',
		'\t\t}\r\n\t\treturn bOK;\r\n\t}\r\n\r\n',
	].join( '\r\n' );
	s = s.slice( 0, iA ) + nwA + s.slice( iAend );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,33,2,0' ) )  fail( 'rc does not read 0,33,2,0' );
	s = s.split( '0,33,2,0' ).join( '0,33,3,0' );
	s = s.split( '0.33.2' ).join( '0.33.3' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.33\.2"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.33.2' );
	s = s.replace( re, 'IDS_VERSION$1"0.33.3"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
