import fs from "fs";
import path from "path";

interface Adapter {
  name: string;
  className: string;
  description: string;
  keywords: string[];
  dependencies: Record<string, string>;
}

interface Config {
  adapters: Adapter[];
}

async function syncPackageJsonFiles(): Promise<void> {
  try {
    // Read root package.json for version and metadata
    const rootPkgPath = path.join(process.cwd(), "package.json");
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf-8"));

    // Read adapters config
    const configPath = path.join(process.cwd(), "adapters-config.json");
    const config: Config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // Generate package.json for each adapter
    for (const adapter of config.adapters) {
      const publishDir = path.join(process.cwd(), "publish", adapter.className);

      // Ensure directory exists
      if (!fs.existsSync(publishDir)) {
        fs.mkdirSync(publishDir, { recursive: true });
      }

      const packageJson = {
        name: `@${rootPkg.name.split("/")[1].split("-").slice(0, 1)[0]}/` + adapter.name,
        version: rootPkg.version,
        description: adapter.description,
        main: `dist/index/${adapter.className}.js`,
        types: `dist/index/${adapter.className}.d.ts`,
        homepage: rootPkg.homepage,
        repository: rootPkg.repository,
        ...(Object.keys(adapter.dependencies).length > 0 && {
          dependencies: adapter.dependencies,
        }),
        scripts: {},
        keywords: [...new Set([...adapter.keywords, "storage abstraction"])],
        author: rootPkg.author,
        license: rootPkg.license,
        publishConfig: {
          access: "public",
        },
      };

      const packagePath = path.join(publishDir, "package.json");
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
      console.log(`✓ Updated ${packageJson.name}@${rootPkg.version}`);
    }

    console.log(`\n✓ Successfully synced ${config.adapters.length} adapters`);
  } catch (error) {
    console.error("Error syncing package.json files:", error);
    process.exit(1);
  }
}

syncPackageJsonFiles();
