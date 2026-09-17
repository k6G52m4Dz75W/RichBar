# RichBar

[English](README.md) | 简体中文

**RichBar** 是一个 EmEditor 插件，提供增强的 HTML + Markdown 双模式工具栏，
基于 Emurasoft 官方 HTMLBar 插件源码（`19.5.0`）fork 而来。
它旨在替代 EmEditor v26 内置的 HTML/Markdown 工具栏（闭源、大部分标签
藏在下拉菜单里）。

当前版本：**0.14.0 — 2026-09-17**。

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
- **运行时绘制、主题自适应图标**：全部 20 个 Markdown 图标使用内嵌的 Lucide
  字体子集，按当前按钮尺寸与 DPI 直接绘制。颜色按栏背景亮度选择浅底深字或
  深底浅字，并带热态图像列表保证深色带区下悬停可读。主题/配置变化自动重绘。
- **多语言**：卫星资源 DLL（`mui\1033` 英文、`mui\2052` 简体中文）。
- **设置走官方通道**：`EE_REG_SET_VALUE` / `EE_REG_QUERY_VALUE`
  （`EmEditorPlugIns\RichBar` 键；INI 模式自动改用 `eePlugins.ini`），
  与原版 HTMLBar 插件的设置完全隔离。

## 工具栏图标对照

自 0.14.0 起，全部 20 个 Markdown 命令图标使用来自 `lucide-static`
**1.47.0** 的内嵌 **Lucide** 子集，不再使用 Segoe Fluent Icons /
Segoe MDL2 Assets。下表的索引、子集名称与码位与 `RichBar.h` 的当前映射一致。

| 图标索引 | 工具栏按钮 | Lucide 子集名称 | 码位 |
|---|---|---|---|
| 0 | 标题 H1 | `heading-1` | U+E385 |
| 1 | 标题 H2 | `heading-2` | U+E386 |
| 2 | 标题 H3 | `heading-3` | U+E387 |
| 3 | 标题 H4 | `heading-4` | U+E388 |
| 4 | 标题 H5 | `heading-5` | U+E389 |
| 5 | 标题 H6 | `heading-6` | U+E38A |
| 6 | 粗体 | `bold` | U+E05D |
| 7 | 斜体 | `italic` | U+E0FB |
| 8 | 删除线 | `strikethrough` | U+E177 |
| 9 | 行内代码 | `code` | U+E093 |
| 10 | 围栏代码块 | `code-xml` | U+E206 |
| 11 | 引用 | `quote` | U+E239 |
| 12 | 无序列表 | `list` | U+E106 |
| 13 | 有序列表 | `list-ordered` | U+E1D1 |
| 14 | 任务列表 | `list-todo` | U+E4C3 |
| 15 | 水平线 | `minus` | U+E11C |
| 16 | 链接 | `link` | U+E102 |
| 17 | 图片 | `image` | U+E0F6 |
| 18 | 表格 | `table` | U+E17D |
| 19 | 自定义 | `settings` | U+E154 |

### 渲染与字体打包

- `lucide_subset.ttf` 大小为 **7,780 字节**，以 `RCDATA` 资源内嵌于
  `RichBar.dll`。通过 `AddFontMemResourceEx` 直接从内存加载，仅对当前进程
  可用：**不安装系统字体，不创建临时字体文件**。用户无需预先安装 Lucide
  或 Segoe 图标字体。
- 普通/大图标画布在 **96 DPI 下为 16/24 px**，随显示 DPI 缩放（例如
  150% 缩放下为 24/36 px），不额外叠加 135% 放大。
- **H/M 模式开关保持不变**：使用 Segoe UI Bold 文字，普通/大图标在
  **96 DPI 下为 14/21 px**，随画布缩放。这些数值是像素字符高度，不是磅值。
  H/M 不属于 Lucide 子集；标题 H1–H6 与代码块在正常情况下现使用 Lucide。
- 内嵌字体无法加载时保留旧版字母/形状绘制作为回退。HTML 命令图标仍使用
  **原版彩色 BMP 资产**，保持不变，不随主题变色。EmEditor 自身的工具栏
  标题不受影响。
- 字体来源、SHA256、完整子集映射及许可说明见
  [docs/lucide-font.md](docs/lucide-font.md)。

### 图标回归测试

在安装了 Visual C++ 生成工具的 Windows 上，测试命令为：

```powershell
powershell -File tools/test-icon-rendering.ps1
```

0.14.0 的测试脚本覆盖**全部 20 个 Lucide 图标、多种尺寸及前景色**
（与直接 Lucide 绘制逐像素比对），并包含**模拟字体不可用和字形缺失时
的回退**子进程，以及字体注册/释放/重新初始化检查。这是离屏回归测试，
不表示 EmEditor 内的目视检查已经通过。

### Segoe 字形参考：仅作历史资料

[docs/glyph-reference.html](docs/glyph-reference.html) 保留为 Segoe Fluent
Icons / Segoe MDL2 Assets 的**历史**交互式字形目录。其中高亮映射对应
0.14.0 之前的实现，**不代表当前工具栏**。该页面使用本机安装的 Windows
字体渲染，不是 Lucide 预览，也不是当前映射的依据。可下载 HTML 文件后
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
  "显示工具栏大图标"。HTML 位图会拉伸切换，Markdown 图标和 `[H][M]`
  开关按新尺寸直接重绘。
- **HTML 模式的按钮样式**：HTML 按钮集仍使用原版 BMP 彩色图标资产
  （未主题化）；Markdown 按钮集与 `[H][M]` 开关为运行时绘制、可主题自适应。

## 版本方案

| 版本区间 | 含义 |
|---------|------|
| `0.1.0` | 原始上游 HTMLBar 源码原样 fork，未做任何修改。 |
| `0.4.x` | 兼容性修复，使原插件能在现代 EmEditor（v26）上编译加载。 |
| `0.9.0` – `0.14.x` | HTML + Markdown 双模式工具栏，向 `1.0.0` 迈进。 |

详细变更见 [CHANGELOG.zh.md](CHANGELOG.zh.md)（中文）/
[CHANGELOG.md](CHANGELOG.md)（英文）。

## 许可

见 [LICENSE](LICENSE)。原版代码版权归 Emurasoft 所有。
内嵌 Lucide 子集的第三方声明见 [LICENSE.third-party](LICENSE.third-party)：
包含完整上游 ISC 许可（Copyright 2026 Lucide Icons and Contributors），
以及 Feather 衍生图标的署名与 MIT 许可（Copyright 2013-present Cole Bemis）。
重新分发时必须保留这些声明。
