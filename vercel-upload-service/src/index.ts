import "dotenv/config";

import express from "express";
import cors from "cors";
import { generate } from "./utils/generate_id";
import { getAllFiles } from "./utils/get_all_files";
import simpleGit from "simple-git";
import path from "path";
import { uploadFiles } from "./utils/s3upload";
import { createClient } from "redis";

const publisher = createClient();
publisher.connect();

const subscriber = createClient();
subscriber.connect();

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  const id = generate();
  res.json({
    id: id,
  });
});

app.post("/deploy", async (req, res) => {
  const repoUrl = req.body.repoUrl;
  const id = generate();
  await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

  const files = await getAllFiles(path.join(__dirname, `output/${id}`));

  await uploadFiles(files).catch((err) =>
    res.status(500).send(`Error while uploading ${err}`)
  );

  // Push project id into queue after uploading
  // Build service will pick this up and deploy on S3
  publisher.lPush("build-queue", id);

  // Set Project status as uploaded in a temporary database
  // on redis we can poll on this database to know when
  // the project has been deployed
  await publisher.hSet("status", id, "uploaded");

  const value = await publisher.hGet("status", id);

  res.json({
    id: id,
  });
});

app.get("/status", async (req, res) => {
  const id = req.query.id;
  const response = await subscriber.hGet("status", id as string);
  res.json({
    status: response,
  });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
