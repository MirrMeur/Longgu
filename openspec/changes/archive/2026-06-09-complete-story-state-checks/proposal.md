# Complete Story State Checks

## Why
The README marks story state as partially implemented because Longgu can initialize, inspect, and settle ledgers, but it cannot produce a reviewable consistency check across the settled state.

## What Changes
- Add `longgu state check`.
- Validate all ledgers and inspect cross-ledger references.
- Persist JSON and Markdown check reports under `state/checks/`.

## Impact
- Capability: `story-state`
- CLI: adds `state check`.
