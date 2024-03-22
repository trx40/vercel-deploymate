import AWS from "aws-sdk";
import fs from "fs";
import path, { dirname } from "path";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

export const downloadS3Folder = async (folderPrefix: string) => {
  const allFiles = await s3
    .listObjectsV2({
      Bucket: "vercel-deploymate",
      Prefix: folderPrefix,
    })
    .promise();

  const allPromises =
    allFiles.Contents?.map(async ({ Key }) => {
      return new Promise(async (resolve) => {
        if (!Key) {
          resolve("");
          return;
        }
        const finalOutputPath = path.join(__dirname, Key);
        const outputFile = fs.createWriteStream(finalOutputPath);
        const dirName = path.dirname(finalOutputPath);

        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }

        s3.getObject({
          Bucket: "vercel-deploymate",
          Key,
        })
          .createReadStream()
          .pipe(outputFile)
          .on("finish", () => {
            resolve("");
          });
      });
    }) || [];
  console.log("Waiting for downloads to finish");

  await Promise.all(allPromises.filter((x) => x !== undefined));
};

export const uploadBuildFilesToS3 = async (folderName: string) => {
  const baseFolderPath = path.join(__dirname, folderName);
  const allFiles = await getAllFiles(baseFolderPath);
  Promise.all(allFiles.map((file) => uploadFileToS3Stream(file)))
    .then(() => console.log(`All files uploaded successfully`))
    .catch((err) => console.log(`Error: ${err}`));
};

const getAllFiles = async (baseFolderPath: string) => {
  try {
    return await getFilesRecursively(baseFolderPath);
  } catch (error) {
    console.error("Error occurred:", error);
    return [];
  }
};

const getFilesRecursively = async (folderPath: string): Promise<string[]> => {
  const files = await fs.promises.readdir(folderPath);

  const tasks = files.map(async (file) => {
    const fullFilePath = path.join(folderPath, file);
    const stats = await fs.promises.stat(fullFilePath);

    if (stats.isDirectory()) {
      return getFilesRecursively(fullFilePath);
    } else {
      return [fullFilePath];
    }
  });

  return (await Promise.all(tasks)).flat();
};

const uploadFileToS3Stream = (fullFilePath: string) => {
  const key = `dist/` + fullFilePath.slice(__dirname.length + 1);
  const fileStream = fs.createReadStream(fullFilePath);

  const params = {
    Bucket: "vercel-deploymate",
    Key: key,
    Body: fileStream,
  };

  return s3.upload(params).promise();
};
