# 0.1.4 · stable drag release

The old edge handling moved the native window on pointer-up and compensated
the sprite in a later renderer update. This created an avoidable mismatched
frame. It has been removed, rather than hidden behind a fade or animation.

The pet now has a permanently sized transparent canvas with side gutters.
The logical visible design remains 530×990; the canvas is 1530×990 and the
design is inset by 500 logical pixels. Its visible scale is unchanged.
Only the journal panel is translated within those gutters to stay on screen.
Pointer-up never changes native window position, window dimensions or sprite
local position. Transparent regions keep the existing mouse-pass-through.

Saved position schema 2 records the pet's screen-left coordinate instead of
the transparent window's coordinate. The previous position/offset schema is
converted at startup, so an upgrade does not intentionally reset placement.

Validation: 32 unit tests and isolated Chromium UI regression passed, including
explicit assertions that the release path cannot call setPosition, legacy
edge reach, panel avoidance, single-press settings and release scale stability.
Manual perception under a user's graphics driver still needs their feedback;
passing geometry tests is not a claim to have measured all compositor frames.
