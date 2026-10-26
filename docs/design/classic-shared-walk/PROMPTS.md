# Classic shared-gait rig — 2026-10-26

Built-in imagegen was used with the classic walking character source and
idle-seated.png as identity/style references. Preserve large chibi head, purple
eyes, lilac curls, skull hair clip, pale lavender/white ruffled dress and original
pastel illustration. No adult queen costume, mature anatomy or dark stockings.

- Body: intact original head/face/front locks and reconstructed dress bodice;
  remove pillow, hands/arms, rear hanging curls and legs; transparent background.
- Hair: isolated continuous rear fluffy curls, same pastel color and placement.
- Arm: one hanging arm with original puff sleeve, ruffle cuff, small bow, bare
  forearm and relaxed five-finger hand, continuous elbow/wrist.
- Leg: one continuous leg entirely in opaque white tights, rounded lavender-blue
  Mary Jane flat shoe, lavender bow and gold crescent buckle; no bare thigh,
  lace, sheer stockings or high heel.

The four images are registered by explicit joint anchors in the renderer. Their
source poses do not define the walk; the reviewed queen's measured cycle does.


## Relaxed hand correction — 2026-10-26

Built-in imagegen edit of arm.png using idle-seated.png as the style reference:
change only the hand below wrist y1120; keep the sleeve, cuff, forearm and canvas
placement. Compact rounded palm, five softly rounded fingers loosely gathered
and slightly curled, natural thumb beside the palm; back/side view, fingertips
pointing down. No spread fan, claw, spikes, extra digits or clenched fist.

The runtime retarget uses corrected elbow/wrist source centers, isotropic hand
scaling and opposite signed width for anatomical left/right silhouettes. The
small hands are not horizontally stretched, and both arms remain attached at
their original cuffs with the unchanged captured swing angles.
