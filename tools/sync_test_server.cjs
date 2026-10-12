// Generate the EXACT preview page the C++ emits (mirrors WritePreviewHtml),
// plus a RichBarSync.js, into a test dir; start an HTTP server on 8931.
const http = require( 'http' );
const fs = require( 'fs' );
const path = require( 'path' );
const dir = 'E:/Projects/RichBar/RichBar/tools/sync_test';
fs.mkdirSync( dir, { recursive: true } );

// --- simulate the C++ emission ---
const szBack = '#302D26', szFg = '#FCFFE0';
const bLight = false;
let sHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>';
sHtml += 'body{font-family:\'Cascadia Mono\',\'Microsoft YaHei\',Segoe UI,Arial,sans-serif;font-size:16px;line-height:1.6;margin:24px;color:' + szFg + ';background:' + szBack + ';}';
sHtml += 'h1{font-size:2em;} h2{font-size:1.5em;} h3,h4,h5,h6{font-size:1.2em;}';
sHtml += bLight ? 'pre,code{font-family:Consolas,monospace;} pre{background:#f6f6f6;padding:12px;border-radius:5px;white-space:pre-wrap;}' : 'pre,code{font-family:Consolas,monospace;} pre{background:#2d2d30;padding:12px;border-radius:5px;white-space:pre-wrap;}';
sHtml += bLight ? 'blockquote{border-left:4px solid #ddd;margin:8px 0;padding:4px 16px;color:#555;}' : 'blockquote{border-left:4px solid #555;margin:8px 0;padding:4px 16px;color:#aaa;}';
sHtml += 'li{margin:2px 0;} hr{border:0;border-top:1px solid ';
sHtml += bLight ? '#ccc;}' : '#555;}';
sHtml += bLight ? 'a{color:#0366d6;}' : 'a{color:#4da3ff;}';
sHtml += bLight ? 'table{border-collapse:collapse;} th,td{border:1px solid #ccc;padding:4px 10px;}' : 'table{border-collapse:collapse;} th,td{border:1px solid #555;padding:4px 10px;}';
sHtml += 'img{max-width:100%;}';
sHtml += '</style>';
// user css: absent -> still emits the empty style pair
sHtml += '<style></style>';
// bridge
sHtml += '<style>:root{';
sHtml += '--markdown-font-family:\'Cascadia Mono\',\'Microsoft YaHei\',Segoe UI,Arial,sans-serif;--markdown-font-size:16px;';
sHtml += '--markdown-line-height:1.6;';
sHtml += '--vscode-editor-background:' + szBack + ';--vscode-editor-foreground:' + szFg + ';';
sHtml += bLight ? '--vscode-textCodeBlock-background:#f6f6f6;--vscode-widget-border:#ccc;--vscode-editor-font-family:Consolas,monospace;}' : '--vscode-textCodeBlock-background:#2d2d30;--vscode-widget-border:#555;--vscode-editor-font-family:Consolas,monospace;}';
sHtml += '</style>';
sHtml += '</head><body>';
sHtml += '<div id="content"></div>';
// marked is loaded from the REAL dist file via a relative path — copy it in
sHtml += '<script src="marked.umd.min.js"></script>';
sHtml += '<script>';
sHtml += 'var NL=String.fromCharCode(10);';
sHtml += 'var isList=new RegExp(\'^\\\\s{0,3}([*+-]\\\\s|\\\\d{1,9}[.)]\\\\s)\');';
sHtml += 'var isQuote=new RegExp(\'^\\\\s{0,3}>(\\\\s|$)\');';
sHtml += 'var isTable=new RegExp(\'\\\\|\');';
sHtml += 'var isHr=new RegExp(\'^\\\\s{0,3}([-*_])(\\\\s*\\\\1){2,}\\\\s*$\');';
sHtml += 'var isHead=new RegExp(\'^\\\\s{0,3}#{1,6}\\\\s\');';
sHtml += 'var isCode=new RegExp(\'^(\\\\s{4,}|\\\\t)\');';
sHtml += 'var isSetextH=new RegExp(\'^={2,}\\\\s*$|^-{2,}\\\\s*$\');';
sHtml += 'function NormalizeSingleNewlines(s){var L=s.split(NL),o=[];for(var i=0;i<L.length;i++){var t=L[i],keep=false;if(i>0){var pr=L[i-1];if(isList.test(t)||isQuote.test(t)||isTable.test(t)||isHr.test(t)||isHead.test(t)||isCode.test(t)||isList.test(t)||isCode.test(pr)||isList.test(pr)||isTable.test(pr)||isHr.test(pr)||isSetextH.test(pr)){keep=true;}}if(!keep)o.push(NL);o.push(t);}return o.join(NL);}';
sHtml += 'window.__md="';
// sample markdown: 120 paragraphs so the page is definitely scrollable
{
	const paras = [];
	for( let i = 1; i <= 120; i++ ){ paras.push('第' + i + '段：这是一段用于测试滚动同步的示例文本，内容足够长以产生可滚动的页面。'); }
	const md = paras.join( '\n' );
	// JsEscape equivalent
	sHtml += md.replace( /\\/g, '\\\\' ).replace( /"/g, '\\"' ).replace( /\n/g, '\\n' ).replace( /\r/g, '' ).replace( /\t/g, '\\t' ).replace( /</g, '\\u003c' ).replace( />/g, '\\u003e' );
}
sHtml += '";';
sHtml += 'document.getElementById(\'content\').innerHTML=marked.parse(NormalizeSingleNewlines(window.__md),{breaks:true,gfm:true});';
sHtml += 'function __rbRestore(){if(typeof window.__scrollRatio===\'number\'){var h=document.body.scrollHeight-window.innerHeight;if(h>0){window.scrollTo(0,window.__scrollRatio*h);}}}';
sHtml += 'window.addEventListener(\'load\',function(){__rbRestore();setTimeout(__rbRestore,100);setTimeout(__rbRestore,400);});';
sHtml += '__rbRestore();';
sHtml += 'function __rbSetRatio(r){window.__scrollRatio=r;__rbRestore();}';
// THE LINE UNDER TEST — cache-buster present or not:
const useCacheBuster = process.argv.includes( '--no-buster' ) ? false : true;
if( useCacheBuster ){
	sHtml += 'window.__rbPoll=function(){var s=document.createElement(\'script\');s.src=\'RichBarSync.js?cb=\'+Date.now();document.body.appendChild(s);};';
} else {
	sHtml += 'window.__rbPoll=function(){var s=document.createElement(\'script\');s.src=\'RichBarSync.js\';document.body.appendChild(s);};';
}
sHtml += 'setInterval(window.__rbPoll,250);';
sHtml += '</script>';
sHtml += '</body></html>';

fs.writeFileSync( path.join( dir, 'RichBarPreview.html' ), sHtml, 'utf8' );
// marked: copy the real dist file
fs.copyFileSync( 'E:/Projects/RichBar/dist/marked.umd.min.js', path.join( dir, 'marked.umd.min.js' ) );
// the sync file: initial ratio 0
fs.writeFileSync( path.join( dir, 'RichBarSync.js' ), '__rbSetRatio(0.0);', 'utf8' );

const server = http.createServer( ( req, res ) => {
	const name = decodeURIComponent( req.url.split( '?' )[ 0 ] ).replace( /^\//, '' ) || 'RichBarPreview.html';
	const full = path.join( dir, name );
	try{
		const data = fs.readFileSync( full );
		res.writeHead( 200, { 'Content-Type': name.endsWith( '.js' ) ? 'application/javascript' : 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } );
		res.end( data );
	}catch( e ){
		res.writeHead( 404 ); res.end( 'not found' );
	}
} );
server.listen( 8931, () => console.log( 'serving on http://127.0.0.1:8931/ cache-buster=' + useCacheBuster ) );
