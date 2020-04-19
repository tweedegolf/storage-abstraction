import { parseMode } from "../src/util";

console.log(parseMode("750"));
console.log(parseMode("0o750"));
console.log(parseMode(750));
console.log(parseMode(0o750));

console.log("true".valueOf());
