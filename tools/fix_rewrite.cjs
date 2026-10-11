// fix rewrite_onprop.cjs by LINE indices (no big-text matching):
// 1. the icon branch uses CheckRadioButton + UpdateIconColorButton (not SetDlgItemText)
// 2. the CUSTOMIZE branch must precede the function's closing brace
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/tools/rewrite_onprop.cjs';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );

// find the SetDlgItemText line inside the icon branch
let iSet = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].includes( 'SetDlgItemText( hDlg, IDC_BTN_ICON_COLOR, szColor )' ) ){ iSet = i; break; }
}
if( iSet < 0 ) { console.log( 'SetDlgItemText line not found' ); process.exit( 1 ); }
lines.splice( iSet, 1,
	String.fromCharCode( 9, 9, 9, 9 ) + 'CheckRadioButton( hDlg, IDC_RADIO_ICON_AUTO, IDC_RADIO_ICON_CUSTOM, IDC_RADIO_ICON_CUSTOM );',
	String.fromCharCode( 9, 9, 9, 9 ) + 'UpdateIconColorButton( hDlg );'
);
console.log( 'icon branch fixed at line', iSet + 1 );

// find the final closing of the function: the LAST line that is exactly TAB+'}' before module.exports
let iClose = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].trim() === '' && i + 1 < lines.length && lines[ i + 1 ].startsWith( '].join(' ) ){ /* ignore */ }
}
for( let i = lines.length - 1; i >= 0; i-- ){
	if( lines[ i ] === '\t}' ){ iClose = i; break; }
}
if( iClose < 0 ) { console.log( 'function close not found' ); process.exit( 1 ); }
const T2 = String.fromCharCode( 9, 9 );
lines.splice( iClose, 0,
	T2 + 'else if( wParam == IDC_CUSTOMIZE ){',
	T2 + String.fromCharCode( 9 ) + 'OnCustomize( hDlg );',
	T2 + '}'
);
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'CUSTOMIZE branch inserted before function close at line', iClose + 1 );
