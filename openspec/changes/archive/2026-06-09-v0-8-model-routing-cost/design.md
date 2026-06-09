# Design

## Config Shape

V0.8 keeps the existing `provider` object as the legacy/default profile. New optional fields:

```yaml
models:
  fast:
    provider:
      name: openai-compatible
      baseUrl: https://api.example.com/v1
      model: cheap-model
      apiKeyEnv: FAST_API_KEY
      temperature: 0.7
      maxTokens: 1200
    cost:
      inputPer1K: 0.001
      outputPer1K: 0.002
  strong:
    provider:
      name: openai-compatible
      baseUrl: https://api.example.com/v1
      model: strong-model
      apiKeyEnv: STRONG_API_KEY
      temperature: 0.8
      maxTokens: 3000
    cost:
      inputPer1K: 0.01
      outputPer1K: 0.03
routes:
  drafting:
    model: fast
    fallback: strong
  audit:
    model: strong
```

If `models` is omitted, the router exposes one `default` profile from `provider`.

## Router

`resolveModelRoute(config, task, options)` returns primary and fallback profiles. V0.8 supports these tasks:

- `planning`
- `drafting`
- `audit`
- `revise`
- `settle`

`important: true` upgrades to `routes.<task>.importantModel` when configured.

## Cost Estimates

Token estimate is deterministic and local: `Math.ceil(text.length / 2)`.

Estimated cost:

```text
inputTokens / 1000 * inputPer1K + outputTokens / 1000 * outputPer1K
```

Profiles without cost config report zero cost but still report token estimates.

## Run Records

Run metadata gains:

- `task`
- `modelProfile`
- `fallbackAttempts`
- `inputTokens`
- `outputTokens`
- `estimatedCost`
- `durationMs`

Failed attempts are recorded under `attempts`.

## CLI

- `longgu model list [dir]`: lists model profiles and route aliases.
- `longgu cost report [dir]`: totals run metadata token and cost estimates.
- `longgu write chapter --id 001 --important`: asks the router to use the important drafting model when configured.
