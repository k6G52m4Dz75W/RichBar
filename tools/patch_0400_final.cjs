// 0.40.0 final: replace the ENTIRE marked-injection span with clean,
// auditable C++ (the patch-stack left bare L"..." fragments without
// semicolons and with unescaped \s \d \1 inside C++ string literals)
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );

const i = s.indexOf( 'sHtml += L"<div id=\\"content\\"></div>";' );
const j = s.indexOf( 'sHtml += L"</body></html>";', i );
if( i < 0 || j < 0 ) { console.log( 'SPAN NOT FOUND' ); process.exit( 1 ); }
const jEnd = j + 'sHtml += L"</body></html>";'.length;

// Build the C++ lines. IMPORTANT escape accounting (generator -> file):
// this generator is a .cjs file, so '\\' here = one backslash in the
// written text. The C++ literal L"\s" would be an INVALID escape, so every
// regex backslash that must survive to the browser needs TWO chars in the
// C++ literal: written here as '\\\\' (generator) -> '\\\\'? NO:
//   generator '\\\\'  -> file '\\'  -> C++ sees TWO chars -> stays as-is
// So: to give the browser regex /^\\s/ we write file text "^\\\\s" via
// generator "\\\\\\\\s". That is the same trap as before; AVOID regex
// literals in the injected JS entirely - use new RegExp with STRING
// patterns, where a single file-level backslash suffices.
const lines = [
	'\t\t\t\tsHtml += L"<div id=\\"content\\"></div>";',
	'\t\t\t\tsHtml += L"<script src=\\"" + sMarkedUrl + L"\\"></script>";',
	'\t\t\t\tsHtml += L"<script>";',
	'\t\t\t\tsHtml += L"var NL=String.fromCharCode(10);";',
	'\t\t\t\tsHtml += L"var isList=new RegExp(\'^\\\\\\\\s{0,3}([*+-]\\\\\\\\s|\\\\\\\\d{1,9}[.)]\\\\\\\\s)\');";',
	'\t\t\t\tsHtml += L"var isQuote=new RegExp(\'^\\\\\\\\s{0,3}>(\\\\\\\\s|$)\');";',
	'\t\t\t\tsHtml += L"var isTable=new RegExp(\'\\\\\\\\|\');";',
	'\t\t\t\tsHtml += L"var isHr=new RegExp(\'^\\\\\\\\s{0,3}([-*_])(\\\\\\\\s*\\\\\\\\1){2,}\\\\\\\\s*$\');";',
	'\t\t\t\tsHtml += L"var isHead=new RegExp(\'^\\\\\\\\s{0,3}#{1,6}\\\\\\\\s\');";',
	'\t\t\t\tsHtml += L"var isCode=new RegExp(\'^(\\\\\\\\s{4,}|\\\\\\\\t)\');";',
	'\t\t\t\tsHtml += L"var isSetextH=new RegExp(\'^={2,}\\\\\\\\s*$|^-{2,}\\\\\\\\s*$\');";',
	'\t\t\t\tsHtml += L"function NormalizeSingleNewlines(s){var L=s.split(NL),o=[];for(var i=0;i<L.length;i++){var t=L[i],keep=false;if(i>0){var pr=L[i-1];if(isList.test(t)||isQuote.test(t)||isTable.test(t)||isHr.test(t)||isHead.test(t)||isCode.test(t)||isCode.test(pr)||isList.test(pr)||isQuote.test(pr)||isTable.test(pr)||isHr.test(pr)||isSetextH.test(pr)){keep=true;}}if(!keep)o.push(NL);o.push(t);}return o.join(NL);}";',
	'\t\t\t\tsHtml += L"window.__md=\\"";',
	'\t\t\t\tsHtml += JsEscape( sText );',
	'\t\t\t\tsHtml += L"\\";document.getElementById(\'content\').innerHTML=marked.parse(NormalizeSingleNewlines(window.__md),{breaks:true,gfm:true});</script>";',
	'\t\t\t\tsHtml += L"</body></html>";',
].join( '\r\n' );
s = s.slice( 0, i ) + lines + s.slice( jEnd );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'span rewritten OK' );
