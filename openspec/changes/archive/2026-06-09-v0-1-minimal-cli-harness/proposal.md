## Why

The project needs a first executable slice that turns the planning document into a runnable CLI harness. V0.1 establishes the minimum workflow for initializing a novel workspace, checking configuration, generating a first chapter, and preserving enough run evidence for review and reproduction.

## What Changes

- Introduce a TypeScript/Node.js CLI package with the commands `novel init`, `novel doctor`, `novel write chapter --id <id>`, and `novel run show`.
- Define the initial novel workspace layout, including `novel.yaml`, `bible/`, `chapters/`, and `runs/`.
- Add a `novel.yaml` schema for one OpenAI-compatible provider.
- Add baseline prompt templates for single-chapter generation from existing project files.
- Persist every generation run to disk, including input context, prompt, model/provider metadata, output, timing, and error information.
- Add an example project at `examples/xuanhuan-demo/`.

## Capabilities

### New Capabilities

- `minimal-cli-harness`: Covers V0.1 CLI commands, novel workspace initialization, provider configuration checks, first-chapter generation, and persisted run records.

### Modified Capabilities

- None.

## Impact

- Creates the initial implementation structure for a TypeScript/Node.js monorepo or package layout.
- Adds CLI, schema validation, prompt templates, run persistence, and example project files.
- Introduces one OpenAI-compatible LLM provider contract.
- Requires tests for command behavior, schema validation, run record creation, and failure reporting.
