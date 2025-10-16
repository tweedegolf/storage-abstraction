import fs from "fs";
import path from "path";

const buildPath = ["build", "src"];
// const distPath = ["publish", "dist"];

const classes = [
  "Storage",
  "AdapterLocal",
  "AdapterMinio",
  "AdapterS3",
  "AdapterAmazonS3",
  "AdapterCubbitS3",
  "AdapterMinioS3",
  "AdapterBackblazeS3",
  "AdapterCloudflareS3",
  "AdapterGoogleCloud",
  "AdapterAzureBlob",
  "AdapterBackblazeB2",
];

const extensions = ["js", "js.map", "d.ts"];

const types = ["general", "result", "add_file_params"];

const specificTypes: { [key: string]: Array<string> } = {
  Storage: [],
  AdapterLocal: ["adapter_local"],
  AdapterMinio: ["adapter_minio"],
  AdapterS3: ["adapter_amazon_s3"],
  AdapterAmazonS3: ["adapter_amazon_s3"],
  AdapterCubbitS3: ["adapter_amazon_s3"],
  AdapterCloudflareS3: ["adapter_amazon_s3"],
  AdapterBackblazeS3: ["adapter_amazon_s3"],
  AdapterMinioS3: ["adapter_amazon_s3"],
  AdapterGoogleCloud: ["adapter_google_cloud"],
  AdapterAzureBlob: ["adapter_azure_blob"],
  AdapterBackblazeB2: ["adapter_backblaze_b2"],
};

// remove existing folders and their contents
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

// recreate the directory structure
async function createDirs(): Promise<string> {
  try {
    for (let i = 0; i < classes.length; i++) {
      // await fs.promises.mkdir(path.join("publish", classes[i], "src"));
      // await fs.promises.mkdir(path.join("publish", classes[i]));
      await fs.promises.mkdir(path.join("publish", classes[i], "dist"));
      await fs.promises.mkdir(path.join("publish", classes[i], "dist", "types"));
      await fs.promises.mkdir(path.join("publish", classes[i], "dist", "index"));
    }
    return "ok";
  } catch (e) {
    return (e as Error).message;
  }
}

// copy over all necessary files
async function copy(): Promise<string> {
  const promises = classes.reduce((acc: Array<Promise<void>>, val: string) => {
    extensions.forEach((ext) => {
      acc.push(
        fs.promises.copyFile(
          path.join(...buildPath, `${val}.${ext}`),
          path.join("publish", val, "dist", `${val}.${ext}`)
        )
      );

      if (["AdapterS3", "AdapterMinioS3", "AdapterCubbitS3", "AdapterBackblazeS3", "AdapterCloudflareS3"].indexOf(val) !== -1) {
        acc.push(
          fs.promises.copyFile(
            path.join(...buildPath, "indexes", `AdapterAmazonS3.${ext}`),
            path.join("publish", val, "dist", "index", `AdapterAmazonS3.${ext}`)
          )
        );
      } else {
        acc.push(
          fs.promises.copyFile(
            path.join(...buildPath, "indexes", `${val}.${ext}`),
            path.join("publish", val, "dist", "index", `${val}.${ext}`)
          )
        );
      }


      if (["AdapterS3", "AdapterMinioS3", "AdapterCubbitS3", "AdapterBackblazeS3", "AdapterCloudflareS3"].indexOf(val) !== -1) {
        acc.push(
          fs.promises.copyFile(
            path.join(...buildPath, `AdapterAmazonS3.${ext}`),
            path.join("publish", val, "dist", `AdapterAmazonS3.${ext}`)
          )
        );
      }

      acc.push(
        fs.promises.copyFile(
          path.join(...buildPath, `AbstractAdapter.${ext}`),
          path.join("publish", val, "dist", `AbstractAdapter.${ext}`)
        )
      );

      acc.push(
        fs.promises.copyFile(
          path.join(...buildPath, `util.${ext}`),
          path.join("publish", val, "dist", `util.${ext}`)
        )
      );
      if (val === "Storage") {
        acc.push(
          fs.promises.copyFile(
            path.join(...buildPath, `adapters.${ext}`),
            path.join("publish", val, "dist", `adapters.${ext}`)
          )
        );
      }

      types.forEach((type) => {
        acc.push(
          fs.promises.copyFile(
            path.join(...buildPath, "types", `${type}.${ext}`),
            path.join("publish", val, "dist", "types", `${type}.${ext}`)
          )
        );
      });

      specificTypes[val].forEach((type: string) => {
        acc.push(
          fs.promises.copyFile(
            path.join(...buildPath, "types", `${type}.${ext}`),
            path.join("publish", val, "dist", "types", `${type}.${ext}`)
          )
        );
      });

      // copy README to Storage
      acc.push(fs.promises.copyFile("README.md", path.join("publish", "Storage", "README.md")));
      // copy customized definitely typed file
      acc.push(fs.promises.copyFile(path.join("src", "types", "backblaze-b2.d.ts"), path.join("publish", "AdapterBackblazeB2", "dist", "types", "backblaze-b2.d.ts")));
    });

    // acc.push(
    //   fs.promises.copyFile(
    //     path.join("src", `${val}.ts`),
    //     path.join("publish", val, "src", `${val}.ts`)
    //   )
    // );

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
  // await fs.promises.rm(path.join("publish", "dist"), { recursive: true, force: true });
  process.exit(0);
}

run();
