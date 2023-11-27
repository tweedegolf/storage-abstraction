import dotenv from "dotenv";
import { ResultObjectBuckets } from "../src/types";
import { Storage } from "../src/Storage";

dotenv.config();

async function test() {
  let storage: Storage;
  let b: ResultObjectBuckets;

  // all credentials from environment variables
  storage = new Storage({ type: "gcs" });
  b = await storage.listBuckets();
  console.log(1, b);

  storage = new Storage({
    type: "gcs",
    projectId: "default-demo-app-35b34",
    keyFilename: "gcs.json",
  });
  b = await storage.listBuckets();
  console.log(2, b);

  storage = new Storage("gcs://projectId=default-demo-app-35b34&keyFilename=gcs.json");
  b = await storage.listBuckets();
  console.log(3, b);

  storage = new Storage("gcs://projectId=default-demo-app-35b34");
  b = await storage.listBuckets();
  console.log(4, b);

  storage = new Storage({
    type: "gcs",
    projectId: "default-demo-app-35b34",
    credentials: {
      type: "service_account",
      project_id: "default-demo-app-35b34",
      private_key_id: "",
      private_key: "",
      client_email: "",
      client_id: "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "",
    },
  });
  b = await storage.listBuckets();
  console.log(5, b);
}

test();
