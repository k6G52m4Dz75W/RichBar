# RichBar

[English](README.md) | 简体中文

**RichBar** 是一个 EmEditor 插件，提供增强的 HTML + Markdown 双模式工具栏，
基于 Emurasoft 官方 HTMLBar 插件源码（`19.5.0`）fork 而来。
它旨在替代 EmEditor v26 内置的 HTML/Markdown 工具栏（闭源、大部分标签
藏在下拉菜单里）。

## 功能

- **双模式自动切换**：按钮集跟随当前配置（HTML / Markdown 名称列表相互独立、
  持久保存），并以文件扩展名兜底（`.md` `.markdown` `.mdown` `.mkd` ↔
  `.htm` `.html` `.xhtml` `.shtml`）。切换文档或配置时自动重建工具栏。
- **手动模式切换 `[H][M]`**：工具栏最左侧两个成组按钮——按下的一侧是当前
  模式。覆盖新建未保存文档（无文件名、无配置信号）的场景；任何文档或配置
  变化都会回到自动检测。
- **Markdown 按钮集**（25 个）：H1–H6、粗体、斜体、删除线、行内代码、
  围栏代码块、引用、无序/有序（自动编号）/任务列表、水平线、链接、
  图片（文件选择器）、表格、自定义按钮。包裹类命令对已包裹文本再点击
  一次即取消。
- **运行时绘制、主题自适应图标**：按当前按钮尺寸直接绘制（任意 DPI 清晰），
  颜色按栏背景亮度自动取反（浅底深字 / 深底浅字），并带热态图像列表保证
  深色带区下悬停可读。图形图标取自系统图标字体（见下文）；主题/配置变化
  自动重绘。
- **多语言**：卫星资源 DLL（`mui\1033` 英文、`mui\2052` 简体中文）。
- **设置走官方通道**：`EE_REG_SET_VALUE` / `EE_REG_QUERY_VALUE`
  （`EmEditorPlugIns\RichBar` 键；INI 模式自动改用 `eePlugins.ini`），
  与原版 HTMLBar 插件的设置完全隔离。

## 工具栏图标对照

Markdown 按钮集的图形类图标取自系统图标字体——**Segoe Fluent Icons**
（Windows 11）与 **Segoe MDL2 Assets**（Windows 10）。两套字体码位相同，
但美术细节略有差异（删除线最明显），因此对照表分为两列预览。
预览图片直接引用微软官方 Learn 字形表。

| 工具栏按钮 | 码位 | Segoe Fluent Icons（Win 11） | Segoe MDL2 Assets（Win 10） |
|---|---|---|---|
| 粗体 | U+E8DD | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e8dd.png" width="20" alt="Bold (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e8dd.png" width="20" alt="Bold (MDL2)"> |
| 斜体 | U+E8DB | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e8db.png" width="20" alt="Italic (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e8db.png" width="20" alt="Italic (MDL2)"> |
| 删除线 | U+EDE0 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/ede0.png" width="20" alt="Strikethrough (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/ede0.png" width="20" alt="Strikethrough (MDL2)"> |
| 行内代码 | U+E943 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e943.png" width="20" alt="Code (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e943.png" width="20" alt="Code (MDL2)"> |
| 引用 | U+E848 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e848.png" width="20" alt="LeftQuote (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e848.png" width="20" alt="LeftQuote (MDL2)"> |
| 无序列表 | U+E8FD | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e8fd.png" width="20" alt="BulletedList (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e8fd.png" width="20" alt="BulletedList (MDL2)"> |
| 任务列表 | U+E9D5 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e9d5.png" width="20" alt="CheckList (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e9d5.png" width="20" alt="CheckList (MDL2)"> |
| 链接 | U+E71B | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e71b.png" width="20" alt="Link (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e71b.png" width="20" alt="Link (MDL2)"> |
| 图片 | U+E8B9 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e8b9.png" width="20" alt="Picture (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e8b9.png" width="20" alt="Picture (MDL2)"> |
| 自定义（齿轮） | U+E713 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/e713.png" width="20" alt="Settings (Fluent)"> | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-mdl/e713.png" width="20" alt="Settings (MDL2)"> |
| 标题 H1–H6 | — | 字母绘制 | 字母绘制 |
| 有序列表 | — | 形状绘制（官方无此字形） | 形状绘制（官方无此字形） |
| 表格 | U+F232 | <img src="https://learn.microsoft.com/en-us/windows/apps/design/iconography/images/segoe-fluent-icons/f232.png" width="20" alt="GridViewSmall (Fluent)"> | 形状绘制（MDL2 无此字形） |
| 代码块 | — | 字母绘制 `{ }` | 字母绘制 `{ }` |
| 水平线 | — | 线条绘制 | 线条绘制 |
| 模式开关 H / M | — | 字母绘制 | 字母绘制 |

**完整交互式参考**：[docs/glyph-reference.html](docs/glyph-reference.html)
列出了两套字体暴露的*全部*字形（比微软文档页展示的更多——不少是未文档化的），
基于本机安装的字体实时渲染，带 Light/Dark 配色切换、字体切换、名称/码位过滤，
并以蓝色边框标出 RichBar 当前映射的字形。可用
`tools/generate-glyph-reference.ps1` 重新生成（采用 GDI `GetGlyphIndices`
探测——与插件渲染相同的真值来源）。

### 最佳实践说明（依据官方指南）

- 图标字体的字形位于 Unicode 私有区（PUA），因此始终显式指定字体家族——
  Windows 11 用 Fluent Icons、Windows 10 用 MDL2 Assets（等价于 XAML 的
  `SymbolThemeFontFamily`），并且每个字形先用
  `GetGlyphIndices`（`GGI_MARK_NONEXISTING_GLYPHS`）探测存在性。
  某台机器上缺失的字形回退到字母/形状绘制——绝不出现"缺字方框"。
- 不使用已废弃的 `E0xx`–`E5xx` 码位段。
- 官方推荐字体尺寸 16/20/24/32/40/48/64（针对hinted渲染）；RichBar 以
  抗锯齿方式按任意尺寸渲染（可通过 `RichBar.h` 的 `GLYPH_SIZE_SCALE`
  调整），图标随按钮尺寸自由缩放。
- 不重分发任何字体文件——字体属于 Windows 的一部分，仅按家族名引用。

## 构建与安装

- Visual Studio（项目工具集 v142；新版 Build Tools 可用
  `-p:PlatformToolset=v145` 覆盖）：

  ```
  MSBuild RichBar.sln -p:Configuration=Release -p:Platform=x64 -p:PlatformToolset=v145
  ```

- 简体中文卫星 DLL 需要单独构建（只有此脚本会生成）：

  ```
  powershell -File tools\build-loc-2052.ps1
  ```

- 部署 `dist\`（`RichBar.dll` + `mui\1033\RichBar_loc.dll` +
  `mui\2052\RichBar_loc.dll`），在「自定义插件」中添加
  `dist\RichBar.dll`，或把自定义中的插件文件夹指向 `dist\`。

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
  "显示工具栏大图标"。HTML 位图会拉伸切换，Markdown 图标和 `[H][M]`
  开关按新尺寸直接重绘。
- **HTML 模式的按钮样式**：HTML 按钮集仍使用原版 BMP 彩色图标资产
  （未主题化）；Markdown 按钮集与 `[H][M]` 开关为运行时绘制、可主题自适应。

## 版本方案

| 版本区间 | 含义 |
|---------|------|
| `0.1.0`  | 原始上游 HTMLBar 源码原样 fork，未做任何修改。 |
| `0.4.x`  | 兼容性修复，使原插件能在现代 EmEditor（v26）上编译加载。 |
| `0.9.0` – `0.13.x` | HTML + Markdown 双模式工具栏，向 `1.0.0` 迈进。 |

详细变更见 [CHANGELOG.zh.md](CHANGELOG.zh.md)（中文）/
[CHANGELOG.md](CHANGELOG.md)（英文）。

## 许可

见 [LICENSE](LICENSE)。原版代码版权归 Emurasoft 所有。
