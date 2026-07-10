import { rmSync } from "node:fs";
import path from "node:path";

const cacheDirectories = [
  path.resolve(".astro"),
  path.resolve("node_modules", ".astro")
];

for (const directory of cacheDirectories) {
  rmSync(directory, { recursive: true, force: true });
}
