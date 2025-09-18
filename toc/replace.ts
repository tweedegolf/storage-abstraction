import fs from "fs";

async function run() {
    const readme = await fs.promises.readFile("./README.md", "utf8");
    const toc = await fs.promises.readFile("./toc/toc.md", "utf8");
    const regex = /(<!--start_toc-->)([\s\S]*?)(<!--end_toc-->)/;
    const result = regex.exec(readme);
    if (result === null) {
        process.exit(1);
    }
    const readmeWithToc = readme.replace(result[2], `\n\n${toc}\n`);
    // console.log(readmeWithToc.substring(0, 4000))
    await fs.promises.writeFile("./README.md", readmeWithToc)
}
run();
