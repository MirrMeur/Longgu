# Add V0.6 Genre Card Registry

## Why

Longgu has planning, state, audit, and revision, but its prompts still treat genre mostly as a string. V0.6 must make Longgu a Chinese commercial webnovel harness by adding internal genre cards that drive planning, audit, revision, and later context building.

## What Changes

- Add an internal genre card registry for the first V0.6 genres: `xuanhuan`, `xianxia`, `urban`, `urban-system`, `historical`, `sci-fi`, `game-system`, and `supernatural-mystery`.
- Define a structured genre card schema.
- Add `longgu genre list` and `longgu genre show <id>`.
- Add genre aliases from common Chinese names in `longgu.yaml`, such as `玄幻`, `仙侠`, `都市`, `都市系统`, `历史`, `科幻`, `游戏/系统`, and `悬疑灵异`.
- Inject matched genre card rules into chapter audit and chapter revision prompts.
- Add tests proving different genres expose different audit priorities and prompt context.

## Impact

- Capability: `genre-cards`
- Core logic: genre schema and registry
- CLI: new `genre` command group
- Prompt behavior: audit/revision receive genre-specific rules
- Out of scope: external package publishing as `@longgu/genre-cards`; V0.6 keeps the registry inside `src/core` while preserving schema boundaries for later package extraction.
