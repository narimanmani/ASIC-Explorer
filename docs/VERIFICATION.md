# Verification record

Checked on October 6, 2026, using Node.js 22.19.0 and the production Next.js build at http://127.0.0.1:4175.

## Automated checks

- `npm run build`: production compilation, TypeScript validation, and route generation passed.
- `npm run typecheck`: passed.
- `npm test`: 9 tests passed. These exercise both actual DigitalJS abstractions, reset priority, enable hold, modulo wrap, asynchronous reset, increment-by-two, complete combinational truth tables, bounded traces, timing arithmetic, placement measurements, edited-source synthesis, and syntax diagnostics.
- `npm run check:api`: passed. Checks cover genuinely edited HDL, invalid syntax, invalid top-module names, invalid JSON, the input-size limit, unsupported methods, the tutorial PDF, and all five example assets.

## Browser checks

The production app was exercised through its controls and Monaco editor in the Codex in-app browser:

- Edited the counter to add 3, synthesized it, and observed count = 3 after one clock cycle. The constant and connected circuit updated; custom-source prompts replaced the prepared-example question.
- Submitted invalid HDL, observed the source diagnostic, and recovered with Restore example source. Simulation controls stayed disabled for uncompiled edits.
- Stepped the synchronous counter, disabled enable, and observed a held count. Reset between edges held the old value until the next edge. Asynchronous reset changed the value without another clock edge.
- Selected a mux with b = 1 and sel = 1 and observed y = 1.
- Switched between examples and word/gate views, retaining state across abstraction changes. A stale-layout transition found during checking was repaired and rechecked with different circuit shapes.
- Ran and paused autoplay, inspected an adder's source line, and exercised fit/zoom and keyboard controls.
- Confirmed setup/hold presets: post-route setup -0.05 ns; slower-clock hold -0.04 ns; repaired hold +0.02 ns.
- Moved a placement cell with the keyboard: wire length changed from 1020 to 1015 units and the lesson stayed selected. Compact placement measured 455 units.
- Built the illustrative balanced clock tree; displayed sink skew became 0.00 ns. Exercised routing-layer visibility and the RC overlay.
- Confirmed spacing violation gives DRC FAIL / LVS PASS, and a broken connection gives DRC PASS / LVS FAIL.
- Opened teaching notes with their original diagram, closed them with Escape, entered presentation mode, and returned to the editor after visiting physical lessons.
- Checked a 375 x 812 viewport request and a 960 x 600 viewport request, including presentation mode. The browser's scrollbar-adjusted content widths were 360 and 945 px, with no document-level horizontal overflow on the checked RTL and timing views. Restored the default viewport afterward.
- Downloaded SVG, waveform CSV, and HDL through the UI. The exported SVG parsed as XML with a 795 x 270 viewBox and no viewport sizing style. The CSV contained the expected rising/falling samples and counts 0, 1, 2; the HDL matched the counter source. Copies are in `docs/sample-exports/`.

Screenshots: `preview.jpg` and `timing-preview.jpg`.

## Tutorial practice revision

The embedded tutorial was revised on October 6, 2026 to include 27 numbered practice activities. Its main setup/hold examples, matching SDC margins, and app-based homework use the app's parameters. All 13 described timing cases and three placement observations were cross-checked against the actual model. The document explains counter initialization, logical waveform steps, independent preset cases, and the physical views' scope. No application behavior changed in this document revision.

## Beginner teaching revision

The same artifacts were revised on October 6, 2026 around **store, calculate, update**. The tutorial now has a four-page primer and 32 practice boxes, and retains detailed material for preparation. Three simpler timing diagrams supplement the 22 detailed TikZ figures. The light-theme deck has 27 core slides budgeted for 36 minutes, a four-minute question window, and 14 optional reference slides; its six app visits total 8.5 minutes within the core. These are planned windows, not a measured rehearsal.

- Production build and TypeScript validation passed after the guided-view changes and the final Signoff button-label correction. The nine model/synthesis tests passed during this revision. The API checks also passed on the revised production server.
- Guided practice advances one step at a time and reveals the explanation on request. Counter practice was exercised: two edges produce 2; enable off holds 2; synchronous reset holds 2 before the edge and produces 0 at the next edge.
- Clicking the word-level adder showed Addition and its compiler source association. Gate view retained the counter behavior and a further edge produced 3. Selecting increment-by-two replaced the counter-specific instructions with the independent experiment prompt. The prepared counter and word view were restored afterward.
- Guided Timing initially hides equations and sliders. Revealing them works. Switching to Full lab retains the modeled values. After routing gives setup −0.05 ns; Slower clock leaves hold −0.04 ns; Repair hold gives setup +0.24 ns and hold +0.02 ns. Teaching notes show the new data-journey diagram and the 18:00–20:00 visit window.
- Guided placement changes connection length from 1020 to 455 units. The clock example changes assigned arrival spread from 0.30 to 0.00 ns. Routing layer visibility and the RC overlay were exercised. Spacing violation gives DRC FAIL / LVS PASS; Broken connection gives DRC PASS / LVS FAIL; Clean layout gives both PASS. The final button names match the tutorial and slide cue sheet.
- Checked Guided RTL and Timing at a 375 × 812 viewport request and at a 960 × 700 teaching-window request. Content widths were 360 and 945 pixels, respectively, with matching document scroll widths. The viewport override was reset afterward. `beginner-preview.png` records the guided introduction during the wider layout check.
- The tutorial PDF and all 50 PDF/PNG figure assets are copied from the current Overleaf source exports. Slide notes match the exact script source, and all 42 slide renders and all tutorial pages were reviewed. The portable package includes the final deck and separate app cue sheet.

## Interactive introduction — October 8, 2026

The Design intent page previously displayed four static zeros and asked a question about an Enable control located in the next lesson. It now exposes Step clock, Start over, Enable, and Reset beside the live decimal/binary value. Definitions and a next-edge prediction explain the controls. Four guided practices introduce counting, permission to count, synchronous reset, and the three hardware jobs.

- The intro uses the existing DigitalJS behavior and gate simulators. No separate counter model was added. The intro controls update both simulators, and the RTL workspace preserves the same state.
- Production build and TypeScript checks passed. All nine existing model/synthesis tests passed.
- Browser checks: two enabled steps gave 2 / 0010; Enable off followed by a step kept 2 while the visible clock-edge count increased to 3. Reset on kept 2 until another step, then produced 0 with Enable off. Start over restored zero, Enable on, and Reset off.
- Space on the focused Enable switch toggled permission without creating an extra edge. Moving to RTL preserved count 2, Enable off, and three clock edges.
- Selecting the multiplexer then returning to the intro kept that selection; the intro offered Load four-bit counter instead of showing misleading counter controls. Loading it restored the prepared counter at zero.
- The intro was checked at 375 × 812 and 320 × 812 viewport requests, with content/scroll widths 360 and 305 pixels respectively. The four bits fit inside their card at the narrower width. The default wider view was also inspected; the viewport override was reset afterward.
- `intro-counter-preview.png` records count 2 with Enable off. The app source ZIP and tutorial package were refreshed with the revised source and this verification record. The tutorial PDF and slide deck were unchanged in this fix.

## Screenshot documentation — October 12, 2026

- Captured and visually reviewed ten production-app screenshots covering all eight lessons, a fresh synthesis report, and the teaching-notes dialog. The main README embeds them using relative local paths and explains how to reproduce each experiment.
- The introduction held count 2 / 0010 with Enable off after three edges. The word-level counter showed 2 after two enabled edges; switching to generic gates and stepping again gave 3. Selecting the adder exposed its RTL association.
- Synthesize completed through the UI with the unchanged counter. The report displayed Yosys 0.70.62-dev.1236, 2 word-level cells, 10 generic mapped cells, and the actual compilation log. Synthesis reinitialized the simulation to zero.
- The captured physical cases show post-route setup slack -0.05 ns, compact-placement length 455 teaching units, assigned clock-arrival spread 0.00 ns, both metal layers with the RC overlay, and Broken connection with DRC PASS / LVS FAIL. Their captions explicitly identify the illustrative scope.
- The Example selector and source inventory confirm five prepared HDL designs; the navigation has eight teaching lessons. The README distinguishes these counts.
- No executable application code changed in this documentation update. Earlier automated-check results above retain their original verification dates; they are not claimed as new test runs.

## Public repository preparation — October 12, 2026

- The production build and TypeScript validation passed. All nine existing functional/model tests passed, and the API checks passed on the local production server.
- Publication adds a portable clone/install guide, MIT license for original work, contributor guidance, local-use security notes, and dependency notices. The dependency inventory covers 131 locked entries; available license files are copied, including upstream YoWASP/Yosys notices. Installed libraries and generated runtimes are excluded from Git.
- A common-pattern credential check found no credentials in the publishable app files. The tutorial's public cover replaces its interview-specific cover. Its 43-page count, body-page text, bookmarks, and internal link structure are retained; the new cover and first body page were rendered and visually reviewed. The Overleaf original remains unchanged. All 25 standalone TikZ figure sources are included beside the existing figure exports.
- `npm audit --omit=dev` reported two moderate package entries involving DOMPurify and the pinned Monaco editor, with no high or critical entries. This finding is documented in SECURITY.md; it is not claimed to be fixed or to establish an application exploit.
- No HDL simulation, teaching-model arithmetic, or application interaction code was changed for publication. This record does not claim comprehensive security validation, browser coverage, or equivalence to a commercial ASIC suite.

## Heroku deployment preparation — October 12, 2026

- The Node launcher preserves local loopback/port 4175 and supports Heroku's assigned port and host binding. The Procfile, Node 22.x declaration, and editor-asset/production build hook are committed with the application.
- Production build and TypeScript validation passed. All 12 tests passed, including three new checks for streamed-byte limits, incomplete-body timeout, and synthesis-budget recovery.
- The API checks passed against both the local production mode and a loopback-only instance with Heroku-mode limits enabled. Additional HTTP checks confirmed one active compilation, a six-start shared minute budget, Retry-After on 429 responses, and prepared examples still available while compilation was rate limited.
- The Heroku app record `asic-explorer-narimanmani` was created on heroku-24 in the US region with the official Node.js buildpack. This preparation record does not claim a live deployment or authorization of a paid running formation.
- A small shared demo uses one compilation worker, a 20-second compilation deadline, a 24,000-byte streamed request cap, a five-second body deadline, and bounded output. These measures do not establish complete abuse prevention or isolation for an unrestricted multi-user EDA service. Known editor dependency-audit findings remain documented in SECURITY.md.

## Live Heroku deployment — October 12, 2026

- Release v3 succeeded for application commit `3941aa7eb2bab968c9a09b896504a0697ae53baa`, using Node 22.23.3 and npm 10.9.9. Heroku's production compilation and TypeScript checks passed; the server reached Ready and web.1 reached Up. The public root returned HTTP 200.
- The account owner approved one Basic dyno at up to US$7/month. The formation and empty add-on inventory were verified. The application is `asic-explorer-narimanmani` on heroku-24 in the US region.
- The official Node runtime download repeatedly stalled with the stock buildpack. A pinned, licensed snapshot of Heroku's buildpack adds resumable download attempts, retaining its official runtime source, TLS checks, and SHA-256 verification. The completed archive passed checksum validation. The deployment uses buildpack commit `30450ab9a07e6b2f45b66baf3d9a4cc60921adc1`; details are in [HEROKU.md](HEROKU.md).
- `npm run check:api` passed against the public HTTPS app: edited increment-by-three HDL, syntax diagnostics (422), invalid top-module input (400), malformed JSON (400), oversized input (413), unsupported method (405), tutorial PDF, and all five example assets.
- Browser verification on the hosted app: Start over and two enabled steps gave 2 / 0010; disabling Enable and stepping retained 2 after three edges. Asserting synchronous Reset retained 2 until the next step, then cleared to 0 with Enable off. Moving to RTL preserved the simulator state.
- Edited the actual Monaco source to increment by 2. Uncompiled edits disabled clock stepping; Synthesize completed through the hosted API. Two steps produced 2 then 4 / 0100, with matching circuit values and waveform history. Switching to generic gates and back retained count 4 and two edges; both circuit representations rendered.
- The deployed introduction and edited-source experiment were captured and visually reviewed in `heroku-live-preview.jpg` and `heroku-synthesis-preview.jpg`. The prepared counter and Guided introduction were restored after verification.
- Recent runtime logs contained no R14, R15, H10, or H12 errors in the inspected window. This observation is not a sustained-load or availability guarantee. No physical-design engine was added; the documented illustrative scope remains unchanged.

## Interpretation

These checks establish the implemented examples and controls, not educational effectiveness, exhaustive SystemVerilog support, foundry timing, or chip signoff. The physical models do not run placement, CTS, routing, extraction, DRC, or LVS tools. The app labels these illustrations explicitly. No fabrication-ready layout is generated.
