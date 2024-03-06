import fs from "fs";
import path from "path";

async function run() {
  try {
    await fs.promises.copyFile(
      path.join(process.cwd(), "fixes", "glob", "index.d.ts"),
      path.join(process.cwd(), "node_modules", "@types", "glob", "index.d.ts")
    );
  } catch (e) {
    console.error(e);
  }
}

run();
