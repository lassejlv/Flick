import { $ } from "bun";

await $`rm -rf dist`;

Bun.build({
  format: "esm",
  target: "node",
  entrypoints: ["client.ts"],
  outdir: "dist",
});

// Generate the type definitions
await $`bunx tsc --declaration --outDir dist`;
