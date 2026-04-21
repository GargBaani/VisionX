import { mkdir, readFile, rm, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const htmlTemplate = (title, scriptName) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="./ui.css" />
  </head>
  <body>
    <div id="root"></div>
    <script src="./${scriptName}"></script>
  </body>
</html>
`;

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const cssInput = await readFile(path.join(root, "src/styles/ui.css"), "utf8");
const cssOutput = await postcss([
  tailwindcss({ config: path.join(root, "tailwind.config.cjs") }),
  autoprefixer
]).process(cssInput, {
  from: path.join(root, "src/styles/ui.css")
});

await writeFile(path.join(dist, "ui.css"), cssOutput.css, "utf8");

const sharedBuildConfig = {
  bundle: true,
  minify: false,
  sourcemap: false,
  legalComments: "none",
  target: ["chrome120"]
};

await Promise.all([
  build({
    ...sharedBuildConfig,
    entryPoints: [path.join(root, "src/popup/main.tsx")],
    outfile: path.join(dist, "popup.js"),
    format: "iife",
    platform: "browser",
    jsx: "automatic"
  }),
  build({
    ...sharedBuildConfig,
    entryPoints: [path.join(root, "src/report/main.tsx")],
    outfile: path.join(dist, "report.js"),
    format: "iife",
    platform: "browser",
    jsx: "automatic"
  }),
  build({
    ...sharedBuildConfig,
    entryPoints: [path.join(root, "src/background/index.ts")],
    outfile: path.join(dist, "background.js"),
    format: "iife",
    platform: "browser"
  }),
  build({
    ...sharedBuildConfig,
    entryPoints: [path.join(root, "src/content/index.ts")],
    outfile: path.join(dist, "content.js"),
    format: "iife",
    platform: "browser"
  })
]);

await copyFile(path.join(root, "src/manifest.json"), path.join(dist, "manifest.json"));
await writeFile(path.join(dist, "popup.html"), htmlTemplate("VisionX", "popup.js"), "utf8");
await writeFile(path.join(dist, "report.html"), htmlTemplate("VisionX Report", "report.js"), "utf8");
