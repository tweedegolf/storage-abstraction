import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// The root package.json is the single source of truth for dependency versions; this
// script copies the version ranges over to the package.json files in the publish folder.
// The publish folders have no package-lock.json files because lock files are never
// published to npm.
//
// If the dependencies of a package differ from the latest version published on npm and
// the version number hasn't been increased yet, the patch version is bumped so that the
// package can be published. Running this script again doesn't bump the version again.
//
// usage: ts-node sync_deps.ts

type Dependencies = { [key: string]: string };

type PackageJson = {
  name: string;
  version: string;
  dependencies?: Dependencies;
};

// returns the latest published version and its dependencies, or null if the package
// can't be found on npm (not published yet, or no network)
function getPublished(name: string): null | { version: string; dependencies: Dependencies } {
  try {
    const data = JSON.parse(
      execSync(`npm view ${name} version dependencies --json`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
    );
    // npm view returns only the version string if the package has no dependencies
    if (typeof data === "string") {
      return { version: data, dependencies: {} };
    }
    return { version: data.version, dependencies: data.dependencies || {} };
  } catch (e) {
    return null;
  }
}

// returns a negative number if a < b, 0 if a === b and a positive number if a > b
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10));
  const pb = b.split(".").map((n) => parseInt(n, 10));
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) {
      return pa[i] - pb[i];
    }
  }
  return 0;
}

function sameDependencies(a: Dependencies, b: Dependencies): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

const root: PackageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const rootDeps = root.dependencies || {};

const dirs = fs
  .readdirSync("publish", { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join("publish", d.name, "package.json")))
  .map((d) => path.join("publish", d.name));

let warnings = 0;
const bumped: Array<string> = [];

dirs.forEach((dir) => {
  const file = path.join(dir, "package.json");
  const pkg: PackageJson = JSON.parse(fs.readFileSync(file, "utf8"));
  const deps = pkg.dependencies || {};
  const changes: Array<string> = [];

  Object.keys(deps).forEach((name) => {
    const version = rootDeps[name];
    if (typeof version === "undefined") {
      console.warn(`  [warning] ${file}: "${name}" is not a dependency in the root package.json`);
      warnings++;
    } else if (deps[name] !== version) {
      changes.push(`${name} ${deps[name]} -> ${version}`);
      deps[name] = version;
    }
  });

  const published = getPublished(pkg.name);
  if (published === null) {
    console.warn(`  [warning] ${pkg.name}: could not get the published version from npm`);
    warnings++;
  } else if (
    !sameDependencies(deps, published.dependencies) &&
    compareVersions(pkg.version, published.version) <= 0
  ) {
    const [major, minor, patch] = published.version.split(".").map((n) => parseInt(n, 10));
    const version = `${major}.${minor}.${patch + 1}`;
    changes.push(`version ${pkg.version} -> ${version}`);
    bumped.push(`${dir} (${version})`);
    pkg.version = version;
  }

  if (changes.length > 0) {
    // keep the 2 space indentation and the missing newline at the end of the file
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2));
  }
  console.log(`${pkg.name}: ${changes.length === 0 ? "up to date" : changes.join(", ")}`);
});

if (bumped.length > 0) {
  console.log(`\nversion bumped, don't forget to update the changelog of:\n  ${bumped.join("\n  ")}`);
}

if (warnings > 0) {
  console.warn(`\n${warnings} warning(s), see above`);
}
