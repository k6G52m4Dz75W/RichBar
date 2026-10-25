// definitive sim v3 — regexes built ONLY via charCode patterns (no escaping layers at all)
const fs = require( 'fs' );
const lines = fs.readFileSync( 'E:/Projects/RichBar/RichBar/RichBar.h', 'utf8' ).split( '\n' );
const DQ = String.fromCharCode( 34 );
function extract( i ){ const l = lines[ i ]; const a = l.indexOf( 'L' + DQ ) + 2; const b = l.lastIndexOf( DQ + ';' ); return l.slice( a, b ); }
const iN = lines.findIndex( l => l.includes( 'function NormalizeSingleNewlines' ) );
const iR = lines.findIndex( l => l.includes( 'data-source-line' ) && l.includes( 'forEach' ) );
const normJs = extract( iN );
const rendJs = extract( iR );

globalThis.window = { __rbLineMap: null };
const NL = String.fromCharCode( 10 );
const BS = String.fromCharCode( 92 );

// the page's real regexes, rebuilt as strings with explicit BS chars:
const isQuote  = new RegExp( '^' + BS + 's{0,3}>(' + BS + 's|$)' );
const isTable  = new RegExp( BS + '|' );                    // literal pipe
const isHr     = new RegExp( '^' + BS + 's{0,3}([-*_])(' + BS + 's*' + BS + '1){2,}' + BS + 's*$' );
const isHead   = new RegExp( '^' + BS + 's{0,3}#{1,6}' + BS + 's' );
const isCode   = new RegExp( '^(' + BS + 's{4,}|' + BS + 't)' );
const isList   = new RegExp( '^' + BS + 's{0,3}([*+-]' + BS + 's|' + BS + 'd{1,9}[.)]' + BS + 's)' );
const isSetextH= new RegExp( '^={2,}' + BS + 's*$|^-{2,}' + BS + 's*$' );

console.log( 'isTable plain para:', isTable.test( 'para1' ), '| pipe table:', isTable.test( '|a|b|' ) );

// eslint-disable-next-line no-eval
eval( normJs.replace( 'function NormalizeSingleNewlines', 'globalThis.__norm = function NormalizeSingleNewlines' ) );
const orig = '# t' + NL + 'para1' + NL + 'para2' + NL + 'para3' + NL + '# end';
const norm = __norm( orig );
const rows = norm.split( NL );
console.log( 'orig:', orig.split( NL ).length, '| norm rows:', rows.length, '| map:', window.__rbLineMap.length );
rows.forEach( ( r, i ) => console.log( i, JSON.stringify( r ), '->', window.__rbLineMap[ i ] ) );

const mk = require( 'E:/Projects/RichBar/dist/marked.umd.min.js' );
const marked = mk.marked || mk;
var __src = norm;
var __rd = new marked.Renderer();
new Function( '__rd', '__src', rendJs + '; return __rd;' )( __rd, __src );
const html = marked.parser( marked.lexer( norm ), { renderer: __rd, gfm: true, breaks: true } );
console.log( '--- anchors (target: 0, 1, 2, 3, 4) ---' );
console.log( html.split( '\n' ).filter( l => l.includes( 'data-source-line' ) ).join( '\n' ) );
