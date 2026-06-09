# Route All Model Tasks

## Why
The README marks model routing and cost as partially implemented because only drafting uses the routed execution path. Longgu needs one execution helper for all model-backed tasks so planning, audit, revision, settlement, and experiment generation use the same route, fallback, attempts, and cost behavior.

## What Changes
- Add shared routed text generation helper.
- Extend known model tasks to include `experiment`.
- Use routed execution in non-drafting model flows.

## Impact
- Capability: `model-routing-cost`
- Internal core model execution.
