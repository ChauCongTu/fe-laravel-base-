import { defineConfig } from "orval";

/**
 * Orval config — generate hooks + types từ OpenAPI spec.
 *
 * Flow:
 *   1. scripts/fetch-api.mjs  → fetch spec từ BE về api.json (với fallback)
 *   2. orval đọc api.json local → generate src/api/
 *
 * Chạy: yarn generate  (hoặc tự động qua prebuild)
 */

const MUTATOR = {
  path: "./src/lib/axios-instance.ts",
  name: "axiosInstance",
};

const makeOutput = (module: string) => ({
  target: `src/api/${module}/index.ts`,
  schemas: `src/api/${module}/model`,
  client: "react-query" as const,
  httpClient: "axios" as const,
  override: {
    mutator: MUTATOR,
    query: {
      useQuery: true,
      useMutation: true,
      signal: true,
    },
  },
  indexFiles: true,
});

const makeInput = (tag: string) => ({
  target: "./api.json",   // luôn đọc từ file local
  filters: { tags: [tag] },
});

export default defineConfig({
  auth:     { input: makeInput("Auth"),    output: makeOutput("auth") },
  folders:  { input: makeInput("Folder"),  output: makeOutput("folders") },
  notes:    { input: makeInput("Note"),    output: makeOutput("notes") },
  snippets: { input: makeInput("Snippet"), output: makeOutput("snippets") },
  tasks:    { input: makeInput("Task"),    output: makeOutput("tasks") },
  events:   { input: makeInput("Event"),   output: makeOutput("events")},
});
