## Design Notes

### Scope

This change favors small deterministic helpers over provider-backed workflows. The requested additions should work for host-LLM and review workflows without requiring API access.

### Chapter Ordering

Chapter ids are compared by natural numeric segments. For issue #33, compound ids such as `002-001` need an absolute sortable number so cross-volume promise age checks do not become negative. Longgu treats each numeric segment as a fixed-width base-1000 component, which preserves existing flat ids while making `001-010 < 002-001`.

### Host Batch Workflow

Batch export reuses the same per-chapter drafting preparation as single-chapter export so audit gates, resolved chapter ids, prompt content, and context artifacts stay aligned. The combined prompt file is a convenience artifact separated by Markdown `---`; individual prompt files are still written for traceability.

Batch import maps files by basename to chapter id and calls the same single-chapter import path. This preserves run records and word-count reporting per chapter.

### Human Brief

The brief is derived from existing context candidates and chapter plans. It avoids token budgeting fields and writes `context/<chapter>.brief.md` for humans driving host LLM workflows.

### Pacing And Diagnostics

Pacing and experiment diagnostics are rule-based, deterministic, and intentionally transparent. They calculate approximations such as dialogue density, ending hook regex matches, sentence length, payoff cues, and emotional intensity. These outputs support review; they do not claim to replace human judgement.

### Market And Payoff Constraints

Optional `market` config and `bible/payoff-recipes.md` are treated as prompt/context constraints. They do not change generation schemas or require existing workspaces to add files.
