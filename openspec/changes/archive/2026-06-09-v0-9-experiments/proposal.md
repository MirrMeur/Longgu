# Proposal

## Why

Longgu now has planning, state, audit, revision, context, routing, and cost records, but users still need a way to compare multiple opening variants, model choices, hooks, or prompt approaches. Without an experiment layer, batch tests become ad hoc folders and spreadsheet notes, making cost, audit, and manual scoring hard to compare.

## What Changes

- Add an experiment schema and local experiment directory under `experiments/<id>/`.
- Add `longgu experiment create` to create a reviewable experiment manifest.
- Add `longgu experiment run` to register or materialize variant outputs with cost metadata.
- Add `longgu experiment score` to write human scores back into a variant.
- Add `longgu experiment compare` to aggregate variant outputs, audit files, run costs, and human scores into JSON and Markdown reports.

## Impact

- Adds a new core experiment module and CLI group.
- Reuses existing run/audit metadata when files are present, but does not require live provider calls in V0.9.
- Does not change existing chapter generation, audit, revision, or state flows.
