# RichBar

[English](README.md) | 简体中文

**RichBar** 是一个 EmEditor 插件，提供增强的 HTML + Markdown 双模式工具栏，
基于 Emurasoft 官方 HTMLBar 插件源码（`19.5.0`）fork 而来。
它旨在替代 EmEditor v26 内置的 HTML/Markdown 工具栏（闭源、大部分标签
藏在下拉菜单里）。

当前版本：**0.20.9 — 2026-09-20**。

## 功能

- **双模式自动切换**：按钮集跟随当前配置（HTML / Markdown 名称列表相互独立、
  持久保存），并以文件扩展名兜底（`.md` `.markdown` `.mdown` `.mkd` ↔
  `.htm` `.html` `.xhtml` `.shtml`）。切换文档或配置时自动重建工具栏。
- **手动模式切换 `[H][M]`**：工具栏最左侧两个成组按钮——按下的一侧是当前
  模式。覆盖新建未保存文档（无文件名、无配置信号）的场景；任何文档或配置
  变化都会回到自动检测。
- **Markdown 按钮集**：20 个命令图标加 5 个分隔符——H1–H6、粗体、斜体、
  删除线、行内代码、围栏代码块、引用、无序/有序（自动编号）/任务列表、
  水平线、链接、图片（文件选择器）、表格、自定义按钮。包裹类命令对已包裹
  文本再点击一次即取消。
- **运行时绘制、主题自适应图标**：内嵌 Remix Icon 字体子集覆盖全部 20 个
  Markdown 图标、全部 48 个 HTML 槽位以及 [H][M] 两个开关字形，按当前
  按钮尺寸与 DPI 直接绘制——整个工具栏共用同一套笔画语言。按栏背景亮度
  自动取反（浅底深字 / 深底浅字）；悬停/按下时控件使用浅色系统高亮
  填充，其上改用深色字形（热图像列表与按压副本），实时绘制的下拉三角
  同样变深。主题/配置变化自动重绘。
- **多语言**：卫星资源 DLL（`mui\1033` 英文、`mui\2052` 简体中文）。
- **设置走官方通道**：`EE_REG_SET_VALUE` / `EE_REG_QUERY_VALUE`
  （`EmEditorPlugIns\RichBar` 键；INI 模式自动改用 `eePlugins.ini`），
  与原版 HTMLBar 插件的设置完全隔离。

## 工具栏图标对照

自 0.16.0 起，两套按钮集均绘制自
[Remix Icon](https://github.com/Remix-Design/RemixIcon) **4.9.1** 的内嵌
**Remix Icon** 子集——全部 48 个 HTML 槽位（25 个默认按钮 + 23 个仅自定义
对话框可见的命令）与全部 20 个 Markdown 图标——不再使用旧版 HTML 彩色
位图和 Segoe Fluent Icons / Segoe MDL2 Assets。已保存的图标槽位、自定义
配置和命令行为保持不变，只有图形及其颜色/DPI 自适应能力发生变化。59 个
去重名称与码位见 [`docs/remix-icon.md`](docs/remix-icon.md)；Markdown
集合为：

| 图标索引 | 工具栏按钮 | Remix Icon 名称 | 码位 |
|---|---|---|---|
| 0 | 标题 H1 | `h-1` | U+EDE6 |
| 1 | 标题 H2 | `h-2` | U+EDE7 |
| 2 | 标题 H3 | `h-3` | U+EDE8 |
| 3 | 标题 H4 | `h-4` | U+EDE9 |
| 4 | 标题 H5 | `h-5` | U+EDEA |
| 5 | 标题 H6 | `h-6` | U+EDEB |
| 6 | 粗体 | `bold` | U+EAD1 |
| 7 | 斜体 | `italic` | U+EE6B |
| 8 | 删除线 | `strikethrough` | U+F1AB |
| 9 | 行内代码 | `code-s-slash-line` | U+EBAD |
| 10 | 围栏代码块 | `code-box-line` | U+EBA7 |
| 11 | 引用 | `double-quotes-l` | U+EC51 |
| 12 | 无序列表 | `list-unordered` | U+EEBE |
| 13 | 有序列表 | `list-ordered` | U+EEBB |
| 14 | 任务列表 | `list-check-2` | U+EEB9 |
| 15 | 水平线 | `subtract-line` | U+F1AF |
| 16 | 链接 | `link` | U+EEB2 |
| 17 | 图片 | `image-line` | U+EE4B |
| 18 | 表格 | `table-line` | U+F1DE |
| 19 | 自定义 | `settings-line` | U+F0EE |

### 渲染与字体打包

- `remixicon_subset.ttf`（61 个去重图标，**8,924 字节**）以 `RCDATA` 资源
  （`IDR_ICON_FONT`）内嵌于 `RichBar.dll`。通过 `AddFontMemResourceEx`
  直接从内存加载，仅对当前进程可用：**不安装系统字体，不创建临时字体
  文件**。用户无需预先安装 Remix Icon 或 Segoe 图标字体。可用
  `node tools/subset-icon-font.cjs <Remix Icon 字体目录>` 重新生成
  （见 [`docs/remix-icon.md`](docs/remix-icon.md)）。
- 普通/大图标画布在 **96 DPI 下为 16/24 px**，随显示 DPI 缩放（例如
  150% 缩放下为 24/36 px），不额外叠加 135% 放大。
- **H/M 模式开关同样是图标字体字形**（0.17.0 起）：使用 Remix 的
  `html5-fill`（U+EE40）与 `markdown-fill`（U+EF1D）图案取代原先的
  Segoe UI Bold 字母——工具栏上的所有按钮都来自同一个内嵌子集。
- **没有回退图形**：0.16.0 起旧版 Markdown 字母/形状绘制与 HTML `?` 标记
  已删除；字形无法解析（字体注册失败或字形不可用）的槽位保持空白——
  这是明确的简化，字体随 DLL 一起发布。
- **下拉标识（Word 式分体布局）**：三个下拉按钮（标题、字体、窗体）比
  普通按钮宽出一个专用箭头区，小实心三角（Remix `arrow-down-s-fill`
  字形）在绘制阶段直接画到按钮上——锚定按钮的真实矩形右缘，与控件
  如何摆放图像无关，并随其余图形使用同一前景色，悬停/按下时变为深色。
  工具栏不设 `TBSTYLE_EX_DRAWDDARROWS` 扩展样式，控件因此不绘制任何
  箭头，不会出现异色图形；整颗按钮点击发送 `TBN_DROPDOWN` 打开菜单，
  悬停同样会自动展开。
- **图标颜色自定**：插件属性对话框新增"图标颜色"行——**自动**（默认，
  按栏背景亮度取黑/白墨色）或**自定义**（标准颜色对话框任选），作用于
  字形与下拉三角，随其他设置持久化，确定后工具栏立即重绘。悬停/按下
  仍为深色墨迹，保证在浅色高亮填充上可读。属性对话框的这行设置与
  **工具栏上的"图标颜色"按钮**（弹出菜单：自动 / 自定义颜色…）等效，
  旧版保存的按钮布局会自动补上这个新按钮。
- **设计视图与预览按钮**：*Design View*（仅 Markdown 模式显示）切换
  EmEditor 的 Markdown 设计视图（`EEID_MARKDOWN_VIEW`）；*Preview* 运行
  EmEditor 官方的 WebPreview 插件，在内嵌窗格中渲染当前 HTML/Markdown
  文档。同样会自动补进旧版保存的布局，配专用
  `layout-column-line` / `eye-line` 字形。
- **旧版 HTML 彩色 BMP 不再被加载**（资源仍保留在 DLL 中，插件列表中的
  插件入口图标仍使用自己的位图）。悬停/按下为浅色系统高亮填充，深色
  字形副本保证其上可读。
- 字体来源、SHA256、完整子集映射及许可说明见
  [docs/remix-icon.md](docs/remix-icon.md)。

### 图标回归测试

在安装了 Visual C++ 生成工具的 Windows 上，测试命令为：

```powershell
powershell -File tools/test-icon-rendering.ps1
```

0.17.x 的测试脚本覆盖**全部 20 个 Markdown 图标及 H/M 字形、7 种尺寸 ×
2 种前景色**（与直接 Remix Icon 绘制逐像素比对，共 280 项），以及两种
模式的**真实图像列表**（含 H/M 槽位，每场景 732 项比较），并包含**断言
全部槽位保持空白的回退**子进程及字体注册/释放/重新初始化检查。这是
离屏回归测试，不表示 EmEditor 内的目视检查已经通过。

### Segoe 字形参考：仅作历史资料

[docs/glyph-reference.html](docs/glyph-reference.html) 保留为 Segoe Fluent
Icons / Segoe MDL2 Assets 的**历史**交互式字形目录。其中高亮映射对应
0.14.0 之前的实现，**不代表当前工具栏**。该页面使用本机安装的 Windows
字体渲染，不是 Remix Icon 预览，也不是当前映射的依据。可下载 HTML 文件后
本地打开；GitHub 默认显示源码。

## 构建与安装

在仓库根目录运行构建命令。

- Visual Studio（项目工具集 v142；新版 Build Tools 可用
  `-p:PlatformToolset=v145` 覆盖）：

  ```
  MSBuild RichBar.sln -p:Configuration=Release -p:Platform=x64 -p:PlatformToolset=v145
  ```

  此步骤在 `x64\Release\PlugIns\` 下生成主 DLL 与英文（`1033`）卫星 DLL。

- 简体中文（`2052`）卫星 DLL 需要单独构建。
  `tools/build-loc-2052.ps1` 位于**本仓库内部**；它**只负责构建，不负责部署**：

  ```powershell
  powershell -File tools\build-loc-2052.ps1
  ```

- **手动部署**到仓库同级的 **`../dist/`** 目录，而不是仓库内部的 `dist/`。
  将新构建的主 DLL 与两个卫星 DLL 按以下目录结构复制，并将仓库根目录的
  `LICENSE.third-party` 复制到主 DLL 旁：

  ```text
  ../dist/
    RichBar.dll
    LICENSE.third-party
    mui/
      1033/RichBar_loc.dll
      2052/RichBar_loc.dll
  ```

  在「自定义插件」中添加 `..\dist\RichBar.dll`，或把 EmEditor 的插件文件夹
  指向 `..\dist\`。字体已内嵌于主 DLL，无需另行安装字体或部署独立 TTF 文件。

## 使用提示（实测有效）

- **不想要屏幕上的 "RichBar" 标题文字**：EmEditor 自定义选项中有"工具栏
  标题"显示开关，关掉即可。注意**不要**通过清空插件传给 EmEditor 的栏标题
  来实现（0.11.1 试过）：查看 > 工具栏 菜单用这个标题作为工具栏的名称和
  开关依据，清空会导致菜单条目空白。0.11.3 起标题为常量 "RichBar"，
  交给 EmEditor 的显示开关去控制屏幕显示，两者各司其职。
- **深色工具栏**：工具 > 自定义 > 视图 > "自定义栏颜色"，取消"使用系统
  颜色"，背景设深色（如 `#1E1E1E`）、文字设浅色（如 `#D0D0D0`）。
  插件图标会按背景亮度自动翻转为浅色字形，切回浅色也自动反转。
  `.eetheme` 主题文件只影响编辑器文本区，管不到工具栏区域。
- **Very Dark（极暗）模式**：0.12.0 起通过官方接口（`EI_IS_VERY_DARK` /
  `EI_WM_CTLCOLOR` / `EI_WM_THEMECHANGED`）自动适配——栏区域融入黑色带区、
  图标翻转为浅色，主题切换实时跟随；旧版 EmEditor 不受影响。
- **高分辨率屏幕**：自定义中（与工具栏标题显示相同的设置处）可选择
  "显示工具栏大图标"。两套图标都会按新尺寸和 DPI 直接重绘。
- **HTML 模式的按钮样式**：HTML 与 Markdown 两套按钮集均绘制自内嵌
  Remix Icon 子集、可主题自适应；HTML 集合不再使用原版彩色 BMP 工具栏
  资产。插件列表中的插件入口图标保持不变。

## 版本方案

| 版本区间 | 含义 |
|---------|------|
| `0.1.0` | 原始上游 HTMLBar 源码原样 fork，未做任何修改。 |
| `0.4.x` | 兼容性修复，使原插件能在现代 EmEditor（v26）上编译加载。 |
| `0.9.0` – `0.17.x` | HTML + Markdown 双模式工具栏，向 `1.0.0` 迈进。 |

详细变更见 [CHANGELOG.zh.md](CHANGELOG.zh.md)（中文）/
[CHANGELOG.md](CHANGELOG.md)（英文）。

## 许可

见 [LICENSE](LICENSE)。原版代码版权归 Emurasoft 所有。
内嵌 Remix Icon 子集的第三方声明见 [LICENSE.third-party](LICENSE.third-party)：
完整逐字收录 Remix Icon License v1.0（Copyright (c) 2017–2026 Remix Design），
取自上游 [Remix Icon](https://github.com/Remix-Design/RemixIcon) 4.9.1
发布包。重新分发时必须保留该声明。
