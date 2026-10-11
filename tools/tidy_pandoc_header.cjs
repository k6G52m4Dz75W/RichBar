// tidy the pandoc theme header into one clean block
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/dist/themes/pandoc-default.css';
let s = fs.readFileSync( p, 'utf8' );
const iBody = s.indexOf( '/* pandoc default styles' );
const body = s.slice( iBody );
const head = [
	'/* pandoc default Markdown preview theme.',
	' *',
	' * Source: https://raw.githubusercontent.com/jgm/pandoc/main/data/templates/styles.html',
	' *         (resolved from the $if$-templated original with',
	' *          tools/make_pandoc_theme2.cjs — re-run it when updating pandoc)',
	' * License: GPL-2.0-or-later (see LICENSE.third-party)',
	' */',
	'',
].join( '\n' );
fs.writeFileSync( p, head + body, 'utf8' );
console.log( head + '...(body)' );
