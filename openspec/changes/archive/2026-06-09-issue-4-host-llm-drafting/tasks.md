## 1. OpenSpec

- [x] 1.1 Create proposal, design, spec deltas, and tasks for host-LLM drafting.

## 2. Config and Core

- [x] 2.1 Allow host-only configs without provider.
- [x] 2.2 Add a provider guard for commands that still need external model calls.
- [x] 2.3 Add host prompt export for chapter drafting.
- [x] 2.4 Add host draft import with normalized chapter output and run record.

## 3. CLI

- [x] 3.1 Add `write chapter --host-prompt`.
- [x] 3.2 Add `write chapter --input <path>`.
- [x] 3.3 Keep provider-backed `write chapter` behavior unchanged by default.

## 4. Tests

- [x] 4.1 Cover host-only config loading.
- [x] 4.2 Cover host prompt export.
- [x] 4.3 Cover host draft import and run metadata.
- [x] 4.4 Cover CLI host prompt and import commands.

## 5. Validation

- [x] 5.1 Run `openspec validate issue-4-host-llm-drafting`.
- [x] 5.2 Run focused tests.
- [x] 5.3 Run full verification.
- [x] 5.4 Archive the OpenSpec change after validation.
