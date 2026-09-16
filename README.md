# RichBar

**RichBar** 是一个 EmEditor 插件，提供增强的 HTML + Markdown 双模式工具栏，
基于 Emurasoft 官方 HTMLBar 插件源码（`19.5.0`）fork 而来。
它旨在替代 EmEditor v26 内置的 HTML/Markdown 工具栏（闭源、标签藏在下拉菜单里）。

## 功能

- **双模式自动切换**：根据当前配置名（HTML / Markdown 列表独立持久化）自动切换
  按钮集，并以文件扩展名兜底（`.md` `.markdown` `.mdown` `.mkd` ↔ `.htm` `.html` `.xhtml` `.shtml`）。
- **手动模式切换 `[H][M]`**：工具栏最左侧两个成组按钮，按下的一侧是当前模式。
  适合新建未保存文档（无文件名、无配置信号）时手动指定；任何文档或配置变化
  自动回到检测模式。
- **Markdown 按钮集**（25 个）：H1–H6、粗体、斜体、删除线、行内代码、围栏代码块、
  引用、无序/有序（自动编号）/任务列表、水平线、链接、图片（文件选择器）、
  表格、自定义按钮。包裹类命令对已包裹文本再点击一次即取消。
- **运行时绘制图标**：按当前按钮尺寸直接绘制，任意 DPI 清晰；
  颜色按栏背景亮度自动取反（浅底深字 / 深底浅字），主题或配置变化时自动重绘。
- **多语言**：卫星资源 DLL（`mui\1033` 英文、`mui\2052` 简体中文标签）。
- **设置走官方通道**：`EE_REG_SET_VALUE` / `EE_REG_QUERY_VALUE`
  （`EmEditorPlugIns\RichBar` 键，INI 模式自动改用 `eePlugins.ini`），
  与原版 HTMLBar 插件的设置完全隔离。

## 构建与安装

- Visual Studio（项目工具集 v142，可用 `-p:PlatformToolset=v145` 覆盖构建）：

  ```
  MSBuild RichBar.sln -p:Configuration=Release -p:Platform=x64 -p:PlatformToolset=v145
  ```

- 2052 中文卫星需要额外构建（只有此脚本会生成）：

  ```
  powershell -File tools\build-loc-2052.ps1
  ```

- 部署 `dist\`（`RichBar.dll` + `mui\1033\RichBar_loc.dll` + `mui\2052\RichBar_loc.dll`），
  在 EmEditor「自定义插件」中添加 `dist\RichBar.dll`，或把
  自定义中的插件文件夹指向 `dist\`。

## 使用提示（实测有效）

- **不想要屏幕上的 "RichBar" 标题文字**：EmEditor 自定义选项中有"工具栏标题"
  显示开关，关掉即可。注意**不要**通过清空插件传给 EmEditor 的栏标题来实现
  （0.11.1 试过）：查看 > 工具栏 菜单用这个标题作为工具栏的名称和开关依据，
  清空会导致菜单条目空白。0.11.3 起标题为常量 "RichBar"，交给 EmEditor 的
  显示开关去控制屏幕显示，两者各司其职。
- **深色工具栏**：工具 > 自定义 > 视图 > "自定义栏颜色"，
  取消"使用系统颜色"，背景设深色（如 `#1E1E1E`）、文字设浅色（如 `#D0D0D0`）。
  插件图标会按背景亮度自动翻转为浅色字形，切回浅色也自动反转。
  `.eetheme` 主题文件只影响编辑器文本区，管不到工具栏区域。
- **Very Dark（极暗）模式**：0.12.0 起通过官方接口（`EI_IS_VERY_DARK` /
  `EI_WM_CTLCOLOR` / `EI_WM_THEMECHANGED`）自动适配——栏区域融入黑色带区、
  图标翻转为浅色，主题切换实时跟随；旧版 EmEditor 不受影响。
- **HTML 模式的按钮样式**：HTML 按钮集仍使用原版 BMP 彩色图标资产
  （未主题化）；Markdown 按钮集与 `[H][M]` 开关为运行时绘制、可主题自适应。

## 版本方案

| 版本区间 | 含义 |
|---------|------|
| `0.1.0`  | 原始上游 HTMLBar 源码原样 fork，未做修改。 |
| `0.4.x`  | 兼容性修复，使原插件能在现代 EmEditor（v26）上编译加载。 |
| `0.9.0` – `0.11.x` | HTML + Markdown 双模式工具栏，向 `1.0.0` 迈进。 |

详细变更见 [CHANGELOG.md](CHANGELOG.md)（英文）/ [CHANGELOG.zh.md](CHANGELOG.zh.md)（中文）。

## 许可

见 [LICENSE](LICENSE)。原版代码版权归 Emurasoft 所有。
