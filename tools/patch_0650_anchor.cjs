// 0.65.0: anchor-based scroll sync (industry standard per the research doc)
// === Design ===
// 1. PAGE: marked renders with data-source-line on every top-level block
//    (renderer wraps via src.indexOf(token.raw) — verified end-to-end).
// 2. PAGE: after render + on resize, build the scrollmap:
//    [ {line, top} ] from all [data-source-line] elements, sorted.
//    __rbScrollToLine(l): binary-search the interval [A,B] around l,
//    linear-interpolate the px target, window.scrollTo(0, target).
// 3. PLUGIN: the 300ms poll reads the editor top line (EE_GET_SCROLL_POS
//    y is already a line). On change >= 1 line, it computes the preview's
//    CURRENT px via GetPreviewMaxPx-style title readback — NO. Simpler:
//    the plugin stores the last px it knows; the PAGE reports its current
//    scrollY through the title too: 'RB|<scrollY>' continuously updated.
//    The poll: targetPx = interpolate(page knows), so the plugin just
//    sends scrollBy(0, reportedScrollY -> target). To avoid the readback
//    dependency, the PAGE title carries its CURRENT scrollY, and the
//    plugin computes delta = targetFromTitle - currentFromTitle.
//    But the plugin cannot interpolate (no anchor table). SO: the page
//    does everything: it polls the editor line from a sync file? NO —
//    file channel is dead.
//    FINAL LAYOUT: the plugin passes the editor TOP LINE to the page via
//    the macro: WebBar.scrollBy needs a DELTA. The page knows its own
//    current scrollY internally (JS), and the target for line L. So the
//    page itself computes delta = target - current and ... cannot
//    self-scroll via WebBar (that is host-side).
//    RESOLUTION: the plugin reads the page's current scrollY from the
//    title ('RB|y:<px>|t:<total>'), computes nothing itself, and runs
//    ONE macro that asks the PAGE to compute the target for the line
//    via a window function the page exposes... macros cannot call into
//    the page. BUT: the title can carry BOTH current and target — the
//    page computes the target for its OWN known line? It does not know
//    the editor line.
//    => The page needs the editor line. Only the plugin knows it. The
//    only working channel plugin->page is... the page polls nothing.
//    Actually WebBar.Open re-navigates; too heavy per scroll.
//    PRACTICAL COMPROMISE (still anchor-accurate at every anchor, exact
//    at ends): the plugin sends the TARGET LINE as the scrollBy value in
//    "line" units is meaningless. Instead: the page, at render time,
//    computes a mapping line->px and BAKES IT INTO THE TITLE as
//    'RB|<current scrollY>' plus stores nothing else. The plugin reads
//    the title for current scrollY, and computes the target px using an
//    anchor table IT builds: the page ALSO publishes a compact map via
//    the title? Titles are short.
//
//    THE WORKING SPLIT (final): page publishes 'RB|<currentPx>' in the
//    title on every scroll (passive). Plugin: polls editor line, uses a
//    line->px table IT owns, built from... it cannot measure the page.
//
//    THE ANSWER: keep the plugin's per-line coefficient CALIBRATED from
//    the title's total (published at render): pxPerLine = totalPx /
//    editorScrollableLines (already tried in 0.63 — the title readback
//    was never verified!). The anchor method needs the page in the loop.
//
//    TRUE MINIMAL ANCHOR PATH: the PAGE handles its side completely and
//    the plugin only delivers the line number. Delivery = the sync FILE
//    failed; the macro cannot enter the page; re-Open is too heavy.
//    => the remaining sanctioned bridge: WebBar.Open with a URL
//    fragment! file:///...html#L42 — navigating to the same page with a
//    hash does NOT reload the document; it fires hashchange in-page!
//    The page listens for hashchange, reads location.hash (#L42), and
//    scrolls itself (window.scrollTo works in-page!). This is the
//    channel: plugin -> WebBar.Open(url#L<line>) -> hashchange ->
//    __rbScrollToLine. No reload, no file, no readback.
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( '__rbScrollToLine' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );
const Q = String.fromCharCode( 34 );
const SQ = String.fromCharCode( 39 );
const BS = String.fromCharCode( 92 );

// ---------- A: page-side script (emitted after the marked <script src> open tag,
// before NormalizeSingleNewlines definition) ----------
{
	const a = '\t\t\t\tsHtml += L"var NL=String.fromCharCode(10);";';
	if( !s.includes( a ) ){ console.log( 'A anchor miss' ); process.exit( 1 ); }
	const pageScript = [
		'\t\t\t\tsHtml += L"var __rbMap=[];";',
		'\t\t\t\tsHtml += L"function __rbBuildMap(){__rbMap=[];var es=document.querySelectorAll(\'[data-source-line]\');for(var i=0;i<es.length;i++){var r=es[i].getBoundingClientRect();__rbMap.push({l:parseInt(es[i].getAttribute(\'data-source-line\')),y:r.top+window.scrollY});}}";',
		'\t\t\t\tsHtml += L"function __rbScrollToLine(l){if(!__rbMap.length)__rbBuildMap();if(l<=__rbMap[0].l){window.scrollTo(0,__rbMap[0].y);return;}var n=__rbMap.length;if(l>=__rbMap[n-1].l){window.scrollTo(0,__rbMap[n-1].y);return;}var lo=0,hi=n-1;while(hi-lo>1){var mid=(lo+hi)>>1;if(__rbMap[mid].l<=l)lo=mid;else hi=mid;}var a=__rbMap[lo],b=__rbMap[hi];var t=a.y+(b.y-a.y)*(l-a.l)/(b.l-a.l);window.scrollTo(0,Math.max(0,t-8));}";',
		'\t\t\t\tsHtml += L"window.addEventListener(\'hashchange\',function(){var h=location.hash;if(h&&h.indexOf(\'#L\')===0){var l=parseInt(h.slice(2));if(!isNaN(l))__rbScrollToLine(l);}});";',
		'\t\t\t\tsHtml += L"window.addEventListener(\'load\',function(){__rbBuildMap();var h=location.hash;if(h&&h.indexOf(\'#L\')===0){var l=parseInt(h.slice(2));if(!isNaN(l))setTimeout(function(){__rbBuildMap();__rbScrollToLine(l);},80);}});";',
	].join( '\r\n' );
	s = s.replace( a, pageScript + '\r\n' + a );
	console.log( 'A page script ok' );
}

// ---------- B: renderer with data-source-line (replace the plain parse call) ----------
{
	// the current parse emission line
	const a = '\t\t\t\tsHtml += L"document.getElementById(\'content\').innerHTML=marked.parse(NormalizeSingleNewlines(window.__md),{breaks:true,gfm:true});";';
	if( !s.includes( a ) ){ console.log( 'B anchor miss' ); process.exit( 1 ); }
	const nw = [
		'\t\t\t\tsHtml += L"var __rbTok=null;try{__rbTok=marked.lexer(NormalizeSingleNewlines(window.__md));}catch(e){__rbTok=null;}";',
		'\t\t\t\tsHtml += L"if(__rbTok){var __rd=new marked.Renderer();var __src=window.__md;";',
		'\t\t\t\tsHtml += L"[\'heading\',\'paragraph\',\'code\',\'blockquote\',\'list\',\'hr\',\'table\'].forEach(function(k){var o=__rd[k].bind(__rd);__rd[k]=function(){var args=[].slice.call(arguments);var tok=args.find(function(a){return a&&typeof a===\'object\'&&a.raw!==undefined;});var out=o.apply(null,args);var sl=0;if(tok&&tok.raw){var i=__src.indexOf(tok.raw);if(i>=0)sl=__src.slice(0,i).split(\'\\n\').length-1;}var m=out.match(/^<([a-z0-9]+)/);if(m)return out.replace(/^<([a-z0-9]+)/,\'<\'+m[1]+\' data-source-line="\\\'\'+sl+\'\\\'>\');return out;};});";',
		'\t\t\t\tsHtml += L"document.getElementById(\'content\').innerHTML=marked.parser(__rbTok,{renderer:__rd,gfm:true,breaks:true});}else{document.getElementById(\'content\').innerHTML=marked.parse(NormalizeSingleNewlines(window.__md),{breaks:true,gfm:true});}";',
	].join( '\r\n' );
	s = s.replace( a, nw );
	console.log( 'B renderer ok' );
}

// ---------- C: plugin poll — hash navigation ----------
{
	const startMarker = '\t// the 300ms poll: editor scrolled? drive the Web bar natively';
	const endMarker = '\t// JSON/JS string escape for embedding the markdown source into the';
	const i = s.indexOf( startMarker );
	const j = s.indexOf( endMarker );
	if( i < 0 || j < 0 || j <= i ){ console.log( 'C span miss' ); process.exit( 1 ); }
	const nw = [
		'\t// the 300ms poll: anchor-based sync. The editor top line is sent',
		'\t// to the page via a URL hash (#L<n>) — same-document navigation',
		'\t// fires hashchange in-page without reloading; the page looks up',
		'\t// its scrollmap (data-source-line anchors) and scrolls itself.',
		'\tvoid OnScrollerPoll()',
		'\t{',
		'\t\tif( !IsOfficialPaneVisible() )  return;',
		'\t\tif( !m_hwndView || !IsWindow( m_hwndView ) )  return;',
		'\t\tPOINT_PTR pt = { 0, 0 };',
		'\t\tEditor_GetScrollPos( m_hwndView, &pt );',
		'\t\tconst int nY = (int)pt.y;\t// editor top line',
		'\t\tif( nY == m_nLastSentLine )  return;',
		'\t\tm_nLastSentLine = nY;',
		'\t\tTCHAR szUrl[ MAX_PATH + 32 ];',
		'\t\tGetTempPath( MAX_PATH, szUrl );',
		'\t\twcscat_s( szUrl, MAX_PATH + 32, L"RichBarPreview.html" );',
		'\t\tfor( LPTSTR q = szUrl; *q; q++ ){',
		'\t\t\tif( *q == L' + SQ + BS + SQ + ' )  *q = L' + SQ + '/' + SQ + ';',
		'\t\t}',
		'\t\tTCHAR szMacro[ MAX_PATH + 64 ];',
		'\t\twsprintf( szMacro, L"WebBar.Open( ' + Q + 'file:///%s#L%d' + Q + ' );", szUrl, nY );',
		'\t\tRunWebBarMacroStaged( szMacro );',
		'\t}',
	].join( '\r\n' );
	s = s.slice( 0, i ) + nw + s.slice( j );
	console.log( 'C poll replaced' );
}

// ---------- D: members ----------
{
	const a = '\tint m_nPreviewLinePx = 26;';
	if( !s.includes( a ) ){ console.log( 'D miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\n' + T( 1 ) + 'int m_nLastSentLine = -1;\t// last editor top line sent via the hash' );
	console.log( 'D member ok' );
}

// ---------- E: seed in StartScrollerPoll ----------
{
	const a = '\t\tm_nLastEditorY = (int)pt.y;';
	if( !s.includes( a ) ){ console.log( 'E miss' ); process.exit( 1 ); }
	s = s.replace( a, '\t\tm_nLastSentLine = (int)pt.y;\t// seed: no jump on open' );
	console.log( 'E seed ok' );
}

// ---------- F: version 0.64.1 -> 0.65.0 ----------
{
	const rc = 'E:/Projects/RichBar/RichBar/RichBar.rc';
	let r = fs.readFileSync( rc, 'utf8' );
	if( !r.includes( '0,64,1,0' ) ){ console.log( 'F rc miss' ); process.exit( 1 ); }
	r = r.split( '0,64,1,0' ).join( '0,65,0,0' );
	r = r.split( '0.64.1' ).join( '0.65.0' );
	fs.writeFileSync( rc, r, 'utf8' );
	const loc = 'E:/Projects/RichBar/RichBar/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( loc );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE ){ console.log( 'F BOM miss' ); process.exit( 1 ); }
	let t = buf.toString( 'utf16le' );
	t = t.replace( /IDS_VERSION(\s+)"0\.64\.1"/, ( m, sp ) => 'IDS_VERSION' + sp + '"0.65.0"' );
	fs.writeFileSync( loc, Buffer.from( t, 'utf16le' ) );
	console.log( 'F versions bumped' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
