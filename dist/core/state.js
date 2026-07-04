import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { requireProviderBackedConfig } from "./config.js";
import { runRoutedTextGeneration } from "./modelExecution.js";
import { parseProviderJsonObject } from "./providerJson.js";
import { pathExists } from "./workspace.js";
const schemaVersion = z.literal("longgu.story-state.v0.3");
const stateDeltaSchemaVersion = z.literal("longgu.state-delta.v0.3");
const retryErrorExcerptLimit = 1000;
const retryOutputExcerptLimit = 1200;
const datedLedger = {
    schemaVersion,
    updatedAt: z.string().datetime()
};
const FactSchema = z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    sourceChapterId: z.string().optional()
});
const CharacterSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    aliases: z.array(z.string()),
    status: z.string(),
    location: z.string(),
    goals: z.array(z.string()),
    relationships: z.array(z.object({
        targetId: z.string().min(1),
        relation: z.string().min(1)
    }))
});
const TimelineEventSchema = z.object({
    id: z.string().min(1),
    chapterId: z.string().min(1),
    order: z.number().int().nonnegative(),
    summary: z.string().min(1)
});
const HookSchema = z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    status: z.enum(["opened", "mentioned", "delayed", "resolved"]),
    openedInChapterId: z.string().optional(),
    resolvedInChapterId: z.string().optional(),
    sourceAnchor: z.string().optional()
});
const ReaderPromiseSchema = z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    status: z.enum(["active", "paid-off", "broken"]),
    sourceChapterId: z.string().optional()
});
const ResourceSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    ownerCharacterId: z.string().optional(),
    quantity: z.string(),
    state: z.string()
});
export const TruthLedgerSchema = z.object({
    ...datedLedger,
    ledger: z.literal("truth"),
    facts: z.array(FactSchema)
});
export const CharactersLedgerSchema = z.object({
    ...datedLedger,
    ledger: z.literal("characters"),
    characters: z.array(CharacterSchema)
});
export const TimelineLedgerSchema = z.object({
    ...datedLedger,
    ledger: z.literal("timeline"),
    events: z.array(TimelineEventSchema)
});
export const HooksLedgerSchema = z.object({
    ...datedLedger,
    ledger: z.literal("hooks"),
    hooks: z.array(HookSchema)
});
export const ReaderPromisesLedgerSchema = z.object({
    ...datedLedger,
    ledger: z.literal("reader-promises"),
    promises: z.array(ReaderPromiseSchema)
});
export const ResourcesLedgerSchema = z.object({
    ...datedLedger,
    ledger: z.literal("resources"),
    resources: z.array(ResourceSchema)
});
export const StateDeltaSchema = z
    .object({
    schemaVersion: stateDeltaSchemaVersion,
    chapterId: z.string().min(1),
    facts: z.array(FactSchema).default([]),
    characters: z.array(CharacterSchema).default([]),
    timelineEvents: z.array(TimelineEventSchema).default([]),
    hooks: z.array(HookSchema).default([]),
    readerPromises: z.array(ReaderPromiseSchema).default([]),
    resources: z.array(ResourceSchema).default([])
})
    .superRefine((delta, ctx) => {
    rejectDuplicateIds(delta.facts, "facts", ctx);
    rejectDuplicateIds(delta.characters, "characters", ctx);
    rejectDuplicateIds(delta.timelineEvents, "timelineEvents", ctx);
    rejectDuplicateIds(delta.hooks, "hooks", ctx);
    rejectDuplicateIds(delta.readerPromises, "readerPromises", ctx);
    rejectDuplicateIds(delta.resources, "resources", ctx);
});
export const stateLedgerFiles = [
    "truth.json",
    "characters.json",
    "timeline.json",
    "hooks.json",
    "reader-promises.json",
    "resources.json"
];
export const StateCheckIssueSchema = z.object({
    id: z.string().min(1),
    severity: z.enum(["warning", "critical"]),
    ledger: z.string().min(1),
    itemId: z.string().min(1),
    reason: z.string().min(1)
});
export const StateCheckReportSchema = z.object({
    schemaVersion: z.literal("longgu.state-check.v0.3"),
    status: z.enum(["passed", "needs-review"]),
    checkedFiles: z.array(z.string().min(1)),
    issues: z.array(StateCheckIssueSchema),
    generatedAt: z.string().datetime()
});
export async function initStateLedgers(input) {
    const outputDir = path.join(input.workspaceDir, "state");
    const existing = await existingLedgerFiles(outputDir);
    if (existing.length > 0 && !input.force) {
        throw new Error(`State ledgers already exist. Re-run with --force to replace: ${existing.join(", ")}.`);
    }
    const ledgers = createBaselineLedgers(input.now ?? new Date());
    await mkdir(outputDir, { recursive: true });
    const created = [];
    const overwritten = [];
    for (const [file, ledger] of ledgers) {
        const targetPath = path.join(outputDir, file);
        const existed = await pathExists(targetPath);
        await writeFile(targetPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
        if (existed) {
            overwritten.push(path.join("state", file));
        }
        else {
            created.push(path.join("state", file));
        }
    }
    return { created, overwritten, outputDir };
}
export async function inspectState(workspaceDir) {
    const entries = [];
    for (const file of stateLedgerFiles) {
        const ledger = await loadStateLedger(workspaceDir, file);
        entries.push({
            file,
            ledger: ledger.ledger,
            count: ledgerItemCount(ledger),
            updatedAt: ledger.updatedAt
        });
    }
    return entries;
}
export async function checkState(input) {
    const ledgers = await loadAllStateLedgers(input.workspaceDir);
    const issues = collectStateCheckIssues(ledgers, {
        chapterId: input.chapterId,
        promiseMaxAge: input.promiseMaxAge ?? 5
    });
    const generatedAt = input.now ?? new Date();
    const report = StateCheckReportSchema.parse({
        schemaVersion: "longgu.state-check.v0.3",
        status: issues.length > 0 ? "needs-review" : "passed",
        checkedFiles: stateLedgerFiles.map((file) => path.join("state", file)),
        issues,
        generatedAt: generatedAt.toISOString()
    });
    const outputDir = path.join(input.workspaceDir, "state", "checks");
    const stamp = generatedAt.toISOString().replace(/[:.]/g, "-");
    const jsonPath = path.join(outputDir, `${stamp}.json`);
    const markdownPath = path.join(outputDir, `${stamp}.md`);
    await mkdir(outputDir, { recursive: true });
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeFile(markdownPath, renderStateCheckMarkdown(report), "utf8");
    return { report, jsonPath, markdownPath };
}
export async function loadStateLedger(workspaceDir, file) {
    const raw = await readFile(path.join(workspaceDir, "state", file), "utf8");
    const parsed = JSON.parse(raw);
    switch (file) {
        case "truth.json":
            return TruthLedgerSchema.parse(parsed);
        case "characters.json":
            return CharactersLedgerSchema.parse(parsed);
        case "timeline.json":
            return TimelineLedgerSchema.parse(parsed);
        case "hooks.json":
            return HooksLedgerSchema.parse(parsed);
        case "reader-promises.json":
            return ReaderPromisesLedgerSchema.parse(parsed);
        case "resources.json":
            return ResourcesLedgerSchema.parse(parsed);
    }
}
export async function loadStateDelta(deltaPath) {
    const raw = await readFile(deltaPath, "utf8");
    return StateDeltaSchema.parse(JSON.parse(raw));
}
export async function settleChapterState(input) {
    const chapterPath = path.join(input.workspaceDir, "chapters", `${input.chapterId}.md`);
    if (!(await pathExists(chapterPath))) {
        throw new Error(`Chapter body is required before settlement: chapters/${input.chapterId}.md`);
    }
    const before = await loadAllStateLedgers(input.workspaceDir);
    const chapterText = await readFile(chapterPath, "utf8");
    const deltaInput = await resolveSettlementDelta({
        workspaceDir: input.workspaceDir,
        chapterId: input.chapterId,
        chapterText,
        ledgers: before,
        deltaPath: input.deltaPath,
        config: input.deltaPath ? undefined : requireProviderBackedConfig(input.config),
        apiKey: input.apiKey,
        readApiKey: input.readApiKey,
        generate: input.generate
    });
    const delta = deltaInput.delta;
    assertDeltaAppliesToState({ chapterId: input.chapterId, ledgers: before, delta });
    const settledAt = input.now ?? new Date();
    const { after, diff } = mergeStateDelta(before, delta, settledAt);
    const settlementDir = path.join(input.workspaceDir, "state", "settlements", `${input.chapterId}-${settledAt.toISOString().replace(/[:.]/g, "-")}`);
    const metadata = {
        schemaVersion: "longgu.state-settlement.v0.3",
        chapterId: input.chapterId,
        settledAt: settledAt.toISOString(),
        deltaSource: deltaInput.source,
        deltaFile: deltaInput.deltaPath ? path.relative(input.workspaceDir, deltaInput.deltaPath) : undefined,
        provider: deltaInput.config?.provider.name,
        model: deltaInput.config?.provider.model,
        settlementDir: path.relative(input.workspaceDir, settlementDir)
    };
    await writeAllStateLedgers(input.workspaceDir, after);
    await writeGuidedStateFiles(input.workspaceDir, after, input.chapterId);
    await writeSettlementRecord({
        settlementDir,
        delta,
        before,
        after,
        diff,
        metadata,
        prompt: deltaInput.prompt,
        modelOutput: deltaInput.modelOutput,
        modelAttempts: deltaInput.modelAttempts
    });
    return { settlementDir, diff, metadata };
}
export async function settleChapterStateBatch(input) {
    const chapterIds = await resolveBatchSettlementChapterIds(input);
    const results = [];
    for (const chapterId of chapterIds) {
        const deltaPath = input.deltaDir ? path.join(input.deltaDir, `${chapterId}.delta.json`) : undefined;
        results.push(await settleChapterState({
            workspaceDir: input.workspaceDir,
            chapterId,
            deltaPath,
            config: input.config,
            apiKey: input.apiKey,
            readApiKey: input.readApiKey,
            generate: input.generate,
            now: input.now
        }));
    }
    return { chapterIds, results };
}
function createBaselineLedgers(now) {
    const updatedAt = now.toISOString();
    return [
        ["truth.json", TruthLedgerSchema.parse({ schemaVersion: "longgu.story-state.v0.3", ledger: "truth", facts: [], updatedAt })],
        [
            "characters.json",
            CharactersLedgerSchema.parse({
                schemaVersion: "longgu.story-state.v0.3",
                ledger: "characters",
                characters: [],
                updatedAt
            })
        ],
        [
            "timeline.json",
            TimelineLedgerSchema.parse({
                schemaVersion: "longgu.story-state.v0.3",
                ledger: "timeline",
                events: [],
                updatedAt
            })
        ],
        ["hooks.json", HooksLedgerSchema.parse({ schemaVersion: "longgu.story-state.v0.3", ledger: "hooks", hooks: [], updatedAt })],
        [
            "reader-promises.json",
            ReaderPromisesLedgerSchema.parse({
                schemaVersion: "longgu.story-state.v0.3",
                ledger: "reader-promises",
                promises: [],
                updatedAt
            })
        ],
        [
            "resources.json",
            ResourcesLedgerSchema.parse({
                schemaVersion: "longgu.story-state.v0.3",
                ledger: "resources",
                resources: [],
                updatedAt
            })
        ]
    ];
}
function rejectDuplicateIds(items, field, ctx) {
    const seen = new Set();
    for (const [index, item] of items.entries()) {
        if (seen.has(item.id)) {
            ctx.addIssue({
                code: "custom",
                path: [field, index, "id"],
                message: `Duplicate id in ${field}: ${item.id}`
            });
        }
        seen.add(item.id);
    }
}
async function loadAllStateLedgers(workspaceDir) {
    return {
        "truth.json": await loadStateLedger(workspaceDir, "truth.json"),
        "characters.json": await loadStateLedger(workspaceDir, "characters.json"),
        "timeline.json": await loadStateLedger(workspaceDir, "timeline.json"),
        "hooks.json": await loadStateLedger(workspaceDir, "hooks.json"),
        "reader-promises.json": await loadStateLedger(workspaceDir, "reader-promises.json"),
        "resources.json": await loadStateLedger(workspaceDir, "resources.json")
    };
}
async function resolveSettlementDelta(input) {
    if (input.deltaPath) {
        const deltaPath = path.isAbsolute(input.deltaPath) ? input.deltaPath : path.join(input.workspaceDir, input.deltaPath);
        return { source: "file", delta: await loadStateDelta(deltaPath), deltaPath };
    }
    if (!input.config || (!input.apiKey && !input.readApiKey) || !input.generate) {
        throw new Error("State delta extraction requires provider config and API key when --delta is not provided.");
    }
    const providerConfig = requireProviderBackedConfig(input.config);
    let prompt = renderStateDeltaPrompt({
        chapterId: input.chapterId,
        chapterText: input.chapterText,
        ledgers: input.ledgers
    });
    const attempts = [];
    let lastError = "";
    for (let attempt = 1; attempt <= 2; attempt += 1) {
        const result = await runRoutedTextGeneration({
            workspaceDir: input.workspaceDir,
            task: "settle",
            subjectId: input.chapterId,
            config: providerConfig,
            prompt,
            context: [{ file: `chapters/${input.chapterId}.md`, content: input.chapterText }],
            apiKey: input.apiKey,
            readApiKey: input.readApiKey,
            generate: input.generate
        });
        try {
            const delta = parseStateDeltaFromText(result.text);
            assertDeltaAppliesToState({ chapterId: input.chapterId, ledgers: input.ledgers, delta });
            attempts.push({ attempt, prompt, runDir: result.runDir, output: result.text, accepted: true });
            return {
                source: "model",
                delta,
                config: providerConfig,
                prompt,
                modelOutput: result.text,
                modelAttempts: attempts
            };
        }
        catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            attempts.push({ attempt, prompt, runDir: result.runDir, output: result.text, error: lastError, accepted: false });
            prompt = renderStateDeltaRetryPrompt({
                chapterId: input.chapterId,
                chapterText: input.chapterText,
                ledgers: input.ledgers,
                previousOutput: result.text,
                error: lastError
            });
        }
    }
    throw new Error(`State delta extraction failed after retry: ${lastError}`);
}
function renderStateDeltaPrompt(input) {
    return `你是龙骨 Longgu 的长篇网文状态沉淀器。请阅读章节正文和当前状态账本，只输出一个 JSON 对象，不要输出 Markdown，不要解释。

JSON 必须符合：
- schemaVersion 固定为 "longgu.state-delta.v0.3"
- chapterId 固定为 "${input.chapterId}"
- 可包含 facts, characters, timelineEvents, hooks, readerPromises, resources 六个数组
- hooks 表示伏笔；重要伏笔必须尽量填写 sourceAnchor，保存正文中的短原文锚点
- 不确定的变化不要写入
- 不要整份重写账本，只输出本章新增或变化的条目
- 复用已有 id；新增条目使用稳定、可读的 id

当前状态账本：

${JSON.stringify(input.ledgers, null, 2)}

章节正文 chapters/${input.chapterId}.md：

${input.chapterText}

只输出 JSON：`;
}
function renderStateDeltaRetryPrompt(input) {
    const errorExcerpt = truncateForRetryPrompt(input.error, retryErrorExcerptLimit);
    const outputExcerpt = truncateForRetryPrompt(input.previousOutput, retryOutputExcerptLimit);
    return `${renderStateDeltaPrompt({
        chapterId: input.chapterId,
        chapterText: input.chapterText,
        ledgers: input.ledgers
    })}

上一次输出被拒绝，原因片段：
${errorExcerpt}

上一次输出片段：
${outputExcerpt}

请重新输出一个修正后的 JSON 对象。不要复述上一次输出，不要输出 Markdown，不要解释。
目标 JSON 形状示例：
{
  "schemaVersion": "longgu.state-delta.v0.3",
  "chapterId": "${input.chapterId}",
  "facts": [],
  "characters": [],
  "timelineEvents": [],
  "hooks": [],
  "readerPromises": [],
  "resources": []
}

只输出 JSON：`;
}
function truncateForRetryPrompt(value, limit) {
    const normalized = value.trim();
    if (normalized.length <= limit) {
        return normalized;
    }
    return `${normalized.slice(0, limit)}\n...[truncated ${normalized.length - limit} chars]`;
}
function parseStateDeltaFromText(text) {
    return StateDeltaSchema.parse(parseProviderJsonObject(text, "State delta extraction failed: provider response did not contain a JSON object."));
}
async function writeAllStateLedgers(workspaceDir, ledgers) {
    for (const file of stateLedgerFiles) {
        await writeFile(path.join(workspaceDir, "state", file), `${JSON.stringify(ledgers[file], null, 2)}\n`, "utf8");
    }
}
async function writeGuidedStateFiles(workspaceDir, ledgers, chapterId) {
    const outputDir = path.join(workspaceDir, "05_前情与状态");
    const foreshadowingDir = path.join(workspaceDir, "04_伏笔与期待");
    if (!(await pathExists(outputDir))) {
        return;
    }
    await mkdir(outputDir, { recursive: true });
    await mkdir(foreshadowingDir, { recursive: true });
    const characters = ledgers["characters.json"];
    const timeline = ledgers["timeline.json"];
    const hooks = ledgers["hooks.json"];
    const promises = ledgers["reader-promises.json"];
    const resources = ledgers["resources.json"];
    const facts = ledgers["truth.json"];
    await writeFile(path.join(outputDir, "角色状态.md"), renderCharactersState(characters), "utf8");
    await writeFile(path.join(outputDir, "世界状态.md"), renderWorldState(facts, resources), "utf8");
    await writeFile(path.join(outputDir, "关系状态.md"), renderRelationshipsState(characters), "utf8");
    await writeFile(path.join(outputDir, "未解决问题.md"), renderOpenQuestions(hooks, promises), "utf8");
    await writeFile(path.join(outputDir, "连续性风险.md"), renderContinuityRisks(characters, hooks, promises), "utf8");
    await writeFile(path.join(outputDir, "近期前情.md"), renderRecentTimeline(timeline, chapterId), "utf8");
    await writeFile(path.join(foreshadowingDir, "伏笔账本.md"), renderForeshadowingLedger(hooks), "utf8");
}
function renderCharactersState(ledger) {
    const rows = ledger.characters.length
        ? ledger.characters
            .map((character) => `## ${character.name}\n\n当前位置：${character.location}\n状态：${character.status}\n目标：${character.goals.join("、") || "无"}\n关系数：${character.relationships.length}\n`)
            .join("\n")
        : "暂无角色状态。\n";
    return `# 角色状态\n\n> 作者可直接修改。AI 后续必须以本文件为准。\n\n${rows}`;
}
function renderWorldState(facts, resources) {
    const factRows = facts.facts.map((fact) => `- ${fact.text}${fact.sourceChapterId ? `（${fact.sourceChapterId}）` : ""}`).join("\n") || "- 暂无事实。";
    const resourceRows = resources.resources.map((resource) => `- ${resource.name}：${resource.quantity}，${resource.state}`).join("\n") || "- 暂无资源变化。";
    return `# 世界状态\n\n> 作者可直接修改。AI 后续必须以本文件为准。\n\n## 已确认事实\n\n${factRows}\n\n## 资源状态\n\n${resourceRows}\n`;
}
function renderRelationshipsState(ledger) {
    const rows = ledger.characters.flatMap((character) => character.relationships.map((relationship) => `| ${character.name} | ${relationship.targetId} | ${relationship.relation} |`));
    return `# 关系状态\n\n> 作者可直接修改。AI 后续必须以本文件为准。\n\n| 角色A | 角色B | 当前关系 |\n| --- | --- | --- |\n${rows.length ? rows.join("\n") : "|  |  |  |"}\n`;
}
function renderOpenQuestions(hooks, promises) {
    const hookRows = hooks.hooks
        .filter((hook) => hook.status !== "resolved")
        .map((hook) => `| ${hook.id} | ${hook.text} | ${hook.openedInChapterId ?? ""} | ${hook.status} | |`);
    const promiseRows = promises.promises
        .filter((promise) => promise.status === "active")
        .map((promise) => `| ${promise.id} | ${promise.text} | ${promise.sourceChapterId ?? ""} | ${promise.status} | |`);
    return `# 未解决问题\n\n> 作者可直接修改。AI 后续必须以本文件为准。\n\n| 编号 | 问题 | 首次出现 | 当前状态 | 计划处理 |\n| --- | --- | --- | --- | --- |\n${hookRows.concat(promiseRows).join("\n") || "|  |  |  |  |  |"}\n`;
}
function renderContinuityRisks(characters, hooks, promises) {
    const activeHooks = hooks.hooks.filter((hook) => hook.status !== "resolved");
    const activePromises = promises.promises.filter((promise) => promise.status === "active");
    const unavailableCharacters = characters.characters.filter((character) => character.status && character.status !== "active");
    return `# 连续性风险\n\n> 作者可直接修改。AI 后续必须以本文件为准。\n\n## 高风险\n\n${activeHooks.map((hook) => `- 伏笔 ${hook.id}：${hook.text}（${hook.status}）`).join("\n") || "- 暂无活跃伏笔风险。"}\n\n## 读者承诺\n\n${activePromises.map((promise) => `- ${promise.id}：${promise.text}`).join("\n") || "- 暂无活跃读者承诺风险。"}\n\n## 角色状态\n\n${unavailableCharacters.map((character) => `- ${character.name} 当前状态：${character.status}`).join("\n") || "- 暂无特殊角色状态风险。"}\n`;
}
function renderRecentTimeline(timeline, chapterId) {
    const recent = [...timeline.events]
        .sort((left, right) => right.order - left.order || compareChapterIds(right.chapterId, left.chapterId))
        .slice(0, 5);
    return `# 近期前情\n\n> 作者可直接修改。AI 后续必须以本文件为准。\n\n更新时间：第${chapterId}章后\n\n## 最近发生\n\n${recent.map((event) => `- ${event.chapterId}：${event.summary}`).join("\n") || "- 暂无近期事件。"}\n\n## 下一章必须承接\n\n- 承接第${chapterId}章后的角色、世界和伏笔状态。\n\n## 不能重复\n\n- 不要把已记录事件当成新发现重复呈现。\n`;
}
function renderForeshadowingLedger(ledger) {
    const rows = ledger.hooks.map((hook) => `| ${hook.id} | ${hook.text} | ${hook.openedInChapterId ?? ""} | ${hook.sourceAnchor ?? ""} | ${hook.status} | ${hook.resolvedInChapterId ?? ""} | |`);
    return `# 伏笔账本\n\n> 作者可直接修改。AI 后续必须以本文件为准。\n\n| 编号 | 伏笔 | 首次出现 | 原文锚点 | 当前状态 | 计划回收 | 作者备注 |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows.join("\n") || "| F001 |  |  |  | 未埋 |  |  |"}\n`;
}
function detectStateConflicts(ledgers, delta) {
    const conflicts = [];
    const truth = ledgers["truth.json"];
    const timeline = ledgers["timeline.json"];
    const hooks = ledgers["hooks.json"];
    const promises = ledgers["reader-promises.json"];
    for (const fact of delta.facts) {
        const existing = truth.facts.find((item) => item.id === fact.id);
        if (existing && existing.text !== fact.text) {
            conflicts.push(`fact ${fact.id} text is immutable`);
        }
    }
    for (const event of delta.timelineEvents) {
        const existing = timeline.events.find((item) => item.id === event.id);
        if (existing && existing.chapterId !== event.chapterId) {
            conflicts.push(`timeline event ${event.id} cannot move from chapter ${existing.chapterId} to ${event.chapterId}`);
        }
    }
    for (const hook of delta.hooks) {
        const existing = hooks.hooks.find((item) => item.id === hook.id);
        if (existing?.status === "resolved" && hook.status !== "resolved") {
            conflicts.push(`hook ${hook.id} cannot regress from resolved to ${hook.status}`);
        }
    }
    for (const promise of delta.readerPromises) {
        const existing = promises.promises.find((item) => item.id === promise.id);
        if ((existing?.status === "paid-off" || existing?.status === "broken") && promise.status === "active") {
            conflicts.push(`reader promise ${promise.id} cannot regress from ${existing.status} to active`);
        }
    }
    return conflicts;
}
function collectStateCheckIssues(ledgers, options) {
    const issues = [];
    const facts = ledgers["truth.json"].facts;
    const characters = ledgers["characters.json"].characters;
    const timelineEvents = ledgers["timeline.json"].events;
    const resources = ledgers["resources.json"].resources;
    const promises = ledgers["reader-promises.json"].promises;
    const characterIds = new Set(characters.map((character) => character.id));
    for (const character of characters) {
        for (const relation of character.relationships) {
            if (!characterIds.has(relation.targetId)) {
                issues.push(StateCheckIssueSchema.parse({
                    id: `characters-${character.id}-missing-relation-${relation.targetId}`,
                    severity: "warning",
                    ledger: "characters",
                    itemId: character.id,
                    reason: `relationship targetId ${relation.targetId} does not exist in characters ledger`
                }));
            }
        }
    }
    for (const resource of resources) {
        if (resource.ownerCharacterId && !characterIds.has(resource.ownerCharacterId)) {
            issues.push(StateCheckIssueSchema.parse({
                id: `resources-${resource.id}-missing-owner-${resource.ownerCharacterId}`,
                severity: "warning",
                ledger: "resources",
                itemId: resource.id,
                reason: `ownerCharacterId ${resource.ownerCharacterId} does not exist in characters ledger`
            }));
        }
    }
    issues.push(...detectCharacterRoleDrift({ characters, facts, timelineEvents }));
    issues.push(...detectTimelineDrift(timelineEvents));
    const currentChapterNumber = options.chapterId ? parseChapterNumber(options.chapterId) : undefined;
    if (currentChapterNumber !== undefined) {
        for (const promise of promises) {
            if (promise.status !== "active" || !promise.sourceChapterId) {
                continue;
            }
            const sourceChapterNumber = parseChapterNumber(promise.sourceChapterId);
            if (sourceChapterNumber === undefined) {
                continue;
            }
            const age = currentChapterNumber - sourceChapterNumber;
            if (age > options.promiseMaxAge) {
                issues.push(StateCheckIssueSchema.parse({
                    id: `reader-promises-${promise.id}-overdue`,
                    severity: "warning",
                    ledger: "reader-promises",
                    itemId: promise.id,
                    reason: `active reader promise from chapter ${promise.sourceChapterId} is ${age} chapter(s) old; max allowed age is ${options.promiseMaxAge}`
                }));
            }
        }
    }
    return issues.sort((left, right) => left.id.localeCompare(right.id));
}
function detectCharacterRoleDrift(input) {
    const roleGroups = [
        { id: "county-magistrate", label: "知县/县令", terms: ["知县", "县令", "一县之长"] },
        { id: "clan-chief", label: "族长/宗族话事人", terms: ["族长", "宗族话事人", "话事人"] },
        { id: "county-deputy", label: "县丞/县丞衔", terms: ["县丞", "县丞衔"] },
        { id: "merchant", label: "商人/铺户", terms: ["商人", "富商", "米铺", "当铺"] }
    ];
    const issues = [];
    for (const character of input.characters) {
        const names = [character.name, ...character.aliases].filter(Boolean);
        const evidence = [
            character.status,
            ...input.facts.filter((fact) => names.some((name) => fact.text.includes(name))).map((fact) => fact.text),
            ...input.timelineEvents.filter((event) => names.some((name) => event.summary.includes(name))).map((event) => event.summary)
        ].join("\n");
        const matchedGroups = roleGroups.filter((group) => group.terms.some((term) => evidence.includes(term)));
        if (matchedGroups.length > 1) {
            issues.push(StateCheckIssueSchema.parse({
                id: `characters-${character.id}-role-drift`,
                severity: "critical",
                ledger: "characters",
                itemId: character.id,
                reason: `character ${character.name} is associated with conflicting role terms: ${matchedGroups
                    .map((group) => group.label)
                    .join(", ")}`
            }));
        }
    }
    return issues;
}
function detectTimelineDrift(events) {
    const issues = [];
    const byOrder = [...events].sort((left, right) => left.order - right.order || compareChapterIds(left.chapterId, right.chapterId));
    let maxChapterNumber = -1;
    let maxChapterId = "";
    for (const event of byOrder) {
        const chapterNumber = parseChapterNumber(event.chapterId);
        if (chapterNumber === undefined) {
            continue;
        }
        if (chapterNumber < maxChapterNumber) {
            issues.push(StateCheckIssueSchema.parse({
                id: `timeline-${event.id}-order-regression`,
                severity: "critical",
                ledger: "timeline",
                itemId: event.id,
                reason: `timeline order places chapter ${event.chapterId} after later chapter ${maxChapterId}`
            }));
        }
        if (chapterNumber > maxChapterNumber) {
            maxChapterNumber = chapterNumber;
            maxChapterId = event.chapterId;
        }
    }
    for (let i = 0; i < events.length; i += 1) {
        for (let j = i + 1; j < events.length; j += 1) {
            const left = events[i];
            const right = events[j];
            if (left.chapterId === right.chapterId) {
                continue;
            }
            const similarity = textSimilarity(left.summary, right.summary);
            if (similarity >= 0.62) {
                issues.push(StateCheckIssueSchema.parse({
                    id: `timeline-${right.id}-duplicate-${left.id}`,
                    severity: "warning",
                    ledger: "timeline",
                    itemId: right.id,
                    reason: `timeline event resembles ${left.id} from chapter ${left.chapterId}; similarity ${similarity.toFixed(2)} suggests repeated scene coverage`
                }));
            }
            const earlier = compareChapterIds(left.chapterId, right.chapterId) <= 0 ? left : right;
            const later = earlier === left ? right : left;
            if (/(初次|第一次|首次|第一回)/u.test(later.summary) && textSimilarity(earlier.summary, later.summary) >= 0.35) {
                issues.push(StateCheckIssueSchema.parse({
                    id: `timeline-${later.id}-first-time-drift`,
                    severity: "warning",
                    ledger: "timeline",
                    itemId: later.id,
                    reason: `later event uses first-time wording but resembles earlier event ${earlier.id} from chapter ${earlier.chapterId}`
                }));
            }
        }
    }
    return issues;
}
function parseChapterNumber(chapterId) {
    const normalized = chapterId.trim();
    const parts = normalized.match(/\d+/g);
    if (!parts || parts.length === 0) {
        return undefined;
    }
    return parts.reduce((sum, part) => sum * 1000 + Number.parseInt(part, 10), 0);
}
function compareChapterIds(left, right) {
    const leftNumber = parseChapterNumber(left);
    const rightNumber = parseChapterNumber(right);
    if (leftNumber !== undefined && rightNumber !== undefined && leftNumber !== rightNumber) {
        return leftNumber - rightNumber;
    }
    return left.localeCompare(right);
}
function textSimilarity(left, right) {
    const leftGrams = characterBigrams(left);
    const rightGrams = characterBigrams(right);
    if (leftGrams.size === 0 || rightGrams.size === 0) {
        return 0;
    }
    let intersection = 0;
    for (const gram of leftGrams) {
        if (rightGrams.has(gram)) {
            intersection += 1;
        }
    }
    const union = new Set([...leftGrams, ...rightGrams]).size;
    return intersection / union;
}
function characterBigrams(value) {
    const normalized = value.replace(/\s+/g, "").replace(/[，。！？；：、,.!?;:"'“”‘’（）()《》]/gu, "");
    const grams = new Set();
    for (let index = 0; index < normalized.length - 1; index += 1) {
        grams.add(normalized.slice(index, index + 2));
    }
    return grams;
}
async function resolveBatchSettlementChapterIds(input) {
    if (input.volume && (input.from || input.to)) {
        throw new Error("--volume cannot be combined with --from/--to for batch settlement.");
    }
    const chaptersDir = path.join(input.workspaceDir, "chapters");
    const files = (await readdir(chaptersDir).catch(() => []))
        .filter((entry) => entry.endsWith(".md"))
        .map((entry) => entry.slice(0, -".md".length));
    let chapterIds;
    if (input.volume) {
        chapterIds = files.filter((id) => id === input.volume || id.startsWith(`${input.volume}-`));
    }
    else if (input.from && input.to) {
        chapterIds = files.filter((id) => compareChapterIds(id, input.from) >= 0 && compareChapterIds(id, input.to) <= 0);
    }
    else {
        throw new Error("Batch settlement requires either --volume or both --from and --to.");
    }
    chapterIds.sort(compareChapterIds);
    if (chapterIds.length === 0) {
        throw new Error("No chapter files matched the batch settlement selector.");
    }
    return chapterIds;
}
function renderStateCheckMarkdown(report) {
    const issues = report.issues.length
        ? report.issues
            .map((issue) => `- [${issue.severity}] ${issue.ledger}/${issue.itemId}: ${issue.reason}`)
            .join("\n")
        : "- No issues.";
    return `# State Check

- Status: ${report.status}
- Generated at: ${report.generatedAt}
- Checked files: ${report.checkedFiles.join(", ")}

## Issues

${issues}
`;
}
function assertDeltaAppliesToState(input) {
    if (input.delta.chapterId !== input.chapterId) {
        throw new Error(`State delta chapterId mismatch: expected ${input.chapterId}, received ${input.delta.chapterId}.`);
    }
    const conflicts = detectStateConflicts(input.ledgers, input.delta);
    if (conflicts.length > 0) {
        throw new Error(`State settlement conflict: ${conflicts.join("; ")}`);
    }
}
function mergeStateDelta(ledgers, delta, now) {
    const updatedAt = now.toISOString();
    const truth = ledgers["truth.json"];
    const characters = ledgers["characters.json"];
    const timeline = ledgers["timeline.json"];
    const hooks = ledgers["hooks.json"];
    const promises = ledgers["reader-promises.json"];
    const resources = ledgers["resources.json"];
    const factMerge = mergeById(truth.facts, delta.facts);
    const characterMerge = mergeById(characters.characters, delta.characters);
    const timelineMerge = mergeById(timeline.events, delta.timelineEvents);
    const hookMerge = mergeById(hooks.hooks, delta.hooks);
    const promiseMerge = mergeById(promises.promises, delta.readerPromises);
    const resourceMerge = mergeById(resources.resources, delta.resources);
    const after = {
        "truth.json": TruthLedgerSchema.parse({ ...truth, facts: factMerge.items, updatedAt }),
        "characters.json": CharactersLedgerSchema.parse({ ...characters, characters: characterMerge.items, updatedAt }),
        "timeline.json": TimelineLedgerSchema.parse({ ...timeline, events: timelineMerge.items, updatedAt }),
        "hooks.json": HooksLedgerSchema.parse({ ...hooks, hooks: hookMerge.items, updatedAt }),
        "reader-promises.json": ReaderPromisesLedgerSchema.parse({ ...promises, promises: promiseMerge.items, updatedAt }),
        "resources.json": ResourcesLedgerSchema.parse({ ...resources, resources: resourceMerge.items, updatedAt })
    };
    return {
        after,
        diff: [
            { ledger: "truth", ...factMerge.diff },
            { ledger: "characters", ...characterMerge.diff },
            { ledger: "timeline", ...timelineMerge.diff },
            { ledger: "hooks", ...hookMerge.diff },
            { ledger: "reader-promises", ...promiseMerge.diff },
            { ledger: "resources", ...resourceMerge.diff }
        ]
    };
}
function mergeById(existingItems, incomingItems) {
    const items = [...existingItems];
    const added = [];
    const updated = [];
    const unchanged = [];
    for (const incoming of incomingItems) {
        const existingIndex = items.findIndex((item) => item.id === incoming.id);
        if (existingIndex === -1) {
            items.push(incoming);
            added.push(incoming.id);
            continue;
        }
        if (stableJson(items[existingIndex]) === stableJson(incoming)) {
            unchanged.push(incoming.id);
            continue;
        }
        items[existingIndex] = incoming;
        updated.push(incoming.id);
    }
    return { items, diff: { added, updated, unchanged } };
}
async function writeSettlementRecord(input) {
    await mkdir(input.settlementDir, { recursive: true });
    await writeFile(path.join(input.settlementDir, "delta.json"), `${JSON.stringify(input.delta, null, 2)}\n`, "utf8");
    await writeFile(path.join(input.settlementDir, "before.json"), `${JSON.stringify(input.before, null, 2)}\n`, "utf8");
    await writeFile(path.join(input.settlementDir, "after.json"), `${JSON.stringify(input.after, null, 2)}\n`, "utf8");
    await writeFile(path.join(input.settlementDir, "diff.json"), `${JSON.stringify(input.diff, null, 2)}\n`, "utf8");
    await writeFile(path.join(input.settlementDir, "metadata.json"), `${JSON.stringify(input.metadata, null, 2)}\n`, "utf8");
    if (input.prompt !== undefined) {
        await writeFile(path.join(input.settlementDir, "prompt.md"), input.prompt, "utf8");
    }
    if (input.modelOutput !== undefined) {
        await writeFile(path.join(input.settlementDir, "model-output.txt"), input.modelOutput, "utf8");
    }
    if (input.modelAttempts !== undefined) {
        await writeFile(path.join(input.settlementDir, "model-attempts.json"), `${JSON.stringify(input.modelAttempts, null, 2)}\n`, "utf8");
    }
}
function ledgerItemCount(ledger) {
    switch (ledger.ledger) {
        case "truth":
            return ledger.facts.length;
        case "characters":
            return ledger.characters.length;
        case "timeline":
            return ledger.events.length;
        case "hooks":
            return ledger.hooks.length;
        case "reader-promises":
            return ledger.promises.length;
        case "resources":
            return ledger.resources.length;
    }
}
function stableJson(value) {
    return JSON.stringify(value);
}
async function existingLedgerFiles(outputDir) {
    const existing = [];
    for (const file of stateLedgerFiles) {
        if (await pathExists(path.join(outputDir, file))) {
            existing.push(path.join("state", file));
        }
    }
    return existing;
}
