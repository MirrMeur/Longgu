# Complete Experiment Generation

## Why
Experiments can register manual candidate files and score them, but they cannot generate a candidate through Longgu's model routing. This leaves experiment evaluation as a partial workflow.

## What Changes
- Add `longgu experiment generate`.
- Read a prompt Markdown file and generate a variant output through the `experiment` route.
- Register the generated output as a normal variant with run and cost links.

## Impact
- Capability: `experiments`
- CLI: adds `experiment generate`.
- Cost reporting includes experiment generation runs.
