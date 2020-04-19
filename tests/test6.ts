import { parseMode } from "../src/util";

console.log(parseMode("750"));
console.log(parseMode("0o750"));
console.log(parseMode(750));
console.log(parseMode(0o750));

console.log("true".valueOf());

let u1;
console.log(!!u1 === false);

let u2 = "";
console.log(!!u2 === false);

let u3 = "false";
console.log(!!u3 === false);

let u4 = false;
console.log(!!u4 === false);
