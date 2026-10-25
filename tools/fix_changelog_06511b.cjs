// Repair zh 0.65.11: whitespace-tolerant regex restore of ?t= / #L<n>.
const fs = require( 'fs' );
let t = fs.readFileSync( 'CHANGELOG.zh.md', 'utf8' );
if ( /时\r?\n\s+`?`? ?防缓存参数/.test( t ) && !/\?t=` 防缓存参数/.test( t ) ) {
	t = t.replace( /时的?\r?\n(\s+)`?`? ?防缓存参数/, '时的\n$1`?t=` 防缓存参数' );
	console.log( 'zh: ?t= restored' );
} else if ( /时\r?\n\s+防缓存参数/.test( t ) && !/\?t=/.test( t.split( '[0.65.10]' )[0].split( '[0.65.11]' )[1] || '' ) ) {
	t = t.replace( /时的?\r?\n(\s+)防缓存参数/, '时的\n$1`?t=` 防缓存参数' );
	console.log( 'zh: ?t= restored (path2)' );
} else { console.log( 'zh ?t=: ' + ( t.includes( '`?t=` 防缓存参数' ) ? 'already ok' : 'PATTERN NOT FOUND' ) ); }
if ( /追加\s+——打开只加载一次/.test( t ) && !/追加 `#L<n>`/.test( t ) ) {
	t = t.replace( /追加\s+——打开只加载一次/, '追加 `#L<n>` ——打开只加载一次' );
	console.log( 'zh: #L<n> restored' );
} else { console.log( 'zh #L: ' + ( t.includes( '追加 `#L<n>`' ) ? 'already ok' : 'PATTERN NOT FOUND' ) ); }
fs.writeFileSync( 'CHANGELOG.zh.md', t, 'utf8' );
const seg = t.split( '[0.65.11]' )[1].split( '[0.65.10]' )[0];
console.log( 'final check: ?t= in zh 0.65.11:', seg.includes( '?t=' ), '| #L<n>:', seg.includes( '#L<n>' ) );
