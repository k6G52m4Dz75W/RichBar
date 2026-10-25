// 0.65.13 changelog entries (EN + zh), file-based per the escaping rule.
const fs = require( 'fs' );

const en = `## [0.65.13] - 2026-10-25

### Fixed
- **The pane still reloaded once right after a cold-start open** (log
  20:33:50-51): the macro-level staged retry opened the pane at t+1s, and
  the pending EVENT_CHANGE debounce (armed by the open's own clipboard-read
  selection churn or by typing just before the click) matured right after
  the pane became visible - re-opening it with a NEW ?t= one second after
  it loaded. OnPreviewAutoRefresh now stands down for 1.5 s after any open
  (quiet window, logged when it skips).

`;
const zh = `## [0.65.13] - 2026-10-25

### 修复
- **冷启动打开后面板仍会在 1 秒后重载一次**（日志 20:33:50-51）：宏级重试在
  t+1s 打开面板的同时，挂起的 EVENT_CHANGE 防抖（由打开时读剪贴板的选区扰动
  或点击前的输入触发）恰好到点——面板刚可见就用新的 ?t= 又完整重开了一次。
  现在 OnPreviewAutoRefresh 在任何打开后的 1.5 秒内退避（静默窗，跳过时记日志）。

`;

function patch( file, anchor, insert ) {
	const t = fs.readFileSync( file, 'utf8' );
	if ( !t.includes( anchor ) ) { console.error( 'ANCHOR MISSING in ' + file ); process.exit( 1 ); }
	if ( t.includes( '[0.65.13]' ) ) { console.log( file + ': already patched' ); return; }
	fs.writeFileSync( file, t.replace( anchor, insert + anchor ), 'utf8' );
	console.log( file + ': 0.65.13 added' );
}
patch( 'CHANGELOG.md', '## [0.65.12] - 2026-10-25', en );
patch( 'CHANGELOG.zh.md', '## [0.65.12] - 2026-10-25', zh );
