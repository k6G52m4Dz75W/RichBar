// Diagnose why the shipped page built only 8 anchors for a 200-line doc.
// Runs the EXACT page normalize + real marked.lexer on the REAL __md.
const fs = require( 'fs' );
const m = require( 'E:/Projects/RichBar/RichBar/third_party/marked/marked.umd.min.js' );
const marked = m.marked || m;

const page = fs.readFileSync( 'C:/Users/yicki/AppData/Local/Temp/RichBarPreview.html', 'utf8' );
const mm = page.match( /window\.__md="([\s\S]*?)";\s*window\.__scrollRatio/ );
if ( !mm ) { console.log( 'NO __md MATCH' ); process.exit( 1 ); }
const md = JSON.parse( '"' + mm[1] + '"' );

// ---- exact copies of the page regexes (from the shipped HTML) ----
const NL = String.fromCharCode( 10 );
const isList = new RegExp( '^\\s{0,3}([*+-]\\s|\\d{1,9}[.)]\\s)' );
const isQuote = new RegExp( '^\\s{0,3}>(\\s|$)' );
const isTable = new RegExp( '\\|' );
const isHr = new RegExp( '^\\s{0,3}([-*_])(\\s*\\1){2,}\\s*$' );
const isHead = new RegExp( '^\\s{0,3}#{1,6}\\s' );
const isCode = new RegExp( '^(\\s{4,}|\\t)' );
const isSetextH = new RegExp( '^={2,}\\s*$|^-{2,}\\s*$' );

const checks = {
	list: t => isList.test( t ), quote: t => isQuote.test( t ), table: t => isTable.test( t ),
	hr: t => isHr.test( t ), head: t => isHead.test( t ), code: t => isCode.test( t ),
	setext: t => isSetextH.test( t ),
};

const L = md.split( NL ), o = [], lineMap = [];
const keepHit = [];	// per output decision: which check fired
for ( let i = 0; i < L.length; i++ ) {
	const t = L[ i ]; let keep = false, why = '';
	if ( i > 0 ) {
		const pr = L[ i - 1 ];
		for ( const name of [ 'quote', 'table', 'hr', 'head', 'code', 'list' ] ) {
			if ( checks[ name ]( t ) ) { keep = true; why = name + ':t'; break; }
		}
		if ( !keep ) for ( const name of [ 'code', 'list', 'table', 'hr', 'setext' ] ) {
			if ( checks[ name ]( pr ) ) { keep = true; why = name + ':pr'; break; }
		}
	}
	if ( keep ) keepHit.push( why );
	if ( !keep ) { o.push( '' ); lineMap.push( i ); }
	o.push( t ); lineMap.push( i );
}
const __nrm = o.join( NL );
console.log( 'orig lines:', L.length, ' normalized lines:', o.length, ' kept(broke):', keepHit.length );

// which check fires most on CURRENT lines?
const cnt = {};
for ( const w of keepHit ) { const k = w.split( ':' )[ 0 ] + ':' + w.split( ':' )[ 1 ]; cnt[ k ] = ( cnt[ k ] || 0 ) + 1; }
console.log( 'keep reasons:', JSON.stringify( cnt ) );

const toks = marked.lexer( __nrm );
console.log( 'lexer tokens:', toks.length );
const kinds = {};
toks.forEach( t => kinds[ t.type ] = ( kinds[ t.type ] || 0 ) + 1 );
console.log( 'token kinds:', JSON.stringify( kinds ) );
toks.slice( 0, 10 ).forEach( ( t, i ) =>
	console.log( '  tok', i, t.type, JSON.stringify( t.raw.slice( 0, 36 ) ) ) );
console.log( '  ...' );
toks.slice( -3 ).forEach( ( t, i ) =>
	console.log( '  tok-', t.type, JSON.stringify( t.raw.slice( 0, 36 ) ) ) );

// biggest token = the collapse
let big = toks[ 0 ];
for ( const t of toks ) if ( t.raw.length > big.raw.length ) big = t;
console.log( 'biggest token: type=' + big.type, 'rawLen=' + big.raw.length,
	'newlinesInRaw=' + ( big.raw.split( NL ).length - 1 ),
	'first40=' + JSON.stringify( big.raw.slice( 0, 40 ) ) );
