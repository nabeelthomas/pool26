# Optional photo assets

Drop a file here named `basement-bg.png` (or `.jpg`, but rename it to `.png`)
and the site will auto-detect it on next load and use it as the dominant
background — replacing the procedural wood-wall fallback.

Recommended specs:
- **Aspect:** landscape, ~16:10 or wider
- **Resolution:** at least 1600px wide (it's used `background-size: cover`)
- **Mood:** warm, dimly lit basement rec-room — pool table, dartboard,
  bicycle, hockey sticks, license plates, neon signs, wood paneling

If the file isn't present, the site falls back to the drawn-in-CSS
basement (wood wall + rug + SVG wall clutter). Either mode looks
finished — the photo just looks better.

No code changes needed. The detection is `BasementBackground.tsx`.
