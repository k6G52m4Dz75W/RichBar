// definitive simulation from a file (no bash escaping layers)
const fs = require( 'fs' );
const lines = fs.readFileSync( 'E:/Projects/RichBar/RichBar/RichBar.h', 'utf8' ).split( '\n' );
const DQ = String.fromCharCode( 34 );
function extract( i ){ const l = lines[ i ]; const a = l.indexOf( 'L' + DQ ) + 2; const b = l.lastIndexOf( DQ + ';' ); return l.slice( a, b ); }
const iN = lines.findIndex( l => l.includes( 'function NormalizeSingleNewlines' ) );
const iR = lines.findIndex( l => l.includes( 'data-source-line' ) && l.includes( 'forEach' ) );
const normJs = extract( iN );
const rendJs = extract( iR );

// browser-like globals
globalThis.window = { __rbLineMap: null };
const NL = String.fromCharCode( 10 );
const isQuote  = new RegExp( '^\\s{0,3}>(\\s|$)' );
const isTable  = new RegExp( '\\|' );
const isHr     = new RegExp( '^\\s{0,3}([-*_])(\\s*\\1){2,}\\s*$' );
const isHead   = new RegExp( '^\\s{0,3}#{1,6}\\s' );
const isCode   = new RegExp( '^(\\s{4,}|\\t)' );
const isList   = new RegExp( '^\\s{0,3}([*+-]\\s|\\d{1,9}[.)]\\s)' );
const isSetextH= new RegExp( '^={2,}\\s*$|^-{2,}\\s*$' );
// eslint-disable-next-line no-eval
eval( normJs.replace( 'function NormalizeSingleNewlines', 'globalThis.__norm = function NormalizeSingleNewlines' ) );

const orig = '# t\npara1\npara2\npara3\n# end';
const norm = __norm( orig );
const rows = norm.split( NL );
console.log( 'orig lines:', orig.split( NL ).length, '| norm rows:', rows.length, '| map len:', window.__rbLineMap.length );
rows.forEach( ( r, i ) => console.log( i, JSON.stringify( r ), '-> map', window.__rbLineMap[ i ] ) );

// renderer end-to-end
const mk = require( 'E:/Projects/RichBar/dist/marked.umd.min.js' );
const marked = mk.marked || mk;
var __src = norm;
var __rd = new marked.Renderer();
new Function( '__rd', '__src', rendJs + '; return __rd;' )( __rd, __src );
const html = marked.parser( marked.lexer( norm ), { renderer: __rd, gfm: true, breaks: true } );
console.log( '--- anchors (must be ORIGINAL line numbers) ---' );
console.log( html.split( '\n' ).filter( l => l.includes( 'data-source-line' ) ).join( '\n' ) );
