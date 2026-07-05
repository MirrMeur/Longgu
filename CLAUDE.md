# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common commands

```bash
npm ci                         # install dependencies
npm run build                  # typecheck and emit dist/, then chmod CLI entry
npm run typecheck              # TypeScript check without emit
npm test                       # run all Vitest tests
npm test -- src/core/workspace.test.ts
npx vitest run src/core/workspace.test.ts -t "initWorkspace"
npm run verify                 # typecheck, build, tests, openspec validate --all
npm run dev:cli -- init tmp-novel
npm run cli -- --help          # run built CLI after npm run build
openspec validate --all
```

No lint script exists in `package.json`.

## Product direction

Longgu is a Claude Code-first Chinese webnovel workflow starter. The primary path is:

1. `longgu init <项目名>` generates a Chinese novel project skeleton.
2. User opens that generated project in Claude Code.
3. Claude reads `当前步骤.md`, `创作流程.md`, and `项目说明.md`.
4. Work proceeds through generated Longgu skills: `longgu-start`, `longgu-plan`, `longgu-write`, `longgu-review`, `longgu-state`, `longgu-help`.

Do not reposition Longgu as a generic LLM provider shell. Provider-backed commands still exist, but README describes them as advanced/legacy path, not main entry.

## Architecture

- `src/cli/index.ts` is the Commander CLI entry. It defines `longgu init`, `doctor`, and command groups for `write`, `model`, `feedback`, `experiment`, `plan`, `context`, `run`, `summarize`, `state`, `audit`, and `revise`. CLI handlers should stay thin: resolve workspace paths, validate options, call core functions, print concise next steps.
- `src/core/workspace.ts` owns workspace shape. `initWorkspace()` creates only guided Chinese workflow files and `.claude/skills/*/SKILL.md`. Existing files are preserved, not overwritten.
- Generated guided workflow files use Chinese visible assets: root files `当前步骤.md`, `创作流程.md`, `已确认决定.md`, `项目说明.md`, directories `01_立项设定/` through `08_AI审稿/`, and one `_说明.md` per directory. Author-edited Markdown has highest priority.
- `src/core/guidedWorkflow.ts` supports the Claude Code-first flow: load current step context from referenced Markdown files, update `当前步骤.md`, append approvals to `已确认决定.md`, and analyze which downstream artifacts author edits affect.
- `src/core/config.ts` parses `longgu.yaml` with Zod. `provider` is optional for Claude Code-first work; provider-backed commands call `requireProviderBackedConfig()` or `requireProviderConfig()`.
- `src/adapters/openaiCompatible.ts` is the only provider adapter currently present. It calls `/chat/completions`, handles connectivity checks, and adjusts max tokens for likely reasoning models.
- `src/core/generation.ts`, `audit.ts`, `revision.ts`, `summary.ts`, `state.ts`, `context.ts`, `bookPlan.ts`, `experiments.ts`, `modelRouting.ts`, `feedback.ts`, `pacing.ts`, and `runs.ts` implement reusable workflow logic. Prefer adding behavior there instead of embedding business logic in CLI handlers.
- Generated novel assets live in Chinese guided workspace directories, not repository source.

## Testing and layout

- TypeScript uses ESM with `module`/`moduleResolution` set to `NodeNext`; emitted JavaScript goes to `dist/`.
- Tests are colocated beside source as `*.test.ts` under `src/`, using Vitest.
- Test helpers live in `src/test/testUtils.ts`.
- `tsconfig.json` includes only `src/**/*.ts` and excludes `dist` and `node_modules`.

## OpenSpec and docs

- `npm run verify` includes `openspec validate --all`; run it before considering broad changes complete.
- README product wording and command examples are authoritative for public positioning.
- Detailed Claude Code-first usage notes are in `openspec/changes/add-claude-code-usage-docs/usage-guide.md`.
