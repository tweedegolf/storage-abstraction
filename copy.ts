import fs from "fs";
import path from "path";

const names = [
  "Storage",
  "AdapterLocal",
  "AdapterMinio",
  "AdapterAmazonS3",
  "AdapterGoogleCloud",
  "AdapterAzureBlob",
  "AdapterBackblazeB2",
];

const files = {
  Storage: [],
  AdapterLocal: [],
  AdapterMinio: [],
  AdapterAmazonS3: [],
  AdapterGoogleCloud: [],
  AdapterAzureBlob: [],
  AdapterBackblazeB2: [],
};

async function beforeAll(): Promise<string> {
  const promises = names.reduce((acc: Array<Promise<void>>, val: string) => {
    acc.push(fs.promises.rm(path.join("publish", val, "dist"), { recursive: true, force: true }));
    return acc;
  }, []);

  return Promise.all(promises)
    .then(() => {
      return "ok";
    })
    .catch((e) => {
      return e.message;
    });
}

async function createDirs(): Promise<string> {
  const promises = names.reduce((acc: Array<Promise<void>>, val: string) => {
    acc.push(fs.promises.mkdir(path.join("publish", val, "dist")));
    acc.push(fs.promises.mkdir(path.join("publish", val, "dist", "types")));
    acc.push(fs.promises.mkdir(path.join("publish", val, "dist", "index")));
    return acc;
  }, []);

  for (const p of promises) {
    await p;
  }

  return "ok";
  // return Promise.all(promises)
  //   .then(() => {
  //     return "ok";
  //   })
  //   .catch((e) => {
  //     return e.message;
  //   });
}

async function copy(): Promise<string> {
  const promises = names.reduce((acc: Array<Promise<void>>, val: string) => {
    acc.push(
      fs.promises.copyFile(
        path.join("publish", "dist", `${val}.js`),
        path.join("publish", val, "dist", `${val}.js`)
      )
    );
    acc.push(
      fs.promises.copyFile(
        path.join("publish", "dist", `${val}.js.map`),
        path.join("publish", val, "dist", `${val}.js.map`)
      )
    );
    acc.push(
      fs.promises.copyFile(
        path.join("publish", "dist", `${val}.d.ts`),
        path.join("publish", val, "dist", `${val}.d.ts`)
      )
    );
    return acc;
  }, []);

  return Promise.all(promises)
    .then(() => {
      return "ok";
    })
    .catch((e) => {
      return e.message;
    });
}

async function run() {
  const s = await beforeAll();
  if (s !== "ok") {
    process.exit(1);
  }
  const t = await createDirs();
  if (t !== "ok") {
    process.exit(1);
  }
  // const u = await copy();
  // if (u !== "ok") {
  //   process.exit(1);
  // }
}

run();
