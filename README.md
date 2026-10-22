# TermFX Studio

Make animated, terminal-style explainer videos. TermFX Studio renders
holographic scenes on a 16:9 character grid, with vector overlays, bloom and
a camera rig, then exports them as frame-exact MP4, ProRes 4444 or PNG
sequences.

## What's inside

- **Scenes** run in numbered stages. Each stage has a name and an optional
  line of narration that you can read while recording.
- **Visual Library**: ten preview scenes that show the building blocks:
  portraits, papers, charts, globes, 3D objects, 3D sets, and more.
- **3D world**: a perspective camera (orbit, dolly and shot presets), posed
  characters and sets for third-person shots.
- **Look**: colour themes plus bloom, scanlines, camera drift, grain and more.
- **Export**: frame-exact rendering at 720p to 4K, at 24, 30 or 60 fps.
- **AI scene generator**: describe a visual and a provider writes it. Bring
  your own key for OpenAI, Anthropic or Gemini, or use a local model through
  LM Studio or Ollama.

## Quick start

Requirements: [Node.js](https://nodejs.org) 18 or newer. For MP4 and ProRes
export, install [ffmpeg](https://ffmpeg.org) and make sure it's on your PATH.

```bash
node server.js
```

Then open <http://127.0.0.1:4577> in Chrome or Edge.

Or run the desktop app:

```bash
npm install
npm start
```

On Windows you can also build a standalone app with `npm run package-win`.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Next stage |
| `1`–`9` | Jump to a stage |
| `P` / `.` | Pause / step one frame while paused |
| `R` | Back to stage 1 |
| `[` / `]` | Previous / next scene |
| `F2` | Type the prompt on screen |
| `Tab` or `F1` | Clean view (hides the panels for recording) |
| `F8` | Save a snapshot (PNG) |
| `F9` | Render the current scene |
| `F10` | Render all scenes (Shift+F10: one file per scene) |
| `Esc` | Cancel a render |

## Your own content

Put photos, logos and 3D models in the **Assets** folder (the 🖼 button in
the Export panel). Use only images and models you have the rights to use:

- `*.jpg`, `*.png`, `*.webp` photos for `portrait()`
- `anthropic.png` / `openai.png` (or `.svg`) logos for `logo()`
- `*.obj` 3D models for `model()`

Anything you create for a private project can go in `src/private/`. That
folder is git-ignored, so it stays on your machine. Scenes there are loaded
on demand by **Render all scenes**. They don't appear in the scene list.

## Writing a scene

A scene is a plain object with a `phases` array and an `update(ctx)` function
that runs every frame. Start from one of the previews in
`src/library-scenes.js`, and see [`docs/VISUAL-LIBRARY.md`](docs/VISUAL-LIBRARY.md)
for the full set of drawing calls.

```js
{
  id: 'my-scene',
  number: '01',
  title: 'My scene',
  category: 'Demo',
  phases: ['First', 'Second'],
  update(ctx) {
    const { phase, grid, palette } = ctx;
    grid.fade(0.15);
    grid.big(64, 17, phase === 1 ? 'HELLO' : 'WORLD', { size: 3, color: palette.accent });
  }
}
```

## Project layout

```
server.js            local server, render pipeline, AI proxy
main.js, preload.js  Electron shell
src/
  index.html         interface
  styles.css         interface styles
  engine.js          rendering engine (grid, vectors, bloom, camera)
  visuals.js         visual library (portraits, charts, objects, globe, …)
  world3d.js         3D world, characters and sets
  presets.js         scene helpers and compiler
  library-scenes.js  built-in preview scenes
  ai-generator.js    AI scene generator
  app.js             interface logic
  private/           your own content (git-ignored)
docs/                visual library guide
```

## License

Add a license before you publish this repository.
