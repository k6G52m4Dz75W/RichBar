// fix the nbResolved line in patch_0500.cjs (chained-call bug)
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/tools/patch_0500.cjs';
let lines = fs.readFileSync( p, 'utf8' ).split( '\n' );
let idx = -1;
for( let i = 0; i < lines.length; i++ ){
	if( lines[ i ].indexOf( 'nbResolved = nb.' ) >= 0 ){ idx = i; break; }
}
if( idx < 0 ) { console.log( 'line not found' ); process.exit( 1 ); }
const DOLLAR = String.fromCharCode( 36 );
lines[ idx ] = '\tconst nbResolved = nb.split( "' + DOLLAR + 'RATIO' + DOLLAR + '" ).join( \'" + sRatio + "\' );';
fs.writeFileSync( p, lines.join( '\n' ), 'utf8' );
console.log( 'fixed line', idx + 1 );
