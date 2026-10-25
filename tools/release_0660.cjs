// 0.66.0 milestone release: versions + changelogs + readmes. File-based,
// content-anchored, hard-fail on missing anchors, verify after write.
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar/';

function read( f ) { return fs.readFileSync( ROOT + f, 'utf8' ); }
function write( f, t ) { fs.writeFileSync( ROOT + f, t, 'utf8' ); }
function replaceOnce( f, t, from, to ) {
	if ( !t.includes( from ) ) { console.error( 'ANCHOR MISSING in ' + f + ': ' + JSON.stringify( from.slice( 0, 60 ) ) ); process.exit( 1 ); }
	return t.replace( from, to );
}

// ---- 1. main rc (ASCII) ----
let rc = read( 'RichBar.rc' );
rc = replaceOnce( 'RichBar.rc', rc, '0,65,13,0', '0,66,0,0' );
rc = rc.split( '0,65,13,0' ).join( '0,66,0,0' );
rc = rc.split( '"0.65.13"' ).join( '"0.66.0"' );
write( 'RichBar.rc', rc );
console.log( 'RichBar.rc -> 0.66.0' );

// ---- 2. satellite rc (UTF-16LE) ----
const locPath = ROOT + 'mui/RichBar_loce/richbar_loce.rc';
let loc = fs.readFileSync( locPath ).toString( 'utf16le' );
if ( !loc.includes( '"0.65.13"' ) ) { console.error( 'ANCHOR MISSING in loce rc' ); process.exit( 1 ); }
loc = loc.split( '"0.65.13"' ).join( '"0.66.0"' );
fs.writeFileSync( locPath, Buffer.from( loc, 'utf16le' ) );
console.log( 'loce IDS_VERSION -> 0.66.0' );

// ---- 3. CHANGELOG.md ----
const enEntry = `## [0.66.0] - 2026-10-25 — Milestone: live scroll sync

### Added
- **Live scroll synchronization between the editor and the Markdown
  preview** — scroll the editor and the preview follows line-by-line
  (user-verified milestone):
  - every rendered block is tagged with its source line
    (\`data-source-line\` via the marked lexer + a forward-cursor
    renderer); the page builds a scrollmap and positions itself by
    binary search + interpolation — the VS Code / Typora anchor
    approach;
  - the editor's top line travels in the pane URL's \`#L\` fragment as
    \`line*1000+permille\` — display rows are converted to logical lines
    (\`Editor_ViewToLogical\`), wrapped paragraphs carry sub-line
    precision (\`Editor_LogicalToView\`), and the endpoints share the
    same encoding;
  - positioning rides fragment navigations only: the pane opens
    DIRECTLY at the editor's position (the page positions itself before
    first paint), poll sends reuse the open URL, and auto-refresh
    stands down for 1.5 s after an open — opening and scrolling each
    cost exactly one navigation, zero reloads;
  - verified against a real 200-line CJK novel: 183 monotone anchors,
    proportional mid-range mapping, exact top/bottom alignment.

### Fixed (the 0.65.x hardening this milestone shipped — details in the
### 0.65.9–0.65.13 entries below)
- Raw endpoint / short-line sends decoded as line 0 and snapped the
  preview to its top (user-confirmed twice).
- The 0.58-era \`__rbRestore\` ratio machinery overrode hash positioning
  after load.
- Non-monotonic anchors broke the scrollmap binary search.
- Opening the preview reloaded the page two or three times (poll/open
  race, then the auto-refresh double-fire after the cold-start retry).

`;

let en = read( 'CHANGELOG.md' );
en = replaceOnce( 'CHANGELOG.md', en, '## [0.65.13] - 2026-10-25', enEntry + '## [0.65.13] - 2026-10-25' );
write( 'CHANGELOG.md', en );
console.log( 'CHANGELOG.md: 0.66.0 added' );

// ---- 4. CHANGELOG.zh.md ----
const zhEntry = `## [0.66.0] - 2026-10-25 — 里程碑：实时滚动同步

### 新增
- **编辑器与 Markdown 预览的实时滚动同步**——滚动编辑器，预览逐行跟随
  （用户验证通过）：
  - 每个渲染块都标注源行号（marked 词法器 + 前向游标渲染器注入
    \`data-source-line\`）；页面构建滚动映射表，用二分查找 + 区间插值
    定位——即 VS Code / Typora 的锚点方案；
  - 编辑器顶端行以 \`行号*1000+千分比\` 编码，经面板 URL 的 \`#L\` 片段
    传递——显示行转换为逻辑行（\`Editor_ViewToLogical\`），折行段落带
    行内千分比精度（\`Editor_LogicalToView\`），两端点共用同一编码；
  - 定位全部走片段导航：面板直接打开在编辑器当前位置（页面在首帧前
    完成定位），轮询复用打开 URL，自动刷新在打开后 1.5 秒内退避——
    打开与滚动各自只产生一次导航，零重载；
  - 已用真实 200 行中文小说验证：183 个单调锚点、中段比例正确、
    顶部/底部精确对齐。

### 修复（本里程碑包含的 0.65.x 加固，细节见下方 0.65.9–0.65.13 条目）
- 裸端点/短行发送被解码成第 0 行，预览弹回顶部（用户两次确认）。
- 0.58 时代的 \`__rbRestore\` 比例机制在载入后覆盖哈希定位。
- 非单调锚点破坏滚动映射表的二分查找。
- 打开预览时页面重载两三次（轮询/打开赛跑，以及冷启动重试后的
  自动刷新二次触发）。

`;

let zh = read( 'CHANGELOG.zh.md' );
zh = replaceOnce( 'CHANGELOG.zh.md', zh, '## [0.65.13] - 2026-10-25', zhEntry + '## [0.65.13] - 2026-10-25' );
write( 'CHANGELOG.zh.md', zh );
console.log( 'CHANGELOG.zh.md: 0.66.0 added' );

// ---- 5. README.md ----
let rd = read( 'README.md' );
rd = replaceOnce( 'README.md', rd,
	'Current release: **0.50.0 — 2026-10-01**.',
	'Current release: **0.66.0 — 2026-10-25**.' );
rd = replaceOnce( 'README.md', rd,
	'- **marked.js v18** — the same rendering engine the official preview',
	`- **Live scroll sync (anchored)**: the preview follows the editor
  line-by-line as you scroll. Every rendered block carries its source
  line and the preview positions itself by anchor interpolation (the
  VS Code / Typora approach) — wrapped paragraphs get sub-line
  precision, top and bottom align exactly, and all positioning rides
  URL fragments, so syncing never reloads the page.
- **marked.js v18** — the same rendering engine the official preview` );
write( 'README.md', rd );
console.log( 'README.md: version + scroll-sync bullet' );

// ---- 6. README.zh.md ----
let rz = read( 'README.zh.md' );
rz = replaceOnce( 'README.zh.md', rz,
	'当前版本：**0.50.0 — 2026-10-01**。',
	'当前版本：**0.66.0 — 2026-10-25**。' );
rz = replaceOnce( 'README.zh.md', rz,
	'- **marked.js v18**——与官方预览同一渲染引擎、最新版本：完整 GFM',
	`- **实时滚动同步（锚点式）**：滚动编辑器时预览逐行跟随。每个渲染块
  都携带源行号，预览按锚点插值定位（VS Code / Typora 方案）——折行
  段落有行内千分比精度，顶部/底部精确对齐；定位全部走 URL 片段，
  同步过程零重载。
- **marked.js v18**——与官方预览同一渲染引擎、最新版本：完整 GFM` );
write( 'README.zh.md', rz );
console.log( 'README.zh.md: version + scroll-sync bullet' );

// ---- verify ----
const checks = [
	[ 'RichBar.rc', '0,66,0,0' ], [ 'CHANGELOG.md', '[0.66.0]' ],
	[ 'CHANGELOG.zh.md', '[0.66.0]' ], [ 'README.md', '0.66.0 — 2026-10-25' ],
	[ 'README.zh.md', '0.66.0 — 2026-10-25' ],
];
for ( const [ f, s ] of checks ) {
	if ( !read( f ).includes( s ) ) { console.error( 'VERIFY FAILED: ' + f + ' missing ' + s ); process.exit( 1 ); }
}
console.log( 'ALL VERIFIED' );
