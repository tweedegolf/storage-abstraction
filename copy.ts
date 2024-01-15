import fs from "fs";
import path from "path";

const classes = [
  "Storage",
  "AdapterLocal",
  "AdapterMinio",
  "AdapterAmazonS3",
  "AdapterGoogleCloud",
  "AdapterAzureBlob",
  "AdapterBackblazeB2",
];

const extensions = ["js", "js.map", "d.ts"];

const types = ["general", "result", "add_file_params"];

const specificTypes = {
  Storage: [],
  AdapterLocal: ["adapter_local"],
  AdapterMinio: ["adapter_minio"],
  AdapterAmazonS3: ["adapter_amazon_s3"],
  AdapterGoogleCloud: ["adapter_google_cloud"],
  AdapterAzureBlob: ["adapter_azure_blob"],
  AdapterBackblazeB2: ["adapter_backblaze_b2"],
};

async function beforeAll(): Promise<string> {
  const promises = classes.reduce((acc: Array<Promise<void>>, val: string) => {
    acc.push(fs.promises.rm(path.join("publish", val, "src"), { recursive: true, force: true }));
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
  try {
    for (let i = 0; i < classes.length; i++) {
      await fs.promises.mkdir(path.join("publish", classes[i], "src"));
      await fs.promises.mkdir(path.join("publish", classes[i], "dist"));
      await fs.promises.mkdir(path.join("publish", classes[i], "dist", "types"));
      await fs.promises.mkdir(path.join("publish", classes[i], "dist", "index"));
    }
    return "ok";
  } catch (e) {
    return e.message;
  }
}

async function copy(): Promise<string> {
  const promises = classes.reduce((acc: Array<Promise<void>>, val: string) => {
    extensions.forEach((ext) => {
      acc.push(
        fs.promises.copyFile(
          path.join("publish", "dist", `${val}.${ext}`),
          path.join("publish", val, "dist", `${val}.${ext}`)
        )
      );

      acc.push(
        fs.promises.copyFile(
          path.join("publish", "dist", "indexes", `${val}.${ext}`),
          path.join("publish", val, "dist", "index", `${val}.${ext}`)
        )
      );

      acc.push(
        fs.promises.copyFile(
          path.join("publish", "dist", `AbstractAdapter.${ext}`),
          path.join("publish", val, "dist", `AbstractAdapter.${ext}`)
        )
      );
      if (val === "Storage") {
        acc.push(
          fs.promises.copyFile(
            path.join("publish", "dist", `adapters.${ext}`),
            path.join("publish", val, "dist", `adapters.${ext}`)
          )
        );
      }

      types.forEach((type) => {
        acc.push(
          fs.promises.copyFile(
            path.join("publish", "dist", "types", `${type}.${ext}`),
            path.join("publish", val, "dist", "types", `${type}.${ext}`)
          )
        );
      });

      specificTypes[val].forEach((type: string) => {
        acc.push(
          fs.promises.copyFile(
            path.join("publish", "dist", "types", `${type}.${ext}`),
            path.join("publish", val, "dist", "types", `${type}.${ext}`)
          )
        );
      });
    });

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
    console.log(`error beforeAll ${s}`);
    process.exit(1);
  }
  const t = await createDirs();
  if (t !== "ok") {
    console.log(`error createDirs ${t}`);
    process.exit(1);
  }
  const u = await copy();
  if (u !== "ok") {
    console.log(`error copy ${u}`);
    process.exit(1);
  }
  await fs.promises.rm(path.join("publish", "dist"), { recursive: true, force: true });
  process.exit(0);
}

run();
