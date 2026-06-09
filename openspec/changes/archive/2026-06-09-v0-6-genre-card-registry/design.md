# Design

## Registry Shape

Each card has:

- `id`
- `name`
- `aliases`
- `protagonistEngine`
- `payoffPatterns`
- `rhythm`
- `progression`
- `readerPitfalls`
- `endingHooks`
- `auditWeights`
- `openingTenFocus`
- `promptHints`

The schema is strict enough to validate card completeness but simple enough to remain hand-editable.

## Genre Resolution

`resolveGenreCard(genre: string)` matches:

- canonical id
- lower-case English aliases
- exact Chinese aliases

If no match is found, Longgu falls back to a generic card and records that the card is generic.

## Prompt Injection

Audit prompts include:

- reader contract / protagonist engine
- audit weights
- opening 10 chapter focus
- genre-specific pitfalls

Revision prompts include:

- prose and scene texture hints
- reader pitfalls to avoid while fixing
- genre-appropriate ending hook patterns

This converts the prior checker skill references into internal Longgu prompt assets.

## CLI

```text
longgu genre list
longgu genre show xuanhuan
```

`genre show` prints JSON so users and tests can inspect the actual card.
