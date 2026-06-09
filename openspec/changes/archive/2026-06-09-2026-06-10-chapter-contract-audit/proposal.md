# 2026-06-10 Chapter Contract Audit

## Why

Longgu already audits retention, weak payoff, weak ending hooks, and several consistency risks. That is useful, but it still lets a chapter pass as a loose quality report without proving the core male-channel webnovel contract: pressure appears early, the protagonist pursues a concrete goal, resistance forces a turn, the chapter pays off visibly, and the tail hook creates a specific next-scene question.

Public benchmark work on Chinese webnovel generation, such as WebNovelBench, frames long-form webnovel evaluation as a multi-dimensional narrative quality problem rather than a single fluency score. Longgu needs the same discipline in its chapter gate: the audit result should expose the page-turning mechanics directly enough for revision and experimentation.

## What Changes

- Add a structured `contract` section to chapter audit JSON.
- Ask model-backed audit to fill the chapter contract using six concrete fields: start hook, protagonist goal, obstacle, turn, payoff, and tail hook.
- Normalize older/provided raw audits that do not include `contract` by writing an explicit incomplete contract with missing fields, preserving compatibility.
- Show the contract verdict and fields in audit Markdown.
- Show contract status in the CLI audit summary.

## Impact

- Capability affected: `chapter-audit`.
- Code affected: audit schemas, normalization, prompt, Markdown projection, CLI output, tests.
- Data compatibility: existing raw audits without `contract` remain valid input and produce a normalized `contract.status = "incomplete"` result.
