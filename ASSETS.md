# Assets and publication boundary

## Custom installer characters (2026-10-23)

The v0.3.23 installer also uses `assets/installer/paper-master.png`, a built-in
image-generation edit of the approved welcome concept. Character, text and
controls were removed to retain a reusable transparent illustrated paper frame,
flowers, ribbon and watercolor finish. The six pose assets were regenerated
against the approved six-page storyboard, then segmented without clipping their
heads or shoes. The same artwork rights apply to these installer-only assets.

`assets/installer/poses/01.png` through `06.png` are six transparent character
poses generated with the built-in image tool for the owner's approved installer
storyboard. The original seated desktop pet supplies identity, clothing and paint
finish. A subsequent edit softens specular hair highlights to match that original.
The atlas is segmented into six cells, removing tiny disconnected neighbouring
cell fragments. These assets are for installer pages only; desktop pet artwork
is unchanged. The same separately reserved artwork rights apply.

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

## Seated idle alignment (2026-10-21)

`idle-seated.png` and `blink-seated.png` are exported from
`docs/design/lunelle-seated-idle-atlas-v1.png`, generated with the built-in
image generation tool from the original eight-action concept sheet.
Prompt: faithfully reproduce panel 01's pale lavender seated character,
knees together, cuddling the star pillow; two identically registered frames,
open eyes and gently closed eyes only; transparent background, no labels,
borders, arrows or ground shadow. Existing separate artwork rights apply.
The original pet.png is retained as a historical source, not the active idle.

## Neck underlay (2026-10-21)

`neck-underlay.png` is exported from the right cell of
`docs/design/lunelle-neck-underlay-atlas-v1.png`, created with the built-in
image generation tool using `idle-seated.png` as its edit target.
Prompt: separate the existing head and seated body into registered transparent
layers, preserve lavender colors, costume and pose, reconstruct hidden rear
hair and neck for overlap. The runtime head and body retain the original idle
pixels through complementary UI masks; only a local seam area uses the generated
rear-hair underlay. The separately generated head cell is not used at runtime.
The same separate artwork rights apply.

## Natural eyelids (2026-10-21)

`eyes-half-natural.png` and `eyes-closed-natural.png` were exported from
`docs/design/lunelle-natural-eyes-atlas-v1.png`, made with the built-in image
generation tool using idle-seated.png as the edit target. Prompt: edit only the
eyelids into half-closed and gently smiling closed eyes; keep original framing,
pose, pale colors and delicate tapered lashes; no straight thick bars, no head
movement, transparent background. Runtime blending is limited to eye regions;
all other character pixels use the original idle texture. The 0.3.4 generated
neck underlay is retained for history and no longer used. Existing separate
artwork rights apply.

## Wave and suspension layers (2026-10-21)

`wave-body.png` / `wave-arm.png` are exported from
`docs/design/lunelle-wave-rig-v1.png`. `lift-body.png`, `lift-leg-left.png` and
`lift-leg-right.png` come from `docs/design/lunelle-lift-rig-v1.png`. Both atlases
were created with the built-in image generation tool using idle-seated.png
as the character reference. Prompts requested original pale colors and costume,
a stable seated wave body plus a separate complete waving arm, and a hovering
body with two complete independently swinging legs overlapping behind the skirt;
transparent backgrounds, no labels or borders. Registered exports are produced
by scripts/export-action-layers.cjs. Runtime composition also overlays a small
feathered original shoulder patch for seamless connection. The existing separate
artwork rights continue to apply.

## Design-aligned drag poses (2026-10-21)

`lift-curled-design.png` and `landing-seated-design.png` are exported by
`scripts/export-drag-design.cjs` from
`docs/design/lunelle-drag-design-aligned-v1.png`. The built-in image generation
tool used the owner-supplied action-06 design crop as the exact pose reference
and idle-seated.png for identity/colors. Prompt: tucked knees against chest with
both soles facing forward/down-left while lifted; cheerful closed eyes and
spread skirt while landing; complete opaque white tights, connected limbs,
transparent background, no diagram marks. These replace the 0.3.6 hanging-leg
rig at runtime. Existing separate artwork rights apply.

## Selected walking artwork — study 19 (2026-10-22)

The owner selected walking study 19 and requested removal of the other walking
studies. The original character keypose, eight registered leg poses, eye source
art, prompts and render code are retained together in
`artifacts/walk-study-v19/` for local provenance and reproduction. Generated
frames and duplicate previews can be rebuilt and have been cleaned. Previous
walking atlases, layer exports and rejected studies have been removed.

Runtime artwork is `assets/characters/walk-v19.webp`, with
`walk-v19-poster.png` and `walk-v19.json`. It is exported from study 19's
complete rendered frames without redrawing or limb deformation. Only the
exterior white matte is converted to transparency; compositing the character pixels on white exactly reproduces the original RGB.
Tiny disconnected background speckles are discarded after matte conversion. The owner-selected slower
cadence uses 30 ms per frame, a 1.08 s gait cycle and 6.48 s full animation.
The README excerpt `docs/images/walk-v19.webp` uses the same frames.

The original character materials and separate artwork rights continue to apply.
Neither a new artwork license nor a guarantee of anatomically exact gait is
implied by this update. No remote interpolation model is required by the app.
