<div align="center">

<img src="assets/icon.png" width="64" alt="Lunelle" />

<sub>A DESKTOP COMPANION · 一册桌边手账</sub>

# Lunelle

**在桌面的一角，留一小片月色。**

Lunelle 抱着星星，坐在你工作的地方。<br />
左键，回应一个小动作；右键，陪你翻开手账。

<a href="assets/characters/idle-seated.png"><img src="assets/characters/idle-seated.png" width="280" alt="Lunelle：淡紫卷发、月牙扣饰与星星抱枕" /></a>

[![Release](https://img.shields.io/github/v/release/Timiocoisin/Lunelle?style=flat-square&color=8b74b3)](https://github.com/Timiocoisin/Lunelle/releases/latest)
![Windows x64](https://img.shields.io/badge/Windows-x64-a6bde6?style=flat-square)
[![License](https://img.shields.io/badge/code-MIT-c7a0c6?style=flat-square)](LICENSE)

[下载 Windows 版](https://github.com/Timiocoisin/Lunelle/releases/latest) · [翻开手账](#journal) · [看看她的日常](#motion) · [设计画册](#design)

<sub>Windows x64 · 简体中文 · 本地只读数据 · 无需 API key</sub>

</div>

---

Lunelle 是一只带着 Codex 使用手账的 Windows 桌宠。她可以留在屏幕边缘，也可以抱着星星散一会儿步。需要查看额度时，右键点击宠物或从托盘选择「动作 8 · 面板陪伴」便能展开面板，读到剩余比例、重置时间和本机用量。

淡紫卷发与层叠裙摆之外，还有一本沿着手绘曲线展开的手账。角色与界面使用相近的颜色，信息有自己的位置，小动作也有自己的节奏。

<sub>本文交互与面板陪伴截图对应 main 分支。下方 v0.3.25 安装包为已发布版本，尚未包含本轮陪伴与鼠标交互更新；体验当前实现可从源码运行。</sub>

<a id="journal"></a>
## 01 / 翻开手账

还剩多少额度，下一次何时重置，今天用了多少 token。几件工作时常想知道的小事，放进同一页里。城市天气也可以一并留下。

<table>
<tr><th>额度手账</th><th>设置手册</th></tr>
<tr>
<td align="center" valign="top"><a href="docs/images/quota-panel-restored-hd.png"><img src="docs/images/quota-panel-restored-hd.png" width="340" alt="Lunelle 的 Codex 额度手账" /></a></td>
<td align="center" valign="top"><a href="docs/images/appearance-settings-restored-hd.png"><img src="docs/images/appearance-settings-restored-hd.png" width="400" alt="淡紫色手账风格的设置手册" /></a></td>
</tr>
</table>

<p align="center"><sub>额度页与设置手册 · 点击图片查看高清原图 · 截图使用隔离演示数据</sub></p>

| 信息 | 内容 |
| :--- | :--- |
| 额度 | 5 小时与每周剩余比例、重置时间与倒计时 |
| 用量 | 今日、本周与最近一轮 token；已完成任务运行时长 |
| 会话 | 最近活动会话的模型、推理强度与套餐信息 |
| 天气 | 手动选择城市的温度与天气，可随时关闭 |

纸边略有起伏，装订孔沿左侧排开，浅蓝色信息块落在淡紫底色上。设置窗口延续这套手账样式，连滚动条也收成细细的一笔。读取状态与操作按钮各有位置，翻阅时始终找得到。

额度变化通过本地连接接收，本机会话日志更新也会触发读取。[数据来源与统计口径](#data)在下文单独说明。

<a id="motion"></a>
## 02 / 她的桌边日常

没有被打扰时，她抱着星星在桌面慢慢散步。左键轻点，她会停下来，随机回应一次呼吸、眨眼、歪头、点头或挥手；按住拖动才会进入拎起动作，松手后轻轻落回坐姿。片刻安静之后，她再继续溜达。

| 动作 | 如何遇见她 |
| :--- | :--- |
| 01 呼吸 | 左键随机触发；坐姿也有舒缓起伏 |
| 02 眨眼 | 左键随机触发；眼皮经过半闭、闭合与睁开 |
| 03 歪头 | 左键随机触发；头肩平缓倾斜后回正 |
| 04 点头 | 左键随机触发；轻轻下俯，配合合眼 |
| 05 挥手 | 左键随机触发；抬手招呼，再缓缓收回 |
| 06 拎起与落地 | 按住并拖动触发；松手缓冲、回坐 |
| 07 散步 | 默认开启；空闲约 8–12 秒后，在当前屏幕内走动 |
| 08 面板陪伴 | 右键直接触发；双手搭住手账上沿，轻微呼吸、偶尔歪头 |

### 趴在纸边，陪你看一会儿

右键点击她，手账便展开。大半身人物留在最外层纸边上，双手稳稳搭住，头肩轻轻起伏。原来的坐姿会淡出，页面上只留一个 Lunelle。

<p align="center"><a href="docs/images/panel-companion-current.png"><img src="docs/images/panel-companion-current.png" width="380" alt="当前实机面板陪伴：大半身 Lunelle 趴在手账最上沿，双手搭住纸边" /></a></p>

<p align="center"><sub>当前实机截图 · 使用隔离演示数据 · 呼吸与歪头在运行时连续播放</sub></p>

按住趴边人物仍可拖动位置。点击纸边的 ×、按 Esc 或点击面板外，即可收起手账；移开鼠标不会自动关闭。陪伴与设置期间暂停散步，收起后重新开始空闲计时。

### 一个眨眼的片刻

<table>
<tr><th>睁眼</th><th>轻轻合眼</th><th>短暂停留</th><th>重新睁开</th></tr>
<tr>
<td align="center"><a href="docs/images/blink-open-hd.png"><img src="docs/images/blink-open-hd.png" width="170" alt="实机动作：睁眼" /></a></td>
<td align="center"><a href="docs/images/blink-half-close-hd.png"><img src="docs/images/blink-half-close-hd.png" width="170" alt="实机动作：半闭眼" /></a></td>
<td align="center"><a href="docs/images/blink-closed-hd.png"><img src="docs/images/blink-closed-hd.png" width="170" alt="实机动作：闭眼短停" /></a></td>
<td align="center"><a href="docs/images/blink-half-open-hd.png"><img src="docs/images/blink-half-open-hd.png" width="170" alt="实机动作：眼皮抬起" /></a></td>
</tr>
</table>

### 抬头，回应一下

<table>
<tr><th>歪头</th><th>点头</th><th>挥手</th></tr>
<tr>
<td align="center"><a href="docs/images/tilt-head-hd.png"><img src="docs/images/tilt-head-hd.png" width="220" alt="实机动作：轻轻歪头" /></a></td>
<td align="center"><a href="docs/images/nod-head-hd.png"><img src="docs/images/nod-head-hd.png" width="220" alt="实机动作：闭眼点头" /></a></td>
<td align="center"><a href="docs/images/wave-arm-a-hd.png"><img src="docs/images/wave-arm-a-hd.png" width="220" alt="实机动作：抬手招呼" /></a></td>
</tr>
</table>

### 换个地方坐

<table>
<tr><th>悬空抱膝</th><th>落地回坐</th></tr>
<tr>
<td align="center"><a href="docs/images/drag-suspended-design-hd.png"><img src="docs/images/drag-suspended-design-hd.png" width="300" alt="实机动作：抱膝悬空，两只鞋底朝前" /></a></td>
<td align="center"><a href="docs/images/landing-seated-design-hd.png"><img src="docs/images/landing-seated-design-hd.png" width="300" alt="实机动作：闭眼笑容与并膝坐姿" /></a></td>
</tr>
</table>

<p align="center"><sub>以上为运行界面导出的动作相位。静态图呈现姿势，动画中包含起势与回落。</sub></p>

### 抱着星星，走一小段

<p align="center"><a href="docs/images/walk-v19.webp"><img src="docs/images/walk-v19.webp" width="320" alt="Lunelle 抱着星星散步的慢速循环预览" /></a></p>

<p align="center"><sub>散步每轮 1.08 秒。预览保留原版造型与步态；运行素材另含偶发眨眼。</sub></p>

自动散步默认开启，她会在工作间隙走动一会儿。向左走便朝左，向右走便朝右；鼠标从身边经过，她继续散步。点击她，或翻开手账，她就停下来。

当前散步保留选定造型的角色比例、裙摆与绘画质感，以完整画面播放。腿部以八张关键姿势为基础，带有逐帧动画的节奏；技术细节见[动作与播放说明](docs/ANIMATION.md)。

<details>
<summary>查看两个步态相位</summary>

<table>
<tr><th>相位 A</th><th>相位 B</th></tr>
<tr>
<td align="center"><a href="docs/images/walk-v19-phase-a.png"><img src="docs/images/walk-v19-phase-a.png" width="280" alt="第 19 版实机散步相位 A" /></a></td>
<td align="center"><a href="docs/images/walk-v19-phase-b.png"><img src="docs/images/walk-v19-phase-b.png" width="280" alt="第 19 版实机散步相位 B" /></a></td>
</tr>
</table>

</details>

自动活动默认开启，使用全屏散步。在「设置 → 交互与说明」中，可以选择原地活动或全屏散步，也可以先逐个预览动作。

<details>
<summary>散步与操作如何配合</summary>

| 场景 | 行为 |
| :--- | :--- |
| 空闲约 8～12 秒 | 才可能开始自动活动 |
| 全屏散步 | 在当前显示器工作区内选取目标，不自行跨屏 |
| 鼠标经过 | 继续走动 |
| 点击宠物或开始拖动 | 停止自动活动，交还操作 |
| 展开手账、打开设置或隐藏桌宠 | 暂停走动 |
| 手动放置之后 | 保存手动位置；临时散步不覆盖它 |

</details>

<a id="design"></a>
## 03 / 一颗星星的设计手记

卷发从淡紫渐变到浅蓝，裙摆一层层铺开，鞋扣上留着小小的月牙。那颗紫色星星总在怀里，坐着、走着，或被轻轻拎起时，都能认出她。

动作设计从这些细节出发：坐姿要让裙摆舒展开，悬空时鞋底朝前，落地后回到并膝坐姿。下面的原始概念稿，记录了八个动作最初的模样。

<p align="center"><a href="docs/design/xingyue-motion-concepts-v1.png"><img src="docs/design/xingyue-motion-concepts-v1.png" width="1000" alt="原始八动作设计总览：呼吸、眨眼、歪头、点头、挥手、拖动落地、散步与面板陪伴" /></a></p>

<p align="center"><sub>八动作概念稿 · 保留项目曾用名 Xingyue · 当前表现以上方运行截图与动图为准</sub></p>

<details>
<summary>展开查看坐姿与拖动落地设计稿</summary>

**抱着星星，睁眼与合眼。**

<a href="docs/design/lunelle-seated-idle-atlas-v1.png"><img src="docs/design/lunelle-seated-idle-atlas-v1.png" width="880" alt="角色坐姿设计稿：相同服饰与比例的睁眼、闭眼状态" /></a>

**悬空时收起双腿，落地后铺开裙摆。**

<a href="docs/design/lunelle-drag-design-aligned-v1.png"><img src="docs/design/lunelle-drag-design-aligned-v1.png" width="880" alt="拖动与落地设计稿：抱膝悬空与闭眼回坐" /></a>

</details>

[翻阅完整设计画册 →](docs/DESIGN.md)

<a id="download"></a>
## 04 / 邀请她来到桌面

**[下载 Windows x64 安装包 · v0.3.25](https://github.com/Timiocoisin/Lunelle/releases/download/v0.3.25/Lunelle-Setup-0.3.25-x64.exe)** · [查看发布记录](https://github.com/Timiocoisin/Lunelle/releases)

### 从第一页，与你见面

安装也从一本手账开始。花枝沿着曲线纸边舒展，Lunelle 在左页挥手、阅读或安静等待；右页依次展开许可、安装位置与进度。空白纸面可以拖动，中文条款、路径选择和操作按钮都有各自的位置。

<p align="center"><a href="docs/design/installer-final/01.png"><img src="docs/design/installer-final/01.png" width="1000" alt="Lunelle 手账安装器欢迎页：水彩花枝、曲线纸边与挥手人物" /></a></p>

<details>
<summary>翻阅安装器的六个页面</summary>

<p align="center"><a href="docs/design/installer-final/overview.png"><img src="docs/design/installer-final/overview.png" width="1100" alt="安装器六页实机总览：欢迎、中文许可、安装范围、位置、进度与完成" /></a></p>

[逐页查看高清界面 →](docs/design/installer-final/README.md)

</details>

**v0.3.25** 包含六页手账安装器、更清楚的呼吸起伏，以及保留原造型的慢速散步与左右朝向切换。安装仅面向当前 Windows 用户，可选择安装目录、桌面和开始菜单快捷方式；升级保留已有偏好设置。

1. 安装并登录 Codex，确认本机可运行其 `app-server`。
2. 运行 Lunelle 安装向导，选择安装位置。安装包自带运行时，无需额外安装 Node.js。
3. 从桌面或开始菜单打开 Lunelle，右键宠物展开手账。

覆盖升级保留偏好设置。便携运行需保留完整程序目录，不能单独复制 EXE。当前提供 Windows x64 构建，其他平台的完整桌面交互尚未验证；安装包尚未配置代码签名。

### 关于打开安装包的等待

界面运行时会在首次打开时准备，并按版本与内容缓存；安装引擎等到点击「安装」后才提取，准备过程会显示在进度页。同一台电脑的实测中，首次出现窗口约需 21 秒，再次打开同一安装包约需 1.5 秒。具体时间取决于磁盘及系统检查，首次打开仍需等待。

缓存位于 `%LOCALAPPDATA%/LunelleSetupCache`，与桌宠偏好目录分开。[安装器说明](installer-ui/README.md) · [验证记录](docs/INSTALLER-VALIDATION.md) · [SHA-256 校验文件](https://github.com/Timiocoisin/Lunelle/releases/download/v0.3.25/SHA256SUMS-v0.3.25.txt)

<a id="controls"></a>
### 相处的几个小习惯

| 操作 | 效果 |
| :--- | :--- |
| 右键宠物 | 直接进入动作 8，展开陪伴手账，无右键菜单 |
| 单击宠物 | 随机播放动作 1–5（呼吸、眨眼、歪头、点头、挥手） |
| 按住并拖动 | 触发动作 6；松手落地并保存位置 |
| 纸边 ×／Esc／点击面板外 | 收起手账；移开鼠标不会自动收起 |
| 面板「刷新」 | 手动重新读取数据 |
| 面板「设置」／托盘 | 打开独立设置手册 |
| `Ctrl + Alt + X`／单击托盘 | 显示或隐藏桌宠 |
| 托盘 → 退出 Lunelle | 完全退出应用 |

<a id="data"></a>
## 05 / 每个数字，都有来处

额度取自当前登录的 Codex 账号，token 取自本机可读会话日志。两者统计范围不同，面板分别呈现。Lunelle 无需 API key；读取过程不发送提示词，也不发起模型推理调用。

| 信息 | 来源与范围 |
| :--- | :--- |
| 5h／每周额度 | 官方本地 `app-server` 的只读接口 |
| token | `CODEX_HOME/sessions` 与 `archived_sessions` 的计数事件；同一会话去重，周统计从本地周一开始 |
| 模型／推理强度 | 最近活动会话元数据，不保证对应当前前台会话 |
| 本周运行时长 | 已完成任务时间区间的并集，并非在线时长或纯推理耗时 |
| 天气 | Open-Meteo，按手动指定城市查询，缓存 10 分钟 |

额度通知通过本地只读 JSON-RPC 常驻连接接收，本机会话日志变化也会触发更新。密集事件合并后读取，并每分钟校准一次；断线自动重连。无需另外开放 WebSocket 端口。

<details>
<summary>本地数据与隐私</summary>

- 不直接读取或复制 `auth.json`；额度读取使用固定的只读接口白名单。
- 日志在工作线程解析，只提取元数据与计数，不上传原始对话。
- 天气查询发送所选城市名或坐标，不使用 GPS 或 IP 定位。
- 本机日志可能不完整，也可能涵盖多个账号，不能作为当前账号账单或跨设备总用量。
- 面板展开时，Windows 辅助进程检测外部鼠标点击；不监听键盘、不记录点击历史。
- 为延续旧版设置，偏好目录仍为 `%APPDATA%/XingyueDesktop`；升级不清除它。
- 提交问题前，请移除账号信息、凭据、个人路径与对话内容。

</details>

<a id="development"></a>
## 06 / 从源码开始

需要 **Node.js 22+**，以及已安装、登录的 Codex。

```sh
git clone https://github.com/Timiocoisin/Lunelle.git
cd Lunelle
npm ci
npm start
```

```sh
npm run preview                  # 演示数据，不访问账号或本机会话
npm test                         # 数据、配置、交互与动画时间轴检查
npm run test:ui                  # 隔离配置的 Electron 界面检查
npm run build -- --with-artwork   # 含角色资源的便携版
npm run installer                # Windows 安装向导
npm run installer:preview        # 只预览安装手账，不执行安装
npm run test:installer           # 六页界面、许可与预览隔离检查
```

字体与动画资源随仓库提供，本地加载。不带 `--with-artwork` 的构建使用图标回退。打包采用明确文件清单，不包含个人配置、凭据、会话日志或散步试作目录。

<details>
<summary>项目结构与界面截图</summary>

```text
app/       窗口、拖动、自动活动与只读数据接口
ui/        手账、设置与角色动画
installer-ui/ 六页安装手账与安装引擎桥接
assets/    角色、图标、字体与许可
scripts/   打包、安装与文档图片导出
tests/     数据、坐标、交互与隔离界面检查
docs/      当前动作说明与展示图片
```

```sh
node node_modules/electron/cli.js scripts/export-readme.cjs
node node_modules/electron/cli.js scripts/export-walk-preview.cjs
```

界面导出使用隔离配置与合成演示数据，不访问账号或读取本机会话。

</details>

## 字体与作品归属

淡紫、浅蓝与纸张白构成手账底色。小赖用于标签与按钮，霞鹜漫黑用于标题，悠哉用于说明，霞鹜 975 圆体用于日期与信息值；字体均本地加载，并保留 OFL 许可。

| 内容 | 许可 |
| :--- | :--- |
| 项目代码 | [MIT](LICENSE) |
| 角色、动作设计与图标 | 单独保留权利，不纳入代码 MIT；见 [ASSETS.md](ASSETS.md) |
| 字体 | 各自的 SIL OFL 1.1；见 [字体许可](assets/fonts/licenses) |
| 依赖与数据服务 | [THIRD_PARTY.md](THIRD_PARTY.md) |

Lunelle 是独立社区项目，与 OpenAI 无隶属或背书关系。

---

<div align="center">

<img src="assets/icon.png" width="36" alt="" />

<sub>Lunelle · 星星抱在怀里，手账留在桌边。</sub>

[下载](https://github.com/Timiocoisin/Lunelle/releases/latest) · [画册](docs/DESIGN.md) · [反馈](https://github.com/Timiocoisin/Lunelle/issues)

</div>
