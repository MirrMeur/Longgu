# Fix reader promise debt checks for generated chapter ids

## Why

GitHub issue #24 reports that `longgu state check` skips reader promise debt checks when chapter ids use Longgu's generated `<volumeId>-<NNN>` format, such as `v1-050`. The current parser only accepts pure numeric ids, so the default planning output format never triggers overdue promise warnings.

## What Changes

- Parse chapter sequence numbers from both pure numeric ids and generated `<volumeId>-<NNN>` ids.
- Add regression coverage for overdue active reader promises using `v1-001` and `v1-050`.
- Align relevant CLI help examples with generated chapter ids.

## Impact

- Affects `longgu state check --chapter <id>` reader promise debt detection.
- Does not change ledger schemas or state check report format.
- Fixes GitHub issue #24.
