// fix both pszText lines precisely by index
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );

// 1. locate the broken document.Text line (around 1987)
let iDoc = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].indexOf( 'wsProbe' ) >= 0 && lines[ i ].indexOf( 'document.Text' ) >= 0 ){ iDoc = i; break; }
	if( lines[ i ].indexOf( 'return document.Text;' ) >= 0 && lines[ i ].indexOf( 'rmi.pszText' ) >= 0 ){ iDoc = i; break; }
}
// the broken block is: wsProbe line (split across 2-3 lines) then wsProbe += / rmi.pszText
// find the rmi.pszText = wsProbe.c_str(); line after iDoc
let iPs = -1;
for( let i = iDoc; i < iDoc + 6 && i < lines.length; i++ ){
	if( lines[ i ].indexOf( 'rmi.pszText = wsProbe.c_str();' ) >= 0 ){ iPs = i; break; }
}
if( iDoc < 0 || iPs < 0 ){ console.log( 'doc block not found', iDoc, iPs ); process.exit( 1 ); }
// replace lines iDoc..iPs with the single correct line
const T3 = '\t'.repeat( 3 );
lines.splice( iDoc, iPs - iDoc + 1,
	T3 + 'rmi.pszText = L' + String.fromCharCode( 34 ) + '#language=' + String.fromCharCode( 92, 34 ) + 'V8' + String.fromCharCode( 92, 34 ) + String.fromCharCode( 92 ) + 'nreturn document.Text;' + String.fromCharCode( 34 ) + ';'
);
console.log( 'document.Text line restored at', iDoc + 1 );

// 2. the probe concatenation (the second broken site, now shifted)
let iProbe = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].indexOf( 'L' + String.fromCharCode( 34 ) + '#language=' ) >= 0 && lines[ i ].indexOf( 'szProbe' ) >= 0 && lines[ i ].indexOf( '+' ) >= 0 ){ iProbe = i; break; }
}
if( iProbe >= 0 ){
	// find the following two lines (wsProbe += / rmi.pszText) and collapse
	const T3 = '\t'.repeat( 3 );
	lines.splice( iProbe, 1,
		T3 + 'std::wstring wsProbe = std::wstring( L' + String.fromCharCode( 34 ) + '#language=' + String.fromCharCode( 92, 34 ) + 'V8' + String.fromCharCode( 92, 34 ) + String.fromCharCode( 92 ) + 'n' + String.fromCharCode( 34 ) + ' ) + szProbe;',
		T3 + 'rmi.pszText = wsProbe.c_str();'
	);
	console.log( 'probe concat fixed at', iProbe + 1 );
}
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'both fixed' );
