// brace-scan WritePreviewHtml (string-literal aware) to locate the imbalance
const fs = require( 'fs' );
const s = fs.readFileSync( 'E:/Projects/RichBar/RichBar/RichBar.h', 'utf8' );
const start = s.indexOf( 'void WritePreviewHtml()' );
let ln = 1;
for( let i = 0; i < start; i++ ){ if( s[ i ] === '\n' ) ln++; }
console.log( 'WritePreviewHtml starts at line', ln );
let depth = 0, line = ln;
const BQ = String.fromCharCode( 34 );	// "
for( let i = start; i < s.length; i++ ){
	const c = s[ i ];
	if( c === '\n' ) line++;
	if( c === '{' ){ depth++; if( line >= 3308 && line <= 3318 ) console.log( 'line', line, '{ depth', depth ); }
	if( c === '}' ){ depth--; if( line >= 3308 && line <= 3318 ) console.log( 'line', line, '} depth', depth ); if( depth < 0 ){ console.log( 'NEGATIVE at line', line ); break; } }
	if( c === BQ ){	// skip the string literal
		i++;
		while( i < s.length && s[ i ] !== BQ ){ i++; }
	}
	if( line > 3320 ) break;
}
console.log( 'scan ended at line', line, 'depth', depth );
