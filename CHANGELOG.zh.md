# 更新日志

**RichBar** 插件（基于原版 Emurasoft HTMLBar 的增强版 HTML + Markdown 工具栏）的所有重要变更均记录在本文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。版本号沿用本代码库历史沿革形成的项目专用方案：

| 版本区间 | 含义 |
|---------|------|
| `0.1.0`  | 原始上游 HTMLBar 源码原样 fork（Emurasoft `19.5.0` 合并版），未做任何修改。 |
| `0.4.x`  | 兼容性修复，使原插件能够在现代 EmEditor（v26）上正确编译和加载。 |
| `0.9.0` – `0.10.x` | HTML + Markdown 双模式工具栏，向 `1.0.0` 迈进。 |

## [0.10.3] - 2026-09-16

### 修复

- **恢复了自定义栏标题中的模式指示。** 栏标题再次根据当前模式显示 "HTML" 或
  "Markdown"（切换文档或配置时，标题随按钮集一起更新）。此前更名时把标题
  统一成了 "RichBar"，丢失了这个指示。标题字符串现在取自卫星资源
  （`IDS_TITLE` / 新增 `IDS_TITLE_MD`），不再硬编码。RichBar 品牌名保留在
  插件名称中。

## [0.10.2] - 2026-09-16

### 修复

- **插件版本列显示为陈旧的字符串 "14"。** EmEditor 的版本列来自插件自己的
  `EP_GET_VERSION` 字符串（卫星中的 `IDS_VERSION`），而不是文件本身的
  VERSIONINFO 资源，该字符串自 fork 原版 HTMLBar 起就一直未被改动。
  现在该字符串跟随发布版本更新。在卫星无法加载的时期（见 0.10.1），
  EmEditor 会静默退回读取 VERSIONINFO 资源，因此这个问题一直被掩盖。

## [0.10.1] - 2026-09-16

### 修复

- **插件列表中的名称显示为空白。** 两个独立原因，均已修复：
  - etlframe 解析插件字符串所用的卫星实例直到第一个框架创建（`EVENT_CREATE_FRAME`）
    后才初始化，而插件扫描阶段（尚无任何框架）发出的名称查询会退回到
    不含任何字符串的主 DLL。现在 `EEGetLocaleInstanceHandle` 会按需加载卫星
    （加载的实例缓存在 `m_hinstLoc` 中，随正常关闭流程释放），
    插件名称在扫描阶段即可正确解析。
  - EmEditor 按界面语言的资源标签精确匹配卫星资源：`mui\2052` 中的文件必须打上
    `LANG_CHINESE`（0x804）标签，而不能是英文标签（0x409）二进制的原样拷贝。
    卫星资源脚本现在通过 `LOC_LANG_2052` 预处理宏选择资源语言，
    `tools/build-loc-2052.ps1` 负责构建 `mui\2052` 版本。

## [0.10.0] - 2026-09-16

### 变更

- **插件全面更名为 RichBar。** 所有工程文件（`RichBar.sln`、`RichBar.vcxproj`、
  `RichBar.cpp/.h/.rc/.def`）、多语言资源工程（`mui/RichBar_loce`，产出 `RichBar_loc.dll`）、
  EmEditor 中显示的插件名与状态栏文本、自定义栏标题、属性对话框标题，
  全部由 HTMLBar 更名为 RichBar。
- **设置存储完全独立。** 插件 Profile 键名派生自插件 DLL 文件名，因此更名后
  设置存储从 `EmEditorPlugIns\HTMLBar` 迁移到全新的 `EmEditorPlugIns\RichBar` 键。
  新键不会与原版 HTMLBar 插件或任何同名插件发生冲突，同时仍然走官方的
  `EE_REG_SET_VALUE`/`EE_REG_QUERY_VALUE` 通道（注册表；INI 模式下自动改用 `eePlugins.ini`）。
- 自定义栏标题在两种模式下统一显示为 "RichBar"（当前按钮集本身即可表明所处模式）；
  之前显示 "HTML"/"Markdown"。
- 版本编号从最初拟用的 0.9.1 改为 0.10.0——更名的改动规模超出了一个补丁版本的范畴。

### 移除

- 移除了将旧 HTMLBar 布局保存的单数组按钮数据（`CmdArray`）自动迁移的逻辑——
  RichBar 是全新插件，从零开始。
- 移除了从原版 HTMLBar 安装器继承的 MSI 卸载集成
  （读取 `HKLM\...\EmEditorPlugIns\HTMLBar` 中 ProductCode 的逻辑）；
  卸载现在使用标准的"确认后删除插件设置"流程。

## [0.9.0] - 2026-09-16

### 新增

- **Markdown 模式。** 工具栏现在携带两套完整的命令集（HTML 和 Markdown），并自动切换：
  模式依据当前配置名检测（Markdown / HTML 配置名列表相互独立，且跨会话持久保存），
  并以文件扩展名兜底（`.md` `.markdown` `.mdown` `.mkd` 与 `.htm` `.html` `.xhtml` `.shtml`）。
  切换文档或配置时，自定义栏会以对应按钮集自动重建。
- **Markdown 按钮集**（25 个平铺按钮）：H1–H6 标题、粗体、斜体、删除线、行内代码、
  围栏代码块、引用、无序列表、有序列表（自动编号）、任务列表、水平线、链接、
  图片（带文件选择器）、Markdown 表格（复用行列对话框）、以及自定义按钮。
- 新增 `CMD_LINE_PREFIX` 命令类型：为选区各行添加/取消行前缀（标题、引用、列表），
  切换样式时自动剥离冲突的 Markdown 前缀，有序列表自动编号。重复点击同一前缀即取消。
- 包裹类命令支持切换语义：对已被包裹的文本再次点击粗体（及所有 `CMD_TAGS` 命令）
  将移除标记，而不是嵌套。
- **运行时绘制的 Markdown 图标**：Segoe UI 字形按当前按钮尺寸直接绘制在透明背景上，
  颜色取自编辑器的栏文字色（`EI_GET_BAR_TEXT_COLOR`）。任意 DPI 下都保持清晰，
  并与深色/浅色主题自然融合。
- 自定义栏标题现在反映当前模式（"HTML" / "Markdown"）。

### 变更

- 命令集按模式分别持久化（插件 Profile 中的 `CmdArray0` / `CmdArray1`）；
  早期版本写入的单数组数据会自动迁移到 HTML 按钮集。

## [0.4.0] - 2026-09-15

### 修复

- **现代 EmEditor 上工具栏以零宽度挂载。** 工具栏控件带有 `CCS_NORESIZE` 样式，
  导致其窗口始终保持初始的 0 像素宽度；而 EmEditor v26 在挂载时只测量一次客户窗口尺寸，
  把自定义栏定成仅有标题的宽度，最终渲染出一条空栏（只有"HTML"字样、没有任何按钮）。
  现在会在调用 `Editor_ToolbarOpen` 之前通过 `TB_GETMAXSIZE` + `MoveWindow`
  显式撑开窗口，并改为发送理想宽度，不再恢复过期的旧 band 宽度。
- **插件列表中版本号为空。** 工程从未嵌入 `VERSIONINFO` 资源；现已补上，
  插件从此可以像其他插件一样正常报告版本号。
- **MUI 资源 DLL 编译失败**（`致命错误 RC1015: 无法打开包含文件 'afxres.h'`）：
  资源脚本改用 `winres.h`，移除了隐藏的 MFC 依赖。

## [0.1.0] - 2019-12-19

### 基线

- 从 Emurasoft fork 而来的原始 HTMLBar 插件源码（`19.5.0` 版本合并），
  未做任何修改。这是之后所有版本演进的对照基准。
