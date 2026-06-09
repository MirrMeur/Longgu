# Design

## Chapter Contract Model

The audit contract is the machine-readable version of the chapter sentence:

`Because [pressure], protagonist tries to [action], but [obstacle], so [turn], ending with [new hook].`

Longgu stores it as:

- `status`: `complete` or `incomplete`.
- `missing`: zero or more missing field ids.
- `startHook`: first pressure, danger, curiosity, contradiction, or immediate problem.
- `protagonistGoal`: what the protagonist tries to achieve in this chapter.
- `obstacle`: who or what resists the goal.
- `turn`: reversal, new information, cost, reveal, decision, or arrival.
- `payoff`: visible change delivered before the chapter ends.
- `tailHook`: concrete next-scene question.
- `diagnosis`: one sentence explaining why the contract works or fails.

## Compatibility

`RawChapterAuditSchema` accepts an optional `contract` field. If missing, normalization writes an incomplete contract with all six craft fields listed in `missing` and uses `未评估` placeholders. This avoids breaking existing `--input` workflows while making the gap visible in final artifacts.

If a provider returns a partial contract, normalization derives `missing` from empty or placeholder-like values and forces `status = "incomplete"` when any required field is absent.

## Gating

This change does not make incomplete contracts automatically `blocked`. The audit still gates on issue severity, because a provider or human input may choose to represent contract failure as `weak-payoff`, `weak-ending-hook`, `hook-omission`, or `chapter-goal-drift` warnings/critical issues. The new contract section is evidence for revision and later experiment comparison.

## Prompting

The audit prompt now instructs the model to fill `contract` and to convert missing contract parts into concrete issues. This keeps the schema useful even before downstream commands consume it.
