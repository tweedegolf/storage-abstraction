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
      private_key_id: "da2719acad70df59748d60095b94c11a210dba03",
      private_key:
        "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/+oRZAX2DdLky\niw+kEOkp6uJJdLNxFkef6fRbCCAhuVc4T5LuiEPT0ZJn4HJqLMaFVdbI7iXGEcfT\n6NmahdFKs4hDIUc5bfgC9ma2koihhR7DRL3alUsYaEU1WCDEdy5utrGibWw3LZEf\n4WzeiksuBw+NIMciaG4EVxo6NRu4rTCdrVidIOLZ6wnfTb+ekWO995V6NmUgM6Pv\nKe2PYIOIRVIm1ytsCRX2Ftka/Y2CvqBbYgCFpNi6OaE6D4VnP+Q/TRHsAXTMF2Ir\ncdRKU27M5NhWhTEhAf0IiNp3N/UByzZwblkLEoPV4sVvleH5b+4we0UpMMMKGniS\nVUv0rWthAgMBAAECggEAA4yCgNC1vMXeHJCUh/BmFwfIChqVrJwAU/TztvEWAvmV\noq1Z5n3vXw2LOs9b3hmYy+Mz1sAMQ7aVbpXp2+DoZwydkrwdQHMHeCqM6IgZ7X5z\n/KEbL1y+KCPZT6yi4m7flV1cOEf0jaqSebflltGQpTetMmsuMzUh/4OKsRPFQOsu\nfTOMWZWzel9mjI2ZJGp7Cyvtddk9Ewz0rZmx5cBSLejiAEQdjgiBCgT7SBOfIwWd\nl0TDOm3YWF9dd2t/uq2oj+Q8OieiPDPEkOdA5LboxFwJN0AaKCdYPqJYzuYjRIzC\nANZcG845Qg65ZQULxcwSPgudHcBkK2btl/DBF3RipwKBgQDkX5xvnQreBLfppQ2G\nyVqrr+AP6vQnv1h7/kReny0o/8BMkaM27rqIAqbFvF9A9SKC9YrJm0dD0PFd0qmE\nqoVwMHggxZYHF11SelU2Wt1sQessXgFxERxN2wZNdFJPBrLtzfe/LSksqVr4LYKT\nuZE8yMJSn4HkNKeMGWf10iVy0wKBgQDXM89JwF2jnYuuPItNAoNususefQtQ3P5K\nX1UGIKZR7THkDxpssUa4hkrtbW4uaVEupNdtLmQuEFRykjIYXcTcwCmLvs1kp4T3\nWu+mtiHpw1SfwpBXujYby3GNfNVXpscGQ4JXDvhvhUihdztkeFJ7SRz3vkwZuhBZ\nbfiieovAewKBgQDFtWR4WEvNM+aIduUD+JPvqN5gyXbAZm5TQiishj+RjABOCZN0\nfi6siycYbuFEGjTbjXmu2ihTNLORF0y81ueY3c1SCdy9nOOlANV+riGdlF/l1CiJ\nW1fWqzSEn5yWX+VN7Q97ybwotyFTVAsEmxV6uw9IemD4UQFwT5pp/ZmAEwKBgC1/\nprPRF/sftAiChHEjtuYQreUkSuAt2RWgUjmZbZCktYeiKdQRJwKcYfsQx9rIKYHT\nGDjdNhEHItOWVUERki2Z8y64iHRfdp1VfJWirEjgI2QjnqDtncMCoF9ppTGC8VFB\ntKzzXVM2usRokQYM6mNmcdlvQmeuDwbZWVgA0MtBAoGBANqD/MXcbwbXjxaophqQ\ndVlwx0O8qBj43pDGGCGH9GjtQykSjHImp071ctGGyHMSQXLuMuB/nAsceNSXvAZ9\nSOThHslKGYhIC5iHuN9b3XfUBObWiLtufmOnnmwM91bJh6u2SIq8xXMLraSWd2pI\nZvbJAP835pWsuP3Pwjyrr+Mc\n-----END PRIVATE KEY-----\n",
      client_email: "cloud-fs-abstraction@default-demo-app-35b34.iam.gserviceaccount.com",
      client_id: "107837355944030382560",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url:
        "https://www.googleapis.com/robot/v1/metadata/x509/cloud-fs-abstraction%40default-demo-app-35b34.iam.gserviceaccount.com",
    },
  });
  b = await storage.listBuckets();
  console.log(5, b);
}

test();
