// brace-depth scan of WritePreviewHtml (string-aware) to find the imbalance
const fs = require( 'fs' );
const s = fs.readFileSync( 'E:/Projects/RichBar/RichBar/RichBar.h', 'utf8' );
const start = s.indexOf( 'bool GetDocTextAll' );
const stop = s.indexOf( 'void WritePreviewHtml' );	// well past WritePreviewHtml
let depth = 0, line = 1;
const BQ = String.fromCharCode( 34 );
for( let i = 0; i < stop; i++ ){
	const c = s[ i ];
	if( c === '\n' ) line++;
	if( c === BQ ){ i++; while( i < s.length && s[ i ] !== BQ ){ i++; } continue; }
	if( c === '{' ){ depth++; if( line >= 1990 && line <= 3130 ) console.log( line, '{', depth ); }
	if( c === '}' ){ depth--; if( line >= 3120 && line <= 3420 ) console.log( line, '}', depth ); }
}
console.log( 'final depth at LoadConfigArray:', depth );
