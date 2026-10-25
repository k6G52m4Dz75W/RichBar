// Build dist/themes/github.css from sindresorhus/github-markdown-css v5.
// Input: the pristine file downloaded from jsDelivr (path in DL below).
// Transforms:
//   1. the two @media(prefers-color-scheme) blocks are re-keyed onto
//      html[data-color-mode="dark"|"light"] — RichBar stamps that attribute
//      from the EDITOR theme at render time (deterministic, not the OS scheme)
//   2. the .markdown-body scope is renamed to body (our page has no wrapper)
const fs = require( 'fs' );

const SRC = process.argv[2] || 'C:/Users/yicki/AppData/Local/Temp/github-markdown.css';
const OUT = 'E:/Projects/RichBar/dist/themes/github.css';
let css = fs.readFileSync( SRC, 'utf8' );

function extractMediaBlock( text, query ) {
	const at = text.indexOf( '@media (prefers-color-scheme: ' + query + ')' );
	if ( at < 0 ) throw new Error( 'media block not found: ' + query );
	const open = text.indexOf( '{', at );
	let depth = 1, i = open + 1;
	while ( depth > 0 && i < text.length ) {
		if ( text[ i ] === '{' ) depth++;
		else if ( text[ i ] === '}' ) depth--;
		i++;
	}
	if ( depth !== 0 ) throw new Error( 'unbalanced braces in ' + query + ' block' );
	return { inner: text.slice( open + 1, i - 1 ), rest: text.slice( 0, at ) + text.slice( i ) };
}

const dark = extractMediaBlock( css, 'dark' );
css = dark.rest;
const light = extractMediaBlock( css, 'light' );
css = light.rest;

// mode blocks define their token SETS on ":root, .markdown-body" — the bare
// :root selector must ALSO be prefixed or the light tokens (later in the
// file) would win unconditionally on html
const prefix = ( inner, mode ) => inner
	.split( ':root' ).join( '[data-color-mode="' + mode + '"]' )
	.split( '.markdown-body' ).join( '[data-color-mode="' + mode + '"] .markdown-body' );

// mode blocks FIRST (attribute-keyed), base rules LAST so tokens cascade
css = prefix( dark.inner, 'dark' ) + '\n' + prefix( light.inner, 'light' ) + '\n' + css;
css = css.split( '.markdown-body' ).join( 'body' );

const header = `/* github.css — GitHub Markdown preview theme for RichBar.

   Source: sindresorhus/github-markdown-css v5 (npm: github-markdown-css),
   downloaded from https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.css
   The package is AUTO-GENERATED from github.com's live styles by
   https://github.com/sindresorhus/generate-github-markdown-css — GitHub does
   not publish a standalone theme; this is the de-facto official equivalent.
   License: MIT, (c) Sindre Sorhus.

   Transformations (tools/make_github_theme.cjs):
   - the @media (prefers-color-scheme: dark|light) blocks are re-keyed onto
     html[data-color-mode="dark"|"light"]; RichBar writes that attribute from
     the editor theme, so the preview follows the editor, not the OS
   - the .markdown-body scope is renamed to body (the preview page has no
     wrapper element)
*/
`;

fs.writeFileSync( OUT, header + css, 'utf8' );
const body = css;	// sanity on the TRANSFORMED css, not the comment header
console.log( 'written', OUT, header.length + body.length, 'bytes' );
console.log( 'no markdown-body left:', !body.includes( 'markdown-body' ) );
console.log( 'dark selector groups:', ( body.match( /\[data-color-mode="dark"\]/g ) || [] ).length );
console.log( 'light selector groups:', ( body.match( /\[data-color-mode="light"\]/g ) || [] ).length );
console.log( 'no media queries left:', !body.includes( 'prefers-color-scheme' ) );
console.log( 'no bare :root left:', !/(^|[^"\]])\s*:root/.test( body ) );
