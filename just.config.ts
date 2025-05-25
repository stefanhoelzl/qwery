import { readFile, writeFile } from "node:fs/promises";
import { argv, logger, task } from "just-task";
import { gitDescribe } from "git-describe";
import { glob } from "glob";

const VersionPlaceholder = "0.0.0-qwery.0";

task("set-version", async function () {
  const ref = argv().ref;
  if (typeof ref !== "string") throw `invalid value for --ref: ${ref}`;

  const describe = await gitDescribe(".");
  const version = describe.semver ? describe.semver.version : "0.0.0";
  const distance = describe.distance || 0;
  const fullVersion = distance === 0 ? version : `${version}-${ref}.${distance}`;

  for (const package_json of await glob("packages/*/package.json")) {
    logger.info(`updating version in ${package_json} to ${fullVersion}`);
    await writeFile(
      package_json,
      (await readFile(package_json)).toString().replace(VersionPlaceholder, fullVersion)
    );
  }
});
