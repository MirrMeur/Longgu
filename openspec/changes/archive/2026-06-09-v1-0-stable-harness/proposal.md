# Proposal

## Why

Longgu has reached the planned V0.9 feature surface: workspace setup, planning, state, audit, revision, genre cards, context packs, model routing, cost reporting, and experiments. V1.0 should stabilize the harness so users can discover commands, start from a complete example, trust the formal specs, and run one verification suite before using the project for long-form work.

## What Changes

- Set the package and CLI version to `1.0.0`.
- Add stable CLI discovery coverage for all command groups.
- Add a V1.0 verification command that runs typecheck, build, tests, and OpenSpec validation.
- Expand the example project with representative V1.0 artifacts for planning, state, context, model routing, and experiments.
- Add concise V1.0 usage documentation.

## Impact

- No large package split is performed in this change; the planned package names remain documented for later publishing.
- Existing V0.x commands remain compatible.
- The change focuses on stabilization, docs, examples, and release verification.
