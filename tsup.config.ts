import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["src/index.ts"],
  outDir: "dist",
  format: ["cjs", "esm"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
});
