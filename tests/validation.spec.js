// Unit tests for lib/validation.js; they run in Playwright's runner without a browser.
import { test, expect } from "@playwright/test";
import { validateTask } from "../lib/validation.js";

test.describe("validateTask", () => {
  test("title is required, trimmed and between 3 and 120 characters", () => {
    expect(validateTask({}).errors.title).toBeTruthy();
    expect(validateTask({ title: "ab" }).valid).toBe(false);
    expect(validateTask({ title: "   abc  " }).value.title).toBe("abc");
    expect(validateTask({ title: "  ab  " }).valid).toBe(false);
    expect(validateTask({ title: "😀😀" }).valid).toBe(false); // 2 characters, though JS length is 4
    expect(validateTask({ title: "😀😀😀" }).valid).toBe(true);
    expect(validateTask({ title: "x".repeat(120) }).valid).toBe(true);
    expect(validateTask({ title: "x".repeat(121) }).valid).toBe(false);
  });

  test("status and priority must be allowed values", () => {
    expect(validateTask({ title: "abc", status: "DONE", priority: "HIGH" }).valid).toBe(true);
    expect(validateTask({ title: "abc", status: "done" }).errors.status).toBeTruthy();
    expect(validateTask({ title: "abc", priority: "URGENT" }).errors.priority).toBeTruthy();
  });

  test("dueDate must be a real YYYY-MM-DD date or empty", () => {
    expect(validateTask({ title: "abc", dueDate: "2028-02-29" }).valid).toBe(true);
    expect(validateTask({ title: "abc", dueDate: "2026-02-30" }).errors.dueDate).toBeTruthy();
    expect(validateTask({ title: "abc", dueDate: "25.11.2026" }).errors.dueDate).toBeTruthy();
    expect(validateTask({ title: "abc", dueDate: "" }).value.dueDate).toBeNull();
    expect(validateTask({ title: "abc", dueDate: null }).value.dueDate).toBeNull();
  });

  test("assignee and description are optional text", () => {
    expect(validateTask({ title: "abc", assignee: "  " }).value.assignee).toBeNull();
    expect(validateTask({ title: "abc", assignee: 5 }).errors.assignee).toBeTruthy();
    expect(validateTask({ title: "abc", description: null }).value.description).toBe("");
  });

  test("body must be a JSON object", () => {
    expect(validateTask(null).errors.body).toBeTruthy();
    expect(validateTask([1, 2]).errors.body).toBeTruthy();
    expect(validateTask("text").errors.body).toBeTruthy();
  });

  test("partial mode checks only the fields given and needs at least one", () => {
    expect(validateTask({ status: "DONE" }, { partial: true }).valid).toBe(true);
    expect(validateTask({ title: "x" }, { partial: true }).errors.title).toBeTruthy();
    expect(validateTask({}, { partial: true }).errors.body).toBeTruthy();
  });
});
