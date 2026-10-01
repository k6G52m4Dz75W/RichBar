// 0.40.0 patch: single-newline paragraphs (compatibility mode)
// - marked has NO option that turns a single newline into a NEW PARAGRAPH
//   (breaks:true only makes <br>); the sanctioned approach is a PREPROCESS
//   - a browser-side NormalizeSingleNewlines() runs before marked.parse:
//   it doubles lone \n so every line becomes its own <p>, while PROTECTING
//   block structure: list items, blockquotes, tables, headings, hr,
//   indented/fenced code - those keep their single newlines
// - breaks:true added so the REMAINING lone newlines (inside protected
//   blocks) still render as visible line breaks instead of joining
// - version 0.39.0 -> 0.40.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'NormalizeSingleNewlines' ) )  fail( 'already patched' );

	const aA = 'sHtml += L"<script>window.__md=\\"";';
	if( !s.includes( aA ) )  fail( 'marked injection anchor not found' );
	const nwA = [
		'\t\t\t\tsHtml += L"<script>";',
		'\t\t\t\tsHtml += L"function NormalizeSingleNewlines(s){var L=s.split(String.fromCharCode(10)),o=[];for(var i=0;i<L.length;i++){var t=L[i];if(i===0){o.push(t);continue;}var p=L[i-1];var pv=t.replace(/^[>\\\\s]*/,String.fromCharCode(32)).length>0&&t.search(/[^>\\\\s]/)>=0;var contBlock=/^(\\\\s{4,}|\\\\t|([*+\\\\-]\\\\s)|(\\\\d+[.)]\\\\s)|(>\\\\s?)|(\\\\|)|(#{1,6}\\\\s)|([-*_]\\\\s*[-*_]\\\\s*[-*_]))/.test(t)||/^([-*_])\\\\1*\\\\s*$/.test(p)||/^(\\\\s{4,}|\\\\t)/.test(p)||/^[^|]*\\\\|/.test(p)&&/\\\\|/.test(t)||/^(#{1,6}\\\\s|>)/.test(p);var brk=/^(\\\\s{0,3}([-*_])\\\\s*\\\\2\\\\s*\\\\2[\\\\s\\\\2]*$|#{1,6}\\\\s)/.test(p)||/^(\\\\s{0,3}([-*_])\\\\s*\\\\2\\\\s*\\\\2[\\\\s\\\\2]*$)/.test(t);if(!contBlock&&!brk&&pv){o.push(String.fromCharCode(10));}o.push(t);}return o.join(String.fromCharCode(10));}\";',
		'\t\t\t\tsHtml += L"window.__md=\\"";',
		'\t\t\t\tsHtml += JsEscape( sText );',
		'\t\t\t\tsHtml += L"\\";document.getElementById(\'content\').innerHTML=marked.parse(NormalizeSingleNewlines(window.__md),{breaks:true,gfm:true});</script>";',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,39,0,0' ) )  fail( 'rc does not read 0,39,0,0' );
	s = s.split( '0,39,0,0' ).join( '0,40,0,0' );
	s = s.split( '0.39.0' ).join( '0.40.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.39\.0"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.39.0' );
	s = s.replace( re, 'IDS_VERSION$1"0.40.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
