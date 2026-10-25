// Faithful replica of the SHIPPED page renderer pipeline: wrap the REAL
// renderer methods exactly like the page does, then dump the anchor table.
const fs = require( 'fs' );
const m = require( 'E:/Projects/RichBar/RichBar/third_party/marked/marked.umd.min.js' );
const marked = m.marked || m;

const page = fs.readFileSync( 'C:/Users/yicki/AppData/Local/Temp/RichBarPreview.html', 'utf8' );
const mm = page.match( /window\.__md="([\s\S]*?)";\s*window\.__scrollRatio/ );
const md = JSON.parse( '"' + mm[1] + '"' );

const NL = String.fromCharCode( 10 );
const isList = new RegExp( '^\\s{0,3}([*+-]\\s|\\d{1,9}[.)]\\s)' );
const isQuote = new RegExp( '^\\s{0,3}>(\\s|$)' );
const isTable = new RegExp( '\\|' );
const isHr = new RegExp( '^\\s{0,3}([-*_])(\\s*\\1){2,}\\s*$' );
const isHead = new RegExp( '^\\s{0,3}#{1,6}\\s' );
const isCode = new RegExp( '^(\\s{4,}|\\t)' );
const isSetextH = new RegExp( '^={2,}\\s*$|^-{2,}\\s*$' );
function NormalizeSingleNewlines( s ) {
	window.__rbLineMap = [];
	const L = s.split( NL ), o = [];
	for ( let i = 0; i < L.length; i++ ) {
		const t = L[ i ]; let keep = false;
		if ( i > 0 ) {
			const pr = L[ i - 1 ];
			if ( isQuote.test( t ) || isTable.test( t ) || isHr.test( t ) || isHead.test( t ) ||
				isCode.test( t ) || isList.test( t ) || isCode.test( pr ) || isList.test( pr ) ||
				isTable.test( pr ) || isHr.test( pr ) || isSetextH.test( pr ) ) { keep = true; }
		}
		if ( !keep ) { o.push( '' ); window.__rbLineMap.push( i ); }
		o.push( t ); window.__rbLineMap.push( i );
	}
	return o.join( NL );
}
global.window = {};
const __nrm = NormalizeSingleNewlines( md );
const __src = __nrm;
const __rbTok = marked.lexer( __nrm );

const Q = '"';
let __cur = 0;
const __rd = new marked.Renderer();
[ 'heading', 'paragraph', 'code', 'blockquote', 'list', 'hr', 'table' ].forEach( function( k ) {
	const o = __rd[ k ].bind( __rd );
	__rd[ k ] = function() {
		const args = [].slice.call( arguments );
		let tok = null;
		for ( let j = 0; j < args.length; j++ ) {
			const a = args[ j ];
			if ( a && typeof a === 'object' && a.raw !== undefined ) { tok = a; break; }
		}
		const out = o.apply( null, args );
		let sl = 0;
		if ( tok && tok.raw ) {
			let i = __src.indexOf( tok.raw, __cur );
			if ( i < 0 ) { i = __src.indexOf( tok.raw ); }
			if ( i >= 0 ) {
				__cur = i + tok.raw.length;
				const nl = __src.slice( 0, i ).split( NL ).length - 1;
				sl = window.__rbLineMap && window.__rbLineMap[ nl ] !== undefined ? window.__rbLineMap[ nl ] : nl;
			}
		}
		const mo = out.match( /^<([a-z0-9]+)>/ );
		if ( mo ) { return out.replace( /^<([a-z0-9]+)>/, '<' + mo[1] + ' data-source-line=' + Q + sl + Q + '>' ); }
		return out;
	};
} );
const html = marked.parser( __rbTok, { renderer: __rd, gfm: true, breaks: true } );

const res = [ ...html.matchAll( /data-source-line="(\d+)"/g ) ].map( x => parseInt( x[1] ) );
console.log( 'anchors:', res.length, 'first:', res[0], 'last:', res[ res.length - 1 ] );
let mono = true, nonMono = 0;
for ( let i = 1; i < res.length; i++ ) if ( res[ i ] < res[ i - 1 ] ) { mono = false; nonMono++; }
console.log( 'monotonic:', mono, ' violations:', nonMono );
console.log( 'anchor l values (first 25):', res.slice( 0, 25 ).join( ',' ) );
console.log( 'anchor l values (last 10):', res.slice( -10 ).join( ',' ) );

// simulate the 0.65.6/0.65.7 page (no permille) with even block heights
const ys = []; let y = 0;
for ( let i = 0; i < res.length; i++ ) { ys.push( y ); y += 30; }
function pos( l ) {
	if ( l <= res[0] ) return 0;
	const n = res.length;
	if ( l >= res[ n - 1 ] ) return 'BOTTOM';
	let lo = 0, hi = n - 1;
	while ( hi - lo > 1 ) { const mid = ( lo + hi ) >> 1; if ( res[ mid ] <= l ) lo = mid; else hi = mid; }
	return Math.round( ys[ lo ] + ( ys[ hi ] - ys[ lo ] ) * ( l - res[ lo ] ) / ( res[ hi ] - res[ lo ] ) );
}
console.log( '--- sent value -> page y (max=' + ys[ ys.length - 1 ] + ') ---' );
[ 2, 30, 60, 90, 100, 110, 130, 150, 183, 199, 201 ].forEach( l =>
	console.log( '  L' + l + ' -> ' + pos( l ) + ( pos( l ) === 'BOTTOM' ? '  <-- clamp' : '' ) ) );
