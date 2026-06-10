## MODIFIED Requirements

### Requirement: Chapter generation from base inputs
The system SHALL provide `longgu write chapter --id <id>` to generate or import chapter prose, and it SHALL require a passed chapter-plan audit when a matching chapter card exists unless explicitly skipped.

#### Scenario: Export host LLM drafting prompt
- **WHEN** a user runs `longgu write chapter --id 001 --host-prompt` in a valid host-only workspace
- **THEN** the system builds a context pack for chapter `001`
- **THEN** the system renders the drafting prompt from included context-pack sections
- **THEN** the system writes the prompt to `host-prompts/001.prompt.md`
- **THEN** the system does not require provider credentials

#### Scenario: Import host LLM chapter draft
- **WHEN** a user runs `longgu write chapter --id 001 --input drafts/001.md` in a valid host-only workspace
- **THEN** the system writes the imported Markdown chapter to `chapters/001.md`
- **THEN** the system creates a run record under `runs/`
- **THEN** the run metadata marks provider, model, and model profile as host LLM values
- **THEN** the run metadata records zero estimated cost

#### Scenario: Generate first chapter
- **WHEN** a user runs `longgu write chapter --id 001` in a valid provider-backed workspace
- **THEN** the system builds a context pack for chapter `001`
- **THEN** the system renders the drafting prompt from included context-pack sections
- **THEN** the prompt includes target word count guidance
- **THEN** the system writes the generated chapter to `chapters/001.md`
- **THEN** the system creates a run record under `runs/`

#### Scenario: Retry likely truncated provider output
- **WHEN** provider chapter generation returns output that appears to stop mid-sentence
- **THEN** the system retries chapter generation once with completion guidance
- **AND** it writes the retry output only if the retry appears complete

#### Scenario: Reject repeated truncation
- **WHEN** provider chapter generation and its retry both appear truncated
- **THEN** the command fails without writing the chapter file

#### Scenario: Resolve short planned chapter id
- **WHEN** a user runs `longgu write chapter --id 001`
- **AND** the chapter plan contains exactly one chapter id ending in `-001`
- **THEN** the system drafts using that planned chapter id
- **AND** the context includes the matching chapter card
- **AND** the chapter-plan audit gate applies to that planned chapter

#### Scenario: Reject ambiguous short planned chapter id
- **WHEN** a user runs `longgu write chapter --id 001`
- **AND** multiple planned chapter ids end in `-001`
- **THEN** the system rejects the request and asks for the full planned id

#### Scenario: Reject unmatched id when chapter plans exist
- **WHEN** no planned chapter card matches the requested id
- **AND** chapter plan files exist
- **AND** the user does not pass `--skip-plan-audit` or `--force`
- **THEN** the system rejects the request instead of silently drafting without a chapter card

#### Scenario: Generate unmatched id explicitly
- **WHEN** no planned chapter card matches the requested id
- **AND** chapter plan files exist
- **AND** the user passes `--skip-plan-audit`
- **THEN** the system may draft without a chapter card

#### Scenario: Force generate unmatched id
- **WHEN** no planned chapter card matches the requested id
- **AND** chapter plan files exist
- **AND** the user passes `--force`
- **THEN** the system may draft without a chapter card

#### Scenario: Block drafting when chapter plan audit is missing
- **WHEN** a user runs `longgu write chapter --id 001-001`
- **AND** `outlines/chapters-001.draft.json` contains a card for chapter `001-001`
- **AND** `audits/chapters-001.plan-audit.json` does not exist
- **THEN** the system reports that chapter-plan audit is required and mentions the force bypass
- **AND** no chapter file is written

#### Scenario: Allow drafting after passed chapter plan audit
- **WHEN** a user runs `longgu write chapter --id 001-001`
- **AND** a matching chapter card exists
- **AND** `audits/chapters-001.plan-audit.json` has status `passed`
- **THEN** drafting may proceed

#### Scenario: Explicitly skip chapter plan audit gate
- **WHEN** a user runs `longgu write chapter --id 001-001 --skip-plan-audit`
- **AND** a matching chapter card exists
- **THEN** the system bypasses the chapter-plan audit gate

#### Scenario: Force bypass chapter plan audit gate
- **WHEN** a user runs `longgu write chapter --id 001-001 --force`
- **AND** a matching chapter card exists
- **THEN** the system bypasses the chapter-plan audit gate
