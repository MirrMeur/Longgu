import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
import { ChapterFeedbackFileSchema, loadChapterFeedback, recordChapterFeedback } from "./feedback.js";

describe("chapter feedback", () => {
  it("records and appends chapter feedback", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-feedback-"));
    await createFixtureWorkspace(dir);

    const first = await recordChapterFeedback({
      workspaceDir: dir,
      chapterId: "001",
      score: 6,
      comment: "情节推进太慢",
      now: new Date("2026-06-09T10:00:00.000Z")
    });
    const second = await recordChapterFeedback({
      workspaceDir: dir,
      chapterId: "001",
      score: 8,
      comment: "修订后节奏更好",
      now: new Date("2026-06-09T11:00:00.000Z")
    });

    expect(first.outputPath).toBe(path.join(dir, "feedback", "001.feedback.json"));
    expect(second.feedback.entries).toHaveLength(2);
    const saved = ChapterFeedbackFileSchema.parse(JSON.parse(await readFile(second.outputPath, "utf8")) as unknown);
    expect(saved.entries.map((entry) => entry.comment)).toEqual(["情节推进太慢", "修订后节奏更好"]);
  });

  it("loads feedback up to the target chapter", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-feedback-load-"));
    await createFixtureWorkspace(dir);
    await recordChapterFeedback({
      workspaceDir: dir,
      chapterId: "001",
      score: 6,
      comment: "前章问题",
      now: new Date("2026-06-09T10:00:00.000Z")
    });
    await recordChapterFeedback({
      workspaceDir: dir,
      chapterId: "003",
      score: 5,
      comment: "未来章节不应进入第二章上下文",
      now: new Date("2026-06-09T11:00:00.000Z")
    });

    const feedback = await loadChapterFeedback(dir, "002");

    expect(feedback.map((item) => item.feedback.chapterId)).toEqual(["001"]);
  });

  it("reads only the latest five eligible feedback files", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-feedback-bounded-"));
    await createFixtureWorkspace(dir);
    for (const id of ["001", "002", "003", "004", "005", "006"]) {
      await recordChapterFeedback({
        workspaceDir: dir,
        chapterId: id,
        score: 7,
        comment: `反馈 ${id}`,
        now: new Date("2026-06-09T10:00:00.000Z")
      });
    }
    await writeFile(path.join(dir, "feedback", "001.feedback.json"), "{ malformed", "utf8");

    const feedback = await loadChapterFeedback(dir, "006");

    expect(feedback.map((item) => item.feedback.chapterId)).toEqual(["002", "003", "004", "005", "006"]);
  });
});
