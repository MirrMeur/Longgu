# Add V0.5 Chapter Revision Loop

## Why

V0.4 can find chapter quality problems, but Longgu still cannot act on audit results. V0.5 needs a first write-audit-revise loop that applies targeted fixes, records before/after evidence, and leaves revision history for review.

## What Changes

- Add `longgu revise chapter --id <id>`.
- Add `--input <path>` for deterministic revised Markdown produced by a human or external tool.
- Read `audits/<id>.audit.json` and prioritize `critical`/`warning` issues.
- Support revision modes: `spot-fix`, `polish`, `rewrite-scene`, and `rewrite-chapter`.
- Default ordinary warning revisions to `spot-fix`.
- Ask the configured provider to return revised chapter Markdown.
- Skip provider calls when `--input` is provided.
- Write revision records under `revisions/<id>/<timestamp>/`.
- Preserve `before.md`, `after.md`, `diff.md`, `metadata.json`, `prompt.md`, and `model-output.md`.
- Replace `chapters/<id>.md` only after the revised chapter is non-empty and different.
- Optionally compare pre/post audit critical counts when a post-audit input is supplied.

## Impact

- Capability: `chapter-revision`
- CLI: new `revise chapter` command
- Filesystem artifacts: `revisions/`
- Core logic: revision prompt, mode selection, diff generation, revision record writing
- Out of scope: fully automatic re-running of provider audit after revision; the first V0.5 implementation supports deterministic post-audit comparison via `--post-audit`.
