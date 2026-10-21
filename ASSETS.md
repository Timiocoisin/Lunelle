# Assets and publication boundary

The project owner identified the Lunelle character artwork as their own
generated design (2026-10-19) and authorized publication of this desktop app.
Character PNGs in assets/characters are published as application resources,
but are NOT covered by the code's MIT license. All artwork rights are reserved
by the project owner; no separate artwork reuse or redistribution license is
granted here. Contact the repository owner for additional permissions.
The default build uses the generated anime application icon as its character fallback.
The owner's character build uses `npm run build -- --with-artwork`.

Font files are original, unmodified upstream releases, redistributed under
SIL OFL 1.1 with their corresponding license texts in assets/fonts/licenses.

`portrait-perch.png` is a built-in image-generation edit of the owner's supplied
portrait, generated 2026-10-19 for this project. Prompt: preserve Lunelle's face,
lavender curls, skull hairclip, costume and moon brooch; pose both hands gripping
an imaginary horizontal paper rim, with curled foreground fingers and subtle
anime contact shading; actual transparent background, no text or extra person.
The original portrait is retained. The same separate artwork terms apply to
the generated edit and the other character PNGs.

| Role | Font | Upstream | Release |
|---|---|---|---|
| Labels, buttons | Xiaolai Regular | https://github.com/lxgw/kose-font | v3.126 |
| Title, large percentage | LXGW Marker Gothic | https://github.com/lxgw/LxgwMarkerGothic | v1.004 |
| Notes | Yozai Medium | https://github.com/lxgw/yozai-font | v0.868 |
| Numbers, model, information values | LXGW 975 Yuan SC 400W | https://github.com/lxgw/975Yuan | 26.07.26 |

The application icon (assets/icon-source.png, icon.png and icon.ico) was redesigned
with the built-in image generation tool on 2026-10-20 using assets/characters/pet.png
as the character identity and illustration style reference. The compact bust
preserves the pet's pastel lavender curls, heart-eyed skull clip, moon brooch and
star plush. The silhouette has actual transparency with no background tile or
white border, and is fitted proportionally for Windows icon sizes.
The same separate artwork terms above apply to this icon.
UI doodle SVG paths are newly authored and covered by the project code license. No upstream application icon,
logo, character, or source files are included in the release allowlist.

## Motion artwork (2026-10-20)

The six `assets/characters/motion-*.png` poses were generated with the built-in
image generation tool using `pet.png` as the character identity/style reference,
then exported as equal-size transparent frames. They depict seated idle, closed
eyes, a raised waving hand, lifted pose, and two walking poses. The selected
source atlas is `docs/design/xingyue-motion-atlas-soft-v2.png`; the direction sheet is
`docs/design/xingyue-motion-concepts-v1.png`. The same separate artwork rights
and redistribution terms above apply. Neither design sheet is a runtime sprite.

On 2026-10-20, v0.2.1 restored the unmodified original `pet.png` for idle,
head-tilt/nod, landing and panel companionship. The blink frame was regenerated
as an eye-only edit of that original. Secondary action poses were color-matched
against the original with the built-in image tool (source:
`docs/design/xingyue-motion-atlas-soft-v2.png`) and receive a restrained pastel
rendering grade. The same separate artwork terms continue to apply.

The v0.2.3 walking puppet uses purpose-drawn complete body/left-leg/right-leg
layers, generated from the existing pet references. Source sheet:
`docs/design/xingyue-walk-layers-v1.png`. The exported `walk-body.png`,
`walk-leg-left.png` and `walk-leg-right.png` share a registered 512px canvas;
complete upper thighs overlap under the opaque skirt. These replace the
runtime clipped full-sprite legs. The same artwork terms apply.

## Seated idle alignment (2026-10-21)

`idle-seated.png` and `blink-seated.png` are exported from
`docs/design/lunelle-seated-idle-atlas-v1.png`, generated with the built-in
image generation tool from the original eight-action concept sheet.
Prompt: faithfully reproduce panel 01's pale lavender seated character,
knees together, cuddling the star pillow; two identically registered frames,
open eyes and gently closed eyes only; transparent background, no labels,
borders, arrows or ground shadow. Existing separate artwork rights apply.
The original pet.png is retained as a historical source, not the active idle.
