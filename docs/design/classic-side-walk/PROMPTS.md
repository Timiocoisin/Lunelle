# Classic true side-view walking — 2026-10-26

Built-in imagegen was used. `reference.png` uses the established classic
character and seated artwork for identity and the queen walk for 90-degree
side camera/posture only. Prompt: original large-head chibi, exactly one visible
purple eye, cute nose/chin profile pointing right, narrow side-view torso,
lavender-silver long curls trailing left, skull clip, pale lavender/white ruffled
dress, crescent brooch, opaque white tights and flat crescent-buckle Mary Janes.
No pillow, adult anatomy, dark gown, sheer stockings, heels or queen crown.
The queen is the grown-up form of this same character.

Separate imagegen calls derived body/head/dress, continuous rear hair and two
independent anatomical arm/hand textures. Body keeps full sleeves/cuffs but
removes exposed arms/legs and rear hanging curls. Hair excludes face/body and
front accessories. Left and right hands use true side-edge views with loosely
curled rounded fingers; in side projection both thumbs face forward. They have
different palm/back occlusion and are not obtained by mirroring a front hand.
The original opaque tights/flat shoe source is retained as `leg.png` for history.

## Side shoe correction, artwork v22

Built-in imagegen edited `leg.png` into `leg-profile.png`. Prompt: preserve the
opaque white stocking, pastel lavender flat Mary Jane, gold crescent and bow;
strict orthographic right-facing side profile, toe right and heel left, no
three-quarter toe face, no inward twist; retain the full leg and transparent
background. Source anchors were registered to the new knee and ankle.
Both projected legs face forward, with a stable 14-unit hip separation and a
5-unit higher far ground plane. Angular gait, 72 frames and timing are unchanged.

`rig.json` records source-joint anchors and fixed reference-shape registration.
The generated dress/hair layers extended below their original reference
positions, so the rig registers their resting hem/tip geometry. This registration
is static, and the rear hair is then animated as one rigid continuous layer.
Scalp, bangs, skull clip and ahoge are owned solely by the body layer.
The queen's captured joint angles and shared 72-frame clock remain unchanged.
