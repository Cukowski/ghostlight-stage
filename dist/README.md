# Ghostlight — Stage Lab

[Live demo](https://cukowski.github.io/ghostlight-stage/) · [Source repository](https://github.com/Cukowski/ghostlight-stage)

A configurable 3D theatre study for a slowly descending microphone and floating
animatronic head. Built with Three.js. All geometry is procedural; no stock
models, API keys, accounts, paid plugins, external fonts or runtime CDNs.

## Start locally

From the extracted project directory:

```sh
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080`. On Windows, use `python` instead of `python3` if
necessary. Opening `index.html` by double-click does not work reliably because
browsers restrict module imports and asset requests on `file://`.

No npm installation or build is required to run the site.

## Publish on GitHub Pages

1. Create a repository, for example `ghostlight-stage`.
2. Put this project's contents at the repository root, including the hidden
   `.github/workflows/pages.yml` file. Keep `dist`, `tests`, `package.json`,
   `README.md` and `LICENSE` at that level.
3. Push to the `main` branch. If your default branch has another name, change
   `branches: [main]` in the workflow.
4. In **Settings → Pages → Build and deployment → Source**, choose
   **GitHub Actions**.
5. Run **Actions → Test and deploy Ghostlight → Run workflow**, or push a new
   commit. The job checks the source, runs the physics tests, and deploys `dist`.
6. The completed Pages job displays the live URL.

The demo is deployed at https://cukowski.github.io/ghostlight-stage/. The included workflow tests and publishes pushes to `main`.
Paths are relative, so project repositories such as
`https://USERNAME.github.io/ghostlight-stage/` work without a base-path edit.
GitHub Pages availability depends on your repository/account plan.

Official publishing reference:
https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

If you prefer branch-based deployment, copy the **contents** of `dist` into a
separate repository's root, then publish that branch from `/ (root)`. The
simulation itself needs only the files inside `dist`.

Ready-to-load examples are in `dist/examples`: a suspension configuration, a
boom configuration, and `ghostlight-stage.glb`, a complete reference scene at
the default pose. The GLB was generated and its binary header, JSON chunk,
mesh count and node count validated during the build.

## Explore the scene

- Drag to orbit, scroll/pinch to zoom, right-drag/two-finger drag to pan.
- Use Perspective, Front, Side, Top and Head camera presets.
- Use **Cutaway** to remove drapes/proscenium and reveal the head internals.
- Toggle the grid to judge dimensions. Stage coordinates are in metres.
- On phones, open **Settings** to access the same parameter panel.
- A software 3D renderer is used automatically when WebGL 2 is unavailable.
  It retains the 3D cameras and motion model, with simpler lighting and no
  shadows. Rendering is capped at 10 fps in that fallback.

The scene starts at a 10 × 7 m stage, with a deck 0.6 m above the surrounding
floor and rigging 6.5 m above the deck. These are illustrative dimensions, not
measurements of your venue.

## Editable settings

| Panel | Settings |
| --- | --- |
| Motion | Suspension/boom, upper/lower head height, microphone offset, separate descent/return speeds, acceleration, lower hold time, boom length |
| Stage | Width, depth, deck elevation, rigging height, head/mic X and Z positions, performer position and size, lighting, labels, grid and cutaway |
| Head | Size, moving masses, upper/lower pitch, jaw opening, dialogue audio, LED colour/brightness/cycling |
| Physics | Gravity, damping, collision response, manual pendant and approximate load readings |

**X** increases toward audience-right. **Z** increases toward the audience.
**Y** is height above the stage deck. Head height refers to the head centre.
The mic's capsule follows the head's mouth reference, including the pitch
offset; `micOffset` adds an intentional vertical difference.

Rigging height determines suspension anchors. It is separate from deck height.
Changing spatial settings places the lift on hold and rebuilds it at the
current commanded height; it does not retain previously excited sway.
Changing damping, mass, speeds or light settings can be done during playback.

The boom's pivot height is the midpoint of travel plus a 0.65 m tip suspension
offset. Its X position is derived from the specified head upper endpoint and
arm length. The head sweeps horizontally as the boom rotates; the microphone
keeps its own vertical path. The counterweight is illustrative, not sized.

Inputs are clamped to sensible numerical limits. The upper height is limited
by rigging height; the lower height and boom length adjust to preserve feasible
geometry. This is geometric feasibility, not confirmation of rigging capacity.

## Motion and cues

- **Run show**: descend from the current pose, hold below, then return to the
  upper limit. Reset restores the initial scene before a new study.
- **Descend / Hold / Return**: independent operator cues.
- **Travel slider**: author a pose directly; seeking resets sway. It is not a
  simulated rapid lifting command.
- **Preview speed**: 1× is real-time, 20× previews twenty simulated seconds per
  wall-clock second when the device keeps up. Very slow devices may fall behind.
- **Manual pendant**, in Physics: hold UP or DOWN; release to command a hold.
- **STOP**: immediately stops the simulated lift and latches further motion.
  Residual physical sway continues. **Reset stop** clears the latch and keeps
  the lift on hold; another movement command is needed to resume.
- **Space** toggles show/hold when a form control is not focused; **Escape**
  latches the simulated stop.
- **Test sway** applies a known sideways impulse to the head. Choose 1× to
  inspect its real-time response.

Default speeds are 3 mm/s down and 40 mm/s up. Across the full 3.6 m travel,
that is about 20 minutes down and 90 seconds up, plus acceleration ramps.
The lift uses acceleration-limited velocity changes and braking near endpoints;
it is not a jerk-limited motion planner.

## Head animation and dialogue

The head has a separate jaw hinge and a pitch axis. Pitch smoothly interpolates
with actual head height; negative angles look up, positive angles look down.
**Animate jaw** gives a silent procedural movement test.

Choose a local audio file in Head → Voice synchronisation, then press Play audio.
The Web Audio analyser maps its amplitude to jaw opening with a noise gate and
attack/release smoothing. This is an approximate speaking effect, not phoneme
or word recognition. Audio is neither uploaded nor included in exports.
Audio playback runs in wall time; use **1×** when assessing voice/motion timing.
The movement cue does not automatically start or time-stretch audio.
Backgrounding the page pauses audio and suspends simulation stepping.

## Save and export

Configuration changes are saved in this browser's local storage. Clearing
browser data clears that local copy. Save a JSON for durable project versions.

- **Save setup / Load setup**: JSON with settings, current commanded height
  and camera. Local audio files are excluded.
- **Share setup**: copy a URL containing that configuration in its fragment.
  The recipient needs a running copy of this site. No server-side storage.
  The link includes scene parameters and camera, not the current sway velocities.
- **3D scene · GLB**: visible geometry and its current pose, for Blender and
  other glTF tools. No animation clips or physics constraints are exported.
- **Motion recording · CSV**: time, commanded height, payload positions,
  approximate line loads, sway and pitch in SI units. Recorded at approximately
  10 Hz simulated time; retains the latest 36,000 samples.
- **Current view · PNG**: the rendered 3D scene, without the surrounding UI.
- **Current setup · FreeCAD macro**: a macro with current dimensions and pose
  embedded, so you do not need to recreate the settings manually.

## FreeCAD

1. In the web app choose Export → Current setup · FreeCAD macro.
2. Place `GhostlightStage.FCMacro` in your FreeCAD macro directory, or open it
   with the Macro editor and save it there.
3. Run it through **Macro → Macros**.
4. The macro creates a document with native editable reference solids grouped
   into Stage, Rigging, Boom, Head, Microphone and Performer.
5. Save the document as `.FCStd`. Select geometry and use File → Export for STEP.

The unembedded macro included in `dist/cad` optionally loads a saved setup JSON;
cancel the file picker to use defaults. The spreadsheet records configuration
values for reference; it does not drive a parametric assembly. To regenerate
the full scene, change the web configuration and export/run another macro.
The macro does not perform a collision simulation, motion joint analysis or FEM.
FreeCAD was unavailable in the build environment: macro syntax was checked,
but execution inside FreeCAD still needs to be verified on your installation.

FreeCAD uses millimetres with Z up. The macro converts from the web coordinates:
CAD X = web X, CAD Y = −web Z, CAD Z = web Y + deck elevation.

## Physics and its limits

`dist/js/physics.js` is independent of Three.js and can be tested with Node.
It advances at a fixed 1/120 second timestep, including accelerated previews.
Each payload uses gravity, exponential velocity damping, and a unilateral
inextensible rope constraint. Moving anchors and motorised payout modify the
constraint. Contact response uses spherical payload envelopes, a cylindrical
performer envelope, and the deck plane. Payload-to-payload contact is included.

This model supports meaningful **motion, sway, timing and rough clearance**
studies. It is not a full rigid-body engineering solver. It omits:

- Flexible cables, bending, stretch, winding layers and real cable routing.
- Load-bearing properties of the head shell and joints; head rotation inertia.
- Collisions with the boom, drapery, trusses, microphone cable or venue scenery.
- Base tipping, arm flex, material stress, support/anchor loads, fatigue and
  structural stability. The visible base/counterweight are illustrative.
- Brake or motor dynamics, motor efficiency, thermal behaviour, exact transient
  tension and safety-rated control logic.

The displayed line tension is a gravity/centripetal estimate, not a shock-load
or machinery sizing calculation. The boom readout is the payload's moment
before counterweight and arm weight. A contact response can cause temporary
rope slack or pose disagreement; the height-error display makes this visible.

This is an offline visual prototype. It has no hardware interface and should
not control real lifting equipment. Actual stage equipment and any movement
near/above people require a separate venue-specific engineering and rigging
review.

## Development and verification

```sh
npm run check
npm test
```

The optional full-scene geometry/export check regenerates the example GLB:

```sh
node --loader ./tests/vendor-loader.mjs tests/export-smoke.mjs
```

No dependencies need installing. Tests cover configuration limits, boom
kinematics, cue sequences, speed/height limits, stop/rearm, static load,
rope constraints, damping, basic actor contact and a complete boom cycle.

Source layout:

- `dist/js/scene.js`: theatre geometry, lights, cameras, renderers and GLB export.
- `dist/js/physics.js`: configuration, drive, pendulums and contact envelopes.
- `dist/js/app.js`: parameter panels, operator cues, audio, sharing and exports.
- `dist/cad/GhostlightStage.FCMacro`: FreeCAD reference generator.
- `dist/vendor`: pinned Three.js r170 and necessary addons with its MIT license.
- `tests`: dependency-free motion tests.
- `.github/workflows/pages.yml`: test and deployment workflow.

WebGL 2 rendering uses physically based materials, shadow maps and tone mapping.
The build environment's browser disabled WebGL: interactive browser checks used
the software renderer. GPU-specific appearance still needs a check on your
target laptop/projector browser. This prototype does not claim browser playback
to be frame-accurate show-control software.

## License

Project code: MIT, see LICENSE. Procedural geometry can be used and modified
without separate model licenses. Bundled Three.js and addons retain their MIT
notice in `dist/vendor/THREE-LICENSE.txt`. Two SVGRenderer import paths were
adjusted for the local vendor directory; otherwise vendor code is unchanged.
