import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "./workspace.js";
export async function loadCurrentStepContext(workspaceDir) {
    const currentStepPath = path.join(workspaceDir, "当前步骤.md");
    const workflowPath = path.join(workspaceDir, "创作流程.md");
    const currentStep = await readFile(currentStepPath, "utf8");
    const workflow = await readFile(workflowPath, "utf8");
    const requiredFiles = [];
    const missingFiles = [];
    for (const file of extractReferencedMarkdownFiles(currentStep)) {
        const filePath = path.join(workspaceDir, file);
        if (await pathExists(filePath)) {
            requiredFiles.push({ file, content: await readFile(filePath, "utf8") });
        }
        else {
            missingFiles.push(file);
        }
    }
    return { currentStep, workflow, requiredFiles, missingFiles };
}
export async function updateCurrentStep(workspaceDir, update) {
    const currentStepPath = path.join(workspaceDir, "当前步骤.md");
    await writeFile(currentStepPath, renderCurrentStep(update), "utf8");
    return { currentStepPath };
}
export async function approveCurrentStep(input) {
    const decidedAt = (input.now ?? new Date()).toISOString();
    const decisionPath = path.join(input.workspaceDir, "已确认决定.md");
    await appendFile(decisionPath, `\n## ${decidedAt}\n\n${input.decision.trim()}\n`, "utf8");
    const { currentStepPath } = await updateCurrentStep(input.workspaceDir, input.nextStep);
    return { decisionPath, currentStepPath };
}
export function analyzeAuthorEditImpact(editedFiles) {
    const affected = new Set();
    for (const file of editedFiles) {
        if (file.startsWith("01_立项设定/")) {
            addAll(affected, ["02_设定圣经", "03_大纲", "04_伏笔与期待", "06_章节规划", "08_AI审稿"]);
        }
        if (file.startsWith("02_设定圣经/")) {
            addAll(affected, ["03_大纲", "04_伏笔与期待", "05_前情与状态", "06_章节规划", "07_正文", "08_AI审稿"]);
        }
        if (file.startsWith("03_大纲/")) {
            addAll(affected, ["04_伏笔与期待", "06_章节规划", "07_正文", "08_AI审稿"]);
        }
        if (file.startsWith("04_伏笔与期待/")) {
            addAll(affected, ["05_前情与状态", "06_章节规划", "07_正文", "08_AI审稿"]);
        }
        if (file.startsWith("05_前情与状态/")) {
            addAll(affected, ["06_章节规划", "07_正文", "08_AI审稿"]);
        }
        if (file.startsWith("06_章节规划/")) {
            addAll(affected, ["07_正文", "08_AI审稿"]);
        }
        if (file.startsWith("07_正文/")) {
            addAll(affected, ["05_前情与状态", "08_AI审稿"]);
        }
    }
    return { editedFiles, affectedArtifacts: [...affected].sort() };
}
function renderCurrentStep(update) {
    return `# 当前步骤

阶段：${update.stage}
状态：${update.status}
进度：${update.progress}

## 本步骤目标

${update.goal}

## 你现在需要看

${renderList(update.requiredFiles)}

## 你可以直接改

${renderList(update.editableFiles)}

## 改这些会影响

${renderList(update.impact)}

## 如果你批准

下一步生成或更新：

${renderList(update.nextOutputs)}

## 你可以回复

${renderList(update.allowedReplies)}
`;
}
function renderList(items) {
    return items.length ? items.map((item) => `- ${item.startsWith("`") ? item : `\`${item}\``}`).join("\n") : "- 无";
}
function extractReferencedMarkdownFiles(content) {
    const matches = content.matchAll(/`([^`]+\.md)`/g);
    return [...new Set([...matches].map((match) => match[1]).filter((item) => !path.isAbsolute(item)))].sort();
}
function addAll(target, values) {
    for (const value of values) {
        target.add(value);
    }
}
