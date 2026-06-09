# Add V0.4 Chapter Audit System

## Why

Longgu can now draft chapters and settle story state, but it does not yet have a chapter quality gate. V0.4 needs every chapter to produce a structured, reviewable audit result that later revise commands can consume.

## What Changes

- Add `longgu audit chapter --id <id>`.
- Produce `audits/<id>.audit.json` and `audits/<id>.audit.md`.
- Define the first chapter audit schema with severity levels `critical`, `warning`, and `info`.
- Add prompt-based provider audit extraction with schema validation and one retry.
- Add deterministic audit issue normalization from checker-style `P0/P1/P2` to harness severity.
- Include prose metrics from the prose checker domain: AI flavor, scene pressure, character voice, and readability.
- Mark whether critical issues block advancing to the next chapter and whether warning issues enter the revise queue.

## Impact

- Capability: `chapter-audit`
- CLI: new `audit chapter` command
- Filesystem artifacts: new `audits/` output files
- Core logic: audit schema, prompt, parser, markdown projection, severity mapping
- Out of scope: automatic revision, custom genre-card registry package, and full rule plugin system; those belong to V0.5 and V0.6.
