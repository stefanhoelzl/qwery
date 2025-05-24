import { task, logger, argv } from 'just-task';
import { gitDescribe} from "git-describe";
import { glob } from "glob";
import { readFile, writeFile } from "node:fs/promises";

const VersionPlaceholder = "0.0.0-qwery.0";

task('set-version', async function() {
  const ref = argv().ref;
  if(typeof ref !== "string") throw `invalid value for --ref: ${ref}`

  const describe = await gitDescribe(".");
  const version = describe.semver ? describe.semver.version : "0.0.0";
  const distance =  describe.distance || 0;
  const fullVersion = distance === 0 ? version : `${version}-${ref}.${distance}`;

  for(let package_json of (await glob("packages/*/package.json"))) {
    logger.info(`updating version in ${package_json} to ${fullVersion}`)
    await writeFile(package_json, (await readFile(package_json)).toString().replace(VersionPlaceholder, fullVersion))
  }
});