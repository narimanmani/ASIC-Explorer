# Security and local-use scope

ASIC Explorer is a local teaching application. `npm start` and `npm run dev` bind to loopback (`127.0.0.1`) on port 4175. The synthesis API executes a Node worker without a shell, validates the top-module identifier, limits requests and output, permits two concurrent jobs per server process, and ends synthesis after 30 seconds. It runs Yosys in a virtual filesystem. These measures do not establish safe multi-user Internet hosting or isolation from every resource-exhaustion case.

Do not expose this server to a public network without a separate deployment review, authentication, resource isolation, and operational controls. Source code can be published without deploying a public synthesis endpoint. Examples do not require credentials or external AI services.

## Initial-release checks: October 12, 2026

- The publication candidate was checked for environment files, common credential patterns, private keys, and interview scheduling on the tutorial cover. No credentials were found in the publishable files; the public handout uses a classroom cover. Generated builds, installed dependencies, and local editor assets are excluded from Git.
- The nine functional/model tests and API checks passed. The API checks include edited HDL, invalid syntax, invalid module names, malformed JSON, size limits, and unsupported methods.
- `npm audit --omit=dev` reported **two moderate package entries**, `dompurify` and its dependent `monaco-editor`, with no high or critical entries. Both entries concern the same transitive sanitizer dependency in the pinned editor. The publication retains the tested Monaco 0.55.1 dependency; this audit finding is not claimed to be fixed or proven exploitable through this application's HDL interface.
- This is a basic publication check, not an exhaustive repository security assessment. Audit results can change as advisories and packages change. Run `npm audit` against your installation and review the affected paths before deploying or upgrading.

## Reporting

Please report suspected vulnerabilities privately through the maintainer's contact options on [Nariman Mani's GitHub profile](https://github.com/narimanmani). Do not include credentials, private chip designs, or student information in public issues. Include the affected version, steps to reproduce, and a minimal example. Ordinary teaching-interface bugs can be filed as public issues.
