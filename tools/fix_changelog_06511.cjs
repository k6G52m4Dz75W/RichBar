// Repair the bash-mangled ?t= / #L<n> literals in the 0.65.11 entries.
const fs = require( 'fs' );

const fixes = [
	[ 'CHANGELOG.md',
		'the open-time  cache-buster\n  query',
		'the open-time `?t=` cache-buster\n  query' ],
	[ 'CHANGELOG.md',
		'every poll\n  send appends  to that exact URL',
		'every poll\n  send appends `#L<n>` to that exact URL' ],
	[ 'CHANGELOG.zh.md',
		'轮询发送的哈希导航地址不带打开时的\n  防缓存参数',
		'轮询发送的哈希导航地址不带打开时的\n  `?t=` 防缓存参数' ],
	[ 'CHANGELOG.zh.md',
		'轮询在其后追加 ——打开只加载一次',
		'轮询在其后追加 `#L<n>` ——打开只加载一次' ],
];
for ( const [ f, from, to ] of fixes ) {
	let t = fs.readFileSync( f, 'utf8' );
	if ( !t.includes( from ) ) {
		if ( t.includes( to ) ) { console.log( f + ': already fixed (' + to.slice( 0, 24 ) + '...)' ); continue; }
		console.error( 'ANCHOR MISSING in ' + f + ': ' + JSON.stringify( from.slice( 0, 40 ) ) );
		process.exit( 1 );
	}
	fs.writeFileSync( f, t.replace( from, to ), 'utf8' );
	console.log( f + ': fixed' );
}
