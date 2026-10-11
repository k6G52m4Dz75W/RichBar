// 0.45.0 v2: resolve pandoc's template syntax PROPERLY (nested
// $if/$else/$endif with a real environment), producing a standalone CSS
const fs = require( 'fs' );
let tpl = fs.readFileSync( 'E:/Projects/RichBar/RichBar/third_party/pandoc/styles.html', 'utf8' );
tpl = tpl.replace( /^\/\*[^\n]*\n\*[^\n]*\n/, '' );	// drop the header comment

// environment: which pandoc variables are "on"
const env = {
	'document-css': true,
	'quotes': false,
	'citations': false,
	'link-citations': false,
	'math': false,
	'csi': false,
	'table-caption-below': false,
	'multicol': false,
	'code-copy': false,	// not referenced, safe default
	'mainfont': '', 'fontsize': '', 'linestretch': '', 'fontcolor': '',
	'backgroundcolor': '', 'linkcolor': '', 'monofont': '', 'monobackgroundcolor': '',
};

// recursive resolver over the template string
function resolve( t, forced ){
	// find the innermost $if(...)$...$endif$ and resolve it; repeat
	const re = /\$if\(([a-z-]+)\)\$/;
	let m;
	while( ( m = re.exec( t ) ) !== null ){
		const name = m[ 1 ];
		const start = m.index;
		const val = forced !== undefined ? forced : ( env[ name ] === true || ( typeof env[ name ] === 'string' && env[ name ] !== '' ) );
		// find the matching $endif$ (nested ifs are rare in this template but handle depth)
		let depth = 1, i = start + m[ 0 ].length, end = -1, elseAt = -1;
		while( i < t.length ){
			const ifm = /\$if\([a-z-]+\)\$|\$endif\$|\$else\$/.exec( t.slice( i ) );
			if( !ifm )  break;
			const tok = ifm[ 0 ], at = i + ifm.index;
			if( tok.startsWith( '$if' ) )  depth++;
			else if( tok === '$endif$' ){ depth--; if( depth === 0 ){ end = at; break; } }
			else if( tok === '$else$' && depth === 1 && elseAt < 0 ){ elseAt = at; }
			i = at + tok.length;
		}
		if( end < 0 ) { console.error( 'unbalanced $if for', name ); process.exit( 1 ); }
		const body = t.slice( start + m[ 0 ].length, elseAt < 0 ? end : elseAt );
		const elseBody = elseAt < 0 ? '' : t.slice( elseAt + '$else$'.length, end );
		const replacement = val ? body : elseBody;
		t = t.slice( 0, start ) + replacement + t.slice( end + '$endif$'.length );
	}
	// substitute remaining $var$ tokens
	return t.replace( /\$([a-z-]+)\$/g, ( mm, name ) => {
		const v = env[ name ];
		if( v === undefined )  return '';
		return v === true ? 'true' : ( v === false ? '' : v );
	} );
}

let css = resolve( tpl );

// tidy: collapse blank runs, trim
css = css.replace( /\n{3,}/g, '\n\n' ).trim() + '\n';

// prepend attribution
const head = [
	'/* pandoc default styles (adapted from pandoc data/templates/styles.html,',
	'   jgm/pandoc, GPL-2.0-or-later; resolved to a standalone CSS theme).',
	'   light-dark() pairs follow the browser dark/light preference',
	'   automatically. */',
	'',
].join( '\n' );
css = head + css;

fs.writeFileSync( 'E:/Projects/RichBar/dist/themes/pandoc-default.css', css, 'utf8' );
const open = ( css.match( /\{/g ) || [] ).length, close = ( css.match( /\}/g ) || [] ).length;
console.log( 'written', css.length, 'bytes | braces:', open, '/', close, '| leftover $:', ( css.match( /\$/g ) || [] ).length, '| light-dark pairs:', ( css.match( /light-dark\(/g ) || [] ).length );
