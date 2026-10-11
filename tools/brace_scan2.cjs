// brace-scan OnPropCommand (string-aware)
const fs = require( 'fs' );
const s = fs.readFileSync( 'E:/Projects/RichBar/RichBar/RichBar.h', 'utf8' );
const start = s.indexOf( 'void OnPropCommand' );
let ln = 1;
for( let i = 0; i < start; i++ ){ if( s[ i ] === '\n' ) ln++; }
console.log( 'OnPropCommand starts at line', ln );
let depth = 0, line = ln;
const BQ = String.fromCharCode( 34 );
for( let i = start; i < s.length && line <= 4050; i++ ){
	const c = s[ i ];
	if( c === '\n' ) line++;
	if( c === '{' ){ depth++; if( line >= 3990 ) console.log( line, '{ depth', depth ); }
	if( c === '}' ){ depth--; if( line >= 3990 ) console.log( line, '} depth', depth ); if( depth < 0 ){ console.log( 'NEGATIVE at', line ); break; } }
	if( c === BQ ){ i++; while( i < s.length && s[ i ] !== BQ ){ i++; } }
}
