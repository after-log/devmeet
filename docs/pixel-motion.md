# Pixel page scenes

`frontend/public/scenes/people-motion.png` replaces the five opaque still images.
The RGBA atlas contains three poses per row: discover, like, chat, profile, welcome.
`PageScene` specifies each row's crop, including extra space for the welcome heart.
Keep these crop coordinates in sync when replacing the atlas.

The scene plays twice on mount (4.8 seconds total), then holds its last pose.
`prefers-reduced-motion: reduce` shows that final pose without animation.
The transparent figure has no background, border, or theme-specific blending.
The welcome scene also replaces the signup completion build-log illustration;
the continue action remains immediately available.

## Asset provenance

Created with the built-in image generation tool from the approved devmeet keyframe
sheet. Prompt: preserve the lime/periwinkle matte pixel people and all 15 poses;
remove background, labels, numbers and rules; arrange three chronological poses
in each of five rows on genuine transparent alpha. Scenes: look/turn/wave,
hold/offer/receive heart, alternating chat/together, idle/straighten/approved
profile, approach/raise hands/high-five. No backdrop or baked checkerboard.

Validation: frontend unit tests, TypeScript and production build, PWA cache tests,
targeted ESLint, and browser inspection of the page scenes in light/dark themes.
Authenticated first-time signup was checked through component wiring, without
creating or modifying a member account.
