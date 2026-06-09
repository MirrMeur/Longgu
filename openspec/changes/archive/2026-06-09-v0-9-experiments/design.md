# Design

## Directory Layout

```text
experiments/
  opening-ab/
    manifest.json
    variants/
      hook-a/
        output.md
        metadata.json
        scores.json
      hook-b/
        output.md
        metadata.json
    compare.json
    compare.md
```

## CLI Shape

```text
longgu experiment create --id opening-ab --goal "测试开篇钩子"
longgu experiment run --id opening-ab --variant hook-a --input drafts/hook-a.md --model fast
longgu experiment score --id opening-ab --variant hook-a --payoff 8 --hook 9 --ai-flavor 2 --note "钩子更强"
longgu experiment compare --id opening-ab --sort hook
```

`experiment run` in V0.9 registers local candidate files. It copies the input Markdown into the variant folder and writes metadata. This gives the batch evaluation structure before model-powered batch generation is added.

## Schemas

`manifest.json`:

- `schemaVersion: longgu.experiment.v0.9`
- `id`
- `goal`
- `createdAt`
- `variants`

Variant metadata:

- `schemaVersion: longgu.experiment-variant.v0.9`
- `experimentId`
- `variantId`
- `modelProfile`
- `sourceInput`
- `outputFile`
- `registeredAt`
- optional `runId`, `auditFile`, `estimatedCost`

Scores:

- `schemaVersion: longgu.experiment-score.v0.9`
- `payoff`
- `hook`
- `aiFlavor`
- `settingConflict`
- `note`
- `scoredAt`

## Comparison

The compare report merges:

- variant metadata
- human scores
- audit scores/issues when `auditFile` exists
- run cost when `runId` exists

Sort keys: `payoff`, `hook`, `ai-flavor`, `setting-conflict`, `cost`.
