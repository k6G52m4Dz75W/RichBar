// fix rewrite_onprop.cjs by LINE INDEX (the generator's elements hold
// literal backslash-t sequences that defeat text matching)
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/tools/rewrite_onprop.cjs';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );

// 1. the icon branch: SetDlgItemText -> CheckRadioButton + UpdateIconColorButton
let iSet = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].indexOf( 'SetDlgItemText( hDlg, IDC_BTN_ICON_COLOR, szColor )' ) >= 0 ){ iSet = i; break; }
}
if( iSet < 0 ) { console.log( 'icon line not found' ); process.exit( 1 ); }
const T4 = '\\' + 't'.repeat( 4 );	// literal \t\t\t\t as it appears in the file
lines.splice( iSet, 1,
	'\t' + JSON.stringify( T4 + 'CheckRadioButton( hDlg, IDC_RADIO_ICON_AUTO, IDC_RADIO_ICON_CUSTOM, IDC_RADIO_ICON_CUSTOM );' ) + ',',
	'\t' + JSON.stringify( T4 + 'UpdateIconColorButton( hDlg );' ) + ','
);
console.log( 'icon branch fixed (was line', iSet + 1, ')' );

// 2. the CUSTOMIZE branch before the function-close element (the last
//    element that is exactly \t} — a one-tab close)
let iClose = -1;
for( let i = lines.length - 1; i >= 0; i-- ){
	if( lines[ i ].indexOf( "'\\t}'" ) >= 0 ){ iClose = i; break; }
}
if( iClose < 0 ) { console.log( 'close element not found' ); process.exit( 1 ); }
const T2 = '\\' + 't'.repeat( 2 );
const T3 = '\\' + 't'.repeat( 3 );
lines.splice( iClose, 0,
	'\t' + JSON.stringify( T2 + 'else if( wParam == IDC_CUSTOMIZE ){' ) + ',',
	'\t' + JSON.stringify( T3 + 'OnCustomize( hDlg );' ) + ',',
	'\t' + JSON.stringify( T2 + '}' ) + ','
);
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'CUSTOMIZE branch inserted at line', iClose + 1 );
