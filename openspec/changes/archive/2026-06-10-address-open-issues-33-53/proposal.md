## Why

The current open issues describe concrete bugs and workflow gaps in Longgu's host-LLM, planning, state, audit, pacing, market-awareness, and experiment flows.

This change addresses issues #33, #34, #35, #36, #37, #39, #40, #41, #49, #50, #51, #52, and #53 in one coordinated batch so the CLI remains internally consistent.

## What Changes

- Fix cross-volume chapter number parsing and timeline tie-break ordering.
- Make provider JSON fence extraction tolerate prose after the fenced JSON block.
- Add scaffold planning mode for deterministic bible-derived book/volume/chapter drafts.
- Add host batch prompt export and host batch draft import.
- Report word-count fit when importing host-generated chapters.
- Add batch state settlement by range or volume.
- Add human-readable chapter brief context output.
- Add payoff-recipe and market constraints to context/audit prompts.
- Add payoff-engineering audit dimensions.
- Add rule-based pacing analysis across chapters.
- Add experiment diagnostics for registered variants.

## Capabilities

### Modified Capabilities

- `book-planning`: scaffold mode fills deterministic drafts from bible inputs.
- `minimal-cli-harness`: CLI gains batch host workflows and pacing command.
- `story-state`: state checks and settlement handle cross-volume chapter order and batch settlement.
- `context-builder`: context builds can emit human-readable brief cards and include payoff/market constraints.
- `chapter-audit`: audit prompt and schema include payoff-engineering dimensions and market constraints.
- `experiments`: experiments can generate automatic structural diagnostics.

### Added Capabilities

- `pacing-analysis`: rule-based multi-chapter pacing, hook, payoff, and CP screentime diagnostics.

## Impact

- Existing workspaces remain valid.
- New `market` config is optional.
- New `bible/payoff-recipes.md` is optional; when present it is included in context and audit prompts.
- Batch settlement still settles one chapter at a time internally so each delta observes the latest ledgers.
