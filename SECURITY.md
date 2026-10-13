# Security and local-use scope

ASIC Explorer is a teaching application. Local `npm start` and `npm run dev` bind to loopback (`127.0.0.1`) on port 4175. On Heroku, the production launcher binds to the assigned `PORT` on `0.0.0.0`, behind Heroku's router.

The synthesis API executes a Node worker without a shell, validates the top-module identifier, bounds output, and runs Yosys in a virtual filesystem. It reads at most 24,000 request bytes, including streamed bodies without a Content-Length header, and stops waiting for an incomplete body after five seconds. Local use permits two concurrent jobs and a 30-second synthesis deadline. Heroku use permits one active job, six compilation starts per minute per process, and a 20-second synthesis deadline. HTTP 429 responses include a Retry-After header. Invalid request structure is rejected before consuming the compilation budget.

The shared budget does not collect visitor IP addresses or persist HDL. Prepared examples and browser simulation remain usable when compilation is busy or rate limited. A single small public demo can still be exhausted by repeated requests; the budget is process-local, resets on restart, and does not coordinate multiple dynos. Separate multi-user worker isolation, authentication, a durable queue, and distributed abuse controls are outside this deployment. Do not use it for private designs or as an unrestricted public compilation service. Examples do not require credentials or external AI services.

## Initial-release checks: October 12, 2026

- The publication candidate was checked for environment files, common credential patterns, private keys, and interview scheduling on the tutorial cover. No credentials were found in the publishable files; the public handout uses a classroom cover. Generated builds, installed dependencies, and local editor assets are excluded from Git.
- The nine functional/model tests and API checks passed. The API checks include edited HDL, invalid syntax, invalid module names, malformed JSON, size limits, and unsupported methods.
- `npm audit --omit=dev` reported **two moderate package entries**, `dompurify` and its dependent `monaco-editor`, with no high or critical entries. Both entries concern the same transitive sanitizer dependency in the pinned editor. The publication retains the tested Monaco 0.55.1 dependency; this audit finding is not claimed to be fixed or proven exploitable through this application's HDL interface.
- This is a basic publication check, not an exhaustive repository security assessment. Audit results can change as advisories and packages change. Run `npm audit` against your installation and review the affected paths before deploying or upgrading.

## Reporting

Please report suspected vulnerabilities privately through the maintainer's contact options on [Nariman Mani's GitHub profile](https://github.com/narimanmani). Do not include credentials, private chip designs, or student information in public issues. Include the affected version, steps to reproduce, and a minimal example. Ordinary teaching-interface bugs can be filed as public issues.
