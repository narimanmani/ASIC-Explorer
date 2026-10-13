# Contributing

Educators and developers can contribute examples, clearer explanations, accessibility improvements, and bug fixes. Describe the student action, expected result, and observed result when reporting a problem. Include the lesson, selected example, browser, and version; use a small HDL example without private design information.

Install dependencies with `npm ci`. Run `npm run dev` for development, or `npm run build` followed by `npm start` for the production preview. Both bind to `127.0.0.1:4175`.

Before proposing executable changes, run `npm run typecheck`, `npm test`, and `npm run build`. With the production server running, run `npm run check:api`. Check the affected interaction in a browser. If examples change, regenerate their netlists with `npm run examples`; keep screenshots and guided instructions consistent with the controls and results.

Preserve the distinction between real synthesis/functional simulation and illustrative physical-design models. Do not present a drawing or a prepared PASS/FAIL case as an executed ASIC implementation or verification result. Keep the default local workflow usable without accounts, API keys, or hosted editor assets.

Original contributions are licensed under this project's MIT license. Retain third-party notices and update the dependency inventory when dependencies change. Do not commit `node_modules`, `.next`, local editor copies, environment files, credentials, or private classroom/student data.
