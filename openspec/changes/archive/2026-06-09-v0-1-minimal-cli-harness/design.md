## Context

The repository currently contains planning and comparison documents, plus an OpenSpec workspace. V0.1 is the first executable slice of the novel harness: a CLI-first, file-first workflow that can initialize a novel project, validate provider readiness, generate one chapter, and preserve run evidence.

The planning document recommends TypeScript, Node.js, zod, Markdown/JSON file artifacts, one OpenAI-compatible provider, and Vitest.

## Goals / Non-Goals

**Goals:**

- Establish a small TypeScript implementation structure suitable for later packages.
- Provide a runnable `novel` CLI for V0.1 commands.
- Keep V0.1 workspace files human-readable and versionable.
- Persist both successful and failed generation attempts.
- Make provider failure visible instead of swallowing errors.

**Non-Goals:**

- No GUI or web studio.
- No multi-provider routing.
- No long-form state ledger implementation yet.
- No audit, revision, volume planning, or chapter planning flows yet.
- No SQLite requirement in V0.1 unless later implementation evidence justifies it.

## Decisions

### Use a TypeScript CLI-first structure

Use TypeScript and Node.js for the initial code. This matches the project plan and keeps schema, CLI, provider adapters, and tests in the same ecosystem.

Alternative considered: plain JavaScript. It would reduce setup but weaken contracts around configuration, run records, and provider responses.

### Use a small package layout before a full monorepo split

Implement V0.1 with a structure that can grow into `packages/core`, `packages/cli`, and `packages/adapters`, but avoid premature complexity if the repository has no package setup yet. The implementation may start with these package folders directly if bootstrapping is cheap.

Alternative considered: create a single `src/` package. That is simpler, but the planning document already expects CLI/core/adapter boundaries.

### Use zod for configuration and run record schemas

`novel.yaml` and run record metadata should be validated through zod. This keeps user-facing errors explicit and prepares later LLM output validation.

Alternative considered: TypeScript interfaces only. Interfaces do not validate runtime YAML input.

### Persist run records as directories

Each generation attempt should create one timestamped directory under `runs/`, containing at minimum metadata, input context, rendered prompt, output or error details. This mirrors the planning document and makes reproduction practical.

Alternative considered: a single append-only JSON log. It is compact, but harder to inspect and less suitable for large prompts and outputs.

### Start with one OpenAI-compatible provider adapter

V0.1 should support one provider contract with `baseUrl`, `model`, and API key environment variable. The adapter should be thin and replaceable.

Alternative considered: use a provider SDK directly. SDKs can add lock-in and make later provider replacement harder.

## Risks / Trade-offs

- Provider network calls can make tests flaky -> keep provider adapter mockable and cover CLI behavior with fake adapters.
- Run directories can accumulate quickly -> acceptable in V0.1 because reproducibility is a stated goal.
- YAML schema may become too narrow -> keep V0.1 explicit and evolve through later OpenSpec changes.
- Starting with package folders may add setup work -> keep package boundaries minimal and use shared test tooling.

## Migration Plan

This is the first implementation slice, so there is no migration from existing code. Existing planning documents remain unchanged.

## Open Questions

- Whether the CLI package should use `commander` or `oclif` should be finalized during implementation setup.
- Whether the first OpenAI-compatible request should use the standard Chat Completions shape or Responses-compatible shape depends on the selected adapter contract.
