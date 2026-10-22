# Visual Library

Show **what things are**, not just abstract shapes, in the same holographic style.
All of these primitives live in `src/visuals.js`. You can preview them in the **Visual Library** scenes (L1–L8) at the bottom of the scene list.

## Picking a visual

| The narration mentions… | Show it as | Call |
|---|---|---|
| A named person | Their photo, scanned in as halftone dots, scanlines or ASCII | `grid.portrait('name.jpg', …)` |
| Something a person said | The quote typing on, optionally beside their portrait | `grid.quote(text, author, …)` |
| A paper, report, doc or announcement | A page with its real title, authors and venue; abstract lines draw on; highlight a finding or stamp it | `grid.paper(…)` |
| A trend over time | A line chart that traces left to right | `grid.lineChart(…)` |
| A comparison | Bars that grow, with counting values | `grid.barChart(…)` |
| A share or percentage | A donut that sweeps round | `grid.donut(…)` |
| A system of parts or agents | Nodes that link up, with packets moving | `grid.network(…)` |
| A company, lab or datacenter | A 3D wireframe building, floors rising and windows lit | `grid.building(…)` |
| A specific object (a chip, a robot, a rocket) | Your own `.obj` 3D model as a hologram | `grid.model(…)` |
| Countries, cities, "worldwide" | A dotted rotating Earth with pulsing markers and arcs | `grid.globe(…)` |
| Generic people (engineers, reviewers, evaluators) | A lit silhouette, optionally labelled | `grid.person(…)` |
| Hardware (servers, GPUs, laptops, chips, monitors) | A rotating 3D hologram with blinking lights | `grid.object('rack' \| 'gpu' \| 'laptop' \| 'chip' \| 'monitor', …)` |
| A datacenter / "compute" / "infrastructure" | A cut-away 3D hall: raised floor, rack rows, cooling, cable trays | `grid.object('hall', …)` |
| A bank, a gate, a lock, timing, inspection, someone at work | 3D bank, security gate, padlock, stopwatch (sweeping hand), magnifier, workstation | `grid.object('bank' \| 'gate' \| 'padlock' \| 'stopwatch' \| 'magnifier' \| 'workstation', …)` |
| Release notes, changelogs, SDK updates | A versioned feed: version, date pill, NEW / FIX / IMPROVED / SECURITY / BETA tags | `grid.releaseNotes(…)` |
| A codebase, PR queue, "X% of code" | A wall of files that light up in a scattered order | `grid.fileGrid(…)` |
| Code being rewritten | A page whose lines turn red, then green | `grid.paper(…, { lineColor })` |
| A date or release window | A month calendar with the days marked | `grid.calendar(…)` |
| Events over years | A timeline with labelled events | `grid.timeline(…)` |
| A sandbox, boundary or "contain" | A 3D glass box around the subject | `grid.glassBox(…)` |
| A loop or process | Stations on a line with a packet and a flat return path | `grid.pipeline(…)` |

Keep it to **one subject per stage**, centred unless the stage is a comparison (left vs right) or something is moving with a purpose. Don't put spinning rings or orbiting icons around things: use a glass box for boundaries and a pipeline for loops.

**Let the camera tell the story.** `camera.look(x, y, zoom)` centres a point and pushes in; call it every frame while the shot should hold, and it eases back when you stop. Push in on a paper's title (about `cy - h/2 + 3.5`), a highlighted date, the head of a growing line, or the moment something is blocked. Keep zoom between 1.05 (a lean) and 1.8 (reading a title). A portrait beside a year, or a paper on its own, reads far better than a crowded frame.

## Photos and models (assets)

Click **🖼** in the toolbar (or open `termfx_data/assets`) and drop files in:

- **Photos:** `.jpg`, `.png`, `.webp`. Use a front-facing head-and-shoulders shot. The engine crops to the frame (biased toward the top), auto-levels it and converts it to the house style. Plain or dark backgrounds work best.
- **3D models:** `.obj`. They are auto-centred and scaled, and large meshes are thinned to about 3,500 edges. Free low-poly models export to `.obj` from Blender, Sketchfab and similar tools.

The names the scenes expect:

| File | Used in |
|---|---|
| `ij-good.jpg` | Scene 01 stage 2 and Visual Library L1 |
| `model.obj` | Visual Library L4 stage 4 (a torus-knot sample ships in `src/assets`; your file overrides it) |

Use only images and models you have the rights to use (your own, licensed, public-domain or press-kit material). If a file is missing, a lit silhouette or placeholder shape is shown instead, and nothing is written on screen.

## API

All calls go on `grid` inside a scene's `update(ctx)`. Coordinates are cells on the 128×36 stage. Each primitive animates itself in the first time it appears.

```js
grid.portrait('ij-good.jpg', 44, 18, { w: 22, h: 16, mode: 'halftone' /* | 'scan' | 'ascii' */, label: 'I. J. GOOD', sublabel: '1965', color, frame: true });
grid.quote('The first ultraintelligent machine is…', 'I. J. Good', 84, 16, { width: 28, size: 1.35, portrait: 'ij-good.jpg' });

grid.paper(64, 17, { title: 'When AI Builds Itself', authors: 'Anthropic', venue: 'Report', w: 32, h: 24,
  highlight: 3, stamp: 'OCT 12', stampColor, yaw: -0.28, lines: 9, titleScale: 1.05, key: 'unique-id' });

grid.lineChart(18, 6, 92, 22, [{ values: [2, 5, 18, 80], label: 'AI code %', color, dash: [3, 4] }], { yMax: 100, xLabels: ['2025', '', '', 'NOW'] });
grid.barChart(26, 6, 76, 22, [{ value: 52, label: 'MYTHOS', color }], { format: v => Math.round(v) + '×' });
grid.donut(64, 17, 9, [{ value: 80, label: 'AI' }, { value: 20, label: 'HUMAN' }], { center: '80%' });
grid.network([{ x: 64, y: 17, label: 'CORE' }, { x: 34, y: 8, label: 'A' }], [[0, 1]]);

grid.building('tower' /* | 'datacenter' | 'lab' | 'house' */, 64, 18, 10, anim.spin('yaw', 0.2), { progress, tilt: 0.3, color });
grid.model('model.obj', 64, 18, 9, rotX, rotY, rotZ, { color });
grid.globe(64, 18, 14, { spin, tilt: -0.4, markers: [{ lat: 37.77, lon: -122.42, label: 'SF' }], arcs: [[0, 1]] });

grid.person(40, 16, { size: 10, label: 'ENGINEER', color, photo: 'name.jpg', key });
grid.object('rack' /* | 'gpu' | 'laptop' | 'chip' */, 64, 17, 8, anim.spin('yaw', 0.25), { tilt: 0.3, windowColor });
grid.fileGrid(64, 15, 20, 5, { filled: 0.8, fillColor, cell: [4.4, 3.2] });
grid.paper(64, 17, { title: 'train.py', lines: 10, lineColor: (i) => (i < pass ? '#00ff88' : null) });
grid.calendar(64, 18, { month: 'OCTOBER 2026', startDay: 4, marks: { 15: { color } }, focus: 15 });
grid.timeline(14, 114, 18, { from: 1960, to: 2030, ticks: 10, events: [{ at: 1965, label: 'I. J. Good' }] });
grid.glassBox(64, 17, 34, 20, 26, { color, label: 'sandbox' });
grid.pipeline(24, 104, 18, ['propose', 'run', 'evaluate', 'commit'], { loop: true, speed: 0.5 });
grid.releaseNotes(64, 17, { product: 'Claude Developer Platform', version: 'Platform update', date: 'Oct 7', highlight: 2,
  items: [{ tag: 'NEW', text: 'Claude Haiku 5.5' }, { tag: 'SECURITY', text: 'allowed_hosts enforced' }] });
grid.object('hall' /* | 'bank' | 'gate' | 'padlock' | 'stopwatch' | 'magnifier' | 'workstation' | 'monitor' */, 64, 17, 10, 0.42, { tilt: 0.42, handPeriod: 2 });
camera.look(64, 9.5, 1.7); // push in on a paper title
```

Most primitives take `progress` (0–1) to drive the reveal yourself, for example to sync a chart to the narration, and `key` when two of the same kind share a stage.

## Ideas for what to add next

- **Logos as outlines:** trace a company logo into a vector path (only with permission to use the mark).
- **Maps:** zoom from the globe into a flat dotted country or city map.
- **Timelines:** a horizontal track of dated events with the papers or portraits attached.
- **Screens:** a laptop or phone wireframe with a UI sketch playing on it.
