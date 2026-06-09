# Design

Planning remains file-first and review-first. The default command output stays deterministic so users can bootstrap without provider credentials. `--model` opts into provider planning through the `planning` route.

Model planning uses the deterministic draft as a schema seed and asks the model to return exactly one JSON object matching the target schema. Longgu parses fenced or plain JSON, validates the result with the existing zod schemas, and only writes the artifact after validation passes.

The model path writes a normal run record with task `planning`, input source files, prompt, raw model output, route attempts, token estimates, fallback count, and estimated cost. Failed model planning writes a failed run record and does not mutate existing planning artifacts.
