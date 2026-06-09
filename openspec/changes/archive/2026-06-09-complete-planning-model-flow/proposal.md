# Complete Planning Model Flow

## Why
The README marks book, volume, and chapter planning as partially implemented because the current commands only create deterministic editable drafts. Longgu needs a complete planning workflow that can either keep deterministic drafts for local control or ask the configured planning model to produce schema-validated planning artifacts with run evidence.

## What Changes
- Add optional model-backed planning to `longgu plan book`, `longgu plan volume`, and `longgu plan chapters`.
- Keep deterministic planning as the default path.
- Validate model outputs against existing planning schemas before writing.
- Persist planning model prompts, raw outputs, route attempts, token estimates, and costs under `runs/`.

## Impact
- Capability: `book-planning`
- CLI: adds `--model` to planning commands.
- Cost reporting: planning runs become visible in `longgu cost report`.
