import { z } from "zod";
import type { ValidationIssue } from "../routing/types";

export const WebviewCommandSchema = z.enum([
  "open",
  "newFile",
  "save",
  "export",
  "validate",
  "showOutput",
]);
export type WebviewCommand = z.infer<typeof WebviewCommandSchema>;

export const WebviewToExtensionMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready") }),
  z.object({ type: z.literal("updateText"), text: z.string() }),
  z.object({
    type: z.literal("command"),
    command: WebviewCommandSchema,
    /** Optional snapshot of current routing JSON (used to avoid debounce races). */
    text: z.string().optional(),
  }),
  z.object({
    type: z.literal("log"),
    level: z.enum(["info", "warn", "error"]),
    message: z.string(),
    data: z.unknown().optional(),
  }),
]);
export type WebviewToExtensionMessage = z.infer<typeof WebviewToExtensionMessageSchema>;

const ValidationIssueSchema: z.ZodType<ValidationIssue> = z.object({
  severity: z.enum(["error", "warning", "info"]),
  path: z.string(),
  message: z.string(),
});

export const ExtensionToWebviewMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("init"),
    text: z.string(),
    fileName: z.string(),
    uri: z.string().optional(),
  }),
  z.object({
    type: z.literal("setFileInfo"),
    fileName: z.string(),
    uri: z.string().optional(),
  }),
  z.object({ type: z.literal("setText"), text: z.string() }),
  z.object({
    type: z.literal("validateResult"),
    issues: z.array(ValidationIssueSchema),
  }),
]);
export type ExtensionToWebviewMessage = z.infer<typeof ExtensionToWebviewMessageSchema>;
