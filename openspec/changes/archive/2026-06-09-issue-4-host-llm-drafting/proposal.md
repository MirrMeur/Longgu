## Why

Issue #4 points out that Longgu's current CLI drafting path assumes Longgu must call an external LLM provider. In Claude Code or another AI programming assistant, the user already has an available host LLM and often wants Longgu to manage files, context, state, audits, and run records while the host assistant writes the prose.

Requiring `provider.baseUrl`, `apiKeyEnv`, and `model` for this workflow creates duplicate configuration, extra model calls, and a context split between the host conversation and Longgu's provider call.

## What Changes

- Add a host-LLM drafting workflow for `write chapter`.
- Allow a workspace config without `provider` when the command does not need provider-backed generation.
- Add `longgu write chapter --host-prompt --id <id>` to build context and write a host prompt artifact that can be handed to Claude Code or another assistant.
- Add `longgu write chapter --input <path> --id <id>` to import host-generated Markdown into `chapters/<id>.md`.
- Persist imported host drafts as normal run records with provider/model marked as `host-llm`, zero cost, prompt/context artifacts, and output artifacts.
- Keep the existing provider-backed `write chapter` path unchanged when neither `--host-prompt` nor `--input` is used.

## Capabilities

### Modified Capabilities

- `minimal-cli-harness`: Chapter writing supports provider-backed generation, host prompt export, and host draft import.
- `model-routing-cost`: Cost reporting handles host-LLM run records as zero-cost model activity.

## Impact

- Claude Code users can run Longgu without configuring a duplicate provider for drafting.
- Provider-backed standalone use remains available.
- `doctor` and provider-backed generation still require provider config.
- New host prompt artifacts are stored under `host-prompts/`.
- Imported host drafts create traceable run records under `runs/`.
