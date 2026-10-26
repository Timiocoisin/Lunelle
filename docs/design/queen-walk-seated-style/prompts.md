# Seated-style queen walk materials — 2026-10-24

Generated with the built-in imagegen tool. The edit target for each call was the
corresponding previously reviewed rig layer; the style reference was
`assets/characters/queen/v2/idle.png`.

Prompt shared by all four calls: Repaint the texture to match the SAME
illustrator/materials as the seated queen: soft delicate detailed anime shading,
fine clean linework, softly shaded warm pale skin, muted dusty lavender-silver
hair with restrained broad highlights, black/plum fabric with soft folds, muted
warm gold/silver celestial jewelry, subtle translucent smoky black stockings.
Reduce hot-pink specular streaks and plastic-like CGI gloss without blurring.
Keep contours, face profile, costume, joint coordinates, canvas margins, subject
position, scale, alpha boundaries and holes. No background, glow, text, new pose
or additional anatomy.

Layer-specific constraints:
- body: original detached torso/head/crown/gown/cape only; no arms, legs, rear hair.
- hair: isolated continuous rear curls only; no face/body/accessories.
- arm: original straight hanging arm, relaxed five fingers and glove jewelry.
- leg: original straight stocking leg and pointed high heel with fixed joints.

The generated RGB is registered by SIFT features to the reviewed UV coordinates.
The original alpha is retained exactly, so this material update does not change
the animated silhouette. See `registration.json` and
`scripts/register-queen-materials.py`.


Targeted second pass for hair and scalp/bangs only: restore the seated reference's
pale lavender/lilac pigment, as the first material pass was too gray. Retain soft
fine anime shading and restrained creamy highlights. Keep geometry, UVs, pose,
canvas framing and all other body/clothing material unchanged; no hot-pink rimlight.
