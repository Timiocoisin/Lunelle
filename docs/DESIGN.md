# Lunelle · 桌边画册

[查看六页安装手账的实机图](design/installer-final/README.md) · [批准的安装器角色分镜](design/installer-v2/README.md)

淡紫卷发绕过肩头，星星抱枕停在怀里。角色的表情、动作和手账界面，共同构成 Lunelle 的桌面日常。

[返回 README](../README.md) · [动作与播放说明](ANIMATION.md) · [素材许可](../ASSETS.md)

## 角色，先有一个安静的姿态

白袜、蓝紫色鞋子、月牙扣饰与骷髅蝴蝶结，在不同姿态里延续同一套细节。坐姿稿将睁眼与闭眼放在一起，便于对照面部表情和角色比例。

[![坐姿与表情设计稿](design/lunelle-seated-idle-atlas-v1.png)](design/lunelle-seated-idle-atlas-v1.png)

<sub>角色设计稿。点击图片可查看完整尺寸。</sub>

## 趴在纸边，留在你身边

面板陪伴将人物放在手账最上沿。双手搭住外侧纸边，头肩保留轻微呼吸，发梢跟随；收起手账后回到桌面姿态。右键直接进入，左键只随机回应动作 01–05，拖动对应动作 06。

<p align="center"><a href="images/panel-companion-current.png"><img src="images/panel-companion-current.png" width="380" alt="面板陪伴当前实机画面，采用隔离演示数据" /></a></p>

[![面板陪伴设计稿](design/panel-companion/design.png)](design/panel-companion/design.png)

<sub>上方为当前实机画面，下方为设计参考。当前实现包含呼吸、轻微歪头和淡入淡出；设计稿中的独立眨眼尚未接入。</sub>

## 八个动作，一种气质

从呼吸、眨眼到歪头、挥手，再到拖动落地和散步，最初的概念稿记录了每个动作的方向。

[![八动作原始概念稿](design/xingyue-motion-concepts-v1.png)](design/xingyue-motion-concepts-v1.png)

<sub>原稿题字为项目曾用名 Xingyue。此图是设计参考，当前实现以实机截图与下方统一侧面散步资源为准。</sub>

## 悬空与落地

悬空时双腿蜷起、鞋底朝前；落地后回到并膝坐姿，裙摆舒展开来。两种姿势保留相同的服饰、发饰和星星抱枕。

[![拖动与落地姿势设计稿](design/lunelle-drag-design-aligned-v1.png)](design/lunelle-drag-design-aligned-v1.png)

下面是实际界面导出的两个动作相位：

<table>
<tr><th>悬空</th><th>回坐</th></tr>
<tr>
<td align="center"><a href="images/drag-suspended-design-hd.png"><img src="images/drag-suspended-design-hd.png" width="320" alt="实际渲染的悬空抱膝姿态" /></a></td>
<td align="center"><a href="images/landing-seated-design-hd.png"><img src="images/landing-seated-design-hd.png" width="320" alt="实际渲染的落地坐姿" /></a></td>
</tr>
</table>

## 表情与招呼

<table>
<tr><th>歪头</th><th>点头</th><th>挥手</th></tr>
<tr>
<td align="center"><a href="images/tilt-head-hd.png"><img src="images/tilt-head-hd.png" width="220" alt="实机歪头相位" /></a></td>
<td align="center"><a href="images/nod-head-hd.png"><img src="images/nod-head-hd.png" width="220" alt="实机点头相位" /></a></td>
<td align="center"><a href="images/wave-arm-b-hd.png"><img src="images/wave-arm-b-hd.png" width="220" alt="挥手时闭眼的实机相位" /></a></td>
</tr>
</table>

<table>
<tr><th>睁眼</th><th>半闭</th><th>闭眼</th><th>半睁</th></tr>
<tr>
<td align="center"><a href="images/blink-open-hd.png"><img src="images/blink-open-hd.png" width="160" alt="睁眼相位" /></a></td>
<td align="center"><a href="images/blink-half-close-hd.png"><img src="images/blink-half-close-hd.png" width="160" alt="眼皮下降相位" /></a></td>
<td align="center"><a href="images/blink-closed-hd.png"><img src="images/blink-closed-hd.png" width="160" alt="闭眼相位" /></a></td>
<td align="center"><a href="images/blink-half-open-hd.png"><img src="images/blink-half-open-hd.png" width="160" alt="眼皮抬升相位" /></a></td>
</tr>
</table>

<sub>本节均为运行相位图，静态展示不替代完整动画。</sub>

## 同一角色，两种年龄形态

萝莉与御姐是同一个 Lunelle 的不同年龄形态。经典形态保留骷髅发饰、白袜与月亮鞋；成年形态使用暗月长裙与月牙座。两者都以完整侧面行走，按相同的换腿、落脚和摆臂节奏播放，72 帧、每轮 1.44 秒。

<p align="center"><a href="images/ages-side-walk.webp"><img src="images/ages-side-walk.webp" width="760" alt="同一角色的萝莉与成年形态侧面行走" /></a></p>

萝莉散步时放下抱枕，侧脸只露出一只眼睛，肩膀、身体与鞋子朝向一致。左右手使用独立的侧面素材，并按远近关系由头发、身体自然遮挡。坐姿休息与其他动作继续保留原有造型。

旧版第 19 版抱枕散步属于历史素材，不再作为当前经典形态的运行画面。技术与素材位置见[动作与播放说明](ANIMATION.md)。

## 手账，延续角色的颜色

淡紫色线条、浅蓝色信息块和纸张白，让界面与角色处在同一组色调里。曲线纸边、装订孔和圆角滚动条构成手册细节。

<table>
<tr><th>额度手账</th><th>设置手册</th></tr>
<tr>
<td align="center" valign="top"><a href="images/quota-panel-restored-hd.png"><img src="images/quota-panel-restored-hd.png" width="340" alt="实际额度手账界面，使用演示数据" /></a></td>
<td align="center" valign="top"><a href="images/appearance-settings-current.png"><img src="images/appearance-settings-current.png" width="400" alt="当前无边框设置手册" /></a></td>
</tr>
</table>

<details>
<summary>查看动作预览入口与读取提示</summary>

[![交互设置与动作预览入口](images/behavior-settings-restored-hd.png)](images/behavior-settings-restored-hd.png)

[![读取提示在固定状态行展示](images/quota-status-hd.png)](images/quota-status-hd.png)

</details>

<sub>界面截图由隔离演示数据生成，不代表真实账号。角色与设计图的权利说明见素材许可。</sub>
