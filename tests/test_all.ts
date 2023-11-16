import { init, initSkipCheck } from "./units/init";

async function testAll() {
  const storage = await init();
  // const storage = await initSkipCheck();
  try {
    const msg = await storage.createBucket("the-buck8");
    console.log(msg);
  } catch (e) {
    console.error(e);
  }
  storage.createBucket("the-buck8").then().catch();

  const msg = await storage.createBucket("the-buck8");
  // if(msg.error) {

  // }
  //console.log(storage.getSelectedBucket());
}

testAll();
