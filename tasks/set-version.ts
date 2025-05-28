import { readFile, writeFile } from "node:fs/promises";
import { gitDescribe } from "git-describe";
import { glob } from "glob";
import { argv } from "process";

const VersionPlaceholder = "0.0.0-qwery.0";

const [, , ref] = argv;
const describe = await gitDescribe(".");
const version = describe.semver ? describe.semver.version : "0.0.0";
const distance = describe.distance || 0;
const fullVersion = distance === 0 ? version : `${version}-${ref}.${distance}`;

for (const package_json of await glob("packages/*/package.json")) {
  console.log(`updating version in ${package_json} to ${fullVersion}`);
  await writeFile(
    package_json,
    (await readFile(package_json)).toString().replace(VersionPlaceholder, fullVersion)
  );
}
