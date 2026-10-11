// clean the pandoc theme header: add the real source URL, fix the mangled line
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/dist/themes/pandoc-default.css';
let s = fs.readFileSync( p, 'utf8' );
const lines = s.split( '\n' );
// find the garbled "(resolved from..." line (it holds the mangled \$ text)
let iGarbled = -1;
for( let i = 0; i < Math.min( lines.length, 8 ); i++ ){
	if( lines[ i ].indexOf( 'templated original' ) >= 0 ){ iGarbled = i; break; }
}
if( iGarbled >= 0 ){
	lines.splice( iGarbled, 1, '   (resolved from the ' + String.fromCharCode( 36 ) + 'if' + String.fromCharCode( 36 ) + '-templated original — re-resolve',
		'   with tools/make_pandoc_theme2.cjs when updating pandoc)' );
}
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( lines.slice( 0, 8 ).join( '\n' ) );
