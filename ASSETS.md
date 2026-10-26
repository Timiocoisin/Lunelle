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

## Dark Moon Queen (2026-10-23)
Adult alternate character generated with the built-in image generation tool from the approved concept sheet. `assets/characters/queen/atlas.png` preserves the generated transparent sheet; numbered PNGs are equal-grid sprite crops. Runtime uses independent full-pose sprites, including four walking key poses.


## Dark Moon Queen — eight design actions (2026-10-24)

The approved design board is `docs/design/queen-actions-approved.png`.
The built-in image generation tool created `queen-v2-neutral-atlas.png` and
`queen-v2-gesture-atlas.png` in the same directory. Prompt: retain the approved
adult Dark Moon Queen face, lavender curls, crescent crown and perch, black/plum
long gown, stockings, opera gloves and celestial jewelry; supply complete
transparent poses for neutral, closed eyes, head tilt, nod, wave, suspended
knees, landing and companionship. No chibi proportions, backgrounds or labels.
`scripts/export-queen-poses.py` exports these into `assets/characters/queen/v2/`.
Runtime uses the neutral surface for continuous head gestures and a registered
local closed-eye patch. Waving uses one continuous mesh rather than cut arm
layers. Drag/landing and companion each have their own full-body texture.

The queen walk is a 72-frame 1.44 s transparent WebP, exported by
`scripts/export-queen-walk.py` from the locally reviewed continuous-arm render.
The rendered character art uses the same original adult queen concept. Joint
motion is retargeted from CMU 07_04 slow walking (frames 139–313), using the
locally retained source and attribution in `artifacts/queen-walk-mocap/source/`.
Only exported artwork is loaded by the app; no network or mocap parser is needed
at runtime. Existing separate character-art rights continue to apply.


## Queen walk material consistency (2026-10-24)

The seated queen in `assets/characters/queen/v2/idle.png` is the material reference
for the walk. The built-in image generation tool repainted all four walk rig
textures in `docs/design/queen-walk-seated-style/painted/`; prompts and original
geometry are retained beside them. The new palette and shading replace the
previous stronger pink/specular/CGI-like rendering. Registration aligns the new
RGB to the original UVs, retaining every original alpha value and all existing
joint trajectories. `scripts/export-queen-walk.py` now uses these textures by
default. Walk frame count, cadence and skeleton are unchanged. The existing
character-art terms continue to apply.


## Classic character retargeted to queen gait (2026-10-26)

The original classic character face, pale lavender hair, skull clip, layered
lavender/white dress, opaque white tights and moon-buckle Mary Jane shoes are
retained. The built-in image generation tool supplied rig textures in
`docs/design/classic-shared-walk/`, referenced to the existing classic walking
character and seated pose. Prompts requested the unchanged chibi identity and
pastel rendering, a complete body/head/dress with no pillow or limbs, continuous
rear curls, one puff-sleeve bare arm and one opaque-white-tights flat-shoe leg.

`scripts/export-classic-shared-walk.py` retargets the exact queen CMU07_04 cycle,
leg directions, shoulder/head motion and relaxed arm/wrist angles to classic
body proportions. Both skins now use `ui/walk-timeline.js` for the 72-frame,
20ms/frame, 1.44s cycle and distance-based phase. Classic runtime art is
`assets/characters/classic/shared-walk/`. Original v19 files remain available as
historical reference; they are no longer selected by the classic renderer.
Existing separate character-art rights continue to apply.


### Classic left/right hands and proportional hand mapping (2026-10-26)

The classic arm texture's hand was repainted with softly gathered fingers, using
the same original chibi art reference. The elbow/wrist anchors now follow the
actual source anatomy. Hand scaling is isotropic instead of compressing the
longitudinal axis; left and right use opposite silhouette orientation around
their own bone axes, with thumb directions distinguished. The visible far arm
is composed above the rear hair and dress surface. Export checks audit all hand
transform scale ratios and determinant signs. Existing gait angles are unchanged.


## Same character, true side-view classic walk (2026-10-26)

The owner clarified that the queen is the adult form of the classic character,
and requested true side-view walking for the classic form. The new reference
and rig artwork are in `docs/design/classic-side-walk/`, with prompts and static
joint/rest-shape registration. The walk now has a single-eye right-facing face,
side torso/skirt, trailing curls and proper near/far arm occlusion. Separate
left/right hand artwork is used for the side projection. Other classic actions
retain their previous seated artwork. The 72-frame measured queen gait and
shared travel clock are unchanged. Runtime classic art remains in
`assets/characters/classic/shared-walk/`, now artwork version 21. Separate
character-art rights continue to apply.


## README editorial cover (2026-10-26)

Classic walk artwork v22 additionally uses the built-in imagegen edit
`docs/design/classic-side-walk/leg-profile.png`: strict right-facing side shoe,
preserving the white tights, pastel flat Mary Jane and crescent buckle.
The complete prompt summary is recorded in that directory's `PROMPTS.md`.
The original `leg.png` is retained; existing character-art terms still apply.

`docs/images/readme/cover.png` is exported by `scripts/export-readme-cover.cjs`.
It places the existing classic seated artwork and queen seated artwork on an
ivory editorial layout; no character pixels or design features are repainted.
The layout uses the bundled LXGW 975 font and system serif typography rendered
into the image. Existing character-art terms and bundled font licenses apply.


## Complete README action gallery (2026-10-26)

`scripts/export-readme-gallery.cjs` exports both appearances from their production
canvas renderers with synthetic fixture data. Each appearance has eight documented
action categories; lift and landing are captured separately. Character snapshots
retain their native 887px (classic) or 768px (queen) render resolution. Complete
companion panels, the full settings page and local PNG badges use 3x device
resolution. These are captures of existing artwork, with no new character design.
`scripts/preview-shared-walk.py` exports the 1280px-wide lossless walking comparison
from the current runtime frames. Existing character and font rights still apply.
