// END-TO-END: the real shipped marked.umd.min.js + our normalize
const m = require( 'E:/Projects/RichBar/RichBar/third_party/marked/marked.umd.min.js' );
const marked = m.marked || m;
const NL = String.fromCharCode( 10 );
const isList = new RegExp( '^\\s{0,3}([*+-]\\s|\\d{1,9}[.)]\\s)' );
const isQuote = new RegExp( '^\\s{0,3}>(\\s|$)' );
const isTable = new RegExp( '\\|' );
const isHr = new RegExp( '^\\s{0,3}([-*_])(\\s*\\1){2,}\\s*$' );
const isHead = new RegExp( '^\\s{0,3}#{1,6}\\s' );
const isCode = new RegExp( '^(\\s{4,}|\\t)' );
const isSetextH = new RegExp( '^={2,}\\s*$|^-{2,}\\s*$' );
function NormalizeSingleNewlines( s ) {
	const L = s.split( NL ), o = [];
	for( let i = 0; i < L.length; i++ ) {
		const t = L[ i ]; let keep = false;
		if( i > 0 ) {
			const pr = L[ i - 1 ];
			if( isList.test( t ) || isQuote.test( t ) || isTable.test( t ) || isHr.test( t ) ||
				isHead.test( t ) || isCode.test( t ) || isCode.test( pr ) || isList.test( pr ) ||
				isQuote.test( pr ) || isTable.test( pr ) || isHr.test( pr ) || isSetextH.test( pr ) ) { keep = true; }
		}
		if( !keep ) o.push( NL );
		o.push( t );
	}
	return o.join( NL );
}
const md = [
	'第一段第一行',
	'第一段第二行',
	'第二段开始了',
	'',
	'- 列表一',
	'- 列表二',
	'  延续行',
	'',
	'> 引用一',
	'> 引用二',
	'引用后的段落',
	'',
	'| 表头 | 列 |',
	'|------|----|',
	'| a | b |',
	'',
	'### 标题行',
	'标题后的正文',
	'',
	'1. 有序一',
	'2. 有序二',
	'',
	'**粗体**和*斜体*和`代码`',
	'结束段落',
].join( NL );
const html = marked.parse( NormalizeSingleNewlines( md ), { breaks: true, gfm: true } );
console.log( html );
console.log( '--- checks ---' );
console.log( 'two <p> for para1+para2:', html.includes( '<p>第一段第一行' ) && html.includes( '<p>第一段第二行' ) );
console.log( 'single <ul>:', ( html.match( /<ul>/g ) || [] ).length === 1 );
console.log( 'blockquote one block:', ( html.match( /<blockquote>/g ) || [] ).length === 1 );
console.log( 'table rendered:', html.includes( '<table>' ) );
console.log( 'ordered list:', html.includes( '<ol>' ) );
console.log( 'headings:', html.includes( '<h3>标题行</h3>' ) );
