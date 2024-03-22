import "dotenv/config";
import { createClient, commandOptions } from "redis";
import { downloadS3Folder, uploadBuildFilesToS3 } from "./aws";
import { buildProjectWithVolume } from "./buildProject";

const subscriber = createClient();
subscriber.connect();

const publisher = createClient();
publisher.connect();

async function main() {
  while (1) {
    const response = await subscriber.brPop(
      commandOptions({ isolated: true }),
      "build-queue",
      0
    );
    // @ts-ignore
    const id = response.element;

    await downloadS3Folder(`output/${id}`).then(() =>
      console.log("finished dl")
    );

    await buildProjectWithVolume(`output/${id}`, id).then((resolve) =>
      console.log(resolve)
    );

    await uploadBuildFilesToS3(id);

    await publisher.hSet("status", id, "deployed");
  }
}
main();
