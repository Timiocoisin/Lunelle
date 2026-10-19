# 星月 · Xingyue Desktop

独立目录、应用身份、配置和打包流程的星月桌面额度手账。Windows 优先。
本项目重新编写窗口、数据适配器、UI、交互和测试，未迁移原桌宠项目源码。
此前有参考和修改其他桌宠的经历，所以不宣称严格洁净室开发或法律意义上
“与任何项目完全无关”。创建新仓库不消除第三方授权义务。

当前本机已构建含星月素材的便携版，可双击 `Start-Xingyue.cmd` 或
`dist/Xingyue-win32-x64/Xingyue.exe`。复制整个便携目录即可运行，不能只复制 EXE。

## 启动

需要 Node.js 22+、已经安装并登录的 Codex。无需 API key，不发起推理调用。

```sh
npm ci
npm run assets     # 仓库已有四款字体时可跳过；验证官方发布 SHA-256
node scripts/make-icon.cjs
npm start
```

`npm run preview` 使用明确标注的测试数据，不访问账号或本机对话。
单击桌宠展开面板，再点一次收起；点击宠物和面板外部也会收起；移开鼠标不收起。
拖动不会切换面板；拖动桌宠移动；右键或单击设置按钮打开设置。
Ctrl+Alt+X 或托盘可显示/隐藏，托盘可退出。不会修改、卸载旧桌宠。

## 测试与构建

```sh
npm test
npm run test:ui          # 隔离配置；测试数据；输出 artifacts/ 报告
npm run verify:live      # 显式只读检查真实额度、日志统计与天气
npm run build           # dist/Xingyue-win32-x64/，默认不含个人角色图片
npm run build -- --with-artwork  # 确认素材再分发条款后才使用
npm run installer        # 将上一步的便携版制作成 Windows 安装向导
```

开发和公开构建在缺少个人角色图片时使用新绘制的月亮星星图标，不会要求
访问旧仓库。角色 PNG 单独保留权利，不属于代码 MIT 许可，详见 ASSETS.md。
构建使用明确文件清单，不包含个人配置、日志、截图、auth.json 或旧项目文件。
`installers/Xingyue-Setup-0.1.6-x64.exe` 为 Windows 安装向导，支持选择目录、
桌面/开始菜单快捷方式、系统“已安装的应用”卸载入口。当前用户安装不要求管理员。
卸载默认保留 `%APPDATA%/XingyueDesktop` 设置，重新安装继续使用。
安装器尚未配置代码签名，Windows 可能显示未知发布者/SmartScreen 提示；
不可声称已经通过微软信誉认证。尚未验证 macOS/Linux 的完整桌面行为。

## 四款字体分工

- 小赖 Xiaolai：标签、按钮、操作文字。
- 霞鹜漫黑：主标题、设置标题、大号剩余百分数。
- 悠哉 Yozai：说明、天气描述、倒计时和手账小字。
- 霞鹜975圆体 SC：日期、模型名、套餐、温度、token 和信息值。

全部本地加载。UI 测试通过 Chromium 实际字体报告检查，不只检查 CSS 名称。

## 数据口径

- 额度：官方 app-server 的 `account/read` 和 `account/rateLimits/read`。
  只读白名单，不发送 thread/turn/login 请求；不直接读取或复制 auth.json。
  按窗口长度 300/10080 分钟选择 5h/周额度，不把未知窗口冒充 5h。
- token：本机 `CODEX_HOME/sessions`、`archived_sessions` 中的元数据。
  工作线程解析；相同会话事件去重，缓存 token 不重复相加。缺失日志意味着
  统计不完整，零条日志不是完整零消费账单。模型是最近会话元数据，不是
  保证正在前台使用的模型。
- 本周运行：已完成任务时间段裁切到本周后取并集，不是在线时长或纯计算耗时。
- 天气：指定城市（默认中山），不读 GPS/IP，10 分钟缓存，异常标旧数据。
- 外部点击收起：Windows 下仅在面板展开时由隐藏的 PowerShell 辅助进程
  检查鼠标按键按下状态；不监听键盘，不记录点击历史，收起后停止辅助进程。
- 刷新失败保留旧值并标记过期，不编造百分数；个别接口不可用时其他项继续工作。

配置独立保存于 `%APPDATA%/XingyueDesktop/preferences.json`，不兼容导入
旧桌宠配置，也不依赖其可执行文件、控制服务、运行时或 node_modules。

## 代码结构

`app/`：主进程、受限桥接、原子设置、只读额度、日志工作线程、天气与刷新协调。
`ui/`：重新编写的手账面板、设置页、字体角色、笔迹与图标。
`scripts/`：字体可复现下载、原创图标栅格化、白名单便携构建、只读诊断。
`tests/`：合成日志单测、无账号隔离 UI 测试、明确标注的预览夹具。

代码 MIT；字体、角色图片和依赖分别授权。发布前查看 ASSETS.md 和
THIRD_PARTY.md，不以改名或删声明方式处理来源问题。
