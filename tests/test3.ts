import fs from "fs";
import path from "path";
import rimraf from "rimraf";

const run = async (): Promise<void> => {
  const p = `${process.cwd()}/tmp`;
  rimraf(p, () => {
    setTimeout(async () => {
      await fs.promises
        // .mkdir(path, { recursive: true, mode: `${this.options.mode}`.valueOf() })
        .mkdir(p, { recursive: true, mode: 511 });
      const m = (await fs.promises.stat(p)).mode;
      console.log(m, `${0o777}`.valueOf());
      process.exit(0);
    }, 1000);
  });
};

run();
