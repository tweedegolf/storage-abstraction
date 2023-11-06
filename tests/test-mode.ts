import path from "path";
import fs from "fs";
import { parseMode } from "./util";

process.umask(0o000);

const rmDir = async (p: string) => {
  return await fs.promises
    .rmdir(p)
    .then(() => true)
    .catch(() => true);
};
const makeDir = async (folder: string = "tmp", mode: string | number = 0o777) => {
  const p = path.join(process.cwd(), "tests", folder);

  await rmDir(p);

  await fs.promises
    .mkdir(p, {
      recursive: true,
      mode: parseMode(mode),
    })
    .then(() => {
      fs.promises.stat(p).then((stat) => {
        console.log(stat.mode.toString(8));
      });
    })
    .catch((e) => {
      console.error(`\x1b[31m${e.message}`);
      throw e;
    });
};

async function test() {
  await makeDir("tmp", 488);
}
test();
