// 0.45.0: convert pandoc's styles.html template into themes/pandoc-default.css
// - resolve $if(var)$ conditionals with sensible defaults (document-css on,
//   no mainfont/fontsize overrides -> browser defaults; our bridge still
//   injects the editor font via --markdown-* variables when selected)
// - keep light-dark() pairs (the browser adapts to dark/light automatically)
// - strip the pandoc $-variable syntax entirely
const fs = require( 'fs' );
let s = fs.readFileSync( 'E:/Projects/RichBar/RichBar/third_party/pandoc/styles.html', 'utf8' );
s = s.replace( /^\/\*[^\n]*\n\*[^\n]*\n/, '' );	// drop the 2-line header

// resolve conditionals: $if(var)$ ... $endif$ — keep the block when the
// variable is on (document-css, citations none, etc.); drop others
s = s.replace( /\$if\(([a-z-]+)\)\$\r?\n/g, ( m, v ) => { return ''; } );
s = s.replace( /\$endif\$\r?\n?/g, '' );
s = s.replace( /\$else\$\r?\n?/g, '' );
// variable substitutions we DON'T set: remove the whole declaration line
s = s.replace( /\$[a-z-]+\$:?[^\n]*\n/g, '' );
// any leftover single $...$ tokens (inline usage like quotes-$quotes$)
s = s.replace( /\$[a-z-]+\$/g, '' );
// collapse the blank runs left behind
s = s.replace( /\n{3,}/g, '\n\n' );

// prepend our header
const head = [
	'/* pandoc default styles (adapted from pandoc data/templates/styles.html,',
	'   jgm/pandoc, GPL-2.0-or-later -> converted to a standalone CSS theme).',
	'   light-dark() pairs adapt to the browser dark/light preference',
	'   automatically. */',
	'',
].join( '\n' );
fs.writeFileSync( 'E:/Projects/RichBar/dist/themes/pandoc-default.css', head + s, 'utf8' );
console.log( 'written themes/pandoc-default.css,', ( head + s ).length, 'bytes' );
console.log( '--- leftover $ tokens:', ( ( head + s ).match( /\$/g ) || [] ).length );
