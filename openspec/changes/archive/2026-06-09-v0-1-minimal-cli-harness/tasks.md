## 1. Project Setup

- [x] 1.1 Create the TypeScript/Node.js package structure for CLI, core schemas, and provider adapter code.
- [x] 1.2 Add package scripts for build, test, typecheck, and CLI execution.
- [x] 1.3 Add dependencies for CLI parsing, YAML parsing, zod validation, and Vitest testing.

## 2. Workspace Initialization

- [x] 2.1 Implement `novel init` to create the V0.1 workspace directories and starter files.
- [x] 2.2 Add overwrite protection for existing user-authored workspace files.
- [x] 2.3 Define and test the `novel.yaml` schema for one OpenAI-compatible provider.

## 3. Provider And Doctor

- [x] 3.1 Implement the OpenAI-compatible provider adapter contract.
- [x] 3.2 Implement `novel doctor` checks for structure, config, API key environment variable, and provider connectivity.
- [x] 3.3 Add clear non-zero failure behavior for failed doctor checks.

## 4. Chapter Generation

- [x] 4.1 Add the baseline chapter generation prompt template.
- [x] 4.2 Implement input context loading from V0.1 `bible/` files.
- [x] 4.3 Implement `novel write chapter --id <id>` to render prompt, call provider, and write `chapters/<id>.md`.
- [x] 4.4 Persist successful and failed run records under `runs/`.

## 5. Run Inspection

- [x] 5.1 Implement `novel run show` for the latest run summary.
- [x] 5.2 Handle the no-runs case with a clear message.

## 6. Example And Verification

- [x] 6.1 Add `examples/xuanhuan-demo/` with V0.1-compatible files.
- [x] 6.2 Add tests for init, config validation, doctor failure reporting, write behavior with a fake provider, and run show.
- [x] 6.3 Run `openspec validate v0-1-minimal-cli-harness`.
- [x] 6.4 Run project build, typecheck, and tests.
