## MODIFIED Requirements

### Requirement: Experiment comparison
The system SHALL aggregate variant metadata, scores, audit data, chapter contract evidence, and costs into comparison reports.

#### Scenario: Compare variants with contract evidence
- **WHEN** a variant metadata file links a chapter audit JSON that contains `contract`
- **THEN** `longgu experiment compare` includes `auditContractStatus`, `auditContractMissingCount`, and `auditContractDiagnosis` for that variant in `compare.json`
- **AND** `compare.md` includes the contract status and missing count

### Requirement: Comparison sorting
The system SHALL support deterministic sorting for experiment comparison reports, including contract-aware ranking.

#### Scenario: Sort by contract
- **WHEN** a user runs `longgu experiment compare --id opening-ab --sort contract`
- **THEN** variants with complete chapter contracts appear before variants with incomplete or missing chapter contracts
- **AND** variants with fewer missing contract fields appear before variants with more missing contract fields
- **AND** ties are deterministic
